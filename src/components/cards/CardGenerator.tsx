'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export interface GeneratePokemonCardInput {
  pokemonName: string;
  pokemonType: string;
  isIllustrationRare: boolean;
  isHolo: boolean;
  backgroundDescription: string;
  pokemonDescription: string;
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

const cardGeneratorSchema = z.object({
  pokemonName: z.string().min(1, 'Pokemon name is required'),
  pokemonType: z.string().min(1, 'Pokemon type is required'),
  isIllustrationRare: z.boolean(),
  isHolo: z.boolean(),
  backgroundDescription: z.string().min(10, 'Background description must be at least 10 characters'),
  pokemonDescription: z.string().min(10, 'Pokemon description must be at least 10 characters'),
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

type CardGeneratorForm = z.infer<typeof cardGeneratorSchema>;

interface CardGeneratorProps {
  onCardGenerated?: (imageBase64: string, prompt: string) => void;
}

export function CardGenerator({ onCardGenerated }: CardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<{ imageBase64: string; prompt: string } | null>(null);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CardGeneratorForm>({
    resolver: zodResolver(cardGeneratorSchema),
    defaultValues: {
      pokemonName: '',
      pokemonType: '',
      isIllustrationRare: false,
      isHolo: false,
      backgroundDescription: '',
      pokemonDescription: '',
      language: 'english',
      hp: 130,
      attackName1: 'Quick Attack',
      attackDamage1: 60,
      attackName2: 'Special Move',
      attackDamage2: 90,
      weakness: 'Fighting',
      resistance: 'Psychic',
      retreatCost: 2,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: CardGeneratorForm) => {
    setIsGenerating(true);
    setError('');
    setGeneratedCard(null);

    try {
      const response = await fetch('/api/generate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
        onCardGenerated?.(result.imageBase64, result.prompt);
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
          <CardTitle>Create Your Pokemon Card</CardTitle>
          <CardDescription>
            Fill in the details to generate a custom Pokemon TCG card using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Pokemon Info */}
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

            {/* Card Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Card Properties</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isIllustrationRare">Full Art</Label>
                  <p className="text-sm text-muted-foreground">Horizontal layout with full illustration</p>
                </div>
                <Switch
                  id="isIllustrationRare"
                  checked={watchedValues.isIllustrationRare}
                  onCheckedChange={(checked) => setValue('isIllustrationRare', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isHolo">Holographic Effect</Label>
                  <p className="text-sm text-muted-foreground">Rainbow shimmer effect</p>
                </div>
                <Switch
                  id="isHolo"
                  checked={watchedValues.isHolo}
                  onCheckedChange={(checked) => setValue('isHolo', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Descriptions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Descriptions</h3>
              
              <div>
                <Label htmlFor="pokemonDescription">Pokemon Description</Label>
                <Textarea
                  id="pokemonDescription"
                  {...register('pokemonDescription')}
                  placeholder="Describe how the Pokemon should look and what it's doing..."
                  className="min-h-[80px]"
                />
                {errors.pokemonDescription && (
                  <p className="text-sm text-red-500 mt-1">{errors.pokemonDescription.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="backgroundDescription">Background Description</Label>
                <Textarea
                  id="backgroundDescription"
                  {...register('backgroundDescription')}
                  placeholder="Describe the background scene..."
                  className="min-h-[80px]"
                />
                {errors.backgroundDescription && (
                  <p className="text-sm text-red-500 mt-1">{errors.backgroundDescription.message}</p>
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

            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Card...
                </>
              ) : (
                'Generate Pokemon Card'
              )}
            </Button>

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
            Your custom Pokemon card will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedCard ? (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg p-4">
                <img
                  src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                  alt="Generated Pokemon Card"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">
                {isGenerating ? 'Generating your Pokemon card...' : 'Fill out the form to generate a card'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
