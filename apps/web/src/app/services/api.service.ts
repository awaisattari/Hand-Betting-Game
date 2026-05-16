import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompleteGameDto,
  CreateGameDto,
  GameConfig,
  LeaderboardEntry,
} from '@hbg/shared-types';
import { environment } from '../../environments/environment';

/**
 * Thin client around the NestJS API. Multi-tenancy is opt-in via the
 * `x-tenant-id` header — the backend defaults to "default" when absent,
 * so the FE doesn't need to know its tenant up-front.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Override at runtime to send games to a different tenant lobby. */
  tenantId: string | null = null;

  createGame(dto: CreateGameDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/games`, dto, { headers: this.headers() });
  }

  completeGame(gameId: string, dto: CompleteGameDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/games/${gameId}/complete`, dto, {
      headers: this.headers(),
    });
  }

  leaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard`, {
      headers: this.headers(),
    });
  }

  /**
   * Fetch the tenant-scoped GameConfig. Backend will auto-seed defaults
   * the first time this is hit for a new tenant, so the response is
   * always usable — only network/server failures need fallback handling.
   */
  gameConfig(): Observable<GameConfig> {
    return this.http.get<GameConfig>(`${this.baseUrl}/game-config`, {
      headers: this.headers(),
    });
  }

  private headers(): HttpHeaders {
    let h = new HttpHeaders();
    if (this.tenantId) h = h.set('x-tenant-id', this.tenantId);
    return h;
  }
}
