import { Play, Pause, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface EraOption {
  value: string;
  label: string;
}

interface VisualizerToolbarProps {
  title?: string;
  eras?: EraOption[];
  activeEra?: string;
  onEraChange?: (era: string) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  children?: React.ReactNode;
}

export function VisualizerToolbar({
  title,
  eras = [],
  activeEra,
  onEraChange,
  isPlaying,
  onPlayToggle,
  onZoomIn,
  onZoomOut,
  onFitView,
  children
}: VisualizerToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      {title && (
        <span className="font-serif font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
      )}

      {onPlayToggle && (
        <Button size="sm" variant="secondary" onClick={onPlayToggle}>
          {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      )}

      {eras.length > 0 && onEraChange && (
        <div className="flex gap-1.5">
          {eras.map((era) => (
            <Button
              key={era.value}
              size="sm"
              variant={activeEra === era.value ? 'primary' : 'ghost'}
              onClick={() => onEraChange(era.value)}
            >
              {era.label}
            </Button>
          ))}
        </div>
      )}

      {(onZoomIn || onZoomOut || onFitView) && (
        <div className="flex gap-1.5 ml-auto">
          {onZoomOut && (
            <Button size="sm" variant="ghost" onClick={onZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
          )}
          {onZoomIn && (
            <Button size="sm" variant="ghost" onClick={onZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          )}
          {onFitView && (
            <Button size="sm" variant="ghost" onClick={onFitView}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {children}
    </motion.div>
  );
}
