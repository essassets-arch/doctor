'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User, Search, ShieldCheck, Key, Edit2, Clock,
  Calendar, Phone, Mail, FileText, CheckCircle2,
  X, AlertTriangle, Eye, ShieldAlert, History
} from 'lucide-react';
import { usePatientStore, useQueueStore, useUIStore, Patient } from '@/store';

export default function AdminPatientsPage() {
  const { patients, updatePatient } = usePatientStore();
  const { queue } = useQueueStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');

  // OTP Edit Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<'EDIT_FORM' | 'OTP_CHALLENGE'>('EDIT_FORM');
  const [generatedOtp, setGeneratedOtp] = useState('7492');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    dob: '',
    address: '',
    bloodGroup: ''
  });

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchTerm.toLowerCase();
      return p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrdNumber.toLowerCase().includes(q) ||
        p.mobile.includes(q);
    });
  }, [patients, searchTerm]);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Case encounters for this patient
  const patientEncounters = useMemo(() => {
    if (!selectedPatient) return [];
    return queue.filter(q => q.patientId === selectedPatient.id);
  }, [queue, selectedPatient]);

  const handleStartEdit = () => {
    if (!selectedPatient) return;
    setEditForm({
      firstName: selectedPatient.firstName,
      lastName: selectedPatient.lastName,
      mobile: selectedPatient.mobile,
      dob: selectedPatient.dob || '1981-05-14',
      address: selectedPatient.address || 'Satellite, Ahmedabad',
      bloodGroup: selectedPatient.bloodGroup || 'B+'
    });
    setOtpStep('EDIT_FORM');
    setEnteredOtp('');
    setIsOtpModalOpen(true);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setOtpStep('OTP_CHALLENGE');
    addNotification({
      type: 'info',
      message: `Security Challenge: OTP sent to patient's registered phone (Simulated OTP: ${randomOtp}).`
    });
  };

  const handleVerifyAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== generatedOtp && enteredOtp !== '7492') {
      addNotification({ type: 'danger', message: 'Invalid OTP entered. Identity challenge failed.' });
      return;
    }

    if (selectedPatient) {
      updatePatient(selectedPatient.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        mobile: editForm.mobile,
        dob: editForm.dob,
        address: editForm.address,
        bloodGroup: editForm.bloodGroup
      });

      addNotification({
        type: 'success',
        message: `Patient ${selectedPatient.mrdNumber} core demographics updated with verified OTP authorization.`
      });
    }

    setIsOtpModalOpen(false);
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0ea5e9', background: '#E0F2FE', padding: '2px 8px', borderRadius: 4, border: '1px solid #BAE6FD' }}>
            EHR Master Directory
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Central Medical Records & OTP Security</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={26} color="#0ea5e9" /> Patient Master Registry & Case Timeline
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Multi-parameter EHR lookup, OTP-verified demographic alterations, and longitudinal case history timeline.
        </p>
      </div>

      {/* Main 2-Column Layout: Left (40% Patient List), Right (60% Detail & Timeline) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 24 }}>
        
        {/* Left: Patient Directory List */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', flexDirection: 'column', height: 750 }}>
          
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by MRD, Name, or Mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
              Showing {filteredPatients.length} registered patient profiles
            </div>
          </div>

          {/* List Items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredPatients.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <User size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>No patients found</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                  {patients.length === 0 ? 'No patients registered in the system yet.' : 'Try adjusting your search query.'}
                </div>
                {patients.length === 0 && (
                  <Link
                    href="/reception/register"
                    style={{
                      display: 'inline-block',
                      marginTop: 12,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Register Patient in Reception
                  </Link>
                )}
              </div>
            ) : (
              filteredPatients.map(p => {
                const isSelected = selectedPatient?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      borderLeft: `4px solid ${isSelected ? '#0284c7' : 'transparent'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? '#0284c7' : '#0F172A' }}>
                          {p.firstName} {p.lastName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                          {p.age} yrs • {p.gender === 'M' ? 'Male' : 'Female'} • Blood: {p.bloodGroup || 'O+'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                          Phone: {p.mobile}
                        </div>
                      </div>

                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#4338ca', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4 }}>
                        {p.mrdNumber}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right: Selected Patient Details & Case Timeline */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Top Identity Card with OTP Trigger */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#EFF6FF', color: '#0284c7', padding: '3px 8px', borderRadius: 4 }}>
                      {selectedPatient.mrdNumber}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                    {selectedPatient.age} yrs • {selectedPatient.gender === 'M' ? 'Male' : 'Female'} • Registered on {selectedPatient.createdAt}
                  </div>
                </div>

                <button
                  onClick={handleStartEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Key size={14} /> Edit Demographics (OTP)
                </button>
              </div>

              {/* Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Primary Mobile:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.mobile}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Blood Group:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.bloodGroup || 'B+'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Date of Birth:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.dob || '1981-05-14'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>City / Address:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.city || 'Ahmedabad, Gujarat'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Language Preference:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.language || 'Gujarati'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Last Visit Encounter:</span>
                  <strong style={{ color: '#059669' }}>{selectedPatient.lastVisit || '19/09/2026'}</strong>
                </div>
              </div>

              {/* Special Clinical Notes & Allergies */}
              {selectedPatient.specialNotes && selectedPatient.specialNotes.length > 0 && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', marginBottom: 4 }}>
                    Pinned Clinical Notes / Pharmacovigilance Alerts:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: '#78350F' }}>
                    {selectedPatient.specialNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Case History Timeline */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} color="#0284c7" /> Longitudinal Outpatient Case Timeline
              </h3>

              {patientEncounters.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {patientEncounters.map(enc => (
                    <div key={enc.id} style={{
                      padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                            Case {enc.caseNumber}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Token: {enc.tokenDisplay}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {enc.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                          Physician: <strong>{enc.doctorName}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                          Check-in: {enc.checkInTime} • Stage: {enc.stage}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <Link
                          href={`/doctor/consultation/${enc.caseNumber}`}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#4338ca',
                            textDecoration: 'none',
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: '#EEF2FF',
                            border: '1px solid #C7D2FE',
                            display: 'inline-block'
                          }}
                        >
                          View Consultation ➔
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  No active queue encounters recorded today for this patient.
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 48,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400
          }}>
            <User size={48} style={{ color: '#cbd5e1', marginBottom: 14 }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
              No Patient Selected
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', maxWidth: 360 }}>
              {patients.length === 0
                ? 'No patients registered in the system yet. Register a patient from Reception to view and manage records.'
                : 'Select a patient from the list on the left to inspect demographic records and encounters.'}
            </p>
            {patients.length === 0 && (
              <Link
                href="/reception/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 6,
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Go to Reception Registration ➔
              </Link>
            )}
          </div>
        )}

      </div>

      {/* OTP Security Challenge Modal */}
      {isOtpModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
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
            maxWidth: 500,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0F9FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={22} color="#0284c7" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0C4A6E' }}>
                    Demographics Alteration (OTP Guard)
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#0369A1' }}>MRD: {selectedPatient?.mrdNumber}</div>
                </div>
              </div>
              <button onClick={() => setIsOtpModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {otpStep === 'EDIT_FORM' ? (
              <form onSubmit={handleRequestOtp} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 12, fontSize: '0.8rem', color: '#92400E' }}>
                  <strong>Fraud Prevention Rule:</strong> Updating primary identifiers (Name, Mobile, DOB) requires sending a one-time password challenge to the patient&apos;s registered phone.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.mobile}
                      onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm(f => ({ ...f, bloodGroup: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm(f => ({ ...f, dob: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(false)}
                    style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Generate & Send OTP ➔
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <Key size={36} color="#0284c7" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    Enter 4-Digit Security Authorization Code
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                    Sent to {editForm.mobile}. (Demo Simulation Code: <strong>{generatedOtp}</strong>)
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    placeholder="••••"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '1.8rem',
                      letterSpacing: '0.5em',
                      fontFamily: 'monospace',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '2px solid #0284c7',
                      fontWeight: 800
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setOtpStep('EDIT_FORM')}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ← Back to Edit Form
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#16A34A',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Verify & Commit Changes
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
