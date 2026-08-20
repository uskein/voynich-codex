import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Flag } from 'lucide-react';
import type { Task } from '../kanban/KanbanBoard';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast } from 'date-fns';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const priorityDot: Record<string, string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-400',
};

const statusDot: Record<string, string> = {
  TODO: 'bg-gray-500',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  DONE: 'bg-green-500',
};

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const tasksWithDates = tasks.filter(t => t.dueDate);
  const getTasksForDate = (date: Date) =>
    tasksWithDates.filter(t => isSameDay(new Date(t.dueDate!), date));

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const upcomingTasks = tasksWithDates
    .filter(t => {
      const d = new Date(t.dueDate!);
      return d >= new Date() && d <= addDays(new Date(), 14);
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const overdueTasks = tasksWithDates.filter(t => isPast(new Date(t.dueDate!)) && !isToday(new Date(t.dueDate!)) && t.status !== 'DONE');

  return (
    <div className="flex gap-6 h-full">
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-parchment-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 rounded-lg hover:bg-midnight-700 text-parchment-400 text-sm transition-colors">
              Hoy
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-parchment-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="flex-1 border border-midnight-700 rounded-xl overflow-hidden">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-midnight-700 last:border-b-0" style={{ minHeight: '80px' }}>
              {week.map((date, di) => {
                const dayTasks = getTasksForDate(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const today = isToday(date);

                return (
                  <div
                    key={di}
                    onClick={() => setSelectedDate(date)}
                    className={`border-r border-midnight-700 last:border-r-0 p-1 cursor-pointer transition-colors ${
                      !isCurrentMonth ? 'bg-midnight-900/50' :
                      isSelected ? 'bg-burnt-500/10 ring-1 ring-inset ring-burnt-500/30' :
                      'bg-midnight-800 hover:bg-midnight-750'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      today ? 'text-burnt-400 font-bold' :
                      !isCurrentMonth ? 'text-midnight-500' :
                      'text-parchment-400'
                    }`}>
                      {today && <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-burnt-500 text-white text-[10px]">{format(date, 'd')}</span>}
                      {!today && format(date, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                          className="group flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-midnight-700 hover:bg-midnight-600 cursor-pointer truncate transition-colors"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority] || 'bg-gray-400'}`} />
                          <span className="truncate text-parchment-300 group-hover:text-parchment-100">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-parchment-500 px-1">+{dayTasks.length - 3} mas</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Selected Date Tasks */}
        {selectedDate && (
          <div className="bg-midnight-800 rounded-xl p-4 border border-midnight-700">
            <h3 className="text-sm font-medium text-parchment-200 mb-3">
              {format(selectedDate, 'EEEE, d MMMM')}
            </h3>
            {selectedTasks.length === 0 ? (
              <p className="text-xs text-parchment-500">Sin tareas para este dia</p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="p-2 rounded-lg bg-midnight-700 hover:bg-midnight-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusDot[task.status] || 'bg-gray-500'}`} />
                      <span className="text-xs text-parchment-200 truncate flex-1">{task.title}</span>
                    </div>
                    {task.assignee && (
                      <div className="text-[10px] text-parchment-500 mt-1 ml-4">{task.assignee.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming */}
        <div className="bg-midnight-800 rounded-xl p-4 border border-midnight-700">
          <h3 className="text-sm font-medium text-parchment-200 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" /> Proximas 2 semanas
          </h3>
          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-parchment-500">Sin tareas pendientes</p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-midnight-700 cursor-pointer transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />
                  <span className="text-xs text-parchment-300 flex-1 truncate">{task.title}</span>
                  <span className="text-[10px] text-parchment-500">{format(new Date(task.dueDate!), 'MMM d')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Atrasadas ({overdueTasks.length})
            </h3>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />
                  <span className="text-xs text-parchment-300 flex-1 truncate">{task.title}</span>
                  <span className="text-[10px] text-red-400">{format(new Date(task.dueDate!), 'MMM d')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-midnight-800 rounded-xl p-4 border border-midnight-700">
          <h3 className="text-sm font-medium text-parchment-200 mb-3">Leyenda</h3>
          <div className="space-y-2">
            {[
              { label: 'Critica', dot: 'bg-red-400' },
              { label: 'Alta', dot: 'bg-orange-400' },
              { label: 'Media', dot: 'bg-blue-400' },
              { label: 'Baja', dot: 'bg-gray-400' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${p.dot}`} />
                <span className="text-xs text-parchment-400">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
