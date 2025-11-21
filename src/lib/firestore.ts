
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
  setDoc,
} from 'firebase/firestore';
import { db, auth, storage } from './firebase';
import type { PokemonCard, ScannedCardData, UserProfile, UserApiKeys } from '@/types';
import { uploadCardImageToStorage, uploadVideoToStorage } from '@/utils/storageUtils';
import { ref, deleteObject } from 'firebase/storage';
import { filterUndefinedValues } from './utils';
import { generateCardVideo } from '@/ai/flows/generate-card-video';
import { 
  FIRESTORE_COLLECTIONS, 
  FILE_SIZE_LIMITS, 
  ERROR_MESSAGES, 
  DEFAULT_TCG_GAME,
  type VideoGenerationStatus 
} from '@/constants';

// Path: users/{userId}/pokemon_cards/{pokemonCardId}
const getPokemonCardsCollectionRef = (userId: string) => {
  return collection(db, FIRESTORE_COLLECTIONS.USERS, userId, FIRESTORE_COLLECTIONS.POKEMON_CARDS);
};

/**
 * Validates that a video URL is valid for Firestore storage
 * @param videoUrl - The video URL to validate
 * @throws Error if URL is invalid
 */
const validateVideoUrl = (videoUrl: string): void => {
  if (!videoUrl.startsWith('http')) {
    throw new Error(ERROR_MESSAGES.VIDEO_INVALID_URL);
  }
  
  if (videoUrl.length > FILE_SIZE_LIMITS.URL_MAX_LENGTH) {
    throw new Error(ERROR_MESSAGES.VIDEO_INVALID_DATA);
  }
};

/**
 * Background function to generate and upload video for a card
 * @param userId - The user ID who owns the card
 * @param cardId - The card ID to generate video for
 * @param card - The card data
 */
const generateVideoForCard = async (userId: string, cardId: string, card: PokemonCard): Promise<void> => {
  try {
    console.log(`Starting background video generation for card: ${card.name}`);
    
    // Update status to generating
    await updateCardInCollection(userId, cardId, { 
      videoGenerationStatus: 'generating' as VideoGenerationStatus
    });

    // Determine Pokemon type from generation params or default
    const pokemonType = card.generationParams?.characterType || 
                       card.photoGenerationParams?.characterType || 
                       'Normal';

    // Generate video using AI
    const videoResult = await generateCardVideo({
      cardImageUrl: card.imageUrl,
      pokemonName: card.name,
      pokemonType: pokemonType,
      userId: userId,
    });

    if (videoResult.error || !videoResult.videoBase64) {
      console.error('Video generation failed:', videoResult.error);
      await updateCardInCollection(userId, cardId, { 
        videoGenerationStatus: 'failed' as VideoGenerationStatus
      });
      return;
    }

    // Ensure we have base64 data, not a URL
    if (videoResult.videoBase64.startsWith('http')) {
      console.error('Video generation returned a URL instead of base64 data');
      await updateCardInCollection(userId, cardId, { 
        videoGenerationStatus: 'failed' as VideoGenerationStatus
      });
      return;
    }

    // Upload video to storage
    const videoUrl = await uploadVideoToStorage(videoResult.videoBase64, userId, card.name);
    
    // Validate video URL before storing
    validateVideoUrl(videoUrl);

    // Update card with video info
    await updateCardInCollection(userId, cardId, {
      videoUrl,
      videoGenerationStatus: 'completed' as VideoGenerationStatus,
      videoPrompt: videoResult.prompt,
    });

    console.log(`Video generation completed successfully for card: ${card.name}`);
  } catch (error) {
    console.error('Error in background video generation:', error);
    await updateCardInCollection(userId, cardId, { 
      videoGenerationStatus: 'failed' as VideoGenerationStatus
    });
  }
};

/**
 * Adds a new card to the user's collection
 * @param userId - The user ID who owns the card
 * @param cardData - The card data including imageDataUrl
 * @returns Promise resolving to the new card ID
 * @throws Error if userId is missing or card add fails
 */
export const addCardToCollection = async (
  userId: string,
  cardData: Omit<PokemonCard, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'imageUrl'> & { imageDataUrl: string }
): Promise<string> => {
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
  }
  
  try {
    // Upload the image to Firebase Storage
    const imageUrl = await uploadCardImageToStorage(cardData.imageDataUrl, userId, cardData.name);
    
    const collectionRef = getPokemonCardsCollectionRef(userId);
    const { imageDataUrl, ...cardDataWithoutImage } = cardData;
    const docPayload = {
      ...cardDataWithoutImage,
      game: cardData.game || DEFAULT_TCG_GAME,
      imageUrl,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, docPayload);
    
    // Video generation is opt-in - users can trigger it manually from the UI
    return docRef.id;
  } catch (error) {
    console.error('Error adding card to Firestore:', error);
    if (error instanceof Error) {
      const firebaseError = error as any;
      if (firebaseError.code) {
        throw new Error(`${firebaseError.code}: ${error.message}`);
      }
    }
    throw new Error(ERROR_MESSAGES.CARD_ADD_FAILED);
  }
};

/**
 * Gets all cards for a user, ordered by most recently updated
 * @param userId - The user ID to fetch cards for
 * @returns Promise resolving to array of cards
 * @throws Error if fetch fails
 */
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
    throw new Error(ERROR_MESSAGES.CARD_FETCH_FAILED);
  }
};

/**
 * Gets a card by its ID
 * @param userId - The user ID who owns the card
 * @param cardId - The card ID to fetch
 * @returns Promise resolving to the card or null if not found
 * @throws Error if fetch fails
 */
export const getCardById = async (userId: string, cardId: string): Promise<PokemonCard | null> => {
  if (!userId || !cardId) return null;
  try {
    const cardDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId, FIRESTORE_COLLECTIONS.POKEMON_CARDS, cardId);
    const cardSnap = await getDoc(cardDocRef);
    if (cardSnap.exists()) {
      return { id: cardSnap.id, ...cardSnap.data() } as PokemonCard;
    }
    return null;
  } catch (error) {
    console.error('Error fetching card by ID: ', error);
    throw new Error(ERROR_MESSAGES.CARD_FETCH_FAILED);
  }
};

/**
 * Updates a card in the collection
 * @param userId - The user ID who owns the card
 * @param cardId - The card ID to update
 * @param cardData - The partial card data to update
 * @throws Error if update fails or validation fails
 */
export const updateCardInCollection = async (
  userId: string,
  cardId: string,
  cardData: Partial<Omit<PokemonCard, 'id' | 'userId' | 'createdAt' | 'imageUrl'>> & { imageDataUrl?: string }
): Promise<void> => {
  if (!userId || !cardId) {
    throw new Error(`${ERROR_MESSAGES.USER_ID_REQUIRED} and ${ERROR_MESSAGES.CARD_ID_REQUIRED}`);
  }
  
  try {
    const cardDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId, FIRESTORE_COLLECTIONS.POKEMON_CARDS, cardId);
    
    let updateData: any = { ...cardData };
    
    // Validate video URL if present
    if (updateData.videoUrl) {
      validateVideoUrl(updateData.videoUrl);
    }
    
    // If a new image is provided, upload it to storage first
    if (cardData.imageDataUrl) {
      const imageUrl = await uploadCardImageToStorage(
        cardData.imageDataUrl, 
        userId, 
        cardData.name || 'updated_card'
      );
      updateData.imageUrl = imageUrl;
      delete updateData.imageDataUrl;
    }
    
    await updateDoc(cardDocRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating card: ', error);
    throw new Error(ERROR_MESSAGES.CARD_UPDATE_FAILED);
  }
};

/**
 * Deletes a card from the collection and its associated files from storage
 * @param userId - The user ID who owns the card
 * @param cardId - The card ID to delete
 * @throws Error if delete fails
 */
export const deleteCardFromCollection = async (userId: string, cardId: string): Promise<void> => {
  if (!userId || !cardId) {
    throw new Error(`${ERROR_MESSAGES.USER_ID_REQUIRED} and ${ERROR_MESSAGES.CARD_ID_REQUIRED}`);
  }
  
  try {
    const cardDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId, FIRESTORE_COLLECTIONS.POKEMON_CARDS, cardId);
    
    // Get the card data first to delete the associated image from storage
    const cardDoc = await getDoc(cardDocRef);
    if (cardDoc.exists()) {
      const cardData = cardDoc.data() as PokemonCard;
      
      // Delete image from storage (production or emulator)
      if (cardData.imageUrl && (cardData.imageUrl.includes('firebase') || cardData.imageUrl.includes('localhost:9199'))) {
        try {
          // Extract the storage path from the URL and delete the image
          const url = new URL(cardData.imageUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            const imageRef = ref(storage, storagePath);
            await deleteObject(imageRef);
            console.log('Card image deleted from storage:', storagePath);
          }
        } catch (storageError) {
          console.warn('Failed to delete card image from storage:', storageError);
          // Continue with deletion even if storage deletion fails
        }
      }
      
      // Delete video from storage if it exists (production or emulator)
      if (cardData.videoUrl && (cardData.videoUrl.includes('firebase') || cardData.videoUrl.includes('localhost:9199'))) {
        try {
          const url = new URL(cardData.videoUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            const videoRef = ref(storage, storagePath);
            await deleteObject(videoRef);
            console.log('Card video deleted from storage:', storagePath);
          }
        } catch (storageError) {
          console.warn('Failed to delete card video from storage:', storageError);
        }
      }
    }
    
    await deleteDoc(cardDocRef);
  } catch (error) {
    console.error('Error deleting card: ', error);
    throw new Error(ERROR_MESSAGES.CARD_DELETE_FAILED);
  }
};

/**
 * Manually generates video for an existing card
 * @param userId - The user ID who owns the card
 * @param cardId - The card ID to generate video for
 * @throws Error if card not found or generation fails
 */
export const generateVideoForExistingCard = async (userId: string, cardId: string): Promise<void> => {
  if (!userId || !cardId) {
    throw new Error(`${ERROR_MESSAGES.USER_ID_REQUIRED} and ${ERROR_MESSAGES.CARD_ID_REQUIRED}`);
  }
  
  try {
    const card = await getCardById(userId, cardId);
    if (!card) {
      throw new Error(ERROR_MESSAGES.CARD_NOT_FOUND);
    }
    
    await generateVideoForCard(userId, cardId, card);
  } catch (error) {
    console.error('Error generating video for existing card:', error);
    throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
  }
};

// ============================================================================
// User Profile Management Functions
// ============================================================================

/**
 * Creates or updates a user profile in Firestore
 * @param userId - The user ID
 * @param profileData - Partial user profile data to create/update
 * @throws Error if userId is missing or operation fails
 */
export const createOrUpdateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
  }
  
  try {
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
    
    const filteredProfileData = filterUndefinedValues(profileData);
    
    const updateData: any = {
      ...filteredProfileData,
      id: userId,
      updatedAt: serverTimestamp(),
    };
    
    // If creating for the first time, add createdAt
    const existingDoc = await getDoc(userRef);
    if (!existingDoc.exists()) {
      updateData.createdAt = serverTimestamp();
    }
    
    await setDoc(userRef, updateData, { merge: true });
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }
};

/**
 * Gets a user profile from Firestore, creates basic profile if doesn't exist
 * @param userId - The user ID to fetch profile for
 * @returns Promise resolving to user profile or null
 * @throws Error if userId is missing or fetch fails
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
  }
  
  try {
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    
    // Create a basic user profile if it doesn't exist
    const basicProfile: Partial<UserProfile> = {
      email: '',
      displayName: 'Anonymous User',
    };
    
    await createOrUpdateUserProfile(userId, basicProfile);
    
    const newUserSnap = await getDoc(userRef);
    if (newUserSnap.exists()) {
      return newUserSnap.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }
};

/**
 * Updates user API keys
 * @param userId - The user ID
 * @param apiKeys - The API keys to update
 * @throws Error if userId is missing or update fails
 */
export const updateUserApiKeys = async (userId: string, apiKeys: UserApiKeys): Promise<void> => {
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
  }
  
  try {
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      apiKeys: apiKeys,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user API keys:', error);
    throw new Error(ERROR_MESSAGES.API_KEYS_UPDATE_FAILED);
  }
};

/**
 * Gets user API keys from their profile
 * @param userId - The user ID
 * @returns Promise resolving to API keys or null
 * @throws Error if userId is missing or fetch fails
 */
export const getUserApiKeys = async (userId: string): Promise<UserApiKeys | null> => {
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
  }
  
  try {
    const profile = await getUserProfile(userId);
    return profile?.apiKeys || null;
  } catch (error) {
    console.error('Error getting user API keys:', error);
    throw new Error(ERROR_MESSAGES.API_KEYS_FETCH_FAILED);
  }
};
