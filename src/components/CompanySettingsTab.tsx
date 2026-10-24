'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Clock, Building, ShieldCheck, CheckCircle2, Calculator, Info, ChevronDown, ChevronUp, Table, DollarSign } from 'lucide-react';
import { FBR_TAX_SLABS_2026_27, calculateFBRTax } from '@/lib/taxCalculator';

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
  const [allowedFreeLeaves, setAllowedFreeLeaves] = useState(1);
  const [allowedFreeHalfLeaves, setAllowedFreeHalfLeaves] = useState(1);
  const [salaryCalculationDays, setSalaryCalculationDays] = useState(30);
  const [taxDeductionEnabled, setTaxDeductionEnabled] = useState(true);
  const [taxCalculationMode, setTaxCalculationMode] = useState<'FBR_SLABS' | 'FLAT_RATE'>('FBR_SLABS');
  const [taxYear, setTaxYear] = useState('2026-27');
  const [taxExemptionThreshold, setTaxExemptionThreshold] = useState(50000);
  const [taxRate, setTaxRate] = useState(2.5);

  // UI state for slabs table & interactive simulator
  const [showSlabsTable, setShowSlabsTable] = useState(false);
  const [simSalary, setSimSalary] = useState(162000);

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
        setGracePeriodMinutes(data.settings.gracePeriodMinutes ?? 15);
        setHalfDayThresholdHours(data.settings.halfDayThresholdHours ?? 4);
        setFullDayThresholdHours(data.settings.fullDayThresholdHours ?? 8);
        setTimezone(data.settings.timezone || 'Asia/Karachi');
        setAllowedFreeLeaves(data.settings.allowedFreeLeaves ?? 1);
        setAllowedFreeHalfLeaves(data.settings.allowedFreeHalfLeaves ?? 1);
        setSalaryCalculationDays(data.settings.salaryCalculationDays ?? 30);
        setTaxDeductionEnabled(data.settings.taxDeductionEnabled ?? true);
        setTaxCalculationMode(data.settings.taxCalculationMode || 'FBR_SLABS');
        setTaxYear(data.settings.taxYear || '2026-27');
        setTaxExemptionThreshold(data.settings.taxExemptionThreshold ?? 50000);
        setTaxRate(data.settings.taxRate ?? 2.5);
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
          allowedFreeLeaves,
          allowedFreeHalfLeaves,
          salaryCalculationDays,
          taxDeductionEnabled,
          taxCalculationMode,
          taxYear,
          taxExemptionThreshold,
          taxRate,
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
    <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Shift, Leave &amp; Tax Rules</h3>
            <p className="text-xs text-slate-400">Configure standard working hours, monthly free leave quotas, and income tax withholding</p>
          </div>
        </div>

        {success && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 mt-6">
          {/* Organization & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company Office Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              >
                <option value="Asia/Karachi" className="bg-[#0D1527] text-white">Asia/Karachi (PKT - UTC+05:00)</option>
                <option value="Asia/Dubai" className="bg-[#0D1527] text-white">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Riyadh" className="bg-[#0D1527] text-white">Asia/Riyadh (AST - UTC+03:00)</option>
                <option value="Asia/Kolkata" className="bg-[#0D1527] text-white">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="Asia/Dhaka" className="bg-[#0D1527] text-white">Asia/Dhaka (BST - UTC+06:00)</option>
                <option value="Asia/Singapore" className="bg-[#0D1527] text-white">Asia/Singapore (SGT - UTC+08:00)</option>
                <option value="Europe/London" className="bg-[#0D1527] text-white">Europe/London (GMT/BST)</option>
                <option value="America/New_York" className="bg-[#0D1527] text-white">America/New_York (EST - UTC-05:00)</option>
                <option value="America/Los_Angeles" className="bg-[#0D1527] text-white">America/Los_Angeles (PST - UTC-08:00)</option>
                <option value="UTC" className="bg-[#0D1527] text-white">UTC (Coordinated Universal Time)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Daily dates and punctuality are calculated in this timezone</p>
            </div>
          </div>

          {/* Shift Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Office Start Time</label>
              <input
                type="time"
                required
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[11px] text-slate-400 mt-1">Clock in threshold for punctuality</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Office End Time</label>
              <input
                type="time"
                required
                value={officeEndTime}
                onChange={(e) => setOfficeEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[11px] text-slate-400 mt-1">Official daily shift conclusion</p>
            </div>
          </div>

          {/* Thresholds & Punctuality Grace */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                min={0}
                max={60}
                required
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[11px] text-slate-400 mt-1">Arrival after this is marked Late (record only)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Half Day Minimum (Hours)</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={halfDayThresholdHours}
                onChange={(e) => setHalfDayThresholdHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[11px] text-slate-400 mt-1">Minimum hours for Half Day</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Full Day Standard (Hours)</label>
              <input
                type="number"
                min={4}
                max={16}
                required
                value={fullDayThresholdHours}
                onChange={(e) => setFullDayThresholdHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard full day work duration</p>
            </div>
          </div>

          {/* Monthly Leave Quotas & Calculation Basis */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Monthly Leave Allowance &amp; Deduction Formulas
              </span>
              <span className="text-[11px] text-orange-400 font-semibold">1 Off + 2 Half Leaves Free</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Allowed Free Offs / Month</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  required
                  value={allowedFreeLeaves}
                  onChange={(e) => setAllowedFreeLeaves(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Full-day offs without salary deduction (default: 1)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Allowed Free Half Leaves / Month</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  required
                  value={allowedFreeHalfLeaves}
                  onChange={(e) => setAllowedFreeHalfLeaves(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Half-day leaves without salary deduction (default: 2)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Salary Day Divisor</label>
                <input
                  type="number"
                  min={20}
                  max={31}
                  required
                  value={salaryCalculationDays}
                  onChange={(e) => setSalaryCalculationDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Daily rate = Base Salary ÷ Divisor (default: 30)</p>
              </div>
            </div>
          </div>

          {/* Income Tax Withholding Rules */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider block">
                    Income Tax Withholding (FBR / Corporate Slabs)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-500/10 text-[#FF6B00] border border-orange-500/20">
                    Finance Act 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automate monthly salary tax deductions per Federal Board of Revenue (FBR) salaried progressive tax slabs
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={taxDeductionEnabled}
                  onChange={(e) => setTaxDeductionEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B00]"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-300">
                  {taxDeductionEnabled ? 'Tax Enabled' : 'Tax Disabled'}
                </span>
              </label>
            </div>

            {taxDeductionEnabled ? (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                {/* Mode Selector Tabs */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tax Calculation System
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxCalculationMode('FBR_SLABS')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        taxCalculationMode === 'FBR_SLABS'
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">🏛️ FBR Progressive Slabs (FY 2026-27)</span>
                        {taxCalculationMode === 'FBR_SLABS' && (
                          <span className="text-[10px] font-black text-[#FF6B00] uppercase">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Official Pakistan salaried individual progressive slabs (1% to 35%) with Rs 600,000 threshold.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaxCalculationMode('FLAT_RATE')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        taxCalculationMode === 'FLAT_RATE'
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">⚙️ Custom Flat Rate (%)</span>
                        {taxCalculationMode === 'FLAT_RATE' && (
                          <span className="text-[10px] font-black text-[#FF6B00] uppercase">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Simplified single percentage deducted on monthly income above custom threshold.
                      </p>
                    </button>
                  </div>
                </div>

                {taxCalculationMode === 'FLAT_RATE' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Monthly Tax Exemption Threshold (PKR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">PKR</span>
                        <input
                          type="number"
                          min={0}
                          step="5000"
                          value={taxExemptionThreshold}
                          onChange={(e) => setTaxExemptionThreshold(Number(e.target.value))}
                          className="w-full pl-12 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Monthly income below this threshold incurs 0% tax (default: 50,000)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Tax Slab Rate (%) above Threshold
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step="0.5"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="w-full pr-8 pl-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Applied to taxable amount exceeding exemption threshold (e.g. 2.5%)</p>
                    </div>
                  </div>
                ) : (
                  /* FBR Progressive Slabs Section */
                  <div className="space-y-4">
                    {/* Legal Info Card */}
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p className="font-bold text-white">
                          FBR Salaried Slabs — Tax Year 2026-27 (Finance Act 2026)
                        </p>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          • <span className="text-white font-semibold">Tax-free threshold:</span> Rs 600,000/year (Rs 50,000/month).
                          <br />
                          • <span className="text-white font-semibold">Progressive slabs:</span> Each rate applies only to income above its respective threshold.
                          <br />
                          • <span className="text-white font-semibold">High-earner surcharge:</span> Abolished for salaried individuals from FY 2026-27.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Slabs Table Button */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowSlabsTable(!showSlabsTable)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Table className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>{showSlabsTable ? 'Hide 8 FBR Slabs Table' : 'View 8 Official FBR Slabs & Rates'}</span>
                        {showSlabsTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <span className="text-[11px] text-slate-500 font-mono">8 Progressive Slabs</span>
                    </div>

                    {/* Collapsible 8 Slabs Table */}
                    {showSlabsTable && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 animate-in fade-in duration-200">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                              <th className="py-2.5 px-3">Slab</th>
                              <th className="py-2.5 px-3">Annual Range (PKR)</th>
                              <th className="py-2.5 px-3">Monthly Equivalent</th>
                              <th className="py-2.5 px-3 text-right">Rate on Excess</th>
                              <th className="py-2.5 px-3 text-right">Base Tax</th>
                              <th className="py-2.5 px-3">Formula Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {FBR_TAX_SLABS_2026_27.map((slab) => (
                              <tr key={slab.slabNumber} className="hover:bg-slate-900/40">
                                <td className="py-2.5 px-3 font-bold text-[#FF6B00]">#{slab.slabNumber}</td>
                                <td className="py-2.5 px-3 text-slate-200">
                                  {slab.maxIncome !== null
                                    ? `${slab.minIncome.toLocaleString()} – ${slab.maxIncome.toLocaleString()}`
                                    : `Above ${slab.minIncome.toLocaleString()}`}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {slab.maxIncome !== null
                                    ? `${Math.round(slab.minIncome / 12).toLocaleString()} – ${Math.round(slab.maxIncome / 12).toLocaleString()}`
                                    : `Above ${Math.round(slab.minIncome / 12).toLocaleString()}`}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                                  {(slab.rate * 100).toFixed(0)}%
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-300">
                                  {slab.baseTax > 0 ? `PKR ${slab.baseTax.toLocaleString()}` : '0'}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                                  {slab.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Interactive Live Tax Calculator / Simulator */}
                    {(() => {
                      const sim = calculateFBRTax(simSalary);
                      return (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B1120] to-slate-950 border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-[#FF6B00]" />
                              <span className="font-bold text-xs text-white uppercase tracking-wider">
                                Live FBR Tax Simulator / Checker
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Verify salary formulas against corporate sheet
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                Test Monthly Gross Salary (PKR)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">PKR</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="5000"
                                  value={simSalary}
                                  onChange={(e) => setSimSalary(Number(e.target.value) || 0)}
                                  className="w-full pl-11 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Try 162,000 as per company reference</p>
                            </div>

                            <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual Gross</span>
                                <span className="text-xs font-black text-slate-100 font-mono mt-0.5 block">
                                  PKR {sim.annualTaxableIncome.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-500 block">Slab #{sim.applicableSlabNumber}</span>
                              </div>

                              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                                <span className="text-[10px] font-bold text-amber-400 uppercase block">Monthly Tax</span>
                                <span className="text-xs font-black text-amber-400 font-mono mt-0.5 block">
                                  - PKR {sim.monthlyTax.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-500 block">{(sim.marginalRate * 100).toFixed(0)}% marginal</span>
                              </div>

                              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Monthly Net</span>
                                <span className="text-xs font-black text-emerald-400 font-mono mt-0.5 block">
                                  PKR {(simSalary - sim.monthlyTax).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-500 block">Take-Home</span>
                              </div>

                              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual Tax</span>
                                <span className="text-xs font-black text-slate-200 font-mono mt-0.5 block">
                                  PKR {sim.annualTax.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-500 block">Effective: {(sim.effectiveRate * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Progressive Slab Split Breakdown */}
                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                              Tax Breakdown by Slab (Progressive Brackets):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                              {sim.breakdown
                                .filter((b) => b.taxableInSlab > 0)
                                .map((b) => (
                                  <div key={b.slabNumber} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 font-mono">
                                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                                      <span>Slab #{b.slabNumber}</span>
                                      <span className="text-amber-400">{(b.rate * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="text-white font-bold text-[11px] mt-0.5">
                                      PKR {b.taxableInSlab.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-amber-300">
                                      Tax: PKR {b.taxFromSlab.toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Tax deduction is currently disabled. All employees receive full gross pay minus excess leave cuts.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {saving ? 'Saving Changes...' : 'Save Company Rules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
