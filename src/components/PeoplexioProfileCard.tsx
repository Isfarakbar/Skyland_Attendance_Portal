'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Laptop,
  MoreVertical,
  ShieldCheck,
  DollarSign,
  Heart,
  Edit3,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface PeoplexioProfileCardProps {
  user: any;
  onOpenCompleteProfile: () => void;
}

export default function PeoplexioProfileCard({
  user,
  onOpenCompleteProfile,
}: PeoplexioProfileCardProps) {
  const [openSection, setOpenSection] = useState<string | null>('devices');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const displayName = user?.name || 'Ananya Sharma';
  const displayRole = user?.designation || 'Senior HR Manager';
  const displaySalary = user?.baseSalary
    ? `PKR ${Number(user.baseSalary).toLocaleString()}`
    : 'PKR 95,000';
  const avatarImage =
    user?.avatarUrl ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80';

  const defaultDevice =
    user?.devices && user?.devices.length > 0
      ? user.devices[0]
      : {
          name: 'MacBook Air',
          model: 'Version M1',
          serialNumber: 'SKY-MBP-8921',
        };

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-[0_4px_24px_rgba(30,27,56,0.04)] border border-[#ECEAF5] space-y-4">
      {/* Visual Portrait Card */}
      <div className="relative rounded-[26px] overflow-hidden bg-gradient-to-b from-[#D4CCFB] via-[#B8A7FA] to-[#927BFC] aspect-4/3 sm:aspect-square flex flex-col justify-end p-4 group">
        <img
          src={avatarImage}
          alt={displayName}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Shadow for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1749]/80 via-transparent to-black/10 pointer-events-none" />

        {/* Top-Right Quick Edit Overlay Pill */}
        <button
          onClick={onOpenCompleteProfile}
          className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#2B1B6B] text-xs font-bold backdrop-blur-md shadow-md flex items-center gap-1.5 transition-all cursor-pointer opacity-90 group-hover:opacity-100 hover:scale-105"
          title="View & Edit Complete Profile"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#5038ED]" />
          <span>Edit Profile</span>
        </button>

        {/* Bottom Floating Glass Badge */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-between shadow-lg">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg leading-tight drop-shadow-xs">
              {displayName}
            </h3>
            <p className="text-xs text-white/90 font-medium drop-shadow-xs">
              {displayRole}
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/25 border border-white/30 backdrop-blur-sm text-right">
            <span className="text-xs font-black tracking-tight block">
              {displaySalary}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/80 block font-semibold">
              Monthly Salary
            </span>
          </div>
        </div>
      </div>

      {/* Accordion / Details Section */}
      <div className="space-y-2 pt-1 text-xs">
        {/* Item 1: Pension Contributions */}
        <div className="border border-[#F0EEF8] rounded-2xl overflow-hidden transition-all bg-[#FAF9FD]">
          <button
            onClick={() => toggleSection('pension')}
            className="w-full px-4 py-3 flex items-center justify-between font-bold text-slate-800 hover:text-[#5038ED] transition-colors cursor-pointer"
          >
            <span>Pension contributions</span>
            {openSection === 'pension' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === 'pension' && (
            <div className="px-4 pb-3.5 text-slate-600 space-y-1.5 border-t border-[#F0EEF8] pt-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Employee Tier:</span>
                <span className="font-bold text-slate-900">8% Matching Plan</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Monthly Contribution:</span>
                <span className="font-mono font-bold text-[#5038ED]">
                  PKR {Math.round((user?.baseSalary || 95000) * 0.08).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Fund Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active &amp; Vested
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Item 2: Devices (Open by default as in reference) */}
        <div className="border border-[#F0EEF8] rounded-2xl overflow-hidden transition-all bg-[#FAF9FD]">
          <button
            onClick={() => toggleSection('devices')}
            className="w-full px-4 py-3 flex items-center justify-between font-bold text-slate-800 hover:text-[#5038ED] transition-colors cursor-pointer"
          >
            <span>Devices</span>
            {openSection === 'devices' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === 'devices' && (
            <div className="px-4 pb-3.5 border-t border-[#F0EEF8] pt-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-[#EBE8F6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0EEFD] border border-[#DDD8F8] flex items-center justify-center text-[#5038ED]">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs leading-tight">
                      {defaultDevice.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {defaultDevice.model}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenCompleteProfile}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="View device details"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Item 3: Compensation Summary */}
        <div className="border border-[#F0EEF8] rounded-2xl overflow-hidden transition-all bg-[#FAF9FD]">
          <button
            onClick={() => toggleSection('compensation')}
            className="w-full px-4 py-3 flex items-center justify-between font-bold text-slate-800 hover:text-[#5038ED] transition-colors cursor-pointer"
          >
            <span>Compensation Summary</span>
            {openSection === 'compensation' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === 'compensation' && (
            <div className="px-4 pb-3.5 text-slate-600 space-y-1.5 border-t border-[#F0EEF8] pt-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Basic Pay:</span>
                <span className="font-bold text-slate-900">
                  PKR {Number(user?.baseSalary || 95000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Allowed Monthly Offs:</span>
                <span className="font-bold text-emerald-700">1 Free Off &amp; 1 Half Leave</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pay Frequency:</span>
                <span className="font-bold text-slate-900">Monthly via Bank Wire</span>
              </div>
            </div>
          )}
        </div>

        {/* Item 4: Employee Benefits */}
        <div className="border border-[#F0EEF8] rounded-2xl overflow-hidden transition-all bg-[#FAF9FD]">
          <button
            onClick={() => toggleSection('benefits')}
            className="w-full px-4 py-3 flex items-center justify-between font-bold text-slate-800 hover:text-[#5038ED] transition-colors cursor-pointer"
          >
            <span>Employee Benefits</span>
            {openSection === 'benefits' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === 'benefits' && (
            <div className="px-4 pb-3.5 text-slate-600 space-y-2 border-t border-[#F0EEF8] pt-2.5">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5038ED]" />
                <span>Executive Outpatient &amp; Hospitalization Health Cover</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5038ED]" />
                <span>32 Days Total Paid Annual &amp; Medical Leaves</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5038ED]" />
                <span>Annual Performance Incentive &amp; EID Bonus</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Profile Trigger Button */}
      <button
        onClick={onOpenCompleteProfile}
        className="w-full py-3 px-4 bg-[#F0EEFD] hover:bg-[#E5E1FB] text-[#5038ED] font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
      >
        <Sparkles className="w-4 h-4" />
        <span>View &amp; Edit Complete Profile</span>
      </button>
    </div>
  );
}
