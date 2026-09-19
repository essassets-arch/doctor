'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, CreditCard, Banknote, Calendar, Search,
  Printer, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Download, ArrowLeft, Filter
} from 'lucide-react';
import { useBillingStore, BillRecord } from '@/store';

export default function DoctorFinancialOverviewPage() {
  const { bills } = useBillingStore();

  const [dateFilter, setDateFilter] = useState('2026-09-19');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Bills for Dr. Raj Valaki
  const doctorBills = useMemo(() => {
    return bills.filter(b => b.doctorName === 'Dr. Raj Valaki');
  }, [bills]);

  // KPIs
  const todayBilled = doctorBills.filter(b => b.date === '2026-09-19').reduce((s, b) => s + b.netAmount, 0);
  const monthlyBilled = 84500; // simulated month-to-date
  const yearlyBilled = 942000; // simulated annual total
  const careerTotal = 2450000; // career volume

  // Filtered bills
  const filteredBills = useMemo(() => {
    return doctorBills.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.invoiceNumber.toLowerCase().includes(q) ||
          b.patientName.toLowerCase().includes(q) ||
          b.mrdNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [doctorBills, statusFilter, searchQuery]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Financial Overview & Professional Payouts</h1>
          <p className="page-subtitle">Transparent billing ledger, procedure revenue generation, and financial settlements for Dr. Raj Valaki.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm">
            <Printer size={14} /> Print Earnings Report
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 8.1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-label">Today's Billing Generated</div>
          <div className="stat-value">₹{todayBilled.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Consultations & procedures for 19 Sep</div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">Monthly Gross (September)</div>
          <div className="stat-value">₹{monthlyBilled.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Month-to-date collections</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-label">Financial Year (2026-27)</div>
          <div className="stat-value">₹{yearlyBilled.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Cumulative annual production</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Career Total Volume</div>
          <div className="stat-value">₹{careerTotal.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Overall hospital clinical output</div>
        </div>
      </div>

      {/* Filters & Ledger Table (Section 8.2) */}
      <div className="card">
        <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="search-input-wrap" style={{ minWidth: 260 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Bill #, Patient, MRD..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            {['ALL', 'PAID', 'PARTIAL', 'FOC'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`badge ${statusFilter === st ? 'badge-primary' : 'badge-muted'}`}
                style={{
                  cursor: 'pointer', padding: '5px 12px', fontSize: 11,
                  background: statusFilter === st ? '#036d92' : undefined
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Bill Number & Date</th>
                <th>Patient Details</th>
                <th>Gross Billed (₹)</th>
                <th>Collected (₹)</th>
                <th>Outstanding (₹)</th>
                <th>Tender Status</th>
                <th style={{ textAlign: 'right' }}>Invoice Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(bill => (
                <tr key={bill.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#036d92', fontFamily: 'monospace' }}>
                      {bill.invoiceNumber}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bill.date}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700 }}>{bill.patientName}</div>
                    <div style={{ fontSize: 11, color: '#036d92', fontFamily: 'monospace' }}>{bill.mrdNumber}</div>
                  </td>

                  <td style={{ fontWeight: 800 }}>₹{bill.netAmount.toLocaleString('en-IN')}</td>

                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                    ₹{bill.collectedAmount.toLocaleString('en-IN')}
                  </td>

                  <td style={{ color: bill.balance > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                    ₹{bill.balance.toLocaleString('en-IN')}
                  </td>

                  <td>
                    <span className={`badge ${bill.status === 'PAID' ? 'badge-success' : bill.status === 'FOC' ? 'badge-info' : 'badge-warning'}`}>
                      {bill.status}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => alert(`Simulated breakdown for invoice ${bill.invoiceNumber}: Net ₹${bill.netAmount}, Paid ₹${bill.collectedAmount}`)}
                      className="btn btn-ghost btn-sm"
                    >
                      Breakdown
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
