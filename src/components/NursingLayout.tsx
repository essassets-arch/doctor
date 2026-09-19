'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, LayoutGrid, Users, User, Clock, Wallet,
  Calendar, Settings, Maximize2, Minimize2, ChevronDown,
  LogOut, Tv, MessageSquare, Send, X, ArrowUpRight,
  ShieldCheck, AlertTriangle, Stethoscope, Sparkles,
  FileText, PhoneCall, HeartPulse, UserCircle
} from 'lucide-react';
import { useQueueStore, useChatStore, useFollowUpStore } from '@/store';

const NURSING_NAV_ITEMS = [
  { label: 'DASHBOARD', href: '/nursing/dashboard', icon: LayoutGrid },
  { label: 'VITALS ENTRY', href: '/nursing/vitals', icon: Activity, showBadge: true },
  { label: 'LAB REPORTS', href: '/nursing/lab-reports', icon: FileText, showPendingBadge: true },
  { label: 'FOLLOW-UP CALLS', href: '/nursing/followup', icon: PhoneCall, showCallBadge: true },
  { label: 'STAFF PROFILE', href: '/nursing/profile', icon: UserCircle },
];

export default function NursingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { queue } = useQueueStore();
  const { messages, sendMessage } = useChatStore();
  const { tasks } = useFollowUpStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Triage backlog count: waiting patients who need vitals
  const vitalsPendingCount = queue.filter(q => q.status === 'WAITING' && !q.vitalsRecorded).length;
  // Follow-up calls pending
  const pendingCallsCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'NO_SHOW').length;
  // Lab reports to upload / pending
  const pendingReportsCount = queue.filter(q => q.status === 'ON_HOLD' || (q.vitalsRecorded && !q.labReady)).length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage({
      sender: 'Bhavna Desai (Staff Nurse)',
      senderRole: 'Nursing',
      message: chatInput.trim()
    });
    setChatInput('');
  };

  return (
    <div className="app-shell" style={{ background: '#F8FAFC' }}>
      {/* MedFlow Nursing Triage Top Navigation Bar (#059669 Emerald Theme) */}
      <header className="nursing-header">
        {/* Left: Brand & Logo */}
        <Link href="/nursing/dashboard" className="nursing-logo">
          <div className="nursing-logo-icon">
            <HeartPulse size={20} strokeWidth={2.6} />
          </div>
          <div className="nursing-logo-text">
            <span className="brand">MEDFLOW</span>
            <span className="tagline">NURSING & TRIAGE OS</span>
          </div>
        </Link>

        {/* Center: Main Navigation Menu */}
        <nav className="nursing-nav">
          {NURSING_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/nursing/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nursing-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {item.showBadge && vitalsPendingCount > 0 && (
                  <span className="nursing-nav-badge">{vitalsPendingCount}</span>
                )}
                {item.showCallBadge && pendingCallsCount > 0 && (
                  <span className="nursing-nav-badge" style={{ background: '#F59E0B' }}>{pendingCallsCount}</span>
                )}
                {item.showPendingBadge && pendingReportsCount > 0 && (
                  <span className="nursing-nav-badge" style={{ background: '#059669' }}>{pendingReportsCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Fullscreen, Divider & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 260, justifyContent: 'flex-end' }}>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="medflow-icon-btn"
            title="Toggle Distraction-Free Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Vertical Divider */}
          <div className="medflow-divider" />

          {/* Nursing User Profile Pill */}
          <div style={{ position: 'relative' }}>
            <div
              className="medflow-user"
              onClick={() => setShowUserDropdown(v => !v)}
            >
              <div className="nursing-avatar">
                BD
              </div>
              <div className="user-info">
                <span className="user-name">Bhavna Desai</span>
                <span className="user-email" style={{ color: '#059669', fontWeight: 600 }}>Staff Nurse • Triage</span>
              </div>
              <ChevronDown size={14} color="#64748B" style={{ marginLeft: 2 }} />
            </div>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 250, background: '#FFFFFF',
                  border: '1px solid #E2E8F0', borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.14)',
                  zIndex: 200, overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>Bhavna Desai, B.Sc Nursing</div>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>Outpatient Triage Officer</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Emp ID: NUR-204 • Surat Central OPD</div>
                </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    href="/nursing/profile"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <UserCircle size={15} color="#059669" />
                    <span>My Profile & Credentials</span>
                  </Link>

                  <Link
                    href="/nursing/followup"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <PhoneCall size={15} color="#F59E0B" />
                    <span>Pending Follow-Up Roster</span>
                  </Link>

                  <Link
                    href="/waiting-screen"
                    target="_blank"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <Tv size={15} color="#64748B" />
                    <span style={{ flex: 1 }}>Waiting Room TV Display</span>
                    <ArrowUpRight size={12} color="#94A3B8" />
                  </Link>
                </div>

                <div style={{ padding: '6px', borderTop: '1px solid #F1F5F9' }}>
                  <Link
                    href="/login"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12,
                      fontWeight: 600, color: '#DC2626', textDecoration: 'none'
                    }}
                    className="hover:bg-red-50"
                  >
                    <LogOut size={14} color="#DC2626" />
                    <span>Clock Out & End Nursing Shift</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content" style={{ background: '#F8FAFC' }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Floating Clinic Chat Widget (Nursing Role, Emerald Accent) */}
      <div className="chat-dock">
        {showChat && (
          <div className="chat-window" style={{ borderColor: 'rgba(5, 150, 105, 0.3)' }}>
            <div style={{
              padding: '12px 16px', background: '#059669', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>Clinic Internal Chat</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: msg.senderRole === 'Nursing' ? '#ecfdf5' : '#F8FAFC',
                    border: msg.senderRole === 'Nursing' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                    alignSelf: msg.senderRole === 'Nursing' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: msg.senderRole === 'Nursing' ? '#059669' : '#0F172A' }}>
                      {msg.sender}
                    </span>
                    <span style={{ fontSize: 9, color: '#94A3B8' }}>{msg.timestamp}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>{msg.message}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 10, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: 12, padding: '6px 10px' }}
                placeholder="Message doctor / front desk..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              />
              <button
                onClick={handleSendChat}
                className="btn btn-primary btn-sm"
                style={{ background: '#059669', borderColor: '#059669', padding: '0 12px' }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChat(v => !v)}
          className="chat-toggle-btn"
          style={{ background: '#059669', boxShadow: '0 4px 18px rgba(5, 150, 105, 0.35)' }}
        >
          <MessageSquare size={16} />
          <span>Staff Chat ({messages.length})</span>
        </button>
      </div>
    </div>
  );
}
