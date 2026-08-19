import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Plus, X, Trash2, Edit2, Globe, Waves, Eye } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { geographyAPI } from '../../services/api';

interface Continent {
  id: string;
  name: string;
  description?: string;
  climate?: string;
  regions: { id: string; name: string }[];
  maps: { id: string; name: string; imageUrl: string }[];
  _count: { regions: number; maps: number };
}

interface Sea {
  id: string;
  name: string;
  description?: string;
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
}

const eras = [
  { value: 'EDAD_ANTIGUA', label: 'Ancient Age' },
  { value: 'EDAD_MEDIA', label: 'Middle Age' },
  { value: 'EDAD_MODERNA', label: 'Modern Age' },
  { value: 'ERA_FUTURA', label: 'Future Era' }
];

type TabType = 'continents' | 'seas' | 'maps';

export function GeographyPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const [continents, setContinents] = useState<Continent[]>([]);
  const [seas, setSeas] = useState<Sea[]>([]);
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('maps');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'continent' | 'sea' | 'map'>('map');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedMap, setSelectedMap] = useState<MapItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClimate, setFormClimate] = useState('');
  const [formEra, setFormEra] = useState('EDAD_MEDIA');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formContinentId, setFormContinentId] = useState('');
  const [formSeaId, setFormSeaId] = useState('');
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
          climate: formClimate || undefined
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
          description: formDescription || undefined
        };
        // Seas don't have update endpoint in current API, but we can add
        if (!editingItem) {
          await geographyAPI.createSea(payload);
        }
      } else if (modalType === 'map') {
        if (!formImageUrl.trim()) {
          setFormError('Image URL is required for maps');
          setIsSubmitting(false);
          return;
        }
        const payload = {
          worldId,
          name: formName,
          era: formEra,
          imageUrl: formImageUrl,
          continentId: formContinentId || undefined,
          seaId: formSeaId || undefined
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-parchment-100 flex items-center gap-3">
            <Map className="w-8 h-8 text-green-400" />
            Geography
          </h1>
          <p className="text-parchment-400 mt-1">Continents, seas, regions and maps of your world</p>
        </div>
        <Button onClick={() => openCreateModal(activeTab === 'maps' ? 'map' : activeTab === 'continents' ? 'continent' : 'sea')}>
          <Plus className="w-4 h-4 mr-2" /> Add {activeTab === 'continents' ? 'Continent' : activeTab === 'seas' ? 'Sea' : 'Map'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-midnight-800 rounded-lg p-1">
        {[
          { id: 'maps' as TabType, icon: Map, label: 'Maps' },
          { id: 'continents' as TabType, icon: Globe, label: 'Continents' },
          { id: 'seas' as TabType, icon: Waves, label: 'Seas' }
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
            <h3 className="text-lg font-medium text-parchment-100 mb-2">No maps yet</h3>
            <p className="text-parchment-400 mb-6">Create your first map</p>
            <Button onClick={() => openCreateModal('map')}><Plus className="w-4 h-4 mr-2" /> Add Map</Button>
          </Card>
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
            <h3 className="text-lg font-medium text-parchment-100 mb-2">No continents yet</h3>
            <p className="text-parchment-400 mb-6">Create your first continent</p>
            <Button onClick={() => openCreateModal('continent')}><Plus className="w-4 h-4 mr-2" /> Add Continent</Button>
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
            <h3 className="text-lg font-medium text-parchment-100 mb-2">No seas yet</h3>
            <p className="text-parchment-400 mb-6">Create your first sea</p>
            <Button onClick={() => openCreateModal('sea')}><Plus className="w-4 h-4 mr-2" /> Add Sea</Button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedMap(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full"
            >
              <div className="relative">
                <img src={selectedMap.imageUrl} alt={selectedMap.name} className="w-full rounded-xl" />
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
              className="w-full max-w-lg bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600"
            >
              <div className="flex items-center justify-between p-4 border-b border-midnight-700">
                <h2 className="font-serif text-xl font-bold text-parchment-100">
                  {editingItem ? 'Edit' : 'Add'} {modalType === 'continent' ? 'Continent' : modalType === 'sea' ? 'Sea' : 'Map'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                <Input
                  label="Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={`e.g. ${modalType === 'continent' ? 'Aetheria' : modalType === 'sea' ? 'Crystal Ocean' : 'World Map'}}`}
                  required
                />

                {modalType !== 'sea' && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-parchment-300">Description</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe this..."
                      rows={3}
                      className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                    />
                  </div>
                )}

                {modalType === 'continent' && (
                  <Input
                    label="Climate"
                    value={formClimate}
                    onChange={(e) => setFormClimate(e.target.value)}
                    placeholder="e.g. Tropical, Arctic"
                  />
                )}

                {modalType === 'map' && (
                  <>
                    <Input
                      label="Image URL"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://example.com/map.jpg"
                      required
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-parchment-300">Era</label>
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
                        <label className="block text-sm font-medium text-parchment-300">Continent (optional)</label>
                        <select
                          value={formContinentId}
                          onChange={(e) => setFormContinentId(e.target.value)}
                          className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                        >
                          <option value="">None</option>
                          {continents.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-parchment-300">Sea (optional)</label>
                        <select
                          value={formSeaId}
                          onChange={(e) => setFormSeaId(e.target.value)}
                          className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                        >
                          <option value="">None</option>
                          {seas.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingItem ? 'Save Changes' : 'Add'}
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
