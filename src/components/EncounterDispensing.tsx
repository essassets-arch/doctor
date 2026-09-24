'use client';
import { useState } from 'react';
import { useConsultationStore } from '@/store';
import { dispensePrescription } from '@/store/workflow';
export default function EncounterDispensing() {
  const { sessions } = useConsultationStore(); const [error, setError] = useState('');
  const records = Object.values(sessions).filter(s => s.isFinalized && s.prescriptions.length);
  return <section className="card" style={{ padding: 20, marginBottom: 20 }}><h2>Encounter prescriptions</h2>{error && <p role="alert">{error}</p>}{!records.length && <p>No records found</p>}
    {records.map(s => <div key={s.caseId}><h3>{s.patientName} · {s.caseId}</h3>{s.prescriptions.map(p => <p key={p.id}>{p.drugName} · Qty {p.totalQty} · {p.dosage} {p.frequency} <button className="btn" disabled={p.dispensed} onClick={() => { setError(''); try { dispensePrescription(s.caseId, p.id); } catch (e) { setError(e instanceof Error ? e.message : 'Dispensing failed.'); } }}>{p.dispensed ? 'Dispensed & billed' : 'Dispense & add to encounter bill'}</button></p>)}</div>)}
  </section>;
}
