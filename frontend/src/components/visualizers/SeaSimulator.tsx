import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion';
import { useI18n } from '../../i18n';

export interface SeaLike {
  name?: string;
  description?: string;
  tone?: string;
}

interface SeaSimulatorProps {
  sea: SeaLike;
}

interface SeaTonePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  horizon: string;
  waterDeep: string;
  waterMid: string;
  waterSurface: string;
  wavePrimary: string;
  waveSecondary: string;
  waveFoam: string;
  moon: string;
  moonGlow: string;
  starColor: string;
  bubbleColor: string;
  bioLumColor: string;
  causticColor: string;
  aurora1?: string;
  aurora2?: string;
  mistColor: string;
}

const TONE_PALETTES: Record<string, SeaTonePalette> = {
  ocean: {
    skyTop: '#060c1a', skyMid: '#0c1832', skyBottom: '#132a4a', horizon: '#1a3f6a',
    waterDeep: '#040e1c', waterMid: '#0a1e3a', waterSurface: '#103058',
    wavePrimary: '#1e6aa8', waveSecondary: '#2880c4', waveFoam: '#a8d8f0',
    moon: '#e8e4d4', moonGlow: '#c4d4f0', starColor: 'rgba(200,220,255,0.8)',
    bubbleColor: 'rgba(100,200,255,0.4)', bioLumColor: '#4af0d4',
    causticColor: 'rgba(80,180,255,0.12)', aurora1: '#22d3ee', aurora2: '#06b6d4',
    mistColor: 'rgba(150,200,240,0.08)'
  },
  arctic: {
    skyTop: '#0a0e18', skyMid: '#101828', skyBottom: '#1a2840', horizon: '#2a4060',
    waterDeep: '#081420', waterMid: '#102838', waterSurface: '#1a3a50',
    wavePrimary: '#4a90b8', waveSecondary: '#6ab0d4', waveFoam: '#d0eaf8',
    moon: '#f0ece0', moonGlow: '#d8e8f8', starColor: 'rgba(220,235,255,0.9)',
    bubbleColor: 'rgba(180,220,255,0.5)', bioLumColor: '#80e0ff',
    causticColor: 'rgba(140,210,255,0.1)', aurora1: '#67e8f9', aurora2: '#a5f3fc',
    mistColor: 'rgba(200,230,255,0.12)'
  },
  tropical: {
    skyTop: '#0c0818', skyMid: '#1a1030', skyBottom: '#2a1840', horizon: '#3a2858',
    waterDeep: '#0a0818', waterMid: '#181030', waterSurface: '#201848',
    wavePrimary: '#4a28a0', waveSecondary: '#7040d0', waveFoam: '#c8a0f0',
    moon: '#f0e0d0', moonGlow: '#e0c0a0', starColor: 'rgba(255,220,180,0.7)',
    bubbleColor: 'rgba(180,120,255,0.4)', bioLumColor: '#f0a0e0',
    causticColor: 'rgba(200,100,255,0.1)', aurora1: '#c084fc', aurora2: '#e879f9',
    mistColor: 'rgba(200,150,255,0.08)'
  },
  volcanic: {
    skyTop: '#140808', skyMid: '#201010', skyBottom: '#301818', horizon: '#4a2020',
    waterDeep: '#180808', waterMid: '#281010', waterSurface: '#3a1818',
    wavePrimary: '#a03020', waveSecondary: '#c04030', waveFoam: '#f0a080',
    moon: '#f0d0a0', moonGlow: '#e0b080', starColor: 'rgba(255,180,120,0.6)',
    bubbleColor: 'rgba(255,120,80,0.4)', bioLumColor: '#ff6040',
    causticColor: 'rgba(255,80,40,0.1)', aurora1: '#f97316', aurora2: '#ef4444',
    mistColor: 'rgba(255,150,100,0.1)'
  },
  abyss: {
    skyTop: '#020408', skyMid: '#040810', skyBottom: '#060c18', horizon: '#0a1420',
    waterDeep: '#020408', waterMid: '#040a14', waterSurface: '#081020',
    wavePrimary: '#102848', waveSecondary: '#183860', waveFoam: '#4070a0',
    moon: '#c0c8d0', moonGlow: '#8090a8', starColor: 'rgba(150,170,200,0.6)',
    bubbleColor: 'rgba(60,120,180,0.3)', bioLumColor: '#20c0a0',
    causticColor: 'rgba(30,100,160,0.08)',
    mistColor: 'rgba(60,100,150,0.06)'
  },
  mystical: {
    skyTop: '#0a0418', skyMid: '#140828', skyBottom: '#201040', horizon: '#301858',
    waterDeep: '#0a0418', waterMid: '#140830', waterSurface: '#201050',
    wavePrimary: '#6020c0', waveSecondary: '#8040e0', waveFoam: '#c0a0f8',
    moon: '#e0d0f8', moonGlow: '#c0a0f0', starColor: 'rgba(200,160,255,0.7)',
    bubbleColor: 'rgba(160,100,255,0.4)', bioLumColor: '#c080ff',
    causticColor: 'rgba(140,80,255,0.1)', aurora1: '#a855f7', aurora2: '#d946ef',
    mistColor: 'rgba(160,120,255,0.08)'
  }
};

export const SEA_TONE_KEYS = Object.keys(TONE_PALETTES);
export const TONE_LABELS: Record<string, string> = {
  ocean: 'Oceano Profundo', arctic: 'Artico', tropical: 'Tropical',
  volcanic: 'Volcanico', abyss: 'Abismo', mystical: 'Mistico'
};

const STARS = [
  { x:8,y:8,s:1.5 },{ x:18,y:5,s:2 },{ x:28,y:12,s:1.5 },{ x:38,y:3,s:2.5 },
  { x:48,y:10,s:1.5 },{ x:58,y:6,s:2 },{ x:68,y:14,s:1.5 },{ x:78,y:4,s:2 },
  { x:88,y:11,s:1.5 },{ x:12,y:18,s:1 },{ x:32,y:16,s:1.5 },{ x:52,y:18,s:1 },
  { x:72,y:20,s:1.5 },{ x:92,y:8,s:1 },{ x:42,y:22,s:1 },{ x:62,y:2,s:1.5 },
  { x:22,y:24,s:1 },{ x:82,y:18,s:1.5 }
];

const BUBBLES = [
  { x:12,y:68,s:5,d:0 },{ x:22,y:74,s:3,d:1.0 },{ x:32,y:70,s:6,d:0.5 },
  { x:42,y:76,s:4,d:1.8 },{ x:52,y:72,s:5,d:0.3 },{ x:62,y:78,s:3,d:1.5 },
  { x:72,y:69,s:4,d:0.8 },{ x:82,y:75,s:5,d:2.0 },{ x:18,y:82,s:3,d:1.2 },
  { x:38,y:84,s:4,d:0.6 },{ x:58,y:80,s:3,d:1.8 },{ x:78,y:83,s:4,d:0.2 },
  { x:28,y:88,s:3,d:2.2 },{ x:48,y:90,s:4,d:1.4 },{ x:68,y:86,s:3,d:0.9 },
  { x:88,y:89,s:3,d:1.6 },{ x:15,y:72,s:4,d:0.7 },{ x:45,y:78,s:3,d:1.1 },
];

const BIO = [
  { x:8,y:78,s:3 },{ x:20,y:84,s:2 },{ x:35,y:80,s:3 },{ x:50,y:86,s:2 },
  { x:65,y:82,s:3 },{ x:80,y:85,s:2 },{ x:30,y:90,s:2 },{ x:55,y:88,s:3 },
  { x:75,y:92,s:2 },{ x:45,y:94,s:2 },{ x:15,y:88,s:2 },{ x:85,y:80,s:3 },
];

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = ((g-b)/d + (g<b?6:0))/6;
    else if (max === g) h = ((b-r)/d+2)/6;
    else h = ((r-g)/d+4)/6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

export function SeaSimulator({ sea }: SeaSimulatorProps) {
  const { t } = useI18n();
  const reduceMotion = prefersReducedMotion();
  const tone = sea.tone || 'ocean';
  const p = TONE_PALETTES[tone] || TONE_PALETTES.ocean;
  const name = sea.name?.trim() || t('simulators.sea.unnamed');
  const hasDesc = !!sea.description?.trim();

  const stars = useMemo(() => STARS.map(s => ({ ...s, delay: Math.random()*3 })), []);
  const bubbles = useMemo(() => BUBBLES.map(b => ({ ...b, delay: b.d + Math.random()*0.5 })), []);

  const hsl = hexToHsl(p.wavePrimary);

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        borderColor: 'var(--border-color)',
        background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyMid} 18%, ${p.skyBottom} 32%, ${p.horizon} 42%, ${p.waterDeep} 50%, ${p.waterMid} 72%, ${p.waterSurface} 100%)`
      }}
    >
      {/* Aurora bands */}
      {(p.aurora1 && p.aurora2) && (
        <>
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: '4%', left: '10%', right: '10%', height: 50, borderRadius: '50%',
              background: `linear-gradient(90deg, transparent, ${p.aurora1}18, ${p.aurora2}22, ${p.aurora1}18, transparent)`,
              filter: 'blur(20px)'
            }}
            animate={reduceMotion ? undefined : { opacity: [0.3, 0.7, 0.3], scaleX: [0.95, 1.05, 0.95] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: '10%', left: '20%', right: '15%', height: 30, borderRadius: '50%',
              background: `linear-gradient(90deg, transparent, ${p.aurora2}14, ${p.aurora1}1a, ${p.aurora2}14, transparent)`,
              filter: 'blur(16px)'
            }}
            animate={reduceMotion ? undefined : { opacity: [0.2, 0.5, 0.2], rotate: [-1, 1, -1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Moon glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 140, height: 140, top: '6%', left: '50%', transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${p.moonGlow}25 0%, transparent 70%)`
        }}
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Moon */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 38, height: 38, top: '10%', left: '50%', transform: 'translateX(-50%)',
          background: `radial-gradient(circle at 35% 35%, ${p.moon}, ${p.moonGlow})`,
          boxShadow: `0 0 50px ${p.moonGlow}55, 0 0 100px ${p.moonGlow}28`
        }}
      />

      {/* Stars */}
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, backgroundColor: p.starColor }}
          animate={reduceMotion ? undefined : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Clouds */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '22%', width: 120, height: 20, borderRadius: '50%',
          background: `${p.mistColor}`, filter: 'blur(12px)'
        }}
        animate={reduceMotion ? undefined : { x: [-20, 30, -20], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '28%', width: 80, height: 14, borderRadius: '50%', left: '60%',
          background: `${p.mistColor}`, filter: 'blur(10px)'
        }}
        animate={reduceMotion ? undefined : { x: [20, -15, 20], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Moon reflection on water */}
      <div className="absolute pointer-events-none" style={{ top: '44%', left: '50%', transform: 'translateX(-50%)', width: 50, height: 90 }}>
        {[0,1,2,3,4,5].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + (i % 3) * 2, height: 2, left: `${25 + (i * 8) % 50}%`, top: `${i * 15}%`,
              backgroundColor: `${p.moonGlow}3a`, filter: 'blur(1px)'
            }}
            animate={reduceMotion ? undefined : { opacity: [0.15, 0.55, 0.15], scaleX: [1, 1.5, 1] }}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Caustic light rays underwater */}
      {[0,1,2].map(i => (
        <motion.div
          key={`caustic-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: '52%', left: `${20 + i * 25}%`, width: 30 + i * 10, height: '48%',
            background: `linear-gradient(180deg, ${p.causticColor} 0%, transparent 80%)`,
            transform: `rotate(${-8 + i * 8}deg)`, transformOrigin: 'top center',
            filter: 'blur(8px)'
          }}
          animate={reduceMotion ? undefined : { opacity: [0.3, 0.7, 0.3], scaleX: [0.8, 1.2, 0.8] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
        />
      ))}

      {/* SVG Waves - 6 layers */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{ height: '55%' }}
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.waveSecondary} stopOpacity="0.08" />
            <stop offset="100%" stopColor={p.waterDeep} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.wavePrimary} stopOpacity="0.15" />
            <stop offset="100%" stopColor={p.waterMid} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="waveGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.wavePrimary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={p.waterSurface} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Deep layer */}
        <motion.path
          d="M0,60 Q40,48 80,60 Q120,72 160,60 Q200,48 240,60 Q280,72 320,60 Q360,48 400,60 L400,140 L0,140 Z"
          fill="url(#waveGrad1)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,60 Q40,48 80,60 Q120,72 160,60 Q200,48 240,60 Q280,72 320,60 Q360,48 400,60 L400,140 L0,140 Z",
              "M0,62 Q40,52 80,62 Q120,72 160,60 Q200,48 240,62 Q280,74 320,60 Q360,46 400,62 L400,140 L0,140 Z",
              "M0,60 Q40,48 80,60 Q120,72 160,60 Q200,48 240,60 Q280,72 320,60 Q360,48 400,60 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Mid-deep */}
        <motion.path
          d="M0,72 Q50,62 100,72 Q150,82 200,72 Q250,62 300,72 Q350,82 400,72 L400,140 L0,140 Z"
          fill="url(#waveGrad1)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,72 Q50,62 100,72 Q150,82 200,72 Q250,62 300,72 Q350,82 400,72 L400,140 L0,140 Z",
              "M0,70 Q50,60 100,74 Q150,84 200,70 Q250,60 300,74 Q350,84 400,70 L400,140 L0,140 Z",
              "M0,72 Q50,62 100,72 Q150,82 200,72 Q250,62 300,72 Q350,82 400,72 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        {/* Mid */}
        <motion.path
          d="M0,82 Q60,72 120,82 Q180,92 240,82 Q300,72 360,82 Q390,88 400,82 L400,140 L0,140 Z"
          fill="url(#waveGrad2)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,82 Q60,72 120,82 Q180,92 240,82 Q300,72 360,82 Q390,88 400,82 L400,140 L0,140 Z",
              "M0,80 Q60,70 120,84 Q180,94 240,80 Q300,70 360,84 Q390,90 400,80 L400,140 L0,140 Z",
              "M0,82 Q60,72 120,82 Q180,92 240,82 Q300,72 360,82 Q390,88 400,82 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
        {/* Surface back */}
        <motion.path
          d="M0,90 Q40,82 80,90 Q120,98 160,90 Q200,82 240,90 Q280,98 320,90 Q360,82 400,90 L400,140 L0,140 Z"
          fill="url(#waveGrad2)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,90 Q40,82 80,90 Q120,98 160,90 Q200,82 240,90 Q280,98 320,90 Q360,82 400,90 L400,140 L0,140 Z",
              "M0,88 Q40,80 80,92 Q120,100 160,88 Q200,80 240,92 Q280,100 320,88 Q360,80 400,88 L400,140 L0,140 Z",
              "M0,90 Q40,82 80,90 Q120,98 160,90 Q200,82 240,90 Q280,98 320,90 Q360,82 400,90 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Surface front */}
        <motion.path
          d="M0,96 Q50,88 100,96 Q150,104 200,96 Q250,88 300,96 Q350,104 400,96 L400,140 L0,140 Z"
          fill="url(#waveGrad3)"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,96 Q50,88 100,96 Q150,104 200,96 Q250,88 300,96 Q350,104 400,96 L400,140 L0,140 Z",
              "M0,94 Q50,86 100,98 Q150,106 200,94 Q250,86 300,98 Q350,106 400,94 L400,140 L0,140 Z",
              "M0,96 Q50,88 100,96 Q150,104 200,96 Q250,88 300,96 Q350,104 400,96 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
        {/* Foam crest */}
        <motion.path
          d="M0,100 Q30,95 60,100 Q90,105 120,100 Q150,95 180,100 Q210,105 240,100 Q270,95 300,100 Q330,105 360,100 Q390,95 400,100 L400,140 L0,140 Z"
          fill={p.waveFoam}
          fillOpacity="0.12"
          animate={reduceMotion ? undefined : {
            d: [
              "M0,100 Q30,95 60,100 Q90,105 120,100 Q150,95 180,100 Q210,105 240,100 Q270,95 300,100 Q330,105 360,100 Q390,95 400,100 L400,140 L0,140 Z",
              "M0,99 Q30,94 60,101 Q90,106 120,99 Q150,94 180,101 Q210,106 240,99 Q270,94 300,101 Q330,106 360,99 Q390,94 400,99 L400,140 L0,140 Z",
              "M0,100 Q30,95 60,100 Q90,105 120,100 Q150,95 180,100 Q210,105 240,100 Q270,95 300,100 Q330,105 360,100 Q390,95 400,100 L400,140 L0,140 Z"
            ]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
      </svg>

      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${b.x}%`, top: `${b.y}%`, width: b.s, height: b.s,
            backgroundColor: p.bubbleColor,
            border: `0.5px solid ${p.bubbleColor}`
          }}
          animate={reduceMotion ? undefined : {
            y: [0, -25 - (i % 4) * 5, 0],
            opacity: [0, 0.8, 0],
            scale: [0.7, 1.3, 0.7]
          }}
          transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Bioluminescent particles */}
      {BIO.map((bp, i) => (
        <motion.div
          key={`bio-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${bp.x}%`, top: `${bp.y}%`, width: bp.s, height: bp.s,
            backgroundColor: p.bioLumColor,
            boxShadow: `0 0 ${bp.s * 4}px ${p.bioLumColor}88, 0 0 ${bp.s * 8}px ${p.bioLumColor}44`
          }}
          animate={reduceMotion ? undefined : {
            opacity: [0.08, 0.65, 0.08],
            scale: [0.7, 1.4, 0.7],
            x: [-2, 2, -2]
          }}
          transition={{ duration: 2.8 + (i % 4), repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
        />
      ))}

      {/* Horizon light streak */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '41%', left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent 5%, ${p.moonGlow}18 25%, ${p.moonGlow}30 50%, ${p.moonGlow}18 75%, transparent 95%)`
        }}
        animate={reduceMotion ? undefined : { opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Mist layer at horizon */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '38%', left: '-5%', right: '-5%', height: 30,
          background: `linear-gradient(180deg, transparent, ${p.mistColor}, transparent)`,
          filter: 'blur(8px)'
        }}
        animate={reduceMotion ? undefined : { opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Depth gradient overlay for underwater feel */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0, left: 0, right: 0, height: '35%',
          background: `linear-gradient(180deg, transparent, ${p.waterDeep}cc)`,
          mixBlendMode: 'multiply'
        }}
      />

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
              backgroundColor: `${p.wavePrimary}22`,
              border: `1px solid ${p.wavePrimary}35`,
              boxShadow: `0 0 20px ${p.wavePrimary}15`
            }}
          >
            <Waves className="w-7 h-7" style={{ color: p.wavePrimary }} />
          </div>
        </motion.div>

        <motion.h3
          className="font-serif text-2xl font-bold text-center"
          style={{ color: '#e0eaff', textShadow: `0 0 30px ${p.wavePrimary}33` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {name}
        </motion.h3>

        {hasDesc && (
          <motion.p
            className="mt-2 text-sm leading-relaxed text-center max-w-md line-clamp-3"
            style={{ color: '#8eaac8' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {sea.description}
          </motion.p>
        )}

        <motion.div
          className="mt-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className="h-px w-8 rounded-full" style={{ backgroundColor: `${p.wavePrimary}44` }} />
          <Waves className="w-3 h-3" style={{ color: `${p.wavePrimary}66` }} />
          <span className="h-px w-8 rounded-full" style={{ backgroundColor: `${p.wavePrimary}44` }} />
        </motion.div>
      </div>
    </div>
  );
}
