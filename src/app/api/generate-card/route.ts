import { NextRequest, NextResponse } from 'next/server';
import { generateTCGCard } from '@/ai/flows/generate-tcg-card';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // New multi-game flow
    const requiredFields = ['userId', 'game', 'characterName', 'characterType', 'backgroundDescription', 'characterDescription'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Call the new AI flow
    const result = await generateTCGCard(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

