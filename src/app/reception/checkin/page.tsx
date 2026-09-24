'use client';
import { Suspense, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore, useAppointmentStore, usePatientStore, useQueueStore, type PaymentMode, type VisitType } from '@/store';
import { checkIn } from '@/store/workflow';
import { atomic } from '@/store/persistence';

function CheckIn() {
  const params = useSearchParams();
  const { patients } = usePatientStore(); const { doctors, queue } = useQueueStore();
  const { settings } = useAdminStore(); const { appointments } = useAppointmentStore();
  const [patientId, setPatientId] = useState(params.get('patientId') || '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [search, setSearch] = useState(''); const [visit, setVisit] = useState<VisitType>('Consultation');
  const [appointmentId, setAppointmentId] = useState(params.get('appointmentId') || '');
  const [payNow, setPayNow] = useState(false); const [mode, setMode] = useState<PaymentMode>('CASH');
  const [reference, setReference] = useState(''); const [provider, setProvider] = useState('');
  const [error, setError] = useState(''); const [created, setCreated] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const request = useRef(crypto.randomUUID());
  const fee = visit === 'Follow-Up' ? settings.followUpFee : settings.consultationFee;
  const patient = patients.find(p => p.id === patientId);
  const submit = () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      const doctor = doctors.find(d => d.id === doctorId);
      if (!patient || !doctor) throw new Error('Select the patient and doctor.');
      if (fee === undefined) throw new Error('Configure the consultation fee in Admin Settings.');
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointmentId && (!appointment || appointment.patientId !== patientId || appointment.doctorId !== doctorId || appointment.status !== 'SCHEDULED')) throw new Error('Select a scheduled appointment for this patient and doctor.');
      const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
      const number = queue.filter(q => q.caseNumber.startsWith(`ENC-${date}-`)).length + 1;
      const encounterId = `ENC-${date}-${String(number).padStart(4, '0')}`;
      const entry = atomic(() => {
        const result = checkIn({ caseNumber: encounterId, tokenDisplay: `A-${String(queue.length + 1).padStart(3, '0')}`,
          patientId, patientName: `${patient.firstName} ${patient.lastName}`, doctorId, doctorName: doctor.name,
          visitType: visit, appointmentTime: appointment?.time || 'Walk-in', checkInTime: new Date().toISOString(),
          age: patient.age, gender: patient.gender, city: patient.city || '', billingStatus: payNow ? 'PAID' : 'PENDING',
          status: 'WAITING', stage: 'NURSING', vitalsRecorded: false, complaintsRecorded: false },
          payNow && fee > 0 ? [{ amount: fee, mode, reference, provider }] : [], request.current);
        if (appointment) useAppointmentStore.getState().updateAppointment(appointment.id, { status: 'ARRIVED' });
        return result;
      });
      setCreated(entry.caseNumber);
    } catch (e) { setError(e instanceof Error ? e.message : 'Check-in failed.'); }
    finally { lock.current = false; setBusy(false); }
  };
  if (created) return <main className="page-container"><h1>Check-in complete</h1><p data-testid="generated-case-id">{created}</p><p>Token: {queue.find(q => q.caseNumber === created)?.tokenDisplay}</p><Link className="btn btn-primary" href={`/nursing/vitals?caseId=${created}`}>Proceed to triage</Link> <Link href="/reception/queue">Open live queue</Link></main>;
  return <main className="page-container"><h1>Patient check-in</h1><section className="card" style={{ padding: 24, maxWidth: 720, display: 'grid', gap: 16 }}>
    {error && <p role="alert">{error}</p>}
    <label>Search by MRD, mobile or patient name<input className="form-input" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <label>Patient<select className="form-select" value={patientId} onChange={e => { setPatientId(e.target.value); setAppointmentId(''); }}><option value="">Select patient</option>{patients.filter(p => `${p.mrdNumber} ${p.mobile} ${p.firstName} ${p.middleName || ''} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.mrdNumber} — {p.firstName} {p.lastName}</option>)}</select></label>
    <Link href="/reception/register">Register a new patient</Link>
    <label>Doctor<select className="form-select" value={doctorId} onChange={e => setDoctorId(e.target.value)}>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <label>Entry type<select className="form-select" value={appointmentId} onChange={e => setAppointmentId(e.target.value)}><option value="">Walk-in</option>{appointments.filter(a => a.patientId === patientId && a.doctorId === doctorId && a.status === 'SCHEDULED').map(a => <option key={a.id} value={a.id}>Appointment: {a.date} {a.time}</option>)}</select></label>
    <label>Visit type<select className="form-select" value={visit} onChange={e => setVisit(e.target.value as VisitType)}><option>Consultation</option><option>Follow-Up</option><option>Procedure</option><option>Emergency</option></select></label>
    <p>Consultation fee: {fee === undefined ? 'Not configured' : `₹${fee.toFixed(2)}`}</p>
    <label><input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} /> Pay now (otherwise pay later)</label>
    {payNow && <><label>Payment mode<select className="form-select" value={mode} onChange={e => setMode(e.target.value as PaymentMode)}>{['CASH', 'CARD', 'UPI'].map(m => <option key={m}>{m}</option>)}</select></label>{mode !== 'CASH' && <><label>Reference<input className="form-input" value={reference} onChange={e => setReference(e.target.value)} /></label><label>Provider<input className="form-input" value={provider} onChange={e => setProvider(e.target.value)} /></label></>}</>}
    <button className="btn btn-primary" disabled={busy || fee === undefined} onClick={submit}>{busy ? 'Saving…' : 'Complete check-in'}</button>
  </section></main>;
}
export default function Page() { return <Suspense fallback={<p>Loading check-in…</p>}><CheckIn /></Suspense>; }
