import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Convert base64 data URL to blob
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

// Upload image to Firebase Storage and return public URL
export const uploadImageToStorage = async (
  imageDataUrl: string,
  cardName: string,
  userId?: string
): Promise<string> => {
  try {
    // Convert data URL to blob
    const blob = dataURLToBlob(imageDataUrl);
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedCardName = cardName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    // Determine the storage path based on whether userId is provided
    const filename = userId 
      ? `users/${userId}/cards/${sanitizedCardName}_${timestamp}.png`
      : `cards/${sanitizedCardName}_${timestamp}.png`;
    
    // Create storage reference
    const storageRef = ref(storage, filename);
    
    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000', // 1 year cache
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Image uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload image to storage:', error);
    throw new Error('Failed to upload image to storage');
  }
};

// Upload card image to Firebase Storage in user's collection folder
export const uploadCardImageToStorage = async (
  imageDataUrl: string,
  userId: string,
  cardName: string
): Promise<string> => {
  return uploadImageToStorage(imageDataUrl, cardName, userId);
};

// Convert base64 video data to blob
const base64ToVideoBlob = (base64Data: string): Blob => {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'video/mp4' });
};

// Upload video to Firebase Storage and return public URL
// This function handles base64 video data only
export const uploadVideoToStorage = async (
  videoBase64: string,
  userId: string,
  cardName: string
): Promise<string> => {
  try {
    // Check if this is actually a URL instead of base64 data (this shouldn't happen)
    if (videoBase64.startsWith('http')) {
      throw new Error('uploadVideoToStorage received a URL instead of base64 data. Video should be downloaded first.');
    }
    
    // Convert base64 to blob
    const blob = base64ToVideoBlob(videoBase64);
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedCardName = cardName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `users/${userId}/videos/${sanitizedCardName}_${timestamp}.mp4`;
    
    // Create storage reference
    const storageRef = ref(storage, filename);
    
    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'video/mp4',
      cacheControl: 'public, max-age=31536000', // 1 year cache
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Video uploaded successfully to Firebase Storage:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload video to storage:', error);
    throw new Error('Failed to upload video to storage');
  }
};

// Clean up old shared images (optional, can be called periodically)
export const cleanupOldSharedImages = async (olderThanDays: number = 7) => {
  // This would require Firebase Admin SDK or Cloud Functions
  // For now, we'll rely on Firebase Storage lifecycle rules
  console.log(`Cleanup of images older than ${olderThanDays} days should be configured in Firebase Storage lifecycle rules`);
};
