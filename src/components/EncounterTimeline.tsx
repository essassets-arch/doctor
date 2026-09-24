'use client';
import Link from 'next/link';
import { useAppointmentStore, useBillingStore, useConsultationStore, usePatientStore, useQueueStore } from '@/store';
import { totals } from '@/store/workflow';
export default function EncounterTimeline({ patientId }: { patientId: string }) {
  const patient = usePatientStore(s => s.patients.find(p => p.id === patientId));
  const { queue } = useQueueStore(); const { sessions } = useConsultationStore();
  const { bills, payments } = useBillingStore(); const { appointments } = useAppointmentStore();
  return <section className="card" style={{ padding: 20, marginBottom: 20 }}><h2>Permanent patient timeline</h2>
    <p>Registration: {patient?.createdAt} · {patient?.mrdNumber}</p>
    {appointments.filter(a => a.patientId === patientId).map(a => <p key={a.id}>Appointment: {a.date} {a.time} · {a.doctorName} · {a.status}</p>)}
    {!queue.some(q => q.patientId === patientId) && <p>No encounters found</p>}
    {queue.filter(q => q.patientId === patientId).map(q => {
      const session = sessions[q.caseNumber]; const bill = bills.find(b => b.encounterId === q.caseNumber);
      return <details key={q.id} style={{ margin: '16px 0' }}><summary>{q.createdAt || q.checkInTime} · {q.caseNumber} · {q.closedAt ? 'ENCOUNTER CLOSED' : session?.isFinalized ? 'READY FOR BILLING' : q.status}</summary>
        <p>Check-in · Token {q.tokenDisplay} · {q.doctorName}</p><p>Called: {q.calledAt || 'Not called'} · Started: {q.startedAt || 'Not started'}</p>
        {q.vitals && <p>Triage: BP {q.vitals.bloodPressure}, pulse {q.vitals.pulse}, temperature {q.vitals.temperature}, SpO₂ {q.vitals.spo2}, weight {q.vitals.weight}, height {q.vitals.height}</p>}
        {session && <><p>Complaint: {session.complaints.presentComplaint}</p><p>Diagnosis: {session.diagnosis.finalDiagnosis || session.diagnosis.provisional}</p><p>Advice: {session.diagnosis.patientAdvice}</p>
          <p>Prescriptions: {session.prescriptions.map(p => `${p.drugName} ${p.dosage} ${p.frequency} ${p.durationDays} days`).join('; ') || 'None'}</p>
          <p>Investigations: {session.investigations.map(i => i.testName).join(', ') || 'None'}</p>
          {session.procedures.map(p => <p key={p.id}>{p.procedureName} · Session {p.sessionNumber || p.sessionsCount} · {p.scheduledDate} · {p.status}</p>)}
          <p>Follow-up: {session.diagnosis.followUpDate || 'Not requested'} · {session.diagnosis.followUpPurpose}</p>
          <Link href={`/doctor/consultation/${q.caseNumber}`}>Open full clinical record, images and consent</Link>
        </>}
        {bill && <p>Bill: ₹{totals(bill).net.toFixed(2)} · Balance: ₹{totals(bill).outstanding.toFixed(2)} · {bill.lifecycle} {bill.lifecycle === 'FINALIZED' && <Link href={`/reception/billing/invoice/${bill.id}`}>Invoice {bill.invoiceNumber}</Link>}</p>}
        {payments.filter(p => p.encounterId === q.caseNumber).map(p => <p key={p.id}>Payment: {p.date} · {p.mode} · ₹{p.amount.toFixed(2)}</p>)}
        {q.closedAt && <p>Discharged and encounter closed: {q.closedAt} · Doctor: {q.doctorName} · Payment: {q.billingStatus}</p>}
      </details>;
    })}
  </section>;
}
