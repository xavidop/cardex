/**
 * Shared constants and enums used throughout the application
 */

import { z } from 'zod';

// ============================================================================
// TCG Game Types
// ============================================================================
export const TCG_GAME_VALUES = ['pokemon', 'onepiece', 'lorcana', 'magic', 'dragonball'] as const;
export type TCGGame = typeof TCG_GAME_VALUES[number];

/** Default TCG game when not specified */
export const DEFAULT_TCG_GAME: TCGGame = 'pokemon';

// Zod schema for TCG games
export const tcgGameSchema = z.enum(TCG_GAME_VALUES);

// ============================================================================
// Language Types
// ============================================================================
export const LANGUAGE_VALUES = ['english', 'japanese', 'chinese', 'korean', 'spanish', 'french', 'german', 'italian'] as const;
export type Language = typeof LANGUAGE_VALUES[number];

/** Default language for card generation */
export const DEFAULT_LANGUAGE: Language = 'english';

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

// ============================================================================
// AI Model Types
// ============================================================================
export const AI_MODEL_VALUES = [
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-fast-generate-001',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview'
] as const;
export type AIModel = typeof AI_MODEL_VALUES[number];

/** Default AI model for image generation */
export const DEFAULT_AI_MODEL: AIModel = 'imagen-4.0-generate-001';

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

// ============================================================================
// Video Generation Status
// ============================================================================
export const VIDEO_STATUS_VALUES = ['pending', 'generating', 'completed', 'failed'] as const;
export type VideoGenerationStatus = typeof VIDEO_STATUS_VALUES[number];

export const videoStatusSchema = z.enum(VIDEO_STATUS_VALUES);

// ============================================================================
// Firestore Collections
// ============================================================================
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  POKEMON_CARDS: 'pokemon_cards',
} as const;

// ============================================================================
// Firebase Storage Paths
// ============================================================================
export const STORAGE_PATHS = {
  USER_CARDS: (userId: string) => `users/${userId}/cards`,
  USER_VIDEOS: (userId: string) => `users/${userId}/videos`,
  SHARED_CARDS: 'cards',
} as const;

// ============================================================================
// File Size Limits (in bytes)
// ============================================================================
export const FILE_SIZE_LIMITS = {
  /** Maximum image size: 10MB */
  IMAGE_MAX: 10 * 1024 * 1024,
  /** Maximum video size: 100MB */
  VIDEO_MAX: 100 * 1024 * 1024,
  /** Firestore document max: 1MB */
  FIRESTORE_DOCUMENT_MAX: 1024 * 1024,
  /** Maximum URL length for Firestore */
  URL_MAX_LENGTH: 2000,
} as const;

// ============================================================================
// Image Processing Constants
// ============================================================================
export const IMAGE_DEFAULTS = {
  /** Default max width for image compression */
  MAX_WIDTH: 512,
  /** Default max height (Pokemon card aspect ratio) */
  MAX_HEIGHT: 712,
  /** Default JPEG quality (0-1) */
  QUALITY: 0.8,
  /** Default image format */
  FORMAT: 'image/png' as const,
} as const;

// ============================================================================
// Cache Control
// ============================================================================
export const CACHE_CONTROL = {
  /** 1 year cache for static assets */
  ONE_YEAR: 'public, max-age=31536000',
  /** No cache for dynamic content */
  NO_CACHE: 'no-cache, no-store, must-revalidate',
} as const;

// ============================================================================
// Error Messages
// ============================================================================
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  
  // User
  USER_ID_REQUIRED: 'User ID is required',
  USER_NOT_FOUND: 'User not found',
  
  // Card Operations
  CARD_ADD_FAILED: 'Failed to add card to collection',
  CARD_UPDATE_FAILED: 'Failed to update card',
  CARD_DELETE_FAILED: 'Failed to delete card',
  CARD_FETCH_FAILED: 'Failed to fetch card',
  CARD_NOT_FOUND: 'Card not found',
  CARD_ID_REQUIRED: 'Card ID is required',
  
  // Image Operations
  IMAGE_UPLOAD_FAILED: 'Failed to upload image',
  IMAGE_DOWNLOAD_FAILED: 'Failed to download image',
  IMAGE_NO_DATA: 'No image data available',
  IMAGE_LOAD_FAILED: 'Failed to load image',
  
  // Video Operations
  VIDEO_GENERATION_FAILED: 'Failed to generate video',
  VIDEO_UPLOAD_FAILED: 'Failed to upload video',
  VIDEO_DOWNLOAD_FAILED: 'Failed to download video',
  VIDEO_NO_DATA: 'No video data available',
  VIDEO_INVALID_URL: 'Invalid video URL format',
  VIDEO_INVALID_DATA: 'Videos must be stored in Firebase Storage, not Firestore',
  
  // Storage
  STORAGE_UPLOAD_FAILED: 'Failed to upload to storage',
  STORAGE_DELETE_FAILED: 'Failed to delete from storage',
  
  // API
  API_KEYS_UPDATE_FAILED: 'Failed to update API keys',
  API_KEYS_FETCH_FAILED: 'Failed to fetch API keys',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  
  // Generic
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

// ============================================================================
// Success Messages
// ============================================================================
export const SUCCESS_MESSAGES = {
  CARD_ADDED: 'Card added successfully',
  CARD_UPDATED: 'Card updated successfully',
  CARD_DELETED: 'Card deleted successfully',
  VIDEO_GENERATED: 'Video generated successfully',
  API_KEYS_UPDATED: 'API keys updated successfully',
} as const;
