'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity, ArrowLeft, Calendar, Stethoscope, Heart,
  FileSignature, Printer, Search, CheckCircle2,
  AlertCircle, Pill, Thermometer, ShieldCheck, Play
} from 'lucide-react';
import { usePatientStore, useClinicalStore, useConsultationStore } from '@/store';

export default function DoctorPatientClinicalHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();

  const { patients } = usePatientStore();
  const { records } = useClinicalStore();
  const { initSession } = useConsultationStore();

  const patient = patients.find(p => p.id === patientId);
  const patientRecords = records.filter(r => r.patientId === patientId);

  if (!patient) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto 14px' }} />
          <h2>Patient Record Not Found</h2>
          <Link href="/doctor/patients/list" style={{ marginTop: 16, display: 'inline-block' }}>
            <button className="btn btn-primary">Return to Directory</button>
          </Link>
        </div>
      </div>
    );
  }

  const handleStartConsult = () => {
    const caseId = `C${Date.now().toString().slice(-4)}-001-190926`;
    initSession(caseId, patient, {
      id: 'doc-1',
      name: 'Dr. Raj Valaki',
      specialization: 'Dermatology',
      initials: 'RV',
      avatarColor: '#036d92',
      room: 'Room 1'
    });
    router.push(`/doctor/consultation/${caseId}`);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/doctor/patients/list" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#036d92', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Patient Directory
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            Clinical History Timeline — {patient.firstName} {patient.lastName}
          </h1>
          <p className="page-subtitle">
            MRD: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#036d92' }}>{patient.mrdNumber}</span> • {patient.age} Yrs ({patient.gender === 'M' ? 'Male' : 'Female'}) • Blood: <strong style={{ color: 'var(--danger)' }}>{patient.bloodGroup || 'N/A'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm">
            <Printer size={14} /> Print Summary
          </button>
          <button
            onClick={handleStartConsult}
            className="btn btn-primary btn-sm"
            style={{ background: '#036d92', borderColor: '#036d92' }}
          >
            <Play size={14} /> Start Consultation
          </button>
        </div>
      </div>

      {/* Timeline Display */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Activity size={16} color="#036d92" />
            Chronological Encounters & Diagnoses ({patientRecords.length})
          </span>
        </div>

        <div className="card-body">
          {patientRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No previous clinical consultations recorded for this patient.
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid #E2E8F0' }}>
              {patientRecords.map(rec => (
                <div key={rec.id} style={{ marginBottom: 24, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -31, top: 2,
                    width: 14, height: 14, borderRadius: '50%', background: '#036d92',
                    border: '3px solid white', boxShadow: '0 0 0 2px #036d92'
                  }} />

                  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#036d92' }}>
                        {rec.department} Encounter — {rec.doctorName}
                      </div>
                      <span className="badge badge-primary">{rec.date}</span>
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                      <strong>Diagnosis:</strong> <span style={{ color: '#036d92', fontWeight: 700 }}>{rec.diagnosis}</span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <strong>Presenting Symptoms:</strong> {rec.chiefComplaint}
                    </div>

                    <div style={{ display: 'flex', gap: 14, fontSize: 11, background: '#FFFFFF', padding: 8, borderRadius: 6, marginBottom: 10 }}>
                      <span><strong>BP:</strong> {rec.vitals.bp}</span>
                      <span><strong>Pulse:</strong> {rec.vitals.pulse}</span>
                      <span><strong>Temp:</strong> {rec.vitals.temp}</span>
                      <span><strong>Weight:</strong> {rec.vitals.weight}</span>
                      <span><strong>SpO2:</strong> {rec.vitals.spo2}</span>
                    </div>

                    {rec.prescription && rec.prescription.length > 0 && (
                      <div style={{ fontSize: 12 }}>
                        <strong>Prescribed Medication:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                          {rec.prescription.map((rx, idx) => (
                            <li key={idx}>
                              <strong>{rx.medicine}</strong> ({rx.dosage}, {rx.duration}) — {rx.instructions}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
