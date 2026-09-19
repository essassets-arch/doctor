'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock, Plus, Search, Filter, CheckCircle2,
  Calendar, DollarSign, Download, Users, FileText,
  TrendingUp, AlertCircle, X
} from 'lucide-react';
import { useAdminStore, useUIStore } from '@/store';

export default function AdminHRMSPage() {
  const { staff, attendance, logAttendance } = useAdminStore();
  const { addNotification } = useUIStore();

  const [dateFilter, setDateFilter] = useState('2026-09-19');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    staffId: staff[0]?.id || '',
    date: '2026-09-19',
    checkIn: '08:00 AM',
    checkOut: '04:30 PM',
    status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'HALF_DAY'
  });

  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => a.date === dateFilter);
  }, [attendance, dateFilter]);

  // Payroll Calculation Engine
  const payrollSummary = useMemo(() => {
    return staff.map(member => {
      const memberRecords = attendance.filter(a => a.staffId === member.id);
      const totalOvertimeHours = memberRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
      const overtimePay = Math.round(totalOvertimeHours * member.overtimeRate);
      const grossSalary = member.salary + overtimePay;

      return {
        ...member,
        daysPresent: memberRecords.filter(r => r.status === 'PRESENT').length,
        totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
        overtimePay,
        grossSalary
      };
    });
  }, [staff, attendance]);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = staff.find(s => s.id === form.staffId);
    if (!targetStaff) return;

    // Calculate hours worked approximately
    const hoursWorked = form.status === 'PRESENT' ? 8.5 : form.status === 'HALF_DAY' ? 4 : 0;
    const overtimeHours = form.status === 'PRESENT' ? 0.5 : 0;

    logAttendance({
      staffId: targetStaff.id,
      staffName: targetStaff.name,
      date: form.date,
      checkIn: form.status === 'ABSENT' ? '—' : form.checkIn,
      checkOut: form.status === 'ABSENT' ? '—' : form.checkOut,
      hoursWorked,
      overtimeHours,
      status: form.status
    });

    addNotification({
      type: 'success',
      message: `Shift attendance recorded for ${targetStaff.name}.`
    });

    setIsLogModalOpen(false);
  };

  const handleExportPayroll = () => {
    addNotification({
      type: 'success',
      message: 'Monthly Staff Payroll Sheet exported (Bank NEFT Batch File ready).'
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
              HRMS & Compensation
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Daily Shift Auditing & Overtime Engine</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={26} color="#059669" /> HRMS, Shift Attendance & Overtime Auditing
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Shift check-in/out timestamps, automated overtime rate computation, and monthly gross payroll compilation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsLogModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 8,
              background: '#059669',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
            }}
          >
            <Plus size={16} /> Log Daily Attendance
          </button>
          <button
            onClick={handleExportPayroll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 8,
              background: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Download size={16} /> Export Payroll Batch
          </button>
        </div>
      </div>

      {/* 2-Section Layout: Daily Log on Left (55%), Payroll Compilation on Right (45%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.1fr)', gap: 24 }}>
        
        {/* Left: Daily Attendance Roster */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={17} color="#059669" /> Daily Attendance Ledger
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Employee</th>
                  <th style={{ padding: '12px 16px' }}>Clock In</th>
                  <th style={{ padding: '12px 16px' }}>Clock Out</th>
                  <th style={{ padding: '12px 16px' }}>Hours</th>
                  <th style={{ padding: '12px 16px' }}>Overtime</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map(att => (
                  <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {att.staffName}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontFamily: 'monospace' }}>
                      {att.checkIn}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontFamily: 'monospace' }}>
                      {att.checkOut}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {att.hoursWorked} hrs
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {att.overtimeHours > 0 ? (
                        <span style={{ color: '#059669', fontWeight: 700 }}>+{att.overtimeHours} hrs</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: att.status === 'PRESENT' ? '#DCFCE7' : '#FEE2E2',
                        color: att.status === 'PRESENT' ? '#15803D' : '#991B1B'
                      }}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8' }}>
                      No shift records logged for {dateFilter}. Click &quot;Log Daily Attendance&quot; above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Monthly Payroll Preparation Summary */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={17} color="#10b981" /> Monthly Payroll & Overtime Compilation
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              Standard month (September 2026) base compensation + automated overtime payout.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Staff</th>
                  <th style={{ padding: '12px 14px' }}>Base Salary</th>
                  <th style={{ padding: '12px 14px' }}>OT Hours</th>
                  <th style={{ padding: '12px 14px' }}>OT Payout</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Gross Payable</th>
                </tr>
              </thead>
              <tbody>
                {payrollSummary.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.designation}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>
                      ₹{m.salary.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 600 }}>
                      {m.totalOvertimeHours} hrs
                    </td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700 }}>
                      +₹{m.overtimePay}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                      ₹{m.grossSalary.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Total */}
          <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>Total Monthly Clinic Payroll Liability:</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
              ₹{payrollSummary.reduce((s, m) => s + m.grossSalary, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>

      {/* Log Attendance Modal */}
      {isLogModalOpen && (
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
            maxWidth: 480,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Log Daily Shift Attendance
                </h3>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Select Employee *
                </label>
                <select
                  value={form.staffId}
                  onChange={(e) => setForm(f => ({ ...f, staffId: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  {staff.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.designation}) — {m.role}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Shift Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Attendance Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="PRESENT">Full Day Present</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent / Leave</option>
                  </select>
                </div>
              </div>

              {form.status !== 'ABSENT' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Clock-In Timestamp
                    </label>
                    <input
                      type="text"
                      value={form.checkIn}
                      onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Clock-Out Timestamp
                    </label>
                    <input
                      type="text"
                      value={form.checkOut}
                      onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Record Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
