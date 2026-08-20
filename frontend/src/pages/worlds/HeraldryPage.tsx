import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Flag, Plus, X, Trash2, Edit2, Image as ImageIcon, Link2, Search, Users, Crown } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HeraldryShield } from '../../components/visualizers/HeraldryShield';
import { FlagRenderer } from '../../components/visualizers/FlagRenderer';
import { heraldryAPI, nationsAPI, characterAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { staggerContainer, staggerItem } from '../../lib/motion';
import {
  type HeraldryComposition,
  type HeraldryKind,
  type Charge,
  defaultComposition,
  SHIELD_SHAPES,
  SHIELD_SHAPE_IDS,
  CHARGE_IDS,
  CHARGE_LABELS,
  CHARGE_PATHS,
  SUN_SHAPE,
  TINCTURES,
  TINCTURE_TYPES,
  FIELD_TYPES,
  newChargeId
} from '../../lib/heraldry';

interface HeraldryItem {
  id: string;
  name: string;
  description?: string;
  composition: HeraldryComposition;
  nations?: { id: string; name: string }[];
  characters?: { id: string; name: string; title?: string }[];
}

interface SelectOption {
  id: string;
  name: string;
}

function ShapePreview({ shape, className }: { shape: string; className?: string }) {
  if (shape === SUN_SHAPE) {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = 12 + Math.cos(angle) * 5.4;
          const y1 = 12 + Math.sin(angle) * 5.4;
          const x2 = 12 + Math.cos(angle) * 8.5;
          const y2 = 12 + Math.sin(angle) * 8.5;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.6" />;
        })}
      </svg>
    );
  }
  const def = CHARGE_PATHS[shape];
  if (!def) return null;
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d={def.path} fill="currentColor" />
    </svg>
  );
}

export function HeraldryPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();
  const [items, setItems] = useState<HeraldryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HeraldryItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNations, setFormNations] = useState<string[]>([]);
  const [formCharacters, setFormCharacters] = useState<string[]>([]);
  const [composition, setComposition] = useState<HeraldryComposition>(defaultComposition());
  const [tool, setTool] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nations, setNations] = useState<SelectOption[]>([]);
  const [characters, setCharacters] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (!worldId) return;
    loadItems();
    loadOptions();
  }, [worldId]);

  const loadItems = async () => {
    if (!worldId) return;
    try {
      const res = await heraldryAPI.list(worldId);
      setItems(res.data.items || []);
    } catch (error) {
      console.error('Failed to load heraldry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptions = async () => {
    if (!worldId) return;
    try {
      const [nRes, cRes] = await Promise.all([nationsAPI.list(worldId), characterAPI.list(worldId)]);
      setNations((nRes.data.nations || []).map((n: any) => ({ id: n.id, name: n.name })));
      setCharacters((cRes.data.characters || []).map((c: any) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Failed to load heraldry options:', error);
    }
  };

  const updateComp = (patch: Partial<HeraldryComposition>) => setComposition((prev) => ({ ...prev, ...patch }));

  const updateCharge = (id: string, patch: Partial<Charge>) => {
    setComposition((prev) => ({
      ...prev,
      charges: prev.charges.map((c) => (c.id === id ? { ...c, ...patch } as Charge : c))
    }));
  };

  const removeCharge = (id: string) => {
    setComposition((prev) => ({ ...prev, charges: prev.charges.filter((c) => c.id !== id) }));
    setSelectedChargeId(null);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormNations([]);
    setFormCharacters([]);
    setComposition(defaultComposition('shield'));
    setTool(null);
    setImageUrl('');
    setSelectedChargeId(null);
    setLinkSearch('');
    setFormError('');
    setIsModalOpen(true);
  };

  const switchKind = (kind: HeraldryKind) => {
    if (kind === composition.kind) return;
    const field = kind === 'flag'
      ? { ...composition.field, type: composition.field.type === 'solid' ? 'vStripes' as const : composition.field.type }
      : { ...composition.field, type: (composition.field.type === 'vStripes' || composition.field.type === 'hStripes' || composition.field.type === 'diagonal') ? 'solid' as const : composition.field.type };
    updateComp({ kind, field });
    setSelectedChargeId(null);
  };

  const openEditModal = async (item: HeraldryItem) => {
    try {
      const res = await heraldryAPI.get(item.id);
      const it = res.data.item;
      setEditingItem(it);
      setFormName(it.name || '');
      setFormDescription(it.description || '');
      setFormNations((it.nations || []).map((n: any) => n.id));
      setFormCharacters((it.characters || []).map((c: any) => c.id));
      setComposition({ ...defaultComposition(), ...(it.composition || {}), kind: it.composition?.kind === 'flag' ? 'flag' : 'shield' });
      setTool(null);
      setImageUrl('');
      setSelectedChargeId(null);
      setLinkSearch('');
      setFormError('');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load heraldry item:', error);
    }
  };

  const handleDelete = async (item: HeraldryItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await heraldryAPI.delete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error('Failed to delete heraldry:', error);
    }
  };

  const handleAddCharge = (x: number, y: number) => {
    if (!tool) {
      setSelectedChargeId(null);
      return;
    }
    if (tool === 'image') {
      if (!imageUrl.trim()) return;
      const charge: Charge = { id: newChargeId(), kind: 'image', url: imageUrl.trim(), x, y, scale: 0.6, rotation: 0, opacity: 1 };
      updateComp({ charges: [...composition.charges, charge] });
      setSelectedChargeId(charge.id);
      setTool(null);
      setImageUrl('');
      return;
    }
    const charge: Charge = { id: newChargeId(), kind: 'shape', shape: tool, x, y, scale: 1, rotation: 0, color: '#f0c330', opacity: 1 };
    updateComp({ charges: [...composition.charges, charge] });
    setSelectedChargeId(charge.id);
    setTool(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldId || !formName.trim()) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        worldId,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        composition,
        nationIds: formNations,
        characterIds: formCharacters
      };
      if (editingItem) {
        await heraldryAPI.update(editingItem.id, payload);
      } else {
        await heraldryAPI.create(payload);
      }
      setIsModalOpen(false);
      await loadItems();
    } catch (error: any) {
      setFormError(error?.response?.data?.error || 'Failed to save heraldry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOptions = useMemo(() => {
    const q = linkSearch.toLowerCase();
    const filter = (list: SelectOption[]) => (q ? list.filter((x) => x.name.toLowerCase().includes(q)) : list);
    return { nations: filter(nations), characters: filter(characters) };
  }, [nations, characters, linkSearch]);

  const toggleLink = (type: 'NATION' | 'CHARACTER', id: string) => {
    if (type === 'NATION') {
      setFormNations((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setFormCharacters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  const selectedCharge = composition.charges.find((c) => c.id === selectedChargeId) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-8 h-8 text-amber-400" />
            {t('simulators.heraldry.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> {t('simulators.heraldry.addHeraldry')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('simulators.heraldry.empty')}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.emptyDesc')}</p>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={staggerItem}>
              <Card variant="hover" className="h-full">
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 shrink-0">
                      {item.composition?.kind === 'flag' ? (
                        <FlagRenderer composition={item.composition} className="w-full h-full drop-shadow-lg" />
                      ) : (
                        <HeraldryShield composition={item.composition} className="w-full h-full drop-shadow-lg" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif font-bold text-parchment-100 truncate">{item.name}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] mt-1 bg-midnight-700 text-parchment-300">
                        {item.composition?.kind === 'flag' ? (
                          <><Flag className="w-2.5 h-2.5 text-sky-400" /> {t('simulators.heraldry.kindFlag')}</>
                        ) : (
                          <><Shield className="w-2.5 h-2.5 text-amber-400" /> {t('simulators.heraldry.kindShield')}</>
                        )}
                      </span>
                      {item.description && (
                        <p className="text-xs text-parchment-400 line-clamp-2 mt-1">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(item.nations || []).map((n) => (
                          <span key={n.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-midnight-700 text-parchment-300">
                            <Crown className="w-2.5 h-2.5 text-purple-400" /> {n.name}
                          </span>
                        ))}
                        {(item.characters || []).map((c) => (
                          <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-midnight-700 text-parchment-300">
                            <Users className="w-2.5 h-2.5 text-amber-400" /> {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg hover:bg-midnight-700 text-parchment-400" title={t('simulators.nations.edit')}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-parchment-400 hover:text-red-400" title={t('simulators.nations.delete')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingItem ? t('simulators.heraldry.editHeraldry') : t('simulators.heraldry.newHeraldry')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[84vh] overflow-y-auto">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
                  {/* Left: config */}
                  <div className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{formError}</div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.kind')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => switchKind('shield')}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${composition.kind === 'shield' ? 'border-burnt-500 bg-burnt-500/10 text-parchment-100' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300 hover:border-midnight-500'}`}>
                          <Shield className="w-4 h-4 text-amber-400" /> {t('simulators.heraldry.kindShield')}
                        </button>
                        <button type="button" onClick={() => switchKind('flag')}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${composition.kind === 'flag' ? 'border-burnt-500 bg-burnt-500/10 text-parchment-100' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300 hover:border-midnight-500'}`}>
                          <Flag className="w-4 h-4 text-sky-400" /> {t('simulators.heraldry.kindFlag')}
                        </button>
                      </div>
                    </div>

                    <Input
                      label={t('simulators.heraldry.name')}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t('simulators.heraldry.namePlaceholder')}
                      required
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.description')}</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder={t('simulators.heraldry.descriptionPlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                      />
                    </div>

                    {composition.kind === 'shield' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.shieldShape')}</label>
                        <div className="flex flex-wrap gap-2">
                          {SHIELD_SHAPE_IDS.map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => updateComp({ shield: s })}
                              className={`p-2 rounded-lg border transition-colors ${composition.shield === s ? 'border-burnt-500 bg-burnt-500/10' : 'border-midnight-600 bg-midnight-700/60 hover:border-midnight-500'}`}
                            >
                              <svg viewBox="0 0 100 120" className="w-6 h-7" style={{ color: composition.shield === s ? '#f59e0b' : '#cbd5e1' }}>
                                <path d={SHIELD_SHAPES[s]} fill="none" stroke="currentColor" strokeWidth="6" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.field')}</label>
                      <div className="flex flex-wrap gap-2">
                        {FIELD_TYPES.filter((f) => f.id === 'solid' || f.id === 'twoTone' || composition.kind === 'flag').map((f) => (
                          <button key={f.id} type="button" onClick={() => updateComp({ field: { ...composition.field, type: f.id } })}
                            className={`px-3 py-1.5 rounded-lg text-xs border ${composition.field.type === f.id ? 'border-burnt-500 bg-burnt-500/10' : 'border-midnight-600 bg-midnight-700/60'}`}>
                            {t(`simulators.heraldry.${f.id}`)}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="color" value={composition.field.color} onChange={(e) => updateComp({ field: { ...composition.field, color: e.target.value } })} className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                        {composition.field.type !== 'solid' && (
                          <input type="color" value={composition.field.color2} onChange={(e) => updateComp({ field: { ...composition.field, color2: e.target.value } })} className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                        )}
                        {TINCTURES.slice(0, 4).map((tn) => (
                          <button key={tn.id} type="button" onClick={() => updateComp({ field: { ...composition.field, color: tn.color } })}
                            className="w-7 h-7 rounded-full border border-white/20 hover:scale-110 transition-transform" style={{ backgroundColor: tn.color }} title={tn.name} />
                        ))}
                      </div>
                    </div>

                    {composition.kind === 'shield' && (
                      <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.tincture')}</label>
                        <input type="checkbox" checked={composition.tincture.enabled} onChange={(e) => updateComp({ tincture: { ...composition.tincture, enabled: e.target.checked } })} className="accent-burnt-500 w-4 h-4" />
                      </div>
                      {composition.tincture.enabled && (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {TINCTURE_TYPES.map((tt) => (
                              <button key={tt.id} type="button" onClick={() => updateComp({ tincture: { ...composition.tincture, type: tt.id } })}
                                className={`px-2 py-1 rounded-full text-[10px] border ${composition.tincture.type === tt.id ? 'border-burnt-500 bg-burnt-500/10 text-parchment-100' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300'}`}>
                                {tt.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <input type="color" value={composition.tincture.color} onChange={(e) => updateComp({ tincture: { ...composition.tincture, color: e.target.value } })} className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                            <input type="range" min={0.1} max={1} step={0.05} value={composition.tincture.opacity} onChange={(e) => updateComp({ tincture: { ...composition.tincture, opacity: Number(e.target.value) } })} className="w-full accent-burnt-500" />
                          </div>
                        </>
                      )}
                    </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.border')}</label>
                        <input type="checkbox" checked={composition.border.enabled} onChange={(e) => updateComp({ border: { ...composition.border, enabled: e.target.checked } })} className="accent-burnt-500 w-4 h-4" />
                      </div>
                      {composition.border.enabled && (
                        <div className="flex items-center gap-3">
                          <input type="color" value={composition.border.color} onChange={(e) => updateComp({ border: { ...composition.border, color: e.target.value } })} className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                          <input type="range" min={1} max={14} value={composition.border.width} onChange={(e) => updateComp({ border: { ...composition.border, width: Number(e.target.value) } })} className="w-full accent-burnt-500" />
                        </div>
                      )}
                    </div>

                    <Input
                      label={t('simulators.heraldry.motto')}
                      value={composition.motto}
                      onChange={(e) => updateComp({ motto: e.target.value })}
                      placeholder={t('simulators.heraldry.mottoPlaceholder')}
                    />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-burnt-400" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulators.heraldry.links')}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.linksHint')}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                        <Input placeholder={t('simulators.heraldry.searchLinks')} value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} className="pl-10" />
                      </div>
                      {([
                        { type: 'NATION' as const, titleKey: 'linkNations', options: filteredOptions.nations, selected: formNations, color: '#a78bfa', icon: Crown },
                        { type: 'CHARACTER' as const, titleKey: 'linkCharacters', options: filteredOptions.characters, selected: formCharacters, color: '#fbbf24', icon: Users }
                      ]).map((section) => {
                        const Icon = section.icon;
                        return (
                          <div key={section.type}>
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: section.color }}>
                              <Icon className="w-3.5 h-3.5" /> {t(`simulators.heraldry.${section.titleKey}`)}
                            </p>
                            {section.options.length === 0 ? (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.noSearchResults')}</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {section.options.map((opt) => {
                                  const active = section.selected.includes(opt.id);
                                  return (
                                    <button key={opt.id} type="button" onClick={() => toggleLink(section.type, opt.id)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${active ? 'border-burnt-500 bg-burnt-500/20 text-parchment-100' : 'bg-midnight-700 border-midnight-600 text-parchment-300 hover:border-midnight-500'}`}>
                                      {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: section.color }} />}
                                      {opt.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: board */}
                  <div className="space-y-4">
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> {t('simulators.heraldry.boardHint')}
                    </p>

                    <div className="rounded-xl border p-4 flex flex-col items-center gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                      {composition.kind === 'flag' ? (
                        <FlagRenderer
                          composition={composition}
                          interactive
                          selectedChargeId={selectedChargeId}
                          onAddCharge={handleAddCharge}
                          onSelectCharge={setSelectedChargeId}
                          className="w-full max-w-[340px] h-auto cursor-crosshair"
                        />
                      ) : (
                        <HeraldryShield
                          composition={composition}
                          interactive
                          selectedChargeId={selectedChargeId}
                          onAddCharge={handleAddCharge}
                          onSelectCharge={setSelectedChargeId}
                          className="w-full max-w-[280px] h-auto cursor-crosshair"
                        />
                      )}
                      {composition.motto && (
                        <p className="font-serif italic text-sm text-parchment-200 text-center px-4 py-1 rounded bg-midnight-900/60">
                          "{composition.motto}"
                        </p>
                      )}
                    </div>

                    {/* Palette */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-amber-400">{t('simulators.heraldry.selectTool')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {CHARGE_IDS.map((shapeId) => (
                          <button
                            key={shapeId}
                            type="button"
                            onClick={() => setTool(shapeId)}
                            title={CHARGE_LABELS[shapeId] || shapeId}
                            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${tool === shapeId ? 'border-burnt-500 bg-burnt-500/15 text-amber-300' : 'border-midnight-600 bg-midnight-700/60 text-parchment-300 hover:border-midnight-500'}`}
                          >
                            <ShapePreview shape={shapeId} className="w-6 h-6" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image tool */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1 text-sky-400">{t('simulators.heraldry.addImage')}</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('simulators.heraldry.imagePlaceholder')}
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" size="sm" onClick={() => setTool('image')} variant={tool === 'image' ? 'primary' : 'secondary'}>
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      {tool === 'image' && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.heraldry.imageTool')}</p>
                      )}
                    </div>

                    {/* Selected charge controls */}
                    {selectedCharge ? (
                      <div className="space-y-3 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedCharge.kind === 'image' ? 'Image' : CHARGE_LABELS[selectedCharge.shape] || selectedCharge.shape}
                          </p>
                          <Button type="button" size="sm" variant="danger" onClick={() => removeCharge(selectedCharge.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="w-14 shrink-0">{t('simulators.heraldry.scale')}</span>
                            <input type="range" min={0.3} max={3} step={0.05} value={selectedCharge.scale}
                              onChange={(e) => updateCharge(selectedCharge.id, { scale: Number(e.target.value) })} className="w-full accent-burnt-500" />
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="w-14 shrink-0">{t('simulators.heraldry.rotation')}</span>
                            <input type="range" min={-180} max={180} step={1} value={selectedCharge.rotation}
                              onChange={(e) => updateCharge(selectedCharge.id, { rotation: Number(e.target.value) })} className="w-full accent-burnt-500" />
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="w-14 shrink-0">{t('simulators.heraldry.opacity')}</span>
                            <input type="range" min={0.1} max={1} step={0.05} value={selectedCharge.opacity}
                              onChange={(e) => updateCharge(selectedCharge.id, { opacity: Number(e.target.value) })} className="w-full accent-burnt-500" />
                          </div>
                          {selectedCharge.kind === 'shape' && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span className="w-14 shrink-0">Color</span>
                              <input type="color" value={selectedCharge.color}
                                onChange={(e) => updateCharge(selectedCharge.id, { color: e.target.value })} className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-parchment-500">{t('simulators.heraldry.selectChargeHint')}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingItem ? t('simulators.heraldry.saveBtn') : t('simulators.heraldry.createBtn')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeraldryPage;