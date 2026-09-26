'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, Plus, Trash2, CheckCircle2,
  AlertTriangle, Users, Building, ShieldCheck, Lock,
  TrendingDown, X, RefreshCw, Search, Filter, Stethoscope,
  RotateCcw, Check, CalendarClock, User, AlertCircle
} from 'lucide-react';
import {
  useDoctorStore, useAdminStore, useUIStore,
  useAppointmentStore, useQueueStore, usePatientStore, useDoctorLeaveStore,
  Appointment, SLOTS
} from '@/store';

export default function AdminAppointmentsPage() {
  const { doctors: adminDoctors } = useDoctorStore();
  const { holidays, addHoliday, removeHoliday } = useAdminStore();
  const { addNotification } = useUIStore();
  const { appointments, updateAppointment, cancelAppointment, addAppointment, getAvailableSlots } = useAppointmentStore();
  const { queue, doctors, updateQueueEntry } = useQueueStore();
  const { patients } = usePatientStore();
  const { leaves } = useDoctorLeaveStore();

  // Tab: 'ROSTER' | 'CAPACITY' | 'HOLIDAYS'
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'CAPACITY' | 'HOLIDAYS'>('ROSTER');

  // Roster Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState('2026-09-19');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    isRecurringYearly: false
  });

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    patientId: patients[0]?.id || 'pat-1',
    doctorId: 'doc-1',
    date: '2026-09-19',
    time: '11:00',
    visitType: 'Consultation' as any,
    remarks: ''
  });

  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null
  });
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState('doc-1');
  const [rescheduleDate, setRescheduleDate] = useState('2026-09-20');
  const [rescheduleSlot, setRescheduleSlot] = useState('11:00');
  const [rescheduleReason, setRescheduleReason] = useState('Administrative Schedule Rebalance');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const [cancelModal, setCancelModal] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null
  });
  const [cancelReason, setCancelReason] = useState('Patient Requested Cancellation');

  // Doctor Capacity Matrix
  const doctorCapacity = useMemo(() => {
    return [
      { id: 'doc-1', name: 'Dr. Raj Valaki', room: 'Cabin 1', maxDailySlots: 32, bookedSlots: 26, walkInReserved: 6, completed: 18 },
      { id: 'doc-2', name: 'Dr. Sarah Jenkins', room: 'Cabin 2', maxDailySlots: 24, bookedSlots: 18, walkInReserved: 6, completed: 14 },
      { id: 'doc-3', name: 'Dr. Kalp Patel', room: 'Cabin 3', maxDailySlots: 20, bookedSlots: 14, walkInReserved: 6, completed: 10 },
      { id: 'doc-4', name: 'Dr. Meena Iyer', room: 'Cabin 4', maxDailySlots: 0, bookedSlots: 0, walkInReserved: 0, completed: 0, onLeave: true }
    ];
  }, []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchSearch =
        !searchTerm ||
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.visitType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDoctor = selectedDoctor === 'ALL' || apt.doctorId === selectedDoctor;
      const matchStatus = selectedStatus === 'ALL' || apt.status === selectedStatus;

      let matchDate = true;
      if (selectedDateFilter === 'TODAY') {
        matchDate = apt.date === '2026-09-19';
      } else if (selectedDateFilter === 'TOMORROW') {
        matchDate = apt.date === '2026-09-20';
      } else if (selectedDateFilter === 'CUSTOM') {
        matchDate = apt.date === customDate;
      }

      return matchSearch && matchDoctor && matchStatus && matchDate;
    });
  }, [appointments, searchTerm, selectedDoctor, selectedStatus, selectedDateFilter, customDate]);

  // Reschedule Slots
  const availableRescheduleSlots = useMemo(() => {
    return getAvailableSlots(rescheduleDoctorId, rescheduleDate);
  }, [rescheduleDoctorId, rescheduleDate, getAvailableSlots]);

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleModal({ open: true, appointment: apt });
    setRescheduleDoctorId(apt.doctorId);
    setRescheduleDate(apt.date === '2026-09-19' ? '2026-09-20' : '2026-09-19');
    setRescheduleReason('Administrative Schedule Rebalance');
    setRescheduleNotes('');
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleModal.appointment) return;
    const apt = rescheduleModal.appointment;
    const targetDoc = doctors.find(d => d.id === rescheduleDoctorId) || doctors[0];

    updateAppointment(apt.id, {
      doctorId: targetDoc.id,
      doctorName: targetDoc.name,
      date: rescheduleDate,
      time: rescheduleSlot,
      status: 'RESCHEDULED',
      remarks: `Rescheduled in Admin: ${rescheduleReason}${rescheduleNotes ? ' — ' + rescheduleNotes : ''}`
    });

    // Also sync queue entry if matching exists
    const matchingQueue = queue.find(q => q.patientId === apt.patientId || q.id === apt.id);
    if (matchingQueue) {
      const [hStr, mStr] = rescheduleSlot.split(':');
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const formattedTime = `${String(h12).padStart(2, '0')}:${mStr || '00'} ${ampm}`;

      updateQueueEntry(matchingQueue.id, {
        doctorId: targetDoc.id,
        doctorName: targetDoc.name,
        appointmentTime: formattedTime,
        status: 'WAITING'
      });
    }

    addNotification({
      type: 'warning',
      message: `Rescheduled appointment for ${apt.patientName} to ${rescheduleDate} at ${rescheduleSlot} with ${targetDoc.name}.`
    });

    setRescheduleModal({ open: false, appointment: null });
  };

  const handleMarkArrived = (apt: Appointment) => {
    updateAppointment(apt.id, { status: 'ARRIVED' });
    addNotification({
      type: 'success',
      message: `Patient ${apt.patientName} marked as ARRIVED for ${apt.time} appointment.`
    });
  };

  const handleConfirmCancel = () => {
    if (!cancelModal.appointment) return;
    cancelAppointment(cancelModal.appointment.id, cancelReason);
    addNotification({
      type: 'info',
      message: `Appointment for ${cancelModal.appointment.patientName} cancelled: ${cancelReason}.`
    });
    setCancelModal({ open: false, appointment: null });
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === bookForm.patientId) || patients[0];
    const doc = doctors.find(d => d.id === bookForm.doctorId) || doctors[0];

    addAppointment({
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      doctorId: doc.id,
      doctorName: doc.name,
      date: bookForm.date,
      time: bookForm.time,
      visitType: bookForm.visitType,
      status: 'SCHEDULED',
      remarks: bookForm.remarks || 'Booked directly via Superadmin Console'
    });

    addNotification({
      type: 'success',
      message: `Appointment booked for ${pat.firstName} with ${doc.name} on ${bookForm.date} at ${bookForm.time}.`
    });

    setIsBookModalOpen(false);
  };

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
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b5cf6', background: '#F5F3FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #DDD6FE' }}>
              Scheduling Governance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Clinic-Wide Capacity, Master Roster & Holiday Locks</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={26} color="#8b5cf6" /> Appointment Scheduling & Capacity Master
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Direct clinic appointment roster, slot reassignments, doctor slot capacity, and declared holiday closures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, fontSize: '0.86rem' }}
          >
            <Plus size={16} /> Book Appointment
          </button>

          <button
            onClick={() => setIsHolidayModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
              borderRadius: 8, background: '#8b5cf6', color: '#ffffff',
              fontWeight: 600, fontSize: '0.86rem', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
            }}
          >
            <Lock size={15} /> Declare Holiday Lock
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('ROSTER')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
            borderBottom: activeTab === 'ROSTER' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'ROSTER' ? '#8B5CF6' : '#64748B', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <CalendarClock size={16} /> Master Appointments Roster ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('CAPACITY')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
            borderBottom: activeTab === 'CAPACITY' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'CAPACITY' ? '#8B5CF6' : '#64748B', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Clock size={16} /> Physician Capacity Matrix
        </button>

        <button
          onClick={() => setActiveTab('HOLIDAYS')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
            borderBottom: activeTab === 'HOLIDAYS' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'HOLIDAYS' ? '#8B5CF6' : '#64748B', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Lock size={16} /> Clinic Holiday Locks ({holidays.length})
        </button>
      </div>

      {/* TAB 1: MASTER APPOINTMENTS ROSTER */}
      {activeTab === 'ROSTER' && (
        <div>
          
          {/* Quick Filters Bar */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
            padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14,
            alignItems: 'center', flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search patient, physician, or visit type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 36, width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Date Filters */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
                <button
                  onClick={() => setSelectedDateFilter('ALL')}
                  className={`btn btn-sm ${selectedDateFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setSelectedDateFilter('TODAY')}
                  className={`btn btn-sm ${selectedDateFilter === 'TODAY' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Today (19 Sep)
                </button>
                <button
                  onClick={() => setSelectedDateFilter('TOMORROW')}
                  className={`btn btn-sm ${selectedDateFilter === 'TOMORROW' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Tomorrow (20 Sep)
                </button>
              </div>

              {/* Doctor filter */}
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem', width: 180 }}
              >
                <option value="ALL">All Consulting Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem', width: 150 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARRIVED">Arrived</option>
                <option value="COMPLETED">Completed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {(searchTerm || selectedDoctor !== 'ALL' || selectedStatus !== 'ALL' || selectedDateFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDoctor('ALL');
                    setSelectedStatus('ALL');
                    setSelectedDateFilter('ALL');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', color: '#64748B' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Appointments Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={16} color="#8B5CF6" /> Confirmed Booking Records ({filteredAppointments.length})
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Full Rescheduling & Arrival Control inside Admin
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Appointment ID</th>
                    <th style={{ padding: '12px 16px' }}>Patient Name</th>
                    <th style={{ padding: '12px 16px' }}>Doctor & Specialty</th>
                    <th style={{ padding: '12px 16px' }}>Date & Slot</th>
                    <th style={{ padding: '12px 16px' }}>Visit Type</th>
                    <th style={{ padding: '12px 16px' }}>Booking Status</th>
                    <th style={{ padding: '12px 16px' }}>Audit Remarks</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Direct Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(apt => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} className="hover:bg-slate-50">
                      
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ fontSize: '0.78rem', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {apt.id}
                        </code>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                          {apt.patientName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                          Patient Ref: {apt.patientId}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>
                          {apt.doctorName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Stethoscope size={13} color="#8B5CF6" />
                          <span>Room: {doctors.find(d => d.id === apt.doctorId)?.room || 'Cabin 1'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                          {apt.date}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#4338CA', fontWeight: 700, marginTop: 2 }}>
                          🕒 {apt.time}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '0.74rem', padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                          background: apt.visitType === 'Procedure' ? '#FDF2F8' : apt.visitType === 'Follow-Up' ? '#EFF6FF' : '#F0FDF4',
                          color: apt.visitType === 'Procedure' ? '#BE185D' : apt.visitType === 'Follow-Up' ? '#1D4ED8' : '#15803D',
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}>
                          {apt.visitType}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                          background: apt.status === 'SCHEDULED' ? '#EFF6FF' : apt.status === 'ARRIVED' ? '#DCFCE7' : apt.status === 'RESCHEDULED' ? '#FEF3C7' : apt.status === 'CANCELLED' ? '#FEE2E2' : '#F1F5F9',
                          color: apt.status === 'SCHEDULED' ? '#1D4ED8' : apt.status === 'ARRIVED' ? '#15803D' : apt.status === 'RESCHEDULED' ? '#B45309' : apt.status === 'CANCELLED' ? '#B91C1C' : '#475569'
                        }}>
                          {apt.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={apt.remarks}>
                          {apt.remarks || 'Standard outpatient booking.'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          
                          {apt.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleMarkArrived(apt)}
                              className="btn btn-success btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Mark Patient Arrived"
                            >
                              <Check size={13} /> Arrived
                            </button>
                          )}

                          {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleOpenReschedule(apt)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#8B5CF6', borderColor: '#DDD6FE', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Reschedule Slot in Admin"
                            >
                              <CalendarClock size={13} /> Reschedule
                            </button>
                          )}

                          {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                            <button
                              onClick={() => setCancelModal({ open: true, appointment: apt })}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#DC2626' }}
                              title="Cancel Appointment"
                            >
                              <X size={13} />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                        <Calendar size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No appointments match current search criteria.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICIAN CAPACITY MATRIX */}
      {activeTab === 'CAPACITY' && (
        <div>
          {/* KPI Stats on Capacity */}
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

          {/* Doctor Capacity Matrix Card */}
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
        </div>
      )}

      {/* TAB 3: CLINIC HOLIDAY LOCKS */}
      {activeTab === 'HOLIDAYS' && (
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
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="btn btn-danger btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Add Holiday Lock
            </button>
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
      )}

      {/* MODAL 1: Reschedule Appointment Directly in Admin */}
      {rescheduleModal.open && rescheduleModal.appointment && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={18} color="#8B5CF6" />
                <h3 className="modal-title">Reschedule Patient Appointment</h3>
              </div>
              <button onClick={() => setRescheduleModal({ open: false, appointment: null })} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Current Booking</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                  {rescheduleModal.appointment.patientName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                  Current Slot: <strong style={{ color: '#DC2626' }}>{rescheduleModal.appointment.date} at {rescheduleModal.appointment.time}</strong> • with {rescheduleModal.appointment.doctorName}
                </div>
              </div>

              {/* Physician Selector */}
              <div className="form-group">
                <label className="form-label required">Reassign Doctor</label>
                <select
                  className="form-select"
                  value={rescheduleDoctorId}
                  onChange={e => setRescheduleDoctorId(e.target.value)}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization} • {d.room})</option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div className="form-group">
                <label className="form-label required">Select New Date</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-09-19')}
                    className={`btn btn-sm ${rescheduleDate === '2026-09-19' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Today (19 Sep)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-09-20')}
                    className={`btn btn-sm ${rescheduleDate === '2026-09-20' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Tomorrow (20 Sep)
                  </button>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: 160 }}
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Slot Grid */}
              <div className="form-group">
                <label className="form-label required">Available Time Slot ({availableRescheduleSlots.length} available)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 160, overflowY: 'auto', padding: 4 }}>
                  {SLOTS.map(slot => {
                    const isAvail = availableRescheduleSlots.includes(slot);
                    const isSel = rescheduleSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => setRescheduleSlot(slot)}
                        style={{
                          padding: '6px 0', fontSize: '0.78rem', borderRadius: 6, fontWeight: 700,
                          background: isSel ? '#8B5CF6' : isAvail ? '#F8FAFC' : '#F1F5F9',
                          color: isSel ? '#FFFFFF' : isAvail ? '#0F172A' : '#94A3B8',
                          border: isSel ? '1.5px solid #8B5CF6' : '1px solid #E2E8F0',
                          cursor: isAvail ? 'pointer' : 'not-allowed',
                          textDecoration: !isAvail ? 'line-through' : 'none'
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label className="form-label required">Reschedule Justification</label>
                <select
                  className="form-select"
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                >
                  <option value="Administrative Schedule Rebalance">Administrative Schedule Rebalance</option>
                  <option value="Patient Requested Change">Patient Requested Date/Time Change</option>
                  <option value="Doctor Emergency / Cabin Overrun">Doctor Emergency / Cabin Overrun</option>
                  <option value="Procedure Room Allocation">Procedure Room Allocation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Internal Admin Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Audit reason for shift..."
                  value={rescheduleNotes}
                  onChange={e => setRescheduleNotes(e.target.value)}
                />
              </div>

            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRescheduleModal({ open: false, appointment: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReschedule}
              >
                <Check size={16} /> Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Cancel Appointment */}
      {cancelModal.open && cancelModal.appointment && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} color="#DC2626" />
                <h3 className="modal-title">Cancel Appointment</h3>
              </div>
              <button onClick={() => setCancelModal({ open: false, appointment: null })} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: '#FFF1F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.78rem', color: '#991B1B' }}>Cancel Booking For:</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#7F1D1D', marginTop: 2 }}>
                  {cancelModal.appointment.patientName} — {cancelModal.appointment.date} at {cancelModal.appointment.time}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Cancellation Reason</label>
                <select
                  className="form-select"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                >
                  <option value="Patient Requested Cancellation">Patient Requested Cancellation</option>
                  <option value="Doctor Unavailable / Leave">Doctor Unavailable / Leave</option>
                  <option value="Patient No-Show">Patient No-Show</option>
                  <option value="Administrative Duplicate">Administrative Duplicate</option>
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCancelModal({ open: false, appointment: null })}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Book Appointment Directly in Admin */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="#8B5CF6" />
                <h3 className="modal-title">Book Outpatient Appointment</h3>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                <div className="form-group">
                  <label className="form-label required">Select Patient</label>
                  <select
                    className="form-select"
                    value={bookForm.patientId}
                    onChange={e => setBookForm(f => ({ ...f, patientId: e.target.value }))}
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.mrdNumber} • {p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Attending Physician</label>
                  <select
                    className="form-select"
                    value={bookForm.doctorId}
                    onChange={e => setBookForm(f => ({ ...f, doctorId: e.target.value }))}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization} • {d.room})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label required">Appointment Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={bookForm.date}
                      onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Slot Time</label>
                    <select
                      className="form-select"
                      value={bookForm.time}
                      onChange={e => setBookForm(f => ({ ...f, time: e.target.value }))}
                    >
                      {SLOTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Visit Type</label>
                  <select
                    className="form-select"
                    value={bookForm.visitType}
                    onChange={e => setBookForm(f => ({ ...f, visitType: e.target.value as any }))}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Booking Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. VIP patient priority booking"
                    value={bookForm.remarks}
                    onChange={e => setBookForm(f => ({ ...f, remarks: e.target.value }))}
                  />
                </div>

              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsBookModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Check size={16} /> Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Declare Holiday Modal */}
      {isHolidayModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 460,
            overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
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
