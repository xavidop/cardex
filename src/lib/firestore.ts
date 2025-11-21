
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
import { db, auth, storage } from './firebase'; // Main Firebase config
import type { PokemonCard, ScannedCardData, UserProfile, UserApiKeys } from '@/types';
import { uploadCardImageToStorage, uploadVideoToStorage } from '@/utils/storageUtils';
import { ref, deleteObject } from 'firebase/storage';
import { filterUndefinedValues } from './utils';
import { generateCardVideo } from '@/ai/flows/generate-card-video';

const CARDS_COLLECTION = 'users'; // Top-level collection for users

// Path: users/{userId}/pokemon_cards/{pokemonCardId}
const getPokemonCardsCollectionRef = (userId: string) => {
  return collection(db, CARDS_COLLECTION, userId, 'pokemon_cards');
};

// Background function to generate and upload video for a card
const generateVideoForCard = async (userId: string, cardId: string, card: PokemonCard) => {
  try {
    console.log(`Starting background video generation for card: ${card.name}`);
    
    // Update status to generating
    await updateCardInCollection(userId, cardId, { 
      videoGenerationStatus: 'generating' 
    });

    // Determine Pokemon type from generation params or default
    const pokemonType = card.generationParams?.pokemonType || 
                       card.photoGenerationParams?.pokemonType || 
                       'Normal';

    // Generate video using AI
    const videoResult = await generateCardVideo({
      cardImageUrl: card.imageUrl,
      pokemonName: card.name,
      pokemonType: pokemonType,
      userId: userId,
    });

    console.log('Video generation result:', {
      hasError: !!videoResult.error,
      hasVideoBase64: !!videoResult.videoBase64,
      videoBase64Type: typeof videoResult.videoBase64,
      videoBase64Preview: videoResult.videoBase64?.substring(0, 50) + '...',
    });

    if (videoResult.error || !videoResult.videoBase64) {
      console.error('Video generation failed:', videoResult.error);
      await updateCardInCollection(userId, cardId, { 
        videoGenerationStatus: 'failed' 
      });
      return;
    }

    // Ensure we have base64 data, not a URL
    if (videoResult.videoBase64.startsWith('http')) {
      console.error('Video generation returned a URL instead of base64 data:', videoResult.videoBase64);
      await updateCardInCollection(userId, cardId, { 
        videoGenerationStatus: 'failed' 
      });
      return;
    }

    // Upload video to storage
    console.log('Uploading video to Firebase Storage...');
    const videoUrl = await uploadVideoToStorage(videoResult.videoBase64, userId, card.name);
    console.log('Video uploaded to Firebase Storage:', videoUrl);

    // Validate that videoUrl is a proper Firebase Storage URL (production or emulator), not raw data
    if (!videoUrl.startsWith('http')) {
      console.error('Invalid video URL returned from storage upload:', videoUrl.substring(0, 100));
      await updateCardInCollection(userId, cardId, { 
        videoGenerationStatus: 'failed' 
      });
      return;
    }

    // Additional safety check - ensure we're not storing large data in Firestore
    if (videoUrl.length > 2000) { // URLs should be much shorter than this
      console.error('Video URL is suspiciously long, might be raw data:', videoUrl.length);
      await updateCardInCollection(userId, cardId, { 
        videoGenerationStatus: 'failed' 
      });
      return;
    }

    // Update card with video info (only storing the URL, not the video data)
    await updateCardInCollection(userId, cardId, {
      videoUrl, // This should only be a Firebase Storage URL
      videoGenerationStatus: 'completed',
      videoPrompt: videoResult.prompt,
    });

    console.log(`Video generation completed successfully for card: ${card.name}`);
  } catch (error) {
    console.error('Error in background video generation:', error);
    await updateCardInCollection(userId, cardId, { 
      videoGenerationStatus: 'failed' 
    });
  }
};

export const addCardToCollection = async (
  userId: string,
  cardData: Omit<PokemonCard, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'imageUrl'> & { imageDataUrl: string }
): Promise<string> => {
  if (!userId) {
    console.error("addCardToCollection: User ID is missing.");
    throw new Error('User ID is required to add a card.');
  }
  
  console.log("DEBUG: Attempting to add card with userId:", userId);
  console.log("DEBUG: Current auth user:", auth.currentUser?.uid);
  console.log("DEBUG: Auth user matches:", auth.currentUser?.uid === userId);
  console.log("DEBUG: Card game:", cardData.game || 'pokemon'); // Default to pokemon for backward compatibility
  
  try {
    // First, upload the image to Firebase Storage
    console.log("Uploading card image to Firebase Storage...");
    const imageUrl = await uploadCardImageToStorage(cardData.imageDataUrl, userId, cardData.name);
    
    const collectionRef = getPokemonCardsCollectionRef(userId);
    const { imageDataUrl, ...cardDataWithoutImage } = cardData;
    const docPayload = {
      ...cardDataWithoutImage,
      game: cardData.game || 'pokemon', // Default to pokemon for backward compatibility
      imageUrl, // Store the Firebase Storage URL instead of base64 data
      userId,
      // Don't initialize video generation automatically - make it opt-in
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log(
      "Attempting to add card to Firestore. Path:",
      collectionRef.path,
      "Payload keys:",
      Object.keys(docPayload).join(', '),
      "Image URL:",
      imageUrl,
      "Game:",
      docPayload.game
    );

    const docRef = await addDoc(collectionRef, docPayload);
    console.log("Card successfully added to Firestore with ID:", docRef.id);

    // Video generation is now opt-in - users can trigger it manually from the UI
    return docRef.id;
  } catch (error) {
    console.error('Error adding card to Firestore (full error object):', error);
    let detailedMessage = 'Failed to add card to collection.';
    if (error instanceof Error) {
      detailedMessage = error.message;
      const firebaseError = error as any;
      if (firebaseError.code) {
        detailedMessage = `Error: ${firebaseError.code} - ${error.message}`;
      }
    }
    throw new Error(detailedMessage);
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
  cardData: Partial<Omit<PokemonCard, 'id' | 'userId' | 'createdAt' | 'imageUrl'>> & { imageDataUrl?: string }
): Promise<void> => {
  if (!userId || !cardId) throw new Error('User ID and Card ID are required to update a card.');
  try {
    const cardDocRef = doc(db, CARDS_COLLECTION, userId, 'pokemon_cards', cardId);
    
    let updateData: any = { ...cardData };
    
    // Safety check: ensure we're not trying to store large video data in Firestore
    if (updateData.videoUrl && updateData.videoUrl.length > 2000) {
      console.error('Attempted to store large video data in Firestore. This is not allowed.');
      throw new Error('Invalid video data: videos must be stored in Firebase Storage, not Firestore');
    }
    
    // Validate video URL format if present - allow both production and emulator URLs
    if (updateData.videoUrl && !updateData.videoUrl.startsWith('http')) {
      console.error('Invalid video URL format:', updateData.videoUrl.substring(0, 100));
      throw new Error('Video URL must be a valid HTTP URL from Firebase Storage');
    }
    
    // If a new image is provided, upload it to storage first
    if (cardData.imageDataUrl) {
      console.log("Uploading updated card image to Firebase Storage...");
      const imageUrl = await uploadCardImageToStorage(cardData.imageDataUrl, userId, cardData.name || 'updated_card');
      updateData.imageUrl = imageUrl;
      delete updateData.imageDataUrl; // Remove the base64 data from the update
    }
    
    await updateDoc(cardDocRef, {
      ...updateData,
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
    throw new Error('Failed to delete card.');
  }
};

// Manual function to generate video for an existing card
export const generateVideoForExistingCard = async (userId: string, cardId: string): Promise<void> => {
  if (!userId || !cardId) throw new Error('User ID and Card ID are required to generate video.');
  
  try {
    // Get the card data
    const card = await getCardById(userId, cardId);
    if (!card) {
      throw new Error('Card not found');
    }
    
    // Trigger video generation
    await generateVideoForCard(userId, cardId, card);
  } catch (error) {
    console.error('Error generating video for existing card:', error);
    throw new Error('Failed to generate video for card.');
  }
};

// User Profile Management Functions

/**
 * Creates or updates a user profile in Firestore
 */
export const createOrUpdateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  if (!userId) throw new Error('User ID is required to create/update profile.');
  
  try {
    const userRef = doc(db, 'users', userId);
    
    // Filter out undefined values to prevent Firestore errors
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
    throw new Error('Failed to create/update user profile.');
  }
};

/**
 * Gets a user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) throw new Error('User ID is required to get profile.');
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    
    // Create a basic user profile if it doesn't exist
    console.log(`User profile not found for ${userId}, creating basic profile...`);
    const basicProfile: Partial<UserProfile> = {
      email: '',
      displayName: 'Anonymous User',
    };
    
    await createOrUpdateUserProfile(userId, basicProfile);
    
    // Return the newly created profile
    const newUserSnap = await getDoc(userRef);
    if (newUserSnap.exists()) {
      return newUserSnap.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile.');
  }
};

/**
 * Updates user API keys
 */
export const updateUserApiKeys = async (userId: string, apiKeys: UserApiKeys): Promise<void> => {
  if (!userId) throw new Error('User ID is required to update API keys.');
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      apiKeys: apiKeys,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user API keys:', error);
    throw new Error('Failed to update API keys.');
  }
};

/**
 * Gets user API keys
 */
export const getUserApiKeys = async (userId: string): Promise<UserApiKeys | null> => {
  if (!userId) throw new Error('User ID is required to get API keys.');
  
  try {
    const profile = await getUserProfile(userId);
    return profile?.apiKeys || null;
  } catch (error) {
    console.error('Error getting user API keys:', error);
    throw new Error('Failed to get API keys.');
  }
};
