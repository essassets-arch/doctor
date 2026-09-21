'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Stethoscope, PhoneCall, Play, CheckCircle2,
  AlertCircle, XCircle, RotateCcw, Tv, Search, Filter,
  Clock, ShieldAlert, CreditCard, Heart, ArrowUpRight,
  Sparkles, BellRing, Volume2, UserCheck, X, Wallet
} from 'lucide-react';
import {
  useQueueStore, usePatientStore, useUIStore,
  QueueEntry, QueueStatus, BillingStatus, Patient
} from '@/store';
import QueueStatusBadge from '@/components/QueueStatusBadge';
import PaymentModal from '@/components/PaymentModal';

export default function OPDQueuePage() {
  const router = useRouter();
  const { queue, doctors, updateStatus, updateQueueEntry, updateVitals, updateComplaints, cancelEntry } = useQueueStore();
  const { patients } = usePatientStore();
  const { addNotification } = useUIStore();

  // Filters
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment modal for fee collection
  const [payingEntry, setPayingEntry] = useState<QueueEntry | null>(null);

  // Cancel entry modal
  const [cancellingEntry, setCancellingEntry] = useState<QueueEntry | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient Left Without Consultation');

  // Currently calling entry
  const callingEntry = queue.find(q => q.status === 'CALLING');

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      // Doctor filter
      if (selectedDoctorId !== 'ALL' && item.doctorId !== selectedDoctorId) return false;

      // Status filter
      if (statusFilter === 'ACTIVE') {
        if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return false;
      } else if (statusFilter !== 'ALL') {
        if (item.status !== statusFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.patientName.toLowerCase().includes(q) ||
          item.tokenDisplay.toLowerCase().includes(q) ||
          item.caseNumber.toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [queue, selectedDoctorId, statusFilter, searchQuery]);

  // Statistics
  const totalWaiting = queue.filter(q => q.status === 'WAITING').length;
  const totalInSession = queue.filter(q => q.status === 'IN_SESSION').length;
  const totalCompleted = queue.filter(q => q.status === 'COMPLETED').length;

  const handleCallPatient = (entry: QueueEntry) => {
    updateStatus(entry.id, 'CALLING');
    addNotification({
      type: 'danger',
      message: `NOW CALLING: ${entry.patientName} (Token ${entry.tokenDisplay}) — ${entry.doctorName}`
    });
  };

  const handleStartConsultation = (entry: QueueEntry) => {
    updateStatus(entry.id, 'IN_SESSION');
    addNotification({
      type: 'success',
      message: `${entry.patientName} entered Consultation with ${entry.doctorName}`
    });
  };

  const handleCompleteConsultation = (entry: QueueEntry) => {
    updateStatus(entry.id, 'COMPLETED');
    addNotification({
      type: 'info',
      message: `Completed visit: ${entry.patientName} (${entry.tokenDisplay})`
    });
  };

  const handleMarkMissed = (entry: QueueEntry) => {
    updateStatus(entry.id, 'MISSED');
    addNotification({
      type: 'warning',
      message: `Marked missed: ${entry.patientName} (${entry.tokenDisplay})`
    });
  };

  const handleConfirmCancel = () => {
    if (!cancellingEntry) return;
    cancelEntry(cancellingEntry.id, cancelReason);
    addNotification({
      type: 'warning',
      message: `Cancelled Token ${cancellingEntry.tokenDisplay} for ${cancellingEntry.patientName}`
    });
    setCancellingEntry(null);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Queue Control & Live Board</h1>
          <p className="page-subtitle">Real-time patient flow supervisor: manage tokens, broadcast audio chimes to waiting halls, and coordinate consulting rooms.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/waiting-screen" target="_blank">
            <button className="btn btn-ghost" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <Tv size={16} /> Open Waiting Room TV Display <ArrowUpRight size={14} />
            </button>
          </Link>
          <Link href="/reception/checkin">
            <button className="btn btn-primary">
              + Issue New Token
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Calling Banner if someone is being called */}
      {callingEntry && (
        <div className="alert-banner danger" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
          <Volume2 size={24} style={{ animation: 'bounce 1s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              NOW CALLING PATIENT TO CONSULTATION ROOM
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              Token {callingEntry.tokenDisplay}: {callingEntry.patientName} → Proceeding to {callingEntry.doctorName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleStartConsultation(callingEntry)}
              className="btn btn-success btn-sm"
            >
              <Play size={14} /> Patient Entered Room
            </button>
            <button
              onClick={() => handleMarkMissed(callingEntry)}
              className="btn btn-ghost btn-sm"
              style={{ color: '#991B1B' }}
            >
              Mark Not Responding
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-label">Currently Waiting</div>
          <div className="stat-value">{totalWaiting}</div>
          <div className="stat-sub">Patients in waiting lounge</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Calling Right Now</div>
          <div className="stat-value">{callingEntry ? 1 : 0}</div>
          <div className="stat-sub">{callingEntry ? `Token ${callingEntry.tokenDisplay}` : 'No active call'}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">In Active Session</div>
          <div className="stat-value">{totalInSession}</div>
          <div className="stat-sub">Inside doctor rooms</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Completed Today</div>
          <div className="stat-value">{totalCompleted}</div>
          <div className="stat-sub">Consultations closed</div>
        </div>
      </div>

      {/* Doctor Tabs Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', gap: 8, padding: '14px 16px', overflowX: 'auto',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)'
        }}>
          <button
            onClick={() => setSelectedDoctorId('ALL')}
            className={`btn ${selectedDoctorId === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px' }}
          >
            All Consulting Rooms ({queue.length})
          </button>
          {doctors.map(doc => {
            const active = selectedDoctorId === doc.id;
            const waitingCount = queue.filter(q => q.doctorId === doc.id && q.status === 'WAITING').length;
            const inRoomCount = queue.filter(q => q.doctorId === doc.id && q.status === 'IN_SESSION').length;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: 'var(--radius-full)', padding: '6px 14px',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>{doc.name}</span>
                <span className="badge" style={{
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                  color: active ? 'white' : 'var(--text-secondary)',
                  fontSize: 10
                }}>
                  {waitingCount} wait / {inRoomCount} in
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search token #, patient name, doctor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Active Queue', value: 'ACTIVE' },
              { label: 'Waiting', value: 'WAITING' },
              { label: 'Calling', value: 'CALLING' },
              { label: 'In Session', value: 'IN_SESSION' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'All', value: 'ALL' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`badge ${statusFilter === f.value ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Queue Table */}
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Details</th>
                <th>Doctor & Room</th>
                <th>Visit Type</th>
                <th>Check-In</th>
                <th>Triage Status</th>
                <th>Fee & Billing</th>
                <th>Queue Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600 }}>No queue entries match the current filter.</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map(item => {
                  const isCalling = item.status === 'CALLING';
                  const isInSession = item.status === 'IN_SESSION';

                  return (
                    <tr
                      key={item.id}
                      className={isCalling ? 'row-calling' : isInSession ? 'row-insession' : ''}
                    >
                      {/* Token */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 900, fontSize: 18,
                            color: isCalling ? 'var(--primary)' : 'var(--text-primary)',
                            letterSpacing: '0.04em'
                          }}>
                            {item.tokenDisplay}
                          </span>
                          {item.priority === 'EMERGENCY' && (
                            <span className="badge badge-danger" style={{ fontSize: 9, animation: 'pulse 1.2s infinite' }}>
                              EMERGENCY 🚨
                            </span>
                          )}
                          {item.isMR && (
                            <span className="badge badge-purple" style={{ fontSize: 9 }}>
                              MR
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.caseNumber}</div>
                      </td>

                      {/* Patient */}
                      <td>
                        <Link href={`/reception/patients/${item.patientId}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.patientName}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {item.age}Y • {item.gender === 'M' ? 'Male' : 'Female'} • {item.city}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.doctorName}</div>
                        <span className="badge badge-info" style={{ fontSize: 10, marginTop: 2 }}>
                          {doctors.find(d => d.id === item.doctorId)?.room || 'Room 1'}
                        </span>
                      </td>

                      {/* Visit Type */}
                      <td>
                        <span className="badge badge-purple">{item.visitType}</span>
                      </td>

                      {/* Check-In */}
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{item.checkInTime || item.appointmentTime}</span>
                      </td>

                      {/* Triage */}
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => updateVitals(item.id, !item.vitalsRecorded)}
                            title="Toggle Vitals Recorded"
                            className={`badge ${item.vitalsRecorded ? 'badge-success' : 'badge-warning'}`}
                            style={{ cursor: 'pointer', fontSize: 10 }}
                          >
                            <Heart size={10} /> {item.vitalsRecorded ? 'Vitals ✓' : 'Vitals ?'}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateComplaints(item.id, !item.complaintsRecorded)}
                            title="Toggle Complaint Recorded"
                            className={`badge ${item.complaintsRecorded ? 'badge-success' : 'badge-muted'}`}
                            style={{ cursor: 'pointer', fontSize: 10 }}
                          >
                            {item.complaintsRecorded ? 'Rx ✓' : 'Rx ?'}
                          </button>
                        </div>
                      </td>

                      {/* Billing */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`badge ${
                            item.billingStatus === 'PAID' ? 'badge-success' :
                            item.billingStatus === 'FOC' ? 'badge-info' :
                            item.billingStatus === 'PARTIAL' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {item.billingStatus}
                          </span>
                          {item.billingStatus === 'PENDING' && (
                            <button
                              onClick={() => setPayingEntry(item)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              title="Collect Fee"
                            >
                              Collect
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <QueueStatusBadge status={item.status} />
                      </td>

                      {/* Action buttons */}
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {!item.checkInTime && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                                updateQueueEntry(item.id, { checkInTime: time, status: 'WAITING' });
                                addNotification({
                                  type: 'success',
                                  message: `${item.patientName} (${item.tokenDisplay}) marked Arrived at clinic.`
                                });
                              }}
                              className="btn btn-success btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px' }}
                              title="Mark Patient Arrived"
                            >
                              <CheckCircle2 size={12} /> Arrived
                            </button>
                          )}

                          {item.status === 'WAITING' && item.stage !== 'DOCTOR' && (
                            <button
                              onClick={() => {
                                updateQueueEntry(item.id, { stage: 'DOCTOR' });
                                addNotification({
                                  type: 'success',
                                  message: `${item.patientName} (${item.tokenDisplay}) sent to Doctor Queue.`
                                });
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: '#036d92', color: '#036d92', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px' }}
                              title="Send Directly to Doctor Queue"
                            >
                              <Stethoscope size={12} /> Send to Doctor
                            </button>
                          )}

                          {item.status === 'WAITING' && (
                            <button
                              onClick={() => handleCallPatient(item)}
                              className="btn btn-primary btn-sm"
                              title="Call Patient Now"
                            >
                              <Volume2 size={13} /> Call
                            </button>
                          )}

                          {item.status === 'CALLING' && (
                            <button
                              onClick={() => handleStartConsultation(item)}
                              className="btn btn-success btn-sm"
                              title="Patient Entered Room"
                            >
                              <Play size={13} /> Start
                            </button>
                          )}

                          {item.status === 'IN_SESSION' && (
                            <button
                              onClick={() => handleCompleteConsultation(item)}
                              className="btn btn-success btn-sm"
                              title="Mark Consultation Complete"
                            >
                              <CheckCircle2 size={13} /> Done
                            </button>
                          )}

                          {item.status === 'BILLING_PENDING' && (
                            <button
                              onClick={() => router.push(`/reception/patients/${item.patientId}#billing`)}
                              className="btn btn-primary btn-sm"
                              style={{ background: '#EA580C', borderColor: '#EA580C', padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                              title="Reconcile & Settle Bill"
                            >
                              <Wallet size={12} /> Settle Bill →
                            </button>
                          )}

                          {item.status === 'MISSED' && (
                            <button
                              onClick={() => handleCallPatient(item)}
                              className="btn btn-warning btn-sm"
                              title="Recall Patient"
                            >
                              <RotateCcw size={13} /> Recall
                            </button>
                          )}

                          {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setCancellingEntry(item)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', color: 'var(--danger)' }}
                              title="Cancel Entry"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {payingEntry && (
        <PaymentModal
          patient={patients.find(p => p.id === payingEntry.patientId) || {
            id: payingEntry.patientId,
            mrdNumber: 'MRD-UNKNOWN',
            firstName: payingEntry.patientName.split(' ')[0],
            lastName: payingEntry.patientName.split(' ')[1] || '',
            mobile: '9825100000',
            age: payingEntry.age,
            ageMonths: 0,
            ageDays: 0,
            gender: payingEntry.gender,
            language: 'Gujarati',
            createdAt: '2026-09-19'
          }}
          doctorName={payingEntry.doctorName}
          fee={500}
          onSuccess={() => {
            // Update queue item billing status
            useQueueStore.setState(s => ({
              queue: s.queue.map(q => q.id === payingEntry.id ? { ...q, billingStatus: 'PAID' } : q)
            }));
            setPayingEntry(null);
          }}
          onClose={() => setPayingEntry(null)}
        />
      )}

      {/* Cancel Queue Entry Dialog */}
      {cancellingEntry && (
        <div className="modal-overlay" onClick={() => setCancellingEntry(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} /> Cancel Token {cancellingEntry.tokenDisplay}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setCancellingEntry(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Are you sure you want to cancel the queue token for <strong>{cancellingEntry.patientName}</strong>?
              </p>

              <div className="form-group">
                <label className="form-label required">Cancellation Reason</label>
                <select
                  className="form-select"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                >
                  <option value="Patient Left Without Consultation">Patient Left Without Consultation</option>
                  <option value="Duplicate Token Issued">Duplicate Token Issued</option>
                  <option value="Doctor Emergency Unavailable">Doctor Emergency Unavailable</option>
                  <option value="Transferred to Hospital Casualty">Transferred to Hospital Casualty</option>
                  <option value="Fee Payment Refused">Fee Payment Refused</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCancellingEntry(null)}>
                Keep In Queue
              </button>
              <button className="btn btn-danger" onClick={handleConfirmCancel}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
