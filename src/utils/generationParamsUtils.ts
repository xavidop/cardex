import type { CardGenerationParams, PhotoCardGenerationParams } from '@/types';

/**
 * Generic function to serialize any params object to URLSearchParams
 */
function serializeParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams;
}

export function serializeGenerationParams(params: CardGenerationParams): URLSearchParams {
  return serializeParams(params);
}

export function serializePhotoGenerationParams(params: PhotoCardGenerationParams): URLSearchParams {
  return serializeParams(params);
}

/**
 * Generic helper to safely parse a number from URLSearchParams
 */
function parseNumber(searchParams: URLSearchParams, key: string): number | undefined {
  const value = searchParams.get(key);
  return value ? parseInt(value) : undefined;
}

/**
 * Generic helper to safely parse a boolean from URLSearchParams
 */
function parseBoolean(searchParams: URLSearchParams, key: string): boolean | undefined {
  const value = searchParams.get(key);
  return value === 'true' ? true : value === 'false' ? false : undefined;
}

/**
 * Generic helper to safely get a string from URLSearchParams
 */
function parseString(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key) || undefined;
}

export function parseGenerationParams(searchParams: URLSearchParams): Partial<CardGenerationParams> {
  const params: Partial<CardGenerationParams> = {};
  
  // String fields
  const stringFields = ['pokemonName', 'pokemonType', 'backgroundDescription', 'pokemonDescription', 'language', 'attackName1', 'attackName2', 'weakness', 'resistance'];
  stringFields.forEach(field => {
    const value = parseString(searchParams, field);
    if (value !== undefined) {
      (params as any)[field] = value;
    }
  });

  // Boolean fields
  const booleanFields = ['isIllustrationRare', 'isHolo'];
  booleanFields.forEach(field => {
    const value = parseBoolean(searchParams, field);
    if (value !== undefined) {
      (params as any)[field] = value;
    }
  });

  // Number fields
  const numberFields = ['hp', 'attackDamage1', 'attackDamage2', 'retreatCost'];
  numberFields.forEach(field => {
    const value = parseNumber(searchParams, field);
    if (value !== undefined) {
      (params as any)[field] = value;
    }
  });

  return params;
}

export function parsePhotoGenerationParams(searchParams: URLSearchParams): Partial<PhotoCardGenerationParams> {
  const params: Partial<PhotoCardGenerationParams> = {};
  
  // String fields
  const stringFields = ['photoDataUri', 'pokemonName', 'pokemonType', 'styleDescription', 'language', 'attackName1', 'attackName2', 'weakness', 'resistance'];
  stringFields.forEach(field => {
    const value = parseString(searchParams, field);
    if (value !== undefined) {
      (params as any)[field] = value;
    }
  });

  // Number fields
  const numberFields = ['hp', 'attackDamage1', 'attackDamage2', 'retreatCost'];
  numberFields.forEach(field => {
    const value = parseNumber(searchParams, field);
    if (value !== undefined) {
      (params as any)[field] = value;
    }
  });

  return params;
}
