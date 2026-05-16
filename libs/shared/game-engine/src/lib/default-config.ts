import { GameConfig } from '@hbg/shared-types';

/**
 * Out-of-the-box rule set — the values the assessment was scored against.
 *
 * The engine *never* reads these directly; it always works off the
 * `config` snapshot on the `GameState`. This object is only the fallback
 * the frontend, the seed script, and the API service reach for when no
 * per-tenant config has been persisted yet.
 *
 * Touching the numbers here changes the spec defaults — there's
 * intentionally only one place to look.
 */
export const DEFAULT_GAME_CONFIG: Readonly<GameConfig> = Object.freeze({
  handSize: 3,
  nonNumberBaseValue: 5,
  minTileValue: 0,
  maxTileValue: 10,
  maxDrawPileReshuffles: 3,
  leaderboardLimit: 5,
  correctBetPoints: 10,
  wrongBetPoints: -5,
  tiePoints: 0,
});
