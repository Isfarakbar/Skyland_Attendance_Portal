'use client';

import React, { useState, useEffect } from 'react';
import { Palmtree, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LeaveApplication {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
    leaveBalance?: { sick: number; casual: number; annual: number };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
}

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<{
    leave: LeaveApplication;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

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

  const handleOpenReview = (leave: LeaveApplication, action: 'APPROVED' | 'REJECTED') => {
    setReviewModal({ leave, action });
    setReviewNote(action === 'APPROVED' ? 'Approved by Management' : '');
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/leaves/${reviewModal.leave._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reviewModal.action, reviewNote: reviewNote.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewModal(null);
        fetchLeaves();
      } else {
        alert(data.error || 'Failed to update leave');
      }
    } catch {
      alert('Error updating leave');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
  const pastLeaves = leaves.filter((l) => l.status !== 'PENDING');

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-indigo-600" />
            Leave Requests & Approvals Queue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Review and authorize employee time off</p>
        </div>

        {pendingLeaves.length > 0 && (
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
            {pendingLeaves.length} Action Needed
          </span>
        )}
      </div>

      {/* Pending Section */}
      <div className="mt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Pending Decisions</h4>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading applications...</div>
        ) : pendingLeaves.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-sm">
            All caught up! No pending leave requests at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map((l) => (
              <div
                key={l._id}
                className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{l.user?.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({l.user?.employeeId})</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                      {l.leaveType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-800">
                      {format(new Date(l.startDate + 'T00:00:00'), 'MMM d, yyyy')} &rarr;{' '}
                      {format(new Date(l.endDate + 'T00:00:00'), 'MMM d, yyyy')}
                    </span>{' '}
                    ({l.daysCount} {l.daysCount === 1 ? 'day' : 'days'})
                  </p>

                  <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{l.reason}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleOpenReview(l, 'REJECTED')}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleOpenReview(l, 'APPROVED')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-200 transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Decisions Table */}
      {pastLeaves.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Past Decisions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Decision Note</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pastLeaves.slice(0, 5).map((l) => (
                  <tr key={l._id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{l.user?.name}</td>
                    <td className="py-2.5 px-3">{l.leaveType}</td>
                    <td className="py-2.5 px-3">
                      {format(new Date(l.startDate + 'T00:00:00'), 'MMM d')} - {format(new Date(l.endDate + 'T00:00:00'), 'MMM d')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{l.reviewNote || '--'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenReview(l, l.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                      >
                        {l.status === 'APPROVED' ? 'Reverse & Reject' : 'Reverse & Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              {reviewModal.action === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Decision for <span className="font-semibold text-slate-900">{reviewModal.leave.user?.name}</span> ({reviewModal.leave.leaveType}, {reviewModal.leave.daysCount} days)
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <p><strong>Dates:</strong> {reviewModal.leave.startDate} &rarr; {reviewModal.leave.endDate}</p>
                <p><strong>Reason:</strong> {reviewModal.leave.reason}</p>
                {reviewModal.action === 'APPROVED' && (
                  <p className="text-emerald-700 font-medium pt-1">
                    ✓ Approving will automatically deduct {reviewModal.leave.daysCount} day(s) from employee balance.
                  </p>
                )}
                {reviewModal.action === 'REJECTED' && reviewModal.leave.status === 'APPROVED' && (
                  <p className="text-amber-700 font-medium pt-1">
                    ↺ Rejecting this previously approved leave will automatically refund {reviewModal.leave.daysCount} day(s) back to employee.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {reviewModal.action === 'APPROVED' ? 'Approval Note (Optional)' : 'Rejection Reason'}
                </label>
                <textarea
                  rows={3}
                  required={reviewModal.action === 'REJECTED'}
                  placeholder={reviewModal.action === 'APPROVED' ? 'e.g. Approved. Have a good break!' : 'e.g. Critical workload during these dates.'}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer ${
                    reviewModal.action === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? 'Saving...' : reviewModal.action === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
