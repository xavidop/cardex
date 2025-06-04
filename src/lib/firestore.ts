
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase'; // Main Firebase config
import type { PokemonCard, ScannedCardData } from '@/types';

const CARDS_COLLECTION = 'users'; // Top-level collection for users

// Path: users/{userId}/pokemon_cards/{pokemonCardId}
const getPokemonCardsCollectionRef = (userId: string) => {
  return collection(db, CARDS_COLLECTION, userId, 'pokemon_cards');
};

export const addCardToCollection = async (
  userId: string,
  cardData: Omit<PokemonCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (!userId) {
    console.error("addCardToCollection: User ID is missing.");
    throw new Error('User ID is required to add a card.');
  }
  try {
    const collectionRef = getPokemonCardsCollectionRef(userId);
    const docPayload = {
      ...cardData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Log information for debugging, excluding potentially very large imageDataUrl from general log
    const payloadKeys = Object.keys(docPayload);
    const imageDataUrlLength = docPayload.imageDataUrl ? docPayload.imageDataUrl.length : 0;
    console.log(
      "Attempting to add card to Firestore. Path:",
      collectionRef.path,
      "Payload keys:",
      payloadKeys.join(', '),
      "imageDataUrl length:",
      imageDataUrlLength
    );

    if (imageDataUrlLength > 500 * 1024) { // Warn if image data is > 500KB
      console.warn(
        `imageDataUrl is very large (length: ${imageDataUrlLength} bytes). This might approach or exceed Firestore's 1MiB document size limit and could cause write failures. Consider storing images in Firebase Storage instead.`
      );
    }

    const docRef = await addDoc(collectionRef, docPayload);
    return docRef.id;
  } catch (error) {
    console.error('Error adding card to Firestore (full error object):', error); // Log the full error object
    let detailedMessage = 'Failed to add card to collection.';
    if (error instanceof Error) {
      detailedMessage = error.message; // Start with the basic error message
      // Attempt to access Firebase-specific error code
      // Firebase errors often have a 'code' property, but to be safe with typing, we check its existence.
      const firebaseError = error as any;
      if (firebaseError.code) {
        detailedMessage = `Error: ${firebaseError.code} - ${error.message}`;
      }
    }
    throw new Error(detailedMessage); // Throw a new error with the potentially more detailed message
  }
};

export const getUserCards = async (userId: string): Promise<PokemonCard[]> => {
  if (!userId) return [];
  try {
    const q = query(getPokemonCardsCollectionRef(userId), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<PokemonCard, 'id'>),
    }));
  } catch (error) {
    console.error('Error fetching user cards: ', error);
    throw new Error('Failed to fetch card collection.');
  }
};

export const getCardById = async (userId: string, cardId: string): Promise<PokemonCard | null> => {
  if (!userId || !cardId) return null;
  try {
    const cardDocRef = doc(db, CARDS_COLLECTION, userId, 'pokemon_cards', cardId);
    const cardSnap = await getDoc(cardDocRef);
    if (cardSnap.exists()) {
      return { id: cardSnap.id, ...cardSnap.data() } as PokemonCard;
    }
    return null;
  } catch (error) {
    console.error('Error fetching card by ID: ', error);
    throw new Error('Failed to fetch card details.');
  }
};

export const updateCardInCollection = async (
  userId: string,
  cardId: string,
  cardData: Partial<Omit<PokemonCard, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  if (!userId || !cardId) throw new Error('User ID and Card ID are required to update a card.');
  try {
    const cardDocRef = doc(db, CARDS_COLLECTION, userId, 'pokemon_cards', cardId);
    await updateDoc(cardDocRef, {
      ...cardData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating card: ', error);
    throw new Error('Failed to update card.');
  }
};

export const deleteCardFromCollection = async (userId: string, cardId: string): Promise<void> => {
  if (!userId || !cardId) throw new Error('User ID and Card ID are required to delete a card.');
  try {
    const cardDocRef = doc(db, CARDS_COLLECTION, userId, 'pokemon_cards', cardId);
    await deleteDoc(cardDocRef);
  } catch (error) {
    console.error('Error deleting card: ', error);
    throw new Error('Failed to delete card.');
  }
};
