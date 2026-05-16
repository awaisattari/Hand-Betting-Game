import { Hand, DynamicTileValues } from './tile.types';
import { GameConfig } from './game-config';

export type Bet = 'higher' | 'lower';
export type BetOutcome = 'win' | 'loss' | 'tie';

export type GameOverReason =
  | 'tile-hit-min'
  | 'tile-hit-max'
  | 'reshuffle-limit'
  | null;

export interface RoundHistoryEntry {
  round: number;
  previousHand: Hand;
  previousTotal: number;
  newHand: Hand;
  newTotal: number;
  bet: Bet;
  outcome: BetOutcome;
  scoreDelta: number;
  scoreAfter: number;
}

export interface GameState {
  /** Stable client-side game id; the server stores by this id too. */
  id: string;
  /**
   * Snapshot of the GameConfig used to build this state. Carrying it on
   * the state (rather than reading from a global) lets each game keep
   * its own rules — important once different tenants tune the engine
   * via the admin portal.
   */
  config: GameConfig;
  /** Tiles still available to draw. */
  drawPile: Hand;
  /** Used hand tiles waiting to be merged on the next reshuffle. */
  discardPile: Hand;
  /** Current visible hand the player is betting against. */
  currentHand: Hand;
  /** Sum of current hand's tile values. */
  currentHandTotal: number;
  /** Authoritative dynamic-tile-value map. */
  dynamicTileValues: DynamicTileValues;
  score: number;
  handsPlayed: number;
  reshuffleCount: number;
  history: RoundHistoryEntry[];
  isOver: boolean;
  overReason: GameOverReason;
  lastResultMessage: string | null;
}

export interface BetResult {
  state: GameState;
  outcome: BetOutcome;
  message: string;
}

/* ---------- API contracts ---------- */

export interface CreateGameDto {
  /** Client-generated id so the engine and API agree on the session. */
  gameId: string;
  playerName?: string;
}

export interface CompleteGameDto {
  playerName: string;
  score: number;
  handsPlayed: number;
  reshuffleCount: number;
  reason: GameOverReason;
}

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  handsPlayed: number;
  reshuffleCount: number;
  completedAt: string;
}
