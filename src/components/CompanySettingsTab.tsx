'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Clock, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CompanySettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [companyName, setCompanyName] = useState('Skyland Corporation');
  const [officeStartTime, setOfficeStartTime] = useState('09:00');
  const [officeEndTime, setOfficeEndTime] = useState('18:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [halfDayThresholdHours, setHalfDayThresholdHours] = useState(4);
  const [fullDayThresholdHours, setFullDayThresholdHours] = useState(8);
  const [timezone, setTimezone] = useState('Asia/Karachi');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setCompanyName(data.settings.companyName || 'Skyland Corporation');
        setOfficeStartTime(data.settings.officeStartTime || '09:00');
        setOfficeEndTime(data.settings.officeEndTime || '18:00');
        setGracePeriodMinutes(data.settings.gracePeriodMinutes || 15);
        setHalfDayThresholdHours(data.settings.halfDayThresholdHours || 4);
        setFullDayThresholdHours(data.settings.fullDayThresholdHours || 8);
        setTimezone(data.settings.timezone || 'Asia/Karachi');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          officeStartTime,
          officeEndTime,
          gracePeriodMinutes,
          halfDayThresholdHours,
          fullDayThresholdHours,
          timezone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Company policy rules updated successfully!');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        alert(data.error || 'Failed to update settings');
      }
    } catch {
      alert('Error updating company policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Loading company settings...</div>;
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Shift & Attendance Rules</h3>
            <p className="text-xs text-slate-500">Configure standard working hours, punctuality thresholds, and company identity</p>
          </div>
        </div>

        {success && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Office Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT - UTC+05:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (AST - UTC+03:00)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="Asia/Dhaka">Asia/Dhaka (BST - UTC+06:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Daily dates and punctuality are calculated in this timezone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Office Start Time</label>
              <input
                type="time"
                required
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Clock in threshold for punctuality</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Office End Time</label>
              <input
                type="time"
                required
                value={officeEndTime}
                onChange={(e) => setOfficeEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Official daily shift conclusion</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                min={0}
                max={60}
                required
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Arrival after this is marked Late</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Half Day Minimum (Hours)</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={halfDayThresholdHours}
                onChange={(e) => setHalfDayThresholdHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Threshold for Half Day status</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Day Standard (Hours)</label>
              <input
                type="number"
                min={4}
                max={16}
                required
                value={fullDayThresholdHours}
                onChange={(e) => setFullDayThresholdHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Expected work duration</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Company Rules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
