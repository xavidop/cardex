import type { Timestamp } from 'firebase/firestore';

export interface PokemonCard {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  set: string;
  rarity: string;
  imageDataUrl: string; // data URI of the card image
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isGenerated?: boolean; // Flag to indicate if this is an AI-generated card
  prompt?: string; // The prompt used to generate the card (for generated cards)
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
  params: CardGenerationParams;
}
