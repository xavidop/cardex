'use client';

import { useState } from 'react';
import { CardGenerator } from '@/components/cards/CardGenerator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { addCardToCollection } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { compressBase64Image, getBase64Size, formatBytes } from '@/utils/imageUtils';
import ApiKeysWarning from '@/components/cards/ApiKeysWarning';

export default function GenerateCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
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
      let imageDataUrl = `data:image/jpeg;base64,${generatedCard.imageBase64}`;
      
      // Check image size and compress if needed
      const originalSize = getBase64Size(generatedCard.imageBase64);
      console.log(`Original image size: ${formatBytes(originalSize)}`);
      
      // Firestore has a 1MB limit for document fields, so compress if needed
      if (originalSize > 800000) { // 800KB threshold to be safe
        console.log('Image is too large, compressing...');
        try {
          // Try first level compression
          let compressedBase64 = await compressBase64Image(generatedCard.imageBase64, 400, 560, 0.7);
          let compressedSize = getBase64Size(compressedBase64);
          console.log(`Compressed image size (first attempt): ${formatBytes(compressedSize)}`);
          
          // If still too large, compress more aggressively
          if (compressedSize > 800000) {
            console.log('Still too large, applying aggressive compression...');
            compressedBase64 = await compressBase64Image(generatedCard.imageBase64, 300, 420, 0.5);
            compressedSize = getBase64Size(compressedBase64);
            console.log(`Final compressed image size: ${formatBytes(compressedSize)}`);
          }
          
          imageDataUrl = `data:image/jpeg;base64,${compressedBase64}`;
        } catch (compressionError) {
          console.error('Error compressing image:', compressionError);
          // Fall back to original image
        }
      }
      
      await addCardToCollection(user.uid, {
        name: 'Generated Pokemon Card',
        set: 'AI Generated',
        rarity: 'Special',
        imageDataUrl: imageDataUrl,
        isGenerated: true,
        prompt: generatedCard.prompt,
        generationParams: generatedCard.params,
      });

      toast({
        title: 'Card Saved',
        description: 'Your generated Pokemon card has been added to your collection!',
      });

      // Clear the generated card after saving
      setGeneratedCard(null);
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
        <h1 className="text-3xl font-bold mb-2">Pokemon Card Generator</h1>
        <p className="text-muted-foreground">
          Create your own custom Pokemon cards using AI-powered image generation
        </p>
      </div>

      {/* API Keys Warning - only show Gemini key warning for this page */}
      <div className="mb-6">
        <ApiKeysWarning 
          requiredKeys={['geminiApiKey']} 
          showDismiss={false}
        />
      </div>

      <CardGenerator onCardGenerated={handleCardGenerated} />

      {generatedCard && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Save Your Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Love your generated card? Save it to your collection!
            </p>
            <Button 
              onClick={handleSaveToCollection} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save to Collection'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
