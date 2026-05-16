import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoundHistoryEntry } from '@hbg/shared-types';
import { TileCardComponent } from '../tile-card/tile-card.component';

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule, TileCardComponent],
  template: `
    <section class="history">
      <header class="flex items-baseline justify-between mb-3">
        <h2 class="text-sm font-semibold uppercase tracking-widest text-slate-300">
          History
        </h2>
        <span class="text-xs text-slate-500">{{ history.length }} rounds</span>
      </header>

      @if (history.length === 0) {
        <p class="text-xs text-slate-500 italic">
          No bets yet — your first round will appear here.
        </p>
      } @else {
        <ol class="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
          @for (entry of reversed(); track entry.round) {
            <li
              class="history-row rounded-lg border border-slate-800/70 bg-slate-900/40 px-3 py-2"
              [class.outcome-win]="entry.outcome === 'win'"
              [class.outcome-loss]="entry.outcome === 'loss'"
              [class.outcome-tie]="entry.outcome === 'tie'"
            >
              <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>
                  R{{ entry.round }} ·
                  <span class="uppercase tracking-wider">{{ entry.bet }}</span>
                </span>
                <span class="font-semibold" [ngSwitch]="entry.outcome">
                  <span *ngSwitchCase="'win'" class="text-emerald-400">
                    +{{ entry.scoreDelta }}
                  </span>
                  <span *ngSwitchCase="'loss'" class="text-rose-400">
                    {{ entry.scoreDelta }}
                  </span>
                  <span *ngSwitchCase="'tie'" class="text-slate-400">±0</span>
                </span>
              </div>

              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <div class="flex gap-1">
                  @for (tile of entry.previousHand; track tile.id) {
                    <app-tile-card [tile]="tile" size="sm" />
                  }
                </div>
                <span class="px-1">{{ entry.previousTotal }} →</span>
                <div class="flex gap-1">
                  @for (tile of entry.newHand; track tile.id) {
                    <app-tile-card [tile]="tile" size="sm" />
                  }
                </div>
                <span class="px-1">{{ entry.newTotal }}</span>
              </div>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [
    `
      .outcome-win { box-shadow: inset 3px 0 0 #34d399; }
      .outcome-loss { box-shadow: inset 3px 0 0 #f43f5e; }
      .outcome-tie { box-shadow: inset 3px 0 0 #64748b; }
    `,
  ],
})
export class HistoryPanelComponent {
  @Input() history: RoundHistoryEntry[] = [];

  reversed(): RoundHistoryEntry[] {
    return [...this.history].reverse();
  }
}
