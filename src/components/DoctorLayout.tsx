'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, LayoutGrid, Users, User, Clock, Wallet,
  Calendar, Settings, Maximize2, Minimize2, ChevronDown,
  LogOut, Tv, MessageSquare, Send, X, ArrowUpRight,
  ShieldCheck, AlertTriangle, Stethoscope, Sparkles
} from 'lucide-react';
import { useQueueStore, useChatStore } from '@/store';

const DOCTOR_NAV_ITEMS = [
  { label: 'DASHBOARD', href: '/doctor/dashboard', icon: LayoutGrid },
  { label: 'PATIENTS', href: '/doctor/patients/list', icon: User },
  { label: 'OPD QUEUE', href: '/doctor/queue', icon: Users, showBadge: true },
  { label: 'FOLLOW-UP CALL LIST', href: '/doctor/followup-call-list', icon: Clock },
  { label: 'BILLING', href: '/doctor/billing-view', icon: Wallet },
  { label: 'APPOINTMENTS', href: '/doctor/appointments', icon: Calendar },
  { label: 'LAB CONFIG', href: '/doctor/settings/investigation', icon: Settings },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { queue } = useQueueStore();
  const { messages, sendMessage } = useChatStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Queue waiting count for Dr. Raj Valaki (doc-1)
  const doctorQueueCount = queue.filter(q => q.doctorId === 'doc-1' && (q.status === 'WAITING' || q.status === 'CALLING')).length;

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
      sender: 'Dr. Raj Valaki',
      senderRole: 'Doctor',
      message: chatInput.trim()
    });
    setChatInput('');
  };

  return (
    <div className="app-shell">
      {/* MedFlow Doctor Clinical Top Navigation Bar (#036d92 Theme) */}
      <header className="doctor-header">
        {/* Left: Brand & Logo */}
        <Link href="/doctor/dashboard" className="doctor-logo">
          <div className="doctor-logo-icon">
            <Stethoscope size={20} strokeWidth={2.6} />
          </div>
          <div className="doctor-logo-text">
            <span className="brand">MEDFLOW</span>
            <span className="tagline">CLINICAL OS</span>
          </div>
        </Link>

        {/* Center: Main Navigation Menu */}
        <nav className="doctor-nav">
          {DOCTOR_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/doctor/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`doctor-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {item.showBadge && doctorQueueCount > 0 && (
                  <span className="doctor-nav-badge">{doctorQueueCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Fullscreen, User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, justifyContent: 'flex-end' }}>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="medflow-icon-btn"
            title="Toggle Distraction-Free Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Vertical Divider */}
          <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />

          {/* Doctor Profile Pill with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              className="doctor-user"
              onClick={() => setShowUserDropdown(v => !v)}
            >
              <div className="doctor-avatar">
                RV
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: '#0F172A' }}>Dr. Raj Valaki</span>
                <span style={{ fontSize: 10, color: '#64748B' }}>Dermatology • Room 1</span>
              </div>
              <ChevronDown size={13} color="#64748B" />
            </div>

            {/* Dropdown Menu */}
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
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>Dr. Raj Valaki, MD</div>
                  <div style={{ fontSize: 11, color: '#036d92', fontWeight: 600, marginTop: 2 }}>Senior Dermatologist & Trichologist</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Reg No: G-34891 • Surat Central Cabin 1</div>
                </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    href="/doctor/profile"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <User size={15} color="#64748B" />
                    <span>My Profile & Leave Management</span>
                  </Link>

                  <Link
                    href="/doctor/settings/investigation"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <Settings size={15} color="#64748B" />
                    <span>Lab Master Configuration</span>
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
                    <span style={{ flex: 1 }}>Waiting Screen TV</span>
                    <ArrowUpRight size={12} color="#94A3B8" />
                  </Link>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                  <div
                    onClick={() => {
                      setShowUserDropdown(false);
                      router.push('/login');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#EF4444', cursor: 'pointer'
                    }}
                    className="hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    <span>End Clinical Shift & Sign Out</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Floating Clinic Staff Chat Widget (Section 5.5) */}
      <div className="chat-dock">
        {showChat ? (
          <div className="chat-window">
            {/* Header */}
            <div style={{
              padding: '12px 16px', background: '#036d92', color: '#FFFFFF',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>Clinic Internal Chat</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC' }}>
              {messages.map(m => {
                const isMe = m.senderRole === 'Doctor';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isMe ? '#036d92' : '#FFFFFF',
                      color: isMe ? '#FFFFFF' : '#0F172A',
                      padding: '8px 12px', borderRadius: 10,
                      border: isMe ? 'none' : '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 2 }}>
                      {m.sender} ({m.senderRole}) • {m.timestamp}
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div style={{ padding: 10, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, background: '#FFFFFF' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Message reception, nursing, or pharmacy..."
                style={{ fontSize: 12, padding: '6px 10px' }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
              />
              <button
                onClick={handleSendChat}
                className="btn btn-primary btn-sm"
                style={{ background: '#036d92', borderColor: '#036d92', padding: '0 12px' }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="chat-toggle-btn"
            title="Open internal clinic chat with reception & pharmacy"
          >
            <MessageSquare size={16} />
            <span>Staff Chat</span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#10B981',
              boxShadow: '0 0 0 2px #FFFFFF'
            }} />
          </button>
        )}
      </div>
    </div>
  );
}
