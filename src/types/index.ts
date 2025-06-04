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
}

// For AI Scan result, before saving to Firestore
export interface ScannedCardData {
  name?: string;
  set?: string;
  rarity?: string;
}
