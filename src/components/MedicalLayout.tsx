'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, LayoutGrid, Users, User, Clock, Wallet,
  Calendar, Settings, Maximize2, Minimize2, ChevronDown,
  LogOut, Tv, MessageSquare, Send, X, ArrowUpRight,
  ShieldCheck, AlertTriangle, Stethoscope, Sparkles,
  ClipboardList, Package, RotateCcw, AlertCircle,
  Pill, UserCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { usePharmacyStore, useInventoryStore, useChatStore } from '@/store';

const MEDICAL_NAV_ITEMS = [
  { label: 'DASHBOARD', href: '/medical/dashboard', icon: LayoutGrid },
  { label: 'DISPENSING QUEUE', href: '/medical/dispensing', icon: ClipboardList, showRxBadge: true },
  { label: 'STOCK MANAGEMENT', href: '/medical/stock', icon: Package, showLowStockBadge: true },
  { label: 'DRUG RETURNS', href: '/medical/returns', icon: RotateCcw },
  { label: 'INVENTORY ALERTS', href: '/medical/alerts', icon: AlertTriangle, showAlertBadge: true },
  { label: 'STAFF PROFILE', href: '/medical/profile', icon: UserCircle },
];

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { prescriptions, batches } = usePharmacyStore();
  const { inventory } = useInventoryStore();
  const { messages, sendMessage } = useChatStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Pending Prescriptions count
  const pendingRxCount = prescriptions.filter(p => p.status === 'PHARMACY_PENDING' || p.status === 'IN_PROGRESS').length;
  // Low Stock items count (stock <= reorderLevel)
  const lowStockCount = inventory.filter(i => i.stock <= i.reorderLevel).length;
  // Near-expiry (within 180 days) or expired
  const alertCount = batches.filter(b => {
    const exp = new Date(b.expiryDate).getTime();
    const now = Date.now();
    const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
    return b.isQuarantined || daysLeft <= 180;
  }).length;

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
      sender: 'Suresh Shah (Dispensary Officer)',
      senderRole: 'Pharmacy',
      message: chatInput.trim()
    });
    setChatInput('');
  };

  return (
    <div className="app-shell" style={{ background: '#FDFDFD' }}>
      {/* MedFlow Pharmacy Top Navigation Bar (Emerald #059669 Theme) */}
      <header className="medical-header">
        {/* Left: Brand & Logo */}
        <Link href="/medical/dashboard" className="medical-logo">
          <div className="medical-logo-icon">
            <Pill size={22} strokeWidth={2.6} />
          </div>
          <div className="medical-logo-text">
            <span className="brand">MEDFLOW</span>
            <span className="tagline">PHARMACY & DISPENSARY</span>
          </div>
        </Link>

        {/* Center: Main Navigation Menu */}
        <nav className="medical-nav">
          {MEDICAL_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/medical/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`medical-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {item.showRxBadge && pendingRxCount > 0 && (
                  <span className="medical-nav-badge">{pendingRxCount}</span>
                )}
                {item.showLowStockBadge && lowStockCount > 0 && (
                  <span className="medical-nav-badge" style={{ background: '#F59E0B' }}>{lowStockCount}</span>
                )}
                {item.showAlertBadge && alertCount > 0 && (
                  <span className="medical-nav-badge" style={{ background: '#EF4444' }}>{alertCount}</span>
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

          {/* Pharmacist User Profile Pill */}
          <div style={{ position: 'relative' }}>
            <div
              className="medflow-user"
              onClick={() => setShowUserDropdown(v => !v)}
            >
              <div className="medical-avatar">
                SS
              </div>
              <div className="user-info">
                <span className="user-name">Suresh Shah</span>
                <span className="user-email" style={{ color: '#059669', fontWeight: 600 }}>Dispensary Officer</span>
              </div>
              <ChevronDown size={14} color="#64748B" style={{ marginLeft: 2 }} />
            </div>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 260, background: '#FFFFFF',
                  border: '1px solid #E2E8F0', borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.14)',
                  zIndex: 200, overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>Suresh Shah, B.Pharm</div>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>Outpatient Pharmacy Store Manager</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Lic: PHARM-GUJ-88219 • Surat Main OPD</div>
                </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    href="/medical/profile"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <UserCircle size={15} color="#059669" />
                    <span>My Profile & License Info</span>
                  </Link>

                  <Link
                    href="/medical/dispensing"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <ClipboardList size={15} color="#059669" />
                    <span>Active Dispensing Hub ({pendingRxCount})</span>
                  </Link>

                  <Link
                    href="/medical/alerts"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                      fontWeight: 600, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <AlertTriangle size={15} color="#EF4444" />
                    <span>Expiry & Low Stock Warnings ({alertCount})</span>
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
                    <span>Clock Out & End Pharmacy Shift</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content" style={{ background: '#FDFDFD' }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Floating Clinic Staff Chat Widget (Pharmacy Role, Emerald Accent) */}
      <div className="chat-dock">
        {showChat ? (
          <div className="chat-window" style={{ borderColor: 'rgba(5, 150, 105, 0.3)' }}>
            <div style={{
              padding: '12px 16px', background: '#059669', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>Clinic Internal Chat (Dispensary)</span>
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
                    background: msg.senderRole === 'Pharmacy' ? '#ECFDF5' : '#F8FAFC',
                    border: msg.senderRole === 'Pharmacy' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                    alignSelf: msg.senderRole === 'Pharmacy' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: msg.senderRole === 'Pharmacy' ? '#059669' : '#0F172A' }}>
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
                placeholder="Alert doctor cabin / reception / nursing..."
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
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="chat-toggle-btn"
            style={{ background: '#059669', boxShadow: '0 4px 18px rgba(5, 150, 105, 0.35)' }}
            title="Open internal clinic chat with Doctor Cabin & Front Desk"
          >
            <MessageSquare size={16} />
            <span>Clinic Chat ({messages.length})</span>
          </button>
        )}
      </div>
    </div>
  );
}
