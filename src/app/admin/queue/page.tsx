'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Clock, Activity, CheckCircle2, AlertTriangle,
  Play, Pause, PhoneCall, RotateCcw, Search, Filter,
  Stethoscope, ArrowUpRight, DollarSign, Wallet, Shield,
  Check, X, RefreshCw, Volume2, UserCheck, ChevronRight
} from 'lucide-react';
import {
  useQueueStore, usePatientStore, useUIStore, useDoctorStore,
  QueueStatus, QueueEntry, VisitType, playChimeTone
} from '@/store';

const STATUS_CONFIG: Record<QueueStatus, { label: string; bg: string; color: string; border: string }> = {
  WAITING: { label: 'Waiting in Lobby', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  CALLING: { label: 'Now Calling (Chime)', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  IN_SESSION: { label: 'In Doctor Cabin', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
  ON_HOLD: { label: 'On Clinical Hold', bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  BILLING_PENDING: { label: 'Awaiting Billing', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  COMPLETED: { label: 'Encounter Completed', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  CANCELLED: { label: 'Cancelled / Abandoned', bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
  MISSED: { label: 'Missed Call', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
};

export default function AdminQueuePage() {
  const { queue, doctors, updateStatus, updateQueueEntry, putOnHold, resumeFromHold, cancelEntry } = useQueueStore();
  const { patients } = usePatientStore();
  const { addNotification } = useUIStore();

  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Quick Action Modal states
  const [reassignModal, setReassignModal] = useState<{ open: boolean; entry: QueueEntry | null }>({ open: false, entry: null });
  const [targetDoctorId, setTargetDoctorId] = useState('doc-1');
  const [holdModal, setHoldModal] = useState<{ open: boolean; entry: QueueEntry | null }>({ open: false, entry: null });
  const [holdReason, setHoldReason] = useState('Awaiting STAT Lab Results');

  // Counters
  const totalCount = queue.length;
  const waitingCount = queue.filter(q => q.status === 'WAITING').length;
  const callingCount = queue.filter(q => q.status === 'CALLING').length;
  const inSessionCount = queue.filter(q => q.status === 'IN_SESSION').length;
  const onHoldCount = queue.filter(q => q.status === 'ON_HOLD').length;
  const billingPendingCount = queue.filter(q => q.status === 'BILLING_PENDING').length;
  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;

  const filteredQueue = useMemo(() => {
    return queue.filter(q => {
      const matchSearch =
        !search ||
        q.patientName.toLowerCase().includes(search.toLowerCase()) ||
        q.tokenDisplay.toLowerCase().includes(search.toLowerCase()) ||
        q.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
        q.city?.toLowerCase().includes(search.toLowerCase());

      const matchDoctor = selectedDoctor === 'ALL' || q.doctorId === selectedDoctor;
      const matchStatus = selectedStatus === 'ALL' || q.status === selectedStatus;
      const matchPriority = selectedPriority === 'ALL' || (q.priority || 'NORMAL') === selectedPriority;

      return matchSearch && matchDoctor && matchStatus && matchPriority;
    });
  }, [queue, search, selectedDoctor, selectedStatus, selectedPriority]);

  const handleCallToken = (entry: QueueEntry) => {
    playChimeTone('calling');
    updateStatus(entry.id, 'CALLING');
    addNotification({
      type: 'warning',
      message: `Calling Token ${entry.tokenDisplay} (${entry.patientName}) to ${entry.doctorName}'s room.`
    });
  };

  const handleStartSession = (entry: QueueEntry) => {
    updateStatus(entry.id, 'IN_SESSION');
    addNotification({
      type: 'info',
      message: `Token ${entry.tokenDisplay} is now In Session with ${entry.doctorName}.`
    });
  };

  const handleSendToBilling = (entry: QueueEntry) => {
    playChimeTone('session_ended');
    updateStatus(entry.id, 'BILLING_PENDING');
    addNotification({
      type: 'success',
      message: `Encounter completed for ${entry.patientName}. Transferred to Admin Billing Cashiering.`
    });
  };

  const handleConfirmReassign = () => {
    if (!reassignModal.entry) return;
    const doc = doctors.find(d => d.id === targetDoctorId);
    if (!doc) return;

    updateQueueEntry(reassignModal.entry.id, {
      doctorId: doc.id,
      doctorName: doc.name
    });

    addNotification({
      type: 'info',
      message: `Token ${reassignModal.entry.tokenDisplay} reassigned to ${doc.name} (${doc.room}).`
    });
    setReassignModal({ open: false, entry: null });
  };

  const handleConfirmHold = () => {
    if (!holdModal.entry) return;
    putOnHold(holdModal.entry.id, holdReason);
    addNotification({
      type: 'warning',
      message: `Token ${holdModal.entry.tokenDisplay} put on hold: ${holdReason}`
    });
    setHoldModal({ open: false, entry: null });
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4338ca', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
              Operational Governance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Live OPD Patient Flow & Cabin Dispatch</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={26} color="#4338ca" /> OPD Live Queue & Triage Command Center
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Real-time outpatient queue orchestration across consulting cabins, waiting areas, vitals triage, and cashiering handoffs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => {
              playChimeTone('calling');
              addNotification({ type: 'info', message: 'Clinic Public Chime System Tested.' });
            }}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, fontSize: '0.86rem' }}
          >
            <Volume2 size={16} color="#4338ca" /> Test Public Chime
          </button>
          <Link href="/admin/appointments" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, fontSize: '0.86rem', textDecoration: 'none' }}>
            <Clock size={16} /> Appointments Master ➔
          </Link>
        </div>
      </div>

      {/* KPI Ticker Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div
          onClick={() => setSelectedStatus('ALL')}
          style={{
            background: selectedStatus === 'ALL' ? '#EEF2FF' : '#FFFFFF',
            border: selectedStatus === 'ALL' ? '2px solid #6366F1' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Registered</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{totalCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#4338CA', marginTop: 4, fontWeight: 600 }}>All Clinic Encounters</div>
        </div>

        <div
          onClick={() => setSelectedStatus('WAITING')}
          style={{
            background: selectedStatus === 'WAITING' ? '#EFF6FF' : '#FFFFFF',
            border: selectedStatus === 'WAITING' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Waiting in Lobby</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>{waitingCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#1D4ED8', marginTop: 4, fontWeight: 600 }}>Ready for Cabin Call</div>
        </div>

        <div
          onClick={() => setSelectedStatus('CALLING')}
          style={{
            background: selectedStatus === 'CALLING' ? '#FEF3C7' : '#FFFFFF',
            border: selectedStatus === 'CALLING' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Now Calling</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B45309', marginTop: 2 }}>{callingCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: 4, fontWeight: 600 }}>Audio Chime Active</div>
        </div>

        <div
          onClick={() => setSelectedStatus('IN_SESSION')}
          style={{
            background: selectedStatus === 'IN_SESSION' ? '#EEF2FF' : '#FFFFFF',
            border: selectedStatus === 'IN_SESSION' ? '2px solid #6366F1' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>In Doctor Session</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4338CA', marginTop: 2 }}>{inSessionCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#4338CA', marginTop: 4, fontWeight: 600 }}>Consulting in Cabin</div>
        </div>

        <div
          onClick={() => setSelectedStatus('ON_HOLD')}
          style={{
            background: selectedStatus === 'ON_HOLD' ? '#FEE2E2' : '#FFFFFF',
            border: selectedStatus === 'ON_HOLD' ? '2px solid #EF4444' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>On Hold</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B91C1C', marginTop: 2 }}>{onHoldCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#B91C1C', marginTop: 4, fontWeight: 600 }}>Lab / Vitals Pending</div>
        </div>

        <div
          onClick={() => setSelectedStatus('BILLING_PENDING')}
          style={{
            background: selectedStatus === 'BILLING_PENDING' ? '#FFFBEB' : '#FFFFFF',
            border: selectedStatus === 'BILLING_PENDING' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Billing Pending</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: 2 }}>{billingPendingCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: 4, fontWeight: 600 }}>Ready for Cashier</div>
        </div>

        <div
          onClick={() => setSelectedStatus('COMPLETED')}
          style={{
            background: selectedStatus === 'COMPLETED' ? '#ECFDF5' : '#FFFFFF',
            border: selectedStatus === 'COMPLETED' ? '2px solid #10B981' : '1px solid #E2E8F0',
            borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: 2 }}>{completedCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: 4, fontWeight: 600 }}>Discharged / Paid</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
        padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14,
        alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Token, Patient Name, Case #, or City..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 36, width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedDoctor}
            onChange={e => setSelectedDoctor(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', width: 190 }}
          >
            <option value="ALL">All Consulting Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.room})</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', width: 170 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="WAITING">Waiting in Lobby</option>
            <option value="CALLING">Calling (Chime)</option>
            <option value="IN_SESSION">In Cabin Session</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="BILLING_PENDING">Billing Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', width: 140 }}
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal Priority</option>
            <option value="URGENT">Urgent Case</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          {(search || selectedDoctor !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedDoctor('ALL');
                setSelectedStatus('ALL');
                setSelectedPriority('ALL');
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', color: '#64748B' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Queue Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="#4338CA" /> Live Outpatient Manifest ({filteredQueue.length} Patients)
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Auto-synced with Doctor cabins & Reception counters
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Token & Case</th>
                <th style={{ padding: '12px 16px' }}>Patient Details</th>
                <th style={{ padding: '12px 16px' }}>Doctor & Cabin</th>
                <th style={{ padding: '12px 16px' }}>Visit & Triage</th>
                <th style={{ padding: '12px 16px' }}>Time & Stage</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Billing</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Flow Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map(entry => {
                const conf = STATUS_CONFIG[entry.status] || STATUS_CONFIG.WAITING;

                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} className="hover:bg-slate-50">
                    
                    {/* Token & Case */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: '1rem', fontWeight: 900, color: '#0F172A',
                          background: '#EEF2FF', padding: '3px 8px', borderRadius: 6,
                          border: '1px solid #C7D2FE', letterSpacing: '0.02em'
                        }}>
                          {entry.tokenDisplay}
                        </span>
                        {entry.priority === 'URGENT' && (
                          <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                            URGENT
                          </span>
                        )}
                        {entry.priority === 'EMERGENCY' && (
                          <span style={{ fontSize: '0.7rem', background: '#FEE2E2', color: '#DC2626', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
                        Case #{entry.caseNumber}
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                        {entry.patientName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                        {entry.age} yrs • {entry.gender} • {entry.city}
                      </div>
                      {entry.onHoldReason && (
                        <div style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: 600, marginTop: 2 }}>
                          Hold: {entry.onHoldReason}
                        </div>
                      )}
                    </td>

                    {/* Doctor & Cabin */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>
                        {entry.doctorName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Stethoscope size={13} color="#4338CA" />
                        <span>Room: {doctors.find(d => d.id === entry.doctorId)?.room || 'Cabin 1'}</span>
                      </div>
                    </td>

                    {/* Visit & Triage */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.74rem', padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                        background: entry.visitType === 'Procedure' ? '#FDF2F8' : entry.visitType === 'Follow-Up' ? '#EFF6FF' : '#F0FDF4',
                        color: entry.visitType === 'Procedure' ? '#BE185D' : entry.visitType === 'Follow-Up' ? '#1D4ED8' : '#15803D',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        {entry.visitType}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                        Vitals: <strong style={{ color: entry.vitalsRecorded ? '#16A34A' : '#DC2626' }}>{entry.vitalsRecorded ? '✓ Recorded' : '✗ Pending'}</strong>
                      </div>
                    </td>

                    {/* Time & Stage */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                        {entry.appointmentTime}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: 2 }}>
                        Stage: <strong style={{ color: '#475569' }}>{entry.stage || 'DOCTOR'}</strong>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`,
                        display: 'inline-block'
                      }}>
                        {conf.label}
                      </span>
                    </td>

                    {/* Billing */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: entry.billingStatus === 'PAID' ? '#DCFCE7' : entry.billingStatus === 'PARTIAL' ? '#FEF3C7' : entry.billingStatus === 'FOC' ? '#E0F2FE' : '#FEE2E2',
                        color: entry.billingStatus === 'PAID' ? '#15803D' : entry.billingStatus === 'PARTIAL' ? '#B45309' : entry.billingStatus === 'FOC' ? '#0369A1' : '#B91C1C'
                      }}>
                        {entry.billingStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => handleCallToken(entry)}
                            className="btn btn-warning btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Call Token into Physician Cabin"
                          >
                            <Volume2 size={13} /> Call
                          </button>
                        )}

                        {entry.status === 'CALLING' && (
                          <button
                            onClick={() => handleStartSession(entry)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Patient Entered Cabin"
                          >
                            <Play size={13} /> In Session
                          </button>
                        )}

                        {entry.status === 'IN_SESSION' && (
                          <button
                            onClick={() => handleSendToBilling(entry)}
                            className="btn btn-success btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="End Session & Send to Billing"
                          >
                            <DollarSign size={13} /> Bill
                          </button>
                        )}

                        {entry.status === 'ON_HOLD' ? (
                          <button
                            onClick={() => {
                              resumeFromHold(entry.id);
                              addNotification({ type: 'info', message: `Token ${entry.tokenDisplay} resumed to Waiting.` });
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            title="Resume from Hold"
                          >
                            Resume
                          </button>
                        ) : (
                          entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                setHoldModal({ open: true, entry });
                              }}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#DC2626' }}
                              title="Put on Hold"
                            >
                              <Pause size={13} />
                            </button>
                          )
                        )}

                        {/* Reassign Doctor */}
                        {entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setReassignModal({ open: true, entry });
                              setTargetDoctorId(entry.doctorId);
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#4338CA' }}
                            title="Reassign to another Doctor"
                          >
                            Reassign
                          </button>
                        )}

                        {/* Reschedule */}
                        {entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                          <Link href={`/reception/appointments/reschedule/${entry.id}`}>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#0284C7' }}
                              title="Reschedule Appointment Slot"
                            >
                              Reschedule
                            </button>
                          </Link>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredQueue.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                    <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No patients found matching current queue filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Reassign Doctor */}
      {reassignModal.open && reassignModal.entry && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stethoscope size={18} color="#4338CA" />
                <h3 className="modal-title">Reassign Patient Cabin</h3>
              </div>
              <button onClick={() => setReassignModal({ open: false, entry: null })} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Patient:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  {reassignModal.entry.tokenDisplay} — {reassignModal.entry.patientName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                  Currently Assigned: {reassignModal.entry.doctorName}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Select New Attending Physician</label>
                <select
                  className="form-select"
                  value={targetDoctorId}
                  onChange={e => setTargetDoctorId(e.target.value)}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization} • {d.room})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setReassignModal({ open: false, entry: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReassign}
              >
                <Check size={16} /> Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Put on Hold */}
      {holdModal.open && holdModal.entry && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pause size={18} color="#DC2626" />
                <h3 className="modal-title">Put Token On Clinical Hold</h3>
              </div>
              <button onClick={() => setHoldModal({ open: false, entry: null })} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: '#FFF1F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>Hold Token:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#7F1D1D' }}>
                  {holdModal.entry.tokenDisplay} — {holdModal.entry.patientName}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Hold Reason</label>
                <select
                  className="form-select"
                  value={holdReason}
                  onChange={e => setHoldReason(e.target.value)}
                >
                  <option value="Awaiting STAT Lab Results">Awaiting STAT Lab Results</option>
                  <option value="In Triage / Vitals Measurement">In Triage / Vitals Measurement</option>
                  <option value="Minor Dressing / Wound Prep">Minor Dressing / Wound Prep</option>
                  <option value="Patient Temporarily Stepped Out">Patient Temporarily Stepped Out</option>
                  <option value="Diagnostic Ultrasound / X-Ray">Diagnostic Ultrasound / X-Ray</option>
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setHoldModal({ open: false, entry: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmHold}
              >
                Put on Hold
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
