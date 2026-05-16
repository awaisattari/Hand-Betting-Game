import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hand } from '@hbg/shared-types';
import { TileCardComponent } from '../tile-card/tile-card.component';

@Component({
  selector: 'app-hand-display',
  standalone: true,
  imports: [CommonModule, TileCardComponent],
  template: `
    <div class="flex flex-col items-center gap-4">
      <div
        class="hand-row flex items-center justify-center gap-4"
        [class.animate-in]="animate"
      >
        @for (tile of hand; track tile.id) {
          <app-tile-card [tile]="tile" />
        }
      </div>
      <div class="text-slate-300">
        <span class="text-xs uppercase tracking-widest">{{ label }}</span>
        <span class="ml-2 text-2xl font-semibold text-amber-300">{{ total }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes settle {
        from {
          opacity: 0;
          transform: translateY(-12px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .hand-row.animate-in > * {
        animation: settle 320ms ease-out both;
      }
      .hand-row.animate-in > *:nth-child(2) {
        animation-delay: 80ms;
      }
      .hand-row.animate-in > *:nth-child(3) {
        animation-delay: 160ms;
      }
    `,
  ],
})
export class HandDisplayComponent {
  @Input({ required: true }) hand!: Hand;
  @Input({ required: true }) total!: number;
  @Input() label = 'Current hand total';
  @Input() animate = true;
}
