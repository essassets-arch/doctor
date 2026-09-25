'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, Users, Activity, Clock, Wallet, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, Package, ShieldCheck,
  Calendar, CheckCircle2, ChevronRight, RefreshCw, Download,
  Layers, Stethoscope, Sparkles, Building2, Eye, ShieldAlert,
  FileText, Settings
} from 'lucide-react';
import {
  useQueueStore, useBillingStore, usePatientStore,
  useInventoryStore, usePharmacyStore, useAdminStore, useUIStore
} from '@/store';

export default function AdminDashboardPage() {
  const { queue } = useQueueStore();
  const { bills } = useBillingStore();
  const { patients } = usePatientStore();
  const { inventory } = useInventoryStore();
  const { batches, prescriptions } = usePharmacyStore();
  const { isPanicLockdown, securityEvents, expenses } = useAdminStore();
  const { addNotification } = useUIStore();

  const [dateRange, setDateRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  // Key Metrics Calculations
  const revenueToday = useMemo(() => {
    return bills
      .filter(b => b.status === 'PAID')
      .reduce((sum, b) => sum + b.netAmount, 0);
  }, [bills]);

  const totalPatientsIntake = patients.length;
  const activeQueueCount = queue.filter(q => ['WAITING', 'CALLING', 'IN_SESSION'].includes(q.status)).length;
  const completedConsultations = queue.filter(q => ['COMPLETED', 'BILLING_PENDING'].includes(q.status)).length;
  const pendingBillsCount = queue.filter(q => q.status === 'BILLING_PENDING').length;
  const lowStockItems = inventory.filter(i => i.stock <= i.reorderLevel);
  const outOfStockItems = inventory.filter(i => i.stock === 0);

  // Consultations by Doctor
  const doctorCaseCounts = useMemo(() => {
    return [
      { name: 'Dr. Raj Valaki', specialty: 'General & Internal Medicine', count: 18, color: '#4338ca' },
      { name: 'Dr. Sarah Jenkins', specialty: 'Dermatology & Cosmetology', count: 14, color: '#0284c7' },
      { name: 'Dr. Kalp Patel', specialty: 'Orthopedics & Joint Care', count: 10, color: '#059669' }
    ];
  }, []);

  // 30-Day Revenue Trend Mock Dataset (Smooth Area Curve)
  const revenueDays = useMemo(() => {
    return [
      { day: '01', rev: 28000 }, { day: '03', rev: 32500 }, { day: '05', rev: 35000 },
      { day: '07', rev: 41000 }, { day: '09', rev: 38000 }, { day: '11', rev: 45000 },
      { day: '13', rev: 42000 }, { day: '15', rev: 48500 }, { day: '17', rev: 52000 },
      { day: '19', rev: 48500 }, { day: '21', rev: 56000 }, { day: '23', rev: 59000 },
      { day: '25', rev: 62000 }, { day: '27', rev: 58000 }, { day: '29', rev: 64000 }
    ];
  }, []);

  const maxRevenue = Math.max(...revenueDays.map(d => d.rev));

  const handleExportBI = () => {
    addNotification({
      type: 'success',
      message: 'Executive BI & Financial Telemetry Packet exported (PDF/CSV ready).'
    });
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4338ca', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
              Apex Management Suite
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Clinic-Wide Operational Intelligence</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={26} color="#4338ca" /> Executive Intelligence & Operational Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            High-velocity financial metrics, real-time doctor caseloads, zero-trust cybersecurity posture, and formulary alerts.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 3 }}>
            {(['TODAY', 'WEEK', 'MONTH'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDateRange(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: dateRange === tab ? '#4338ca' : 'transparent',
                  color: dateRange === tab ? '#FFFFFF' : '#64748B'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportBI}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 8,
              background: '#4338ca',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)'
            }}
          >
            <Download size={16} /> Export BI Packet
          </button>
        </div>
      </div>

      {/* Critical Stock Deficit Alarm Banner (If any depleted) */}
      {outOfStockItems.length > 0 && (
        <div style={{
          background: '#FFF1F2',
          border: '1.5px solid #FECACA',
          borderRadius: 10,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991B1B' }}>
                CRITICAL FORMULARY ALARM: {outOfStockItems.length} Medication(s) Completely Depleted (0 Units)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#7F1D1D', marginTop: 2 }}>
                {outOfStockItems.map(i => i.name).join(', ')} — Immediate vendor replenishment purchase order required.
              </div>
            </div>
          </div>

          <Link
            href="/admin/drugs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              background: '#DC2626',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none'
            }}
          >
            Manage Drug Formulary ➔
          </Link>
        </div>
      )}

      {/* 6 High-Velocity KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Revenue Today */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Today&apos;s Revenue</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                ₹{revenueToday.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontWeight: 600 }}>
            <TrendingUp size={14} /> +14.2% vs same day last week
          </div>
        </div>

        {/* Patients Intake */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Today&apos;s Patients</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {totalPatientsIntake}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 10 }}>
            Cumulative registered outpatient EHRs
          </div>
        </div>

        {/* Active Queue */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active In-Clinic Queue</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
                {activeQueueCount}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
              <Activity size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 10 }}>
            Waiting in lobby or in physician cabins
          </div>
        </div>

        {/* Completed Consultations */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Completed Sessions</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {completedConsultations}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 10 }}>
            Doctor encounters completed today
          </div>
        </div>

        {/* Pending Bills */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Checkout Bills</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
                {pendingBillsCount}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Wallet size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 10, fontWeight: 600 }}>
            Awaiting front desk cashiering
          </div>
        </div>

        {/* Stock Alerts */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Low Stock Deficits</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                {lowStockItems.length}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <Package size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: 10, fontWeight: 600 }}>
            {outOfStockItems.length} zero stock, {lowStockItems.length - outOfStockItems.length} near reorder
          </div>
        </div>

      </div>

      {/* Main 2-Column Analytics Workspace */}
      <div className="admin-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, marginBottom: 28 }}>
        
        {/* Left: 30-Day Revenue Trend Visual Area Chart */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#4338ca" /> 30-Day Outpatient Revenue Trajectory
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                Net collections across consultation fees, medical procedures, and dispensary sales.
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', background: '#ECFDF5', padding: '4px 10px', borderRadius: 6 }}>
              Peak: ₹64,000 / Day
            </div>
          </div>

          {/* SVG Area Chart */}
          <div style={{ position: 'relative', height: 260, width: '100%', marginTop: 20 }}>
            <svg viewBox="0 0 700 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#4338ca" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 60, 120, 180].map((y) => (
                <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              ))}

              {/* Area Path */}
              {(() => {
                const points = revenueDays.map((d, i) => {
                  const x = (i / (revenueDays.length - 1)) * 680 + 10;
                  const y = 220 - (d.rev / 70000) * 190;
                  return `${x},${y}`;
                });
                const dArea = `M 10,220 L ${points.join(' L ')} L 690,220 Z`;
                const dLine = `M ${points.join(' L ')}`;

                return (
                  <>
                    <path d={dArea} fill="url(#adminRevenueGradient)" />
                    <path d={dLine} fill="none" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {revenueDays.map((d, i) => {
                      const x = (i / (revenueDays.length - 1)) * 680 + 10;
                      const y = 220 - (d.rev / 70000) * 190;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={i === revenueDays.length - 1 ? 5 : 3.5}
                          fill={i === revenueDays.length - 1 ? '#4338ca' : '#FFFFFF'}
                          stroke="#4338ca"
                          strokeWidth="2.5"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* X-Axis Date Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, padding: '0 10px' }}>
              <span>Sep 01</span>
              <span>Sep 07</span>
              <span>Sep 14</span>
              <span>Sep 21</span>
              <span>Sep 29</span>
            </div>
          </div>
        </div>

        {/* Right: Consultations by Doctor & Caseload */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stethoscope size={18} color="#4338ca" /> Physician Clinical Caseload
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                Patient distribution across consulting specialists.
              </div>
            </div>
            <Link href="/admin/doctors" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4338ca', textDecoration: 'none' }}>
              View Roster ➔
            </Link>
          </div>

          {/* Doctor Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {doctorCaseCounts.map((doc, idx) => {
              const maxCases = 20;
              const pct = (doc.count / maxCases) * 100;

              return (
                <div key={idx} style={{ background: '#F8FAFC', borderRadius: 8, padding: 14, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{doc.specialty}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: doc.color }}>{doc.count}</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}> cases</span>
                    </div>
                  </div>

                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: doc.color, borderRadius: 999, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Mode Distribution Summary */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 10 }}>
              Payment Channel Allocation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
              <div style={{ background: '#F0FDF4', padding: 10, borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>UPI / QR</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803D' }}>58%</div>
              </div>
              <div style={{ background: '#EFF6FF', padding: 10, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>Cash Payout</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1D4ED8' }}>28%</div>
              </div>
              <div style={{ background: '#FDF2F8', padding: 10, borderRadius: 8, border: '1px solid #FBCFE8' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9D174D' }}>Card / POS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#BE185D' }}>14%</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom 2-Column: Recent Operational Audits & Quick Admin Master Jumps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 24 }}>
        
        {/* Left: Security & Activity SIEM Log */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#4338ca" /> Recent Security & Clinical Audit Events
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>SOC SIEM audit stream with live severity tags.</div>
            </div>
            <Link href="/admin/security-command-center" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4338ca', textDecoration: 'none' }}>
              Full SOC Center ➔
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {securityEvents.slice(0, 4).map(ev => (
              <div key={ev.id} style={{
                padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                      background: ev.severity === 'CRITICAL' ? '#FEE2E2' : ev.severity === 'HIGH' ? '#FEF3C7' : '#E0E7FF',
                      color: ev.severity === 'CRITICAL' ? '#991B1B' : ev.severity === 'HIGH' ? '#B45309' : '#3730A3'
                    }}>
                      {ev.severity}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{ev.eventType}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 3 }}>
                    {ev.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                    {ev.timestamp} • IP: {ev.sourceIp}
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: 4 }}>
                  {ev.actionTaken}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Operational Modules Launcher */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="#4338ca" /> Executive Governance Quick Launch
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Link
              href="/admin/doctors"
              style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              className="hover:border-indigo-400"
            >
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                <Stethoscope size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Doctor Roster</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Fees & Cabin Slots</div>
              </div>
            </Link>

            <Link
              href="/admin/procedures"
              style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              className="hover:border-indigo-400"
            >
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
                <Activity size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Procedures Master</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Pricing & Consumables</div>
              </div>
            </Link>

            <Link
              href="/admin/payment-management"
              style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              className="hover:border-indigo-400"
            >
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                <Wallet size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>UPI Dynamic QR</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>VPA & Merchant Stand</div>
              </div>
            </Link>

            <Link
              href="/admin/consent-forms"
              style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              className="hover:border-indigo-400"
            >
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Consent Templates</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Legal Multilingual</div>
              </div>
            </Link>

            <Link
              href="/admin/hrms"
              style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              className="hover:border-indigo-400"
            >
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>HRMS & Overtime</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Daily Attendance Log</div>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              style={{
                padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              className="hover:border-indigo-400"
            >
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <Settings size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Prescription Layout</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Designer & Margins</div>
              </div>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
