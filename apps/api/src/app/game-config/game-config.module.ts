import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameConfigController } from './game-config.controller';
import { GameConfigService } from './game-config.service';
import {
  GameConfig as GameConfigClass,
  GameConfigSchema,
} from './schemas/game-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameConfigClass.name, schema: GameConfigSchema },
    ]),
  ],
  controllers: [GameConfigController],
  providers: [GameConfigService],
  exports: [GameConfigService, MongooseModule],
})
export class GameConfigModule {}
