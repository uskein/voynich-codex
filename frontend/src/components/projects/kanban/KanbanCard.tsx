import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { Task } from './KanbanBoard';
import { format, isPast, isToday } from 'date-fns';

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

const priorityConfig = {
  LOW: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Low' },
  MEDIUM: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Medium' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical' }
};

export function KanbanCard({ task, isDragging, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const priority = priorityConfig[task.priority];
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = dueDate && isToday(dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-midnight-800 border border-midnight-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-midnight-500 ${
        isDragging || isSortableDragging ? 'opacity-50 shadow-xl ring-2 ring-burnt-500/50' : ''
      }`}
    >
      {/* Priority & Labels */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
          {priority.label}
        </span>
        {task.labels?.map(label => (
          <span key={label} className="text-xs px-2 py-0.5 rounded-full bg-midnight-600 text-parchment-300">
            {label}
          </span>
        ))}
      </div>

      {/* Title */}
      <h4 className="font-medium text-parchment-100 text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-parchment-400 line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {dueDate && (
            <span className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-parchment-500'
            }`}>
              {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {format(dueDate, 'MMM d')}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-1">
            {task.assignee.avatarUrl ? (
              <img
                src={task.assignee.avatarUrl}
                alt={task.assignee.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-burnt-500/20 flex items-center justify-center">
                <span className="text-xs text-burnt-400">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
