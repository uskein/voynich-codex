import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import {
  getCreatureVisuals,
  particles,
  type CreatureLike
} from '../../lib/creatureVisuals';
import { prefersReducedMotion } from '../../lib/motion';

export interface CreatureVisualizerProps {
  creature: CreatureLike;
  size?: 'sm' | 'md' | 'lg';
  showDangerMeter?: boolean;
  showMeta?: boolean;
  animate?: boolean;
}

const sizeMap = {
  sm: { scene: 'h-44 sm:h-52', visual: 'w-24 h-24 sm:w-28 sm:h-28', icon: 'w-20 h-20 sm:w-24 sm:h-24', title: 'text-lg' },
  md: { scene: 'h-64 sm:h-72', visual: 'w-40 h-40 sm:w-52 sm:h-52', icon: 'w-32 h-32 sm:w-40 sm:h-40', title: 'text-2xl' },
  lg: { scene: 'h-72 sm:h-80', visual: 'w-48 h-48 sm:w-60 sm:h-60', icon: 'w-36 h-36 sm:w-44 sm:h-44', title: 'text-3xl' }
};

export function CreatureVisualizer({
  creature,
  size = 'md',
  showDangerMeter = true,
  showMeta = true,
  animate = true
}: CreatureVisualizerProps) {
  const reduceMotion = prefersReducedMotion();
  const play = animate && !reduceMotion;
  const { danger, species, SpeciesIcon, heroImage, gradient } = getCreatureVisuals(creature);
  const s = sizeMap[size];

  return (
    <div className="space-y-3">
      <div className={`relative ${s.scene} rounded-xl overflow-hidden bg-gradient-to-br ${gradient}`}>
        {/* Aura glow */}
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 55%, ${danger.glow} 0%, transparent 65%)` }}
          animate={play ? { opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] } : undefined}
          transition={{ duration: danger.level >= 3 ? 1.6 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Particles */}
        {play && particles.map((p, idx) => (
          <motion.span
            key={idx}
            className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-parchment-300/30"
            style={{ left: p.left }}
            animate={{ y: [-80, -220], opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeIn' }}
          />
        ))}

        {/* Creature visual */}
        <div className="absolute inset-0 flex items-center justify-center">
          {heroImage ? (
            <motion.img
              src={heroImage}
              alt={creature.name}
              className={`${s.visual} object-cover rounded-full border-2 border-midnight-600`}
              style={{ boxShadow: danger.shadow }}
              animate={play ? { y: [0, -8, 0] } : undefined}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : (
            <motion.div
              className="text-parchment-200"
              animate={play ? { y: [0, -10, 0], rotate: [0, 2, 0] } : undefined}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: `drop-shadow(${danger.shadow})` }}
            >
              <SpeciesIcon className={s.icon} strokeWidth={1.1} />
            </motion.div>
          )}
        </div>

        {/* Name plate */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 className={`font-serif font-bold text-parchment-100 drop-shadow ${s.title}`}>
              {creature.name || '···'}
            </h3>
            {species && (
              <p className={`flex items-center gap-1.5 text-sm ${species.color}`}>
                <SpeciesIcon className="w-4 h-4" /> {species.label}
              </p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-midnight-900/70 ${danger.text}`}>
            {danger.label}
          </span>
        </div>
      </div>

      {/* Danger meter */}
      {showDangerMeter && (
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((seg) => (
            <div key={seg} className="h-2 flex-1 rounded-full bg-midnight-700 overflow-hidden">
              {seg <= danger.level && (
                <motion.div
                  className={`h-full ${danger.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.5, delay: seg * 0.06 }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meta */}
      {showMeta && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {creature.habitat && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-midnight-300" /> {creature.habitat}
            </span>
          )}
          {creature.region && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-midnight-300" /> {creature.region.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}