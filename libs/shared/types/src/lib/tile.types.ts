/**
 * Mahjong-flavoured tile model.
 *
 * Number tiles carry a fixed face value. Dragon and Wind tiles are
 * "dynamic" tiles — the running value for every tileKey lives in the
 * `DynamicTileValues` map on the game state and shifts based on whether
 * the hand they appeared in won or lost.
 *
 * Each physical tile instance carries a `scoringValue` set when it is
 * dealt into a hand. That snapshot is the value used to total the hand,
 * display the card, and write the history row — it never changes after
 * the deal. Drift from a win or loss applies to *future* deals via the
 * `DynamicTileValues` map, not to tiles already in play.
 */
export type TileCategory = 'number' | 'dragon' | 'wind';

export type DragonSuit = 'red' | 'green' | 'white';
export type WindSuit = 'east' | 'south' | 'west' | 'north';

export interface NumberTile {
  id: string;
  category: 'number';
  /** 1–9, matches face value. */
  face: number;
  /** Snapshot used for scoring & display — always equals `face` for numbers. */
  scoringValue: number;
}

export interface DragonTile {
  id: string;
  category: 'dragon';
  suit: DragonSuit;
  /** Stable key shared by every physical copy of this dragon — e.g. "dragon:red". */
  tileKey: string;
  /** Snapshot of the dynamic value at the moment this tile was dealt. */
  scoringValue: number;
}

export interface WindTile {
  id: string;
  category: 'wind';
  suit: WindSuit;
  /** Stable key shared by every physical copy of this wind — e.g. "wind:east". */
  tileKey: string;
  /** Snapshot of the dynamic value at the moment this tile was dealt. */
  scoringValue: number;
}

export type Tile = NumberTile | DragonTile | WindTile;

/** A hand drawn from the deck — `GameConfig.handSize` tiles. */
export type Hand = Tile[];

/**
 * Map of every dynamic (Dragon / Wind) tileKey to its current value.
 * Authoritative source of truth for *future* deals; the deck stamps a
 * fresh `scoringValue` onto each dynamic tile every time it is dealt.
 */
export type DynamicTileValues = Record<string, number>;
