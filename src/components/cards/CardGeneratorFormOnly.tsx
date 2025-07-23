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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

interface CardGeneratorFormOnlyProps {
  onCardGenerated?: (imageBase64: string, prompt: string, params: GeneratePokemonCardInput) => void;
  initialValues?: Partial<GeneratePokemonCardInput>;
}

export function CardGeneratorFormOnly({ onCardGenerated, initialValues }: CardGeneratorFormOnlyProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CardGeneratorForm>({
    resolver: zodResolver(cardGeneratorSchema),
    defaultValues: {
      pokemonName: initialValues?.pokemonName || '',
      pokemonType: initialValues?.pokemonType || '',
      isIllustrationRare: initialValues?.isIllustrationRare || false,
      isHolo: initialValues?.isHolo || false,
      backgroundDescription: initialValues?.backgroundDescription || '',
      pokemonDescription: initialValues?.pokemonDescription || '',
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

  const onSubmit = async (data: CardGeneratorForm) => {
    if (!user) {
      setError('You must be logged in to generate cards');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-card', {
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
          description: 'Your Pokemon card has been generated successfully.',
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

          {/* Card Properties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Card Properties</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Full Art</Label>
                  <p className="text-sm text-muted-foreground">Horizontal layout with full illustration</p>
                </div>
                <Switch
                  checked={watchedValues.isIllustrationRare}
                  onCheckedChange={(checked) => setValue('isIllustrationRare', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Holographic Effect</Label>
                  <p className="text-sm text-muted-foreground">Rainbow shimmer effect</p>
                </div>
                <Switch
                  checked={watchedValues.isHolo}
                  onCheckedChange={(checked) => setValue('isHolo', checked)}
                />
              </div>
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
                placeholder="Describe the Pokemon's appearance, personality, and characteristics..."
                className="min-h-[100px]"
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
                placeholder="Describe the background scene, environment, or setting..."
                className="min-h-[100px]"
              />
              {errors.backgroundDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.backgroundDescription.message}</p>
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
            disabled={isGenerating}
          >
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
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
