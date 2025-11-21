import type { Timestamp } from 'firebase/firestore';

// Supported TCG games
export type TCGGame = 'pokemon' | 'onepiece' | 'lorcana' | 'magic' | 'dragonball';

export interface PokemonCard {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  set: string;
  rarity: string;
  imageUrl: string; // Firebase Storage URL of the card image (NOT raw image data)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  game: TCGGame; // The TCG game this card belongs to
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
  game: TCGGame;
  // Common fields across all games
  characterName: string; // Name of the character/creature
  characterType: string; // Type/Element/Color of the card
  isSpecialArt: boolean; // Special/Full Art variant
  isHolo: boolean; // Holographic effect
  backgroundDescription: string;
  characterDescription: string;
  language: 'english' | 'japanese' | 'chinese' | 'korean' | 'spanish' | 'french' | 'german' | 'italian';
  model: 'imagen-4.0-ultra-generate-001' | 'imagen-4.0-generate-001' | 'imagen-4.0-fast-generate-001' | 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  
  // Game-specific fields (optional, used based on game type)
  // Pokemon
  hp?: number;
  attackName1?: string;
  attackDamage1?: number;
  attackName2?: string;
  attackDamage2?: number;
  weakness?: string;
  resistance?: string;
  retreatCost?: number;
  
  // One Piece
  power?: number;
  cost?: number;
  counter?: number;
  color?: string;
  lifePoints?: number;
  
  // Lorcana
  inkCost?: number;
  strength?: number;
  willpower?: number;
  lore?: number;
  inkable?: boolean;
  
  // Magic: The Gathering
  manaCost?: string;
  cardType?: string; // Creature, Instant, Sorcery, etc.
  subType?: string;
  powerToughness?: string; // e.g., "3/3"
  
  // Dragon Ball
  combatPower?: number;
  comboCost?: number;
  comboEnergy?: number;
  era?: string;
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
  game: TCGGame;
  photoDataUri?: string; // Optional - not saved to Firestore (too large), only used during generation
  characterName: string;
  characterType: string;
  styleDescription: string;
  language: 'english' | 'japanese' | 'chinese' | 'korean' | 'spanish' | 'french' | 'german' | 'italian';
  
  // Game-specific optional stats (similar to CardGenerationParams)
  hp?: number;
  attackName1?: string;
  attackDamage1?: number;
  attackName2?: string;
  attackDamage2?: number;
  weakness?: string;
  resistance?: string;
  retreatCost?: number;
  power?: number;
  cost?: number;
  counter?: number;
  color?: string;
  lifePoints?: number;
  inkCost?: number;
  strength?: number;
  willpower?: number;
  lore?: number;
  inkable?: boolean;
  manaCost?: string;
  cardType?: string;
  subType?: string;
  powerToughness?: string;
  combatPower?: number;
  comboCost?: number;
  comboEnergy?: number;
  era?: string;
}
