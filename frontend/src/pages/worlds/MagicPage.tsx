import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, User, X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { VisualizerToolbar } from '../../components/visualizers/VisualizerToolbar';
import { Legend } from '../../components/visualizers/Legend';
import { MagicVisual } from '../../components/visualizers/MagicVisual';
import { MagicVisualEditor } from '../../components/visualizers/MagicVisualEditor';
import { magicAPI, characterAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { prefersReducedMotion } from '../../lib/motion';
import { useDraggableNodes } from '../../lib/useDraggableNodes';
import { defaultMagicVisual, type MagicVisualComposition } from '../../lib/magicVisual';

interface MagicSystem {
  id: string;
  name: string;
  school: string;
  description?: string;
  powerSource?: string;
  visual?: MagicVisualComposition;
  _count?: { spells: number };
}

interface Spell {
  id: string;
  name: string;
  description: string;
  powerLevel: number;
  cost?: string;
  systemId: string;
  practitionerId?: string | null;
  visual?: MagicVisualComposition;
}

interface Character {
  id: string;
  name: string;
}

const schoolColors: Record<string, string> = {
  ELEMENTAL: '#34d399',
  NECROMANCIA: '#a78bfa',
  INVOCACION: '#f472b6',
  ILUSIONISMO: '#60a5fa',
  ALTERACION: '#fbbf24',
  CONJURACION: '#f97316',
  ARCANA_PURA: '#e2e8f0'
};

const SCHOOLS = ['ELEMENTAL', 'NECROMANCIA', 'INVOCACION', 'ILUSIONISMO', 'ALTERACION', 'CONJURACION', 'ARCANA_PURA'];

function schoolLabel(school: string): string {
  return school.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SystemNode({ data }: NodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl border-2 select-none"
      style={{
        borderColor: data.color,
        backgroundColor: 'rgba(30, 34, 54, 0.92)',
        boxShadow: `0 0 24px ${data.color}40`
      }}
    >
      {data.visual && (data.visual.symbols.length > 0 || data.visual.circle !== 'none') ? (
        <MagicVisual composition={data.visual} className="w-10 h-10 drop-shadow" />
      ) : (
        <Sparkles className="w-6 h-6" style={{ color: data.color }} />
      )}
      <p className="font-serif font-bold text-parchment-100 text-center">{data.label}</p>
      <p className="text-[11px]" style={{ color: data.color }}>{data.school}</p>
      <span className="px-2 py-0.5 rounded-full text-[10px] bg-midnight-700 text-parchment-300">
        {data.spells} {data.spells === 1 ? 'spell' : 'spells'}
      </span>
    </motion.div>
  );
}

function SpellNode({ data, selected }: NodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="px-3 py-2 rounded-xl border select-none cursor-pointer transition-all"
      style={{
        borderColor: selected ? '#d97216' : data.color,
        backgroundColor: selected ? 'rgba(217, 114, 22, 0.18)' : 'rgba(30, 34, 54, 0.9)',
        boxShadow: selected ? '0 0 16px rgba(217,114,22,0.55)' : `0 0 10px ${data.color}22`
      }}
    >
      <p className="text-xs font-medium text-parchment-100">{data.label}</p>
      <p className="text-[10px] text-parchment-400">Power {data.power}</p>
      {data.visual && data.visual.symbols.length > 0 && (
        <MagicVisual composition={{ ...data.visual, circle: 'none', background: false }} className="w-7 h-7 mt-1" />
      )}
    </motion.div>
  );
}

function CharacterNode({ data }: NodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-midnight-600 bg-midnight-800 select-none"
    >
      <User className="w-3.5 h-3.5 text-blue-400" />
      <p className="text-xs text-parchment-100">{data.label}</p>
    </motion.div>
  );
}

const nodeTypes = { system: SystemNode, spell: SpellNode, character: CharacterNode };

export function MagicPage() {
  return (
    <ReactFlowProvider>
      <MagicFlow />
    </ReactFlowProvider>
  );
}

function MagicFlow() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();
  const [systems, setSystems] = useState<MagicSystem[]>([]);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reduceMotion = prefersReducedMotion();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useEffect(() => {
    if (!worldId) return;
    loadData();
  }, [worldId]);

  const loadData = async () => {
    if (!worldId) return;
    try {
      const [sysRes, spellRes, charRes] = await Promise.all([
        magicAPI.listSystems(worldId),
        magicAPI.listSpells(worldId),
        characterAPI.list(worldId)
      ]);
      setSystems(sysRes.data.systems || []);
      setSpells(spellRes.data.spells || []);
      setCharacters(charRes.data.characters || []);
    } catch (error) {
      console.error('Failed to load magic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const visibleSystems = useMemo(
    () => (schoolFilter === 'All' ? systems : systems.filter((s) => s.school === schoolFilter)),
    [systems, schoolFilter]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<MagicSystem | null>(null);
  const [systemForm, setSystemForm] = useState({ name: '', school: 'ELEMENTAL', description: '', powerSource: '' });
  const [systemVisual, setSystemVisual] = useState<MagicVisualComposition>(defaultMagicVisual());
  const [isSpellModalOpen, setIsSpellModalOpen] = useState(false);
  const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
  const [spellForm, setSpellForm] = useState({ name: '', description: '', powerLevel: 3, cost: '', systemId: '', practitionerId: '' });
  const [spellVisual, setSpellVisual] = useState<MagicVisualComposition>(defaultMagicVisual());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const openSystemModal = (system?: MagicSystem) => {
    setEditingSystem(system || null);
    setSystemForm({
      name: system?.name || '',
      school: system?.school || 'ELEMENTAL',
      description: system?.description || '',
      powerSource: system?.powerSource || ''
    });
    setSystemVisual({ ...defaultMagicVisual(), ...(system?.visual || {}) });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldId || !systemForm.name.trim()) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        worldId,
        name: systemForm.name.trim(),
        school: systemForm.school,
        description: systemForm.description.trim() || undefined,
        powerSource: systemForm.powerSource.trim() || undefined,
        visual: systemVisual
      };
      if (editingSystem) {
        await magicAPI.updateSystem(editingSystem.id, payload);
      } else {
        await magicAPI.createSystem(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      setFormError(error?.response?.data?.error || 'Failed to save magic system');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSystem = async (system: MagicSystem) => {
    if (!window.confirm(`Delete magic system "${system.name}" and its spells?`)) return;
    try {
      await magicAPI.deleteSystem(system.id);
      setSelectedId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete system:', error);
    }
  };

  const openSpellModal = (spell?: Spell, systemId?: string) => {
    setEditingSpell(spell || null);
    setSpellForm({
      name: spell?.name || '',
      description: spell?.description || '',
      powerLevel: spell?.powerLevel ?? 3,
      cost: spell?.cost || '',
      systemId: spell?.systemId || systemId || (systems[0]?.id ?? ''),
      practitionerId: spell?.practitionerId || ''
    });
    setSpellVisual({ ...defaultMagicVisual(), ...(spell?.visual || {}) });
    setFormError('');
    setIsSpellModalOpen(true);
  };

  const handleSpellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldId || !spellForm.name.trim() || !spellForm.systemId) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        worldId,
        name: spellForm.name.trim(),
        description: spellForm.description.trim(),
        powerLevel: spellForm.powerLevel,
        cost: spellForm.cost.trim() || undefined,
        systemId: spellForm.systemId,
        practitionerId: spellForm.practitionerId || null,
        visual: spellVisual
      };
      if (editingSpell) {
        await magicAPI.updateSpell(editingSpell.id, payload);
      } else {
        await magicAPI.createSpell(payload);
      }
      setIsSpellModalOpen(false);
      await loadData();
    } catch (error: any) {
      setFormError(error?.response?.data?.error || 'Failed to save spell');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpell = async (spell: Spell) => {
    if (!window.confirm(`Delete spell "${spell.name}"?`)) return;
    try {
      await magicAPI.deleteSpell(spell.id);
      setSelectedId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete spell:', error);
    }
  };

  const { nodes, edges } = useMemo(() => {
    const sysX = 220;
    const nodes: Node[] = visibleSystems.map((sys, i) => ({
      id: `system-${sys.id}`,
      type: 'system',
      position: { x: 80 + i * sysX, y: 40 },
      data: {
        label: sys.name,
        school: schoolLabel(sys.school),
        color: schoolColors[sys.school] || '#8d97ab',
        spells: sys._count?.spells ?? 0,
        visual: sys.visual
      }
    }));

    const edges: Edge[] = [];
    visibleSystems.forEach((sys, i) => {
      const sysSpells = spells.filter((s) => s.systemId === sys.id);
      const cx = 80 + i * sysX + 90;
      const cy = 190;
      const radius = Math.max(120, 90 + sysSpells.length * 10);
      sysSpells.forEach((spell, j) => {
        const angle = (j / Math.max(1, sysSpells.length)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        nodes.push({
          id: `spell-${spell.id}`,
          type: 'spell',
          position: { x, y },
          data: {
            label: spell.name,
            power: spell.powerLevel,
            color: schoolColors[sys.school] || '#8d97ab',
            selected: selectedId === spell.id,
            visual: spell.visual
          }
        });
        edges.push({
          id: `sys-${sys.id}-${spell.id}`,
          source: `system-${sys.id}`,
          target: `spell-${spell.id}`,
          type: 'smoothstep',
          animated: !reduceMotion,
          style: { stroke: schoolColors[sys.school] || '#8d97ab', strokeWidth: 1.2 }
        });
        if (spell.practitionerId) {
          const char = characters.find((c) => c.id === spell.practitionerId);
          if (char) {
            const charX = 120 + characters.indexOf(char) * 150;
            nodes.push({
              id: `char-${char.id}`,
              type: 'character',
              position: { x: charX, y: 470 },
              data: { label: char.name }
            });
            edges.push({
              id: `prac-${spell.id}`,
              source: `spell-${spell.id}`,
              target: `char-${char.id}`,
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#60a5fa', strokeWidth: 1.2, strokeDasharray: '4 4' }
            });
          }
        }
      });
    });
    return { nodes, edges };
  }, [visibleSystems, spells, characters, selectedId, reduceMotion]);

  const flow = useDraggableNodes(nodes);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const spell = spells.find((s) => s.id === selectedId);
    if (spell) {
      const sys = systems.find((s) => s.id === spell.systemId);
      return { type: 'spell', title: spell.name, body: spell.description, meta: `Power ${spell.powerLevel}${spell.cost ? ` · Cost: ${spell.cost}` : ''}${sys ? ` · ${schoolLabel(sys.school)}` : ''}` };
    }
    const system = systems.find((s) => s.id === selectedId);
    if (system) {
      return { type: 'system', title: system.name, body: system.description || '', meta: `${schoolLabel(system.school)}${system.powerSource ? ` · ${system.powerSource}` : ''}` };
    }
    return null;
  }, [selectedId, spells, systems]);

  const schoolsPresent = useMemo(() => Array.from(new Set(systems.map((s) => s.school))), [systems]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Wand2 className="w-8 h-8 text-pink-400" />
            {t('simulators.magic.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.subtitle')}</p>
        </div>
        <Button onClick={() => openSystemModal()}>
          <Plus className="w-4 h-4 mr-2" /> {t('simulators.magic.addSystem')}
        </Button>
      </div>

      <VisualizerToolbar
        eras={[{ value: 'All', label: 'All' }, ...schoolsPresent.map((s) => ({ value: s, label: schoolLabel(s) }))]}
        activeEra={schoolFilter}
        onEraChange={(school) => setSchoolFilter(school)}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView()}
      />

      <Legend
        title={t('simulators.magic.legend')}
        items={schoolsPresent.map((s) => ({ label: schoolLabel(s), dotStyle: { backgroundColor: schoolColors[s] || '#8d97ab' } }))}
      />

      {isLoading ? (
        <Card className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
        </Card>
      ) : visibleSystems.length === 0 ? (
        <Card className="p-12 text-center">
          <Wand2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('simulators.magic.empty')}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.emptyDesc')}</p>
          <Button className="mt-4" onClick={() => openSystemModal()}>
            <Plus className="w-4 h-4 mr-2" /> {t('simulators.magic.addSystem')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <Card className="overflow-hidden">
            <div className="h-[560px]">
              <ReactFlow
                nodes={flow.nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={flow.onNodesChange}
                fitView
                minZoom={0.3}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                nodesConnectable={false}
                onNodeClick={(_, node) => setSelectedId(node.id.replace(/^(system|spell|char)-/, ''))}
              >
                <Background color="#8d97ab" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </Card>

          {/* Detail panel */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t('simulators.magic.details')}
                </span>
                {selected && (
                  <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-midnight-700" style={{ color: 'var(--text-secondary)' }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selected ? (
                <>
                  <div>
                    <p className="font-medium text-parchment-100">{selected.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selected.meta}</p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selected.body}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selected.type === 'system' && (
                      <Button size="sm" onClick={() => openSpellModal(undefined, selectedId!)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('simulators.magic.addSpell')}
                      </Button>
                    )}
                    {selected.type === 'system' && (
                      <Button size="sm" variant="secondary" onClick={() => openSystemModal(systems.find((s) => s.id === selectedId))}>
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> {t('simulators.magic.edit')}
                      </Button>
                    )}
                    {selected.type === 'spell' && (
                      <Button size="sm" variant="secondary" onClick={() => openSpellModal(spells.find((s) => s.id === selectedId))}>
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> {t('simulators.magic.edit')}
                      </Button>
                    )}
                    {selected.type === 'system' && (
                      <Button size="sm" variant="danger" onClick={() => handleDeleteSystem(systems.find((s) => s.id === selectedId)!)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t('common.delete')}
                      </Button>
                    )}
                    {selected.type === 'spell' && (
                      <Button size="sm" variant="danger" onClick={() => handleDeleteSpell(spells.find((s) => s.id === selectedId)!)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('simulators.magic.selectHint')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
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
              className="w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-serif text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Wand2 className="w-5 h-5 text-pink-400" />
                  {editingSystem ? t('simulators.magic.editSystem') : t('simulators.magic.newSystem')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSystemSubmit} className="flex-1 overflow-y-auto">
                <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
                  <div className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{formError}</div>
                    )}
                    <Input
                      label={t('simulators.magic.name')}
                      value={systemForm.name}
                      onChange={(e) => setSystemForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t('simulators.magic.namePlaceholder')}
                      required
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.school')}</label>
                      <select
                        value={systemForm.school}
                        onChange={(e) => setSystemForm((f) => ({ ...f, school: e.target.value }))}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                      >
                        {SCHOOLS.map((s) => (
                          <option key={s} value={s}>{schoolLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.description')}</label>
                      <textarea
                        value={systemForm.description}
                        onChange={(e) => setSystemForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder={t('simulators.magic.descriptionPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                      />
                    </div>
                    <Input
                      label={t('simulators.magic.powerSource')}
                      value={systemForm.powerSource}
                      onChange={(e) => setSystemForm((f) => ({ ...f, powerSource: e.target.value }))}
                      placeholder={t('simulators.magic.powerSourcePlaceholder')}
                    />
                  </div>
                  <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                    <MagicVisualEditor value={systemVisual} onChange={setSystemVisual} />
                  </div>
                </div>
                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingSystem ? t('common.save') : t('common.create')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSpellModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsSpellModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-serif text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  {editingSpell ? t('simulators.magic.editSpell') : t('simulators.magic.newSpell')}
                </h2>
                <button onClick={() => setIsSpellModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSpellSubmit} className="flex-1 overflow-y-auto">
                <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
                  <div className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{formError}</div>
                    )}
                    <Input
                      label={t('simulators.magic.name')}
                      value={spellForm.name}
                      onChange={(e) => setSpellForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t('simulators.magic.spellNamePlaceholder')}
                      required
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.system')}</label>
                      <select
                        value={spellForm.systemId}
                        onChange={(e) => setSpellForm((f) => ({ ...f, systemId: e.target.value }))}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                      >
                        {systems.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.description')}</label>
                      <textarea
                        value={spellForm.description}
                        onChange={(e) => setSpellForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder={t('simulators.magic.spellDescPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.powerLevel')}</label>
                        <span className="text-xs font-bold text-burnt-400">{spellForm.powerLevel}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={spellForm.powerLevel}
                        onChange={(e) => setSpellForm((f) => ({ ...f, powerLevel: Number(e.target.value) }))}
                        className="w-full accent-burnt-500"
                      />
                    </div>
                    <Input
                      label={t('simulators.magic.cost')}
                      value={spellForm.cost}
                      onChange={(e) => setSpellForm((f) => ({ ...f, cost: e.target.value }))}
                      placeholder={t('simulators.magic.costPlaceholder')}
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.magic.practitioner')}</label>
                      <select
                        value={spellForm.practitionerId}
                        onChange={(e) => setSpellForm((f) => ({ ...f, practitionerId: e.target.value }))}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                      >
                        <option value="">{t('simulators.magic.noPractitioner')}</option>
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                    <MagicVisualEditor value={spellVisual} onChange={setSpellVisual} />
                  </div>
                </div>
                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsSpellModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingSpell ? t('common.save') : t('common.create')}
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