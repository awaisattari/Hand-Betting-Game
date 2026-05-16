import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LeaderboardEntry } from '@hbg/shared-types';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="leaderboard rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
      <header class="flex items-baseline justify-between mb-4">
        <h2 class="text-lg font-semibold tracking-wide text-slate-100">
          Top scores
        </h2>
        <button
          class="text-xs text-slate-400 hover:text-amber-300 transition"
          (click)="load()"
        >
          Refresh
        </button>
      </header>

      @if (loading()) {
        <p class="text-sm text-slate-500">Loading scores…</p>
      } @else if (error()) {
        <p class="text-sm text-rose-400">{{ error() }}</p>
      } @else if (entries().length === 0) {
        <p class="text-sm text-slate-500 italic">
          No completed games yet — start one and climb the board.
        </p>
      } @else {
        <ol class="space-y-2">
          @for (entry of entries(); track entry.completedAt + entry.playerName; let i = $index) {
            <li
              class="flex items-center gap-3 rounded-lg bg-slate-900/60 px-3 py-2 hover:bg-slate-900 transition"
            >
              <span
                class="rank w-6 h-6 grid place-items-center rounded-full text-xs font-bold"
                [class.gold]="i === 0"
                [class.silver]="i === 1"
                [class.bronze]="i === 2"
              >
                {{ i + 1 }}
              </span>
              <span class="flex-1">
                <span class="block text-sm text-slate-100">{{ entry.playerName }}</span>
                <span class="block text-[10px] text-slate-500">
                  {{ entry.handsPlayed }} hands · {{ entry.reshuffleCount }} reshuffles
                  @if (entry.completedAt) {
                    · {{ entry.completedAt | date: 'mediumDate' }}
                  }
                </span>
              </span>
              <span class="text-amber-300 font-mono text-base">{{ entry.score }}</span>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [
    `
      .rank {
        background: rgba(148, 163, 184, 0.15);
        color: #e2e8f0;
      }
      .rank.gold {
        background: linear-gradient(135deg, #fde68a, #f59e0b);
        color: #422006;
      }
      .rank.silver {
        background: linear-gradient(135deg, #e2e8f0, #94a3b8);
        color: #0f172a;
      }
      .rank.bronze {
        background: linear-gradient(135deg, #fed7aa, #c2410c);
        color: #1c1917;
      }
    `,
  ],
})
export class LeaderboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.leaderboard().subscribe({
      next: (rows) => {
        this.entries.set(rows);
        this.loading.set(false);
      },
      error: () => {
        // Soft-fail — landing page still renders without a backend.
        this.entries.set([]);
        this.error.set('Leaderboard unavailable (API offline).');
        this.loading.set(false);
      },
    });
  }
}
