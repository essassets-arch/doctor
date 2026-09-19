'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Filter, ShieldCheck, ShieldAlert,
  UserCheck, UserX, DollarSign, Clock, Mail, Phone,
  Award, X, Edit2, CheckCircle2
} from 'lucide-react';
import { useAdminStore, useUIStore, StaffMember } from '@/store';

export default function AdminStaffPage() {
  const { staff, addStaff, toggleStaffStatus, updateStaff } = useAdminStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    role: 'NURSING' as 'RECEPTION' | 'NURSING' | 'MEDICAL' | 'ADMIN',
    designation: 'Staff Triage Nurse',
    email: '',
    phone: '',
    salary: 35000,
    overtimeRate: 300,
    shift: '08:00 AM – 04:00 PM',
    licenseNumber: ''
  });

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = selectedRole === 'ALL' || member.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [staff, searchTerm, selectedRole]);

  const handleToggle = (id: string, name: string) => {
    toggleStaffStatus(id);
    addNotification({
      type: 'info',
      message: `Account status for ${name} toggled. Authentication state updated.`
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      addNotification({ type: 'danger', message: 'Name and email are required.' });
      return;
    }

    addStaff({
      name: form.name,
      role: form.role,
      designation: form.designation,
      email: form.email,
      phone: form.phone,
      salary: Number(form.salary),
      overtimeRate: Number(form.overtimeRate),
      status: 'ACTIVE',
      shift: form.shift,
      licenseNumber: form.licenseNumber || undefined
    });

    addNotification({
      type: 'success',
      message: `Staff member ${form.name} registered with ${form.role} RBAC credentials.`
    });

    setIsAddModalOpen(false);
    setForm({
      name: '',
      role: 'NURSING',
      designation: 'Staff Triage Nurse',
      email: '',
      phone: '',
      salary: 35000,
      overtimeRate: 300,
      shift: '08:00 AM – 04:00 PM',
      licenseNumber: ''
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', background: '#E0F2FE', padding: '2px 8px', borderRadius: 4, border: '1px solid #BAE6FD' }}>
              Workforce Governance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Non-Physician Clinical & Administrative Personnel</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={26} color="#0284c7" /> Staff & RBAC Access Administration
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Role-Based Access Control (RBAC), base compensation, overtime parameters, and instant credential revocation.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: '#0284c7',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
          }}
        >
          <Plus size={16} /> Register New Employee
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search employee name, designation, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            color: '#334155'
          }}
        >
          <option value="ALL">All RBAC Roles</option>
          <option value="NURSING">Nursing Staff</option>
          <option value="MEDICAL">Medical & Pharmacy</option>
          <option value="RECEPTION">Front Desk Reception</option>
          <option value="ADMIN">Administrative Officers</option>
        </select>
      </div>

      {/* Staff Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 18px' }}>Staff Employee</th>
              <th style={{ padding: '14px 18px' }}>RBAC Role</th>
              <th style={{ padding: '14px 18px' }}>Shift Hours</th>
              <th style={{ padding: '14px 18px' }}>Base Salary</th>
              <th style={{ padding: '14px 18px' }}>Overtime Rate</th>
              <th style={{ padding: '14px 18px' }}>Account State</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Security Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{member.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{member.designation}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                    {member.email} • {member.phone}
                    {member.licenseNumber && ` • Lic: ${member.licenseNumber}`}
                  </div>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background:
                      member.role === 'ADMIN' ? '#EEF2FF' :
                      member.role === 'NURSING' ? '#ECFEFF' :
                      member.role === 'MEDICAL' ? '#ECFDF5' : '#FFF7ED',
                    color:
                      member.role === 'ADMIN' ? '#4338ca' :
                      member.role === 'NURSING' ? '#0891b2' :
                      member.role === 'MEDICAL' ? '#059669' : '#ea580c'
                  }}>
                    {member.role}
                  </span>
                </td>

                <td style={{ padding: '14px 18px', color: '#475569', fontSize: '0.82rem' }}>
                  {member.shift}
                </td>

                <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                  ₹{member.salary.toLocaleString('en-IN')}<span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}> /mo</span>
                </td>

                <td style={{ padding: '14px 18px', fontWeight: 600, color: '#059669' }}>
                  ₹{member.overtimeRate}<span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}> /hr</span>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: member.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                    color: member.status === 'ACTIVE' ? '#15803D' : '#991B1B'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.status === 'ACTIVE' ? '#16A34A' : '#DC2626' }} />
                    {member.status}
                  </span>
                </td>

                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleToggle(member.id, member.name)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: member.status === 'ACTIVE' ? '#FEE2E2' : '#DCFCE7',
                      color: member.status === 'ACTIVE' ? '#991B1B' : '#15803D'
                    }}
                  >
                    {member.status === 'ACTIVE' ? 'Revoke / Inactivate' : 'Reactivate Account'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 520,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Register Staff Member & RBAC Account
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyaben Patel"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    RBAC Role Category *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="NURSING">Nursing Triage</option>
                    <option value="MEDICAL">Medical & Pharmacy</option>
                    <option value="RECEPTION">Front Desk Reception</option>
                    <option value="ADMIN">Administrative Apex</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) => setForm(f => ({ ...f, designation: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Base Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="1000"
                    value={form.salary}
                    onChange={(e) => setForm(f => ({ ...f, salary: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Overtime Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={form.overtimeRate}
                    onChange={(e) => setForm(f => ({ ...f, overtimeRate: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Shift Roster
                  </label>
                  <input
                    type="text"
                    value={form.shift}
                    onChange={(e) => setForm(f => ({ ...f, shift: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    License (If Reg. Nurse/Pharm)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GNC-12345"
                    value={form.licenseNumber}
                    onChange={(e) => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
