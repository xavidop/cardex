import { NextRequest, NextResponse } from 'next/server';
import { generatePokemonCardFromPhoto } from '@/ai/flows/generate-pokemon-card-from-photo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields - including userId
    const requiredFields = ['userId', 'photoDataUri', 'pokemonName', 'pokemonType', 'styleDescription'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await generatePokemonCardFromPhoto(body);

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
