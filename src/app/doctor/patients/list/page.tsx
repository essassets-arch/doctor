'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Search, Clock, FileText, Stethoscope,
  Phone, Eye, Activity, Play, ArrowLeft
} from 'lucide-react';
import { usePatientStore, useConsultationStore, Patient } from '@/store';

export default function DoctorPatientListPage() {
  const router = useRouter();
  const { patients } = usePatientStore();
  const { initSession } = useConsultationStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.mrdNumber.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      (p.city && p.city.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  const handleStartDirectEncounter = (patient: Patient) => {
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Records & Medical File Lookup</h1>
          <p className="page-subtitle">Search registered hospital EHR files, historical diagnoses, past prescriptions, and open new consultation encounters.</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar">
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by patient name, MRD number, phone number, or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <User size={16} color="#036d92" />
            Hospital EHR Patient Directory — {filteredPatients.length} Files
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>MRD Number</th>
                <th>Patient Name</th>
                <th>Age / Sex</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Blood</th>
                <th>Medical Flags</th>
                <th style={{ textAlign: 'right' }}>Clinical Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(p => (
                <tr key={p.id}>
                  <td>
                    <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                      {p.mrdNumber}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {p.firstName} {p.middleName ? p.middleName + ' ' : ''}{p.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Registered: {p.createdAt}
                    </div>
                  </td>

                  <td>{p.age} Yrs / {p.gender}</td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <Phone size={12} color="var(--text-muted)" />
                      {p.mobile}
                    </div>
                  </td>

                  <td>{p.city || 'Surat'}</td>

                  <td>
                    <span className="badge badge-danger">{p.bloodGroup || 'N/A'}</span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.tags?.map(t => (
                        <span key={t} className="badge badge-warning" style={{ fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link href={`/doctor/patients/${p.id}/history`}>
                        <button className="btn btn-outline btn-sm" style={{ borderColor: '#036d92', color: '#036d92' }}>
                          <Activity size={13} /> History
                        </button>
                      </Link>

                      <button
                        onClick={() => handleStartDirectEncounter(p)}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#036d92', borderColor: '#036d92' }}
                      >
                        <Play size={13} /> Consult
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
