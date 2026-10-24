'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  RefreshCw,
  Layers,
  CalendarDays,
  X,
} from 'lucide-react';

interface TaskItem {
  _id: string;
  date: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED';
  hoursSpent?: number;
  blockers?: string;
  createdAt: string;
  user?: {
    _id?: string;
    name: string;
    employeeId: string;
    department?: string;
    designation?: string;
    avatarUrl?: string;
  };
}

interface EmployeeOption {
  _id: string;
  name: string;
  employeeId: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
}

interface DailyTaskSectionProps {
  userId?: string;
}

export default function DailyTaskSection({ userId }: DailyTaskSectionProps) {
  const isAdminMode = !userId;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED'>('ALL');
  const [groupBy, setGroupBy] = useState<'DATE' | 'EMPLOYEE' | 'LIST'>('DATE');

  // Expanded card tracking (set of task IDs)
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Form State for new task submission
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED'>('COMPLETED');
  const [formHoursSpent, setFormHoursSpent] = useState<string>('8');
  const [formBlockers, setFormBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    if (isAdminMode) {
      fetchEmployees();
    }
  }, [userId]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      }
    } catch {
      // ignore
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = '/api/tasks';
      if (userId) {
        url += `?userId=${userId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  // Quick date helper strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const weekAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  // Jump date by -1 or +1 day
  const handleShiftDate = (days: number) => {
    const base = customDate ? new Date(customDate) : new Date();
    base.setDate(base.getDate() + days);
    const newStr = base.toISOString().split('T')[0];
    setCustomDate(newStr);
    setDateFilterMode('CUSTOM');
  };

  // Submit task handler
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formTitle.trim() || !formDescription.trim()) {
      setErrorMsg('Please enter both task title and detailed description');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          title: formTitle.trim(),
          description: formDescription.trim(),
          status: formStatus,
          hoursSpent: Number(formHoursSpent) || 0,
          blockers: formBlockers.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormTitle('');
        setFormDescription('');
        setFormBlockers('');
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
    if (!confirm('Are you sure you want to delete this daily task report?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      } else {
        alert(data.error || 'Failed to delete task');
      }
    } catch {
      alert('Network error deleting task');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandedTaskIds.size === filteredTasks.length) {
      setExpandedTaskIds(new Set());
    } else {
      setExpandedTaskIds(new Set(filteredTasks.map((t) => t._id)));
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Employee filter
      if (selectedEmployeeId !== 'ALL') {
        const taskUserId = task.user?._id;
        if (taskUserId !== selectedEmployeeId) return false;
      }

      // 2. Date filter
      if (dateFilterMode === 'TODAY') {
        if (task.date !== todayStr) return false;
      } else if (dateFilterMode === 'YESTERDAY') {
        if (task.date !== yesterdayStr) return false;
      } else if (dateFilterMode === 'WEEK') {
        if (task.date < weekAgoStr) return false;
      } else if (dateFilterMode === 'CUSTOM') {
        if (task.date !== customDate) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const userName = task.user?.name?.toLowerCase() || '';
        const empId = task.user?.employeeId?.toLowerCase() || '';
        const dept = task.user?.department?.toLowerCase() || '';
        const title = task.title.toLowerCase();
        const desc = task.description.toLowerCase();
        const date = task.date.toLowerCase();
        const blockers = task.blockers?.toLowerCase() || '';

        return (
          userName.includes(q) ||
          empId.includes(q) ||
          dept.includes(q) ||
          title.includes(q) ||
          desc.includes(q) ||
          date.includes(q) ||
          blockers.includes(q)
        );
      }

      return true;
    });
  }, [tasks, selectedEmployeeId, dateFilterMode, customDate, statusFilter, searchQuery, todayStr, yesterdayStr, weekAgoStr]);

  // Management KPIs
  const stats = useMemo(() => {
    const totalReports = filteredTasks.length;
    const employeeSet = new Set<string>();
    let totalHours = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let blockedCount = 0;

    for (const t of filteredTasks) {
      if (t.user?._id) employeeSet.add(t.user._id);
      if (t.hoursSpent) totalHours += t.hoursSpent;
      if (t.status === 'COMPLETED') completedCount++;
      else if (t.status === 'IN_PROGRESS') inProgressCount++;
      else if (t.status === 'BLOCKED') blockedCount++;
    }

    return {
      totalReports,
      activeEmployees: employeeSet.size,
      totalHours: Math.round(totalHours * 10) / 10,
      completedCount,
      inProgressCount,
      blockedCount,
    };
  }, [filteredTasks]);

  // Grouped tasks by Date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of filteredTasks) {
      const arr = map.get(t.date) || [];
      arr.push(t);
      map.set(t.date, arr);
    }
    // Return entries sorted by date descending
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTasks]);

  // Grouped tasks by Employee
  const groupedByEmployee = useMemo(() => {
    const map = new Map<string, { user: TaskItem['user']; tasks: TaskItem[] }>();
    for (const t of filteredTasks) {
      const key = t.user?._id || 'unknown';
      const existing = map.get(key) || { user: t.user, tasks: [] };
      existing.tasks.push(t);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.user?.name || '').localeCompare(b.user?.name || '')
    );
  }, [filteredTasks]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950/90 text-amber-300 border border-amber-800">
            <Clock className="w-3 h-3 text-amber-400" /> In Progress
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-950/90 text-rose-300 border border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Blocked
          </span>
        );
      default:
        return null;
    }
  };

  const renderTaskCard = (task: TaskItem) => {
    const isExpanded = expandedTaskIds.has(task._id);
    const isLongDescription = task.description.length > 180 || task.description.split('\n').length > 3;

    return (
      <div
        key={task._id}
        className={`p-4 rounded-2xl border transition-all ${
          task.status === 'BLOCKED'
            ? 'bg-rose-950/15 border-rose-900/40 hover:border-rose-700/60'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-orange-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-400" />
              {task.date}
            </span>

            {task.user?.name && (
              <span className="text-xs font-semibold text-slate-200 bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700/60 inline-flex items-center gap-1.5">
                <UserIcon className="w-3 h-3 text-indigo-400" />
                <span>{task.user.name}</span>
                <span className="font-mono text-slate-400 text-[11px]">({task.user.employeeId})</span>
                {task.user.department && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">• {task.user.department}</span>
                )}
              </span>
            )}

            <h4 className="font-extrabold text-white text-sm tracking-tight">{task.title}</h4>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {getStatusBadge(task.status)}

            {task.hoursSpent ? (
              <span className="text-xs text-slate-400 font-mono font-bold bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
                {task.hoursSpent} hrs
              </span>
            ) : null}

            {isAdminMode && (
              <button
                type="button"
                onClick={() => handleDeleteTask(task._id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Delete task report"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Task Description Body (with 2-3 line preview & dropdown toggle) */}
        <div className="mt-3">
          <div
            className={`text-xs text-slate-300 leading-relaxed whitespace-pre-wrap transition-all ${
              !isExpanded && isLongDescription ? 'line-clamp-3' : ''
            }`}
          >
            {task.description}
          </div>

          {isLongDescription && (
            <button
              type="button"
              onClick={() => toggleExpand(task._id)}
              className="mt-2 text-[11px] font-bold text-[#FF6B00] hover:text-orange-400 inline-flex items-center gap-1 transition-colors cursor-pointer bg-orange-950/20 hover:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-800/40"
            >
              {isExpanded ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Read Full Report ({task.description.split('\n').length} lines)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Blocker Alert Banner */}
        {task.blockers && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-200">Critical Blocker / Dependency:</strong>
              <p className="mt-0.5 leading-relaxed text-amber-300/90">{task.blockers}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Container */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950 text-orange-400 border border-orange-800 mb-2">
              <CheckSquare className="w-3.5 h-3.5" />
              {isAdminMode ? 'Management Task Command Center' : 'Daily Work Progress'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isAdminMode ? 'Employee Daily Work Reports' : 'My Daily Task Log'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdminMode
                ? 'Review detailed staff tasks, inspect historical work dates, track logged hours, and identify project blockers.'
                : 'Log what you achieved today, record hours, and alert management of any project blockers.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh task reports"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Daily Work</span>
            </button>
          </div>
        </div>

        {/* Admin KPI Cards Banner */}
        {isAdminMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Submissions
              </span>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalReports}</div>
              <span className="text-[11px] text-slate-500 font-medium">reports matching filter</span>
            </div>

            <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                Reporting Staff
              </span>
              <div className="text-xl font-black text-indigo-300 mt-0.5">{stats.activeEmployees}</div>
              <span className="text-[11px] text-indigo-400/80 font-medium">active team members</span>
            </div>

            <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Hours Logged
              </span>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{stats.totalHours} hrs</div>
              <span className="text-[11px] text-emerald-400/80 font-medium">
                {stats.completedCount} completed tasks
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${stats.blockedCount > 0 ? 'bg-rose-950/30 border-rose-900/60' : 'bg-slate-900/80 border-slate-800'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${stats.blockedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                Actionable Blockers
              </span>
              <div className={`text-xl font-black mt-0.5 ${stats.blockedCount > 0 ? 'text-rose-300' : 'text-white'}`}>
                {stats.blockedCount}
              </div>
              <span className={`text-[11px] font-medium ${stats.blockedCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {stats.blockedCount > 0 ? '⚠️ requires assistance' : 'No current blockers'}
              </span>
            </div>
          </div>
        )}

        {/* Filter Controls Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
          {/* Row 1: Employee selector & Date Quick Chips */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Employee Selector (Admin Only) */}
            {isAdminMode && (
              <div className="w-full lg:w-72 shrink-0">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Filter by Employee
                </label>
                <div className="relative">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] cursor-pointer appearance-none"
                  >
                    <option value="ALL">👥 All Employees ({employees.length})</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeId || 'No ID'}) {emp.department ? `• ${emp.department}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Date Filters Ribbon */}
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-orange-400" />
                Date Range / Previous Days Work
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilterMode('ALL')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilterMode === 'ALL'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All Dates
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilterMode('TODAY')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilterMode === 'TODAY'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilterMode('YESTERDAY')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilterMode === 'YESTERDAY'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Yesterday
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilterMode('WEEK')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilterMode === 'WEEK'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Last 7 Days
                </button>

                {/* Custom Picked Date with Previous/Next Day Arrows */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleShiftDate(-1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilterMode('CUSTOM');
                    }}
                    className={`bg-transparent px-2 py-1 text-xs font-mono font-bold focus:outline-hidden cursor-pointer ${
                      dateFilterMode === 'CUSTOM' ? 'text-orange-400' : 'text-slate-300'
                    }`}
                    title="Jump to specific date"
                  />

                  <button
                    type="button"
                    onClick={() => handleShiftDate(1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Search, Status filters, Grouping, & Expand All */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by keywords, task title, employee, or blocker details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                All Status
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                }`}
              >
                Completed ({stats.completedCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                }`}
              >
                In Progress ({stats.inProgressCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('BLOCKED')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'BLOCKED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                }`}
              >
                Blocked ({stats.blockedCount})
              </button>
            </div>

            {/* View Mode & Expand All */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              {isAdminMode && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setGroupBy('DATE')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      groupBy === 'DATE' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Group by Submission Date"
                  >
                    By Date
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupBy('EMPLOYEE')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      groupBy === 'EMPLOYEE' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Group by Employee"
                  >
                    By Staff
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupBy('LIST')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      groupBy === 'LIST' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Show Flat Chronological List"
                  >
                    List
                  </button>
                </div>
              )}

              {filteredTasks.length > 0 && (
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Layers className="w-3.5 h-3.5 text-orange-400" />
                  <span>{expandedTaskIds.size === filteredTasks.length ? 'Collapse All' : 'Expand All'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task Cards Presentation */}
        <div className="pt-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
              <span>Loading task reports from database...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-slate-600 mb-2.5" />
              <span className="font-bold text-slate-400 text-sm">No task reports match this filter criteria</span>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">
                Try selecting &quot;All Dates&quot; or clearing your search filters to view previous submissions.
              </p>
            </div>
          ) : groupBy === 'DATE' && isAdminMode ? (
            /* GROUPED BY DATE VIEW */
            <div className="space-y-6">
              {groupedByDate.map(([dateKey, items]) => (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-400 bg-orange-950/60 border border-orange-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateKey === todayStr ? `Today (${dateKey})` : dateKey === yesterdayStr ? `Yesterday (${dateKey})` : dateKey}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {items.length} {items.length === 1 ? 'task report' : 'task reports'} • {items.reduce((s, x) => s + (x.hoursSpent || 0), 0)} hrs logged
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((task) => renderTaskCard(task))}
                  </div>
                </div>
              ))}
            </div>
          ) : groupBy === 'EMPLOYEE' && isAdminMode ? (
            /* GROUPED BY EMPLOYEE VIEW */
            <div className="space-y-6">
              {groupedByEmployee.map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-black text-xs flex items-center justify-center">
                        {group.user?.name?.charAt(0) || 'U'}
                      </span>
                      <h3 className="font-black text-sm text-white">{group.user?.name || 'Unknown Employee'}</h3>
                      <span className="font-mono text-xs text-slate-400">({group.user?.employeeId || 'No ID'})</span>
                      {group.user?.department && (
                        <span className="text-xs text-slate-500 hidden sm:inline">• {group.user.department}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {group.tasks.length} {group.tasks.length === 1 ? 'report' : 'reports'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.tasks.map((task) => renderTaskCard(task))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FLAT LIST VIEW */
            <div className="space-y-3">
              {filteredTasks.map((task) => renderTaskCard(task))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0D1527] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 text-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg">Submit Daily Work Progress</h3>
                <p className="text-xs text-slate-400 mt-0.5">Record what you worked on, milestones achieved, and hours</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Hours Logged</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    step="0.5"
                    value={formHoursSpent}
                    onChange={(e) => setFormHoursSpent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Task Summary / Milestone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter Wiring & System Commissioning at Site 4"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Task Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('COMPLETED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formStatus === 'COMPLETED'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('IN_PROGRESS')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formStatus === 'IN_PROGRESS'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('BLOCKED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formStatus === 'BLOCKED'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Blocked
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Detailed Work Breakdown / Description
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe the steps completed, site observations, or deliverables in full detail..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Blockers / Dependency (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Waiting for 32A DC circuit breaker delivery from warehouse"
                  value={formBlockers}
                  onChange={(e) => setFormBlockers(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  <span>{submitting ? 'Submitting...' : 'Submit Work Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
