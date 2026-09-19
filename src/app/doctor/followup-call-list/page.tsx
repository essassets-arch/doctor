'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock, Phone, PhoneCall, CheckCircle2, AlertCircle,
  Search, Filter, Calendar, User, ArrowRight, MessageSquare,
  X, Check, RotateCcw
} from 'lucide-react';
import { useFollowUpStore, useUIStore, FollowUpTask } from '@/store';

export default function FollowUpCallListPage() {
  const { tasks, addCallLog, updateStatus } = useFollowUpStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'TODAY' | 'MISSED' | 'PROCEDURES' | 'ALL'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskForCall, setSelectedTaskForCall] = useState<FollowUpTask | null>(null);

  // Call drawer state
  const [callOutcome, setCallOutcome] = useState('ANSWERED');
  const [callNotes, setCallNotes] = useState('');

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeTab === 'TODAY' && t.dueDate !== '2026-09-19') return false;
      if (activeTab === 'MISSED' && t.status !== 'NO_SHOW') return false;
      if (activeTab === 'PROCEDURES' && !t.reason.toLowerCase().includes('procedure') && !t.reason.toLowerCase().includes('laser')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.patientName.toLowerCase().includes(q) ||
          t.mrdNumber.toLowerCase().includes(q) ||
          t.mobile.includes(q) ||
          t.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, activeTab, searchQuery]);

  const handleSaveCallLog = () => {
    if (!selectedTaskForCall) return;
    addCallLog(selectedTaskForCall.id, {
      caller: 'Dr. Raj Valaki',
      outcome: callOutcome,
      notes: callNotes.trim() || 'Patient reported satisfactory clinical recovery.'
    });

    addNotification({
      type: 'success',
      message: `Logged follow-up call with ${selectedTaskForCall.patientName}: ${callOutcome}`
    });

    setSelectedTaskForCall(null);
    setCallNotes('');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Follow-Up Call List & Care Coordination</h1>
          <p className="page-subtitle">Track outpatient recovery, procedure recalls, outbound nursing inquiries, and patient drug compliance.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => alert('Simulated care coordination export.')} className="btn btn-outline btn-sm">
            Export Call Ledger
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar (Section 7.1) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'TODAY', label: "Today's F/U (19 Sep)", count: tasks.filter(t => t.dueDate === '2026-09-19').length },
              { id: 'MISSED', label: 'Missed F/U (No Show)', count: tasks.filter(t => t.status === 'NO_SHOW').length },
              { id: 'PROCEDURES', label: 'Pending Procedures', count: tasks.filter(t => t.reason.toLowerCase().includes('procedure') || t.reason.toLowerCase().includes('laser')).length },
              { id: 'ALL', label: 'All Scheduled Recalls', count: tasks.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`badge ${activeTab === tab.id ? 'badge-primary' : 'badge-muted'}`}
                style={{
                  cursor: 'pointer', padding: '6px 14px', fontSize: 12, fontWeight: 700,
                  background: activeTab === tab.id ? '#036d92' : undefined
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="search-input-wrap" style={{ width: 280 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-input"
              placeholder="Search patient, MRD, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table (Section 7.2) */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Clock size={16} color="#036d92" />
            Outbound Follow-Up Recall Ledger — {filteredTasks.length} Records
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Contact</th>
                <th>Attending Doctor</th>
                <th>Original Visit & Reason</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Care Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No follow-up records found matching this category.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {task.patientName}
                      </div>
                      <div style={{ fontSize: 11, color: '#036d92', fontFamily: 'monospace' }}>
                        {task.mrdNumber}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <Phone size={12} color="var(--text-muted)" />
                        <strong>{task.mobile}</strong>
                      </div>
                    </td>

                    <td style={{ fontWeight: 600 }}>{task.doctorName}</td>

                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{task.reason}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Visited: {task.originalVisitDate}</div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{task.dueDate}</span>
                    </td>

                    <td>
                      <span className={`badge ${task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-primary'}`}>
                        {task.priority}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${task.status === 'CALLED' ? 'badge-success' : task.status === 'NO_SHOW' ? 'badge-danger' : 'badge-warning'}`}>
                        {task.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedTaskForCall(task);
                          setCallOutcome('ANSWERED');
                          setCallNotes('');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: '#036d92', color: '#036d92' }}
                      >
                        <PhoneCall size={13} /> Log Call
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Log Drawer Modal (Section 7.2) */}
      {selectedTaskForCall && (
        <div className="modal-overlay" onClick={() => setSelectedTaskForCall(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                Log Follow-Up Call — {selectedTaskForCall.patientName}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTaskForCall(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
                <div><strong>Phone Number:</strong> {selectedTaskForCall.mobile} | MRD: {selectedTaskForCall.mrdNumber}</div>
                <div style={{ marginTop: 2 }}><strong>Recall Purpose:</strong> {selectedTaskForCall.reason}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Call Outcome *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {['ANSWERED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'RESCHEDULED'].map(out => (
                    <button
                      key={out}
                      type="button"
                      onClick={() => setCallOutcome(out)}
                      className={`btn ${callOutcome === out ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      style={{ background: callOutcome === out ? '#036d92' : undefined, justifyContent: 'center' }}
                    >
                      {out}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Patient Clinical Response & Drug Compliance Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Record patient recovery status, whether medicines were taken, symptom clearance..."
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                />
              </div>

              {/* Past Call History */}
              {selectedTaskForCall.callLogs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Previous Call History:
                  </div>
                  {selectedTaskForCall.callLogs.map((log, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      • <strong>{log.date} ({log.caller}):</strong> [{log.outcome}] {log.notes}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedTaskForCall(null)}>
                Cancel
              </button>
              <button
                onClick={handleSaveCallLog}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92' }}
              >
                Save Call Entry ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
