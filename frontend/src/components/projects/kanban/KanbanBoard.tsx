import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignee?: { id: string; name: string; avatarUrl?: string };
  dueDate?: string;
  labels?: string[];
  order: number;
  createdAt: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, data: Partial<Task>) => void;
  onTaskMove: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  onTaskCreate: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-midnight-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-yellow-500' },
  { id: 'DONE', title: 'Done', color: 'bg-green-500' }
];

export function KanbanBoard({ tasks, onTaskMove, onTaskCreate, onTaskClick }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find(c => c.id === overId);
    if (targetColumn) {
      const targetTasks = getTasksByStatus(targetColumn.id);
      onTaskMove(taskId, targetColumn.id, targetTasks.length);
      return;
    }

    // Dropped on another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && overTask.id !== taskId) {
      onTaskMove(taskId, overTask.status, overTask.order + 1);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id as string;

    // Check if over a column
    const targetColumn = columns.find(c => c.id === overId);
    if (targetColumn && activeTask.status !== targetColumn.id) {
      onTaskMove(activeTask.id, targetColumn.id, activeTask.order);
      return;
    }

    // Check if over another task in different column
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      onTaskMove(activeTask.id, overTask.status, overTask.order);
    }
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={getTasksByStatus(column.id)}
            onTaskCreate={() => onTaskCreate(column.id)}
            onTaskClick={onTaskClick}
          />
        ))}

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
