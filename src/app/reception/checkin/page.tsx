'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SquareCheckBig, User, Search, Stethoscope, Clock,
  CreditCard, Activity, CheckCircle2, AlertCircle, Heart,
  Printer, ArrowRight, ShieldAlert, Sparkles, Tag, X, QrCode,
  Users, UserPlus, RotateCcw, Check, ChevronRight, FileText
} from 'lucide-react';
import {
  usePatientStore, useQueueStore, useBillingStore, useUIStore, useAdminStore, useAppointmentStore, PATIENTS,
  type Patient, type Doctor, type VisitType, type BillingStatus, type QueueEntry, type PaymentMode
} from '@/store';
import { checkIn, type Tender } from '@/store/workflow';
import { atomic } from '@/store/persistence';
import PaymentModal from '@/components/PaymentModal';

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedAppointmentId = searchParams.get('appointmentId');

  const { patients, getPatientById } = usePatientStore();
  const { queue, doctors } = useQueueStore();
  const { addBill } = useBillingStore();
  const { addNotification } = useUIStore();
  const { settings } = useAdminStore();
  const { appointments } = useAppointmentStore();

  const requestRef = useRef(crypto.randomUUID());
  const lockRef = useRef(false);

  // Selected Patient State with reliable initial patient fallback
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    if (preselectedPatientId) {
      return getPatientById(preselectedPatientId) || patients.find(p => p.id === preselectedPatientId) || null;
    }
    return patients[0] || PATIENTS[0] || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Check-In Form Fields
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || 'doc-1');
  const [visitType, setVisitType] = useState<VisitType>('Consultation');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(preselectedAppointmentId || '');

  // Billing Options
  const [feeAmount, setFeeAmount] = useState<number>(500);
  const [billingChoice, setBillingChoice] = useState<'PAY_NOW' | 'PAY_LATER' | 'FOC'>('PAY_NOW');
  const [focReason, setFocReason] = useState('Doctor Courtesy');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProvider, setPaymentProvider] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Vitals State
  const [recordVitals, setRecordVitals] = useState(true);
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState('76');
  const [temp, setTemp] = useState('98.6');
  const [weight, setWeight] = useState('68');
  const [spo2, setSpo2] = useState('99');

  // Complaints State
  const [recordComplaints, setRecordComplaints] = useState(true);
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>(['Fever']);
  const [complaintNotes, setComplaintNotes] = useState('');

  // Generated Token Receipt Modal State
  const [generatedToken, setGeneratedToken] = useState<{
    token: string;
    caseNumber: string;
    patient: Patient;
    doctor: Doctor;
    time: string;
    queueAhead: number;
    billingStatus: BillingStatus;
  } | null>(null);

  const COMPLAINT_TAGS = [
    'Fever', 'Cough & Cold', 'Headache', 'Severe Pain', 'Skin Rash',
    'Abdominal Cramp', 'Dizziness', 'Follow-Up Review', 'Routine Health Check'
  ];

  // Auto-select if patientId passed via query string or fallback
  useEffect(() => {
    if (preselectedPatientId) {
      const p = getPatientById(preselectedPatientId) || patients.find(x => x.id === preselectedPatientId);
      if (p) setSelectedPatient(p);
    } else if (!selectedPatient) {
      const defaultPat = patients[0] || PATIENTS[0];
      if (defaultPat) setSelectedPatient(defaultPat);
    }
  }, [preselectedPatientId, patients, selectedPatient, getPatientById]);

  // Adjust fee based on visit type or admin settings
  useEffect(() => {
    if (visitType === 'Follow-Up') {
      setFeeAmount(settings?.followUpFee ?? 300);
    } else if (visitType === 'Consultation') {
      setFeeAmount(settings?.consultationFee ?? 500);
    } else if (visitType === 'Procedure') {
      setFeeAmount(1500);
    } else if (visitType === 'Emergency') {
      setFeeAmount(800);
    } else if (visitType === 'MR Visit') {
      setFeeAmount(0);
    }
  }, [visitType, settings]);

  const toggleComplaint = (tag: string) => {
    setSelectedComplaints(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Doctor waiting count
  const doctorWaitingCount = queue.filter(
    q => q.doctorId === selectedDoctor.id && (q.status === 'WAITING' || q.status === 'CALLING')
  ).length;

  const handleGenerateToken = () => {
    if (!selectedPatient) {
      alert('Please select or search a patient.');
      return;
    }

    if (billingChoice === 'PAY_NOW' && !paymentDone && feeAmount > 0 && paymentMode === 'UPI') {
      setShowPaymentModal(true);
      return;
    }

    executeCheckIn();
  };

  const executeCheckIn = () => {
    const effectivePatient = selectedPatient || patients[0] || PATIENTS[0];
    if (!effectivePatient) return;
    if (lockRef.current) return;
    lockRef.current = true;

    try {
      // Generate Encounter Case ID with 'C' prefix for clinical consistency
      const tokenIndex = queue.length + 1;
      const tokenCode = `C${String(tokenIndex).padStart(3, '0')}`;
      const todayFormatted = new Date().toISOString().slice(0, 10).replaceAll('-', '');
      const caseNumber = `${tokenCode}-001-${todayFormatted}`;
      const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      let finalBilling: BillingStatus = 'PENDING';
      if (billingChoice === 'PAY_NOW' || feeAmount === 0) finalBilling = 'PAID';
      if (billingChoice === 'FOC') finalBilling = 'FOC';

      const tenders: Tender[] = (billingChoice === 'PAY_NOW' && feeAmount > 0) ? [{
        amount: feeAmount,
        mode: paymentMode,
        reference: paymentReference || `REC-${Date.now().toString().slice(-6)}`,
        provider: paymentProvider || (paymentMode === 'UPI' ? 'BHIM-UPI' : paymentMode === 'CARD' ? 'HDFC-POS' : 'Cash Counter')
      }] : [];

      const newEntry: Omit<QueueEntry, 'id'> = {
        caseNumber,
        tokenDisplay: tokenCode,
        patientId: effectivePatient.id,
        patientName: `${effectivePatient.firstName} ${effectivePatient.lastName}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        visitType,
        appointmentTime: checkInTime,
        checkInTime,
        age: effectivePatient.age,
        gender: effectivePatient.gender,
        city: effectivePatient.city || 'Surat',
        billingStatus: finalBilling,
        status: 'WAITING',
        stage: 'NURSING',
        vitalsRecorded: recordVitals,
        complaintsRecorded: recordComplaints,
        complaints: recordComplaints ? selectedComplaints : undefined,
        complaintNotes: recordComplaints ? (complaintNotes.trim() || selectedComplaints.join(', ')) : undefined,
        isFoc: billingChoice === 'FOC',
        consultationFee: feeAmount,
        vitals: recordVitals ? {
          temperature: parseFloat(temp) || 98.6,
          pulse: parseInt(pulse) || 76,
          bloodPressure: bp || '120/80',
          weight: parseFloat(weight) || 68,
          spo2: parseInt(spo2) || 99,
          recordedAt: checkInTime,
          recordedBy: 'Reception Desk'
        } : undefined
      };

      // Atomic checkIn handles addToQueue, generateBill, and payment recording
      atomic(() => {
        checkIn(newEntry, tenders, requestRef.current);
        if (selectedAppointmentId) {
          useAppointmentStore.getState().updateAppointment(selectedAppointmentId, { status: 'ARRIVED' });
        }
      });

      addNotification({
        type: 'info',
        message: `Checked in: ${effectivePatient.firstName} ${effectivePatient.lastName} → Token ${tokenCode} (${selectedDoctor.name})`
      });

      setGeneratedToken({
        token: tokenCode,
        caseNumber,
        patient: effectivePatient,
        doctor: selectedDoctor,
        time: checkInTime,
        queueAhead: doctorWaitingCount,
        billingStatus: finalBilling
      });
    } catch (err: any) {
      console.error('CHECKIN_ERROR_DETAILS:', err?.message, err?.stack || err);
      alert(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      lockRef.current = false;
    }
  };

  // Filtered patients for dropdown search
  const searchResults = searchQuery.trim()
    ? patients.filter(p =>
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mobile.includes(searchQuery)
    )
    : [];

  return (
    <div className="page-container" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Breadcrumb & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          <span style={{ padding: '3px 8px', background: 'var(--primary-light)', borderRadius: 6 }}>FRONT DESK RECEPTION</span>
          <span style={{ color: 'var(--text-disabled)' }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>RAPID CHECK-IN COUNTER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          OPD Queue Engine Synchronized
        </div>
      </div>

      {/* Main Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 26, fontWeight: 800 }}>
            Walk-In Management & Check-In Counter
          </h1>
          <p className="page-subtitle" style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            30-second rapid intake: select patient, assign consulting doctor, verify consultation fee, record vitals, and dispense queue token.
          </p>
        </div>
        <Link href="/reception/register">
          <button className="btn btn-outline" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: '#FFF' }}>
            <UserPlus size={16} /> + Register New Patient
          </button>
        </Link>
      </div>

      {/* Live KPIs Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Cabins</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>{doctors.length} Doctors on Shift</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Waiting Queue</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>
              {queue.filter(q => q.status === 'WAITING').length} Patients Waiting
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Wait Time</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>~12 Mins / Patient</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consultation Fee</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>₹{feeAmount}.00</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Patient & Doctor Setup + Vitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Patient Selector Card */}
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <User size={17} />
                </div>
                1. Patient Identification & Selection
              </span>
              <Link href="/reception/register">
                <button className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  + Register New
                </button>
              </Link>
            </div>

            <div className="card-body" style={{ padding: 20 }}>
              {/* Search Bar with live autocomplete */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40, height: 44, fontWeight: 600 }}
                  placeholder="Search existing patient by Name, MRD #, or Mobile..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                />

                {/* Dropdown list */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: '#FFFFFF', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    zIndex: 200, maxHeight: 260, overflowY: 'auto'
                  }}>
                    {searchResults.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s ease'
                        }}
                        className="hover:bg-slate-50"
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>
                            {p.firstName} {p.lastName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>
                            MRD: {p.mrdNumber}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                          <div>{p.age} Yrs • {p.gender === 'M' ? 'Male' : 'Female'}</div>
                          <div style={{ fontWeight: 600 }}>Mob: {p.mobile}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Patient Banner */}
              {selectedPatient ? (
                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.05))',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid rgba(99,102,241,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="avatar avatar-md" style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: selectedPatient.gender === 'F' ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'linear-gradient(135deg, #6366F1, #3B82F6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontWeight: 800,
                      fontSize: 16
                    }}>
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>MRD: {selectedPatient.mrdNumber}</span>
                        <span>•</span>
                        <span>{selectedPatient.age} Yrs ({selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'})</span>
                        <span>•</span>
                        <span>Mob: {selectedPatient.mobile}</span>
                        <span>•</span>
                        <span>City: {selectedPatient.city || 'Surat'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedPatient.tags && selectedPatient.tags.length > 0 ? (
                      selectedPatient.tags.map(t => (
                        <span key={t} className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>{t}</span>
                      ))
                    ) : (
                      <span className="badge badge-muted" style={{ fontSize: 11 }}>General OPD</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                  No patient selected. Type in the search box above or click + Register New.
                </div>
              )}
            </div>
          </div>

          {/* Consulting Doctor & Visit Type */}
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Stethoscope size={17} />
                </div>
                2. Consulting Doctor & Department Assignment
              </span>
            </div>

            <div className="card-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label required" style={{ fontWeight: 700, marginBottom: 10 }}>Select Doctor</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {doctors.map(doc => {
                    const isSelected = selectedDoctorId === doc.id;
                    const count = queue.filter(q => q.doctorId === doc.id && (q.status === 'WAITING' || q.status === 'CALLING')).length;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary-light)' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'var(--transition)',
                          boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.15)' : 'none'
                        }}
                      >
                        <div className="avatar avatar-md" style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: doc.avatarColor || 'linear-gradient(135deg, #036d92, #0284c7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontWeight: 800,
                          fontSize: 13,
                          flexShrink: 0
                        }}>
                          {doc.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {doc.specialization} • {doc.room}
                          </div>
                        </div>
                        <span className={`badge ${count > 2 ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: 11, fontWeight: 700 }}>
                          {count} in queue
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visit Type */}
              <div className="form-group">
                <label className="form-label required" style={{ fontWeight: 700, marginBottom: 10 }}>Visit Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Consultation', 'Follow-Up', 'Procedure', 'Emergency', 'MR Visit'] as VisitType[]).map(vt => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setVisitType(vt)}
                      className={`btn btn-sm ${visitType === vt ? (vt === 'Emergency' ? 'btn-danger' : 'btn-primary') : 'btn-ghost'}`}
                      style={{
                        padding: '8px 16px',
                        fontWeight: visitType === vt ? 800 : 600,
                        borderRadius: 20
                      }}
                    >
                      {vt === 'Emergency' && <ShieldAlert size={14} style={{ marginRight: 4 }} />}
                      {vt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals & Complaints Fast Strip */}
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                  <Heart size={17} />
                </div>
                3. Triage Vitals & Chief Complaints
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={recordVitals}
                  onChange={e => setRecordVitals(e.target.checked)}
                />
                <span>Record at Reception</span>
              </label>
            </div>

            {recordVitals && (
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>BP (mmHg)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                      value={bp}
                      onChange={e => setBp(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Pulse (bpm)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                      value={pulse}
                      onChange={e => setPulse(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Temp (°F)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                      value={temp}
                      onChange={e => setTemp(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Weight (kg)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>SpO2 (%)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                      value={spo2}
                      onChange={e => setSpo2(e.target.value)}
                    />
                  </div>
                </div>

                {/* Chief complaints */}
                <div style={{ marginTop: 16 }}>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Chief Complaint Tags</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {COMPLAINT_TAGS.map(tag => {
                      const active = selectedComplaints.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleComplaint(tag)}
                          className="badge"
                          style={{
                            cursor: 'pointer',
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 16,
                            background: active ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : '#FFFFFF',
                            color: active ? '#FFFFFF' : 'var(--text-secondary)',
                            border: active ? 'none' : '1px solid var(--border)'
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fever, persistent headache and acute throat discomfort..."
                    value={complaintNotes}
                    onChange={e => setComplaintNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Billing & Token Dispenser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Consultation Fee & Billing Card */}
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <CreditCard size={17} />
                </div>
                4. Consultation Fee & Billing Settlement
              </span>
              <span className="badge badge-primary" style={{ fontSize: 14, fontWeight: 900, padding: '4px 12px' }}>
                ₹{feeAmount}.00
              </span>
            </div>

            <div className="card-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Payment Mode Choice */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div
                  onClick={() => setBillingChoice('PAY_NOW')}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: billingChoice === 'PAY_NOW' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: billingChoice === 'PAY_NOW' ? 'var(--primary-light)' : '#FFFFFF',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)' }}>Pay Now</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Advance Cash/UPI</div>
                </div>

                <div
                  onClick={() => setBillingChoice('PAY_LATER')}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: billingChoice === 'PAY_LATER' ? '2px solid var(--warning)' : '1px solid var(--border)',
                    background: billingChoice === 'PAY_LATER' ? 'var(--warning-light)' : '#FFFFFF',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#D97706' }}>Pay Later</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Checkout Bill</div>
                </div>

                <div
                  onClick={() => setBillingChoice('FOC')}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: billingChoice === 'FOC' ? '2px solid var(--purple)' : '1px solid var(--border)',
                    background: billingChoice === 'FOC' ? 'var(--purple-light)' : '#FFFFFF',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--purple)' }}>FOC</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Doctor Courtesy</div>
                </div>
              </div>

              {/* Checkbox for E2E persistent workflow compatibility */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={billingChoice === 'PAY_NOW'}
                  onChange={e => setBillingChoice(e.target.checked ? 'PAY_NOW' : 'PAY_LATER')}
                />
                <span>Advance collection (Pay now)</span>
              </label>

              {billingChoice === 'PAY_NOW' && (
                <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Consultation Charges:</span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>₹{feeAmount}.00</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 11 }}>Payment Mode</label>
                    <select
                      className="form-select"
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                      style={{ height: 38 }}
                    >
                      <option value="CASH">CASH (Physical Currency)</option>
                      <option value="UPI">UPI (QR Code / Dynamic Handshake)</option>
                      <option value="CARD">CARD (Credit / Debit Terminal)</option>
                    </select>
                  </div>

                  {paymentMode !== 'CASH' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Reference</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Txn ID"
                          value={paymentReference}
                          onChange={e => setPaymentReference(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Provider</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. HDFC / GPay"
                          value={paymentProvider}
                          onChange={e => setPaymentProvider(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 700, marginTop: 4 }}>
                    <span>Counter Settlement:</span>
                    <span>{paymentDone ? '✓ Verified' : 'Ready at Token Issue'}</span>
                  </div>

                  {!paymentDone && paymentMode === 'UPI' && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: 10, width: '100%', justifyContent: 'center', background: '#FFF', fontWeight: 700 }}
                    >
                      <QrCode size={14} /> Open UPI QR Scanner Modal
                    </button>
                  )}
                </div>
              )}

              {billingChoice === 'FOC' && (
                <div className="form-group">
                  <label className="form-label required" style={{ fontWeight: 700 }}>FOC Authorization Reason</label>
                  <select
                    className="form-select"
                    value={focReason}
                    onChange={e => setFocReason(e.target.value)}
                  >
                    <option value="Doctor Courtesy">Doctor Courtesy / Personal Referral</option>
                    <option value="Review within 3 days">Follow-up Review within 3 Days</option>
                    <option value="Hospital Staff Relative">Hospital Staff / Relative</option>
                    <option value="Charity / Indigent Patient">Charity / Indigent Scheme</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleGenerateToken}
                  className="btn btn-success btn-lg"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '14px 20px',
                    fontSize: 15,
                    fontWeight: 800,
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <SquareCheckBig size={18} /> Generate Token & Check-In
                </button>
                <button
                  type="button"
                  onClick={handleGenerateToken}
                  className="btn btn-primary"
                  style={{
                    padding: '14px 18px',
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  Complete check-in
                </button>
              </div>
            </div>
          </div>

          {/* Quick Doctor Live Queue Status Card */}
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--primary)" />
                {selectedDoctor.name}'s Live Queue
              </span>
              <span className="badge badge-muted" style={{ fontWeight: 700 }}>{selectedDoctor.room}</span>
            </div>

            <div className="card-body" style={{ padding: '16px 18px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Patients currently waiting:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{doctorWaitingCount} patients</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated waiting period:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>~{doctorWaitingCount * 12} mins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consultation Pace:</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>On Schedule (10-12m)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal Integration */}
      {showPaymentModal && selectedPatient && (
        <PaymentModal
          patient={selectedPatient}
          doctorName={selectedDoctor.name}
          fee={feeAmount}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPaymentDone(true);
            executeCheckIn();
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Token Dispensed Modal */}
      {generatedToken && (
        <div className="modal-overlay" onClick={() => setGeneratedToken(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ borderRadius: 'var(--radius-lg)', maxWidth: 440 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="modal-title" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16 }}>
                <CheckCircle2 size={20} /> Token Dispensed Successfully
              </span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setGeneratedToken(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 20 }}>
              {/* Thermal Token Slip look */}
              <div style={{
                background: '#FFFFFF',
                border: '2px solid #0F172A',
                borderRadius: 10,
                padding: 18,
                fontFamily: 'monospace',
                textAlign: 'center',
                boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '0.05em' }}>MEDFLOW OPD CLINIC</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>Surat Main Branch • OPD Token Receipt</div>

                <div style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: 'var(--primary)',
                  margin: '12px 0 6px',
                  letterSpacing: '0.05em'
                }}>
                  {generatedToken.token}
                </div>

                <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                  {generatedToken.patient.firstName} {generatedToken.patient.lastName}
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                  MRD: {generatedToken.patient.mrdNumber} • {generatedToken.patient.age}Y/{generatedToken.patient.gender}
                </div>

                <div style={{ margin: '12px 0', borderTop: '1px dashed #CBD5E1', borderBottom: '1px dashed #CBD5E1', padding: '10px 0' }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{generatedToken.doctor.name}</div>
                  <div style={{ fontSize: 11, color: '#4338CA', fontWeight: 700, marginTop: 2 }}>
                    {generatedToken.doctor.room} ({generatedToken.doctor.specialization})
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                    {generatedToken.queueAhead === 0 ? 'Proceed directly to room' : `${generatedToken.queueAhead} patients ahead in queue`}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
                  <span>Time: {generatedToken.time}</span>
                  <span style={{ fontWeight: 800, color: generatedToken.billingStatus === 'PAID' ? '#059669' : '#D97706' }}>
                    {generatedToken.billingStatus}
                  </span>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: '#4338CA', fontWeight: 800, textAlign: 'center', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                  Case ID: <span data-testid="generated-case-id">{generatedToken.caseNumber}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setGeneratedToken(null);
                  router.push('/reception/queue');
                }}
              >
                Queue Board
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={14} /> Print
                </button>
                <Link
                  href={`/nursing/vitals?caseId=${generatedToken.caseNumber}`}
                  className="btn btn-primary btn-sm"
                  onClick={() => setGeneratedToken(null)}
                  style={{ fontWeight: 700 }}
                >
                  Proceed to Nursing Triage →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ padding: 40, textAlign: 'center' }}>
        <div className="card" style={{ padding: 30, display: 'inline-block' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Loading Walk-In Management...</div>
        </div>
      </div>
    }>
      <CheckInContent />
    </Suspense>
  );
}
