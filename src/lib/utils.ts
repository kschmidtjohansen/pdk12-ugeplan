
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to capitalize the first letter of a string
export function capitalizeFirstLetter(string: string): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper to handle Danish month names correctly
export function formatDanishMonth(monthName: string): string {
  // Danish month names are not capitalized
  return monthName.toLowerCase();
}

// Email validation utility
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && 
         email.length <= 255 &&
         !email.includes('..') &&
         !email.startsWith('.') &&
         !email.endsWith('.');
}
