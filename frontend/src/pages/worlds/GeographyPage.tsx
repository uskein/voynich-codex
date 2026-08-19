import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Plus, X, Trash2, Edit2, Globe, Waves, Eye, List, GitBranch } from 'lucide-react';
import ReactFlow, { Background, Controls, ReactFlowProvider, Handle, Position, type Node, type Edge, type NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { geographyAPI } from '../../services/api';
import { SeaSimulator, SEA_TONE_KEYS, TONE_LABELS } from '../../components/visualizers/SeaSimulator';
import { ContinentSimulator, CONTINENT_TONE_KEYS, CONTINENT_TONE_LABELS } from '../../components/visualizers/ContinentSimulator';
import { MapSimulator, MAP_TONE_KEYS, MAP_TONE_LABELS } from '../../components/visualizers/MapSimulator';
import { MapCreator } from '../../components/visualizers/MapCreator';
import type { MapLayerData, MapPOI, MapRelief } from '../../components/visualizers/MapSimulator';
import { useI18n } from '../../i18n';
import { useDraggableNodes } from '../../lib/useDraggableNodes';

const ERA_VALUES = ['EDAD_ANTIGUA', 'EDAD_MEDIA', 'EDAD_MODERNA', 'ERA_FUTURA'] as const;

type TabType = 'continents' | 'seas' | 'maps';

interface Continent {
  id: string;
  name: string;
  description?: string;
  climate?: string;
  tone?: string;
  regions: { id: string; name: string }[];
  maps: { id: string; name: string; imageUrl: string }[];
  _count: { regions: number; maps: number };
}

interface Sea {
  id: string;
  name: string;
  description?: string;
  tone?: string;
  maps: { id: string; name: string; imageUrl: string }[];
  _count: { maps: number };
}

interface MapItem {
  id: string;
  name: string;
  era: string;
  imageUrl: string;
  continent?: { id: string; name: string };
  sea?: { id: string; name: string };
  pointsOfInterest?: any;
  layers?: any;
  reliefs?: any;
  tone?: string;
  _count?: { pointsOfInterest?: number; layers?: number };
}

export function GeographyPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { t } = useI18n();

  const eras = useMemo(() => [
    { value: ERA_VALUES[0], label: t('geography.ancientAge') },
    { value: ERA_VALUES[1], label: t('geography.middleAge') },
    { value: ERA_VALUES[2], label: t('geography.modernAge') },
    { value: ERA_VALUES[3], label: t('geography.futureEra') }
  ], [t]);

  const [continents, setContinents] = useState<Continent[]>([]);
  const [seas, setSeas] = useState<Sea[]>([]);
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('maps');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'continent' | 'sea' | 'map'>('map');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedMap, setSelectedMap] = useState<MapItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClimate, setFormClimate] = useState('');
  const [formEra, setFormEra] = useState('EDAD_MEDIA');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formContinentId, setFormContinentId] = useState('');
  const [formSeaId, setFormSeaId] = useState('');
  const [formTone, setFormTone] = useState('ocean');
  const [formToneContinent, setFormToneContinent] = useState('forest');
  const [formToneMap, setFormToneMap] = useState('classic');
  const [formLayers, setFormLayers] = useState<MapLayerData[]>([]);
  const [formPOIs, setFormPOIs] = useState<MapPOI[]>([]);
  const [formReliefs, setFormReliefs] = useState<MapRelief[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [worldId]);

  const loadData = async () => {
    if (!worldId) return;
    try {
      const [continentsRes, seasRes, mapsRes] = await Promise.all([
        geographyAPI.listContinents(worldId),
        geographyAPI.listSeas(worldId),
        geographyAPI.listMaps(worldId)
      ]);
      setContinents(continentsRes.data.continents || []);
      setSeas(seasRes.data.seas || []);
      setMaps(mapsRes.data.maps || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = (type: 'continent' | 'sea' | 'map') => {
    setModalType(type);
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormClimate('');
    setFormEra('EDAD_MEDIA');
    setFormImageUrl('');
    setFormContinentId('');
    setFormSeaId('');
    setFormTone('ocean');
    setFormToneContinent('forest');
    setFormToneMap('classic');
    setFormLayers([]);
    setFormPOIs([]);
    setFormReliefs([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (type: 'continent' | 'sea' | 'map', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormName(item.name || '');
    setFormDescription(item.description || '');
    setFormClimate(item.climate || '');
    setFormEra(item.era || 'EDAD_MEDIA');
    setFormImageUrl(item.imageUrl || '');
    setFormContinentId(item.continentId || '');
    setFormSeaId(item.seaId || '');
    setFormTone(item.tone || 'ocean');
    setFormToneContinent(item.tone || 'forest');
    setFormToneMap(item.tone || 'classic');
    setFormLayers(item.layers || []);
    setFormPOIs(item.pointsOfInterest || []);
    setFormReliefs(item.reliefs || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalType === 'continent') {
        const payload = {
          worldId,
          name: formName,
          description: formDescription || undefined,
          climate: formClimate || undefined,
          tone: formToneContinent
        };
        if (editingItem) {
          await geographyAPI.updateContinent(editingItem.id, payload);
        } else {
          await geographyAPI.createContinent(payload);
        }
      } else if (modalType === 'sea') {
        const payload = {
          worldId,
          name: formName,
          description: formDescription || undefined,
          tone: formTone
        };
        // Seas don't have update endpoint in current API, but we can add
        if (!editingItem) {
          await geographyAPI.createSea(payload);
        }
      } else if (modalType === 'map') {
        if (!formImageUrl.trim() && formLayers.length === 0 && formPOIs.length === 0 && formReliefs.length === 0) {
          setFormError(t('geography.mapNeedsContent'));
          setIsSubmitting(false);
          return;
        }
        const payload = {
          worldId,
          name: formName,
          era: formEra,
          imageUrl: formImageUrl || undefined,
          continentId: formContinentId || undefined,
          seaId: formSeaId || undefined,
          layers: formLayers.length > 0 ? formLayers : undefined,
          pointsOfInterest: formPOIs.length > 0 ? formPOIs : undefined,
          reliefs: formReliefs.length > 0 ? formReliefs : undefined,
          tone: formToneMap
        };
        if (editingItem) {
          await geographyAPI.updateMap(editingItem.id, payload);
        } else {
          await geographyAPI.createMap(payload);
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: 'continent' | 'sea' | 'map', id: string) => {
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      if (type === 'continent') {
        await geographyAPI.deleteContinent(id);
      } else if (type === 'map') {
        await geographyAPI.deleteMap(id);
      }
      loadData();
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
    }
  };

  // Graph node types
  const MapNode = useCallback(({ data }: NodeProps) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-midnight-800 border border-midnight-600 rounded-xl p-3 min-w-[140px] cursor-pointer hover:border-burnt-500 transition-colors"
    >
      <Handle type="target" position={Position.Top} className="!bg-burnt-500 !w-2 !h-2" />
      {data.imageUrl ? (
        <img src={data.imageUrl} alt={data.name} className="w-full h-16 object-cover rounded-lg mb-2" />
      ) : (
        <div className="w-full h-16 bg-midnight-700 rounded-lg mb-2 flex items-center justify-center">
          <Map className="w-6 h-6 text-midnight-500" />
        </div>
      )}
      <p className="text-xs font-medium text-parchment-100 text-center truncate">{data.name}</p>
      <p className="text-[10px] text-parchment-500 text-center">{data.era}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-burnt-500 !w-2 !h-2" />
    </motion.div>
  ), []);

  const ContinentNode = useCallback(({ data }: NodeProps) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-midnight-800 border border-midnight-600 rounded-xl p-3 min-w-[140px] cursor-pointer hover:border-green-500 transition-colors"
    >
      <Handle type="target" position={Position.Top} className="!bg-green-500 !w-2 !h-2" />
      <div className="w-full h-16 bg-midnight-700 rounded-lg mb-2 flex items-center justify-center">
        <Globe className="w-6 h-6 text-green-400" />
      </div>
      <p className="text-xs font-medium text-parchment-100 text-center truncate">{data.name}</p>
      <p className="text-[10px] text-parchment-500 text-center">{data.mapCount} maps</p>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-2 !h-2" />
    </motion.div>
  ), []);

  const SeaNode = useCallback(({ data }: NodeProps) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-midnight-800 border border-midnight-600 rounded-xl p-3 min-w-[140px] cursor-pointer hover:border-blue-500 transition-colors"
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2" />
      <div className="w-full h-16 bg-midnight-700 rounded-lg mb-2 flex items-center justify-center">
        <Waves className="w-6 h-6 text-blue-400" />
      </div>
      <p className="text-xs font-medium text-parchment-100 text-center truncate">{data.name}</p>
      <p className="text-[10px] text-parchment-500 text-center">{data.mapCount} maps</p>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
    </motion.div>
  ), []);

  const nodeTypes = useMemo(() => ({ mapNode: MapNode, continentNode: ContinentNode, seaNode: SeaNode }), [MapNode, ContinentNode, SeaNode]);

  // Graph data generation
  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Continent nodes
    continents.forEach((continent, i) => {
      const x = 100 + i * 300;
      nodes.push({
        id: `continent-${continent.id}`,
        type: 'continentNode',
        position: { x, y: 40 },
        data: { name: continent.name, mapCount: continent._count.maps }
      });

      // Maps linked to this continent
      const linkedMaps = maps.filter(m => m.continent?.id === continent.id);
      linkedMaps.forEach((map, j) => {
        const angle = (j / Math.max(1, linkedMaps.length)) * Math.PI * 2 - Math.PI / 2;
        const radius = Math.max(120, 80 + linkedMaps.length * 8);
        const mx = x + Math.cos(angle) * radius;
        const my = 160 + Math.sin(angle) * radius;

        nodes.push({
          id: `map-${map.id}`,
          type: 'mapNode',
          position: { x: mx - 70, y: my },
          data: { name: map.name, imageUrl: map.imageUrl, era: eras.find(e => e.value === map.era)?.label || map.era }
        });

        edges.push({
          id: `edge-continent-${continent.id}-map-${map.id}`,
          source: `continent-${continent.id}`,
          target: `map-${map.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#22c55e' }
        });
      });
    });

    // Sea nodes
    seas.forEach((sea, i) => {
      const x = 100 + (continents.length + i) * 300;
      nodes.push({
        id: `sea-${sea.id}`,
        type: 'seaNode',
        position: { x, y: 40 },
        data: { name: sea.name, mapCount: sea._count.maps }
      });

      // Maps linked to this sea
      const linkedMaps = maps.filter(m => m.sea?.id === sea.id);
      linkedMaps.forEach((map, j) => {
        const angle = (j / Math.max(1, linkedMaps.length)) * Math.PI * 2 - Math.PI / 2;
        const radius = Math.max(120, 80 + linkedMaps.length * 8);
        const mx = x + Math.cos(angle) * radius;
        const my = 160 + Math.sin(angle) * radius;

        // Avoid duplicate map nodes
        if (!nodes.find(n => n.id === `map-${map.id}`)) {
          nodes.push({
            id: `map-${map.id}`,
            type: 'mapNode',
            position: { x: mx - 70, y: my },
            data: { name: map.name, imageUrl: map.imageUrl, era: eras.find(e => e.value === map.era)?.label || map.era }
          });
        }

        edges.push({
          id: `edge-sea-${sea.id}-map-${map.id}`,
          source: `sea-${sea.id}`,
          target: `map-${map.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6' }
        });
      });
    });

    // Unlinked maps
    const linkedMapIds = edges.map(e => e.target);
    maps.filter(m => !linkedMapIds.includes(`map-${m.id}`)).forEach((map, i) => {
      nodes.push({
        id: `map-${map.id}`,
        type: 'mapNode',
        position: { x: 100 + i * 200, y: 300 },
        data: { name: map.name, imageUrl: map.imageUrl, era: eras.find(e => e.value === map.era)?.label || map.era }
      });
    });

    return { nodes, edges };
  }, [continents, seas, maps, eras]);

  const { nodes: flowNodes, onNodesChange } = useDraggableNodes(graphData.nodes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-parchment-100 flex items-center gap-3">
            <Map className="w-8 h-8 text-green-400" />
            {t('geography.title')}
          </h1>
          <p className="text-parchment-400 mt-1">{t('geography.subtitle')}</p>
        </div>
        <Button onClick={() => openCreateModal(activeTab === 'maps' ? 'map' : activeTab === 'continents' ? 'continent' : 'sea')}>
          <Plus className="w-4 h-4 mr-2" /> {activeTab === 'continents' ? t('geography.addContinent') : activeTab === 'seas' ? t('geography.addSea') : t('geography.addMap')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <div className="flex bg-midnight-800 rounded-lg p-1 flex-1">
          {[
            { id: 'maps' as TabType, icon: Map, label: t('geography.maps') },
            { id: 'continents' as TabType, icon: Globe, label: t('geography.continents') },
            { id: 'seas' as TabType, icon: Waves, label: t('geography.seas') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-burnt-500 text-white'
                  : 'text-parchment-400 hover:text-parchment-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
          </button>
        ))}
        </div>
        {/* View mode toggle */}
        <div className="flex bg-midnight-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
              viewMode === 'list' ? 'bg-burnt-500 text-white' : 'text-parchment-400 hover:text-parchment-200'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
              viewMode === 'graph' ? 'bg-burnt-500 text-white' : 'text-parchment-400 hover:text-parchment-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'maps' ? (
        maps.length === 0 ? (
          <Card className="p-12 text-center">
            <Map className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-parchment-100 mb-2">{t('geography.noMaps')}</h3>
            <p className="text-parchment-400 mb-6">{t('geography.noMapsDesc')}</p>
            <Button onClick={() => openCreateModal('map')}><Plus className="w-4 h-4 mr-2" /> {t('geography.addMap')}</Button>
          </Card>
        ) : viewMode === 'graph' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <Card className="p-0 overflow-hidden" style={{ height: 540 }}>
              <ReactFlowProvider>
                <ReactFlow
                  nodes={flowNodes}
                  edges={graphData.edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  fitView
                  minZoom={0.3}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                  nodesConnectable={false}
                  onNodeClick={(_, node) => {
                    if (node.type === 'mapNode') {
                      const map = maps.find(m => m.id === node.id.replace('map-', ''));
                      if (map) setSelectedEntity({ type: 'map', data: map });
                    } else if (node.type === 'continentNode') {
                      const continent = continents.find(c => c.id === node.id.replace('continent-', ''));
                      if (continent) setSelectedEntity({ type: 'continent', data: continent });
                    } else if (node.type === 'seaNode') {
                      const sea = seas.find(s => s.id === node.id.replace('sea-', ''));
                      if (sea) setSelectedEntity({ type: 'sea', data: sea });
                    }
                  }}
                  onPaneClick={() => setSelectedEntity(null)}
                >
                  <Background color="#8d97ab" gap={28} size={1} />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </ReactFlowProvider>
            </Card>
            {/* Details panel */}
            <Card className="p-4 overflow-y-auto" style={{ maxHeight: 540 }}>
              {selectedEntity ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-parchment-100">
                      {selectedEntity.data.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-midnight-700 text-parchment-400">
                      {selectedEntity.type === 'map' ? t('geography.maps') : selectedEntity.type === 'continent' ? t('geography.continents') : t('geography.seas')}
                    </span>
                  </div>
                  {selectedEntity.type === 'map' && (
                    <>
                      <MapSimulator
                        map={{
                          name: selectedEntity.data.name,
                          imageUrl: selectedEntity.data.imageUrl,
                          layers: selectedEntity.data.layers || [],
                          pointsOfInterest: selectedEntity.data.pointsOfInterest || [],
                          reliefs: selectedEntity.data.reliefs || [],
                          tone: selectedEntity.data.tone || 'classic'
                        }}
                        height={180}
                      />
                      <p className="text-xs text-parchment-400">
                        {eras.find(e => e.value === selectedEntity.data.era)?.label || selectedEntity.data.era}
                      </p>
                      {selectedEntity.data.continent && (
                        <p className="text-xs text-parchment-500">{t('geography.continent')}: {selectedEntity.data.continent.name}</p>
                      )}
                      {selectedEntity.data.sea && (
                        <p className="text-xs text-parchment-500">{t('geography.sea')}: {selectedEntity.data.sea.name}</p>
                      )}
                    </>
                  )}
                  {selectedEntity.type === 'continent' && (
                    <>
                      <ContinentSimulator continent={{ name: selectedEntity.data.name, description: selectedEntity.data.description, climate: selectedEntity.data.climate, tone: selectedEntity.data.tone }} />
                      <p className="text-xs text-parchment-500">{selectedEntity.data._count.maps} maps</p>
                    </>
                  )}
                  {selectedEntity.type === 'sea' && (
                    <>
                      <SeaSimulator sea={{ name: selectedEntity.data.name, description: selectedEntity.data.description, tone: selectedEntity.data.tone }} />
                      <p className="text-xs text-parchment-500">{selectedEntity.data._count.maps} maps</p>
                    </>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(selectedEntity.type, selectedEntity.data)}>
                      <Edit2 className="w-3 h-3 mr-1" /> {t('common.edit')}
                    </Button>
                    {selectedEntity.type !== 'sea' && (
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => { handleDelete(selectedEntity.type, selectedEntity.data.id); setSelectedEntity(null); }}>
                        <Trash2 className="w-3 h-3 mr-1" /> {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-parchment-500 text-sm">
                  {t('geography.selectItem')}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maps.map((map, i) => (
              <motion.div
                key={map.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card variant="hover" className="h-full">
                  <div className="aspect-[16/9] bg-midnight-700 rounded-t-xl overflow-hidden relative">
                    <img src={map.imageUrl} alt={map.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="font-serif font-bold text-white">{map.name}</h3>
                      <p className="text-xs text-parchment-200">
                        {eras.find(e => e.value === map.era)?.label || map.era}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => setSelectedMap(map)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-midnight-700 text-parchment-300">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button onClick={() => openEditModal('map', map)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-midnight-700 text-parchment-300">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete('map', map.id)} className="p-1.5 bg-midnight-800/80 rounded-lg hover:bg-red-500/80 text-parchment-300 hover:text-white">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-parchment-500">
                      {map.continent && <span>{map.continent.name}</span>}
                      {map.sea && <span>{map.sea.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      ) : activeTab === 'continents' ? (
        continents.length === 0 ? (
          <Card className="p-12 text-center">
            <Globe className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-parchment-100 mb-2">{t('geography.noContinents')}</h3>
            <p className="text-parchment-400 mb-6">{t('geography.noContinentsDesc')}</p>
            <Button onClick={() => openCreateModal('continent')}><Plus className="w-4 h-4 mr-2" /> {t('geography.addContinent')}</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {continents.map((continent, i) => (
              <motion.div
                key={continent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card variant="hover" className="h-full">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-parchment-100">{continent.name}</h3>
                        {continent.climate && <p className="text-sm text-parchment-400">{continent.climate}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditModal('continent', continent)} className="p-1.5 rounded-lg hover:bg-midnight-700 text-parchment-400">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('continent', continent.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-parchment-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {continent.description && (
                      <p className="text-xs text-parchment-400 line-clamp-2 mt-2">{continent.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-parchment-500">
                      <span>{continent._count.regions} regions</span>
                      <span>{continent._count.maps} maps</span>
                    </div>
                    {continent.maps.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {continent.maps.slice(0, 3).map(m => (
                          <img key={m.id} src={m.imageUrl} alt={m.name} className="w-12 h-12 rounded object-cover" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        seas.length === 0 ? (
          <Card className="p-12 text-center">
            <Waves className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-parchment-100 mb-2">{t('geography.noSeas')}</h3>
            <p className="text-parchment-400 mb-6">{t('geography.noSeasDesc')}</p>
            <Button onClick={() => openCreateModal('sea')}><Plus className="w-4 h-4 mr-2" /> {t('geography.addSea')}</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seas.map((sea, i) => (
              <motion.div
                key={sea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card variant="hover" className="h-full">
                  <CardContent>
                    <h3 className="font-serif font-bold text-parchment-100">{sea.name}</h3>
                    {sea.description && (
                      <p className="text-xs text-parchment-400 line-clamp-2 mt-2">{sea.description}</p>
                    )}
                    <div className="mt-3 text-xs text-parchment-500">
                      {sea._count.maps} maps
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Map Preview Modal */}
      <AnimatePresence>
        {selectedMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setSelectedMap(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <MapSimulator
                  map={{
                    name: selectedMap.name,
                    imageUrl: selectedMap.imageUrl,
                    layers: selectedMap.layers || [],
                    pointsOfInterest: selectedMap.pointsOfInterest || [],
                    reliefs: selectedMap.reliefs || [],
                    tone: selectedMap.tone || 'classic'
                  }}
                  height={500}
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-midnight-800/90 rounded-lg backdrop-blur-sm">
                  <h3 className="font-serif text-xl font-bold text-parchment-100">{selectedMap.name}</h3>
                  <p className="text-sm text-parchment-400">
                    {eras.find(e => e.value === selectedMap.era)?.label || selectedMap.era}
                    {selectedMap.continent && ` • ${selectedMap.continent.name}`}
                    {selectedMap.sea && ` • ${selectedMap.sea.name}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMap(null)}
                  className="absolute top-4 right-4 p-2 bg-midnight-800/80 rounded-lg text-parchment-300 hover:bg-midnight-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b border-midnight-700">
                <h2 className="font-serif text-xl font-bold text-parchment-100">
                  {editingItem
                    ? (modalType === 'continent' ? t('geography.editContinent') : modalType === 'sea' ? t('geography.editSea') : t('geography.editMap'))
                    : (modalType === 'continent' ? t('geography.createContinent') : modalType === 'sea' ? t('geography.createSea') : t('geography.createMap'))
                  }
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                {modalType === 'sea' && (
                  <div className="rounded-xl overflow-hidden border border-midnight-600">
                    <SeaSimulator
                      sea={{
                        name: formName || undefined,
                        description: formDescription || undefined,
                        tone: formTone
                      }}
                    />
                  </div>
                )}

                {modalType === 'continent' && (
                  <div className="rounded-xl overflow-hidden border border-midnight-600">
                    <ContinentSimulator
                      continent={{
                        name: formName || undefined,
                        description: formDescription || undefined,
                        climate: formClimate || undefined,
                        tone: formToneContinent
                      }}
                    />
                  </div>
                )}

                <Input
                  label={t('geography.name')}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={modalType === 'continent' ? 'ej. Aetheria' : modalType === 'sea' ? 'ej. Océano Cristalino' : 'ej. Mapa del Mundo'}
                  required
                />

                {modalType !== 'map' && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-parchment-300">{t('geography.description')}</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe este lugar..."
                      rows={3}
                      className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                    />
                  </div>
                )}

                {modalType === 'sea' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-parchment-300">{t('geography.seaTone')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SEA_TONE_KEYS.map((key) => {
                        const isSelected = formTone === key;
                        const previewColors: Record<string, string> = {
                          ocean: 'linear-gradient(135deg, #0a1e3a, #1e6aa8)',
                          arctic: 'linear-gradient(135deg, #102838, #6ab0d4)',
                          tropical: 'linear-gradient(135deg, #181030, #7040d0)',
                          volcanic: 'linear-gradient(135deg, #281010, #c04030)',
                          abyss: 'linear-gradient(135deg, #040a14, #183860)',
                          mystical: 'linear-gradient(135deg, #140830, #8040e0)'
                        };
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormTone(key)}
                            className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-burnt-500 bg-midnight-700 ring-1 ring-burnt-500'
                                : 'border-midnight-600 bg-midnight-800 hover:border-midnight-500'
                            }`}
                          >
                            <div
                              className="w-full h-6 rounded-md"
                              style={{ background: previewColors[key] }}
                            />
                            <span className="text-xs text-parchment-300">{TONE_LABELS[key]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modalType === 'continent' && (
                  <Input
                    label={t('geography.climate')}
                    value={formClimate}
                    onChange={(e) => setFormClimate(e.target.value)}
                    placeholder={t('geography.climatePlaceholder')}
                  />
                )}

                {modalType === 'continent' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-parchment-300">{t('geography.continentTone')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CONTINENT_TONE_KEYS.map((key) => {
                        const isSelected = formToneContinent === key;
                        const previewColors: Record<string, string> = {
                          forest: 'linear-gradient(135deg, #0e2814, #22c55e)',
                          desert: 'linear-gradient(135deg, #a08030, #f59e0b)',
                          arctic: 'linear-gradient(135deg, #1e3050, #7dd3fc)',
                          volcanic: 'linear-gradient(135deg, #2a1008, #ef4444)',
                          oceanic: 'linear-gradient(135deg, #0e3050, #38bdf8)',
                          floating: 'linear-gradient(135deg, #281860, #a78bfa)'
                        };
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormToneContinent(key)}
                            className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-burnt-500 bg-midnight-700 ring-1 ring-burnt-500'
                                : 'border-midnight-600 bg-midnight-800 hover:border-midnight-500'
                            }`}
                          >
                            <div
                              className="w-full h-6 rounded-md"
                              style={{ background: previewColors[key] }}
                            />
                            <span className="text-xs text-parchment-300">{CONTINENT_TONE_LABELS[key]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modalType === 'map' && (
                  <>
                    {/* Map Simulator Preview */}
                    <div className="rounded-xl overflow-hidden border border-midnight-600">
                      <MapSimulator
                        map={{
                          name: formName || undefined,
                          description: formDescription || undefined,
                          layers: formLayers,
                          pointsOfInterest: formPOIs,
                          reliefs: formReliefs,
                          tone: formToneMap
                        }}
                        height={220}
                      />
                    </div>

                    {/* Map Creator */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-parchment-300">{t('geography.mapCreator')}</label>
                      <MapCreator
                        layers={formLayers}
                        pois={formPOIs}
                        reliefs={formReliefs}
                        imageUrl={formImageUrl || undefined}
                        onChangeLayers={setFormLayers}
                        onChangePOIs={setFormPOIs}
                        onChangeReliefs={setFormReliefs}
                      />
                    </div>

                    {/* Map Tone */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-parchment-300">{t('geography.mapTone')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {MAP_TONE_KEYS.map((key) => {
                          const isSelected = formToneMap === key;
                          const previewColors: Record<string, string> = {
                            classic: 'linear-gradient(135deg, #1a1610, #d4c8a8)',
                            dark: 'linear-gradient(135deg, #0a0e14, #7799bb)',
                            fantasy: 'linear-gradient(135deg, #0e0818, #c8b0e0)',
                            parchment: 'linear-gradient(135deg, #f0e8d0, #8b7355)',
                            war: 'linear-gradient(135deg, #120808, #dc2626)',
                            ice: 'linear-gradient(135deg, #080e18, #78b8e0)'
                          };
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setFormToneMap(key)}
                              className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-burnt-500 bg-midnight-700 ring-1 ring-burnt-500'
                                  : 'border-midnight-600 bg-midnight-800 hover:border-midnight-500'
                              }`}
                            >
                              <div
                                className="w-full h-6 rounded-md"
                                style={{ background: previewColors[key] }}
                              />
                              <span className="text-xs text-parchment-300">{MAP_TONE_LABELS[key]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Image input - URL or Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-parchment-300">{t('geography.image')}</label>
                      {formImageUrl ? (
                        <div className="relative">
                          <img
                            src={formImageUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border border-midnight-600"
                          />
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-midnight-900/80 hover:bg-midnight-800 text-parchment-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formImageUrl}
                              onChange={(e) => setFormImageUrl(e.target.value)}
                              placeholder={t('geography.imageUrlPlaceholder')}
                              className="flex-1 px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 text-sm"
                            />
                            <label className="flex items-center gap-1.5 px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-300 hover:bg-midnight-600 hover:text-parchment-100 cursor-pointer transition-colors text-sm whitespace-nowrap">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {t('geography.uploadImage')}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setFormImageUrl(ev.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <p className="text-[10px] text-parchment-500">{t('geography.imageHint')}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-parchment-300">{t('geography.era')}</label>
                      <select
                        value={formEra}
                        onChange={(e) => setFormEra(e.target.value)}
                        className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                      >
                        {eras.map(e => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-parchment-300">{t('geography.continent')}</label>
                        <select
                          value={formContinentId}
                          onChange={(e) => setFormContinentId(e.target.value)}
                          className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                        >
                          <option value="">{t('geography.none')}</option>
                          {continents.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-parchment-300">{t('geography.sea')}</label>
                        <select
                          value={formSeaId}
                          onChange={(e) => setFormSeaId(e.target.value)}
                          className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                        >
                          <option value="">{t('geography.none')}</option>
                          {seas.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="sticky bottom-0 flex gap-3 pt-3 mt-2 bg-midnight-800 border-t border-midnight-700 -mx-4 px-4 pb-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingItem ? t('common.save') : t('common.create')}
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
