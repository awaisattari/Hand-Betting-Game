import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { GameOverReason } from '@hbg/shared-types';

export type GameDocument = HydratedDocument<Game>;

/**
 * One row per game session — created when the player starts a New Game,
 * updated again on completion with the final score and reason. The
 * compound index on (tenantId, score) keeps the leaderboard query cheap.
 */
@Schema({ timestamps: true, collection: 'games' })
export class Game {
  @Prop({ required: true, index: true })
  gameId!: string;

  @Prop({ required: true, index: true, default: 'default' })
  tenantId!: string;

  @Prop({ required: true, default: 'Anonymous' })
  playerName!: string;

  @Prop({ default: 0 })
  score!: number;

  @Prop({ default: 0 })
  handsPlayed!: number;

  @Prop({ default: 0 })
  reshuffleCount!: number;

  @Prop({ type: String, default: null })
  reason!: GameOverReason;

  @Prop({ default: false })
  completed!: boolean;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;
}

export const GameSchema = SchemaFactory.createForClass(Game);
GameSchema.index({ tenantId: 1, score: -1, completedAt: -1 });
GameSchema.index({ tenantId: 1, gameId: 1 }, { unique: true });
