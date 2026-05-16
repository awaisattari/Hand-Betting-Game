/**
 * Shape of every tuning knob the engine reads at runtime. The actual
 * default values live in `@hbg/game-engine` as `DEFAULT_GAME_CONFIG` —
 * keeping the type here means the API DTOs and the engine reference the
 * same contract without a circular dependency.
 *
 * Anything that influences gameplay balance belongs in this interface;
 * adding a field here, persisting it on the Mongo `game_configs` doc,
 * and reading it inside the engine is the supported way to extend the
 * rule set without changing UI or controller code.
 */
export interface GameConfig {
  handSize: number;
  nonNumberBaseValue: number;
  minTileValue: number;
  maxTileValue: number;
  maxDrawPileReshuffles: number;
  leaderboardLimit: number;
  correctBetPoints: number;
  wrongBetPoints: number;
  tiePoints: number;
}
