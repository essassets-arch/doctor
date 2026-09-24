'use client';
import { use } from 'react';
import Link from 'next/link';
import { usePatientStore } from '@/store';
import EncounterTimeline from './EncounterTimeline';
export default function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const patient = usePatientStore(s => s.patients.find(p => p.id === id));
  if (!patient) return <main className="page-container"><h1>No records found</h1><Link href="/reception/search">Search patients</Link></main>;
  return <main className="page-container"><h1>{patient.firstName} {patient.middleName} {patient.lastName}</h1><p>{patient.mrdNumber} · {patient.mobile}</p>
    <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}><Link className="btn btn-primary" href={`/reception/checkin?patientId=${id}`}>Check in</Link><Link className="btn" href={`/reception/appointments?patientId=${id}`}>Book appointment</Link><Link className="btn" href="/reception/search">Search patients</Link></div>
    <section className="card" style={{ padding: 20, marginBottom: 20 }}><h2>Registration details</h2><dl>{Object.entries(patient).filter(([key]) => !['id', 'isNew'].includes(key)).map(([key, value]) => <div key={key} style={{ display: 'flex', gap: 16 }}><dt>{key}</dt><dd>{Array.isArray(value) ? value.join(', ') : String(value ?? '')}</dd></div>)}</dl></section>
    <EncounterTimeline patientId={id} />
  </main>;
}
