'use client';

import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCardFromBase64 } from '@/utils/downloadUtils';
import { useAuth } from '@/hooks/useAuth';
import type { TCGGame, CardGenerationParams, GeneratedCard } from '@/types';
import { TCG_GAMES, getGameConfig, getDefaultStats } from '@/config/tcg-games';
import { LANGUAGES, AI_MODELS, tcgGameSchema, languageSchema, aiModelSchema } from '@/constants';

const cardGeneratorSchema = z.object({
  game: tcgGameSchema,
  characterName: z.string().min(1, 'Character name is required'),
  characterType: z.string().min(1, 'Type is required'),
  isSpecialArt: z.boolean(),
  isHolo: z.boolean(),
  backgroundDescription: z.string().min(10, 'Background description must be at least 10 characters'),
  characterDescription: z.string().min(10, 'Character description must be at least 10 characters'),
  language: languageSchema,
  model: aiModelSchema,
  // All possible game-specific stats (will be filtered based on selected game)
  hp: z.number().optional(),
  attackName1: z.string().optional(),
  attackDamage1: z.number().optional(),
  attackName2: z.string().optional(),
  attackDamage2: z.number().optional(),
  weakness: z.string().optional(),
  resistance: z.string().optional(),
  retreatCost: z.number().optional(),
  power: z.number().optional(),
  cost: z.number().optional(),
  counter: z.number().optional(),
  lifePoints: z.number().optional(),
  inkCost: z.number().optional(),
  strength: z.number().optional(),
  willpower: z.number().optional(),
  lore: z.number().optional(),
  inkable: z.boolean().optional(),
  manaCost: z.string().optional(),
  cardType: z.string().optional(),
  subType: z.string().optional(),
  powerToughness: z.string().optional(),
  combatPower: z.number().optional(),
  comboCost: z.number().optional(),
  comboEnergy: z.number().optional(),
  era: z.string().optional(),
});

type CardGeneratorForm = z.infer<typeof cardGeneratorSchema>;

interface TCGCardGeneratorProps {
  onCardGenerated?: (imageBase64: string, prompt: string, params: CardGenerationParams) => void;
  initialValues?: Partial<CardGenerationParams>;
}

export function TCGCardGenerator({ onCardGenerated, initialValues }: TCGCardGeneratorProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const defaultGame = initialValues?.game || 'pokemon';
  const defaultStats = getDefaultStats(defaultGame);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CardGeneratorForm>({
    resolver: zodResolver(cardGeneratorSchema),
    defaultValues: {
      game: defaultGame,
      characterName: initialValues?.characterName || '',
      characterType: initialValues?.characterType || '',
      isSpecialArt: initialValues?.isSpecialArt || false,
      isHolo: initialValues?.isHolo || false,
      backgroundDescription: initialValues?.backgroundDescription || '',
      characterDescription: initialValues?.characterDescription || '',
      language: initialValues?.language || 'english',
      model: initialValues?.model || 'imagen-4.0-ultra-generate-001',
      ...defaultStats,
      ...initialValues,
    },
  });

  const watchedValues = watch();
  const selectedGame = watch('game');
  const gameConfig = useMemo(() => getGameConfig(selectedGame as TCGGame), [selectedGame]);

  // Update default stats when game changes
  const handleGameChange = (game: TCGGame) => {
    setValue('game', game);
    setValue('characterType', '');
    const defaults = getDefaultStats(game);
    Object.entries(defaults).forEach(([key, value]) => {
      setValue(key as any, value);
    });
  };

  const handleDownloadCard = () => {
    if (!generatedCard) return;
    
    try {
      const filename = watchedValues.characterName 
        ? `${watchedValues.characterName.toLowerCase().replace(/\s+/g, '_')}_${selectedGame}_card`
        : `${selectedGame}_card`;
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

  const onSubmit = async (data: CardGeneratorForm) => {
    if (!user) {
      setError('You must be logged in to generate cards');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedCard(null);

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
        setGeneratedCard({
          imageBase64: result.imageBase64,
          prompt: result.prompt,
        });
        onCardGenerated?.(result.imageBase64, result.prompt, data as CardGenerationParams);
        toast({
          title: 'Card Generated!',
          description: `Your ${gameConfig.name} card has been generated successfully.`,
        });
      }
    } catch (err) {
      console.error('Error generating card:', err);
      setError('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderGameSpecificStats = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Game Stats (Optional)</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {gameConfig.statFields.map((field) => {
            if (field.type === 'boolean') {
              return (
                <div key={field.name} className="flex items-center justify-between col-span-2">
                  <div className="space-y-0.5">
                    <Label>{field.label}</Label>
                  </div>
                  <Switch
                    checked={watchedValues[field.name as keyof CardGeneratorForm] as boolean}
                    onCheckedChange={(checked) => setValue(field.name as any, checked)}
                  />
                </div>
              );
            }

            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type}
                  {...register(field.name as any, { 
                    valueAsNumber: field.type === 'number' 
                  })}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Create Your Trading Card
            <Badge variant="outline">{gameConfig.name}</Badge>
          </CardTitle>
          <CardDescription>
            Generate a custom TCG card using AI
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Game Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Game</h3>
            
            <div>
              <Label htmlFor="game">Trading Card Game</Label>
              <Select 
                value={selectedGame || 'pokemon'} 
                onValueChange={(value) => handleGameChange(value as TCGGame)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TCG_GAMES).map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.game && (
                <p className="text-sm text-red-500 mt-1">{errors.game.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="characterName">Character Name</Label>
                <Input
                  id="characterName"
                  {...register('characterName')}
                  placeholder={`e.g., ${selectedGame === 'pokemon' ? 'Pikachu' : selectedGame === 'onepiece' ? 'Luffy' : selectedGame === 'lorcana' ? 'Mickey Mouse' : selectedGame === 'magic' ? 'Jace Beleren' : 'Goku'}`}
                />
                {errors.characterName && (
                  <p className="text-sm text-red-500 mt-1">{errors.characterName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="characterType">Type/Color</Label>
                <Select 
                  value={watchedValues.characterType || ''} 
                  onValueChange={(value) => setValue('characterType', value)}
                >
                  <SelectTrigger>
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
              <Select 
                value={watchedValues.language || 'english'} 
                onValueChange={(value: any) => setValue('language', value)}
              >
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

            <div>
              <Label htmlFor="model">AI Model</Label>
              <Select 
                value={watchedValues.model || 'imagen-4.0-ultra-generate-001'} 
                onValueChange={(value: any) => setValue('model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.model && (
                <p className="text-sm text-red-500 mt-1">{errors.model.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Card Properties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Card Properties</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Special/Full Art</Label>
                  <p className="text-sm text-muted-foreground">Premium full-art layout</p>
                </div>
                <Switch
                  checked={watchedValues.isSpecialArt}
                  onCheckedChange={(checked) => setValue('isSpecialArt', checked)}
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
              <Label htmlFor="characterDescription">Character Description</Label>
              <Textarea
                id="characterDescription"
                {...register('characterDescription')}
                placeholder="Describe the character's appearance, pose, and action..."
                className="min-h-[100px]"
              />
              {errors.characterDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.characterDescription.message}</p>
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

          {/* Game-specific stats */}
          {renderGameSpecificStats()}

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
              `Generate ${gameConfig.name} Card`
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

    {/* Preview Section */}
    <Card>
      <CardHeader>
        <CardTitle>Generated Card Preview</CardTitle>
        <CardDescription>
          Your {gameConfig.name} card will appear here
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedCard ? (
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg p-4">
              <img
                src={`data:image/jpeg;base64,${generatedCard.imageBase64}`}
                alt={`Generated ${gameConfig.name} Card`}
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
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground text-center">
              {isGenerating 
                ? `Generating your ${gameConfig.name} card...` 
                : 'Fill out the form and click generate to create your card'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
  );
}
