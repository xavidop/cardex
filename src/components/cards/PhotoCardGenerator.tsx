'use client';

import { useState, type ChangeEvent, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, X, Download } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { downloadCardFromBase64 } from '@/utils/downloadUtils';
import { useAuth } from '@/hooks/useAuth';
import { useApiKeys } from '@/hooks/useApiKeys';

export interface GenerateFromPhotoInput {
  photoDataUri: string;
  pokemonName: string;
  pokemonType: string;
  styleDescription: string;
  language: 'english' | 'japanese' | 'chinese' | 'korean' | 'spanish' | 'french' | 'german' | 'italian';
  hp?: number;
  attackName1?: string;
  attackDamage1?: number;
  attackName2?: string;
  attackDamage2?: number;
  weakness?: string;
  resistance?: string;
  retreatCost?: number;
}

const pokemonTypes = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 
  'Steel', 'Fairy'
];

const languages = [
  { value: 'english', label: 'English' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'korean', label: 'Korean' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
] as const;

const photoCardGeneratorSchema = z.object({
  photoDataUri: z.string().min(1, "Photo is required"),
  pokemonName: z.string().min(1, 'Pokemon name is required'),
  pokemonType: z.string().min(1, 'Pokemon type is required'),
  styleDescription: z.string().min(10, 'Style description must be at least 10 characters'),
  language: z.enum(['english', 'japanese', 'chinese', 'korean', 'spanish', 'french', 'german', 'italian']),
  hp: z.number().min(10).max(999).optional(),
  attackName1: z.string().optional(),
  attackDamage1: z.number().min(0).max(999).optional(),
  attackName2: z.string().optional(),
  attackDamage2: z.number().min(0).max(999).optional(),
  weakness: z.string().optional(),
  resistance: z.string().optional(),
  retreatCost: z.number().min(0).max(5).optional(),
});

type PhotoCardGeneratorForm = z.infer<typeof photoCardGeneratorSchema>;

interface PhotoCardGeneratorProps {
  onCardGenerated?: (imageBase64: string, prompt: string, params: GenerateFromPhotoInput) => void;
  initialValues?: Partial<GenerateFromPhotoInput>;
}

export function PhotoCardGenerator({ onCardGenerated, initialValues }: PhotoCardGeneratorProps) {
  const { user } = useAuth();
  const { hasOpenAIKey } = useApiKeys();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<{ imageBase64: string; prompt: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.photoDataUri || null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PhotoCardGeneratorForm>({
    resolver: zodResolver(photoCardGeneratorSchema),
    defaultValues: {
      photoDataUri: initialValues?.photoDataUri || '',
      pokemonName: initialValues?.pokemonName || '',
      pokemonType: initialValues?.pokemonType || '',
      styleDescription: initialValues?.styleDescription || '',
      language: initialValues?.language || 'english',
      hp: initialValues?.hp || 130,
      attackName1: initialValues?.attackName1 || 'Quick Attack',
      attackDamage1: initialValues?.attackDamage1 || 60,
      attackName2: initialValues?.attackName2 || 'Special Move',
      attackDamage2: initialValues?.attackDamage2 || 90,
      weakness: initialValues?.weakness || 'Fighting',
      resistance: initialValues?.resistance || 'Psychic',
      retreatCost: initialValues?.retreatCost || 2,
    },
  });

  const handleDownloadCard = () => {
    if (!generatedCard) return;
    
    try {
      downloadCardFromBase64(generatedCard.imageBase64, watchedValues.pokemonName || 'pokemon_card');
      toast({
        title: 'Download Started',
        description: 'Your Pokemon card is being downloaded.',
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

  const watchedValues = watch();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset previous generation state
      setGeneratedCard(null);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setValue('photoDataUri', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setValue('photoDataUri', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setGeneratedCard(null);
    setError('');
  };

  const onSubmit = async (data: PhotoCardGeneratorForm) => {
    if (!user) {
      setError('You must be logged in to generate cards');
      return;
    }

    if (!hasOpenAIKey) {
      setError('OpenAI API key is required to generate cards from photos. Please configure it in Settings.');
      return;
    }

    if (!data.photoDataUri) {
      toast({
        title: 'Photo Required',
        description: 'Please upload a reference photo first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedCard(null);

    try {
      const response = await fetch('/api/generate-card-from-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to generate card');
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.imageBase64 && result.prompt) {
        setGeneratedCard({
          imageBase64: result.imageBase64,
          prompt: result.prompt,
        });
        onCardGenerated?.(result.imageBase64, result.prompt, data);
        toast({
          title: 'Card Generated!',
          description: 'Your Pokemon card has been generated based on your photo.',
        });
      }
    } catch (err) {
      console.error('Error generating card from photo:', err);
      setError('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Card from Photo</CardTitle>
          <CardDescription>
            Upload a photo and create a custom Pokemon TCG card inspired by your image using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Reference Photo</h3>
              
              <div>
                <Label htmlFor="photo-upload" className="text-base">Upload Reference Image</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="cursor-pointer"
                />
                {errors.photoDataUri && (
                  <p className="text-sm text-red-500 mt-1">{errors.photoDataUri.message}</p>
                )}
              </div>

              {imagePreview && (
                <div className="relative">
                  <div className="relative bg-gray-100 rounded-lg p-4">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Image
                      src={imagePreview}
                      alt="Reference photo"
                      width={400}
                      height={300}
                      className="w-full h-auto rounded-lg object-cover max-h-64"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Basic Pokemon Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pokemon Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pokemonName">Pokemon Name</Label>
                  <Input
                    id="pokemonName"
                    {...register('pokemonName')}
                    placeholder="e.g., Pikachu"
                  />
                  {errors.pokemonName && (
                    <p className="text-sm text-red-500 mt-1">{errors.pokemonName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pokemonType">Pokemon Type</Label>
                  <Select onValueChange={(value) => setValue('pokemonType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {pokemonTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pokemonType && (
                    <p className="text-sm text-red-500 mt-1">{errors.pokemonType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="language">Card Language</Label>
                <Select onValueChange={(value) => setValue('language', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Style Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Photo Adaptation</h3>
              
              <div>
                <Label htmlFor="styleDescription">Style Description</Label>
                <Textarea
                  id="styleDescription"
                  {...register('styleDescription')}
                  placeholder="Describe how the photo should be adapted for the Pokemon card (e.g., 'Use the lighting and composition, but transform the subject into a Pokemon in a fantasy setting')"
                  className="min-h-[100px]"
                />
                {errors.styleDescription && (
                  <p className="text-sm text-red-500 mt-1">{errors.styleDescription.message}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Stats (Optional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Card Stats (Optional)</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hp">HP</Label>
                  <Input
                    id="hp"
                    type="number"
                    {...register('hp', { valueAsNumber: true })}
                    placeholder="130"
                  />
                </div>
                <div>
                  <Label htmlFor="weakness">Weakness</Label>
                  <Select onValueChange={(value) => setValue('weakness', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {pokemonTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="retreatCost">Retreat Cost</Label>
                  <Input
                    id="retreatCost"
                    type="number"
                    {...register('retreatCost', { valueAsNumber: true })}
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attackName1">First Attack Name</Label>
                  <Input
                    id="attackName1"
                    {...register('attackName1')}
                    placeholder="Quick Attack"
                  />
                </div>
                <div>
                  <Label htmlFor="attackDamage1">First Attack Damage</Label>
                  <Input
                    id="attackDamage1"
                    type="number"
                    {...register('attackDamage1', { valueAsNumber: true })}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attackName2">Second Attack Name</Label>
                  <Input
                    id="attackName2"
                    {...register('attackName2')}
                    placeholder="Special Move"
                  />
                </div>
                <div>
                  <Label htmlFor="attackDamage2">Second Attack Damage</Label>
                  <Input
                    id="attackDamage2"
                    type="number"
                    {...register('attackDamage2', { valueAsNumber: true })}
                    placeholder="90"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isGenerating || !imagePreview || !hasOpenAIKey}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Card from Photo...
                </>
              ) : !hasOpenAIKey ? (
                'OpenAI API Key Required'
              ) : (
                'Generate Pokemon Card from Photo'
              )}
            </Button>

            {!hasOpenAIKey && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  Please configure your OpenAI API key in <strong>Settings</strong> to generate cards from photos.
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Card</CardTitle>
          <CardDescription>
            Your photo-inspired Pokemon card will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedCard ? (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg p-4">
                <img
                  src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                  alt="Generated Pokemon Card from Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <Button 
                onClick={handleDownloadCard}
                className="w-full"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Card
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
              {!imagePreview && (
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
              )}
              <p className="text-muted-foreground text-center">
                {isGenerating 
                  ? 'Generating your Pokemon card from photo...' 
                  : !imagePreview 
                    ? 'Upload a reference photo and fill out the form to generate a card'
                    : 'Fill out the form to generate a card based on your photo'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
