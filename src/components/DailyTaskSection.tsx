'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, CheckCircle2, AlertTriangle, AlertCircle, Trash2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface TaskItem {
  _id: string;
  date: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED';
  hoursSpent?: number;
  blockers?: string;
  createdAt: string;
}

interface DailyTaskSectionProps {
  userId?: string;
}

export default function DailyTaskSection({ userId }: DailyTaskSectionProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED'>('COMPLETED');
  const [hoursSpent, setHoursSpent] = useState<string>('8');
  const [blockers, setBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = '/api/tasks';
      if (userId) url += `?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both task title and description');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          title: title.trim(),
          description: description.trim(),
          status,
          hoursSpent: Number(hoursSpent) || 0,
          blockers: blockers.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setBlockers('');
        fetchTasks();
      } else {
        setErrorMsg(data.error || 'Failed to submit task');
      }
    } catch {
      setErrorMsg('Network error submitting task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task entry?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      } else {
        alert(data.error || 'Failed to delete task');
      }
    } catch {
      alert('Network error deleting task');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Blocked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            Daily Work Progress Reports
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Daily Task Submissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit your daily tasks and achievements so management can review your progress
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-xs shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Submit Today&apos;s Work
        </button>
      </div>

      {/* Task List */}
      <div className="pt-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading task reports...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
            <FileText className="w-8 h-8 text-slate-300 mb-2" />
            <span>No daily task reports submitted yet. Click &quot;Submit Today&apos;s Work&quot; to log your progress!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {task.date}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{task.title}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(task.status)}
                    {task.hoursSpent ? (
                      <span className="text-xs text-slate-500 font-mono">
                        {task.hoursSpent} hrs
                      </span>
                    ) : null}
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      title="Delete task report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </div>

                {task.blockers && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Blocker / Dependency:</strong> {task.blockers}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Submit Daily Work Progress</h3>
            <p className="text-xs text-slate-500 mb-4">Record what you worked on and achieved today</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTask} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hours Logged</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    step="0.5"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task / Work Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter Wiring & System Commissioning at Site 4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('COMPLETED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('IN_PROGRESS')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      status === 'IN_PROGRESS'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('BLOCKED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      status === 'BLOCKED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Blocked
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Progress / Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the steps completed, site observations, or deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blockers / Material Needed (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Waiting for 32A DC circuit breaker from warehouse"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Work Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
