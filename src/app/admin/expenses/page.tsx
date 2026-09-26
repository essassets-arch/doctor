'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, Plus, Search, Filter, CheckCircle2,
  Calendar, Building, FileText, TrendingDown, TrendingUp,
  Receipt, X, Download, ShieldCheck, Printer, Tag,
  Clock, Check, AlertCircle, RefreshCw, Eye, Edit2, Trash2,
  CreditCard, Landmark, QrCode, Banknote, UserCheck
} from 'lucide-react';
import { useAdminStore, useBillingStore, useUIStore, ClinicExpense, ExpenseCategory } from '@/store';

// Helper for Indian Rupees in words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  return 'Rupees ' + inWords(Math.floor(num)) + ' Only';
}

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string; border: string }> = {
  'Rent & Lease': { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  'Bio-Medical Waste': { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'IT & Utilities': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  'Medical Consumables': { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'Pharmaceuticals & Stock': { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  'Diagnostic Reagents': { bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8' },
  'Maintenance & Facility': { bg: '#FFF7ED', text: '#9A3412', border: '#FFEDD5' },
  'Staff Welfare & Training': { bg: '#F0FDFA', text: '#115E59', border: '#99F6E4' },
  'Housekeeping & Sanitation': { bg: '#F8FAFC', text: '#334155', border: '#E2E8F0' },
  'Marketing & Outreach': { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF' },
  'Administrative & Sundry': { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }
};

export default function AdminExpensesPage() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpenseStatus,
    seedExpenses,
    staff,
    settings
  } = useAdminStore();
  const { bills } = useBillingStore();
  const { addNotification } = useUIStore();

  // Ensure standard hospital roster is loaded if store has fewer expenses
  useEffect(() => {
    if (seedExpenses) {
      seedExpenses(false);
    }
  }, [seedExpenses]);

  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('DATE_DESC');

  // Action feedback banner
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ClinicExpense | null>(null);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<ClinicExpense | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Medical Consumables' as ExpenseCategory,
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER' as ClinicExpense['paymentMethod'],
    receiptNumber: '',
    approvedBy: 'Superadmin (Medical Director)',
    vendor: '',
    gstNumber: '',
    taxAmount: 0,
    status: 'PAID' as 'PAID' | 'PENDING',
    notes: ''
  });

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netAmount, 0);
  }, [bills]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalTaxAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  }, [expenses]);

  const totalPayroll = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.salary, 0);
  }, [staff]);

  const netOperatingProfit = totalRevenue - (totalExpenses + totalPayroll);
  const profitMargin = totalRevenue > 0 ? ((netOperatingProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Category Spend Totals for the Quick Strip
  const categorySpendMap = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    expenses.forEach(e => {
      if (!map[e.category]) {
        map[e.category] = { total: 0, count: 0 };
      }
      map[e.category].total += e.amount;
      map[e.category].count += 1;
    });
    return map;
  }, [expenses]);

  // Unique category list
  const categoryList: ExpenseCategory[] = [
    'Rent & Lease',
    'Pharmaceuticals & Stock',
    'Medical Consumables',
    'Diagnostic Reagents',
    'IT & Utilities',
    'Maintenance & Facility',
    'Bio-Medical Waste',
    'Staff Welfare & Training',
    'Housekeeping & Sanitation',
    'Marketing & Outreach',
    'Administrative & Sundry'
  ];

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        e.title.toLowerCase().includes(q) ||
        e.receiptNumber.toLowerCase().includes(q) ||
        e.approvedBy.toLowerCase().includes(q) ||
        (e.vendor || '').toLowerCase().includes(q) ||
        (e.gstNumber || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q);

      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchMode = selectedPaymentMode === 'ALL' || e.paymentMethod === selectedPaymentMode;
      const matchStatus = selectedStatus === 'ALL' || (e.status || 'PAID') === selectedStatus;

      return matchSearch && matchCat && matchMode && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'DATE_DESC') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'DATE_ASC') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'AMOUNT_DESC') return b.amount - a.amount;
      if (sortBy === 'AMOUNT_ASC') return a.amount - b.amount;
      return 0;
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMode, selectedStatus, sortBy]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setForm({
      title: '',
      category: 'Medical Consumables',
      amount: 5000,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      receiptNumber: `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
      approvedBy: 'Superadmin (Medical Director)',
      vendor: '',
      gstNumber: '',
      taxAmount: 600,
      status: 'PAID',
      notes: ''
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: ClinicExpense) => {
    setEditingExpense(exp);
    setForm({
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      paymentMethod: exp.paymentMethod,
      receiptNumber: exp.receiptNumber,
      approvedBy: exp.approvedBy,
      vendor: exp.vendor || '',
      gstNumber: exp.gstNumber || '',
      taxAmount: exp.taxAmount || 0,
      status: (exp.status as any) || 'PAID',
      notes: exp.notes || ''
    });
    setIsAddEditModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.amount <= 0) {
      addNotification({ type: 'danger', message: 'Expense title and a valid positive amount are required.' });
      return;
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod,
        receiptNumber: form.receiptNumber,
        approvedBy: form.approvedBy,
        vendor: form.vendor,
        gstNumber: form.gstNumber,
        taxAmount: Number(form.taxAmount) || 0,
        status: form.status,
        notes: form.notes
      });
      const msg = `Expense voucher ${form.receiptNumber} (${form.title}) updated successfully.`;
      setActionToast({ message: msg, type: 'success' });
      addNotification({ type: 'success', message: msg });
    } else {
      addExpense({
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod,
        receiptNumber: form.receiptNumber || `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
        approvedBy: form.approvedBy,
        vendor: form.vendor,
        gstNumber: form.gstNumber,
        taxAmount: Number(form.taxAmount) || 0,
        status: form.status,
        notes: form.notes
      });
      const msg = `New expense voucher for ₹${form.amount.toLocaleString('en-IN')} (${form.title}) logged successfully.`;
      setActionToast({ message: msg, type: 'success' });
      addNotification({ type: 'success', message: msg });
    }

    setIsAddEditModalOpen(false);
  };

  // Handle Status Toggle
  const handleToggleStatus = (exp: ClinicExpense) => {
    toggleExpenseStatus(exp.id);
    const nextStatus = exp.status === 'PENDING' ? 'Approved & Paid' : 'Pending Approval';
    const msg = `Voucher ${exp.receiptNumber} status updated to ${nextStatus}.`;
    setActionToast({ message: msg, type: 'info' });
    addNotification({ type: 'info', message: msg });
  };

  // Handle Delete
  const handleDeleteExpense = (exp: ClinicExpense) => {
    if (confirm(`Are you sure you want to void and remove voucher ${exp.receiptNumber} (${exp.title})?`)) {
      deleteExpense(exp.id);
      const msg = `Voucher ${exp.receiptNumber} removed from expense ledger.`;
      setActionToast({ message: msg, type: 'info' });
      addNotification({ type: 'info', message: msg });
    }
  };

  // Export Financial Ledger CSV
  const handleExportCSV = () => {
    const headers = [
      'Voucher Ref',
      'Title / Description',
      'Category',
      'Vendor / Payee',
      'Amount (INR)',
      'GST / Tax (INR)',
      'Payment Mode',
      'Date Incurred',
      'Status',
      'Authorized By',
      'Audit Notes'
    ];
    const rows = expenses.map(e => [
      `"${e.receiptNumber}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      e.amount,
      e.taxAmount || 0,
      `"${e.paymentMethod}"`,
      `"${e.date}"`,
      `"${e.status || 'PAID'}"`,
      `"${e.approvedBy}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MedFlow_Expense_Audit_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionToast({ message: 'Financial expense ledger exported to CSV successfully.', type: 'info' });
    addNotification({ type: 'info', message: 'Financial expense ledger exported to CSV.' });
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* ============================================================ */}
      {/* 1. HEADER & PRIMARY ACTIONS                                  */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b45309', background: '#FFFBEB', padding: '3px 9px', borderRadius: 4, border: '1px solid #FDE68A' }}>
              Financial ERP & Expense Audits
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              • Clinic Operating Overhead & Net Profitability
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.65rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={26} color="#f59e0b" /> Clinic Expense Vouchers & Net Profitability
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
            Comprehensive hospital expenditure ledger: facility rent, medical consumables, pharmaceuticals, diagnostic reagents, biomedical waste, utilities, equipment AMC, staff welfare, and net operating profit computation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => seedExpenses(true)}
            title="Reset and load complete 14-item standard hospital expense dataset"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              borderRadius: 8, background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Reload Standard Ledger
          </button>

          <button
            onClick={handleExportCSV}
            title="Export full financial ledger to CSV"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            <Download size={15} /> Export Ledger (CSV)
          </button>

          <button
            data-testid="record-expense-btn"
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, background: '#f59e0b', color: '#ffffff', border: 'none',
              fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Plus size={16} /> + Record Expense Voucher
          </button>
        </div>
      </div>

      {/* Action Toast Feedback Alert */}
      {actionToast && (
        <div style={{
          background: actionToast.type === 'success' ? '#ecfdf5' : '#eff6ff',
          color: actionToast.type === 'success' ? '#065f46' : '#1e40af',
          border: `1px solid ${actionToast.type === 'success' ? '#a7f3d0' : '#bfdbfe'}`,
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.84rem',
          fontWeight: 700,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color={actionToast.type === 'success' ? '#059669' : '#3b82f6'} />
            <span>{actionToast.message}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. GOVERNANCE METRICS (5 KPIS)                                */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 195px), 1fr))', gap: 12, marginBottom: 20 }}>
        
        {/* Gross Collections */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Gross Patient Collections</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2 }}>
            OPD Consultations & Invoiced Bills
          </div>
        </div>

        {/* Total Operational Overhead */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Operational Overhead</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <TrendingDown size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            -₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: 2 }}>
            Across {expenses.length} Vouchers (Rent, Supplies, BMW)
          </div>
        </div>

        {/* Staff Payroll Liability */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Staff Payroll Liability</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <UserCheck size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            -₹{totalPayroll.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 2 }}>
            Monthly Salary ({staff.length} Active Employees)
          </div>
        </div>

        {/* Net Clinic Operating Profit */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 800, textTransform: 'uppercase' }}>Net Clinic Operating Profit</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
              <Building size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
            ₹{netOperatingProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4338ca', marginTop: 2, fontWeight: 700 }}>
            Operating Margin: {profitMargin}%
          </div>
        </div>

        {/* Input GST Credit Recoverable */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>Input GST Credit (ITC)</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Receipt size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            ₹{totalTaxAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: 2 }}>
            Tax Deductible on Vendor Bills
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. CATEGORY SPEND QUICK CHIPS STRIP                          */}
      {/* ============================================================ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Departmental Overhead Breakdown (Click to filter):
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Active Filter: <strong style={{ color: '#0f172a' }}>{selectedCategory}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '4px 10px',
              borderRadius: 14,
              fontSize: '0.72rem',
              fontWeight: 800,
              border: `1px solid ${selectedCategory === 'ALL' ? '#f59e0b' : '#cbd5e1'}`,
              background: selectedCategory === 'ALL' ? '#FEF3C7' : '#ffffff',
              color: selectedCategory === 'ALL' ? '#92400E' : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <span>All Categories</span>
            <span style={{ background: selectedCategory === 'ALL' ? '#ffffff' : '#f1f5f9', padding: '1px 5px', borderRadius: 8, fontSize: '0.66rem' }}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
          </button>

          {categoryList.map(cat => {
            const isSelected = selectedCategory === cat;
            const data = categorySpendMap[cat] || { total: 0, count: 0 };
            const style = CATEGORY_COLORS[cat];

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  border: `1px solid ${isSelected ? style.text : style.border}`,
                  background: isSelected ? style.bg : '#ffffff',
                  color: isSelected ? style.text : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span>{cat}</span>
                {data.total > 0 && (
                  <span style={{ background: isSelected ? '#ffffff' : style.bg, color: style.text, padding: '1px 5px', borderRadius: 8, fontSize: '0.66rem' }}>
                    ₹{data.total.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. FILTER, SEARCH & DISBURSEMENT CONTROLS                     */}
      {/* ============================================================ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1 1 260px', minWidth: 'min(100%, 260px)', position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search voucher by title, payee, receipt #, GSTIN, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#fafbfc'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
          >
            <option value="ALL">All Payment Channels</option>
            <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
            <option value="UPI">UPI / Dynamic QR</option>
            <option value="CASH">Cash Petty Cash Till</option>
            <option value="CHEQUE">Cheque Issue</option>
            <option value="CARD">Corporate Card POS</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
          >
            <option value="DATE_DESC">Date (Newest First)</option>
            <option value="DATE_ASC">Date (Oldest First)</option>
            <option value="AMOUNT_DESC">Amount (High to Low)</option>
            <option value="AMOUNT_ASC">Amount (Low to High)</option>
          </select>
        </div>

        {/* Row 2: Status Chips & Summary */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b' }}>Status Audit:</span>
            {[
              { id: 'ALL', label: 'All Vouchers', count: expenses.length },
              { id: 'PAID', label: 'Paid & Disbursed', count: expenses.filter(e => (e.status || 'PAID') === 'PAID').length, color: '#15803d', bg: '#dcfce7' },
              { id: 'PENDING', label: 'Pending Approval', count: expenses.filter(e => e.status === 'PENDING').length, color: '#b45309', bg: '#fef3c7' }
            ].map(st => {
              const isSelected = selectedStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                    borderRadius: 14, fontSize: '0.72rem', fontWeight: 800,
                    border: `1px solid ${isSelected ? (st.color || '#f59e0b') : '#cbd5e1'}`,
                    background: isSelected ? (st.bg || '#FEF3C7') : '#ffffff',
                    color: isSelected ? (st.color || '#92400E') : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <span>{st.label}</span>
                  <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: 8, background: isSelected ? '#ffffff' : '#f1f5f9' }}>
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Showing <strong>{filteredExpenses.length}</strong> of {expenses.length} Vouchers • Filtered Sum: <strong style={{ color: '#dc2626' }}>-₹{filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MASTER EXPENSES LEDGER TABLE                              */}
      {/* ============================================================ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="billing-responsive-table-scroll" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ minWidth: 1060, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px', minWidth: 120, whiteSpace: 'nowrap' }}>Voucher Ref</th>
                <th style={{ padding: '12px 14px', minWidth: 240 }}>Expense Title & Payee</th>
                <th style={{ padding: '12px 14px', minWidth: 160, whiteSpace: 'nowrap' }}>Department Category</th>
                <th style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '12px 14px', minWidth: 130, whiteSpace: 'nowrap' }}>Disbursement Mode</th>
                <th style={{ padding: '12px 14px', minWidth: 100, whiteSpace: 'nowrap' }}>Input GST (ITC)</th>
                <th style={{ padding: '12px 14px', minWidth: 100, whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '12px 14px', minWidth: 130, textAlign: 'right', whiteSpace: 'nowrap' }}>Amount Disbursed</th>
                <th style={{ padding: '12px 14px', minWidth: 130, textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    <Receipt size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>No expense vouchers found matching filter criteria</div>
                    <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Try clearing search or changing category/status filters.</div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => {
                  const isPaid = (exp.status || 'PAID') === 'PAID';
                  const catStyle = CATEGORY_COLORS[exp.category] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };

                  return (
                    <tr
                      key={exp.id}
                      data-testid={`expense-row-${exp.id}`}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    >
                      
                      {/* Voucher Ref */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4338ca', fontSize: '0.82rem' }}>
                          {exp.receiptNumber}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                          Auth: {exp.approvedBy.split(' ')[0]}
                        </div>
                      </td>

                      {/* Title & Payee / Vendor */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          {exp.title}
                        </div>
                        {exp.vendor && (
                          <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Building size={11} /> {exp.vendor}
                            {exp.gstNumber && <span style={{ color: '#64748b' }}>• GSTIN: {exp.gstNumber}</span>}
                          </div>
                        )}
                        {exp.notes && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: catStyle.bg,
                          color: catStyle.text,
                          border: `1px solid ${catStyle.border}`
                        }}>
                          {exp.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.78rem' }}>
                        {exp.date}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#334155'
                        }}>
                          {exp.paymentMethod === 'BANK_TRANSFER' && <Landmark size={12} color="#0284c7" />}
                          {exp.paymentMethod === 'UPI' && <QrCode size={12} color="#16a34a" />}
                          {exp.paymentMethod === 'CASH' && <Banknote size={12} color="#d97706" />}
                          {exp.paymentMethod === 'CHEQUE' && <FileText size={12} color="#6366f1" />}
                          {exp.paymentMethod === 'CARD' && <CreditCard size={12} color="#ec4899" />}
                          {exp.paymentMethod}
                        </span>
                      </td>

                      {/* Tax Amount */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#0284c7', fontWeight: 600 }}>
                        {exp.taxAmount ? `₹${exp.taxAmount.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleToggleStatus(exp)}
                          title="Click to toggle Paid / Pending approval status"
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: isPaid ? '#DCFCE7' : '#FEF3C7',
                            color: isPaid ? '#15803D' : '#B45309'
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPaid ? '#16a34a' : '#d97706' }} />
                          {isPaid ? 'PAID' : 'PENDING'}
                        </button>
                      </td>

                      {/* Amount Disbursed */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 900, color: '#dc2626', fontSize: '0.96rem' }}>
                          -₹{exp.amount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            data-testid={`view-voucher-btn-${exp.id}`}
                            onClick={() => setSelectedVoucherForView(exp)}
                            title="View / Print Official Disbursement Voucher"
                            style={{
                              padding: '4px 8px', borderRadius: 4, background: '#f8fafc', color: '#334155',
                              border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 3
                            }}
                          >
                            <Eye size={12} /> Voucher
                          </button>

                          <button
                            onClick={() => handleOpenEdit(exp)}
                            title="Edit Voucher"
                            style={{
                              padding: '4px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569',
                              border: 'none', cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            title="Delete / Void Voucher"
                            style={{
                              padding: '4px 6px', borderRadius: 4, background: '#fee2e2', color: '#b91c1c',
                              border: 'none', cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: RECORD / EDIT OPERATIONAL EXPENSE VOUCHER           */}
      {/* ============================================================ */}
      {isAddEditModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, maxWidth: 'min(94vw, 560px)',
            width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 22,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Receipt size={22} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingExpense ? `Edit Expense Voucher: ${form.receiptNumber}` : 'Record Hospital Expense Voucher'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Clinical Overhead Disbursement & Tax Audit Record
                  </div>
                </div>
              </div>
              <button onClick={() => setIsAddEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Expense Title / Purpose Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD Vacutainer Diagnostic Tubes & Needles Refill"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              {/* Category & Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Departmental Overhead Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff' }}
                  >
                    {categoryList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Gross Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.94rem', fontWeight: 800, color: '#dc2626' }}
                  />
                </div>
              </div>

              {/* Vendor & GSTIN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Payee / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Becton Dickinson India Pvt Ltd"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Vendor GSTIN (For ITC)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24AABCB3910M1Z2"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Disbursement Mode & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Disbursement Channel
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff' }}
                  >
                    <option value="BANK_TRANSFER">Bank NEFT / RTGS Wire</option>
                    <option value="UPI">UPI / Instant QR Settlement</option>
                    <option value="CASH">Cash Petty Cash Till</option>
                    <option value="CHEQUE">Cheque Issue</option>
                    <option value="CARD">Corporate Card POS</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Date Incurred
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              {/* Voucher # & GST Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Invoice / Receipt Voucher Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-SURG-8819"
                    value={form.receiptNumber}
                    onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Input GST / Tax (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1776"
                    value={form.taxAmount}
                    onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              {/* Authorizer & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Authorizing Officer
                  </label>
                  <input
                    type="text"
                    value={form.approvedBy}
                    onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Disbursement Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff' }}
                  >
                    <option value="PAID">PAID (Disbursed)</option>
                    <option value="PENDING">PENDING (Awaiting Approval)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Internal Audit Remarks & Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional internal justification or procurement requisition notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#ffffff', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)' }}
                >
                  {editingExpense ? 'Update Expense Voucher' : 'Commit & Disburse Voucher'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: PRINTABLE CLINIC DISBURSEMENT VOUCHER PREVIEW       */}
      {/* ============================================================ */}
      {selectedVoucherForView && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(3px)', zIndex: 1060, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div
            data-testid="disbursement-voucher-modal"
            style={{
              background: '#ffffff', borderRadius: 12, maxWidth: 'min(94vw, 680px)',
              width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 28,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1'
            }}
          >
            
            {/* Header & Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building size={20} color="#f59e0b" />
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {settings.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>
                  {settings.address}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  GSTIN: <strong>{settings.gstNumber}</strong> • Phone: {settings.phone}
                </div>
              </div>

              <button
                onClick={() => setSelectedVoucherForView(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Voucher Title Banner */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '4px 16px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#0f172a'
              }}>
                Official Clinic Disbursement Voucher
              </span>
            </div>

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 18, fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>VOUCHER NUMBER</span>
                <strong style={{ fontFamily: 'monospace', color: '#4338ca', fontSize: '0.94rem' }}>{selectedVoucherForView.receiptNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>DISBURSEMENT DATE</span>
                <strong style={{ color: '#0f172a' }}>{selectedVoucherForView.date}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>PAYEE / VENDOR</span>
                <strong style={{ color: '#0f172a' }}>{selectedVoucherForView.vendor || 'Clinic Operational Expense'}</strong>
                {selectedVoucherForView.gstNumber && <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>GST: {selectedVoucherForView.gstNumber}</span>}
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>PAYMENT CHANNEL</span>
                <strong style={{ color: '#059669' }}>{selectedVoucherForView.paymentMethod}</strong>
              </div>
            </div>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                  <th style={{ padding: '8px 12px' }}>Description / Requisition Purpose</th>
                  <th style={{ padding: '8px 12px' }}>Department Category</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedVoucherForView.title}</div>
                    {selectedVoucherForView.notes && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{selectedVoucherForView.notes}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                    {selectedVoucherForView.category}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ₹{selectedVoucherForView.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
                {selectedVoucherForView.taxAmount ? (
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <td colSpan={2} style={{ padding: '8px 12px', textAlign: 'right' }}>Included Input GST (Tax Deductible ITC):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0284c7', fontWeight: 600 }}>
                      ₹{selectedVoucherForView.taxAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ) : null}
                <tr style={{ background: '#f8fafc', fontWeight: 900, fontSize: '0.94rem' }}>
                  <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right', color: '#0f172a' }}>Total Amount Disbursed:</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626' }}>
                    ₹{selectedVoucherForView.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* In Words */}
            <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 6, fontSize: '0.78rem', color: '#334155', marginBottom: 24 }}>
              <strong>Amount in Words: </strong>
              <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{numberToWords(selectedVoucherForView.amount)}</span>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center', paddingTop: 18, borderTop: '1px dashed #cbd5e1', fontSize: '0.74rem', color: '#64748b' }}>
              <div>
                <div style={{ height: 36, borderBottom: '1px solid #94a3b8', marginBottom: 6 }} />
                <span>Prepared By (Cashier)</span>
              </div>
              <div>
                <div style={{ height: 36, borderBottom: '1px solid #94a3b8', marginBottom: 6 }} />
                <span>Verified By (Accounts Officer)</span>
              </div>
              <div>
                <div style={{ height: 36, borderBottom: '1px solid #94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.66rem', color: '#059669', border: '1px solid #059669', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                    APPROVED
                  </span>
                </div>
                <span>{selectedVoucherForView.approvedBy}</span>
              </div>
            </div>

            {/* Print & Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  borderRadius: 6, background: '#4338ca', color: '#ffffff', border: 'none',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print Disbursement Voucher
              </button>
              <button
                data-testid="close-voucher-modal-btn"
                onClick={() => setSelectedVoucherForView(null)}
                style={{
                  padding: '8px 16px', borderRadius: 6, background: '#f1f5f9', color: '#334155',
                  border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
