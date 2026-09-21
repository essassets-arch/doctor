'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SquareCheckBig, User, Search, Stethoscope, Clock,
  CreditCard, Activity, CheckCircle2, AlertCircle, Heart,
  Printer, ArrowRight, ShieldAlert, Sparkles, Tag, X, QrCode
} from 'lucide-react';
import {
  usePatientStore, useQueueStore, useBillingStore, useUIStore,
  Patient, Doctor, VisitType, BillingStatus, QueueEntry
} from '@/store';
import PaymentModal from '@/components/PaymentModal';

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const { patients, getPatientById } = usePatientStore();
  const { queue, doctors, addToQueue } = useQueueStore();
  const { addBill } = useBillingStore();
  const { addNotification } = useUIStore();

  // Selected Patient State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Check-In Form Fields
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || 'doc-1');
  const [visitType, setVisitType] = useState<VisitType>('Consultation');
  const [isEmergency, setIsEmergency] = useState(false);

  // Billing Options
  const [feeAmount, setFeeAmount] = useState<number>(500);
  const [billingChoice, setBillingChoice] = useState<'PAY_NOW' | 'PAY_LATER' | 'FOC'>('PAY_NOW');
  const [focReason, setFocReason] = useState('Doctor Courtesy');
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

  // Auto-select if patientId passed via query string
  useEffect(() => {
    if (preselectedPatientId) {
      const p = getPatientById(preselectedPatientId);
      if (p) setSelectedPatient(p);
    } else if (!selectedPatient && patients.length > 0) {
      // Default to first patient if none selected
      setSelectedPatient(patients[0]);
    }
  }, [preselectedPatientId, patients, getPatientById]);

  // Adjust fee based on visit type
  useEffect(() => {
    if (visitType === 'Consultation') setFeeAmount(500);
    else if (visitType === 'Follow-Up') setFeeAmount(300);
    else if (visitType === 'Procedure') setFeeAmount(1500);
    else if (visitType === 'Emergency') setFeeAmount(800);
    else if (visitType === 'MR Visit') setFeeAmount(0);
  }, [visitType]);

  const toggleComplaint = (tag: string) => {
    setSelectedComplaints(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Doctor waiting count
  const doctorWaitingCount = queue.filter(
    q => q.doctorId === selectedDoctorId && (q.status === 'WAITING' || q.status === 'CALLING')
  ).length;

  const handleGenerateToken = () => {
    if (!selectedPatient) {
      alert('Please select or search a patient.');
      return;
    }

    if (billingChoice === 'PAY_NOW' && !paymentDone && feeAmount > 0) {
      // Prompt payment modal first
      setShowPaymentModal(true);
      return;
    }

    executeCheckIn();
  };

  const executeCheckIn = () => {
    if (!selectedPatient) return;

    // Generate Token number
    const tokenIndex = queue.length + 1;
    const tokenCode = `C${String(tokenIndex).padStart(3, '0')}`;
    const caseNumber = `${tokenCode}-001-${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}`;
    const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    let finalBilling: BillingStatus = 'PENDING';
    if (billingChoice === 'PAY_NOW' || feeAmount === 0) finalBilling = 'PAID';
    if (billingChoice === 'FOC') finalBilling = 'FOC';

    const newEntry: Omit<QueueEntry, 'id'> = {
      caseNumber,
      tokenDisplay: tokenCode,
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      visitType,
      appointmentTime: checkInTime,
      checkInTime,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      city: selectedPatient.city || 'Surat',
      billingStatus: finalBilling,
      status: 'WAITING',
      stage: 'NURSING',
      vitalsRecorded: recordVitals,
      complaintsRecorded: recordComplaints,
      complaints: recordComplaints ? selectedComplaints : undefined,
      complaintNotes: recordComplaints ? (complaintNotes.trim() || selectedComplaints.join(', ')) : undefined,
      isFoc: billingChoice === 'FOC',
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

    addToQueue(newEntry);

    // Record billing entry if paid or pending
    if (billingChoice === 'PAY_NOW' && feeAmount > 0) {
      addBill({
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        mrdNumber: selectedPatient.mrdNumber,
        doctorName: selectedDoctor.name,
        date: new Date().toISOString().split('T')[0],
        netAmount: feeAmount,
        collectedAmount: feeAmount,
        balance: 0,
        status: 'PAID',
        paymentMode: 'UPI',
        items: [{
          id: `item-${Date.now()}`,
          name: `${visitType} Advance Consultation Fee`,
          unitPrice: feeAmount,
          quantity: 1,
          discount: 0,
          total: feeAmount
        }]
      });
    } else if (billingChoice === 'PAY_LATER' && feeAmount > 0) {
      addBill({
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        mrdNumber: selectedPatient.mrdNumber,
        doctorName: selectedDoctor.name,
        date: new Date().toISOString().split('T')[0],
        netAmount: feeAmount,
        collectedAmount: 0,
        balance: feeAmount,
        status: 'PENDING',
        paymentMode: 'CASH',
        items: [{
          id: `item-${Date.now()}`,
          name: `${visitType} Fee (Pay at Checkout)`,
          unitPrice: feeAmount,
          quantity: 1,
          discount: 0,
          total: feeAmount
        }]
      });
    }

    addNotification({
      type: 'info',
      message: `Checked in: ${selectedPatient.firstName} ${selectedPatient.lastName} → Token ${tokenCode} (${selectedDoctor.name})`
    });

    setGeneratedToken({
      token: tokenCode,
      caseNumber,
      patient: selectedPatient,
      doctor: selectedDoctor,
      time: checkInTime,
      queueAhead: doctorWaitingCount,
      billingStatus: finalBilling,
    });
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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Walk-In Management & Check-In Counter</h1>
          <p className="page-subtitle">30-second rapid patient intake: assign consulting doctor, verify consultation fee, record vitals, and dispense queue token.</p>
        </div>
      </div>

      <div className="grid-two-column" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Patient & Doctor Setup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Patient Selector Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <User size={18} color="var(--primary)" />
                1. Select Patient
              </span>
              <button
                onClick={() => router.push('/reception/register')}
                className="btn btn-ghost btn-sm"
              >
                + Register New
              </button>
            </div>

            <div className="card-body">
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
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
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)',
                    zIndex: 200, maxHeight: 240, overflowY: 'auto'
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
                          padding: '10px 14px', borderBottom: '1px solid var(--border)',
                          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                        className="hover:bg-slate-50"
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</span>
                          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{p.mrdNumber}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {p.age}Y {p.gender} • {p.mobile}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Patient Banner */}
              {selectedPatient ? (
                <div style={{
                  padding: 16, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="avatar avatar-md" style={{
                      background: selectedPatient.gender === 'F' ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'linear-gradient(135deg, #6366F1, #3B82F6)'
                    }}>
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedPatient.mrdNumber}</span>
                        <span>•</span>
                        <span>{selectedPatient.age} Yrs ({selectedPatient.gender === 'M' ? 'Male' : 'Female'})</span>
                        <span>•</span>
                        <span>Mob: {selectedPatient.mobile}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selectedPatient.tags?.map(t => (
                      <span key={t} className="badge badge-warning">{t}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  No patient selected. Search above or click Register New.
                </div>
              )}
            </div>
          </div>

          {/* Consulting Doctor & Visit Type */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Stethoscope size={18} color="var(--primary)" />
                2. Consulting Doctor & Department
              </span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label required">Assign Doctor</label>
                <div className="doctor-selection-grid">
                  {doctors.map(doc => {
                    const isSelected = selectedDoctorId === doc.id;
                    const count = queue.filter(q => q.doctorId === doc.id && (q.status === 'WAITING' || q.status === 'CALLING')).length;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        style={{
                          padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                          display: 'flex', alignItems: 'center', gap: 12, transition: 'var(--transition)'
                        }}
                      >
                        <div className="avatar avatar-md" style={{ background: doc.avatarColor }}>
                          {doc.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{doc.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.specialization} • {doc.room}</div>
                        </div>
                        <span className={`badge ${count > 2 ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                          {count} in queue
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visit Type */}
              <div className="form-group">
                <label className="form-label required">Visit Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Consultation', 'Follow-Up', 'Procedure', 'Emergency', 'MR Visit'] as VisitType[]).map(vt => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => {
                        setVisitType(vt);
                        if (vt === 'Emergency') setIsEmergency(true);
                        else setIsEmergency(false);
                      }}
                      className={`btn ${visitType === vt ? (vt === 'Emergency' ? 'btn-danger' : 'btn-primary') : 'btn-ghost'}`}
                    >
                      {vt === 'Emergency' && <ShieldAlert size={14} />}
                      {vt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Fast Strip */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Heart size={18} color="var(--danger)" />
                3. Triage Vitals Strip
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={recordVitals}
                  onChange={e => setRecordVitals(e.target.checked)}
                />
                <span>Record at Reception</span>
              </label>
            </div>

            {recordVitals && (
              <div className="card-body">
                <div className="grid-vitals-five" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">BP (mmHg)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bp}
                      onChange={e => setBp(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pulse (bpm)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={pulse}
                      onChange={e => setPulse(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temp (°F)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={temp}
                      onChange={e => setTemp(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SpO2 (%)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={spo2}
                      onChange={e => setSpo2(e.target.value)}
                    />
                  </div>
                </div>

                {/* Chief complaints */}
                <div style={{ marginTop: 14 }}>
                  <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Chief Complaint Tags</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {COMPLAINT_TAGS.map(tag => {
                      const active = selectedComplaints.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleComplaint(tag)}
                          className="badge"
                          style={{
                            cursor: 'pointer', padding: '5px 10px', fontSize: 11,
                            background: active ? 'var(--primary)' : 'var(--bg-muted)',
                            color: active ? 'white' : 'var(--text-secondary)',
                            border: active ? 'none' : '1px solid var(--border)'
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Billing & Token Dispenser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Consultation Fee Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <CreditCard size={18} color="var(--primary)" />
                4. Consultation Fee & Billing
              </span>
              <span className="badge badge-primary" style={{ fontSize: 13, fontWeight: 800 }}>
                ₹{feeAmount}
              </span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Payment Mode Choice */}
              <div className="grid-billing-choice" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div
                  onClick={() => setBillingChoice('PAY_NOW')}
                  style={{
                    padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                    border: billingChoice === 'PAY_NOW' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: billingChoice === 'PAY_NOW' ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>Pay Now</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Collect ₹{feeAmount}</div>
                </div>

                <div
                  onClick={() => setBillingChoice('PAY_LATER')}
                  style={{
                    padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                    border: billingChoice === 'PAY_LATER' ? '2px solid var(--warning)' : '1px solid var(--border)',
                    background: billingChoice === 'PAY_LATER' ? 'var(--warning-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E' }}>Pay Later</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Collect Post-Visit</div>
                </div>

                <div
                  onClick={() => setBillingChoice('FOC')}
                  style={{
                    padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                    border: billingChoice === 'FOC' ? '2px solid var(--success)' : '1px solid var(--border)',
                    background: billingChoice === 'FOC' ? 'var(--success-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>Free of Cost</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>FOC Visit</div>
                </div>
              </div>

              {billingChoice === 'PAY_NOW' && (
                <div style={{ padding: 12, background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Consultation Charges:</span>
                    <span style={{ fontWeight: 700 }}>₹{feeAmount}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600 }}>
                    <span>Payment Status:</span>
                    <span>{paymentDone ? '✓ Paid via UPI/Cash' : 'Pending Counter Collection'}</span>
                  </div>
                  {!paymentDone && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                    >
                      <CreditCard size={14} /> Open Payment Modal (UPI QR / Cash)
                    </button>
                  )}
                </div>
              )}

              {billingChoice === 'FOC' && (
                <div className="form-group">
                  <label className="form-label required">FOC Reason / Justification</label>
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

              {/* Big Action Button */}
              <button
                type="button"
                onClick={handleGenerateToken}
                className="btn btn-success btn-lg"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}
              >
                <SquareCheckBig size={18} /> Generate Token & Check-In
              </button>
            </div>
          </div>

          {/* Quick Doctor Live Queue Preview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Clock size={16} color="var(--primary)" />
                {selectedDoctor.name}'s Queue Status
              </span>
              <span className="badge badge-muted">{selectedDoctor.room}</span>
            </div>

            <div className="card-body" style={{ fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Patients currently waiting:</span>
                <span style={{ fontWeight: 700 }}>{doctorWaitingCount} patients</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated wait time:</span>
                <span style={{ fontWeight: 700 }}>~{doctorWaitingCount * 12} mins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Average consultation pace:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>On Schedule (10-12m)</span>
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
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> Token Dispensed Successfully
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setGeneratedToken(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Thermal Token Slip look */}
              <div style={{
                background: '#FFFFFF',
                border: '2px solid #0F172A',
                borderRadius: 8,
                padding: 18,
                fontFamily: 'monospace',
                textAlign: 'center',
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>MEDFLOW OPD CLINIC</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>Surat Main Branch • OPD Token</div>

                <div style={{
                  fontSize: 44, fontWeight: 900, color: '#6366F1',
                  margin: '12px 0 6px', letterSpacing: '0.05em'
                }}>
                  {generatedToken.token}
                </div>

                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                  {generatedToken.patient.firstName} {generatedToken.patient.lastName}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>
                  MRD: {generatedToken.patient.mrdNumber} • {generatedToken.patient.age}Y/{generatedToken.patient.gender}
                </div>

                <div style={{ margin: '12px 0', borderTop: '1px dashed #CBD5E1', borderBottom: '1px dashed #CBD5E1', padding: '8px 0' }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{generatedToken.doctor.name}</div>
                  <div style={{ fontSize: 11, color: '#4338CA', fontWeight: 600 }}>{generatedToken.doctor.room} ({generatedToken.doctor.specialization})</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                    {generatedToken.queueAhead === 0 ? 'Proceed directly to room' : `${generatedToken.queueAhead} patients ahead in queue`}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
                  <span>Time: {generatedToken.time}</span>
                  <span style={{ fontWeight: 700, color: generatedToken.billingStatus === 'PAID' ? '#059669' : '#D97706' }}>
                    {generatedToken.billingStatus}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#4338CA', fontWeight: 800, textAlign: 'center' }}>
                  Case ID: <span data-testid="generated-case-id">{generatedToken.caseNumber}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setGeneratedToken(null);
                  router.push('/reception/queue');
                }}
              >
                Go to OPD Queue Board
              </button>
              <Link
                href={`/nursing/vitals?caseId=${generatedToken.caseNumber}`}
                className="btn btn-primary"
                onClick={() => setGeneratedToken(null)}
              >
                Proceed to Nursing Triage →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="card"><div className="card-body">Loading check-in counter...</div></div></div>}>
      <CheckInContent />
    </Suspense>
  );
}
