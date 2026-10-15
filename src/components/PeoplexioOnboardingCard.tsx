'use client';

import React, { useState } from 'react';
import {
  Check,
  Circle,
  Plus,
  Video,
  Zap,
  Lock,
  Paperclip,
  FileText,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  timeStr: string;
  completed: boolean;
  iconType: 'kit' | 'meeting' | 'project' | 'goals' | 'policy' | 'custom';
}

interface OnboardingCardProps {
  onOpenTasksTab?: () => void;
}

export default function PeoplexioOnboardingCard({ onOpenTasksTab }: OnboardingCardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: '1',
      title: 'Welcome Kit',
      timeStr: 'Sep 12, 09:30',
      completed: true,
      iconType: 'kit',
    },
    {
      id: '2',
      title: 'Team Meeting',
      timeStr: 'Sep 13, 10:30',
      completed: true,
      iconType: 'meeting',
    },
    {
      id: '3',
      title: 'Project Update',
      timeStr: 'Sep 14, 12:00',
      completed: false,
      iconType: 'project',
    },
    {
      id: '4',
      title: 'Discuss OK Goals',
      timeStr: 'Sep 15, 14:45',
      completed: false,
      iconType: 'goals',
    },
    {
      id: '5',
      title: 'HR Policy Review',
      timeStr: 'Sep 16, 16:00',
      completed: false,
      iconType: 'policy',
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      timeStr: 'Today, Just now',
      completed: false,
      iconType: 'custom',
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'kit':
        return <Video className="w-3.5 h-3.5 text-white/90" />;
      case 'meeting':
        return <Zap className="w-3.5 h-3.5 text-white/90" />;
      case 'project':
        return <Lock className="w-3.5 h-3.5 text-white/90" />;
      case 'goals':
        return <Paperclip className="w-3.5 h-3.5 text-white/90" />;
      case 'policy':
      default:
        return <FileText className="w-3.5 h-3.5 text-white/90" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Card: Onboarding Gauge & Segmented Progress */}
      <div className="bg-white rounded-[32px] p-5 shadow-[0_4px_24px_rgba(30,27,56,0.04)] border border-[#ECEAF5] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">Onboarding</h4>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            {completionPercentage}%
          </span>
        </div>

        {/* Segmented Pill Progress Bar */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* Segment 1: Task Purple Pill */}
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">30%</span>
            <div className="h-9 rounded-2xl bg-[#7B61FF] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              Task
            </div>
          </div>

          {/* Segment 2: Dark Navy Pill */}
          <div className="w-16">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">25%</span>
            <div className="h-9 rounded-2xl bg-[#1E1B38] flex items-center justify-center" />
          </div>

          {/* Segment 3: Light Grey Pill */}
          <div className="w-10">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">0%</span>
            <div className="h-9 rounded-2xl bg-[#EBE8F6] flex items-center justify-center" />
          </div>
        </div>
      </div>

      {/* Bottom Sleek Dark Navy Task Card */}
      <div className="bg-[#1E1B38] text-white rounded-[32px] p-5 sm:p-6 shadow-xl border border-[#2D2A50] space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Onboarding Task
            </h4>
            <p className="text-[11px] text-white/50">Required checklists &amp; milestones</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white/90">
              {completedCount}/{totalCount}
            </span>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Add task"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Add Task Input */}
        {isAdding && (
          <form onSubmit={handleAddTask} className="pt-1 pb-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter checklist item..."
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-[#7B61FF]"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#7B61FF] hover:bg-[#6A4FF5] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="space-y-3 pt-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  {getTaskIcon(task.iconType)}
                </div>
                <div>
                  <h5
                    className={`text-xs font-bold leading-tight transition-all ${
                      task.completed ? 'text-white/60 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h5>
                  <p className="text-[10px] text-white/40 mt-0.5">{task.timeStr}</p>
                </div>
              </div>

              {/* Checkmark Circle Button */}
              <div className="shrink-0 pl-2">
                {task.completed ? (
                  <div className="w-6 h-6 rounded-full bg-[#7B61FF] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-white/50 transition-colors" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {onOpenTasksTab && (
          <button
            onClick={onOpenTasksTab}
            className="w-full pt-3 text-center text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer border-t border-white/10"
          >
            View all work tasks →
          </button>
        )}
      </div>
    </div>
  );
}
