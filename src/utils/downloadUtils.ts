import { ERROR_MESSAGES } from '@/constants';

/**
 * Sanitizes a filename by replacing non-alphanumeric characters with underscores
 * @param name - The name to sanitize
 * @returns Sanitized lowercase string safe for filenames
 */
const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Creates a blob URL from a remote URL using a proxy to avoid CORS issues
 * @param url - The remote URL to fetch
 * @returns Promise resolving to the blob URL
 */
const fetchThroughProxy = async (url: string): Promise<string> => {
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  
  if (!response.ok) {
    throw new Error('Failed to fetch through proxy');
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Creates a blob URL from a remote URL directly (may hit CORS)
 * @param url - The remote URL to fetch
 * @returns Promise resolving to the blob URL
 */
const fetchDirectly = async (url: string): Promise<string> => {
  const response = await fetch(url, { mode: 'cors' });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Triggers a download by creating and clicking a temporary anchor element
 * @param href - The URL or data URI to download
 * @param filename - The filename for the download
 * @param cleanup - Optional cleanup function to run after click
 */
const triggerDownload = (href: string, filename: string, cleanup?: () => void): void => {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  
  if (cleanup) {
    link.addEventListener('click', () => {
      setTimeout(cleanup, 100);
    });
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a card image from a base64 data URL, data URI, or Firebase Storage URL
 * @param imageUrl - The base64 data URL, data URI, or Firebase Storage URL of the image
 * @param cardName - The name of the card to use as filename
 * @throws Error if no image is available or download fails
 */
export async function downloadCardImage(imageUrl: string, cardName: string): Promise<void> {
  if (!imageUrl) {
    throw new Error(ERROR_MESSAGES.IMAGE_NO_DATA);
  }

  try {
    const sanitizedName = sanitizeFilename(cardName);
    const filename = `${sanitizedName}_pokemon_card.png`;
    
    // Handle different types of image URLs
    if (imageUrl.startsWith('data:')) {
      // Data URL - use directly
      triggerDownload(imageUrl, filename);
    } else if (imageUrl.startsWith('http')) {
      // Firebase Storage URL or other HTTP URL - use proxy approach to avoid CORS
      try {
        const blobUrl = await fetchThroughProxy(imageUrl);
        triggerDownload(blobUrl, filename, () => URL.revokeObjectURL(blobUrl));
      } catch (proxyError) {
        console.error('Proxy download failed, trying direct fetch:', proxyError);
        // Fallback to direct fetch (might still hit CORS)
        const blobUrl = await fetchDirectly(imageUrl);
        triggerDownload(blobUrl, filename, () => URL.revokeObjectURL(blobUrl));
      }
    } else {
      // Assume it's a base64 string without data URL prefix
      const dataUrl = `data:image/png;base64,${imageUrl}`;
      triggerDownload(dataUrl, filename);
    }
  } catch (error) {
    console.error('Error downloading card image:', error);
    throw new Error(ERROR_MESSAGES.IMAGE_DOWNLOAD_FAILED);
  }
}

/**
 * Downloads a card image from a base64 string
 * @param base64String - The base64 string of the image
 * @param cardName - The name of the card to use as filename
 * @throws Error if no image data is available
 */
export function downloadCardFromBase64(base64String: string, cardName: string): void {
  if (!base64String) {
    throw new Error(ERROR_MESSAGES.IMAGE_NO_DATA);
  }
  
  const dataUrl = `data:image/jpeg;base64,${base64String}`;
  downloadCardImage(dataUrl, cardName);
}

/**
 * Downloads a card video from a Firebase Storage URL or base64 data
 * @param videoUrl - The Firebase Storage URL or base64 data of the video
 * @param cardName - The name of the card to use as filename
 * @throws Error if no video is available or download fails
 */
export async function downloadCardVideo(videoUrl: string, cardName: string): Promise<void> {
  if (!videoUrl) {
    throw new Error(ERROR_MESSAGES.VIDEO_NO_DATA);
  }

  try {
    const sanitizedName = sanitizeFilename(cardName);
    const filename = `${sanitizedName}_pokemon_card_video.mp4`;
    
    // Handle different types of video URLs
    if (videoUrl.startsWith('data:video/')) {
      // Data URL - use directly
      triggerDownload(videoUrl, filename);
    } else if (videoUrl.startsWith('http')) {
      // Firebase Storage URL or other HTTP URL - use proxy approach to avoid CORS
      try {
        const blobUrl = await fetchThroughProxy(videoUrl);
        triggerDownload(blobUrl, filename, () => URL.revokeObjectURL(blobUrl));
      } catch (proxyError) {
        console.error('Proxy download failed, trying direct fetch:', proxyError);
        // Fallback to direct fetch (might still hit CORS)
        const blobUrl = await fetchDirectly(videoUrl);
        triggerDownload(blobUrl, filename, () => URL.revokeObjectURL(blobUrl));
      }
    } else {
      // Assume it's a base64 string without data URL prefix
      const dataUrl = `data:video/mp4;base64,${videoUrl}`;
      triggerDownload(dataUrl, filename);
    }
  } catch (error) {
    console.error('Error downloading card video:', error);
    throw new Error(ERROR_MESSAGES.VIDEO_DOWNLOAD_FAILED);
  }
}
