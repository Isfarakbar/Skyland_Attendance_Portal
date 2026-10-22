'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Building, Briefcase, Search, DollarSign, Edit3, Check, X, MapPin, Eye, Trash2, Fingerprint, Laptop, ShieldCheck, Calendar } from 'lucide-react';
import EmployeeProfileModal from '@/components/EmployeeProfileModal';
import AdminEditEmployeeModal from '@/components/AdminEditEmployeeModal';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function formatSchedulePill(days?: number[]): string {
  if (!days || days.length === 0) return 'Sun Off';
  return days.map((d) => DAY_LABELS[d] || `D${d}`).join(', ') + ' Off';
}
function formatJoinDate(date?: string | Date): string {
  if (!date) return 'Not set';
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'Not set' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: 'developer' | 'admin' | 'ceo' | 'manager' | 'employee';
  department: string;
  designation: string;
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
  biometricUserId?: string;
  isActive: boolean;
  leaveBalance?: { sick: number; casual: number; annual: number };
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  devices?: Array<{
    name: string;
    model: string;
    serialNumber: string;
    assignedDate?: string;
    status?: string;
  }>;
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'developer' | 'admin' | 'ceo' | 'manager' | 'employee'>('employee');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('Employee');
  const [phone, setPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState(30000);
  const [workMode, setWorkMode] = useState<'OFFICE' | 'FIELD' | 'WFH' | 'HYBRID'>('OFFICE');
  const [joinDate, setJoinDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0, 6]); // Default: Sat & Sun
  const [submitting, setSubmitting] = useState(false);

  // Quick edit salary state
  const [editingSalaryEmpId, setEditingSalaryEmpId] = useState<string | null>(null);
  const [editingSalaryValue, setEditingSalaryValue] = useState<number>(30000);
  const [salaryUpdating, setSalaryUpdating] = useState(false);

  // 360 Employee Dossier Modal
  const [inspectingEmpId, setInspectingEmpId] = useState<string | null>(null);

  // Full Admin Edit Employee Modal
  const [editingFullEmployee, setEditingFullEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department,
          designation,
          phone,
          baseSalary: Number(baseSalary) || 30000,
          workMode,
          joinDate,
          weeklyOffDays,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setBaseSalary(30000);
        setWorkMode('OFFICE');
        setWeeklyOffDays([0, 6]);
        setJoinDate(new Date().toISOString().split('T')[0]);
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to create employee');
      }
    } catch {
      alert('Error creating employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    try {
      const res = await fetch(`/api/employees/${emp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !emp.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeRole = async (empId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch {
      alert('Error updating role');
    }
  };

  const handleSaveSalary = async (empId: string) => {
    setSalaryUpdating(true);
    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseSalary: Number(editingSalaryValue) || 30000 }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingSalaryEmpId(null);
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to update salary');
      }
    } catch {
      alert('Error updating salary');
    } finally {
      setSalaryUpdating(false);
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${emp.name}? This will remove their user account, attendance records, tasks, and leave data.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/employees/${emp._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert(`Employee ${emp.name} deleted successfully.`);
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to delete employee');
      }
    } catch {
      alert('Error deleting employee');
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    emp.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6B00]" />
            Company Roster &amp; Directory ({employees.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage employees, roles, base salaries, and account status</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">Loading company directory...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">No employees found.</div>
        ) : (
          filteredEmployees.map((emp) => {
            return (
              <div
                key={emp._id}
                className={`p-5 rounded-2xl border transition-all ${
                  emp.isActive
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:shadow-xs'
                    : 'bg-slate-900/30 border-dashed border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-orange-400 font-extrabold flex items-center justify-center text-sm border border-slate-700">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">{emp.name}</h4>
                      <span className="text-[11px] font-mono text-orange-400">{emp.employeeId}</span>
                    </div>
                  </div>

                  <select
                    value={emp.role}
                    onChange={(e) => handleChangeRole(emp._id, e.target.value)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer focus:outline-hidden transition-all ${
                      emp.role === 'admin'
                        ? 'bg-blue-950/50 text-blue-300 border-blue-800/80 font-extrabold'
                        : emp.role === 'ceo'
                        ? 'bg-purple-950/50 text-purple-300 border-purple-800/80 font-black'
                        : emp.role === 'developer'
                        ? 'bg-slate-900 text-white border-slate-700 font-black'
                        : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80'
                    }`}
                    title="Change employee role"
                  >
                    <option value="employee" className="bg-[#0D1527] text-white">Employee</option>
                    <option value="ceo" className="bg-[#0D1527] text-white">CEO (Executive)</option>
                    <option value="admin" className="bg-[#0D1527] text-white">Operations Admin</option>
                  </select>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-200">{emp.designation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{emp.email}</span>
                  </div>

                  {/* Base Salary Line & Quick Edit */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Base Salary:</span>
                    </div>

                    {editingSalaryEmpId === emp._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingSalaryValue}
                          onChange={(e) => setEditingSalaryValue(Number(e.target.value))}
                          className="w-24 px-1.5 py-0.5 text-xs font-bold bg-slate-950 text-white border border-[#FF6B00] rounded-md focus:outline-hidden"
                        />
                        <button
                          onClick={() => handleSaveSalary(emp._id)}
                          disabled={salaryUpdating}
                          className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded-md cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSalaryEmpId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded-md cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">
                          PKR {(emp.baseSalary || 30000).toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditingSalaryEmpId(emp._id);
                            setEditingSalaryValue(emp.baseSalary || 30000);
                          }}
                          className="text-slate-400 hover:text-orange-400 p-0.5 rounded-md cursor-pointer transition-colors"
                          title="Edit Salary"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Assigned Hardware / Devices Line */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Company Assets:</span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                        emp.devices && emp.devices.length > 0
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold'
                          : 'bg-slate-800 text-slate-500 border-slate-700 italic'
                      }`}
                    >
                      {emp.devices && emp.devices.length > 0 ? `${emp.devices.length} Assigned` : 'None'}
                    </span>
                  </div>

                  {/* Joining Date & Primary Work Mode */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Joined:</span>
                      <span className="font-semibold text-white">{formatJoinDate(emp.joinDate)}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        emp.workMode === 'WFH'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : emp.workMode === 'FIELD'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : emp.workMode === 'HYBRID'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {emp.workMode === 'WFH' ? '🏡 Remote WFH' : emp.workMode === 'FIELD' ? '🚗 Field' : emp.workMode === 'HYBRID' ? '🔀 Hybrid' : '🏢 Office'}
                    </span>
                  </div>

                  {/* Approved Weekly Offs */}
                  <div className="pt-1.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Weekly Offs:</span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/50">
                      🏖️ {formatSchedulePill(emp.weeklyOffDays)}
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingEmpId(emp._id)}
                    className="py-2 px-2 bg-slate-800 hover:bg-[#FF6B00]/20 text-slate-200 hover:text-orange-300 border border-slate-700/80 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="View attendance records and monthly stats"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="truncate">Attendance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFullEmployee(emp)}
                    className="py-2 px-2 bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] hover:text-orange-300 border border-[#FF6B00]/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Edit complete profile, salary, permissions & company equipment"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="truncate">Edit Profile</span>
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {emp.isActive ? 'Active Member' : 'Deactivated'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(emp)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        emp.isActive
                          ? 'text-amber-400 hover:bg-amber-950/40'
                          : 'text-emerald-400 hover:bg-emerald-950/40'
                      }`}
                    >
                      {emp.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp)}
                      className="text-[11px] font-semibold text-rose-400 hover:bg-rose-950/40 p-1 rounded-md transition-colors cursor-pointer"
                      title="Permanently Delete Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0D1527] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <h3 className="font-bold text-white text-lg mb-1">Add New Employee</h3>
            <p className="text-xs text-slate-400 mb-4">Onboard a new employee to Skyland Energy</p>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Andy Bernard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="andy@skyland.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] font-semibold"
                  >
                    <option value="employee">Employee</option>
                    <option value="ceo">CEO (Executive)</option>
                    <option value="admin">Operations Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] font-semibold"
                  >
                    <option value="OFFICE">🏢 Office</option>
                    <option value="WFH">🏡 Work From Home</option>
                    <option value="FIELD">🚗 Field</option>
                    <option value="HYBRID">🔀 Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Job Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar Engineer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Weekly Offs</label>
                  <select
                    value={weeklyOffDays.sort().join(',')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '0,6') setWeeklyOffDays([0, 6]);
                      else if (val === '0') setWeeklyOffDays([0]);
                      else if (val === '0,3') setWeeklyOffDays([0, 3]);
                      else if (val === '0,5') setWeeklyOffDays([0, 5]);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                  >
                    <option value="0,6">Sat &amp; Sun (Standard)</option>
                    <option value="0">Sunday Only (6-day week)</option>
                    <option value="0,3">Wed &amp; Sun Off</option>
                    <option value="0,5">Fri &amp; Sun Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Base Monthly Salary (PKR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  placeholder="30000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Approved weekly off days incur ZERO salary deduction</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Default Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 360 Employee Dossier Modal */}
      {inspectingEmpId && (
        <EmployeeProfileModal
          employeeId={inspectingEmpId}
          onClose={() => setInspectingEmpId(null)}
        />
      )}

      {/* Admin Full Employee Edit Modal */}
      {editingFullEmployee && (
        <AdminEditEmployeeModal
          employee={editingFullEmployee as any}
          onClose={() => setEditingFullEmployee(null)}
          onUpdated={() => {
            fetchEmployees();
            setEditingFullEmployee(null);
          }}
        />
      )}
    </div>
  );
}
