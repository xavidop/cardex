/**
 * Shared game-specific prompt generators for TCG card generation.
 * Used by both standard card generation and photo-based card generation.
 */

interface BaseCardParams {
  characterName: string;
  characterType: string;
  language?: string;
}

interface PokemonParams extends BaseCardParams {
  hp?: number;
  attackName1?: string;
  attackDamage1?: number;
  attackName2?: string;
  attackDamage2?: number;
  weakness?: string;
  resistance?: string;
  retreatCost?: number;
}

interface OnePieceParams extends BaseCardParams {
  power?: number;
  cost?: number;
  counter?: number;
  lifePoints?: number;
}

interface LorcanaParams extends BaseCardParams {
  inkCost?: number;
  strength?: number;
  willpower?: number;
  lore?: number;
  inkable?: boolean;
}

interface MagicParams extends BaseCardParams {
  manaCost?: string;
  cardType?: string;
  subType?: string;
  powerToughness?: string;
}

interface DragonBallParams extends BaseCardParams {
  combatPower?: number;
  comboCost?: number;
  comboEnergy?: number;
  era?: string;
}

export function generatePokemonPrompt(params: PokemonParams): string {
  const {
    characterName,
    characterType,
    hp = 130,
    attackName1 = "Quick Attack",
    attackDamage1 = 60,
    attackName2 = "Special Move",
    attackDamage2 = 90,
    weakness = "Fighting",
    resistance = "Psychic",
    retreatCost = 2,
    language = 'english',
  } = params;

  const languageNote = language !== 'english' ? `All attack names and descriptions should be written in ${language}.` : '';

  return `The card layout includes: The top left corner displays "${characterName}" in a stylized font, with "HP ${hp}" next to it in red. Below the Pokémon's name, the ${characterType} type symbol is clearly visible. In the lower section, the card has two attacks listed. The first attack is ${attackName1}, deals ${attackDamage1} damage. The second attack is ${attackName2}, deals ${attackDamage2} damage.

Below the attacks, the Weakness is ${weakness} (x2), Resistance is ${resistance} (-30), and Retreat Cost shows ${retreatCost} energy symbols. The bottom edge of the card features a thin line of text indicating the rarity and copyright information.

${languageNote}

The overall style should match official Pokémon TCG card design with proper fonts, layout, and professional quality artwork.`;
}

export function generateOnePiecePrompt(params: OnePieceParams): string {
  const {
    characterName,
    characterType,
    power = 5000,
    cost = 4,
    counter = 1000,
    lifePoints,
  } = params;

  const leaderInfo = lifePoints ? `As a Leader card, it displays ${lifePoints} life points in the top corner.` : '';

  return `The card layout follows One Piece Card Game design: The character name "${characterName}" appears prominently at the top. The card shows a ${characterType} color indicator. The cost of ${cost} is displayed in the top left corner. The power value of ${power} is shown prominently. The counter value of ${counter} appears at the bottom. ${leaderInfo}

The card includes attribute icons and a text box for abilities. The bottom features the One Piece Card Game logo and card number.`;
}

export function generateLorcanaPrompt(params: LorcanaParams): string {
  const {
    characterName,
    characterType,
    inkCost = 3,
    strength = 2,
    willpower = 3,
    lore = 2,
    inkable = true,
  } = params;

  const inkableIndicator = inkable ? 'The card has an inkwell symbol in the bottom left, indicating it is inkable.' : 'No inkwell symbol appears, as this card is not inkable.';

  return `The card layout follows Disney Lorcana design: "${characterName}" appears as the character name at the top. The ${characterType} ink color is indicated by the card's color scheme and symbol. The ink cost of ${inkCost} is displayed in a prominent circle in the top left corner.

The card shows strength of ${strength} (shield icon), willpower of ${willpower} (hexagon icon), and lore value of ${lore} (diamond icon) clearly displayed. ${inkableIndicator}

The card includes a text box for character abilities and flavor text in the Disney Lorcana style. The bottom features the Lorcana logo, card number, and rarity symbol.`;
}

export function generateMagicPrompt(params: MagicParams): string {
  const {
    characterName,
    characterType,
    manaCost = '{2}{G}',
    cardType = 'Creature',
    subType = 'Elf Warrior',
    powerToughness = '3/3',
  } = params;

  return `The card layout follows Magic: The Gathering design: "${characterName}" appears as the card name at the top. The mana cost ${manaCost} is displayed in the top right corner using standard Magic mana symbols. The ${characterType} color frame is used.

The type line reads "${cardType} — ${subType}". The main illustration takes up the center portion of the card. Below the illustration is a text box for abilities and flavor text.

${cardType.toLowerCase().includes('creature') ? `The bottom right corner displays the power/toughness of ${powerToughness}.` : ''}

The bottom features the expansion symbol, card number, artist credit, and copyright information in standard Magic: The Gathering layout.`;
}

export function generateDragonBallPrompt(params: DragonBallParams): string {
  const {
    characterName,
    characterType,
    combatPower = 20000,
    comboCost = 1,
    comboEnergy = 5000,
    era = 'Universe Survival Saga',
  } = params;

  return `The card layout follows Dragon Ball Super Card Game design: The character name "${characterName}" appears at the top in the distinctive Dragon Ball font. The card uses a ${characterType} color border and energy symbols.

The combat power of ${combatPower} is prominently displayed in the top right corner. The combo cost shows ${comboCost} and combo energy displays ${comboEnergy}. The era "${era}" is indicated on the card.

The card includes energy cost symbols, special traits, and a text box for card effects. The character illustration is dynamic and action-packed. The bottom features the Dragon Ball Super Card Game logo, card number, and rarity indicator.`;
}
