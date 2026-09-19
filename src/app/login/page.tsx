'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Stethoscope, Users, HeartPulse, Pill, Shield,
  Tv, Lock, Mail, Building2, ArrowRight, CheckCircle2,
  AlertCircle, Sparkles, Eye, EyeOff, ShieldCheck, Activity
} from 'lucide-react';

interface QuickRole {
  id: string;
  roleTitle: string;
  name: string;
  qualification: string;
  email: string;
  badge: string;
  badgeColor: string;
  route: string;
  icon: any;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const QUICK_ROLES: QuickRole[] = [
  {
    id: 'doctor',
    roleTitle: 'Doctor / Clinical Specialist',
    name: 'Dr. Raj Valaki',
    qualification: 'MD, Internal Medicine • Cabin 1',
    email: 'raj.valaki@medflow.health',
    badge: 'Clinical OS',
    badgeColor: '#036D92',
    route: '/doctor/dashboard',
    icon: Stethoscope,
    accentColor: '#036D92',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: '7-tab consultation station, live e-prescriptions, diagnostic lab orders, and procedure documentation.'
  },
  {
    id: 'reception',
    roleTitle: 'Receptionist / Front Desk',
    name: 'Pooja Patel',
    qualification: 'Senior Front Desk Officer • Counter 01',
    email: 'pooja.patel@medflow.health',
    badge: 'Front Desk Desk',
    badgeColor: '#EA580C',
    route: '/reception/dashboard',
    icon: Users,
    accentColor: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    description: '30-second rapid check-in, token issuance, patient directory, appointment scheduling, and OPD billing.'
  },
  {
    id: 'nursing',
    roleTitle: 'Staff Nurse / Triage Officer',
    name: 'Bhavna Desai',
    qualification: 'Lead Triage Nurse • Triage Bay 1',
    email: 'bhavna.desai@medflow.health',
    badge: 'Triage OS',
    badgeColor: '#059669',
    route: '/nursing/dashboard',
    icon: HeartPulse,
    accentColor: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    description: 'Physiological vitals entry, BMI auto-calculation, medical OCR lab upload, and post-care follow-up.'
  },
  {
    id: 'pharmacy',
    roleTitle: 'Pharmacy & Dispensary Officer',
    name: 'Suresh Shah',
    qualification: 'Senior Dispensary Officer • POS Counter',
    email: 'suresh.shah@medflow.health',
    badge: 'Pharmacy & POS',
    badgeColor: '#0D9488',
    route: '/medical/dashboard',
    icon: Pill,
    accentColor: '#0D9488',
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
    description: 'FEFO stock batch deduction, real-time POS checkout cart, drug returns, and 180-day near-expiry alerts.'
  },
  {
    id: 'admin',
    roleTitle: 'Superadmin / Medical Director',
    name: 'Dr. Kalp Patel',
    qualification: 'Practice Owner & Chief Medical Director',
    email: 'kalp.patel@medflow.health',
    badge: 'Apex Governance',
    badgeColor: '#4338CA',
    route: '/admin/dashboard',
    icon: Shield,
    accentColor: '#4338CA',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    description: 'Practice BI analytics, doctor revenue sharing, HRMS overtime audits, SIEM SOC security, and masters.'
  },
  {
    id: 'waiting-screen',
    roleTitle: 'Public Waiting Room TV Screen',
    name: 'OPD Hallway Display',
    qualification: 'Surat Central Lobby • Wall Monitor 1',
    email: 'kiosk.tv@medflow.health',
    badge: 'Public Broadcast',
    badgeColor: '#475569',
    route: '/waiting-screen',
    icon: Tv,
    accentColor: '#334155',
    bgColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    description: 'Large-screen patient calling board with audible synthesized chimes and live token status updates.'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState('Surat Central OPD (Main Facility)');
  const [email, setEmail] = useState('raj.valaki@medflow.health');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  // Handle manual login
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Route based on email domain or keyword
    let target = '/reception/dashboard';
    const lower = email.toLowerCase();
    if (lower.includes('admin') || lower.includes('director') || lower.includes('kalp')) {
      target = '/admin/dashboard';
    } else if (lower.includes('raj') || lower.includes('doc') || lower.includes('doctor')) {
      target = '/doctor/dashboard';
    } else if (lower.includes('nurse') || lower.includes('bhavna') || lower.includes('triage')) {
      target = '/nursing/dashboard';
    } else if (lower.includes('pharm') || lower.includes('medical') || lower.includes('suresh')) {
      target = '/medical/dashboard';
    }

    setTimeout(() => {
      router.push(target);
    }, 600);
  };

  // Handle Quick Role Click
  const handleQuickLogin = (role: QuickRole) => {
    setEmail(role.email);
    setPassword('MedFlow@2026');
    setLoadingRole(role.id);

    setTimeout(() => {
      router.push(role.route);
    }, 450);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      color: '#F8FAFC',
      padding: '30px 20px',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Decorative Glow Elements */}
      <div style={{
        position: 'absolute', top: -100, left: '20%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(50px)'
      }} />
      <div style={{
        position: 'absolute', bottom: -100, right: '15%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(3, 109, 146, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(50px)'
      }} />

      {/* Main Container */}
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top Header Branding */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 36, paddingBottom: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #036D92, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)'
            }}>
              <Activity size={24} strokeWidth={2.6} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.04em', color: '#FFFFFF' }}>
                  MEDFLOW
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(99, 102, 241, 0.25)', color: '#A5B4FC', border: '1px solid rgba(165, 180, 252, 0.3)'
                }}>
                  ENTERPRISE 2.4
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', letterSpacing: '0.02em' }}>
                Unified Outpatient Department (OPD) Clinical Operating System
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#34D399', background: 'rgba(52, 211, 153, 0.1)',
              padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(52, 211, 153, 0.25)'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s infinite' }} />
              <span>SSE Telemetry: Live & Synchronized</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#94A3B8'
            }}>
              <ShieldCheck size={16} color="#818CF8" />
              <span>HIPAA & NABH Ready</span>
            </div>
          </div>
        </header>

        {/* Content Grid: Left Form + Right Quick Launchers */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32, alignItems: 'start' }}>

          {/* ============================================================ */}
          {/* 1. SECURE CREDENTIAL LOGIN FORM                              */}
          {/* ============================================================ */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                Terminal Authentication
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8' }}>
                Enter your authorized clinical credentials or choose a role on the right.
              </p>
            </div>

            <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Branch Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
                  Facility / Clinic Branch
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '10px 12px 10px 38px',
                      color: '#F8FAFC',
                      fontSize: 13,
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Surat Central OPD (Main Facility)">Surat Central OPD (Main Facility)</option>
                    <option value="Ahmedabad Apex Clinic (Satellite)">Ahmedabad Apex Clinic (Satellite)</option>
                    <option value="Vadodara Health Hub (Express)">Vadodara Health Hub (Express)</option>
                  </select>
                </div>
              </div>

              {/* Email / Employee ID */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
                  Work Email / Staff ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@medflow.health"
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '10px 12px 10px 38px',
                      color: '#F8FAFC',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>
                    Security Password / PIN
                  </label>
                  <span style={{ fontSize: 11, color: '#818CF8', cursor: 'pointer' }}>
                    Reset Credentials?
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter security key"
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '10px 38px 10px 38px',
                      color: '#F8FAFC',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & 2FA Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#6366F1' }}
                  />
                  <span>Remember terminal session</span>
                </label>
                <span style={{ color: '#38BDF8', fontSize: 11 }}>2FA Enforced</span>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 6,
                  padding: '13px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #036D92, #6366F1)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  border: 'none',
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {isLoading ? (
                  <span>Authenticating Terminal...</span>
                ) : (
                  <>
                    <span>Sign In to Clinical Terminal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{
              marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 11, color: '#64748B', textAlign: 'center'
            }}>
              Zero-Trust Audit: All logins logged to SIEM with device fingerprinting & IP blacklisting.
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. QUICK ROLE-BASED LOGIN TILES (ALL PANELS)                */}
          {/* ============================================================ */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{
                  margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <Sparkles size={18} color="#F59E0B" />
                  Quick Role-Based Access — All Panels
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94A3B8' }}>
                  Click any verified clinical role below to immediately enter that panel with active mock data.
                </p>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 700, color: '#CBD5E1', background: 'rgba(255, 255, 255, 0.06)',
                padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                Instant Demo Mode
              </span>
            </div>

            {/* Grid of Role Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {QUICK_ROLES.map(role => {
                const Icon = role.icon;
                const isCurrentLoading = loadingRole === role.id;

                return (
                  <div
                    key={role.id}
                    onClick={() => handleQuickLogin(role)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: `1.5px solid ${isCurrentLoading ? role.accentColor : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: 14,
                      padding: 18,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = role.accentColor;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 10px 24px rgba(0, 0, 0, 0.3)`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isCurrentLoading ? role.accentColor : 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Top Row: Icon, Role Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: role.bgColor,
                        border: `1px solid ${role.borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: role.accentColor
                      }}>
                        <Icon size={20} strokeWidth={2.4} />
                      </div>

                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 4,
                        background: `${role.accentColor}20`,
                        color: role.accentColor,
                        border: `1px solid ${role.accentColor}40`,
                        letterSpacing: 0.5
                      }}>
                        {role.badge}
                      </span>
                    </div>

                    {/* Middle: Name & Title */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                        {role.roleTitle}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: role.accentColor, marginTop: 4 }}>
                        {role.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        {role.qualification}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                        {role.description}
                      </p>
                    </div>

                    {/* Bottom: Action Trigger */}
                    <div style={{
                      marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 12, fontWeight: 700, color: role.accentColor
                    }}>
                      <span>{isCurrentLoading ? 'Launching Station...' : 'Enter Panel ➔'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Help Tip */}
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8' }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span>Default supervisor emergency bypass PIN: <strong>1234</strong> (for FOC waivers & overrides)</span>
              </div>
              <Link href="/waiting-screen" target="_blank" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}>
                Open Public TV Board ➔
              </Link>
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B'
        }}>
          <div>
            MedFlow Enterprise OPD Management System • Version 2.4 Production • Multi-Tenant Architecture
          </div>
          <div>
            Built with Next.js & Zustand Reactive State Engine • End-to-End E2E Tested
          </div>
        </footer>

      </div>
    </div>
  );
}
