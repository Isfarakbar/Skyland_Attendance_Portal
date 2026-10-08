'use client';

import React, { useState, useEffect } from 'react';
import { Palmtree, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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
  leaveBalance?: { sick: number; casual: number; annual: number };
}

export default function LeaveSection({ leaveBalance }: LeaveSectionProps) {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

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

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      alert('Please fill out all fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveType, startDate, endDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit leave request');
      } else {
        setShowModal(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaves();
      }
    } catch {
      alert('Network error submitting leave');
    } finally {
      setSubmitting(false);
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
          <p className="text-xs text-slate-500 mt-0.5">Manage leave applications and track approval statuses</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Leave balance quick bar */}
      {leaveBalance && (
        <div className="grid grid-cols-3 gap-3 my-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sick Leave</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{leaveBalance.sick} <span className="text-xs font-normal text-slate-500">days left</span></p>
          </div>
          <div className="border-x border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Casual Leave</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{leaveBalance.casual} <span className="text-xs font-normal text-slate-500">days left</span></p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual Leave</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{leaveBalance.annual} <span className="text-xs font-normal text-slate-500">days left</span></p>
          </div>
        </div>
      )}

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
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {l.leaveType}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                    {format(new Date(l.startDate + 'T00:00:00'), 'MMM d, yyyy')} &rarr;{' '}
                    {format(new Date(l.endDate + 'T00:00:00'), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                    {l.daysCount} {l.daysCount === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate" title={l.reason}>
                    {l.reason}
                    {l.reviewNote && (
                      <span className="block text-[11px] text-indigo-600 font-medium">Note: {l.reviewNote}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(l.status)}</td>
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
            <p className="text-xs text-slate-500 mb-4">Submit a leave request for HR review</p>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Doctor's appointment or personal travel"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs"
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
