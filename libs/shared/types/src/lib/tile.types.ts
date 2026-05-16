/**
 * Mahjong-flavoured tile model.
 *
 * Number tiles carry a fixed face value. Dragon and Wind tiles are
 * "dynamic" tiles — their value floats up or down across the game based
 * on whether the hand they appeared in won or lost. Each individual
 * dynamic tile keeps its own running value (tracked by `tileKey`), so
 * two Red Dragons that have lived different lives can hold different
 * values at the same time.
 */
export type TileCategory = 'number' | 'dragon' | 'wind';

export type DragonSuit = 'red' | 'green' | 'white';
export type WindSuit = 'east' | 'south' | 'west' | 'north';

export interface NumberTile {
  id: string;
  category: 'number';
  /** 1–9, matches face value. */
  face: number;
  value: number;
}

export interface DragonTile {
  id: string;
  category: 'dragon';
  suit: DragonSuit;
  /** Stable key shared by every physical copy of this dragon — e.g. "dragon:red". */
  tileKey: string;
  value: number;
}

export interface WindTile {
  id: string;
  category: 'wind';
  suit: WindSuit;
  /** Stable key shared by every physical copy of this wind — e.g. "wind:east". */
  tileKey: string;
  value: number;
}

export type Tile = NumberTile | DragonTile | WindTile;

/** A hand drawn from the deck — `GAME_CONFIG.handSize` tiles. */
export type Hand = Tile[];

/**
 * Map of every dynamic (Dragon / Wind) tileKey to its current value.
 * Authoritative source of truth for dynamic tile values; the deck reads
 * from this map every time a fresh tile is dealt.
 */
export type DynamicTileValues = Record<string, number>;
