import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' }, 
        { status: 400 }
      );
    }

    // Validate that the URL is from Firebase Storage (production or emulator)
    const isFirebaseStorage = url.includes('firebasestorage.googleapis.com');
    const isFirebaseEmulator = url.includes('localhost:9199') || url.includes('127.0.0.1:9199');
    
    if (!isFirebaseStorage && !isFirebaseEmulator) {
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

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Stream the response
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' }, 
      { status: 500 }
    );
  }
}
