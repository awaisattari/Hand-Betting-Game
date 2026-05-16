import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GameConfigDocument = HydratedDocument<GameConfig>;

/**
 * Per-tenant tuning row. One document per tenant — `tenantId` is uniquely
 * indexed so an admin portal can do an idempotent upsert without
 * worrying about duplicates. Fields mirror the `GameConfig` interface
 * one-for-one; keep them in sync.
 */
@Schema({ timestamps: true, collection: 'game_configs' })
export class GameConfig {
  @Prop({ required: true, unique: true, index: true })
  tenantId!: string;

  @Prop({ required: true, type: Number, min: 1, max: 20 })
  handSize!: number;

  @Prop({ required: true, type: Number, min: 0, max: 100 })
  nonNumberBaseValue!: number;

  @Prop({ required: true, type: Number, min: -100, max: 100 })
  minTileValue!: number;

  @Prop({ required: true, type: Number, min: -100, max: 100 })
  maxTileValue!: number;

  @Prop({ required: true, type: Number, min: 1, max: 100 })
  maxDrawPileReshuffles!: number;

  @Prop({ required: true, type: Number, min: 1, max: 100 })
  leaderboardLimit!: number;

  @Prop({ required: true, type: Number })
  correctBetPoints!: number;

  @Prop({ required: true, type: Number })
  wrongBetPoints!: number;

  @Prop({ required: true, type: Number })
  tiePoints!: number;
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);
