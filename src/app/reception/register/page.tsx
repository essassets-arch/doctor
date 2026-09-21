'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Briefcase, Printer, CheckCircle2, RotateCcw,
  Sparkles, Calendar, Phone, Mail, MapPin, Tag, ShieldAlert,
  CreditCard, ArrowRight, UserCheck, QrCode, Stethoscope
} from 'lucide-react';
import { usePatientStore, useUIStore, useQueueStore, useConsultationStore, Patient, Gender } from '@/store';

export default function RegisterPage() {
  const router = useRouter();
  const { nextMrd, addPatient } = usePatientStore();
  const { addNotification } = useUIStore();
  const { doctors, queue, addToQueue } = useQueueStore();

  const [tab, setTab] = useState<'patient' | 'mr'>('patient');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastCreatedToken, setLastCreatedToken] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');

  // Patient Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number>(30);
  const [ageMonths, setAgeMonths] = useState<number>(0);
  const [ageDays, setAgeDays] = useState<number>(0);
  const [gender, setGender] = useState<Gender>('M');
  const [language, setLanguage] = useState<'English' | 'Gujarati' | 'Hindi'>('Gujarati');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [city, setCity] = useState('Surat');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // MR Form State
  const [companyName, setCompanyName] = useState('');
  const [mrName, setMrName] = useState('');
  const [mrMobile, setMrMobile] = useState('');
  const [doctorToMeet, setDoctorToMeet] = useState('Dr. Raj Valaki');
  const [productsPromoting, setProductsPromoting] = useState('');
  const [sampleDetails, setSampleDetails] = useState('');

  const AVAILABLE_TAGS = ['VIP', 'Diabetic', 'Hypertension', 'Senior Citizen', 'Wheelchair', 'Allergy'];

  // Handle DOB change -> calculate Age
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDob(value);
    if (!value) return;
    const birth = new Date(value);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months -= 1;
      days += 30;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years >= 0) {
      setAge(years);
      setAgeMonths(months);
      setAgeDays(days);
    }
  };

  // Handle Age change -> estimate DOB
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = parseInt(e.target.value) || 0;
    setAge(newAge);
    if (newAge > 0) {
      const year = new Date().getFullYear() - newAge;
      setDob(`${year}-01-01`);
    }
  };

  const toggleTag = (t: string) => {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleClear = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setMobile('');
    setDob('');
    setAge(30);
    setAgeMonths(0);
    setAgeDays(0);
    setGender('M');
    setLanguage('Gujarati');
    setBloodGroup('B+');
    setCity('Surat');
    setAddress('');
    setEmail('');
    setEmergencyContact('');
    setSelectedTags([]);
  };

  const savePatient = (afterAction?: 'book' | 'checkin' | 'send_to_doctor') => {
    if (!firstName.trim() || !lastName.trim() || !mobile.trim()) {
      alert('Please enter First Name, Last Name, and Mobile Number.');
      return;
    }

    const created = addPatient({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      dob: dob || undefined,
      age,
      ageMonths,
      ageDays,
      gender,
      language,
      bloodGroup,
      city: city.trim() || 'Surat',
      address: address.trim() || undefined,
      email: email.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      tags: selectedTags,
      isNew: true,
    });

    if (afterAction === 'send_to_doctor') {
      const q = useQueueStore.getState().queue;
      const allDocs = useQueueStore.getState().doctors;
      const tokenIndex = q.length + 1;
      const tokenCode = `C${String(tokenIndex).padStart(3, '0')}`;
      const caseNumber = `${tokenCode}-001-${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}`;
      const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const targetDoctor = allDocs.find(d => d.id === selectedDoctorId) || allDocs[0];

      useQueueStore.getState().addToQueue({
        caseNumber,
        tokenDisplay: tokenCode,
        patientId: created.id,
        patientName: `${created.firstName} ${created.lastName}`,
        doctorId: targetDoctor.id,
        doctorName: targetDoctor.name,
        visitType: 'Consultation',
        appointmentTime: checkInTime,
        checkInTime,
        age: created.age,
        gender: created.gender,
        city: created.city || 'Surat',
        billingStatus: 'PAID',
        status: 'WAITING',
        stage: 'DOCTOR',
        vitalsRecorded: false,
        complaintsRecorded: false,
        isNew: true
      });

      useConsultationStore.getState().initSession(
        caseNumber,
        created,
        {
          id: targetDoctor.id,
          name: targetDoctor.name,
          specialization: targetDoctor.specialization || 'General Physician',
          initials: targetDoctor.name.split(' ').map(w => w[0]).join('').slice(0, 2),
          avatarColor: '#036d92',
          room: targetDoctor.room || 'Cabin 1'
        }
      );

      setLastCreatedToken(tokenCode);
      addNotification({
        type: 'success',
        message: `Registered & queued: ${created.firstName} ${created.lastName} (Token ${tokenCode}) sent directly to ${targetDoctor.name}!`
      });

      setSuccessToast(`Patient registered! Token ${tokenCode} assigned and sent directly to ${targetDoctor.name} (${targetDoctor.room || 'Cabin 1'}). Ready in Doctor panel!`);
      handleClear();
      return;
    }

    addNotification({
      type: 'success',
      message: `Registered new patient: ${created.firstName} ${created.lastName} (${created.mrdNumber})`
    });

    setSuccessToast(`Patient registered successfully with MRD: ${created.mrdNumber}`);
    setTimeout(() => setSuccessToast(null), 4000);

    if (afterAction === 'book') {
      router.push(`/reception/appointments?patientId=${created.id}`);
    } else if (afterAction === 'checkin') {
      router.push(`/reception/checkin?patientId=${created.id}`);
    } else {
      handleClear();
    }
  };

  const handleSaveMR = () => {
    if (!companyName.trim() || !mrName.trim() || !mrMobile.trim()) {
      alert('Please fill in Company Name, MR Name, and Contact Number.');
      return;
    }

    addNotification({
      type: 'info',
      message: `MR Entry logged: ${mrName} (${companyName}) for ${doctorToMeet}`
    });

    setSuccessToast(`MR Visitor Pass Generated for ${mrName} (${companyName})`);
    setTimeout(() => setSuccessToast(null), 4000);
    setCompanyName('');
    setMrName('');
    setMrMobile('');
    setProductsPromoting('');
    setSampleDetails('');
  };

  const fullName = `${firstName || 'First'} ${middleName ? middleName + ' ' : ''}${lastName || 'Last'}`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient & Visitor Registration</h1>
          <p className="page-subtitle">Assign Medical Record (MRD) numbers, capture demographics, and issue patient identification stickers.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setTab('patient')}
            className={`btn ${tab === 'patient' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <UserPlus size={16} /> Patient Registration
          </button>
          <button
            onClick={() => setTab('mr')}
            className={`btn ${tab === 'mr' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Briefcase size={16} /> MR & Visitor Pass
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="alert-banner success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="var(--success)" />
            <span style={{ fontWeight: 600 }}>{successToast}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => router.push('/doctor/dashboard')}
              className="btn btn-sm btn-primary"
              style={{ background: '#036d92', borderColor: '#036d92', fontSize: 12 }}
            >
              Open Doctor Cockpit →
            </button>
            <button
              onClick={() => router.push('/reception/queue')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: 12 }}
            >
              View Reception Queue
            </button>
            <button
              onClick={() => setSuccessToast(null)}
              className="btn btn-ghost btn-sm btn-icon"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}

      {tab === 'patient' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Main Registration Form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <UserCheck size={18} color="var(--primary)" />
                Patient Demographics & Medical Record
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Assigned MRD:</span>
                <span className="badge badge-primary" style={{ fontSize: 13, padding: '4px 10px' }}>
                  {nextMrd}
                </span>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Row 1: Name Fields */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>
                  1. Patient Identity
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label required">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ramesh"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Kumar"
                      value={middleName}
                      onChange={e => setMiddleName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Patel"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Contact, DOB, Age */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>
                  2. Age, Gender & Contact
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label required">Mobile Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                      <input
                        type="tel"
                        maxLength={10}
                        className="form-input"
                        style={{ paddingLeft: 34 }}
                        placeholder="10-digit mobile"
                        value={mobile}
                        onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dob}
                      onChange={handleDobChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Age (Years / Months / Days)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        className="form-input"
                        placeholder="Yrs"
                        value={age || ''}
                        onChange={handleAgeChange}
                      />
                      <input
                        type="number"
                        min={0}
                        max={11}
                        className="form-input"
                        placeholder="Mos"
                        value={ageMonths || ''}
                        onChange={e => setAgeMonths(parseInt(e.target.value) || 0)}
                      />
                      <input
                        type="number"
                        min={0}
                        max={30}
                        className="form-input"
                        placeholder="Days"
                        value={ageDays || ''}
                        onChange={e => setAgeDays(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Gender & Language */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14, marginTop: 14 }}>
                  <div className="form-group">
                    <label className="form-label required">Gender</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['M', 'F', 'Other'] as Gender[]).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`btn ${gender === g ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ flex: 1, padding: '8px 0', justifyContent: 'center' }}
                        >
                          {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <select
                      className="form-select"
                      value={language}
                      onChange={e => setLanguage(e.target.value as any)}
                    >
                      <option value="Gujarati">Gujarati</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      value={bloodGroup}
                      onChange={e => setBloodGroup(e.target.value)}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Address & Emergency */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>
                  3. Address & Emergency Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">City / Town</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Surat"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. patient@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Family / Relative mobile"
                      value={emergencyContact}
                      onChange={e => setEmergencyContact(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Residential Address</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="House/flat no, street, landmark, area"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: Medical Flags & Tags */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>
                  4. Patient Category & Medical Tags
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVAILABLE_TAGS.map(t => {
                    const active = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className="badge"
                        style={{
                          cursor: 'pointer',
                          padding: '6px 14px',
                          fontSize: 12,
                          background: active ? 'var(--primary)' : 'var(--bg-muted)',
                          color: active ? 'white' : 'var(--text-secondary)',
                          border: active ? 'none' : '1px solid var(--border)'
                        }}
                      >
                        <Tag size={12} />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consulting Doctor Selection for Instant Queueing */}
              <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(3, 109, 146, 0.06), rgba(99, 102, 241, 0.06))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(3, 109, 146, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                  <Stethoscope size={15} /> Assign Attending Doctor (for Instant OPD Consultation Routing)
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="form-select"
                    style={{ flex: 1, minWidth: 260, fontWeight: 600, background: '#FFFFFF' }}
                  >
                    <option value="doc-1">Dr. Raj Valaki (Cabin 1 — General Medicine & Dermatology)</option>
                    <option value="doc-2">Dr. Anita Soni (Cabin 2 — Dermatology & Cosmetology)</option>
                    <option value="doc-3">Dr. Priya Mehta (Cabin 3 — Pediatrics & Child Care)</option>
                    <option value="doc-4">Dr. Suresh Kumar (Cabin 4 — Surgery & Procedures)</option>
                  </select>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Auto-generates OPD token and forwards directly to doctor's cockpit
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
                marginTop: 8,
                flexWrap: 'wrap',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-ghost"
                >
                  <RotateCcw size={15} /> Clear Fields
                </button>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => savePatient()}
                    className="btn btn-ghost"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    Save Only
                  </button>
                  <button
                    type="button"
                    onClick={() => savePatient('book')}
                    className="btn btn-outline"
                  >
                    Save & Book Appt
                  </button>
                  <button
                    type="button"
                    onClick={() => savePatient('checkin')}
                    className="btn btn-success"
                  >
                    Save & Check-In Directly <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => savePatient('send_to_doctor')}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #036d92 0%, #0284C7 100%)',
                      borderColor: '#036d92',
                      boxShadow: '0 3px 10px rgba(3, 109, 146, 0.3)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Stethoscope size={16} /> Save & Send to Doctor Queue
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Thermal Sticker Preview */}
          <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 24px)' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Printer size={16} color="var(--primary)" />
                  Thermal Sticker Preview
                </span>
                <span className="badge badge-muted">50mm × 25mm</span>
              </div>

              <div className="card-body">
                {/* Physical sticker look */}
                <div style={{
                  background: '#FFFFFF',
                  border: '2px dashed #94A3B8',
                  borderRadius: 8,
                  padding: 14,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontFamily: 'monospace',
                  color: '#0F172A'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: 6, marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>MEDFLOW OPD CLINIC</div>
                    <div style={{ fontSize: 9, color: '#64748B' }}>Surat Central Branch • Tel: 0261-2800100</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>MRD: {nextMrd}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginTop: 2 }}>
                        {fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                        {age}Y {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Other'} • {bloodGroup}
                      </div>
                    </div>
                    <div style={{ width: 44, height: 44, background: '#F1F5F9', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                      <QrCode size={34} color="#0F172A" />
                    </div>
                  </div>

                  {/* Simulated barcode bars */}
                  <div style={{
                    height: 24,
                    background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 8px)',
                    margin: '6px 0',
                    borderRadius: 2
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', paddingTop: 4, borderTop: '1px solid #E2E8F0' }}>
                    <span suppressHydrationWarning>Reg: 19/09/2026</span>
                    <span>City: {city || 'Surat'}</span>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Printer size={15} /> Print Test Sticker
                  </button>
                </div>
              </div>
            </div>

            {/* Registration Quick Tips */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-body" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  💡 Front Desk Protocol:
                </div>
                <ul style={{ paddingLeft: 18 }}>
                  <li>Always verify spelling of Patient’s Full Name.</li>
                  <li>Enter exact 10-digit mobile number for SMS token updates.</li>
                  <li>Tag VIP or Senior Citizens to enable priority queue triage.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Medical Representative (MR) Tab */
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Briefcase size={18} color="var(--primary)" />
                Medical Representative (MR) & Visitor Gate Pass
              </span>
              <span className="badge badge-info">OPD Gate Pass</span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Pharmaceutical / Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sun Pharma, Cipla, Torrent"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Representative Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jignesh Shah"
                    value={mrName}
                    onChange={e => setMrName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Contact Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    className="form-input"
                    placeholder="10-digit mobile"
                    value={mrMobile}
                    onChange={e => setMrMobile(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Doctor to Meet</label>
                  <select
                    className="form-select"
                    value={doctorToMeet}
                    onChange={e => setDoctorToMeet(e.target.value)}
                  >
                    <option value="Dr. Raj Valaki">Dr. Raj Valaki (Dermatology - Room 1)</option>
                    <option value="Dr. Anita Soni">Dr. Anita Soni (General Medicine - Room 2)</option>
                    <option value="Dr. Priya Mehta">Dr. Priya Mehta (Gynecology - Room 3)</option>
                    <option value="Dr. Suresh Kumar">Dr. Suresh Kumar (Orthopedics - Room 4)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Products Promoting / Discussion Agenda</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. New Antifungal Ointment, Vitamin D3 Drops"
                  value={productsPromoting}
                  onChange={e => setProductsPromoting(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sample Drops / Literature Details</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="List any physician samples or clinical trial dossiers handed over at desk..."
                  value={sampleDetails}
                  onChange={e => setSampleDetails(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyName('');
                    setMrName('');
                    setMrMobile('');
                    setProductsPromoting('');
                    setSampleDetails('');
                  }}
                  className="btn btn-ghost"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSaveMR}
                  className="btn btn-primary"
                >
                  <Printer size={15} /> Issue Visitor Badge & Log Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
