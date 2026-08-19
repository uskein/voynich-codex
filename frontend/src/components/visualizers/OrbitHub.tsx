import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { prefersReducedMotion } from '../../lib/motion';

export interface OrbitModule {
  id: string;
  name: string;
  icon: any;
  color: string;
  count: number;
  href: string;
}

interface OrbitHubProps {
  modules: OrbitModule[];
  centerLabel?: string;
}

export function OrbitHub({ modules, centerLabel }: OrbitHubProps) {
  const reduceMotion = prefersReducedMotion();

  return (
    <div className="relative aspect-square w-full max-w-[560px] mx-auto select-none">
      {/* Rotating rings */}
      {!reduceMotion && (
        <>
          <motion.div
            className="absolute inset-[8%] rounded-full border-2 border-dashed border-burnt-500/25"
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-[20%] rounded-full border border-dashed border-parchment-400/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      {/* Central orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center bg-gradient-to-br from-burnt-600 via-burnt-500 to-midnight-700"
          animate={reduceMotion ? undefined : { boxShadow: ['0 0 24px rgba(217,114,22,0.35)', '0 0 60px rgba(217,114,22,0.6)', '0 0 24px rgba(217,114,22,0.35)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-center"
          >
            <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-white/90" />
            {centerLabel && (
              <p className="mt-1 px-2 text-[10px] font-medium text-white/85 uppercase tracking-widest truncate max-w-[110px]">
                {centerLabel}
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Orbiting modules */}
      {modules.map((module, i) => {
        const angle = (i / modules.length) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + 46 * Math.cos(angle);
        const top = 50 + 46 * Math.sin(angle);
        const Icon = module.icon;
        return (
          <motion.a
            key={module.id}
            href={module.href}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 200, damping: 18 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border border-midnight-600 bg-midnight-800/95 shadow-lg group-hover:border-burnt-500 transition-colors"
              animate={!reduceMotion ? { y: [0, -4, 0] } : undefined}
              transition={{ duration: 2.6 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${module.color}`} />
            </motion.div>
            <div className="text-center leading-tight">
              <p className="text-[11px] font-medium text-parchment-100 max-w-[90px] truncate">{module.name}</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                <AnimatedNumber value={module.count} />
              </p>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}