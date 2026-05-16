import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicTileValues } from '@hbg/shared-types';
import { DEFAULT_GAME_CONFIG } from '@hbg/game-engine';

interface ValueRow {
  key: string;
  label: string;
  glyph: string;
  value: number;
  pct: number;
  isDragon: boolean;
}

@Component({
  selector: 'app-dynamic-tile-values',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dynamic-values">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-slate-300 mb-3">
        Dragon &amp; Wind values
      </h2>
      <div class="grid grid-cols-2 gap-2">
        @for (row of rows(); track row.key) {
          <div
            class="dv-row rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2"
            [class.danger-low]="row.value <= 2"
            [class.danger-high]="row.value >= 8"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="flex items-center gap-2">
                <span class="text-base font-bold">{{ row.glyph }}</span>
                <span class="text-slate-400 capitalize">{{ row.label }}</span>
              </span>
              <span class="font-mono text-amber-300">{{ row.value }}</span>
            </div>
            <div class="dv-bar mt-1">
              <div class="dv-fill" [style.width.%]="row.pct"></div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .dv-bar {
        height: 4px;
        background: rgba(148, 163, 184, 0.15);
        border-radius: 9999px;
        overflow: hidden;
      }
      .dv-fill {
        height: 100%;
        background: linear-gradient(90deg, #fbbf24 0%, #f97316 100%);
        transition: width 320ms ease;
      }
      .danger-low { box-shadow: inset 3px 0 0 #f43f5e; }
      .danger-high { box-shadow: inset 3px 0 0 #34d399; }
    `,
  ],
})
export class DynamicTileValuesComponent {
  values = input.required<DynamicTileValues>();
  /** Tenant ceiling for the progress bar — defaults to the assignment max. */
  maxTileValue = input<number>(DEFAULT_GAME_CONFIG.maxTileValue);

  readonly rows = computed<ValueRow[]>(() => {
    const v = this.values();
    const max = this.maxTileValue() || DEFAULT_GAME_CONFIG.maxTileValue;
    return Object.entries(v)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [category, suit] = key.split(':');
        return {
          key,
          label: `${suit} ${category}`,
          glyph: glyphFor(key),
          value,
          pct: Math.round((value / max) * 100),
          isDragon: category === 'dragon',
        };
      });
  });
}

function glyphFor(tileKey: string): string {
  const [cat, suit] = tileKey.split(':');
  if (cat === 'dragon') {
    if (suit === 'red') return '中';
    if (suit === 'green') return '發';
    return '⬜';
  }
  if (suit === 'east') return '東';
  if (suit === 'south') return '南';
  if (suit === 'west') return '西';
  return '北';
}
