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
  if (!userId) throw new Error('User ID is required to add a card.');
  try {
    const docRef = await addDoc(getPokemonCardsCollectionRef(userId), {
      ...cardData,
      userId, // Ensure userId is part of the document data as well for easier querying if needed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding card to Firestore: ', error);
    throw new Error('Failed to add card to collection.');
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
