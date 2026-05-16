import {
  DragonSuit,
  DynamicTileValues,
  GameConfig,
  Hand,
  Tile,
  WindSuit,
} from '@hbg/shared-types';

/**
 * Deck creation and manipulation. The deck is plain data — everything
 * here is pure so the engine stays trivially testable.
 *
 * A standard "round" of the deck contains:
 *  - 4 copies of each number tile (1..9)  → 36 tiles
 *  - 4 copies of each dragon (red, green, white) → 12 tiles
 *  - 4 copies of each wind (east, south, west, north) → 16 tiles
 *
 * 64 tiles in total. The exact composition isn't load-bearing — the
 * rules only care that there are number and non-number tiles to draw.
 */

const DRAGON_SUITS: DragonSuit[] = ['red', 'green', 'white'];
const WIND_SUITS: WindSuit[] = ['east', 'south', 'west', 'north'];
const COPIES_PER_TILE = 4;

export const dragonKey = (suit: DragonSuit): string => `dragon:${suit}`;
export const windKey = (suit: WindSuit): string => `wind:${suit}`;

/**
 * Build the initial dynamic-tile-value map. Every Dragon and Wind tileKey
 * starts at `config.nonNumberBaseValue` and floats up/down from there.
 */
export function createDynamicTileValues(config: GameConfig): DynamicTileValues {
  const values: DynamicTileValues = {};
  for (const s of DRAGON_SUITS) values[dragonKey(s)] = config.nonNumberBaseValue;
  for (const s of WIND_SUITS) values[windKey(s)] = config.nonNumberBaseValue;
  return values;
}

/**
 * Builds one fresh, unshuffled deck. Tiles are stamped with unique ids
 * so the UI can use them as stable trackBy keys; dynamic tiles also
 * carry a stable `tileKey` shared by every physical copy.
 */
export function createDeck(
  dynamicTileValues: DynamicTileValues,
  config: GameConfig,
  idPrefix = 'd0'
): Hand {
  const tiles: Tile[] = [];
  let n = 0;
  const nextId = () => `${idPrefix}-${n++}`;

  for (let face = 1; face <= 9; face++) {
    for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
      tiles.push({
        id: nextId(),
        category: 'number',
        face,
        value: face,
      });
    }
  }

  for (const suit of DRAGON_SUITS) {
    const key = dragonKey(suit);
    for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
      tiles.push({
        id: nextId(),
        category: 'dragon',
        suit,
        tileKey: key,
        value: dynamicTileValues[key] ?? config.nonNumberBaseValue,
      });
    }
  }

  for (const suit of WIND_SUITS) {
    const key = windKey(suit);
    for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
      tiles.push({
        id: nextId(),
        category: 'wind',
        suit,
        tileKey: key,
        value: dynamicTileValues[key] ?? config.nonNumberBaseValue,
      });
    }
  }

  return tiles;
}

/**
 * Fisher-Yates shuffle. Accepts a custom RNG so tests can inject a
 * deterministic source.
 */
export function shuffle<T>(tiles: T[], rng: () => number = Math.random): T[] {
  const out = [...tiles];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Rewrite the current value on every dynamic tile in `tiles` so it
 * matches the authoritative `dynamicTileValues` map. Called after
 * a Dragon/Wind value changes — keeps cards in the draw pile up-to-date
 * before they get dealt.
 */
export function syncTileValues(tiles: Hand, dynamicTileValues: DynamicTileValues): Hand {
  return tiles.map((t) => {
    if (t.category === 'number') return t;
    const nextValue = dynamicTileValues[t.tileKey];
    if (nextValue === undefined || nextValue === t.value) return t;
    return { ...t, value: nextValue };
  });
}

export function totalOfHand(hand: Hand): number {
  return hand.reduce((sum, t) => sum + t.value, 0);
}
