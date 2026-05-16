import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameStore } from '../../services/game.store';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, LeaderboardComponent],
  template: `
    <main class="landing-page">
      <div class="landing-bg"></div>

      <section class="landing-hero">
        <div class="hero-copy">
          <p class="kicker">A tactile higher / lower game</p>
          <h1 class="title">
            <span class="title-gradient">Hand Betting Game</span>
          </h1>
          <p class="subtitle">
            Bet whether the next three-tile Mahjong hand totals
            <span class="text-amber-300 font-semibold">higher</span> or
            <span class="text-amber-300 font-semibold">lower</span> than the one
            on the table. Dragons and Winds drift in value as you play —
            push one to <strong>0</strong> or <strong>10</strong> and the game
            ends.
          </p>

          <form class="start-form" (submit)="startGame($event)">
            <label class="start-label" for="player-name">Player name</label>
            <div class="start-row">
              <input
                id="player-name"
                class="player-input"
                type="text"
                maxlength="40"
                placeholder="Player 1"
                [(ngModel)]="name"
                name="playerName"
                autocomplete="off"
                [disabled]="store.starting()"
              />
              <button type="submit" class="new-game-btn" [disabled]="store.starting()">
                <span>{{ store.starting() ? 'Starting…' : 'New Game' }}</span>
                <span class="arrow" aria-hidden="true">→</span>
              </button>
            </div>
            <p class="start-hint">
              Your score is saved to the leaderboard when the round ends.
            </p>
          </form>
        </div>

        <aside class="hero-side">
          <app-leaderboard />
        </aside>
      </section>

      <section class="landing-explain">
        <div class="explain-card">
          <span class="explain-badge">01</span>
          <h3>Three-tile hands</h3>
          <p>
            Each hand draws three tiles from a 64-tile deck of Numbers,
            Dragons and Winds.
          </p>
        </div>
        <div class="explain-card">
          <span class="explain-badge">02</span>
          <h3>Dynamic values</h3>
          <p>
            Dragons and Winds start at 5 and drift ±1 every time they're in
            a winning or losing hand.
          </p>
        </div>
        <div class="explain-card">
          <span class="explain-badge">03</span>
          <h3>Three reshuffles</h3>
          <p>
            When the draw pile empties it merges with discards and reshuffles.
            The third time, the game's over.
          </p>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .landing-page {
        position: relative;
        min-height: 100vh;
        padding: 4rem 1.5rem 6rem;
        overflow: hidden;
      }
      .landing-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(60% 50% at 30% 20%, rgba(252, 211, 77, 0.18) 0%, transparent 60%),
          radial-gradient(50% 40% at 80% 70%, rgba(99, 102, 241, 0.18) 0%, transparent 60%),
          radial-gradient(80% 80% at 50% 90%, rgba(15, 23, 42, 1) 0%, #020617 60%);
        z-index: 0;
      }
      .landing-hero {
        position: relative;
        z-index: 1;
        max-width: 80rem;
        margin: 0 auto;
        display: grid;
        gap: 3rem;
        grid-template-columns: 1fr;
      }
      @media (min-width: 960px) {
        .landing-hero { grid-template-columns: 1.4fr 1fr; }
      }
      .hero-copy { padding-top: 1rem; }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        color: #fcd34d;
      }
      .title {
        margin-top: 0.75rem;
        font-family: 'Noto Serif TC', serif;
        font-size: clamp(2.5rem, 6vw, 4.5rem);
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.02em;
      }
      .title-gradient {
        background: linear-gradient(135deg, #fde68a 0%, #f59e0b 60%, #b45309 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .subtitle {
        margin-top: 1.25rem;
        max-width: 38rem;
        color: #cbd5e1;
        line-height: 1.6;
      }
      .start-form {
        margin-top: 2.5rem;
        max-width: 32rem;
      }
      .start-label {
        font-size: 0.7rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .start-row {
        margin-top: 0.5rem;
        display: flex;
        gap: 0.75rem;
        align-items: stretch;
      }
      .player-input {
        flex: 1;
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 9999px;
        padding: 0.85rem 1.25rem;
        color: #f8fafc;
        font-size: 1rem;
        transition: border-color 180ms ease, box-shadow 180ms ease;
      }
      .player-input:focus {
        outline: none;
        border-color: rgba(252, 211, 77, 0.6);
        box-shadow: 0 0 0 4px rgba(252, 211, 77, 0.08);
      }
      .new-game-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.85rem 1.5rem;
        background: linear-gradient(135deg, #f59e0b, #b45309);
        color: #1c1917;
        font-weight: 700;
        letter-spacing: 0.02em;
        border-radius: 9999px;
        box-shadow: 0 12px 28px rgba(217, 119, 6, 0.4);
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
      }
      .new-game-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 16px 32px rgba(217, 119, 6, 0.55);
      }
      .new-game-btn:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .new-game-btn .arrow { transition: transform 160ms ease; }
      .new-game-btn:hover:not(:disabled) .arrow { transform: translateX(3px); }
      .start-hint {
        margin-top: 0.75rem;
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .landing-explain {
        position: relative;
        z-index: 1;
        max-width: 80rem;
        margin: 5rem auto 0;
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr;
      }
      @media (min-width: 720px) {
        .landing-explain { grid-template-columns: repeat(3, 1fr); }
      }
      .explain-card {
        position: relative;
        padding: 1.5rem;
        background: rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(148, 163, 184, 0.08);
        border-radius: 1rem;
        transition: transform 180ms ease, border-color 180ms ease;
      }
      .explain-card:hover {
        transform: translateY(-3px);
        border-color: rgba(252, 211, 77, 0.3);
      }
      .explain-badge {
        position: absolute;
        top: 1rem;
        right: 1.25rem;
        font-family: 'Noto Serif TC', serif;
        font-size: 1.5rem;
        color: rgba(252, 211, 77, 0.3);
      }
      .explain-card h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #f8fafc;
      }
      .explain-card p {
        margin-top: 0.5rem;
        color: #94a3b8;
        font-size: 0.9rem;
        line-height: 1.55;
      }
    `,
  ],
})
export class LandingPage {
  private readonly router = inject(Router);
  protected readonly store = inject(GameStore);

  name = 'Player 1';

  async startGame(event: Event): Promise<void> {
    event.preventDefault();
    if (this.store.starting()) return;
    this.store.setPlayerName(this.name);
    await this.store.startNewGame();
    this.router.navigate(['/play']);
  }
}
