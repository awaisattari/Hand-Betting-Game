import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_GAME_CONFIG } from '@hbg/game-engine';
import type { GameConfig as GameConfigShape } from '@hbg/shared-types';
import {
  GameConfig as GameConfigClass,
  GameConfigDocument,
} from './schemas/game-config.schema';

/**
 * Read / auto-seed game configuration. The only public contract is
 * `getOrCreate(tenantId)` — read-modify-write is intentionally left out
 * for now (no admin portal in scope), but adding `update()` later is a
 * single method call away.
 *
 * Important: the service strips every value through `sanitize()` before
 * returning so a corrupted Mongo document (a missing field, a non-numeric
 * string from a future migration) can't break the frontend.
 */
@Injectable()
export class GameConfigService {
  constructor(
    @InjectModel(GameConfigClass.name)
    private readonly model: Model<GameConfigDocument>
  ) {}

  /**
   * Resolve a config for the tenant, falling back to the assignment
   * defaults if the row doesn't exist yet (and persisting that default
   * so subsequent reads are consistent).
   */
  async getOrCreate(tenantId: string): Promise<GameConfigShape> {
    const existing = await this.model.findOne({ tenantId }).lean().exec();
    if (existing) return sanitize(existing);

    // First read for this tenant — seed the defaults atomically so a
    // burst of parallel reads still ends with exactly one row.
    const created = await this.model
      .findOneAndUpdate(
        { tenantId },
        { $setOnInsert: { tenantId, ...DEFAULT_GAME_CONFIG } },
        { upsert: true, new: true, lean: true }
      )
      .exec();

    return sanitize(created as Record<string, unknown> | null);
  }
}

/**
 * Defensive coercion — guarantees every returned config is the right
 * shape with finite numbers, regardless of what's in the Mongo doc.
 * If a field is missing/invalid, we fall back to the assignment default
 * for *that* field (not the entire object) so a partial-bad-doc still
 * yields a working game.
 */
function sanitize(doc: Record<string, unknown> | null): GameConfigShape {
  const safeNumber = (key: keyof GameConfigShape): number => {
    const raw = doc?.[key];
    return typeof raw === 'number' && Number.isFinite(raw)
      ? raw
      : DEFAULT_GAME_CONFIG[key];
  };

  return {
    handSize: safeNumber('handSize'),
    nonNumberBaseValue: safeNumber('nonNumberBaseValue'),
    minTileValue: safeNumber('minTileValue'),
    maxTileValue: safeNumber('maxTileValue'),
    maxDrawPileReshuffles: safeNumber('maxDrawPileReshuffles'),
    leaderboardLimit: safeNumber('leaderboardLimit'),
    correctBetPoints: safeNumber('correctBetPoints'),
    wrongBetPoints: safeNumber('wrongBetPoints'),
    tiePoints: safeNumber('tiePoints'),
  };
}
