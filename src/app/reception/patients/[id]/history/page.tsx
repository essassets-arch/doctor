'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, Calendar, Stethoscope, Heart,
  FileSignature, Printer, Search, Filter, CheckCircle2,
  AlertCircle, Pill, Thermometer, ShieldCheck
} from 'lucide-react';
import { usePatientStore, useClinicalStore, ClinicalRecord } from '@/store';

export default function PatientClinicalHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;

  const { patients } = usePatientStore();
  const { records } = useClinicalStore();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const patient = patients.find(p => p.id === patientId);
  const patientRecords = records.filter(r => r.patientId === patientId);

  if (!isMounted) {
    return (
      <div className="page-container" style={{ padding: '24px 0', minHeight: '80vh' }}>
        <div style={{ height: 18, width: 140, background: '#E2E8F0', borderRadius: 4, marginBottom: 16 }} />
        <div className="card" style={{ height: 120, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }} />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto 14px' }} />
          <h2>Patient Not Found</h2>
          <Link href="/reception/search" style={{ marginTop: 16, display: 'inline-block' }}>
            <button className="btn btn-primary">Return to Directory</button>
          </Link>
        </div>
      </div>
    );
  }

  // Filtered records
  const filtered = patientRecords.filter(r => {
    if (selectedDoctor !== 'ALL' && r.doctorName !== selectedDoctor) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.chiefComplaint.toLowerCase().includes(q) ||
        r.diagnosis.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <Link href={`/reception/patients/${patient.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Patient Hub
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            Clinical History Timeline — {patient.firstName} {patient.lastName}
          </h1>
          <p className="page-subtitle">
            MRD: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{patient.mrdNumber}</span> • {patient.age} Yrs ({patient.gender === 'M' ? 'Male' : 'Female'}) • Blood: {patient.bloodGroup || 'N/A'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} className="btn btn-ghost">
            <Printer size={15} /> Print Clinical Summary
          </button>
          <Link href={`/reception/checkin?patientId=${patient.id}`}>
            <button className="btn btn-primary">
              Check In For Today's Visit
            </button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search diagnosis, complaints, medicines..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Doctor:</span>
            <select
              className="form-select"
              style={{ width: 220 }}
              value={selectedDoctor}
              onChange={e => setSelectedDoctor(e.target.value)}
            >
              <option value="ALL">All Attending Physicians</option>
              <option value="Dr. Raj Valaki">Dr. Raj Valaki (Dermatology)</option>
              <option value="Dr. Anita Soni">Dr. Anita Soni (General Medicine)</option>
              <option value="Dr. Priya Mehta">Dr. Priya Mehta (Gynecology)</option>
              <option value="Dr. Suresh Kumar">Dr. Suresh Kumar (Orthopedics)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3>No Past Clinical Encounters Recorded</h3>
            <p style={{ fontSize: 13, marginTop: 4 }}>New patients have clinical notes entered by the physician during their visit.</p>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 30 }}>
          {/* Vertical timeline spine */}
          <div style={{
            position: 'absolute', left: 8, top: 0, bottom: 0,
            width: 2, background: 'var(--border)'
          }} />

          {filtered.map((record, index) => (
            <div key={record.id} style={{ position: 'relative', marginBottom: 28 }}>
              {/* Timeline Node Dot */}
              <div style={{
                position: 'absolute', left: -30, top: 20,
                width: 18, height: 18, borderRadius: '50%',
                background: index === 0 ? 'var(--primary)' : 'var(--bg-card)',
                border: '3px solid var(--primary)',
                boxShadow: index === 0 ? '0 0 0 4px var(--primary-glow)' : 'none'
              }} />

              {/* Card */}
              <div className="card">
                <div className="card-header" style={{ background: index === 0 ? 'var(--primary-light)' : 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Calendar size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 800, fontSize: 14 }}>
                      Encounter Date: {record.date}
                    </span>
                    <span className="badge badge-primary">{record.department}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Stethoscope size={15} color="var(--text-muted)" />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{record.doctorName}</span>
                  </div>
                </div>

                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Complaint & Diagnosis */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Chief Complaints & Reported Symptoms
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                        {record.chiefComplaint}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Clinical Diagnosis
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                        {record.diagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Vitals Ribbon */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Triage Vitals Recorded
                    </div>
                    <div style={{
                      display: 'flex', gap: 20, padding: '10px 16px',
                      background: 'var(--bg-muted)', borderRadius: 8, fontSize: 13
                    }}>
                      <span><strong>BP:</strong> {record.vitals.bp} mmHg</span>
                      <span><strong>Pulse:</strong> {record.vitals.pulse} bpm</span>
                      <span><strong>Temp:</strong> {record.vitals.temp}</span>
                      <span><strong>Weight:</strong> {record.vitals.weight}</span>
                      <span><strong>SpO2:</strong> {record.vitals.spo2}</span>
                    </div>
                  </div>

                  {/* Prescription Table */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Prescription / Rx Orders
                    </div>
                    <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Duration</th>
                            <th>Special Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.prescription.map((rx, rIndex) => (
                            <tr key={rIndex}>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Pill size={14} color="var(--primary)" />
                                  <span>{rx.medicine}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{rx.dosage}</td>
                              <td>{rx.duration}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{rx.instructions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Follow up date */}
                  {record.followUpDate && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'var(--success-light)',
                      borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)'
                    }}>
                      <span style={{ fontWeight: 700, color: '#065F46', fontSize: 13 }}>
                        Recommended Follow-Up Date: {record.followUpDate}
                      </span>
                      <Link href={`/reception/appointments?patientId=${patient.id}`}>
                        <button className="btn btn-success btn-sm">
                          Schedule Follow-Up
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
