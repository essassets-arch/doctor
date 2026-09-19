'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, Printer, Search, Calendar, Filter, CheckCircle2,
  AlertCircle, ArrowLeft, ArrowUpRight, Download, Receipt,
  CreditCard, Banknote, Smartphone, RotateCcw, X
} from 'lucide-react';
import { useBillingStore, BillRecord } from '@/store';

export default function BillingHistoryAuditPage() {
  const { bills } = useBillingStore();

  const [dateFilter, setDateFilter] = useState('2026-09-19');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<BillRecord | null>(null);

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      // Date filter
      if (dateFilter && b.date !== dateFilter) return false;

      // Status filter
      if (statusFilter === 'PAID' && b.status !== 'PAID') return false;
      if (statusFilter === 'UNPAID' && (b.status === 'PAID' || b.status === 'FOC')) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.invoiceNumber.toLowerCase().includes(q) ||
          b.patientName.toLowerCase().includes(q) ||
          b.mrdNumber.toLowerCase().includes(q) ||
          b.doctorName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bills, dateFilter, statusFilter, searchQuery]);

  // Aggregate metrics
  const totalBilled = filteredBills.reduce((s, b) => s + b.netAmount, 0);
  const totalCollected = filteredBills.reduce((s, b) => s + b.collectedAmount, 0);
  const totalOutstanding = filteredBills.reduce((s, b) => s + b.balance, 0);

  const cashCollected = filteredBills
    .filter(b => b.paymentMode === 'CASH')
    .reduce((s, b) => s + b.collectedAmount, 0);

  const upiCollected = filteredBills
    .filter(b => b.paymentMode === 'UPI')
    .reduce((s, b) => s + b.collectedAmount, 0);

  const cardCollected = filteredBills
    .filter(b => b.paymentMode === 'CARD')
    .reduce((s, b) => s + b.collectedAmount, 0);

  return (
    <div className="page-container">
      {/* Back Link & Header */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/reception/billing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Billing Cash Counter
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Billing History & Collections Audit</h1>
          <p className="page-subtitle">Front-desk financial audit ledger tracking all receipts, collections, outstanding balances, and receipt reprints.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} className="btn btn-outline">
            <Printer size={15} /> Print Daily Audit
          </button>
          <Link href="/reception/billing">
            <button className="btn btn-primary">
              <Wallet size={15} /> Open Cash Counter
            </button>
          </Link>
        </div>
      </div>

      {/* Audit Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-label">Total Billed ({dateFilter})</div>
          <div className="stat-value">₹{totalBilled.toLocaleString('en-IN')}</div>
          <div className="stat-sub">{filteredBills.length} invoices generated</div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">Total Realized Collection</div>
          <div className="stat-value">₹{totalCollected.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Cash ₹{cashCollected} • UPI ₹{upiCollected} • Card ₹{cardCollected}</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-label">Outstanding Balances</div>
          <div className="stat-value">₹{totalOutstanding.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Receivable from unpaid visits</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-label">Collection Rate</div>
          <div className="stat-value">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100}%
          </div>
          <div className="stat-sub">Settlement percentage</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Search */}
          <div className="search-input-wrap" style={{ minWidth: 260 }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Bill #, Patient, MRD..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Audit Date:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 13 }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            {(['ALL', 'PAID', 'UNPAID'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`badge ${statusFilter === s ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
              >
                {s === 'ALL' ? 'All Invoices' : s === 'PAID' ? 'Fully Paid' : 'Unpaid / Partial'}
              </button>
            ))}
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              setDateFilter('2026-09-19');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Audit History Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Receipt size={16} color="var(--primary)" />
            Collections Ledger — {filteredBills.length} Records Found
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing records for {dateFilter || 'All Dates'}
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Bill Number & Date</th>
                <th>Patient Details</th>
                <th>Attending Doctor</th>
                <th>Net Amount (₹)</th>
                <th>Collected (₹)</th>
                <th>Balance (₹)</th>
                <th>Status</th>
                <th>Mode</th>
                <th style={{ textAlign: 'right' }}>Receipt Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No billing records match the selected date and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {b.invoiceNumber}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {b.date}
                      </div>
                    </td>

                    <td>
                      <Link
                        href={`/reception/patients/${b.patientId}`}
                        style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                        className="hover:text-orange-600"
                      >
                        {b.patientName}
                      </Link>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--primary)', marginTop: 2 }}>
                        {b.mrdNumber}
                      </div>
                    </td>

                    <td style={{ fontWeight: 600 }}>{b.doctorName}</td>

                    <td style={{ fontWeight: 700, fontSize: 14 }}>₹{b.netAmount.toLocaleString('en-IN')}</td>

                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                      ₹{b.collectedAmount.toLocaleString('en-IN')}
                    </td>

                    <td style={{
                      color: b.balance > 0 ? 'var(--danger)' : 'var(--text-muted)',
                      fontWeight: b.balance > 0 ? 800 : 500
                    }}>
                      ₹{b.balance.toLocaleString('en-IN')}
                    </td>

                    <td>
                      <span className={`badge ${b.status === 'PAID' ? 'badge-success' : b.status === 'PARTIAL' ? 'badge-warning' : b.status === 'FOC' ? 'badge-info' : 'badge-danger'}`}>
                        {b.status}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {b.paymentMode === 'CASH' && <Banknote size={12} />}
                        {b.paymentMode === 'UPI' && <Smartphone size={12} />}
                        {b.paymentMode === 'CARD' && <CreditCard size={12} />}
                        {b.paymentMode || '—'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedBillForPrint(b)}
                        className="btn btn-ghost btn-sm"
                        title="View and Print Official Tax Invoice"
                      >
                        <Printer size={14} /> Print Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {selectedBillForPrint && (
        <div className="modal-overlay" onClick={() => setSelectedBillForPrint(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Official Hospital Tax Invoice</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedBillForPrint(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: '#FFFFFF', padding: 24, border: '1px solid var(--border)',
                borderRadius: 8, fontFamily: 'inherit'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: 14, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                      MEDFLOW MULTISPECIALITY OPD
                    </h2>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Ring Road, Surat, Gujarat - 395002 | Helpline: +91 261 2450000
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      GSTIN: 24AAACM1234F1Z8 | Registration: SUR/OPD/2026/042
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-primary" style={{ fontSize: 12, padding: '4px 12px' }}>
                      TAX INVOICE
                    </span>
                    <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'monospace', marginTop: 6 }}>
                      {selectedBillForPrint.invoiceNumber}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Date: {selectedBillForPrint.date}
                    </div>
                  </div>
                </div>

                {/* Patient & Doctor Snapshot */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--bg-muted)', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 12 }}>
                  <div>
                    <div><strong>Patient Name:</strong> {selectedBillForPrint.patientName}</div>
                    <div><strong>MRD Number:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{selectedBillForPrint.mrdNumber}</span></div>
                    <div><strong>Payment Mode:</strong> {selectedBillForPrint.paymentMode || 'Cash'}</div>
                  </div>
                  <div>
                    <div><strong>Consulting Doctor:</strong> {selectedBillForPrint.doctorName}</div>
                    <div><strong>Billing Counter:</strong> Reception Counter #2 (Riya Patel)</div>
                    <div><strong>Payment Status:</strong> <strong style={{ color: selectedBillForPrint.status === 'PAID' ? 'var(--success)' : 'var(--danger)' }}>{selectedBillForPrint.status}</strong></div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table style={{ width: '100%', marginBottom: 16, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 0' }}># Service Description</th>
                      <th style={{ textAlign: 'right', padding: '6px 0' }}>Rate (₹)</th>
                      <th style={{ textAlign: 'right', padding: '6px 0' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '6px 0' }}>Discount (₹)</th>
                      <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBillForPrint.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 0', fontWeight: 600 }}>{idx + 1}. {item.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>₹{item.unitPrice}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>₹{item.discount}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700 }}>₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #0F172A', paddingTop: 12 }}>
                  <div style={{ width: 240, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gross Total:</span>
                      <strong>₹{selectedBillForPrint.netAmount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 700 }}>
                      <span>Amount Received:</span>
                      <span>₹{selectedBillForPrint.collectedAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: selectedBillForPrint.balance > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 800, fontSize: 13 }}>
                      <span>Balance Outstanding:</span>
                      <span>₹{selectedBillForPrint.balance}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                  <div>
                    * Computer generated invoice. No physical signature required.
                  </div>
                  <div>
                    Authorized Cashier: <strong>Riya Patel (FDO-092)</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedBillForPrint(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
