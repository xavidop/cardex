'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getCardById, generateVideoForExistingCard } from '@/lib/firestore';
import type { PokemonCard } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertTriangle, 
  Download, 
  FileDown, 
  Play, 
  Pause, 
  Video, 
  Clock, 
  RotateCcw,
  Pencil, 
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { downloadCardImage, downloadCardVideo } from '@/utils/downloadUtils';
import ShareButton from '@/components/ui/share-button';

export default function CardDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }
    
    if (user && cardId) {
      setLoading(true);
      setError(null);
      getCardById(user.uid, cardId)
        .then(fetchedCard => {
          if (fetchedCard) {
            setCard(fetchedCard);
          } else {
            setError('Card not found or you do not have permission to view it.');
            toast({ title: "Error", description: "Card not found.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Error fetching card:", err);
          setError((err as Error).message || 'Failed to load card details.');
          toast({ title: "Error", description: "Failed to load card details.", variant: "destructive" });
        })
        .finally(() => setLoading(false));
    }
  }, [user, cardId, router, toast, authLoading]);

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

  const handleGenerateVideo = async () => {
    if (!card?.id) return;
    
    setIsGeneratingVideo(true);
    
    // Update the card status locally to show the banner
    setCard(prev => prev ? { ...prev, videoGenerationStatus: 'generating' } : null);
    
    try {
      await generateVideoForExistingCard(card.userId, card.id);
      toast({
        title: 'Video Generation Started',
        description: `Video generation for ${card.name} has been started. This may take a few minutes.`,
      });
    } catch (error) {
      console.error('Video generation error:', error);
      toast({
        title: 'Video Generation Failed',
        description: 'Failed to start video generation. Please try again.',
        variant: 'destructive',
      });
      
      // Revert the status if there was an error
      setCard(prev => prev ? { ...prev, videoGenerationStatus: 'failed' } : null);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const getVideoStatusBadge = () => {
    if (!card?.videoGenerationStatus || card.videoGenerationStatus === 'pending') return null;
    
    const statusConfig = {
      generating: { icon: Clock, text: 'Generating Video...', variant: 'secondary' as const },
      completed: { 
        icon: Video, 
        text: isVideoReady() ? 'Live Video Ready' : 'Video Processing...', 
        variant: 'default' as const 
      },
      failed: { icon: AlertCircle, text: 'Video Failed', variant: 'destructive' as const },
    };
    
    const config = statusConfig[card.videoGenerationStatus];
    if (!config) return null;
    
    const { icon: Icon, text, variant } = config;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
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
        <Button onClick={() => router.push('/dashboard/collection')} className="mt-4">
          Back to Collection
        </Button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">Card not found</h2>
        <Button onClick={() => router.push('/dashboard/collection')}>
          Back to Collection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/collection')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{card.name}</h1>
            <p className="text-muted-foreground">Set: {card.set} | Rarity: {card.rarity}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {card.isGenerated && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
              <Sparkles className="h-3 w-3" />
              AI Generated
            </Badge>
          )}
          {getVideoStatusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Display */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="relative w-full max-w-[400px] mx-auto aspect-[63/88]">
              {showVideo && card.videoUrl ? (
                <div className="relative w-full h-full">
                  {card.videoUrl.includes('firebasestorage.googleapis.com') || 
                   card.videoUrl.includes('firebaseapp.com') || 
                   card.videoUrl.includes('googleapis.com/storage') ||
                   card.videoUrl.includes('localhost:9199') ? (
                    <video
                      src={card.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain rounded-lg shadow-lg"
                      onError={() => {
                        console.error('Video playback error for Firebase URL:', card.videoUrl);
                        setShowVideo(false);
                      }}
                    />
                  ) : card.videoUrl.startsWith('data:video/') || !card.videoUrl.startsWith('http') ? (
                    <video
                      src={card.videoUrl.startsWith('data:') ? card.videoUrl : `data:video/mp4;base64,${card.videoUrl}`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain rounded-lg shadow-lg"
                      onError={() => {
                        console.error('Video playback error for base64 data');
                        setShowVideo(false);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center text-sm text-gray-600">
                        <p>Video processing in progress...</p>
                        <p className="text-xs mt-1">Please refresh in a moment</p>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="default"
                    size="lg"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white border-2 border-white/50 shadow-2xl backdrop-blur-sm"
                    onClick={() => setShowVideo(false)}
                  >
                    <Pause className="h-6 w-6 mr-2" />
                    Pause Video
                  </Button>
                </div>
              ) : (
                <>
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    className="object-contain rounded-lg shadow-lg"
                    data-ai-hint="pokemon card"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {isVideoReady() && (
                    <Button
                      variant="default"
                      size="lg"
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white border-2 border-white/50 shadow-2xl backdrop-blur-sm"
                      onClick={() => setShowVideo(true)}
                    >
                      <Play className="h-6 w-6 mr-2" />
                      Play Video
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Actions & Info */}
        <div className="space-y-6">
          {/* Video Generation Status */}
          {card.videoGenerationStatus === 'generating' && (
            <Card className="bg-blue-50 border border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      Generating Video...
                    </h3>
                    <p className="text-xs text-blue-600 mt-1">
                      This may take a few minutes. The page will refresh automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Download, edit, or generate video for your card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Download Card */}
              <Button 
                variant="outline" 
                onClick={handleDownloadCard}
                disabled={!card.imageUrl}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Card Image
              </Button>

              {/* Download Video */}
              {isVideoReady() && (
                <Button 
                  variant="outline" 
                  onClick={handleDownloadVideo}
                  className="w-full border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Video
                </Button>
              )}

              {/* Generate Video */}
              {!card.videoUrl && card.videoGenerationStatus !== 'generating' && (
                <Button 
                  variant="outline" 
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {isGeneratingVideo ? 'Starting...' : 'Make Card Live'}
                </Button>
              )}
              
              {/* Retry Video Generation */}
              {card.videoGenerationStatus === 'failed' && (
                <Button 
                  variant="outline" 
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="w-full border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isGeneratingVideo ? 'Starting...' : 'Retry Video Generation'}
                </Button>
              )}

              {/* Edit Card */}
              <Button variant="outline" asChild className="w-full">
                <Link href={`/dashboard/collection/${card.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Card
                </Link>
              </Button>

              {/* Share Card */}
              {card.isGenerated && (
                <ShareButton 
                  cardName={card.name}
                  cardImageUrl={card.imageUrl}
                  variant="outline"
                  size="default"
                  className="w-full"
                  showText={true}
                />
              )}
            </CardContent>
          </Card>

          {/* Card Information */}
          <Card>
            <CardHeader>
              <CardTitle>Card Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Set:</span>
                  <p>{card.set}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Rarity:</span>
                  <p>{card.rarity}</p>
                </div>
                {card.isGenerated && (
                  <>
                    <div>
                      <span className="font-medium text-muted-foreground">Type:</span>
                      <p>AI Generated</p>
                    </div>
                    {card.isPhotoGenerated && (
                      <div>
                        <span className="font-medium text-muted-foreground">Source:</span>
                        <p>Photo-based</p>
                      </div>
                    )}
                  </>
                )}
                {card.videoUrl && (
                  <div className="col-span-2">
                    <span className="font-medium text-muted-foreground">Video Status:</span>
                    <p className="flex items-center gap-2 mt-1">
                      {getVideoStatusBadge()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
