'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Building,
  Briefcase,
  Mail,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface EmployeeProfileModalProps {
  employeeId: string; // User._id
  onClose: () => void;
}

export default function EmployeeProfileModal({ employeeId, onClose }: EmployeeProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'attendance'>('tasks');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, [employeeId]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/overview`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to permanently delete this daily task report?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (resData.success) {
        fetchOverview();
      } else {
        alert(resData.error || 'Failed to delete task');
      }
    } catch {
      alert('Error deleting task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this attendance record?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/attendance/adjust?id=${attendanceId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (resData.success) {
        fetchOverview();
      } else {
        alert(resData.error || 'Failed to delete attendance record');
      }
    } catch {
      alert('Error deleting attendance record');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadSlip = () => {
    if (!data?.monthlySummary?.month) return;
    window.location.href = `/api/export/salary?month=${data.monthlySummary.month}&userId=${employeeId}`;
  };

  const getTaskStatusBadge = (st: string) => {
    switch (st) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Blocked
          </span>
        );
      default:
        return null;
    }
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">Present</span>;
      case 'LATE':
        return <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-800">Late</span>;
      case 'HALF_LEAVE':
      case 'HALF_DAY':
        return <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-orange-100 text-orange-800">Half Leave</span>;
      case 'OFF':
      case 'ABSENT':
        return <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-800">Off Day</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          {loading ? (
            <div className="py-2 text-xs text-slate-400">Loading employee dossier...</div>
          ) : data ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-100">
                {data.employee.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {data.employee.name}
                  </h3>
                  <span className="font-mono text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {data.employee.employeeId}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      data.employee.workMode === 'FIELD'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {data.employee.workMode === 'FIELD' ? '📍 Field Staff (GPS)' : '🏢 Office Staff'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{data.employee.designation}</span>
                  <span>•</span>
                  <span>{data.employee.department}</span>
                  <span>•</span>
                  <span>{data.employee.email}</span>
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              Fetching complete work progress, GPS check-ins, and attendance history...
            </div>
          ) : data ? (
            <>
              {/* Monthly Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Salary</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    PKR {data.monthlySummary.baseSalary.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 font-semibold">
                    PKR {data.monthlySummary.dailyRate.toLocaleString()} / day
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Present (Month)</span>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    {data.monthlySummary.presentDays} days
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {data.monthlySummary.lateDays} late entries
                  </span>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Offs &amp; Half Leaves</span>
                  <div className="text-lg font-black text-rose-700 mt-0.5">
                    {data.monthlySummary.totalOffs} Off • {data.monthlySummary.totalHalfLeaves} Half
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold">
                    {data.monthlySummary.totalDeduction > 0
                      ? `Fine: -PKR ${data.monthlySummary.totalDeduction.toLocaleString()}`
                      : 'Within free allowance'}
                  </span>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Net Payable</span>
                    <div className="text-lg font-black text-indigo-900 mt-0.5">
                      PKR {data.monthlySummary.netSalary.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadSlip}
                    className="mt-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Download Payslip (.xlsx)
                  </button>
                </div>
              </div>

              {/* Today's Live Attendance & Site GPS Pin */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Live Attendance:</span>
                    {data.todayAttendance ? (
                      getAttendanceBadge(data.todayAttendance.status)
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Not marked yet for today</span>
                    )}
                  </div>

                  {data.todayAttendance && (
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 mt-1.5 font-mono">
                      {data.todayAttendance.clockIn && (
                        <span>In: <strong>{format(new Date(data.todayAttendance.clockIn), 'hh:mm a')}</strong></span>
                      )}
                      {data.todayAttendance.clockOut && (
                        <span>Out: <strong>{format(new Date(data.todayAttendance.clockOut), 'hh:mm a')}</strong></span>
                      )}
                      {data.todayAttendance.location?.siteName && (
                        <span className="text-indigo-800 font-sans font-bold">
                          Site: {data.todayAttendance.location.siteName}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {data.todayAttendance?.location?.latitude && data.todayAttendance?.location?.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${data.todayAttendance.location.latitude},${data.todayAttendance.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Live GPS on Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>

              {/* Tab Selector: Daily Tasks vs Attendance History */}
              <div className="border-b border-slate-200">
                <div className="flex space-x-6 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'tasks'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Daily Work Progress &amp; Tasks ({data.tasks?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'attendance'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Attendance Log ({data.recentAttendance?.length || 0})</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Daily Tasks Submissions */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {!data.tasks || data.tasks.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No daily task reports submitted by this employee yet.
                    </div>
                  ) : (
                    data.tasks.map((task: any) => (
                      <div
                        key={task._id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              {task.date}
                            </span>
                            <h5 className="font-extrabold text-slate-900 text-sm">{task.title}</h5>
                          </div>

                          <div className="flex items-center gap-2">
                            {getTaskStatusBadge(task.status)}
                            {task.hoursSpent ? (
                              <span className="text-xs text-slate-400 font-mono">
                                {task.hoursSpent} hrs
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task._id)}
                              disabled={actionLoading}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                              title="Delete task report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {task.description}
                        </div>

                        {task.blockers && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Blocker / Dependency:</strong> {task.blockers}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Recent Attendance Log */}
              {activeTab === 'attendance' && (
                <div className="overflow-x-auto">
                  {!data.recentAttendance || data.recentAttendance.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No attendance records found.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-2.5">Date</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5">Time In</th>
                          <th className="pb-2.5">Time Out</th>
                          <th className="pb-2.5">Notes / Site</th>
                          <th className="pb-2.5">GPS Map</th>
                          <th className="pb-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recentAttendance.map((rec: any) => (
                          <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 font-mono font-bold text-slate-700">{rec.date}</td>
                            <td className="py-2.5">{getAttendanceBadge(rec.status)}</td>
                            <td className="py-2.5 font-mono text-slate-600">
                              {rec.clockIn ? format(new Date(rec.clockIn), 'hh:mm a') : '—'}
                            </td>
                            <td className="py-2.5 font-mono text-slate-600">
                              {rec.clockOut ? format(new Date(rec.clockOut), 'hh:mm a') : '—'}
                            </td>
                            <td className="py-2.5 text-slate-600 max-w-xs truncate" title={rec.notes}>
                              {rec.notes || rec.location?.siteName || '—'}
                            </td>
                            <td className="py-2.5">
                              {rec.location?.latitude && rec.location?.longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${rec.location.latitude},${rec.location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline font-bold text-[11px]"
                                >
                                  View Map
                                </a>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteAttendance(rec._id)}
                                disabled={actionLoading}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Delete attendance record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-400">
            Skyland Workforce Management System
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
