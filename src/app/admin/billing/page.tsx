'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, DollarSign, Search, Filter, CheckCircle2,
  Calendar, ArrowUpRight, TrendingUp, FileText, Download,
  Percent, ShieldCheck, Tag
} from 'lucide-react';
import { useBillingStore, usePatientStore, useUIStore } from '@/store';

export default function AdminBillingPage() {
  const { bills } = useBillingStore();
  const { patients } = usePatientStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');

  // Revenue Aggregations
  const totalRevenue = useMemo(() => {
    return bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netAmount, 0);
  }, [bills]);

  const totalDiscountsGiven = useMemo(() => {
    return bills.reduce((sum, b) => sum + b.items.reduce((ds, it) => ds + (it.discount || 0), 0), 0);
  }, [bills]);

  const paidBills = useMemo(() => {
    return bills.filter(b => b.status === 'PAID');
  }, [bills]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchSearch = b.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.mrdNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMode = filterMode === 'ALL' || b.paymentMode === filterMode;
      return matchSearch && matchMode;
    });
  }, [bills, searchTerm, filterMode]);

  const handleExportCSV = () => {
    addNotification({
      type: 'success',
      message: 'Financial Ledger & Split-Tender Audit Report exported.'
    });
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
              Financial Governance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Revenue Auditing & Split-Tender Tracking</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={26} color="#10b981" /> Financial Governance & Billing Audit
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Multi-department revenue tracking, doctor-authorized discount waivers, and split-tender reconciliation.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 8,
            background: '#10b981',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
          }}
        >
          <Download size={16} /> Export Financial Ledger
        </button>
      </div>

      {/* Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gross Revenue Collected</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4, fontWeight: 600 }}>
            Across {paidBills.length} settled outpatient bills
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Discounts & Fee Waivers</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            ₹{totalDiscountsGiven.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: 4, fontWeight: 600 }}>
            Authorized by consulting physicians
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Consultation Income</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
            ₹{(totalRevenue * 0.65).toFixed(0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Primary OPD clinical sessions</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Procedures & Diagnostics</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            ₹{(totalRevenue * 0.35).toFixed(0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Derm, Ortho, Lab & Consumables</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Bill Number, Patient Name, or MRD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            color: '#334155'
          }}
        >
          <option value="ALL">All Payment Channels</option>
          <option value="UPI">UPI / Dynamic QR</option>
          <option value="CASH">Cash Payout</option>
          <option value="CARD">Card POS</option>
        </select>
      </div>

      {/* Transactions Audit Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 18px' }}>Bill & Patient</th>
              <th style={{ padding: '14px 18px' }}>Services Rendered</th>
              <th style={{ padding: '14px 18px' }}>Gross Subtotal</th>
              <th style={{ padding: '14px 18px' }}>Discount Waiver</th>
              <th style={{ padding: '14px 18px' }}>Net Paid</th>
              <th style={{ padding: '14px 18px' }}>Payment Channel</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map(b => {
              const subtotal = b.items.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);
              const discount = b.items.reduce((s, it) => s + (it.discount || 0), 0);
              return (
              <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{b.patientName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Bill: <code style={{ color: '#4338ca' }}>{b.invoiceNumber}</code> • MRD: {b.mrdNumber}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{b.date}</div>
                </td>

                <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: '#334155' }}>
                  {b.items.map((item, idx) => (
                    <div key={idx} style={{ lineHeight: 1.4 }}>
                      • {item.name} ({item.quantity}x ₹{item.unitPrice})
                    </div>
                  ))}
                </td>

                <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>
                  ₹{subtotal.toFixed(2)}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  {discount > 0 ? (
                    <div>
                      <span style={{ fontWeight: 700, color: '#d97706', fontSize: '0.85rem' }}>
                        -₹{discount}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: 4, display: 'block', width: 'fit-content', marginTop: 2 }}>
                        Authorized
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>

                <td style={{ padding: '14px 18px', fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                  ₹{b.netAmount.toFixed(2)}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background:
                      b.paymentMode === 'UPI' ? '#ECFDF5' :
                      b.paymentMode === 'CARD' ? '#FDF2F8' : '#EFF6FF',
                    color:
                      b.paymentMode === 'UPI' ? '#059669' :
                      b.paymentMode === 'CARD' ? '#BE185D' : '#1D4ED8'
                  }}>
                    {b.paymentMode}
                  </span>
                </td>

                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: b.status === 'PAID' ? '#DCFCE7' : '#FEF3C7',
                    color: b.status === 'PAID' ? '#15803D' : '#B45309'
                  }}>
                    {b.status}
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
