import { useAuth } from '@/context/AuthContext';

export interface VagtplanAccess {
  hasAccess: boolean;
  reason: 'authorized_email' | 'authorized_domain' | 'admin_role' | 'unauthorized';
  message: string;
}

export const checkVagtplanAccess = (userEmail?: string, userRole?: string): VagtplanAccess => {
  // Admin and skadeleder always have access
  if (userRole === 'administrator' || userRole === 'skadeleder') {
    return {
      hasAccess: true,
      reason: 'admin_role',
      message: 'Access granted based on administrative role'
    };
  }

  if (!userEmail) {
    return {
      hasAccess: false,
      reason: 'unauthorized',
      message: 'No user email found'
    };
  }

  // Check authorized emails
  const authorizedEmails = import.meta.env.VITE_VAGTPLAN_AUTHORIZED_EMAILS?.split(',') || [];
  if (authorizedEmails.some(email => email.trim().toLowerCase() === userEmail.toLowerCase())) {
    return {
      hasAccess: true,
      reason: 'authorized_email',
      message: 'Access granted based on authorized email'
    };
  }

  // Check authorized domains
  const authorizedDomains = import.meta.env.VITE_VAGTPLAN_AUTHORIZED_DOMAINS?.split(',') || [];
  const userDomain = userEmail.split('@')[1]?.toLowerCase();
  
  if (userDomain && authorizedDomains.some(domain => domain.trim().toLowerCase() === userDomain)) {
    return {
      hasAccess: true,
      reason: 'authorized_domain',
      message: 'Access granted based on authorized domain'
    };
  }

  return {
    hasAccess: false,
    reason: 'unauthorized',
    message: 'Your email is not authorized to view this document'
  };
};

export const useVagtplanAccess = (): VagtplanAccess => {
  const { user } = useAuth();
  return checkVagtplanAccess(user?.email, user?.role);
};