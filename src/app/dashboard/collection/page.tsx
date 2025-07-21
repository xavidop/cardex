'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserCards, deleteCardFromCollection } from '@/lib/firestore';
import type { PokemonCard } from '@/types';
import CardItem from '@/components/cards/CardItem';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CollectionPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCards();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const userCards = await getUserCards(user.uid);
      setCards(userCards);
    } catch (e) {
      console.error("Error fetching cards:", e);
      setError((e as Error).message || 'Failed to load your collection. Please try again.');
      toast({ title: "Error", description: "Failed to load collection.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!user) return;
    setDeletingCardId(cardId);
    try {
      await deleteCardFromCollection(user.uid, cardId);
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      toast({ title: "Card Deleted", description: "The card has been removed from your collection." });
    } catch (e) {
      console.error("Error deleting card:", e);
      toast({ title: "Error", description: "Failed to delete card.", variant: "destructive" });
    } finally {
      setDeletingCardId(null);
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
        <h2 className="text-xl font-semibold mb-2">Error Loading Collection</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={fetchCards}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">My Card Collection</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/generate">
              <Sparkles className="mr-2 h-5 w-5" /> Generate Card
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/scan">
              <PlusCircle className="mr-2 h-5 w-5" /> Scan Card
            </Link>
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-archive-restore mx-auto mb-4 text-muted-foreground"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-V8"/><path d="M9.5 12.5 12 15l2.5-2.5"/><path d="M12 15V9"/></svg>
          <h2 className="text-xl font-semibold text-muted-foreground">Your collection is empty.</h2>
          <p className="text-muted-foreground mt-2">Start by scanning or generating your first Pokémon card!</p>
          <div className="flex gap-2 justify-center mt-6">
            <Button asChild variant="outline">
              <Link href="/dashboard/generate">
                <Sparkles className="mr-2 h-5 w-5" /> Generate a Card
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/scan">
                <PlusCircle className="mr-2 h-5 w-5" /> Scan a Card
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {cards.map(card => (
            <CardItem 
              key={card.id} 
              card={card} 
              onDelete={handleDeleteCard} 
              isDeleting={deletingCardId === card.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
