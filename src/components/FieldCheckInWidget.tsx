'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Clock, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface FieldCheckInWidgetProps {
  todayData: {
    state: string;
    attendance: any;
    todayDate: string;
  } | null;
  onRefresh: () => void;
}

export default function FieldCheckInWidget({ todayData, onRefresh }: FieldCheckInWidgetProps) {
  const attendance = todayData?.attendance;
  const isCheckedIn = !!attendance?.clockIn;
  const isCheckedOut = !!attendance?.clockOut;

  const [siteName, setSiteName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCaptureGpsAndCheckIn = () => {
    setGpsError(null);
    setSuccessMsg(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsLoading(false);
        setLoading(true);

        try {
          const res = await fetch('/api/attendance/field-checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy,
              siteName: siteName.trim() || 'Solar Field Site',
              notes: notes.trim(),
              action: 'check-in',
            }),
          });

          const data = await res.json();
          if (data.success) {
            setSuccessMsg(`Checked in successfully at ${siteName || 'Solar Field Site'}!`);
            onRefresh();
          } else {
            setGpsError(data.error || 'Failed to check in');
          }
        } catch {
          setGpsError('Network error checking in');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location permission was denied. Please allow location access in your browser settings to check in.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location information is unavailable. Please check your device GPS.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS location request timed out. Please try again.');
            break;
          default:
            setGpsError('An unknown error occurred while retrieving GPS location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckOut = async () => {
    if (!confirm('Are you sure you want to check out from your site for today?')) return;
    setLoading(true);
    setGpsError(null);

    try {
      const res = await fetch('/api/attendance/field-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: attendance?.location?.latitude || 0,
          longitude: attendance?.location?.longitude || 0,
          siteName: attendance?.location?.siteName || '',
          action: 'check-out',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Checked out from site successfully!');
        onRefresh();
      } else {
        setGpsError(data.error || 'Failed to check out');
      }
    } catch {
      setGpsError('Network error checking out');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'hh:mm a');
    } catch {
      return null;
    }
  };

  const clockInFormatted = formatTime(attendance?.clockIn);
  const clockOutFormatted = formatTime(attendance?.clockOut);
  const location = attendance?.location;
  const mapsUrl = location?.latitude && location?.longitude
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              On-Site Solar Field Staff
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {todayData?.todayDate || 'Today'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isCheckedOut
              ? 'Site Duty Shift Completed'
              : isCheckedIn
              ? 'Currently Active On-Site'
              : 'Field Site GPS Check-In'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            As on-site field staff, capture your live GPS coordinates and site name so management can track your location and attendance.
          </p>
        </div>

        {/* Policy Badge */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl max-w-xs text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Attendance Policy</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            1 free Off & 1 free Half Leave / month. Excess leaves deducted at your per-day income rate (Pay ÷ 30).
          </p>
        </div>
      </div>

      {/* Main Body */}
      <div className="pt-6">
        {isCheckedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {attendance?.status === 'LATE' ? 'Present (Late Arrival)' : 'Present on Site'}
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {location?.siteName || 'Solar Field Site'}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                    <span>Clock In: <strong className="text-slate-800">{clockInFormatted}</strong></span>
                    {clockOutFormatted && (
                      <span>Clock Out: <strong className="text-slate-800">{clockOutFormatted}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  View Exact GPS on Maps
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

            {location?.latitude && (
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 flex flex-wrap items-center gap-3 font-mono">
                <span>GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                {location.accuracy && <span>• Accuracy: ±{Math.round(location.accuracy)}m</span>}
              </div>
            )}

            {!isCheckedOut && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Check Out from Site
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-xl">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Solar Project / Site Name &amp; City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Multan 50MW Solar Plant, Site B"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Work Activity / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inverter installation, Site survey"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCaptureGpsAndCheckIn}
              disabled={loading || gpsLoading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {gpsLoading || loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Acquiring GPS &amp; Checking In...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Capture GPS &amp; Check In Now</span>
                </>
              )}
            </button>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
