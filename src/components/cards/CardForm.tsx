'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { ScannedCardData, PokemonCard } from '@/types';

const cardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  set: z.string().min(1, 'Set is required'),
  rarity: z.string().min(1, 'Rarity is required'),
  imageDataUrl: z.string().refine(val => val.startsWith('data:image/'), {
    message: 'Image data URL is required and must be valid',
  }),
});

export type CardFormInputs = z.infer<typeof cardSchema>;

interface CardFormProps {
  initialData?: Partial<PokemonCard> | (ScannedCardData & { imageDataUrl?: string });
  imageDataUrlFromScan?: string; // Specifically for new cards from scan
  onSubmit: (data: CardFormInputs) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  formTitle?: string;
  formDescription?: string;
  onCancel?: () => void;
}

export default function CardForm({
  initialData,
  imageDataUrlFromScan,
  onSubmit: handleFormSubmit,
  isSubmitting,
  submitButtonText = 'Save Card',
  formTitle = 'Card Details',
  formDescription = 'Fill in the details of the TCG card.',
  onCancel,
}: CardFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CardFormInputs>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: initialData?.name || '',
      set: initialData?.set || '',
      rarity: initialData?.rarity || '',
      imageDataUrl: imageDataUrlFromScan || (initialData as PokemonCard)?.imageUrl || '',
    },
  });

  const currentImageDataUrl = watch('imageDataUrl');

  const onSubmit: SubmitHandler<CardFormInputs> = async (data) => {
    await handleFormSubmit(data);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {currentImageDataUrl && (
            <div className="mb-4 rounded-md overflow-hidden border border-border aspect-[63/88] max-w-xs mx-auto bg-muted">
              <Image
                src={currentImageDataUrl}
                alt={watch('name') || 'TCG Card'}
                width={300}
                height={420}
                className="object-contain w-full h-full"
                data-ai-hint="tcg card"
              />
            </div>
          )}
           {/* Hidden input for imageDataUrl, as it's typically set by scanner or pre-loaded */}
           <input type="hidden" {...register('imageDataUrl')} />
           {errors.imageDataUrl && <p className="text-sm text-destructive">{errors.imageDataUrl.message}</p>}

          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Charizard" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="set">Set</Label>
            <Input id="set" {...register('set')} placeholder="e.g., Base Set" />
            {errors.set && <p className="text-sm text-destructive">{errors.set.message}</p>}
          </div>

          <div>
            <Label htmlFor="rarity">Rarity</Label>
            <Input id="rarity" {...register('rarity')} placeholder="e.g., Holo Rare" />
            {errors.rarity && <p className="text-sm text-destructive">{errors.rarity.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
