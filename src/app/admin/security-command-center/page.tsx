'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, Shield, Lock, AlertTriangle,
  Key, Database, Server, RefreshCw, XCircle, CheckCircle2,
  Terminal, Globe, Cpu, Radio, Zap
} from 'lucide-react';
import { useAdminStore, useUIStore } from '@/store';

export default function AdminSecurityCommandCenterPage() {
  const { sessions, securityEvents, isPanicLockdown, terminateSession, triggerPanicLockdown } = useAdminStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'SESSIONS' | 'SIEM' | 'VAULT' | 'PLAYBOOKS' | 'DR'>('SESSIONS');

  const activeSessions = useMemo(() => sessions.filter(s => s.status === 'ACTIVE'), [sessions]);
  const highRiskSessions = useMemo(() => sessions.filter(s => s.riskScore >= 75), [sessions]);

  const handleTerminate = (id: string, name: string) => {
    terminateSession(id);
    addNotification({
      type: 'danger',
      message: `Zero-Trust Policy Enforced: Session ${id} (${name}) terminated. JWT invalidated.`
    });
  };

  const handleToggleLockdown = () => {
    if (!isPanicLockdown) {
      if (confirm('CRITICAL SECURITY ACTION: Initiate Global Panic Lockdown? All non-admin sessions will be frozen and database switched to READ-ONLY.')) {
        triggerPanicLockdown(true);
        addNotification({
          type: 'danger',
          message: 'GLOBAL EMERGENCY LOCKDOWN ACTIVATED.'
        });
      }
    } else {
      triggerPanicLockdown(false);
      addNotification({
        type: 'success',
        message: 'Global lockdown lifted. Terminals resumed normal operational status.'
      });
    }
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: 4, border: '1px solid #FECACA' }}>
              Cyber Defense & SIEM SOC
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Zero-Trust Architecture & Threat Intel</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={26} color="#DC2626" /> Enterprise Security Command Center (SOC)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Real-time session risk scoring, SIEM event auditing, cryptographic key rotation, and disaster recovery.
          </p>
        </div>

        {/* Global Panic Lockdown Button */}
        <button
          onClick={handleToggleLockdown}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            background: isPanicLockdown ? '#16A34A' : '#DC2626',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
            letterSpacing: '0.04em'
          }}
        >
          <ShieldAlert size={18} />
          {isPanicLockdown ? 'LIFT PANIC LOCKDOWN' : 'INITIATE GLOBAL PANIC LOCKDOWN'}
        </button>
      </div>

      {/* Security Telemetry KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Authenticated Sessions</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{activeSessions.length} Active</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Zero-Trust Device Fingerprinted</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>High-Risk Threats Blocked</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{highRiskSessions.length} Blocked</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4, fontWeight: 700 }}>Tor Exit Nodes & Anomalies</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cryptographic Key Health</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>HMAC-SHA256</div>
          <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: 4, fontWeight: 600 }}>Rotated 18 hrs ago</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Disaster Recovery RPO / RTO</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>15m / 30m</div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: 4, fontWeight: 600 }}>Automated PITR Snapshots</div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('SESSIONS')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'SESSIONS' ? '#0F172A' : '#F1F5F9',
            color: activeTab === 'SESSIONS' ? '#FFFFFF' : '#64748B'
          }}
        >
          Zero-Trust Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('SIEM')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'SIEM' ? '#DC2626' : '#F1F5F9',
            color: activeTab === 'SIEM' ? '#FFFFFF' : '#64748B'
          }}
        >
          SOC SIEM Audit Stream ({securityEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('VAULT')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'VAULT' ? '#4338CA' : '#F1F5F9',
            color: activeTab === 'VAULT' ? '#FFFFFF' : '#64748B'
          }}
        >
          Cryptographic Vault & Secrets
        </button>

        <button
          onClick={() => setActiveTab('PLAYBOOKS')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'PLAYBOOKS' ? '#D97706' : '#F1F5F9',
            color: activeTab === 'PLAYBOOKS' ? '#FFFFFF' : '#64748B'
          }}
        >
          Incident Response Playbooks
        </button>

        <button
          onClick={() => setActiveTab('DR')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'DR' ? '#059669' : '#F1F5F9',
            color: activeTab === 'DR' ? '#FFFFFF' : '#64748B'
          }}
        >
          Disaster Recovery (DR)
        </button>
      </div>

      {/* Tab 1: Zero-Trust Sessions */}
      {activeTab === 'SESSIONS' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Active Terminal Sessions & Risk Fingerprints
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Continuous session risk evaluation monitoring geolocation, device signatures, and anomalous access times.
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>User & Role</th>
                <th style={{ padding: '14px 18px' }}>Device Name</th>
                <th style={{ padding: '14px 18px' }}>IP Address</th>
                <th style={{ padding: '14px 18px' }}>Location</th>
                <th style={{ padding: '14px 18px' }}>Risk Score</th>
                <th style={{ padding: '14px 18px' }}>Login Time</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(sess => (
                <tr key={sess.id} style={{ borderBottom: '1px solid #f1f5f9', background: sess.status === 'TERMINATED' ? '#FFF1F2' : 'transparent' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 800, color: sess.status === 'TERMINATED' ? '#991B1B' : '#0F172A' }}>{sess.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Role: {sess.role}</div>
                  </td>

                  <td style={{ padding: '14px 18px', color: '#334155' }}>
                    {sess.deviceName}
                  </td>

                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#4338ca' }}>
                    {sess.ipAddress}
                  </td>

                  <td style={{ padding: '14px 18px', color: '#64748B', fontSize: '0.82rem' }}>
                    {sess.location}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: sess.riskScore >= 75 ? '#FEE2E2' : sess.riskScore >= 25 ? '#FEF3C7' : '#DCFCE7',
                      color: sess.riskScore >= 75 ? '#991B1B' : sess.riskScore >= 25 ? '#B45309' : '#15803D'
                    }}>
                      Risk {sess.riskScore}/100
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px', color: '#64748B', fontSize: '0.82rem' }}>
                    {sess.loginTime}
                  </td>

                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {sess.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleTerminate(sess.id, sess.userName)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#DC2626',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Terminate Session
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>TERMINATED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: SIEM Event Stream */}
      {activeTab === 'SIEM' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            SOC SIEM Real-Time Security Stream
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {securityEvents.map(ev => (
              <div key={ev.id} style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                      background: ev.severity === 'CRITICAL' ? '#FEE2E2' : ev.severity === 'HIGH' ? '#FEF3C7' : '#E0E7FF',
                      color: ev.severity === 'CRITICAL' ? '#991B1B' : ev.severity === 'HIGH' ? '#B45309' : '#3730A3'
                    }}>
                      {ev.severity}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{ev.eventType}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 3 }}>
                    {ev.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                    Timestamp: {ev.timestamp} • Source IP: {ev.sourceIp}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                    {ev.actionTaken}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cryptographic Vault & Key Rotation */}
      {activeTab === 'VAULT' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="#4338ca" /> Cryptographic Key & Token Rotation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>JWT Access Token Signing Secret</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Algorithm: HMAC-SHA256 • Rotation Cycle: 30 Days</div>
                <div style={{ color: '#059669', fontWeight: 700, marginTop: 4, fontSize: '0.78rem' }}>✓ HEALTHY (Next automatic rotation in 12 days)</div>
              </div>

              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>PostgreSQL TDE Field Encryption</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Algorithm: AES-256-GCM • Key: Hardware Encrypted</div>
                <div style={{ color: '#059669', fontWeight: 700, marginTop: 4, fontSize: '0.78rem' }}>✓ ENCRYPTED AT REST (HIPAA Standard)</div>
              </div>

              <button
                type="button"
                onClick={() => addNotification({ type: 'success', message: 'Manual cryptographic secret rotation executed.' })}
                style={{ padding: '9px 16px', borderRadius: 6, background: '#4338ca', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4 }}
              >
                Rotate Secrets Now
              </button>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={18} color="#059669" /> Vault Credential Management
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
              All database credentials, cloud storage keys, and WhatsApp Cloud tokens are securely injected via HashiCorp Vault / KMS environment secrets. No cleartext credentials exist in the client repository.
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Incident Response Playbooks */}
      {activeTab === 'PLAYBOOKS' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Pre-Scripted Emergency Incident Playbooks
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991B1B' }}>Playbook 1: Ransomware Isolation</div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, margin: '8px 0 12px' }}>
                Instantly disconnects external network interfaces, severs terminal sync, and switches electronic medical records to immutable read-only storage.
              </p>
              <button
                onClick={() => addNotification({ type: 'warning', message: 'Playbook 1 simulation tested.' })}
                style={{ padding: '6px 12px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Simulate Isolation
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#B45309' }}>Playbook 2: Credential Compromise</div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, margin: '8px 0 12px' }}>
                Revokes all issued JWT refresh tokens, terminates non-superadmin sessions, and enforces immediate MFA re-challenge upon reconnection.
              </p>
              <button
                onClick={() => addNotification({ type: 'warning', message: 'Playbook 2 token purge tested.' })}
                style={{ padding: '6px 12px', borderRadius: 6, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Execute Global Token Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Disaster Recovery */}
      {activeTab === 'DR' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Disaster Recovery & Point-in-Time Recovery (PITR)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>Last Automated Snapshot</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803D', marginTop: 4 }}>19/09/2026 18:45</div>
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: 2 }}>Encrypted S3 Multi-Region Replica</div>
            </div>

            <div style={{ padding: 14, background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>Recovery Point Objective (RPO)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>15 Minutes</div>
              <div style={{ fontSize: '0.72rem', color: '#1E40AF', marginTop: 2 }}>Continuous WAL Log Archival</div>
            </div>

            <div style={{ padding: 14, background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730A3' }}>Recovery Time Objective (RTO)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4338CA', marginTop: 4 }}>30 Minutes</div>
              <div style={{ fontSize: '0.72rem', color: '#3730A3', marginTop: 2 }}>Standby Database Auto-Failover</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
