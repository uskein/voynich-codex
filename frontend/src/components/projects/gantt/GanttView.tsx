import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Flag, ArrowRight } from 'lucide-react';
import type { Task } from '../kanban/KanbanBoard';
import { format, differenceInDays, addDays, startOfDay, isPast, isToday, subDays } from 'date-fns';

interface GanttViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const priorityColors: Record<string, { bar: string; text: string }> = {
  LOW: { bar: 'bg-gray-500', text: 'text-gray-400' },
  MEDIUM: { bar: 'bg-blue-500', text: 'text-blue-400' },
  HIGH: { bar: 'bg-orange-500', text: 'text-orange-400' },
  CRITICAL: { bar: 'bg-red-500', text: 'text-red-400' },
};

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-600',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  BLOCKED: 'bg-red-500',
  DONE: 'bg-green-500',
};

type TimeScale = 'day' | 'week' | 'month';

export function GanttView({ tasks, onTaskClick }: GanttViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [scrollOffset, setScrollOffset] = useState(0);
  const [zoom, setZoom] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());

  const tasksWithDates = useMemo(() => {
    return tasks
      .filter(t => t.dueDate)
      .sort((a, b) => {
        const aDate = a.startDate || a.createdAt;
        const bDate = b.startDate || b.createdAt;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
  }, [tasks]);

  const dateRange = useMemo(() => {
    if (tasksWithDates.length === 0) {
      return { start: subDays(today, 7), end: addDays(today, 30) };
    }
    const allDates = tasksWithDates.flatMap(t => [
      new Date(t.startDate || t.createdAt),
      new Date(t.dueDate!)
    ]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    return {
      start: subDays(minDate, 3),
      end: addDays(maxDate, 7)
    };
  }, [tasksWithDates, today]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;

  const dayWidth = timeScale === 'day' ? zoom : timeScale === 'week' ? zoom / 7 : zoom / 30;

  const months = useMemo(() => {
    const result: { label: string; days: number; start: Date }[] = [];
    let current = startOfDay(dateRange.start);
    while (current <= dateRange.end) {
      const monthStart = startOfDay(current);
      const monthEnd = addDays(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0), 1);
      const days = Math.min(differenceInDays(monthEnd, monthStart), differenceInDays(dateRange.end, monthStart) + 1);
      result.push({
        label: format(monthStart, 'MMM yyyy'),
        days,
        start: monthStart,
      });
      current = monthEnd;
    }
    return result;
  }, [dateRange]);

  const getBarPosition = (task: Task) => {
    const taskStart = new Date(task.startDate || task.createdAt);
    const taskEnd = new Date(task.dueDate!);
    const startOffset = differenceInDays(taskStart, dateRange.start);
    const duration = Math.max(differenceInDays(taskEnd, taskStart), 1);
    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
    };
  };

  const getProgressWidth = (task: Task) => {
    if (task.status === 'DONE') return 100;
    if (task.status === 'TODO') return 0;
    if (task.status === 'IN_PROGRESS') return 50;
    if (task.status === 'IN_REVIEW') return 75;
    return 0;
  };

  const todayOffset = differenceInDays(today, dateRange.start) * dayWidth;

  useEffect(() => {
    if (containerRef.current) {
      const todayPos = todayOffset - containerRef.current.clientWidth / 3;
      containerRef.current.scrollLeft = Math.max(0, todayPos);
    }
  }, [todayOffset]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex bg-midnight-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as TimeScale[]).map(scale => (
              <button
                key={scale}
                onClick={() => setTimeScale(scale)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${
                  timeScale === scale
                    ? 'bg-burnt-500 text-white'
                    : 'text-parchment-400 hover:text-parchment-200'
                }`}
              >
                {scale === 'day' ? 'Dia' : scale === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(Math.max(20, zoom - 10))} className="p-1.5 rounded hover:bg-midnight-700 text-parchment-400">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-parchment-500 w-12 text-center">{zoom}px</span>
            <button onClick={() => setZoom(Math.min(100, zoom + 10))} className="p-1.5 rounded hover:bg-midnight-700 text-parchment-400">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => {
              if (containerRef.current) {
                const todayPos = todayOffset - containerRef.current.clientWidth / 3;
                containerRef.current.scrollTo({ left: Math.max(0, todayPos), behavior: 'smooth' });
              }
            }}
            className="px-3 py-1 rounded-lg bg-burnt-500/20 text-burnt-400 text-xs hover:bg-burnt-500/30 transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="text-xs text-parchment-500">
          {tasksWithDates.length} tareas con fechas
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 flex overflow-hidden border border-midnight-700 rounded-xl">
        {/* Task List */}
        <div className="w-64 flex-shrink-0 bg-midnight-800 border-r border-midnight-700 overflow-y-auto">
          {/* Header */}
          <div className="h-10 border-b border-midnight-700 px-3 flex items-center">
            <span className="text-xs font-medium text-parchment-400">Tarea</span>
          </div>
          {/* Task Rows */}
          {tasksWithDates.map((task, i) => {
            const pc = priorityColors[task.priority] || priorityColors.LOW;
            return (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`h-10 border-b border-midnight-700 px-3 flex items-center gap-2 cursor-pointer hover:bg-midnight-700 transition-colors ${
                  i % 2 === 0 ? 'bg-midnight-800' : 'bg-midnight-850'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[task.status] || 'bg-gray-500'}`} />
                <span className="text-xs text-parchment-200 truncate flex-1">{task.title}</span>
                <span className={`text-[10px] flex-shrink-0 ${pc.text}`}>{task.priority.charAt(0)}</span>
              </div>
            );
          })}
          {tasksWithDates.length === 0 && (
            <div className="h-10 px-3 flex items-center">
              <span className="text-xs text-parchment-500">Sin tareas con fechas</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative"
        >
          {/* Month Headers */}
          <div className="flex h-5 border-b border-midnight-700 sticky top-0 bg-midnight-800 z-10">
            {months.map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 border-r border-midnight-700 px-2 flex items-center"
                style={{ width: m.days * dayWidth }}
              >
                <span className="text-[10px] text-parchment-400 font-medium whitespace-nowrap">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="relative" style={{ width: totalDays * dayWidth, minHeight: '100%' }}>
            {/* Day columns */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const date = addDays(dateRange.start, i);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isTodayCol = isToday(date);
              return (
                <div
                  key={i}
                  className={`absolute top-0 border-r border-midnight-700/50 ${
                    isWeekend ? 'bg-midnight-850/50' : ''
                  } ${isTodayCol ? 'bg-burnt-500/5 border-r-burnt-500/30' : ''}`}
                  style={{ left: i * dayWidth, width: dayWidth, height: '100%' }}
                />
              );
            })}

            {/* Today line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-burnt-500 z-10"
              style={{ left: todayOffset }}
            >
              <div className="absolute -top-0 -left-1.5 w-3 h-3 rounded-full bg-burnt-500" />
            </div>

            {/* Task bars */}
            {tasksWithDates.map((task, i) => {
              const pos = getBarPosition(task);
              const progress = getProgressWidth(task);
              const pc = priorityColors[task.priority] || priorityColors.LOW;
              const isOverdue = isPast(new Date(task.dueDate!)) && !isToday(new Date(task.dueDate!)) && task.status !== 'DONE';

              return (
                <div
                  key={task.id}
                  className="absolute h-6 flex items-center cursor-pointer group"
                  style={{
                    left: pos.left,
                    width: Math.max(pos.width, 24),
                    top: i * 40 + 12,
                  }}
                  onClick={() => onTaskClick(task)}
                >
                  {/* Bar background */}
                  <div className={`relative w-full h-5 rounded-md ${isOverdue ? 'bg-red-500/20 ring-1 ring-red-500/30' : 'bg-midnight-700'} overflow-hidden group-hover:brightness-110 transition-all`}>
                    {/* Progress fill */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${pc.bar} opacity-40 rounded-md`}
                      style={{ width: `${progress}%` }}
                    />
                    {/* Label */}
                    <div className="absolute inset-0 px-2 flex items-center">
                      <span className="text-[10px] text-parchment-200 truncate whitespace-nowrap font-medium">
                        {task.title}
                      </span>
                    </div>
                  </div>
                  {/* Diamond for milestone-like tasks */}
                  {task.priority === 'CRITICAL' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rotate-45" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 px-2 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-parchment-500">Prioridad:</span>
          {Object.entries(priorityColors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-3 h-2 rounded-sm ${val.bar}`} />
              <span className="text-[10px] text-parchment-400">{key.charAt(0) + key.slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-parchment-500">Estado:</span>
          {Object.entries(statusColors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${val}`} />
              <span className="text-[10px] text-parchment-400">{key.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-3 h-3 rounded-full bg-burnt-500" />
          <span className="text-[10px] text-parchment-400">Hoy</span>
        </div>
      </div>
    </div>
  );
}
