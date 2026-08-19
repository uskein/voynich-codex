import type { CSSProperties } from 'react';
import type { HeraldryComposition } from '../../lib/heraldry';
import { ChargeLayer } from './ChargeLayer';

interface FlagRendererProps {
  composition: HeraldryComposition;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
  selectedChargeId?: string | null;
  onAddCharge?: (x: number, y: number) => void;
  onSelectCharge?: (id: string) => void;
}

function FieldLayer({ composition }: { composition: HeraldryComposition }) {
  const { type, color, color2 } = composition.field;
  if (type === 'solid') return <rect x="0" y="0" width="100" height="66.67" fill={color} />;
  if (type === 'twoTone') {
    return (
      <rect x="0" y="0" width="100" height="66.67" fill={`url(#flag-field-${composition.kind}${composition.shield})`} />
    );
  }
  if (type === 'vStripes') {
    return (
      <>
        <rect x="0" y="0" width="50" height="66.67" fill={color} />
        <rect x="50" y="0" width="50" height="66.67" fill={color2} />
      </>
    );
  }
  if (type === 'hStripes') {
    return (
      <>
        <rect x="0" y="0" width="100" height="33.33" fill={color} />
        <rect x="0" y="33.33" width="100" height="33.34" fill={color2} />
      </>
    );
  }
  if (type === 'diagonal') {
    return (
      <>
        <rect x="0" y="0" width="100" height="66.67" fill={color2} />
        <rect x="-20" y="0" width="140" height="66.67" fill={color} transform="skewX(-21.8)" />
      </>
    );
  }
  return null;
}

export function FlagRenderer({ composition, className, style, interactive, selectedChargeId, onAddCharge, onSelectCharge }: FlagRendererProps) {
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
      viewBox="0 0 100 66.67"
      className={className}
      style={style}
      onPointerDown={handlePointer}
      role={interactive ? 'button' : undefined}
      aria-label={interactive ? 'flag board' : undefined}
    >
      <defs>
        <clipPath id={`flag-clip-${composition.shield}`}>
          <rect x="0" y="0" width="100" height="66.67" rx="1.5" />
        </clipPath>
        <linearGradient id={`flag-field-${composition.kind}${composition.shield}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={composition.field.color} />
          <stop offset="100%" stopColor={composition.field.color2} />
        </linearGradient>
      </defs>

      <g clipPath={`url(#flag-clip-${composition.shield})`}>
        <rect x="0" y="0" width="100" height="66.67" fill={composition.field.type === 'twoTone' ? `url(#flag-field-${composition.kind}${composition.shield})` : composition.field.color} />
        <FieldLayer composition={composition} />
        <ChargeLayer
          charges={composition.charges}
          yScale={66.67 / 100}
          selectedChargeId={selectedChargeId}
          interactive={interactive}
          onSelectCharge={onSelectCharge}
        />
      </g>

      {composition.border.enabled && (
        <rect
          x={composition.border.width / 2}
          y={composition.border.width / 2}
          width={100 - composition.border.width}
          height={66.67 - composition.border.width}
          fill="none"
          stroke={composition.border.color}
          strokeWidth={composition.border.width}
          rx="1.5"
        />
      )}
    </svg>
  );
}