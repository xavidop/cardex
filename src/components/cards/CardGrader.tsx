'use client';

import { useState, type ChangeEvent, useRef } from 'react';
import { gradeTCGCard, type GradeTCGCardOutput } from '@/ai/flows/grade-tcg-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Camera, Award, TrendingUp, Shield } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TCGGame } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function CardGrader() {
  const { hasGeminiKey } = useApiKeys();
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradeTCGCardOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Front image (required)
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [frontImageDataUrl, setFrontImageDataUrl] = useState<string | null>(null);
  
  // Back image (optional)
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
  const [backImageDataUrl, setBackImageDataUrl] = useState<string | null>(null);
  
  // Optional metadata for better grading
  const [cardName, setCardName] = useState('');
  const [cardSet, setCardSet] = useState('');
  const [game, setGame] = useState<TCGGame | ''>('');
  const [gradingScale, setGradingScale] = useState<'PSA' | 'BGS' | 'CGC'>('PSA');

  const { toast } = useToast();
  const { user } = useAuth();
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const handleFrontImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset previous grading state
      setGradingResult(null);
      setError(null);
      setFrontImageDataUrl(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setFrontImagePreview(dataUrl);
        setFrontImageDataUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset previous grading state
      setGradingResult(null);
      setError(null);
      setBackImageDataUrl(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setBackImagePreview(dataUrl);
        setBackImageDataUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGrade = async () => {
    if (!frontImageDataUrl) {
      toast({ 
        title: 'No front image selected', 
        description: 'Please select the front image of the card to grade.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!hasGeminiKey) {
      setError('Gemini API key is required to grade trading cards. Please configure it in Settings.');
      toast({ 
        title: 'API Key Required', 
        description: 'Gemini API key is required. Please configure it in Settings.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsGrading(true);
    setError(null);
    setGradingResult(null);

    try {
      const result = await gradeTCGCard({ 
        frontPhotoDataUri: frontImageDataUrl,
        backPhotoDataUri: backImageDataUrl || undefined,
        userId: user?.uid || '',
        cardName: cardName || undefined,
        cardSet: cardSet || undefined,
        game: game || undefined,
        gradingScale
      });
      
      if (result.error) {
        setError(result.error);
        toast({ 
          title: 'Grading Failed', 
          description: result.error, 
          variant: 'destructive' 
        });
      } else if (result.gradingResult) {
        setGradingResult(result);
        toast({ 
          title: 'Grading Complete', 
          description: `Card graded: ${result.gradingResult.gradeName}`, 
          variant: 'default' 
        });
      } else {
        setError('Unexpected response from grading service.');
        toast({ 
          title: 'Grading Error', 
          description: 'Unexpected response from grading service.', 
          variant: 'destructive' 
        });
      }
    } catch (e) {
      console.error('Grading error:', e);
      const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred during grading.';
      setError(errorMessage);
      toast({ 
        title: 'Grading Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsGrading(false);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 9.5) return 'text-green-600 dark:text-green-400';
    if (grade >= 8) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getScorePercentage = (score: number) => (score / 10) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Show results in optimized layout when grading is complete */}
      {gradingResult?.gradingResult ? (
        <div className="space-y-6">
          {/* Top Section - Overall Grade & Images */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Images - Compact on the left */}
                <div className="flex gap-4 md:w-1/3">
                  {frontImagePreview && (
                    <div className="flex-1">
                      <Label className="text-xs font-medium mb-2 block">Front</Label>
                      <div className="relative w-full aspect-[2.5/3.5] border rounded-lg overflow-hidden">
                        <Image
                          src={frontImagePreview}
                          alt="Card front"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {backImagePreview && (
                    <div className="flex-1">
                      <Label className="text-xs font-medium mb-2 block">Back</Label>
                      <div className="relative w-full aspect-[2.5/3.5] border rounded-lg overflow-hidden">
                        <Image
                          src={backImagePreview}
                          alt="Card back"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Overall Grade - Center */}
                <div className="flex-1 text-center space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {gradingResult.gradingResult.gradingScale}
                    </Badge>
                    <Button
                      onClick={() => {
                        setGradingResult(null);
                        setError(null);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Grade Another
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Overall Grade</p>
                    <div className={`text-7xl font-bold ${getGradeColor(gradingResult.gradingResult.overallGrade)}`}>
                      {gradingResult.gradingResult.overallGrade}
                    </div>
                    <p className="text-2xl font-semibold mt-2">{gradingResult.gradingResult.gradeName}</p>
                  </div>
                  {gradingResult.gradingResult.estimatedValue && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <TrendingUp className="h-5 w-5" />
                      <p className="text-base font-medium">
                        Est. Value: {gradingResult.gradingResult.estimatedValue}
                      </p>
                    </div>
                  )}
                  
                  {/* AI Disclaimer */}
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      ⚠️ This grade is generated by Google Gemini AI and is for reference only. 
                      Final professional grading results may vary. Always consult with PSA, BGS, or CGC for official grading.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Centering */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Centering</span>
                  <span className="text-lg font-bold">{gradingResult.gradingResult.centering.score}/10</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={getScorePercentage(gradingResult.gradingResult.centering.score)} className="h-2" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Front: {gradingResult.gradingResult.centering.frontCentering}</p>
                  <p>Back: {gradingResult.gradingResult.centering.backCentering}</p>
                  <p className="pt-1">{gradingResult.gradingResult.centering.notes}</p>
                </div>
              </CardContent>
            </Card>

            {/* Corners */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Corners</span>
                  <span className="text-lg font-bold">{gradingResult.gradingResult.corners.score}/10</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={getScorePercentage(gradingResult.gradingResult.corners.score)} className="h-2" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">{gradingResult.gradingResult.corners.condition}</p>
                  <p>{gradingResult.gradingResult.corners.notes}</p>
                </div>
              </CardContent>
            </Card>

            {/* Edges */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Edges</span>
                  <span className="text-lg font-bold">{gradingResult.gradingResult.edges.score}/10</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={getScorePercentage(gradingResult.gradingResult.edges.score)} className="h-2" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">{gradingResult.gradingResult.edges.condition}</p>
                  <p>{gradingResult.gradingResult.edges.notes}</p>
                </div>
              </CardContent>
            </Card>

            {/* Surface */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Surface</span>
                  <span className="text-lg font-bold">{gradingResult.gradingResult.surface.score}/10</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={getScorePercentage(gradingResult.gradingResult.surface.score)} className="h-2" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">{gradingResult.gradingResult.surface.condition}</p>
                  <p>{gradingResult.gradingResult.surface.notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {gradingResult.gradingResult.detailedAnalysis}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {gradingResult.gradingResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Upload Form - Show when no results */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6" />
              Card Grading Tool
            </CardTitle>
            <CardDescription>
              Upload a photo of your card to receive a professional-grade assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Card Images</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Image */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Front (Required)</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
                  {frontImagePreview ? (
                    <div className="relative w-full aspect-[2.5/3.5]">
                      <Image
                        src={frontImagePreview}
                        alt="Card front"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-8">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Front of Card</p>
                        <p className="text-xs text-muted-foreground">
                          Show all edges & corners
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => frontFileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {frontImagePreview ? 'Change Front' : 'Upload Front'}
                </Button>
                <input
                  ref={frontFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFrontImageChange}
                  className="hidden"
                />
              </div>

              {/* Back Image */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Back (Optional)</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
                  {backImagePreview ? (
                    <div className="relative w-full aspect-[2.5/3.5]">
                      <Image
                        src={backImagePreview}
                        alt="Card back"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-8">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Back of Card</p>
                        <p className="text-xs text-muted-foreground">
                          For accurate centering
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => backFileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {backImagePreview ? 'Change Back' : 'Upload Back'}
                </Button>
                <input
                  ref={backFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Optional Card Metadata */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Optional Card Information</h3>
            <p className="text-xs text-muted-foreground">
              Providing card details helps with value estimation
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Card Name</Label>
                <Input
                  id="cardName"
                  placeholder="e.g., Charizard"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardSet">Card Set</Label>
                <Input
                  id="cardSet"
                  placeholder="e.g., Base Set"
                  value={cardSet}
                  onChange={(e) => setCardSet(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="game">Game (Optional)</Label>
                <Select value={game || undefined} onValueChange={(value) => setGame(value as TCGGame)}>
                  <SelectTrigger id="game">
                    <SelectValue placeholder="Auto-detect from image" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pokemon">Pokémon</SelectItem>
                    <SelectItem value="onepiece">One Piece</SelectItem>
                    <SelectItem value="lorcana">Lorcana</SelectItem>
                    <SelectItem value="magic">Magic: The Gathering</SelectItem>
                    <SelectItem value="dragonball">Dragon Ball</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gradingScale">Grading Scale</Label>
                <Select 
                  value={gradingScale} 
                  onValueChange={(value) => setGradingScale(value as 'PSA' | 'BGS' | 'CGC')}
                >
                  <SelectTrigger id="gradingScale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PSA">PSA</SelectItem>
                    <SelectItem value="BGS">BGS (Beckett)</SelectItem>
                    <SelectItem value="CGC">CGC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Grade Button */}
          <Button
            onClick={handleGrade}
            disabled={!frontImageDataUrl || isGrading || !hasGeminiKey}
            className="w-full"
            size="lg"
          >
            {isGrading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Card{backImageDataUrl ? 's' : ''}...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Grade Card
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
