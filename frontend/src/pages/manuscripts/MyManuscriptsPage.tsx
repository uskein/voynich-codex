import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, BookOpen, Calendar, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { manuscriptAPI } from '../../services/api';
import { format } from 'date-fns';

interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  genre?: string;
  wordCount: number;
  totalChapters: number;
  publishedChapters: number;
  completionPct: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  world?: { id: string; name: string };
  creator: { id: string; name: string; avatarUrl?: string };
}

export function MyManuscriptsPage() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private' | 'unlisted'>('all');

  useEffect(() => {
    loadManuscripts();
  }, []);

  const loadManuscripts = async () => {
    try {
      const { data } = await manuscriptAPI.list();
      setManuscripts(data.manuscripts);
    } catch (error) {
      console.error('Failed to load manuscripts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredManuscripts = manuscripts.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility =
      filterVisibility === 'all' ||
      (filterVisibility === 'public' && m.isPublic) ||
      (filterVisibility === 'private' && !m.isPublic);
    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-parchment-100">My Manuscripts</h1>
          <p className="text-parchment-400 mt-1">Your collection of stories and works</p>
        </div>
        <Link to="/manuscripts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Manuscript
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
          <Input
            placeholder="Search manuscripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'public', 'private'] as const).map((vis) => (
            <Button
              key={vis}
              variant={filterVisibility === vis ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterVisibility(vis)}
            >
              {vis.charAt(0).toUpperCase() + vis.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredManuscripts.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-parchment-100 mb-2">No manuscripts yet</h3>
          <p className="text-parchment-400 mb-6">Start writing your first manuscript</p>
          <Link to="/manuscripts/new">
            <Button><Plus className="w-4 h-4 mr-2" /> Create Manuscript</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManuscripts.map((manuscript, i) => (
            <motion.div
              key={manuscript.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/manuscripts/${manuscript.id}`}>
                <Card variant="hover" className="h-full">
                  <div className="aspect-[3/4] bg-midnight-700 rounded-t-xl overflow-hidden relative">
                    {manuscript.coverImage ? (
                      <img src={manuscript.coverImage} alt={manuscript.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-midnight-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {manuscript.isPublic ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-midnight-600/80 text-parchment-300 text-xs rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                  </div>
                  <CardContent>
                    <h3 className="font-serif font-bold text-parchment-100 truncate">{manuscript.title}</h3>
                    {manuscript.subtitle && (
                      <p className="text-sm text-parchment-400 truncate">{manuscript.subtitle}</p>
                    )}
                    {manuscript.world && (
                      <p className="text-xs text-parchment-500 mt-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {manuscript.world.name}
                      </p>
                    )}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-parchment-500">
                        <span>{manuscript.wordCount.toLocaleString()} words</span>
                        <span>{manuscript.publishedChapters}/{manuscript.totalChapters} chapters</span>
                      </div>
                      <div className="w-full bg-midnight-700 rounded-full h-1.5">
                        <div
                          className="bg-burnt-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${manuscript.completionPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-xs text-parchment-500">
                      <Calendar className="w-3 h-3" />
                      <span>Updated {format(new Date(manuscript.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredManuscripts.length * 0.05 }}
          >
            <Link to="/manuscripts/new">
              <Card variant="bordered" className="h-full flex items-center justify-center min-h-[400px] border-dashed">
                <div className="text-center">
                  <Plus className="w-8 h-8 text-parchment-500 mx-auto mb-2" />
                  <p className="text-parchment-400">Create New Manuscript</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Globe(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export default MyManuscriptsPage;