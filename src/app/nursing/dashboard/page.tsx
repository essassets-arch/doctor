'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity, Users, User, Clock, FileText, Search,
  CheckCircle2, AlertCircle, ArrowRight, HeartPulse,
  Upload, ShieldAlert, Sparkles, Filter, ChevronRight,
  ClipboardList, Stethoscope, AlertTriangle, MessageSquare
} from 'lucide-react';
import { useQueueStore, usePatientStore, useUIStore, QueueEntry, Patient } from '@/store';
import QueueStatusBadge from '@/components/QueueStatusBadge';

export default function NursingDashboardPage() {
  const router = useRouter();
  const { queue } = useQueueStore();
  const { patients } = usePatientStore();
  const { addNotification } = useUIStore();

  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_VITALS' | 'IN_SESSION' | 'COMPLETED'>('ALL');
  const [shiftNoteModal, setShiftNoteModal] = useState(false);
  const [shiftNote, setShiftNote] = useState('');
  const [shiftNotesList, setShiftNotesList] = useState<Array<{ id: string; time: string; text: string; author: string }>>([
    { id: '1', time: '09:15 AM', text: 'Diode laser cabin prepped & sanitized. Cryo-spray canister refilled.', author: 'Nurse Bhavna' },
    { id: '2', time: '10:00 AM', text: 'Glucometer strip lot verified. Calibrated with control solution.', author: 'Nurse Bhavna' }
  ]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Outside click listener for search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    return patients.filter(p =>
      p.firstName.toLowerCase().includes(debouncedSearch) ||
      p.lastName.toLowerCase().includes(debouncedSearch) ||
      p.mrdNumber.toLowerCase().includes(debouncedSearch) ||
      p.mobile.includes(debouncedSearch)
    ).slice(0, 5);
  }, [patients, debouncedSearch]);

  // Shift KPI calculations
  const totalPatientsToday = queue.length;
  const vitalsPendingQueue = queue.filter(q => q.status === 'WAITING' && !q.vitalsRecorded);
  const vitalsPendingCount = vitalsPendingQueue.length;
  const reportsToUploadCount = queue.filter(q => q.status === 'ON_HOLD' || (q.vitalsRecorded && !q.labReady)).length;
  const vitalsDoneCount = queue.filter(q => q.vitalsRecorded).length;

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue.filter(entry => {
      if (statusFilter === 'PENDING_VITALS') return !entry.vitalsRecorded && entry.status === 'WAITING';
      if (statusFilter === 'IN_SESSION') return entry.status === 'IN_SESSION';
      if (statusFilter === 'COMPLETED') return entry.status === 'COMPLETED';
      return true;
    });
  }, [queue, statusFilter]);

  const handleAddShiftNote = () => {
    if (!shiftNote.trim()) return;
    const newNote = {
      id: `sn-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: shiftNote.trim(),
      author: 'Nurse Bhavna'
    };
    setShiftNotesList([newNote, ...shiftNotesList]);
    setShiftNote('');
    setShiftNoteModal(false);
    addNotification({
      type: 'success',
      message: 'Shift handover note added successfully!'
    });
  };

  const emergencyPatient = queue.find(q => q.priority === 'EMERGENCY' && q.status !== 'COMPLETED');

  return (
    <div className="page-container" style={{ width: '100%', padding: '24px 20px' }}>
      {/* Critical Emergency Triage Alert Bar */}
      {emergencyPatient && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
          border: '1.5px solid #E11D48', borderRadius: 12,
          padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          boxShadow: '0 4px 12px rgba(225,29,72,0.12)',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={20} color="#E11D48" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#9F1239' }}>
              PRIORITY EMERGENCY TRIAGE: <strong>{emergencyPatient.patientName}</strong> ({emergencyPatient.tokenDisplay} • {emergencyPatient.caseNumber}) is flagged as EMERGENCY! Escort immediately to triage couch.
            </span>
          </div>
          <Link
            href={`/nursing/vitals?patientId=${emergencyPatient.patientId}&caseId=${emergencyPatient.caseNumber}&token=${emergencyPatient.tokenDisplay}`}
            className="btn btn-sm"
            style={{ background: '#E11D48', color: '#FFFFFF', fontWeight: 800, flexShrink: 0, padding: '6px 14px', borderRadius: 8 }}
          >
            Immediate Vitals Entry →
          </Link>
        </div>
      )}

      {/* Top Welcome & Subtitle Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ecfdf5', color: '#059669', padding: '4px 10px',
              borderRadius: 999, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              <HeartPulse size={14} /> Outpatient Triage & Clinical Coordination
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>Surat Central OPD • Morning Shift (08:00 – 16:00)</span>
          </div>
          <h1 className="page-title" style={{ marginTop: 6, fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
            Nursing Floor Command Dashboard
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B', maxWidth: 740 }}>
            Real-time physiological triage station: Record essential vital signs, assess chief complaints, and ingest diagnostic lab orders before consultation cabin entry.
          </p>
        </div>

        {/* Action Controls: Live Patient Search & Shift Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Search */}
          <div ref={searchContainerRef} style={{ position: 'relative', width: 280 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#64748B' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 34, height: 38, fontSize: 12.5, borderRadius: 10 }}
                placeholder="Search patient, MRD, phone..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
            </div>

            {/* Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                boxShadow: '0 12px 30px rgba(15,23,42,0.12)', zIndex: 120, overflow: 'hidden'
              }}>
                <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  MATCHING PATIENTS ({searchResults.length})
                </div>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchTerm('');
                      router.push(`/nursing/vitals?patientId=${p.id}`);
                    }}
                    style={{
                      padding: '10px 12px', borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.15s'
                    }}
                    className="hover:bg-emerald-50"
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0F172A' }}>
                        {p.firstName} {p.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {p.mrdNumber} • {p.age}Y/{p.gender} • {p.mobile}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Triage <ArrowRight size={12} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Shift Note Button */}
          <button
            onClick={() => setShiftNoteModal(true)}
            className="btn btn-outline"
            style={{ height: 38, padding: '0 14px', fontSize: 12.5, borderColor: '#CBD5E1', color: '#334155' }}
          >
            <ClipboardList size={15} color="#059669" />
            <span>Shift Handover Note</span>
          </button>
        </div>
      </div>

      {/* 3.1 Real-time Shift KPI Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Today's Patients */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Today's Patients
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
                {totalPatientsToday}
              </div>
              <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Arrived at clinic floor
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Vitals Pending (Actionable Backlog in Rose) */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1.5px solid #FDA4AF', background: '#FFF1F2', boxShadow: '0 4px 12px rgba(244,63,94,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vitals Pending
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#BE123C', marginTop: 4 }}>
                {vitalsPendingCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#E11D48', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} /> Awaiting Triage Measurement
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Reports to Upload / Digitize */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Reports to Upload
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
                {reportsToUploadCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#D97706', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} /> In-clinic diagnostic backlog
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Vitals Completed */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vitals Done
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                {vitalsDoneCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Triaged & ready for doctor
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Triage Patient Queue (2fr) + Right Coordination Hub (1fr) */}
      <div className="nursing-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Patient Queue & Triage Table */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          {/* Table Header & Filter Tabs */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                Today's Patient Triage List
              </span>
              <span style={{ background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
                {filteredQueue.length} Active
              </span>
            </div>

            {/* Filter Toggle Buttons */}
            <div style={{ display: 'flex', gap: 6, background: '#F8FAFC', padding: 3, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setStatusFilter('ALL')}
                className="btn btn-sm"
                style={{
                  fontSize: 11.5, fontWeight: 700, padding: '4px 10px',
                  background: statusFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                  color: statusFilter === 'ALL' ? '#0F172A' : '#64748B',
                  boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  border: 'none'
                }}
              >
                All Patients
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_VITALS')}
                className="btn btn-sm"
                style={{
                  fontSize: 11.5, fontWeight: 700, padding: '4px 10px',
                  background: statusFilter === 'PENDING_VITALS' ? '#FFFFFF' : 'transparent',
                  color: statusFilter === 'PENDING_VITALS' ? '#E11D48' : '#64748B',
                  boxShadow: statusFilter === 'PENDING_VITALS' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  border: 'none'
                }}
              >
                Vitals Pending ({vitalsPendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('IN_SESSION')}
                className="btn btn-sm"
                style={{
                  fontSize: 11.5, fontWeight: 700, padding: '4px 10px',
                  background: statusFilter === 'IN_SESSION' ? '#FFFFFF' : 'transparent',
                  color: statusFilter === 'IN_SESSION' ? '#0284C7' : '#64748B',
                  boxShadow: statusFilter === 'IN_SESSION' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  border: 'none'
                }}
              >
                In Cabin
              </button>
            </div>
          </div>

          {/* Patient Triage Table */}
          <div className="table-responsive">
            <table className="table" style={{ margin: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px' }}>Token / Case</th>
                  <th>Patient Details</th>
                  <th>Arrival Time</th>
                  <th>Assigned Doctor</th>
                  <th>Vitals Status</th>
                  <th>Queue Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Triage Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#10B981' }} />
                      <div style={{ fontWeight: 700, fontSize: 14 }}>All Triage Tasks Completed!</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>No patients match the current filter selection.</div>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map(entry => {
                    const hasVitals = entry.vitalsRecorded;
                    const isEmergency = entry.priority === 'EMERGENCY';

                    return (
                      <tr key={entry.id} style={{ background: isEmergency ? 'rgba(239,68,68,0.04)' : undefined }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 900, fontSize: 13.5, color: '#0F172A' }}>
                              {entry.tokenDisplay}
                            </span>
                            {isEmergency && (
                              <span className="badge badge-danger" style={{ fontSize: 9.5, padding: '1px 5px', fontWeight: 900 }}>
                                EMERGENCY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace' }}>
                            {entry.caseNumber}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>
                            {entry.patientName}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                            {entry.age}Y • {entry.gender} • {entry.city}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {entry.checkInTime || entry.appointmentTime}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            {entry.visitType}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 12.5 }}>
                            {entry.doctorName}
                          </div>
                        </td>

                        <td>
                          {hasVitals ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                              background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0'
                            }}>
                              <CheckCircle2 size={12} /> Entered
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                              background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3'
                            }}>
                              <AlertCircle size={12} /> Pending
                            </span>
                          )}
                        </td>

                        <td>
                          <QueueStatusBadge status={entry.status} />
                        </td>

                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          {!hasVitals ? (
                            <Link
                              href={`/nursing/vitals?caseId=${entry.caseNumber}&patientId=${entry.patientId}&token=${entry.tokenDisplay}`}
                              className="btn btn-sm"
                              style={{
                                background: '#059669', color: '#FFFFFF', fontWeight: 800,
                                fontSize: 12, padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 2px 6px rgba(5,150,105,0.2)'
                              }}
                            >
                              <Activity size={13} /> Enter Vitals
                            </Link>
                          ) : (
                            <Link
                              href={`/nursing/lab-reports?caseId=${entry.caseNumber}&patientId=${entry.patientId}`}
                              className="btn btn-sm btn-outline"
                              style={{
                                borderColor: '#CBD5E1', color: '#334155', fontSize: 11.5,
                                padding: '5px 12px', borderRadius: 8, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 5
                              }}
                            >
                              <Upload size={12} color="#059669" /> Upload Lab
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Coordination Hub & Shift Handover */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card: Next Doctor Appointment Alert */}
          <div className="card" style={{ padding: 18, borderRadius: 18, border: '1.5px solid #BAE6FD', background: '#F0F9FF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369A1', fontWeight: 800, fontSize: 12.5 }}>
              <Stethoscope size={16} />
              <span>PROCEDURE PREP NOTICE</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 14, color: '#0C4A6E', marginTop: 8 }}>
              Rekha Patel (C004) — Chemical Peel
            </div>
            <div style={{ fontSize: 12, color: '#0284C7', marginTop: 4 }}>
              Scheduled 10:45 AM • Dr. Raj Valaki (Cabin 1)
            </div>
            <div style={{ marginTop: 10, padding: 8, background: '#FFFFFF', borderRadius: 8, fontSize: 11.5, color: '#334155', border: '1px solid #E0F2FE' }}>
              ✓ Laser room sterilized • Neutralizer & cold pack ready on tray.
            </div>
          </div>

          {/* Card: Shift Handover Notes */}
          <div className="card" style={{ padding: 18, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ClipboardList size={15} color="#059669" /> Shift Handover Log
              </div>
              <button
                onClick={() => setShiftNoteModal(true)}
                style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
              >
                + Add Note
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
              {shiftNotesList.map(sn => (
                <div key={sn.id} style={{ padding: 10, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>
                    <span>{sn.author}</span>
                    <span>{sn.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                    {sn.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Quick Links */}
          <div className="card" style={{ padding: 16, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
              QUICK TRIAGE SHORTCUTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link
                href="/nursing/vitals"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12.5,
                  fontWeight: 700, color: '#0F172A', textDecoration: 'none'
                }}
                className="hover:bg-emerald-50"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={15} color="#059669" /> Open Vitals Entry Desk
                </span>
                <ChevronRight size={14} color="#94A3B8" />
              </Link>

              <Link
                href="/nursing/lab-reports"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12.5,
                  fontWeight: 700, color: '#0F172A', textDecoration: 'none'
                }}
                className="hover:bg-emerald-50"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={15} color="#0284C7" /> Pending Diagnostic Reports
                </span>
                <ChevronRight size={14} color="#94A3B8" />
              </Link>

              <Link
                href="/nursing/followup"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12.5,
                  fontWeight: 700, color: '#0F172A', textDecoration: 'none'
                }}
                className="hover:bg-emerald-50"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={15} color="#F59E0B" /> Follow-Up Outreach Roster
                </span>
                <ChevronRight size={14} color="#94A3B8" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Shift Handover Note */}
      {shiftNoteModal && (
        <div className="modal-overlay" onClick={() => setShiftNoteModal(false)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0' }}>
              <span className="modal-title" style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                Add Shift Handover Note
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShiftNoteModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <label className="form-label required">Handover / Observation Details</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Record oxygen cylinder pressures, medication tray refills, or doctor instructions for next shift..."
                value={shiftNote}
                onChange={e => setShiftNote(e.target.value)}
              />
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: 14 }}>
              <button className="btn btn-ghost" onClick={() => setShiftNoteModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={handleAddShiftNote}
              >
                Save Handover Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
