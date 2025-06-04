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
      const result = await scanPokemonCard({ photoDataUri: imageDataUrl });
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Scan Pokémon Card</CardTitle>
          <CardDescription>Upload an image of your Pokémon card to identify its details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="card-image" className="text-base">Upload Card Image</Label>
            <Input
              id="card-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>

          {imagePreview && (
            <div className="mt-4 p-4 border border-dashed border-border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-2 text-center">Image Preview</h3>
              <Image
                src={imagePreview}
                alt="Card preview"
                width={300}
                height={420}
                className="rounded-md object-contain mx-auto shadow-md aspect-[63/88] max-w-xs"
                data-ai-hint="pokemon card"
              />
            </div>
          )}

          {imageDataUrl && (
            <Button onClick={handleScan} disabled={isScanning || !imageDataUrl} className="w-full mt-4 text-lg py-6">
              {isScanning ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Upload className="mr-2 h-6 w-6" />
              )}
              {isScanning ? 'Scanning...' : 'Scan Card'}
            </Button>
          )}
        </CardContent>
      </Card>
      
      {error && !showForm && (
         <Card className="border-destructive bg-destructive/10 shadow-lg">
          <CardHeader className="flex flex-row items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Scan Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {showForm && scanResult?.cardDetails && imageDataUrl && (
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
      )}
    </div>
  );
}
