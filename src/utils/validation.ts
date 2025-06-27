
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && 
         email.length <= 255 &&
         !email.includes('..') &&
         !email.startsWith('.') &&
         !email.endsWith('.');
};
