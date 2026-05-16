import { GameConfig, GameState, Hand, Tile } from '@hbg/shared-types';
import { createGame, placeBet } from './game-engine';
import { DEFAULT_GAME_CONFIG } from './default-config';
import { dragonKey, windKey } from './deck';

/* ---------- helpers ---------- */

const baseConfig: GameConfig = { ...DEFAULT_GAME_CONFIG };

function numberTile(face: number, id = `n-${face}-${Math.random()}`): Tile {
  return { id, category: 'number', face, value: face };
}

function dragonTile(
  suit: 'red' | 'green' | 'white',
  value: number,
  id = `dr-${suit}-${Math.random()}`
): Tile {
  return { id, category: 'dragon', suit, tileKey: dragonKey(suit), value };
}

function windTile(
  suit: 'east' | 'south' | 'west' | 'north',
  value: number,
  id = `w-${suit}-${Math.random()}`
): Tile {
  return { id, category: 'wind', suit, tileKey: windKey(suit), value };
}

/** Build a state we have full control over for deterministic transitions. */
function buildState(overrides: Partial<GameState>): GameState {
  const base: GameState = {
    id: 'test',
    config: baseConfig,
    drawPile: [],
    discardPile: [],
    currentHand: [],
    currentHandTotal: 0,
    dynamicTileValues: {
      [dragonKey('red')]: 5,
      [dragonKey('green')]: 5,
      [dragonKey('white')]: 5,
      [windKey('east')]: 5,
      [windKey('south')]: 5,
      [windKey('west')]: 5,
      [windKey('north')]: 5,
    },
    score: 0,
    handsPlayed: 1,
    reshuffleCount: 0,
    history: [],
    isOver: false,
    overReason: null,
    lastResultMessage: null,
  };
  return { ...base, ...overrides };
}

/* ---------- createGame ---------- */

describe('createGame', () => {
  it('deals a baseline hand and leaves the rest of the deck in the draw pile', () => {
    const game = createGame({ id: 'g1' });
    expect(game.currentHand).toHaveLength(DEFAULT_GAME_CONFIG.handSize);
    expect(game.drawPile.length).toBe(64 - DEFAULT_GAME_CONFIG.handSize);
    expect(game.handsPlayed).toBe(1);
    expect(game.score).toBe(0);
    expect(game.isOver).toBe(false);
  });

  it('falls back to DEFAULT_GAME_CONFIG when no config is passed', () => {
    const game = createGame({ id: 'fallback' });
    expect(game.config).toEqual(DEFAULT_GAME_CONFIG);
  });

  it('respects an injected config for hand size and base values', () => {
    const config: GameConfig = {
      ...DEFAULT_GAME_CONFIG,
      handSize: 4,
      nonNumberBaseValue: 7,
    };
    const game = createGame({ id: 'g2', config });
    expect(game.config).toBe(config);
    expect(game.currentHand).toHaveLength(4);
    expect(game.dynamicTileValues[dragonKey('red')]).toBe(7);
  });
});

/* ---------- betting outcomes ---------- */

describe('placeBet — outcomes', () => {
  it('rewards a correct higher bet (+10)', () => {
    const state = buildState({
      currentHand: [numberTile(1), numberTile(1), numberTile(1)], // total 3
      currentHandTotal: 3,
      drawPile: [
        numberTile(9, 'a'),
        numberTile(9, 'b'),
        numberTile(9, 'c'),
        // padding so no reshuffle is needed
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });

    const { state: next, outcome } = placeBet(state, 'higher');
    expect(outcome).toBe('win');
    expect(next.score).toBe(baseConfig.correctBetPoints);
    expect(next.currentHandTotal).toBe(27);
    expect(next.handsPlayed).toBe(2);
  });

  it('penalises a wrong higher bet (-5)', () => {
    const state = buildState({
      currentHand: [numberTile(9), numberTile(9), numberTile(9)], // total 27
      currentHandTotal: 27,
      drawPile: [
        numberTile(1, 'a'),
        numberTile(1, 'b'),
        numberTile(1, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });

    const { state: next, outcome } = placeBet(state, 'higher');
    expect(outcome).toBe('loss');
    expect(next.score).toBe(baseConfig.wrongBetPoints);
  });

  it('rewards a correct lower bet', () => {
    const state = buildState({
      currentHand: [numberTile(8), numberTile(8), numberTile(8)], // 24
      currentHandTotal: 24,
      drawPile: [
        numberTile(2, 'a'),
        numberTile(2, 'b'),
        numberTile(2, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { outcome, state: next } = placeBet(state, 'lower');
    expect(outcome).toBe('win');
    expect(next.score).toBe(baseConfig.correctBetPoints);
  });

  it('penalises a wrong lower bet', () => {
    const state = buildState({
      currentHand: [numberTile(2), numberTile(2), numberTile(2)], // 6
      currentHandTotal: 6,
      drawPile: [
        numberTile(9, 'a'),
        numberTile(9, 'b'),
        numberTile(9, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { outcome, state: next } = placeBet(state, 'lower');
    expect(outcome).toBe('loss');
    expect(next.score).toBe(baseConfig.wrongBetPoints);
  });

  it('treats equal totals as a tie regardless of bet (0 points)', () => {
    const state = buildState({
      currentHand: [numberTile(3), numberTile(3), numberTile(3)], // 9
      currentHandTotal: 9,
      drawPile: [
        numberTile(3, 'a'),
        numberTile(3, 'b'),
        numberTile(3, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { outcome, state: next } = placeBet(state, 'higher');
    expect(outcome).toBe('tie');
    expect(next.score).toBe(0);
  });

  it('respects custom point values from the injected config', () => {
    const config: GameConfig = {
      ...DEFAULT_GAME_CONFIG,
      correctBetPoints: 25,
      wrongBetPoints: -3,
      tiePoints: 1,
    };
    const state = buildState({
      config,
      currentHand: [numberTile(1), numberTile(1), numberTile(1)],
      currentHandTotal: 3,
      drawPile: [
        numberTile(9, 'a'),
        numberTile(9, 'b'),
        numberTile(9, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { state: next } = placeBet(state, 'higher');
    expect(next.score).toBe(25);
  });
});

/* ---------- dynamic tile values ---------- */

describe('placeBet — Dragon/Wind value drift', () => {
  it('increases each Dragon/Wind in a winning hand by +1', () => {
    const state = buildState({
      currentHand: [numberTile(1), numberTile(1), numberTile(1)], // 3
      currentHandTotal: 3,
      drawPile: [
        dragonTile('red', 5, 'a'),
        windTile('east', 5, 'b'),
        numberTile(9, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { state: next, outcome } = placeBet(state, 'higher');
    expect(outcome).toBe('win');
    expect(next.dynamicTileValues[dragonKey('red')]).toBe(6);
    expect(next.dynamicTileValues[windKey('east')]).toBe(6);
    expect(next.dynamicTileValues[dragonKey('green')]).toBe(5);
  });

  it('decreases each Dragon/Wind in a losing hand by -1', () => {
    const state = buildState({
      currentHand: [numberTile(9), numberTile(9), numberTile(9)],
      currentHandTotal: 27,
      drawPile: [
        dragonTile('red', 5, 'a'),
        windTile('east', 5, 'b'),
        numberTile(1, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { state: next, outcome } = placeBet(state, 'higher');
    expect(outcome).toBe('loss');
    expect(next.dynamicTileValues[dragonKey('red')]).toBe(4);
    expect(next.dynamicTileValues[windKey('east')]).toBe(4);
  });

  it('leaves dynamic values untouched on a tie', () => {
    const state = buildState({
      currentHand: [numberTile(2), numberTile(2), numberTile(2)], // 6
      currentHandTotal: 6,
      drawPile: [
        numberTile(2, 'a'),
        numberTile(2, 'b'),
        numberTile(2, 'c'),
        dragonTile('red', 5, 'd'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { state: next, outcome } = placeBet(state, 'higher');
    expect(outcome).toBe('tie');
    expect(next.dynamicTileValues[dragonKey('red')]).toBe(5);
  });

  it('reflects new dynamic values on the freshly dealt hand', () => {
    const state = buildState({
      currentHand: [numberTile(1), numberTile(1), numberTile(1)],
      currentHandTotal: 3,
      drawPile: [
        dragonTile('red', 5, 'a'),
        dragonTile('red', 5, 'b'),
        numberTile(9, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { state: next } = placeBet(state, 'higher');
    expect(next.dynamicTileValues[dragonKey('red')]).toBe(7);
    const reds = next.currentHand.filter(
      (t) => t.category === 'dragon' && t.suit === 'red'
    );
    expect(reds.every((r) => r.value === 7)).toBe(true);
  });
});

/* ---------- game over conditions ---------- */

describe('placeBet — game over', () => {
  it('ends the game when a dynamic tile drops to 0', () => {
    const state = buildState({
      currentHand: [numberTile(9), numberTile(9), numberTile(9)], // 27
      currentHandTotal: 27,
      drawPile: [
        dragonTile('red', 1, 'a'),
        numberTile(1, 'b'),
        numberTile(1, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
      dynamicTileValues: {
        [dragonKey('red')]: 1,
        [dragonKey('green')]: 5,
        [dragonKey('white')]: 5,
        [windKey('east')]: 5,
        [windKey('south')]: 5,
        [windKey('west')]: 5,
        [windKey('north')]: 5,
      },
    });
    const { state: next } = placeBet(state, 'higher');
    expect(next.isOver).toBe(true);
    expect(next.overReason).toBe('tile-hit-min');
    expect(next.dynamicTileValues[dragonKey('red')]).toBe(0);
  });

  it('ends the game when a dynamic tile climbs to 10', () => {
    const state = buildState({
      currentHand: [numberTile(1), numberTile(1), numberTile(1)],
      currentHandTotal: 3,
      drawPile: [
        windTile('east', 9, 'a'),
        numberTile(9, 'b'),
        numberTile(9, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
      dynamicTileValues: {
        [dragonKey('red')]: 5,
        [dragonKey('green')]: 5,
        [dragonKey('white')]: 5,
        [windKey('east')]: 9,
        [windKey('south')]: 5,
        [windKey('west')]: 5,
        [windKey('north')]: 5,
      },
    });
    const { state: next } = placeBet(state, 'higher');
    expect(next.isOver).toBe(true);
    expect(next.overReason).toBe('tile-hit-max');
    expect(next.dynamicTileValues[windKey('east')]).toBe(10);
  });

  it('honours custom extremum thresholds from the injected config', () => {
    // With maxTileValue=6, a single win on a Dragon hand ends the game.
    const config: GameConfig = { ...DEFAULT_GAME_CONFIG, maxTileValue: 6 };
    const state = buildState({
      config,
      currentHand: [numberTile(1), numberTile(1), numberTile(1)],
      currentHandTotal: 3,
      drawPile: [
        dragonTile('red', 5, 'a'),
        numberTile(9, 'b'),
        numberTile(9, 'c'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });
    const { state: next } = placeBet(state, 'higher');
    expect(next.isOver).toBe(true);
    expect(next.overReason).toBe('tile-hit-max');
  });
});

/* ---------- reshuffle ---------- */

describe('placeBet — reshuffle behaviour', () => {
  it('reshuffles when draw pile cannot fill a hand, merging discard and clearing it', () => {
    const discardSeed = [numberTile(4, 'seed1'), numberTile(5, 'seed2')];
    const state = buildState({
      currentHand: [numberTile(1), numberTile(1), numberTile(1)],
      currentHandTotal: 3,
      drawPile: [],
      discardPile: [...discardSeed],
    });

    const { state: next } = placeBet(state, 'higher');
    expect(next.reshuffleCount).toBe(1);
    expect(next.discardPile).toHaveLength(baseConfig.handSize);
    expect(next.drawPile.length).toBe(64 + discardSeed.length - baseConfig.handSize);
  });

  it('ends the game after the 3rd reshuffle', () => {
    const state = buildState({
      currentHand: [numberTile(5), numberTile(5), numberTile(5)],
      currentHandTotal: 15,
      drawPile: [],
      discardPile: [],
      reshuffleCount: 2,
    });

    const { state: next } = placeBet(state, 'higher');
    expect(next.reshuffleCount).toBe(3);
    expect(next.isOver).toBe(true);
    expect(next.overReason).toBe('reshuffle-limit');
  });

  it('honours custom maxDrawPileReshuffles from the injected config', () => {
    const config: GameConfig = { ...DEFAULT_GAME_CONFIG, maxDrawPileReshuffles: 1 };
    const state = buildState({
      config,
      currentHand: [numberTile(5), numberTile(5), numberTile(5)],
      currentHandTotal: 15,
      drawPile: [],
      reshuffleCount: 0,
    });
    const { state: next } = placeBet(state, 'higher');
    expect(next.reshuffleCount).toBe(1);
    expect(next.isOver).toBe(true);
    expect(next.overReason).toBe('reshuffle-limit');
  });
});

/* ---------- history & discard movement ---------- */

describe('placeBet — history & discard', () => {
  it('moves the previous hand to the discard pile and appends to history', () => {
    const previousHand: Hand = [numberTile(1, 'p1'), numberTile(1, 'p2'), numberTile(1, 'p3')];
    const state = buildState({
      currentHand: previousHand,
      currentHandTotal: 3,
      drawPile: [
        numberTile(9, 'n1'),
        numberTile(9, 'n2'),
        numberTile(9, 'n3'),
        ...Array.from({ length: 10 }, (_, i) => numberTile(5, `pad${i}`)),
      ],
    });

    const { state: next } = placeBet(state, 'higher');
    expect(next.history).toHaveLength(1);
    expect(next.history[0].previousTotal).toBe(3);
    expect(next.history[0].newTotal).toBe(27);
    expect(next.history[0].outcome).toBe('win');
    expect(next.discardPile.map((t) => t.id)).toEqual(['p1', 'p2', 'p3']);
  });
});
