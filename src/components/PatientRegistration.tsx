'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePatientStore, type Gender } from '@/store';
const initial = { firstName: '', middleName: '', lastName: '', dob: '', gender: 'Other', mobile: '', alternateMobile: '', email: '', address: '', city: '', state: '', pincode: '', language: 'English', emergencyContact: '', bloodGroup: '', allergies: '', notes: '' };
export default function PatientRegistration() {
  const router = useRouter(); const [form, setForm] = useState(initial); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const birth = form.dob ? new Date(`${form.dob}T00:00:00`) : null; const today = new Date();
  const age = birth ? today.getFullYear() - birth.getFullYear() - (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0) : '';
  const save = (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const existing = usePatientStore.getState().patients.find(p => p.mobile.replace(/\D/g, '') === form.mobile.replace(/\D/g, '') && p.firstName.trim().toLowerCase() === form.firstName.trim().toLowerCase() && p.lastName.trim().toLowerCase() === form.lastName.trim().toLowerCase());
      if (existing) { router.push(`/reception/patients/${existing.id}`); return; }
      const patient = usePatientStore.getState().addPatient({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), age: Number(age), ageMonths: 0, ageDays: 0, gender: form.gender as Gender, language: form.language as 'English' | 'Hindi' | 'Gujarati', specialNotes: form.notes ? [form.notes] : [] });
      router.push(`/reception/patients/${patient.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save registration.'); setBusy(false); }
  };
  return <main className="page-container"><h1>Patient registration</h1><p>MRD is generated uniquely when the patient is saved.</p><Link href="/reception/search">Search for an existing patient first</Link>{error && <p role="alert">{error}</p>}
    <form onSubmit={save} className="card" style={{ padding: 24, marginTop: 20 }}><div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
      {Object.entries(form).map(([key, value]) => <label key={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
        {['gender', 'language'].includes(key) ? <select className="form-select" value={value} onChange={e => setForm({ ...form, [key]: e.target.value })}>{(key === 'gender' ? ['M', 'F', 'Other'] : ['English', 'Hindi', 'Gujarati']).map(v => <option key={v}>{v}</option>)}</select> : <input className="form-input" type={key === 'dob' ? 'date' : key === 'email' ? 'email' : 'text'} required={['firstName', 'lastName', 'dob', 'mobile'].includes(key)} value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
      </label>)}<label>Age (derived from DOB)<input className="form-input" value={age} readOnly /></label>
    </div><button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy}>{busy ? 'Saving…' : 'Save patient'}</button></form>
  </main>;
}
