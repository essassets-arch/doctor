'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall, Clock, CheckCircle2, AlertCircle, PhoneOff,
  User, Calendar, MessageSquare, Send, ArrowLeft,
  ChevronRight, Sparkles, Check, AlertTriangle, HelpCircle
} from 'lucide-react';
import { useFollowUpStore, usePatientStore, useAppointmentStore, useUIStore } from '@/store';

type CallOutcome = 'Rescheduled' | 'NoAnswer' | 'DoNotCall' | 'UnableReach';

export default function NursingFollowUpPage() {
  const { tasks, addCallLog, updateStatus } = useFollowUpStore();
  const { patients, updatePatient } = usePatientStore();
  const { addAppointment } = useAppointmentStore();
  const { addNotification } = useUIStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || 'fu-1');
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
  const patient = patients.find(p => p.id === selectedTask?.patientId);

  // Call logging form state
  const [outcome, setOutcome] = useState<CallOutcome>('Rescheduled');
  const [newDate, setNewDate] = useState('2026-09-24');
  const [newTime, setNewTime] = useState('10:30');
  const [drugCompliance, setDrugCompliance] = useState<'Yes' | 'No' | 'Partial'>('Yes');
  const [adviceFollowed, setAdviceFollowed] = useState<'Yes' | 'No'>('Yes');
  const [callNotes, setCallNotes] = useState('Patient reported symptom relief. Scheduled review next Thursday.');
  const [sendConfirmation, setSendConfirmation] = useState(true);

  const handleSaveLog = () => {
    if (!selectedTask) return;

    let outcomeText = 'ANSWERED';
    if (outcome === 'NoAnswer') outcomeText = 'NO_ANSWER';
    else if (outcome === 'DoNotCall') outcomeText = 'DO_NOT_CALL';
    else if (outcome === 'UnableReach') outcomeText = 'UNREACHABLE';

    // 1. Add call log to task
    addCallLog(selectedTask.id, {
      caller: 'Nurse Bhavna',
      outcome: outcomeText,
      notes: `[Compliance: Drug ${drugCompliance}, Advice ${adviceFollowed}] ${callNotes}`
    });

    // 2. Section 6.3: Automated Special Note Trigger for Missed Visits
    if (outcome === 'NoAnswer' && patient) {
      const todayFormatted = new Date().toLocaleDateString('en-GB');
      const missedAlertNote = `${todayFormatted}/F/U Missed — Call Not Answered`;
      const currentNotes = patient.specialNotes || [];
      updatePatient(patient.id, {
        specialNotes: [...currentNotes, missedAlertNote]
      });

      addNotification({
        type: 'warning',
        message: `Special Note logged for ${patient.firstName}: "${missedAlertNote}". Will flash on Doctor's consultation bar.`
      });
    }

    // 3. Section 6.4: Reschedule appointment if confirmed
    if (outcome === 'Rescheduled' && patient) {
      addAppointment({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorId: 'doc-1',
        doctorName: selectedTask.doctorName,
        date: newDate,
        time: newTime,
        visitType: 'Follow-Up',
        status: 'SCHEDULED',
        remarks: `Outreach Follow-Up: ${callNotes}`
      });

      updateStatus(selectedTask.id, 'CALLED');

      addNotification({
        type: 'success',
        message: `Appointment scheduled for ${patient.firstName} on ${newDate} at ${newTime}! Confirmation ${sendConfirmation ? 'dispatched via WhatsApp/SMS' : 'saved'}.`
      });
    } else {
      updateStatus(selectedTask.id, outcome === 'NoAnswer' ? 'NO_SHOW' : 'CALLED');
    }

    setCallNotes('');
  };

  return (
    <div className="page-container" style={{ width: '100%', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/nursing/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Nursing Dashboard
          </Link>
          <h1 className="page-title" style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
            Follow-Up Call Management & Post-Care Outreach
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B' }}>
            Doctor-forwarded care coordination: Track patient recovery, assess drug compliance, and auto-flag missed follow-up notes.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Left Doctor-Forwarded Queue + Right Call Logger */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', gap: 24, alignItems: 'start' }}>
        {/* Left: 6.1 Doctor-Forwarded Call Queue */}
        <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneCall size={16} color="#059669" /> Delegated Patient Calling Queue
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 999 }}>
              {tasks.length} Outreach Tasks
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tasks.map((task, idx) => {
              const isSelected = task.id === selectedTaskId;
              const isNoShow = task.status === 'NO_SHOW';
              const isCalled = task.status === 'CALLED';

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F1F5F9',
                    background: isSelected ? '#ecfdf5' : '#FFFFFF',
                    borderLeft: isSelected ? '4px solid #059669' : '4px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  className="hover:bg-slate-50"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, fontSize: 11, color: '#64748B' }}>Pr {idx + 1}</span>
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>{task.patientName}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                          {task.mrdNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 3 }}>
                        {task.reason}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        Attending: {task.doctorName} • Due: <strong>{task.dueDate}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 900, padding: '2px 8px', borderRadius: 999,
                        background: isCalled ? '#ecfdf5' : isNoShow ? '#FFF1F2' : '#EFF6FF',
                        color: isCalled ? '#059669' : isNoShow ? '#DC2626' : '#2563EB'
                      }}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  {/* Previous Call Logs snippet */}
                  {task.callLogs.length > 0 && (
                    <div style={{ marginTop: 8, padding: '6px 8px', background: '#F8FAFC', borderRadius: 6, fontSize: 10.5, color: '#64748B' }}>
                      Last Log: {task.callLogs[0].date} ({task.callLogs[0].outcome}) — {task.callLogs[0].notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 6.2 Interactive Call Outcome Selector & Form */}
        <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
              Log Outreach Call Outcome — {selectedTask?.patientName}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
              Mobile: <strong style={{ color: '#0F172A' }}>{selectedTask?.mobile}</strong> • MRD: {selectedTask?.mrdNumber}
            </div>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Outcome Selection Buttons */}
            <div>
              <label className="form-label required">Call Outcome Classification</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setOutcome('Rescheduled')}
                  className="btn btn-sm"
                  style={{
                    padding: '8px 10px', fontSize: 11.5, fontWeight: 800, justifyContent: 'center',
                    background: outcome === 'Rescheduled' ? '#059669' : '#F8FAFC',
                    color: outcome === 'Rescheduled' ? '#FFFFFF' : '#334155',
                    border: outcome === 'Rescheduled' ? '1.5px solid #059669' : '1px solid #CBD5E1'
                  }}
                >
                  <CheckCircle2 size={13} /> Called & Rescheduled
                </button>

                <button
                  type="button"
                  onClick={() => setOutcome('NoAnswer')}
                  className="btn btn-sm"
                  style={{
                    padding: '8px 10px', fontSize: 11.5, fontWeight: 800, justifyContent: 'center',
                    background: outcome === 'NoAnswer' ? '#DC2626' : '#F8FAFC',
                    color: outcome === 'NoAnswer' ? '#FFFFFF' : '#334155',
                    border: outcome === 'NoAnswer' ? '1.5px solid #DC2626' : '1px solid #CBD5E1'
                  }}
                >
                  <PhoneOff size={13} /> Called — No Answer (F/U Missed)
                </button>

                <button
                  type="button"
                  onClick={() => setOutcome('DoNotCall')}
                  className="btn btn-sm"
                  style={{
                    padding: '8px 10px', fontSize: 11.5, fontWeight: 800, justifyContent: 'center',
                    background: outcome === 'DoNotCall' ? '#475569' : '#F8FAFC',
                    color: outcome === 'DoNotCall' ? '#FFFFFF' : '#334155',
                    border: outcome === 'DoNotCall' ? '1.5px solid #475569' : '1px solid #CBD5E1'
                  }}
                >
                  Do Not Call (Patient Request)
                </button>

                <button
                  type="button"
                  onClick={() => setOutcome('UnableReach')}
                  className="btn btn-sm"
                  style={{
                    padding: '8px 10px', fontSize: 11.5, fontWeight: 800, justifyContent: 'center',
                    background: outcome === 'UnableReach' ? '#D97706' : '#F8FAFC',
                    color: outcome === 'UnableReach' ? '#FFFFFF' : '#334155',
                    border: outcome === 'UnableReach' ? '1.5px solid #D97706' : '1px solid #CBD5E1'
                  }}
                >
                  Unable to Reach (Switched Off)
                </button>
              </div>
            </div>

            {/* Special Note Rule Callout if No Answer */}
            {outcome === 'NoAnswer' && (
              <div style={{
                padding: '12px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5',
                borderRadius: 10, color: '#991B1B', fontSize: 12, display: 'flex', alignItems: 'center', gap: 10
              }}>
                <AlertTriangle size={18} color="#DC2626" className="shrink-0" />
                <div>
                  <strong>Automated Clinical Rule Active:</strong> System will generate an immutable special note:
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#DC2626', marginTop: 2 }}>
                    "[Date]/F/U Missed — Call Not Answered"
                  </div>
                  This alert will flash on the Doctor's consultation top bar on their next visit.
                </div>
              </div>
            )}

            {/* Rescheduling Fields if Rescheduled */}
            {outcome === 'Rescheduled' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div>
                  <label className="form-label required">New Follow-Up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label required">New Follow-Up Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Medication & Advice Compliance checks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Drug Taken by Patient?</label>
                <select
                  className="form-select"
                  value={drugCompliance}
                  onChange={e => setDrugCompliance(e.target.value as any)}
                >
                  <option value="Yes">Yes (Full Compliance)</option>
                  <option value="Partial">Partial (Missed Doses)</option>
                  <option value="No">No (Stopped Medication)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Clinical Advice Followed?</label>
                <select
                  className="form-select"
                  value={adviceFollowed}
                  onChange={e => setAdviceFollowed(e.target.value as any)}
                >
                  <option value="Yes">Yes (Diet/Rest Maintained)</option>
                  <option value="No">No (Deviated from Advice)</option>
                </select>
              </div>
            </div>

            {/* Call Notes */}
            <div className="form-group">
              <label className="form-label">Nursing Progress & Call Observations</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Document patient symptom feedback, topical tolerability, side-effects..."
                value={callNotes}
                onChange={e => setCallNotes(e.target.value)}
              />
            </div>

            {/* Confirmation SMS/WhatsApp toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="sendConf"
                checked={sendConfirmation}
                onChange={e => setSendConfirmation(e.target.checked)}
              />
              <label htmlFor="sendConf" style={{ fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                Dispatch automated SMS & WhatsApp appointment voucher to {selectedTask?.mobile}
              </label>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSaveLog}
              className="btn btn-primary"
              style={{
                background: '#059669', borderColor: '#059669', padding: '12px',
                fontSize: 13.5, fontWeight: 800, justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={16} /> Save Outreach Call Log & Update Clinical Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
