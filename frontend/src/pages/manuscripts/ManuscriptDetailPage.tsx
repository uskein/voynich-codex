import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Eye, EyeOff, Users, Layers, FileText, ArrowLeft, Link2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { manuscriptAPI } from '../../services/api';
import { format } from 'date-fns';

interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  genre?: string;
  synopsis?: string;
  wordCount: number;
  totalChapters: number;
  publishedChapters: number;
  completionPct: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  world?: { id: string; name: string };
  creator: { id: string; name: string; avatarUrl?: string };
  members?: { id: string; name: string; avatarUrl?: string; role: string }[];
  chapters?: { id: string; title: string; isPublished: boolean; wordCount?: number }[];
}

export function ManuscriptDetailPage() {
  const { manuscriptId } = useParams<{ manuscriptId: string }>();
  const navigate = useNavigate();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (manuscriptId) loadManuscript();
  }, [manuscriptId]);

  const loadManuscript = async () => {
    try {
      const { data } = await manuscriptAPI.get(manuscriptId!);
      setManuscript(data.manuscript);
    } catch (error) {
      console.error('Failed to load manuscript:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-midnight-800/50 rounded-xl animate-pulse" />;
  }

  if (!manuscript) {
    return (
      <Card className="p-12 text-center">
        <BookOpen className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-parchment-100 mb-2">Manuscript not found</h3>
        <Link to="/manuscripts">
          <Button>Back to Manuscripts</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/manuscripts" className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-bold text-parchment-100">{manuscript.title}</h1>
          {manuscript.subtitle && <p className="text-parchment-400 mt-1">{manuscript.subtitle}</p>}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${manuscript.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-midnight-600 text-parchment-300'}`}>
          {manuscript.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {manuscript.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="aspect-[3/2] bg-midnight-700 rounded-xl overflow-hidden">
                {manuscript.coverImage ? (
                  <img src={manuscript.coverImage} alt={manuscript.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-midnight-600" />
                  </div>
                )}
              </div>
              {manuscript.synopsis && (
                <div>
                  <h3 className="text-sm font-medium text-parchment-300 mb-2">Synopsis</h3>
                  <p className="text-parchment-400 text-sm leading-relaxed">{manuscript.synopsis}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {manuscript.chapters && manuscript.chapters.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-serif font-bold text-parchment-100 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Chapters ({manuscript.chapters.length})
                </h3>
                <div className="space-y-2">
                  {manuscript.chapters.map((chapter, i) => (
                    <div key={chapter.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-midnight-700">
                      <span className="text-xs text-parchment-500 w-6">{i + 1}</span>
                      <span className="text-sm text-parchment-200 flex-1">{chapter.title}</span>
                      <span className="text-xs text-parchment-500">{(chapter.wordCount || 0).toLocaleString()} words</span>
                      <span className={`w-2 h-2 rounded-full ${chapter.isPublished ? 'bg-green-400' : 'bg-midnight-600'}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-midnight-700">
                  <div className="text-2xl font-bold text-parchment-100">{manuscript.wordCount.toLocaleString()}</div>
                  <div className="text-xs text-parchment-500">Words</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-midnight-700">
                  <div className="text-2xl font-bold text-parchment-100">{manuscript.publishedChapters}/{manuscript.totalChapters}</div>
                  <div className="text-xs text-parchment-500">Chapters</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-parchment-500 mb-1">
                  <span>Completion</span>
                  <span>{manuscript.completionPct}%</span>
                </div>
                <div className="w-full bg-midnight-700 rounded-full h-2">
                  <div className="bg-burnt-500 h-2 rounded-full transition-all" style={{ width: `${manuscript.completionPct}%` }} />
                </div>
              </div>
              <div className="space-y-2 text-sm text-parchment-400">
                {manuscript.genre && <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> {manuscript.genre}</div>}
                {manuscript.world && <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> {manuscript.world.name}</div>}
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Created {format(new Date(manuscript.createdAt), 'MMM d, yyyy')}</div>
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Updated {format(new Date(manuscript.updatedAt), 'MMM d, yyyy')}</div>
              </div>
            </CardContent>
          </Card>

          {manuscript.members && manuscript.members.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-serif font-bold text-parchment-100 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Members ({manuscript.members.length})
                </h3>
                <div className="space-y-2">
                  {manuscript.members.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-midnight-600 flex items-center justify-center text-xs text-parchment-300">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="text-sm text-parchment-300 flex-1">{member.name || 'Unknown'}</span>
                      <span className="text-[10px] text-parchment-500">{member.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => navigate(`/manuscripts/${manuscript.id}/write`)}><Link2 className="w-4 h-4 mr-2" /> Write</Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate(`/manuscripts/${manuscript.id}/project`)}><Layers className="w-4 h-4 mr-2" /> Projects</Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate(`/manuscripts/${manuscript.id}/read`)}><BookOpen className="w-4 h-4 mr-2" /> Read</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManuscriptDetailPage;
