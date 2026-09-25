'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Briefcase, Printer, CheckCircle2, RotateCcw,
  Calendar, Phone, Mail, MapPin, Tag, ShieldAlert,
  CreditCard, ArrowRight, UserCheck, QrCode, Stethoscope,
  Sparkles, Check, HeartHandshake, FileBadge
} from 'lucide-react';
import { usePatientStore, useUIStore, useQueueStore, type Patient, type Gender } from '@/store';

export default function RegisterPage() {
  const router = useRouter();
  const { nextMrd, addPatient } = usePatientStore();
  const { addNotification } = useUIStore();
  const { doctors, addToQueue, queue } = useQueueStore();

  const [tab, setTab] = useState<'patient' | 'mr'>('patient');
  const [successToast, setSuccessToast] = useState<{ message: string; patientId?: string; caseNumber?: string } | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');

  // Patient Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number>(30);
  const [ageMonths, setAgeMonths] = useState<number>(0);
  const [ageDays, setAgeDays] = useState<number>(0);
  const [gender, setGender] = useState<Gender>('M');
  const [language, setLanguage] = useState<'English' | 'Gujarati' | 'Hindi'>('Gujarati');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [city, setCity] = useState('Surat');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('395007');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // MR Form State
  const [companyName, setCompanyName] = useState('');
  const [mrName, setMrName] = useState('');
  const [mrMobile, setMrMobile] = useState('');
  const [doctorToMeet, setDoctorToMeet] = useState('Dr. Raj Valaki');
  const [productsPromoting, setProductsPromoting] = useState('');
  const [sampleDetails, setSampleDetails] = useState('');

  const AVAILABLE_TAGS = ['VIP', 'Diabetic', 'Hypertension', 'Senior Citizen', 'Wheelchair', 'Allergy', 'Cardiac', 'Asthma'];

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
    setAlternateMobile('');
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
    setAllergies('');
    setSpecialNotes('');
    setSelectedTags([]);
  };

  const savePatient = (afterAction: 'profile' | 'book' | 'checkin' | 'send_to_doctor' = 'profile') => {
    if (!firstName.trim() || !lastName.trim() || !mobile.trim()) {
      alert('Please enter First Name, Last Name, and Mobile Number.');
      return;
    }

    try {
      const created = addPatient({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        mobile: mobile.trim(),
        alternateMobile: alternateMobile.trim() || undefined,
        dob: dob || undefined,
        age,
        ageMonths,
        ageDays,
        gender,
        language,
        bloodGroup,
        city: city.trim() || 'Surat',
        state: state.trim() || 'Gujarat',
        pincode: pincode.trim() || undefined,
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        allergies: allergies.trim() || undefined,
        specialNotes: specialNotes.trim() ? [specialNotes.trim()] : undefined,
        tags: selectedTags,
        isNew: true
      });

      if (afterAction === 'send_to_doctor') {
        const doc = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
        const tokenIndex = queue.length + 1;
        const tokenCode = `C${String(tokenIndex).padStart(3, '0')}`;
        const caseNumber = `${tokenCode}-001-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;
        const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        addToQueue({
          caseNumber,
          tokenDisplay: tokenCode,
          patientId: created.id,
          patientName: `${created.firstName} ${created.lastName}`,
          doctorId: doc.id,
          doctorName: doc.name,
          visitType: 'Consultation',
          appointmentTime: timeNow,
          checkInTime: timeNow,
          age: created.age,
          gender: created.gender,
          city: created.city || 'Surat',
          billingStatus: 'PENDING',
          status: 'WAITING',
          stage: 'NURSING',
          vitalsRecorded: false,
          complaintsRecorded: false
        });

        addNotification({
          type: 'success',
          message: `Ready in Doctor panel! Token ${tokenCode} assigned to ${doc.name}`
        });

        setSuccessToast({
          message: `Ready in Doctor panel! Assigned to ${doc.name}`,
          patientId: created.id,
          caseNumber
        });
        return;
      }

      addNotification({
        type: 'success',
        message: `Registered new patient: ${created.firstName} ${created.lastName} (${created.mrdNumber})`
      });

      if (afterAction === 'book') {
        router.push(`/reception/appointments?patientId=${created.id}`);
      } else if (afterAction === 'checkin') {
        router.push(`/reception/checkin?patientId=${created.id}`);
      } else {
        router.push(`/reception/patients/${created.id}`);
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Registration failed.');
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

    setSuccessToast({
      message: `MR Visitor Gate Pass Generated for ${mrName} (${companyName})`
    });
    setTimeout(() => setSuccessToast(null), 5000);
    setCompanyName('');
    setMrName('');
    setMrMobile('');
    setProductsPromoting('');
    setSampleDetails('');
  };

  const fullName = `${firstName || 'First'} ${middleName ? middleName + ' ' : ''}${lastName || 'Last'}`;

  return (
    <div className="page-container" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Breadcrumb & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          <span style={{ padding: '3px 8px', background: 'var(--primary-light)', borderRadius: 6 }}>FRONT DESK INTAKE</span>
          <span style={{ color: 'var(--text-disabled)' }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>NEW MEDICAL RECORD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          Live MRD Registry Active
        </div>
      </div>

      {/* Main Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title" aria-label="Patient registration" style={{ fontSize: 26, fontWeight: 800 }}>
            Patient Registration & Visitor Pass
          </h1>
          <p className="page-subtitle" style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Assign permanent Medical Record (MRD) numbers, capture full clinical demographics, issue thermal barcodes, and route to doctor queues.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, background: 'var(--bg-muted)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => setTab('patient')}
            className={`btn btn-sm ${tab === 'patient' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
          >
            <UserPlus size={15} /> Patient Registration
          </button>
          <button
            type="button"
            onClick={() => setTab('mr')}
            className={`btn btn-sm ${tab === 'mr' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
          >
            <Briefcase size={15} /> MR & Visitor Pass
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div
          className="alert-banner success"
          style={{
            marginBottom: 24,
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{successToast.message}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Patient file is ready and synced across all doctor, nursing, and billing consoles.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => router.push('/doctor/dashboard')}
              className="btn btn-sm btn-primary"
              style={{
                background: 'linear-gradient(135deg, #036d92, #0284c7)',
                borderColor: '#036d92',
                fontWeight: 700,
                fontSize: 12,
                padding: '8px 14px'
              }}
            >
              Open Doctor Cockpit →
            </button>
            <button
              type="button"
              onClick={() => router.push('/reception/queue')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: 12, padding: '8px 14px', background: '#FFF' }}
            >
              View Reception Queue
            </button>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="btn btn-ghost btn-sm btn-icon"
              title="Dismiss"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {tab === 'patient' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }}>
          {/* Main Registration Form */}
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <UserCheck size={18} />
                </div>
                Patient Demographics & Medical Record
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--primary-light)', padding: '6px 14px', borderRadius: 20 }}>
                <span style={{ fontSize: 12, color: 'var(--primary-dark)', fontWeight: 600 }}>Assigned MRD:</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)' }}>
                  {nextMrd}
                </span>
              </div>
            </div>

            <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Row 1: Name Fields */}
              <div style={{ background: '#FAFBFD', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} /> 1. Patient Identification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label required" style={{ fontWeight: 700 }}>First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ramesh"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="middleName" className="form-label" style={{ fontWeight: 700 }}>Middle Name</label>
                    <input
                      id="middleName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Kumar"
                      value={middleName}
                      onChange={e => setMiddleName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label required" style={{ fontWeight: 700 }}>Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Patel"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Age, Gender & Contact */}
              <div style={{ background: '#FAFBFD', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} /> 2. Age, Gender & Contact Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.4fr', gap: 16 }}>
                  <div className="form-group">
                    <label htmlFor="mobile" className="form-label required" style={{ fontWeight: 700 }}>Mobile</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                      <input
                        id="mobile"
                        aria-label="Mobile"
                        type="tel"
                        maxLength={10}
                        className="form-input"
                        style={{ paddingLeft: 34, fontWeight: 600 }}
                        placeholder="10-digit mobile"
                        value={mobile}
                        onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dob" className="form-label" style={{ fontWeight: 700 }}>Dob</label>
                    <input
                      id="dob"
                      aria-label="Dob"
                      type="date"
                      className="form-input"
                      value={dob}
                      onChange={handleDobChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required" style={{ fontWeight: 700 }}>Age (Years / Mos / Days)</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, marginTop: 14 }}>
                  <div className="form-group">
                    <label className="form-label required" style={{ fontWeight: 700 }}>Gender</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['M', 'F', 'Other'] as Gender[]).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`btn btn-sm ${gender === g ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ flex: 1, padding: '8px 0', justifyContent: 'center', fontWeight: gender === g ? 800 : 500 }}
                        >
                          {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="language" className="form-label" style={{ fontWeight: 700 }}>Language</label>
                    <select
                      id="language"
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
                    <label htmlFor="bloodGroup" className="form-label" style={{ fontWeight: 700 }}>Blood Group</label>
                    <select
                      id="bloodGroup"
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

              {/* Row 3: Address & Emergency Details */}
              <div style={{ background: '#FAFBFD', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} /> 3. Address & Emergency Contacts
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 16 }}>
                  <div className="form-group">
                    <label htmlFor="city" className="form-label" style={{ fontWeight: 700 }}>City / Town</label>
                    <input
                      id="city"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Surat"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label" style={{ fontWeight: 700 }}>Email Address</label>
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="emergencyContact" className="form-label" style={{ fontWeight: 700 }}>Emergency Contact</label>
                    <input
                      id="emergencyContact"
                      type="tel"
                      className="form-input"
                      placeholder="Family phone & relation"
                      value={emergencyContact}
                      onChange={e => setEmergencyContact(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginTop: 14 }}>
                  <div className="form-group">
                    <label htmlFor="address" className="form-label" style={{ fontWeight: 700 }}>Residential Address</label>
                    <input
                      id="address"
                      type="text"
                      className="form-input"
                      placeholder="House/flat no, street, landmark, area"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state" className="form-label" style={{ fontWeight: 700 }}>State</label>
                    <input
                      id="state"
                      type="text"
                      className="form-input"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pincode" className="form-label" style={{ fontWeight: 700 }}>Pincode</label>
                    <input
                      id="pincode"
                      type="text"
                      className="form-input"
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Medical Flags & Tags */}
              <div style={{ background: '#FAFBFD', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={13} /> 4. Patient Category & Medical Tags
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
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
                          padding: '7px 14px',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 20,
                          background: active ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : '#FFFFFF',
                          color: active ? '#FFFFFF' : 'var(--text-secondary)',
                          border: active ? 'none' : '1px solid var(--border)',
                          boxShadow: active ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                          transition: 'var(--transition)'
                        }}
                      >
                        <Tag size={12} style={{ marginRight: 4 }} />
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label htmlFor="allergies" className="form-label" style={{ fontWeight: 700 }}>Known Drug / Food Allergies</label>
                    <input
                      id="allergies"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sulfa, Penicillin, NSAIDs, Dust"
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="specialNotes" className="form-label" style={{ fontWeight: 700 }}>Clinical Intake Remarks</label>
                    <input
                      id="specialNotes"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Wheelchair assistance required, corporate referral"
                      value={specialNotes}
                      onChange={e => setSpecialNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Consulting Doctor Routing Selection */}
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(3, 109, 146, 0.06), rgba(99, 102, 241, 0.08))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(3, 109, 146, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label htmlFor="doctorSelect" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                    <Stethoscope size={16} /> Assign Consulting Doctor (Direct OPD Routing)
                  </label>
                  <span className="badge badge-info" style={{ fontSize: 11, fontWeight: 700 }}>Fast Handshake</span>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    id="doctorSelect"
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="form-select"
                    style={{ flex: 1, minWidth: 280, fontWeight: 700, background: '#FFFFFF', padding: '10px 14px' }}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization} — {d.room})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Auto-generates encounter token and transfers directly to doctor's active cockpit
                  </span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 18,
                borderTop: '1px solid var(--border)',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-ghost"
                  style={{ fontWeight: 600, color: 'var(--text-muted)' }}
                >
                  <RotateCcw size={15} /> Clear Fields
                </button>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => savePatient('profile')}
                    className="btn btn-outline"
                    style={{ fontWeight: 700, borderColor: 'var(--border-hover)', background: '#FFFFFF' }}
                  >
                    Save patient
                  </button>
                  <button
                    type="button"
                    onClick={() => savePatient('book')}
                    className="btn btn-ghost"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
                  >
                    Save & Book Appt
                  </button>
                  <button
                    type="button"
                    onClick={() => savePatient('checkin')}
                    className="btn btn-success"
                    style={{ fontWeight: 700, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
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
                      boxShadow: '0 4px 14px rgba(3, 109, 146, 0.35)',
                      fontWeight: 800,
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Stethoscope size={16} /> Save & Send to Doctor Queue
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Thermal Barcode Label Preview */}
          <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 20px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
              <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <span className="card-title" style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Printer size={16} color="var(--primary)" />
                  Thermal Barcode Sticker
                </span>
                <span className="badge badge-muted" style={{ fontSize: 11 }}>50mm × 25mm</span>
              </div>

              <div className="card-body" style={{ padding: 18 }}>
                {/* Physical thermal sticker look */}
                <div style={{
                  background: '#FFFFFF',
                  border: '2px dashed #94A3B8',
                  borderRadius: 10,
                  padding: 14,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  fontFamily: 'monospace',
                  color: '#0F172A'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: 6, marginBottom: 8 }}>
                    <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: '0.06em', color: '#0F172A' }}>MEDFLOW OPD CLINIC</div>
                    <div style={{ fontSize: 9, color: '#64748B' }}>Surat Central Branch • Tel: 0261-2800100</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-dark)' }}>MRD: {nextMrd}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#1E293B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fullName}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                        {age}Y {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Other'} • {bloodGroup}
                      </div>
                    </div>
                    <div style={{ width: 46, height: 46, background: '#F8FAFC', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0 }}>
                      <QrCode size={36} color="#0F172A" />
                    </div>
                  </div>

                  {/* Simulated barcode bars */}
                  <div style={{
                    height: 22,
                    background: 'repeating-linear-gradient(90deg, #0F172A 0px, #0F172A 2px, transparent 2px, transparent 4px, #0F172A 4px, #0F172A 7px, transparent 7px, transparent 8px)',
                    margin: '6px 0',
                    borderRadius: 2
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', paddingTop: 4, borderTop: '1px solid #E2E8F0' }}>
                    <span>Reg: {new Date().toLocaleDateString('en-GB')}</span>
                    <span>City: {city || 'Surat'}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: 13, padding: '10px 0', background: '#FFF' }}
                  >
                    <Printer size={15} /> Print Physical Sticker
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Registration Helper Card */}
            <div className="card" style={{ padding: 16, borderRadius: 'var(--radius-md)', background: '#F8FAFC', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                <HeartHandshake size={16} color="var(--primary)" />
                Intake Best Practices
              </div>
              <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                <li>Always confirm 10-digit mobile for SMS appointment reminders.</li>
                <li>Tag senior citizens & wheelchair patients for priority cabin assistance.</li>
                <li>Save & Send directly routes to cabin without nursing queue hold.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Medical Representative (MR) & Visitor Gate Pass Tab */
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
            <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Briefcase size={18} />
                </div>
                Medical Representative (MR) & Corporate Visitor Gate Pass
              </span>
              <span className="badge badge-info" style={{ fontWeight: 700, fontSize: 12 }}>OPD Security Pass</span>
            </div>

            <div className="card-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label htmlFor="companyName" className="form-label required" style={{ fontWeight: 700 }}>Pharmaceutical / Company Name</label>
                  <input
                    id="companyName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sun Pharma, Cipla, Torrent, Glenmark"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mrName" className="form-label required" style={{ fontWeight: 700 }}>Representative Full Name</label>
                  <input
                    id="mrName"
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
                  <label htmlFor="mrMobile" className="form-label required" style={{ fontWeight: 700 }}>Contact Mobile Number</label>
                  <input
                    id="mrMobile"
                    type="tel"
                    maxLength={10}
                    className="form-input"
                    placeholder="10-digit mobile"
                    value={mrMobile}
                    onChange={e => setMrMobile(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorToMeet" className="form-label required" style={{ fontWeight: 700 }}>Doctor to Meet</label>
                  <select
                    id="doctorToMeet"
                    className="form-select"
                    value={doctorToMeet}
                    onChange={e => setDoctorToMeet(e.target.value)}
                  >
                    <option value="Dr. Raj Valaki">Dr. Raj Valaki (Dermatology — Cabin 1)</option>
                    <option value="Dr. Anita Soni">Dr. Anita Soni (General Medicine — Cabin 2)</option>
                    <option value="Dr. Priya Mehta">Dr. Priya Mehta (Pediatrics — Cabin 3)</option>
                    <option value="Dr. Suresh Kumar">Dr. Suresh Kumar (Surgery — Cabin 4)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="productsPromoting" className="form-label" style={{ fontWeight: 700 }}>Products Promoting / Discussion Agenda</label>
                <input
                  id="productsPromoting"
                  type="text"
                  className="form-input"
                  placeholder="e.g. New Antifungal Ointment, Vitamin D3 Drops, Dermatology Laser Equipment"
                  value={productsPromoting}
                  onChange={e => setProductsPromoting(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sampleDetails" className="form-label" style={{ fontWeight: 700 }}>Sample Drops / Literature Details</label>
                <textarea
                  id="sampleDetails"
                  rows={3}
                  className="form-textarea"
                  placeholder="List any physician samples, clinical trial dossiers, or promotional materials handed over at desk..."
                  value={sampleDetails}
                  onChange={e => setSampleDetails(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
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
                  style={{ fontWeight: 700, padding: '10px 22px' }}
                >
                  <FileBadge size={16} /> Issue Visitor Badge & Log Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
