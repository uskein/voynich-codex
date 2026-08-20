import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutDashboard, Calendar, GanttChart, Search } from 'lucide-react';
import { KanbanBoard, type Task, type TaskStatus } from '../../components/projects/kanban/KanbanBoard';
import { TaskDetailModal } from '../../components/projects/task/TaskDetailModal';
import { CalendarView } from '../../components/projects/calendar/CalendarView';
import { GanttView } from '../../components/projects/gantt/GanttView';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { taskAPI, manuscriptAPI } from '../../services/api';

type ViewMode = 'kanban' | 'calendar' | 'gantt';

export function ProjectsPage() {
  const { manuscriptId } = useParams<{ manuscriptId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [manuscript, setManuscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    if (manuscriptId) {
      loadData();
    }
  }, [manuscriptId]);

  const loadData = async () => {
    if (!manuscriptId) return;
    try {
      const [tasksRes, manuscriptRes] = await Promise.all([
        taskAPI.list(manuscriptId),
        manuscriptAPI.get(manuscriptId)
      ]);
      setTasks(tasksRes.data.tasks || []);
      setManuscript(manuscriptRes.data.manuscript);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, data: Partial<Task>) => {
    if (!manuscriptId) return;
    try {
      await taskAPI.update(manuscriptId, taskId, data);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...data } : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    if (!manuscriptId) return;
    try {
      await taskAPI.reorder(manuscriptId, { taskId, status: newStatus, order: newOrder });
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t
      ));
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleTaskCreate = async (status: TaskStatus) => {
    if (!manuscriptId) return;
    try {
      const { data } = await taskAPI.create(manuscriptId, {
        title: 'New Task',
        status,
        priority: 'MEDIUM'
      });
      setTasks([...tasks, data.task]);
      setSelectedTask(data.task);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!manuscriptId) return;
    try {
      await taskAPI.delete(manuscriptId, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-parchment-100">
            {manuscript?.title || 'Projects'}
          </h1>
          <p className="text-parchment-400 mt-1">Manage tasks and track progress</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View mode tabs */}
          <div className="flex bg-midnight-800 rounded-lg p-1">
            {[
              { mode: 'kanban' as ViewMode, icon: LayoutDashboard, label: 'Board' },
              { mode: 'calendar' as ViewMode, icon: Calendar, label: 'Calendar' },
              { mode: 'gantt' as ViewMode, icon: GanttChart, label: 'Gantt' }
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === mode
                    ? 'bg-burnt-500 text-white'
                    : 'text-parchment-400 hover:text-parchment-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
            <Button
              key={p}
              variant={filterPriority === p ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterPriority(p)}
            >
              {p === 'all' ? 'All' : p}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burnt-500" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskMove={handleTaskMove}
            onTaskCreate={handleTaskCreate}
            onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
          />
        ) : viewMode === 'calendar' ? (
          <CalendarView
            tasks={filteredTasks}
            onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
          />
        ) : (
          <GanttView
            tasks={filteredTasks}
            onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        members={manuscript?.members?.map((m: any) => m.user) || []}
      />
    </div>
  );
}

export default ProjectsPage;