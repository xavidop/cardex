import type { Timestamp } from 'firebase/firestore';

export interface PokemonCard {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  set: string;
  rarity: string;
  imageUrl: string; // Firebase Storage URL of the card image (NOT raw image data)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isGenerated?: boolean; // Flag to indicate if this is an AI-generated card
  isPhotoGenerated?: boolean; // Flag to indicate if this is generated from a photo
  prompt?: string; // The prompt used to generate the card (for generated cards)
  generationParams?: CardGenerationParams; // Parameters used for regular AI generation
  photoGenerationParams?: PhotoCardGenerationParams; // Parameters used for photo-based generation
  videoUrl?: string; // Firebase Storage URL of the generated video (NOT raw video data)
  videoGenerationStatus?: 'pending' | 'generating' | 'completed' | 'failed'; // Status of video generation
  videoPrompt?: string; // The prompt used to generate the video
}

// For AI Scan result, before saving to Firestore
export interface ScannedCardData {
  name?: string;
  set?: string;
  rarity?: string;
}

// For Pokemon card generation parameters
export interface CardGenerationParams {
  pokemonName: string;
  pokemonType: string;
  isIllustrationRare: boolean;
  isHolo: boolean;
  backgroundDescription: string;
  pokemonDescription: string;
  language: 'english' | 'japanese' | 'chinese' | 'korean' | 'spanish' | 'french' | 'german' | 'italian';
  model: 'imagen-4.0-ultra-generate-001' | 'imagen-4.0-generate-001' | 'imagen-4.0-fast-generate-001' | 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  hp?: number;
  attackName1?: string;
  attackDamage1?: number;
  attackName2?: string;
  attackDamage2?: number;
  weakness?: string;
  resistance?: string;
  retreatCost?: number;
}

export interface GeneratedCard {
  imageBase64: string;
  prompt: string;
}

// User profile and settings
export interface UserProfile {
  id: string; // Same as Firebase Auth uid
  email: string;
  displayName?: string;
  photoURL?: string;
  apiKeys?: UserApiKeys;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserApiKeys {
  geminiApiKey?: string;
  openaiApiKey?: string;
}

// For Pokemon card generation from photo parameters
export interface PhotoCardGenerationParams {
  photoDataUri?: string; // Optional - not saved to Firestore (too large), only used during generation
  pokemonName: string;
  pokemonType: string;
  styleDescription: string;
  language: 'english' | 'japanese' | 'chinese' | 'korean' | 'spanish' | 'french' | 'german' | 'italian';
  hp?: number;
  attackName1?: string;
  attackDamage1?: number;
  attackName2?: string;
  attackDamage2?: number;
  weakness?: string;
  resistance?: string;
  retreatCost?: number;
}
