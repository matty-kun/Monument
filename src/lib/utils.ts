import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return "TBA";

  const [hour, minute] = timeString.split(':');
  const hourNum = parseInt(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const formattedHour = hourNum % 12 || 12; // Convert 0 to 12 for 12 AM

  return `${formattedHour}:${minute} ${ampm}`;
}
