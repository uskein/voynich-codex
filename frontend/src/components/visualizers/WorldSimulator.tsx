import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion';

export interface WorldLike {
  name?: string;
  description?: string;
  coverImage?: string;
}

interface WorldSimulatorProps {
  world: WorldLike;
  tone?: string;
}

const TONE_PALETTES: Record<string, { c1: string; c2: string; c3: string; accent: string }> = {
  fantasy: { c1: '#7c3aed', c2: '#ec4899', c3: '#22d3ee', accent: '#d4af37' },
  scifi: { c1: '#3b82f6', c2: '#a855f7', c3: '#22d3ee', accent: '#60a5fa' },
  cosmic: { c1: '#a855f7', c2: '#8b5cf6', c3: '#f472b6', accent: '#e879f9' },
  steam: { c1: '#b45309', c2: '#f59e0b', c3: '#64748b', accent: '#fb923c' },
  ancient: { c1: '#7c3aed', c2: '#4f9d8a', c3: '#d4af37', accent: '#d4af37' }
};

const STARS = [
  { x: 12, y: 18, s: 2 }, { x: 82, y: 12, s: 1.5 }, { x: 68, y: 30, s: 2.5 },
  { x: 24, y: 62, s: 1.5 }, { x: 90, y: 55, s: 2 }, { x: 45, y: 12, s: 1.5 },
  { x: 8, y: 40, s: 2 }, { x: 94, y: 38, s: 1.5 }, { x: 60, y: 72, s: 2 },
  { x: 30, y: 84, s: 1.5 }, { x: 78, y: 86, s: 2.5 }, { x: 52, y: 46, s: 2 }
];

export function WorldSimulator({ world, tone = 'fantasy' }: WorldSimulatorProps) {
  const reduceMotion = prefersReducedMotion();
  const palette = TONE_PALETTES[tone] || TONE_PALETTES.fantasy;
  const { c1, c2, c3, accent } = palette;
  const name = world.name?.trim() || 'Untitled World';
  const hasImage = !!world.coverImage;

  const stars = useMemo(() => STARS.map((s) => ({ ...s, delay: Math.random() * 2 })), []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--border-color)', background: `radial-gradient(120% 120% at 50% 0%, ${c1}33, transparent 60%), radial-gradient(120% 120% at 80% 100%, ${c3}22, transparent 55%), #0a0a14` }}
    >
      {/* Nebula blobs */}
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width: 220, height: 220, top: -60, right: -70, backgroundColor: `${c2}2e` }}
        animate={reduceMotion ? undefined : { opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width: 180, height: 180, bottom: -70, left: -50, backgroundColor: `${c1}33` }}
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.2, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Stars */}
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, backgroundColor: 'rgba(255,255,255,0.7)' }}
          animate={reduceMotion ? undefined : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.4 + (i % 4), repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Scene */}
      <div className="relative flex flex-col items-center px-6 pt-8 pb-6">
        <div className="relative flex items-center justify-center">
          {/* Rings */}
          <motion.div
            className="absolute rounded-[50%] border pointer-events-none"
            style={{ width: 240, height: 76, borderColor: `${accent}55`, transform: 'rotate(-18deg)' }}
            animate={reduceMotion ? undefined : { rotate: [-18, 14, -18] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute rounded-[50%] border pointer-events-none"
            style={{ width: 200, height: 60, borderColor: `${c2}44`, transform: 'rotate(24deg)' }}
            animate={reduceMotion ? undefined : { rotate: [24, -16, 24] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Planet */}
          <motion.div
            className="relative w-44 h-44 rounded-full overflow-hidden"
            style={{ boxShadow: `0 0 44px ${c1}66, inset 0 0 44px rgba(0,0,0,0.65)` }}
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {hasImage ? (
              <img src={world.coverImage} alt={name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 28%, ${c1}, ${c2} 58%, ${c3})` }} />
            )}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 72% 22%, rgba(255,255,255,0.22), transparent 42%)' }} />
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.16) 50%, transparent 62%)' }}
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            />
            {!hasImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-14 h-14 text-white/25" />
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="font-serif text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{name}</h3>
          {world.description && (
            <p className="mt-2 text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
              {world.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
            <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: `${c2}88` }} />
            <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: `${c3}66` }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}