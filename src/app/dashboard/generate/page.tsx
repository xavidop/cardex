'use client';

import { useState } from 'react';
import { CardGenerator } from '@/components/cards/CardGenerator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { addCardToCollection } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GenerateCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatedCard, setGeneratedCard] = useState<{ imageBase64: string; prompt: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCardGenerated = (imageBase64: string, prompt: string) => {
    setGeneratedCard({ imageBase64, prompt });
  };

  const handleSaveToCollection = async () => {
    if (!user || !generatedCard) return;

    setIsSaving(true);
    try {
      // Convert base64 to data URL
      const imageDataUrl = `data:image/jpeg;base64,${generatedCard.imageBase64}`;
      
      await addCardToCollection(user.uid, {
        name: 'Generated Pokemon Card',
        set: 'AI Generated',
        rarity: 'Special',
        imageDataUrl: imageDataUrl,
        isGenerated: true,
        prompt: generatedCard.prompt,
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
