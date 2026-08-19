import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe, BookOpen, Users, Map, Swords, Scroll, Sparkles, Crown, Shield,
  Plus
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { OrbitHub } from '../../components/visualizers/OrbitHub';
import { AnimatedNumber } from '../../components/visualizers/AnimatedNumber';
import { worldAPI } from '../../services/api';

interface World {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  _count: {
    manuscripts: number;
    members: number;
    bestiary: number;
    characters: number;
    events: number;
    nations: number;
    magicSystems: number;
    heraldry: number;
  };
}

interface WorldModule {
  id: string;
  name: string;
  icon: any;
  color: string;
  count: number;
  href: string;
}

export function WorldDetailPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const [world, setWorld] = useState<World | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (worldId) loadWorld();
  }, [worldId]);

  const loadWorld = async () => {
    if (!worldId) return;
    try {
      const { data } = await worldAPI.get(worldId);
      setWorld(data.world);
    } catch (error) {
      console.error('Failed to load world:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modules: WorldModule[] = world ? [
    { id: 'bestiary', name: 'Bestiary', icon: Swords, color: 'text-red-400', count: world._count.bestiary, href: `/worlds/${worldId}/bestiary` },
    { id: 'characters', name: 'Characters', icon: Users, color: 'text-blue-400', count: world._count.characters, href: `/worlds/${worldId}/characters` },
    { id: 'timeline', name: 'Timeline', icon: Scroll, color: 'text-yellow-400', count: world._count.events, href: `/worlds/${worldId}/timeline` },
    { id: 'nations', name: 'Nations', icon: Crown, color: 'text-purple-400', count: world._count.nations, href: `/worlds/${worldId}/nations` },
    { id: 'heraldry', name: 'Coats of Arms', icon: Shield, color: 'text-amber-400', count: world._count.heraldry, href: `/worlds/${worldId}/heraldry` },
    { id: 'magic', name: 'Magic Systems', icon: Sparkles, color: 'text-pink-400', count: world._count.magicSystems, href: `/worlds/${worldId}/magic` },
    { id: 'geography', name: 'Geography', icon: Map, color: 'text-green-400', count: 0, href: `/worlds/${worldId}/geography` },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
      </div>
    );
  }

  if (!world) {
    return (
      <div className="text-center py-12">
        <Globe className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-parchment-100">World not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 bg-midnight-800 rounded-xl overflow-hidden"
      >
        {world.coverImage ? (
          <img src={world.coverImage} alt={world.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-700 to-midnight-800">
            <Globe className="w-24 h-24 text-midnight-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="font-serif text-3xl font-bold text-parchment-100">{world.name}</h1>
          {world.description && (
            <p className="text-parchment-300 mt-1 line-clamp-2">{world.description}</p>
          )}
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-burnt-400" />
            <div>
              <p className="text-2xl font-bold text-parchment-100">
                <AnimatedNumber value={world._count.manuscripts} />
              </p>
              <p className="text-xs text-parchment-400">Manuscripts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-parchment-100">
                <AnimatedNumber value={world._count.members} />
              </p>
              <p className="text-xs text-parchment-400">Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-parchment-100">
                <AnimatedNumber value={world._count.bestiary} />
              </p>
              <p className="text-xs text-parchment-400">Creatures</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Scroll className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-parchment-100">
                <AnimatedNumber value={world._count.events} />
              </p>
              <p className="text-xs text-parchment-400">Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* World Modules */}
      <section>
        <h2 className="font-serif text-xl font-bold text-parchment-100 mb-4">World Building Modules</h2>
        <OrbitHub modules={modules} centerLabel={world.name} />
      </section>

      {/* Manuscripts in this world */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-parchment-100">Manuscripts</h2>
          <Link to="/manuscripts/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Manuscript
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-parchment-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-midnight-500" />
            <p>Manuscripts for this world will appear here</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
