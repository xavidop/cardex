/**
 * Shared API route handler utilities to eliminate duplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES } from '@/constants';

/**
 * Validates request body has all required fields
 * @param body - Request body to validate
 * @param requiredFields - Array of required field names
 * @returns Array of missing field names, empty if all present
 */
export function validateRequestBody(body: any, requiredFields: readonly string[]): string[] {
  return requiredFields.filter(field => !body[field]);
}

/**
 * Generic API handler that wraps common error handling and validation
 * @param request - Next.js request object
 * @param requiredFields - Array of required field names to validate
 * @param handler - Async function that processes the request and returns result
 * @returns NextResponse with success or error
 */
export async function handleApiRequest<T>(
  request: NextRequest,
  requiredFields: readonly string[],
  handler: (body: any) => Promise<T>
): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate required fields
    const missingFields = validateRequestBody(body, requiredFields);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `${ERROR_MESSAGES.MISSING_REQUIRED_FIELDS}: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Call the handler
    const result = await handler(body);

    // Check if result has error property
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API route error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
