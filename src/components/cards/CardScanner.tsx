'use client';

import { useState, type ChangeEvent, useRef } from 'react';
import { scanPokemonCard, type ScanPokemonCardOutput } from '@/ai/flows/scan-pokemon-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import CardForm, { type CardFormInputs } from './CardForm';
import { useAuth } from '@/hooks/useAuth';
import { addCardToCollection } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export default function CardScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanPokemonCardOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset previous scan state
      setScanResult(null);
      setError(null);
      setShowForm(false);
      setImageDataUrl(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl); // For preview
        setImageDataUrl(dataUrl); // For sending to AI
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imageDataUrl) {
      toast({ title: 'No image selected', description: 'Please select an image to scan.', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setShowForm(false);

    try {
      const result = await scanPokemonCard({ 
        photoDataUri: imageDataUrl,
        userId: user?.uid 
      });
      if (result.error) {
        setError(result.error);
        toast({ title: 'Scan Failed', description: result.error, variant: 'destructive' });
      } else if (result.cardDetails) {
        setScanResult(result);
        setShowForm(true);
        toast({ title: 'Scan Successful', description: 'Card details identified. Please review and save.', variant: 'default' });
      } else {
        setError('Unexpected response from scanner.');
        toast({ title: 'Scan Error', description: 'Unexpected response from scanner.', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Scan error:', e);
      const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred during scanning.';
      setError(errorMessage);
      toast({ title: 'Scan Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleSaveCard = async (data: CardFormInputs) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to save cards.', variant: 'destructive' });
      return;
    }
    if (!imageDataUrl) { // Ensure image data is still available
        toast({ title: 'Image Error', description: 'Image data is missing. Please re-upload.', variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);
    try {
      const cardToSave = {
        name: data.name,
        set: data.set,
        rarity: data.rarity,
        imageDataUrl: data.imageDataUrl, // Use image from form state, which should be original scan
      };
      await addCardToCollection(user.uid, cardToSave);
      toast({ title: 'Card Saved!', description: `${data.name} has been added to your collection.` });
      // Reset state after successful save
      setImagePreview(null);
      setImageDataUrl(null);
      setScanResult(null);
      setShowForm(false);
      setError(null);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
      router.push('/dashboard/collection');
    } catch (e) {
      console.error('Error saving card:', e);
      const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred while saving.';
      toast({ title: 'Save Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    // Optionally clear scanResult or keep it if user might want to re-open form
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Upload Card Image</CardTitle>
          <CardDescription>
            Choose a clear image of your Pokémon card for best scanning results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input
                id="card-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 hover:bg-muted/30 hover:border-muted-foreground/50 transition-all duration-200 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">Choose file or drag and drop</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Supported formats: JPG, PNG, WEBP • Max size: 10MB
            </p>
          </div>

          {imagePreview && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Preview</h3>
                <div className="inline-block p-3 bg-background rounded-lg shadow-md">
                  <Image
                    src={imagePreview}
                    alt="Card preview"
                    width={300}
                    height={420}
                    className="rounded-md object-contain mx-auto aspect-[63/88] max-w-[250px] shadow-sm"
                    data-ai-hint="pokemon card"
                  />
                </div>
              </div>
              
              {imageDataUrl && (
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning || !imageDataUrl} 
                  className="w-full py-6 text-lg font-semibold"
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Analyzing Card...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-3 h-5 w-5" />
                      Scan Card
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {error && !showForm && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-destructive">Scan Failed</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Try taking a clearer photo or ensure the card is fully visible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && scanResult?.cardDetails && imageDataUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3 py-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Card Successfully Scanned!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                Review the details below and add to your collection
              </p>
            </div>
          </div>
          
          <CardForm
            initialData={{
              name: scanResult.cardDetails.name || '',
              set: scanResult.cardDetails.set || '',
              rarity: scanResult.cardDetails.rarity || '',
            }}
            imageDataUrlFromScan={imageDataUrl}
            onSubmit={handleSaveCard}
            isSubmitting={isSubmitting}
            submitButtonText="Add to Collection"
            formTitle="Confirm Card Details"
            formDescription="Review the scanned details and save the card to your collection."
            onCancel={handleCancelForm}
          />
        </div>
      )}
    </div>
  );
}
