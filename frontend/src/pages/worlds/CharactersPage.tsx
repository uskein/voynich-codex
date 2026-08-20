import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Users, Plus, Search, Landmark, X, Edit2, Trash2, Wand2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { characterAPI, nationsAPI, geographyAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { prefersReducedMotion } from '../../lib/motion';
import { useDraggableNodes } from '../../lib/useDraggableNodes';

interface CharacterImage {
  id?: string;
  url: string;
  alt?: string;
  caption?: string;
  order?: number;
}

interface Character {
  id: string;
  name: string;
  role?: string;
  title?: string;
  biography?: string;
  origin?: string;
  nationId?: string;
  nation?: { id: string; name: string } | null;
  region?: { id: string; name: string } | null;
  images?: CharacterImage[];
}

interface Nation {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

const NATION_COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf', '#fb923c', '#f97316', '#22d3ee'];

function CharacterNode({ data, selected }: NodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border select-none cursor-pointer transition-all relative ${
        selected ? 'bg-midnight-700' : 'border-midnight-600 bg-midnight-800'
      }`}
      style={{ boxShadow: selected ? `0 0 14px ${data.color}` : undefined, borderColor: data.color ? (selected ? data.color : undefined) : undefined }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !rounded-full !bg-midnight-400 !border !border-midnight-500" />
      {data.image ? (
        <img src={data.image} alt={data.label} className="w-8 h-8 rounded-full object-cover border-2 shrink-0" style={{ borderColor: data.color || '#f97316' }} />
      ) : (
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: `${data.color || '#f97316'}22`, color: data.color || '#f97316' }}>
          {data.initial}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-parchment-100 truncate">{data.label}</p>
        {data.subtitle && <p className="text-[10px] text-parchment-400 truncate">{data.subtitle}</p>}
      </div>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 ml-1" style={{ backgroundColor: data.color || '#8d97ab' }} />
    </motion.div>
  );
}

function NationNode({ data }: NodeProps) {
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
        <Landmark className="w-5 h-5" style={{ color: data.color }} />
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

const nodeTypes = { character: CharacterNode, nation: NationNode };

export function CharactersPage() {
  return (
    <ReactFlowProvider>
      <CharactersFlow />
    </ReactFlowProvider>
  );
}

function CharactersFlow() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formBiography, setFormBiography] = useState('');
  const [formPsychology, setFormPsychology] = useState('');
  const [formNationId, setFormNationId] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formImages, setFormImages] = useState<CharacterImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reduceMotion = prefersReducedMotion();

  useEffect(() => {
    if (!worldId) return;
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
      const [charRes, natRes, regRes] = await Promise.all([
        characterAPI.list(worldId),
        nationsAPI.list(worldId),
        geographyAPI.listRegions(worldId)
      ]);
      setCharacters(charRes.data.characters || []);
      setNations(natRes.data.nations || []);
      setRegions(regRes.data.regions || []);
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCharacter(null);
    setFormName('');
    setFormTitle('');
    setFormRole('');
    setFormOrigin('');
    setFormBiography('');
    setFormPsychology('');
    setFormNationId('');
    setFormRegionId('');
    setFormImages([]);
    setNewImageUrl('');
    setNewImageAlt('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (character: Character) => {
    setEditingCharacter(character);
    setFormName(character.name);
    setFormTitle(character.title || '');
    setFormRole(character.role || '');
    setFormOrigin(character.origin || '');
    setFormBiography(character.biography || '');
    setFormPsychology('');
    setFormNationId(character.nationId || '');
    setFormRegionId(character.region?.id || '');
    setFormImages(character.images?.map((img) => ({ ...img })) || []);
    setNewImageUrl('');
    setNewImageAlt('');
    setFormError('');
    setIsModalOpen(true);
  };

  const addImageFromUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setFormImages((prev) => [...prev, { url, alt: newImageAlt.trim() || undefined, order: prev.length }]);
    setNewImageUrl('');
    setNewImageAlt('');
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setFormImages((prev) => [...prev, { url, alt: file.name || undefined, order: prev.length }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBiography.trim()) {
      setFormError('Name and biography are required');
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    const payload = {
      worldId,
      name: formName,
      title: formTitle || undefined,
      role: formRole || undefined,
      origin: formOrigin || undefined,
      biography: formBiography,
      psychology: formPsychology || undefined,
      nationId: formNationId || undefined,
      regionId: formRegionId || undefined,
      images: formImages.map((img) => ({ url: img.url, alt: img.alt, order: img.order }))
    };

    try {
      if (editingCharacter) {
        await characterAPI.update(editingCharacter.id, payload);
      } else {
        await characterAPI.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save character');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this character?')) return;
    try {
      await characterAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete character:', error);
    }
  };

  const previewCharacter = {
    name: formName || t('simulators.characters.previewName'),
    title: formTitle,
    role: formRole,
    origin: formOrigin,
    biography: formBiography,
    nation: nations.find((n) => n.id === formNationId),
    region: regions.find((r) => r.id === formRegionId),
    image: formImages[0]?.url
  };

  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { nodes, edges } = useMemo(() => {
    const groups: { nationId: string; label: string; chars: Character[] }[] = [
      ...nations.map((n) => ({ nationId: n.id, label: n.name, chars: [] as Character[] }))
    ];
    const independent: Character[] = [];
    filteredCharacters.forEach((c) => {
      const group = groups.find((g) => g.nationId === c.nationId);
      if (group) group.chars.push(c);
      else independent.push(c);
    });
    if (independent.length > 0) groups.push({ nationId: 'independent', label: 'Independiente', chars: independent });

    const nationX = 200;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    groups.forEach((group, i) => {
      const color = group.nationId === 'independent' ? '#8d97ab' : NATION_COLORS[i % NATION_COLORS.length];
      const cx = 80 + i * nationX + 90;
      const cy = 40;
      nodes.push({
        id: `nation-${group.nationId}`,
        type: 'nation',
        position: { x: 80 + i * nationX, y: cy },
        data: { label: group.label, count: group.chars.length, color }
      });
      const radius = Math.max(120, 80 + group.chars.length * 8);
      group.chars.forEach((ch, j) => {
        const angle = (j / Math.max(1, group.chars.length)) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
          id: `char-${ch.id}`,
          type: 'character',
          position: { x: cx + Math.cos(angle) * radius, y: 180 + Math.sin(angle) * radius },
          data: {
            label: ch.name,
            subtitle: ch.region?.name || ch.role || undefined,
            initial: ch.name.charAt(0).toUpperCase(),
            image: ch.images?.[0]?.url,
            color
          }
        });
        edges.push({
          id: `n-${group.nationId}-${ch.id}`,
          source: `nation-${group.nationId}`,
          target: `char-${ch.id}`,
          type: 'smoothstep',
          animated: !reduceMotion && group.nationId !== 'independent',
          style: { stroke: color, strokeWidth: 1.4 }
        });
      });
    });
    return { nodes, edges };
  }, [filteredCharacters, nations, reduceMotion]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const ch = characters.find((c) => c.id === selectedId);
    if (!ch) return null;
    return {
      title: ch.name,
      meta: [ch.title, ch.role, ch.nation?.name, ch.region?.name, ch.origin].filter(Boolean).join(' · '),
      body: ch.biography || '',
      image: ch.images?.[0]?.url
    };
  }, [selectedId, characters]);

  const flow = useDraggableNodes(nodes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-parchment-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            {t('simulators.characters.title')}
          </h1>
          <p className="text-parchment-400 mt-1">{t('simulators.characters.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> {t('simulators.characters.add')}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
          <Input
            placeholder={t('simulators.characters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={viewMode === 'list' ? 'primary' : 'secondary'} onClick={() => setViewMode('list')}>
            {t('simulators.characters.viewList')}
          </Button>
          <Button size="sm" variant={viewMode === 'graph' ? 'primary' : 'secondary'} onClick={() => setViewMode('graph')}>
            {t('simulators.characters.viewGraph')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredCharacters.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-parchment-100 mb-2">{t('simulators.characters.empty')}</h3>
          <p className="text-parchment-400 mb-6">{t('simulators.characters.emptyDesc')}</p>
          <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> {t('simulators.characters.add')}</Button>
        </Card>
      ) : viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
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
                  if (node.id.startsWith('char-')) setSelectedId(node.id.replace('char-', ''));
                }}
                onPaneClick={() => setSelectedId(null)}
              >
                <Background color="#8d97ab" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </Card>
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-parchment-100">{t('simulators.characters.details')}</span>
                {selected && (
                  <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-midnight-700" style={{ color: 'var(--text-secondary)' }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selected ? (
                <>
                  <div className="flex items-center gap-3">
                    {selected.image && (
                      <img src={selected.image} alt={selected.title} className="w-12 h-12 rounded-full object-cover border-2 border-burnt-500/40 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-parchment-100">{selected.title}</p>
                      <p className="text-xs text-parchment-400">{selected.meta}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-parchment-400">{selected.body || t('simulators.characters.noBio')}</p>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('simulators.characters.selectHint')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCharacters.map((character, i) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="hover" className="h-full">
                <div className="aspect-square bg-midnight-700 rounded-t-xl overflow-hidden flex items-center justify-center relative">
                  {character.images?.[0]?.url ? (
                    <img src={character.images[0].url} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-serif font-bold bg-burnt-500/20 text-burnt-400">
                      {character.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => openEditModal(character)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-midnight-700 text-parchment-300">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(character.id)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-red-500/80 text-parchment-300 hover:text-white">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <CardContent>
                  <h3 className="font-serif font-bold text-parchment-100 truncate">{character.name}</h3>
                  <p className="text-sm text-parchment-400">{character.role || character.title || '—'}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {character.nation && (
                      <span className="px-2 py-0.5 bg-midnight-600 text-parchment-300 text-xs rounded-full">
                        {character.nation.name}
                      </span>
                    )}
                    {character.region && (
                      <span className="px-2 py-0.5 bg-midnight-600 text-parchment-300 text-xs rounded-full">
                        {character.region.name}
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
              className="w-full max-w-4xl bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingCharacter ? t('simulators.characters.edit') : t('simulators.characters.new')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                  {/* Left column: fields */}
                  <div className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    <Input
                      label={t('simulators.characters.name')}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t('simulators.characters.namePlaceholder')}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('simulators.characters.role')}
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        placeholder={t('simulators.characters.rolePlaceholder')}
                      />
                      <Input
                        label={t('simulators.characters.title')}
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder={t('simulators.characters.titlePlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('simulators.characters.origin')}
                        value={formOrigin}
                        onChange={(e) => setFormOrigin(e.target.value)}
                        placeholder={t('simulators.characters.originPlaceholder')}
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.characters.nation')}</label>
                        <select
                          value={formNationId}
                          onChange={(e) => setFormNationId(e.target.value)}
                          className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                        >
                          <option value="">{t('simulators.characters.noNation')}</option>
                          {nations.map((n) => (
                            <option key={n.id} value={n.id}>{n.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.characters.region')}</label>
                      <select
                        value={formRegionId}
                        onChange={(e) => setFormRegionId(e.target.value)}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                      >
                        <option value="">{t('simulators.characters.noRegion')}</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.characters.biography')}</label>
                      <textarea
                        value={formBiography}
                        onChange={(e) => setFormBiography(e.target.value)}
                        placeholder={t('simulators.characters.biographyPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.characters.psychology')}</label>
                      <textarea
                        value={formPsychology}
                        onChange={(e) => setFormPsychology(e.target.value)}
                        placeholder={t('simulators.characters.psychologyPlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-burnt-400" />
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('simulators.characters.images')}</label>
                      </div>

                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                      <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        {t('simulators.characters.addImageBtn')}
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder={t('simulators.characters.imageUrlPlaceholder')}
                        />
                        <div className="flex gap-2">
                          <Input
                            value={newImageAlt}
                            onChange={(e) => setNewImageAlt(e.target.value)}
                            placeholder={t('simulators.characters.imageAltPlaceholder')}
                          />
                          <Button type="button" size="sm" variant="secondary" onClick={addImageFromUrl} disabled={!newImageUrl.trim()}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {formImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formImages.map((img, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-midnight-600 group">
                              <img src={img.url} alt={img.alt || 'character'} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormImages((prev) => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-0 right-0 p-0.5 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column: live preview */}
                  <div className="lg:sticky lg:top-0 self-start">
                    <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-burnt-400" />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulators.characters.preview')}</span>
                      </div>
                      <motion.div
                        className="flex flex-col items-center text-center gap-2 py-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      >
                        {previewCharacter.image ? (
                          <motion.img
                            src={previewCharacter.image}
                            alt={previewCharacter.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-burnt-500/40"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                          />
                        ) : (
                          <motion.span
                            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-serif font-bold bg-burnt-500/20 text-burnt-400 border-2 border-burnt-500/40"
                            animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            {previewCharacter.name.charAt(0).toUpperCase()}
                          </motion.span>
                        )}
                        <div>
                          <p className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{previewCharacter.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {[previewCharacter.title, previewCharacter.role].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {previewCharacter.nation && (
                            <span className="px-2 py-0.5 bg-midnight-700 text-parchment-300 text-xs rounded-full">
                              {previewCharacter.nation.name}
                            </span>
                          )}
                          {previewCharacter.region && (
                            <span className="px-2 py-0.5 bg-midnight-700 text-parchment-300 text-xs rounded-full">
                              {previewCharacter.region.name}
                            </span>
                          )}
                        </div>
                        {previewCharacter.biography ? (
                          <p className="text-xs leading-relaxed line-clamp-4 text-parchment-400">
                            {previewCharacter.biography}
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('simulators.characters.previewHint')}</p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingCharacter ? t('common.save') : t('simulators.characters.create')}
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

export default CharactersPage;