import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Map, Eye, Layers, MapPin, Mountain } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion';
import { useI18n } from '../../i18n';

export interface MapLayerData {
  id: string;
  type: 'terrain' | 'water' | 'forest' | 'mountain' | 'desert' | 'tundra' | 'swamp' | 'plains' | 'jungle';
  path: string;
  color: string;
  opacity?: number;
}

export interface MapPOI {
  id: string;
  type: 'city' | 'castle' | 'ruin' | 'camp' | 'shrine' | 'tower' | 'cave' | 'village' | 'port' | 'landmark';
  x: number;
  y: number;
  name: string;
  description?: string;
}

export interface MapRelief {
  id: string;
  type: 'mountain' | 'hill' | 'forest' | 'river' | 'lake' | 'volcano' | 'canyon' | 'plateau';
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
}

export interface MapData {
  name?: string;
  description?: string;
  layers?: MapLayerData[];
  pointsOfInterest?: MapPOI[];
  reliefs?: MapRelief[];
  imageUrl?: string;
}

interface MapSimulatorProps {
  map: MapData;
  height?: number;
}

interface MapTonePalette {
  background: string;
  gridLine: string;
  gridDot: string;
  border: string;
  parchment: string;
  parchmentDark: string;
  compass: string;
  compassNeedle: string;
  titleColor: string;
  subtitleColor: string;
  fogColor: string;
  vignetteColor: string;
  imageFilter: string;
}

const TONE_PALETTES: Record<string, MapTonePalette> = {
  classic: {
    background: '#1a1610', gridLine: 'rgba(180,160,120,0.08)', gridDot: 'rgba(180,160,120,0.15)',
    border: '#3a3020', parchment: '#d4c8a8', parchmentDark: '#b8a888',
    compass: '#c4b898', compassNeedle: '#8b0000',
    titleColor: '#e8dcc0', subtitleColor: '#b8a888',
    fogColor: 'rgba(26,22,16,0.4)', vignetteColor: 'rgba(26,22,16,0.6)',
    imageFilter: 'sepia(0.3) contrast(1.1) brightness(0.95) saturate(0.85)'
  },
  dark: {
    background: '#0a0e14', gridLine: 'rgba(100,140,180,0.06)', gridDot: 'rgba(100,140,180,0.12)',
    border: '#1a2430', parchment: '#8899aa', parchmentDark: '#667788',
    compass: '#7799bb', compassNeedle: '#cc3333',
    titleColor: '#aabbcc', subtitleColor: '#667788',
    fogColor: 'rgba(10,14,20,0.5)', vignetteColor: 'rgba(10,14,20,0.7)',
    imageFilter: 'brightness(0.7) contrast(1.2) saturate(0.7) hue-rotate(-10deg)'
  },
  fantasy: {
    background: '#0e0818', gridLine: 'rgba(160,120,200,0.06)', gridDot: 'rgba(160,120,200,0.12)',
    border: '#2a1840', parchment: '#c8b0e0', parchmentDark: '#a890c0',
    compass: '#b898d8', compassNeedle: '#e040a0',
    titleColor: '#d8c0f0', subtitleColor: '#a890c0',
    fogColor: 'rgba(14,8,24,0.4)', vignetteColor: 'rgba(14,8,24,0.6)',
    imageFilter: 'hue-rotate(30deg) saturate(1.3) brightness(0.9) contrast(1.1)'
  },
  parchment: {
    background: '#f0e8d0', gridLine: 'rgba(120,100,60,0.1)', gridDot: 'rgba(120,100,60,0.18)',
    border: '#c8b890', parchment: '#e8dcc0', parchmentDark: '#d0c0a0',
    compass: '#8b7355', compassNeedle: '#8b0000',
    titleColor: '#4a3a20', subtitleColor: '#7a6a4a',
    fogColor: 'rgba(240,232,208,0.3)', vignetteColor: 'rgba(240,232,208,0.5)',
    imageFilter: 'sepia(0.6) contrast(0.9) brightness(1.05) saturate(0.7)'
  },
  war: {
    background: '#120808', gridLine: 'rgba(180,60,40,0.06)', gridDot: 'rgba(180,60,40,0.12)',
    border: '#2a1010', parchment: '#c4a090', parchmentDark: '#a08070',
    compass: '#b08060', compassNeedle: '#dc2626',
    titleColor: '#e0c0b0', subtitleColor: '#a08070',
    fogColor: 'rgba(18,8,8,0.5)', vignetteColor: 'rgba(18,8,8,0.7)',
    imageFilter: 'sepia(0.4) saturate(1.4) contrast(1.2) brightness(0.85) hue-rotate(-5deg)'
  },
  ice: {
    background: '#080e18', gridLine: 'rgba(140,200,240,0.06)', gridDot: 'rgba(140,200,240,0.12)',
    border: '#142438', parchment: '#a0c8e8', parchmentDark: '#80a8c8',
    compass: '#78b8e0', compassNeedle: '#e04040',
    titleColor: '#c0e0f8', subtitleColor: '#80a8c8',
    fogColor: 'rgba(8,14,24,0.4)', vignetteColor: 'rgba(8,14,24,0.6)',
    imageFilter: 'brightness(1.1) saturate(0.6) hue-rotate(190deg) contrast(1.05)'
  }
};

const POI_ICONS: Record<string, { emoji: string; color: string }> = {
  city: { emoji: '🏰', color: '#f59e0b' },
  castle: { emoji: '🏯', color: '#ef4444' },
  ruin: { emoji: '🏛️', color: '#a78bfa' },
  camp: { emoji: '⛺', color: '#22c55e' },
  shrine: { emoji: '⛩️', color: '#ec4899' },
  tower: { emoji: '🗼', color: '#3b82f6' },
  cave: { emoji: '🕳️', color: '#6b7280' },
  village: { emoji: '🏘️', color: '#10b981' },
  port: { emoji: '⚓', color: '#06b6d4' },
  landmark: { emoji: '📍', color: '#f97316' }
};

const RELIEF_VISUALS: Record<string, { symbol: string; color: string; size: number }> = {
  mountain: { symbol: '⛰️', color: '#7c8a6a', size: 24 },
  hill: { symbol: '🌄', color: '#8a9a6a', size: 18 },
  forest: { symbol: '🌲', color: '#2d5a3a', size: 20 },
  river: { symbol: '〰️', color: '#3b82f6', size: 22 },
  lake: { symbol: '💧', color: '#2563eb', size: 20 },
  volcano: { symbol: '🌋', color: '#dc2626', size: 26 },
  canyon: { symbol: '🏞️', color: '#92400e', size: 22 },
  plateau: { symbol: '🏔️', color: '#a3a37a', size: 22 }
};

export const MAP_TONE_KEYS = Object.keys(TONE_PALETTES);
export const MAP_TONE_LABELS: Record<string, string> = {
  classic: 'Clasico', dark: 'Oscuro', fantasy: 'Fantasia',
  parchment: 'Pergamino', war: 'Guerra', ice: 'Hielo'
};

type ViewMode = 'image' | 'pois' | 'layers' | 'reliefs' | 'all';

const GRID_LINES = 12;

export function MapSimulator({ map, height = 280 }: MapSimulatorProps) {
  const { t } = useI18n();
  const reduceMotion = prefersReducedMotion();
  const tone = (map as any).tone || 'classic';
  const p = TONE_PALETTES[tone] || TONE_PALETTES.classic;
  const name = map.name?.trim() || t('simulators.map.unnamed');
  const hasDesc = !!map.description?.trim();
  const layers = map.layers || [];
  const pois = map.pointsOfInterest || [];
  const reliefs = map.reliefs || [];
  const hasImage = !!map.imageUrl?.trim();
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const gridDots = useMemo(() => {
    const dots: { x: number; y: number; delay: number }[] = [];
    for (let i = 0; i < GRID_LINES; i++) {
      for (let j = 0; j < GRID_LINES; j++) {
        dots.push({
          x: (i + 0.5) * (100 / GRID_LINES),
          y: (j + 0.5) * (100 / GRID_LINES),
          delay: Math.random() * 4
        });
      }
    }
    return dots;
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        borderColor: hasImage ? 'var(--border-color)' : p.border,
        backgroundColor: p.background,
        minHeight: height
      }}
    >
      {/* Background image */}
      {hasImage && (
        <img
          src={map.imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectFit: 'cover', filter: p.imageFilter }}
        />
      )}

      {/* Parchment texture overlay (only when no image) */}
      {!hasImage && (
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, ${p.parchment}22 0%, transparent 50%),
                              radial-gradient(circle at 70% 60%, ${p.parchment}18 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, ${p.parchment}14 0%, transparent 50%)`
          }}
        />
      )}

      {/* Grid dots */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {gridDots.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={0.15}
            fill={p.gridDot}
            animate={reduceMotion ? undefined : { opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: GRID_LINES + 1 }).map((_, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={i * (100 / GRID_LINES)} y1={0}
              x2={i * (100 / GRID_LINES)} y2={100}
              stroke={p.gridLine}
              strokeWidth={0.15}
            />
            <line
              x1={0} y1={i * (100 / GRID_LINES)}
              x2={100} y2={i * (100 / GRID_LINES)}
              stroke={p.gridLine}
              strokeWidth={0.15}
            />
          </g>
        ))}
      </svg>

      {/* Terrain layers */}
      {(viewMode === 'layers' || viewMode === 'all') && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {layers.map((layer, i) => (
            <motion.path
              key={layer.id}
              d={layer.path}
              fill={layer.color}
              fillOpacity={layer.opacity || 0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
          ))}
        </svg>
      )}

      {/* Relief features */}
      {(viewMode === 'reliefs' || viewMode === 'all') && reliefs.map((relief, i) => {
        const visual = RELIEF_VISUALS[relief.type] || RELIEF_VISUALS.mountain;
        const scale = relief.scale || 1;
        return (
          <motion.div
            key={`relief-${relief.id}`}
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: `${relief.x}%`,
              top: `${relief.y}%`,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${relief.rotation || 0}deg)`,
              fontSize: visual.size,
              filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.85, scale }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
          >
            {visual.symbol}
          </motion.div>
        );
      })}

      {/* Points of Interest */}
      {(viewMode === 'pois' || viewMode === 'all') && pois.map((poi, i) => {
        const icon = POI_ICONS[poi.type] || POI_ICONS.landmark;
        return (
          <motion.div
            key={`poi-${poi.id}`}
            className="absolute flex flex-col items-center"
            style={{
              left: `${poi.x}%`,
              top: `${poi.y}%`,
              transform: 'translate(-50%, -100%)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
          >
            {/* Pin marker */}
            <div className="relative">
              <motion.div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: `${icon.color}20`,
                  border: `2px solid ${icon.color}88`,
                  boxShadow: `0 0 12px ${icon.color}33, 0 2px 8px rgba(0,0,0,0.3)`,
                  fontSize: 14
                }}
                animate={reduceMotion ? undefined : {
                  y: [0, -2, 0],
                  boxShadow: [
                    `0 0 12px ${icon.color}33, 0 2px 8px rgba(0,0,0,0.3)`,
                    `0 0 20px ${icon.color}55, 0 2px 12px rgba(0,0,0,0.4)`,
                    `0 0 12px ${icon.color}33, 0 2px 8px rgba(0,0,0,0.3)`
                  ]
                }}
                transition={{ duration: 2 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
              >
                {icon.emoji}
              </motion.div>
              {/* Pin tail */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: -6,
                  width: 2,
                  height: 8,
                  backgroundColor: `${icon.color}88`,
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)'
                }}
              />
            </div>
            {/* Label */}
            <div
              className="mt-1 px-1.5 py-0.5 rounded text-center whitespace-nowrap"
              style={{
                backgroundColor: `${p.background}cc`,
                border: `1px solid ${icon.color}44`,
                maxWidth: 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <span className="text-[9px] font-medium" style={{ color: icon.color }}>
                {poi.name}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* View mode tabs */}
      <div className="absolute top-3 right-3 flex gap-1 z-10">
        {([
          { mode: 'all' as ViewMode, icon: Eye, label: 'Todo' },
          { mode: 'image' as ViewMode, icon: Map, label: 'Mapa' },
          { mode: 'layers' as ViewMode, icon: Layers, label: 'Capas' },
          { mode: 'pois' as ViewMode, icon: MapPin, label: 'Puntos' },
          { mode: 'reliefs' as ViewMode, icon: Mountain, label: 'Relieves' }
        ]).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
              viewMode === mode
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : 'bg-black/30 text-white/60 hover:bg-black/40 hover:text-white/80 backdrop-blur-sm'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Compass rose */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ bottom: 12, right: 12 }}
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke={p.compass} strokeWidth="0.8" opacity="0.4" />
          <circle cx="18" cy="18" r="12" fill="none" stroke={p.compass} strokeWidth="0.5" opacity="0.3" />
          {/* N/S needle */}
          <polygon points="18,4 16,18 20,18" fill={p.compassNeedle} opacity="0.8" />
          <polygon points="18,32 16,18 20,18" fill={p.compass} opacity="0.4" />
          {/* E/W needle */}
          <polygon points="4,18 18,16 18,20" fill={p.compass} opacity="0.4" />
          <polygon points="32,18 18,16 18,20" fill={p.compass} opacity="0.4" />
          {/* Center dot */}
          <circle cx="18" cy="18" r="1.5" fill={p.compass} opacity="0.6" />
          {/* Cardinal letters */}
          <text x="18" y="3" textAnchor="middle" fontSize="3" fill={p.compassNeedle} fontWeight="bold" opacity="0.7">N</text>
          <text x="18" y="35.5" textAnchor="middle" fontSize="3" fill={p.compass} opacity="0.5">S</text>
          <text x="1.5" y="19" textAnchor="middle" fontSize="3" fill={p.compass} opacity="0.5">W</text>
          <text x="34.5" y="19" textAnchor="middle" fontSize="3" fill={p.compass} opacity="0.5">E</text>
        </svg>
      </motion.div>

      {/* Scale bar */}
      <motion.div
        className="absolute pointer-events-none flex items-center gap-1"
        style={{ bottom: 14, left: 12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div style={{ width: 40, height: 2, backgroundColor: p.compass, opacity: 0.5 }} />
        <span style={{ fontSize: 8, color: p.compass, opacity: 0.5 }}>??</span>
      </motion.div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, ${p.vignetteColor} 100%)`
        }}
      />

      {/* Map border frame */}
      <div
        className="absolute inset-2 pointer-events-none rounded-lg"
        style={{
          border: `1px solid ${p.border}`,
          boxShadow: `inset 0 0 20px ${p.fogColor}`
        }}
      />

      {/* Title overlay */}
      <div className="absolute top-3 left-0 right-0 flex flex-col items-center pointer-events-none">
        <motion.h3
          className="font-serif text-lg font-bold tracking-wider"
          style={{
            color: p.titleColor,
            textShadow: `0 1px 4px ${p.background}`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {name}
        </motion.h3>
        {hasDesc && (
          <motion.p
            className="mt-0.5 text-[10px] max-w-xs text-center line-clamp-1"
            style={{ color: p.subtitleColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {map.description}
          </motion.p>
        )}
      </div>

      {/* Corner decorations */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
        <div
          key={corner}
          className="absolute pointer-events-none"
          style={{
            [corner.includes('top') ? 'top' : 'bottom']: 6,
            [corner.includes('left') ? 'left' : 'right']: 6,
            width: 16,
            height: 16,
            borderTop: corner.includes('top') ? `1px solid ${p.compass}44` : 'none',
            borderBottom: corner.includes('bottom') ? `1px solid ${p.compass}44` : 'none',
            borderLeft: corner.includes('left') ? `1px solid ${p.compass}44` : 'none',
            borderRight: corner.includes('right') ? `1px solid ${p.compass}44` : 'none'
          }}
        />
      ))}

      {/* Legend */}
      {(viewMode !== 'image' && (pois.length > 0 || reliefs.length > 0 || layers.length > 0)) && (
        <div
          className="absolute bottom-3 left-3 flex flex-col gap-1 z-10 max-w-[180px]"
          style={{ pointerEvents: 'none' }}
        >
          {/* POI Legend */}
          {(viewMode === 'pois' || viewMode === 'all') && pois.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {pois.slice(0, 6).map(poi => {
                const icon = POI_ICONS[poi.type] || POI_ICONS.landmark;
                return (
                  <div key={poi.id} className="flex items-center gap-1">
                    <span className="text-[10px]">{icon.emoji}</span>
                    <span className="text-[8px] font-medium" style={{ color: p.subtitleColor }}>{poi.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Relief Legend */}
          {(viewMode === 'reliefs' || viewMode === 'all') && reliefs.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {reliefs.slice(0, 6).map(relief => {
                const visual = RELIEF_VISUALS[relief.type] || RELIEF_VISUALS.mountain;
                return (
                  <div key={relief.id} className="flex items-center gap-1">
                    <span className="text-[10px]">{visual.symbol}</span>
                    <span className="text-[8px] font-medium" style={{ color: p.subtitleColor }}>
                      {t(`mapLegend.${relief.type}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Layer Legend */}
          {(viewMode === 'layers' || viewMode === 'all') && layers.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {layers.slice(0, 6).map(layer => (
                <div key={layer.id} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: layer.color }} />
                  <span className="text-[8px] font-medium" style={{ color: p.subtitleColor }}>
                    {t(`mapLegend.${layer.type}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
