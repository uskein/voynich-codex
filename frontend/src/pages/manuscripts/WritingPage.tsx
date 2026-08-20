import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Search, X, Plus, Trash2, Eye, Layers, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { chapterAPI, chapterRelationAPI, manuscriptAPI } from '../../services/api';
import { ContinentSimulator } from '../../components/visualizers/ContinentSimulator';
import { SeaSimulator } from '../../components/visualizers/SeaSimulator';
import { MapSimulator } from '../../components/visualizers/MapSimulator';
import { BestiarySimulator } from '../../components/visualizers/BestiarySimulator';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Relation {
  id: string;
  targetType: string;
  targetId: string;
  startOffset: number;
  endOffset: number;
  selectedText?: string;
  label?: string;
  target: any;
}

interface WorldElements {
  CHARACTER: { id: string; name: string; avatarUrl?: string }[];
  BESTIARY: { id: string; name: string; species?: string }[];
  CONTINENT: { id: string; name: string; climate?: string }[];
  SEA: { id: string; name: string; tone?: string }[];
  REGION: { id: string; name: string }[];
  MAP: { id: string; name: string; era?: string }[];
  NATION: { id: string; name: string }[];
  MAGIC_SYSTEM: { id: string; name: string }[];
  SPELL: { id: string; name: string }[];
  LAW: { id: string; title: string }[];
  HERALDRY: { id: string; title: string }[];
  TIMELINE_EVENT: { id: string; title: string; dateInWorld?: string }[];
}

const TARGET_LABELS: Record<string, string> = {
  CHARACTER: 'Personaje',
  BESTIARY: 'Bestiario',
  CONTINENT: 'Continente',
  SEA: 'Mar',
  REGION: 'Región',
  MAP: 'Mapa',
  NATION: 'Nación',
  MAGIC_SYSTEM: 'Sistema de Magia',
  SPELL: 'Hechizo',
  LAW: 'Ley',
  HERALDRY: 'Heráldica',
  TIMELINE_EVENT: 'Evento'
};

const TARGET_COLORS: Record<string, string> = {
  CHARACTER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  BESTIARY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CONTINENT: 'bg-green-500/20 text-green-400 border-green-500/30',
  SEA: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  REGION: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MAP: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  NATION: 'bg-red-500/20 text-red-400 border-red-500/30',
  MAGIC_SYSTEM: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  SPELL: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  LAW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HERALDRY: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  TIMELINE_EVENT: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

export function WritingPage() {
  const { manuscriptId } = useParams<{ manuscriptId: string }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState('');
  const [relations, setRelations] = useState<Relation[]>([]);
  const [worldElements, setWorldElements] = useState<WorldElements | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [viewingRelation, setViewingRelation] = useState<Relation | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (manuscriptId) loadChapters();
  }, [manuscriptId]);

  useEffect(() => {
    if (selectedChapter) loadRelations();
  }, [selectedChapter]);

  useEffect(() => {
    if (manuscriptId) loadWorldElements();
  }, [manuscriptId]);

  const loadChapters = async () => {
    if (!manuscriptId) return;
    try {
      const { data } = await chapterAPI.list(manuscriptId);
      setChapters(data.chapters);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const loadRelations = async () => {
    if (!selectedChapter) return;
    try {
      const { data } = await chapterRelationAPI.list(selectedChapter.id);
      setRelations(data.relations);
    } catch (error) {
      console.error('Failed to load relations:', error);
    }
  };

  const loadWorldElements = async () => {
    if (!manuscriptId) return;
    try {
      const manuscript = await manuscriptAPI.get(manuscriptId);
      const worldId = manuscript.data.manuscript.world?.id;
      if (!worldId) {
        console.warn('Manuscript has no world linked');
        return;
      }
      const { data } = await chapterRelationAPI.getWorldElements(worldId);
      setWorldElements(data.elements);
    } catch (error) {
      console.error('Failed to load world elements:', error);
    }
  };

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setContent(chapter.content || '');
  };

  const handleCreateChapter = async () => {
    if (!manuscriptId || !newChapterTitle.trim()) return;
    setIsCreatingChapter(true);
    try {
      const { data } = await chapterAPI.create(manuscriptId, {
        title: newChapterTitle.trim(),
        content: ''
      });
      setChapters([...chapters, data.chapter]);
      setSelectedChapter(data.chapter);
      setContent('');
      setNewChapterTitle('');
      setShowCreateChapter(false);
    } catch (error) {
      console.error('Failed to create chapter:', error);
    } finally {
      setIsCreatingChapter(false);
    }
  };

  const handleTextSelect = useCallback(() => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      setSelectedText(content.substring(start, end));
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
      setSelectionRange(null);
    }
  }, [content]);

  const handleCreateRelation = async (targetType: string, targetId: string, label?: string) => {
    if (!selectedChapter || !selectionRange) return;
    try {
      await chapterRelationAPI.create(selectedChapter.id, {
        targetType,
        targetId,
        startOffset: selectionRange.start,
        endOffset: selectionRange.end,
        selectedText,
        label
      });
      setShowRelationPicker(false);
      setSelectedText('');
      setSelectionRange(null);
      loadRelations();
    } catch (error) {
      console.error('Failed to create relation:', error);
    }
  };

  const handleDeleteRelation = async (id: string) => {
    try {
      await chapterRelationAPI.delete(id);
      loadRelations();
      setSelectedRelation(null);
    } catch (error) {
      console.error('Failed to delete relation:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedChapter || !manuscriptId) return;
    setIsSaving(true);
    try {
      await chapterAPI.update(manuscriptId, selectedChapter.id, { content });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContentWithHighlights = () => {
    if (!content || relations.length === 0) return null;

    const sorted = [...relations].sort((a, b) => a.startOffset - b.startOffset);
    const parts: { text: string; relation?: Relation }[] = [];
    let lastEnd = 0;

    for (const rel of sorted) {
      if (rel.startOffset > lastEnd) {
        parts.push({ text: content.substring(lastEnd, rel.startOffset) });
      }
      parts.push({ text: content.substring(rel.startOffset, rel.endOffset), relation: rel });
      lastEnd = rel.endOffset;
    }
    if (lastEnd < content.length) {
      parts.push({ text: content.substring(lastEnd) });
    }

    return (
      <div className="prose prose-invert max-w-none font-serif text-parchment-200 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (!part.relation) {
            return <span key={i}>{part.text}</span>;
          }
          return (
            <span
              key={i}
              onClick={() => setSelectedRelation(part.relation!)}
              className={`cursor-pointer border-b-2 transition-colors hover:brightness-125 ${TARGET_COLORS[part.relation.targetType] || 'border-parchment-400 text-parchment-200'}`}
              title={`${TARGET_LABELS[part.relation.targetType] || part.relation.targetType}: ${part.relation.target?.name || part.relation.target?.title || ''}`}
            >
              {part.text}
            </span>
          );
        })}
      </div>
    );
  };

  const filteredElements = worldElements ? Object.entries(worldElements).filter(([type, items]) => {
    if (filterType && type !== filterType) return false;
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      return items.some((item: any) => (item.name || item.title || '').toLowerCase().includes(search));
    }
    return true;
  }) : [];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chapter sidebar */}
      <div className="w-64 bg-midnight-800 border-r border-midnight-700 flex flex-col">
        <div className="p-4 border-b border-midnight-700">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-parchment-100">Capítulos</h2>
            <button onClick={() => setShowCreateChapter(true)} className="p-1.5 rounded-lg hover:bg-midnight-700 text-parchment-400">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chapters.map((chapter, i) => (
            <button
              key={chapter.id}
              onClick={() => handleSelectChapter(chapter)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                selectedChapter?.id === chapter.id
                  ? 'bg-burnt-500/20 text-burnt-400'
                  : 'text-parchment-300 hover:bg-midnight-700'
              }`}
            >
              <span className="text-xs text-parchment-500">Ch. {i + 1}</span>
              <p className="text-sm truncate">{chapter.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col">
        {selectedChapter ? (
          <>
            <header className="flex items-center justify-between px-6 py-3 bg-midnight-800/50 border-b border-midnight-700">
              <div>
                <h1 className="font-serif font-bold text-parchment-100">{selectedChapter.title}</h1>
                <p className="text-xs text-parchment-500">{content.split(/\s+/).filter(Boolean).length} palabras</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedText && (
                  <Button size="sm" onClick={() => setShowRelationPicker(true)}>
                    <Link2 className="w-4 h-4 mr-1" /> Relacionar "{selectedText.substring(0, 20)}..."
                  </Button>
                )}
                <Button size="sm" variant={isSaving ? 'secondary' : 'primary'} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                  <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onSelect={handleTextSelect}
                    className="w-full min-h-[600px] bg-transparent text-parchment-200 font-serif text-lg leading-relaxed resize-none focus:outline-none"
                    placeholder="Escribe tu capítulo aquí..."
                  />
                </div>
              </div>

              {/* Relations panel */}
              <div className="w-80 bg-midnight-800 border-l border-midnight-700 flex flex-col">
                <div className="p-4 border-b border-midnight-700">
                  <h3 className="font-serif font-bold text-parchment-100 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Relaciones ({relations.length})
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {relations.length === 0 ? (
                    <p className="text-sm text-parchment-500 text-center py-4">
                      Selecciona texto y haz clic en "Relacionar" para vincular elementos del mundo
                    </p>
                  ) : (
                    relations.map((rel) => (
                      <motion.div
                        key={rel.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-lg border bg-midnight-700/50 border-midnight-600 hover:border-burnt-500/50 transition-all overflow-hidden cursor-pointer group"
                        onClick={() => setViewingRelation(rel)}
                      >
                        <div className="p-3 flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${TARGET_COLORS[rel.targetType]}`}>
                                {TARGET_LABELS[rel.targetType]}
                              </span>
                              <Eye className="w-3 h-3 text-parchment-600 group-hover:text-burnt-400 transition-colors" />
                            </div>
                            <p className="text-sm text-parchment-200 mt-1 truncate">
                              {rel.target?.name || rel.target?.title || 'Sin nombre'}
                            </p>
                            {rel.selectedText && (
                              <p className="text-[10px] text-parchment-500 mt-0.5 italic truncate">"{rel.selectedText}"</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRelation(rel.id); }}
                            className="p-1 text-parchment-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-parchment-400">
            <div className="text-center">
              <Layers className="w-12 h-12 mx-auto mb-4" />
              <p>Selecciona un capítulo para comenzar a escribir</p>
            </div>
          </div>
        )}
      </div>

      {/* Relation picker modal */}
      <AnimatePresence>
        {showRelationPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowRelationPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-midnight-800 border border-midnight-600 rounded-xl w-[800px] max-h-[600px] flex overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sidebar - Categories */}
              <div className="w-48 bg-midnight-900 border-r border-midnight-700 flex flex-col">
                <div className="p-3 border-b border-midnight-700">
                  <h3 className="font-serif font-bold text-parchment-100 text-sm">Categorías</h3>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  <button
                    onClick={() => setFilterType('')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                      !filterType ? 'bg-burnt-500/20 text-burnt-400' : 'text-parchment-400 hover:bg-midnight-700'
                    }`}
                  >
                    <Layers className="w-4 h-4" /> Todos
                  </button>
                  {Object.entries(TARGET_LABELS).map(([type, label]) => {
                    const count = worldElements?.[type as keyof WorldElements]?.length || 0;
                    return (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                          filterType === type ? 'bg-burnt-500/20 text-burnt-400' : 'text-parchment-400 hover:bg-midnight-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${TARGET_COLORS[type]?.split(' ')[0] || 'bg-parchment-500'}`} />
                        <span className="flex-1 truncate">{label}</span>
                        <span className="text-xs text-parchment-600">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-midnight-700">
                  <div>
                    <h3 className="font-serif font-bold text-parchment-100">Relacionar texto</h3>
                    <p className="text-xs text-parchment-500">"{selectedText.substring(0, 50)}..."</p>
                  </div>
                  <button onClick={() => setShowRelationPicker(false)} className="text-parchment-400 hover:text-parchment-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 border-b border-midnight-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                    <Input
                      placeholder="Buscar elemento..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {!worldElements ? (
                    <p className="text-center text-parchment-500 py-8">Cargando elementos del mundo...</p>
                  ) : filteredElements.length === 0 ? (
                    <p className="text-center text-parchment-500 py-8">
                      {filterSearch || filterType ? 'No se encontraron elementos' : 'No hay elementos en este mundo'}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {filteredElements.map(([type, items]) => (
                        <div key={type}>
                          <h4 className="text-xs font-medium text-parchment-500 mb-2 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${TARGET_COLORS[type]?.split(' ')[0] || 'bg-parchment-500'}`} />
                            {TARGET_LABELS[type]} ({items.length})
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {items.map((item: any) => (
                              <button
                                key={item.id}
                                onClick={() => handleCreateRelation(type, item.id)}
                                className="text-left p-3 rounded-lg bg-midnight-700/50 hover:bg-midnight-600 border border-midnight-600 hover:border-burnt-500/50 transition-all group"
                              >
                                <p className="text-sm text-parchment-200 truncate group-hover:text-parchment-100">{item.name || item.title}</p>
                                {(item.species || item.climate || item.era || item.dangerLevel) && (
                                  <p className="text-[10px] text-parchment-500 mt-0.5">
                                    {item.species || item.climate || item.era || item.dangerLevel}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create chapter modal */}
      <AnimatePresence>
        {showCreateChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowCreateChapter(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-midnight-800 border border-midnight-600 rounded-xl w-[400px] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-burnt-400" />
                <h3 className="font-serif font-bold text-parchment-100">Nuevo Capítulo</h3>
              </div>
              <Input
                placeholder="Título del capítulo"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChapter(); }}
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCreateChapter(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleCreateChapter} disabled={!newChapterTitle.trim() || isCreatingChapter}>
                  {isCreatingChapter ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relation viewer modal */}
      <AnimatePresence>
        {viewingRelation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setViewingRelation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-midnight-800 border border-midnight-600 rounded-xl w-[85vw] max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-midnight-700">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${TARGET_COLORS[viewingRelation.targetType]}`}>
                    {TARGET_LABELS[viewingRelation.targetType]}
                  </span>
                  <h3 className="font-serif font-bold text-parchment-100">
                    {viewingRelation.target?.name || viewingRelation.target?.title || 'Sin nombre'}
                  </h3>
                </div>
                <button onClick={() => setViewingRelation(null)} className="text-parchment-400 hover:text-parchment-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {viewingRelation.selectedText && (
                  <div className="p-3 bg-midnight-700/50 rounded-lg border-l-4 border-burnt-500">
                    <p className="text-xs text-parchment-500 mb-1">Texto seleccionado:</p>
                    <p className="text-sm text-parchment-300 italic">"{viewingRelation.selectedText}"</p>
                  </div>
                )}

                {/* Image */}
                {viewingRelation.target?.imageUrl && (
                  <img src={viewingRelation.target.imageUrl} alt={viewingRelation.target.name} className="w-full h-40 object-cover rounded-lg border border-midnight-600" />
                )}
                {viewingRelation.target?.images?.[0]?.url && (
                  <img src={viewingRelation.target.images[0].url} alt={viewingRelation.target.name} className="w-full h-40 object-cover rounded-lg border border-midnight-600" />
                )}

                {/* Simulator */}
                {viewingRelation.targetType === 'CONTINENT' && viewingRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <ContinentSimulator continent={viewingRelation.target} />
                  </div>
                )}
                {viewingRelation.targetType === 'SEA' && viewingRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <SeaSimulator sea={viewingRelation.target} />
                  </div>
                )}
                {viewingRelation.targetType === 'MAP' && viewingRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <MapSimulator map={viewingRelation.target} />
                  </div>
                )}
                {viewingRelation.targetType === 'BESTIARY' && viewingRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <BestiarySimulator creatures={[viewingRelation.target]} />
                  </div>
                )}

                {/* Inline visuals for types without dedicated simulator */}
                {viewingRelation.targetType === 'CHARACTER' && viewingRelation.target && (
                  <div className="rounded-lg border border-midnight-600 bg-midnight-700/50 p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/50 mx-auto mb-4 flex items-center justify-center text-3xl text-blue-400 font-serif">
                      {viewingRelation.target.name?.charAt(0) || '?'}
                    </div>
                    <h4 className="font-serif font-bold text-parchment-100 text-xl">{viewingRelation.target.name}</h4>
                    {viewingRelation.target.title && <p className="text-sm text-parchment-400 mt-1">{viewingRelation.target.title}</p>}
                    {viewingRelation.target.role && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{viewingRelation.target.role}</span>}
                  </div>
                )}

                {viewingRelation.targetType === 'NATION' && viewingRelation.target && (
                  <div className="rounded-lg border border-midnight-600 bg-gradient-to-br from-red-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                        <span className="text-2xl">⚔️</span>
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.name}</h4>
                        {viewingRelation.target.government && <p className="text-sm text-parchment-400">{viewingRelation.target.government}</p>}
                      </div>
                    </div>
                    {viewingRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{viewingRelation.target.description}</p>}
                  </div>
                )}

                {viewingRelation.targetType === 'MAGIC_SYSTEM' && viewingRelation.target && (
                  <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-violet-500/20 border border-violet-500/50 flex items-center justify-center text-3xl">
                        ✨
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.name}</h4>
                        {viewingRelation.target.type && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{viewingRelation.target.type}</span>}
                      </div>
                    </div>
                    {viewingRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{viewingRelation.target.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {viewingRelation.target.source && <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-400">Fuente: {viewingRelation.target.source}</span>}
                      {viewingRelation.target.limitations && <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-400">Limitaciones: {viewingRelation.target.limitations}</span>}
                    </div>
                  </div>
                )}

                {viewingRelation.targetType === 'SPELL' && viewingRelation.target && (
                  <div className="rounded-lg border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-3xl">
                        🔮
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.name}</h4>
                        {viewingRelation.target.level && <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400">Nivel: {viewingRelation.target.level}</span>}
                      </div>
                    </div>
                    {viewingRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{viewingRelation.target.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {viewingRelation.target.castingTime && <span className="text-xs px-2 py-1 rounded bg-fuchsia-500/10 text-fuchsia-400">Casting: {viewingRelation.target.castingTime}</span>}
                      {viewingRelation.target.range && <span className="text-xs px-2 py-1 rounded bg-fuchsia-500/10 text-fuchsia-400">Alcance: {viewingRelation.target.range}</span>}
                      {viewingRelation.target.duration && <span className="text-xs px-2 py-1 rounded bg-fuchsia-500/10 text-fuchsia-400">Duración: {viewingRelation.target.duration}</span>}
                    </div>
                  </div>
                )}

                {viewingRelation.targetType === 'HERALDRY' && viewingRelation.target && (
                  <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-3xl">
                        🛡️
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.name || viewingRelation.target.title}</h4>
                      </div>
                    </div>
                    {viewingRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{viewingRelation.target.description}</p>}
                    {viewingRelation.target.composition && (
                      <div className="mt-3 p-3 bg-midnight-800/50 rounded-lg">
                        <p className="text-xs text-parchment-500 mb-1">Composición:</p>
                        <pre className="text-xs text-parchment-300 whitespace-pre-wrap">{typeof viewingRelation.target.composition === 'string' ? viewingRelation.target.composition : JSON.stringify(viewingRelation.target.composition, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {viewingRelation.targetType === 'TIMELINE_EVENT' && viewingRelation.target && (
                  <div className="rounded-lg border border-rose-500/30 bg-gradient-to-br from-rose-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-3xl">
                        📅
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.title}</h4>
                        {viewingRelation.target.dateInWorld && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">{viewingRelation.target.dateInWorld}</span>}
                      </div>
                    </div>
                    {viewingRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{viewingRelation.target.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {viewingRelation.target.era && <span className="text-xs px-2 py-1 rounded bg-rose-500/10 text-rose-400">Era: {viewingRelation.target.era}</span>}
                      {viewingRelation.target.importance && <span className="text-xs px-2 py-1 rounded bg-rose-500/10 text-rose-400">Importancia: {viewingRelation.target.importance}</span>}
                    </div>
                  </div>
                )}

                {viewingRelation.targetType === 'LAW' && viewingRelation.target && (
                  <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-3xl">
                        ⚖️
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.title}</h4>
                        <div className="flex gap-2 mt-1">
                          {viewingRelation.target.severity && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{viewingRelation.target.severity}</span>}
                          {viewingRelation.target.status && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{viewingRelation.target.status}</span>}
                        </div>
                      </div>
                    </div>
                    {viewingRelation.target.content && <p className="text-sm text-parchment-400 line-clamp-4">{viewingRelation.target.content}</p>}
                  </div>
                )}

                {viewingRelation.targetType === 'REGION' && viewingRelation.target && (
                  <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-3xl">
                        🗺️
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{viewingRelation.target.name}</h4>
                      </div>
                    </div>
                    {viewingRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{viewingRelation.target.description}</p>}
                  </div>
                )}

                {/* Info */}
                <div className="space-y-3">
                  {viewingRelation.target?.description && (
                    <div>
                      <h4 className="text-xs font-medium text-parchment-500 mb-1">Descripción</h4>
                      <p className="text-sm text-parchment-300">{viewingRelation.target.description}</p>
                    </div>
                  )}
                  {viewingRelation.target?.bio && (
                    <div>
                      <h4 className="text-xs font-medium text-parchment-500 mb-1">Biografía</h4>
                      <p className="text-sm text-parchment-300">{viewingRelation.target.bio}</p>
                    </div>
                  )}
                  {viewingRelation.target?.synopsis && (
                    <div>
                      <h4 className="text-xs font-medium text-parchment-500 mb-1">Sinopsis</h4>
                      <p className="text-sm text-parchment-300">{viewingRelation.target.synopsis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {viewingRelation.target?.species && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400">Especie: {viewingRelation.target.species}</span>
                    )}
                    {viewingRelation.target?.dangerLevel && (
                      <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400">Peligro: {viewingRelation.target.dangerLevel}</span>
                    )}
                    {viewingRelation.target?.habitat && (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">Hábitat: {viewingRelation.target.habitat}</span>
                    )}
                    {viewingRelation.target?.diet && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400">Dieta: {viewingRelation.target.diet}</span>
                    )}
                    {viewingRelation.target?.climate && (
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400">Clima: {viewingRelation.target.climate}</span>
                    )}
                    {viewingRelation.target?.tone && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">Tono: {viewingRelation.target.tone}</span>
                    )}
                    {viewingRelation.target?.era && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400">Era: {viewingRelation.target.era}</span>
                    )}
                    {viewingRelation.target?.powerLevel && (
                      <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-400">Poder: {viewingRelation.target.powerLevel}</span>
                    )}
                    {viewingRelation.target?.dateInWorld && (
                      <span className="text-xs px-2 py-1 rounded bg-rose-500/10 text-rose-400">Fecha: {viewingRelation.target.dateInWorld}</span>
                    )}
                    {viewingRelation.target?.severity && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400">Severidad: {viewingRelation.target.severity}</span>
                    )}
                    {viewingRelation.target?.status && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">Estado: {viewingRelation.target.status}</span>
                    )}
                    {viewingRelation.target?.region?.name && (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Región: {viewingRelation.target.region.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-midnight-700">
                <Button variant="secondary" className="w-full" onClick={() => setViewingRelation(null)}>
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WritingPage;
