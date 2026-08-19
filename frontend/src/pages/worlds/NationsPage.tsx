import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Users, MapPin, Landmark, Globe, Scroll, Link2, Search, X, Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AnimatedNumber } from '../../components/visualizers/AnimatedNumber';
import { HeraldryShield } from '../../components/visualizers/HeraldryShield';
import { FlagRenderer } from '../../components/visualizers/FlagRenderer';
import { nationsAPI, geographyAPI, characterAPI, timelineAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { staggerContainer, staggerItem } from '../../lib/motion';

interface Nation {
  id: string;
  name: string;
  motto?: string;
  government?: string;
  population?: number;
  militaryPower?: number;
  culture?: string;
  coatOfArmsUrl?: string;
  region?: { id: string; name: string };
  continents?: { id: string; name: string }[];
  characters?: { id: string; name: string; title?: string }[];
  events?: { id: string; title: string }[];
  heraldry?: { id: string; name: string; composition: any }[];
  _count?: { characters: number; laws: number; events: number };
}

interface SelectOption {
  id: string;
  name: string;
}

const LINK_META: Record<string, { icon: any; color: string }> = {
  CONTINENT: { icon: Globe, color: '#34d399' },
  CHARACTER: { icon: Users, color: '#fbbf24' },
  EVENT: { icon: Scroll, color: '#22d3ee' }
};

export function NationsPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();
  const [nations, setNations] = useState<Nation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNation, setEditingNation] = useState<Nation | null>(null);

  const [formName, setFormName] = useState('');
  const [formMotto, setFormMotto] = useState('');
  const [formGovernment, setFormGovernment] = useState('');
  const [formPopulation, setFormPopulation] = useState('');
  const [formMilitaryPower, setFormMilitaryPower] = useState(5);
  const [formCulture, setFormCulture] = useState('');
  const [formCoatOfArmsUrl, setFormCoatOfArmsUrl] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formContinents, setFormContinents] = useState<string[]>([]);
  const [formCharacters, setFormCharacters] = useState<string[]>([]);
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [linkSearch, setLinkSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [regions, setRegions] = useState<SelectOption[]>([]);
  const [continents, setContinents] = useState<SelectOption[]>([]);
  const [characters, setCharacters] = useState<SelectOption[]>([]);
  const [events, setEvents] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (!worldId) return;
    loadNations();
    loadOptions();
  }, [worldId]);

  const loadNations = async () => {
    if (!worldId) return;
    try {
      const res = await nationsAPI.list(worldId);
      setNations(res.data.nations || []);
    } catch (error) {
      console.error('Failed to load nations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptions = async () => {
    if (!worldId) return;
    try {
      const [contRes, charRes, evRes, regRes] = await Promise.all([
        geographyAPI.listContinents(worldId),
        characterAPI.list(worldId),
        timelineAPI.list(worldId),
        geographyAPI.listRegions(worldId)
      ]);
      setContinents((contRes.data.continents || []).map((c: any) => ({ id: c.id, name: c.name })));
      setCharacters((charRes.data.characters || []).map((c: any) => ({ id: c.id, name: c.name })));
      setEvents((evRes.data.events || []).map((e: any) => ({ id: e.id, name: e.title })));
      setRegions((regRes.data.regions || []).map((r: any) => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error('Failed to load link options:', error);
    }
  };

  const maxPower = Math.max(1, ...nations.map((n) => n.militaryPower || 0));
  const maxPopulation = Math.max(1, ...nations.map((n) => n.population || 0));

  const openCreateModal = () => {
    setEditingNation(null);
    setFormName('');
    setFormMotto('');
    setFormGovernment('');
    setFormPopulation('');
    setFormMilitaryPower(5);
    setFormCulture('');
    setFormCoatOfArmsUrl('');
    setFormRegionId('');
    setFormContinents([]);
    setFormCharacters([]);
    setFormEvents([]);
    setLinkSearch('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (nation: Nation) => {
    try {
      const res = await nationsAPI.get(nation.id);
      const n = res.data.nation;
      setEditingNation(n);
      setFormName(n.name || '');
      setFormMotto(n.motto || '');
      setFormGovernment(n.government || '');
      setFormPopulation(n.population !== undefined && n.population !== null ? String(n.population) : '');
      setFormMilitaryPower(n.militaryPower || 1);
      setFormCulture(n.culture || '');
      setFormCoatOfArmsUrl(n.coatOfArmsUrl || '');
      setFormRegionId(n.region?.id || '');
      setFormContinents((n.continents || []).map((c: any) => c.id));
      setFormCharacters((n.characters || []).map((c: any) => c.id));
      setFormEvents((n.events || []).map((e: any) => e.id));
      setLinkSearch('');
      setFormError('');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load nation:', error);
    }
  };

  const handleDelete = async (nation: Nation) => {
    if (!window.confirm(`Delete "${nation.name}"?`)) return;
    try {
      await nationsAPI.delete(nation.id);
      setNations((prev) => prev.filter((n) => n.id !== nation.id));
    } catch (error) {
      console.error('Failed to delete nation:', error);
    }
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
        motto: formMotto.trim() || undefined,
        government: formGovernment.trim() || undefined,
        population: formPopulation ? Number(formPopulation) : undefined,
        militaryPower: formMilitaryPower,
        culture: formCulture.trim() || undefined,
        coatOfArmsUrl: formCoatOfArmsUrl.trim() || undefined,
        regionId: formRegionId || undefined,
        continentIds: formContinents,
        characterIds: formCharacters,
        eventIds: formEvents
      };
      if (editingNation) {
        await nationsAPI.update(editingNation.id, payload);
      } else {
        await nationsAPI.create(payload);
      }
      setIsModalOpen(false);
      await loadNations();
    } catch (error: any) {
      setFormError(error?.response?.data?.error || 'Failed to save nation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOptions = useMemo(() => {
    const q = linkSearch.toLowerCase();
    const filter = (list: SelectOption[]) => (q ? list.filter((x) => x.name.toLowerCase().includes(q)) : list);
    return { continents: filter(continents), characters: filter(characters), events: filter(events) };
  }, [continents, characters, events, linkSearch]);

  const linkSections: { type: 'CONTINENT' | 'CHARACTER' | 'EVENT'; titleKey: string; options: SelectOption[]; selected: string[] }[] = [
    { type: 'CONTINENT', titleKey: 'linkContinents', options: filteredOptions.continents, selected: formContinents },
    { type: 'CHARACTER', titleKey: 'linkCharacters', options: filteredOptions.characters, selected: formCharacters },
    { type: 'EVENT', titleKey: 'linkEvents', options: filteredOptions.events, selected: formEvents }
  ];

  const toggleLink = (type: 'CONTINENT' | 'CHARACTER' | 'EVENT', id: string) => {
    const setter = type === 'CONTINENT' ? setFormContinents : type === 'CHARACTER' ? setFormCharacters : setFormEvents;
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedNames = (type: 'CONTINENT' | 'CHARACTER' | 'EVENT') => {
    const source = type === 'CONTINENT' ? continents : type === 'CHARACTER' ? characters : events;
    const ids = type === 'CONTINENT' ? formContinents : type === 'CHARACTER' ? formCharacters : formEvents;
    return ids.map((id) => source.find((x) => x.id === id)?.name || id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Crown className="w-8 h-8 text-purple-400" />
            {t('simulators.nations.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{t('simulators.nations.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> {t('simulators.nations.addNation')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : nations.length === 0 ? (
        <Card className="p-12 text-center">
          <Crown className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('simulators.nations.empty')}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('simulators.nations.emptyDesc')}</p>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {nations.map((nation) => (
            <motion.div key={nation.id} variants={staggerItem} className="flex flex-col">
              <Card variant="hover" className="h-full">
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {nation.heraldry && nation.heraldry.length > 0 ? (
                      <div className="w-12 h-14 shrink-0">
                        {nation.heraldry[0].composition?.kind === 'flag' ? (
                          <FlagRenderer composition={nation.heraldry[0].composition} className="w-full h-full drop-shadow" />
                        ) : (
                          <HeraldryShield composition={nation.heraldry[0].composition} className="w-full h-full drop-shadow" />
                        )}
                      </div>
                    ) : nation.coatOfArmsUrl ? (
                      <img src={nation.coatOfArmsUrl} alt={nation.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-midnight-700">
                        <Crown className="w-6 h-6 text-purple-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif font-bold text-parchment-100 truncate">{nation.name}</h3>
                      {nation.government && (
                        <p className="text-xs text-parchment-400 truncate">{nation.government}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditModal(nation)} className="p-1.5 rounded-lg hover:bg-midnight-700 text-parchment-400" title={t('simulators.nations.edit')}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(nation)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-parchment-400 hover:text-red-400" title={t('simulators.nations.delete')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {nation.motto && (
                    <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                      "{nation.motto}"
                    </p>
                  )}

                  <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {nation.population != null && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Population</span>
                          <span><AnimatedNumber value={nation.population} format={(n) => n.toLocaleString()} /></span>
                        </div>
                        <div className="w-full rounded-full h-1.5 bg-midnight-700">
                          <motion.div
                            className="h-1.5 rounded-full bg-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(nation.population / maxPopulation) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )}
                    {nation.militaryPower != null && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Military power</span>
                          <span>{nation.militaryPower}/{maxPower}</span>
                        </div>
                        <div className="w-full rounded-full h-1.5 bg-midnight-700">
                          <motion.div
                            className="h-1.5 rounded-full bg-burnt-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(nation.militaryPower / maxPower) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {nation.region && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-midnight-700 text-parchment-300">
                        <MapPin className="w-3 h-3" /> {nation.region.name}
                      </span>
                    )}
                    {(nation.continents || []).map((c) => (
                      <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-midnight-700 text-parchment-300">
                        <Globe className="w-3 h-3 text-green-400" /> {c.name}
                      </span>
                    ))}
                    {nation._count && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-midnight-700 text-parchment-300">
                        <Landmark className="w-3 h-3" /> {nation._count.characters} chars · {nation._count.laws} laws
                      </span>
                    )}
                    {(nation._count?.events || 0) > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-midnight-700 text-parchment-300">
                        <Scroll className="w-3 h-3 text-cyan-400" /> {nation._count?.events}
                      </span>
                    )}
                  </div>

                  {nation.culture && (
                    <p className="text-xs leading-relaxed text-parchment-400 line-clamp-3">{nation.culture}</p>
                  )}
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
              className="w-full max-w-5xl bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingNation ? t('simulators.nations.editNation') : t('simulators.nations.newNation')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                  <div className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    <Input
                      label={t('simulators.nations.nationName')}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t('simulators.nations.nationNamePlaceholder')}
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t('simulators.nations.government')}
                        value={formGovernment}
                        onChange={(e) => setFormGovernment(e.target.value)}
                        placeholder={t('simulators.nations.governmentPlaceholder')}
                      />
                      <Input
                        label={t('simulators.nations.motto')}
                        value={formMotto}
                        onChange={(e) => setFormMotto(e.target.value)}
                        placeholder={t('simulators.nations.mottoPlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t('simulators.nations.population')}
                        type="number"
                        min={0}
                        value={formPopulation}
                        onChange={(e) => setFormPopulation(e.target.value)}
                        placeholder="0"
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-parchment-300">{t('simulators.nations.region')}</label>
                        <select
                          value={formRegionId}
                          onChange={(e) => setFormRegionId(e.target.value)}
                          className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                        >
                          <option value="">{t('simulators.nations.noRegion')}</option>
                          {regions.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.nations.militaryPower')}</label>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formMilitaryPower}/10</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={formMilitaryPower}
                        onChange={(e) => setFormMilitaryPower(Number(e.target.value))}
                        className="w-full accent-burnt-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.nations.culture')}</label>
                      <textarea
                        value={formCulture}
                        onChange={(e) => setFormCulture(e.target.value)}
                        placeholder={t('simulators.nations.culturePlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                      />
                    </div>

                    <Input
                      label={t('simulators.nations.coatOfArmsUrl')}
                      value={formCoatOfArmsUrl}
                      onChange={(e) => setFormCoatOfArmsUrl(e.target.value)}
                      placeholder={t('simulators.nations.coatOfArmsPlaceholder')}
                    />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-burnt-400" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulators.timeline.links')}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.nations.linksHint')}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                        <Input
                          placeholder={t('simulators.nations.searchLinks')}
                          value={linkSearch}
                          onChange={(e) => setLinkSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {linkSections.map((section) => {
                        const meta = LINK_META[section.type];
                        const Icon = meta.icon;
                        return (
                          <div key={section.type}>
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: meta.color }}>
                              <Icon className="w-3.5 h-3.5" /> {t(`simulators.nations.${section.titleKey}`)}
                            </p>
                            {section.options.length === 0 ? (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.nations.noSearchResults')}</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {section.options.map((opt) => {
                                  const active = section.selected.includes(opt.id);
                                  return (
                                    <button
                                      type="button"
                                      key={opt.id}
                                      onClick={() => toggleLink(section.type, opt.id)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                                        active
                                          ? 'border-burnt-500 bg-burnt-500/20 text-parchment-100'
                                          : 'bg-midnight-700 border-midnight-600 text-parchment-300 hover:border-midnight-500'
                                      }`}
                                    >
                                      {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />}
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

                  <div className="lg:sticky lg:top-0 self-start">
                    <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulators.nations.details')}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formName || t('simulators.nations.nationNamePlaceholder')}</p>
                        {formMotto && <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>"{formMotto}"</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {formRegionId && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: '#8d97ab44', backgroundColor: '#8d97ab14', color: 'var(--text-primary)' }}>
                              <MapPin className="w-3 h-3" /> {regions.find((r) => r.id === formRegionId)?.name || formRegionId}
                            </span>
                          )}
                          {(['CONTINENT', 'CHARACTER', 'EVENT'] as const).map((type) => {
                            const meta = LINK_META[type];
                            const Icon = meta.icon;
                            const names = selectedNames(type);
                            return names.map((name) => (
                              <span key={`${type}-${name}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: `${meta.color}44`, backgroundColor: `${meta.color}14`, color: 'var(--text-primary)' }}>
                                <Icon className="w-3 h-3" style={{ color: meta.color }} /> {name}
                              </span>
                            ));
                          })}
                        </div>
                        {formCulture && <p className="text-xs text-parchment-400 line-clamp-3">{formCulture}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingNation ? t('simulators.nations.saveNationBtn') : t('simulators.nations.createNationBtn')}
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