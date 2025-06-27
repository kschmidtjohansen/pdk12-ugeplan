
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

