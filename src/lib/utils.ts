// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApartmentLabel(num: number): string {
  let label = `${num}`;
  if (num >= 43 && num <= 48) {
    const level = num - 42; // 43->1, 44->2, ..., 48->6
    label += ` (L${level})`;
  }
  return label;
}