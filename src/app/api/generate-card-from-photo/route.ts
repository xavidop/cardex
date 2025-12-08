import { NextRequest } from 'next/server';
import { generateTCGCardFromPhoto } from '@/ai/flows/generate-tcg-card-from-photo';
import { handleApiRequest } from '@/lib/api-handler';

/**
 * Required fields for photo-based card generation
 */
const REQUIRED_FIELDS = [
  'userId',
  'photoDataUri',
  'characterName',
  'characterType',
  'styleDescription',
  'game'
] as const;

/**
 * POST /api/generate-card-from-photo
 * Generates a TCG card from a photo using AI
 */
export async function POST(request: NextRequest) {
  return handleApiRequest(request, REQUIRED_FIELDS, generateTCGCardFromPhoto);
}
