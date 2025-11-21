/**
 * Utility functions for image processing and compression
 */

import { IMAGE_DEFAULTS, ERROR_MESSAGES } from '@/constants';

/**
 * Normalizes a base64 image to a data URL format
 * @param base64Image - Base64 string with or without data URL prefix
 * @param mimeType - MIME type for the image (default: image/jpeg)
 * @returns Data URL formatted string
 */
const normalizeToDataURL = (base64Image: string, mimeType: string = 'image/jpeg'): string => {
  return base64Image.startsWith('data:') 
    ? base64Image 
    : `data:${mimeType};base64,${base64Image}`;
};

/**
 * Compress a base64 image to reduce file size
 * @param base64Image - Base64 encoded image string
 * @param maxWidth - Maximum width in pixels (default: 512)
 * @param maxHeight - Maximum height in pixels (default: 712) - Pokemon card aspect ratio
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<string> - Compressed base64 image as data URL
 * @throws Error if image fails to load or compression fails
 */
export function compressBase64Image(
  base64Image: string,
  maxWidth: number = IMAGE_DEFAULTS.MAX_WIDTH,
  maxHeight: number = IMAGE_DEFAULTS.MAX_HEIGHT,
  quality: number = IMAGE_DEFAULTS.QUALITY
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
      
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
      
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
      
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
      
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
      
        // Draw and compress the image
        ctx.drawImage(img, 0, 0, width, height);
      
        // Get compressed base64 string
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(ERROR_MESSAGES.IMAGE_LOAD_FAILED));
    };
    
    img.src = normalizeToDataURL(base64Image);
  });
}

/**
 * Get the size of a base64 string in bytes
 * @param base64String - Base64 encoded string
 * @returns Size in bytes
 */
export function getBase64Size(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
    
  // Calculate size: (base64 length * 3/4) - padding
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

/**
 * Format bytes to human readable format
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.2 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
