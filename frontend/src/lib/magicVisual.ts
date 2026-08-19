export type MagicCircle = 'none' | 'ring' | 'double';
export type MagicStyle = 'glow' | 'solid';

export interface MagicSymbol {
  id: string;
  symbol: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color: string;
}

export interface MagicVisualComposition {
  circle: MagicCircle;
  style: MagicStyle;
  primary: string;
  accent: string;
  background: boolean;
  ringWidth: number;
  symbols: MagicSymbol[];
}

export const MAGIC_SYMBOLS: Record<string, { path: string }> = {
  star: {
    path:
      'M12 1.5 L14.8 8.7 L22.5 9 L16.5 14 L18.3 21.6 L12 17.2 L5.7 21.6 L7.5 14 L1.5 9 L9.2 8.7 Z'
  },
  moon: {
    path:
      'M14.5 2 A6.5 6.5 0 1 0 14.5 22 A5 5 0 1 1 14.5 2 Z'
  },
  flame: {
    path:
      'M12 1 C14 7 19 9 19 14.5 C19 19 15.5 22.5 12 22.5 C8.5 22.5 5 19 5 14.5 C5 10 8 8 10 5 C11 3.5 11.5 2.5 12 1 Z'
  },
  sword: {
    path:
      'M11.2 22 L11.2 9.5 L9.2 7.5 L9.2 5 L11 5 L11 3 L9.5 2.2 L9.5 0.5 L14.5 0.5 L14.5 2.2 L13 3 L13 5 L14.8 5 L14.8 7.5 L12.8 9.5 L12.8 22 Z'
  },
  eye: {
    path:
      'M3 12 C8 5 16 5 21 12 C16 19 8 19 3 12 Z'
  },
  triangle: {
    path:
      'M12 2 L22 20 L2 20 Z'
  },
  lightning: {
    path:
      'M13 1 L4 13 L10 13 L9 23 L20 9 L13 9 Z'
  },
  cross: {
    path:
      'M9.8 4 L14.2 4 L14.2 9.8 L20 9.8 L20 14.2 L14.2 14.2 L14.2 20 L9.8 20 L9.8 14.2 L4 14.2 L4 9.8 L9.8 9.8 Z'
  },
  diamond: {
    path: 'M12 2 L21 12 L12 22 L3 12 Z'
  },
  infinity: {
    path:
      'M12 12 C8 7 4 7 4 12 C4 17 8 17 12 12 C16 7 20 7 20 12 C20 17 16 17 12 12 Z'
  }
};

export const MAGIC_SYMBOL_IDS = ['star', 'moon', 'flame', 'sword', 'eye', 'triangle', 'lightning', 'cross', 'diamond', 'infinity'];

export const MAGIC_SYMBOL_LABELS: Record<string, string> = {
  star: 'Star', moon: 'Moon', flame: 'Flame', sword: 'Sword', eye: 'Eye', triangle: 'Triangle',
  lightning: 'Lightning', cross: 'Cross', diamond: 'Diamond', infinity: 'Infinity'
};

export function defaultMagicVisual(): MagicVisualComposition {
  return {
    circle: 'ring',
    style: 'glow',
    primary: '#d97216',
    accent: '#f0c330',
    background: true,
    ringWidth: 4,
    symbols: []
  };
}

export function newMagicSymbolId(): string {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}