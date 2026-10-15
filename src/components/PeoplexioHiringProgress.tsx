'use client';

import React, { useState } from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

interface HiringProgressProps {
  onViewDetails?: () => void;
  isAdmin?: boolean;
}

export default function PeoplexioHiringProgress({ onViewDetails, isAdmin = true }: HiringProgressProps) {
  const [activeDay, setActiveDay] = useState<number>(5); // Friday / active

  const daysData = [
    { day: 'S', value: 8, label: 'Sunday: 8' },
    { day: 'M', value: 16, label: 'Monday: 16' },
    { day: 'T', value: 12, label: 'Tuesday: 12' },
    { day: 'W', value: 19, label: 'Wednesday: 19' },
    { day: 'T', value: 21, label: 'Thursday: 21' },
    { day: 'F', value: 24, label: 'Friday: 24 (Peak)' },
    { day: 'S', value: 6, label: 'Saturday: 6' },
  ];

  const maxValue = 30;

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-[0_4px_24px_rgba(30,27,56,0.04)] border border-[#ECEAF5] flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">
            {isAdmin ? 'Hiring Progress' : 'Attendance Trend'}
          </h4>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">24</span>
            <span className="text-xs text-slate-500 font-medium">
              {isAdmin ? 'Hires this month' : 'Days active this month'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
            <span>↑ 20% vs last month</span>
          </div>
        </div>

        <button
          onClick={onViewDetails}
          className="p-1.5 text-slate-400 hover:text-[#5038ED] hover:bg-[#F0EEFD] rounded-xl transition-colors cursor-pointer"
          title="View detailed analytics"
        >
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bar Chart Section */}
      <div className="mt-6 pt-2">
        <div className="relative flex items-end justify-between h-32 px-1">
          {daysData.map((item, index) => {
            const heightPercent = (item.value / maxValue) * 100;
            const isSelected = activeDay === index;

            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2 group cursor-pointer relative"
                onClick={() => setActiveDay(index)}
              >
                {/* Floating Badge on Active Day */}
                {isSelected && (
                  <div className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-[#5038ED] text-white text-[10px] font-black whitespace-nowrap shadow-md shadow-[#5038ED]/30 animate-in fade-in zoom-in-75 duration-150">
                    {item.value} {isAdmin ? 'Hires' : 'Days'}
                  </div>
                )}

                {/* Vertical Bar */}
                <div className="w-2.5 sm:w-3 bg-[#EAE8F6] rounded-full h-24 flex items-end overflow-hidden p-0.5">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-full transition-all duration-500 ${
                      isSelected
                        ? 'bg-[#5038ED]'
                        : 'bg-[#7C63FC] group-hover:bg-[#5038ED]'
                    }`}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[11px] font-bold transition-colors ${
                    isSelected ? 'text-[#5038ED]' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
