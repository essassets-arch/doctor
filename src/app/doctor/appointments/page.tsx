'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, User, Plus, Search, CheckCircle2,
  AlertCircle, ArrowRight, X, Stethoscope, RotateCcw
} from 'lucide-react';
import {
  useAppointmentStore, usePatientStore, useUIStore, useQueueStore, useConsultationStore,
  Appointment, SLOTS
} from '@/store';

export default function DoctorAppointmentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { appointments, addAppointment, updateAppointment } = useAppointmentStore();
  const { patients } = usePatientStore();
  const { queue, addToQueue } = useQueueStore();
  const { addNotification } = useUIStore();

  const handleMarkArrived = (apt: Appointment) => {
    updateAppointment(apt.id, { status: 'ARRIVED' });

    const existing = queue.find(q => q.patientId === apt.patientId && q.status !== 'COMPLETED' && q.status !== 'CANCELLED');
    if (!existing) {
      const tokenIndex = queue.length + 1;
      const tokenCode = `C${String(tokenIndex).padStart(3, '0')}`;
      const caseNumber = `${tokenCode}-001-${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}`;
      const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const pat = patients.find(p => p.id === apt.patientId);

      addToQueue({
        caseNumber,
        tokenDisplay: tokenCode,
        patientId: apt.patientId,
        patientName: apt.patientName,
        doctorId: apt.doctorId || 'doc-1',
        doctorName: apt.doctorName || 'Dr. Raj Valaki',
        visitType: apt.visitType,
        appointmentTime: apt.time,
        checkInTime,
        age: pat?.age || 30,
        gender: pat?.gender || 'M',
        city: pat?.city || 'Surat',
        billingStatus: 'PAID',
        status: 'WAITING',
        stage: 'DOCTOR',
        vitalsRecorded: false,
        complaintsRecorded: false,
        isNew: false
      });

      useConsultationStore.getState().initSession(
        caseNumber,
        pat || { id: apt.patientId, firstName: apt.patientName, lastName: '', mobile: '', age: 30, gender: 'M', mrdNumber: 'MRD-NEW' } as any,
        {
          id: apt.doctorId || 'doc-1',
          name: apt.doctorName || 'Dr. Raj Valaki',
          specialization: 'General Physician',
          initials: 'RV',
          avatarColor: '#036d92',
          room: 'Room 1'
        }
      );

      addNotification({
        type: 'success',
        message: `${apt.patientName} marked Arrived and queued for Doctor (Token ${tokenCode})!`
      });
    } else {
      addNotification({
        type: 'success',
        message: `${apt.patientName} marked Arrived. Patient is in queue (${existing.tokenDisplay}).`
      });
    }
  };

  const [dateFilter, setDateFilter] = useState('2026-09-19');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAptForReschedule, setSelectedAptForReschedule] = useState<Appointment | null>(null);

  // New Booking State
  const [bookingPatientId, setBookingPatientId] = useState(patients[0]?.id || '');
  const [bookingDate, setBookingDate] = useState('2026-09-20');
  const [bookingSlot, setBookingSlot] = useState('10:30');
  const [bookingVisitType, setBookingVisitType] = useState<'Consultation' | 'Follow-Up' | 'Procedure'>('Follow-Up');
  const [bookingRemarks, setBookingRemarks] = useState('Doctor scheduled clinical follow-up');

  // Reschedule State
  const [rescheduleDate, setRescheduleDate] = useState('2026-09-22');
  const [rescheduleSlot, setRescheduleSlot] = useState('11:00');

  // Filtered appointments for Dr. Raj Valaki (doc-1)
  const doctorAppointments = useMemo(() => {
    return appointments.filter(a => a.doctorId === 'doc-1');
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return doctorAppointments.filter(a => {
      if (dateFilter && a.date !== dateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return a.patientName.toLowerCase().includes(q) || a.visitType.toLowerCase().includes(q);
      }
      return true;
    });
  }, [doctorAppointments, dateFilter, searchQuery]);

  const handleCreateAppointment = () => {
    const pat = patients.find(p => p.id === bookingPatientId) || patients[0];
    if (!pat) {
      alert('No registered patient selected. Please register a patient first in Reception.');
      return;
    }
    addAppointment({
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      doctorId: 'doc-1',
      doctorName: 'Dr. Raj Valaki',
      date: bookingDate,
      time: bookingSlot,
      visitType: bookingVisitType,
      status: 'SCHEDULED',
      remarks: bookingRemarks
    });

    addNotification({
      type: 'success',
      message: `Booked ${bookingVisitType} for ${pat.firstName} ${pat.lastName} on ${bookingDate} at ${bookingSlot}`
    });

    setShowBookingModal(false);
  };

  const handleReschedule = () => {
    if (!selectedAptForReschedule) return;
    updateAppointment(selectedAptForReschedule.id, {
      date: rescheduleDate,
      time: rescheduleSlot,
      status: 'RESCHEDULED',
      remarks: `Rescheduled to ${rescheduleDate} at ${rescheduleSlot}`
    });

    addNotification({
      type: 'warning',
      message: `Rescheduled ${selectedAptForReschedule.patientName} to ${rescheduleDate} at ${rescheduleSlot}`
    });

    setSelectedAptForReschedule(null);
  };

  if (!isMounted) {
    return (
      <div className="page-container" style={{ padding: '24px 0', minHeight: '80vh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Calendar size={28} style={{ color: '#036d92', opacity: 0.7 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading doctor appointments & schedule...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointment Management & Cabin Schedule</h1>
          <p className="page-subtitle">Inspect Dr. Raj Valaki's outpatient consultations, procedures, and book recall sessions directly.</p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="btn btn-primary"
          style={{ background: '#036d92', borderColor: '#036d92' }}
        >
          <Plus size={16} /> Book Direct Recall Slot
        </button>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="search-input-wrap" style={{ flex: 1, minWidth: 240 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-input"
              placeholder="Search patient name, procedure..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Date:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          <button
            onClick={() => setDateFilter('')}
            className="btn btn-ghost btn-sm"
          >
            Show All Dates
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Calendar size={16} color="#036d92" />
            Booked Consultations & Procedures — {filteredAppointments.length} Slots
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient Name</th>
                <th>Visit Purpose</th>
                <th>Status</th>
                <th>Clinical Remarks</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No appointments scheduled for the chosen date.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(apt => (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#036d92', fontFamily: 'monospace' }}>
                        {apt.time}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{apt.date}</div>
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      {apt.patientName}
                    </td>

                    <td>
                      <span className="badge badge-purple">{apt.visitType}</span>
                    </td>

                    <td>
                      <span className={`badge ${apt.status === 'SCHEDULED' ? 'badge-primary' : apt.status === 'ARRIVED' ? 'badge-success' : 'badge-warning'}`}>
                        {apt.status}
                      </span>
                    </td>

                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {apt.remarks || '—'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {apt.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleMarkArrived(apt)}
                            className="btn btn-success btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}
                            title="Mark Patient Arrived and Send to Active Queue"
                          >
                            <CheckCircle2 size={12} /> Arrived & Queue
                          </button>
                        )}
                        {apt.status === 'ARRIVED' && (
                          <Link href="/doctor/queue">
                            <span className="badge badge-success" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={12} /> In Queue →
                            </span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAptForReschedule(apt);
                            setRescheduleDate(apt.date);
                            setRescheduleSlot(apt.time);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: '#036d92', color: '#036d92', padding: '4px 8px', fontSize: 11 }}
                        >
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Recall Slot Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Book Direct Patient Recall / Follow-Up</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBookingModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Select Patient</label>
                  <select
                    className="form-select"
                    value={bookingPatientId}
                    onChange={e => setBookingPatientId(e.target.value)}
                  >
                    {patients.length === 0 && (
                      <option value="">No patients registered yet (Register in Reception)</option>
                    )}
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.mrdNumber}) — {p.mobile}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Appointment Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Time Slot</label>
                    <select
                      className="form-select"
                      value={bookingSlot}
                      onChange={e => setBookingSlot(e.target.value)}
                    >
                      {SLOTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Visit Type</label>
                  <select
                    className="form-select"
                    value={bookingVisitType}
                    onChange={e => setBookingVisitType(e.target.value as any)}
                  >
                    <option value="Follow-Up">Follow-Up Consultation</option>
                    <option value="Procedure">Procedure Session</option>
                    <option value="Consultation">New Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Clinical Remarks & Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    value={bookingRemarks}
                    onChange={e => setBookingRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowBookingModal(false)}>Cancel</button>
              <button
                onClick={handleCreateAppointment}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92' }}
              >
                Confirm Booking ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedAptForReschedule && (
        <div className="modal-overlay" onClick={() => setSelectedAptForReschedule(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Reschedule Appointment</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedAptForReschedule(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 14 }}>
                Rescheduling appointment for <strong>{selectedAptForReschedule.patientName}</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">New Appointment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">New Slot Time</label>
                  <select
                    className="form-select"
                    value={rescheduleSlot}
                    onChange={e => setRescheduleSlot(e.target.value)}
                  >
                    {SLOTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedAptForReschedule(null)}>Cancel</button>
              <button
                onClick={handleReschedule}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92' }}
              >
                Save Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
