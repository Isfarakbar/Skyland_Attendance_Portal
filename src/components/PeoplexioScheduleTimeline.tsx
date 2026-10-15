'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock } from 'lucide-react';

interface ScheduleTimelineProps {
  onOpenCalendar?: () => void;
}

export default function PeoplexioScheduleTimeline({ onOpenCalendar }: ScheduleTimelineProps) {
  const [selectedDay, setSelectedDay] = useState(24);

  const days = [
    { name: 'Mon', date: 22 },
    { name: 'Tue', date: 23 },
    { name: 'Wed', date: 24 },
    { name: 'Thu', date: 25 },
    { name: 'Fri', date: 26 },
    { name: 'Sat', date: 27 },
  ];

  const timeSlots = ['09:00 am', '10:00 am', '11:00 am', '12:00 pm', '01:00 pm'];

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(30,27,56,0.04)] border border-[#ECEAF5]">
      {/* Month Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0EEF8]">
        <button
          onClick={onOpenCalendar}
          className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>August</span>
        </button>

        <h4 className="text-sm font-black text-slate-900 tracking-tight">
          September 2024
        </h4>

        <button
          onClick={onOpenCalendar}
          className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>October</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Days Strip */}
      <div className="grid grid-cols-6 gap-2 py-4 border-b border-[#F0EEF8]">
        {days.map((item) => {
          const isSelected = selectedDay === item.date;
          return (
            <button
              key={item.date}
              onClick={() => setSelectedDay(item.date)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#5038ED] text-white shadow-md shadow-[#5038ED]/30'
                  : 'text-slate-600 hover:bg-[#FAF9FD]'
              }`}
            >
              <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {item.name}
              </span>
              <span className="text-sm font-black mt-0.5">{item.date}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline Grid & Events */}
      <div className="pt-4 space-y-4 relative">
        {timeSlots.map((time, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="w-16 shrink-0">{time}</span>
            <div className="flex-1 h-px bg-[#F3F1FA]" />
          </div>
        ))}

        {/* Floating Event 1: Weekly Team Sync */}
        <div className="absolute top-9 left-20 sm:left-24 right-4 sm:right-16 p-3 rounded-2xl bg-[#ECE8FD] border border-[#DDD6FB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h5 className="font-extrabold text-[#2B1F70] text-xs">Weekly Team Sync</h5>
            <p className="text-[11px] text-[#5949B3] mt-0.5">Discuss progress on projects</p>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <div className="flex -space-x-1.5 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="Member"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                alt="Member"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                alt="Member"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DDD6FB] text-[#2B1F70]">
              +2
            </span>
          </div>
        </div>

        {/* Floating Event 2: Onboarding Session */}
        <div className="absolute top-36 left-28 sm:left-36 right-2 sm:right-6 p-3 rounded-2xl bg-[#FEF4E8] border border-[#FBE6CB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h5 className="font-extrabold text-[#7D4911] text-xs">Onboarding Session</h5>
            <p className="text-[11px] text-[#9A6223] mt-0.5">Introduction for new hires</p>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <div className="flex -space-x-1.5 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80"
                alt="Member"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&q=80"
                alt="Member"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBE6CB] text-[#7D4911]">
              +3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
