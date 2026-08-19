interface LegendItem {
  label: string;
  colorClass?: string;
  dotClass?: string;
  dotStyle?: React.CSSProperties;
}

interface LegendProps {
  items: LegendItem[];
  title?: string;
}

export function Legend({ items, title }: LegendProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 rounded-lg text-xs"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      {title && (
        <span className="font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </span>
      )}
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${item.dotClass || item.colorClass || ''}`}
            style={item.dotStyle}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
