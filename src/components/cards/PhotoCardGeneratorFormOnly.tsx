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
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { downloadCardFromBase64 } from '@/utils/downloadUtils';
import { useAuth } from '@/hooks/useAuth';
import { useApiKeys } from '@/hooks/useApiKeys';
import { TCG_GAMES, getGameConfig } from '@/config/tcg-games';
import type { TCGGame, PhotoCardGenerationParams, GeneratedCard } from '@/types';
import { LANGUAGES, tcgGameSchema, languageSchema } from '@/constants';

const photoCardGeneratorSchema = z.object({
  photoDataUri: z.string().min(1, "Photo is required"),
  game: tcgGameSchema,
  characterName: z.string().min(1, 'Character name is required'),
  characterType: z.string().min(1, 'Character type is required'),
  styleDescription: z.string().min(10, 'Style description must be at least 10 characters'),
  language: languageSchema,
  // All game-specific stats are optional and dynamic - use preprocess to handle empty strings and NaN
  hp: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(10).max(9999).optional()),
  attack: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(9999).optional()),
  defense: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(9999).optional()),
  power: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(9999).optional()),
  toughness: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(9999).optional()),
  loyalty: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(99).optional()),
  energy: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(999).optional()),
  cost: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(99).optional()),
  manaCost: z.string().optional(),
  attackName1: z.string().optional(),
  attackDamage1: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(999).optional()),
  attackName2: z.string().optional(),
  attackDamage2: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(999).optional()),
  weakness: z.string().optional(),
  resistance: z.string().optional(),
  retreatCost: z.preprocess((val) => (val === '' || val === null || Number.isNaN(val)) ? undefined : val, z.number().min(0).max(5).optional()),
});

type PhotoCardGeneratorForm = z.infer<typeof photoCardGeneratorSchema>;

export type GenerateFromPhotoInput = PhotoCardGenerationParams & { photoDataUri: string };

interface PhotoCardGeneratorFormOnlyProps {
  onCardGenerated?: (imageBase64: string, prompt: string, params: GenerateFromPhotoInput) => void;
  initialValues?: Partial<GenerateFromPhotoInput>;
}

export function PhotoCardGeneratorFormOnly({ onCardGenerated, initialValues }: PhotoCardGeneratorFormOnlyProps) {
  const { user } = useAuth();
  const { hasOpenAIKey } = useApiKeys();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);
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
      game: initialValues?.game || 'pokemon',
      characterName: initialValues?.characterName || '',
      characterType: initialValues?.characterType || '',
      styleDescription: initialValues?.styleDescription || '',
      language: initialValues?.language || 'english',
      hp: initialValues?.hp,
      attackName1: initialValues?.attackName1 || '',
      attackDamage1: initialValues?.attackDamage1,
      attackName2: initialValues?.attackName2 || '',
      attackDamage2: initialValues?.attackDamage2,
      weakness: initialValues?.weakness || '',
      resistance: initialValues?.resistance || '',
      retreatCost: initialValues?.retreatCost,
    },
  });

  const watchedValues = watch();
  const currentGame = watchedValues.game || 'pokemon';
  const gameConfig = getGameConfig(currentGame);

  const handleGameChange = (game: TCGGame) => {
    setValue('game', game, { shouldValidate: true });
    const config = getGameConfig(game);
    
    // Reset character type
    setValue('characterType', '', { shouldValidate: false });
    
    // Set default stats for the game
    const defaultStats = config.defaultStats;
    if (defaultStats) {
      Object.entries(defaultStats).forEach(([key, value]) => {
        setValue(key as any, value as any);
      });
    }
  };

  const handleDownloadCard = () => {
    if (!generatedCard) return;
    
    try {
      const filename = watchedValues.characterName 
        ? `${watchedValues.characterName.toLowerCase().replace(/\s+/g, '_')}_${currentGame}_card`
        : `${currentGame}_card`;
      downloadCardFromBase64(generatedCard.imageBase64, filename);
      toast({
        title: 'Download Started',
        description: `Your ${gameConfig.name} card is being downloaded.`,
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

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
        setValue('photoDataUri', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('photoDataUri', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: PhotoCardGeneratorForm) => {
    console.log('Form submitted with data:', data);
    console.log('Has user:', !!user, 'Has OpenAI key:', hasOpenAIKey);
    
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
          description: `Your ${gameConfig.name} card has been generated based on your photo.`,
        });
      }
    } catch (err) {
      console.error('Error generating card:', err);
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
            Upload a photo and create a custom TCG card inspired by your image using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('Form validation errors:', errors);
          
          // Build a detailed error message
          const errorFields = Object.entries(errors).map(([field, error]) => {
            return `${field}: ${error?.message || 'Invalid value'}`;
          }).join(', ');
          
          console.log('Detailed errors:', errorFields);
          
          toast({
            title: 'Validation Error',
            description: errorFields || 'Please check all required fields and try again.',
            variant: 'destructive',
          });
        })} className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Photo</h3>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="photo-upload"
              />
              
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-full max-w-xs mx-auto">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="w-full h-auto rounded-lg border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
              
              {errors.photoDataUri && (
                <p className="text-sm text-red-500">{errors.photoDataUri.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Game Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Game Selection
              <Badge variant="outline">{gameConfig.name}</Badge>
            </h3>
            
            <div>
              <Label htmlFor="game">Trading Card Game</Label>
              <Select value={currentGame} onValueChange={(value) => handleGameChange(value as TCGGame)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TCG_GAMES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Character Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="characterName">Character Name <span className="text-red-500">*</span></Label>
                <Input
                  id="characterName"
                  {...register('characterName')}
                  placeholder={`e.g., ${gameConfig.name} Character`}
                  className={errors.characterName ? 'border-red-500' : ''}
                />
                {errors.characterName && (
                  <p className="text-sm text-red-500 mt-1">{errors.characterName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="characterType">Character Type <span className="text-red-500">*</span></Label>
                <Select value={watchedValues.characterType || ''} onValueChange={(value) => setValue('characterType', value, { shouldValidate: true })}>
                  <SelectTrigger className={errors.characterType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameConfig.types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.characterType && (
                  <p className="text-sm text-red-500 mt-1">{errors.characterType.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="language">Card Language</Label>
              <Select value={watchedValues.language || 'english'} onValueChange={(value: any) => setValue('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
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
            <h3 className="text-lg font-semibold">Style & Description</h3>
            
            <div>
              <Label htmlFor="styleDescription">Style Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="styleDescription"
                {...register('styleDescription')}
                placeholder={`Describe how the photo should be adapted for the ${gameConfig.name} card (e.g., 'Use the lighting and composition, but transform the subject into a character in a fantasy setting')`}
                className={`min-h-[100px] ${errors.styleDescription ? 'border-red-500' : ''}`}
              />
              {errors.styleDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.styleDescription.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Dynamic Game Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Card Stats (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {gameConfig.statFields.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {field.type === 'string' ? (
                    <Input
                      id={field.name}
                      {...register(field.name as any)}
                      placeholder={field.placeholder || field.label}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type="number"
                      {...register(field.name as any, { valueAsNumber: true })}
                      placeholder={field.placeholder || field.label}
                    />
                  )}
                </div>
              ))}
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
              `Generate ${gameConfig.name} Card from Photo`
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
            <div className="rounded-md bg-red-50 p-4">
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
          Your photo-inspired {gameConfig.name} card will appear here
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedCard ? (
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg p-4">
              <img
                src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                alt={`Generated ${gameConfig.name} Card from Photo`}
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
                ? `Generating your ${gameConfig.name} card from photo...` 
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
