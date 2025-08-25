import { useAuth } from '@/context/AuthContext';

export interface VagtplanAccess {
  hasAccess: boolean;
  reason: 'authorized_email' | 'authorized_domain' | 'admin_role' | 'unauthorized';
  message: string;
}

export const checkVagtplanAccess = (userEmail?: string, userRole?: string): VagtplanAccess => {
  // Debug logging
  console.log('🔍 Vagtplan Access Check:', {
    userEmail,
    userRole,
    hasUserEmail: !!userEmail,
    hasUserRole: !!userRole,
    authorizedEmails: import.meta.env.VITE_VAGTPLAN_AUTHORIZED_EMAILS,
    authorizedDomains: import.meta.env.VITE_VAGTPLAN_AUTHORIZED_DOMAINS
  });

  // Admin and skadeleder always have access
  if (userRole === 'administrator' || userRole === 'skadeleder') {
    console.log('✅ Access granted: Admin/Skadeleder role');
    return {
      hasAccess: true,
      reason: 'admin_role',
      message: 'Access granted based on administrative role'
    };
  }

  if (!userEmail) {
    console.log('❌ Access denied: No user email');
    return {
      hasAccess: false,
      reason: 'unauthorized',
      message: 'No user email found'
    };
  }

  // Check authorized emails
  const authorizedEmails = import.meta.env.VITE_VAGTPLAN_AUTHORIZED_EMAILS?.split(',') || [];
  const cleanAuthorizedEmails = authorizedEmails.map(email => email.trim().toLowerCase());
  console.log('📧 Checking authorized emails:', { userEmail: userEmail.toLowerCase(), authorizedEmails: cleanAuthorizedEmails });
  
  if (cleanAuthorizedEmails.includes(userEmail.toLowerCase())) {
    console.log('✅ Access granted: Authorized email match');
    return {
      hasAccess: true,
      reason: 'authorized_email',
      message: 'Access granted based on authorized email'
    };
  }

  // Check authorized domains
  const authorizedDomains = import.meta.env.VITE_VAGTPLAN_AUTHORIZED_DOMAINS?.split(',') || [];
  const cleanAuthorizedDomains = authorizedDomains.map(domain => domain.trim().toLowerCase());
  const userDomain = userEmail.split('@')[1]?.toLowerCase();
  console.log('🌐 Checking authorized domains:', { userDomain, authorizedDomains: cleanAuthorizedDomains });
  
  if (userDomain && cleanAuthorizedDomains.includes(userDomain)) {
    console.log('✅ Access granted: Authorized domain match');
    return {
      hasAccess: true,
      reason: 'authorized_domain',
      message: 'Access granted based on authorized domain'
    };
  }

  console.log('❌ Access denied: No matching permissions');
  return {
    hasAccess: false,
    reason: 'unauthorized',
    message: 'Your email is not authorized to view this document'
  };
};

export const useVagtplanAccess = (): VagtplanAccess => {
  const { user, loading } = useAuth();
  
  // Debug logging
  console.log('🎯 useVagtplanAccess:', {
    user: user ? { email: user.email, role: user.role } : null,
    loading,
    hasUser: !!user
  });

  // If still loading, return a loading state
  if (loading) {
    return {
      hasAccess: false,
      reason: 'unauthorized',
      message: 'Loading user information...'
    };
  }
  
  return checkVagtplanAccess(user?.email, user?.role);
};