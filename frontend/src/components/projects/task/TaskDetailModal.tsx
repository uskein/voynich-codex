import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { Task, TaskStatus } from '../kanban/KanbanBoard';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  members?: { id: string; name: string; avatarUrl?: string }[];
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' }
];

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-gray-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-400' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400' }
];

export function TaskDetailModal({ task, isOpen, onClose, onUpdate, onDelete, members = [] }: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee?.id || '');
      setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
      setLabels(task.labels || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate(task.id, {
      title,
      description,
      status,
      priority: priority as any,
      assignee: assigneeId ? { id: assigneeId, name: '', avatarUrl: undefined } : undefined,
      dueDate: dueDate || undefined,
      labels
    });
    onClose();
  };

  const handleAddLabel = () => {
    if (newLabel && !labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-midnight-800 rounded-xl shadow-2xl border border-midnight-600 max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-midnight-700">
              <h2 className="font-serif text-xl font-bold text-parchment-100">Edit Task</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { onDelete(task.id); onClose(); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-midnight-700 text-parchment-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-parchment-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-parchment-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-parchment-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                  >
                    {priorityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-parchment-300">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-parchment-300">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                  />
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-parchment-300">Labels</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {labels.map(label => (
                    <span key={label} className="flex items-center gap-1 px-2 py-1 bg-midnight-600 rounded-full text-xs text-parchment-200">
                      {label}
                      <button onClick={() => handleRemoveLabel(label)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Add label"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                  />
                  <Button size="sm" onClick={handleAddLabel}>Add</Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-midnight-700">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
