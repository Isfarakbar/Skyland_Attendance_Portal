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
      setGpsError('Geolocation is not supported by your browser or device. Please enable GPS location.');
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
              siteName: siteName.trim() || 'GPS Verified Check-In',
              notes: notes.trim(),
              action: 'check-in',
            }),
          });

          const data = await res.json();
          if (data.success) {
            setSuccessMsg('Attendance marked! Checked in with live GPS location.');
            onRefresh();
          } else {
            setGpsError(data.error || 'Failed to mark attendance');
          }
        } catch {
          setGpsError('Network error while marking attendance');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location is required! Please turn ON your device location and allow browser GPS permission to mark attendance.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location information is unavailable. Please turn ON your device GPS.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS location request timed out. Please ensure Location is ON and try again.');
            break;
          default:
            setGpsError('Unable to retrieve GPS location. Location must be ON to mark attendance.');
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
    if (!confirm('Are you sure you want to check out and complete your shift for today?')) return;
    setGpsError(null);
    setSuccessMsg(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device. Location must be ON to check out.');
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
              siteName: attendance?.location?.siteName || siteName.trim() || 'GPS Verified Location',
              action: 'check-out',
            }),
          });

          const data = await res.json();
          if (data.success) {
            setSuccessMsg('Checked out successfully with live GPS verification!');
            onRefresh();
          } else {
            setGpsError(data.error || 'Failed to check out');
          }
        } catch {
          setGpsError('Network error checking out');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location is required to check out! Please turn ON your device GPS and allow location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location information is unavailable. Please turn ON your device GPS to check out.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS location request timed out. Please ensure Location is ON and try again.');
            break;
          default:
            setGpsError('Unable to retrieve GPS location for check-out.');
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
    <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Live GPS Self-Attendance
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {todayData?.todayDate || 'Today'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isCheckedOut
              ? 'Daily Shift Completed'
              : isCheckedIn
              ? 'Currently Checked In'
              : 'Mark Your Daily Attendance'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Your device location (GPS) must be turned ON. Press the button below to mark your attendance with live coordinates.
          </p>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
              isCheckedOut
                ? 'bg-blue-950 text-blue-300 border-blue-800'
                : isCheckedIn
                ? attendance?.status === 'LATE'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isCheckedOut
              ? 'Shift Complete'
              : isCheckedIn
              ? attendance?.status === 'LATE'
                ? 'Late Arrival'
                : 'Checked In'
              : 'Pending Check-In'}
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="pt-6">
        {isCheckedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {attendance?.status === 'LATE' ? 'Present (Late Arrival)' : 'Present — GPS Verified'}
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {location?.siteName || 'GPS Verified Location'}
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                    <span>Clock In: <strong className="text-white">{clockInFormatted}</strong></span>
                    {clockOutFormatted && (
                      <span>Clock Out: <strong className="text-white">{clockOutFormatted}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-[#FF6B00] text-xs font-bold rounded-xl border border-slate-800 shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  View Exact GPS on Maps
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

            {location?.latitude && (
              <div className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                <span>GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                {location.accuracy && <span>• Accuracy: ±{Math.round(location.accuracy)}m</span>}
              </div>
            )}

            {!isCheckedOut && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={loading || gpsLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {gpsLoading || loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying GPS &amp; Checking Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out Now (GPS Required)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Location Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Head Office / Multan Site"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Work Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular shift / Project work"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCaptureGpsAndCheckIn}
              disabled={loading || gpsLoading}
              className="w-full sm:w-auto px-7 py-3.5 bg-linear-to-r from-[#FF6B00] to-amber-600 hover:opacity-90 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-950/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {gpsLoading || loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying GPS &amp; Marking Attendance...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Mark Attendance Now (Check In)</span>
                </>
              )}
            </button>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3 bg-red-950/50 text-red-300 border border-red-800/80 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{gpsError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-950/50 text-emerald-300 border border-emerald-800/80 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
