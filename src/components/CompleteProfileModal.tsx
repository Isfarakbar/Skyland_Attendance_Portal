'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Laptop,
  ShieldAlert,
  HeartHandshake,
  Check,
  Loader2,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  DollarSign,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface CompleteProfileModalProps {
  user: any;
  onClose: () => void;
  onProfileUpdated: (updatedUser: any) => void;
}

export default function CompleteProfileModal({
  user,
  onClose,
  onProfileUpdated,
}: CompleteProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'job' | 'financial' | 'devices' | 'emergency'>('overview');

  // Form states
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(
    user.avatarUrl ||
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'
  );
  const [bio, setBio] = useState(user.bio || 'Passionate HR leader driving employee engagement, growth, and organizational excellence.');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || '+92 321 9876543');
  const [emergencyRelation, setEmergencyRelation] = useState(user.emergencyRelation || 'Spouse');
  const [address, setAddress] = useState(user.address || 'Suite 402, Highrise Tower, Business District');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '1994-08-22');
  const [gender, setGender] = useState(user.gender || 'Female');
  const [cnic, setCnic] = useState(user.cnic || '42101-7894561-2');
  const [bankName, setBankName] = useState(user.bankName || 'Standard Chartered Bank');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '01-2948291-01');
  const [iban, setIban] = useState(user.iban || 'PK36SCBL0000001294829101');
  const [devices, setDevices] = useState(
    user.devices && user.devices.length > 0
      ? user.devices
      : [
          {
            name: 'MacBook Air',
            model: 'Version M1 (16GB RAM / 512GB SSD)',
            serialNumber: 'C02G8921MD6T',
            assignedDate: '2024-01-15',
            status: 'Active',
          },
        ]
  );
  const [pensionFund, setPensionFund] = useState(
    user.pensionFund || {
      enrolled: true,
      contributionPercent: 8,
      monthlyAmount: Math.round((user.baseSalary || 95000) * 0.08),
    }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim(),
          bio: bio.trim(),
          emergencyContact: emergencyContact.trim(),
          emergencyRelation: emergencyRelation.trim(),
          address: address.trim(),
          dateOfBirth: dateOfBirth.trim(),
          gender: gender.trim(),
          cnic: cnic.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          iban: iban.trim(),
          devices,
          pensionFund,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Complete profile saved successfully!');
        onProfileUpdated(data.user);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0D1527] rounded-[32px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden my-auto text-slate-200">
        {/* Header Hero Banner */}
        <div className="relative bg-linear-to-r from-[#0B1120] via-[#131E36] to-[#1E293B] border-b border-slate-800 p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] overflow-hidden border-4 border-slate-700 shadow-xl bg-slate-900">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute bottom-1 right-1 p-2 bg-[#FF6B00] hover:bg-amber-600 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{name || 'Employee Profile'}</h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-[#FF6B00] border border-orange-500/20 backdrop-blur-xs">
                  {user.employeeId || 'SKY-001'}
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Member
                </span>
              </div>
              <p className="text-sm font-medium text-slate-300">
                {user.designation || 'Staff Member'} • {user.department || 'Skyland Energy'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 mt-3 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {phone || '+92 300 1234567'}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Salary: PKR {(user.baseSalary || 95000).toLocaleString()} / mo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0D1527] border-b border-slate-800 px-6 sm:px-8">
          <div className="flex space-x-2 sm:space-x-6 overflow-x-auto no-scrollbar py-3 text-xs sm:text-sm font-bold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'personal', label: 'Personal Info' },
              { id: 'job', label: 'Job & Hierarchy' },
              { id: 'financial', label: 'Salary & Bank' },
              { id: 'devices', label: 'Assigned Devices' },
              { id: 'emergency', label: 'Emergency Contact' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-linear-to-r from-[#FF6B00] to-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-950/50 border border-red-800/80 text-red-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Bio Summary */}
              <div className="bg-[#131E36] p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Professional Bio</span>
                <p className="text-sm text-slate-200 leading-relaxed">{bio}</p>
              </div>

              {/* Quick Spec Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#131E36] rounded-2xl border border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Work Mode</span>
                  <div className="text-sm font-black text-white mt-1">
                    {user.workMode === 'FIELD' ? '📍 Field Staff (GPS)' : '🏢 On-Site Desk'}
                  </div>
                </div>
                <div className="p-4 bg-[#131E36] rounded-2xl border border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift Timing</span>
                  <div className="text-sm font-black text-white mt-1">
                    {user.shiftTiming || '09:00 AM - 06:00 PM'}
                  </div>
                </div>
                <div className="p-4 bg-[#131E36] rounded-2xl border border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Balance</span>
                  <div className="text-sm font-black text-[#FF6B00] mt-1">
                    {(user.leaveBalance?.sick || 8) + (user.leaveBalance?.casual || 10) + (user.leaveBalance?.annual || 14)} Days Left
                  </div>
                </div>
                <div className="p-4 bg-[#131E36] rounded-2xl border border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Device</span>
                  <div className="text-sm font-black text-white mt-1 truncate">
                    {devices[0]?.name || 'MacBook Air M1'}
                  </div>
                </div>
              </div>

              {/* Sample Avatars Selector */}
              <div className="bg-[#131E36] p-5 rounded-2xl border border-slate-800 shadow-sm">
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Quick Select Portrait Avatar
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {presetAvatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Avatar ${i}`}
                      onClick={() => setAvatarUrl(url)}
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer border-2 transition-all hover:scale-105 ${
                        avatarUrl === url
                          ? 'border-[#FF6B00] ring-4 ring-orange-500/20'
                          : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="bg-[#131E36] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Personal Identification &amp; Contact
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Primary Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Unspecified">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">National ID / CNIC</label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="42101-7894561-2"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Residential address"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Bio / Role Summary</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: JOB & HIERARCHY */}
          {activeTab === 'job' && (
            <div className="bg-[#131E36] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Corporate Job &amp; Employment Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee ID</span>
                  <span className="text-sm font-mono font-black text-white">{user.employeeId || 'SKY-001'}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                  <span className="text-sm font-black text-white">{user.department || 'Skyland Energy'}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Designation</span>
                  <span className="text-sm font-black text-white">{user.designation || 'Staff Member'}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employment Type</span>
                  <span className="text-sm font-black text-white">{user.employmentType || 'Full-time Permanent'}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Manager</span>
                  <span className="text-sm font-black text-white">{user.reportingManager || 'Management'}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Work Mode</span>
                  <span className="text-sm font-black text-white">
                    {user.workMode === 'FIELD' ? 'Field Staff (GPS Check-in)' : 'Office Desk Staff'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL & SALARY */}
          {activeTab === 'financial' && (
            <div className="bg-[#131E36] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Compensation, Banking &amp; Pension
              </h4>

              <div className="p-4 bg-orange-950/20 rounded-2xl border border-orange-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Monthly Base Salary</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    PKR {(user.baseSalary || 95000).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Daily Rate</span>
                  <span className="text-sm font-mono font-bold text-[#FF6B00]">
                    PKR {Math.round((user.baseSalary || 95000) / 30).toLocaleString()} / day
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Disbursement Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank Name"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="01-2948291-01"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">IBAN Number</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="PK36SCBL0000001294829101"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Pension Plan */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Pension &amp; Provident Fund Contribution</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Enrolled ({pensionFund.contributionPercent}%)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Monthly employee deduction + matching company contribution: <strong className="text-white">PKR {pensionFund.monthlyAmount.toLocaleString()}</strong> / month.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGNED DEVICES */}
          {activeTab === 'devices' && (
            <div className="bg-[#131E36] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Corporate Hardware &amp; IT Equipment
                </h4>
                <span className="text-xs font-bold text-[#FF6B00]">{devices.length} Assets Registered</span>
              </div>

              <div className="space-y-3">
                {devices.map((device: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[#FF6B00] shadow-sm">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-white text-sm">{device.name}</h5>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {device.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{device.model}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">S/N: {device.serialNumber}</p>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Date</span>
                      <span className="text-xs font-mono font-semibold text-slate-300">{device.assignedDate || '2024-01-15'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EMERGENCY CONTACT */}
          {activeTab === 'emergency' && (
            <div className="bg-[#131E36] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Emergency Contact Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contact Person &amp; Phone</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Rahul Sharma: +92 321 9876543"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="e.g. Spouse / Sibling / Parent"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 flex items-center justify-between bg-[#0D1527]">
          <span className="text-xs text-slate-400 hidden sm:inline">
            All profile information is stored encrypted and compliant with corporate policy.
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-7 py-2.5 bg-linear-to-r from-[#FF6B00] to-amber-600 hover:opacity-90 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-950/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Complete Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
