import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, Layers, Target, Clock, Image, LayoutTemplate,
  ArrowLeft, Plus, CheckCircle2, Circle, AlertTriangle, Flame, ChevronRight,
  Settings, Link2, BarChart3, Trash2, Edit3, X, Save, UserPlus, Timer,
  Globe, Eye, EyeOff, Share2, Copy, Lock, Unlock, Send, ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { manuscriptAPI, taskAPI, chapterAPI, statsAPI, uploadAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

type Tab = 'overview' | 'team' | 'schedule' | 'tasks' | 'covers' | 'publish';

interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  synopsis?: string;
  status: string;
  wordCount: number;
  totalChapters: number;
  publishedChapters: number;
  completionPct: number;
  isPublic: boolean;
  startDate?: string;
  targetEndDate?: string;
  createdAt: string;
  updatedAt: string;
  world?: { id: string; name: string };
  creator: { id: string; name: string; avatarUrl?: string };
  members?: { id: string; user: { id: string; name: string; avatarUrl?: string }; role: string }[];
  chapters?: { id: string; title: string; isPublished: boolean; order: number; wordCount?: number }[];
  _count?: { chapters: number; tasks: number; milestones: number };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee?: { id: string; name: string; avatarUrl?: string };
  createdAt: string;
  order: number;
}

interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  goal?: string;
  _count?: { tasks: number };
  isActive?: boolean;
}

interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  _count?: { tasks: number };
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  genre?: string;
  wordCount: number;
  status: string;
  isPublished: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  version: number;
  order: number;
  coverImageUrl?: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  BORRADOR: { label: 'Borrador', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  EN_REVISION: { label: 'En Revision', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  PUBLICADO: { label: 'Publicado', color: 'text-green-400', bg: 'bg-green-500/20' },
  ARCHIVADO: { label: 'Archivado', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const priorityColors: Record<string, string> = {
  CRITICA: 'text-red-400 bg-red-500/20',
  ALTA: 'text-orange-400 bg-orange-500/20',
  MEDIA: 'text-blue-400 bg-blue-500/20',
  BAJA: 'text-gray-400 bg-gray-500/20',
};

const taskStatusColors: Record<string, string> = {
  TODO: 'bg-gray-500',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  BLOCKED: 'bg-red-500',
  DONE: 'bg-green-500',
};

const roleLabels: Record<string, string> = {
  ESCRITOR: 'Escritor',
  EDITOR_TEXTO: 'Editor de Texto',
  EDITOR_VISUAL: 'Editor Visual',
  DISENADOR: 'Disenador',
  MAQUETADOR: 'Maquetador',
  PUBLICADOR: 'Publicador',
  REVISOR: 'Revisor',
};

const roleColors: Record<string, string> = {
  ESCRITOR: 'bg-burnt-500/20 text-burnt-400',
  EDITOR_TEXTO: 'bg-blue-500/20 text-blue-400',
  EDITOR_VISUAL: 'bg-purple-500/20 text-purple-400',
  DISENADOR: 'bg-green-500/20 text-green-400',
  MAQUETADOR: 'bg-yellow-500/20 text-yellow-400',
  PUBLICADOR: 'bg-cyan-500/20 text-cyan-400',
  REVISOR: 'bg-pink-500/20 text-pink-400',
};

const tabConfig: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 },
  { id: 'team', label: 'Equipo', icon: Users },
  { id: 'schedule', label: 'Cronograma', icon: Calendar },
  { id: 'tasks', label: 'Tareas', icon: Layers },
  { id: 'covers', label: 'Portadas y Diseno', icon: Image },
  { id: 'publish', label: 'Publicacion', icon: Send },
];

export default function ProjectDashboardPage() {
  const { manuscriptId } = useParams<{ manuscriptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddSprint, setShowAddSprint] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('REVISOR');
  const [newSprint, setNewSprint] = useState({ name: '', description: '', startDate: '', endDate: '', goal: '' });
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIA', dueDate: '' });
  const [sharePassword, setSharePassword] = useState('');
  const [showShareForm, setShowShareForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loadData = useCallback(async () => {
    if (!manuscriptId) return;
    try {
      const [msRes, tasksRes, sprintsRes, milestonesRes, chaptersRes] = await Promise.all([
        manuscriptAPI.get(manuscriptId),
        taskAPI.list(manuscriptId).catch(() => ({ data: { tasks: [] } })),
        taskAPI.getSprints(manuscriptId).catch(() => ({ data: { sprints: [] } })),
        taskAPI.getMilestones(manuscriptId).catch(() => ({ data: { milestones: [] } })),
        chapterAPI.list(manuscriptId).catch(() => ({ data: { chapters: [] } })),
      ]);
      setManuscript(msRes.data.manuscript);
      setTasks(tasksRes.data.tasks || []);
      setSprints(sprintsRes.data.sprints || []);
      setMilestones(milestonesRes.data.milestones || []);
      setChapters(chaptersRes.data.chapters || []);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  }, [manuscriptId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddMember = async () => {
    if (!manuscriptId || !memberEmail) return;
    try {
      await manuscriptAPI.addMember(manuscriptId, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setShowAddMember(false);
      loadData();
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleAddSprint = async () => {
    if (!manuscriptId || !newSprint.name) return;
    try {
      await taskAPI.createSprint(manuscriptId, newSprint);
      setNewSprint({ name: '', description: '', startDate: '', endDate: '', goal: '' });
      setShowAddSprint(false);
      loadData();
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  const handleAddMilestone = async () => {
    if (!manuscriptId || !newMilestone.name) return;
    try {
      await taskAPI.createMilestone(manuscriptId, newMilestone);
      setNewMilestone({ name: '', description: '', dueDate: '' });
      setShowAddMilestone(false);
      loadData();
    } catch (error) {
      console.error('Failed to create milestone:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!manuscriptId || !newTask.title) return;
    try {
      await taskAPI.create(manuscriptId, { ...newTask, status: 'TODO' });
      setNewTask({ title: '', description: '', priority: 'MEDIA', dueDate: '' });
      setShowAddTask(false);
      loadData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!manuscriptId) return;
    try {
      await manuscriptAPI.update(manuscriptId, { status });
      setManuscript(prev => prev ? { ...prev, status } : prev);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdateVisibility = async (visibility: string) => {
    if (!manuscriptId) return;
    try {
      await manuscriptAPI.update(manuscriptId, { visibility });
      setManuscript(prev => prev ? { ...prev, isPublic: visibility === 'PUBLIC' } : prev);
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const handlePublishChapter = async (chapterId: string) => {
    if (!manuscriptId) return;
    try {
      await chapterAPI.publish(manuscriptId, chapterId);
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, isPublished: true, status: 'PUBLISHED', publishedAt: new Date().toISOString() } : ch));
      loadData();
    } catch (error) {
      console.error('Failed to publish chapter:', error);
    }
  };

  const handleUnpublishChapter = async (chapterId: string) => {
    if (!manuscriptId) return;
    try {
      await chapterAPI.unpublish(manuscriptId, chapterId);
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, isPublished: false, status: 'BORRADOR', publishedAt: undefined } : ch));
      loadData();
    } catch (error) {
      console.error('Failed to unpublish chapter:', error);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!manuscriptId) return;
    try {
      const { data } = await fetch(`/api/manuscripts/${manuscriptId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ password: sharePassword || undefined })
      }).then(r => r.json());
      if (data?.shareToken) {
        navigator.clipboard?.writeText(`${window.location.origin}/share/${data.shareToken}`);
      }
      setShowShareForm(false);
      setSharePassword('');
      loadData();
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  };

  const handleFileUpload = async (file: File, target: 'manuscript' | 'chapter', chapterId?: string) => {
    if (!manuscriptId) return;
    setIsUploading(true);
    try {
      const { data } = await uploadAPI.file(file);
      const url = data.url;
      if (target === 'manuscript') {
        await manuscriptAPI.update(manuscriptId, { coverImage: url });
        setManuscript(prev => prev ? { ...prev, coverImage: url } : prev);
      } else if (chapterId) {
        await chapterAPI.update(manuscriptId, chapterId, { coverImageUrl: url });
        setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, coverImageUrl: url } : ch));
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, target: 'manuscript' | 'chapter', chapterId?: string) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, target, chapterId);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, target: 'manuscript' | 'chapter', chapterId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, target, chapterId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-midnight-800 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-midnight-800 rounded-xl" />)}
        </div>
        <div className="h-96 bg-midnight-800 rounded-xl" />
      </div>
    );
  }

  if (!manuscript) {
    return (
      <Card className="p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-parchment-100 mb-2">Proyecto no encontrado</h3>
        <Button onClick={() => navigate('/manuscripts')}>Volver a Manuscritos</Button>
      </Card>
    );
  }

  const st = statusConfig[manuscript.status] || statusConfig.BORRADOR;
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    inReview: tasks.filter(t => t.status === 'IN_REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    blocked: tasks.filter(t => t.status === 'BLOCKED').length,
  };
  const activeSprint = sprints.find(s => s.status === 'ACTIVE');
  const upcomingMilestones = milestones
    .filter(m => !m.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/manuscripts')} className="mt-1 p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold text-parchment-100">{manuscript.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                {st.label}
              </span>
            </div>
            {manuscript.subtitle && <p className="text-parchment-400 mt-1">{manuscript.subtitle}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-parchment-500">
              {manuscript.world && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {manuscript.world.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {manuscript.members?.length || 0} miembros
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> {manuscript._count?.tasks || 0} tareas
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Creado {format(new Date(manuscript.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/manuscripts/${manuscript.id}/write`)}>
            <Edit3 className="w-4 h-4 mr-1" /> Escribir
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/manuscripts/${manuscript.id}/read`)}>
            <BookOpen className="w-4 h-4 mr-1" /> Leer
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-burnt-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-burnt-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-parchment-100">{manuscript.wordCount.toLocaleString()}</div>
                <div className="text-xs text-parchment-500">Palabras</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-parchment-100">{manuscript.publishedChapters}/{manuscript.totalChapters}</div>
                <div className="text-xs text-parchment-500">Capitulos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-parchment-100">{manuscript.completionPct}%</div>
                <div className="text-xs text-parchment-500">Completado</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-parchment-100">{taskStats.inProgress}</div>
                <div className="text-xs text-parchment-500">En Progreso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-midnight-700">
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-burnt-500 text-burnt-400'
                : 'border-transparent text-parchment-400 hover:text-parchment-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif font-bold text-parchment-100 mb-4">Progreso General</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-parchment-500 mb-1">
                      <span>Completado</span>
                      <span>{manuscript.completionPct}%</span>
                    </div>
                    <div className="w-full bg-midnight-700 rounded-full h-3">
                      <div className="bg-burnt-500 h-3 rounded-full transition-all" style={{ width: `${manuscript.completionPct}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-midnight-700 rounded-lg">
                      <div className="text-lg font-bold text-parchment-100">{manuscript.chapters?.length || 0}</div>
                      <div className="text-xs text-parchment-500">Total Capitulos</div>
                    </div>
                    <div className="text-center p-3 bg-midnight-700 rounded-lg">
                      <div className="text-lg font-bold text-green-400">{manuscript.publishedChapters}</div>
                      <div className="text-xs text-parchment-500">Publicados</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif font-bold text-parchment-100 mb-4">Resumen de Tareas</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Por hacer', count: taskStats.todo, color: 'bg-gray-500' },
                    { label: 'En progreso', count: taskStats.inProgress, color: 'bg-blue-500' },
                    { label: 'En revision', count: taskStats.inReview, color: 'bg-yellow-500' },
                    { label: 'Bloqueadas', count: taskStats.blocked, color: 'bg-red-500' },
                    { label: 'Completadas', count: taskStats.done, color: 'bg-green-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm text-parchment-300 flex-1">{item.label}</span>
                      <span className="text-sm font-medium text-parchment-100">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {manuscript.synopsis && (
              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-parchment-100 mb-2">Sinopsis</h3>
                  <p className="text-parchment-400 text-sm leading-relaxed">{manuscript.synopsis}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TEAM */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-parchment-100">Equipo de Trabajo</h3>
              <Button size="sm" onClick={() => setShowAddMember(true)}>
                <UserPlus className="w-4 h-4 mr-1" /> Agregar Miembro
              </Button>
            </div>
            {showAddMember && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-parchment-400 mb-1 block">Email del miembro</label>
                      <Input placeholder="email@ejemplo.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                    </div>
                    <div className="w-48">
                      <label className="text-xs text-parchment-400 mb-1 block">Rol</label>
                      <select
                        value={memberRole}
                        onChange={e => setMemberRole(e.target.value)}
                        className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-200 text-sm"
                      >
                        {Object.entries(roleLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <Button size="sm" onClick={handleAddMember}>Agregar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddMember(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manuscript.creator && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-burnt-500/20 flex items-center justify-center text-burnt-400 font-bold">
                        {manuscript.creator.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-parchment-100">{manuscript.creator.name}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-burnt-500/20 text-burnt-400">Creador</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {manuscript.members?.map(member => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-midnight-600 flex items-center justify-center text-parchment-300 text-sm font-bold">
                        {member.user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-parchment-100">{member.user.name}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${roleColors[member.role] || 'bg-gray-500/20 text-gray-400'}`}>
                          {roleLabels[member.role] || member.role}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Active Sprint */}
            {activeSprint && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif font-bold text-parchment-100 flex items-center gap-2">
                      <Timer className="w-5 h-5 text-burnt-400" /> Sprint Activo: {activeSprint.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Activo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-parchment-500">Inicio:</span>
                      <span className="ml-2 text-parchment-200">{format(new Date(activeSprint.startDate), 'MMM d')}</span>
                    </div>
                    <div>
                      <span className="text-parchment-500">Fin:</span>
                      <span className="ml-2 text-parchment-200">{format(new Date(activeSprint.endDate), 'MMM d')}</span>
                    </div>
                    <div>
                      <span className="text-parchment-500">Tareas:</span>
                      <span className="ml-2 text-parchment-200">{activeSprint._count?.tasks || 0}</span>
                    </div>
                  </div>
                  {activeSprint.goal && <p className="mt-3 text-sm text-parchment-400">Meta: {activeSprint.goal}</p>}
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-parchment-100">Hitos y Entregas</h3>
              <Button size="sm" onClick={() => setShowAddMilestone(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo Hito
              </Button>
            </div>
            {showAddMilestone && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Nombre</label>
                      <Input placeholder="Nombre del hito" value={newMilestone.name} onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Fecha limite</label>
                      <Input type="date" value={newMilestone.dueDate} onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddMilestone}>Crear</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddMilestone(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="space-y-3">
              {upcomingMilestones.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-midnight-500 mx-auto mb-3" />
                    <p className="text-parchment-400 text-sm">No hay hitos pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingMilestones.map(m => {
                  const daysLeft = differenceInDays(new Date(m.dueDate), new Date());
                  const overdue = isPast(new Date(m.dueDate)) && !isToday(new Date(m.dueDate));
                  return (
                    <Card key={m.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${overdue ? 'bg-red-500/20' : daysLeft <= 7 ? 'bg-yellow-500/20' : 'bg-midnight-700'}`}>
                          {overdue ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Target className="w-5 h-5 text-parchment-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-parchment-100">{m.name}</div>
                          {m.description && <div className="text-xs text-parchment-500 mt-0.5">{m.description}</div>}
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${overdue ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-parchment-300'}`}>
                            {overdue ? `${Math.abs(daysLeft)} dias atrasado` : `${daysLeft} dias restantes`}
                          </div>
                          <div className="text-xs text-parchment-500">{format(new Date(m.dueDate), 'MMM d, yyyy')}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Sprints List */}
            <div className="flex justify-between items-center pt-4">
              <h3 className="font-serif font-bold text-parchment-100">Sprints</h3>
              <Button size="sm" onClick={() => setShowAddSprint(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo Sprint
              </Button>
            </div>
            {showAddSprint && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Nombre</label>
                      <Input placeholder="Sprint 1" value={newSprint.name} onChange={e => setNewSprint({ ...newSprint, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Meta</label>
                      <Input placeholder="Meta del sprint" value={newSprint.goal} onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Inicio</label>
                      <Input type="date" value={newSprint.startDate} onChange={e => setNewSprint({ ...newSprint, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Fin</label>
                      <Input type="date" value={newSprint.endDate} onChange={e => setNewSprint({ ...newSprint, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleAddSprint}>Crear Sprint</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddSprint(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="space-y-2">
              {sprints.map(sprint => (
                <Card key={sprint.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${sprint.status === 'ACTIVE' ? 'bg-green-500' : sprint.status === 'COMPLETED' ? 'bg-midnight-500' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-parchment-100">{sprint.name}</div>
                      <div className="text-xs text-parchment-500">
                        {format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d, yyyy')}
                        {sprint._count?.tasks ? ` | ${sprint._count.tasks} tareas` : ''}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sprint.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                      sprint.status === 'COMPLETED' ? 'bg-midnight-600 text-parchment-500' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {sprint.status === 'ACTIVE' ? 'Activo' : sprint.status === 'COMPLETED' ? 'Completado' : 'Planificado'}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-parchment-100">Tareas del Proyecto</h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/manuscripts/${manuscript.id}/projects`)}>
                  <Layers className="w-4 h-4 mr-1" /> Kanban Board
                </Button>
                <Button size="sm" onClick={() => setShowAddTask(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Nueva Tarea
                </Button>
              </div>
            </div>
            {showAddTask && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-parchment-400 mb-1 block">Titulo</label>
                      <Input placeholder="Titulo de la tarea" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Prioridad</label>
                      <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-200 text-sm">
                        <option value="BAJA">Baja</option>
                        <option value="MEDIA">Media</option>
                        <option value="ALTA">Alta</option>
                        <option value="CRITICA">Critica</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-parchment-400 mb-1 block">Fecha limite</label>
                      <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleCreateTask}>Crear Tarea</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddTask(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task Summary Bar */}
            <div className="flex gap-4 p-3 bg-midnight-800 rounded-lg">
              {[
                { label: 'Total', count: taskStats.total, color: 'text-parchment-200' },
                { label: 'Por hacer', count: taskStats.todo, color: 'text-gray-400' },
                { label: 'En progreso', count: taskStats.inProgress, color: 'text-blue-400' },
                { label: 'En revision', count: taskStats.inReview, color: 'text-yellow-400' },
                { label: 'Bloqueadas', count: taskStats.blocked, color: 'text-red-400' },
                { label: 'Hechas', count: taskStats.done, color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="text-center flex-1">
                  <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
                  <div className="text-[10px] text-parchment-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Layers className="w-12 h-12 text-midnight-500 mx-auto mb-3" />
                    <p className="text-parchment-400 text-sm mb-3">No hay tareas aun</p>
                    <Button size="sm" onClick={() => setShowAddTask(true)}>Crear primera tarea</Button>
                  </CardContent>
                </Card>
              ) : (
                tasks.slice(0, 20).map(task => (
                  <Card key={task.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${taskStatusColors[task.status] || 'bg-gray-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-parchment-200 truncate">{task.title}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-500/20 text-gray-400'}`}>
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-midnight-600 flex items-center justify-center text-[10px] text-parchment-300">
                          {task.assignee.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {task.dueDate && (
                        <span className={`text-xs ${isPast(new Date(task.dueDate)) ? 'text-red-400' : 'text-parchment-500'}`}>
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* COVERS & LAYOUT */}
        {activeTab === 'covers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Image className="w-5 h-5 text-burnt-400" />
                    <h4 className="font-medium text-parchment-100">Portada Principal</h4>
                  </div>
                  <div
                    className={`aspect-[3/4] rounded-xl overflow-hidden mb-4 flex items-center justify-center transition-all ${
                      isDragging ? 'ring-2 ring-burnt-500 ring-offset-2 ring-offset-midnight-800' : ''
                    } ${manuscript.coverImage ? '' : 'bg-midnight-700 border-2 border-dashed border-midnight-600'}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => handleDrop(e, 'manuscript')}
                  >
                    {manuscript.coverImage ? (
                      <div className="relative group w-full h-full">
                        <img src={manuscript.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <Image className="w-8 h-8 text-white" />
                          <span className="text-xs text-white">Arrastra una imagen o haz click</span>
                        </div>
                        <label className="absolute inset-0 cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileInput(e, 'manuscript')} />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileInput(e, 'manuscript')} />
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
                        ) : (
                          <>
                            <Image className="w-16 h-16 text-midnight-600 mb-2" />
                            <p className="text-xs text-parchment-500">Arrastra una imagen aqui</p>
                            <p className="text-[10px] text-parchment-600 mt-1">o haz click para seleccionar</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                  {manuscript.coverImage && (
                    <label className="block">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFileInput(e, 'manuscript')} />
                      <Button variant="secondary" className="w-full" size="sm">
                        <span><Image className="w-4 h-4 mr-2" /> Cambiar Portada</span>
                      </Button>
                    </label>
                  )}
                </CardContent>
              </Card>

              {/* Layout Template */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutTemplate className="w-5 h-5 text-blue-400" />
                    <h4 className="font-medium text-parchment-100">Plantilla de Maquetacion</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'novela', name: 'Novela', desc: 'Capitulos largos, narrativa completa' },
                      { id: 'cuento', name: 'Cuento corto', desc: 'Estructura compacta, ritmo rapido' },
                      { id: 'ensayo', name: 'Ensayo', desc: 'Argumentacion, referencias' },
                      { id: 'guion', name: 'Guion', desc: 'Dialogos, escenas, actos' },
                      { id: 'personalizado', name: 'Personalizado', desc: 'Configuracion libre' },
                    ].map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                          selectedTemplate === template.id
                            ? 'bg-burnt-500/20 ring-1 ring-burnt-500/30'
                            : 'bg-midnight-700 hover:bg-midnight-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <LayoutTemplate className={`w-4 h-4 ${selectedTemplate === template.id ? 'text-burnt-400' : 'text-parchment-400'}`} />
                          <div>
                            <span className="text-sm text-parchment-200">{template.name}</span>
                            <p className="text-[10px] text-parchment-500">{template.desc}</p>
                          </div>
                        </div>
                        {selectedTemplate === template.id && <CheckCircle2 className="w-4 h-4 text-burnt-400" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chapter Covers */}
              <Card className="md:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-green-400" />
                      <h4 className="font-medium text-parchment-100">Portadas de Capitulos</h4>
                    </div>
                  </div>
                  {chapters.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {chapters.map((ch, i) => (
                        <div key={ch.id} className="group">
                          <div
                            className={`aspect-[3/4] rounded-lg overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                              ch.coverImageUrl ? 'bg-midnight-700' : 'bg-midnight-700 border-2 border-dashed border-midnight-600 hover:border-midnight-500'
                            }`}
                            onDragOver={e => { e.preventDefault(); }}
                            onDrop={e => handleDrop(e, 'chapter', ch.id)}
                          >
                            {ch.coverImageUrl ? (
                              <div className="relative w-full h-full">
                                <img src={ch.coverImageUrl} alt={ch.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileInput(e, 'chapter', ch.id)} />
                                    <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">Cambiar</span>
                                  </label>
                                </div>
                                {ch.isPublished && (
                                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileInput(e, 'chapter', ch.id)} />
                                {isUploading ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-burnt-500" />
                                ) : (
                                  <>
                                    <Image className="w-6 h-6 text-midnight-500 group-hover:text-midnight-400 transition-colors" />
                                    <span className="text-[8px] text-parchment-600 mt-1">Agregar</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                          <span className="text-[10px] text-parchment-500 mt-1 px-1 text-center truncate w-full block">
                            Cap. {ch.number}: {ch.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-parchment-500 text-center py-8">No hay capitulos para gestionar portadas</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PUBLISH */}
        {activeTab === 'publish' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status & Visibility */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-serif font-bold text-parchment-100">Estado del Proyecto</h3>
                  <div>
                    <label className="text-xs text-parchment-400 mb-2 block">Estado de publicacion</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => handleUpdateStatus(key)}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            manuscript.status === key
                              ? `${cfg.bg} ${cfg.color} ring-1 ring-current/30`
                              : 'bg-midnight-700 text-parchment-400 hover:bg-midnight-600'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-parchment-400 mb-2 block">Visibilidad</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'PRIVATE', label: 'Privado', icon: Lock, desc: 'Solo el equipo' },
                        { key: 'UNLISTED', label: 'No listado', icon: EyeOff, desc: 'Con enlace' },
                        { key: 'PUBLIC', label: 'Publico', icon: Globe, desc: 'Visible para todos' },
                      ].map(({ key, label, icon: Icon, desc }) => (
                        <button
                          key={key}
                          onClick={() => handleUpdateVisibility(key)}
                          className={`p-3 rounded-lg text-sm transition-all flex flex-col items-center gap-1 ${
                            manuscript.status === key
                              ? 'bg-burnt-500/20 text-burnt-400 ring-1 ring-burnt-500/30'
                              : 'bg-midnight-700 text-parchment-400 hover:bg-midnight-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{label}</span>
                          <span className="text-[10px] opacity-60">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Link */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-serif font-bold text-parchment-100 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-burnt-400" /> Compartir
                  </h3>
                  {manuscript.isPublic ? (
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
                        <Globe className="w-4 h-4" /> Proyecto Publico
                      </div>
                      <p className="text-xs text-parchment-400">Visible para todos en la biblioteca</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-midnight-700 rounded-lg">
                      <div className="flex items-center gap-2 text-parchment-300 text-sm mb-2">
                        <Lock className="w-4 h-4" /> Proyecto Privado
                      </div>
                      <p className="text-xs text-parchment-500 mb-3">Genera un enlace para compartir con lectores especificos</p>
                      {showShareForm ? (
                        <div className="space-y-2">
                          <Input
                            type="password"
                            placeholder="Contrasena (opcional)"
                            value={sharePassword}
                            onChange={e => setSharePassword(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleGenerateShareLink}>
                              <Link2 className="w-3 h-3 mr-1" /> Generar Enlace
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowShareForm(false)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setShowShareForm(true)}>
                          <Share2 className="w-4 h-4 mr-1" /> Generar Enlace de Acceso
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chapter Publishing */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-parchment-100">Capitulos</h3>
                  <div className="text-sm text-parchment-400">
                    <span className="text-green-400 font-bold">{manuscript.publishedChapters}</span> / {manuscript.totalChapters} publicados
                  </div>
                </div>
                {chapters.length > 0 ? (
                  <div className="space-y-2">
                    {chapters.map(ch => (
                      <div key={ch.id} className="flex items-center gap-4 p-3 bg-midnight-700 rounded-lg">
                        <div className="w-8 text-center">
                          <span className="text-sm font-bold text-parchment-300">{ch.number}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                          backgroundColor: ch.isPublished ? '#22c55e' : ch.status === 'IN_REVIEW' ? '#eab308' : ch.status === 'SCHEDULED' ? '#3b82f6' : '#6b7280'
                        }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-parchment-200 truncate">{ch.title}</div>
                          <div className="text-[10px] text-parchment-500">
                            {ch.wordCount.toLocaleString()} palabras | v{ch.version}
                            {ch.publishedAt && ` | Publicado ${format(new Date(ch.publishedAt), 'MMM d')}`}
                            {ch.scheduledAt && ` | Programado ${format(new Date(ch.scheduledAt), 'MMM d')}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {ch.isPublished ? (
                            <Button variant="ghost" size="sm" onClick={() => handleUnpublishChapter(ch.id)}>
                              <EyeOff className="w-4 h-4 mr-1" /> Despublicar
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handlePublishChapter(ch.id)}>
                              <Send className="w-4 h-4 mr-1" /> Publicar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-parchment-500 text-center py-8">No hay capitulos para publicar</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
