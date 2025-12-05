import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or Date object into a clean human-readable format.
 * Example: "Jan 2, 2025"
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date string or Date object into a full date-time string.
 * Example: "Jan 2, 2025, 3:45 PM"
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Converts internal status strings into human-friendly labels.
 * Example: "success" → "Success", "failure" → "Failure"
 */
export function formatStatus(status: string): string {
  if (!status) return "Unknown";
  
  const statusMap: Record<string, string> = {
    success: "Success",
    failure: "Failure",
    error: "Error",
    running: "Running",
    active: "Active",
    inactive: "Inactive",
    unknown: "Unknown",
  };

  const normalized = status.toLowerCase();
  return statusMap[normalized] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Truncates long text with ellipsis.
 * @param text - The text to truncate
 * @param length - Maximum length before truncation (default: 60)
 */
export function truncate(text: string, length: number = 60): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
