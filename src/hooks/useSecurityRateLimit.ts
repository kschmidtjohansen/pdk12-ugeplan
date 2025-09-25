import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitAttempt {
  timestamp: number;
  operation: string;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'login': { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 5 attempts per 15 min, block 30 min
  'password_reset': { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 3 attempts per hour, block 1 hour
  'profile_update': { maxAttempts: 10, windowMs: 60 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 }, // 10 attempts per hour, block 15 min
  'data_fetch': { maxAttempts: 100, windowMs: 60 * 1000, blockDurationMs: 60 * 1000 }, // 100 per minute, block 1 min
  'critical_operation': { maxAttempts: 2, windowMs: 60 * 60 * 1000, blockDurationMs: 2 * 60 * 60 * 1000 }, // 2 per hour, block 2 hours
};

export const useSecurityRateLimit = () => {
  const { toast } = useToast();
  const attemptsRef = useRef<Record<string, RateLimitAttempt[]>>({});
  const blockedUntilRef = useRef<Record<string, number>>({});

  const checkRateLimit = useCallback(async (operation: string, customConfig?: Partial<RateLimitConfig>): Promise<boolean> => {
    const config = { ...DEFAULT_CONFIGS[operation] || DEFAULT_CONFIGS['data_fetch'], ...customConfig };
    const now = Date.now();
    
    // Check if operation is currently blocked
    if (blockedUntilRef.current[operation] && now < blockedUntilRef.current[operation]) {
      const remainingMs = blockedUntilRef.current[operation] - now;
      const remainingMin = Math.ceil(remainingMs / 60000);
      
      toast({
        variant: "destructive",
        title: "Operation Blocked",
        description: `Too many attempts. Try again in ${remainingMin} minute(s).`,
      });

      // Log server-side rate limit violation
      try {
        await supabase.rpc('check_rate_limit_security', {
          operation_key: operation,
          max_attempts: 0, // Indicate blocked state
          window_minutes: Math.floor(config.windowMs / 60000)
        });
      } catch (error) {
        console.error('Failed to log rate limit violation:', error);
      }
      
      return false;
    }

    // Initialize attempts array if not exists
    if (!attemptsRef.current[operation]) {
      attemptsRef.current[operation] = [];
    }

    // Clean old attempts outside the window
    attemptsRef.current[operation] = attemptsRef.current[operation].filter(
      attempt => now - attempt.timestamp < config.windowMs
    );

    // Check if limit exceeded
    if (attemptsRef.current[operation].length >= config.maxAttempts) {
      blockedUntilRef.current[operation] = now + config.blockDurationMs;
      
      toast({
        variant: "destructive",
        title: "Rate Limit Exceeded",
        description: `Too many ${operation.replace('_', ' ')} attempts. Please wait before trying again.`,
      });

      // Log server-side rate limit exceeded
      try {
        await supabase.rpc('check_rate_limit_security', {
          operation_key: operation,
          max_attempts: config.maxAttempts,
          window_minutes: Math.floor(config.windowMs / 60000)
        });
      } catch (error) {
        console.error('Failed to log rate limit exceeded:', error);
      }
      
      return false;
    }

    // Add current attempt
    attemptsRef.current[operation].push({ timestamp: now, operation });

    // Log successful rate limit check (for critical operations only)
    if (operation.includes('critical') || operation === 'login') {
      try {
        await supabase.rpc('check_rate_limit_security', {
          operation_key: operation,
          max_attempts: config.maxAttempts,
          window_minutes: Math.floor(config.windowMs / 60000)
        });
      } catch (error) {
        console.error('Failed to log rate limit check:', error);
      }
    }

    return true;
  }, [toast]);

  const getRemainingAttempts = useCallback((operation: string): number => {
    const config = DEFAULT_CONFIGS[operation] || DEFAULT_CONFIGS['data_fetch'];
    const now = Date.now();
    
    if (!attemptsRef.current[operation]) {
      return config.maxAttempts;
    }

    // Clean old attempts
    attemptsRef.current[operation] = attemptsRef.current[operation].filter(
      attempt => now - attempt.timestamp < config.windowMs
    );

    return Math.max(0, config.maxAttempts - attemptsRef.current[operation].length);
  }, []);

  const isBlocked = useCallback((operation: string): boolean => {
    const now = Date.now();
    return blockedUntilRef.current[operation] && now < blockedUntilRef.current[operation];
  }, []);

  const resetRateLimit = useCallback((operation: string): void => {
    delete attemptsRef.current[operation];
    delete blockedUntilRef.current[operation];
  }, []);

  return {
    checkRateLimit,
    getRemainingAttempts,
    isBlocked,
    resetRateLimit,
  };
};