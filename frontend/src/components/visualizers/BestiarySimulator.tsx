import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Play, Pause, RotateCcw, Swords
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreatureVisualizer } from './CreatureVisualizer';
import { dangerMap, type CreatureLike } from '../../lib/creatureVisuals';
import { useI18n } from '../../i18n';
import { prefersReducedMotion } from '../../lib/motion';

export interface SimCreature extends CreatureLike {
  id: string;
}

interface BestiarySimulatorProps {
  creatures: SimCreature[];
}

export function BestiarySimulator({ creatures }: BestiarySimulatorProps) {
  const { t } = useI18n();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const reduceMotion = prefersReducedMotion();

  const creature = creatures[selectedIndex] || null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [creatures.length]);

  const cycle = useCallback(() => {
    if (creatures.length === 0) return;
    setSelectedIndex((i) => (i + 1) % creatures.length);
  }, [creatures.length]);

  useEffect(() => {
    if (!isPlaying || reduceMotion) return;
    const id = setInterval(cycle, 2600);
    return () => clearInterval(id);
  }, [isPlaying, cycle, reduceMotion]);

  if (creatures.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Swords className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('simulators.bestiary.empty')}
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>{t('simulators.bestiary.emptyDesc')}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Selector */}
      <Card>
        <CardContent className="p-3 space-y-1.5 max-h-[560px] overflow-y-auto">
          {creatures.map((c, i) => {
            const d = dangerMap[c.dangerLevel || 'MEDIA'] || dangerMap.MEDIA;
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedIndex(i); setIsPlaying(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  i === selectedIndex ? 'bg-midnight-700 ring-1 ring-burnt-500' : 'hover:bg-midnight-700/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${d.bar}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-parchment-100 truncate">{c.name}</p>
                  <p className="text-xs text-parchment-400 truncate">{c.species}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-parchment-500 shrink-0" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Encounter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsPlaying((p) => !p)}>
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? t('simulators.pause') : t('simulators.play')}
            </Button>
            <Button size="sm" variant="ghost" onClick={cycle}>
              <RotateCcw className="w-4 h-4 mr-1" /> {t('simulators.next')}
            </Button>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {selectedIndex + 1} / {creatures.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={creature?.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="pt-4">
                <CreatureVisualizer
                  creature={creature}
                  size="lg"
                  showDangerMeter
                  showMeta
                />
              </CardContent>
            </Card>

            {creature?.description && (
              <Card>
                <CardContent>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {creature.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}