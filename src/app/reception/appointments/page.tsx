'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarPlus, Calendar, Clock, User, Stethoscope,
  CheckCircle2, Search, ArrowRight, Printer, X, Tag,
  AlertCircle, ChevronRight, Phone, MessageSquare
} from 'lucide-react';
import {
  usePatientStore, useAppointmentStore, useQueueStore, useUIStore, useDoctorLeaveStore, useConsultationStore,
  Patient, Doctor, Appointment, VisitType, SLOTS
} from '@/store';

function AppointmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const { patients, getPatientById } = usePatientStore();
  const { doctors, queue, addToQueue } = useQueueStore();
  const { appointments, addAppointment, updateAppointment, cancelAppointment, getAvailableSlots } = useAppointmentStore();
  const { leaves } = useDoctorLeaveStore();
  const { addNotification } = useUIStore();

  const handleMarkArrived = (apt: Appointment) => {
    router.push('/reception/checkin?patientId=' + apt.patientId + '&appointmentId=' + apt.id);
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'book' | 'upcoming'>('book');

  // Booking Wizard State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || 'doc-1');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  const [visitType, setVisitType] = useState<VisitType>('Consultation');
  const [remarks, setRemarks] = useState('');

  // Booking Confirmation Modal
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  // Cancellation State
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient Requested');

  // Date filter for Upcoming list
  const [filterDate, setFilterDate] = useState<string>('ALL');

  useEffect(() => {
    if (preselectedPatientId) {
      const p = getPatientById(preselectedPatientId);
      if (p) setSelectedPatient(p);
    } else if (!selectedPatient && patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
  }, [preselectedPatientId, patients, getPatientById]);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Check if doctor is on approved leave on selected date (Scenario D)
  const doctorLeaveOnDate = useMemo(() => {
    return leaves.find(
      l => l.doctorId === selectedDoctorId &&
           l.status === 'APPROVED' &&
           selectedDate >= l.startDate &&
           selectedDate <= l.endDate
    );
  }, [leaves, selectedDoctorId, selectedDate]);

  // Available slots for selected doctor and date
  const availableSlots = useMemo(() => {
    return getAvailableSlots(selectedDoctorId, selectedDate);
  }, [selectedDoctorId, selectedDate, getAvailableSlots]);

  // Handle slot selection
  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(selectedSlot)) {
      setSelectedSlot(availableSlots[0]);
    }
  }, [availableSlots, selectedSlot]);

  const morningSlots = SLOTS.filter(s => parseInt(s.split(':')[0]) < 13);
  const afternoonSlots = SLOTS.filter(s => parseInt(s.split(':')[0]) >= 13);

  const handleBook = () => {
    if (!selectedPatient) {
      alert('Please select a patient.');
      return;
    }

    if (doctorLeaveOnDate) {
      alert(`Cannot reserve slot: Dr. ${selectedDoctor.name} is on approved leave (${doctorLeaveOnDate.reason}) on ${selectedDate}.`);
      return;
    }

    const newApt = {
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: selectedDate,
      time: selectedSlot,
      visitType,
      status: 'SCHEDULED' as const,
      remarks: remarks.trim() || undefined,
    };

    addAppointment(newApt);

    addNotification({
      type: 'success',
      message: `Appointment booked for ${selectedPatient.firstName} ${selectedPatient.lastName} on ${selectedDate} at ${selectedSlot}`
    });

    setBookedAppointment({ ...newApt, id: `apt-${Date.now()}` });
  };

  const handleConfirmCancel = () => {
    if (!cancellingApt) return;
    cancelAppointment(cancellingApt.id, cancelReason);
    addNotification({
      type: 'warning',
      message: `Appointment cancelled for ${cancellingApt.patientName}`
    });
    setCancellingApt(null);
  };

  // Filtered appointments for Upcoming tab
  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (filterDate !== 'ALL') {
      list = list.filter(a => a.date === filterDate);
    }
    return list;
  }, [appointments, filterDate]);

  if (!isMounted) {
    return (
      <div className="page-container" style={{ padding: '24px 0', minHeight: '80vh' }}>
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <div style={{ height: 28, width: 340, background: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 16, width: 500, background: '#F1F5F9', borderRadius: 4 }} />
          </div>
        </div>
        <div className="card" style={{ padding: 48, textAlign: 'center', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={26} style={{ color: 'var(--primary)', opacity: 0.7 }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Loading appointment schedule...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Synchronizing time slot calendar and live patient queue...</div>
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
          <h1 className="page-title">Appointment Scheduling & Calendar</h1>
          <p className="page-subtitle">2-step smart booking wizard: slot auto-availability calculation, instant WhatsApp/SMS notification preview, and reschedule management.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActiveTab('book')}
            className={`btn ${activeTab === 'book' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <CalendarPlus size={16} /> Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
            suppressHydrationWarning
          >
            <Calendar size={16} /> Upcoming Schedule ({appointments.length})
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Wizard Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Step 1: Patient Selection */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <User size={18} color="var(--primary)" />
                  Step 1: Patient Details
                </span>
                <Link href="/reception/register">
                  <button className="btn btn-ghost btn-sm">+ New Patient</button>
                </Link>
              </div>

              <div className="card-body">
                {/* Search existing */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Search patient by Name, MRD #, or Phone..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                  />
                  {patientSearch && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)',
                      zIndex: 100, maxHeight: 200, overflowY: 'auto'
                    }}>
                      {patients.filter(p =>
                        p.firstName.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        p.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        p.mrdNumber.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        p.mobile.includes(patientSearch)
                      ).map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientSearch('');
                          }}
                          style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                        >
                          <span style={{ fontWeight: 700 }}>{p.firstName} {p.lastName} ({p.mrdNumber})</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.mobile}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected patient preview */}
                {selectedPatient && (
                  <div style={{
                    padding: 14, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-md" style={{
                        background: selectedPatient.gender === 'F' ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'linear-gradient(135deg, #6366F1, #3B82F6)'
                      }}>
                        {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {selectedPatient.mrdNumber} • {selectedPatient.age}Y/{selectedPatient.gender} • Mob: {selectedPatient.mobile}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-success">Selected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Doctor, Date & Time Slots */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Clock size={18} color="var(--primary)" />
                  Step 2: Doctor & Time Slot
                </span>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Doctor Selection Grid */}
                <div className="form-group">
                  <label className="form-label required">Select Doctor</label>
                  <div className="doctor-selection-grid">
                    {doctors.map(doc => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          style={{
                            padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                            display: 'flex', alignItems: 'center', gap: 10, transition: 'var(--transition)'
                          }}
                        >
                          <div className="avatar avatar-md" style={{ background: doc.avatarColor }}>
                            {doc.initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{doc.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.specialization} • {doc.room}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date Picker */}
                <div className="form-group">
                  <label className="form-label required">Appointment Date</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDate('2026-09-19')}
                      className={`btn ${selectedDate === '2026-09-19' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      Today (19 Sep)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate('2026-09-20')}
                      className={`btn ${selectedDate === '2026-09-20' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      Tomorrow (20 Sep)
                    </button>
                    <input
                      type="date"
                      className="form-input"
                      style={{ width: 170 }}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Doctor Leave Warning Banner (Scenario D) */}
                {doctorLeaveOnDate && (
                  <div style={{
                    padding: '14px 16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    color: '#B91C1C'
                  }}>
                    <AlertCircle size={20} className="shrink-0" style={{ color: '#DC2626', marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        🚫 Dr. {selectedDoctor.name} is on Approved Leave
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, color: '#DC2626', lineHeight: 1.5 }}>
                        Reason: <strong>{doctorLeaveOnDate.reason}</strong> ({doctorLeaveOnDate.type})<br />
                        Leave Period: <strong>{doctorLeaveOnDate.startDate}</strong> to <strong>{doctorLeaveOnDate.endDate}</strong><br />
                        Online appointment slot reservation is disabled for this physician on this date to prevent patient double-booking.
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Time Slot Grid */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label required" style={{ margin: 0 }} suppressHydrationWarning>
                      Available Time Slots ({availableSlots.length} available)
                    </label>
                    {!doctorLeaveOnDate && (
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} /> Selected
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-muted)', border: '1px solid var(--border)' }} /> Available
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Booked
                        </span>
                      </div>
                    )}
                  </div>

                  {doctorLeaveOnDate ? (
                    <div style={{
                      padding: 24, textAlign: 'center', background: 'var(--bg-muted)',
                      borderRadius: 'var(--radius-md)', border: '1px dashed rgba(239, 68, 68, 0.4)',
                      color: 'var(--text-muted)'
                    }}>
                      <Clock size={28} style={{ margin: '0 auto 8px', color: '#EF4444' }} />
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                        All Slots Blocked — Doctor on Approved Leave
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                        Dr. {selectedDoctor.name} is away on {selectedDate}. Please select another date or choose a different consulting doctor.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Morning Slots */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Morning Session (09:00 AM – 12:00 PM)
                      </div>
                      <div className="slots-grid" style={{ marginBottom: 14 }}>
                        {morningSlots.map(slot => {
                          const isAvail = availableSlots.includes(slot);
                          const isSel = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!isAvail}
                              onClick={() => setSelectedSlot(slot)}
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

                      {/* Afternoon Slots */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Afternoon Session (02:00 PM – 05:00 PM)
                      </div>
                      <div className="slots-grid">
                        {afternoonSlots.map(slot => {
                          const isAvail = availableSlots.includes(slot);
                          const isSel = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!isAvail}
                              onClick={() => setSelectedSlot(slot)}
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
                    </>
                  )}
                </div>

                {/* Visit Type & Reason */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label required">Visit Type</label>
                    <select
                      className="form-select"
                      value={visitType}
                      onChange={e => setVisitType(e.target.value as VisitType)}
                    >
                      <option value="Consultation">Consultation (₹500)</option>
                      <option value="Follow-Up">Follow-Up (₹300)</option>
                      <option value="Procedure">Procedure (₹1500)</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Chief Complaint / Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Skin rash, Joint pain"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={!!doctorLeaveOnDate}
                  onClick={handleBook}
                  className={`btn ${doctorLeaveOnDate ? 'btn-ghost' : 'btn-primary'} btn-lg`}
                  style={{
                    justifyContent: 'center', padding: '13px 20px', fontSize: 15,
                    cursor: doctorLeaveOnDate ? 'not-allowed' : 'pointer',
                    opacity: doctorLeaveOnDate ? 0.6 : 1,
                    fontWeight: 800
                  }}
                  title={doctorLeaveOnDate ? `Doctor on approved leave (${doctorLeaveOnDate.reason})` : undefined}
                >
                  <CalendarPlus size={18} />
                  {doctorLeaveOnDate ? 'Doctor on Approved Leave (Booking Locked)' : 'Submit & Confirm Appointment Slot'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Appointment Slip Preview */}
          <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 24px)' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Calendar size={16} color="var(--primary)" />
                  Appointment Booking Summary
                </span>
                <span className="badge badge-info">Slip Preview</span>
              </div>

              <div className="card-body">
                <div style={{
                  background: '#FFFFFF',
                  border: '2px dashed #94A3B8',
                  borderRadius: 12,
                  padding: 18,
                  fontFamily: 'monospace',
                  color: '#0F172A',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 12 }}>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>MEDFLOW OUTPATIENT CLINIC</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Appointment Booking Voucher</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Patient Name:</span>
                      <span style={{ fontWeight: 800 }}>
                        {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>MRD Number:</span>
                      <span style={{ fontWeight: 700, color: '#6366F1' }}>
                        {selectedPatient?.mrdNumber || '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Doctor:</span>
                      <span style={{ fontWeight: 700 }}>{selectedDoctor.name}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Department:</span>
                      <span>{selectedDoctor.specialization} ({selectedDoctor.room})</span>
                    </div>

                    <div style={{ margin: '8px 0', padding: '10px 0', borderTop: '1px dashed #CBD5E1', borderBottom: '1px dashed #CBD5E1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748B' }}>Scheduled Slot:</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: doctorLeaveOnDate ? '#DC2626' : '#059669' }}>
                          {doctorLeaveOnDate ? 'BLOCKED (ON LEAVE)' : `${selectedDate} at ${selectedSlot}`}
                        </span>
                      </div>
                      {doctorLeaveOnDate && (
                        <div style={{ fontSize: 10, color: '#DC2626', marginTop: 4, fontWeight: 600 }}>
                          ⚠ {doctorLeaveOnDate.reason} ({doctorLeaveOnDate.startDate} to {doctorLeaveOnDate.endDate})
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ color: '#64748B' }}>Visit Type:</span>
                        <span style={{ fontWeight: 700 }}>{visitType}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Estimated Fee:</span>
                      <span style={{ fontWeight: 800 }}>
                        ₹{visitType === 'Consultation' ? 500 : visitType === 'Follow-Up' ? 300 : visitType === 'Procedure' ? 1500 : 0}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 9, color: '#64748B', textAlign: 'center' }}>
                    * Please arrive 15 minutes prior to scheduled slot for vitals triage.
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Printer size={15} /> Print Appointment Slip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upcoming Appointments Tab */
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={18} color="var(--primary)" />
              Scheduled OPD Appointments
            </span>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setFilterDate('ALL')}
                className={`btn btn-sm ${filterDate === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              >
                All Dates
              </button>
              <button
                onClick={() => setFilterDate('2026-09-19')}
                className={`btn btn-sm ${filterDate === '2026-09-19' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Today (19 Sep)
              </button>
              <button
                onClick={() => setFilterDate('2026-09-20')}
                className={`btn btn-sm ${filterDate === '2026-09-20' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Tomorrow (20 Sep)
              </button>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient Name</th>
                  <th>Doctor & Room</th>
                  <th>Visit Type</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <p style={{ fontWeight: 600 }}>No scheduled appointments found for this filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                          {apt.time}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{apt.date}</div>
                      </td>

                      <td>
                        <Link href={`/reception/patients/${apt.patientId}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {apt.patientName}
                        </Link>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.doctorName}</div>
                      </td>

                      <td>
                        <span className="badge badge-purple">{apt.visitType}</span>
                      </td>

                      <td>
                        <span className={`badge ${
                          apt.status === 'SCHEDULED' ? 'badge-primary' :
                          apt.status === 'ARRIVED' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {apt.status}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{apt.remarks || '—'}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {apt.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => handleMarkArrived(apt)}
                                className="btn btn-success btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, padding: '4px 10px' }}
                                title="Mark Patient Arrived & Enqueue"
                              >
                                <CheckCircle2 size={13} /> Arrived
                              </button>

                              <Link href={`/reception/checkin?patientId=${apt.patientId}`} title="Check-In Patient Now">
                                <button className="btn btn-outline btn-sm">
                                  Check In
                                </button>
                              </Link>

                              <Link href={`/reception/appointments/reschedule/${apt.id}`} title="Reschedule Slot">
                                <button className="btn btn-ghost btn-sm">
                                  Reschedule
                                </button>
                              </Link>

                              <button
                                onClick={() => setCancellingApt(apt)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)' }}
                                title="Cancel Appointment"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {apt.status === 'ARRIVED' && (
                            <Link href="/reception/queue">
                              <span className="badge badge-success" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={12} /> In Queue →
                              </span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      {bookedAppointment && (
        <div className="modal-overlay" onClick={() => setBookedAppointment(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> Appointment Confirmed!
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setBookedAppointment(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {bookedAppointment.patientName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Confirmed with {bookedAppointment.doctorName}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: 'var(--primary)',
                  margin: '14px 0', background: 'var(--primary-light)', padding: '10px', borderRadius: 8
                }}>
                  {bookedAppointment.date} at {bookedAppointment.time}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  An automated SMS and WhatsApp confirmation voucher has been simulated to the patient's phone.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => setBookedAppointment(null)}>
                Book Another
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setBookedAppointment(null);
                    setActiveTab('upcoming');
                  }}
                >
                  <Calendar size={15} /> View in Upcoming Schedule ➔
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={15} /> Print Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      {cancellingApt && (
        <div className="modal-overlay" onClick={() => setCancellingApt(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} /> Cancel Appointment
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setCancellingApt(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                Cancel scheduled visit for <strong>{cancellingApt.patientName}</strong> with {cancellingApt.doctorName} on {cancellingApt.date} at {cancellingApt.time}?
              </p>

              <div className="form-group">
                <label className="form-label required">Reason for Cancellation</label>
                <select
                  className="form-select"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                >
                  <option value="Patient Requested">Patient Requested / Cannot Attend</option>
                  <option value="Doctor Unavailable">Doctor Emergency Leave</option>
                  <option value="Rescheduled to Future Date">Rescheduled to Future Date</option>
                  <option value="Duplicate Booking">Duplicate Booking</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCancellingApt(null)}>
                Keep Appointment
              </button>
              <button className="btn btn-danger" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="card"><div className="card-body">Loading appointments...</div></div></div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
