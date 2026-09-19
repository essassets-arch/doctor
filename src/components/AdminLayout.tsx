'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Shield, LayoutGrid, Users, User, Clock, Wallet,
  Calendar, Settings, Maximize2, Minimize2, ChevronDown,
  ChevronRight, LogOut, MessageSquare, Send, X, ArrowUpRight,
  ShieldCheck, AlertTriangle, Stethoscope, Sparkles,
  ClipboardList, Package, RotateCcw, AlertCircle,
  FileText, Activity, Lock, Sliders, DollarSign,
  HelpCircle, BarChart3, Bell, CheckCircle2, ShieldAlert,
  LifeBuoy, Search, PanelLeftClose, PanelLeftOpen,
  CreditCard, Receipt, Eye, Menu
} from 'lucide-react';
import { useAdminStore, useInventoryStore, useChatStore } from '@/store';

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: any;
    badge?: number | string;
    badgeColor?: string;
  }[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isPanicLockdown, sessions, securityEvents } = useAdminStore();
  const { inventory } = useInventoryStore();
  const { messages, sendMessage } = useChatStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Active critical/high security events
  const threatCount = securityEvents.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  // Low stock inventory items
  const lowStockCount = inventory.filter(i => i.stock <= i.reorderLevel).length;

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
      sender: 'Superadmin (Medical Director)',
      senderRole: 'Doctor',
      message: `[ADMIN DIRECTIVE]: ${chatInput.trim()}`
    });
    setChatInput('');
  };

  // Structured Navigation Groups for Admin Left Sidebar
  const NAV_SECTIONS: NavSection[] = useMemo(() => [
    {
      title: 'CORE INTELLIGENCE',
      items: [
        { label: 'Executive Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
        { label: 'BI Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
      ]
    },
    {
      title: 'WORKFORCE & HRMS',
      items: [
        { label: 'Doctor Management', href: '/admin/doctors', icon: Stethoscope },
        { label: 'Staff & RBAC Accounts', href: '/admin/staff', icon: Users },
        { label: 'HRMS & Attendance', href: '/admin/hrms', icon: Clock },
      ]
    },
    {
      title: 'CLINICAL OPERATIONS',
      items: [
        { label: 'Patient Master Registry', href: '/admin/patients', icon: User },
        { label: 'Appointments & Holidays', href: '/admin/appointments', icon: Calendar },
        { label: 'Automated Communications', href: '/admin/notifications', icon: Bell },
      ]
    },
    {
      title: 'FINANCIAL GOVERNANCE',
      items: [
        { label: 'Billing & Revenue Audit', href: '/admin/billing', icon: DollarSign },
        { label: 'UPI & Payment QR', href: '/admin/payment-management', icon: CreditCard },
        { label: 'Clinic Expense Vouchers', href: '/admin/expenses', icon: Receipt },
      ]
    },
    {
      title: 'CLINICAL MASTERS',
      items: [
        { label: 'Procedure Master', href: '/admin/procedures', icon: Activity },
        { label: 'Central Drug Formulary', href: '/admin/drugs', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: '#f59e0b' },
        { label: 'Diagnostic Lab Masters', href: '/admin/lab', icon: Sparkles },
        { label: 'Legal Consent Templates', href: '/admin/consent-forms', icon: FileText },
      ]
    },
    {
      title: 'CYBER DEFENSE & SYSTEM',
      items: [
        { 
          label: 'Security SOC & Lockdown', 
          href: '/admin/security-command-center', 
          icon: ShieldCheck, 
          badge: threatCount > 0 ? `${threatCount} Threat` : undefined,
          badgeColor: '#dc2626'
        },
        { label: 'Clinic Settings & Rx', href: '/admin/settings', icon: Settings },
        { label: 'Support & Diagnostics', href: '/admin/support', icon: LifeBuoy },
      ]
    }
  ], [threatCount, lowStockCount]);

  // Filtered navigation when searching in the sidebar
  const filteredSections = useMemo(() => {
    if (!navSearch.trim()) return NAV_SECTIONS;
    const q = navSearch.toLowerCase();
    return NAV_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.label.toLowerCase().includes(q) || 
        section.title.toLowerCase().includes(q)
      )
    })).filter(section => section.items.length > 0);
  }, [NAV_SECTIONS, navSearch]);

  // Determine current active page title for the header
  const activeItem = useMemo(() => {
    for (const sec of NAV_SECTIONS) {
      for (const item of sec.items) {
        if (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))) {
          return { section: sec.title, item: item.label };
        }
      }
    }
    return { section: 'MEDFLOW ENTERPRISE', item: 'Superadmin Console' };
  }, [NAV_SECTIONS, pathname]);

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#F8FAFC',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      overflowX: 'hidden', width: '100%', maxWidth: '100vw'
    }}>
      
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)', zIndex: 998
          }}
        />
      )}

      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Dark Enterprise Slate / Indigo Theme)       */}
      {/* ============================================================ */}
      <aside
        className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? 76 : 270,
          background: '#0F172A',
          borderRight: '1px solid #1E293B',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s ease',
          zIndex: 999,
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)'
        }}
      >
        
        {/* Sidebar Header: Logo & Collapse / Close Toggle */}
        <div style={{
          height: 64,
          padding: isCollapsed ? '0 16px' : '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1E293B',
          background: 'linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%)'
        }}>
          {!isCollapsed ? (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366F1, #4338CA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}>
                <Shield size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#FFFFFF', letterSpacing: 0.5, lineHeight: 1.1 }}>
                  MEDFLOW
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#A5B4FC', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  ADMIN APEX
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              title="MedFlow Admin Dashboard"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366F1, #4338CA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}>
                <Shield size={20} strokeWidth={2.5} />
              </div>
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="admin-desktop-collapse-btn"
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#94A3B8',
                borderRadius: 6,
                width: 28, height: 28,
                display: isCollapsed ? 'none' : 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s'
              }}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <PanelLeftClose size={15} />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="admin-mobile-close-btn"
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#94A3B8',
                borderRadius: 6,
                width: 28, height: 28,
                display: 'none',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Menu"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search Input (When Expanded) */}
        {!isCollapsed && (
          <div style={{ padding: '12px 16px 8px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#1E293B', border: '1px solid #334155',
              borderRadius: 6, padding: '6px 10px'
            }}>
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search admin modules..."
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#F8FAFC', fontSize: 12, width: '100%',
                  outline: 'none'
                }}
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Expand Quick Button */}
        {isCollapsed && (
          <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              style={{
                background: '#1E293B', border: '1px solid #334155',
                color: '#94A3B8', borderRadius: 6,
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '10px 8px' : '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {filteredSections.map(section => (
            <div key={section.title}>
              {!isCollapsed && (
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: 0.8,
                  padding: '4px 10px 6px 10px',
                  textTransform: 'uppercase'
                }}>
                  {section.title}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'space-between',
                        gap: 10,
                        padding: isCollapsed ? '10px 0' : '9px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: isActive ? 700 : 500,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        background: isActive 
                          ? 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)' 
                          : 'transparent',
                        color: isActive ? '#FFFFFF' : '#CBD5E1',
                        borderLeft: isActive && !isCollapsed ? '3px solid #818CF8' : '3px solid transparent',
                        boxShadow: isActive ? '0 4px 12px rgba(67, 56, 202, 0.3)' : 'none'
                      }}
                      className={!isActive ? 'hover:bg-slate-800' : ''}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={17} color={isActive ? '#FFFFFF' : '#94A3B8'} strokeWidth={isActive ? 2.3 : 1.8} />
                        {!isCollapsed && (
                          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 10,
                          background: item.badgeColor || '#4338CA',
                          color: '#FFFFFF'
                        }}>
                          {item.badge}
                        </span>
                      )}

                      {/* Dot Indicator for collapsed view with badge */}
                      {isCollapsed && item.badge && (
                        <span style={{
                          position: 'absolute',
                          top: 6, right: 10,
                          width: 7, height: 7,
                          borderRadius: '50%',
                          background: item.badgeColor || '#EF4444'
                        }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Superadmin User Profile Card */}
        <div style={{
          padding: isCollapsed ? '12px 8px' : '14px 16px',
          borderTop: '1px solid #1E293B',
          background: '#0B1120'
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4338CA, #6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, color: '#FFFFFF',
                  border: '2px solid #818CF8'
                }}>
                  KP
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
                    Dr. Kalp Patel
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#818CF8', marginTop: 2 }}>
                    Medical Director • P1
                  </div>
                </div>
              </div>

              <Link
                href="/admin/settings"
                title="Admin Settings"
                style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 4 }}
              >
                <Settings size={15} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4338CA, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: '#FFFFFF',
                border: '2px solid #818CF8'
              }}>
                KP
              </div>
            </div>
          )}
        </div>

      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN VIEWPORT & HEADER                                   */}
      {/* ============================================================ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Global Emergency Lockdown Banner if Active */}
        {isPanicLockdown && (
          <div style={{
            background: '#DC2626',
            color: '#FFFFFF',
            padding: '8px 24px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            letterSpacing: '0.04em',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
            position: 'sticky',
            top: 0,
            zIndex: 110
          }}>
            <ShieldAlert size={18} />
            <span>GLOBAL EMERGENCY LOCKDOWN ACTIVE — All clinical terminals locked in read-only mode. Superadmin access maintained.</span>
            <Link
              href="/admin/security-command-center"
              style={{ color: '#FFFFFF', textDecoration: 'underline', fontWeight: 900, marginLeft: 8 }}
            >
              Manage SOC Controls ➔
            </Link>
          </div>
        )}

        {/* Top Header Bar (58px height) */}
        <header style={{
          height: 58,
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: isPanicLockdown ? 36 : 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflowX: 'hidden',
          maxWidth: '100vw'
        }}>
          
          {/* Left: Mobile Menu Trigger + Breadcrumbs & Active Page Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="admin-mobile-menu-btn"
              style={{
                background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6,
                width: 34, height: 34, display: 'none', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#1E293B', flexShrink: 0
              }}
              title="Open Admin Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <span className="admin-header-section" style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {activeItem.section}
            </span>
            <ChevronRight size={14} color="#CBD5E1" className="admin-header-sep" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeItem.item}
            </h2>
          </div>

          {/* Right: Fullscreen & User Profile Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              style={{
                background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6,
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#475569'
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Superadmin Menu Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  padding: '4px 10px', borderRadius: 8, cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: '#4338CA', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800
                }}>
                  SA
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Superadmin</div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: '#4338CA' }}>Apex Director</div>
                </div>
                <ChevronDown size={12} color="#64748B" />
              </button>

              {/* Profile Dropdown */}
              {showUserDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: 8, minWidth: 220,
                  zIndex: 200, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <div style={{ padding: '6px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Dr. Kalp Patel, MD</div>
                    <div style={{ fontSize: 10.5, color: '#64748B' }}>Practice Owner & Medical Director</div>
                    <div style={{ fontSize: 9.5, color: '#4338CA', fontWeight: 700, marginTop: 2 }}>Role: ADMIN (Priority 1)</div>
                  </div>

                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 6, fontSize: 12, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <Settings size={14} color="#64748B" />
                    <span>Clinic Configuration</span>
                  </Link>

                  <Link
                    href="/admin/security-command-center"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 6, fontSize: 12, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <ShieldCheck size={14} color="#DC2626" />
                    <span>Security & Access Control</span>
                  </Link>

                  <Link
                    href="/admin/support"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 6, fontSize: 12, color: '#334155', textDecoration: 'none'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <HelpCircle size={14} color="#059669" />
                    <span>Technical Support</span>
                  </Link>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '3px 0' }} />

                  <Link
                    href="/login"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 6, fontSize: 12, color: '#DC2626', textDecoration: 'none',
                      fontWeight: 600
                    }}
                    className="hover:bg-red-50"
                  >
                    <LogOut size={14} color="#DC2626" />
                    <span>Sign Out of Apex</span>
                  </Link>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Page Content Body */}
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {children}
        </main>

      </div>

      {/* Floating Clinic Internal Staff Chat Widget */}
      <div className="chat-dock">
        {showChat ? (
          <div className="chat-window" style={{ borderColor: 'rgba(67, 56, 202, 0.3)' }}>
            <div style={{
              padding: '12px 16px', background: '#1E1B4B', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} color="#A5B4FC" />
                <span style={{ fontWeight: 800, fontSize: 13 }}>Enterprise Intercom (Admin Directive)</span>
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
                    background: msg.senderRole === 'Doctor' ? '#EEF2FF' : '#F8FAFC',
                    border: msg.senderRole === 'Doctor' ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                    alignSelf: msg.senderRole === 'Doctor' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: msg.senderRole === 'Doctor' ? '#4338CA' : '#0F172A' }}>
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
                placeholder="Broadcast directive to doctors, nursing & front desk..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              />
              <button
                onClick={handleSendChat}
                className="btn btn-primary btn-sm"
                style={{ background: '#4338CA', borderColor: '#4338CA', padding: '0 12px' }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="chat-toggle-btn"
            style={{ background: '#1E1B4B', boxShadow: '0 4px 18px rgba(30, 27, 75, 0.4)' }}
            title="Open Clinic Staff Intercom Broadcast"
          >
            <MessageSquare size={16} />
            <span>Staff Intercom ({messages.length})</span>
          </button>
        )}
      </div>

    </div>
  );
}

function HeartPulseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      <path d="M12 5v14"/>
    </svg>
  );
}
