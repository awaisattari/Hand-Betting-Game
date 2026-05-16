import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DEFAULT_GAME_CONFIG } from '@hbg/game-engine';
import { GameStore } from './game.store';
import { ApiService } from './api.service';

describe('GameStore', () => {
  function setupWithApi(api: Partial<ApiService>): GameStore {
    TestBed.configureTestingModule({
      providers: [GameStore, { provide: ApiService, useValue: api }],
    });
    return TestBed.inject(GameStore);
  }

  it('starts a game with the config returned by the API', async () => {
    const tenantConfig = { ...DEFAULT_GAME_CONFIG, handSize: 4 };
    const api: Partial<ApiService> = {
      gameConfig: () => of(tenantConfig),
      createGame: () => of({}),
      completeGame: () => of({}),
      leaderboard: () => of([]),
    };

    const store = setupWithApi(api);
    await store.startNewGame();

    expect(store.state()?.config).toEqual(tenantConfig);
    expect(store.state()?.currentHand.length).toBe(4);
    expect(store.configFallback()).toBe(false);
  });

  it('falls back to DEFAULT_GAME_CONFIG when the config API errors', async () => {
    const api: Partial<ApiService> = {
      gameConfig: () => throwError(() => new Error('offline')),
      createGame: () => of({}),
      completeGame: () => of({}),
      leaderboard: () => of([]),
    };

    const store = setupWithApi(api);
    await store.startNewGame();

    expect(store.state()?.config).toEqual({ ...DEFAULT_GAME_CONFIG });
    expect(store.configFallback()).toBe(true);
  });
});
