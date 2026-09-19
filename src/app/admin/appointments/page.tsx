'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, Plus, Trash2, CheckCircle2,
  AlertTriangle, Users, Building, ShieldCheck, Lock,
  TrendingDown, X, RefreshCw
} from 'lucide-react';
import { useDoctorStore, useAdminStore, useUIStore } from '@/store';

export default function AdminAppointmentsPage() {
  const { doctors } = useDoctorStore();
  const { holidays, addHoliday, removeHoliday } = useAdminStore();
  const { addNotification } = useUIStore();

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    isRecurringYearly: false
  });

  // Doctor Capacity Matrix
  const doctorCapacity = useMemo(() => {
    return [
      { id: 'doc-1', name: 'Dr. Raj Valaki', room: 'Cabin 1', maxDailySlots: 32, bookedSlots: 26, walkInReserved: 6, completed: 18 },
      { id: 'doc-2', name: 'Dr. Sarah Jenkins', room: 'Cabin 2', maxDailySlots: 24, bookedSlots: 18, walkInReserved: 6, completed: 14 },
      { id: 'doc-3', name: 'Dr. Kalp Patel', room: 'Cabin 3', maxDailySlots: 20, bookedSlots: 14, walkInReserved: 6, completed: 10 },
      { id: 'doc-4', name: 'Dr. Meena Iyer', room: 'Cabin 4', maxDailySlots: 0, bookedSlots: 0, walkInReserved: 0, completed: 0, onLeave: true }
    ];
  }, []);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.date || !holidayForm.name) {
      addNotification({ type: 'danger', message: 'Date and holiday title are required.' });
      return;
    }

    addHoliday({
      date: holidayForm.date,
      name: holidayForm.name,
      isRecurringYearly: holidayForm.isRecurringYearly
    });

    addNotification({
      type: 'success',
      message: `Clinic Holiday "${holidayForm.name}" registered. Booking slots frozen for ${holidayForm.date}.`
    });

    setIsHolidayModalOpen(false);
    setHolidayForm({ date: '', name: '', isRecurringYearly: false });
  };

  const handleRemoveHoliday = (id: string, name: string) => {
    removeHoliday(id);
    addNotification({
      type: 'info',
      message: `Holiday "${name}" removed. Booking slots unfrozen.`
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b5cf6', background: '#F5F3FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #DDD6FE' }}>
              Scheduling Governance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Clinic-Wide Capacity & Holiday Locks</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={26} color="#8b5cf6" /> Appointment Scheduling & Capacity Master
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Doctor capacity matrix, walk-in buffer allocation, clinic closure holiday locks, and cancellation metrics.
          </p>
        </div>

        <button
          onClick={() => setIsHolidayModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: '#8b5cf6',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
          }}
        >
          <Plus size={16} /> Declare Clinic Holiday Lock
        </button>
      </div>

      {/* KPI Stats on Attrition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Daily Booking Capacity</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>76 Slots</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4, fontWeight: 600 }}>Across 3 active consulting rooms</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Slots Booked Today</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: 4 }}>58 Booked</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>76.3% Clinic Capacity Utilization</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Walk-in Buffer Reserve</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>18 Reserved</div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: 4, fontWeight: 600 }}>Emergency & walk-in priority</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>No-Show & Cancellation</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>3.8%</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4, fontWeight: 600 }}>↓ 1.2% reduction via WhatsApp reminders</div>
        </div>
      </div>

      {/* Main 2-Column: Doctor Capacity Grid on Left, Clinic Holidays on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 24 }}>
        
        {/* Left: Doctor Capacity Matrix */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={17} color="#8b5cf6" /> Physician Capacity Matrix & Utilization
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              Real-time slot saturation, completed encounters, and remaining walk-in buffer.
            </div>
          </div>

          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {doctorCapacity.map(doc => {
              const utilPct = doc.maxDailySlots > 0 ? Math.round((doc.bookedSlots / doc.maxDailySlots) * 100) : 0;

              return (
                <div key={doc.id} style={{
                  padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                  opacity: doc.onLeave ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>{doc.name}</span>
                        <span style={{ fontSize: '0.75rem', background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {doc.room}
                        </span>
                        {doc.onLeave && (
                          <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            ON LEAVE (FROZEN)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                        Max Capacity: {doc.maxDailySlots} slots • Walk-in Buffer: {doc.walkInReserved} • Completed: {doc.completed}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: doc.onLeave ? '#94a3b8' : '#8b5cf6' }}>
                        {doc.bookedSlots} / {doc.maxDailySlots}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Slots Claimed</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
                    <div style={{
                      width: `${utilPct}%`,
                      height: '100%',
                      background: utilPct >= 85 ? '#DC2626' : utilPct >= 65 ? '#8B5CF6' : '#10B981',
                      borderRadius: 999
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Clinic Holiday Declarations */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={17} color="#dc2626" /> Clinic Holiday Locks ({holidays.length})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Booking portals are automatically frozen on declared dates.
              </div>
            </div>
          </div>

          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {holidays.map(hol => (
              <div key={hol.id} style={{
                padding: 14, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF1F2',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#991B1B' }}>
                    {hol.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7F1D1D', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} /> Date: <strong>{hol.date}</strong>
                    {hol.isRecurringYearly && (
                      <span style={{ fontSize: '0.7rem', background: '#FEE2E2', padding: '1px 5px', borderRadius: 4 }}>Recurring Yearly</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveHoliday(hol.id, hol.name)}
                  style={{
                    background: '#FFFFFF', border: '1px solid #FECACA', color: '#DC2626',
                    width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer'
                  }}
                  title="Remove Holiday Lock"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {holidays.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                No active holiday locks declared. Clinic is operational all week.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Declare Holiday Modal */}
      {isHolidayModalOpen && (
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
            maxWidth: 460,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Declare Clinic Closure / Holiday Lock
                </h3>
              </div>
              <button onClick={() => setIsHolidayModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Closure Reason / Holiday Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinic Renovation / Diwali Break"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Closure Date *
                </label>
                <input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#334155', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={holidayForm.isRecurringYearly}
                  onChange={(e) => setHolidayForm(f => ({ ...f, isRecurringYearly: e.target.checked }))}
                  style={{ accentColor: '#8b5cf6', width: 16, height: 16 }}
                />
                <span>Recurring Annual Public Holiday</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#8b5cf6', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lock Slots
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
