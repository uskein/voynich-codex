import type { CSSProperties } from 'react';
import {
  type MagicVisualComposition,
  MAGIC_SYMBOLS
} from '../../lib/magicVisual';

interface MagicVisualProps {
  composition: MagicVisualComposition;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
  selectedSymbolId?: string | null;
  onAddSymbol?: (x: number, y: number) => void;
  onSelectSymbol?: (id: string) => void;
}

const SYMBOL_SCALE = 26 / 24;

function symbolTransform(s: { x: number; y: number; scale: number; rotation: number }): string {
  return `translate(${s.x} ${s.y}) rotate(${s.rotation} 12 12) scale(${s.scale * SYMBOL_SCALE})`;
}

export function MagicVisual({ composition, className, style, interactive, selectedSymbolId, onAddSymbol, onSelectSymbol }: MagicVisualProps) {
  const accent = composition.accent;
  const primary = composition.primary;
  const glow = composition.style === 'glow';

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !onAddSymbol) return;
    const target = e.target as Element;
    if (target.closest('[data-symbol-id]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddSymbol(x, y);
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      onPointerDown={handlePointer}
      role={interactive ? 'button' : undefined}
      aria-label={interactive ? 'magic visual board' : undefined}
    >
      <defs>
        <radialGradient id="magic-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.28" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.04" />
        </radialGradient>
        <filter id="magic-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {composition.background && <circle cx="50" cy="50" r="47" fill="url(#magic-bg)" />}

      {composition.circle === 'ring' && (
        <circle cx="50" cy="50" r="42" fill="none" stroke={accent} strokeWidth={composition.ringWidth} opacity={glow ? 0.85 : 1} filter={glow ? 'url(#magic-glow)' : undefined} />
      )}
      {composition.circle === 'double' && (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke={accent} strokeWidth={Math.max(1, composition.ringWidth / 2)} opacity={glow ? 0.85 : 1} />
          <circle cx="50" cy="50" r="32" fill="none" stroke={primary} strokeWidth={Math.max(1, composition.ringWidth / 2)} opacity={glow ? 0.85 : 1} />
        </>
      )}

      {composition.symbols.map((s) => {
        const shape = MAGIC_SYMBOLS[s.symbol];
        if (!shape) return null;
        const selected = selectedSymbolId === s.id;
        return (
          <g
            key={s.id}
            data-symbol-id={s.id}
            transform={symbolTransform(s)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSymbol?.(s.id);
            }}
            style={{ cursor: interactive ? 'pointer' : undefined }}
            filter={glow ? 'url(#magic-glow)' : undefined}
          >
            <path d={shape.path} fill={s.color} opacity={s.opacity} />
            {selected && <rect x="0.5" y="0.5" width="23" height="23" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2 1.5" rx="2" />}
          </g>
        );
      })}
    </svg>
  );
}