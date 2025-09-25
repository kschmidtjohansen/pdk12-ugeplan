import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SecureProfileService } from '@/services/secureProfileService';
import type { SecureProfile } from '@/services/secureProfileService';

interface FullAccessRequest {
  reason: string;
  context: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecureProfileAccess = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<SecureProfile[]>([]);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  /**
   * Get profiles with masked sensitive data (default secure mode)
   */
  const getMaskedProfiles = useCallback(async () => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Administrator privileges required",
      });
      return [];
    }

    setLoading(true);
    try {
      const maskedProfiles = await SecureProfileService.getProfiles(false);
      setProfiles(maskedProfiles);
      setHasFullAccess(false);
      
      toast({
        title: "Profiles Loaded",
        description: `${maskedProfiles.length} profiles loaded with privacy protection`,
      });
      
      return maskedProfiles;
    } catch (error) {
      console.error('Error fetching masked profiles:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  /**
   * Request full access to unmasked profile data
   * Requires explicit justification and creates audit trail
   */
  const requestFullAccess = useCallback(async (request: FullAccessRequest) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Administrator privileges required",
      });
      return [];
    }

    // Validate request
    if (!request.reason || request.reason.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Request",
        description: "Access reason must be at least 10 characters",
      });
      return [];
    }

    setLoading(true);
    try {
      const fullAccessReason = `[${request.urgency.toUpperCase()}] ${request.context}: ${request.reason}`;
      
      const unmaskedProfiles = await SecureProfileService.getProfilesFullAccess(fullAccessReason);
      setProfiles(unmaskedProfiles);
      setHasFullAccess(true);
      
      toast({
        title: "Full Access Granted",
        description: `${unmaskedProfiles.length} profiles loaded with sensitive data. Access logged.`,
        variant: "default",
      });
      
      return unmaskedProfiles;
    } catch (error) {
      console.error('Error requesting full access:', error);
      toast({
        variant: "destructive",
        title: "Access Request Failed",
        description: error instanceof Error ? error.message : "Failed to request full access",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  /**
   * Revert back to masked data
   */
  const revertToMaskedAccess = useCallback(async () => {
    return await getMaskedProfiles();
  }, [getMaskedProfiles]);

  /**
   * Clear all profile data from memory
   */
  const clearProfiles = useCallback(() => {
    setProfiles([]);
    setHasFullAccess(false);
  }, []);

  return {
    profiles,
    loading,
    hasFullAccess,
    getMaskedProfiles,
    requestFullAccess,
    revertToMaskedAccess,
    clearProfiles,
    isAdmin,
  };
};