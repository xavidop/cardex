import { NextRequest } from 'next/server';
import { generateTCGCard } from '@/ai/flows/generate-tcg-card';
import { handleApiRequest } from '@/lib/api-handler';

/**
 * Required fields for card generation
 */
const REQUIRED_FIELDS = [
  'userId',
  'game',
  'characterName',
  'characterType',
  'backgroundDescription',
  'characterDescription'
] as const;

/**
 * POST /api/generate-card
 * Generates a TCG card using AI based on provided parameters
 */
export async function POST(request: NextRequest) {
  return handleApiRequest(request, REQUIRED_FIELDS, generateTCGCard);
}

