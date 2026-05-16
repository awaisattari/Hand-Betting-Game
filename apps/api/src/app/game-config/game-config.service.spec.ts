import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DEFAULT_GAME_CONFIG } from '@hbg/game-engine';
import { GameConfigService } from './game-config.service';
import { GameConfig } from './schemas/game-config.schema';

describe('GameConfigService', () => {
  let service: GameConfigService;
  let model: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GameConfigService,
        { provide: getModelToken(GameConfig.name), useValue: model },
      ],
    }).compile();

    service = moduleRef.get(GameConfigService);
  });

  it('returns the existing tenant config when one is present', async () => {
    const stored = {
      tenantId: 't1',
      ...DEFAULT_GAME_CONFIG,
      handSize: 4, // tenant override — proves we surface the row, not the default
    };
    model.findOne.mockReturnValueOnce({
      lean: () => ({ exec: jest.fn().mockResolvedValue(stored) }),
    });

    const config = await service.getOrCreate('t1');
    expect(config.handSize).toBe(4);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('creates a default config when no row exists for the tenant', async () => {
    model.findOne.mockReturnValueOnce({
      lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
    });
    model.findOneAndUpdate.mockReturnValueOnce({
      exec: jest
        .fn()
        .mockResolvedValue({ tenantId: 'new', ...DEFAULT_GAME_CONFIG }),
    });

    const config = await service.getOrCreate('new');
    expect(config).toEqual({ ...DEFAULT_GAME_CONFIG });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { tenantId: 'new' },
      { $setOnInsert: { tenantId: 'new', ...DEFAULT_GAME_CONFIG } },
      { upsert: true, new: true, lean: true }
    );
  });

  it('falls back to defaults field-by-field if the stored row is partially corrupt', async () => {
    model.findOne.mockReturnValueOnce({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          tenantId: 'broken',
          handSize: 'oops', // wrong type — should fall back to default
          maxTileValue: 12, // valid override — should survive
          // remaining fields are missing → fall back per-field
        }),
      }),
    });

    const config = await service.getOrCreate('broken');
    expect(config.handSize).toBe(DEFAULT_GAME_CONFIG.handSize);
    expect(config.maxTileValue).toBe(12);
    expect(config.tiePoints).toBe(DEFAULT_GAME_CONFIG.tiePoints);
  });
});
