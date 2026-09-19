'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Activity, FileText, ArrowLeft, HeartPulse,
  AlertTriangle, CheckCircle2, Clock, Phone, MapPin,
  Calendar, ShieldAlert, ArrowRight, Stethoscope
} from 'lucide-react';
import { usePatientStore, useQueueStore } from '@/store';

export default function NursingPatientHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();

  const { patients } = usePatientStore();
  const { queue } = useQueueStore();

  const patient = patients.find(p => p.id === patientId) || patients[0];
  const patientQueueEntries = queue.filter(q => q.patientId === patient?.id);

  // Cases dropdown
  const cases = [
    { id: 'C003-001-190926', date: '19/09/2026', doctor: 'Dr. Raj Valaki', status: 'ACTIVE (TODAY)' },
    { id: 'C003-001-100926', date: '10/09/2026', doctor: 'Dr. Raj Valaki', status: 'COMPLETED' },
    { id: 'C003-001-150826', date: '15/08/2026', doctor: 'Dr. Anita Soni', status: 'COMPLETED' }
  ];

  const [selectedCaseId, setSelectedCaseId] = useState(cases[0].id);

  if (!patient) {
    return (
      <div className="page-container" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Patient Record Not Found</h2>
        <Link href="/nursing/dashboard">
          <button className="btn btn-primary" style={{ marginTop: 14 }}>Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/nursing/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Nursing Dashboard
          </Link>
          <h1 className="page-title" style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
            Nursing Clinical Patient Hub
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B' }}>
            Longitudinal patient overview: Inspect past vitals trends, active cases, and launch pre-consultation triage.
          </p>
        </div>

        {/* 7.2 Quick-Jump Button */}
        <Link
          href={`/nursing/vitals?patientId=${patient.id}&caseId=${selectedCaseId}`}
          className="btn btn-primary btn-lg"
          style={{
            background: '#059669', borderColor: '#059669',
            fontSize: 13.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8
          }}
        >
          <Activity size={16} /> Open Complaints & Vitals Desk →
        </Link>
      </div>

      {/* 7.1 Patient Demographic Card */}
      <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', background: '#FFFFFF', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: '#059669', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22
            }}>
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>
                  {patient.firstName} {patient.middleName || ''} {patient.lastName}
                </span>
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, border: '1px solid #a7f3d0' }}>
                  {patient.mrdNumber}
                </span>
                {patient.tags?.map(tag => (
                  <span key={tag} className="badge badge-warning" style={{ fontSize: 10 }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Age: <strong>{patient.age} Years</strong></span>
                <span>Gender: <strong>{patient.gender === 'M' ? 'Male' : 'Female'}</strong></span>
                <span>Blood: <strong>{patient.bloodGroup || 'O+'}</strong></span>
                <span>Phone: <strong>{patient.mobile}</strong></span>
                <span>City: <strong>{patient.city || 'Surat'}</strong></span>
              </div>
            </div>
          </div>

          {/* Case Dropdown */}
          <div style={{ minWidth: 260 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
              Active / Historical Encounter Case:
            </label>
            <select
              className="form-select"
              style={{ width: '100%', fontSize: 12.5, fontWeight: 700, borderColor: '#CBD5E1' }}
              value={selectedCaseId}
              onChange={e => setSelectedCaseId(e.target.value)}
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} • {c.date} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Left Vitals Summary + Right Special Notes & Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Left: Recent Vitals Baseline Card */}
        <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartPulse size={16} color="#059669" /> Baseline Physiological Profile
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Blood Pressure</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginTop: 2 }}>120 / 80</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>Normotensive</div>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Pulse Rate</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginTop: 2 }}>76 bpm</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>Regular rhythm</div>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Oxygen Saturation</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginTop: 2 }}>99%</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>SpO2 Room Air</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Body Temperature</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginTop: 2 }}>98.6 °F</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>Afebrile</div>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Height / Weight</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginTop: 2 }}>168 cm / 68 kg</div>
              <div style={{ fontSize: 10, color: '#64748B' }}>Last verified 10 Sep</div>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Body Mass Index</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#059669', marginTop: 2 }}>24.1</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>Normal Weight</div>
            </div>
          </div>
        </div>

        {/* Right: Clinical Alerts & Special Notes */}
        <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="#DC2626" /> Clinical Warnings & Special Notes
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Allergies Warning */}
            <div style={{ padding: '10px 12px', background: '#FFF1F2', borderRadius: 10, border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 12 }}>
              <strong style={{ display: 'block', color: '#DC2626' }}>⚠ Documented Drug Allergies:</strong>
              Sulfa drugs (mild urticaria), Penicillin anaphylactoid caution.
            </div>

            {/* Special Notes list */}
            {patient.specialNotes && patient.specialNotes.length > 0 ? (
              patient.specialNotes.map((note: string, i: number) => (
                <div key={i} style={{ padding: '10px 12px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FCD34D', color: '#92400E', fontSize: 12 }}>
                  <strong style={{ display: 'block', color: '#D97706' }}>📌 Clinical Attention Flag:</strong>
                  {note}
                </div>
              ))
            ) : (
              <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 10, fontSize: 12, color: '#64748B', border: '1px solid #F1F5F9' }}>
                No missed appointment flags recorded.
              </div>
            )}

            {/* Past Surgeries / Conditions */}
            <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12, color: '#334155' }}>
              <strong>Chronic Medical History:</strong> Hypertension (3 years on Telmisartan 40mg). Appendectomy in 2018.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
