'use client';

import React, { useState, useEffect } from 'react';
import { Palmtree, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, Calendar, DollarSign, Info } from 'lucide-react';
import { format, differenceInBusinessDays, parseISO } from 'date-fns';

interface LeaveItem {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
}

interface LeaveSectionProps {
  userId?: string;
}

export default function LeaveSection({ userId }: LeaveSectionProps) {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Monthly stats from attendance / payroll
  const [monthStats, setMonthStats] = useState<{
    baseSalary: number;
    dailyRate: number;
    totalOffs: number;
    totalHalfLeaves: number;
    excessOffs: number;
    excessHalfLeaves: number;
    deductions: number;
  }>({
    baseSalary: 30000,
    dailyRate: 1000,
    totalOffs: 0,
    totalHalfLeaves: 0,
    excessOffs: 0,
    excessHalfLeaves: 0,
    deductions: 0,
  });

  // Form state
  const [leaveType, setLeaveType] = useState('FULL_OFF');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchLeaves();
    fetchMonthStats();
  }, [userId]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaves');
      const data = await res.json();
      if (data.success) {
        setLeaves(data.leaves);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthStats = async () => {
    try {
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      let url = `/api/payroll?month=${monthStr}`;
      if (userId) url += `&userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.payroll && data.payroll.length > 0) {
        const p = data.payroll[0];
        setMonthStats({
          baseSalary: p.baseSalary || 30000,
          dailyRate: p.dailyRate || Math.round((p.baseSalary || 30000) / 30),
          totalOffs: p.totalOffs || 0,
          totalHalfLeaves: p.totalHalfLeaves || 0,
          excessOffs: p.excessOffs || 0,
          excessHalfLeaves: p.excessHalfLeaves || 0,
          deductions: p.totalDeduction || 0,
        });
      }
    } catch {
      // fallback
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to cancel leave request');
      } else {
        fetchLeaves();
        fetchMonthStats();
      }
    } catch {
      alert('Network error cancelling leave request');
    }
  };

  const getEstimatedDays = () => {
    if (!startDate || !endDate) return 0;
    if (leaveType === 'HALF_LEAVE') return 0.5;
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      if (e < s) return 0;
      return Math.max(1, differenceInBusinessDays(e, s) + 1);
    } catch {
      return 0;
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!startDate || !endDate || !reason) {
      setFormError('Please fill out all fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate: leaveType === 'HALF_LEAVE' ? startDate : endDate,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to submit leave');
      } else {
        setShowModal(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaves();
        fetchMonthStats();
      }
    } catch {
      alert('Network error submitting leave');
    } finally {
      setSubmitting(false);
    }
  };

  const formatLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL_OFF':
        return 'Full Day Off';
      case 'HALF_LEAVE':
        return 'Half Day Leave';
      case 'SICK':
        return 'Sick / Medical';
      case 'CASUAL':
        return 'Casual Off';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-indigo-600" />
            Time Off & Leave Requests
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Office Policy: 1 Free Off and 1 Free Half Leave allowed per month. Additional leaves deduct salary.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Monthly allowance & per-day fine calculation bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        {/* Daily Income Rate */}
        <div className="p-2 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Per Day Income (Pay ÷ 30)</p>
          <p className="text-2xl font-black text-indigo-700 mt-0.5">
            PKR {monthStats.dailyRate.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ day</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Monthly Pay: PKR {monthStats.baseSalary.toLocaleString()}
          </p>
        </div>

        {/* Monthly Free Allowances */}
        <div className="p-2 text-center border-y sm:border-y-0 sm:border-x border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Free Leaves</p>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Offs</span>
              <span className="text-lg font-black text-slate-900">{monthStats.totalOffs} <span className="text-xs font-normal text-slate-400">/ 1 Free</span></span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-xs font-bold text-slate-700 block">Half Leaves</span>
              <span className="text-lg font-black text-slate-900">{monthStats.totalHalfLeaves} <span className="text-xs font-normal text-slate-400">/ 1 Free</span></span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthStats.excessOffs > 0 || monthStats.excessHalfLeaves > 0 ? (
              <span className="text-rose-600 font-semibold">Exceeded: {monthStats.excessOffs} full off, {monthStats.excessHalfLeaves} half</span>
            ) : (
              <span className="text-emerald-600 font-medium">Within free allowance</span>
            )}
          </p>
        </div>

        {/* Salary Fine Impact */}
        <div className="p-2 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Leave Fine (Deducted)</p>
          <p className={`text-2xl font-black mt-0.5 ${monthStats.deductions > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {monthStats.deductions > 0 ? `-PKR ${monthStats.deductions.toLocaleString()}` : 'PKR 0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthStats.deductions > 0 ? `Fined at PKR ${monthStats.dailyRate.toLocaleString()} per excess day` : 'No fine (within 1 free off / 1 half leave)'}
          </p>
        </div>
      </div>

      {/* List of Applications */}
      <div className="overflow-x-auto mt-2">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No leave requests found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50/70 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {formatLeaveTypeLabel(l.leaveType)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                    {format(new Date(l.startDate + 'T00:00:00'), 'MMM d, yyyy')}
                    {l.startDate !== l.endDate && (
                      <> &rarr; {format(new Date(l.endDate + 'T00:00:00'), 'MMM d, yyyy')}</>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                    {l.daysCount} {l.daysCount === 1 ? 'day' : l.daysCount === 0.5 ? 'half day' : 'days'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate" title={l.reason}>
                    {l.reason}
                    {l.reviewNote && (
                      <span className="block text-[11px] text-indigo-600 font-medium">Note: {l.reviewNote}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(l.status)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    {l.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelLeave(l._id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Cancel this leave request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Apply for Time Off</h3>
            <p className="text-xs text-slate-500 mb-4">Submit a leave request for admin review</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FULL_OFF">Full Day Off (1 free per month)</option>
                  <option value="HALF_LEAVE">Half Day Leave (1 free per month)</option>
                  <option value="CASUAL">Casual / Personal Emergency</option>
                  <option value="SICK">Medical / Sick Off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {leaveType === 'HALF_LEAVE' ? 'Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (leaveType === 'HALF_LEAVE') setEndDate(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {leaveType !== 'HALF_LEAVE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {startDate && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600">
                    Duration: <strong className="text-slate-900">{getEstimatedDays()} {leaveType === 'HALF_LEAVE' ? 'half day' : 'day(s)'}</strong>
                  </span>
                  <span className="text-slate-500">
                    Policy: 1 free off & 1 free half leave / mo
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide reason for time off..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
