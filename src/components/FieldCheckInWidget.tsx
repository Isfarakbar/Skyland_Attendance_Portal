'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, LogOut, Compass } from 'lucide-react';
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
      setGpsError('Geolocation is not supported by your browser or mobile device.');
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
            setGpsError('Location permission denied. Please enable GPS / location permissions in your browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location information unavailable. Check device GPS.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS location request timed out. Please try again.');
            break;
          default:
            setGpsError('An unknown error occurred while retrieving GPS coordinates.');
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
    <div className="glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
              <Compass className="w-3.5 h-3.5 text-orange-400" />
              On-Site Solar Field Staff
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {todayData?.todayDate || 'Today'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isCheckedOut
              ? 'Site Duty Shift Completed'
              : isCheckedIn
              ? 'Currently Active On-Site'
              : 'Field Site GPS Check-In'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            As on-site field staff, capture your live GPS coordinates so management can verify your location and attendance pin.
          </p>
        </div>

        {/* Policy Badge */}
        <div className="p-4 glass-card rounded-2xl max-w-xs text-xs space-y-1.5 border border-white/10">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Attendance Policy</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            1 free Off &amp; 1 free Half Leave / month. Excess leaves deducted based on per-day rate.
          </p>
        </div>
      </div>

      {/* Main Body */}
      <div className="pt-6">
        {isCheckedIn ? (
          <div className="space-y-4">
            <div className="p-4 glass-panel-orange rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    {attendance?.status === 'LATE' ? 'Present (Late Arrival)' : 'Present on Site'}
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {location?.siteName || 'Solar Field Site'}
                  </div>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1">
                    <span>Clock In: <strong className="text-orange-400 font-mono">{clockInFormatted}</strong></span>
                    {clockOutFormatted && (
                      <span>Clock Out: <strong className="text-orange-400 font-mono">{clockOutFormatted}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 glass-card hover:border-orange-500/40 text-orange-300 text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5 text-orange-400" />
                  View GPS Pin on Maps
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

            {location?.latitude && (
              <div className="px-4 py-2.5 glass-card rounded-2xl text-[11px] text-slate-300 flex flex-wrap items-center gap-3 font-mono">
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
                  className="px-5 py-2.5 bg-rose-600/80 hover:bg-rose-600 border border-rose-500/40 text-white text-xs font-bold rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Solar Project / Site Name &amp; City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Multan 50MW Solar Plant, Site B"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Work Activity / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inverter installation, Site survey"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>
            </div>

            {/* Glowing Orange Big App-like Button */}
            <button
              type="button"
              onClick={handleCaptureGpsAndCheckIn}
              disabled={loading || gpsLoading}
              className="w-full py-3.5 px-6 btn-orange-glow text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {gpsLoading || loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Acquiring GPS &amp; Checking In...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-white" />
                  <span>Capture GPS &amp; Mark Site Attendance</span>
                </>
              )}
            </button>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{gpsError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
