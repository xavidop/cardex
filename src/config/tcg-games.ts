import type { TCGGame } from '@/constants';

export interface TCGGameConfig {
  id: TCGGame;
  name: string;
  types: string[];
  rarities: string[];
  defaultStats: Record<string, any>;
  statFields: {
    name: string;
    label: string;
    type: 'number' | 'string' | 'boolean';
    min?: number;
    max?: number;
    placeholder?: string;
    required?: boolean;
  }[];
}

export const TCG_GAMES: Record<TCGGame, TCGGameConfig> = {
  pokemon: {
    id: 'pokemon',
    name: 'Pokémon TCG',
    types: [
      'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
      'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 
      'Steel', 'Fairy'
    ],
    rarities: ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Secret Rare'],
    defaultStats: {
      hp: 130,
      attackName1: 'Quick Attack',
      attackDamage1: 60,
      attackName2: 'Special Move',
      attackDamage2: 90,
      weakness: 'Fighting',
      resistance: 'Psychic',
      retreatCost: 2,
    },
    statFields: [
      { name: 'hp', label: 'HP', type: 'number', min: 10, max: 999, placeholder: '130', required: false },
      { name: 'attackName1', label: 'Attack 1 Name', type: 'string', placeholder: 'Quick Attack', required: false },
      { name: 'attackDamage1', label: 'Attack 1 Damage', type: 'number', min: 0, max: 999, placeholder: '60', required: false },
      { name: 'attackName2', label: 'Attack 2 Name', type: 'string', placeholder: 'Special Move', required: false },
      { name: 'attackDamage2', label: 'Attack 2 Damage', type: 'number', min: 0, max: 999, placeholder: '90', required: false },
      { name: 'weakness', label: 'Weakness', type: 'string', placeholder: 'Fighting', required: false },
      { name: 'resistance', label: 'Resistance', type: 'string', placeholder: 'Psychic', required: false },
      { name: 'retreatCost', label: 'Retreat Cost', type: 'number', min: 0, max: 5, placeholder: '2', required: false },
    ]
  },
  onepiece: {
    id: 'onepiece',
    name: 'One Piece Card Game',
    types: ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'],
    rarities: ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Secret Rare', 'Leader'],
    defaultStats: {
      power: 5000,
      cost: 4,
      counter: 1000,
      color: 'Red',
    },
    statFields: [
      { name: 'power', label: 'Power', type: 'number', min: 0, max: 12000, placeholder: '5000', required: false },
      { name: 'cost', label: 'Cost', type: 'number', min: 0, max: 10, placeholder: '4', required: false },
      { name: 'counter', label: 'Counter', type: 'number', min: 0, max: 2000, placeholder: '1000', required: false },
      { name: 'lifePoints', label: 'Life Points (Leader)', type: 'number', min: 0, max: 5, placeholder: '4', required: false },
    ]
  },
  lorcana: {
    id: 'lorcana',
    name: 'Disney Lorcana',
    types: ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'],
    rarities: ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Legendary', 'Enchanted'],
    defaultStats: {
      inkCost: 3,
      strength: 2,
      willpower: 3,
      lore: 2,
      inkable: true,
    },
    statFields: [
      { name: 'inkCost', label: 'Ink Cost', type: 'number', min: 0, max: 10, placeholder: '3', required: false },
      { name: 'strength', label: 'Strength', type: 'number', min: 0, max: 10, placeholder: '2', required: false },
      { name: 'willpower', label: 'Willpower', type: 'number', min: 0, max: 10, placeholder: '3', required: false },
      { name: 'lore', label: 'Lore', type: 'number', min: 0, max: 5, placeholder: '2', required: false },
      { name: 'inkable', label: 'Inkable', type: 'boolean', required: false },
    ]
  },
  magic: {
    id: 'magic',
    name: 'Magic: The Gathering',
    types: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'],
    rarities: ['Common', 'Uncommon', 'Rare', 'Mythic Rare'],
    defaultStats: {
      manaCost: '{2}{G}',
      cardType: 'Creature',
      subType: 'Elf Warrior',
      powerToughness: '3/3',
    },
    statFields: [
      { name: 'manaCost', label: 'Mana Cost', type: 'string', placeholder: '{2}{G}', required: false },
      { name: 'cardType', label: 'Card Type', type: 'string', placeholder: 'Creature', required: false },
      { name: 'subType', label: 'Subtype', type: 'string', placeholder: 'Elf Warrior', required: false },
      { name: 'powerToughness', label: 'Power/Toughness', type: 'string', placeholder: '3/3', required: false },
    ]
  },
  dragonball: {
    id: 'dragonball',
    name: 'Dragon Ball Super Card Game',
    types: ['Red', 'Blue', 'Green', 'Yellow'],
    rarities: ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Special Rare', 'Secret Rare'],
    defaultStats: {
      combatPower: 20000,
      comboCost: 1,
      comboEnergy: 5000,
      era: 'Universe Survival Saga',
    },
    statFields: [
      { name: 'combatPower', label: 'Combat Power', type: 'number', min: 0, max: 50000, placeholder: '20000', required: false },
      { name: 'comboCost', label: 'Combo Cost', type: 'number', min: 0, max: 5, placeholder: '1', required: false },
      { name: 'comboEnergy', label: 'Combo Energy', type: 'number', min: 0, max: 10000, placeholder: '5000', required: false },
      { name: 'era', label: 'Era', type: 'string', placeholder: 'Universe Survival Saga', required: false },
    ]
  },
};

export const getGameConfig = (game: TCGGame): TCGGameConfig => {
  return TCG_GAMES[game];
};

export const getGameTypes = (game: TCGGame): string[] => {
  return TCG_GAMES[game].types;
};

export const getGameRarities = (game: TCGGame): string[] => {
  return TCG_GAMES[game].rarities;
};

export const getDefaultStats = (game: TCGGame): Record<string, any> => {
  return TCG_GAMES[game].defaultStats;
};
