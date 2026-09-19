'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter, Calendar, Bell, Play,
  CheckCircle2, AlertCircle, RotateCcw, Clock,
  ArrowRight, Shield, Stethoscope, PauseCircle, ShieldAlert, Wallet
} from 'lucide-react';
import {
  useQueueStore, usePatientStore, useConsultationStore,
  useUIStore, QueueEntry
} from '@/store';

export default function DoctorQueuePage() {
  const router = useRouter();
  const { queue, updateStatus, setCallingEntry, resumeFromHold } = useQueueStore();
  const { patients } = usePatientStore();
  const { initSession } = useConsultationStore();
  const { addNotification } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('2026-09-19');
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ageBracket, setAgeBracket] = useState<string>('ALL');

  // Legend checkboxes
  const [legendFilters, setLegendFilters] = useState({
    waiting: true,
    inProgress: true,
    completed: true,
    cancelled: false,
    newPatient: false,
    foc: false
  });

  // Doctor-specific queue for Dr. Raj Valaki (doc-1)
  const doctorQueue = useMemo(() => {
    return queue.filter(q => q.doctorId === 'doc-1');
  }, [queue]);

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return doctorQueue.filter(q => {
      if (purposeFilter !== 'ALL' && q.visitType !== purposeFilter) return false;
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;

      // Age brackets
      if (ageBracket === '0-18' && q.age > 18) return false;
      if (ageBracket === '19-40' && (q.age < 19 || q.age > 40)) return false;
      if (ageBracket === '41-60' && (q.age < 41 || q.age > 60)) return false;
      if (ageBracket === '60+' && q.age <= 60) return false;

      // Legend checkboxes
      if (!legendFilters.waiting && q.status === 'WAITING') return false;
      if (!legendFilters.inProgress && (q.status === 'IN_SESSION' || q.status === 'CALLING')) return false;
      if (!legendFilters.completed && q.status === 'COMPLETED') return false;
      if (!legendFilters.cancelled && q.status === 'CANCELLED') return false;
      if (legendFilters.newPatient && !q.isNew) return false;
      if (legendFilters.foc && !q.isFoc) return false;

      if (searchQuery.trim()) {
        const qStr = searchQuery.toLowerCase();
        return (
          q.patientName.toLowerCase().includes(qStr) ||
          q.tokenDisplay.toLowerCase().includes(qStr) ||
          q.caseNumber.toLowerCase().includes(qStr) ||
          q.city.toLowerCase().includes(qStr)
        );
      }

      return true;
    });
  }, [doctorQueue, purposeFilter, statusFilter, ageBracket, legendFilters, searchQuery]);

  // Priority sorting: EMERGENCY patients first, then arrival/token
  const sortedFilteredQueue = useMemo(() => {
    return [...filteredQueue].sort((a, b) => {
      const pOrder = { EMERGENCY: 3, URGENT: 2, NORMAL: 1 };
      const aPri = pOrder[a.priority || 'NORMAL'] || 1;
      const bPri = pOrder[b.priority || 'NORMAL'] || 1;
      if (aPri !== bPri) return bPri - aPri;
      return 0;
    });
  }, [filteredQueue]);

  // Call Patient
  const handleCallPatient = (entry: QueueEntry) => {
    updateStatus(entry.id, 'CALLING');
    setCallingEntry(entry);

    addNotification({
      type: 'warning',
      message: `Calling patient ${entry.patientName} (${entry.tokenDisplay}) to Room 1`
    });

    // Voice announcement
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Token number ${entry.tokenDisplay}, ${entry.patientName}, please proceed to Room 1.`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Consultation
  const handleStartConsultation = (entry: QueueEntry) => {
    updateStatus(entry.id, 'IN_SESSION');
    const pat = patients.find(p => p.id === entry.patientId) || patients[0];
    initSession(entry.caseNumber, pat, {
      id: 'doc-1',
      name: 'Dr. Raj Valaki',
      specialization: 'Dermatology',
      initials: 'RV',
      avatarColor: '#036d92',
      room: 'Room 1'
    });

    router.push(`/doctor/consultation/${entry.caseNumber}`);
  };

  // Resume On-Hold Consultation
  const handleResumeOnHold = (entry: QueueEntry) => {
    resumeFromHold(entry.id);
    const pat = patients.find(p => p.id === entry.patientId) || patients[0];
    initSession(entry.caseNumber, pat, {
      id: 'doc-1',
      name: 'Dr. Raj Valaki',
      specialization: 'Dermatology',
      initials: 'RV',
      avatarColor: '#036d92',
      room: 'Room 1'
    });
    router.push(`/doctor/consultation/${entry.caseNumber}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('2026-09-19');
    setPurposeFilter('ALL');
    setStatusFilter('ALL');
    setAgeBracket('ALL');
    setLegendFilters({
      waiting: true,
      inProgress: true,
      completed: true,
      cancelled: false,
      newPatient: false,
      foc: false
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Queue Control Center — Doctor Console</h1>
          <p className="page-subtitle">Priority triage, calling sequencer, and patient intake for Dr. Raj Valaki (Cabin 1).</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleResetFilters} className="btn btn-outline btn-sm">
            <RotateCcw size={14} /> Reset Filters
          </button>
          <Link href="/doctor/dashboard">
            <button className="btn btn-primary btn-sm" style={{ background: '#036d92', borderColor: '#036d92' }}>
              <Stethoscope size={14} /> Back to Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar (Section 4.1) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Search */}
          <div className="search-input-wrap" style={{ minWidth: 240, flex: 1 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-input"
              placeholder="Search name, token, case ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="var(--text-muted)" />
            <input
              type="date"
              className="form-input"
              style={{ width: 135, padding: '6px 10px', fontSize: 12 }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          {/* Purpose Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Purpose:</span>
            <select
              className="form-select"
              style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
              value={purposeFilter}
              onChange={e => setPurposeFilter(e.target.value)}
            >
              <option value="ALL">All Visits</option>
              <option value="Consultation">Consultation</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Procedure">Procedure</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="WAITING">Waiting</option>
              <option value="CALLING">Calling</option>
              <option value="IN_SESSION">In Session</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Age Brackets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Age:</span>
            <select
              className="form-select"
              style={{ width: 110, padding: '6px 10px', fontSize: 12 }}
              value={ageBracket}
              onChange={e => setAgeBracket(e.target.value)}
            >
              <option value="ALL">All Ages</option>
              <option value="0-18">0 - 18 Y</option>
              <option value="19-40">19 - 40 Y</option>
              <option value="41-60">41 - 60 Y</option>
              <option value="60+">60+ Y</option>
            </select>
          </div>
        </div>

        {/* Legend Multi-Toggles (Section 4.1) */}
        <div style={{
          padding: '10px 16px', background: 'var(--bg-muted)',
          borderTop: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Multi-Select Filters:
          </span>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={legendFilters.waiting}
              onChange={e => setLegendFilters({ ...legendFilters, waiting: e.target.checked })}
              style={{ accentColor: '#036d92' }}
            />
            Waiting Patients
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={legendFilters.inProgress}
              onChange={e => setLegendFilters({ ...legendFilters, inProgress: e.target.checked })}
              style={{ accentColor: '#036d92' }}
            />
            In Progress / Calling
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={legendFilters.completed}
              onChange={e => setLegendFilters({ ...legendFilters, completed: e.target.checked })}
              style={{ accentColor: '#036d92' }}
            />
            Completed
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={legendFilters.newPatient}
              onChange={e => setLegendFilters({ ...legendFilters, newPatient: e.target.checked })}
              style={{ accentColor: '#036d92' }}
            />
            New Patients Only
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={legendFilters.foc}
              onChange={e => setLegendFilters({ ...legendFilters, foc: e.target.checked })}
              style={{ accentColor: '#036d92' }}
            />
            Free of Charge (FOC)
          </label>
        </div>
      </div>

      {/* Queue Table (Section 4.2) */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Users size={16} color="#036d92" />
            Active OPD Queue — {filteredQueue.length} Patients
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Sorted by Priority & Arrival Sequence
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Case No / Token</th>
                <th>Appt Time</th>
                <th>Check In</th>
                <th>Patient Name</th>
                <th>Visit For</th>
                <th>Age / Sex</th>
                <th>Billing Status</th>
                <th>Queue Status</th>
                <th style={{ textAlign: 'right' }}>Doctor Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No queue entries match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedFilteredQueue.map(entry => (
                  <tr key={entry.id} style={{
                    background: entry.priority === 'EMERGENCY' ? '#FEF2F2' : entry.status === 'IN_SESSION' ? 'rgba(3,109,146,0.05)' : undefined,
                    borderLeft: entry.priority === 'EMERGENCY' ? '4px solid #EF4444' : undefined
                  }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: '#036d92', fontFamily: 'monospace' }}>
                          {entry.tokenDisplay}
                        </span>
                        {entry.priority === 'EMERGENCY' && (
                          <span className="badge badge-danger" style={{ fontSize: 10, animation: 'pulse 1.2s infinite' }}>
                            EMERGENCY 🚨
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {entry.caseNumber}
                      </div>
                    </td>

                    <td>{entry.appointmentTime}</td>
                    <td>{entry.checkInTime || '—'}</td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {entry.patientName} {entry.isMR && <span className="badge badge-purple" style={{ fontSize: 10 }}>MR ({entry.mrCompany || 'Visitor'})</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {entry.city}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-purple">{entry.visitType}</span>
                    </td>

                    <td>
                      {entry.age} Y / {entry.gender}
                    </td>

                    <td>
                      <span className={`badge ${entry.billingStatus === 'PAID' ? 'badge-success' : entry.billingStatus === 'FOC' ? 'badge-info' : 'badge-warning'}`}>
                        {entry.billingStatus}
                      </span>
                    </td>

                    <td>
                      {entry.status === 'ON_HOLD' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="badge badge-orange">ON HOLD</span>
                          {entry.labReady ? (
                            <span className="badge badge-success" style={{ fontSize: 9 }}>🧪 Lab Ready</span>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Awaiting Lab</span>
                          )}
                        </div>
                      ) : entry.status === 'BILLING_PENDING' ? (
                        <span className="badge badge-primary">BILLING PENDING</span>
                      ) : (
                        <span className={`badge ${entry.status === 'IN_SESSION' ? 'badge-danger' : entry.status === 'CALLING' ? 'badge-warning' : entry.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                          {entry.status}
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {entry.status === 'IN_SESSION' ? (
                          <Link href={`/doctor/consultation/${entry.caseNumber}`}>
                            <button className="btn btn-primary btn-sm" style={{ background: '#036d92', borderColor: '#036d92' }}>
                              In Room →
                            </button>
                          </Link>
                        ) : entry.status === 'ON_HOLD' ? (
                          <button
                            onClick={() => handleResumeOnHold(entry)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#036d92', borderColor: '#036d92', fontSize: 12 }}
                          >
                            <Play size={12} /> Resume Consult →
                          </button>
                        ) : entry.status === 'CALLING' ? (
                          <button
                            onClick={() => handleStartConsultation(entry)}
                            className="btn btn-success btn-sm"
                          >
                            <Play size={13} /> Start ⚡
                          </button>
                        ) : entry.status === 'WAITING' ? (
                          <>
                            <button
                              onClick={() => handleCallPatient(entry)}
                              className="btn btn-ghost btn-sm"
                              title="Broadcast call chime and voice announcement"
                            >
                              <Bell size={13} /> Call
                            </button>
                            <button
                              onClick={() => handleStartConsultation(entry)}
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: '#036d92', color: '#036d92' }}
                            >
                              <Play size={13} /> Start
                            </button>
                          </>
                        ) : entry.status === 'BILLING_PENDING' ? (
                          <span style={{ fontSize: 11, color: '#C2410C', fontWeight: 700, padding: '4px 8px', background: '#FFF7ED', borderRadius: 6, border: '1px solid #FFEDD5' }}>
                            With Reception Desk
                          </span>
                        ) : (
                          <Link href={`/doctor/consultation/${entry.caseNumber}`}>
                            <button className="btn btn-ghost btn-sm">
                              Inspect File
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
