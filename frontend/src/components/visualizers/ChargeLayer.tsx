import { CHARGE_PATHS, SUN_SHAPE, type Charge } from '../../lib/heraldry';

const CHARGE_SCALE = 30 / 24;

interface ChargeLayerProps {
  charges: Charge[];
  yScale?: number;
  selectedChargeId?: string | null;
  interactive?: boolean;
  onSelectCharge?: (id: string) => void;
}

function chargeTransform(c: Charge, yScale: number): string {
  const dy = c.y * yScale;
  return `translate(${c.x} ${dy}) rotate(${c.rotation} 12 12) scale(${c.scale * CHARGE_SCALE})`;
}

function ChargeGroup({ charge, yScale, interactive, onSelectCharge, children }: {
  charge: Charge;
  yScale: number;
  interactive?: boolean;
  onSelectCharge?: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <g
      key={charge.id}
      data-charge-id={charge.id}
      transform={chargeTransform(charge, yScale)}
      onClick={(e) => {
        e.stopPropagation();
        onSelectCharge?.(charge.id);
      }}
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      {children}
    </g>
  );
}

export function ChargeLayer({ charges, yScale = 1, selectedChargeId, interactive, onSelectCharge }: ChargeLayerProps) {
  return (
    <>
      {charges.map((charge) => {
        const selected = selectedChargeId === charge.id;
        if (charge.kind === 'image') {
          return (
            <ChargeGroup key={charge.id} charge={charge} yScale={yScale} interactive={interactive} onSelectCharge={onSelectCharge}>
              <image
                href={charge.url}
                x="-12"
                y="-12"
                width="24"
                height="24"
                opacity={charge.opacity}
                preserveAspectRatio="xMidYMid meet"
              />
              {selected && <rect x="-12" y="-12" width="24" height="24" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="2 1.5" />}
            </ChargeGroup>
          );
        }
        if (charge.shape === SUN_SHAPE) {
          return (
            <ChargeGroup key={charge.id} charge={charge} yScale={yScale} interactive={interactive} onSelectCharge={onSelectCharge}>
              <circle r="4.2" fill={charge.color} opacity={charge.opacity} />
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x1 = Math.cos(angle) * 5.4;
                const y1 = Math.sin(angle) * 5.4;
                const x2 = Math.cos(angle) * 8.5;
                const y2 = Math.sin(angle) * 8.5;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={charge.color} strokeWidth="1.6" opacity={charge.opacity} />
                );
              })}
              {selected && <circle r="9" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="2 1.5" />}
            </ChargeGroup>
          );
        }
        const shape = CHARGE_PATHS[charge.shape];
        if (!shape) return null;
        return (
          <ChargeGroup key={charge.id} charge={charge} yScale={yScale} interactive={interactive} onSelectCharge={onSelectCharge}>
            <path d={shape.path} fill={charge.color} opacity={charge.opacity} />
            {selected && <rect x="0.5" y="0.5" width="23" height="23" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2 1.5" rx="2" />}
          </ChargeGroup>
        );
      })}
    </>
  );
}