'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, CreditCard, Banknote, Smartphone, Receipt,
  Search, Plus, Printer, CheckCircle2, AlertCircle,
  FileText, ArrowDownRight, Tag, X, QrCode, ShieldAlert
} from 'lucide-react';
import {
  useBillingStore, usePatientStore, useQueueStore, useUIStore,
  BillRecord, BillItem, PaymentMode, BillingStatus, Patient
} from '@/store';

const DEFAULT_SERVICES = [
  { name: 'OPD Consultation Fee', price: 500 },
  { name: 'Specialist Follow-Up Fee', price: 300 },
  { name: 'Wound Dressing / Bandage', price: 200 },
  { name: 'IM / IV Injection Administration', price: 100 },
  { name: '12-Lead ECG with Report', price: 350 },
  { name: 'Nebulization (Single Cycle)', price: 250 },
  { name: 'Dermatology Chemical Peel', price: 1800 },
  { name: 'Laser Skin Treatment', price: 2500 },
  { name: 'Orthopedic Joint Injection', price: 1200 },
];

export default function BillingPage() {
  const { bills, addBill, updateBill } = useBillingStore();
  const { patients } = usePatientStore();
  const { doctors } = useQueueStore();
  const { addNotification } = useUIStore();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Bill Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'pat-1');
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>(doctors[0]?.name || 'Dr. Raj Valaki');
  const [lineItems, setLineItems] = useState<BillItem[]>([
    { id: '1', name: 'OPD Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }
  ]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [amountReceived, setAmountReceived] = useState<number>(500);

  // Active Invoice Print Modal
  const [viewInvoice, setViewInvoice] = useState<BillRecord | null>(null);
  const [settleToast, setSettleToast] = useState<string | null>(null);

  // Financial Stats
  const totalRevenue = bills.reduce((s, b) => s + b.collectedAmount, 0);
  const cashTotal = bills.filter(b => b.paymentMode === 'CASH').reduce((s, b) => s + b.collectedAmount, 0);
  const upiTotal = bills.filter(b => b.paymentMode === 'UPI').reduce((s, b) => s + b.collectedAmount, 0);
  const cardTotal = bills.filter(b => b.paymentMode === 'CARD').reduce((s, b) => s + b.collectedAmount, 0);
  const pendingTotal = bills.reduce((s, b) => s + b.balance, 0);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
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
  }, [bills, statusFilter, searchQuery]);

  // Line items helper
  const addLineItem = (serviceName: string, price: number) => {
    const newItem: BillItem = {
      id: String(Date.now()),
      name: serviceName,
      unitPrice: price,
      quantity: 1,
      discount: 0,
      total: price
    };
    const updated = [...lineItems, newItem];
    setLineItems(updated);
    const sum = updated.reduce((s, i) => s + i.total, 0);
    setAmountReceived(sum);
  };

  const removeLineItem = (id: string) => {
    const updated = lineItems.filter(i => i.id !== id);
    setLineItems(updated);
    const sum = updated.reduce((s, i) => s + i.total, 0);
    setAmountReceived(sum);
  };

  const totalBillAmount = lineItems.reduce((s, i) => s + i.total, 0);

  const handleCreateBill = () => {
    const p = patients.find(pat => pat.id === selectedPatientId) || patients[0];
    const balance = Math.max(0, totalBillAmount - amountReceived);
    let finalStatus: BillingStatus = 'PENDING';
    if (balance === 0 && totalBillAmount > 0) finalStatus = 'PAID';
    else if (amountReceived > 0 && balance > 0) finalStatus = 'PARTIAL';
    else if (totalBillAmount === 0) finalStatus = 'FOC';

    addBill({
      patientId: p.id,
      patientName: `${p.firstName} ${p.lastName}`,
      mrdNumber: p.mrdNumber,
      doctorName: selectedDoctorName,
      date: new Date().toISOString().split('T')[0],
      netAmount: totalBillAmount,
      collectedAmount: amountReceived,
      balance,
      status: finalStatus,
      paymentMode,
      items: lineItems,
    });

    addNotification({
      type: 'success',
      message: `Generated invoice for ${p.firstName} ${p.lastName}: ₹${totalBillAmount}`
    });

    setShowCreateModal(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Billing & Cash Counter</h1>
          <p className="page-subtitle">Central payment collection desk: generate invoices, verify UPI QR payments, record receipts, and reconcile counter cash.</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-lg">
          <Plus size={16} /> Create New Invoice
        </button>
      </div>

      {settleToast && (
        <div style={{ padding: '12px 18px', background: '#ECFDF5', border: '1.5px solid #10B981', color: '#065F46', borderRadius: 10, marginBottom: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ {settleToast}</span>
          <button onClick={() => setSettleToast(null)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>✕</button>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="billing-stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Across all payment modes</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Cash at Counter</div>
          <div className="stat-value">₹{cashTotal.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Physical drawer cash</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">UPI / QR Codes</div>
          <div className="stat-value">₹{upiTotal.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Real-time bank transfers</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Card / POS</div>
          <div className="stat-value">₹{cardTotal.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Debit & Credit cards</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Pending Balances</div>
          <div className="stat-value">₹{pendingTotal.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Receivable from patients</div>
        </div>
      </div>

      {/* Filter & Invoices Table */}
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Invoice #, Patient Name, MRD #, or Doctor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'All Invoices', value: 'ALL' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Partial', value: 'PARTIAL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Free of Cost (FOC)', value: 'FOC' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`badge ${statusFilter === f.value ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Patient Details</th>
                <th>Doctor</th>
                <th>Total Bill</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Receipt size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600 }}>No invoice records found.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr key={bill.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {bill.invoiceNumber}
                      </span>
                    </td>

                    <td>{bill.date}</td>

                    <td>
                      <Link href={`/reception/patients/${bill.patientId}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {bill.patientName}
                      </Link>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bill.mrdNumber}</div>
                    </td>

                    <td>{bill.doctorName}</td>

                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{bill.netAmount}</td>

                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{bill.collectedAmount}</td>

                    <td style={{ fontWeight: 700, color: bill.balance > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      ₹{bill.balance}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {bill.paymentMode === 'CASH' && <Banknote size={14} color="#059669" />}
                        {bill.paymentMode === 'UPI' && <Smartphone size={14} color="#6366F1" />}
                        {bill.paymentMode === 'CARD' && <CreditCard size={14} color="#D97706" />}
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{bill.paymentMode || 'FOC'}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        bill.status === 'PAID' ? 'badge-success' :
                        bill.status === 'PARTIAL' ? 'badge-warning' :
                        bill.status === 'FOC' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {bill.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {bill.balance > 0 && (
                          <button
                            onClick={() => {
                              updateBill(bill.id, {
                                collectedAmount: bill.netAmount,
                                balance: 0,
                                status: 'PAID'
                              });
                              setSettleToast(`Collected balance of ₹${bill.balance} for ${bill.patientName}. Invoice settled!`);
                              addNotification({
                                type: 'success',
                                message: `Collected balance of ₹${bill.balance} for ${bill.patientName}. Invoice settled!`
                              });
                            }}
                            className="btn btn-sm btn-primary"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            title="Collect remaining balance"
                          >
                            <Wallet size={13} /> Settle ₹{bill.balance}
                          </button>
                        )}
                        <button
                          onClick={() => setViewInvoice(bill)}
                          className="btn btn-ghost btn-sm"
                          title="View & Print Bill Receipt"
                        >
                          <Printer size={14} /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Bill Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <Receipt size={18} color="var(--primary)" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Generate OPD Counter Bill & Invoice
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Patient and Doctor Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Select Patient</label>
                  <select
                    className="form-select"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.mrdNumber}) • {p.mobile}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Attending Doctor</label>
                  <select
                    className="form-select"
                    value={selectedDoctorName}
                    onChange={e => setSelectedDoctorName(e.target.value)}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Quick Add Chips */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Quick Add Services</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DEFAULT_SERVICES.map(srv => (
                    <button
                      key={srv.name}
                      type="button"
                      onClick={() => addLineItem(srv.name, srv.price)}
                      className="badge badge-muted"
                      style={{ cursor: 'pointer', padding: '6px 10px', fontSize: 11 }}
                    >
                      + {srv.name} (₹{srv.price})
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Invoice Line Items
                </div>
                <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Unit Price (₹)</th>
                        <th>Qty</th>
                        <th>Total (₹)</th>
                        <th style={{ textAlign: 'right' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>₹{item.unitPrice}</td>
                          <td>{item.quantity}</td>
                          <td style={{ fontWeight: 700 }}>₹{item.total}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => removeLineItem(item.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Billing Calculation & Payment Mode */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
                padding: 16, background: 'var(--bg-muted)', borderRadius: 10
              }}>
                <div>
                  <div className="form-group">
                    <label className="form-label required">Payment Mode</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as PaymentMode[]).map(pm => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMode(pm)}
                          className={`btn ${paymentMode === pm ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ padding: '8px 0', justifyContent: 'center' }}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label required">Amount Collected (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={amountReceived}
                      onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gross Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{totalBillAmount}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{amountReceived}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <span style={{ fontWeight: 800 }}>Balance Due:</span>
                    <span style={{ fontWeight: 900, color: totalBillAmount - amountReceived > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      ₹{Math.max(0, totalBillAmount - amountReceived)}.00
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateBill}>
                <Receipt size={16} /> Issue Invoice & Collect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">OPD Invoice Receipt</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewInvoice(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: 24,
                fontFamily: 'monospace',
                color: '#0F172A',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
              }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #0F172A', paddingBottom: 12, marginBottom: 14 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>MEDFLOW MULTISPECIALITY OPD CLINIC</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Ring Road, Surat - 395002 • Ph: 0261-2800100</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, letterSpacing: '0.08em' }}>CASH / PAYMENT RECEIPT</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14 }}>
                  <div>
                    <div><strong>Invoice No:</strong> {viewInvoice.invoiceNumber}</div>
                    <div><strong>Patient:</strong> {viewInvoice.patientName}</div>
                    <div><strong>MRD No:</strong> {viewInvoice.mrdNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Date:</strong> {viewInvoice.date}</div>
                    <div><strong>Doctor:</strong> {viewInvoice.doctorName}</div>
                    <div><strong>Payment Mode:</strong> {viewInvoice.paymentMode}</div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', padding: '10px 0', margin: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 11, marginBottom: 6 }}>
                    <span>ITEM PARTICULARS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  {viewInvoice.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                      <span>{item.name} (x{item.quantity})</span>
                      <span>₹{item.total}.00</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, textAlign: 'right' }}>
                  <div><strong>Gross Total:</strong> ₹{viewInvoice.netAmount}.00</div>
                  <div><strong>Paid Amount:</strong> ₹{viewInvoice.collectedAmount}.00</div>
                  <div><strong style={{ color: viewInvoice.balance > 0 ? '#DC2626' : '#059669' }}>Balance Due:</strong> ₹{viewInvoice.balance}.00</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 12, borderTop: '1px dashed #CBD5E1', fontSize: 10, color: '#64748B' }}>
                  Thank you for visiting MedFlow OPD. Please retain this receipt for follow-up.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewInvoice(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
