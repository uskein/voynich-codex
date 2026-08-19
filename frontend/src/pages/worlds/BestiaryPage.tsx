import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Swords, Plus, Search, X, Trash2, Edit2, Image as ImageIcon, MapPin, Wand2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BestiarySimulator } from '../../components/visualizers/BestiarySimulator';
import { CreatureVisualizer } from '../../components/visualizers/CreatureVisualizer';
import { SPECIES_LIST, DANGER_LIST, HABITAT_SUGGESTIONS } from '../../lib/creatureVisuals';
import { bestiaryAPI, geographyAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { prefersReducedMotion } from '../../lib/motion';
import { useDraggableNodes } from '../../lib/useDraggableNodes';

interface Creature {
  id: string;
  name: string;
  species: string;
  description?: string;
  habitat?: string;
  dangerLevel: string;
  imageUrl?: string;
  images: { id: string; url: string; alt?: string; caption?: string }[];
  region?: { id: string; name: string };
  regionId?: string;
}

interface Region {
  id: string;
  name: string;
}

const dangerLevels = [
  { value: 'INOFENSIVA', label: 'Harmless', color: 'bg-green-500/20 text-green-400' },
  { value: 'BAJA', label: 'Low', color: 'bg-green-500/20 text-green-400' },
  { value: 'MEDIA', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'ALTA', label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'MORTAL', label: 'Mortal', color: 'bg-red-500/20 text-red-400' }
];

const REGION_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf', '#fb923c', '#22d3ee', '#f97316'];

const DANGER_HEX: Record<string, string> = {
  INOFENSIVA: '#4ade80',
  BAJA: '#4ade80',
  MEDIA: '#facc15',
  ALTA: '#fb923c',
  MORTAL: '#f87171'
};

function RegionNode({ data }: NodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 select-none relative"
      style={{ borderColor: `${data.color}66`, backgroundColor: '#1c1917f0', boxShadow: `0 0 20px ${data.color}33` }}
    >
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !rounded-full !bg-midnight-400 !border !border-midnight-500" />
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5" style={{ color: data.color }} />
        {typeof data.count === 'number' && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${data.color}22`, color: data.color }}>
            {data.count}
          </span>
        )}
      </div>
      <p className="font-serif font-semibold text-parchment-100 text-center text-sm max-w-[130px]">{data.label}</p>
    </motion.div>
  );
}

function CreatureNode({ data, selected }: NodeProps) {
  const danger = DANGER_HEX[data.danger] || '#8d97ab';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border select-none cursor-pointer transition-all relative ${
        selected ? 'bg-midnight-700' : 'border-midnight-600 bg-midnight-800'
      }`}
      style={{ boxShadow: selected ? `0 0 14px ${danger}` : undefined, borderColor: selected ? danger : undefined }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !rounded-full !bg-midnight-400 !border !border-midnight-500" />
      {data.image ? (
        <img src={data.image} alt={data.label} className="w-8 h-8 rounded-full object-cover border-2 shrink-0" style={{ borderColor: danger }} />
      ) : (
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: `${danger}22`, color: danger }}>
          {data.initial}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-parchment-100 truncate">{data.label}</p>
        {data.subtitle && <p className="text-[10px] text-parchment-400 truncate">{data.subtitle}</p>}
      </div>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 ml-1" style={{ backgroundColor: danger }} />
    </motion.div>
  );
}

const nodeTypes = { region: RegionNode, creature: CreatureNode };

export function BestiaryPage() {
  return (
    <ReactFlowProvider>
      <BestiaryContent />
    </ReactFlowProvider>
  );
}

function BestiaryContent() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDanger, setFilterDanger] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'simulator' | 'graph'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreature, setEditingCreature] = useState<Creature | null>(null);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const reduceMotion = prefersReducedMotion();

  // Form state
  const [formName, setFormName] = useState('');
  const [formSpecies, setFormSpecies] = useState('ANIMAL');
  const [formDescription, setFormDescription] = useState('');
  const [formHabitat, setFormHabitat] = useState('');
  const [formDangerLevel, setFormDangerLevel] = useState('MEDIA');
  const [formRegionId, setFormRegionId] = useState('');
  const [formImages, setFormImages] = useState<{ url: string; alt?: string; id?: string; caption?: string }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [worldId]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const loadData = async () => {
    if (!worldId) return;
    try {
      const [creaturesRes, regionsRes] = await Promise.all([
        bestiaryAPI.list(worldId),
        geographyAPI.listRegions(worldId)
      ]);
      setCreatures(creaturesRes.data.entries || []);
      setRegions(regionsRes.data.regions || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCreature(null);
    setFormName('');
    setFormSpecies('ANIMAL');
    setFormDescription('');
    setFormHabitat('');
    setFormDangerLevel('MEDIA');
    setFormRegionId('');
    setFormImages([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (creature: Creature) => {
    setEditingCreature(creature);
    setFormName(creature.name);
    setFormSpecies(creature.species);
    setFormDescription(creature.description || '');
    setFormHabitat(creature.habitat || '');
    setFormDangerLevel(creature.dangerLevel);
    setFormRegionId(creature.regionId || '');
    setFormImages(creature.images || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setFormImages([...formImages, { url: newImageUrl, alt: newImageAlt || undefined }]);
    setNewImageUrl('');
    setNewImageAlt('');
  };

  const removeImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormImages([...formImages, { url: dataUrl, alt: file.name }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) {
      setFormError('Name and description are required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      worldId,
      name: formName,
      species: formSpecies,
      description: formDescription,
      habitat: formHabitat || undefined,
      dangerLevel: formDangerLevel,
      regionId: formRegionId || undefined,
      images: formImages
    };

    try {
      if (editingCreature) {
        await bestiaryAPI.update(editingCreature.id, payload);
      } else {
        await bestiaryAPI.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save creature');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this creature?')) return;
    try {
      await bestiaryAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete creature:', error);
    }
  };

  const getDangerStyle = (level: string) => {
    const found = dangerLevels.find(d => d.value === level);
    return found?.color || 'bg-gray-500/20 text-gray-400';
  };

  const getDangerLabel = (level: string) => {
    const found = dangerLevels.find(d => d.value === level);
    return found?.label || level;
  };

  const filteredCreatures = creatures.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.species.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDanger = filterDanger === 'All' || c.dangerLevel === filterDanger;
    return matchesSearch && matchesDanger;
  });

  const { nodes, edges } = useMemo(() => {
    const groups: { regionId: string; label: string; creatures: Creature[] }[] = [
      ...regions.map((r) => ({ regionId: r.id, label: r.name, creatures: [] as Creature[] }))
    ];
    const independent: Creature[] = [];
    filteredCreatures.forEach((c) => {
      const group = groups.find((g) => g.regionId === c.regionId);
      if (group) group.creatures.push(c);
      else independent.push(c);
    });
    if (independent.length > 0) groups.push({ regionId: 'unassigned', label: t('bestiary.unassigned'), creatures: independent });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    groups.forEach((group, i) => {
      const color = group.regionId === 'unassigned' ? '#8d97ab' : REGION_COLORS[i % REGION_COLORS.length];
      const cx = 120 + i * 260 + 100;
      nodes.push({
        id: `region-${group.regionId}`,
        type: 'region',
        position: { x: 120 + i * 260, y: 40 },
        data: { label: group.label, count: group.creatures.length, color }
      });
      const radius = Math.max(120, 80 + group.creatures.length * 8);
      group.creatures.forEach((ch, j) => {
        const angle = (j / Math.max(1, group.creatures.length)) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
          id: `creature-${ch.id}`,
          type: 'creature',
          position: { x: cx + Math.cos(angle) * radius, y: 200 + Math.sin(angle) * radius },
          data: {
            label: ch.name,
            subtitle: ch.species,
            initial: ch.name.charAt(0).toUpperCase(),
            image: ch.images?.[0]?.url || ch.imageUrl,
            danger: ch.dangerLevel,
            color
          }
        });
        edges.push({
          id: `r-${group.regionId}-${ch.id}`,
          source: `region-${group.regionId}`,
          target: `creature-${ch.id}`,
          type: 'smoothstep',
          animated: !reduceMotion && group.regionId !== 'unassigned',
          style: { stroke: color, strokeWidth: 1.4 }
        });
      });
    });
    return { nodes, edges };
  }, [filteredCreatures, regions, reduceMotion, t]);

  const selectedCreature = useMemo(() => {
    if (!selectedCreatureId) return null;
    return creatures.find((c) => c.id === selectedCreatureId) || null;
  }, [selectedCreatureId, creatures]);

  const flow = useDraggableNodes(nodes);

  const previewCreature = {
    id: 'preview',
    name: formName || t('bestiary.previewName'),
    species: formSpecies,
    dangerLevel: formDangerLevel,
    habitat: formHabitat,
    region: regions.find((r) => r.id === formRegionId),
    description: formDescription,
    images: formImages.length > 0 ? formImages : undefined
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Swords className="w-8 h-8 text-red-400" />
            {t('bestiary.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> {t('bestiary.addCreature')}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
          <Input
            placeholder={t('bestiary.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['All', ...dangerLevels.map(d => d.value)].map(level => (
            <Button
              key={level}
              variant={filterDanger === level ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterDanger(level)}
            >
              {level === 'All' ? 'All' : getDangerLabel(level)}
            </Button>
          ))}
          <div className="w-px bg-midnight-700 mx-1" />
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('list')}
          >
            {t('bestiary.viewList')}
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'simulator' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('simulator')}
          >
            {t('bestiary.viewSimulator')}
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'graph' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('graph')}
          >
            {t('bestiary.viewGraph')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredCreatures.length === 0 ? (
        <Card className="p-12 text-center">
          <Swords className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('bestiary.noCreatures')}</h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.noCreaturesDesc')}</p>
          <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> {t('bestiary.addFirstCreature')}</Button>
        </Card>
      ) : viewMode === 'simulator' ? (
        <BestiarySimulator creatures={filteredCreatures} />
      ) : viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <Card className="overflow-hidden">
            <div className="h-[540px]">
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
                onNodeClick={(_, node) => {
                  if (node.id.startsWith('creature-')) setSelectedCreatureId(node.id.replace('creature-', ''));
                }}
                onPaneClick={() => setSelectedCreatureId(null)}
              >
                <Background color="#8d97ab" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </Card>
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold" style={{ color: 'var(--text-primary)' }}>{t('bestiary.details')}</span>
                {selectedCreature && (
                  <button onClick={() => setSelectedCreatureId(null)} className="p-1 rounded hover:bg-midnight-700" style={{ color: 'var(--text-secondary)' }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selectedCreature ? (
                <>
                  <CreatureVisualizer creature={selectedCreature} size="sm" showDangerMeter showMeta={false} />
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {selectedCreature.description || '—'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedCreature.habitat && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-midnight-300" /> {selectedCreature.habitat}
                      </span>
                    )}
                    {selectedCreature.region && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-midnight-300" /> {selectedCreature.region.name}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEditModal(selectedCreature)}>
                      <Edit2 className="w-3 h-3 mr-1.5" /> {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(selectedCreature.id)}>
                      <Trash2 className="w-3 h-3 mr-1.5" /> {t('common.delete')}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('bestiary.graphHint')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCreatures.map((creature, i) => (
            <motion.div
              key={creature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="hover" className="h-full">
                <div className="aspect-[16/9] bg-midnight-700 rounded-t-xl overflow-hidden relative">
                  {creature.images && creature.images.length > 0 ? (
                    <img src={creature.images[0].url} alt={creature.name} className="w-full h-full object-cover" />
                  ) : creature.imageUrl ? (
                    <img src={creature.imageUrl} alt={creature.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Swords className="w-12 h-12 text-midnight-600" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => openEditModal(creature)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-midnight-700 text-parchment-300">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(creature.id)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-red-500/80 text-parchment-300 hover:text-white">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {creature.images && creature.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-midnight-800/80 rounded text-xs text-parchment-300">
                      +{creature.images.length - 1} images
                    </div>
                  )}
                </div>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-parchment-100">{creature.name}</h3>
                      <p className="text-sm text-parchment-400">{creature.species}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getDangerStyle(creature.dangerLevel)}`}>
                      {getDangerLabel(creature.dangerLevel)}
                    </span>
                  </div>
                  {creature.description && (
                    <p className="text-xs text-parchment-400 line-clamp-2 mt-2">{creature.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-parchment-500">
                    {creature.habitat && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {creature.habitat}
                      </span>
                    )}
                    {creature.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {creature.region.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
                  {editingCreature ? t('bestiary.editCreature') : t('bestiary.addNewCreature')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                  {/* Left column: fields */}
                  <div className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    <Input
                      label={t('bestiary.name')}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t('bestiary.namePlaceholder')}
                      required
                    />

                    {/* Species visual picker */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.species')}</label>
                      <div className="grid grid-cols-5 gap-2">
                        {SPECIES_LIST.map(({ value, meta }) => (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setFormSpecies(value)}
                            className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border transition-all ${
                              formSpecies === value
                                ? 'border-burnt-500 bg-burnt-500/10 ring-1 ring-burnt-500'
                                : 'border-midnight-600 bg-midnight-700/60 hover:border-midnight-500 hover:bg-midnight-700'
                            }`}
                          >
                            <meta.icon className={`w-5 h-5 ${meta.color}`} />
                            <span className="text-[11px] leading-tight text-center text-parchment-300">{meta.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Danger segmented gauge */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.dangerLevel')}</label>
                      <div className="flex gap-1.5">
                        {DANGER_LIST.map(({ value, meta }) => (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setFormDangerLevel(value)}
                            className={`flex-1 flex flex-col items-center gap-1.5 px-1 py-2 rounded-xl border transition-all ${
                              formDangerLevel === value
                                ? 'border-midnight-500 ring-2 ring-burnt-500'
                                : 'border-midnight-700 hover:border-midnight-500'
                            }`}
                          >
                            <span className={`h-1.5 w-8 rounded-full ${meta.bar}`} />
                            <span className={`text-[11px] font-medium ${meta.text}`}>{meta.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        label={t('bestiary.habitat')}
                        value={formHabitat}
                        onChange={(e) => setFormHabitat(e.target.value)}
                        placeholder={t('bestiary.habitatPlaceholder')}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {HABITAT_SUGGESTIONS.map((h) => (
                          <button
                            type="button"
                            key={h}
                            onClick={() => setFormHabitat(h)}
                            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                              formHabitat === h
                                ? 'bg-burnt-500/20 border-burnt-500 text-burnt-400'
                                : 'bg-midnight-700 border-midnight-600 text-parchment-300 hover:border-midnight-500'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.region')}</label>
                      <select
                        value={formRegionId}
                        onChange={(e) => setFormRegionId(e.target.value)}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                      >
                        <option value="">{t('bestiary.noRegion')}</option>
                        {regions.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.description')}</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder={t('bestiary.descriptionPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                        required
                      />
                    </div>

                    {/* Images section */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.images')}</label>
                      {formImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {formImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img src={img.url} alt={img.alt} className="w-full h-20 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('bestiary.imageUrlPlaceholder')}
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                        />
                        <Input
                          placeholder={t('bestiary.altTextPlaceholder')}
                          value={newImageAlt}
                          onChange={(e) => setNewImageAlt(e.target.value)}
                        />
                        <Button type="button" variant="secondary" onClick={addImage} disabled={!newImageUrl.trim()}>
                          <ImageIcon className="w-4 h-4" /> {t('bestiary.addImageBtn')}
                        </Button>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                      <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                        <ImageIcon className="w-4 h-4 mr-2" /> {t('bestiary.uploadImage')}
                      </Button>
                    </div>
                  </div>

                  {/* Right column: live preview */}
                  <div className="lg:sticky lg:top-0 self-start">
                    <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-burnt-400" />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('bestiary.livePreview')}</span>
                      </div>
                      <CreatureVisualizer
                        creature={previewCreature}
                        size="md"
                        showDangerMeter
                        showMeta={false}
                      />
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('bestiary.livePreviewHint')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingCreature ? t('common.save') : t('bestiary.addCreatureBtn')}
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
