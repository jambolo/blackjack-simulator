import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBetSize(trueCount: number): number {
  if (trueCount <= -3) {
    return 0;
  } else if (trueCount === -2 || trueCount === -1 || trueCount === 0) {
    return 0.5;
  } else {
    return trueCount;
  }
}
