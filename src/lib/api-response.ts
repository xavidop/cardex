import { NextResponse } from 'next/server';
import { ERROR_MESSAGES } from '@/constants';

/**
 * Standard API response types
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a successful API response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success payload
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates an error API response
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error details
 * @returns NextResponse with error payload
 */
export function apiError(
  error: string | Error,
  status: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Creates a bad request (400) response
 * @param message - Error message
 * @param details - Optional validation details
 */
export function apiBadRequest(message: string, details?: any): NextResponse<ApiErrorResponse> {
  return apiError(message, 400, details);
}

/**
 * Creates an unauthorized (401) response
 */
export function apiUnauthorized(message: string = ERROR_MESSAGES.AUTH_REQUIRED): NextResponse<ApiErrorResponse> {
  return apiError(message, 401);
}

/**
 * Creates a forbidden (403) response
 */
export function apiForbidden(message: string): NextResponse<ApiErrorResponse> {
  return apiError(message, 403);
}

/**
 * Creates a not found (404) response
 */
export function apiNotFound(message: string): NextResponse<ApiErrorResponse> {
  return apiError(message, 404);
}

/**
 * Creates an internal server error (500) response
 */
export function apiInternalError(
  error?: Error | unknown,
  message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : message;
  return apiError(errorMessage, 500);
}
