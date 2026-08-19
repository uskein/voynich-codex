import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronLeft, ChevronRight, Settings, Moon, Sun, Sunset,
  Minus, Plus, PanelLeftClose, PanelLeft, Bookmark, Share2
} from 'lucide-react';
import { chapterAPI, manuscriptAPI } from '../../services/api';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../../components/ui/Button';

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

export function ReadingPage() {
  const { manuscriptId, chapterId } = useParams<{ manuscriptId: string; chapterId: string }>();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    loadData();
  }, [manuscriptId, chapterId]);

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

  const chapters = manuscript?.chapters || [];
  const currentIndex = chapters.findIndex(c => c.id === currentChapter?.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-midnight-900">
      {/* Sidebar - Chapter list */}
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
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-midnight-800/50 backdrop-blur-sm border-b border-midnight-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-300"
            >
              {showSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-serif font-bold text-parchment-100">
                {currentChapter?.title || 'Select a chapter'}
              </h1>
              <p className="text-xs text-parchment-500">
                Chapter {currentIndex + 1} of {chapters.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>

              {/* Settings dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-midnight-800 border border-midnight-600 rounded-xl shadow-xl p-4 z-50"
                  >
                    <h3 className="font-medium text-parchment-100 mb-4">Reading Settings</h3>

                    {/* Theme */}
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

                    {/* Font size */}
                    <div className="mb-4">
                      <label className="text-sm text-parchment-400 mb-2 block">Font Size: {fontSize}px</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                          className="p-1 rounded hover:bg-midnight-700 text-parchment-400"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="range"
                          min="14"
                          max="28"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="flex-1 accent-burnt-500"
                        />
                        <button
                          onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                          className="p-1 rounded hover:bg-midnight-700 text-parchment-400"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Line height */}
                    <div>
                      <label className="text-sm text-parchment-400 mb-2 block">Line Height: {lineHeight}</label>
                      <input
                        type="range"
                        min="1.5"
                        max="2.5"
                        step="0.1"
                        value={lineHeight}
                        onChange={(e) => setLineHeight(Number(e.target.value))}
                        className="w-full accent-burnt-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            {currentChapter ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentChapter.id}
                  className="[perspective:1600px]"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24, rotateY: -45 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
                >
                  <motion.div
                    initial={{ rotateY: 55, transformPerspective: 1500, transformOrigin: 'left center' }}
                    animate={{ rotateY: 0 }}
                    transition={{ type: 'spring', stiffness: 110, damping: 22 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <h1 className="font-serif text-4xl font-bold text-parchment-100 mb-8 text-center">
                      {currentChapter.title}
                    </h1>
                    <div
                      className="prose prose-invert max-w-none font-serif text-parchment-200 leading-relaxed"
                      style={{ fontSize: `${fontSize}px`, lineHeight }}
                      dangerouslySetInnerHTML={{ __html: currentChapter.content || '<p>No content yet...</p>' }}
                    />
                  </motion.div>
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

        {/* Bottom navigation */}
        <footer className="flex items-center justify-between px-4 py-3 bg-midnight-800/50 backdrop-blur-sm border-t border-midnight-700">
          {prevChapter ? (
            <Button
              variant="ghost"
              onClick={() => setCurrentChapter(prevChapter)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {prevChapter.title}
            </Button>
          ) : (
            <div />
          )}

          <div className="text-sm text-parchment-500">
            {currentIndex + 1} / {chapters.length}
          </div>

          {nextChapter ? (
            <Button
              variant="ghost"
              onClick={() => setCurrentChapter(nextChapter)}
            >
              {nextChapter.title}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div />
          )}
        </footer>
      </div>
    </div>
  );
}
