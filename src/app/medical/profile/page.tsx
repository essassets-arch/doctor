'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  User, Shield, Key, Lock, CheckCircle2, AlertTriangle,
  Building, Phone, Mail, Award, Clock, Smartphone,
  FileCheck, ShieldCheck, RefreshCw, Save
} from 'lucide-react';
import { useUIStore } from '@/store';

export default function MedicalProfilePage() {
  const { addNotification } = useUIStore();

  // Profile Form state
  const [profile, setProfile] = useState({
    name: 'Suresh Shah',
    title: 'Senior Outpatient Pharmacist / Dispensary Officer',
    licenseNumber: 'PHARM-GUJ-88219',
    council: 'Gujarat Pharmacy Council (GPC)',
    department: 'Main OPD Dispensary & Formulary Store',
    hospital: 'MedFlow Central Hospital, Branch 01',
    email: 'suresh.shah@medflow.health',
    phone: '+91 98251 44810',
    shift: '08:00 AM – 04:00 PM (Morning OPD)',
    twoFactorEnabled: true,
    digitalSignatureActive: true
  });

  // Password state
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

  // Dispensing Preferences
  const [preferences, setPreferences] = useState({
    autoFefo: true,
    gstAutoCalculate: true,
    allergyVoiceAlert: true,
    printTaxInvoiceAuto: true
  });

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.newPass) {
      addNotification({ type: 'danger', message: 'Please provide current and new password.' });
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      addNotification({ type: 'danger', message: 'New password and confirmation do not match.' });
      return;
    }
    addNotification({ type: 'success', message: 'Pharmacist authentication password updated securely.' });
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  const handleSavePreferences = () => {
    addNotification({ type: 'success', message: 'Dispensing & POS cashiering preferences saved.' });
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
            Staff Identity & Credentialing
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• GPC Registered Pharmacist</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={26} color="#059669" /> Dispensary Officer Profile & Security
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Registered pharmaceutical license credentials, digital signature status, 2FA security, and POS preferences.
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 24, marginBottom: 28 }}>
        
        {/* Left Column: Official License & Identity Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Identity Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            
            {/* Emerald Gradient Banner */}
            <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', padding: '24px 24px 18px', color: '#ffffff', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  SS
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{profile.name}</h2>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: 2 }}>{profile.title}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                    <ShieldCheck size={14} /> Council License: {profile.licenseNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Fields Details */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.88rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Licensing Board</label>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{profile.council}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dispensary Location</label>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{profile.department}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Official Email</label>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{profile.email}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Direct Intercom / Phone</label>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{profile.phone}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Shift Roster</label>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{profile.shift}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Hospital Facility</label>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{profile.hospital}</div>
                </div>
              </div>

              {/* Status Pills */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', padding: '6px 12px', borderRadius: 6, border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  <CheckCircle2 size={15} /> GPC License Verified & Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', padding: '6px 12px', borderRadius: 6, border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                  <FileCheck size={15} /> Digital Invoice Signing Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', padding: '6px 12px', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                  <Smartphone size={15} /> 2-Factor Auth (2FA) Active
                </div>
              </div>
            </div>

          </div>

          {/* Dispensary & POS Operating Preferences */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="#059669" /> Dispensary System & Cashiering Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>First-Expired, First-Out (FEFO) Auto-Allocation</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Automatically prioritize earliest expiring batch during dispensing</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoFefo}
                  onChange={(e) => setPreferences(p => ({ ...p, autoFefo: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#059669', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Standard 5% GST Tax Calculation</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Calculate pharmaceutical GST automatically on outpatient invoices</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.gstAutoCalculate}
                  onChange={(e) => setPreferences(p => ({ ...p, gstAutoCalculate: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#059669', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>High-Risk Drug Allergy Safety Guard</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Flash red warning banner if patient has documented drug allergies</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.allergyVoiceAlert}
                  onChange={(e) => setPreferences(p => ({ ...p, allergyVoiceAlert: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#059669', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Auto-Prompt Printable Tax Invoice</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Display official receipt dialog immediately after cash/UPI collection</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.printTaxInvoiceAuto}
                  onChange={(e) => setPreferences(p => ({ ...p, printTaxInvoiceAuto: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#059669', cursor: 'pointer' }}
                />
              </label>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                onClick={handleSavePreferences}
                style={{
                  padding: '9px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Save size={15} /> Save Operating Preferences
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Security & Authentication */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Two-Factor Authentication Box */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} color="#059669" /> Two-Factor Authentication (2FA)
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 3 }}>
                  Hardware token & authenticator app protection for drug dispensing
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                ACTIVE
              </span>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: '0.82rem', color: '#475569', marginBottom: 14 }}>
              Protected with <strong>Google Authenticator / Aegis OTP</strong>. Required for high-risk narcotic drug dispensation, stock write-offs, and ledger refunds.
            </div>

            <button
              onClick={() => addNotification({ type: 'info', message: '2FA backup codes re-sent to registered email.' })}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Generate New Backup Codes
            </button>
          </div>

          {/* Password Management */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="#059669" /> Change Clinical Login Password
            </h3>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwords.current}
                  onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  New Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Active Session Audit */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Active Terminal Session
            </h3>

            <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>Terminal:</strong> Dispensary Counter 01 (POS Workstation)</div>
              <div><strong>IP Address:</strong> 192.168.10.45 (Local Secure Subnet)</div>
              <div><strong>Session Started:</strong> 19/09/2026, 08:02 AM</div>
              <div><strong>Authentication Level:</strong> Level 3 Clinical POS Dispenser</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
