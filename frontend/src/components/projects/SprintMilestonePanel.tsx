import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { taskAPI } from '../../services/api';
import { format } from 'date-fns';

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count: { tasks: number };
}

interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  _count: { tasks: number };
}

interface SprintMilestonePanelProps {
  manuscriptId: string;
  onSprintSelect?: (sprintId: string) => void;
}

export function SprintMilestonePanel({ manuscriptId, onSprintSelect }: SprintMilestonePanelProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeTab, setActiveTab] = useState<'sprints' | 'milestones'>('sprints');
  const [isCreating, setIsCreating] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });

  useEffect(() => {
    loadData();
  }, [manuscriptId]);

  const loadData = async () => {
    try {
      const [sprintsRes, milestonesRes] = await Promise.all([
        taskAPI.getSprints(manuscriptId),
        taskAPI.getMilestones(manuscriptId)
      ]);
      setSprints(sprintsRes.data.sprints || []);
      setMilestones(milestonesRes.data.milestones || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name) return;
    try {
      await taskAPI.createSprint(manuscriptId, newSprint);
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
      setIsCreating(false);
      loadData();
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.name) return;
    try {
      await taskAPI.createMilestone(manuscriptId, newMilestone);
      setNewMilestone({ name: '', description: '', dueDate: '' });
      setIsCreating(false);
      loadData();
    } catch (error) {
      console.error('Failed to create milestone:', error);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex bg-midnight-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('sprints')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeTab === 'sprints' ? 'bg-burnt-500 text-white' : 'text-parchment-400'
              }`}
            >
              Sprints
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeTab === 'milestones' ? 'bg-burnt-500 text-white' : 'text-parchment-400'
              }`}
            >
              Milestones
            </button>
          </div>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto max-h-[400px]">
        {/* Create form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              {activeTab === 'sprints' ? (
                <div className="p-3 bg-midnight-700/50 rounded-lg space-y-2">
                  <Input
                    placeholder="Sprint name"
                    value={newSprint.name}
                    onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  />
                  <Input
                    placeholder="Goal (optional)"
                    value={newSprint.goal}
                    onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={newSprint.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                      className="px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 text-sm"
                    />
                    <input
                      type="date"
                      value={newSprint.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                      className="px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateSprint}>Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-midnight-700/50 rounded-lg space-y-2">
                  <Input
                    placeholder="Milestone name"
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  />
                  <input
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-parchment-100 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateMilestone}>Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {activeTab === 'sprints' ? (
          <div className="space-y-2">
            {sprints.length === 0 ? (
              <p className="text-center text-parchment-500 py-8">No sprints yet</p>
            ) : (
              sprints.map(sprint => (
                <div
                  key={sprint.id}
                  onClick={() => onSprintSelect?.(sprint.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    sprint.isActive
                      ? 'border-burnt-500/50 bg-burnt-500/10'
                      : 'border-midnight-600 hover:border-midnight-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-parchment-100">{sprint.name}</h4>
                      {sprint.goal && (
                        <p className="text-xs text-parchment-400 mt-1">{sprint.goal}</p>
                      )}
                    </div>
                    {sprint.isActive && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-parchment-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d')}
                    </span>
                    <span>{sprint._count.tasks} tasks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {milestones.length === 0 ? (
              <p className="text-center text-parchment-500 py-8">No milestones yet</p>
            ) : (
              milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    milestone.isCompleted
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-midnight-600 hover:border-midnight-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className={`w-4 h-4 ${milestone.isCompleted ? 'text-green-400' : 'text-parchment-400'}`} />
                      <h4 className="font-medium text-parchment-100">{milestone.name}</h4>
                    </div>
                    {milestone.isCompleted && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-parchment-400 mt-1 ml-6">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-parchment-500 ml-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                    </span>
                    <span>{milestone._count.tasks} tasks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
