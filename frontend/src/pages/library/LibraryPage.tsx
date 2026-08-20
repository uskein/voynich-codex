import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Search, Star, Eye, Clock, Globe } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { manuscriptAPI } from '../../services/api';

interface PublicManuscript {
  id: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  synopsis?: string;
  genre?: string;
  wordCount: number;
  readTimeMinutes: number;
  viewCount: number;
  rating: number;
  publishedAt: string;
  creator: { id: string; name: string; avatarUrl?: string };
  world?: { id: string; name: string };
}

const genres = [
  'All', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance',
  'Historical', 'Literary Fiction', 'Poetry', 'Non-Fiction'
];

export function LibraryPage() {
  const [manuscripts, setManuscripts] = useState<PublicManuscript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular');

  useEffect(() => {
    loadManuscripts();
  }, []);

  const loadManuscripts = async () => {
    try {
      const { data } = await manuscriptAPI.publicList({
        search: searchTerm,
        genre: selectedGenre === 'All' ? undefined : selectedGenre,
        sort: sortBy
      });
      setManuscripts(data.manuscripts || []);
    } catch (error) {
      console.error('Failed to load manuscripts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadManuscripts();
  };

  const filteredManuscripts = manuscripts.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || m.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="font-serif text-4xl font-bold text-parchment-100 mb-2">
          Public Library
        </h1>
        <p className="text-parchment-400 text-lg">
          Discover stories from creators around the world
        </p>
      </motion.div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-400" />
            <input
              type="text"
              placeholder="Search manuscripts, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 bg-midnight-800/50 border border-midnight-600 rounded-xl text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 text-lg"
            />
          </div>
          <Button onClick={handleSearch} size="lg">
            Search
          </Button>
        </div>

        {/* Genre filters */}
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => { setSelectedGenre(genre); loadManuscripts(); }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedGenre === genre
                  ? 'bg-burnt-500 text-white'
                  : 'bg-midnight-800 text-parchment-300 hover:bg-midnight-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-4">
          <span className="text-parchment-400 text-sm">Sort by:</span>
          {[
            { value: 'popular', label: 'Most Popular' },
            { value: 'newest', label: 'Newest' },
            { value: 'rating', label: 'Highest Rated' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => { setSortBy(option.value as any); loadManuscripts(); }}
              className={`text-sm transition-colors ${
                sortBy === option.value
                  ? 'text-burnt-400 font-medium'
                  : 'text-parchment-400 hover:text-parchment-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-80 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredManuscripts.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-parchment-100 mb-2">No manuscripts found</h3>
          <p className="text-parchment-400">Try adjusting your search or filters</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredManuscripts.map((manuscript, i) => (
            <motion.div
              key={manuscript.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/manuscripts/${manuscript.id}/read`}>
                <Card variant="hover" className="h-full">
                  <div className="aspect-[3/4] bg-midnight-700 rounded-t-xl overflow-hidden relative">
                    {manuscript.coverImage ? (
                      <img
                        src={manuscript.coverImage}
                        alt={manuscript.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-midnight-600" />
                      </div>
                    )}
                    {manuscript.genre && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-midnight-800/80 text-parchment-200 text-xs rounded-full">
                          {manuscript.genre}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent>
                    <h3 className="font-serif font-bold text-parchment-100 truncate mb-1">
                      {manuscript.title}
                    </h3>
                    {manuscript.subtitle && (
                      <p className="text-sm text-parchment-400 truncate mb-2">
                        {manuscript.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-burnt-500/20 flex items-center justify-center">
                        <span className="text-xs text-burnt-400">
                          {manuscript.creator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-parchment-300 truncate">
                        {manuscript.creator.name}
                      </span>
                    </div>

                    {manuscript.world && (
                      <div className="flex items-center gap-1 text-xs text-parchment-500 mb-2">
                        <Globe className="w-3 h-3" />
                        <span>{manuscript.world.name}</span>
                      </div>
                    )}

                    <p className="text-xs text-parchment-400 line-clamp-2 mb-3">
                      {manuscript.synopsis || 'No synopsis available'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-parchment-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {manuscript.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {manuscript.readTimeMinutes}m
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>{manuscript.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryPage;