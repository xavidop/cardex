'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserCards, deleteCardFromCollection } from '@/lib/firestore';
import type { PokemonCard } from '@/types';
import CardItem from '@/components/cards/CardItem';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, AlertTriangle, Sparkles, Camera, RefreshCw } from 'lucide-react';
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

  // Set up periodic refresh for cards that are generating videos
  useEffect(() => {
    const hasGeneratingVideos = cards.some(card => card.videoGenerationStatus === 'generating');
    
    if (!hasGeneratingVideos) return;

    console.log('Setting up automatic refresh for video generation...');
    const interval = setInterval(() => {
      console.log('Refreshing cards to check for video generation updates...');
      fetchCards();
    }, 10000); // Check every 10 seconds (more frequent for better UX)

    return () => {
      console.log('Clearing automatic refresh interval');
      clearInterval(interval);
    };
  }, [cards, user]);

  const fetchCards = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const userCards = await getUserCards(user.uid);
      
      // Check for video generation status changes (only for background updates)
      userCards.forEach(newCard => {
        const existingCard = cards.find(c => c.id === newCard.id);
        if (existingCard) {
          // Only show notifications for status changes from database updates (not manual updates)
          if (existingCard.videoGenerationStatus === 'generating' && 
              newCard.videoGenerationStatus === 'completed' && 
              newCard.videoUrl) {
            toast({
              title: 'Video Ready!',
              description: `Your video for ${newCard.name} is now available.`,
            });
          }
          else if (existingCard.videoGenerationStatus === 'generating' && 
                   newCard.videoGenerationStatus === 'failed') {
            toast({
              title: 'Video Generation Failed',
              description: `Failed to generate video for ${newCard.name}. You can try again.`,
              variant: 'destructive',
            });
          }
        }
      });
      
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

  const handleUpdateCard = (updatedCard: PokemonCard) => {
    setCards(prevCards => {
      const updated = prevCards.map(card => {
        if (card.id === updatedCard.id) {
          const oldStatus = card.videoGenerationStatus;
          const newStatus = updatedCard.videoGenerationStatus;
          
          // Check if video generation status changed to completed
          if (oldStatus === 'generating' && 
              newStatus === 'completed' && 
              updatedCard.videoUrl) {
            toast({
              title: 'Video Ready!',
              description: `Your video for ${updatedCard.name} is now available.`,
            });
          }
          // Check if video generation failed
          else if (oldStatus === 'generating' && 
                   newStatus === 'failed') {
            toast({
              title: 'Video Generation Failed',
              description: `Failed to generate video for ${updatedCard.name}. You can try again.`,
              variant: 'destructive',
            });
          }
          // Show immediate feedback when generation starts
          else if (!oldStatus && newStatus === 'generating') {
            toast({
              title: 'Video Generation Started',
              description: `Generating video for ${updatedCard.name}. This page will refresh automatically.`,
            });
          }
          
          return updatedCard;
        }
        return card;
      });
      return updated;
    });
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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">My Card Collection</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchCards}
            disabled={loading}
            className="opacity-70 hover:opacity-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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

      {/* Video Generation Status Banner */}
      {(() => {
        const generatingVideos = cards.filter(card => card.videoGenerationStatus === 'generating');
        if (generatingVideos.length > 0) {
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Generating {generatingVideos.length} video{generatingVideos.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-blue-700">
                    {generatingVideos.map(card => card.name).join(', ')} - This page will refresh automatically
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

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
            <Button asChild variant="outline">
              <Link href="/dashboard/generate-from-photo">
                <Camera className="mr-2 h-5 w-5" /> Photo Card
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map(card => (
            <CardItem 
              key={card.id} 
              card={card} 
              onDelete={handleDeleteCard} 
              onUpdate={handleUpdateCard}
              isDeleting={deletingCardId === card.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
