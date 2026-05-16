import { IsInt, Max, Min } from 'class-validator';
import type { GameConfig } from '@hbg/shared-types';

/**
 * Response shape for `GET /game-config`. Also doubles as the validation
 * shape if a future admin endpoint accepts updates — every field has the
 * same numeric guardrails the schema enforces in MongoDB.
 *
 * Bounds are intentionally generous so an admin portal could legitimately
 * tune the game without bumping the schema.
 */
export class GameConfigDto implements GameConfig {
  @IsInt() @Min(1) @Max(20)
  handSize!: number;

  @IsInt() @Min(0) @Max(100)
  nonNumberBaseValue!: number;

  @IsInt() @Min(-100) @Max(100)
  minTileValue!: number;

  @IsInt() @Min(-100) @Max(100)
  maxTileValue!: number;

  @IsInt() @Min(1) @Max(100)
  maxDrawPileReshuffles!: number;

  @IsInt() @Min(1) @Max(100)
  leaderboardLimit!: number;

  @IsInt() @Min(-1000) @Max(1000)
  correctBetPoints!: number;

  @IsInt() @Min(-1000) @Max(1000)
  wrongBetPoints!: number;

  @IsInt() @Min(-1000) @Max(1000)
  tiePoints!: number;
}
