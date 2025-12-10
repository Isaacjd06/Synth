import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Status formatting
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Text truncation
export function truncate(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Unified API response parser
export function parseApiResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response;
  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;
    if (obj.success && Array.isArray(obj.data)) return obj.data as T[];
    if (obj.ok && Array.isArray(obj.data)) return obj.data as T[];
    if (obj.ok && obj.memory) return [obj.memory] as T[];
    if (obj.id && obj.name) return [response] as T[];
  }
  return [];
}

// Unified error extractor
export interface ApiError {
  message: string;
  details?: string;
  missingApps?: string[];
}

export function extractApiError(error: unknown): ApiError {
  if (typeof error === 'string') return { message: error };
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    const message = (obj.error as string) || (obj.message as string) || 'An error occurred';
    const details = obj.details as string | undefined;
    const missingApps = obj.missingApps as string[] | undefined;
    return { message, details, missingApps };
  }
  return { message: 'An unknown error occurred' };
}
