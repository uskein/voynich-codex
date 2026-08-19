import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import type { Task, TaskStatus } from './KanbanBoard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onTaskCreate: () => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ id, title, color, tasks, onTaskCreate, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 min-w-[320px] bg-midnight-800/30 rounded-xl transition-colors ${
        isOver ? 'bg-midnight-700/50 ring-2 ring-burnt-500/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-midnight-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-medium text-parchment-100">{title}</h3>
          <span className="text-xs text-parchment-500 bg-midnight-700 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onTaskCreate}
          className="p-1 rounded hover:bg-midnight-700 text-parchment-400 hover:text-parchment-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[100px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-parchment-500 text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
