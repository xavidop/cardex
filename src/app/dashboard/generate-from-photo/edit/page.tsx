'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PhotoCardGeneratorFormOnly } from '@/components/cards/PhotoCardGeneratorFormOnly';
import { addCardToCollection } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { compressBase64Image, getBase64Size, formatBytes } from '@/utils/imageUtils';
import { parsePhotoGenerationParams } from '@/utils/generationParamsUtils';
import { getGameConfig } from '@/config/tcg-games';
import type { GenerateFromPhotoInput } from '@/components/cards/PhotoCardGeneratorFormOnly';
import type { TCGGame, PhotoCardGenerationParams, GeneratedCard } from '@/types';
import Image from 'next/image';

export default function EditGenerateFromPhotoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatedCard, setGeneratedCard] = useState<(GeneratedCard & { params?: GenerateFromPhotoInput }) | null>(null);
  const [originalCard, setOriginalCard] = useState<{ id: string; name: string; imageUrl: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<GenerateFromPhotoInput> | undefined>(undefined);
  const [showComparison, setShowComparison] = useState(true);
  const [currentGame, setCurrentGame] = useState<TCGGame>('pokemon');

  useEffect(() => {
    // Parse parameters from URL search params
    const params = parsePhotoGenerationParams(searchParams);
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
      
      const game = generatedCard.params?.game || currentGame;
      const gameName = getGameConfig(game as TCGGame).name;
      
      // Exclude photoDataUri from params when saving to Firestore (too large for document storage)
      const { photoDataUri, ...paramsWithoutPhoto } = generatedCard.params || {};
      
      await addCardToCollection(user.uid, {
        name: `Photo-Generated ${gameName} Card`,
        set: 'AI Photo Generated',
        rarity: 'Photo Special',
        game: game,
        imageDataUrl: finalImageDataUrl,
        isGenerated: true,
        isPhotoGenerated: true,
        prompt: generatedCard.prompt,
        photoGenerationParams: paramsWithoutPhoto as PhotoCardGenerationParams,
      });

      toast({
        title: 'Card Saved',
        description: `Your photo-generated ${gameName} card has been added to your collection!`,
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

  if (initialValues === undefined) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit {getGameConfig(currentGame).name} Card Generator from Photo</h1>
        <p className="text-muted-foreground">
          Modify your photo-based {getGameConfig(currentGame).name} card parameters and regenerate the card
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section - Takes up 2 columns */}
        <div className="xl:col-span-2">
          <PhotoCardGeneratorFormOnly onCardGenerated={handleCardGenerated} initialValues={initialValues} />
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
                    
                    <Button onClick={handleSaveToCollection} disabled={isSaving} className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving to Collection...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save New Card to Collection
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Show only new card when comparison is disabled */
                <Card>
                  <CardHeader>
                    <CardTitle>New Generated Card</CardTitle>
                    <CardDescription>
                      Your updated photo-inspired Pokemon card is ready!
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
                    <Button onClick={handleSaveToCollection} disabled={isSaving} className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving to Collection...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save New Card to Collection
                        </>
                      )}
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
                    Your updated photo-inspired Pokemon card is ready!
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
                  <Button onClick={handleSaveToCollection} disabled={isSaving} className="w-full">
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
