'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, Plus, Search, Filter, CheckCircle2,
  Calendar, Building, FileText, TrendingDown, TrendingUp,
  Receipt, X, Download, ShieldCheck
} from 'lucide-react';
import { useAdminStore, useBillingStore, useUIStore, ClinicExpense } from '@/store';

export default function AdminExpensesPage() {
  const { expenses, addExpense, staff } = useAdminStore();
  const { bills } = useBillingStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Medical Consumables' as ClinicExpense['category'],
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER' as ClinicExpense['paymentMethod'],
    receiptNumber: '',
    approvedBy: 'Superadmin (Medical Director)',
    notes: ''
  });

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netAmount, 0);
  }, [bills]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalPayroll = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.salary, 0);
  }, [staff]);

  const netOperatingProfit = totalRevenue - (totalExpenses + totalPayroll);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.approvedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.amount <= 0) {
      addNotification({ type: 'danger', message: 'Expense title and valid amount are required.' });
      return;
    }

    addExpense({
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      paymentMethod: form.paymentMethod,
      receiptNumber: form.receiptNumber || `VOUCH-${Math.floor(1000 + Math.random() * 9000)}`,
      approvedBy: form.approvedBy,
      notes: form.notes
    });

    addNotification({
      type: 'success',
      message: `Expense voucher for ₹${form.amount} logged successfully.`
    });

    setIsAddModalOpen(false);
    setForm({
      title: '',
      category: 'Medical Consumables',
      amount: 5000,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      receiptNumber: '',
      approvedBy: 'Superadmin (Medical Director)',
      notes: ''
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b', background: '#FFFBEB', padding: '2px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
              Financial ERP
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Clinic Operating Overhead & Net P&L</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={26} color="#f59e0b" /> Clinic Expense Vouchers & Net Profitability
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Facility rent, biomedical waste management, consumables procurement, and net operating profit calculation.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: '#f59e0b',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
          }}
        >
          <Plus size={16} /> Record Expense Voucher
        </button>
      </div>

      {/* Net Profit Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gross Patient Collections</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4 }}>OPD Consultations & Procedures</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Operational Overhead</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            -₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: 4 }}>Rent, Utilities, BMW & Supplies</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Staff Payroll Liability</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            -₹{totalPayroll.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: 4 }}>Monthly Salaries ({staff.length} Employees)</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Net Clinic Operating Profit</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
            ₹{netOperatingProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: 4, fontWeight: 700 }}>
            Formula: Revenue - (Expenses + Payroll)
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search expense voucher by title, receipt number, or approver..."
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
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            color: '#334155'
          }}
        >
          <option value="ALL">All Overhead Categories</option>
          <option value="Rent & Lease">Rent & Facility Lease</option>
          <option value="Bio-Medical Waste">Bio-Medical Waste Incineration</option>
          <option value="IT & Utilities">IT, Fiber & Electricity</option>
          <option value="Medical Consumables">Medical Supplies & Consumables</option>
          <option value="Maintenance & Facility">Maintenance & Facility</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 18px' }}>Expense Title</th>
              <th style={{ padding: '14px 18px' }}>Category</th>
              <th style={{ padding: '14px 18px' }}>Date</th>
              <th style={{ padding: '14px 18px' }}>Payment Method</th>
              <th style={{ padding: '14px 18px' }}>Voucher Ref</th>
              <th style={{ padding: '14px 18px' }}>Authorized By</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => (
              <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{exp.title}</div>
                  {exp.notes && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{exp.notes}</div>}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#F1F5F9',
                    color: '#334155'
                  }}>
                    {exp.category}
                  </span>
                </td>

                <td style={{ padding: '14px 18px', color: '#64748b' }}>
                  {exp.date}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#059669' }}>
                    {exp.paymentMethod}
                  </span>
                </td>

                <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#4338ca', fontWeight: 600, fontSize: '0.82rem' }}>
                  {exp.receiptNumber}
                </td>

                <td style={{ padding: '14px 18px', color: '#475569', fontSize: '0.82rem' }}>
                  {exp.approvedBy}
                </td>

                <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '1rem' }}>
                  -₹{exp.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 520,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Receipt size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Record Operational Expense Voucher
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Expense Title / Payee Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Torrent Power AC Electricity Bill"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Overhead Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Rent & Lease">Rent & Facility Lease</option>
                    <option value="Bio-Medical Waste">Bio-Medical Waste</option>
                    <option value="IT & Utilities">IT & Utilities</option>
                    <option value="Medical Consumables">Medical Consumables</option>
                    <option value="Maintenance & Facility">Maintenance & Facility</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Disbursement Channel
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CASH">Cash Petty Cash</option>
                    <option value="CHEQUE">Cheque Issue</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Date Incurred
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Receipt / Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-99120"
                    value={form.receiptNumber}
                    onChange={(e) => setForm(f => ({ ...f, receiptNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Authorizing Officer
                  </label>
                  <input
                    type="text"
                    value={form.approvedBy}
                    onChange={(e) => setForm(f => ({ ...f, approvedBy: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Audit Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional internal remarks..."
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Commit Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
