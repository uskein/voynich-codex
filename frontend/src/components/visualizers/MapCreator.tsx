import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Move, MousePointer, Mountain, MapPin, Layers, RotateCcw, GripVertical } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { MapLayerData, MapPOI, MapRelief } from './MapSimulator';

interface MapCreatorProps {
  layers: MapLayerData[];
  pois: MapPOI[];
  reliefs: MapRelief[];
  imageUrl?: string;
  onChangeLayers: (layers: MapLayerData[]) => void;
  onChangePOIs: (pois: MapPOI[]) => void;
  onChangeReliefs: (reliefs: MapRelief[]) => void;
}

type Tool = 'select' | 'poi' | 'relief' | 'layer';

const LAYER_TYPES = [
  { type: 'terrain', label: 'Terreno', color: '#8b7355' },
  { type: 'water', label: 'Agua', color: '#2563eb' },
  { type: 'forest', label: 'Bosque', color: '#166534' },
  { type: 'mountain', label: 'Montanas', color: '#78716c' },
  { type: 'desert', label: 'Desierto', color: '#d97706' },
  { type: 'tundra', label: 'Tundra', color: '#94a3b8' },
  { type: 'swamp', label: 'Pantano', color: '#3f6212' },
  { type: 'plains', label: 'Llanuras', color: '#65a30d' },
  { type: 'jungle', label: 'Jungla', color: '#15803d' }
] as const;

const POI_TYPES = [
  { type: 'city', label: 'Ciudad', emoji: '🏰' },
  { type: 'castle', label: 'Castillo', emoji: '🏯' },
  { type: 'ruin', label: 'Ruinas', emoji: '🏛️' },
  { type: 'camp', label: 'Campamento', emoji: '⛺' },
  { type: 'shrine', label: 'Santuario', emoji: '⛩️' },
  { type: 'tower', label: 'Torre', emoji: '🗼' },
  { type: 'cave', label: 'Cueva', emoji: '🕳️' },
  { type: 'village', label: 'Aldea', emoji: '🏘️' },
  { type: 'port', label: 'Puerto', emoji: '⚓' },
  { type: 'landmark', label: 'Punto de interes', emoji: '📍' }
] as const;

const RELIEF_TYPES = [
  { type: 'mountain', label: 'Montana', emoji: '⛰️' },
  { type: 'hill', label: 'Colina', emoji: '🌄' },
  { type: 'forest', label: 'Bosque', emoji: '🌲' },
  { type: 'river', label: 'Rio', emoji: '〰️' },
  { type: 'lake', label: 'Lago', emoji: '💧' },
  { type: 'volcano', label: 'Volcan', emoji: '🌋' },
  { type: 'canyon', label: 'Canion', emoji: '🏞️' },
  { type: 'plateau', label: 'Meseta', emoji: '🏔️' }
] as const;

const TERRAIN_COLORS: Record<string, string> = {
  terrain: '#8b7355', water: '#2563eb', forest: '#166534',
  mountain: '#78716c', desert: '#d97706', tundra: '#94a3b8',
  swamp: '#3f6212', plains: '#65a30d', jungle: '#15803d'
};

function generateSimplePath(points: { x: number; y: number }[]): string {
  if (points.length < 3) return '';
  const first = points[0];
  let d = `M${first.x},${first.y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x},${points[i].y}`;
  }
  d += ' Z';
  return d;
}

let idCounter = 0;
function uid(): string {
  return `map_${Date.now()}_${++idCounter}`;
}

export function MapCreator({
  layers, pois, reliefs, imageUrl,
  onChangeLayers, onChangePOIs, onChangeReliefs
}: MapCreatorProps) {
  const { t } = useI18n();
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedType, setSelectedType] = useState<string>('city');
  const [drawingLayerType, setDrawingLayerType] = useState<string>('terrain');
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPoiName, setNewPoiName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'poi') {
      const poiType = POI_TYPES.find(pt => pt.type === selectedType) || POI_TYPES[0];
      const newPoi: MapPOI = {
        id: uid(),
        type: poiType.type as any,
        x, y,
        name: newPoiName || poiType.label,
        description: ''
      };
      onChangePOIs([...pois, newPoi]);
      setNewPoiName('');
    } else if (activeTool === 'relief') {
      const reliefType = RELIEF_TYPES.find(rt => rt.type === selectedType) || RELIEF_TYPES[0];
      const newRelief: MapRelief = {
        id: uid(),
        type: reliefType.type as any,
        x, y,
        scale: 1,
        rotation: 0
      };
      onChangeReliefs([...reliefs, newRelief]);
    } else if (activeTool === 'layer' && isDrawing) {
      setDrawPoints(prev => [...prev, { x, y }]);
    } else if (activeTool === 'select') {
      const clickedPoi = pois.find(p => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3);
      const clickedRelief = reliefs.find(r => Math.abs(r.x - x) < 3 && Math.abs(r.y - y) < 3);
      if (clickedPoi) {
        setSelectedId(clickedPoi.id);
      } else if (clickedRelief) {
        setSelectedId(clickedRelief.id);
      } else {
        setSelectedId(null);
      }
    }
  }, [activeTool, selectedType, newPoiName, pois, reliefs, isDrawing, onChangePOIs, onChangeReliefs]);

  const startDrawingLayer = useCallback(() => {
    setIsDrawing(true);
    setDrawPoints([]);
  }, []);

  const finishDrawingLayer = useCallback(() => {
    if (drawPoints.length >= 3) {
      const path = generateSimplePath(drawPoints);
      const layerType = LAYER_TYPES.find(l => l.type === drawingLayerType) || LAYER_TYPES[0];
      const newLayer: MapLayerData = {
        id: uid(),
        type: layerType.type as any,
        path,
        color: TERRAIN_COLORS[layerType.type] || '#8b7355',
        opacity: 0.5
      };
      onChangeLayers([...layers, newLayer]);
    }
    setIsDrawing(false);
    setDrawPoints([]);
  }, [drawPoints, drawingLayerType, layers, onChangeLayers]);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setDrawPoints([]);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    if (pois.find(p => p.id === selectedId)) {
      onChangePOIs(pois.filter(p => p.id !== selectedId));
    } else if (reliefs.find(r => r.id === selectedId)) {
      onChangeReliefs(reliefs.filter(r => r.id !== selectedId));
    } else if (layers.find(l => l.id === selectedId)) {
      onChangeLayers(layers.filter(l => l.id !== selectedId));
    }
    setSelectedId(null);
  }, [selectedId, pois, reliefs, layers, onChangePOIs, onChangeReliefs, onChangeLayers]);

  const clearAll = useCallback(() => {
    onChangeLayers([]);
    onChangePOIs([]);
    onChangeReliefs([]);
    setSelectedId(null);
  }, [onChangeLayers, onChangePOIs, onChangeReliefs]);

  const tools = [
    { id: 'select' as Tool, icon: MousePointer, label: t('mapCreator.select') },
    { id: 'poi' as Tool, icon: MapPin, label: t('mapCreator.poi') },
    { id: 'relief' as Tool, icon: Mountain, label: t('mapCreator.relief') },
    { id: 'layer' as Tool, icon: Layers, label: t('mapCreator.layer') }
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tools.map(tool => (
          <button
            key={tool.id}
            type="button"
            onClick={() => { setActiveTool(tool.id); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTool === tool.id
                ? 'bg-burnt-600 text-parchment-100 shadow-md'
                : 'bg-midnight-700 text-parchment-400 hover:bg-midnight-600'
            }`}
          >
            <tool.icon className="w-3.5 h-3.5" />
            {tool.label}
          </button>
        ))}
        {selectedId && (
          <button
            type="button"
            onClick={deleteSelected}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('mapCreator.delete')}
          </button>
        )}
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-midnight-700 text-parchment-400 hover:bg-midnight-600 transition-all ml-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('mapCreator.clear')}
        </button>
      </div>

      {/* Tool-specific options */}
      <AnimatePresence mode="wait">
        {activeTool === 'poi' && (
          <motion.div
            key="poi-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPoiName}
                onChange={e => setNewPoiName(e.target.value)}
                placeholder={t('mapCreator.poiNamePlaceholder')}
                className="flex-1 px-2.5 py-1.5 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 text-xs placeholder-midnight-400 focus:outline-none focus:ring-1 focus:ring-burnt-500"
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {POI_TYPES.map(pt => (
                <button
                  key={pt.type}
                  type="button"
                  onClick={() => setSelectedType(pt.type)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] transition-all ${
                    selectedType === pt.type
                      ? 'bg-burnt-600/30 border border-burnt-500 text-parchment-100'
                      : 'bg-midnight-800 border border-midnight-600 text-parchment-400 hover:border-midnight-500'
                  }`}
                >
                  <span className="text-base">{pt.emoji}</span>
                  <span>{pt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-parchment-500">{t('mapCreator.clickToPlace')}</p>
          </motion.div>
        )}

        {activeTool === 'relief' && (
          <motion.div
            key="relief-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-1.5">
              {RELIEF_TYPES.map(rt => (
                <button
                  key={rt.type}
                  type="button"
                  onClick={() => setSelectedType(rt.type)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] transition-all ${
                    selectedType === rt.type
                      ? 'bg-burnt-600/30 border border-burnt-500 text-parchment-100'
                      : 'bg-midnight-800 border border-midnight-600 text-parchment-400 hover:border-midnight-500'
                  }`}
                >
                  <span className="text-base">{rt.emoji}</span>
                  <span>{rt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-parchment-500">{t('mapCreator.clickToPlaceRelief')}</p>
          </motion.div>
        )}

        {activeTool === 'layer' && (
          <motion.div
            key="layer-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5">
              {LAYER_TYPES.map(lt => (
                <button
                  key={lt.type}
                  type="button"
                  onClick={() => setDrawingLayerType(lt.type)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-all ${
                    drawingLayerType === lt.type
                      ? 'bg-burnt-600/30 border border-burnt-500 text-parchment-100'
                      : 'bg-midnight-800 border border-midnight-600 text-parchment-400 hover:border-midnight-500'
                  }`}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: lt.color }} />
                  {lt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isDrawing ? (
                <button
                  type="button"
                  onClick={startDrawingLayer}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-burnt-600 text-parchment-100 hover:bg-burnt-500 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('mapCreator.startDrawing')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={finishDrawingLayer}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700 text-parchment-100 hover:bg-green-600 transition-all"
                  >
                    {t('mapCreator.finishDrawing')} ({drawPoints.length} pts)
                  </button>
                  <button
                    type="button"
                    onClick={cancelDrawing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-midnight-600 text-parchment-400 hover:bg-midnight-500 transition-all"
                  >
                    {t('mapCreator.cancel')}
                  </button>
                </>
              )}
            </div>
            <p className="text-[10px] text-parchment-500">{t('mapCreator.layerHint')}</p>
          </motion.div>
        )}

        {activeTool === 'select' && (
          <motion.div
            key="select-info"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[10px] text-parchment-500">{t('mapCreator.selectHint')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`relative w-full rounded-xl border overflow-hidden ${
          activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
        }`}
        style={{
          aspectRatio: '16/10',
          backgroundColor: '#1a1610',
          borderColor: selectedId ? '#b45309' : '#3a3020'
        }}
      >
        {/* Background image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Map background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ objectFit: 'cover' }}
          />
        )}

        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 13 }).map((_, i) => (
            <g key={`g-${i}`}>
              <line x1={i * (100/12)} y1={0} x2={i * (100/12)} y2={100} stroke="rgba(180,160,120,0.06)" strokeWidth={0.15} />
              <line x1={0} y1={i * (100/12)} x2={100} y2={i * (100/12)} stroke="rgba(180,160,120,0.06)" strokeWidth={0.15} />
            </g>
          ))}
        </svg>

        {/* Existing layers */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {layers.map(layer => (
            <path
              key={layer.id}
              d={layer.path}
              fill={layer.color}
              fillOpacity={layer.opacity || 0.5}
              stroke={selectedId === layer.id ? '#f59e0b' : 'transparent'}
              strokeWidth={selectedId === layer.id ? 0.3 : 0}
              className="cursor-pointer transition-all"
              onClick={(e) => { e.stopPropagation(); setSelectedId(layer.id); }}
            />
          ))}
          {/* Drawing preview */}
          {isDrawing && drawPoints.length > 0 && (
            <polygon
              points={drawPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill={TERRAIN_COLORS[drawingLayerType] || '#8b7355'}
              fillOpacity={0.3}
              stroke={TERRAIN_COLORS[drawingLayerType] || '#8b7355'}
              strokeWidth={0.2}
              strokeDasharray="1,1"
            />
          )}
        </svg>

        {/* Reliefs */}
        {reliefs.map(relief => {
          const rt = RELIEF_TYPES.find(r => r.type === relief.type) || RELIEF_TYPES[0];
          return (
            <div
              key={relief.id}
              className={`absolute flex items-center justify-center cursor-pointer transition-all ${
                selectedId === relief.id ? 'ring-2 ring-burnt-500 rounded-full' : ''
              }`}
              style={{
                left: `${relief.x}%`,
                top: `${relief.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: 18 * (relief.scale || 1)
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(relief.id); }}
            >
              {rt.emoji}
            </div>
          );
        })}

        {/* POIs */}
        {pois.map(poi => {
          const pt = POI_TYPES.find(p => p.type === poi.type) || POI_TYPES[0];
          return (
            <div
              key={poi.id}
              className={`absolute flex flex-col items-center cursor-pointer transition-all ${
                selectedId === poi.id ? 'scale-110' : ''
              }`}
              style={{
                left: `${poi.x}%`,
                top: `${poi.y}%`,
                transform: 'translate(-50%, -100%)'
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(poi.id); }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: selectedId === poi.id ? '#b45309' : 'rgba(26,22,16,0.8)',
                  border: `2px solid ${selectedId === poi.id ? '#f59e0b' : '#5a4a30'}`,
                  fontSize: 12
                }}
              >
                {pt.emoji}
              </div>
              <span
                className="mt-0.5 px-1 text-[8px] rounded whitespace-nowrap"
                style={{
                  backgroundColor: 'rgba(26,22,16,0.8)',
                  color: '#c4b898'
                }}
              >
                {poi.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px] text-parchment-500">
        <span>{layers.length} {t('mapCreator.layersCount')}</span>
        <span>{pois.length} {t('mapCreator.poisCount')}</span>
        <span>{reliefs.length} {t('mapCreator.reliefsCount')}</span>
      </div>
    </div>
  );
}
