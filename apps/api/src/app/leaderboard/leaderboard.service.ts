import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaderboardEntry } from '@hbg/shared-types';
import { Game, GameDocument } from '../games/schemas/game.schema';
import { GameConfigService } from '../game-config/game-config.service';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    private readonly configs: GameConfigService
  ) {}

  async topScores(tenantId: string): Promise<LeaderboardEntry[]> {
    // Tenant-specific leaderboard size — pulled from the same config doc
    // an admin portal would mutate. Falls back to defaults inside the
    // service if the row doesn't exist yet.
    const config = await this.configs.getOrCreate(tenantId);

    const docs = await this.gameModel
      .find({ tenantId, completed: true })
      .sort({ score: -1, completedAt: 1 })
      .limit(config.leaderboardLimit)
      .lean()
      .exec();

    return docs.map((d) => ({
      playerName: d.playerName,
      score: d.score,
      handsPlayed: d.handsPlayed,
      reshuffleCount: d.reshuffleCount,
      completedAt: d.completedAt ? new Date(d.completedAt).toISOString() : '',
    }));
  }
}
