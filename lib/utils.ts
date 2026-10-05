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

export function formatName(name: string | null | undefined): string {
  if (!name) return "";

  // Preposições que devem continuar minúsculas
  const prepositions = ["de", "do", "da", "dos", "das", "e", "del", "von"];

  return name
    .toLowerCase()
    .split(/\s+/) // Separa por espaços e remove espaços duplos
    .map((word, index) => {
      // Se for a primeira palavra, ou se não for uma preposição, capitaliza
      if (index === 0 || !prepositions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word; // Preposições continuam minúsculas
    })
    .join(" ")
    .trim();
}
