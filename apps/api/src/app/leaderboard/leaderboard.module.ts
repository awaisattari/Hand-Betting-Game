import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { GamesModule } from '../games/games.module';
import { GameConfigModule } from '../game-config/game-config.module';

@Module({
  imports: [GamesModule, GameConfigModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
