'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Building2,
  DollarSign,
  Laptop,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Check,
  Cpu,
  MapPin,
  Clock,
  HeartHandshake,
  KeyRound,
} from 'lucide-react';
import { calculateFBRTax } from '@/lib/taxCalculator';

interface DeviceItem {
  name: string;
  model: string;
  serialNumber: string;
  assignedDate?: string;
  status?: string;
}

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  role?: string;
  department?: string;
  designation?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  cnic?: string;
  shiftTiming?: string;
  reportingManager?: string;
  employmentType?: string;
  baseSalary?: number;
  workMode?: 'OFFICE' | 'FIELD' | 'WFH' | 'HYBRID';
  weeklyOffDays?: number[];
  weeklyHalfDays?: number[];
  joinDate?: string | Date;
  isActive: boolean;
  leaveBalance?: { sick: number; casual: number; annual: number };
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  devices?: DeviceItem[];
  pensionFund?: {
    enrolled: boolean;
    contributionPercent: number;
    monthlyAmount: number;
  };
  taxSettings?: {
    isExempt?: boolean;
    customRate?: number | null;
    customFixedAmount?: number | null;
  };
}

interface AdminEditEmployeeModalProps {
  employee: EmployeeData;
  onClose: () => void;
  onUpdated: (updatedEmployee: EmployeeData) => void;
}

function normalizeDateForInput(val?: string | Date): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (trimmed.includes('T')) return trimmed.split('T')[0];
    const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
  }
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
}

const DAY_NAME_TO_INT: Record<string, number> = {
  SUN: 0, SUNDAY: 0,
  MON: 1, MONDAY: 1,
  TUE: 2, TUESDAY: 2,
  WED: 3, WEDNESDAY: 3,
  THU: 4, THURSDAY: 4,
  FRI: 5, FRIDAY: 5,
  SAT: 6, SATURDAY: 6,
};

function normalizeDayNumbers(val: any, defaultVal: number[] = [0, 6]): number[] {
  if (!Array.isArray(val) || val.length === 0) return defaultVal;
  const cleaned = val
    .map((d) => {
      if (typeof d === 'number' && !isNaN(d) && d >= 0 && d <= 6) return d;
      if (typeof d === 'string') {
        const upper = d.trim().toUpperCase();
        if (DAY_NAME_TO_INT[upper] !== undefined) return DAY_NAME_TO_INT[upper];
        const num = parseInt(upper, 10);
        if (!isNaN(num) && num >= 0 && num <= 6) return num;
      }
      return null;
    })
    .filter((d): d is number => d !== null);
  return Array.from(new Set(cleaned)).sort((a, b) => a - b);
}

export default function AdminEditEmployeeModal({
  employee,
  onClose,
  onUpdated,
}: AdminEditEmployeeModalProps) {
  const [activeTab, setActiveTab] = useState<'job' | 'personal' | 'compensation' | 'devices'>('job');

  // Form states - Personal
  const [name, setName] = useState(employee.name || '');
  const [email, setEmail] = useState(employee.email || '');
  const [phone, setPhone] = useState(employee.phone || '');
  const [address, setAddress] = useState(employee.address || '');
  const [cnic, setCnic] = useState(employee.cnic || '');
  const [dateOfBirth, setDateOfBirth] = useState(normalizeDateForInput(employee.dateOfBirth));
  const [gender, setGender] = useState(employee.gender || 'Unspecified');
  const [emergencyContact, setEmergencyContact] = useState(employee.emergencyContact || '');
  const [emergencyRelation, setEmergencyRelation] = useState(employee.emergencyRelation || 'Family');
  const [bio, setBio] = useState(employee.bio || '');

  // Form states - Job & HR
  const [employeeId, setEmployeeId] = useState(employee.employeeId || '');
  const [role, setRole] = useState(employee.role || 'employee');
  const [department, setDepartment] = useState(employee.department || 'Operations');
  const [designation, setDesignation] = useState(employee.designation || 'Staff Member');
  const [shiftTiming, setShiftTiming] = useState(employee.shiftTiming || '09:00 AM - 06:00 PM');
  const [reportingManager, setReportingManager] = useState(employee.reportingManager || 'CEO');
  const [employmentType, setEmploymentType] = useState(employee.employmentType || 'Full-time Permanent');
  const [isActive, setIsActive] = useState(employee.isActive ?? true);
  const [newPassword, setNewPassword] = useState('');

  // Joining Date & Schedule
  const [joinDate, setJoinDate] = useState<string>(() => {
    if (!employee.joinDate) return new Date().toISOString().slice(0, 10);
    try {
      const d = new Date(employee.joinDate);
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  });
  const [workMode, setWorkMode] = useState<'OFFICE' | 'FIELD' | 'WFH' | 'HYBRID'>(
    employee.workMode || 'OFFICE'
  );
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>(() =>
    normalizeDayNumbers(employee.weeklyOffDays, [0, 6])
  );
  const [weeklyHalfDays, setWeeklyHalfDays] = useState<number[]>(() =>
    normalizeDayNumbers(employee.weeklyHalfDays, [])
  );

  // Form states - Compensation & Leaves
  const [baseSalary, setBaseSalary] = useState<number>(employee.baseSalary || 30000);
  const [sickLeaves, setSickLeaves] = useState<number>(employee.leaveBalance?.sick ?? 8);
  const [casualLeaves, setCasualLeaves] = useState<number>(employee.leaveBalance?.casual ?? 10);
  const [annualLeaves, setAnnualLeaves] = useState<number>(employee.leaveBalance?.annual ?? 14);

  // Bank details
  const [bankName, setBankName] = useState(employee.bankName || 'Meezan Bank');
  const [accountNumber, setAccountNumber] = useState(employee.accountNumber || '');
  const [iban, setIban] = useState(employee.iban || '');

  // Tax Configuration
  const [taxMode, setTaxMode] = useState<'COMPANY_DEFAULT' | 'EXEMPT' | 'CUSTOM_RATE' | 'FIXED'>(() => {
    if (employee.taxSettings?.isExempt) return 'EXEMPT';
    if (typeof employee.taxSettings?.customFixedAmount === 'number' && employee.taxSettings.customFixedAmount >= 0) return 'FIXED';
    if (typeof employee.taxSettings?.customRate === 'number' && employee.taxSettings.customRate >= 0) return 'CUSTOM_RATE';
    return 'COMPANY_DEFAULT';
  });
  const [taxCustomRate, setTaxCustomRate] = useState<number>(employee.taxSettings?.customRate ?? 2.5);
  const [taxFixedAmount, setTaxFixedAmount] = useState<number>(employee.taxSettings?.customFixedAmount ?? 1000);

  // Devices & Hardware
  const [devices, setDevices] = useState<DeviceItem[]>(
    Array.isArray(employee.devices) ? employee.devices : []
  );

  // New Device Form state
  const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newDevModel, setNewDevModel] = useState('');
  const [newDevSerial, setNewDevSerial] = useState('');
  const [newDevStatus, setNewDevStatus] = useState('Active');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddDevice = () => {
    if (!newDevName.trim()) {
      alert('Device name is required');
      return;
    }

    const newDev: DeviceItem = {
      name: newDevName.trim(),
      model: newDevModel.trim() || 'Standard Issue Hardware',
      serialNumber: newDevSerial.trim() || `SKY-EQP-${Math.floor(1000 + Math.random() * 9000)}`,
      assignedDate: new Date().toISOString().slice(0, 10),
      status: newDevStatus,
    };

    setDevices([...devices, newDev]);
    setNewDevName('');
    setNewDevModel('');
    setNewDevSerial('');
    setNewDevStatus('Active');
    setShowAddDeviceForm(false);
  };

  const handleRemoveDevice = (index: number) => {
    if (!confirm('Revoke and remove this device from employee assignment?')) return;
    setDevices(devices.filter((_, i) => i !== index));
  };

  const handleUpdateDeviceField = (index: number, field: keyof DeviceItem, value: string) => {
    const updated = [...devices];
    updated[index] = { ...updated[index], [field]: value };
    setDevices(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Employee name cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        role,
        department: department.trim(),
        designation: designation.trim(),
        shiftTiming: shiftTiming.trim(),
        reportingManager: reportingManager.trim(),
        employmentType: employmentType.trim(),
        workMode,
        weeklyOffDays: normalizeDayNumbers(weeklyOffDays, [0, 6]),
        weeklyHalfDays: normalizeDayNumbers(weeklyHalfDays, []),
        joinDate,
        isActive,
        ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
        baseSalary: Number(baseSalary) || 30000,
        address: address.trim(),
        cnic: cnic.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender,
        emergencyContact: emergencyContact.trim(),
        emergencyRelation: emergencyRelation.trim(),
        bio: bio.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim(),
        leaveBalance: {
          sick: Number(sickLeaves) || 0,
          casual: Number(casualLeaves) || 0,
          annual: Number(annualLeaves) || 0,
        },
        devices,
        taxSettings: {
          isExempt: taxMode === 'EXEMPT',
          customRate: taxMode === 'CUSTOM_RATE' ? Number(taxCustomRate) || 0 : null,
          customFixedAmount: taxMode === 'FIXED' ? Number(taxFixedAmount) || 0 : null,
        },
      };

      const res = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Employee profile updated successfully!');
        onUpdated(data.employee);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(data.error || 'Failed to update employee profile');
      }
    } catch {
      setError('Network error saving employee details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0D1527] rounded-[32px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden my-auto text-slate-200">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-[#0B1120] via-[#131E36] to-[#1E293B] border-b border-slate-800 p-6 sm:p-7 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 text-white font-black text-xl flex items-center justify-center border border-orange-500/40 shadow-lg shadow-orange-500/20 shrink-0">
              {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{name.charAt(0) || 'E'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{name || 'Edit Employee'}</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  {employeeId || 'SKY-000'}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}
                >
                  {isActive ? 'Active Member' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Admin Master Dossier &bull; Full Access to Role, Salary &amp; Assigned Equipment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-end sm:self-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0D1527] border-b border-slate-800 px-6 sm:px-8">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto py-3 text-xs sm:text-sm font-bold no-scrollbar">
            {[
              { id: 'job', label: 'Job & Role', icon: Briefcase },
              { id: 'personal', label: 'Personal & Contact', icon: User },
              { id: 'compensation', label: 'Salary & Bank', icon: DollarSign },
              {
                id: 'devices',
                label: `Company Devices (${devices.length})`,
                icon: Laptop,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#FF6B00] text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-950/60 border border-red-800 text-red-200 text-xs font-semibold rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Content Area */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* TAB 1: JOB & HR SETTINGS */}
          {activeTab === 'job' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#FF6B00]" />
                  <span>Employment &amp; System Configuration</span>
                </h3>
                <span className="text-[11px] text-slate-400">Admin Managed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. SKY-002"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                  >
                    <option value="employee">Employee (Standard Staff)</option>
                    <option value="manager">Manager / Team Lead</option>
                    <option value="admin">Operations Administrator</option>
                    <option value="ceo">Chief Executive (CEO)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Operations, IT, Engineering"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Solar Engineer"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>Official Joining Date</span>
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Primary Work Mode
                  </label>
                  <select
                    value={workMode}
                    onChange={(e: any) => setWorkMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                  >
                    <option value="OFFICE">🏢 In-Office (Head Office / Desk)</option>
                    <option value="FIELD">🚗 Field / On-Site Client Locations</option>
                    <option value="WFH">🏡 Work From Home (Remote)</option>
                    <option value="HYBRID">🔄 Hybrid (Office &amp; Remote)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                  >
                    <option value="Full-time Permanent">Full-time Permanent</option>
                    <option value="Contractual / Project">Contractual / Project</option>
                    <option value="Probationary">Probationary Period</option>
                    <option value="Internship / Trainee">Internship / Trainee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Shift Timing</label>
                  <input
                    type="text"
                    value={shiftTiming}
                    onChange={(e) => setShiftTiming(e.target.value)}
                    placeholder="09:00 AM - 06:00 PM"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    placeholder="e.g. Director Operations"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-orange-400 uppercase mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Login Password (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password, or enter new password (min 6 chars)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                {/* Weekly Off Days & Half Days Configuration */}
                <div className="sm:col-span-2 lg:col-span-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Weekly Off Days (Approved Schedule — Zero Salary Deduction)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Select this employee's approved weekly off days (e.g. Saturday for Amna, Wednesday, or Sunday). Taking off on these days will <strong>never</strong> deduct salary.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setWeeklyOffDays([0, 6])}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      >
                        Sat &amp; Sun (5-Day)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeeklyOffDays([0])}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      >
                        Sun Only (6-Day)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeeklyOffDays([0, 3])}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      >
                        Wed &amp; Sun
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Pills for Off Days */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Rostered Off Days (Green = Approved Weekly Off)
                    </span>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {[
                        { day: 0, label: 'Sun', full: 'Sunday' },
                        { day: 1, label: 'Mon', full: 'Monday' },
                        { day: 2, label: 'Tue', full: 'Tuesday' },
                        { day: 3, label: 'Wed', full: 'Wednesday' },
                        { day: 4, label: 'Thu', full: 'Thursday' },
                        { day: 5, label: 'Fri', full: 'Friday' },
                        { day: 6, label: 'Sat', full: 'Saturday' },
                      ].map(({ day, label, full }) => {
                        const isSelected = weeklyOffDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setWeeklyOffDays(weeklyOffDays.filter((d) => d !== day));
                              } else {
                                setWeeklyOffDays([...weeklyOffDays, day].sort());
                              }
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center justify-center transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title={`Toggle ${full} as Scheduled Weekly Off`}
                          >
                            <span>{label}</span>
                            <span className="text-[9px] font-normal opacity-80">{isSelected ? 'OFF' : 'Work'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekly Half Days */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Weekly Half Working Days (e.g. Wednesday or Saturday Half Day)
                    </span>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {[
                        { day: 0, label: 'Sun' },
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' },
                      ].map(({ day, label }) => {
                        const isHalf = weeklyHalfDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isHalf) {
                                setWeeklyHalfDays(weeklyHalfDays.filter((d) => d !== day));
                              } else {
                                setWeeklyHalfDays([...weeklyHalfDays, day].sort());
                              }
                            }}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                              isHalf
                                ? 'bg-amber-950/90 border-amber-500/80 text-amber-300 shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <span>{label}</span>
                            <span className="text-[8px] font-normal opacity-80">{isHalf ? 'Half' : 'Full'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Account Status</span>
                    <span className="text-[11px] text-slate-400">
                      Deactivating an employee prevents them from logging in and excludes them from active rosters.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                        : 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900'
                    }`}
                  >
                    {isActive ? '✓ Active Staff' : '✗ Deactivated'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & CONTACT */}
          {activeTab === 'personal' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF6B00]" />
                  <span>Personal Dossier &amp; Identity</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muhammad Rizwan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@skylandenergy.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">National ID / CNIC</label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="35202-1234567-1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, Area, City"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+92 321 9876543"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Emergency Contact Relationship</label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="e.g. Spouse, Brother, Father"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Staff Bio</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Employee background or department notes..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPENSATION, LEAVES & BANKING */}
          {activeTab === 'compensation' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Salary &amp; Banking</span>
                </h3>
                <span className="text-[11px] text-slate-400">Strictly Admin Controlled</span>
              </div>

              {/* Base Salary Card */}
              <div className="p-4 bg-orange-950/20 rounded-2xl border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-orange-400 uppercase mb-1">
                    Monthly Base Salary (PKR)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">PKR</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full pl-12 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-black text-white focus:outline-hidden focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Daily Deduction Rate</span>
                  <span className="text-base font-mono font-black text-[#FF6B00]">
                    PKR {Math.round(Number(baseSalary || 0) / 30).toLocaleString()} / day
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Applied to unexcused absences</span>
                </div>
              </div>

              {/* Tax Withholding Configuration Card */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Income Tax Withholding (FBR / Corporate)
                  </span>
                  <span className="text-[11px] text-slate-400">Payroll Tax Deduction</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tax Mode</label>
                    <select
                      value={taxMode}
                      onChange={(e) => setTaxMode(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                    >
                      <option value="COMPANY_DEFAULT">Follow Company Policy (Automatic)</option>
                      <option value="EXEMPT">Exempt from Tax (0% Deduction)</option>
                      <option value="CUSTOM_RATE">Custom Tax Rate (%)</option>
                      <option value="FIXED">Fixed Monthly Tax (PKR)</option>
                    </select>
                  </div>

                  {taxMode === 'CUSTOM_RATE' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Custom Tax Rate (% above threshold)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={taxCustomRate}
                        onChange={(e) => setTaxCustomRate(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                      />
                    </div>
                  )}

                  {taxMode === 'FIXED' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Fixed Monthly Tax Deduction (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={taxFixedAmount}
                        onChange={(e) => setTaxFixedAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                      />
                    </div>
                  )}

                  {taxMode === 'COMPANY_DEFAULT' && (() => {
                    const fbr = calculateFBRTax(Number(baseSalary) || 0);
                    return (
                      <div className="text-xs p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-white font-bold">
                          <span>FBR Salaried Slabs (2026-27):</span>
                          <span className="text-amber-400 font-mono">
                            {fbr.monthlyTax > 0 ? `PKR ${fbr.monthlyTax.toLocaleString()}/mo` : 'Tax-Free (0 PKR)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {fbr.annualTaxableIncome <= 600000 ? (
                            <span>Annual Gross: PKR {fbr.annualTaxableIncome.toLocaleString()} (Below Rs 600,000 threshold &rarr; 0% tax)</span>
                          ) : (
                            <span>
                              Annual Gross: PKR {fbr.annualTaxableIncome.toLocaleString()} &rarr; Slab #{fbr.applicableSlabNumber} ({(fbr.marginalRate * 100).toFixed(0)}%) &rarr; Annual Tax: PKR {fbr.annualTax.toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })()}

                  {taxMode === 'EXEMPT' && (
                    <div className="flex items-center text-xs text-emerald-400 font-semibold p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                      No tax will be deducted from this employee&apos;s payslip.
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Account Grid */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Disbursement Bank Account
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Meezan Bank, HBL"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0101-294829101"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-[#FF6B00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">IBAN Number</label>
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      placeholder="PK36MEZN000101294829101"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-[#FF6B00]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPANY-OWNED DEVICES & HARDWARE ASSETS */}
          {activeTab === 'devices' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#FF6B00]" />
                    <span>Company-Owned Devices &amp; Assets Assigned</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assign, track, and revoke laptops, phones, solar testing tools, and vehicles issued to this employee
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDeviceForm(!showAddDeviceForm)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign New Device</span>
                </button>
              </div>

              {/* Add New Device Form (Collapsible) */}
              {showAddDeviceForm && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-orange-500/40 space-y-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-bold text-orange-400">Issue New Company Equipment</span>
                    <button
                      type="button"
                      onClick={() => setShowAddDeviceForm(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Device Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MacBook Pro, Dell Latitude"
                        value={newDevName}
                        onChange={(e) => setNewDevName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Model / Specifications
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M2 16GB / 512GB SSD"
                        value={newDevModel}
                        onChange={(e) => setNewDevModel(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Serial Number / Asset Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SKY-EQP-9821"
                        value={newDevSerial}
                        onChange={(e) => setNewDevSerial(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Equipment Status
                      </label>
                      <select
                        value={newDevStatus}
                        onChange={(e) => setNewDevStatus(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                      >
                        <option value="Active">Active</option>
                        <option value="Under Repair">Under Repair</option>
                        <option value="Standby">Standby</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddDevice}
                      className="px-4 py-1.5 bg-[#FF6B00] hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Add Device</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Devices List */}
              {devices.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
                  <Laptop className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">
                    No company hardware or devices currently assigned to this employee.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddDeviceForm(true)}
                    className="text-xs text-[#FF6B00] hover:underline font-bold"
                  >
                    + Issue First Device
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((dev, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold text-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-sm block">
                              {dev.name || 'Hardware Asset'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Assigned on: {dev.assignedDate || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={dev.status || 'Active'}
                            onChange={(e) => handleUpdateDeviceField(idx, 'status', e.target.value)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border bg-slate-950 focus:outline-hidden ${
                              dev.status === 'Active'
                                ? 'text-emerald-400 border-emerald-800'
                                : dev.status === 'Under Repair'
                                ? 'text-amber-400 border-amber-800'
                                : 'text-slate-400 border-slate-800'
                            }`}
                          >
                            <option value="Active">Active</option>
                            <option value="Under Repair">Under Repair</option>
                            <option value="Returned">Returned</option>
                            <option value="Retired">Retired</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveDevice(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Revoke / Delete Device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Device Name
                          </label>
                          <input
                            type="text"
                            value={dev.name}
                            onChange={(e) => handleUpdateDeviceField(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Serial Number / Asset Tag
                          </label>
                          <input
                            type="text"
                            value={dev.serialNumber}
                            onChange={(e) => handleUpdateDeviceField(idx, 'serialNumber', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-hidden focus:border-[#FF6B00]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Model &amp; Specifications
                          </label>
                          <input
                            type="text"
                            value={dev.model}
                            onChange={(e) => handleUpdateDeviceField(idx, 'model', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save Employee Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
