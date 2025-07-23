export interface ShareOptions {
  cardName: string;
  cardImageUrl?: string;
  publicImageUrl?: string; // For social media previews
  onImageCopied?: (platform: string) => void;
  onImageUploaded?: (url: string) => void;
}

import { uploadImageToStorage } from './storageUtils';

// Cache for uploaded image URLs to avoid re-uploading the same image
const uploadedImageCache = new Map<string, string>();

// Helper function to get a cache key for an image
const getImageCacheKey = (cardName: string, imageDataUrl: string): string => {
  // Use first 100 characters of base64 data as a simple hash
  const imageHash = imageDataUrl.slice(0, 100);
  return `${cardName}_${imageHash}`;
};

// Helper function to upload image and get public URL with caching
const getOrUploadImageUrl = async (
  cardName: string, 
  cardImageUrl: string, 
  onImageUploaded?: (url: string) => void
): Promise<string | null> => {
  try {
    // If the image URL is already a Firebase Storage URL or HTTP URL, return it directly
    if (cardImageUrl.startsWith('http')) {
      console.log('Using existing Firebase Storage URL:', cardImageUrl);
      return cardImageUrl;
    }

    // Check cache first for base64 images
    const cacheKey = getImageCacheKey(cardName, cardImageUrl);
    const cachedUrl = uploadedImageCache.get(cacheKey);
    if (cachedUrl) {
      console.log('Using cached image URL:', cachedUrl);
      return cachedUrl;
    }

    // Upload image to storage (for base64 data URLs)
    const imageUrl = await uploadImageToStorage(cardImageUrl, cardName);
    
    // Cache the URL
    uploadedImageCache.set(cacheKey, imageUrl);
    
    // Notify callback
    onImageUploaded?.(imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return null;
  }
};
const downloadImageAsBlob = async (imageDataUrl: string): Promise<Blob> => {
  const response = await fetch(imageDataUrl);
  return response.blob();
};

// Helper function to copy image and text to clipboard
export const copyImageAndText = async ({ cardName, cardImageUrl }: ShareOptions) => {
  try {
    const text = `Check out this AI-generated Pokémon card by Cardex: https://cardex.xavidop.me`;

    if (cardImageUrl && cardImageUrl.startsWith('data:') && navigator.clipboard?.write) {
      // Copy both image and text to clipboard (modern browsers)
      const imageBlob = await downloadImageAsBlob(cardImageUrl);
      const clipboardItems = [
        new ClipboardItem({
          'image/png': imageBlob,
          'text/plain': new Blob([text], { type: 'text/plain' })
        })
      ];
      await navigator.clipboard.write(clipboardItems);
      return true;
    } else {
      // Fallback to text only
      await navigator.clipboard.writeText(text);
      return false; // Indicates image wasn't copied
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
};

export const shareOnTwitter = async ({ cardName, cardImageUrl, publicImageUrl, onImageCopied, onImageUploaded }: ShareOptions) => {
  let shareText = `Check out this AI-generated Pokémon card by Cardex: https://cardex.xavidop.me`;

  // If we have an image, try to get or upload it to get a public URL
  let imageUrl = publicImageUrl;
  if (!imageUrl && cardImageUrl) {
    if (cardImageUrl.startsWith('http')) {
      // Already a Firebase Storage URL, use directly
      imageUrl = cardImageUrl;
    } else if (cardImageUrl.startsWith('data:')) {
      // Base64 data URL, need to upload
      const uploadedUrl = await getOrUploadImageUrl(cardName, cardImageUrl, onImageUploaded);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        // If upload failed, fallback to copying to clipboard
        try {
          await copyImageAndText({ cardName, cardImageUrl });
          onImageCopied?.('Twitter/X');
        } catch (clipboardError) {
          console.warn('Failed to copy image to clipboard:', clipboardError);
        }
      }
    }
  }
  
  // If we have a public image URL, include it in the tweet
  if (imageUrl) {
    shareText += ` ${imageUrl}`;
  }
  
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  window.open(url, '_blank', 'width=550,height=420');
};

export const shareOnFacebook = async ({ cardName, cardImageUrl, publicImageUrl, onImageCopied, onImageUploaded }: ShareOptions) => {
  let shareText = `Check out this AI-generated Pokémon card by Cardex: https://cardex.xavidop.me`;
  let shareUrl = 'https://cardex.xavidop.me';
  
  // If we have an image, try to get or upload it to get a public URL
  let imageUrl = publicImageUrl;
  if (!imageUrl && cardImageUrl) {
    if (cardImageUrl.startsWith('http')) {
      // Already a Firebase Storage URL, use directly
      imageUrl = cardImageUrl;
      shareUrl = imageUrl; // Use the image URL as the main share URL for better preview
    } else if (cardImageUrl.startsWith('data:')) {
      // Base64 data URL, need to upload
      const uploadedUrl = await getOrUploadImageUrl(cardName, cardImageUrl, onImageUploaded);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        shareUrl = imageUrl; // Use the image URL as the main share URL for better preview
      } else {
        // If upload failed, fallback to copying to clipboard
        try {
          await copyImageAndText({ cardName, cardImageUrl });
          onImageCopied?.('Facebook');
        } catch (clipboardError) {
          console.warn('Failed to copy image to clipboard:', clipboardError);
        }
      }
    }
  } else if (imageUrl) {
    shareUrl = imageUrl;
  }
  
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
  window.open(url, '_blank', 'width=580,height=296');
};

export const shareOnLinkedIn = async ({ cardName, cardImageUrl, publicImageUrl, onImageCopied, onImageUploaded }: ShareOptions) => {
  let shareText = `Check out this AI-generated Pokémon card by Cardex: https://cardex.xavidop.me`;
  let shareUrl = 'https://cardex.xavidop.me';
  
  // If we have an image, try to get or upload it to get a public URL
  let imageUrl = publicImageUrl;
  if (!imageUrl && cardImageUrl) {
    if (cardImageUrl.startsWith('http')) {
      // Already a Firebase Storage URL, use directly
      imageUrl = cardImageUrl;
      shareUrl = imageUrl; // Use the image URL as the main share URL for better preview
    } else if (cardImageUrl.startsWith('data:')) {
      // Base64 data URL, need to upload
      const uploadedUrl = await getOrUploadImageUrl(cardName, cardImageUrl, onImageUploaded);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        shareUrl = imageUrl; // Use the image URL as the main share URL for better preview
      } else {
        // If upload failed, fallback to copying to clipboard
        try {
          await copyImageAndText({ cardName, cardImageUrl });
          onImageCopied?.('LinkedIn');
        } catch (clipboardError) {
          console.warn('Failed to copy image to clipboard:', clipboardError);
        }
      }
    }
  } else if (imageUrl) {
    shareUrl = imageUrl;
  }
  
  const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`AI-Generated Pokémon Card: ${cardName}`)}&summary=${encodeURIComponent(shareText)}&source=Cardex`;
  window.open(url, '_blank', 'width=520,height=570');
};

export const copyShareLink = ({ cardName }: ShareOptions) => {
  const text = `Check out this AI-generated Pokémon card by Cardex: https://cardex.xavidop.me`;
  navigator.clipboard.writeText(text);
};

// Native share API for mobile devices
export const nativeShare = async ({ cardName, cardImageUrl }: ShareOptions) => {
  if (navigator.share) {
    try {
      const shareData: ShareData = {
        title: `AI-Generated Pokémon Card`,
        text: `Check out this AI-generated Pokémon card by Cardex: https://cardex.xavidop.me`,
        url: 'https://cardex.xavidop.me',
      };

      // If we have an image and the browser supports file sharing
      if (cardImageUrl && navigator.canShare) {
        try {
          // Convert data URL or Firebase Storage URL to blob
          const response = await fetch(cardImageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${cardName}-card.png`, { type: 'image/png' });
          
          // Check if we can share files
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (error) {
          console.warn('Failed to add image to share:', error);
        }
      }

      await navigator.share(shareData);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  return false;
};
