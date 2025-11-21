import { NextRequest, NextResponse } from 'next/server';
import { generateVideoForExistingCard } from '@/lib/firestore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

/**
 * POST /api/generate-video
 * Starts video generation for an existing card
 * This is a background process - the video generation happens asynchronously
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, cardId } = await request.json();

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: `${ERROR_MESSAGES.USER_ID_REQUIRED} and ${ERROR_MESSAGES.CARD_ID_REQUIRED}` },
        { status: 400 }
      );
    }

    // Start video generation in the background
    await generateVideoForExistingCard(userId, cardId);

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.VIDEO_GENERATED
    });

  } catch (error) {
    console.error('Error in video generation API:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.VIDEO_GENERATION_FAILED;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
