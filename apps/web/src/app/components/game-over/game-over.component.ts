import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameState } from '@hbg/shared-types';
import { describeGameOver } from '@hbg/game-engine';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-over-overlay" role="dialog" aria-modal="true">
      <div class="game-over-card">
        <div class="ribbon">Game over</div>
        <h2 class="text-3xl font-semibold mt-2">{{ headline() }}</h2>
        <p class="text-sm text-slate-400 mt-1">{{ reasonText() }}</p>

        <div class="stat-grid">
          <div class="stat">
            <div class="stat-label">Final score</div>
            <div class="stat-value emphasis">{{ state.score }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Hands played</div>
            <div class="stat-value">{{ state.handsPlayed }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Reshuffles</div>
            <div class="stat-value">{{ state.reshuffleCount }}</div>
          </div>
        </div>

        <div class="mt-6 flex justify-center gap-3">
          <button class="btn-primary" (click)="exit.emit()">
            Return to landing
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .game-over-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.7);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 50;
        animation: fade 200ms ease;
      }
      @keyframes fade {
        from { opacity: 0; }
      }
      .game-over-card {
        width: min(28rem, 92vw);
        background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
        border: 1px solid rgba(252, 211, 77, 0.2);
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
      }
      .ribbon {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        font-size: 0.65rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        background: rgba(252, 211, 77, 0.15);
        color: #fcd34d;
        border-radius: 9999px;
      }
      .stat-grid {
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }
      .stat {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.1);
        padding: 0.75rem;
        border-radius: 0.5rem;
      }
      .stat-label {
        font-size: 0.6rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
      }
      .stat-value.emphasis {
        color: #fcd34d;
      }
      .btn-primary {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #1c1917;
        font-weight: 600;
        padding: 0.6rem 1.4rem;
        border-radius: 9999px;
        box-shadow: 0 8px 20px rgba(217, 119, 6, 0.4);
        transition: transform 160ms ease, box-shadow 160ms ease;
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(217, 119, 6, 0.5);
      }
    `,
  ],
})
export class GameOverComponent {
  @Input({ required: true }) state!: GameState;
  @Output() exit = new EventEmitter<void>();

  headline(): string {
    if (this.state.score >= 50) return 'Masterful run.';
    if (this.state.score >= 10) return 'Solid game.';
    if (this.state.score >= 0) return 'You held your ground.';
    return 'The tiles were cruel today.';
  }

  reasonText(): string {
    return describeGameOver(this.state.overReason);
  }
}
