/**
 * Validation utilities for common data validation tasks
 */

import { ERROR_MESSAGES } from '@/constants';

/**
 * Validates that a string is not empty
 * @param value - String to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if string is empty or whitespace only
 */
export function validateNotEmpty(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

/**
 * Validates that a value is defined
 * @param value - Value to check
 * @param fieldName - Name of the field for error message
 * @throws Error if value is null or undefined
 */
export function validateDefined<T>(value: T | null | undefined, fieldName: string): asserts value is T {
  if (value == null) {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Validates an email address format
 * @param email - Email to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL format
 * @param url - URL to validate
 * @returns true if valid URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a number is within a range
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Name of the field for error message
 * @throws Error if value is out of range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
}

/**
 * Validates that an object has all required fields
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Array of missing field names
 */
export function getMissingFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: readonly (keyof T)[]
): string[] {
  return requiredFields.filter(field => !obj[field]).map(String);
}

/**
 * Validates that an object has all required fields, throws if not
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @throws Error if any required fields are missing
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: readonly (keyof T)[]
): void {
  const missing = getMissingFields(obj, requiredFields);
  if (missing.length > 0) {
    throw new Error(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELDS}: ${missing.join(', ')}`);
  }
}

/**
 * Validates a Firebase Storage URL
 * @param url - URL to validate
 * @returns true if valid Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') ||
         url.includes('localhost:9199') ||
         url.includes('127.0.0.1:9199');
}

/**
 * Checks if a URL is an HTTP/HTTPS URL
 * @param url - URL to check
 * @returns true if URL starts with http:// or https://
 */
export function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Checks if a string is a data URI
 * @param url - String to check
 * @returns true if string is a data URI
 */
export function isDataUri(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Validates that a string length is within bounds
 * @param value - String to validate
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @param fieldName - Name of the field for error message
 * @throws Error if length is out of bounds
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): void {
  if (value.length < minLength || value.length > maxLength) {
    throw new Error(
      `${fieldName} must be between ${minLength} and ${maxLength} characters`
    );
  }
}
