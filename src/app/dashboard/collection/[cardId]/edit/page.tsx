'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCardById, updateCardInCollection } from '@/lib/firestore';
import type { PokemonCard } from '@/types';
import CardForm, { type CardFormInputs } from '@/components/cards/CardForm';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Download, FileDown } from 'lucide-react';
import { downloadCardImage, downloadCardVideo } from '@/utils/downloadUtils';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/ui/share-button';
import { serializeGenerationParams, serializePhotoGenerationParams } from '@/utils/generationParamsUtils';

export default function EditCardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) return;
    
    // Redirect if no user
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Only fetch card if we have user and cardId
    if (user && cardId) {
      setLoading(true);
      setError(null);
      getCardById(user.uid, cardId)
        .then(fetchedCard => {
          if (fetchedCard) {
            setCard(fetchedCard);
            
            // Check if this is an AI-generated card and redirect to appropriate generator
            if (fetchedCard.isGenerated) {
              if (fetchedCard.isPhotoGenerated && fetchedCard.photoGenerationParams) {
                // Redirect to photo generator with parameters
                const params = serializePhotoGenerationParams(fetchedCard.photoGenerationParams);
                // Add original card data
                params.append('originalCardId', fetchedCard.id);
                params.append('originalCardName', fetchedCard.name);
                params.append('originalCardImageUrl', fetchedCard.imageUrl);
                router.replace(`/dashboard/generate-from-photo/edit?${params.toString()}`);
                return;
              } else if (fetchedCard.generationParams) {
                // Redirect to regular generator with parameters
                const params = serializeGenerationParams(fetchedCard.generationParams);
                // Add original card data
                params.append('originalCardId', fetchedCard.id);
                params.append('originalCardName', fetchedCard.name);
                params.append('originalCardImageUrl', fetchedCard.imageUrl);
                router.replace(`/dashboard/generate/edit?${params.toString()}`);
                return;
              } else {
                // AI-generated card but no parameters stored - show a message
                toast({ 
                  title: "Unable to Edit", 
                  description: "This AI-generated card was created before parameter storage was implemented. Please generate a new card.",
                  variant: "destructive" 
                });
                router.replace('/dashboard/collection');
                return;
              }
            }
          } else {
            setError('Card not found or you do not have permission to edit it.');
            toast({ title: "Error", description: "Card not found.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Error fetching card for edit:", err);
          setError((err as Error).message || 'Failed to load card details.');
          toast({ title: "Error", description: "Failed to load card details.", variant: "destructive" });
        })
        .finally(() => setLoading(false));
    }
  }, [user, cardId, router, toast, authLoading]); // Removed 'loading' from dependencies

  const handleUpdateCard = async (data: CardFormInputs) => {
    if (!user || !card) return;

    setIsSubmitting(true);
    try {
      const updatedData = {
        name: data.name,
        set: data.set,
        rarity: data.rarity,
        // Only include imageDataUrl if it's different from the original imageUrl
        // This allows the backend to determine if a new image upload is needed
        ...(data.imageDataUrl !== card.imageUrl && { imageDataUrl: data.imageDataUrl })
      };
      await updateCardInCollection(user.uid, card.id, updatedData);
      toast({ title: 'Card Updated', description: `${data.name} has been updated.` });
      router.push('/dashboard/collection');
    } catch (e) {
      console.error('Error updating card:', e);
      const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred while updating.';
      toast({ title: 'Update Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!card) return;
    
    try {
      await downloadCardImage(card.imageUrl, card.name);
      toast({
        title: 'Download Started',
        description: `${card.name} is being downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the card. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadVideo = async () => {
    if (!card?.videoUrl) return;
    
    try {
      await downloadCardVideo(card.videoUrl, card.name);
      toast({
        title: 'Video Download Started',
        description: `${card.name} video is being downloaded.`,
      });
    } catch (error) {
      console.error('Video download error:', error);
      toast({
        title: 'Video Download Failed',
        description: 'Failed to download the video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to check if video is ready for playback
  const isVideoReady = () => {
    return card?.videoUrl && (
      card.videoGenerationStatus === 'completed' || 
      card.videoUrl.includes('firebasestorage.googleapis.com') || 
      card.videoUrl.includes('firebaseapp.com') || 
      card.videoUrl.includes('googleapis.com/storage') ||
      card.videoUrl.includes('localhost:9199') // Support emulator URLs
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Card</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!card) {
     // This case should ideally be covered by error state, but as a fallback:
    return <div className="text-center py-10">Card not found.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center font-headline">Edit Card: {card.name}</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleDownloadCard}
            disabled={!card.imageUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Card
          </Button>
          {isVideoReady() && (
            <Button 
              variant="outline"
              onClick={handleDownloadVideo}
              className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Video
            </Button>
          )}
          {card.isGenerated && (
            <ShareButton 
              cardName={card.name}
              cardImageUrl={card.imageUrl}
              variant="outline"
              size="default"
              showText={true}
            />
          )}
        </div>
      </div>
      <CardForm
        initialData={card}
        onSubmit={handleUpdateCard}
        isSubmitting={isSubmitting}
        submitButtonText="Save Changes"
        formTitle="Update Card Information"
        formDescription="Modify the details of your TCG card."
        onCancel={() => router.push('/dashboard/collection')}
      />
    </div>
  );
}
