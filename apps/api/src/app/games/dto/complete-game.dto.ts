import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { GameOverReason } from '@hbg/shared-types';

const REASONS: GameOverReason[] = [
  'tile-hit-min',
  'tile-hit-max',
  'reshuffle-limit',
];

export class CompleteGameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  playerName!: string;

  @IsInt()
  @Min(-10_000)
  @Max(10_000)
  score!: number;

  @IsInt()
  @Min(0)
  @Max(100_000)
  handsPlayed!: number;

  @IsInt()
  @Min(0)
  @Max(10)
  reshuffleCount!: number;

  @IsIn(REASONS)
  reason!: Exclude<GameOverReason, null>;
}
