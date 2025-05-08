
import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { UserWithProfile } from "@/types/auth";
import { 
  buildUserWithProfile,
  getCurrentSession,
  onAuthStateChange
} from "@/services/authService";

export const useAuthState = () => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = onAuthStateChange(async (currentSession) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Defer profile fetching to avoid recursion
        setTimeout(async () => {
          const userWithProfile = await buildUserWithProfile(currentSession.user);
          setUser(userWithProfile);
        }, 0);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    // Then get the initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const currentSession = await getCurrentSession();
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          const userWithProfile = await buildUserWithProfile(currentSession.user);
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isAuthenticated: !!user,
    isLoading
  };
};
