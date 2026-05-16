import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatRow {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

@Component({
  selector: 'app-game-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="game-stats grid grid-cols-2 sm:grid-cols-3 gap-3">
      @for (row of rows; track row.label) {
        <div
          class="stat-cell rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2"
          [class.emphasis]="row.emphasis"
        >
          <div class="text-[10px] uppercase tracking-widest text-slate-500">
            {{ row.label }}
          </div>
          <div class="text-xl font-semibold" [class.text-amber-300]="row.emphasis">
            {{ row.value }}
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .stat-cell {
        transition: transform 180ms ease;
      }
      .stat-cell.emphasis {
        background: linear-gradient(135deg, #422006 0%, #1e293b 100%);
        border-color: rgba(252, 211, 77, 0.4);
      }
    `,
  ],
})
export class GameStatsComponent {
  @Input() rows: StatRow[] = [];
}
