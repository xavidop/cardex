'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Sparkles, Download, Play, Pause, Video, Clock, AlertCircle, RotateCcw, FileDown, Eye, Settings } from 'lucide-react';
import type { PokemonCard, TCGGame } from '@/types';
import { downloadCardImage, downloadCardVideo } from '@/utils/downloadUtils';
import { useToast } from '@/hooks/use-toast';
import ShareButton from '@/components/ui/share-button';
import { useState } from 'react';
import { generateVideoForExistingCard } from '@/lib/firestore';
import { useApiKeys } from '@/hooks/useApiKeys';
import { getGameConfig } from '@/config/tcg-games';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CardItemProps {
  card: PokemonCard;
  onDelete: (cardId: string) => void;
  onUpdate?: (updatedCard: PokemonCard) => void;
  isDeleting: boolean;
}

export default function CardItem({ card, onDelete, onUpdate, isDeleting }: CardItemProps) {
  const { toast } = useToast();
  const { hasGeminiKey } = useApiKeys();
  const [showVideo, setShowVideo] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Helper function to check if video is ready for playback
  const isVideoReady = () => {
    return card.videoUrl && (
      card.videoGenerationStatus === 'completed' || 
      card.videoUrl.includes('firebasestorage.googleapis.com') || 
      card.videoUrl.includes('firebaseapp.com') || 
      card.videoUrl.includes('googleapis.com/storage') ||
      card.videoUrl.includes('localhost:9199') // Support emulator URLs
    );
  };

  // Show appropriate status message for video generation
  const getVideoGenerationStatusMessage = () => {
    switch (card.videoGenerationStatus) {
      case 'generating':
        return 'Generating video...';
      case 'failed':
        return 'Video generation failed';
      case 'completed':
        return 'Video ready!';
      default:
        return null;
    }
  };

  const handleDownloadCard = async () => {
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
    if (!card.videoUrl) return;
    
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
    if (!card.id) return;
    
    setIsGeneratingVideo(true);
    
    // Immediately update the card status locally to show the banner
    if (onUpdate) {
      onUpdate({
        ...card,
        videoGenerationStatus: 'generating'
      });
    }
    
    try {
      await generateVideoForExistingCard(card.userId, card.id);
      toast({
        title: 'Video Generation Started',
        description: `Video generation for ${card.name} has been started. This may take a few minutes.`,
      });
      
      // The status is already updated above, so we don't need to do it again here
    } catch (error) {
      console.error('Video generation error:', error);
      toast({
        title: 'Video Generation Failed',
        description: 'Failed to start video generation. Please try again.',
        variant: 'destructive',
      });
      
      // Revert the status if there was an error starting the generation
      if (onUpdate) {
        onUpdate({
          ...card,
          videoGenerationStatus: 'failed'
        });
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const getVideoStatusBadge = () => {
    if (!card.videoGenerationStatus || card.videoGenerationStatus === 'pending') return null;
    
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
      <Badge variant={variant} className="flex items-center gap-1 flex-shrink-0">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold truncate font-headline" title={card.name}>
            {card.name}
          </CardTitle>
          <div className="flex flex-col gap-1 flex-shrink-0">
            {/* Game Badge */}
            <Badge variant="outline" className="flex items-center gap-1">
              {getGameConfig(card.game || 'pokemon' as TCGGame).name}
            </Badge>
            {card.isGenerated && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </Badge>
            )}
            {getVideoStatusBadge()}
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Set: {card.set} | Rarity: {card.rarity}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex justify-center items-center bg-muted/30">
        {card.imageUrl ? (
          <div className="relative w-full max-w-[220px] aspect-[63/88]">
            {showVideo && card.videoUrl ? (
              <div className="relative w-full h-full">
                {card.videoUrl.includes('firebasestorage.googleapis.com') || 
                 card.videoUrl.includes('firebaseapp.com') || 
                 card.videoUrl.includes('googleapis.com/storage') ||
                 card.videoUrl.includes('localhost:9199') ? (
                  // Handle Firebase Storage URLs (production and emulator - publicly accessible)
                  <video
                    src={card.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      console.error('Video playback error for Firebase URL:', card.videoUrl, e);
                      setShowVideo(false);
                    }}
                  />
                ) : card.videoUrl.startsWith('data:video/') || !card.videoUrl.startsWith('http') ? (
                  // Handle base64 video data
                  <video
                    src={card.videoUrl.startsWith('data:') ? card.videoUrl : `data:video/mp4;base64,${card.videoUrl}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      console.error('Video playback error for base64 data:', e);
                      setShowVideo(false);
                    }}
                  />
                ) : (
                  // Handle unsupported URLs (like Google API URLs) - show error message
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
                  className="object-contain rounded-lg shadow-sm"
                  data-ai-hint="pokemon card"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
        ) : (
          <div className="w-full max-w-[220px] aspect-[63/88] bg-gray-200 flex items-center justify-center rounded-lg text-muted-foreground">
            <span className="text-sm">No Image</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 bg-card border-t">
        <div className="flex flex-col gap-2 w-full">
          {/* Video Generation Status Indicator */}
          {card.videoGenerationStatus === 'generating' && (
            <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-700 font-medium">
                  {getVideoGenerationStatusMessage()}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                This may take a few minutes. The page will refresh automatically.
              </div>
            </div>
          )}

          {/* Video Generation Controls */}
          {!card.videoUrl && card.videoGenerationStatus !== 'generating' && (
            hasGeminiKey ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700"
              >
                <Video className="h-4 w-4 mr-2" />
                {isGeneratingVideo ? 'Starting...' : 'Make Card Live'}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Make Card Live
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      Gemini API Key Required
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      To generate videos for your cards, you need to configure your Gemini API key in the settings. 
                      This feature uses Google's Veo model to create animated videos from your card images.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure API Keys
                      </Link>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          )}
          
          {card.videoGenerationStatus === 'failed' && (
            hasGeminiKey ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                className="w-full border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isGeneratingVideo ? 'Starting...' : 'Retry Video Generation'}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Video Generation
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      Gemini API Key Required
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      To retry video generation for your card, you need to configure your Gemini API key in the settings. 
                      This feature uses Google's Veo model to create animated videos from your card images.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure API Keys
                      </Link>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          )}

          {/* Download Video Button - Show when video is ready */}
          {isVideoReady() && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadVideo}
              className="w-full border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download Video
            </Button>
          )}

          {card.isGenerated ? (
            <>
              {/* For generated cards: Share button gets its own row for prominence */}
              <div className="flex">
                <ShareButton 
                  cardName={card.name}
                  cardImageUrl={card.imageUrl}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  showText={true}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadCard}
                  disabled={!card.imageUrl}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" /> 
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">DL</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/dashboard/collection/${card.id}`}>
                    <Eye className="h-4 w-4 mr-1" /> 
                    <span className="hidden sm:inline">View</span>
                    <span className="sm:hidden">View</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/dashboard/collection/${card.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-1" /> 
                    <span className="hidden sm:inline">Edit</span>
                    <span className="sm:hidden">Ed</span>
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            /* For non-generated cards: Just Download, View, and Edit */
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadCard}
                disabled={!card.imageUrl}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" /> 
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">DL</span>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/dashboard/collection/${card.id}`}>
                  <Eye className="h-4 w-4 mr-1" /> 
                  <span className="hidden sm:inline">View</span>
                  <span className="sm:hidden">View</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/dashboard/collection/${card.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" /> 
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden">Ed</span>
                </Link>
              </Button>
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the card &quot;{card.name}&quot; from your collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(card.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
