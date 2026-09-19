'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  User, Calendar, Stethoscope, Award, ShieldCheck,
  Plus, Trash2, CheckCircle2, Clock, MapPin, Mail, Phone,
  Camera, X
} from 'lucide-react';
import { useDoctorLeaveStore, useUIStore } from '@/store';

export default function DoctorProfilePage() {
  const { leaves, addLeave, cancelLeave } = useDoctorLeaveStore();
  const { addNotification } = useUIStore();

  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [leaveStart, setLeaveStart] = useState('2026-10-10');
  const [leaveEnd, setLeaveEnd] = useState('2026-10-12');
  const [leaveType, setLeaveType] = useState<'Casual' | 'Conference' | 'Medical' | 'Vacation'>('Conference');
  const [leaveReason, setLeaveReason] = useState('Aesthetic Dermatology Masterclass & Workshop');

  const handleApplyLeave = () => {
    addLeave({
      doctorId: 'doc-1',
      startDate: leaveStart,
      endDate: leaveEnd,
      type: leaveType,
      reason: leaveReason,
      status: 'APPROVED'
    });

    addNotification({
      type: 'warning',
      message: `Scheduled ${leaveType} leave from ${leaveStart} to ${leaveEnd}. Calendar slots blocked.`
    });

    setShowAddLeaveModal(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Credentials & Leave Management</h1>
          <p className="page-subtitle">Manage attending physician medical licenses, consultation cabin allocation, and block calendar for leaves.</p>
        </div>

        <button
          onClick={() => setShowAddLeaveModal(true)}
          className="btn btn-primary"
          style={{ background: '#036d92', borderColor: '#036d92' }}
        >
          <Plus size={16} /> Schedule Leave / Holiday
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Left: Doctor Credentials Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Stethoscope size={16} color="#036d92" />
              Medical Council License & Clinical Qualifications
            </span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#036d92',
                color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, boxShadow: '0 4px 16px rgba(3, 109, 146, 0.25)'
              }}>
                RV
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                  Dr. Raj Valaki, MBBS, MD (DVL)
                </h2>
                <div style={{ fontSize: 13, color: '#036d92', fontWeight: 700 }}>
                  Senior Consultant Dermatologist, Trichologist & Cosmetologist
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Surat Central Branch • Examination Cabin #1
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Medical Council Reg. No.</div>
                <div style={{ fontWeight: 800, color: '#036d92', fontFamily: 'monospace', marginTop: 2, fontSize: 14 }}>
                  G-34891 (Gujarat Medical Council)
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Clinical Specialization</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>Dermatology & Aesthetic Laser Medicine</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Degrees & Alma Mater</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>MBBS (GMC Surat), MD DVL (B.J. Medical)</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Assigned OPD Schedule</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>Mon – Sat (09:00 AM – 01:00 PM, 04:00 PM – 07:00 PM)</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Official Email</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>dr.raj.valaki@medflow.in</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Contact Number</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>+91 98250 11223</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Leave & Holiday Management */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={16} color="#036d92" />
              Scheduled Leaves & Conference Calendar
            </span>
          </div>

          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Dates scheduled as leave automatically disable appointment booking slots on the reception portal to prevent patient double-bookings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaves.map(l => (
                <div
                  key={l.id}
                  style={{
                    padding: 12, background: '#F8FAFC', borderRadius: 8,
                    border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                      {l.reason}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {l.startDate} to {l.endDate} • <span className="badge badge-purple" style={{ fontSize: 10 }}>{l.type}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => cancelLeave(l.id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Cancel scheduled leave"
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Leave Modal */}
      {showAddLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowAddLeaveModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Schedule Doctor Leave / Calendar Block</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddLeaveModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaveStart}
                      onChange={e => setLeaveStart(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaveEnd}
                      onChange={e => setLeaveEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Leave Category</label>
                  <select
                    className="form-select"
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value as any)}
                  >
                    <option value="Conference">Medical Conference / CME</option>
                    <option value="Casual">Casual / Family Leave</option>
                    <option value="Medical">Medical Leave</option>
                    <option value="Vacation">Annual Vacation</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Reason / Conference Details *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddLeaveModal(false)}>Cancel</button>
              <button
                onClick={handleApplyLeave}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92' }}
              >
                Block Calendar & Confirm ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
