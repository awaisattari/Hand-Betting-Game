import { Controller, Get } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Tenant } from '../common/tenant.decorator';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  async top(@Tenant() tenantId: string) {
    return this.leaderboard.topScores(tenantId);
  }
}
