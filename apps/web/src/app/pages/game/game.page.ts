import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStore } from '../../services/game.store';
import { HandDisplayComponent } from '../../components/hand-display/hand-display.component';
import { HistoryPanelComponent } from '../../components/history-panel/history-panel.component';
import { GameStatsComponent } from '../../components/game-stats/game-stats.component';
import { DynamicTileValuesComponent } from '../../components/dynamic-tile-values/dynamic-tile-values.component';
import { GameOverComponent } from '../../components/game-over/game-over.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    HandDisplayComponent,
    HistoryPanelComponent,
    GameStatsComponent,
    DynamicTileValuesComponent,
    GameOverComponent,
  ],
  template: `
    <main class="game-page">
      <header class="game-header">
        <div>
          <p class="text-[10px] uppercase tracking-[0.4em] text-amber-300">
            Round {{ state()?.handsPlayed }}
          </p>
          <h1 class="text-xl font-semibold mt-1">{{ playerName() }}</h1>
        </div>
        <button class="exit-btn" (click)="exit()">
          <span aria-hidden="true">×</span>
          <span>Exit</span>
        </button>
      </header>

      @if (state(); as s) {
        <section class="game-grid">
          <div class="game-main">
            <app-game-stats [rows]="statsRows()" />

            <div class="hand-card">
              <app-hand-display
                [hand]="s.currentHand"
                [total]="s.currentHandTotal"
              />

              @if (s.lastResultMessage && !s.isOver) {
                <p
                  class="result-banner"
                  [class.is-win]="lastOutcome() === 'win'"
                  [class.is-loss]="lastOutcome() === 'loss'"
                  [class.is-tie]="lastOutcome() === 'tie'"
                >
                  {{ s.lastResultMessage }}
                </p>
              }

              <div class="bet-row">
                <button
                  class="bet-btn bet-lower"
                  [disabled]="s.isOver"
                  (click)="bet('lower')"
                >
                  <span class="bet-arrow">▼</span>
                  <span class="bet-label">Bet Lower</span>
                </button>
                <button
                  class="bet-btn bet-higher"
                  [disabled]="s.isOver"
                  (click)="bet('higher')"
                >
                  <span class="bet-arrow">▲</span>
                  <span class="bet-label">Bet Higher</span>
                </button>
              </div>
            </div>
          </div>

          <aside class="game-side">
            @if (store.configFallback()) {
              <div class="config-fallback" role="status">
                Using local default game rules.
              </div>
            }
            <app-dynamic-tile-values
              [values]="s.dynamicTileValues"
              [maxTileValue]="s.config.maxTileValue"
            />
            <app-history-panel [history]="s.history" />
          </aside>
        </section>

        @if (s.isOver) {
          <app-game-over [state]="s" (exit)="exit()" />
        }
      } @else {
        <div class="empty-state">
          <p>No active game. Returning to landing…</p>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .game-page {
        min-height: 100vh;
        padding: 1.75rem 1.5rem 3rem;
        max-width: 80rem;
        margin: 0 auto;
        position: relative;
      }
      .game-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }
      .exit-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #cbd5e1;
        border-radius: 9999px;
        font-size: 0.85rem;
        transition: border-color 160ms ease, color 160ms ease;
      }
      .exit-btn:hover {
        border-color: rgba(244, 63, 94, 0.6);
        color: #fca5a5;
      }
      .game-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr;
      }
      @media (min-width: 1024px) {
        .game-grid { grid-template-columns: 1.5fr 1fr; }
      }
      .game-main {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .hand-card {
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.85) 100%);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 1.25rem;
        padding: 2rem 1.5rem 2.5rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      }
      .result-banner {
        margin-top: 1.5rem;
        text-align: center;
        padding: 0.6rem 1rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 500;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.15);
        animation: pulse 360ms ease-out both;
      }
      .result-banner.is-win {
        color: #6ee7b7;
        border-color: rgba(110, 231, 183, 0.5);
        background: rgba(16, 185, 129, 0.12);
      }
      .result-banner.is-loss {
        color: #fda4af;
        border-color: rgba(253, 164, 175, 0.5);
        background: rgba(244, 63, 94, 0.12);
      }
      .result-banner.is-tie {
        color: #cbd5e1;
        border-color: rgba(203, 213, 225, 0.3);
      }
      @keyframes pulse {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .bet-row {
        margin-top: 2rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .bet-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.1rem 1.25rem;
        border-radius: 1rem;
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.05em;
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
      }
      .bet-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .bet-btn:not(:disabled):hover {
        transform: translateY(-3px);
      }
      .bet-lower {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        color: #e0f2fe;
        box-shadow: 0 10px 24px rgba(29, 78, 216, 0.4);
      }
      .bet-higher {
        background: linear-gradient(135deg, #be123c 0%, #9f1239 100%);
        color: #ffe4e6;
        box-shadow: 0 10px 24px rgba(190, 18, 60, 0.45);
      }
      .bet-arrow { font-size: 1.1rem; }

      .game-side {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .empty-state {
        text-align: center;
        color: #94a3b8;
        padding: 6rem 0;
      }

      .config-fallback {
        font-size: 0.75rem;
        padding: 0.55rem 0.85rem;
        border-radius: 0.5rem;
        background: rgba(252, 211, 77, 0.08);
        border: 1px solid rgba(252, 211, 77, 0.3);
        color: #fde68a;
        letter-spacing: 0.02em;
      }
    `,
  ],
})
export class GamePage implements OnInit {
  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);

  readonly state = this.store.state;
  readonly playerName = this.store.playerName;

  readonly statsRows = computed(() => {
    const s = this.state();
    if (!s) return [];
    return [
      { label: 'Score', value: s.score, emphasis: true },
      { label: 'Hand total', value: s.currentHandTotal },
      { label: 'Hands played', value: s.handsPlayed },
      { label: 'Draw pile', value: s.drawPile.length },
      { label: 'Discard pile', value: s.discardPile.length },
      { label: 'Reshuffles', value: `${s.reshuffleCount} / 3` },
    ];
  });

  readonly lastOutcome = computed(() => {
    const s = this.state();
    if (!s) return null;
    return s.history.at(-1)?.outcome ?? null;
  });

  ngOnInit(): void {
    if (!this.state()) {
      this.router.navigate(['/']);
    }
  }

  bet(direction: 'higher' | 'lower'): void {
    this.store.bet(direction);
  }

  exit(): void {
    this.store.exit();
    this.router.navigate(['/']);
  }
}
