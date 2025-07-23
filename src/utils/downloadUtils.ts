/**
 * Downloads a card image from a base64 data URL, data URI, or Firebase Storage URL
 * @param imageUrl - The base64 data URL, data URI, or Firebase Storage URL of the image
 * @param cardName - The name of the card to use as filename
 */
export async function downloadCardImage(imageUrl: string, cardName: string): Promise<void> {
  try {
    if (!imageUrl) {
      throw new Error('No image available to download');
    }

    // Create a temporary anchor element
    const link = document.createElement('a');
    
    // Set the download attribute with a filename
    const sanitizedName = cardName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${sanitizedName}_pokemon_card.png`;
    
    // Handle different types of image URLs
    if (imageUrl.startsWith('data:')) {
      // Data URL - use directly
      link.href = imageUrl;
    } else if (imageUrl.startsWith('http')) {
      // Firebase Storage URL or other HTTP URL - fetch and convert to blob URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      
      // Clean up the blob URL after download
      link.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      });
    } else {
      // Assume it's a base64 string without data URL prefix
      const dataUrl = `data:image/png;base64,${imageUrl}`;
      link.href = dataUrl;
    }
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading card image:', error);
    throw new Error('Failed to download card image');
  }
}

/**
 * Downloads a card image from a base64 string
 * @param base64String - The base64 string of the image
 * @param cardName - The name of the card to use as filename
 */
export function downloadCardFromBase64(base64String: string, cardName: string): void {
  if (!base64String) {
    throw new Error('No image data available to download');
  }
  
  const dataUrl = `data:image/jpeg;base64,${base64String}`;
  downloadCardImage(dataUrl, cardName);
}

/**
 * Downloads a card video from a Firebase Storage URL or base64 data
 * @param videoUrl - The Firebase Storage URL or base64 data of the video
 * @param cardName - The name of the card to use as filename
 */
export async function downloadCardVideo(videoUrl: string, cardName: string): Promise<void> {
  try {
    if (!videoUrl) {
      throw new Error('No video available to download');
    }

    // Create a temporary anchor element
    const link = document.createElement('a');
    
    // Set the download attribute with a filename
    const sanitizedName = cardName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${sanitizedName}_pokemon_card_video.mp4`;
    
    // Handle different types of video URLs
    if (videoUrl.startsWith('data:video/')) {
      // Data URL - use directly
      link.href = videoUrl;
    } else if (videoUrl.startsWith('http')) {
      // Firebase Storage URL or other HTTP URL - fetch and convert to blob URL
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      
      // Clean up the blob URL after download
      link.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      });
    } else {
      // Assume it's a base64 string without data URL prefix
      const dataUrl = `data:video/mp4;base64,${videoUrl}`;
      link.href = dataUrl;
    }
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading card video:', error);
    throw new Error('Failed to download card video');
  }
}
