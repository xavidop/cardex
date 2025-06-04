'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCardById, updateCardInCollection } from '@/lib/firestore';
import type { PokemonCard } from '@/types';
import CardForm, { type CardFormInputs } from '@/components/cards/CardForm';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

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
      const updatedData: Partial<PokemonCard> = {
        name: data.name,
        set: data.set,
        rarity: data.rarity,
        // imageDataUrl is part of CardFormInputs but might not change if not re-uploaded
        // For simplicity, we assume imageDataUrl is handled if it's part of the form
        // and if image upload was part of the edit form (which it isn't currently for simplicity)
        // For this schema, imageDataUrl is part of CardFormInputs, so it will be included.
        // If image editing is not part of this form, ensure data.imageDataUrl is the original one.
        imageDataUrl: data.imageDataUrl, 
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
      <h1 className="text-3xl font-bold mb-8 text-center font-headline">Edit Card: {card.name}</h1>
      <CardForm
        initialData={card}
        onSubmit={handleUpdateCard}
        isSubmitting={isSubmitting}
        submitButtonText="Save Changes"
        formTitle="Update Card Information"
        formDescription="Modify the details of your Pokémon card."
        onCancel={() => router.push('/dashboard/collection')}
      />
    </div>
  );
}
