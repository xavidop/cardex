import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 * Merges Tailwind classes intelligently, removing conflicts
 * @param inputs - Class values to combine
 * @returns Merged class name string
 * @example
 * cn('px-2 py-1', 'px-4') // returns 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Removes undefined values from an object to prevent Firestore errors
 * Firestore does not allow undefined values in documents
 * @param obj - The object to filter
 * @returns A new object with undefined values removed
 * @example
 * filterUndefinedValues({ a: 1, b: undefined, c: 3 }) // returns { a: 1, c: 3 }
 */
export function filterUndefinedValues<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Removes null and undefined values from an object
 * @param obj - The object to filter
 * @returns A new object with null and undefined values removed
 * @example
 * filterNullishValues({ a: 1, b: null, c: undefined, d: 0 }) // returns { a: 1, d: 0 }
 */
export function filterNullishValues<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value != null) { // checks for both null and undefined
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Type guard to check if a value is not null or undefined
 * @param value - The value to check
 * @returns true if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Delays execution for a specified time
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 * @example
 * await delay(1000) // waits 1 second
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON with a fallback value
 * @param jsonString - The JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
