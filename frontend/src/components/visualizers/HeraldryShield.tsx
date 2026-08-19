import type { CSSProperties } from 'react';
import {
  type HeraldryComposition,
  SHIELD_SHAPES
} from '../../lib/heraldry';
import { ChargeLayer } from './ChargeLayer';

interface HeraldryShieldProps {
  composition: HeraldryComposition;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
  selectedChargeId?: string | null;
  onAddCharge?: (x: number, y: number) => void;
  onSelectCharge?: (id: string) => void;
}

function TinctureLayer({ composition }: { composition: HeraldryComposition }) {
  const t = composition.tincture;
  const c = t.color;
  const o = t.opacity;
  if (t.type === 'band') {
    return <rect x="-30" y="58" width="160" height="7" fill={c} opacity={o} transform="rotate(-45 50 60)" />;
  }
  if (t.type === 'bandRev') {
    return <rect x="-30" y="58" width="160" height="7" fill={c} opacity={o} transform="rotate(45 50 60)" />;
  }
  if (t.type === 'fess') {
    return <rect x="0" y="48" width="100" height="10" fill={c} opacity={o} />;
  }
  if (t.type === 'pale') {
    return <rect x="46" y="0" width="10" height="120" fill={c} opacity={o} />;
  }
  if (t.type === 'chevron') {
    return <polygon points="0,64 100,64 50,16" fill={c} opacity={o} />;
  }
  if (t.type === 'chevronRev') {
    return <polygon points="0,40 100,40 50,88" fill={c} opacity={o} />;
  }
  if (t.type === 'cross') {
    return (
      <>
        <rect x="0" y="50" width="100" height="8" fill={c} opacity={o} />
        <rect x="46" y="0" width="8" height="120" fill={c} opacity={o} />
      </>
    );
  }
  if (t.type === 'saltire') {
    return (
      <>
        <rect x="-30" y="58" width="160" height="7" fill={c} opacity={o} transform="rotate(-45 50 60)" />
        <rect x="-30" y="58" width="160" height="7" fill={c} opacity={o} transform="rotate(45 50 60)" />
      </>
    );
  }
  if (t.type === 'checky') {
    const cells: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i += 2) {
      for (let j = 0; j < 10; j += 2) {
        if ((i + j) % 4 === 0) cells.push({ x: j * 12.5, y: i * 12.5 });
        else if ((i + j) % 4 === 2) cells.push({ x: j * 12.5 + 12.5, y: i * 12.5 });
      }
    }
    return (
      <>
        {cells.map((cell, idx) => (
          <rect key={idx} x={cell.x} y={cell.y} width="12.5" height="12.5" fill={c} opacity={o} />
        ))}
      </>
    );
  }
  return null;
}

export function HeraldryShield({ composition, className, style, interactive, selectedChargeId, onAddCharge, onSelectCharge }: HeraldryShieldProps) {
  const shieldPath = SHIELD_SHAPES[composition.shield] || SHIELD_SHAPES.classic;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !onAddCharge) return;
    const target = e.target as Element;
    if (target.closest('[data-charge-id]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddCharge(x, y);
  };

  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      style={style}
      onPointerDown={handlePointer}
      role={interactive ? 'button' : undefined}
      aria-label={interactive ? 'shield board' : undefined}
    >
      <defs>
        <clipPath id={`shield-clip-${composition.shield}`}>
          <path d={shieldPath} />
        </clipPath>
        <linearGradient id={`shield-field-${composition.shield}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={composition.field.color} />
          <stop offset="100%" stopColor={composition.field.color2} />
        </linearGradient>
      </defs>

      <g clipPath={`url(#shield-clip-${composition.shield})`}>
        <path d={shieldPath} fill={composition.field.type === 'twoTone' ? `url(#shield-field-${composition.shield})` : composition.field.color} />
        {composition.tincture.enabled && <TinctureLayer composition={composition} />}
        <ChargeLayer
          charges={composition.charges}
          selectedChargeId={selectedChargeId}
          interactive={interactive}
          onSelectCharge={onSelectCharge}
        />
      </g>

      {composition.border.enabled && (
        <path d={shieldPath} fill="none" stroke={composition.border.color} strokeWidth={composition.border.width} strokeLinejoin="round" />
      )}
    </svg>
  );
}