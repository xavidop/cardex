'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { shareOnTwitter, shareOnFacebook, shareOnLinkedIn, copyShareLink, nativeShare, copyImageAndText, ShareOptions } from '@/utils/shareUtils';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  cardName: string;
  cardImageUrl?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export default function ShareButton({ 
  cardName, 
  cardImageUrl, 
  variant = 'outline', 
  size = 'sm',
  className = '',
  showText = true
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const shareOptions: ShareOptions = {
    cardName,
    cardImageUrl,
    onImageCopied: (platform: string) => {
      toast({
        title: 'Image & Text Copied!',
        description: `Card image and text copied to clipboard. Paste them in your ${platform} post!`,
      });
    },
    onImageUploaded: (url: string) => {
      toast({
        title: 'Image Uploaded!',
        description: 'Image has been uploaded and will be included in the social media preview.',
      });
    },
  };

  const handleCopyLink = async () => {
    try {
      // Try to copy image + text first, fallback to text only
      if (cardImageUrl) {
        try {
          const copiedImage = await copyImageAndText(shareOptions);
          setCopied(true);
          toast({
            title: copiedImage ? 'Image & Text Copied!' : 'Text Copied!',
            description: copiedImage 
              ? 'Card image and share text have been copied to your clipboard.' 
              : 'Share text copied to clipboard. Image copying not supported on this device.',
          });
        } catch (error) {
          // Fallback to text only
          copyShareLink(shareOptions);
          setCopied(true);
          toast({
            title: 'Text Copied!',
            description: 'Share text has been copied to your clipboard.',
          });
        }
      } else {
        copyShareLink(shareOptions);
        setCopied(true);
        toast({
          title: 'Link Copied!',
          description: 'Share text has been copied to your clipboard.',
        });
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async () => {
    const shared = await nativeShare(shareOptions);
    if (!shared) {
      // Fallback to copy link if native share is not available
      handleCopyLink();
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
          {showText && (
            <span className="ml-1">Share</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hasNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}
                <DropdownMenuItem 
          onClick={async () => {
            if (isUploading) return;
            setIsUploading(true);
            try {
              await shareOnTwitter(shareOptions);
            } catch (error) {
              toast({
                title: 'Share Failed',
                description: 'Failed to prepare Twitter share. Please try again.',
                variant: 'destructive',
              });
            } finally {
              setIsUploading(false);
            }
          }}
          disabled={isUploading}
        >
          <Twitter className="mr-2 h-4 w-4" />
          {isUploading ? 'Preparing...' : 'Twitter/X'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={async () => {
            if (isUploading) return;
            setIsUploading(true);
            try {
              await shareOnFacebook(shareOptions);
            } catch (error) {
              toast({
                title: 'Share Failed',
                description: 'Failed to prepare Facebook share. Please try again.',
                variant: 'destructive',
              });
            } finally {
              setIsUploading(false);
            }
          }}
          disabled={isUploading}
        >
          <Facebook className="mr-2 h-4 w-4" />
          {isUploading ? 'Preparing...' : 'Facebook'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={async () => {
            if (isUploading) return;
            setIsUploading(true);
            try {
              await shareOnLinkedIn(shareOptions);
            } catch (error) {
              toast({
                title: 'Share Failed',
                description: 'Failed to prepare LinkedIn share. Please try again.',
                variant: 'destructive',
              });
            } finally {
              setIsUploading(false);
            }
          }}
          disabled={isUploading}
        >
          <Linkedin className="mr-2 h-4 w-4" />
          {isUploading ? 'Preparing...' : 'LinkedIn'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : cardImageUrl ? 'Copy Text' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
