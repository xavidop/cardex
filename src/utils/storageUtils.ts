import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { STORAGE_PATHS, CACHE_CONTROL, ERROR_MESSAGES } from '@/constants';

/**
 * Converts a data URL to a Blob
 * @param dataURL - Data URL string
 * @returns Blob object
 */
const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Converts base64 video data to a Blob
 * @param base64Data - Base64 encoded video string
 * @returns Blob object with video/mp4 MIME type
 */
const base64ToVideoBlob = (base64Data: string): Blob => {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'video/mp4' });
};

/**
 * Sanitizes a card name for use in filenames
 * @param cardName - The card name to sanitize
 * @returns Sanitized lowercase string
 */
const sanitizeCardName = (cardName: string): string => {
  return cardName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
};

/**
 * Upload image to Firebase Storage and return public URL
 * @param imageDataUrl - Data URL of the image
 * @param cardName - Name of the card for filename
 * @param userId - Optional user ID for user-specific storage path
 * @returns Promise resolving to the download URL
 * @throws Error if upload fails
 */
export const uploadImageToStorage = async (
  imageDataUrl: string,
  cardName: string,
  userId?: string
): Promise<string> => {
  try {
    const blob = dataURLToBlob(imageDataUrl);
    const timestamp = Date.now();
    const sanitizedCardName = sanitizeCardName(cardName);
    
    // Determine the storage path based on whether userId is provided
    const filename = userId 
      ? `${STORAGE_PATHS.USER_CARDS(userId)}/${sanitizedCardName}_${timestamp}.png`
      : `${STORAGE_PATHS.SHARED_CARDS}/${sanitizedCardName}_${timestamp}.png`;
    
    const storageRef = ref(storage, filename);
    
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/png',
      cacheControl: CACHE_CONTROL.ONE_YEAR,
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Image uploaded successfully:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload image to storage:', error);
    throw new Error(ERROR_MESSAGES.IMAGE_UPLOAD_FAILED);
  }
};

/**
 * Upload card image to Firebase Storage in user's collection folder
 * @param imageDataUrl - Data URL of the image
 * @param userId - User ID for storage path
 * @param cardName - Name of the card for filename
 * @returns Promise resolving to the download URL
 */
export const uploadCardImageToStorage = async (
  imageDataUrl: string,
  userId: string,
  cardName: string
): Promise<string> => {
  return uploadImageToStorage(imageDataUrl, cardName, userId);
};

/**
 * Upload video to Firebase Storage and return public URL
 * This function handles base64 video data only
 * @param videoBase64 - Base64 encoded video string
 * @param userId - User ID for storage path
 * @param cardName - Name of the card for filename
 * @returns Promise resolving to the download URL
 * @throws Error if input is a URL instead of base64 data, or if upload fails
 */
export const uploadVideoToStorage = async (
  videoBase64: string,
  userId: string,
  cardName: string
): Promise<string> => {
  try {
    // Validate input - should be base64 data, not a URL
    if (videoBase64.startsWith('http')) {
      throw new Error('uploadVideoToStorage received a URL instead of base64 data. Video should be downloaded first.');
    }
    
    const blob = base64ToVideoBlob(videoBase64);
    const timestamp = Date.now();
    const sanitizedCardName = sanitizeCardName(cardName);
    const filename = `${STORAGE_PATHS.USER_VIDEOS(userId)}/${sanitizedCardName}_${timestamp}.mp4`;
    
    const storageRef = ref(storage, filename);
    
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'video/mp4',
      cacheControl: CACHE_CONTROL.ONE_YEAR,
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Video uploaded successfully to Firebase Storage:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload video to storage:', error);
    throw new Error(ERROR_MESSAGES.VIDEO_UPLOAD_FAILED);
  }
};

/**
 * Clean up old shared images (optional, can be called periodically)
 * Note: This requires Firebase Admin SDK or Cloud Functions
 * For now, rely on Firebase Storage lifecycle rules
 * @param olderThanDays - Number of days after which to clean up images
 */
export const cleanupOldSharedImages = async (olderThanDays: number = 7): Promise<void> => {
  console.log(
    `Cleanup of images older than ${olderThanDays} days should be configured in Firebase Storage lifecycle rules`
  );
};
