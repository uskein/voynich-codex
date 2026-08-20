import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronLeft, ChevronRight, Settings, Moon, Sun, Sunset,
  Minus, Plus, PanelLeftClose, PanelLeft, Bookmark, Share2, X, Link2, ChevronDown
} from 'lucide-react';
import { chapterAPI, chapterRelationAPI, manuscriptAPI } from '../../services/api';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../../components/ui/Button';
import { ContinentSimulator } from '../../components/visualizers/ContinentSimulator';
import { SeaSimulator } from '../../components/visualizers/SeaSimulator';
import { MapSimulator } from '../../components/visualizers/MapSimulator';
import { BestiarySimulator } from '../../components/visualizers/BestiarySimulator';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  isPublished: boolean;
}

interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  chapters: Chapter[];
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
  CHARACTER: 'border-b-2 border-blue-400 text-blue-300 hover:bg-blue-500/10',
  BESTIARY: 'border-b-2 border-purple-400 text-purple-300 hover:bg-purple-500/10',
  CONTINENT: 'border-b-2 border-green-400 text-green-300 hover:bg-green-500/10',
  SEA: 'border-b-2 border-cyan-400 text-cyan-300 hover:bg-cyan-500/10',
  REGION: 'border-b-2 border-emerald-400 text-emerald-300 hover:bg-emerald-500/10',
  MAP: 'border-b-2 border-amber-400 text-amber-300 hover:bg-amber-500/10',
  NATION: 'border-b-2 border-red-400 text-red-300 hover:bg-red-500/10',
  MAGIC_SYSTEM: 'border-b-2 border-violet-400 text-violet-300 hover:bg-violet-500/10',
  SPELL: 'border-b-2 border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/10',
  LAW: 'border-b-2 border-yellow-400 text-yellow-300 hover:bg-yellow-500/10',
  HERALDRY: 'border-b-2 border-orange-400 text-orange-300 hover:bg-orange-500/10',
  TIMELINE_EVENT: 'border-b-2 border-rose-400 text-rose-300 hover:bg-rose-500/10'
};

export function ReadingPage() {
  const { manuscriptId, chapterId } = useParams<{ manuscriptId: string; chapterId: string }>();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    loadData();
  }, [manuscriptId, chapterId]);

  useEffect(() => {
    if (currentChapter) loadRelations();
  }, [currentChapter]);

  const loadData = async () => {
    if (!manuscriptId) return;
    try {
      const [manuscriptRes, chapterRes] = await Promise.all([
        manuscriptAPI.get(manuscriptId),
        chapterId ? chapterAPI.get(manuscriptId, chapterId) : Promise.resolve(null)
      ]);
      setManuscript(manuscriptRes.data.manuscript);
      setCurrentChapter(chapterRes?.data?.chapter || manuscriptRes.data.manuscript.chapters?.[0]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelations = async () => {
    if (!currentChapter) return;
    try {
      const { data } = await chapterRelationAPI.list(currentChapter.id);
      setRelations(data.relations);
    } catch (error) {
      console.error('Failed to load relations:', error);
    }
  };

  const chapters = manuscript?.chapters || [];
  const currentIndex = chapters.findIndex(c => c.id === currentChapter?.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const renderContentWithHighlights = () => {
    const raw = currentChapter?.content || '';
    if (!raw || relations.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: raw || '<p>No content yet...</p>' }} />;
    }

    // Parse HTML to plain text preserving structure, then highlight
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = raw;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    const sorted = [...relations].sort((a, b) => a.startOffset - b.startOffset);
    const parts: { text: string; relation?: Relation }[] = [];
    let lastEnd = 0;

    for (const rel of sorted) {
      const start = Math.max(rel.startOffset, lastEnd);
      const end = rel.endOffset;
      if (start >= end) continue;
      if (start > lastEnd) {
        parts.push({ text: plainText.substring(lastEnd, start) });
      }
      parts.push({ text: plainText.substring(start, end), relation: rel });
      lastEnd = end;
    }
    if (lastEnd < plainText.length) {
      parts.push({ text: plainText.substring(lastEnd) });
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
              className={`cursor-pointer transition-colors rounded px-0.5 ${TARGET_COLORS[part.relation.targetType] || 'border-b-2 border-parchment-400'}`}
              title={`${TARGET_LABELS[part.relation.targetType] || part.relation.targetType}: ${part.relation.target?.name || part.relation.target?.title || ''}`}
            >
              {part.text}
            </span>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-midnight-900">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-midnight-800 border-r border-midnight-700 overflow-hidden"
          >
            <div className="w-[300px] h-full flex flex-col">
              <div className="p-4 border-b border-midnight-700">
                <Link
                  to={`/manuscripts/${manuscriptId}`}
                  className="flex items-center gap-2 text-parchment-400 hover:text-parchment-200 mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Back to Manuscript</span>
                </Link>
                <h2 className="font-serif text-lg font-bold text-parchment-100 truncate">
                  {manuscript?.title}
                </h2>
                {manuscript?.subtitle && (
                  <p className="text-sm text-parchment-400 truncate">{manuscript.subtitle}</p>
                )}
                <Link to={`/manuscripts/${manuscriptId}/write`} className="mt-3">
                  <Button size="sm" variant="secondary" className="w-full">
                    <Link2 className="w-4 h-4 mr-1" /> Escribir / Relacionar
                  </Button>
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {chapters.map((chapter, i) => (
                  <button
                    key={chapter.id}
                    onClick={() => setCurrentChapter(chapter)}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                      currentChapter?.id === chapter.id
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main reading area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-midnight-800/50 backdrop-blur-sm border-b border-midnight-700">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-300">
              {showSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-serif font-bold text-parchment-100">{currentChapter?.title || 'Select a chapter'}</h1>
              <p className="text-xs text-parchment-500">Chapter {currentIndex + 1} of {chapters.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {relations.length > 0 && (
              <span className="text-xs text-parchment-500 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> {relations.length} relaciones
              </span>
            )}
            <Button variant="ghost" size="sm"><Bookmark className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Share2 className="w-4 h-4" /></Button>
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="w-4 h-4" />
              </Button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-midnight-800 border border-midnight-600 rounded-xl shadow-xl p-4 z-50"
                  >
                    <h3 className="font-medium text-parchment-100 mb-4">Reading Settings</h3>
                    <div className="mb-4">
                      <label className="text-sm text-parchment-400 mb-2 block">Theme</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'light', icon: Sun, label: 'Light' },
                          { value: 'dark', icon: Moon, label: 'Dark' },
                          { value: 'sepia', icon: Sunset, label: 'Sepia' }
                        ].map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            onClick={() => setTheme(value as any)}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
                              theme === value
                                ? 'border-burnt-500 bg-burnt-500/10 text-burnt-400'
                                : 'border-midnight-600 text-parchment-400 hover:border-midnight-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm text-parchment-400 mb-2 block">Font Size: {fontSize}px</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-1 rounded hover:bg-midnight-700 text-parchment-400">
                          <Minus className="w-4 h-4" />
                        </button>
                        <input type="range" min="14" max="28" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1 accent-burnt-500" />
                        <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="p-1 rounded hover:bg-midnight-700 text-parchment-400">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-parchment-400 mb-2 block">Line Height: {lineHeight}</label>
                      <input type="range" min="1.5" max="2.5" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-burnt-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            {currentChapter ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentChapter.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                  <h1 className="font-serif text-4xl font-bold text-parchment-100 mb-8 text-center">
                    {currentChapter.title}
                  </h1>
                  <div style={{ fontSize: `${fontSize}px`, lineHeight }}>
                    {renderContentWithHighlights()}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-parchment-400">
                <BookOpen className="w-12 h-12 mb-4" />
                <p>Select a chapter to start reading</p>
              </div>
            )}
          </div>
        </main>

        <footer className="flex items-center justify-between px-4 py-3 bg-midnight-800/50 backdrop-blur-sm border-t border-midnight-700">
          {prevChapter ? (
            <Button variant="ghost" onClick={() => setCurrentChapter(prevChapter)}>
              <ChevronLeft className="w-4 h-4 mr-2" />{prevChapter.title}
            </Button>
          ) : <div />}
          <div className="text-sm text-parchment-500">{currentIndex + 1} / {chapters.length}</div>
          {nextChapter ? (
            <Button variant="ghost" onClick={() => setCurrentChapter(nextChapter)}>
              {nextChapter.title}<ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : <div />}
        </footer>
      </div>

      {/* Relation detail modal */}
      <AnimatePresence>
        {selectedRelation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setSelectedRelation(null)}
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
                  <span className={`text-xs px-2 py-0.5 rounded ${TARGET_COLORS[selectedRelation.targetType]?.replace('border-b-2 ', '') || 'bg-midnight-700 text-parchment-300'}`}>
                    {TARGET_LABELS[selectedRelation.targetType]}
                  </span>
                  <h3 className="font-serif font-bold text-parchment-100">
                    {selectedRelation.target?.name || selectedRelation.target?.title || 'Sin nombre'}
                  </h3>
                </div>
                <button onClick={() => setSelectedRelation(null)} className="text-parchment-400 hover:text-parchment-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                {selectedRelation.selectedText && (
                  <div className="p-3 bg-midnight-700/50 rounded-lg border-l-4 border-burnt-500">
                    <p className="text-xs text-parchment-500 mb-1">Texto seleccionado:</p>
                    <p className="text-sm text-parchment-300 italic">"{selectedRelation.selectedText}"</p>
                  </div>
                )}

                {/* Image */}
                {selectedRelation.target?.imageUrl && (
                  <img src={selectedRelation.target.imageUrl} alt={selectedRelation.target.name} className="w-full h-40 object-cover rounded-lg border border-midnight-600" />
                )}
                {selectedRelation.target?.images?.[0]?.url && (
                  <img src={selectedRelation.target.images[0].url} alt={selectedRelation.target.name} className="w-full h-40 object-cover rounded-lg border border-midnight-600" />
                )}

                {/* Simulator */}
                {selectedRelation.targetType === 'CONTINENT' && selectedRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <ContinentSimulator continent={selectedRelation.target} />
                  </div>
                )}
                {selectedRelation.targetType === 'SEA' && selectedRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <SeaSimulator sea={selectedRelation.target} />
                  </div>
                )}
                {selectedRelation.targetType === 'MAP' && selectedRelation.target?.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <MapSimulator map={selectedRelation.target} />
                  </div>
                )}
                {selectedRelation.targetType === 'BESTIARY' && selectedRelation.target && (
                  <div className="rounded-lg overflow-hidden border border-midnight-600">
                    <BestiarySimulator creatures={[selectedRelation.target]} />
                  </div>
                )}

                {selectedRelation.targetType === 'CHARACTER' && selectedRelation.target && (
                  <div className="rounded-lg border border-midnight-600 bg-midnight-700/50 p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/50 mx-auto mb-4 flex items-center justify-center text-3xl text-blue-400 font-serif">
                      {selectedRelation.target.name?.charAt(0) || '?'}
                    </div>
                    <h4 className="font-serif font-bold text-parchment-100 text-xl">{selectedRelation.target.name}</h4>
                    {selectedRelation.target.title && <p className="text-sm text-parchment-400 mt-1">{selectedRelation.target.title}</p>}
                    {selectedRelation.target.role && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{selectedRelation.target.role}</span>}
                  </div>
                )}

                {selectedRelation.targetType === 'NATION' && selectedRelation.target && (
                  <div className="rounded-lg border border-red-500/30 bg-gradient-to-br from-red-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-3xl">⚔️</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.name}</h4>
                        {selectedRelation.target.government && <p className="text-sm text-parchment-400">{selectedRelation.target.government}</p>}
                      </div>
                    </div>
                    {selectedRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{selectedRelation.target.description}</p>}
                  </div>
                )}

                {selectedRelation.targetType === 'MAGIC_SYSTEM' && selectedRelation.target && (
                  <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-violet-500/20 border border-violet-500/50 flex items-center justify-center text-3xl">✨</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.name}</h4>
                        {selectedRelation.target.type && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{selectedRelation.target.type}</span>}
                      </div>
                    </div>
                    {selectedRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{selectedRelation.target.description}</p>}
                  </div>
                )}

                {selectedRelation.targetType === 'SPELL' && selectedRelation.target && (
                  <div className="rounded-lg border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-3xl">🔮</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.name}</h4>
                        {selectedRelation.target.level && <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400">Nivel: {selectedRelation.target.level}</span>}
                      </div>
                    </div>
                    {selectedRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{selectedRelation.target.description}</p>}
                  </div>
                )}

                {selectedRelation.targetType === 'HERALDRY' && selectedRelation.target && (
                  <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-3xl">🛡️</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.name || selectedRelation.target.title}</h4>
                      </div>
                    </div>
                    {selectedRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{selectedRelation.target.description}</p>}
                  </div>
                )}

                {selectedRelation.targetType === 'TIMELINE_EVENT' && selectedRelation.target && (
                  <div className="rounded-lg border border-rose-500/30 bg-gradient-to-br from-rose-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-3xl">📅</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.title}</h4>
                        {selectedRelation.target.dateInWorld && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">{selectedRelation.target.dateInWorld}</span>}
                      </div>
                    </div>
                    {selectedRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{selectedRelation.target.description}</p>}
                  </div>
                )}

                {selectedRelation.targetType === 'LAW' && selectedRelation.target && (
                  <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-3xl">⚖️</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.title}</h4>
                        <div className="flex gap-2 mt-1">
                          {selectedRelation.target.severity && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{selectedRelation.target.severity}</span>}
                          {selectedRelation.target.status && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{selectedRelation.target.status}</span>}
                        </div>
                      </div>
                    </div>
                    {selectedRelation.target.content && <p className="text-sm text-parchment-400 line-clamp-4">{selectedRelation.target.content}</p>}
                  </div>
                )}

                {selectedRelation.targetType === 'REGION' && selectedRelation.target && (
                  <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-midnight-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-3xl">🗺️</div>
                      <div>
                        <h4 className="font-serif font-bold text-parchment-100 text-lg">{selectedRelation.target.name}</h4>
                      </div>
                    </div>
                    {selectedRelation.target.description && <p className="text-sm text-parchment-400 line-clamp-3">{selectedRelation.target.description}</p>}
                  </div>
                )}

                {/* Info */}
                <div className="space-y-3">
                  {selectedRelation.target?.description && (
                    <div>
                      <h4 className="text-xs font-medium text-parchment-500 mb-1">Descripción</h4>
                      <p className="text-sm text-parchment-300">{selectedRelation.target.description}</p>
                    </div>
                  )}

                  {selectedRelation.target?.bio && (
                    <div>
                      <h4 className="text-xs font-medium text-parchment-500 mb-1">Biografía</h4>
                      <p className="text-sm text-parchment-300">{selectedRelation.target.bio}</p>
                    </div>
                  )}

                  {selectedRelation.target?.synopsis && (
                    <div>
                      <h4 className="text-xs font-medium text-parchment-500 mb-1">Sinopsis</h4>
                      <p className="text-sm text-parchment-300">{selectedRelation.target.synopsis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {selectedRelation.target?.species && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400">Especie: {selectedRelation.target.species}</span>
                    )}
                    {selectedRelation.target?.dangerLevel && (
                      <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400">Peligro: {selectedRelation.target.dangerLevel}</span>
                    )}
                    {selectedRelation.target?.habitat && (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">Hábitat: {selectedRelation.target.habitat}</span>
                    )}
                    {selectedRelation.target?.diet && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400">Dieta: {selectedRelation.target.diet}</span>
                    )}
                    {selectedRelation.target?.climate && (
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400">Clima: {selectedRelation.target.climate}</span>
                    )}
                    {selectedRelation.target?.tone && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">Tono: {selectedRelation.target.tone}</span>
                    )}
                    {selectedRelation.target?.era && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400">Era: {selectedRelation.target.era}</span>
                    )}
                    {selectedRelation.target?.powerLevel && (
                      <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-400">Poder: {selectedRelation.target.powerLevel}</span>
                    )}
                    {selectedRelation.target?.dateInWorld && (
                      <span className="text-xs px-2 py-1 rounded bg-rose-500/10 text-rose-400">Fecha: {selectedRelation.target.dateInWorld}</span>
                    )}
                    {selectedRelation.target?.severity && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400">Severidad: {selectedRelation.target.severity}</span>
                    )}
                    {selectedRelation.target?.status && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">Estado: {selectedRelation.target.status}</span>
                    )}
                    {selectedRelation.target?.region?.name && (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Región: {selectedRelation.target.region.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-midnight-700">
                <Button variant="secondary" className="w-full" onClick={() => setSelectedRelation(null)}>
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

export default ReadingPage;
