'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Database, Server, Cpu, CheckCircle2, RefreshCw, ShieldAlert, Activity, HardDrive } from 'lucide-react';

export default function DeveloperConsole() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDiagnostics();
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

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Loading Developer Diagnostics...</div>;
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
                <h3 className="text-xl font-black tracking-tight text-white">Developer Diagnostics Console</h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Root Level Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-system telemetry, MongoDB connection telemetry, and serverless runtime inspection
              </p>
            </div>
          </div>

          <button
            onClick={fetchDiagnostics}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
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
              <span className="text-[11px] text-slate-400">of {server?.memory?.heapTotalMB || 0} MB heap</span>
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
              <span>Email Service</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-400">Brevo v3 API</span>
              <span className="text-[11px] text-slate-400">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Collections Inspection */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          Live MongoDB Collections Inventory
        </h3>
        <p className="text-xs text-slate-500 mb-6">Real-time document counts stored in your Atlas cluster</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Users Collection</p>
            <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
              {db?.collections?.users || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Total registered accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendances Collection</p>
            <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
              {db?.collections?.attendances || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Total punch records & breaks</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Leave Requests Collection</p>
            <p className="text-3xl font-mono font-extrabold text-slate-900 mt-2">
              {db?.collections?.leaveRequests || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Time off applications & approvals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
