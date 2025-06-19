
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionOptions {
  debounceMs?: number;
  maxRetries?: number;
}

interface ActiveSubscription {
  channel: RealtimeChannel;
  callback: () => void;
  tables: string[];
  options: SubscriptionOptions;
  retryCount: number;
}

class ImprovedRealtimeManager {
  private subscriptions = new Map<string, ActiveSubscription>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  // FIXED: Enhanced subscription with better error handling
  subscribe(
    subscriptionId: string,
    tables: string[],
    callback: () => void,
    options: SubscriptionOptions = {}
  ): boolean {
    try {
      // Clean up existing subscription
      this.unsubscribe(subscriptionId);

      const { debounceMs = 300, maxRetries = 3 } = options;
      
      console.log('[ImprovedRealtimeManager] Creating subscription:', subscriptionId, 'for tables:', tables);

      const channel = supabase.channel(`realtime_${subscriptionId}_${Date.now()}`);

      // Subscribe to each table
      tables.forEach(table => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload) => {
            console.log('[ImprovedRealtimeManager] Received change for table:', table, payload);
            this.debouncedCallback(subscriptionId, callback, debounceMs);
          }
        );
      });

      // Enhanced error handling
      channel.on('error', (error) => {
        console.error('[ImprovedRealtimeManager] Channel error for:', subscriptionId, error);
        
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription && subscription.retryCount < maxRetries) {
          console.log('[ImprovedRealtimeManager] Retrying subscription:', subscriptionId);
          subscription.retryCount++;
          
          setTimeout(() => {
            this.subscribe(subscriptionId, subscription.tables, subscription.callback, subscription.options);
          }, 1000 * subscription.retryCount);
        }
      });

      // FIXED: Subscribe with proper callback handling
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[ImprovedRealtimeManager] Successfully subscribed:', subscriptionId);
        } else if (err) {
          console.error('[ImprovedRealtimeManager] Subscription error:', subscriptionId, err);
        }
      });

      this.subscriptions.set(subscriptionId, {
        channel,
        callback,
        tables,
        options,
        retryCount: 0
      });

      return true;
    } catch (error) {
      console.error('[ImprovedRealtimeManager] Failed to create subscription:', subscriptionId, error);
      return false;
    }
  }

  // FIXED: Enhanced debounced callback with cleanup
  private debouncedCallback(subscriptionId: string, callback: () => void, debounceMs: number) {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(subscriptionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error('[ImprovedRealtimeManager] Error in callback for:', subscriptionId, error);
      } finally {
        this.debounceTimers.delete(subscriptionId);
      }
    }, debounceMs);

    this.debounceTimers.set(subscriptionId, timer);
  }

  // FIXED: Enhanced unsubscribe with cleanup
  unsubscribe(subscriptionId: string): boolean {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        console.log('[ImprovedRealtimeManager] Unsubscribing:', subscriptionId);
        
        // Clean up debounce timer
        const timer = this.debounceTimers.get(subscriptionId);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(subscriptionId);
        }
        
        // Unsubscribe from channel
        subscription.channel.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ImprovedRealtimeManager] Error unsubscribing:', subscriptionId, error);
      return false;
    }
  }

  // Get subscription status
  getSubscriptionStatus(subscriptionId: string): string | null {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription ? 'active' : null;
  }

  // Clean up all subscriptions
  cleanup(): void {
    console.log('[ImprovedRealtimeManager] Cleaning up all subscriptions');
    
    for (const [id] of this.subscriptions) {
      this.unsubscribe(id);
    }
    
    // Clear any remaining timers
    for (const [id, timer] of this.debounceTimers) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}

export const improvedRealtimeManager = new ImprovedRealtimeManager();
