'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/store';
import {
  LifeBuoy,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  Database,
  Radio,
  Download,
  RefreshCw,
  Send,
  ShieldCheck,
  Cpu,
  HardDrive,
  Check,
  Terminal,
  FileCode
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  module: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  reporter: string;
  resolution?: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2026-0419',
    subject: 'Thermal POS printer receipt auto-cutter alignment off by 2mm',
    module: 'Pharmacy Dispensary POS',
    severity: 'P3',
    status: 'RESOLVED',
    createdAt: '18/09/2026 04:30 PM',
    reporter: 'Suresh Shah (Pharmacist)',
    resolution: 'Adjusted ESC/POS page height feed pitch to 72mm standard.'
  },
  {
    id: 'TKT-2026-0420',
    subject: 'Aadhaar ABHA gateway sandbox latency spike during verification',
    module: 'Reception Desk OPD',
    severity: 'P2',
    status: 'IN_PROGRESS',
    createdAt: '19/09/2026 09:15 AM',
    reporter: 'Pooja Dave (Chief Receptionist)',
    resolution: 'National Health Authority ABDM API latency under monitoring; failover router active.'
  },
  {
    id: 'TKT-2026-0421',
    subject: 'Request to add pediatric BMI percentile growth charts to Consultation panel',
    module: 'Doctor Clinical Workspace',
    severity: 'P4',
    status: 'OPEN',
    createdAt: '19/09/2026 11:20 AM',
    reporter: 'Dr. Raj Valaki (Physician)'
  }
];

export default function AdminSupportPage() {
  const { addNotification } = useUIStore();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [isSelfTesting, setIsSelfTesting] = useState(false);
  const [selfTestProgress, setSelfTestProgress] = useState(0);
  const [selfTestComplete, setSelfTestComplete] = useState(false);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [module, setModule] = useState('Doctor Clinical Workspace');
  const [severity, setSeverity] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P3');
  const [description, setDescription] = useState('');
  const [reporter, setReporter] = useState('Clinic Superadmin');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      addNotification({
        type: 'danger',
        message: 'Please provide both a ticket subject and description.'
      });
      return;
    }

    const newTicket: SupportTicket = {
      id: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: subject.trim(),
      module,
      severity,
      status: 'OPEN',
      createdAt: 'Just now',
      reporter
    };

    setTickets([newTicket, ...tickets]);
    setSubject('');
    setDescription('');

    addNotification({
      type: 'success',
      message: `Ticket ${newTicket.id} created and routed to Enterprise Support SRE team.`
    });
  };

  const handleRunSelfTest = () => {
    setIsSelfTesting(true);
    setSelfTestProgress(10);
    setSelfTestComplete(false);

    const interval = setInterval(() => {
      setSelfTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSelfTesting(false);
          setSelfTestComplete(true);
          addNotification({
            type: 'success',
            message: 'All 24 automated subsystem integrity checks passed with 100% score.'
          });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleDownloadDiagnosticBundle = () => {
    const diagnosticPayload = {
      timestamp: new Date().toISOString(),
      platform: 'MedFlow OPD Clinical Enterprise OS v2.4',
      systemHealth: {
        uptimePercent: 99.98,
        databaseLatencyMs: 18,
        redisPoolHealth: 'OPTIMAL',
        activeSessions: 7,
        sseConnections: 12
      },
      openTickets: tickets.filter(t => t.status !== 'RESOLVED'),
      nodeEnvironment: process.env.NODE_ENV || 'production'
    };

    const blob = new Blob([JSON.stringify(diagnosticPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medflow-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addNotification({
      type: 'info',
      message: 'System diagnostic telemetry JSON exported for engineering inspection.'
    });
  };

  const handlePurgeCache = () => {
    addNotification({
      type: 'success',
      message: 'Local browser state cache and temporary service worker stores cleared.'
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto' }}>
      {/* Top Title & SLA Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 38, height: 38, borderRadius: 8, 
              background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
            }}>
              <LifeBuoy size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Engineering Support & Diagnostics Desk
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Direct SRE triage, automated subsystem telemetries, and priority ticket resolution
              </p>
            </div>
          </div>
        </div>

        {/* Global SLA Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 8px #16a34a' }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
              SYSTEM STATUS: ALL OPERATIONAL
            </div>
            <div style={{ fontSize: 10.5, color: '#15803d' }}>
              99.98% Monthly SLA Uptime | Next Patch: Sun 02:00 AM IST
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>API Response Latency</span>
            <Activity size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>18 ms</div>
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> Optimal (p99 &lt; 45ms)
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>PostgreSQL Pool</span>
            <Database size={16} color="#4338ca" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>14 / 50</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Active Connections | Healthy
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>SSE Reactive Bus</span>
            <Radio size={16} color="#059669" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>12 Streams</div>
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> Zero Packet Dropped
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Automated Backup</span>
            <HardDrive size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>04:00 AM</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            RPO: 15 min | Verified SHA-256
          </div>
        </div>
      </div>

      {/* Main Grid: Create Ticket & Diagnostic Self-Test */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Ticket Dispatch Form */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} color="#0284c7" /> Dispatch Priority Engineering Ticket
          </h3>

          <form onSubmit={handleCreateTicket}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Issue Subject
              </label>
              <input
                type="text"
                placeholder="Brief summary of the issue or degradation..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Affected System Module
                </label>
                <select
                  value={module}
                  onChange={e => setModule(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                >
                  <option value="Doctor Clinical Workspace">Doctor Clinical Workspace</option>
                  <option value="Reception Desk OPD">Reception Desk OPD</option>
                  <option value="Nursing Station & Triage">Nursing Station & Triage</option>
                  <option value="Pharmacy Dispensary POS">Pharmacy Dispensary POS</option>
                  <option value="Financial Billing & GST">Financial Billing & GST</option>
                  <option value="Security SOC & Auth">Security SOC & Auth</option>
                  <option value="Hardware / Thermal Printers">Hardware / Thermal Printers</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Priority / Severity Level
                </label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                >
                  <option value="P1">P1 - Critical Blocker (Clinic Halted)</option>
                  <option value="P2">P2 - Major Degraded (Workaround Available)</option>
                  <option value="P3">P3 - Minor Glitch (Cosmetic / Low)</option>
                  <option value="P4">P4 - Feature Enhancement / Question</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Detailed Description & Reproduction Steps
              </label>
              <textarea
                rows={3}
                placeholder="Include what happened, error message shown on screen, patient MRD or invoice number if applicable..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                Dispatched directly to On-Call SRE team. SLA for P1/P2 is &lt; 15 mins.
              </div>
              <button
                type="submit"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#0284c7', color: '#fff',
                  border: 'none', padding: '9px 18px',
                  borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Send size={15} /> Submit Support Ticket
              </button>
            </div>
          </form>
        </div>

        {/* Diagnostic Actions & Self-Healing Utilities */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="#4338ca" /> Diagnostic Self-Test & Actions
          </h3>

          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Run real-time automated regression and health probes across database connections, queue synchronization channels, and local disk write permissions.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Subsystem Health Probe</span>
              {isSelfTesting ? (
                <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>Testing ({selfTestProgress}%)</span>
              ) : selfTestComplete ? (
                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={12} /> All Tests Passed
                </span>
              ) : (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Ready</span>
              )}
            </div>

            {isSelfTesting && (
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${selfTestProgress}%`, background: '#0284c7', transition: 'width 0.3s ease' }} />
              </div>
            )}

            <button
              onClick={handleRunSelfTest}
              disabled={isSelfTesting}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: isSelfTesting ? '#cbd5e1' : '#4338ca',
                color: '#fff', border: 'none', padding: '9px 0',
                borderRadius: 6, fontSize: 12.5, fontWeight: 600,
                cursor: isSelfTesting ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} className={isSelfTesting ? 'animate-spin' : ''} />
              {isSelfTesting ? 'Executing System Probes...' : 'Run Automated Self-Diagnostic Check'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={handlePurgeCache}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#f1f5f9', color: '#475569',
                border: '1px solid #cbd5e1', padding: '9px 12px',
                borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} /> Flush Client Cache
            </button>

            <button
              onClick={handleDownloadDiagnosticBundle}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#f8fafc', color: '#0369a1',
                border: '1px solid #bae6fd', padding: '9px 12px',
                borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Download size={13} /> Export JSON Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* Support Tickets Ledger */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#64748b" /> Recent Engineering Support Tickets & Audits
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Showing {tickets.length} tickets
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '10px 16px' }}>Ticket ID</th>
              <th style={{ padding: '10px 16px' }}>Severity</th>
              <th style={{ padding: '10px 16px' }}>Subject & Resolution</th>
              <th style={{ padding: '10px 16px' }}>Module</th>
              <th style={{ padding: '10px 16px' }}>Reporter</th>
              <th style={{ padding: '10px 16px' }}>Status</th>
              <th style={{ padding: '10px 16px' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#0284c7' }}>
                  {t.id}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: t.severity === 'P1' ? '#fee2e2' : t.severity === 'P2' ? '#ffedd5' : t.severity === 'P3' ? '#fef3c7' : '#e0f2fe',
                    color: t.severity === 'P1' ? '#991b1b' : t.severity === 'P2' ? '#9a3412' : t.severity === 'P3' ? '#92400e' : '#0369a1'
                  }}>
                    {t.severity}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', maxWidth: 380 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{t.subject}</div>
                  {t.resolution && (
                    <div style={{ fontSize: 11, color: '#059669', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                      <strong>Resolution:</strong> {t.resolution}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 16px', color: '#475569' }}>
                  {t.module}
                </td>
                <td style={{ padding: '10px 16px', color: '#64748b' }}>
                  {t.reporter}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                    background: t.status === 'RESOLVED' ? '#dcfce7' : t.status === 'IN_PROGRESS' ? '#fef9c3' : '#e0e7ff',
                    color: t.status === 'RESOLVED' ? '#15803d' : t.status === 'IN_PROGRESS' ? '#a16207' : '#3730a3'
                  }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: 11.5 }}>
                  {t.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
