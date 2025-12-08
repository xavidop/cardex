'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TCGCardGenerator } from '@/components/cards/TCGCardGenerator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { addCardToCollection } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { compressBase64Image, getBase64Size, formatBytes } from '@/utils/imageUtils';
import { parseGenerationParams } from '@/utils/generationParamsUtils';
import { getGameConfig } from '@/config/tcg-games';
import type { TCGGame, CardGenerationParams, GeneratedCard } from '@/types';
import Image from 'next/image';

export default function EditGenerateCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [generatedCard, setGeneratedCard] = useState<(GeneratedCard & { params?: CardGenerationParams }) | null>(null);
  const [originalCard, setOriginalCard] = useState<{ id: string; name: string; imageUrl: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<CardGenerationParams> | undefined>(undefined);
  const [showComparison, setShowComparison] = useState(true);
  const [currentGame, setCurrentGame] = useState<TCGGame>('pokemon');

  useEffect(() => {
    // Parse parameters from URL search params
    const params = parseGenerationParams(searchParams);
    setInitialValues(params);
    
    // Set the game from params
    if (params.game) {
      setCurrentGame(params.game as TCGGame);
    }
    
    // Extract original card data
    const originalCardId = searchParams.get('originalCardId');
    const originalCardName = searchParams.get('originalCardName');
    const originalCardImageUrl = searchParams.get('originalCardImageUrl');
    
    if (originalCardId && originalCardName && originalCardImageUrl) {
      setOriginalCard({
        id: originalCardId,
        name: originalCardName,
        imageUrl: originalCardImageUrl,
      });
    }
  }, [searchParams]);

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
      
      const game = generatedCard.params?.game || currentGame;
      const gameName = getGameConfig(game as TCGGame).name;
      
      await addCardToCollection(user.uid, {
        name: `Generated ${gameName} Card`,
        set: 'AI Generated',
        rarity: 'Special',
        game: game,
        imageDataUrl: imageDataUrl,
        isGenerated: true,
        prompt: generatedCard.prompt,
        generationParams: generatedCard.params,
      });

      toast({
        title: 'Card Saved',
        description: `Your generated ${gameName} card has been added to your collection!`,
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

  if (initialValues === undefined) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit {getGameConfig(currentGame).name} Card Generator</h1>
        <p className="text-muted-foreground">
          Modify your {getGameConfig(currentGame).name} card parameters and regenerate the card
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section - Takes up 2 columns */}
        <div className="xl:col-span-2">
          <TCGCardGenerator onCardGenerated={handleCardGenerated} initialValues={initialValues} />
        </div>

        {/* Card Preview Section - Takes up 1 column */}
        <div className="xl:col-span-1">
          <div className="sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Card Preview</h2>
              {generatedCard && originalCard && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant={showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(true)}
                  >
                    Compare
                  </Button>
                  <Button
                    variant={!showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(false)}
                  >
                    New Only
                  </Button>
                </div>
              )}
            </div>
            {generatedCard && originalCard ? (
              showComparison ? (
                /* Show comparison when both cards exist and comparison is enabled */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <span>Comparison</span>
                    </CardTitle>
                    <CardDescription className="text-center">
                      Compare your original card with the newly generated one
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Original Card */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">Original Card</h4>
                      <div className="relative w-full max-w-xs mx-auto">
                        <Image
                          src={originalCard.imageUrl}
                          alt={originalCard.name}
                          width={200}
                          height={280}
                          className="w-full h-auto rounded-lg shadow-md border"
                        />
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="flex items-center justify-center">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-3 text-sm font-medium text-muted-foreground bg-background">VS</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                    
                    {/* New Generated Card */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">New Generated Card</h4>
                      <div className="relative w-full max-w-xs mx-auto">
                        <Image
                          src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                          alt="Generated Pokemon Card"
                          width={200}
                          height={280}
                          className="w-full h-auto rounded-lg shadow-md border"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSaveToCollection} 
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? 'Saving...' : 'Save New Card to Collection'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Show only new card when comparison is disabled */
                <Card>
                  <CardHeader>
                    <CardTitle>New Generated Card</CardTitle>
                    <CardDescription>
                      Your updated Pokemon card is ready!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full max-w-sm mx-auto">
                      <Image
                        src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                        alt="Generated Pokemon Card"
                        width={300}
                        height={420}
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveToCollection} 
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? 'Saving...' : 'Save New Card to Collection'}
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : generatedCard ? (
              /* Show only new card if no original */
              <Card>
                <CardHeader>
                  <CardTitle>New Generated Card</CardTitle>
                  <CardDescription>
                    Your updated Pokemon card is ready!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full max-w-sm mx-auto">
                    <Image
                      src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                      alt="Generated Pokemon Card"
                      width={300}
                      height={420}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveToCollection} 
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? 'Saving...' : 'Save to Collection'}
                  </Button>
                </CardContent>
              </Card>
            ) : originalCard ? (
              /* Show only original card */
              <Card>
                <CardHeader>
                  <CardTitle>Original Card</CardTitle>
                  <CardDescription>
                    {originalCard.name} - This card will be replaced when you generate a new one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full max-w-sm mx-auto">
                    <Image
                      src={originalCard.imageUrl}
                      alt={originalCard.name}
                      width={300}
                      height={420}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* No cards available */
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <p>Generate a new card to see it here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
