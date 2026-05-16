import {
  createDeck,
  createDynamicTileValues,
  dragonKey,
  shuffle,
  syncTileValues,
  totalOfHand,
  windKey,
} from './deck';
import { DEFAULT_GAME_CONFIG } from './default-config';
import { GameConfig, Tile } from '@hbg/shared-types';

const baseConfig: GameConfig = { ...DEFAULT_GAME_CONFIG };

describe('deck', () => {
  describe('createDynamicTileValues', () => {
    it('starts every Dragon and Wind tileKey at config.nonNumberBaseValue', () => {
      const values = createDynamicTileValues(baseConfig);
      expect(values[dragonKey('red')]).toBe(baseConfig.nonNumberBaseValue);
      expect(values[dragonKey('green')]).toBe(baseConfig.nonNumberBaseValue);
      expect(values[dragonKey('white')]).toBe(baseConfig.nonNumberBaseValue);
      expect(values[windKey('east')]).toBe(baseConfig.nonNumberBaseValue);
      expect(values[windKey('south')]).toBe(baseConfig.nonNumberBaseValue);
      expect(values[windKey('west')]).toBe(baseConfig.nonNumberBaseValue);
      expect(values[windKey('north')]).toBe(baseConfig.nonNumberBaseValue);
    });

    it('honours a custom config value', () => {
      const values = createDynamicTileValues({ ...baseConfig, nonNumberBaseValue: 7 });
      expect(values[dragonKey('red')]).toBe(7);
      expect(values[windKey('east')]).toBe(7);
    });
  });

  describe('createDeck', () => {
    it('contains 64 tiles (36 number + 12 dragon + 16 wind)', () => {
      const deck = createDeck(createDynamicTileValues(baseConfig), baseConfig);
      expect(deck).toHaveLength(64);

      const numbers = deck.filter((t) => t.category === 'number');
      const dragons = deck.filter((t) => t.category === 'dragon');
      const winds = deck.filter((t) => t.category === 'wind');
      expect(numbers).toHaveLength(36);
      expect(dragons).toHaveLength(12);
      expect(winds).toHaveLength(16);
    });

    it('numbers carry their face value', () => {
      const deck = createDeck(createDynamicTileValues(baseConfig), baseConfig);
      const numbers = deck.filter((t) => t.category === 'number');
      for (const t of numbers) {
        expect(t.value).toBe((t as { face: number }).face);
      }
    });

    it('dragons/winds carry the dynamic value passed in', () => {
      const values = createDynamicTileValues(baseConfig);
      values[dragonKey('red')] = 7;
      values[windKey('east')] = 3;
      const deck = createDeck(values, baseConfig);

      const red = deck.find(
        (t) => t.category === 'dragon' && t.suit === 'red'
      );
      const east = deck.find((t) => t.category === 'wind' && t.suit === 'east');
      expect(red?.value).toBe(7);
      expect(east?.value).toBe(3);
    });

    it('assigns unique ids', () => {
      const deck = createDeck(createDynamicTileValues(baseConfig), baseConfig);
      const ids = new Set(deck.map((t) => t.id));
      expect(ids.size).toBe(deck.length);
    });
  });

  describe('shuffle', () => {
    it('returns a permutation, not the same reference', () => {
      const deck = createDeck(createDynamicTileValues(baseConfig), baseConfig);
      const shuffled = shuffle(deck);
      expect(shuffled).not.toBe(deck);
      expect(shuffled).toHaveLength(deck.length);
      expect(new Set(shuffled.map((t) => t.id))).toEqual(
        new Set(deck.map((t) => t.id))
      );
    });
  });

  describe('totalOfHand', () => {
    it('sums tile values', () => {
      const hand: Tile[] = [
        { id: 'a', category: 'number', face: 4, value: 4 },
        { id: 'b', category: 'number', face: 7, value: 7 },
        {
          id: 'c',
          category: 'dragon',
          suit: 'red',
          tileKey: dragonKey('red'),
          value: 5,
        },
      ];
      expect(totalOfHand(hand)).toBe(16);
    });
  });

  describe('syncTileValues', () => {
    it('rewrites dynamic tile values from the authoritative map', () => {
      const values = { [dragonKey('red')]: 8 };
      const hand: Tile[] = [
        {
          id: 'a',
          category: 'dragon',
          suit: 'red',
          tileKey: dragonKey('red'),
          value: 5,
        },
        { id: 'b', category: 'number', face: 3, value: 3 },
      ];
      const synced = syncTileValues(hand, values);
      expect(synced[0].value).toBe(8);
      expect(synced[1].value).toBe(3);
    });

    it('leaves number tiles untouched', () => {
      const synced = syncTileValues(
        [{ id: 'a', category: 'number', face: 5, value: 5 }],
        { [dragonKey('red')]: 99 }
      );
      expect(synced[0].value).toBe(5);
    });
  });
});
