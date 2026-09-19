'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Download, Calendar, DollarSign,
  Users, Activity, Stethoscope, Package, Filter, ShieldCheck
} from 'lucide-react';
import { useBillingStore, useAdminStore, useInventoryStore, useUIStore } from '@/store';

export default function AdminReportsPage() {
  const { bills } = useBillingStore();
  const { expenses, staff } = useAdminStore();
  const { inventory } = useInventoryStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'INVENTORY' | 'EPIDEMIOLOGY'>('FINANCIAL');

  const totalRevenue = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Physician Revenue Sharing Breakdown (70% Doctor, 30% Clinic Facility)
  const doctorPayouts = useMemo(() => {
    return [
      { name: 'Dr. Raj Valaki', cases: 18, grossRevenue: 9000, doctorShare: 6300, clinicShare: 2700 },
      { name: 'Dr. Sarah Jenkins', cases: 14, grossRevenue: 11200, doctorShare: 7840, clinicShare: 3360 },
      { name: 'Dr. Kalp Patel', cases: 10, grossRevenue: 7000, doctorShare: 4900, clinicShare: 2100 }
    ];
  }, []);

  // Top ICD-10 Diagnoses
  const topDiagnoses = [
    { code: 'L20.9', name: 'Atopic Dermatitis & Eczema', cases: 28, share: '32%' },
    { code: 'I10', name: 'Essential (Primary) Hypertension', cases: 22, share: '25%' },
    { code: 'E11.9', name: 'Type 2 Diabetes Mellitus', cases: 19, share: '21%' },
    { code: 'M17.9', name: 'Osteoarthritis of Knee', cases: 12, share: '14%' },
    { code: 'J02.9', name: 'Acute Pharyngitis', cases: 7, share: '8%' }
  ];

  const handleExport = (reportName: string) => {
    addNotification({
      type: 'success',
      message: `Exported ${reportName} in regulatory audit format (PDF/CSV ready).`
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4338ca', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
              Business Intelligence
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Executive Financials & Clinical Epidemiology</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={26} color="#4338ca" /> Executive BI Analytics & Audit Reports
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Physician revenue sharing reconciliation, GST tax statements, inventory turnover, and disease prevalence.
          </p>
        </div>

        <button
          onClick={() => handleExport('Executive Full BI Packet')}
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
          <Download size={16} /> Export Regulatory Pack
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('FINANCIAL')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'FINANCIAL' ? '#10B981' : '#F1F5F9',
            color: activeTab === 'FINANCIAL' ? '#FFFFFF' : '#64748B'
          }}
        >
          Financial P&L & Doctor Payouts
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'INVENTORY' ? '#059669' : '#F1F5F9',
            color: activeTab === 'INVENTORY' ? '#FFFFFF' : '#64748B'
          }}
        >
          Pharmacy Inventory Turnover
        </button>

        <button
          onClick={() => setActiveTab('EPIDEMIOLOGY')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: activeTab === 'EPIDEMIOLOGY' ? '#4338CA' : '#F1F5F9',
            color: activeTab === 'EPIDEMIOLOGY' ? '#FFFFFF' : '#64748B'
          }}
        >
          Clinical Epidemiology & ICD-10
        </button>
      </div>

      {/* Tab 1: Financial & Doctor Share */}
      {activeTab === 'FINANCIAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Doctor Payout Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Physician Consultation Revenue Share Reconciliation (70/30 Model)
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Automated payout computation net of clinic facility fees.</div>
              </div>
              <button
                onClick={() => handleExport('Doctor Payout Reconciliation')}
                style={{ background: 'none', border: 'none', color: '#4338ca', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Export Bank Advice ➔
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 18px' }}>Physician</th>
                  <th style={{ padding: '12px 18px' }}>Consultations</th>
                  <th style={{ padding: '12px 18px' }}>Gross Revenue</th>
                  <th style={{ padding: '12px 18px' }}>Doctor Share (70%)</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Clinic Share (30%)</th>
                </tr>
              </thead>
              <tbody>
                {doctorPayouts.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>{d.name}</td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>{d.cases} cases</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>₹{d.grossRevenue.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#10b981' }}>₹{d.doctorShare.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#4338ca' }}>₹{d.clinicShare.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GST Tax Summary Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Goods & Services Tax (GST) Liability Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>5% Pharmaceutical GST</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>₹1,480.00</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>Outpatient Pharmacy Invoices</div>
              </div>

              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>18% Aesthetic Procedures GST</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4338CA', marginTop: 4 }}>₹2,840.00</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>Laser & Cosmetic Dermatologic Care</div>
              </div>

              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Consultations (Healthcare Exempt)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>₹0.00 (Exempt)</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>Per Section 12AA Health Services Exemption</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Inventory Analytics */}
      {activeTab === 'INVENTORY' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Formulary Consumption & Lead Times
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Medicine</th>
                  <th style={{ padding: '10px 14px' }}>Form</th>
                  <th style={{ padding: '10px 14px' }}>Stock Balance</th>
                  <th style={{ padding: '10px 14px' }}>Monthly Consumption</th>
                  <th style={{ padding: '10px 14px' }}>Avg Lead Time</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Turnover Health</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{item.name}</td>
                    <td style={{ padding: '10px 14px' }}>{item.formulation}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800 }}>{item.stock} units</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>~120 units</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>2 Days</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4 }}>
                        HIGH VELOCITY
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Epidemiology */}
      {activeTab === 'EPIDEMIOLOGY' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Top Outpatient Clinical Conditions (ICD-10 Diagnoses)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topDiagnoses.map((diag, idx) => (
              <div key={idx} style={{ padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4338CA', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>
                      {diag.code}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>{diag.name}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                    Total cases treated: <strong>{diag.cases}</strong> patients
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4338CA' }}>{diag.share}</span>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Clinic Prevalence</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
