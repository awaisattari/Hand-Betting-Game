import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '@hbg/shared-types';

/**
 * One Mahjong tile. Styling forks on category so the player can
 * immediately see what kind of tile they're looking at:
 *  - Number tiles → ivory ground, bold red glyph
 *  - Dragon tiles → suit-tinted gradient with a small face badge
 *  - Wind tiles   → muted slate gradient with a directional glyph
 */
@Component({
  selector: 'app-tile-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="tile-card group"
      [class.tile-number]="tile.category === 'number'"
      [class.tile-dragon]="tile.category === 'dragon'"
      [class.tile-wind]="tile.category === 'wind'"
      [class.tile-sm]="size === 'sm'"
      [attr.data-suit]="suit()"
    >
      <div class="tile-edge"></div>
      <div class="tile-face">
        <div class="tile-glyph">{{ glyph() }}</div>
        <div class="tile-label">{{ label() }}</div>
        <div class="tile-value">{{ tile.value }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .tile-card {
        position: relative;
        width: 5.5rem;
        height: 7.5rem;
        border-radius: 0.75rem;
        background: linear-gradient(180deg, #f8f3e6 0%, #ede2c2 100%);
        box-shadow:
          0 6px 14px rgba(0, 0, 0, 0.35),
          inset 0 -3px 0 rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
        transition: transform 220ms ease, box-shadow 220ms ease;
        overflow: hidden;
      }
      .tile-card:hover {
        transform: translateY(-3px) rotate(-1deg);
        box-shadow:
          0 12px 24px rgba(0, 0, 0, 0.45),
          inset 0 -3px 0 rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }
      .tile-edge {
        position: absolute;
        inset: 0.35rem;
        border-radius: 0.55rem;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: linear-gradient(180deg, #fffaeb 0%, #f3e6c3 100%);
      }
      .tile-face {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.25rem;
        color: #1f2937;
      }
      .tile-glyph {
        font-family: 'Noto Serif TC', serif;
        font-size: 2.25rem;
        font-weight: 800;
        line-height: 1;
      }
      .tile-label {
        margin-top: 0.35rem;
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #475569;
      }
      .tile-value {
        position: absolute;
        bottom: 0.45rem;
        right: 0.55rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
      }

      /* number tile */
      .tile-number .tile-glyph {
        color: #b91c1c;
      }

      /* dragon variants */
      .tile-dragon .tile-glyph {
        font-size: 1.75rem;
      }
      .tile-dragon[data-suit='red'] .tile-edge {
        background: linear-gradient(180deg, #fee2e2 0%, #fca5a5 100%);
      }
      .tile-dragon[data-suit='red'] .tile-glyph {
        color: #991b1b;
      }
      .tile-dragon[data-suit='green'] .tile-edge {
        background: linear-gradient(180deg, #dcfce7 0%, #86efac 100%);
      }
      .tile-dragon[data-suit='green'] .tile-glyph {
        color: #166534;
      }
      .tile-dragon[data-suit='white'] .tile-edge {
        background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%);
      }
      .tile-dragon[data-suit='white'] .tile-glyph {
        color: #1e293b;
      }

      /* wind variants */
      .tile-wind .tile-edge {
        background: linear-gradient(180deg, #e0e7ff 0%, #a5b4fc 100%);
      }
      .tile-wind .tile-glyph {
        color: #3730a3;
        font-size: 1.75rem;
      }

      /* small variant for history rows */
      .tile-card.tile-sm {
        width: 2.6rem;
        height: 3.5rem;
        border-radius: 0.4rem;
      }
      .tile-sm .tile-edge {
        inset: 0.18rem;
        border-radius: 0.3rem;
      }
      .tile-sm .tile-glyph {
        font-size: 1.05rem;
      }
      .tile-sm .tile-label,
      .tile-sm .tile-value {
        display: none;
      }
    `,
  ],
})
export class TileCardComponent {
  @Input({ required: true }) tile!: Tile;
  @Input() size: 'md' | 'sm' = 'md';

  suit = computed(() => {
    const t = this.tile;
    if (t.category === 'dragon') return t.suit;
    if (t.category === 'wind') return t.suit;
    return '';
  });

  glyph = computed(() => {
    const t = this.tile;
    if (t.category === 'number') return String(t.face);
    if (t.category === 'dragon') return dragonGlyph(t.suit);
    return windGlyph(t.suit);
  });

  label = computed(() => {
    const t = this.tile;
    if (t.category === 'number') return 'number';
    if (t.category === 'dragon') return `${t.suit} dragon`;
    return `${t.suit} wind`;
  });
}

function dragonGlyph(suit: 'red' | 'green' | 'white'): string {
  // Mahjong dragon characters: 中 (red, "centre"), 發 (green, "prosper"),
  // and a white-tile rectangle for the white dragon.
  if (suit === 'red') return '中';
  if (suit === 'green') return '發';
  return '⬜';
}

function windGlyph(suit: 'east' | 'south' | 'west' | 'north'): string {
  // 東 南 西 北 — classic mahjong wind kanji.
  if (suit === 'east') return '東';
  if (suit === 'south') return '南';
  if (suit === 'west') return '西';
  return '北';
}
