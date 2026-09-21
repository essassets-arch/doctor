'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Clock, CheckCircle2, Activity, RotateCcw, Search,
  CalendarClock, X, Lock, Bell, ArrowUpRight, TrendingUp, Wallet, PauseCircle
} from 'lucide-react';
import { useQueueStore, usePatientStore, useUIStore, QueueStatus, QueueEntry } from '@/store';
import QueueStatusBadge from '@/components/QueueStatusBadge';
import PaymentModal from '@/components/PaymentModal';

const BILLING_COLORS: Record<string, string> = {
  PAID: 'var(--success)', PARTIAL: 'var(--warning)', PENDING: 'var(--danger)', FOC: 'var(--info)',
};

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'Waiting', CALLING: 'Calling', IN_SESSION: 'In Session',
  ON_HOLD: 'On Hold', BILLING_PENDING: 'Billing Pending',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', MISSED: 'Missed',
};

export default function DashboardPage() {
  const router = useRouter();
  const { queue, doctors, updateStatus, updateQueueEntry } = useQueueStore();
  const { getPatientById } = usePatientStore();
  const { addNotification } = useUIStore();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('2026-09-19');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeChips, setActiveChips] = useState<string[]>(['WAITING', 'IN_SESSION', 'CALLING', 'BILLING_PENDING', 'COMPLETED']);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; entry?: QueueEntry }>({ open: false });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [cancelReason, setCancelReason] = useState('');

  const handleDirectArrived = (entry: QueueEntry) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    updateQueueEntry(entry.id, {
      status: 'WAITING',
      checkInTime: time,
      stage: 'NURSING'
    });
    addNotification({
      type: 'success',
      message: `${entry.patientName} (${entry.tokenDisplay}) marked as Arrived at clinic.`
    });
  };

  const calling = queue.find(q => q.status === 'CALLING');
  const billingPendingEntries = queue.filter(q => q.status === 'BILLING_PENDING');

  const filtered = queue.filter(q => {
    const matchSearch = !search || [q.patientName, q.caseNumber, q.tokenDisplay].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || q.status === statusFilter.toUpperCase().replace(' ', '_');
    const matchChip = activeChips.includes(q.status);
    return matchSearch && matchStatus && matchChip;
  });

  const stats = {
    total: queue.length,
    waiting: queue.filter(q => q.status === 'WAITING').length,
    inSession: queue.filter(q => q.status === 'IN_SESSION').length,
    completed: queue.filter(q => q.status === 'COMPLETED').length,
  };

  const toggleChip = (chip: string) => {
    setActiveChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  const resetFilters = () => {
    setSearch(''); setStatusFilter('All');
    setActiveChips(['WAITING', 'IN_SESSION', 'CALLING', 'COMPLETED']);
    setDateFilter('2026-09-19');
  };

  const formatDateDisplay = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    const [y, m, d] = parts;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[dt.getDay()]}, ${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Dashboard</h1>
          <p className="page-subtitle" suppressHydrationWarning>
            Live queue overview — {formatDateDisplay(dateFilter)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/reception/register')}>
            <Users size={15} /> Register Patient
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/reception/checkin')}>
            <CheckCircle2 size={15} /> Check-In Patient
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {calling ? (
        <div className="alert-banner danger" style={{ marginBottom: 20 }}>
          <Bell size={18} style={{ flexShrink: 0 }} />
          <span>NOW CALLING: <strong>{calling.patientName}</strong> (Token {calling.tokenDisplay}) → {doctors.find(d => d.id === calling.doctorId)?.room}</span>
          <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{stats.waiting} Waiting</span>
        </div>
      ) : (
        <div className="alert-banner info" style={{ marginBottom: 20 }}>
          <Activity size={18} style={{ flexShrink: 0 }} />
          <span>System Ready — Waiting for next patient call</span>
          <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{stats.waiting} in queue</span>
        </div>
      )}

      {/* Billing Pending Handover Banner (Phase 4 & 5 Integration) */}
      {billingPendingEntries.length > 0 && (
        <div
          className="reception-billing-banner"
          style={{
            background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
            border: '2px solid #EA580C', borderRadius: 10,
            padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(234,88,12,0.15)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#EA580C',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#9A3412', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                CONSULTATION COMPLETED — READY FOR BILLING CHECKOUT & DISCHARGE
                <span className="badge badge-primary">{billingPendingEntries.length} Handover</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#C2410C', marginTop: 2 }}>
                {billingPendingEntries.map(b => `${b.patientName} (${b.tokenDisplay})`).join(', ')} — Consultation ended. Reconcile charges, collect payment, and issue discharge paperwork.
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/reception/patients/${billingPendingEntries[0]?.patientId}#billing`)}
            className="btn btn-primary btn-sm"
            style={{ background: '#EA580C', borderColor: '#EA580C', padding: '8px 18px', fontWeight: 700, flexShrink: 0 }}
          >
            Reconcile & Settle Bill →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Today', value: stats.total, icon: <Users size={20} />, type: 'primary', sub: '+3 vs yesterday' },
          { label: 'Waiting', value: stats.waiting, icon: <Clock size={20} />, type: 'warning', sub: 'Avg wait: 18 min' },
          { label: 'In Session', value: stats.inSession, icon: <Activity size={20} />, type: 'success', sub: 'Doctor active' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={20} />, type: 'purple', sub: 'Today so far' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.type}`}>
            <div className="stat-icon-wrap" style={{ background: `var(--${s.type === 'primary' ? 'primary-light' : s.type === 'purple' ? 'purple-light' : s.type + '-light'})`, color: `var(--${s.type})` }}>
              {s.icon}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filters */}
        <div className="filters-bar">
          <div className="search-input-wrap" style={{ minWidth: 240 }}>
            <Search size={14} className="search-icon" />
            <input
              className="form-input"
              placeholder="Search patient, MRD, token..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
          <input type="date" className="form-input" style={{ width: 150 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All</option>
            {Object.values(STATUS_LABELS).map(l => <option key={l}>{l}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={resetFilters} title="Reset filters">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Chip Filters */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button key={key} className={`chip ${activeChips.includes(key) ? 'active' : ''}`} onClick={() => toggleChip(key)}>
              {label} ({queue.filter(q => q.status === key).length})
            </button>
          ))}
          <button className={`chip ${activeChips.includes('FOC') ? 'active' : ''}`} onClick={() => toggleChip('FOC')}>
            FOC ({queue.filter(q => q.isFoc).length})
          </button>
          <button className={`chip ${activeChips.includes('NEW') ? 'active' : ''}`} onClick={() => toggleChip('NEW')}>
            New Patient ({queue.filter(q => q.isNew).length})
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Token / Case No</th>
                <th>Appt Time</th>
                <th>Check-In</th>
                <th>Patient</th>
                <th>Visit For</th>
                <th>Doctor</th>
                <th>Age / Sex</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
              )}
              {filtered.map(entry => {
                const isLocked = entry.status === 'IN_SESSION';
                const isUnarrived = !entry.checkInTime;
                const rowClass = entry.status === 'CALLING' ? 'row-calling' : entry.status === 'IN_SESSION' ? 'row-insession' : entry.status === 'COMPLETED' ? 'row-completed' : '';
                const patient = getPatientById(entry.patientId);
                const initials = entry.patientName.split(' ').map(n => n[0]).join('').slice(0, 2);
                const avatarGrad = `linear-gradient(135deg,hsl(${(entry.patientName.charCodeAt(0) * 7) % 360},70%,55%),hsl(${(entry.patientName.charCodeAt(0) * 7 + 60) % 360},70%,65%))`;

                return (
                  <tr key={entry.id} className={rowClass}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'Outfit, sans-serif', color: 'var(--primary)' }}>{entry.tokenDisplay}</span>
                        {entry.isMR && <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 6px' }}>MR</span>}
                        {entry.isNew && <span className="badge badge-success" style={{ fontSize: 10, padding: '1px 6px' }}>New</span>}
                        {entry.isFoc && <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 6px' }}>FOC</span>}
                      </div>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{entry.appointmentTime}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, color: entry.checkInTime ? 'var(--success)' : 'var(--text-disabled)' }}>
                      {entry.checkInTime || '—'}
                    </td>
                    <td>
                      <div className="patient-row-info">
                        <div className="avatar avatar-sm" style={{ background: avatarGrad }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.patientName}</div>
                          {patient && <div className="patient-mrd" style={{ marginTop: 2, fontSize: 10 }}>{patient.mrdNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-muted" style={{ fontSize: 11 }}>{entry.visitType}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.doctorName}</td>
                    <td style={{ fontSize: 12 }}>{entry.age} / {entry.gender}</td>
                    <td>
                      {entry.isFoc ? (
                        <span className="badge badge-info">FOC</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80 }}>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{
                              width: entry.billingStatus === 'PAID' ? '100%' : entry.billingStatus === 'PARTIAL' ? '60%' : '0%',
                              background: BILLING_COLORS[entry.billingStatus],
                            }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: BILLING_COLORS[entry.billingStatus] }}>{entry.billingStatus}</span>
                        </div>
                      )}
                    </td>
                    <td><QueueStatusBadge status={entry.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {isLocked ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                            <Lock size={13} /> Locked
                          </span>
                        ) : entry.status === 'BILLING_PENDING' ? (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ background: '#EA580C', borderColor: '#EA580C', fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => router.push(`/reception/patients/${entry.patientId}#billing`)}
                          >
                            <Wallet size={12} /> Settle Bill →
                          </button>
                        ) : isUnarrived ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ background: '#059669', borderColor: '#059669', fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => handleDirectArrived(entry)}
                              title="Mark Arrived Directly"
                            >
                              <CheckCircle2 size={12} /> Arrived
                            </button>
                            {entry.billingStatus === 'PENDING' && (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: 11, padding: '4px 8px' }}
                                onClick={() => patient && setPaymentModal({ open: true, entry })}
                                title="Collect Fee & Mark Arrived"
                              >
                                Pay & Arrive
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <span title="Vitals" className={`badge ${entry.vitalsRecorded ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10, cursor: 'pointer' }} onClick={() => router.push(`/reception/patients/${entry.patientId}`)}>
                              Vit {entry.vitalsRecorded ? '✓' : '✗'}
                            </span>
                            <span title="Complaints" className={`badge ${entry.complaintsRecorded ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10, cursor: 'pointer' }} onClick={() => router.push(`/reception/patients/${entry.patientId}`)}>
                              Cmp {entry.complaintsRecorded ? '✓' : '✗'}
                            </span>
                            <button className="btn btn-ghost btn-icon btn-sm" title="Patient file" onClick={() => router.push(`/reception/patients/${entry.patientId}`)}>
                              <ArrowUpRight size={13} />
                            </button>
                            {entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                              <button className="btn btn-ghost btn-icon btn-sm" title="Reschedule" onClick={() => router.push(`/reception/appointments/reschedule/${entry.id}`)}>
                                <CalendarClock size={13} />
                              </button>
                            )}
                            <button className="btn btn-ghost btn-icon btn-sm" title="Cancel" style={{ color: 'var(--danger)' }} onClick={() => setCancelModal({ open: true, id: entry.id })}>
                              <X size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Showing {filtered.length} of {queue.length} entries</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'badgePulse 2s infinite' }} />
            Live — auto-refreshing
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal.open && paymentModal.entry && (() => {
        const patient = getPatientById(paymentModal.entry!.patientId);
        return patient ? (
          <PaymentModal
            patient={patient}
            doctorName={paymentModal.entry!.doctorName}
            appointmentTime={paymentModal.entry!.appointmentTime}
            onClose={() => setPaymentModal({ open: false })}
            onComplete={() => {
              const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              updateQueueEntry(paymentModal.entry!.id, {
                status: 'WAITING',
                checkInTime: time,
                stage: 'NURSING',
                billingStatus: 'PAID'
              });
              setPaymentModal({ open: false });
              addNotification({
                type: 'success',
                message: `${paymentModal.entry!.patientName} checked in and marked Arrived.`
              });
            }}
          />
        ) : null;
      })()}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setCancelModal({ open: false })}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Cancel Appointment</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCancelModal({ open: false })}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Cancellation Reason</label>
                <textarea className="form-textarea" placeholder="Enter reason for cancellation..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCancelModal({ open: false })}>Back</button>
              <button className="btn btn-danger" onClick={() => {
                if (cancelModal.id) updateStatus(cancelModal.id, 'CANCELLED');
                setCancelModal({ open: false }); setCancelReason('');
              }}>Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
