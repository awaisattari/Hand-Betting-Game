import {
  Bet,
  BetOutcome,
  BetResult,
  DynamicTileValues,
  GameConfig,
  GameOverReason,
  GameState,
  Hand,
  RoundHistoryEntry,
  Tile,
} from '@hbg/shared-types';
import {
  createDeck,
  createDynamicTileValues,
  shuffle,
  syncTileValues,
  totalOfHand,
} from './deck';
import { DEFAULT_GAME_CONFIG } from './default-config';

/**
 * Pure functional engine. Every public function returns a brand-new
 * `GameState` rather than mutating in place — this makes the engine
 * predictable to drive from Angular signals on the frontend and from
 * unit tests on the backend.
 *
 * Each state instance carries the `GameConfig` it was built with so the
 * engine never has to reach for a global. Pass a tenant-specific config
 * into `createGame` and every subsequent `placeBet` will honour it.
 */

export interface CreateGameOptions {
  id: string;
  rng?: () => number;
  /** Optional override; falls back to `DEFAULT_GAME_CONFIG`. */
  config?: GameConfig;
}

export function createGame({
  id,
  rng = Math.random,
  config = DEFAULT_GAME_CONFIG,
}: CreateGameOptions): GameState {
  const dynamicTileValues = createDynamicTileValues(config);
  const freshDeck = shuffle(createDeck(dynamicTileValues, config, 'd0'), rng);

  const { hand, remaining } = dealHand(freshDeck, config);

  return {
    id,
    config,
    drawPile: remaining,
    discardPile: [],
    currentHand: hand,
    currentHandTotal: totalOfHand(hand),
    dynamicTileValues,
    score: 0,
    handsPlayed: 1,
    reshuffleCount: 0,
    history: [],
    isOver: false,
    overReason: null,
    lastResultMessage:
      'Baseline hand drawn. Bet whether the next hand will be higher or lower.',
  };
}

/**
 * Place a bet — drives the entire round transition. Order of operations
 * matches the spec:
 *   1. draw next hand
 *   2. compare totals, decide outcome
 *   3. update score
 *   4. update Dragon/Wind values on the *new* hand
 *   5. move old hand to discard
 *   6. add round to history
 *   7. promote new hand to current
 *   8. check game-over
 */
export function placeBet(
  state: GameState,
  bet: Bet,
  rng: () => number = Math.random
): BetResult {
  if (state.isOver) {
    return { state, outcome: 'tie', message: 'Game is already over.' };
  }
  const config = state.config;

  // 1. draw next hand, possibly reshuffling first.
  const drawResult = drawNextHand(state, rng);
  let working: GameState = drawResult.state;
  const newHand = drawResult.hand;
  const previousHand = state.currentHand;
  const previousTotal = state.currentHandTotal;
  const newTotal = totalOfHand(newHand);

  // 2. decide outcome
  const outcome = resolveBet(bet, previousTotal, newTotal);

  // 3. score
  const scoreDelta = scoreForOutcome(outcome, config);
  const scoreAfter = working.score + scoreDelta;

  // 4. update Dragon/Wind values on the *new* hand
  const { dynamicTileValues, updatedHand } = applyDynamicValueChanges(
    newHand,
    outcome,
    working.dynamicTileValues,
    config
  );
  // any other tiles still sitting in the draw pile should reflect the
  // change too — keeps the displayed value honest if the same tileKey
  // shows up next round.
  const refreshedDrawPile = syncTileValues(working.drawPile, dynamicTileValues);

  // 5. move previous hand to discard
  const discardPile = [...working.discardPile, ...previousHand];

  // 6. history
  const message = buildResultMessage(outcome, previousTotal, newTotal, scoreDelta);
  const historyEntry: RoundHistoryEntry = {
    round: state.handsPlayed,
    previousHand,
    previousTotal,
    newHand: updatedHand,
    newTotal,
    bet,
    outcome,
    scoreDelta,
    scoreAfter,
  };

  // 7. promote new hand
  working = {
    ...working,
    drawPile: refreshedDrawPile,
    discardPile,
    currentHand: updatedHand,
    currentHandTotal: newTotal,
    dynamicTileValues,
    score: scoreAfter,
    handsPlayed: working.handsPlayed + 1,
    history: [...working.history, historyEntry],
    lastResultMessage: message,
  };

  // 8. game-over check
  const overState = checkGameOver(working);
  return { state: overState, outcome, message };
}

/* ---------- internals ---------- */

function dealHand(pile: Hand, config: GameConfig): { hand: Hand; remaining: Hand } {
  const hand = pile.slice(0, config.handSize);
  const remaining = pile.slice(config.handSize);
  return { hand, remaining };
}

/**
 * Draw the next hand, reshuffling if the draw pile can't satisfy a full hand.
 * Returns the *deal-only* state change — score/discard updates happen in placeBet.
 */
function drawNextHand(
  state: GameState,
  rng: () => number
): { state: GameState; hand: Hand } {
  let working = state;

  if (working.drawPile.length < working.config.handSize) {
    working = reshuffle(working, rng);
  }

  const { hand, remaining } = dealHand(working.drawPile, working.config);
  // make sure dealt dynamic tiles show their *current* value
  const refreshedHand = syncTileValues(hand, working.dynamicTileValues);

  return {
    state: { ...working, drawPile: remaining },
    hand: refreshedHand,
  };
}

/**
 * Reshuffle rule: add a fresh deck → merge with the existing discard pile →
 * shuffle the union into a new draw pile → clear the discard pile →
 * bump the reshuffle counter.
 */
function reshuffle(state: GameState, rng: () => number): GameState {
  const reshuffleCount = state.reshuffleCount + 1;
  const freshDeck = createDeck(
    state.dynamicTileValues,
    state.config,
    `d${reshuffleCount}`
  );
  const merged = [
    ...state.drawPile,
    ...state.discardPile,
    ...freshDeck,
  ];
  const newDrawPile = shuffle(merged, rng);
  return {
    ...state,
    drawPile: newDrawPile,
    discardPile: [],
    reshuffleCount,
  };
}

function resolveBet(bet: Bet, prev: number, next: number): BetOutcome {
  if (next === prev) return 'tie';
  if (bet === 'higher') return next > prev ? 'win' : 'loss';
  return next < prev ? 'win' : 'loss';
}

function scoreForOutcome(o: BetOutcome, config: GameConfig): number {
  if (o === 'win') return config.correctBetPoints;
  if (o === 'loss') return config.wrongBetPoints;
  return config.tiePoints;
}

/**
 * Each Dragon / Wind in the new hand shifts ±1 based on outcome. Numbers
 * are unaffected. Ties leave values untouched (no win, no loss).
 *
 * Crucially, if the *same* tileKey appears twice in one hand we apply
 * the delta twice — the spec says "every time a Dragon/Wind tile is
 * part of a winning hand", and each tile is a distinct event.
 */
function applyDynamicValueChanges(
  hand: Hand,
  outcome: BetOutcome,
  current: DynamicTileValues,
  config: GameConfig
): { dynamicTileValues: DynamicTileValues; updatedHand: Hand } {
  if (outcome === 'tie') return { dynamicTileValues: current, updatedHand: hand };
  const delta = outcome === 'win' ? +1 : -1;
  const next: DynamicTileValues = { ...current };

  for (const tile of hand) {
    if (tile.category === 'number') continue;
    const k = tile.tileKey;
    next[k] = (next[k] ?? config.nonNumberBaseValue) + delta;
  }

  // re-stamp the new hand with updated values so the UI shows them
  // immediately, before the next deal.
  const updatedHand = syncTileValues(hand, next);
  return { dynamicTileValues: next, updatedHand };
}

function checkGameOver(state: GameState): GameState {
  const { config } = state;
  let reason: GameOverReason = null;

  // tile-extremum check uses the authoritative map, not specific cards.
  for (const value of Object.values(state.dynamicTileValues)) {
    if (value <= config.minTileValue) {
      reason = 'tile-hit-min';
      break;
    }
    if (value >= config.maxTileValue) {
      reason = 'tile-hit-max';
      break;
    }
  }

  if (!reason && state.reshuffleCount >= config.maxDrawPileReshuffles) {
    reason = 'reshuffle-limit';
  }

  if (!reason) return state;
  return { ...state, isOver: true, overReason: reason };
}

function buildResultMessage(
  outcome: BetOutcome,
  prev: number,
  next: number,
  delta: number
): string {
  const direction = next === prev ? 'matched' : next > prev ? 'higher' : 'lower';
  const head =
    outcome === 'win'
      ? `Correct! ${next} ${direction} ${prev}`
      : outcome === 'loss'
      ? `Wrong — ${next} ${direction} ${prev}`
      : `Tie — ${next} = ${prev}`;
  const tail =
    delta > 0 ? `(+${delta})` : delta < 0 ? `(${delta})` : '(±0)';
  return `${head} ${tail}`;
}

/* ---------- small helpers (re-exported for UI display) ---------- */

export function describeTile(tile: Tile): string {
  if (tile.category === 'number') return String(tile.face);
  if (tile.category === 'dragon') return `${capitalize(tile.suit)} Dragon`;
  return `${capitalize(tile.suit)} Wind`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function describeGameOver(reason: GameOverReason): string {
  switch (reason) {
    case 'tile-hit-min':
      return 'A dynamic tile fell to 0.';
    case 'tile-hit-max':
      return 'A dynamic tile climbed to 10.';
    case 'reshuffle-limit':
      return 'The draw pile ran out for the 3rd time.';
    default:
      return 'Game in progress.';
  }
}
