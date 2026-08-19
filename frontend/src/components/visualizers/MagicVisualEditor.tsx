import { useState } from 'react';
import { Trash2, Wand2 } from 'lucide-react';
import { MagicVisual } from './MagicVisual';
import { useI18n } from '../../i18n';
import {
  type MagicVisualComposition,
  type MagicSymbol,
  MAGIC_SYMBOL_IDS,
  MAGIC_SYMBOL_LABELS,
  MAGIC_SYMBOLS,
  newMagicSymbolId
} from '../../lib/magicVisual';

interface MagicVisualEditorProps {
  value: MagicVisualComposition;
  onChange: (next: MagicVisualComposition) => void;
}

export function MagicVisualEditor({ value, onChange }: MagicVisualEditorProps) {
  const { t } = useI18n();
  const [tool, setTool] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const update = (patch: Partial<MagicVisualComposition>) => onChange({ ...value, ...patch });
  const selected = value.symbols.find((s) => s.id === selectedId) || null;

  const updateSelected = (patch: Partial<MagicSymbol>) => {
    onChange({
      ...value,
      symbols: value.symbols.map((s) => (s.id === selectedId ? { ...s, ...patch } as MagicSymbol : s))
    });
  };

  const handleAddSymbol = (x: number, y: number) => {
    if (!tool) {
      setSelectedId(null);
      return;
    }
    const symbol: MagicSymbol = {
      id: newMagicSymbolId(),
      symbol: tool,
      x,
      y,
      scale: 1,
      rotation: 0,
      opacity: 1,
      color: value.accent
    };
    update({ symbols: [...value.symbols, symbol] });
    setSelectedId(symbol.id);
    setTool(null);
  };

  const removeSymbol = (id: string) => {
    update({ symbols: value.symbols.filter((s) => s.id !== id) });
    setSelectedId(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
        <Wand2 className="w-4 h-4 text-pink-400" /> {t('simulators.magicVisual.title')}
      </p>
      <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
        {t('simulators.magicVisual.hint')}
      </p>

      <div className="rounded-xl border p-3 flex flex-col items-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        <MagicVisual
          composition={value}
          interactive
          selectedSymbolId={selectedId}
          onAddSymbol={handleAddSymbol}
          onSelectSymbol={setSelectedId}
          className="w-full max-w-[260px] h-auto cursor-crosshair"
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-pink-400">{t('simulators.magicVisual.symbols')}</p>
        <div className="flex flex-wrap gap-1.5">
          {MAGIC_SYMBOL_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              title={MAGIC_SYMBOL_LABELS[id] || id}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${tool === id ? 'border-pink-500 bg-pink-500/15 text-pink-300' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300 hover:border-midnight-500'}`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d={MAGIC_SYMBOLS[id].path} fill="currentColor" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magicVisual.circle')}</label>
          <div className="flex gap-1.5">
            {(['none', 'ring', 'double'] as const).map((c) => (
              <button key={c} type="button" onClick={() => update({ circle: c })}
                className={`px-2 py-1 rounded-lg text-[10px] border ${value.circle === c ? 'border-pink-500 bg-pink-500/10 text-parchment-100' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300'}`}>
                {t(`simulators.magicVisual.circle_${c}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magicVisual.style')}</label>
          <div className="flex gap-1.5">
            {(['glow', 'solid'] as const).map((s) => (
              <button key={s} type="button" onClick={() => update({ style: s })}
                className={`px-2 py-1 rounded-lg text-[10px] border ${value.style === s ? 'border-pink-500 bg-pink-500/10 text-parchment-100' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300'}`}>
                {t(`simulators.magicVisual.style_${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magicVisual.primary')}</span>
          <input type="color" value={value.primary} onChange={(e) => update({ primary: e.target.value })} className="w-9 h-7 rounded cursor-pointer bg-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magicVisual.accent')}</span>
          <input type="color" value={value.accent} onChange={(e) => update({ accent: e.target.value })} className="w-9 h-7 rounded cursor-pointer bg-transparent" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="w-16 shrink-0">{t('simulators.magicVisual.ringWidth')}</span>
        <input type="range" min={1} max={10} step={1} value={value.ringWidth} onChange={(e) => update({ ringWidth: Number(e.target.value) })} className="w-full accent-pink-500" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={value.background} onChange={(e) => update({ background: e.target.checked })} className="accent-pink-500 w-4 h-4" />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magicVisual.background')}</span>
      </div>

      {selected ? (
        <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {MAGIC_SYMBOL_LABELS[selected.symbol] || selected.symbol}
            </p>
            <button type="button" onClick={() => removeSymbol(selected.id)} className="p-1 rounded hover:bg-red-500/20 text-parchment-400 hover:text-red-400" title={t('simulators.magicVisual.removeSymbol')}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-12 shrink-0">{t('simulators.magicVisual.scale')}</span>
            <input type="range" min={0.3} max={2.5} step={0.05} value={selected.scale} onChange={(e) => updateSelected({ scale: Number(e.target.value) })} className="w-full accent-pink-500" />
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-12 shrink-0">{t('simulators.magicVisual.rotation')}</span>
            <input type="range" min={-180} max={180} step={1} value={selected.rotation} onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} className="w-full accent-pink-500" />
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-12 shrink-0">{t('simulators.magicVisual.opacity')}</span>
            <input type="range" min={0.1} max={1} step={0.05} value={selected.opacity} onChange={(e) => updateSelected({ opacity: Number(e.target.value) })} className="w-full accent-pink-500" />
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-12 shrink-0">Color</span>
            <input type="color" value={selected.color} onChange={(e) => updateSelected({ color: e.target.value })} className="w-9 h-7 rounded cursor-pointer bg-transparent" />
          </div>
        </div>
      ) : (
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magicVisual.selectHint')}</p>
      )}
    </div>
  );
}