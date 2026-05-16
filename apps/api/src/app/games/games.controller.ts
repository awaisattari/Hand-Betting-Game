import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { CompleteGameDto } from './dto/complete-game.dto';
import { Tenant } from '../common/tenant.decorator';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post()
  @HttpCode(201)
  async createGame(@Tenant() tenantId: string, @Body() dto: CreateGameDto) {
    const game = await this.games.createGame(tenantId, dto);
    return {
      gameId: game.gameId,
      playerName: game.playerName,
      tenantId: game.tenantId,
    };
  }

  @Post(':id/complete')
  @HttpCode(200)
  async completeGame(
    @Tenant() tenantId: string,
    @Param('id') gameId: string,
    @Body() dto: CompleteGameDto
  ) {
    const game = await this.games.completeGame(tenantId, gameId, dto);
    return {
      gameId: game.gameId,
      playerName: game.playerName,
      score: game.score,
      handsPlayed: game.handsPlayed,
      reshuffleCount: game.reshuffleCount,
      reason: game.reason,
      completedAt: game.completedAt,
    };
  }
}
