import { Controller, Get } from '@nestjs/common';
import { GameConfigService } from './game-config.service';
import { Tenant } from '../common/tenant.decorator';
import { GameConfigDto } from './dto/game-config.dto';

@Controller('game-config')
export class GameConfigController {
  constructor(private readonly configs: GameConfigService) {}

  /**
   * Returns the current tenant's config, seeding defaults on the first
   * request. The response shape matches `GameConfigDto` exactly so the
   * frontend can hand it straight to the shared engine.
   */
  @Get()
  async getCurrent(@Tenant() tenantId: string): Promise<GameConfigDto> {
    const config = await this.configs.getOrCreate(tenantId);
    return config as GameConfigDto;
  }
}
