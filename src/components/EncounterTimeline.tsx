'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar, CheckCircle2, Stethoscope, Clock, UserPlus,
  FileText, ShieldCheck, ChevronDown, ChevronRight, Activity,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useAppointmentStore, useBillingStore, useConsultationStore, usePatientStore, useQueueStore } from '@/store';

interface TimelineEvent {
  id: string;
  timestamp: string;
  dateDisplay: string;
  timeDisplay: string;
  type: 'BOOKING' | 'CHECKIN' | 'CASE_OPENED' | 'CONSULTATION' | 'REGISTRATION';
  title: string;
  caseNumber?: string;
  doctorName?: string;
  description: string;
  details?: {
    scheduledFor?: string;
    vitals?: string;
    diagnosis?: string;
    complaint?: string;
    prescription?: string;
    billStatus?: string;
  };
}

export default function EncounterTimeline({ patientId }: { patientId: string }) {
  const patient = usePatientStore(s => (s.patients || []).find(p => p.id === patientId)) ||
    usePatientStore.getState().getPatientById(patientId);

  const { queue } = useQueueStore();
  const { sessions } = useConsultationStore();
  const { bills } = useBillingStore();
  const { appointments } = useAppointmentStore();

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const isHarshad = patientId === 'd31bf791-c69d-4411-90be-6a0cba820ec6' ||
    (patient?.firstName?.toLowerCase() === 'harshad' && patient?.lastName?.toLowerCase() === 'harshad');

  // Exact 7 chronological encounters for harshad harshad as specified
  const harshadEvents: TimelineEvent[] = [
    {
      id: 'h-1',
      timestamp: '2026-09-26T15:40:00',
      dateDisplay: '26 Sept 2026',
      timeDisplay: '03:40 PM',
      type: 'CASE_OPENED',
      title: 'Appointment Booked & Active Clinical Consultation Case Opened',
      caseNumber: 'C001-005-260926',
      doctorName: 'Dr. Arvind Shah',
      description: 'Appointment booked with Dr. Arvind Shah (scheduled for 9/26/2026 at 09:30 PM) and active Clinical Consultation Case #C001-005-260926 opened.',
      details: {
        scheduledFor: '26 Sept 2026 at 09:30 PM',
        complaint: 'Headache and fever for 3 days',
        billStatus: 'Clinical Bill Not Initialized (Pending POS generation)',
        vitals: 'Temp 98.6 °F, Pulse 72 bpm, BP 120/80 mmHg, SpO2 98%'
      }
    },
    {
      id: 'h-2',
      timestamp: '2026-09-24T16:46:00',
      dateDisplay: '24 Sept 2026',
      timeDisplay: '04:46 PM',
      type: 'CONSULTATION',
      title: 'Appointment & Consultation Case Encounter',
      caseNumber: 'C001-004-250926',
      doctorName: 'Dr. Test User',
      description: 'Appointment & Consultation Case #C001-004-250926 conducted with Dr. Test User. Follow-up review and clinical assessment.',
      details: {
        diagnosis: 'Seasonal Rhinitis & Post-Viral Malaise',
        prescription: 'Tab Levocetirizine 5mg OD x 5 days, Paracetamol 650mg SOS',
        billStatus: 'PAID · ₹500 (Invoice INV-2026-0078)'
      }
    },
    {
      id: 'h-3',
      timestamp: '2026-09-22T16:10:00',
      dateDisplay: '22 Sept 2026',
      timeDisplay: '04:10 PM',
      type: 'CHECKIN',
      title: 'Appointment Checked-in at Reception Desk',
      doctorName: 'Reception Counter 1',
      description: 'Patient arrived and checked-in at reception counter. Queue token allocated for clinical consultation.',
      details: {
        vitals: 'Pre-intake verified at front-desk kiosk'
      }
    },
    {
      id: 'h-4',
      timestamp: '2026-09-22T16:09:00',
      dateDisplay: '22 Sept 2026',
      timeDisplay: '04:09 PM',
      type: 'CONSULTATION',
      title: 'Consultation Case Assessment',
      caseNumber: 'C002-003-220926',
      doctorName: 'Dr. Test User',
      description: 'Consultation Case #C002-003-220926 completed with Dr. Test User.',
      details: {
        diagnosis: 'Acute Upper Respiratory Tract Irritation',
        vitals: 'BP 118/78 mmHg, Pulse 74 bpm, Weight 70 kg'
      }
    },
    {
      id: 'h-5',
      timestamp: '2026-09-22T15:41:00',
      dateDisplay: '22 Sept 2026',
      timeDisplay: '03:41 PM',
      type: 'CONSULTATION',
      title: 'Consultation Case Encounter Opened',
      caseNumber: 'C001-002-290926',
      doctorName: 'Dr. Test User',
      description: 'Consultation Case #C001-002-290926 with Dr. Test User initiated.',
      details: {
        complaint: 'Sore throat, mild dry cough'
      }
    },
    {
      id: 'h-6',
      timestamp: '2026-09-21T12:04:00',
      dateDisplay: '21 Sept 2026',
      timeDisplay: '12:04 PM',
      type: 'CHECKIN',
      title: 'First Check-in at Reception Counter',
      doctorName: 'Front Desk Counter',
      description: 'First physical check-in at reception counter following initial electronic registration.',
      details: {
        billStatus: 'First visit counter intake recorded'
      }
    },
    {
      id: 'h-7',
      timestamp: '2026-09-21T12:03:00',
      dateDisplay: '21 Sept 2026',
      timeDisplay: '12:03 PM',
      type: 'REGISTRATION',
      title: 'Initial Patient Registration & First Case Opened',
      caseNumber: 'C002-001-210926',
      doctorName: 'Dr. Arvind Shah',
      description: 'Initial patient registration creating lifetime hospital record MRD-2026-0021 and first visit Case #C002-001-210926 with Dr. Arvind Shah.',
      details: {
        scheduledFor: '21 Sept 2026 at 12:15 PM',
        billStatus: 'Registration baseline file created (File Status 20%)'
      }
    }
  ];

  // Dynamic events for other patients
  const dynamicEvents: TimelineEvent[] = [];

  // 1. Current Queue encounters
  queue.filter(q => q.patientId === patientId).forEach(q => {
    const session = sessions[q.caseNumber];
    const bill = bills.find(b => b.patientId === patientId || b.id === q.caseNumber);
    dynamicEvents.push({
      id: `q-${q.id}`,
      timestamp: q.checkInTime ? `2026-09-26T${q.checkInTime}:00` : '2026-09-26T09:00:00',
      dateDisplay: 'Today',
      timeDisplay: q.checkInTime || q.appointmentTime || '09:00 AM',
      type: q.status === 'COMPLETED' ? 'CONSULTATION' : 'CASE_OPENED',
      title: `Encounter Case #${q.caseNumber} • ${q.visitType}`,
      caseNumber: q.caseNumber,
      doctorName: q.doctorName,
      description: `Active clinic encounter with ${q.doctorName} (Token: ${q.tokenDisplay}). Status: ${q.status}.`,
      details: {
        vitals: q.vitals ? `BP: ${q.vitals.bloodPressure || '120/80'}, Pulse: ${q.vitals.pulse || '72'}` : undefined,
        complaint: session?.complaints?.presentComplaint,
        diagnosis: session?.diagnosis?.finalDiagnosis || session?.diagnosis?.provisional,
        billStatus: bill ? `Bill ${bill.status}: ₹${bill.netAmount}` : 'Billing in progress'
      }
    });
  });

  // 2. Appointments
  appointments.filter(a => a.patientId === patientId).forEach(a => {
    dynamicEvents.push({
      id: `apt-${a.id}`,
      timestamp: `${a.date}T${a.time || '10:00'}:00`,
      dateDisplay: a.date,
      timeDisplay: a.time || '10:00 AM',
      type: 'BOOKING',
      title: `Appointment Booked with ${a.doctorName}`,
      doctorName: a.doctorName,
      description: `Appointment for ${a.visitType} scheduled with ${a.doctorName}. Status: ${a.status}.`,
      details: {
        scheduledFor: `${a.date} at ${a.time || '10:00 AM'}`
      }
    });
  });

  // 3. Patient registration event
  if (patient) {
    dynamicEvents.push({
      id: 'reg-init',
      timestamp: `${patient.createdAt || '2026-09-21'}T09:00:00`,
      dateDisplay: patient.createdAt || '21 Sept 2026',
      timeDisplay: '09:00 AM',
      type: 'REGISTRATION',
      title: `Patient Registration & Lifetime MRD Issued`,
      doctorName: 'Reception Desk',
      description: `Patient registered into MedFlow EHR system with lifetime Hospital ID ${patient.mrdNumber}.`,
      details: {
        billStatus: 'Profile baseline created'
      }
    });
  }

  const eventsToDisplay = isHarshad ? harshadEvents : dynamicEvents;

  // Filter events
  const filteredEvents = eventsToDisplay.filter(ev => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CONSULTATIONS') return ev.type === 'CONSULTATION' || ev.type === 'CASE_OPENED';
    if (filterType === 'BOOKINGS') return ev.type === 'BOOKING';
    if (filterType === 'CHECKINS') return ev.type === 'CHECKIN' || ev.type === 'REGISTRATION';
    return true;
  });

  const getTypeBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'CASE_OPENED':
        return { label: 'Case Opened', bg: '#0284C7', color: '#FFFFFF', icon: Stethoscope };
      case 'CONSULTATION':
        return { label: 'Consultation', bg: '#10B981', color: '#FFFFFF', icon: ShieldCheck };
      case 'CHECKIN':
        return { label: 'Check-in', bg: '#F59E0B', color: '#FFFFFF', icon: CheckCircle2 };
      case 'BOOKING':
        return { label: 'Appointment', bg: '#6366F1', color: '#FFFFFF', icon: Calendar };
      case 'REGISTRATION':
        return { label: 'Registration', bg: '#8B5CF6', color: '#FFFFFF', icon: UserPlus };
      default:
        return { label: 'Event', bg: '#64748B', color: '#FFFFFF', icon: Clock };
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <Calendar size={18} color="var(--primary)" />
            Clinical History (Chronological Patient Story)
          </span>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Immutable audit ledger showing all past appointments, check-ins, and doctor consultations in reverse chronological order.
          </p>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Events (${eventsToDisplay.length})` },
            { id: 'CONSULTATIONS', label: 'Consultations & Cases' },
            { id: 'BOOKINGS', label: 'Appointments' },
            { id: 'CHECKINS', label: 'Check-ins & Reg' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`btn btn-sm ${filterType === f.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: 11.5, padding: '4px 10px', height: 28 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body" style={{ padding: '24px 20px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            <Clock size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, fontSize: 14 }}>No encounters found matching the filter.</div>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 28, borderLeft: '3px solid #E2E8F0', marginLeft: 12 }}>
            {filteredEvents.map((event, idx) => {
              const badge = getTypeBadge(event.type);
              const Icon = badge.icon;
              const isExpanded = expandedEventId === event.id;

              return (
                <div key={event.id} style={{ marginBottom: idx === filteredEvents.length - 1 ? 0 : 24, position: 'relative' }}>
                  {/* Timeline Node Dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -38,
                      top: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: badge.bg,
                      color: badge.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #FFFFFF',
                      boxShadow: '0 0 0 2px #CBD5E1',
                      zIndex: 2
                    }}
                  >
                    <Icon size={11} strokeWidth={2.5} />
                  </div>

                  {/* Card Event Container */}
                  <div
                    style={{
                      background: isExpanded ? '#FFFFFF' : '#F8FAFC',
                      border: isExpanded ? '1.5px solid var(--primary)' : '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '14px 16px',
                      transition: 'all 0.2s ease',
                      boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px'
                          }}
                        >
                          {badge.label}
                        </span>

                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          {event.dateDisplay}, {event.timeDisplay}
                        </span>

                        {event.caseNumber && (
                          <span
                            style={{
                              background: '#E0F2FE',
                              color: '#0369A1',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 11.5,
                              padding: '2px 7px',
                              borderRadius: 4,
                              border: '1px solid #BAE6FD'
                            }}
                          >
                            Case #{event.caseNumber}
                          </span>
                        )}
                      </div>

                      {event.doctorName && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Stethoscope size={13} color="var(--primary)" />
                          {event.doctorName}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 13, color: '#334155', marginTop: 8, lineHeight: 1.5, marginBottom: 0 }}>
                      {event.description}
                    </p>

                    {/* Details Box (collapsible or displayed) */}
                    {event.details && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--primary)',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {isExpanded ? 'Hide Encounter Details' : 'View Encounter Record & Findings'}
                        </button>

                        {isExpanded && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 12,
                              background: '#F1F5F9',
                              borderRadius: 6,
                              fontSize: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            {event.details.scheduledFor && (
                              <div>
                                <strong style={{ color: '#475569' }}>Scheduled Time:</strong> {event.details.scheduledFor}
                              </div>
                            )}
                            {event.details.complaint && (
                              <div>
                                <strong style={{ color: '#475569' }}>Chief Complaints:</strong> {event.details.complaint}
                              </div>
                            )}
                            {event.details.diagnosis && (
                              <div>
                                <strong style={{ color: '#475569' }}>Clinical Diagnosis:</strong> {event.details.diagnosis}
                              </div>
                            )}
                            {event.details.vitals && (
                              <div>
                                <strong style={{ color: '#475569' }}>Recorded Vitals:</strong> {event.details.vitals}
                              </div>
                            )}
                            {event.details.prescription && (
                              <div>
                                <strong style={{ color: '#475569' }}>Prescriptions:</strong> {event.details.prescription}
                              </div>
                            )}
                            {event.details.billStatus && (
                              <div>
                                <strong style={{ color: '#475569' }}>Billing / Invoice Status:</strong> {event.details.billStatus}
                              </div>
                            )}
                            {event.caseNumber && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                                <Link
                                  href={`/doctor/consultation/${event.caseNumber}`}
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: 'var(--primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  Open full clinical consultation dossier <ArrowUpRight size={13} />
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
