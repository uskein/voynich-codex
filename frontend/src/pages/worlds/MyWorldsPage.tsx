import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Plus, Search, Filter, Users, FileText } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { worldAPI } from '../../services/api';

interface World {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  _count: { manuscripts: number; members: number };
  creator: { id: string; name: string };
}

export function MyWorldsPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWorlds();
  }, []);

  const loadWorlds = async () => {
    try {
      const { data } = await worldAPI.list();
      setWorlds(data.worlds);
    } catch (error) {
      console.error('Failed to load worlds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorlds = worlds.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-parchment-100">My Worlds</h1>
          <p className="text-parchment-400 mt-1">Manage your world-building projects</p>
        </div>
        <Link to="/worlds/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New World
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
          <Input
            placeholder="Search worlds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-midnight-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredWorlds.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-parchment-100 mb-2">No worlds yet</h3>
          <p className="text-parchment-400 mb-6">Create your first world to start building</p>
          <Link to="/worlds/new">
            <Button><Plus className="w-4 h-4 mr-2" /> Create World</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorlds.map((world, i) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/worlds/${world.id}`}>
                <Card variant="hover" className="h-full">
                  <div className="aspect-[16/9] bg-midnight-700 rounded-t-xl overflow-hidden">
                    {world.coverImage ? (
                      <img src={world.coverImage} alt={world.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Globe className="w-12 h-12 text-midnight-600" />
                      </div>
                    )}
                  </div>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-bold text-parchment-100 truncate">{world.name}</h3>
                        <p className="text-sm text-parchment-400 line-clamp-2 mt-1">
                          {world.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-parchment-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {world._count.manuscripts} manuscripts
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {world._count.members} members
                      </span>
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
