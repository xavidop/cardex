'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PhotoCardGenerator } from '@/components/cards/PhotoCardGenerator';
import { addCardToCollection } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { compressBase64Image, getBase64Size, formatBytes } from '@/utils/imageUtils';
import ApiKeysWarning from '@/components/cards/ApiKeysWarning';

export default function GenerateFromPhotoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [generatedCard, setGeneratedCard] = useState<{ imageBase64: string; prompt: string; params?: any } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCardGenerated = (imageBase64: string, prompt: string, params: any) => {
    setGeneratedCard({ imageBase64, prompt, params });
  };

  const handleSaveToCollection = async () => {
    if (!user || !generatedCard) return;

    setIsSaving(true);
    try {
      // Convert base64 to data URL
      const originalImageDataUrl = `data:image/jpeg;base64,${generatedCard.imageBase64}`;
      
      // Check original size
      const originalSize = getBase64Size(generatedCard.imageBase64);
      console.log(`Original image size: ${formatBytes(originalSize)}`);
      
      // Compress the image if it's too large (> 800KB to leave some buffer)
      let finalImageDataUrl = originalImageDataUrl;
      if (originalSize > 800 * 1024) {
        console.log('Compressing image for Firestore storage...');
        try {
          finalImageDataUrl = await compressBase64Image(originalImageDataUrl, 400, 560, 0.7);
          const compressedSize = getBase64Size(finalImageDataUrl.split(',')[1]);
          console.log(`Compressed image size: ${formatBytes(compressedSize)}`);
          
          // If still too large, compress more aggressively
          if (compressedSize > 800 * 1024) {
            console.log('Further compressing image...');
            finalImageDataUrl = await compressBase64Image(originalImageDataUrl, 300, 420, 0.5);
            const finalSize = getBase64Size(finalImageDataUrl.split(',')[1]);
            console.log(`Final compressed size: ${formatBytes(finalSize)}`);
          }
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
          // If compression fails, we'll try with the original and let Firestore handle the error
        }
      }
      
      // Exclude photoDataUri from params when saving to Firestore (too large for document storage)
      const { photoDataUri, ...paramsWithoutPhoto } = generatedCard.params;
      
      await addCardToCollection(user.uid, {
        name: 'Photo-Generated Pokemon Card',
        set: 'AI Photo Generated',
        rarity: 'Photo Special',
        imageDataUrl: finalImageDataUrl,
        isGenerated: true,
        isPhotoGenerated: true,
        prompt: generatedCard.prompt,
        photoGenerationParams: paramsWithoutPhoto,
      });

      toast({
        title: 'Card Saved',
        description: 'Your photo-generated Pokemon card has been added to your collection!',
      });

      // Clear the generated card after saving
      setGeneratedCard(null);
      router.push('/dashboard/collection');
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: 'Error',
        description: 'Failed to save card to collection. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pokemon Card Generator from Photo</h1>
        <p className="text-muted-foreground">
          Upload your own photo and transform it into a custom Pokemon card using AI-powered image generation
        </p>
      </div>

      {/* API Keys Warning - only show OpenAI key warning for this page */}
      <div className="mb-6">
        <ApiKeysWarning 
          requiredKeys={['openaiApiKey']} 
          showDismiss={false}
        />
      </div>

      <PhotoCardGenerator onCardGenerated={handleCardGenerated} />

      {generatedCard && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Save Your Card</CardTitle>
            <CardDescription>
              Your photo-inspired Pokemon card is ready! Save it to your collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSaveToCollection} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving to Collection...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save to Collection
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
