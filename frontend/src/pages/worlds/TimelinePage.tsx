import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, CalendarDays, Plus, X, Trash2, Edit2, Swords, Users, Flag, Link2, Zap, Search, Wand2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { VisualizerToolbar } from '../../components/visualizers/VisualizerToolbar';
import { Legend } from '../../components/visualizers/Legend';
import { timelineAPI, bestiaryAPI, characterAPI, nationsAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { prefersReducedMotion } from '../../lib/motion';
import { useDraggableNodes } from '../../lib/useDraggableNodes';

interface EventRelation {
  id?: string;
  targetId: string;
  targetType: 'BESTIARY' | 'CHARACTER' | 'NATION' | 'EVENT';
  BestiaryEntry?: { id: string; name: string };
  Character?: { id: string; name: string };
  Nation?: { id: string; name: string };
  Event?: { id: string; title: string };
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  dateInWorld: string;
  era: string;
  importance: number;
  relations?: EventRelation[];
}

interface FormRelation {
  targetType: 'BESTIARY' | 'CHARACTER' | 'NATION' | 'EVENT';
  targetId: string;
  label: string;
}

const eras = [
  { value: 'PREHISTORIA', label: 'Prehistoria', color: '#8d97ab' },
  { value: 'EDAD_ANTIGUA', label: 'Edad Antigua', color: '#d4af37' },
  { value: 'ERA_DE_LA_GUERRA', label: 'Era de la Guerra', color: '#e28a35' },
  { value: 'ERA_DE_LA_RECONSTRUCCION', label: 'Reconstrucción', color: '#4f9d8a' },
  { value: 'ERA_ACTUAL', label: 'Era Actual', color: '#a78bfa' }
];

const REL_META: Record<string, { icon: any; color: string }> = {
  BESTIARY: { icon: Swords, color: '#f87171' },
  CHARACTER: { icon: Users, color: '#fbbf24' },
  NATION: { icon: Flag, color: '#60a5fa' },
  EVENT: { icon: Zap, color: '#22d3ee' }
};

function eraColor(era: string): string {
  return eras.find((e) => e.value === era)?.color || '#8d97ab';
}

function relationName(rel: EventRelation): string {
  return rel.BestiaryEntry?.name || rel.Character?.name || rel.Nation?.name || rel.Event?.title || '—';
}

function TimelineNode({ data, selected }: NodeProps) {
  const size = 52 + (data.importance || 5) * 6;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-1 select-none"
      style={{ width: size }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !rounded-full !bg-midnight-400 !border !border-midnight-500" />
      <div
        className="flex items-center justify-center rounded-full border-2 transition-all"
        style={{
          width: size,
          height: size,
          borderColor: data.color,
          backgroundColor: selected ? 'rgba(217, 114, 22, 0.25)' : 'rgba(30, 34, 54, 0.85)',
          boxShadow: selected ? '0 0 16px rgba(217, 114, 22, 0.6)' : `0 0 10px ${data.color}33`
        }}
      >
        <CalendarDays className="w-5 h-5" style={{ color: data.color }} />
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !rounded-full !bg-midnight-400 !border !border-midnight-500" />
      <p className="text-[11px] font-medium text-parchment-100 text-center leading-tight line-clamp-2">
        {data.label}
      </p>
      <p className="text-[10px] text-parchment-400">{data.date}</p>
      {typeof data.links === 'number' && data.links > 0 && (
        <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${data.color}22`, color: data.color }}>
          <Link2 className="w-2.5 h-2.5" /> {data.links}
        </span>
      )}
    </motion.div>
  );
}

const nodeTypes = { timeline: TimelineNode };

export function TimelinePage() {
  return (
    <ReactFlowProvider>
      <TimelineFlow />
    </ReactFlowProvider>
  );
}

function TimelineFlow() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEra, setActiveEra] = useState('All');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduceMotion = prefersReducedMotion();
  const { setCenter, fitView, zoomIn, zoomOut, getNode } = useReactFlow();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEra, setFormEra] = useState('EDAD_ANTIGUA');
  const [formImportance, setFormImportance] = useState(5);
  const [formRelations, setFormRelations] = useState<FormRelation[]>([]);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkOptions, setLinkOptions] = useState<{ bestiary: { id: string; name: string }[]; characters: { id: string; name: string }[]; nations: { id: string; name: string }[] }>({
    bestiary: [],
    characters: [],
    nations: []
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!worldId) return;
    loadEvents();
  }, [worldId]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const loadEvents = async () => {
    if (!worldId) return;
    try {
      const res = await timelineAPI.list(worldId);
      setEvents(res.data.events || []);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLinkOptions = async () => {
    if (!worldId) return;
    try {
      const [best, chars, nations] = await Promise.all([
        bestiaryAPI.list(worldId),
        characterAPI.list(worldId),
        nationsAPI.list(worldId)
      ]);
      setLinkOptions({
        bestiary: (best.data.entries || []).map((e: any) => ({ id: e.id, name: e.name })),
        characters: (chars.data.characters || []).map((c: any) => ({ id: c.id, name: c.name })),
        nations: (nations.data.nations || []).map((n: any) => ({ id: n.id, name: n.name }))
      });
    } catch (error) {
      console.error('Failed to load link options:', error);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate('');
    setFormEra('EDAD_ANTIGUA');
    setFormImportance(5);
    setFormRelations([]);
    setLinkSearch('');
    setFormError('');
    loadLinkOptions();
    setIsModalOpen(true);
  };

  const openEditModal = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormDate(event.dateInWorld);
    setFormEra(event.era);
    setFormImportance(event.importance);
    setFormRelations((event.relations || []).map((r) => ({ targetType: r.targetType, targetId: r.targetId, label: relationName(r) })));
    setLinkSearch('');
    setFormError('');
    loadLinkOptions();
    setIsModalOpen(true);
  };

  const toggleRelation = (targetType: FormRelation['targetType'], targetId: string, label: string) => {
    setFormRelations((prev) => {
      const exists = prev.some((r) => r.targetType === targetType && r.targetId === targetId);
      return exists ? prev.filter((r) => !(r.targetType === targetType && r.targetId === targetId)) : [...prev, { targetType, targetId, label }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formDate.trim()) {
      setFormError('Title, description and date are required');
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    const payload = {
      worldId,
      title: formTitle,
      description: formDescription,
      dateInWorld: formDate,
      era: formEra,
      importance: formImportance,
      relations: formRelations.map(({ targetType, targetId }) => ({ targetType, targetId }))
    };

    try {
      if (editingEvent) {
        await timelineAPI.update(editingEvent.id, payload);
      } else {
        await timelineAPI.create(payload);
      }
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await timelineAPI.delete(id);
      setSelectedEventId(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const filtered = useMemo(() => {
    const list = activeEra === 'All' ? events : events.filter((e) => e.era === activeEra);
    return [...list].sort((a, b) => a.dateInWorld.localeCompare(b.dateInWorld));
  }, [events, activeEra]);

  const { nodes, edges } = useMemo(() => {
    const xSpacing = 170;
    const yBase = 90;
    const nodes: Node[] = filtered.map((event, i) => {
      const eraIdx = eras.findIndex((e) => e.value === event.era);
      const y = yBase + (eraIdx < 0 ? 0 : eraIdx) * 110;
      return {
        id: event.id,
        type: 'timeline',
        position: { x: 80 + i * xSpacing, y },
        data: {
          label: event.title,
          date: event.dateInWorld,
          importance: event.importance,
          links: event.relations?.length || 0,
          color: eraColor(event.era),
          selected: i === highlightIndex || event.id === selectedEventId
        }
      };
    });

    const edges: Edge[] = [];
    for (let i = 0; i < filtered.length - 1; i++) {
      edges.push({
        id: `seq-${filtered[i].id}`,
        source: filtered[i].id,
        target: filtered[i + 1].id,
        type: 'smoothstep',
        animated: !reduceMotion,
        style: { stroke: '#8d97ab', strokeWidth: 1.5 }
      });
    }
    filtered.forEach((event) => {
      (event.relations || [])
        .filter((rel) => rel.targetType === 'EVENT' && rel.Event)
        .forEach((rel, rIdx) => {
          const detonatorId = rel.Event!.id;
          if (filtered.some((e) => e.id === detonatorId) && detonatorId !== event.id) {
            edges.push({
              id: `det-${event.id}-${rIdx}`,
              source: detonatorId,
              target: event.id,
              type: 'smoothstep',
              animated: !reduceMotion,
              style: { stroke: REL_META.EVENT.color, strokeWidth: 1.6, strokeDasharray: '6 4' }
            });
          }
        });
    });
    return { nodes, edges };
  }, [filtered, highlightIndex, selectedEventId, reduceMotion]);

  const flow = useDraggableNodes(nodes);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  const advance = useCallback(() => {
    setHighlightIndex((prev) => {
      const next = prev + 1 >= filtered.length ? 0 : prev + 1;
      const event = filtered[next];
      if (event) {
        const node = getNode(event.id);
        if (node) setCenter(node.position.x, node.position.y, { zoom: 1.1, duration: 800 });
      }
      return next;
    });
  }, [filtered, setCenter, getNode]);

  useEffect(() => {
    if (!isPlaying || reduceMotion) return;
    timerRef.current = setInterval(advance, 1400);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, advance, reduceMotion]);

  const filteredOptions = useMemo(() => {
    const q = linkSearch.toLowerCase();
    const filter = (list: { id: string; name: string }[]) => (q ? list.filter((x) => x.name.toLowerCase().includes(q)) : list);
    return { bestiary: filter(linkOptions.bestiary), characters: filter(linkOptions.characters), nations: filter(linkOptions.nations) };
  }, [linkOptions, linkSearch]);

  const linkSections: { type: FormRelation['targetType']; titleKey: string; options: { id: string; name: string }[] }[] = [
    { type: 'BESTIARY', titleKey: 'linkCreatures', options: filteredOptions.bestiary },
    { type: 'CHARACTER', titleKey: 'linkCharacters', options: filteredOptions.characters },
    { type: 'NATION', titleKey: 'linkNations', options: filteredOptions.nations }
  ];

  const detonatorOptions = useMemo(() => {
    const excludeId = editingEvent?.id;
    const q = linkSearch.toLowerCase();
    let list = events.filter((e) => e.id !== excludeId);
    if (q) list = list.filter((e) => e.title.toLowerCase().includes(q));
    return [...list].sort((a, b) => a.dateInWorld.localeCompare(b.dateInWorld));
  }, [events, editingEvent, linkSearch]);

  const renderLinkedGroup = (type: Exclude<FormRelation['targetType'], 'EVENT'>) => {
    const rels = (selectedEvent?.relations || []).filter((r) => r.targetType === type);
    if (rels.length === 0) return null;
    const meta = REL_META[type];
    const Icon = meta.icon;
    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: meta.color }}>
          {t(`simulators.timeline.${type === 'BESTIARY' ? 'linkedCreatures' : type === 'CHARACTER' ? 'linkedCharacters' : 'linkedNations'}`)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {rels.map((r) => (
            <span key={r.id || r.targetId} className="flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs" style={{ borderColor: `${meta.color}44`, backgroundColor: `${meta.color}14`, color: 'var(--text-primary)' }}>
              <Icon className="w-3 h-3" style={{ color: meta.color }} />
              {relationName(r)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderDetonators = () => {
    const rels = (selectedEvent?.relations || []).filter((r) => r.targetType === 'EVENT' && r.Event);
    if (rels.length === 0) return null;
    const meta = REL_META.EVENT;
    return (
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: meta.color }}>
          <Zap className="w-3.5 h-3.5" /> {t('simulators.timeline.detonators')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {rels.map((r) => (
            <button
              key={r.id || r.targetId}
              onClick={() => setSelectedEventId(r.Event!.id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-colors hover:border-midnight-500"
              style={{ borderColor: `${meta.color}44`, backgroundColor: `${meta.color}14`, color: 'var(--text-primary)' }}
            >
              <Zap className="w-3 h-3" style={{ color: meta.color }} />
              {r.Event!.title}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Scroll className="w-8 h-8 text-yellow-400" />
            {t('simulators.timeline.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> {t('simulators.timeline.addEvent')}
        </Button>
      </div>

      <VisualizerToolbar
        isPlaying={isPlaying}
        onPlayToggle={() => setIsPlaying((p) => !p)}
        eras={[{ value: 'All', label: 'All' }, ...eras]}
        activeEra={activeEra}
        onEraChange={(era) => { setActiveEra(era); setHighlightIndex(-1); }}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView()}
      />

      <Legend
        items={eras.map((e) => ({ label: e.label, dotStyle: { backgroundColor: e.color } }))}
        title={t('simulators.timeline.legend')}
      />

      {isLoading ? (
        <Card className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Scroll className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('simulators.timeline.empty')}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.emptyDesc')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <Card className="overflow-hidden">
            <div className="h-[520px]">
              <ReactFlow
                nodes={flow.nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={flow.onNodesChange}
                fitView
                minZoom={0.4}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                nodesConnectable={false}
                elementsSelectable
                onNodeClick={(_, node) => setSelectedEventId(node.id)}
                onPaneClick={() => setSelectedEventId(null)}
              >
                <Background color="#8d97ab" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold" style={{ color: 'var(--text-primary)' }}>{t('simulators.timeline.details')}</span>
                {selectedEvent && (
                  <button onClick={() => setSelectedEventId(null)} className="p-1 rounded hover:bg-midnight-700" style={{ color: 'var(--text-secondary)' }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selectedEvent ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-serif font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEvent.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${eraColor(selectedEvent.era)}22`, color: eraColor(selectedEvent.era) }}>
                      {eras.find((e) => e.value === selectedEvent.era)?.label || selectedEvent.era}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CalendarDays className="w-4 h-4 text-midnight-300" /> {selectedEvent.dateInWorld}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-3 rounded-full"
                        style={{ backgroundColor: i < selectedEvent.importance ? eraColor(selectedEvent.era) : 'rgba(148, 163, 184, 0.2)' }}
                      />
                    ))}
                    <span className="ml-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{selectedEvent.importance}/10</span>
                  </div>
                  {selectedEvent.description && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {selectedEvent.description}
                    </p>
                  )}
                  <div className="space-y-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                    {renderDetonators()}
                    {renderLinkedGroup('BESTIARY')}
                    {renderLinkedGroup('CHARACTER')}
                    {renderLinkedGroup('NATION')}
                    {(!selectedEvent.relations || selectedEvent.relations.length === 0) && (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.noLinks')}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={() => openEditModal(selectedEvent)}>
                      <Edit2 className="w-3 h-3 mr-1.5" /> {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(selectedEvent.id)}>
                      <Trash2 className="w-3 h-3 mr-1.5" /> {t('common.delete')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('simulators.timeline.selectHint')}
                  </p>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Link2 className="w-3.5 h-3.5 text-midnight-300" /> {t('simulators.timeline.dragHint')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Modal */}
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
                  {editingEvent ? t('simulators.timeline.editEvent') : t('simulators.timeline.addNewEvent')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                  {/* Left column: fields + links */}
                  <div className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    <Input
                      label={t('simulators.timeline.eventTitle')}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={t('simulators.timeline.eventTitlePlaceholder')}
                      required
                    />

                    <Input
                      label={t('simulators.timeline.eventDate')}
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder={t('simulators.timeline.eventDatePlaceholder')}
                      required
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.era')}</label>
                      <div className="grid grid-cols-5 gap-2">
                        {eras.map((era) => (
                          <button
                            type="button"
                            key={era.value}
                            onClick={() => setFormEra(era.value)}
                            className={`flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-xl border transition-all ${
                              formEra === era.value
                                ? 'border-burnt-500 bg-burnt-500/10 ring-1 ring-burnt-500'
                                : 'border-midnight-600 bg-midnight-700/60 hover:border-midnight-500 hover:bg-midnight-700'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: era.color }} />
                            <span className="text-[11px] leading-tight text-center text-parchment-300">{era.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.importance')}</label>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formImportance}/10</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={formImportance}
                        onChange={(e) => setFormImportance(Number(e.target.value))}
                        className="w-full accent-burnt-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.eventDesc')}</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder={t('simulators.timeline.eventDescPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                        required
                      />
                    </div>

                    {/* Link pickers */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-burnt-400" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulators.timeline.links')}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.linksHint')}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                        <Input
                          placeholder={t('simulators.timeline.searchLinks')}
                          value={linkSearch}
                          onChange={(e) => setLinkSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {linkSections.map((section) => {
                        const meta = REL_META[section.type];
                        const Icon = meta.icon;
                        const selectedIds = formRelations.filter((r) => r.targetType === section.type).map((r) => r.targetId);
                        return (
                          <div key={section.type}>
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: meta.color }}>
                              <Icon className="w-3.5 h-3.5" /> {t(`simulators.timeline.${section.titleKey}`)}
                            </p>
                            {section.options.length === 0 ? (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.noSearchResults')}</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {section.options.map((opt) => {
                                  const active = selectedIds.includes(opt.id);
                                  return (
                                    <button
                                      type="button"
                                      key={opt.id}
                                      onClick={() => toggleRelation(section.type, opt.id, opt.name)}
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

                      {/* Detonators */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Zap className="w-3.5 h-3.5" style={{ color: REL_META.EVENT.color }} />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: REL_META.EVENT.color }}>{t('simulators.timeline.detonators')}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.detonatorsHint')}</p>
                          </div>
                        </div>
                        {detonatorOptions.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.timeline.noSearchResults')}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {detonatorOptions.map((opt) => {
                              const active = formRelations.some((r) => r.targetType === 'EVENT' && r.targetId === opt.id);
                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => toggleRelation('EVENT', opt.id, opt.title)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                                    active
                                      ? 'border-burnt-500 bg-burnt-500/20 text-parchment-100'
                                      : 'bg-midnight-700 border-midnight-600 text-parchment-300 hover:border-midnight-500'
                                  }`}
                                >
                                  {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: REL_META.EVENT.color }} />}
                                  <Zap className="w-3 h-3" style={{ color: REL_META.EVENT.color }} />
                                  <span>{opt.title}</span>
                                  <span className="text-[10px] text-parchment-500">{opt.dateInWorld}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right column: summary */}
                  <div className="lg:sticky lg:top-0 self-start">
                    <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-burnt-400" />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulators.timeline.details')}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formTitle || t('simulators.timeline.eventTitlePlaceholder')}</p>
                        <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          <CalendarDays className="w-3.5 h-3.5" /> {formDate || '—'}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${eraColor(formEra)}22`, color: eraColor(formEra) }}>
                          {eras.find((e) => e.value === formEra)?.label || formEra}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className="h-1.5 w-3 rounded-full" style={{ backgroundColor: i < formImportance ? eraColor(formEra) : 'rgba(148, 163, 184, 0.2)' }} />
                          ))}
                        </div>
                        {formRelations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {formRelations.map((r) => {
                              const meta = REL_META[r.targetType];
                              const Icon = meta.icon;
                              return (
                                <span key={`${r.targetType}-${r.targetId}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: `${meta.color}44`, backgroundColor: `${meta.color}14`, color: 'var(--text-primary)' }}>
                                  <Icon className="w-3 h-3" style={{ color: meta.color }} /> {r.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingEvent ? t('simulators.timeline.saveEventBtn') : t('simulators.timeline.addEventBtn')}
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
