import { NextRequest } from 'next/server';
import { gradeTCGCard } from '@/ai/flows/grade-tcg-card';
import { handleApiRequest } from '@/lib/api-handler';

/**
 * Required fields for card grading
 */
const REQUIRED_FIELDS = [
  'frontPhotoDataUri'
] as const;

/**
 * POST /api/grade-card
 * Grades a TCG card's condition using AI based on professional grading standards
 */
export async function POST(request: NextRequest) {
  return handleApiRequest(request, REQUIRED_FIELDS, gradeTCGCard);
}
