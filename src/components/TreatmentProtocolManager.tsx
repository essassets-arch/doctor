'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap, Calendar, Clock, Check, Ban, AlertCircle, CheckCircle2,
  Plus, X, RotateCcw, LayoutGrid, List, Sparkles,
  ArrowRight, ShieldCheck, RefreshCw, UserCheck, Stethoscope
} from 'lucide-react';
import {
  useConsultationStore,
  useUIStore,
  ProcedureExecutionItem,
  TreatmentProtocol,
  DEFAULT_TREATMENT_PROTOCOL,
  DEFAULT_TREATMENT_SESSIONS,
  formatToDDMMYYYY,
  parseAnyDate,
  addDaysToFormattedDate,
  notifyTabSync
} from '@/store';

interface TreatmentProtocolManagerProps {
  caseId?: string;
  patientId?: string;
  patientName?: string;
  mode?: 'doctor' | 'reception';
  onChanged?: () => void;
}

export default function TreatmentProtocolManager({
  caseId: initialCaseId,
  patientId,
  patientName,
  mode = 'doctor',
  onChanged
}: TreatmentProtocolManagerProps) {
  const { addNotification } = useUIStore();
  const consultationStore = useConsultationStore();

  // Resolve the single source of truth Case ID
  const caseId = useMemo(() => {
    if (initialCaseId) return initialCaseId;
    // If patientId provided, check if any active or existing session has this patientId
    if (patientId) {
      for (const [cId, sess] of Object.entries(consultationStore.sessions)) {
        if (sess.patientId === patientId) return cId;
      }
      if (consultationStore.activeSession?.patientId === patientId) {
        return consultationStore.activeSession.caseId;
      }
    }
    return 'C005-001-23092026';
  }, [initialCaseId, patientId, consultationStore.sessions, consultationStore.activeSession]);

  // Tab synchronization tick state
  const [syncTick, setSyncTick] = useState<number>(Date.now());
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [procCatalogSearch, setProcCatalogSearch] = useState('');
  const [showLevel2, setShowLevel2] = useState<boolean>(false);

  // Modals state
  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    procedureId: string | null;
    reason: string;
    customNote: string;
    rescheduledDate: string;
    rate: number;
  }>({
    isOpen: false,
    procedureId: null,
    reason: 'NOT TACKEN - Not avelibal',
    customNote: 'NOT TACKEN - Not avelibal',
    rescheduledDate: '20/04/2026',
    rate: 2250
  });

  const [delayModalState, setDelayModalState] = useState<{
    isOpen: boolean;
    procedureId: string | null;
    delayDays: number;
    reason: string;
  }>({
    isOpen: false,
    procedureId: null,
    delayDays: 12,
    reason: 'Client conflict - delay +12 days'
  });

  // Single Source of Truth Session & Protocol extraction
  const sessionData = useMemo(() => {
    const fromStore = consultationStore.sessions[caseId] ||
      (consultationStore.activeSession?.caseId === caseId ? consultationStore.activeSession : null) ||
      (patientId ? Object.values(consultationStore.sessions).find(s => s.patientId === patientId) : null);

    const protocol: TreatmentProtocol = fromStore?.treatmentProtocol || {
      ...DEFAULT_TREATMENT_PROTOCOL,
      caseId,
      patientId: patientId || ''
    };

    const procedures: ProcedureExecutionItem[] = (fromStore?.procedures && fromStore.procedures.length > 0)
      ? fromStore.procedures
      : DEFAULT_TREATMENT_SESSIONS;

    return { protocol, procedures };
  }, [caseId, patientId, consultationStore.sessions, consultationStore.activeSession, syncTick]);

  // Local editable form fields synced to session protocol
  const [protocolForm, setProtocolForm] = useState<TreatmentProtocol>(sessionData.protocol);

  // Sync protocolForm when store updates from either tab
  useEffect(() => {
    setProtocolForm(sessionData.protocol);
    setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [sessionData.protocol]);

  // Real-time Cross-Tab BroadcastChannel & Storage Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('doctor_medflow_sync');
        bc.onmessage = (event) => {
          if (event.data?.key === 'doctor-consultation' || event.data?.key === 'treatment-protocol') {
            setSyncTick(Date.now());
            setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            if (onChanged) onChanged();
          }
        };
      }
    } catch {}

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'doctor-consultation') {
        setSyncTick(Date.now());
        setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (onChanged) onChanged();
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      try { bc?.close(); } catch {}
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [onChanged]);

  // Push changes to server API endpoint in background
  const syncWithServerApi = useCallback(async (_action?: string, _extraData?: unknown) => {
    notifyTabSync('doctor-consultation');
  }, []);

  // Level 1: Auto-generate future schedule dates
  const liveCalculatedFutureDates = useMemo(() => {
    const count = Math.max(1, protocolForm.totalSessions || 4);
    const interval = Math.max(1, protocolForm.intervalDays || 20);
    const startStr = protocolForm.startDate || '2026-03-25';
    const parsedStart = parseAnyDate(startStr);
    let curr = formatToDDMMYYYY(parsedStart);

    const dates: string[] = [];
    for (let i = 0; i < count; i++) {
      dates.push(curr);
      curr = addDaysToFormattedDate(curr, interval);
    }
    return dates;
  }, [protocolForm.startDate, protocolForm.intervalDays, protocolForm.totalSessions]);

  // Execute Auto-Generate Schedule into the single source of truth
  const handleApplyAutoGeneratedSchedule = () => {
    const count = Math.max(1, Number(protocolForm.totalSessions) || 1);
    const disc = Number(protocolForm.discountPercent) || 0;
    const actual = Number(protocolForm.actualPrice) || 0;
    const after = Math.round(actual * (1 - disc / 100));
    const rate = Math.round(after / count);

    const updatedProtocol: TreatmentProtocol = {
      ...protocolForm,
      totalSessions: count,
      discountPercent: disc,
      actualPrice: actual,
      afterDiscountPrice: after,
      total: after,
      ratePerSession: rate
    };

    consultationStore.generateProtocolSchedule(caseId, updatedProtocol);
    syncWithServerApi('auto_generate', { protocol: updatedProtocol });
    setShowLevel2(true);

    addNotification({
      type: 'success',
      message: `⚡ Auto-generated & unlocked ${count} session(s) (${updatedProtocol.intervalDays}d interval) in unified record!`
    });

    if (onChanged) onChanged();

    setTimeout(() => {
      const el = document.getElementById('level-2-execution-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Modify any session field directly (single source of truth mutation)
  const handleSessionFieldChange = (procedureId: string, updates: Partial<ProcedureExecutionItem>) => {
    consultationStore.updateSessionProcedure(caseId, procedureId, updates);
    syncWithServerApi('update_session', { procedureId, updates });
    if (onChanged) onChanged();
  };

  // Delay +12 Days Cascade Action
  const handleExecuteDelay12Days = (procedureId: string, delayDays: number = 12, reason?: string) => {
    consultationStore.delayProtocolSession(caseId, procedureId, delayDays, reason);
    syncWithServerApi('delay_session', { procedureId, delayDays, reason });

    const targetProc = sessionData.procedures.find(p => p.id === procedureId);
    const sessionNum = targetProc?.sessionNumber || 2;

    addNotification({
      type: 'warning',
      message: `⏱ Session ${sessionNum} delayed by +${delayDays}d. Downstream scheduled sessions shifted automatically across Doctor & Reception!`
    });

    if (onChanged) onChanged();
  };

  // Mark Session Done Action
  const handleMarkSessionDone = (procedureId: string) => {
    const todayFormatted = formatToDDMMYYYY(new Date());
    const updates: Partial<ProcedureExecutionItem> = {
      status: 'Done',
      performanceDate: todayFormatted,
      paymentStatus: 'Done',
      completedInClinic: true,
      remark: 'Session executed with recorded clinical settings.'
    };
    consultationStore.updateSessionProcedure(caseId, procedureId, updates);
    syncWithServerApi('update_session', { procedureId, updates });

    addNotification({
      type: 'success',
      message: `✓ Session marked as Done (Performance Date: ${todayFormatted}). Synced to unified record.`
    });

    if (onChanged) onChanged();
  };

  // Cancel Session with Reason Action
  const handleConfirmCancelSession = () => {
    if (!cancelModalState.procedureId) return;
    const isReschedule = cancelModalState.reason.toLowerCase().includes('f/u date') || cancelModalState.reason.toLowerCase().includes('reschedule');

    const updates: Partial<ProcedureExecutionItem> = {
      status: isReschedule ? 'Delayed' : 'Cancelled',
      paymentStatus: isReschedule ? 'Pending' : 'Cancelled',
      scheduledDate: (isReschedule && cancelModalState.rescheduledDate) ? cancelModalState.rescheduledDate : undefined,
      rate: cancelModalState.rate,
      price: cancelModalState.rate,
      remark: cancelModalState.customNote || cancelModalState.reason
    };

    consultationStore.updateSessionProcedure(caseId, cancelModalState.procedureId, updates);
    syncWithServerApi('update_session', { procedureId: cancelModalState.procedureId, updates });

    setCancelModalState(s => ({ ...s, isOpen: false }));

    addNotification({
      type: isReschedule ? 'warning' : 'danger',
      message: isReschedule
        ? `Session rescheduled to ${cancelModalState.rescheduledDate}`
        : `Session cancellation recorded (${cancelModalState.reason}). Unified record updated.`
    });

    if (onChanged) onChanged();
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1.5px solid #0284C7',
      boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
      overflow: 'hidden',
      marginBottom: 24
    }}>
      {/* Synchronization Status Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #0369A1 0%, #0284C7 50%, #0369A1 100%)',
        padding: '10px 18px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: '#10B981',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 900,
            padding: '3px 10px',
            borderRadius: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 1px 4px rgba(16, 185, 129, 0.4)'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            SINGLE SOURCE OF TRUTH ACTIVE
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3 }}>
            ⚡ Laser &amp; Clinical Procedure Treatment Protocol
          </span>
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>
            Case: {caseId}
          </span>
          {patientName && (
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 4 }}>
              Patient: <strong>{patientName}</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#E0F2FE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} /> Synced: {lastSyncTime}
          </span>
          <span className="badge" style={{
            background: mode === 'doctor' ? '#F59E0B' : '#3B82F6',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 9px'
          }}>
            {mode === 'doctor' ? '👨‍⚕️ Doctor Consultation Mode' : '🏢 Reception Front-Desk Mode'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LEVEL 1: TREATMENT PROTOCOL */}
      {/* ============================================================ */}
      <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
        
        {/* Protocol Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              Level 1: Treatment Protocol Configuration
              <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 800 }}>
                {protocolForm.totalSessions} Sessions Configured
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Dates recalculate automatically when interval is updated. Clicking <strong>Delay +12d</strong> shifts subsequent sessions.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleApplyAutoGeneratedSchedule}
              className="btn btn-sm"
              style={{
                background: '#F59E0B',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 900,
                fontSize: 12,
                padding: '7px 15px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 7,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                cursor: 'pointer'
              }}
              title="Recalculate and update the sessions schedule from first session date"
            >
              <Zap size={14} /> ⚡ Auto-Generate Schedule
            </button>
          </div>
        </div>

        {/* Level 1 Grid: All Directly Writable Fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          alignItems: 'flex-end',
          background: '#FFFFFF',
          padding: '14px 16px',
          borderRadius: 8,
          border: '1px solid #CBD5E1'
        }}>
          {/* 1. Treatment / Procedure */}
          <div style={{ minWidth: 170 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              Procedure / Tech *
            </label>
            <input
              type="text"
              className="form-input"
              value={protocolForm.procedureName}
              onChange={e => setProtocolForm({ ...protocolForm, procedureName: e.target.value })}
              placeholder="HAIR REMOVAL - DIODE"
              style={{ fontSize: 12, fontWeight: 800, height: 36, color: '#0369A1' }}
            />
          </div>

          {/* 2. First Session Date */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              First Session Date *
            </label>
            <input
              type="text"
              className="form-input"
              value={protocolForm.startDate}
              onChange={e => setProtocolForm({ ...protocolForm, startDate: e.target.value })}
              placeholder="25/03/2026"
              style={{ fontSize: 12, fontWeight: 800, height: 36, fontFamily: 'monospace' }}
            />
          </div>

          {/* 3. Number of Sessions */}
          <div style={{ maxWidth: 110 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              Sessions *
            </label>
            <input
              type="number"
              min={1}
              max={16}
              className="form-input"
              value={protocolForm.totalSessions}
              onChange={e => {
                const count = parseInt(e.target.value) || 1;
                const after = protocolForm.afterDiscountPrice || 9000;
                setProtocolForm({
                  ...protocolForm,
                  totalSessions: count,
                  ratePerSession: Math.round(after / count)
                });
              }}
              style={{ fontSize: 12.5, fontWeight: 900, textAlign: 'center', height: 36 }}
            />
          </div>

          {/* 4. Follow-Up Interval Days */}
          <div style={{ maxWidth: 110 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              Interval (Days) *
            </label>
            <input
              type="number"
              min={1}
              className="form-input"
              value={protocolForm.intervalDays}
              onChange={e => {
                const days = parseInt(e.target.value) || 1;
                setProtocolForm({ ...protocolForm, intervalDays: days });
              }}
              style={{ fontSize: 12.5, fontWeight: 900, textAlign: 'center', height: 36, color: '#0369A1' }}
            />
          </div>

          {/* 5. Therapist / By */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              Therapist / By *
            </label>
            <input
              type="text"
              className="form-input"
              value={protocolForm.therapist}
              onChange={e => setProtocolForm({ ...protocolForm, therapist: e.target.value })}
              placeholder="Dr Valaki"
              style={{ fontSize: 12, fontWeight: 700, height: 36 }}
            />
          </div>

          {/* 6. Body Part */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              Body Part *
            </label>
            <input
              type="text"
              className="form-input"
              value={protocolForm.bodyPart}
              onChange={e => setProtocolForm({ ...protocolForm, bodyPart: e.target.value })}
              placeholder="FACE"
              style={{ fontSize: 12, fontWeight: 800, height: 36, color: '#0369A1' }}
            />
          </div>

          {/* 7. Actual Price */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
              Actual Price (₹)
            </label>
            <input
              type="number"
              className="form-input"
              value={protocolForm.actualPrice}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                const disc = protocolForm.discountPercent || 0;
                const after = Math.round(val * (1 - disc / 100));
                const rate = Math.round(after / Math.max(1, protocolForm.totalSessions));
                setProtocolForm({
                  ...protocolForm,
                  actualPrice: val,
                  afterDiscountPrice: after,
                  total: after,
                  ratePerSession: rate
                });
              }}
              style={{ fontSize: 12.5, fontWeight: 900, height: 36 }}
            />
          </div>

          {/* 8. Discount % */}
          <div style={{ maxWidth: 95 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', display: 'block', marginBottom: 4 }}>
              Discount %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              className="form-input"
              value={protocolForm.discountPercent}
              onChange={e => {
                const disc = parseFloat(e.target.value) || 0;
                const after = Math.round(protocolForm.actualPrice * (1 - disc / 100));
                const rate = Math.round(after / Math.max(1, protocolForm.totalSessions));
                setProtocolForm({
                  ...protocolForm,
                  discountPercent: disc,
                  afterDiscountPrice: after,
                  total: after,
                  ratePerSession: rate
                });
              }}
              style={{ fontSize: 12.5, fontWeight: 900, textAlign: 'center', height: 36, color: '#DC2626' }}
            />
          </div>

          {/* 9. After-Discount Amount */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', display: 'block', marginBottom: 4 }}>
              After Discount
            </label>
            <div style={{ height: 36, display: 'flex', alignItems: 'center', fontWeight: 900, color: '#0369A1', fontSize: 13, background: '#F0F9FF', padding: '0 10px', borderRadius: 6, border: '1.5px solid #BAE6FD' }}>
              ₹{protocolForm.afterDiscountPrice?.toLocaleString('en-IN') || 0}
            </div>
          </div>

          {/* 10. Total */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#059669', display: 'block', marginBottom: 4 }}>
              Total (₹)
            </label>
            <div style={{ height: 36, display: 'flex', alignItems: 'center', fontWeight: 900, color: '#059669', fontSize: 13.5, background: '#ECFDF5', padding: '0 10px', borderRadius: 6, border: '1.5px solid #A7F3D0' }}>
              ₹{protocolForm.total?.toLocaleString('en-IN') || 0}
            </div>
          </div>
        </div>

        {/* Pre & Post Procedure Clinical Instructions */}
        <div style={{ marginTop: 12, background: '#FFFFFF', padding: '12px 14px', borderRadius: 8, border: '1px solid #CBD5E1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <Sparkles size={14} color="#0284C7" />
              Note (Pre &amp; Post Procedure Clinical Instructions)
            </label>
            <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Direct writable</span>
          </div>
          <textarea
            className="form-input"
            rows={2}
            value={protocolForm.note || ''}
            onChange={e => setProtocolForm({ ...protocolForm, note: e.target.value })}
            placeholder="Fitzpatrick Type II. Pre-cooling applied. Patient advised strict sun protection SPF 50+ & no waxing/threading."
            style={{ fontSize: 12, lineHeight: 1.45, borderRadius: 6, resize: 'vertical', minHeight: 48 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>Quick Insert:</span>
            {[
              'Fitzpatrick Type II',
              'Pre-cooling applied',
              'SPF 50+ Sun Protection',
              'No waxing/threading 2wks',
              'Post-cooling Aloe Vera'
            ].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const currentNote = protocolForm.note || '';
                  if (!currentNote.includes(tag)) {
                    setProtocolForm({
                      ...protocolForm,
                      note: currentNote ? `${currentNote.trim()} ${tag}.` : `${tag}.`
                    });
                  }
                }}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Live Auto-Generated Schedule Flowchart Ribbon */}
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
          borderRadius: 8,
          border: '1px solid #BAE6FD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369A1', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#0C4A6E' }}>
              <Clock size={15} color="#0284C7" />
              <span>Live Recalculated Schedule:</span>
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0369A1', background: '#FFFFFF', padding: '3px 8px', borderRadius: 5, border: '1px solid #BAE6FD' }}>
              Interval: {protocolForm.intervalDays} Days
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {liveCalculatedFutureDates.map((dateStr, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {i > 0 && <span style={{ color: '#0284C7', fontWeight: 900 }}>→</span>}
                  <span style={{
                    background: i === 0 ? '#DCFCE7' : '#FFFFFF',
                    color: i === 0 ? '#15803D' : '#0F172A',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    padding: '3px 9px',
                    borderRadius: 5,
                    border: i === 0 ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                    fontSize: 11.5
                  }}>
                    Session {i + 1}: {dateStr}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: '#0284C7', color: '#FFFFFF', fontSize: 11, fontWeight: 800, padding: '4px 9px' }}>
              Rate: ₹{Math.round((protocolForm.afterDiscountPrice || 9000) / Math.max(1, protocolForm.totalSessions))} / session
            </span>
            <button
              type="button"
              onClick={handleApplyAutoGeneratedSchedule}
              className="btn btn-sm"
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 900,
                fontSize: 12,
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 6,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} /> ✓ Done — Auto Upgrade Schedule
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LEVEL 2: SESSION EXECUTION (Unlocked when schedule is confirmed) */}
      {/* ============================================================ */}
      {showLevel2 && (
        <div id="level-2-execution-section" style={{ padding: '18px 20px', background: '#FFFFFF' }}>
          {/* Header & View Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Level 2: Session Execution &amp; Laser Machine Settings ({sessionData.procedures.length})
              </h3>
              <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 900, fontSize: 11, border: '1px solid #86EFAC' }}>
                All 22 Fields Directly Writable
              </span>
              <button
                type="button"
                onClick={() => setShowLevel2(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11.5, color: '#64748B', fontWeight: 700, padding: '3px 9px', border: '1px solid #CBD5E1', borderRadius: 6 }}
                title="Collapse Level 2 to edit Level 1 configuration"
              >
                ▲ Collapse Level 2 / Edit Protocol
              </button>
            </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  border: 'none',
                  background: viewMode === 'cards' ? '#0369A1' : 'transparent',
                  color: viewMode === 'cards' ? '#FFFFFF' : '#475569',
                  fontSize: 11.5,
                  fontWeight: 800,
                  padding: '5px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <LayoutGrid size={13} /> Full Session Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  border: 'none',
                  background: viewMode === 'table' ? '#0369A1' : 'transparent',
                  color: viewMode === 'table' ? '#FFFFFF' : '#475569',
                  fontSize: 11.5,
                  fontWeight: 800,
                  padding: '5px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <List size={13} /> 22-Col Spreadsheet
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: FULL SESSION CARDS */}
        {/* ============================================================ */}
        {viewMode === 'cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sessionData.procedures.map((session, idx) => {
              const isDone = session.status === 'Done';
              const isConfirmed = session.status === 'Confirmed';
              const isDelayed = session.status === 'Delayed';
              const isCancelled = session.status === 'Cancelled';

              const cardBorder = isDone ? '#86EFAC' : isConfirmed ? '#7DD3FC' : isDelayed ? '#FDE047' : isCancelled ? '#FCA5A5' : '#CBD5E1';
              const headerBg = isDone ? 'linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%)' :
                               isConfirmed ? 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)' :
                               isDelayed ? 'linear-gradient(180deg, #FEFCE8 0%, #FEF9C3 100%)' :
                               isCancelled ? 'linear-gradient(180deg, #FEF2F2 0%, #FEE2E2 100%)' :
                               'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)';

              const isSession2 = session.sessionNumber === 2 || idx === 1;

              return (
                <div
                  key={session.id || idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 10,
                    border: `1.5px solid ${cardBorder}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '10px 16px',
                    background: headerBg,
                    borderBottom: `1.5px solid ${cardBorder}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    {/* Left: Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        background: isDone ? '#15803D' : isConfirmed ? '#0284C7' : isDelayed ? '#B45309' : isCancelled ? '#B91C1C' : '#0369A1',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: 12.5,
                        padding: '3px 10px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}>
                        <Zap size={13} />
                        SESSION {session.sessionsCount || `${idx + 1}/${sessionData.procedures.length}`}
                      </span>

                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                        {session.procedureName || protocolForm.procedureName}
                      </span>
                      <span style={{ color: '#94A3B8' }}>•</span>
                      <span style={{ fontWeight: 800, fontSize: 12, color: '#0369A1' }}>
                        {session.bodyPart || protocolForm.bodyPart}
                      </span>
                      <span style={{ color: '#94A3B8' }}>•</span>
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        By: <strong style={{ color: '#334155' }}>{session.therapist || protocolForm.therapist}</strong>
                      </span>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      {/* Done Indicator */}
                      {isDone && (
                        <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 900, fontSize: 11, padding: '4px 10px', border: '1px solid #86EFAC' }}>
                          ✓ Done (Exec: {session.performanceDate || '25/03/2026'})
                        </span>
                      )}

                      {/* Cancelled Indicator */}
                      {isCancelled && (
                        <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 900, fontSize: 11, padding: '4px 10px', border: '1px solid #FCA5A5' }}>
                          ✕ Cancelled: {session.remark || 'NOT TACKEN - Not avelibal'}
                        </span>
                      )}

                      {/* Mark Done Button */}
                      {!isDone && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleMarkSessionDone(session.id)}
                          className="btn btn-sm"
                          style={{
                            background: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 6,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Check size={13} /> ✓ Done
                        </button>
                      )}

                      {/* Delay +12d Action Button */}
                      {!isDone && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleExecuteDelay12Days(session.id, 12, 'DALY BY 12 DAY AUTO UPDATE')}
                          className="btn btn-sm"
                          style={{
                            background: '#D97706',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 900,
                            padding: '4px 12px',
                            borderRadius: 6,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 1px 5px rgba(217, 119, 6, 0.35)'
                          }}
                          title="Delay +12d: Shifts this session date by 12 days and automatically shifts all downstream scheduled dates!"
                        >
                          <Clock size={13} />
                          {isSession2 ? '⏱ Delay +12d (Session 2 Auto-Shift)' : '⏱ Delay +12d'}
                        </button>
                      )}

                      {/* Cancel Action Button */}
                      {!isCancelled && !isDone && (
                        <button
                          type="button"
                          onClick={() => setCancelModalState({
                            isOpen: true,
                            procedureId: session.id,
                            reason: 'NOT TACKEN - Not avelibal',
                            customNote: session.remark || 'NOT TACKEN - Not avelibal',
                            rescheduledDate: '20/04/2026',
                            rate: session.rate || 2250
                          })}
                          className="btn btn-sm"
                          style={{
                            background: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 6,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Ban size={13} /> ✕ Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body: 3 Structured Rows */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    {/* ROW 1: SCHEDULE & CLINICAL DEMOGRAPHICS */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 10,
                      background: '#F8FAFC',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0'
                    }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#0369A1', display: 'block', marginBottom: 2 }}>
                          1. F/U DATE *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={session.scheduledDate}
                          onChange={e => handleSessionFieldChange(session.id, { scheduledDate: e.target.value })}
                          style={{ height: 32, fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: isDone ? '#15803D' : '#64748B', display: 'block', marginBottom: 2 }}>
                          2. PERFORMANCE DATE
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={isDone ? '24/09/2026' : 'Pending execution'}
                          value={session.performanceDate || ''}
                          onChange={e => handleSessionFieldChange(session.id, { performanceDate: e.target.value })}
                          style={{
                            height: 32, fontSize: 12, fontWeight: 800, fontFamily: 'monospace',
                            color: isDone ? '#15803D' : '#0F172A',
                            background: isDone ? '#F0FDF4' : '#FFFFFF'
                          }}
                        />
                      </div>

                      <div style={{ minWidth: 160 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 2 }}>
                          3. PROCEDURE / TECH
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={session.procedureName}
                          onChange={e => handleSessionFieldChange(session.id, { procedureName: e.target.value })}
                          style={{ height: 32, fontSize: 12, fontWeight: 800 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 2 }}>
                          4. THERAPIST / BY
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={session.therapist || protocolForm.therapist}
                          onChange={e => handleSessionFieldChange(session.id, { therapist: e.target.value })}
                          style={{ height: 32, fontSize: 12, fontWeight: 700 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 2 }}>
                          5. BODY PART
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={session.bodyPart || protocolForm.bodyPart}
                          onChange={e => handleSessionFieldChange(session.id, { bodyPart: e.target.value })}
                          style={{ height: 32, fontSize: 12, fontWeight: 900, textAlign: 'center', color: '#0369A1' }}
                        />
                      </div>
                    </div>

                    {/* ROW 2: ⚡ LASER MACHINE SETTINGS (ALL 11 PARAMETERS) */}
                    <div style={{
                      background: '#FFFBEB',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #FDE68A'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 900, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Zap size={13} color="#D97706" />
                          ⚡ Laser Machine Settings (All 11 Parameters Directly Writable)
                        </span>
                        <span style={{ fontSize: 10, color: '#B45309', fontWeight: 700 }}>
                          Diode 808nm / Alexandrite Calibrated
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(78px, 1fr))',
                        gap: 6
                      }}>
                        {/* 1. Skin Type */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Skin Type</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.skinType ?? '2'}
                            onChange={e => handleSessionFieldChange(session.id, { skinType: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 2. Unit */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Unit</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.unit ?? '0'}
                            onChange={e => handleSessionFieldChange(session.id, { unit: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 3. Power */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Power (J)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.power ?? '10'}
                            onChange={e => handleSessionFieldChange(session.id, { power: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF', color: '#B45309' }}
                          />
                        </div>

                        {/* 4. Wavelength */}
                        <div style={{ minWidth: 85 }}>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Wavelength</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.waveLength ?? '100 hz'}
                            onChange={e => handleSessionFieldChange(session.id, { waveLength: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 5. Pulse Duration */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Pulse Dur</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.pulseDuration ?? '10'}
                            onChange={e => handleSessionFieldChange(session.id, { pulseDuration: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 6. Spot Size */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Spot Size</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.spotSize ?? '2.2'}
                            onChange={e => handleSessionFieldChange(session.id, { spotSize: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 7. Pulse Impulse */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Pulse Imp</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.pulseImpulse ?? '25'}
                            onChange={e => handleSessionFieldChange(session.id, { pulseImpulse: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 8. Thickness */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Thickness</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.thickness ?? '10'}
                            onChange={e => handleSessionFieldChange(session.id, { thickness: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 9. Density */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Density</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.density ?? '.5'}
                            onChange={e => handleSessionFieldChange(session.id, { density: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 10. Dot Density */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Dot Density</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.dotDensity ?? '10'}
                            onChange={e => handleSessionFieldChange(session.id, { dotDensity: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF' }}
                          />
                        </div>

                        {/* 11. Shots Fired */}
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 1 }}>Shots Fired</label>
                          <input
                            type="text"
                            className="form-input"
                            value={session.shotsFired ?? (isDone ? '100' : '')}
                            placeholder={isDone ? '100' : '—'}
                            onChange={e => handleSessionFieldChange(session.id, { shotsFired: e.target.value })}
                            style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 900, background: '#FFFFFF', color: isDone ? '#15803D' : '#334155' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ROW 3: STATUS, REMARKS, RATE & PAYMENT STATUS */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 10,
                      alignItems: 'flex-end',
                      background: '#F0FDF4',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #BBF7D0'
                    }}>
                      {/* STATUS Dropdown */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 2 }}>
                          STATUS *
                        </label>
                        <select
                          className="form-select"
                          value={session.status || 'Pending'}
                          onChange={e => {
                            const val = e.target.value as any;
                            if (val === 'Cancelled') {
                              setCancelModalState({
                                isOpen: true,
                                procedureId: session.id,
                                reason: 'NOT TACKEN - Not avelibal',
                                customNote: 'NOT TACKEN - Not avelibal',
                                rescheduledDate: '20/04/2026',
                                rate: session.rate || 2250
                              });
                            } else if (val === 'Done') {
                              handleMarkSessionDone(session.id);
                            } else {
                              handleSessionFieldChange(session.id, { status: val });
                            }
                          }}
                          style={{
                            height: 32, fontSize: 11.5, fontWeight: 900,
                            background: isDone ? '#DCFCE7' : isConfirmed ? '#E0F2FE' : isDelayed ? '#FEF9C3' : isCancelled ? '#FEE2E2' : '#FFFFFF',
                            color: isDone ? '#166534' : isConfirmed ? '#0369A1' : isDelayed ? '#854D0E' : isCancelled ? '#991B1B' : '#334155'
                          }}
                        >
                          <option value="Done">✓ Done</option>
                          <option value="Confirmed">✓ Confirmed</option>
                          <option value="Delayed">⏱ Delayed</option>
                          <option value="Cancelled">✕ Cancelled</option>
                          <option value="Pending">⌛ Pending</option>
                        </select>
                      </div>

                      {/* REMARK / CLINICAL REASON */}
                      <div style={{ minWidth: 240, gridColumn: 'span 2' }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 2 }}>
                          REMARKS / CLINICAL REASON
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={session.remark || ''}
                          placeholder="Clinical observation, delay notes, or cancellation reason..."
                          onChange={e => handleSessionFieldChange(session.id, { remark: e.target.value })}
                          style={{ height: 32, fontSize: 12, fontWeight: 600, background: '#FFFFFF' }}
                        />
                      </div>

                      {/* RATE (₹) */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 2 }}>
                          RATE (₹) *
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={session.rate || session.price || 2250}
                          onChange={e => {
                            const r = parseFloat(e.target.value) || 0;
                            handleSessionFieldChange(session.id, { rate: r, price: r });
                          }}
                          style={{ height: 32, fontSize: 12.5, fontWeight: 900, textAlign: 'center', color: '#0369A1', background: '#FFFFFF' }}
                        />
                      </div>

                      {/* PAYMENT STATUS */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 2 }}>
                          PAYMENT STATUS *
                        </label>
                        <select
                          className="form-select"
                          value={session.paymentStatus || (isDone ? 'Done' : 'Pending')}
                          onChange={e => handleSessionFieldChange(session.id, { paymentStatus: e.target.value as any })}
                          style={{
                            height: 32, fontSize: 11.5, fontWeight: 900,
                            background: (session.paymentStatus === 'Done' || session.paymentStatus === 'Paid') ? '#DCFCE7' :
                                        session.paymentStatus === 'Partially Paid' ? '#FEF9C3' :
                                        session.paymentStatus === 'Cancelled' ? '#FEE2E2' : '#FFFFFF',
                            color: (session.paymentStatus === 'Done' || session.paymentStatus === 'Paid') ? '#166534' :
                                   session.paymentStatus === 'Partially Paid' ? '#854D0E' :
                                   session.paymentStatus === 'Cancelled' ? '#991B1B' : '#334155'
                          }}
                        >
                          <option value="Done">Done</option>
                          <option value="Paid">Paid</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Done/pending">Done/pending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: 22-COLUMN SPREADSHEET TABLE */}
        {/* ============================================================ */}
        {viewMode === 'table' && (
          <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: 8 }}>
            <table style={{ width: '100%', minWidth: 1600, borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#0369A1', color: '#FFFFFF', textAlign: 'left', fontWeight: 800 }}>
                  <th style={{ padding: '8px 10px' }}>SESSION</th>
                  <th style={{ padding: '8px 10px' }}>F/U DATE</th>
                  <th style={{ padding: '8px 10px' }}>PERFORMANCE DATE</th>
                  <th style={{ padding: '8px 10px' }}>PROCEDURE</th>
                  <th style={{ padding: '8px 10px' }}>THERAPIST</th>
                  <th style={{ padding: '8px 10px' }}>BODY PART</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>SKIN</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>UNIT</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>POWER</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>WAVELEN</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>PULSE DUR</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>SPOT</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>IMPULSE</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>THICK</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>DENSITY</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>DOT</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>SHOTS</th>
                  <th style={{ padding: '8px 10px' }}>STATUS</th>
                  <th style={{ padding: '8px 10px', minWidth: 160 }}>REMARK</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>RATE (₹)</th>
                  <th style={{ padding: '8px 10px' }}>PAYMENT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sessionData.procedures.map((session, idx) => {
                  const isDone = session.status === 'Done';
                  return (
                    <tr key={session.id || idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 900, color: '#0369A1' }}>{session.sessionsCount || `${idx + 1}/4`}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={session.scheduledDate}
                          onChange={e => handleSessionFieldChange(session.id, { scheduledDate: e.target.value })}
                          style={{ height: 28, fontSize: 11, fontWeight: 700, width: 90 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={session.performanceDate || ''}
                          placeholder={isDone ? '24/09/2026' : '—'}
                          onChange={e => handleSessionFieldChange(session.id, { performanceDate: e.target.value })}
                          style={{ height: 28, fontSize: 11, fontWeight: 700, width: 90, color: isDone ? '#15803D' : '#0F172A' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={session.procedureName}
                          onChange={e => handleSessionFieldChange(session.id, { procedureName: e.target.value })}
                          style={{ height: 28, fontSize: 11, width: 140 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={session.therapist || protocolForm.therapist}
                          onChange={e => handleSessionFieldChange(session.id, { therapist: e.target.value })}
                          style={{ height: 28, fontSize: 11, width: 90 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={session.bodyPart || protocolForm.bodyPart}
                          onChange={e => handleSessionFieldChange(session.id, { bodyPart: e.target.value })}
                          style={{ height: 28, fontSize: 11, width: 75, textAlign: 'center', fontWeight: 800 }}
                        />
                      </td>
                      {/* Laser Machine Settings */}
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.skinType ?? '2'} onChange={e => handleSessionFieldChange(session.id, { skinType: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.unit ?? '0'} onChange={e => handleSessionFieldChange(session.id, { unit: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.power ?? '10'} onChange={e => handleSessionFieldChange(session.id, { power: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center', fontWeight: 800, color: '#B45309' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.waveLength ?? '100 hz'} onChange={e => handleSessionFieldChange(session.id, { waveLength: e.target.value })} style={{ height: 28, width: 65, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.pulseDuration ?? '10'} onChange={e => handleSessionFieldChange(session.id, { pulseDuration: e.target.value })} style={{ height: 28, width: 50, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.spotSize ?? '2.2'} onChange={e => handleSessionFieldChange(session.id, { spotSize: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.pulseImpulse ?? '25'} onChange={e => handleSessionFieldChange(session.id, { pulseImpulse: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.thickness ?? '10'} onChange={e => handleSessionFieldChange(session.id, { thickness: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.density ?? '.5'} onChange={e => handleSessionFieldChange(session.id, { density: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.dotDensity ?? '10'} onChange={e => handleSessionFieldChange(session.id, { dotDensity: e.target.value })} style={{ height: 28, width: 45, fontSize: 11, textAlign: 'center' }} /></td>
                      <td style={{ padding: '6px 4px' }}><input type="text" className="form-input" value={session.shotsFired ?? (isDone ? '100' : '')} placeholder={isDone ? '100' : '—'} onChange={e => handleSessionFieldChange(session.id, { shotsFired: e.target.value })} style={{ height: 28, width: 55, fontSize: 11, textAlign: 'center' }} /></td>

                      {/* Status */}
                      <td style={{ padding: '6px 8px' }}>
                        <select
                          className="form-select"
                          value={session.status || 'Pending'}
                          onChange={e => handleSessionFieldChange(session.id, { status: e.target.value as any })}
                          style={{ height: 28, fontSize: 11, fontWeight: 800, width: 95 }}
                        >
                          <option value="Done">✓ Done</option>
                          <option value="Confirmed">✓ Confirmed</option>
                          <option value="Delayed">⏱ Delayed</option>
                          <option value="Cancelled">✕ Cancel</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>

                      {/* Remark */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={session.remark || ''}
                          onChange={e => handleSessionFieldChange(session.id, { remark: e.target.value })}
                          style={{ height: 28, fontSize: 11, width: '100%' }}
                        />
                      </td>

                      {/* Rate */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={session.rate || session.price || 2250}
                          onChange={e => {
                            const r = parseFloat(e.target.value) || 0;
                            handleSessionFieldChange(session.id, { rate: r, price: r });
                          }}
                          style={{ height: 28, fontSize: 11.5, width: 75, textAlign: 'right', fontWeight: 800 }}
                        />
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '6px 8px' }}>
                        <select
                          className="form-select"
                          value={session.paymentStatus || 'Pending'}
                          onChange={e => handleSessionFieldChange(session.id, { paymentStatus: e.target.value as any })}
                          style={{ height: 28, fontSize: 11, fontWeight: 800, width: 95 }}
                        >
                          <option value="Done">Done</option>
                          <option value="Paid">Paid</option>
                          <option value="Partially Paid">Partially</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleExecuteDelay12Days(session.id, 12, 'DALY BY 12 DAY AUTO UPDATE')}
                            className="btn btn-sm"
                            style={{ background: '#D97706', color: '#FFFFFF', padding: '2px 6px', fontSize: 10, height: 24 }}
                            title="Delay +12d"
                          >
                            +12d
                          </button>
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => handleMarkSessionDone(session.id)}
                              className="btn btn-sm"
                              style={{ background: '#10B981', color: '#FFFFFF', padding: '2px 6px', fontSize: 10, height: 24 }}
                              title="Mark Done"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Level 2 Financial Summary Strip (Dynamic to generated sessions) */}
        {(() => {
          const collected = sessionData.procedures.filter(p => p.status === 'Done' || p.paymentStatus === 'Done').reduce((s, p) => s + (p.rate || p.price || 0), 0);
          const totalVal = protocolForm.total || 9000;
          const pending = Math.max(0, totalVal - collected);
          const collectedPct = totalVal > 0 ? Math.min(100, Math.round((collected / totalVal) * 100)) : 0;
          const executedCount = sessionData.procedures.filter(p => p.status === 'Done').length;

          return (
            <div style={{
              marginTop: 18,
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                  📊 Execution Progress: <strong style={{ color: '#059669' }}>{executedCount} / {sessionData.procedures.length} Sessions Executed</strong>
                </span>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Collected: <strong style={{ color: '#059669' }}>₹{collected.toLocaleString('en-IN')}</strong> ({collectedPct}%)
                </span>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Pending: <strong style={{ color: '#0284C7' }}>₹{pending.toLocaleString('en-IN')}</strong> ({100 - collectedPct}%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 900 }}>
                  Total Package: ₹{totalVal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalState.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1.5px solid #EF4444',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#FEE2E2',
              padding: '14px 18px',
              borderBottom: '1.5px solid #FECACA',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ban size={16} /> Cancel / Reschedule Session Record
              </div>
              <button
                type="button"
                onClick={() => setCancelModalState(s => ({ ...s, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Select Cancellation / Reschedule Reason:
                </label>
                <select
                  className="form-select"
                  value={cancelModalState.reason}
                  onChange={e => {
                    const r = e.target.value;
                    setCancelModalState(s => ({
                      ...s,
                      reason: r,
                      customNote: r
                    }));
                  }}
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  <option value="NOT TACKEN - Not avelibal">NOT TACKEN - Not avelibal (Patient unavailable)</option>
                  <option value="Not tacken further interested">Not tacken further interested (Discontinued treatment)</option>
                  <option value="20/04/2026 f/u date">Reschedule: 20/04/2026 follow-up date</option>
                  <option value="Client travelling / out of town">Client travelling / out of town</option>
                  <option value="Medical contraindication / skin irritation">Medical contraindication / skin irritation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Clinical Note / Remarks:
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={cancelModalState.customNote}
                  onChange={e => setCancelModalState(s => ({ ...s, customNote: e.target.value }))}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Session Rate (₹):
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={cancelModalState.rate}
                  onChange={e => setCancelModalState(s => ({ ...s, rate: parseFloat(e.target.value) || 0 }))}
                  style={{ fontSize: 12, fontWeight: 800 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setCancelModalState(s => ({ ...s, isOpen: false }))}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelSession}
                  className="btn btn-danger btn-sm"
                  style={{ fontWeight: 800 }}
                >
                  Confirm &amp; Record Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
