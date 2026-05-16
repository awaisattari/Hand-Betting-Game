import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateGameDto } from './dto/create-game.dto';
import { CompleteGameDto } from './dto/complete-game.dto';
import { Game, GameDocument } from './schemas/game.schema';

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>
  ) {}

  async createGame(tenantId: string, dto: CreateGameDto): Promise<GameDocument> {
    const existing = await this.gameModel
      .findOne({ tenantId, gameId: dto.gameId })
      .exec();
    if (existing) {
      // creating twice with the same gameId is almost always a client-side
      // refresh — surface it loudly rather than silently reusing the row.
      throw new ConflictException(
        `Game ${dto.gameId} already exists for tenant ${tenantId}.`
      );
    }
    return this.gameModel.create({
      tenantId,
      gameId: dto.gameId,
      playerName: dto.playerName?.trim() || 'Anonymous',
    });
  }

  async completeGame(
    tenantId: string,
    gameId: string,
    dto: CompleteGameDto
  ): Promise<GameDocument> {
    const game = await this.gameModel
      .findOneAndUpdate(
        { tenantId, gameId },
        {
          $set: {
            playerName: dto.playerName.trim() || 'Anonymous',
            score: dto.score,
            handsPlayed: dto.handsPlayed,
            reshuffleCount: dto.reshuffleCount,
            reason: dto.reason,
            completed: true,
            completedAt: new Date(),
          },
        },
        { new: true }
      )
      .exec();

    if (!game) {
      throw new NotFoundException(
        `Game ${gameId} not found for tenant ${tenantId}.`
      );
    }
    return game;
  }
}
