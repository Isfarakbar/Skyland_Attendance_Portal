'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Database,
  Server,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Sliders,
  FileText,
  Trash2,
  Activity,
  Calendar,
  User as UserIcon,
  Search,
  Check,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function DeveloperConsole() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'designer' | 'records'>('overview');

  // Diagnostics Data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Portal Designer Form State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    companyName: 'Skyland',
    portalTitle: 'Skyland Attendance Portal',
    portalTagline: 'Solar Energy Workforce & Attendance Hub',
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    gracePeriodMinutes: 15,
    allowedFreeLeaves: 1,
    allowedFreeHalfLeaves: 1,
  });

  // Master Record Management State
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [lookupDate, setLookupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recordSearching, setRecordSearching] = useState(false);
  const [foundAttendance, setFoundAttendance] = useState<any>(null);
  const [recordActionMsg, setRecordActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Master Tasks State
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    fetchDiagnostics();
    fetchPortalSettings();
    fetchEmployeesList();
    fetchAllTasks();
  }, []);

  const fetchDiagnostics = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/developer/diagnostics');
      const json = await res.json();
      if (json.success) {
        setData(json.diagnostics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPortalSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.settings) {
        setSettingsForm({
          companyName: json.settings.companyName || 'Skyland',
          portalTitle: json.settings.portalTitle || 'Skyland Attendance Portal',
          portalTagline: json.settings.portalTagline || 'Solar Energy Workforce & Attendance Hub',
          officeStartTime: json.settings.officeStartTime || '09:00',
          officeEndTime: json.settings.officeEndTime || '18:00',
          gracePeriodMinutes: json.settings.gracePeriodMinutes ?? 15,
          allowedFreeLeaves: json.settings.allowedFreeLeaves ?? 1,
          allowedFreeHalfLeaves: json.settings.allowedFreeHalfLeaves ?? 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const json = await res.json();
      if (json.success) {
        setSettingsMsg({ text: 'Portal design & rules saved successfully!', type: 'success' });
      } else {
        setSettingsMsg({ text: json.error || 'Failed to save settings', type: 'error' });
      }
    } catch {
      setSettingsMsg({ text: 'Network error saving settings', type: 'error' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (json.success) {
        setEmployees(json.employees || []);
        if (json.employees?.length > 0 && !selectedUser) {
          setSelectedUser(json.employees[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const json = await res.json();
      if (json.success) {
        setAllTasks(json.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSearchAttendance = async () => {
    if (!selectedUser || !lookupDate) return;
    setRecordSearching(true);
    setRecordActionMsg(null);
    setFoundAttendance(null);
    try {
      const res = await fetch(`/api/attendance/history?userId=${selectedUser}&month=${lookupDate.substring(0, 7)}`);
      const json = await res.json();
      if (json.success) {
        const match = (json.records || []).find((r: any) => r.date === lookupDate);
        if (match) {
          setFoundAttendance(match);
        } else {
          setRecordActionMsg({ text: `No attendance record found for this user on ${lookupDate}`, type: 'error' });
        }
      }
    } catch {
      setRecordActionMsg({ text: 'Error searching record', type: 'error' });
    } finally {
      setRecordSearching(false);
    }
  };

  const handleDeleteFoundAttendance = async () => {
    if (!foundAttendance?._id) return;
    if (!confirm(`Are you sure you want to permanently delete attendance for date ${lookupDate}?`)) return;
    try {
      const res = await fetch(`/api/attendance/adjust?id=${foundAttendance._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setFoundAttendance(null);
        setRecordActionMsg({ text: 'Attendance record deleted permanently from database!', type: 'success' });
        fetchDiagnostics();
      } else {
        setRecordActionMsg({ text: json.error || 'Failed to delete record', type: 'error' });
      }
    } catch {
      setRecordActionMsg({ text: 'Error deleting attendance record', type: 'error' });
    }
  };

  const handleDeleteTaskMaster = async (taskId: string) => {
    if (!confirm('Are you sure you want to permanently delete this task report?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAllTasks((prev) => prev.filter((t) => t._id !== taskId));
        fetchDiagnostics();
      } else {
        alert(json.error || 'Failed to delete task');
      }
    } catch {
      alert('Error deleting task');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Loading Master Operations Console...</div>;
  }

  const db = data?.database;
  const server = data?.server;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-mono font-bold">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight text-white">Master Operations &amp; Portal Control</h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Root Super-Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full authority: edit portal design, permanently delete any attendance/task, manage company rules
              </p>
            </div>
          </div>

          {/* Sub Navigation Pills */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Telemetry
            </button>
            <button
              onClick={() => setActiveSubTab('designer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'designer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Portal Designer
            </button>
            <button
              onClick={() => setActiveSubTab('records')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'records'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Master Record Purge
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Database Latency</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-emerald-400">{db?.pingMs || 0} ms</span>
              <span className="text-[11px] text-slate-400">Atlas roundtrip</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Node.js Memory</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-white">{server?.memory?.heapUsedMB || 0} MB</span>
              <span className="text-[11px] text-slate-400">heap</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Node Runtime</span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-white">{server?.nodeVersion || 'v24'}</span>
              <span className="text-[11px] text-slate-400">{server?.platform}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Master Identity</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-bold text-emerald-400 truncate">isfarakbar.dev@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Telemetry & Inventory */}
      {activeSubTab === 'overview' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Live MongoDB Collections Inventory
              </h3>
              <p className="text-xs text-slate-500">Real-time document counts stored in your Atlas cluster</p>
            </div>
            <button
              onClick={fetchDiagnostics}
              disabled={refreshing}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Users</p>
              <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
                {db?.collections?.users || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Accounts</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendances</p>
              <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
                {db?.collections?.attendances || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Logs &amp; Register Entries</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Tasks</p>
              <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
                {allTasks.length || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Work progress submissions</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Leaves</p>
              <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
                {db?.collections?.leaveRequests || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Time off requests</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Portal Designer */}
      {activeSubTab === 'designer' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="pb-6 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
                <Sliders className="w-3.5 h-3.5" />
                Portal Customizer &amp; Policy Rules
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Design &amp; Configure Portal</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize title, taglines, work shift hours, and leave fine rules directly from your master account.
              </p>
            </div>
          </div>

          {settingsMsg && (
            <div
              className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                settingsMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {settingsMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{settingsMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.companyName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Portal Title</label>
                <input
                  type="text"
                  required
                  value={settingsForm.portalTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, portalTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Portal Tagline / Subtitle</label>
              <input
                type="text"
                required
                value={settingsForm.portalTagline}
                onChange={(e) => setSettingsForm({ ...settingsForm, portalTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Office Start Time</label>
                <input
                  type="time"
                  required
                  value={settingsForm.officeStartTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeStartTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Office End Time</label>
                <input
                  type="time"
                  required
                  value={settingsForm.officeEndTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeEndTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={settingsForm.gracePeriodMinutes}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Allowed Free Offs / Month</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={settingsForm.allowedFreeLeaves}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowedFreeLeaves: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Beyond this, per-day fine = Base Salary / 30</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Allowed Free Half Leaves / Month</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={settingsForm.allowedFreeHalfLeaves}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowedFreeHalfLeaves: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Beyond this, per-half-day fine = (Base Salary / 30) / 2</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{settingsSaving ? 'Saving Changes...' : 'Save Portal Design & Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Master Record Purge & Editor */}
      {activeSubTab === 'records' && (
        <div className="space-y-6">
          {/* Card A: Specific Attendance Lookup & Delete */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="pb-6 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 mb-2">
                <Trash2 className="w-3.5 h-3.5" />
                Master Attendance Purge
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Delete Specific Attendance Record</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently purge any corrupted, accidental, or dispute attendance record from MongoDB Atlas
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Employee</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId || emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={lookupDate}
                  onChange={(e) => setLookupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSearchAttendance}
                  disabled={recordSearching}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{recordSearching ? 'Searching...' : 'Find Record'}</span>
                </button>
              </div>
            </div>

            {recordActionMsg && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  recordActionMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{recordActionMsg.text}</span>
              </div>
            )}

            {foundAttendance && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Found Attendance:</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-bold text-xs">
                      {foundAttendance.status}
                    </span>
                    <span className="font-mono text-xs text-slate-500">{foundAttendance.date}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span>Clock In: {foundAttendance.clockIn ? new Date(foundAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    <span>Clock Out: {foundAttendance.clockOut ? new Date(foundAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    <span>Notes: {foundAttendance.notes || 'None'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteFoundAttendance}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete Record</span>
                </button>
              </div>
            )}
          </div>

          {/* Card B: Master All Tasks Manager */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100 mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  All Employees Daily Tasks ({allTasks.length})
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Master Daily Tasks Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and delete any work report submitted across the company
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAllTasks}
                disabled={tasksLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${tasksLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {tasksLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading tasks...</div>
            ) : allTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No daily tasks found in the database.</div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {allTasks.map((t) => (
                  <div key={t._id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{t.user?.name || 'Staff Member'}</span>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          {t.date}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTaskMaster(t._id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Permanently Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
