import {
  PawPrint, Flower2, CircleDot, Sparkles, Ghost, Swords,
  type LucideIcon
} from 'lucide-react';

export type SpeciesKey = 'ANIMAL' | 'PLANTA' | 'HONGO' | 'CRIATURA_MITICA' | 'ENTIDAD';
export type DangerKey = 'INOFENSIVA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MORTAL';

export interface CreatureImageLike {
  id?: string;
  url: string;
  alt?: string;
  caption?: string;
}

export interface CreatureLike {
  id?: string;
  name: string;
  species?: string;
  dangerLevel?: string;
  habitat?: string;
  diet?: string;
  description?: string;
  region?: { id: string; name: string } | null;
  images?: CreatureImageLike[];
  imageUrl?: string;
}

export interface SpeciesMeta {
  icon: LucideIcon;
  label: string;
  color: string;
}

export interface DangerMeta {
  level: number;
  label: string;
  text: string;
  bar: string;
  glow: string;
  shadow: string;
}

export const SPECIES_LIST: { value: SpeciesKey; meta: SpeciesMeta }[] = [
  { value: 'ANIMAL', meta: { icon: PawPrint, label: 'Animal', color: 'text-emerald-400' } },
  { value: 'PLANTA', meta: { icon: Flower2, label: 'Plant', color: 'text-green-400' } },
  { value: 'HONGO', meta: { icon: CircleDot, label: 'Fungus', color: 'text-purple-400' } },
  { value: 'CRIATURA_MITICA', meta: { icon: Sparkles, label: 'Mythical', color: 'text-pink-400' } },
  { value: 'ENTIDAD', meta: { icon: Ghost, label: 'Entity', color: 'text-indigo-400' } }
];

export const DANGER_LIST: { value: DangerKey; meta: DangerMeta }[] = [
  { value: 'INOFENSIVA', meta: { level: 0, label: 'Harmless', text: 'text-green-400', bar: 'bg-green-500', glow: 'rgba(74,222,128,0.35)', shadow: '0 0 40px rgba(74,222,128,0.35)' } },
  { value: 'BAJA', meta: { level: 1, label: 'Low', text: 'text-green-400', bar: 'bg-green-500', glow: 'rgba(74,222,128,0.4)', shadow: '0 0 40px rgba(74,222,128,0.4)' } },
  { value: 'MEDIA', meta: { level: 2, label: 'Medium', text: 'text-yellow-400', bar: 'bg-yellow-500', glow: 'rgba(250,204,21,0.4)', shadow: '0 0 40px rgba(250,204,21,0.4)' } },
  { value: 'ALTA', meta: { level: 3, label: 'High', text: 'text-orange-400', bar: 'bg-orange-500', glow: 'rgba(251,146,60,0.5)', shadow: '0 0 40px rgba(251,146,60,0.5)' } },
  { value: 'MORTAL', meta: { level: 4, label: 'Mortal', text: 'text-red-400', bar: 'bg-red-500', glow: 'rgba(239,68,68,0.55)', shadow: '0 0 48px rgba(239,68,68,0.55)' } }
];

export const speciesMeta: Record<string, SpeciesMeta> = Object.fromEntries(
  SPECIES_LIST.map((s) => [s.value, s.meta])
);

export const dangerMap: Record<string, DangerMeta> = Object.fromEntries(
  DANGER_LIST.map((d) => [d.value, d.meta])
);

export function habitatGradient(habitat?: string): string {
  const h = (habitat || '').toLowerCase();
  if (/agua|mar|lago|r[uí]o|oceano|océano/.test(h)) return 'from-blue-900/70 via-midnight-800 to-midnight-900';
  if (/bosque|selva|jungla|arbol|árbol|pradera/.test(h)) return 'from-emerald-900/70 via-midnight-800 to-midnight-900';
  if (/desierto|arena|duna/.test(h)) return 'from-amber-800/60 via-midnight-800 to-midnight-900';
  if (/monta|sierra|pico|altiplano/.test(h)) return 'from-slate-700/70 via-midnight-800 to-midnight-900';
  if (/ciudad|urbs|aldea|pueblo|capital/.test(h)) return 'from-violet-900/60 via-midnight-800 to-midnight-900';
  if (/hielo|glacia|nieve|tundra/.test(h)) return 'from-cyan-900/60 via-midnight-800 to-midnight-900';
  return 'from-midnight-700 via-midnight-800 to-midnight-900';
}

export const HABITAT_SUGGESTIONS = ['Bosque', 'Desierto', 'Mar', 'Montañas', 'Ciudad', 'Hielo'];

export const particles = [
  { left: '12%', delay: 0, duration: 6 },
  { left: '28%', delay: 1.2, duration: 7 },
  { left: '44%', delay: 0.6, duration: 5.5 },
  { left: '62%', delay: 2, duration: 6.5 },
  { left: '78%', delay: 0.3, duration: 7.5 },
  { left: '90%', delay: 1.6, duration: 6 }
];

export function getCreatureVisuals(c: CreatureLike) {
  const danger = dangerMap[c.dangerLevel || 'MEDIA'] || dangerMap.MEDIA;
  const species = speciesMeta[c.species || 'ANIMAL'] || speciesMeta.ANIMAL;
  const heroImage = c.images?.[0]?.url || c.imageUrl;
  return {
    danger,
    species,
    SpeciesIcon: species.icon,
    heroImage,
    gradient: habitatGradient(c.habitat),
    fallbackIcon: Swords
  };
}

export function dangerByLevel(level: number): DangerMeta {
  return DANGER_LIST[Math.min(Math.max(level, 0), DANGER_LIST.length - 1)].meta;
}