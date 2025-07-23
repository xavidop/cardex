import { NextRequest, NextResponse } from 'next/server';
import { generateVideoForExistingCard } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, cardId } = await request.json();

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: 'User ID and Card ID are required' },
        { status: 400 }
      );
    }

    // Start video generation in the background
    await generateVideoForExistingCard(userId, cardId);

    return NextResponse.json({
      success: true,
      message: 'Video generation started successfully'
    });

  } catch (error) {
    console.error('Error in video generation API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
