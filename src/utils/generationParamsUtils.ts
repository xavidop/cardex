import type { CardGenerationParams, PhotoCardGenerationParams } from '@/types';

export function serializeGenerationParams(params: CardGenerationParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams;
}

export function serializePhotoGenerationParams(params: PhotoCardGenerationParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams;
}

export function parseGenerationParams(searchParams: URLSearchParams): Partial<CardGenerationParams> {
  const params: Partial<CardGenerationParams> = {};
  
  if (searchParams.get('pokemonName')) params.pokemonName = searchParams.get('pokemonName')!;
  if (searchParams.get('pokemonType')) params.pokemonType = searchParams.get('pokemonType')!;
  if (searchParams.get('isIllustrationRare')) params.isIllustrationRare = searchParams.get('isIllustrationRare') === 'true';
  if (searchParams.get('isHolo')) params.isHolo = searchParams.get('isHolo') === 'true';
  if (searchParams.get('backgroundDescription')) params.backgroundDescription = searchParams.get('backgroundDescription')!;
  if (searchParams.get('pokemonDescription')) params.pokemonDescription = searchParams.get('pokemonDescription')!;
  if (searchParams.get('language')) params.language = searchParams.get('language') as any;
  if (searchParams.get('hp')) params.hp = parseInt(searchParams.get('hp')!);
  if (searchParams.get('attackName1')) params.attackName1 = searchParams.get('attackName1')!;
  if (searchParams.get('attackDamage1')) params.attackDamage1 = parseInt(searchParams.get('attackDamage1')!);
  if (searchParams.get('attackName2')) params.attackName2 = searchParams.get('attackName2')!;
  if (searchParams.get('attackDamage2')) params.attackDamage2 = parseInt(searchParams.get('attackDamage2')!);
  if (searchParams.get('weakness')) params.weakness = searchParams.get('weakness')!;
  if (searchParams.get('resistance')) params.resistance = searchParams.get('resistance')!;
  if (searchParams.get('retreatCost')) params.retreatCost = parseInt(searchParams.get('retreatCost')!);

  return params;
}

export function parsePhotoGenerationParams(searchParams: URLSearchParams): Partial<PhotoCardGenerationParams> {
  const params: Partial<PhotoCardGenerationParams> = {};
  
  if (searchParams.get('photoDataUri')) params.photoDataUri = searchParams.get('photoDataUri')!;
  if (searchParams.get('pokemonName')) params.pokemonName = searchParams.get('pokemonName')!;
  if (searchParams.get('pokemonType')) params.pokemonType = searchParams.get('pokemonType')!;
  if (searchParams.get('styleDescription')) params.styleDescription = searchParams.get('styleDescription')!;
  if (searchParams.get('language')) params.language = searchParams.get('language') as any;
  if (searchParams.get('hp')) params.hp = parseInt(searchParams.get('hp')!);
  if (searchParams.get('attackName1')) params.attackName1 = searchParams.get('attackName1')!;
  if (searchParams.get('attackDamage1')) params.attackDamage1 = parseInt(searchParams.get('attackDamage1')!);
  if (searchParams.get('attackName2')) params.attackName2 = searchParams.get('attackName2')!;
  if (searchParams.get('attackDamage2')) params.attackDamage2 = parseInt(searchParams.get('attackDamage2')!);
  if (searchParams.get('weakness')) params.weakness = searchParams.get('weakness')!;
  if (searchParams.get('resistance')) params.resistance = searchParams.get('resistance')!;
  if (searchParams.get('retreatCost')) params.retreatCost = parseInt(searchParams.get('retreatCost')!);

  return params;
}
