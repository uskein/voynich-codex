export type ShieldShape = 'classic' | 'heater' | 'french' | 'german' | 'oval';
export type HeraldryKind = 'shield' | 'flag';
export type FieldType = 'solid' | 'twoTone' | 'vStripes' | 'hStripes' | 'diagonal';

export interface ChargeShape {
  id: string;
  kind: 'shape';
  shape: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  opacity: number;
}

export interface ChargeImage {
  id: string;
  kind: 'image';
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export type Charge = ChargeShape | ChargeImage;

export interface HeraldryComposition {
  kind: HeraldryKind;
  shield: ShieldShape;
  field: { type: FieldType; color: string; color2: string };
  tincture: { enabled: boolean; type: TinctureType; color: string; opacity: number };
  border: { enabled: boolean; color: string; width: number };
  charges: Charge[];
  motto: string;
}

export const SHIELD_SHAPES: Record<ShieldShape, string> = {
  classic:
    'M 50 4 C 76 4 92 20 92 40 C 92 68 74 96 50 116 C 26 96 8 68 8 40 C 8 20 24 4 50 4 Z',
  heater:
    'M 50 6 L 72 6 L 84 18 L 84 38 C 84 64 70 88 50 110 C 30 88 16 64 16 38 L 16 18 L 28 6 Z',
  french:
    'M 50 6 L 88 6 L 88 44 C 88 74 70 100 50 114 C 30 100 12 74 12 44 L 12 6 Z',
  german:
    'M 50 8 C 68 8 82 16 86 30 C 89 42 84 56 74 66 C 66 74 56 88 50 112 C 44 88 34 74 26 66 C 16 56 11 42 14 30 C 18 16 32 8 50 8 Z',
  oval:
    'M 50 6 C 82 6 90 40 84 70 C 79 98 63 114 50 114 C 37 114 21 98 16 70 C 10 40 18 6 50 6 Z'
};

export const SHIELD_SHAPE_IDS = Object.keys(SHIELD_SHAPES) as ShieldShape[];

export const TINCTURES = [
  { id: 'gules', name: 'Gules', color: '#c1272d' },
  { id: 'or', name: 'Or', color: '#f0c330' },
  { id: 'azure', name: 'Azure', color: '#1e4fa0' },
  { id: 'vert', name: 'Vert', color: '#2f8f4e' },
  { id: 'sable', name: 'Sable', color: '#1b1b1f' },
  { id: 'argent', name: 'Argent', color: '#e8e6df' },
  { id: 'purpure', name: 'Purpure', color: '#6a2a8f' },
  { id: 'tenne', name: 'Tenne', color: '#c0691e' }
];

export const CHARGE_PATHS: Record<string, { path: string; hint?: string }> = {
  star: {
    path:
      'M12 1.5 L14.8 8.7 L22.5 9 L16.5 14 L18.3 21.6 L12 17.2 L5.7 21.6 L7.5 14 L1.5 9 L9.2 8.7 Z'
  },
  crown: {
    path:
      'M3 6 L6 6 L8 12 L10 6 L12 10.5 L14 6 L16 12 L18 6 L21 6 L19 17.5 L5 17.5 Z'
  },
  sword: {
    path:
      'M11.2 22 L11.2 9.5 L9.2 7.5 L9.2 5 L11 5 L11 3 L9.5 2.2 L9.5 0.5 L14.5 0.5 L14.5 2.2 L13 3 L13 5 L14.8 5 L14.8 7.5 L12.8 9.5 L12.8 22 Z'
  },
  tower: {
    path:
      'M6 22 L6 12 L9 12 L9 8 L9.5 8 L9.5 5 L10.5 5 L10.5 3.5 L12 3.5 L12 2 L14 2 L14 3.5 L15.5 3.5 L15.5 5 L16.5 5 L16.5 8 L17 8 L17 12 L20 12 L20 22 Z'
  },
  flame: {
    path:
      'M12 1 C14 7 19 9 19 14.5 C19 19 15.5 22.5 12 22.5 C8.5 22.5 5 19 5 14.5 C5 10 8 8 10 5 C11 3.5 11.5 2.5 12 1 Z'
  },
  cross: {
    path:
      'M9.8 4 L14.2 4 L14.2 9.8 L20 9.8 L20 14.2 L14.2 14.2 L14.2 20 L9.8 20 L9.8 14.2 L4 14.2 L4 9.8 L9.8 9.8 Z'
  },
  diamond: {
    path: 'M12 2 L21 12 L12 22 L3 12 Z'
  },
  moon: {
    path:
      'M14.5 2 A6.5 6.5 0 1 0 14.5 22 A5 5 0 1 1 14.5 2 Z'
  },
  bird: {
    path:
      'M2 16 C6 12 9 10 14 9 C18 8 21 5 22 2 C20 6 19 9 17 11 C15 13 12 14 10 14 C8 15 7 17 6 19 C5 18 3 17 2 16 Z'
  },
  dragon: {
    path:
      'M4 20 C4 10 10 4 18 4 C22 4 22 8 20 9 C18 10 15 9 14 7 C13 5 15 4 16 4.5 C11 6 8 10 8 16 C8 20 10 22 14 22 C10 22 6 21 4 20 Z'
  }
};

export const SUN_SHAPE = 'sun';

export const CHARGE_IDS = ['star', 'crown', 'sword', 'tower', 'flame', 'cross', 'diamond', 'sun', 'moon', 'bird', 'dragon'];

export const CHARGE_LABELS: Record<string, string> = {
  star: 'Star', crown: 'Crown', sword: 'Sword', tower: 'Tower', flame: 'Flame',
  cross: 'Cross', diamond: 'Diamond', sun: 'Sun', moon: 'Moon', bird: 'Falcon', dragon: 'Dragon'
};

export type TinctureType = 'band' | 'bandRev' | 'fess' | 'pale' | 'chevron' | 'chevronRev' | 'cross' | 'saltire' | 'checky';

export const TINCTURE_TYPES: { id: TinctureType; label: string }[] = [
  { id: 'band', label: 'Band' },
  { id: 'bandRev', label: 'Band reversed' },
  { id: 'fess', label: 'Fess' },
  { id: 'pale', label: 'Pale' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'chevronRev', label: 'Chevron reversed' },
  { id: 'cross', label: 'Cross' },
  { id: 'saltire', label: 'Saltire' },
  { id: 'checky', label: 'Checky' }
];

export const FIELD_TYPES: { id: FieldType; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'twoTone', label: 'Two tone' },
  { id: 'vStripes', label: 'Vertical stripes' },
  { id: 'hStripes', label: 'Horizontal stripes' },
  { id: 'diagonal', label: 'Diagonal' }
];

export function defaultComposition(kind: HeraldryKind = 'shield'): HeraldryComposition {
  return {
    kind,
    shield: 'classic',
    field:
      kind === 'flag'
        ? { type: 'vStripes', color: '#1e4fa0', color2: '#f0c330' }
        : { type: 'solid', color: '#1e4fa0', color2: '#1b3a70' },
    tincture: { enabled: false, type: 'band', color: '#f0c330', opacity: 0.45 },
    border: { enabled: true, color: '#f0c330', width: 5 },
    charges: [],
    motto: ''
  };
}

export function newChargeId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}