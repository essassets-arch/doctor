'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid, UserPlus, Search, SquareCheckBig, Users,
  Calendar, Wallet, Upload, Maximize2, Minimize2, ChevronDown,
  Activity, User, LogOut, Tv, ArrowUpRight, CheckCircle2, Shield,
  MessageSquare, Send, X, Bell, Menu, RefreshCw
} from 'lucide-react';
import { useUIStore, useQueueStore, useChatStore, playChimeTone, resetAllStoresToDefault } from '@/store';

const NAV_ITEMS = [
  { label: 'DASHBOARD', href: '/reception/dashboard', icon: LayoutGrid },
  { label: 'REGISTER PATIENT', href: '/reception/register', icon: UserPlus },
  { label: 'SEARCH PATIENT', href: '/reception/search', icon: Search },
  { label: 'CHECK-IN (WALK-IN)', href: '/reception/checkin', icon: SquareCheckBig },
  { label: 'OPD QUEUE', href: '/reception/queue', icon: Users, showBadge: true },
  { label: 'BOOK APPOINTMENT', href: '/reception/appointments', icon: Calendar },
  { label: 'BILLING', href: '/reception/billing', icon: Wallet },
  { label: 'LAB UPLOAD', href: '/reception/lab-upload', icon: Upload },
];

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useUIStore();
  const { queue, lastEvent } = useQueueStore();
  const { messages, sendMessage } = useChatStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [liveToast, setLiveToast] = useState<{ message: string; caseId?: string; token?: string } | null>(null);

  const prevEventTime = useRef<number>(0);

  // SSE Event Listener for Handshake & Audio Notification
  useEffect(() => {
    if (!lastEvent || lastEvent.timestamp === prevEventTime.current) return;
    prevEventTime.current = lastEvent.timestamp;

    if (lastEvent.type === 'SESSION_ENDED') {
      // Dual-tone synthesizer audio cue (High C 1046.5Hz + A5 880Hz)
      playChimeTone('session_ended');
      setLiveToast({
        message: `🔔 ${lastEvent.patientName || 'Patient'} (${lastEvent.token || 'Token'}) completed consultation. Sent to Reception for Billing.`,
        caseId: lastEvent.caseId,
        token: lastEvent.token
      });
      const timer = setTimeout(() => setLiveToast(null), 8000);
      return () => clearTimeout(timer);
    } else if (lastEvent.type === 'STATUS_CHANGED' && lastEvent.status === 'CALLING') {
      playChimeTone('calling');
    }
  }, [lastEvent]);

  const activeQueueCount = queue.filter(q => q.status === 'WAITING' || q.status === 'CALLING').length;
  const billingPendingCount = queue.filter(q => q.status === 'BILLING_PENDING').length;

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage({
      sender: currentUser.name || 'Reception Desk',
      senderRole: 'Reception',
      message: chatInput.trim()
    });
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile Navigation Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)', zIndex: 998
          }}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0, width: 280,
          background: '#FFFFFF', zIndex: 999,
          display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          height: 60, padding: '0 18px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FFF7ED'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: '#EA580C', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
            }}>
              <Activity size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#0F172A' }}>MEDFLOW</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#EA580C', letterSpacing: '0.1em' }}>RECEPTION DESK</div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/reception/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? '#FFF7ED' : 'transparent',
                  color: active ? '#EA580C' : '#334155'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={17} color={active ? '#EA580C' : '#64748B'} />
                  <span>{item.label}</span>
                </div>
                {item.showBadge && activeQueueCount > 0 && (
                  <span style={{
                    background: '#EA580C', color: '#FFFFFF', fontSize: 10, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 10
                  }}>
                    {activeQueueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: '#FFEDD5',
              color: '#EA580C', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
            }}>
              PP
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>Pooja Patel</div>
              <div style={{ fontSize: 10, color: '#64748B' }}>Front Desk Officer</div>
            </div>
          </div>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '8px 12px', borderRadius: 6,
              background: '#F1F5F9', color: '#DC2626', fontSize: 12, fontWeight: 700, textDecoration: 'none'
            }}
          >
            <LogOut size={14} />
            <span>Clock Out & Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* MedFlow Single-Row Top Navigation Bar */}
      <header className="medflow-header">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="medflow-mobile-menu-btn"
          style={{
            background: 'none', border: 'none', color: '#0F172A',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            padding: 6, cursor: 'pointer', marginRight: 8
          }}
          title="Open Reception Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Left: Brand & Logo */}
        <Link href="/reception/dashboard" className="medflow-logo">
          <div className="medflow-logo-icon">
            <Activity size={22} strokeWidth={2.6} />
          </div>
          <div className="medflow-logo-text">
            <span className="brand">MEDFLOW</span>
            <span className="tagline">RECEPTION</span>
          </div>
        </Link>

        {/* Center: Main Navigation Menu */}
        <nav className="medflow-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/reception/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`medflow-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                <span>{item.label}</span>
                {item.showBadge && activeQueueCount > 0 && (
                  <span className="medflow-nav-badge">{activeQueueCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Fullscreen, Divider & User Profile */}
        <div className="medflow-right">

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="medflow-icon-btn"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>

          {/* Vertical divider */}
          <div className="medflow-divider" />

          {/* User Profile Badge with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              className="medflow-user"
              onClick={() => setShowUserDropdown(v => !v)}
            >
              <div className="user-avatar">
                {currentUser.initials || 'RP'}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser.name || 'Riya Patel'}</span>
                <span className="user-email">{currentUser.role || 'reception@flow.com'}</span>
              </div>
              <ChevronDown size={14} color="#64748B" style={{ marginLeft: 2 }} />
            </div>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 240, background: '#FFFFFF',
                  border: '1px solid #E2E8F0', borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                  zIndex: 200, overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>{currentUser.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{currentUser.role}</div>
                  <div style={{ fontSize: 10, color: '#EA580C', fontWeight: 700, marginTop: 4 }}>Surat Central Main • Counter #2</div>
                </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    href="/reception/profile"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <User size={15} color="#64748B" />
                    <span>My Profile & Shift Handover</span>
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

                  <Link
                    href="/reception/billing/history"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <Wallet size={15} color="#64748B" />
                    <span>Billing History & Audit</span>
                  </Link>

                  <Link
                    href="/reception/search"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <Search size={15} color="#64748B" />
                    <span>Search Patient Records</span>
                  </Link>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                  <div
                    onClick={() => {
                      if (confirm('Are you sure you want to wipe all registered patient and clinical data to reset to a clean slate? Master doctor, drug, and test catalogs will be preserved.')) {
                        resetAllStoresToDefault();
                        window.location.href = '/reception/dashboard';
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#D97706', cursor: 'pointer'
                    }}
                    className="hover:bg-amber-50"
                  >
                    <RefreshCw size={15} />
                    <span>Reset All Data (Clean Slate)</span>
                  </div>

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
                    <span>Clock Out & Sign Out</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content">
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Floating SSE Real-Time Handshake Toast */}
      {liveToast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 9999,
          background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          border: '2px solid #EA580C', borderRadius: 12,
          padding: '14px 18px', maxWidth: 420,
          boxShadow: '0 12px 36px rgba(234,88,12,0.25)',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#EA580C',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0
          }}>
            <Bell size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#9A3412' }}>
              Doctor Handover Notification
            </div>
            <div style={{ fontSize: 12, color: '#C2410C', marginTop: 2 }}>
              {liveToast.message}
            </div>
          </div>
          <button
            onClick={() => {
              setLiveToast(null);
              router.push('/reception/dashboard');
            }}
            className="btn btn-primary btn-sm"
            style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}
          >
            Open Queue
          </button>
          <button
            onClick={() => setLiveToast(null)}
            style={{ background: 'none', border: 'none', color: '#9A3412', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Floating Internal Clinic Staff Chat Widget */}
      <div className="chat-dock">
        {showChat ? (
          <div className="chat-window" style={{ animation: 'fadeIn 0.2s ease' }}>
            {/* Header */}
            <div style={{
              padding: '12px 14px', background: '#EA580C', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTopLeftRadius: 12, borderTopRightRadius: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>Front Desk Clinic Chat</span>
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
                const isMe = m.senderRole === 'Reception';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isMe ? '#EA580C' : '#FFFFFF',
                      color: isMe ? '#FFFFFF' : '#0F172A',
                      padding: '8px 12px', borderRadius: 10,
                      border: isMe ? 'none' : '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginBottom: 2 }}>
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
                placeholder="Message doctor cabin, pharmacy, or nursing..."
                style={{ fontSize: 12, padding: '6px 10px' }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
              />
              <button
                onClick={handleSendChat}
                className="btn btn-primary btn-sm"
                style={{ background: '#EA580C', borderColor: '#EA580C', padding: '0 12px' }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="chat-toggle-btn"
            style={{ background: '#EA580C', borderColor: '#EA580C' }}
            title="Open internal clinic chat with doctor cabin & pharmacy"
          >
            <MessageSquare size={16} />
            <span>Clinic Chat</span>
            {billingPendingCount > 0 && (
              <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 6px' }}>
                {billingPendingCount} Billing
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
