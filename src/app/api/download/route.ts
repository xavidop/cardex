import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, CACHE_CONTROL } from '@/constants';

/**
 * Validates if a URL is from Firebase Storage
 * @param url - URL to validate
 * @returns true if URL is from Firebase Storage (production or emulator)
 */
function isValidFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') ||
         url.includes('localhost:9199') ||
         url.includes('127.0.0.1:9199');
}

/**
 * GET /api/download
 * Proxy endpoint to download files from Firebase Storage to avoid CORS issues
 * Only allows Firebase Storage URLs for security
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' }, 
        { status: 400 }
      );
    }

    // Validate URL is from Firebase Storage
    if (!isValidFirebaseStorageUrl(url)) {
      return NextResponse.json(
        { error: 'Only Firebase Storage URLs are allowed' }, 
        { status: 403 }
      );
    }

    // Fetch the file from Firebase Storage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Cardex-Download-Proxy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Stream the response
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment',
        'Cache-Control': CACHE_CONTROL.ONE_YEAR,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.IMAGE_DOWNLOAD_FAILED;
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
