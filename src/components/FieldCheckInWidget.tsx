'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, ExternalLink, LogOut, Building, Home, Clock } from 'lucide-react';
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

  const [workLocationType, setWorkLocationType] = useState<'OFFICE' | 'WFH'>('OFFICE');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<'check-in' | 'check-out' | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-refresh when tab/app regains focus or when date changes (daily reset)
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        onRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);

    // Check every minute if midnight crossed in Pakistan timezone to auto-reset
    const interval = setInterval(() => {
      try {
        const nowStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        if (todayData?.todayDate && todayData.todayDate !== nowStr) {
          onRefresh();
        }
      } catch {
        // ignore
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
      clearInterval(interval);
    };
  }, [onRefresh, todayData?.todayDate]);

  // Two-stage fast GPS acquisition:
  // 1. Attempts high-accuracy satellite GPS lock
  // 2. Falls back smoothly if indoor roof blocks satellites
  const acquireLiveGps = (
    onSuccess: (coords: GeolocationCoordinates) => void,
    onError: (msg: string) => void
  ) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError('Geolocation is not supported by your browser or device. Please enable device GPS location.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => onSuccess(pos.coords),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          onError('Location permission denied! Please turn ON your device Location and allow browser GPS permission.');
          return;
        }
        // Fallback for indoor environments
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => onSuccess(fallbackPos.coords),
          (fallbackErr) => {
            switch (fallbackErr.code) {
              case fallbackErr.PERMISSION_DENIED:
                onError('Location permission denied! Please turn ON device GPS and allow location permission.');
                break;
              case fallbackErr.POSITION_UNAVAILABLE:
                onError('GPS location unavailable. Please verify Location services are turned ON.');
                break;
              case fallbackErr.TIMEOUT:
                onError('GPS request timed out. Please ensure Location is ON and tap again.');
                break;
              default:
                onError('Unable to retrieve GPS coordinates. Location must be ON to mark attendance.');
                break;
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 30000,
      }
    );
  };

  const handleCheckIn = () => {
    if (isCheckedIn) return;
    setGpsError(null);
    setSuccessMsg(null);
    setActiveAction('check-in');
    setGpsLoading(true);

    acquireLiveGps(
      async (coords) => {
        const { latitude, longitude, accuracy } = coords;
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
              siteName: workLocationType === 'WFH' ? 'Work From Home (Remote GPS)' : 'Office GPS Attendance',
              workMode: workLocationType,
              action: 'check-in',
            }),
          });

          const data = await res.json();
          if (data.success) {
            setSuccessMsg('Attendance marked! You are now checked in.');
            onRefresh();
          } else {
            setGpsError(data.error || 'Failed to mark attendance');
          }
        } catch {
          setGpsError('Network error while marking attendance. Please try again.');
        } finally {
          setLoading(false);
          setActiveAction(null);
        }
      },
      (errMsg) => {
        setGpsLoading(false);
        setActiveAction(null);
        setGpsError(errMsg);
      }
    );
  };

  const handleCheckOut = () => {
    if (!isCheckedIn || isCheckedOut) return;
    if (!confirm('Are you sure you want to check out and complete your shift for today?')) return;
    
    setGpsError(null);
    setSuccessMsg(null);
    setActiveAction('check-out');
    setGpsLoading(true);

    acquireLiveGps(
      async (coords) => {
        const { latitude, longitude, accuracy } = coords;
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
              siteName: attendance?.location?.siteName || 'Office GPS Check-Out',
              action: 'check-out',
            }),
          });

          const data = await res.json();
          if (data.success) {
            setSuccessMsg('Shift complete! You have checked out successfully.');
            onRefresh();
          } else {
            setGpsError(data.error || 'Failed to check out');
          }
        } catch {
          setGpsError('Network error checking out. Please try again.');
        } finally {
          setLoading(false);
          setActiveAction(null);
        }
      },
      (errMsg) => {
        setGpsLoading(false);
        setActiveAction(null);
        setGpsError(errMsg);
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
  const checkOutLocation = attendance?.checkOutLocation;
  const mapsUrl = location?.latitude && location?.longitude
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : null;
  const checkOutMapsUrl = checkOutLocation?.latitude && checkOutLocation?.longitude
    ? `https://www.google.com/maps?q=${checkOutLocation.latitude},${checkOutLocation.longitude}`
    : null;

  return (
    <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
      {/* Header with Title & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Live GPS Attendance
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {todayData?.todayDate || 'Today'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {isCheckedOut
              ? 'Shift Completed Today'
              : isCheckedIn
              ? 'Currently On Duty'
              : 'Daily Attendance'}
          </h2>
        </div>

        {/* Status Pill */}
        <div className="self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
              isCheckedOut
                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                : isCheckedIn
                ? attendance?.status === 'LATE'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isCheckedOut
              ? '✓ Shift Complete'
              : isCheckedIn
              ? attendance?.status === 'LATE'
                ? 'Late Arrival'
                : 'Checked In'
              : 'Pending Check-In'}
          </span>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        {/* Work Mode Toggle (Office vs WFH) - Only visible when not checked in yet */}
        {!isCheckedIn ? (
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Work Mode For Today
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setWorkLocationType('OFFICE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  workLocationType === 'OFFICE'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>🏢 Office / On-Site</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkLocationType('WFH')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  workLocationType === 'WFH'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>🏡 Work From Home</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Work Mode:</span>
            <span className="font-bold text-white px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
              {attendance?.workMode === 'WFH' || attendance?.isWorkFromHome
                ? '🏡 Work From Home'
                : '🏢 Office / On-Site'}
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TWO APP BUTTONS: CHECK IN & CHECK OUT (WITH FREEZE & DIM AS SPECIFIED) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* BUTTON 1: CHECK IN */}
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isCheckedIn || loading || gpsLoading}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all select-none ${
              isCheckedIn
                ? 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-400/80 cursor-not-allowed opacity-75'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/30 cursor-pointer'
            }`}
          >
            {activeAction === 'check-in' && (gpsLoading || loading) ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Verifying GPS &amp; Checking In...</span>
              </>
            ) : isCheckedIn ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Checked In {clockInFormatted ? `(${clockInFormatted})` : ''}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Check In</span>
              </>
            )}
          </button>

          {/* BUTTON 2: CHECK OUT */}
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={!isCheckedIn || isCheckedOut || loading || gpsLoading}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all select-none ${
              !isCheckedIn
                ? 'bg-slate-900/60 border border-slate-800/80 text-slate-500 cursor-not-allowed opacity-50'
                : isCheckedOut
                ? 'bg-slate-900/80 border border-slate-800/80 text-slate-400/70 cursor-not-allowed opacity-75'
                : 'bg-rose-600 hover:bg-rose-500 active:scale-98 text-white shadow-lg shadow-rose-950/40 border border-rose-500/30 cursor-pointer'
            }`}
          >
            {activeAction === 'check-out' && (gpsLoading || loading) ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Verifying GPS &amp; Checking Out...</span>
              </>
            ) : isCheckedOut ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Checked Out {clockOutFormatted ? `(${clockOutFormatted})` : ''}</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Check Out</span>
              </>
            )}
          </button>
        </div>

        {/* GPS Coordinates & Google Map Links if checked in */}
        {isCheckedIn && (
          <div className="pt-2 space-y-2">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300">
                  Clock In: <strong className="text-white">{clockInFormatted || '--:--'}</strong>
                  {clockOutFormatted && (
                    <> • Clock Out: <strong className="text-white">{clockOutFormatted}</strong></>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[#FF6B00] text-[11px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>In Pin</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                )}
                {checkOutMapsUrl && (
                  <a
                    href={checkOutMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 text-[11px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Out Pin</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="p-3 bg-red-950/50 text-red-300 border border-red-800/80 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/50 text-emerald-300 border border-emerald-800/80 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
