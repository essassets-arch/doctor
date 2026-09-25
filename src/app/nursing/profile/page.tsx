'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  UserCircle, ShieldCheck, KeyRound, Lock, ArrowLeft,
  CheckCircle2, Camera, Mail, Phone, Building, Save,
  AlertCircle, Sparkles, Smartphone
} from 'lucide-react';
import { useUIStore } from '@/store';

export default function NursingProfilePage() {
  const { addNotification } = useUIStore();

  // Profile Form State
  const [fullName, setFullName] = useState('Bhavna Desai');
  const [email, setEmail] = useState('bhavna.desai@medflow.clinic');
  const [phone, setPhone] = useState('+91 98251 44556');
  const [department, setDepartment] = useState('Outpatient Triage & Day Care Procedures');
  const [qualification, setQualification] = useState('B.Sc Nursing, Critical Care Certified');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification({
      type: 'success',
      message: 'Nursing staff profile updated successfully!'
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      alert('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters with numbers and symbols.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    addNotification({
      type: 'success',
      message: 'Account password changed successfully. Security token refreshed.'
    });

    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="page-container" style={{ width: '100%', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/nursing/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Nursing Dashboard
          </Link>
          <h1 className="page-title" style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
            Staff Nurse Profile & Security Center
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B' }}>
            Manage staff credentials, assigned triage cabin, 2FA identity protection, and portal access credentials.
          </p>
        </div>
      </div>

      {/* Two Column Grid: Left Identity & Security Health + Right Forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: 8.1 Staff Identity & Account Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card: Identity Badge */}
          <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', background: '#FFFFFF', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto 14px' }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%', background: '#059669', color: '#FFFFFF',
                fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)', border: '3px solid #A7F3D0'
              }}>
                BD
              </div>
              <button
                type="button"
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%', background: '#0F172A', color: '#FFFFFF',
                  border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
                title="Change Photo"
              >
                <Camera size={13} />
              </button>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{fullName}</h3>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 2 }}>
              Staff Nurse • Outpatient Triage Officer
            </div>

            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              ACTIVE ON SHIFT • MORNING
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Employee ID:</span>
                <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>NUR-204</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Nursing Reg No:</span>
                <strong style={{ color: '#0F172A' }}>GNC-78412</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Branch Location:</span>
                <strong style={{ color: '#0F172A' }}>Surat Central Main OPD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Assigned Triage:</span>
                <strong style={{ color: '#059669' }}>Cabin 1 & 2 Station</strong>
              </div>
            </div>
          </div>

          {/* Card: 8.2 Security Health Score & 2FA */}
          <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13.5, color: '#0F172A', marginBottom: 12 }}>
              <ShieldCheck size={16} color="#059669" /> Account Security Health
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Security Score</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>85% (Excellent)</span>
            </div>

            <div style={{ width: '100%', height: 7, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: '85%', height: '100%', background: '#059669' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> 2FA Multi-Factor Active (SMS OTP)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> HIPAA-Compliant Session Timeout (30 min)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Role-Based Case Lock Authority (Priority 3)
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Settings & Change Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Form: Profile Information */}
          <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', padding: 24, background: '#FFFFFF' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCircle size={17} color="#059669" /> Profile & Contact Settings
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label required">Full Staff Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Official Clinic Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label required">Contact Mobile Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Qualifications</label>
                  <input
                    type="text"
                    className="form-input"
                    value={qualification}
                    onChange={e => setQualification(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned OPD Department & Station</label>
                <input
                  type="text"
                  className="form-input"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', fontWeight: 800, fontSize: 13 }}
                >
                  <Save size={15} /> Update Profile Credentials
                </button>
              </div>
            </form>
          </div>

          {/* Form: Password Reset */}
          <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', padding: 24, background: '#FFFFFF' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={17} color="#059669" /> Password & Credential Security
            </div>

            {passwordSuccess && (
              <div style={{ padding: 12, background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', color: '#059669', fontSize: 12, marginBottom: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Password updated successfully!
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label required">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label required">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                <button
                  type="submit"
                  className="btn btn-outline"
                  style={{ borderColor: '#CBD5E1', color: '#0F172A', fontWeight: 800, fontSize: 13 }}
                >
                  <Lock size={14} color="#059669" /> Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
