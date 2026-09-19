'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, UserPlus, Phone, MapPin, Calendar, Clock,
  Filter, Tag, Eye, SquareCheckBig, CalendarPlus, Printer,
  X, CheckCircle2, QrCode, ArrowUpRight, Users, ShieldAlert
} from 'lucide-react';
import { usePatientStore, Patient } from '@/store';

export default function PatientSearchPage() {
  const router = useRouter();
  const { patients, searchQuery, searchPatients } = usePatientStore();

  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [stickerPatient, setStickerPatient] = useState<Patient | null>(null);

  // Filter patients based on search and tag chips
  const filtered = useMemo(() => {
    let list = patients;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrdNumber.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    }
    if (filterTag !== 'ALL') {
      if (filterTag === 'NEW') {
        list = list.filter(p => p.isNew);
      } else {
        list = list.filter(p => p.tags?.includes(filterTag));
      }
    }
    return list;
  }, [patients, searchQuery, filterTag]);

  // Statistics
  const totalCount = patients.length;
  const vipCount = patients.filter(p => p.tags?.includes('VIP')).length;
  const newCount = patients.filter(p => p.isNew).length;
  const diabeticCount = patients.filter(p => p.tags?.includes('Diabetic')).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Directory & Search</h1>
          <p className="page-subtitle">Centralized medical record archive. Look up patients by MRD number, mobile, or name to initiate check-in or booking.</p>
        </div>
        <Link href="/reception/register">
          <button className="btn btn-primary btn-lg">
            <UserPlus size={16} /> Register New Patient
          </button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-label">Total Registered</div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-sub">Central database records</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">New Registrations</div>
          <div className="stat-value">{newCount}</div>
          <div className="stat-sub">Enrolled this week</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">VIP Patients</div>
          <div className="stat-value">{vipCount}</div>
          <div className="stat-sub">Priority attention flags</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Diabetic / Chronic</div>
          <div className="stat-value">{diabeticCount}</div>
          <div className="stat-sub">Special care flags</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by MRD Number, Patient Name, Mobile No, or City..."
              value={searchQuery}
              onChange={e => searchPatients(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => searchPatients('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Filter:</span>
            {[
              { label: 'All Patients', value: 'ALL' },
              { label: 'VIP', value: 'VIP' },
              { label: 'Diabetic', value: 'Diabetic' },
              { label: 'Senior Citizen', value: 'Senior Citizen' },
              { label: 'New This Week', value: 'NEW' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterTag(f.value)}
                className={`badge ${filterTag === f.value ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Patients Table */}
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>MRD & Patient</th>
                <th>Contact</th>
                <th>Age / Gender</th>
                <th>City</th>
                <th>Blood Group</th>
                <th>Medical Tags</th>
                <th>Last Visit</th>
                <th style={{ textAlign: 'right' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600 }}>No patient records found matching "{searchQuery}"</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Check spelling or register this patient right now.</p>
                    <Link href="/reception/register" style={{ display: 'inline-block', marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm">
                        <UserPlus size={14} /> Register New Patient
                      </button>
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map(patient => {
                  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;
                  return (
                    <tr key={patient.id}>
                      {/* Name & MRD */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar avatar-md" style={{
                            background: patient.gender === 'F' ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'linear-gradient(135deg, #6366F1, #3B82F6)'
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                              {patient.firstName} {patient.middleName ? patient.middleName + ' ' : ''}{patient.lastName}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                                {patient.mrdNumber}
                              </span>
                              {patient.isNew && (
                                <span className="badge badge-success" style={{ fontSize: 10, padding: '1px 6px' }}>NEW</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{patient.mobile}</span>
                        </div>
                        {patient.email && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {patient.email}
                          </div>
                        )}
                      </td>

                      {/* Age & Gender */}
                      <td>
                        <span style={{ fontWeight: 600 }}>{patient.age} Yrs</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                          ({patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'})
                        </span>
                      </td>

                      {/* City */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} color="var(--text-muted)" />
                          <span>{patient.city || 'Surat'}</span>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td>
                        <span className="badge badge-danger" style={{ fontWeight: 800 }}>
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </td>

                      {/* Tags */}
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {patient.tags && patient.tags.length > 0 ? (
                            patient.tags.map(t => (
                              <span key={t} className={`badge ${t === 'VIP' ? 'badge-warning' : 'badge-purple'}`} style={{ fontSize: 10 }}>
                                {t}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Last Visit */}
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }} suppressHydrationWarning>
                          {patient.lastVisit ? patient.lastVisit.split('-').reverse().join('/') : 'New Patient'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <Link href={`/reception/patients/${patient.id}`} title="View Patient Hub">
                            <button className="btn btn-ghost btn-icon">
                              <Eye size={15} />
                            </button>
                          </Link>

                          <Link href={`/reception/checkin?patientId=${patient.id}`} title="Check-In Patient">
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                              <SquareCheckBig size={15} />
                            </button>
                          </Link>

                          <Link href={`/reception/appointments?patientId=${patient.id}`} title="Book Appointment">
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                              <CalendarPlus size={15} />
                            </button>
                          </Link>

                          <button
                            onClick={() => setStickerPatient(patient)}
                            className="btn btn-ghost btn-icon"
                            title="Print Thermal Sticker"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Showing {filtered.length} of {totalCount} total patient records</span>
          <span>Indexed by MedFlow Database Engine</span>
        </div>
      </div>

      {/* Thermal Sticker Modal */}
      {stickerPatient && (
        <div className="modal-overlay" onClick={() => setStickerPatient(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <Printer size={18} color="var(--primary)" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Patient Thermal Sticker
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setStickerPatient(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Sticker Card */}
              <div style={{
                background: '#FFFFFF',
                border: '2px dashed #94A3B8',
                borderRadius: 8,
                padding: 16,
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                fontFamily: 'monospace',
                color: '#0F172A'
              }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>MEDFLOW OPD CLINIC</div>
                  <div style={{ fontSize: 9, color: '#64748B' }}>Surat Central Branch • Tel: 0261-2800100</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>MRD: {stickerPatient.mrdNumber}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginTop: 2 }}>
                      {stickerPatient.firstName} {stickerPatient.lastName}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {stickerPatient.age}Y {stickerPatient.gender === 'M' ? 'Male' : stickerPatient.gender === 'F' ? 'Female' : 'Other'} • Blood: {stickerPatient.bloodGroup || 'B+'}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                      Mob: {stickerPatient.mobile}
                    </div>
                  </div>
                  <div style={{ width: 50, height: 50, background: '#F8FAFC', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                    <QrCode size={40} color="#0F172A" />
                  </div>
                </div>

                {/* Simulated barcode */}
                <div style={{
                  height: 28,
                  background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 8px, transparent 8px, transparent 9px)',
                  margin: '8px 0',
                  borderRadius: 2
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                  <span>Printed: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>Branch: Surat Main</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setStickerPatient(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Sticker (50×25mm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
