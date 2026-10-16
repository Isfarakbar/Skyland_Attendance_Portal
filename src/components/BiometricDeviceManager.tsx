'use client';

import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Cpu,
  Wifi,
  Search,
  Check,
  X,
  Edit3,
  RefreshCw,
  Zap,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sliders,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';

interface Employee {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  biometricUserId?: string;
  workMode?: 'OFFICE' | 'FIELD';
  avatarUrl?: string;
  isActive: boolean;
}

interface DeviceInfo {
  model: string;
  ipAddress: string;
  port: number;
  protocol: string;
  endpoint: string;
  timezone: string;
  status: string;
}

interface PunchRecord {
  _id: string;
  user?: {
    _id: string;
    name: string;
    employeeId: string;
    department?: string;
    avatarUrl?: string;
    biometricUserId?: string;
  };
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: string;
  notes?: string;
  updatedAt?: string;
}

export default function BiometricDeviceManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [recentPunches, setRecentPunches] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL');

  // Quick edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBioValue, setEditingBioValue] = useState('');
  const [savingId, setSavingId] = useState(false);

  // Status message
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Test Punch Simulator State
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simEmployeeId, setSimEmployeeId] = useState('');
  const [simType, setSimType] = useState<'AUTO' | 'IN' | 'OUT'>('AUTO');
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Copy state
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  // USB Attendance Log Upload
  const [uploadingUsb, setUploadingUsb] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUsbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingUsb(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/attendance/import-usb', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showBanner(data.message || `Imported ${data.syncedCount} punches from Dahua USB log!`, 'success');
        fetchData();
      } else {
        showBanner(data.error || 'Failed to import USB attendance log', 'error');
      }
    } catch {
      showBanner('Network error uploading USB attendance log', 'error');
    } finally {
      setUploadingUsb(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/biometric');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setDevice(data.device || null);
        setRecentPunches(data.recentPunches || []);
      }
    } catch (err) {
      console.error(err);
      showBanner('Failed to load biometric settings', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showBanner = (text: string, type: 'success' | 'error') => {
    setBannerMessage({ text, type });
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleSaveSingle = async (userId: string, bioId: string) => {
    try {
      setSavingId(true);
      const res = await fetch('/api/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-single',
          userId,
          biometricUserId: bioId.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showBanner(data.message, 'success');
        setEditingId(null);
        fetchData();
      } else {
        showBanner(data.error || 'Failed to update biometric ID', 'error');
      }
    } catch {
      showBanner('Error saving biometric ID', 'error');
    } finally {
      setSavingId(false);
    }
  };

  const handleAutoAssign = async (type: 'sequential' | 'code') => {
    const action = type === 'sequential' ? 'auto-assign-sequential' : 'auto-assign-code';
    const confirmMsg =
      type === 'sequential'
        ? 'Assign sequential Biometric IDs (1, 2, 3...) to all employees ordered by Employee Code?'
        : 'Auto-map Biometric IDs from employee codes (e.g. SKY-002 -> 2)?';

    if (!confirm(confirmMsg)) return;

    try {
      setRefreshing(true);
      const res = await fetch('/api/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showBanner(data.message, 'success');
        fetchData();
      } else {
        showBanner(data.error || 'Auto-assignment failed', 'error');
      }
    } catch {
      showBanner('Network error during auto-assignment', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL biometric fingerprint IDs? This will unlink every employee from the machine.')) {
      return;
    }

    try {
      setRefreshing(true);
      const res = await fetch('/api/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-all' }),
      });
      const data = await res.json();
      if (data.success) {
        showBanner(data.message, 'success');
        fetchData();
      } else {
        showBanner(data.error || 'Failed to clear biometric IDs', 'error');
      }
    } catch {
      showBanner('Network error', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestPunch = async () => {
    if (!simEmployeeId) {
      alert('Please select an employee');
      return;
    }

    try {
      setSimSubmitting(true);
      setSimResult(null);
      const emp = employees.find((e) => e._id === simEmployeeId);
      const res = await fetch('/api/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-punch',
          employeeId: emp?.employeeId,
          biometricUserId: emp?.biometricUserId,
          type: simType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSimResult(data.message);
        showBanner(data.message, 'success');
        fetchData();
      } else {
        setSimResult(`Error: ${data.error}`);
        showBanner(data.error || 'Punch failed', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Punch simulation failed';
      setSimResult(`Failed: ${msg}`);
      showBanner(msg, 'error');
    } finally {
      setSimSubmitting(false);
    }
  };

  const handleCopyEndpoint = () => {
    const fullUrl = `${window.location.origin}/api/attendance/device-sync`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2500);
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.biometricUserId && emp.biometricUserId.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterMode === 'LINKED') return Boolean(emp.biometricUserId);
    if (filterMode === 'UNLINKED') return !emp.biometricUserId;
    return true;
  });

  const totalLinked = employees.filter((e) => Boolean(e.biometricUserId)).length;
  const totalUnlinked = employees.length - totalLinked;

  if (loading) {
    return (
      <div className="bg-[#131E36] rounded-[32px] p-12 text-center border border-slate-800 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto animate-pulse">
          <Fingerprint className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-300">Loading Biometric Terminal &amp; Fingerprint Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Notifications */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[#131E36] rounded-[32px] p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Biometric Device &amp; Fingerprint Hub</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Terminal Online
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure Dahua ASA1222G device punches, assign user machine IDs, and simulate real-time check-ins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUsbUpload}
            accept=".xlsx,.xls,.csv,.dat,.txt"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingUsb}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Import attendance logs exported from Dahua USB (.xlsx, .csv, .dat, .txt)"
          >
            {uploadingUsb ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
            )}
            <span>{uploadingUsb ? 'Importing Log...' : 'Import Dahua USB Log'}</span>
          </button>

          <button
            onClick={() => setSimulatorOpen(!simulatorOpen)}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Punch Simulator</span>
          </button>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131E36] rounded-2xl p-4 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Staff</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{employees.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Active Workforce</span>
        </div>

        <div className="bg-[#131E36] rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/10 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold">Linked Fingerprints</span>
            <Fingerprint className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{totalLinked}</p>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">
            {employees.length > 0 ? Math.round((totalLinked / employees.length) * 100) : 0}% Coverage
          </span>
        </div>

        <div className="bg-[#131E36] rounded-2xl p-4 border border-amber-500/20 bg-amber-950/10 shadow-md">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold">Unlinked Staff</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{totalUnlinked}</p>
          <span className="text-[11px] text-amber-500/80 mt-1 block">Pending Device ID</span>
        </div>

        <div className="bg-[#131E36] rounded-2xl p-4 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Machine Model</span>
            <Cpu className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-sm font-extrabold text-white truncate">Dahua ASA1222G</p>
          <span className="text-[11px] text-slate-500 mt-1 block">TCP/IP Port 37777</span>
        </div>
      </div>

      {/* Simulator Card (Collapsible) */}
      {simulatorOpen && (
        <div className="bg-slate-900/95 rounded-[28px] p-5 sm:p-6 border border-orange-500/40 shadow-2xl animate-in slide-in-from-top-3 duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <h3 className="font-extrabold text-white text-sm">Biometric Machine Punch Simulator</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Live Test Tool
              </span>
            </div>
            <button
              onClick={() => setSimulatorOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Simulate a fingerprint punch as if the employee placed their thumb on the physical Dahua terminal right now. This runs through the full check-in logic, calculates punctuality against office rules, and logs to attendance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Select Employee</label>
              <select
                value={simEmployeeId}
                onChange={(e) => setSimEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId}) {emp.biometricUserId ? `[Bio #${emp.biometricUserId}]` : '[Unlinked]'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Punch Action</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
              >
                <option value="AUTO">AUTO (Clock In if 1st, Clock Out if subsequent)</option>
                <option value="IN">Force Check-In</option>
                <option value="OUT">Force Check-Out</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleTestPunch}
                disabled={simSubmitting || !simEmployeeId}
                className="w-full py-2.5 bg-[#FF6B00] hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {simSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Send Fingerprint Punch</span>
              </button>
            </div>
          </div>

          {simResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
              {simResult}
            </div>
          )}
        </div>
      )}

      {/* Dahua Terminal Info & Webhook Card */}
      <div className="bg-[#131E36] rounded-[28px] p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">Dahua ASA1222G Device Push Configuration</h3>
              <p className="text-[11px] text-slate-400">Configure your local Dahua device or python sync agent with this live webhook</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Sync Endpoint:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-orange-400">
              <span className="truncate max-w-[200px] sm:max-w-xs">/api/attendance/device-sync</span>
              <button
                onClick={handleCopyEndpoint}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title="Copy full webhook URL"
              >
                {copiedEndpoint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Matching Mechanism</span>
            <p className="font-semibold text-slate-200">
              Primary: <span className="text-orange-400 font-mono">biometricUserId</span>
              <br />
              Fallback: <span className="text-slate-400 font-mono">employeeId</span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Device Protocol</span>
            <p className="font-semibold text-slate-200">
              TCP / IP Socket &bull; HTTP Push Webhook
              <br />
              <span className="text-slate-400">Port 37777 / 80 &bull; JSON payload</span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Punctuality Engine</span>
            <p className="font-semibold text-slate-200">
              Evaluates Shift Time &amp; 15m Grace
              <br />
              <span className="text-emerald-400">&bull; Auto Present / Late / Half Day</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Staff Biometric Mapping Table Card */}
      <div className="bg-[#131E36] rounded-[32px] p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        {/* Table Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="font-extrabold text-white text-base">Employee Fingerprint Mapping Table</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned Dahua machine numerical IDs for all {employees.length} team members
            </p>
          </div>

          {/* Bulk Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAutoAssign('sequential')}
              className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Automatically assign IDs 1, 2, 3... in employee order"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Assign 1, 2, 3...</span>
            </button>

            <button
              onClick={() => handleAutoAssign('code')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Use the number from Employee ID (e.g. SKY-002 -> 2)"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Match Code Numbers</span>
            </button>

            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKY code, or bio ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterMode === 'ALL' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({employees.length})
            </button>
            <button
              onClick={() => setFilterMode('LINKED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterMode === 'LINKED' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Linked ({totalLinked})
            </button>
            <button
              onClick={() => setFilterMode('UNLINKED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterMode === 'UNLINKED' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unlinked ({totalUnlinked})
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department / Mode</th>
                <th className="py-3 px-4">Biometric Machine User ID</th>
                <th className="py-3 px-4">Integration Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                    No employees matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isEditing = editingId === emp._id;
                  const isLinked = Boolean(emp.biometricUserId);

                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700/60">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{emp.name?.charAt(0) || 'E'}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{emp.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold px-1.5 py-0.2 bg-slate-900 rounded-md border border-slate-800">
                                {emp.employeeId || 'N/A'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{emp.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department / Work Mode */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-300 font-medium block">{emp.department || 'General'}</span>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded-sm text-[9px] font-black uppercase tracking-wider border ${
                              emp.workMode === 'FIELD'
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : 'bg-blue-950 text-blue-400 border-blue-800'
                            }`}
                          >
                            {emp.workMode === 'FIELD' ? '📍 Site' : '🏢 Office'}
                          </span>
                        </div>
                      </td>

                      {/* Biometric ID (Editable) */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingBioValue}
                              placeholder="e.g. 1"
                              onChange={(e) => setEditingBioValue(e.target.value)}
                              className="w-20 px-2 py-1 bg-slate-950 border border-[#FF6B00] rounded-lg text-xs font-mono font-bold text-white focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveSingle(emp._id, editingBioValue)}
                              disabled={savingId}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                isLinked
                                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                                  : 'bg-slate-900 text-slate-500 border-slate-800 italic'
                              }`}
                            >
                              {isLinked ? `Device User #${emp.biometricUserId}` : 'Not Linked'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingId(emp._id);
                                setEditingBioValue(emp.biometricUserId || '');
                              }}
                              className="text-slate-400 hover:text-orange-400 p-1 rounded-md transition-colors cursor-pointer"
                              title="Edit Biometric ID"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Integration Status Badge */}
                      <td className="py-3 px-4">
                        {isLinked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active Fingerprint
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pending ID
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSimEmployeeId(emp._id);
                              setSimulatorOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Simulate Fingerprint Punch for this employee"
                          >
                            <Zap className="w-3 h-3 text-orange-400" />
                            <span>Test Punch</span>
                          </button>

                          {isLinked && (
                            <button
                              onClick={() => handleSaveSingle(emp._id, '')}
                              className="px-2 py-1 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 text-[11px] font-bold transition-colors cursor-pointer"
                              title="Unlink fingerprint"
                            >
                              Unlink
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Biometric Punches Feed */}
      <div className="bg-[#131E36] rounded-[28px] p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <h3 className="font-extrabold text-white text-sm">Recent Biometric Device Activity</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
              {recentPunches.length} recorded
            </span>
          </div>

          <button
            onClick={fetchData}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors cursor-pointer"
          >
            Refresh Logs
          </button>
        </div>

        {recentPunches.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-semibold">
            No biometric punches recorded yet. When employees scan their thumb on the Dahua machine or use the Test Simulator, punches will appear here in real-time.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
            {recentPunches.map((punch) => {
              const u = punch.user;
              const isLate = punch.status === 'LATE';

              return (
                <div key={punch._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                      <Fingerprint className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white truncate block">{u?.name || 'Staff Member'}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {u?.employeeId} &bull; Device #{u?.biometricUserId || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-slate-300 text-xs">
                      {punch.clockIn ? new Date(punch.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        isLate
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {punch.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
