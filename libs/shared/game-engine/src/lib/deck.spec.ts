import {
  createDeck,
  createDynamicTileValues,
  dragonKey,
  shuffle,
  stampScoringValues,
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

    it('numbers carry face as their scoringValue', () => {
      const deck = createDeck(createDynamicTileValues(baseConfig), baseConfig);
      const numbers = deck.filter((t) => t.category === 'number');
      for (const t of numbers) {
        expect(t.scoringValue).toBe((t as { face: number }).face);
      }
    });

    it('dragons/winds carry the dynamic value passed in as scoringValue', () => {
      const values = createDynamicTileValues(baseConfig);
      values[dragonKey('red')] = 7;
      values[windKey('east')] = 3;
      const deck = createDeck(values, baseConfig);

      const red = deck.find(
        (t) => t.category === 'dragon' && t.suit === 'red'
      );
      const east = deck.find((t) => t.category === 'wind' && t.suit === 'east');
      expect(red?.scoringValue).toBe(7);
      expect(east?.scoringValue).toBe(3);
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
    it('sums tile scoringValue snapshots', () => {
      const hand: Tile[] = [
        { id: 'a', category: 'number', face: 4, scoringValue: 4 },
        { id: 'b', category: 'number', face: 7, scoringValue: 7 },
        {
          id: 'c',
          category: 'dragon',
          suit: 'red',
          tileKey: dragonKey('red'),
          scoringValue: 5,
        },
      ];
      expect(totalOfHand(hand)).toBe(16);
    });

    it('uses the snapshot even if the dynamic map drifts afterwards', () => {
      const hand: Tile[] = [
        {
          id: 'a',
          category: 'dragon',
          suit: 'red',
          tileKey: dragonKey('red'),
          scoringValue: 5, // captured at deal time
        },
        { id: 'b', category: 'number', face: 3, scoringValue: 3 },
      ];
      // Even if the global map says the red dragon is now 8, the hand
      // total still reflects what was on the table when bets were settled.
      expect(totalOfHand(hand)).toBe(8);
    });
  });

  describe('stampScoringValues', () => {
    it('stamps dynamic tiles with the current map value at deal time', () => {
      const values = { [dragonKey('red')]: 8 };
      const hand: Tile[] = [
        {
          id: 'a',
          category: 'dragon',
          suit: 'red',
          tileKey: dragonKey('red'),
          scoringValue: 5,
        },
        { id: 'b', category: 'number', face: 3, scoringValue: 3 },
      ];
      const stamped = stampScoringValues(hand, values);
      expect(stamped[0].scoringValue).toBe(8);
      expect(stamped[1].scoringValue).toBe(3);
    });

    it('leaves number tiles untouched', () => {
      const stamped = stampScoringValues(
        [{ id: 'a', category: 'number', face: 5, scoringValue: 5 }],
        { [dragonKey('red')]: 99 }
      );
      expect(stamped[0].scoringValue).toBe(5);
    });
  });
});
