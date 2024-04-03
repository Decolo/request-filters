import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parsedBody = (bytes: ArrayBuffer) => {
   return decodeURIComponent(String.fromCharCode.apply(null,
    new Uint8Array(bytes)));
}
