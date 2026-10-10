'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Building, Briefcase, Search, DollarSign, Edit3, Check, X, MapPin, Eye, Trash2 } from 'lucide-react';
import EmployeeProfileModal from '@/components/EmployeeProfileModal';

interface Employee {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: 'developer' | 'admin' | 'manager' | 'employee';
  department: string;
  designation: string;
  phone?: string;
  baseSalary?: number;
  workMode?: 'OFFICE' | 'FIELD';
  isActive: boolean;
  leaveBalance?: { sick: number; casual: number; annual: number };
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
  const [role, setRole] = useState<'developer' | 'admin' | 'manager' | 'employee'>('employee');
  const [department, setDepartment] = useState('Field Operations');
  const [designation, setDesignation] = useState('Solar Technician');
  const [phone, setPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState(30000);
  const [workMode, setWorkMode] = useState<'OFFICE' | 'FIELD'>('OFFICE');
  const [submitting, setSubmitting] = useState(false);

  // Quick edit salary state
  const [editingSalaryEmpId, setEditingSalaryEmpId] = useState<string | null>(null);
  const [editingSalaryValue, setEditingSalaryValue] = useState<number>(30000);
  const [salaryUpdating, setSalaryUpdating] = useState(false);

  // 360 Employee Dossier Modal
  const [inspectingEmpId, setInspectingEmpId] = useState<string | null>(null);

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

  const handleToggleWorkMode = async (emp: Employee) => {
    const newMode = emp.workMode === 'FIELD' ? 'OFFICE' : 'FIELD';
    try {
      const res = await fetch(`/api/employees/${emp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workMode: newMode }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to change work mode');
      }
    } catch {
      alert('Error changing work mode');
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
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Company Roster &amp; Directory ({employees.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage team members, work location mode (Office vs Field GPS), base salaries, and status</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
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
            const isField = emp.workMode === 'FIELD';
            return (
              <div
                key={emp._id}
                className={`p-5 rounded-2xl border transition-all ${
                  emp.isActive
                    ? 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                    : 'bg-slate-50/80 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-sm border border-slate-200">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{emp.name}</h4>
                      <span className="text-[11px] font-mono text-slate-400">{emp.employeeId}</span>
                    </div>
                  </div>

                  <select
                    value={emp.role === 'manager' || emp.role === 'admin' ? 'admin' : 'employee'}
                    onChange={(e) => handleChangeRole(emp._id, e.target.value)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer focus:outline-hidden transition-all ${
                      emp.role === 'manager' || emp.role === 'admin'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                    title="Click to change account role"
                  >
                    <option value="employee">Staff Member</option>
                    <option value="admin">Management (CEO / Admin)</option>
                  </select>
                </div>

                {/* Work Mode Badge */}
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                      isField
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isField ? (
                      <>
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>Field / On-Site (GPS)</span>
                      </>
                    ) : (
                      <>
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>Office Staff (Register)</span>
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => handleToggleWorkMode(emp)}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    title="Change employee work mode"
                  >
                    Switch to {isField ? 'Office' : 'Field'}
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{emp.designation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>

                  {/* Base Salary Line & Quick Edit */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Base Salary:</span>
                    </div>

                    {editingSalaryEmpId === emp._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingSalaryValue}
                          onChange={(e) => setEditingSalaryValue(Number(e.target.value))}
                          className="w-24 px-1.5 py-0.5 text-xs font-bold border border-indigo-400 rounded-md focus:outline-hidden"
                        />
                        <button
                          onClick={() => handleSaveSalary(emp._id)}
                          disabled={salaryUpdating}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSalaryEmpId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-md cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">
                          PKR {(emp.baseSalary || 30000).toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditingSalaryEmpId(emp._id);
                            setEditingSalaryValue(emp.baseSalary || 30000);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 rounded-md cursor-pointer transition-colors"
                          title="Edit Salary"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingEmpId(emp._id)}
                  className="w-full mt-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Progress &amp; Attendance</span>
                </button>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {emp.isActive ? 'Active Member' : 'Deactivated'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(emp)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        emp.isActive
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {emp.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp)}
                      className="text-[11px] font-semibold text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Add New Employee</h3>
            <p className="text-xs text-slate-500 mb-4">Onboard a new team member to Skyland</p>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Andy Bernard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="andy@skyland.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="employee">Staff Member / Employee</option>
                    <option value="admin">Management (CEO / Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Location Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="OFFICE">Office Staff (Desk Register)</option>
                    <option value="FIELD">Field / On-Site (GPS Mobile Check-In)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Field Operations"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar Engineer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Monthly Salary (PKR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  placeholder="30000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Used to calculate daily rate (Base / 30) for excess leaves</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer"
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
    </div>
  );
}
