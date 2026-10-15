'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Play, Pause, Square, Timer, CheckCircle } from 'lucide-react';

interface TimeTrackerProps {
  onViewDetails?: () => void;
  todayData?: any;
  onRefresh?: () => void;
}

export default function PeoplexioTimeTracker({
  onViewDetails,
  todayData,
  onRefresh,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(2 * 3600 + 35 * 60); // Initial 02:35:00 as in image

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  // Progress arc calculation: 8 hours standard work day (28800 seconds)
  const targetSeconds = 8 * 3600;
  const progressPercent = Math.min(100, Math.round((seconds / targetSeconds) * 100));

  // Circumference for r=46 is ~289
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-[0_4px_24px_rgba(30,27,56,0.04)] border border-[#ECEAF5] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">Time tracker</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Daily productivity metric</p>
        </div>
        <button
          onClick={onViewDetails}
          className="p-1.5 text-slate-400 hover:text-[#5038ED] hover:bg-[#F0EEFD] rounded-xl transition-colors cursor-pointer"
          title="Open attendance details"
        >
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      {/* Circular Gauge Section */}
      <div className="my-2 flex flex-col items-center justify-center relative">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
            {/* Background Dotted / Dash Track */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#EBE8F6"
              strokeWidth="4"
              strokeDasharray="2 4"
              fill="transparent"
            />
            {/* Progress Purple Arc */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#6047EC"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Time In Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {formattedTime}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Work Time
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRunning
                ? 'bg-[#5038ED] text-white shadow-md shadow-[#5038ED]/30'
                : 'bg-[#FAF9FD] hover:bg-[#F0EEFD] text-slate-700 border border-[#ECEAF5]'
            }`}
            title={isRunning ? 'Pause Work Timer' : 'Start Work Timer'}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </button>

          {/* Reset / Stop Button */}
          <button
            onClick={() => {
              setIsRunning(false);
              setSeconds(0);
            }}
            className="w-9 h-9 rounded-full bg-[#FAF9FD] hover:bg-[#F0EEFD] text-slate-600 border border-[#ECEAF5] flex items-center justify-center transition-all cursor-pointer"
            title="Reset timer"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stopwatch Dark Icon Button on Right */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="w-9 h-9 rounded-full bg-[#1F1749] text-white flex items-center justify-center shadow-md hover:bg-[#2B2165] transition-all cursor-pointer"
          title="Toggle live punch tracker"
        >
          <Timer className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
