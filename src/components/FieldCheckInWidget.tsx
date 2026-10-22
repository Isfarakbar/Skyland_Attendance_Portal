'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, ExternalLink, LogOut, Building, Home } from 'lucide-react';
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
  const [workLocationType, setWorkLocationType] = useState<'OFFICE' | 'WFH'>('OFFICE');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Two-stage fast GPS acquisition:
  // 1. Attempts high-accuracy GPS lock (up to 7s, accepts 30s fresh fix)
  // 2. If indoor roof blocks satellite signal, automatically falls back to fast network/Wi-Fi GPS
  const acquireLiveGps = (
    onSuccess: (coords: GeolocationCoordinates) => void,
    onError: (msg: string) => void
  ) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError('Geolocation is not supported by your browser or device. Please enable GPS location.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => onSuccess(pos.coords),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          onError('Location is required! Please turn ON your device Location and allow browser GPS permission to mark attendance.');
          return;
        }
        // Fallback for indoor buildings where satellite GPS times out
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => onSuccess(fallbackPos.coords),
          (fallbackErr) => {
            switch (fallbackErr.code) {
              case fallbackErr.PERMISSION_DENIED:
                onError('Location is required! Please turn ON your device Location and allow GPS permission.');
                break;
              case fallbackErr.POSITION_UNAVAILABLE:
                onError('Location information is unavailable. Please turn ON your device GPS.');
                break;
              case fallbackErr.TIMEOUT:
                onError('GPS location request timed out. Please ensure Location is ON and try again.');
                break;
              default:
                onError('Unable to retrieve GPS location. Location must be ON to mark attendance.');
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

  const handleCaptureGpsAndCheckIn = () => {
    setGpsError(null);
    setSuccessMsg(null);
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
              siteName: siteName.trim() || (workLocationType === 'WFH' ? 'Work From Home (Remote GPS)' : 'GPS Verified Check-In'),
              workMode: workLocationType,
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
      (errMsg) => {
        setGpsLoading(false);
        setGpsError(errMsg);
      }
    );
  };

  const handleCheckOut = async () => {
    if (!confirm('Are you sure you want to check out and complete your shift for today?')) return;
    setGpsError(null);
    setSuccessMsg(null);
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
      (errMsg) => {
        setGpsLoading(false);
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {attendance?.status === 'LATE' ? 'Present (Late Arrival)' : 'Present — GPS Verified'}
                    </span>
                    {(attendance?.workMode === 'WFH' || attendance?.isWorkFromHome) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950/90 text-indigo-300 border border-indigo-700/80">
                        🏡 Work From Home
                      </span>
                    )}
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

              <div className="flex flex-wrap items-center gap-2">
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-[#FF6B00] text-xs font-bold rounded-xl border border-slate-800 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Check-In GPS Pin
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
                {checkOutMapsUrl && (
                  <a
                    href={checkOutMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 text-xs font-bold rounded-xl border border-slate-800 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Check-Out GPS Pin
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>

            {location?.latitude && (
              <div className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                <span>Check-In GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
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
            {/* Work Mode Toggle: Office vs WFH */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
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

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {workLocationType === 'WFH' ? 'Home / Remote Notes (Optional)' : 'Location Label (Optional)'}
              </label>
              <input
                type="text"
                placeholder={workLocationType === 'WFH' ? 'e.g. Home Office / Remote Desk' : 'e.g. Head Office / Multan Site'}
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
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
