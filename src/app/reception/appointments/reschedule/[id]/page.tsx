'use client';
import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Clock, User, Stethoscope, ArrowLeft,
  CheckCircle2, AlertCircle, RotateCcw, ArrowRight
} from 'lucide-react';
import {
  useAppointmentStore, useQueueStore, useUIStore, useDoctorLeaveStore,
  Appointment, Doctor, SLOTS
} from '@/store';

export default function RescheduleAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;

  const router = useRouter();
  const { appointments, updateAppointment, getAvailableSlots } = useAppointmentStore();
  const { doctors } = useQueueStore();
  const { leaves } = useDoctorLeaveStore();
  const { addNotification } = useUIStore();

  const appointment = appointments.find(a => a.id === appointmentId);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(appointment?.doctorId || 'doc-1');
  const [newDate, setNewDate] = useState<string>('2026-09-20');
  const [newSlot, setNewSlot] = useState<string>('11:00');
  const [rescheduleReason, setRescheduleReason] = useState('Patient Requested Change');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (appointment) {
      setSelectedDoctorId(appointment.doctorId);
    }
  }, [appointment]);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Check if doctor is on approved leave on selected date (Scenario D)
  const doctorLeaveOnDate = useMemo(() => {
    return leaves.find(
      l => l.doctorId === selectedDoctorId &&
           l.status === 'APPROVED' &&
           newDate >= l.startDate &&
           newDate <= l.endDate
    );
  }, [leaves, selectedDoctorId, newDate]);

  const availableSlots = useMemo(() => {
    return getAvailableSlots(selectedDoctorId, newDate);
  }, [selectedDoctorId, newDate, getAvailableSlots]);

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(newSlot)) {
      setNewSlot(availableSlots[0]);
    }
  }, [availableSlots, newSlot]);

  if (!appointment) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto 14px' }} />
          <h2>Appointment Record Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>The requested appointment ID may have been deleted or does not exist.</p>
          <Link href="/reception/appointments" style={{ marginTop: 16, display: 'inline-block' }}>
            <button className="btn btn-primary">Back to Appointments</button>
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (doctorLeaveOnDate) {
      alert(`Cannot reschedule: Dr. ${selectedDoctor.name} is on approved leave (${doctorLeaveOnDate.reason}) on ${newDate}.`);
      return;
    }

    updateAppointment(appointment.id, {
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: newDate,
      time: newSlot,
      status: 'RESCHEDULED',
      remarks: `Rescheduled: ${rescheduleReason}${additionalNotes ? ' — ' + additionalNotes : ''}`
    });

    addNotification({
      type: 'warning',
      message: `Rescheduled appointment for ${appointment.patientName} to ${newDate} at ${newSlot}`
    });

    setSuccessMsg(`Appointment successfully shifted to ${newDate} at ${newSlot}!`);
    setTimeout(() => {
      router.push('/reception/appointments');
    }, 2000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/reception/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', marginBottom: 8, fontWeight: 600 }}>
            <ArrowLeft size={14} /> Back to Appointments
          </Link>
          <h1 className="page-title">Reschedule Patient Appointment</h1>
          <p className="page-subtitle">Reassign date, consulting physician, or appointment time slot for existing booking record.</p>
        </div>
      </div>

      {successMsg && (
        <div className="alert-banner success" style={{ marginBottom: 20 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Original Booking Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Clock size={18} color="var(--warning)" />
                Current Scheduled Booking
              </span>
              <span className="badge badge-warning">To Be Modified</span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Patient</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{appointment.patientName}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Physician</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{appointment.doctorName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Visit Type</div>
                  <span className="badge badge-purple" style={{ marginTop: 2 }}>{appointment.visitType}</span>
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--bg-muted)', borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Slot</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444', marginTop: 2 }}>
                  {appointment.date} at {appointment.time}
                </div>
              </div>
            </div>
          </div>

          {/* Reason Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <AlertCircle size={18} color="var(--primary)" />
                Reschedule Justification
              </span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label required">Primary Reason</label>
                <select
                  className="form-select"
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                >
                  <option value="Patient Requested Change">Patient Requested Date/Time Change</option>
                  <option value="Doctor Emergency / Leave">Doctor Emergency / Medical Leave</option>
                  <option value="Clinical Delay / Overrun">Clinic Delay / OPD Overrun</option>
                  <option value="Patient Medical Emergency">Patient Hospital Emergency</option>
                  <option value="Travel / Weather Delay">Travel / Traffic / Weather Issue</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Internal Reception Notes</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Record additional remarks for shift handover or clinical audit..."
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: New Slot Picker */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={18} color="var(--primary)" />
              Select New Doctor & Slot
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Physician */}
            <div className="form-group">
              <label className="form-label required">Doctor</label>
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization} • {d.room})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label required">New Date</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setNewDate('2026-09-19')}
                  className={`btn ${newDate === '2026-09-19' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Today (19 Sep)
                </button>
                <button
                  type="button"
                  onClick={() => setNewDate('2026-09-20')}
                  className={`btn ${newDate === '2026-09-20' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Tomorrow (20 Sep)
                </button>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 170 }}
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                />
              </div>
            </div>

            {/* Doctor Leave Warning (Scenario D) */}
            {doctorLeaveOnDate && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: '#B91C1C'
              }}>
                <AlertCircle size={18} className="shrink-0" style={{ color: '#DC2626', marginTop: 2 }} />
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 800 }}>🚫 Dr. {selectedDoctor.name} is on Leave</div>
                  <div style={{ marginTop: 2, color: '#DC2626' }}>
                    Reason: <strong>{doctorLeaveOnDate.reason}</strong> ({doctorLeaveOnDate.startDate} to {doctorLeaveOnDate.endDate}).
                    Cannot reschedule to this date.
                  </div>
                </div>
              </div>
            )}

            {/* Slot Grid */}
            <div className="form-group">
              <label className="form-label required">
                Available Slots on {newDate} ({availableSlots.length} available)
              </label>
              {doctorLeaveOnDate ? (
                <div style={{
                  padding: 20, textAlign: 'center', background: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)', border: '1px dashed rgba(239, 68, 68, 0.4)',
                  color: 'var(--text-muted)'
                }}>
                  <Clock size={24} style={{ margin: '0 auto 6px', color: '#EF4444' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>
                    Doctor on Approved Leave
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>Please pick another date or switch physician.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {SLOTS.map(slot => {
                    const isAvail = availableSlots.includes(slot);
                    const isSel = newSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => setNewSlot(slot)}
                        className="btn"
                        style={{
                          padding: '8px 0', justifyContent: 'center', fontSize: 12,
                          background: isSel ? 'var(--primary)' : isAvail ? 'var(--bg-card)' : 'var(--bg-muted)',
                          color: isSel ? 'white' : isAvail ? 'var(--text-primary)' : 'var(--text-disabled)',
                          border: isSel ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                          cursor: isAvail ? 'pointer' : 'not-allowed',
                          textDecoration: !isAvail ? 'line-through' : 'none'
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirmation Box */}
            <div style={{
              padding: 14, background: doctorLeaveOnDate ? '#FEF2F2' : 'var(--primary-light)', borderRadius: 8,
              border: doctorLeaveOnDate ? '1px solid #FCA5A5' : '1px solid rgba(99,102,241,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>NEW CONFIRMED APPOINTMENT:</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: doctorLeaveOnDate ? '#DC2626' : 'var(--primary)', marginTop: 2 }}>
                  {doctorLeaveOnDate ? 'BLOCKED (DOCTOR ON LEAVE)' : `${newDate} at ${newSlot} with ${selectedDoctor.name}`}
                </div>
              </div>
              <span className={`badge ${doctorLeaveOnDate ? 'badge-danger' : 'badge-success'}`}>
                {doctorLeaveOnDate ? 'Unavailable' : 'Ready to Save'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <Link href="/reception/appointments">
                <button type="button" className="btn btn-ghost">Cancel</button>
              </Link>
              <button
                type="button"
                disabled={!!doctorLeaveOnDate}
                onClick={handleConfirm}
                className={`btn ${doctorLeaveOnDate ? 'btn-ghost' : 'btn-primary'} btn-lg`}
                style={{
                  cursor: doctorLeaveOnDate ? 'not-allowed' : 'pointer',
                  opacity: doctorLeaveOnDate ? 0.6 : 1
                }}
              >
                <CheckCircle2 size={16} /> {doctorLeaveOnDate ? 'Doctor on Leave (Locked)' : 'Confirm & Notify Patient'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
