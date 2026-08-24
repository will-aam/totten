// utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  
  const lowerUrl = trimmed.toLowerCase();
  
  if (
    lowerUrl.startsWith("javascript:") || 
    lowerUrl.startsWith("data:") || 
    lowerUrl.startsWith("vbscript:")
  ) {
    return "#";
  }
  
  if (
    lowerUrl.startsWith("http://") || 
    lowerUrl.startsWith("https://") || 
    lowerUrl.startsWith("mailto:") || 
    lowerUrl.startsWith("tel:") || 
    lowerUrl.startsWith("/")
  ) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
}
