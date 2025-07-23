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
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

interface PhotoCardGeneratorFormOnlyProps {
  onCardGenerated?: (imageBase64: string, prompt: string, params: GenerateFromPhotoInput) => void;
  initialValues?: Partial<GenerateFromPhotoInput>;
}

export function PhotoCardGeneratorFormOnly({ onCardGenerated, initialValues }: PhotoCardGeneratorFormOnlyProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
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

  const watchedValues = watch();

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
    if (!user) {
      setError('You must be logged in to generate cards');
      return;
    }

    setIsGenerating(true);
    setError('');

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
        onCardGenerated?.(result.imageBase64, result.prompt, data);
        toast({
          title: 'Card Generated!',
          description: 'Your Pokemon card has been generated based on your photo.',
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
    <Card>
      <CardHeader>
        <CardTitle>Create Pokemon Card from Photo</CardTitle>
        <CardDescription>
          Upload your photo and customize the Pokemon card details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
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
                <Select value={watchedValues.pokemonType} onValueChange={(value) => setValue('pokemonType', value)}>
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
              <Select value={watchedValues.language} onValueChange={(value: any) => setValue('language', value)}>
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
            <h3 className="text-lg font-semibold">Style & Description</h3>
            
            <div>
              <Label htmlFor="styleDescription">Style Description</Label>
              <Textarea
                id="styleDescription"
                {...register('styleDescription')}
                placeholder="Describe how you want the Pokemon card to look, the art style, background, etc..."
                className="min-h-[100px]"
              />
              {errors.styleDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.styleDescription.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Game Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Game Stats (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hp">HP</Label>
                <Input
                  id="hp"
                  type="number"
                  {...register('hp', { valueAsNumber: true })}
                  min="10"
                  max="999"
                />
              </div>

              <div>
                <Label htmlFor="retreatCost">Retreat Cost</Label>
                <Input
                  id="retreatCost"
                  type="number"
                  {...register('retreatCost', { valueAsNumber: true })}
                  min="0"
                  max="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attack 1</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('attackName1')}
                  placeholder="Attack name"
                />
                <Input
                  type="number"
                  {...register('attackDamage1', { valueAsNumber: true })}
                  placeholder="Damage"
                  min="0"
                  max="999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attack 2</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('attackName2')}
                  placeholder="Attack name"
                />
                <Input
                  type="number"
                  {...register('attackDamage2', { valueAsNumber: true })}
                  placeholder="Damage"
                  min="0"
                  max="999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weakness">Weakness</Label>
                <Input
                  id="weakness"
                  {...register('weakness')}
                  placeholder="e.g., Fighting"
                />
              </div>

              <div>
                <Label htmlFor="resistance">Resistance</Label>
                <Input
                  id="resistance"
                  {...register('resistance')}
                  placeholder="e.g., Psychic"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isGenerating || !imagePreview}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Card...
              </>
            ) : (
              'Generate Pokemon Card from Photo'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
