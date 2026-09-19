'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Users, Bell, Play, ArrowRight, AlertTriangle,
  Search, Clock, UserCheck, ShieldAlert, CheckCircle2,
  Calendar, Eye, PhoneCall, RefreshCw, X, Sparkles, PauseCircle
} from 'lucide-react';
import {
  useQueueStore, usePatientStore, useInventoryStore,
  useConsultationStore, useUIStore, QueueEntry
} from '@/store';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { queue, updateStatus, setCallingEntry, resumeFromHold } = useQueueStore();
  const { patients } = usePatientStore();
  const { inventory } = useInventoryStore();
  const { initSession } = useConsultationStore();
  const { addNotification } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter low stock drugs
  const lowStockDrugs = inventory.filter(i => i.stock <= i.reorderLevel);

  // Doctor-specific queue for Dr. Raj Valaki (doc-1)
  const doctorQueue = useMemo(() => {
    return queue.filter(q => q.doctorId === 'doc-1');
  }, [queue]);

  // Active Session patient (IN_SESSION)
  const activeSessionPatient = doctorQueue.find(q => q.status === 'IN_SESSION');

  // Emergency patient (Scenario A: Priority Preemption)
  const emergencyPatient = doctorQueue.find(q => q.priority === 'EMERGENCY' && (q.status === 'WAITING' || q.status === 'CALLING'));

  // On-hold patients (Scenario B: Lab delay)
  const onHoldPatients = doctorQueue.filter(q => q.status === 'ON_HOLD');

  // Next prepared patient (Emergency takes top priority, then Calling, then Waiting)
  const nextPatient = emergencyPatient || doctorQueue.find(q => q.status === 'CALLING') || doctorQueue.find(q => q.status === 'WAITING');

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return doctorQueue.filter(q => {
      if (selectedStatus !== 'ALL' && q.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const str = searchQuery.toLowerCase();
        return (
          q.patientName.toLowerCase().includes(str) ||
          q.tokenDisplay.toLowerCase().includes(str) ||
          q.caseNumber.toLowerCase().includes(str) ||
          q.city.toLowerCase().includes(str)
        );
      }
      return true;
    });
  }, [doctorQueue, selectedStatus, searchQuery]);

  // Audible Chime Synthesizer for Calling
  const playCallingChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // 5-tone chime sequence
      playTone(523.25, 0.0, 0.3); // C5
      playTone(659.25, 0.2, 0.3); // E5
      playTone(783.99, 0.4, 0.3); // G5
      playTone(1046.5, 0.6, 0.5); // C6
      playTone(880.0, 0.9, 0.8);  // A5
    } catch {
      // AudioContext unavailable
    }
  };

  // Call Patient Action
  const handleCallPatient = (entry: QueueEntry) => {
    updateStatus(entry.id, 'CALLING');
    setCallingEntry(entry);
    playCallingChime();

    addNotification({
      type: 'warning',
      message: `Calling patient ${entry.patientName} (${entry.tokenDisplay}) to Room 1`
    });

    // Web Speech API Voice announcement
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Token number ${entry.tokenDisplay}, ${entry.patientName}, please proceed to Room 1.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Consultation Session
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

    addNotification({
      type: 'success',
      message: `Started clinical examination for ${entry.patientName} (${entry.caseNumber})`
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
    addNotification({
      type: 'success',
      message: `Resumed consultation for ${entry.patientName} (${entry.caseNumber})`
    });
    router.push(`/doctor/consultation/${entry.caseNumber}`);
  };

  return (
    <div className="page-container">
      {/* 3.1 Low Stock Dispensary Alert Bar */}
      {lowStockDrugs.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
          border: '1.5px solid #F59E0B', borderRadius: 10,
          padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="#D97706" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
              PHARMACY DISPENSARY STOCK ALERT:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lowStockDrugs.map(d => (
                <span
                  key={d.id}
                  className="badge"
                  style={{
                    background: d.stock === 0 ? '#EF4444' : '#F59E0B',
                    color: '#FFFFFF', fontWeight: 800, fontSize: 11
                  }}
                >
                  {d.name}: {d.stock === 0 ? 'OUT OF STOCK' : `${d.stock} left`}
                </span>
              ))}
            </div>
          </div>

          <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>
            AI Alternative recommendations enabled in Drugs tab
          </span>
        </div>
      )}

      {/* Scenario A: Priority Preemption Emergency Arrival Alert */}
      {emergencyPatient && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          border: '2px solid #EF4444', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          boxShadow: '0 8px 24px rgba(239,68,68,0.2)',
          animation: 'pulse 1.5s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                🚨 EMERGENCY ARRIVAL — IMMEDIATE ATTENTION REQUESTED
                <span className="badge badge-danger">PRIORITY 999</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#7F1D1D', marginTop: 3 }}>
                <strong>{emergencyPatient.patientName}</strong> (Token: <strong style={{ fontFamily: 'monospace' }}>{emergencyPatient.tokenDisplay}</strong>, Case: {emergencyPatient.caseNumber}) arrived in acute distress. Preempts standard waiting list.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleCallPatient(emergencyPatient)}
              className="btn btn-sm btn-outline"
              style={{ borderColor: '#DC2626', color: '#DC2626', background: '#FFFFFF' }}
            >
              <Bell size={13} /> Call Patient 🔔
            </button>
            <button
              onClick={() => handleStartConsultation(emergencyPatient)}
              className="btn btn-sm btn-danger"
              style={{ padding: '8px 18px', fontWeight: 800 }}
            >
              <Play size={13} /> Start Session Now ⚡
            </button>
          </div>
        </div>
      )}

      {/* Scenario B: Patients on Hold (Diagnostics / Lab Pending) */}
      {onHoldPatients.length > 0 && (
        <div className="card" style={{ marginBottom: 20, border: '1.5px solid #F59E0B' }}>
          <div className="card-header" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PauseCircle size={16} color="#D97706" />
              <span className="card-title" style={{ color: '#92400E', fontSize: 14 }}>
                PATIENTS ON HOLD (Awaiting In-Clinic Diagnostics / Labs)
              </span>
            </div>
            <span className="badge badge-orange">{onHoldPatients.length} Active Hold</span>
          </div>

          <div className="card-body" style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {onHoldPatients.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    padding: 12, borderRadius: 8, border: '1px solid #FDE68A',
                    background: entry.labReady ? '#F0FDF4' : '#FFFDF5',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                      {entry.patientName} <span style={{ fontFamily: 'monospace', color: '#036d92' }}>({entry.tokenDisplay})</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 2 }}>
                      Reason: <em>{entry.onHoldReason || 'Awaiting lab tests'}</em>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {entry.labReady ? (
                        <span className="badge badge-success" style={{ fontSize: 11, padding: '2px 8px' }}>
                          🧪 Lab Result Ready!
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: 11, padding: '2px 8px' }}>
                          ⏳ Awaiting Lab Ingestion
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleResumeOnHold(entry)}
                    className="btn btn-sm btn-primary"
                    style={{ background: '#036d92', borderColor: '#036d92', fontSize: 12, padding: '6px 12px' }}
                  >
                    <Play size={12} /> Resume Consult →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Session & Next Patient Hero Grid */}
      <div className="doctor-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Left Hero: Active Session Spotlight */}
        <div className="card" style={{
          border: activeSessionPatient ? '2px solid #036d92' : '1px solid var(--border)',
          background: activeSessionPatient ? 'linear-gradient(135deg, #FFFFFF, #F0F9FF)' : '#FFFFFF'
        }}>
          <div className="card-header" style={{ borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: activeSessionPatient ? '#10B981' : '#94A3B8',
                boxShadow: activeSessionPatient ? '0 0 0 3px rgba(16,185,129,0.3)' : 'none'
              }} />
              <span className="card-title" style={{ fontSize: 14, color: '#036d92' }}>
                CURRENTLY IN EXAMINATION ROOM (CABIN 1)
              </span>
            </div>

            {activeSessionPatient && (
              <span className="badge badge-success" style={{ animation: 'pulse 1.5s infinite' }}>
                ACTIVE IN_SESSION
              </span>
            )}
          </div>

          <div className="card-body">
            {activeSessionPatient ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
                      {activeSessionPatient.patientName}
                    </h2>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#036d92' }}>
                        Token: {activeSessionPatient.tokenDisplay}
                      </span>
                      <span>•</span>
                      <span>Case: {activeSessionPatient.caseNumber}</span>
                      <span>•</span>
                      <span>{activeSessionPatient.age} Yrs ({activeSessionPatient.gender === 'M' ? 'Male' : 'Female'})</span>
                    </div>
                  </div>

                  <span className="badge badge-purple" style={{ fontSize: 12 }}>
                    {activeSessionPatient.visitType}
                  </span>
                </div>

                <div style={{
                  padding: 12, background: 'rgba(3,109,146,0.06)',
                  borderRadius: 8, marginBottom: 16, fontSize: 12.5, color: '#0F172A'
                }}>
                  <strong>Chief Complaints:</strong> Acute contact dermatitis with severe erythema and pruritus. Vitals recorded at triage (BP: 124/82).
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Link href={`/doctor/consultation/${activeSessionPatient.caseNumber}`} style={{ flex: 1 }}>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', background: '#036d92', borderColor: '#036d92', padding: '10px' }}
                    >
                      <Play size={15} /> Resume Consultation (7 Tabs) →
                    </button>
                  </Link>

                  <Link href={`/doctor/patients/${activeSessionPatient.patientId}/history`}>
                    <button className="btn btn-outline" style={{ borderColor: '#036d92', color: '#036d92' }}>
                      <Clock size={15} /> Past Records
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <Stethoscope size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontWeight: 700, fontSize: 15 }}>Examination Cabin is Currently Open</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Call the next prepared patient from the waiting room to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Hero: Next Prepared Patient */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 14 }}>NEXT PREPARED PATIENT IN QUEUE</span>
            {nextPatient && (
              <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                {nextPatient.status}
              </span>
            )}
          </div>

          <div className="card-body">
            {nextPatient ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                      {nextPatient.patientName}
                    </h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        Token: {nextPatient.tokenDisplay}
                      </span>
                      <span>•</span>
                      <span>Scheduled: {nextPatient.appointmentTime}</span>
                      <span>•</span>
                      <span>{nextPatient.city}</span>
                    </div>
                  </div>

                  <span className="badge badge-primary">{nextPatient.visitType}</span>
                </div>

                <div style={{
                  padding: 10, background: 'var(--bg-muted)',
                  borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)'
                }}>
                  Intake readiness: <strong>{nextPatient.vitalsRecorded ? 'Vitals ✓' : 'Vitals Pending'}</strong> • <strong>{nextPatient.complaintsRecorded ? 'Intake Logged ✓' : 'Intake Pending'}</strong>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleCallPatient(nextPatient)}
                    className="btn btn-outline"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Bell size={14} /> Call Patient 🔔
                  </button>

                  <button
                    onClick={() => handleStartConsultation(nextPatient)}
                    className="btn btn-success"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Play size={14} /> Start Session ⚡
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                <p style={{ fontWeight: 700 }}>No Patients Waiting in Doctor Queue</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>All scheduled OPD patients for today have been attended.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPD Queue Control Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="#036d92" />
            <span className="card-title">Today's Assigned OPD Caseload (Dr. Raj Valaki)</span>
            <span className="badge badge-primary">{doctorQueue.length} Total</span>
          </div>

          <Link href="/doctor/queue">
            <button className="btn btn-ghost btn-sm">
              Open Full Master Queue Controller →
            </button>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="filters-bar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrap">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by patient name, token, case ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            {(['ALL', 'WAITING', 'CALLING', 'IN_SESSION', 'COMPLETED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`badge ${selectedStatus === s ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', padding: '5px 10px', fontSize: 11 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Token / Case No</th>
                <th>Appt Time</th>
                <th>Check-In</th>
                <th>Patient Name</th>
                <th>Visit Purpose</th>
                <th>Age / Sex</th>
                <th>Billing</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Cabin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No queue entries found matching your search.
                  </td>
                </tr>
              ) : (
                filteredQueue.map(entry => (
                  <tr key={entry.id} style={{ background: entry.status === 'IN_SESSION' ? 'rgba(3,109,146,0.04)' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#036d92', fontFamily: 'monospace' }}>
                        {entry.tokenDisplay}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {entry.caseNumber}
                      </div>
                    </td>

                    <td>{entry.appointmentTime}</td>
                    <td>{entry.checkInTime || '—'}</td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {entry.patientName}
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
                      <span className={`badge ${entry.status === 'IN_SESSION' ? 'badge-danger' : entry.status === 'CALLING' ? 'badge-warning' : entry.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                        {entry.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {entry.status === 'IN_SESSION' ? (
                          <Link href={`/doctor/consultation/${entry.caseNumber}`}>
                            <button className="btn btn-primary btn-sm" style={{ background: '#036d92', borderColor: '#036d92' }}>
                              In Room →
                            </button>
                          </Link>
                        ) : entry.status === 'CALLING' ? (
                          <button
                            onClick={() => handleStartConsultation(entry)}
                            className="btn btn-success btn-sm"
                          >
                            Start ⚡
                          </button>
                        ) : entry.status === 'WAITING' ? (
                          <>
                            <button
                              onClick={() => handleCallPatient(entry)}
                              className="btn btn-ghost btn-sm"
                              title="Call patient into examination cabin"
                            >
                              Call 🔔
                            </button>
                            <button
                              onClick={() => handleStartConsultation(entry)}
                              className="btn btn-outline btn-sm"
                            >
                              Start
                            </button>
                          </>
                        ) : (
                          <Link href={`/doctor/consultation/${entry.caseNumber}`}>
                            <button className="btn btn-ghost btn-sm">
                              View Rx
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
