/**
 * Shared constants and enums used throughout the application
 */

import { z } from 'zod';

// TCG Game Types
export const TCG_GAME_VALUES = ['pokemon', 'onepiece', 'lorcana', 'magic', 'dragonball'] as const;
export type TCGGame = typeof TCG_GAME_VALUES[number];

// Zod schema for TCG games
export const tcgGameSchema = z.enum(TCG_GAME_VALUES);

// Language Types
export const LANGUAGE_VALUES = ['english', 'japanese', 'chinese', 'korean', 'spanish', 'french', 'german', 'italian'] as const;
export type Language = typeof LANGUAGE_VALUES[number];

// Zod schema for languages
export const languageSchema = z.enum(LANGUAGE_VALUES);

// Language options for dropdowns
export const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'korean', label: 'Korean' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
] as const;

// AI Model Types
export const AI_MODEL_VALUES = [
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-fast-generate-001',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview'
] as const;
export type AIModel = typeof AI_MODEL_VALUES[number];

// Zod schema for AI models
export const aiModelSchema = z.enum(AI_MODEL_VALUES);

// AI Model options for dropdowns
export const AI_MODELS = [
  { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra' },
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 Standard' },
  { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast' },
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash (Nano Banana)' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image Preview (Nano Banana Pro)' },
] as const;
