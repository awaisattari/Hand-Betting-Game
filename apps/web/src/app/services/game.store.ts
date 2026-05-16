import { Injectable, computed, inject, signal } from '@angular/core';
import { Bet, GameConfig, GameState } from '@hbg/shared-types';
import { DEFAULT_GAME_CONFIG, createGame, placeBet } from '@hbg/game-engine';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Frontend state holder. Wraps the pure engine behind Angular signals so
 * components stay dumb and reactive. The engine itself is shared with the
 * backend tests — this class is *only* presentation glue, plus the
 * lifecycle stitching for "start game" and "submit final score".
 */
@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly api = inject(ApiService);

  private readonly _state = signal<GameState | null>(null);
  private readonly _playerName = signal<string>('Player 1');
  private readonly _submitted = signal<boolean>(false);
  private readonly _configFallback = signal<boolean>(false);
  private readonly _starting = signal<boolean>(false);

  readonly state = this._state.asReadonly();
  readonly playerName = this._playerName.asReadonly();
  readonly hasGame = computed(() => this._state() !== null);
  /** True when the most recent game start fell back to local defaults. */
  readonly configFallback = this._configFallback.asReadonly();
  readonly starting = this._starting.asReadonly();

  setPlayerName(name: string): void {
    this._playerName.set(name.trim() || 'Player 1');
  }

  /**
   * Fetch the tenant's GameConfig and start a new game with it.
   * If the config endpoint fails, fall back to the shared default so the
   * player is never blocked by a backend hiccup.
   */
  async startNewGame(): Promise<void> {
    this._starting.set(true);
    const config = await this.resolveConfig();

    const gameId = newGameId();
    const initial = createGame({ id: gameId, config });
    this._state.set(initial);
    this._submitted.set(false);
    this._starting.set(false);

    // Best-effort create — leaderboard quality matters more than this insert.
    this.api
      .createGame({ gameId, playerName: this._playerName() })
      .subscribe({ error: () => undefined });
  }

  bet(bet: Bet): void {
    const current = this._state();
    if (!current || current.isOver) return;
    const { state: next } = placeBet(current, bet);
    this._state.set(next);

    if (next.isOver && !this._submitted()) {
      this._submitted.set(true);
      this.submitFinalScore(next);
    }
  }

  exit(): void {
    this._state.set(null);
    this._submitted.set(false);
    this._configFallback.set(false);
  }

  /**
   * Resolves the config to use for the next game. On any failure
   * (network, 500, etc.) we use `DEFAULT_GAME_CONFIG` and flip the
   * `configFallback` signal so the UI can show a small non-blocking
   * notice. The user is never blocked.
   */
  private async resolveConfig(): Promise<GameConfig> {
    const config = await firstValueFrom(
      this.api.gameConfig().pipe(catchError(() => of(null)))
    );

    if (config) {
      this._configFallback.set(false);
      return config;
    }

    this._configFallback.set(true);
    return { ...DEFAULT_GAME_CONFIG };
  }

  private submitFinalScore(state: GameState): void {
    if (!state.overReason) return;
    this.api
      .completeGame(state.id, {
        playerName: this._playerName(),
        score: state.score,
        handsPlayed: state.handsPlayed,
        reshuffleCount: state.reshuffleCount,
        reason: state.overReason,
      })
      .subscribe({ error: () => undefined });
  }
}

function newGameId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `g-${Date.now().toString(36)}-${rand}`;
}
