import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mountain } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion';
import { useI18n } from '../../i18n';

export interface ContinentLike {
  name?: string;
  description?: string;
  climate?: string;
  tone?: string;
}

interface ContinentSimulatorProps {
  continent: ContinentLike;
}

interface ContinentTonePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  groundNear: string;
  groundFar: string;
  mountain1: string;
  mountain2: string;
  mountain3: string;
  accent: string;
  sunColor: string;
  sunGlow: string;
  cloudColor: string;
  particleColor: string;
  treeColor?: string;
  waterColor?: string;
  sandColor?: string;
}

const TONE_PALETTES: Record<string, ContinentTonePalette> = {
  forest: {
    skyTop: '#0b1a2e', skyMid: '#1a3a5a', skyBottom: '#2a5a3a',
    groundNear: '#1a3a20', groundFar: '#0e2814',
    mountain1: '#2d5a3a', mountain2: '#1e4a2a', mountain3: '#3a6a48',
    accent: '#4ade80', sunColor: '#fde68a', sunGlow: '#fbbf24',
    cloudColor: 'rgba(200,230,210,0.15)', particleColor: '#86efac',
    treeColor: '#22c55e'
  },
  desert: {
    skyTop: '#1a1008', skyMid: '#3a2810', skyBottom: '#5a4020',
    groundNear: '#c4a050', groundFar: '#a08030',
    mountain1: '#b89040', mountain2: '#a07830', mountain3: '#d0b060',
    accent: '#f59e0b', sunColor: '#fef3c7', sunGlow: '#f59e0b',
    cloudColor: 'rgba(240,200,120,0.1)', particleColor: '#fcd34d',
    sandColor: '#e8c868'
  },
  arctic: {
    skyTop: '#0a1020', skyMid: '#142040', skyBottom: '#1e3050',
    groundNear: '#c8d8e8', groundFar: '#a0b8d0',
    mountain1: '#b0c8e0', mountain2: '#90b0d0', mountain3: '#d0e0f0',
    accent: '#7dd3fc', sunColor: '#e0f0ff', sunGlow: '#93c5fd',
    cloudColor: 'rgba(220,240,255,0.2)', particleColor: '#bae6fd'
  },
  volcanic: {
    skyTop: '#1a0808', skyMid: '#301010', skyBottom: '#4a1818',
    groundNear: '#3a1a10', groundFar: '#2a1008',
    mountain1: '#4a2018', mountain2: '#3a1510', mountain3: '#5a2820',
    accent: '#ef4444', sunColor: '#fecaca', sunGlow: '#f97316',
    cloudColor: 'rgba(200,100,80,0.15)', particleColor: '#fca5a5',
    waterColor: '#7f1d1d'
  },
  oceanic: {
    skyTop: '#060e1a', skyMid: '#0c1e38', skyBottom: '#143058',
    groundNear: '#1a4a6a', groundFar: '#0e3050',
    mountain1: '#2a5a7a', mountain2: '#1a4a6a', mountain3: '#3a6a8a',
    accent: '#38bdf8', sunColor: '#e0f4ff', sunGlow: '#38bdf8',
    cloudColor: 'rgba(160,210,240,0.12)', particleColor: '#7dd3fc',
    waterColor: '#0c4a6e'
  },
  floating: {
    skyTop: '#0a0820', skyMid: '#181040', skyBottom: '#281860',
    groundNear: '#3a2880', groundFar: '#281a60',
    mountain1: '#4a38a0', mountain2: '#3a2890', mountain3: '#5a48b0',
    accent: '#a78bfa', sunColor: '#e8d8ff', sunGlow: '#a78bfa',
    cloudColor: 'rgba(180,160,240,0.15)', particleColor: '#c4b5fd'
  }
};

export const CONTINENT_TONE_KEYS = Object.keys(TONE_PALETTES);
export const CONTINENT_TONE_LABELS: Record<string, string> = {
  forest: 'Selva', desert: 'Desierto', arctic: 'Artico',
  volcanic: 'Volcanico', oceanic: 'Oceanico', floating: 'Flotante'
};

const CLOUDS = [
  { x: 10, y: 15, w: 60, h: 12 }, { x: 35, y: 10, w: 45, h: 10 },
  { x: 60, y: 18, w: 55, h: 11 }, { x: 80, y: 12, w: 40, h: 9 },
];

const PARTICLES = [
  { x: 15, y: 60, s: 3 }, { x: 30, y: 55, s: 2 }, { x: 45, y: 62, s: 3 },
  { x: 60, y: 58, s: 2 }, { x: 75, y: 64, s: 3 }, { x: 25, y: 68, s: 2 },
  { x: 50, y: 70, s: 2 }, { x: 70, y: 66, s: 3 }, { x: 85, y: 62, s: 2 },
  { x: 20, y: 72, s: 2 }, { x: 55, y: 74, s: 2 }, { x: 40, y: 76, s: 2 },
];

export function ContinentSimulator({ continent }: ContinentSimulatorProps) {
  const { t } = useI18n();
  const reduceMotion = prefersReducedMotion();
  const tone = continent.tone || 'forest';
  const p = TONE_PALETTES[tone] || TONE_PALETTES.forest;
  const name = continent.name?.trim() || t('simulators.continent.unnamed');
  const hasDesc = !!continent.description?.trim();
  const hasClimate = !!continent.climate?.trim();

  const clouds = useMemo(() => CLOUDS.map(c => ({ ...c, delay: Math.random() * 5 })), []);
  const particles = useMemo(() => PARTICLES.map(pt => ({ ...pt, delay: Math.random() * 4 })), []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        borderColor: 'var(--border-color)',
        background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyMid} 25%, ${p.skyBottom} 45%, ${p.groundFar} 60%, ${p.groundNear} 100%)`
      }}
    >
      {/* Sun/Moon */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 100, height: 100, top: '5%', right: '15%',
          background: `radial-gradient(circle, ${p.sunGlow}30 0%, transparent 70%)`
        }}
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 32, height: 32, top: '9%', right: '18%',
          background: `radial-gradient(circle at 35% 35%, ${p.sunColor}, ${p.sunGlow})`,
          boxShadow: `0 0 40px ${p.sunGlow}55, 0 0 80px ${p.sunGlow}28`
        }}
      />

      {/* Clouds */}
      {clouds.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${c.x}%`, top: `${c.y}%`, width: c.w, height: c.h,
            background: p.cloudColor, filter: 'blur(8px)'
          }}
          animate={reduceMotion ? undefined : { x: [-10, 15, -10], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 18 + i * 3, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
        />
      ))}

      {/* Background mountains */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{ height: '55%' }}
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mtGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.mountain3} stopOpacity="0.6" />
            <stop offset="100%" stopColor={p.groundFar} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="mtGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.mountain2} stopOpacity="0.8" />
            <stop offset="100%" stopColor={p.groundNear} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="mtGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.mountain1} stopOpacity="0.9" />
            <stop offset="100%" stopColor={p.groundNear} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Far mountain range */}
        <motion.path
          d="M0,100 L30,70 L60,85 L90,55 L120,75 L150,50 L180,80 L210,45 L240,70 L270,55 L300,80 L330,60 L360,75 L390,50 L400,65 L400,140 L0,140 Z"
          fill="url(#mtGrad1)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,100 L30,70 L60,85 L90,55 L120,75 L150,50 L180,80 L210,45 L240,70 L270,55 L300,80 L330,60 L360,75 L390,50 L400,65 L400,140 L0,140 Z",
              "M0,98 L30,72 L60,83 L90,57 L120,73 L150,52 L180,78 L210,47 L240,68 L270,57 L300,78 L330,62 L360,73 L390,52 L400,63 L400,140 L0,140 Z",
              "M0,100 L30,70 L60,85 L90,55 L120,75 L150,50 L180,80 L210,45 L240,70 L270,55 L300,80 L330,60 L360,75 L390,50 L400,65 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Mid mountain range */}
        <motion.path
          d="M0,110 L40,85 L80,95 L120,70 L160,90 L200,65 L240,85 L280,70 L320,90 L360,75 L400,85 L400,140 L0,140 Z"
          fill="url(#mtGrad2)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,110 L40,85 L80,95 L120,70 L160,90 L200,65 L240,85 L280,70 L320,90 L360,75 L400,85 L400,140 L0,140 Z",
              "M0,108 L40,87 L80,93 L120,72 L160,88 L200,67 L240,83 L280,72 L320,88 L360,77 L400,83 L400,140 L0,140 Z",
              "M0,110 L40,85 L80,95 L120,70 L160,90 L200,65 L240,85 L280,70 L320,90 L360,75 L400,85 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Front mountain range */}
        <motion.path
          d="M0,120 L50,100 L100,108 L150,95 L200,105 L250,92 L300,102 L350,95 L400,100 L400,140 L0,140 Z"
          fill="url(#mtGrad3)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,120 L50,100 L100,108 L150,95 L200,105 L250,92 L300,102 L350,95 L400,100 L400,140 L0,140 Z",
              "M0,118 L50,102 L100,106 L150,97 L200,103 L250,94 L300,100 L350,97 L400,98 L400,140 L0,140 Z",
              "M0,120 L50,100 L100,108 L150,95 L200,105 L250,92 L300,102 L350,95 L400,100 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Ground plane */}
        <rect x="0" y="115" width="400" height="25" fill={p.groundNear} />
      </svg>

      {/* Trees (forest tone) */}
      {p.treeColor && (
        <div className="absolute pointer-events-none" style={{ bottom: '18%', left: 0, right: 0 }}>
          {[12, 22, 35, 48, 62, 75, 88].map((x, i) => (
            <motion.div
              key={`tree-${i}`}
              className="absolute"
              style={{ left: `${x}%`, bottom: 0 }}
              animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            >
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: `14px solid ${p.treeColor}`, opacity: 0.7 + (i % 3) * 0.1 }} />
              <div style={{ width: 2, height: 6, backgroundColor: '#5a3a20', margin: '0 auto', opacity: 0.6 }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Water reflection (oceanic tone) */}
      {p.waterColor && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            bottom: '12%', left: '10%', right: '10%', height: 20,
            background: `linear-gradient(180deg, ${p.waterColor}40, transparent)`,
            borderRadius: '50%'
          }}
          animate={reduceMotion ? undefined : { opacity: [0.3, 0.6, 0.3], scaleX: [0.95, 1.05, 0.95] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Floating islands (floating tone) */}
      {tone === 'floating' && (
        <>
          {[
            { x: 15, y: 50, w: 30, h: 10 },
            { x: 55, y: 45, w: 25, h: 8 },
            { x: 80, y: 52, w: 20, h: 7 }
          ].map((island, i) => (
            <motion.div
              key={`island-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${island.x}%`, top: `${island.y}%`,
                width: island.w, height: island.h,
                background: `radial-gradient(ellipse, ${p.mountain1}, ${p.groundNear})`,
                borderRadius: '50%'
              }}
              animate={reduceMotion ? undefined : { y: [-3, 3, -3] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
            />
          ))}
        </>
      )}

      {/* Particles */}
      {particles.map((pt, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${pt.x}%`, top: `${pt.y}%`, width: pt.s, height: pt.s,
            backgroundColor: p.particleColor,
            boxShadow: `0 0 ${pt.s * 3}px ${p.particleColor}66`
          }}
          animate={reduceMotion ? undefined : {
            opacity: [0.1, 0.6, 0.1],
            y: [-3, 3, -3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: pt.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Ground texture lines */}
      <div className="absolute pointer-events-none" style={{ bottom: '10%', left: 0, right: 0, height: 40 }}>
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={`line-${i}`}
            className="absolute"
            style={{
              left: `${10 + i * 22}%`, bottom: `${i * 8}px`,
              width: `${15 + i * 5}%`, height: 1,
              backgroundColor: `${p.accent}15`
            }}
            animate={reduceMotion ? undefined : { opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Scene content */}
      <div className="relative flex flex-col items-center px-6 pt-10 pb-6" style={{ minHeight: 210 }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-3"
        >
          <div
            className="p-3 rounded-full"
            style={{
              backgroundColor: `${p.accent}20`,
              border: `1px solid ${p.accent}30`,
              boxShadow: `0 0 20px ${p.accent}15`
            }}
          >
            <Mountain className="w-7 h-7" style={{ color: p.accent }} />
          </div>
        </motion.div>

        <motion.h3
          className="font-serif text-2xl font-bold text-center"
          style={{ color: '#e8f0e0', textShadow: `0 0 25px ${p.accent}33` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {name}
        </motion.h3>

        {hasClimate && (
          <motion.p
            className="mt-1 text-xs font-medium tracking-wider uppercase"
            style={{ color: `${p.accent}aa` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            {continent.climate}
          </motion.p>
        )}

        {hasDesc && (
          <motion.p
            className="mt-2 text-sm leading-relaxed text-center max-w-md line-clamp-3"
            style={{ color: '#a0b8a0' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {continent.description}
          </motion.p>
        )}

        <motion.div
          className="mt-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className="h-px w-8 rounded-full" style={{ backgroundColor: `${p.accent}44` }} />
          <Mountain className="w-3 h-3" style={{ color: `${p.accent}66` }} />
          <span className="h-px w-8 rounded-full" style={{ backgroundColor: `${p.accent}44` }} />
        </motion.div>
      </div>
    </div>
  );
}
