import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, FileText, Users, BookOpen, Plus, ArrowRight, Clock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18n } from '../../i18n';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AnimatedNumber } from '../../components/visualizers/AnimatedNumber';
import { worldAPI, manuscriptAPI } from '../../services/api';

interface World {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: { manuscripts: number; members: number };
}

interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  completionPct: number;
  publishedChapters: number;
  totalChapters: number;
  createdAt: string;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [worldsRes, manuscriptsRes] = await Promise.all([
        worldAPI.list({ limit: 5 }),
        manuscriptAPI.list({ limit: 6 })
      ]);
      setWorlds(worldsRes.data.worlds);
      setManuscripts(manuscriptsRes.data.manuscripts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-serif text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.welcome')}, {user?.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-2">
          {t('dashboard.subtitle')}
        </p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.worlds'), value: worlds.length, icon: Globe, color: 'text-blue-400' },
          { label: t('dashboard.manuscripts'), value: manuscripts.length, icon: FileText, color: 'text-burnt-400' },
          { label: t('dashboard.published'), value: manuscripts.filter(m => m.publishedChapters > 0).length, icon: BookOpen, color: 'text-green-400' },
          { label: t('dashboard.inProgress'), value: manuscripts.filter(m => m.completionPct < 100).length, icon: Clock, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent worlds */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.myWorlds')}</h2>
          <Link to="/worlds">
            <Button variant="ghost" size="sm">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {worlds.map((world, i) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/worlds/${world.id}`}>
                <Card variant="hover">
                  <CardHeader>
                    <h3 className="font-serif font-bold" style={{ color: 'var(--text-primary)' }}>{world.name}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {world.description || t('dashboard.noDescription')}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {world._count.manuscripts} {t('dashboard.manuscriptsCount')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {world._count.members} {t('dashboard.membersCount')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: worlds.length * 0.1 }}
          >
            <Link to="/worlds/new">
              <Card variant="bordered" className="h-full flex items-center justify-center min-h-[160px] border-dashed">
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>{t('dashboard.createNewWorld')}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Recent manuscripts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.recentManuscripts')}</h2>
          <Link to="/manuscripts">
            <Button variant="ghost" size="sm">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {manuscripts.map((manuscript, i) => (
            <motion.div
              key={manuscript.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/manuscripts/${manuscript.id}`}>
                <Card variant="hover">
                  <div className="aspect-[3/4] rounded-t-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {manuscript.coverImage ? (
                      <img src={manuscript.coverImage} alt={manuscript.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12" style={{ color: 'var(--border-color)' }} />
                      </div>
                    )}
                  </div>
                  <CardContent>
                    <h3 className="font-serif font-bold truncate" style={{ color: 'var(--text-primary)' }}>{manuscript.title}</h3>
                    {manuscript.subtitle && (
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{manuscript.subtitle}</p>
                    )}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>{manuscript.publishedChapters}/{manuscript.totalChapters} {t('dashboard.chaptersCount')}</span>
                        <span>{manuscript.completionPct}%</span>
                      </div>
<div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
  <motion.div
    className="bg-burnt-500 h-1.5 rounded-full"
    initial={{ width: 0 }}
    animate={{ width: `${manuscript.completionPct}%` }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
  />
</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: manuscripts.length * 0.1 }}
          >
            <Link to="/manuscripts/new">
              <Card variant="bordered" className="h-full flex items-center justify-center min-h-[300px] border-dashed">
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>{t('dashboard.createNewManuscript')}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;