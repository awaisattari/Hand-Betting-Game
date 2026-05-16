import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GamesService } from './games.service';
import { Game } from './schemas/game.schema';

/**
 * Smoke test for the service — verifies the multi-tenancy scoping and the
 * happy-path / not-found branches against a mocked Mongoose model.
 */
describe('GamesService', () => {
  let service: GamesService;
  let model: {
    findOne: jest.Mock;
    create: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      create: jest.fn().mockResolvedValue({ tenantId: 't', gameId: 'g' }),
      findOneAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ tenantId: 't', gameId: 'g', completed: true }),
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GamesService,
        { provide: getModelToken(Game.name), useValue: model },
      ],
    }).compile();

    service = moduleRef.get(GamesService);
  });

  it('creates a game scoped to the resolved tenant', async () => {
    await service.createGame('t', { gameId: 'g', playerName: ' Alice  ' });
    expect(model.findOne).toHaveBeenCalledWith({ tenantId: 't', gameId: 'g' });
    expect(model.create).toHaveBeenCalledWith({
      tenantId: 't',
      gameId: 'g',
      playerName: 'Alice',
    });
  });

  it('rejects duplicate game ids inside the same tenant', async () => {
    model.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({ tenantId: 't', gameId: 'g' }),
    });
    await expect(
      service.createGame('t', { gameId: 'g' })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFound when completing a game that does not exist', async () => {
    model.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.completeGame('t', 'missing', {
        playerName: 'A',
        score: 10,
        handsPlayed: 3,
        reshuffleCount: 0,
        reason: 'tile-hit-min',
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
