'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, DollarSign, Search, Filter, CheckCircle2,
  Calendar, ArrowUpRight, TrendingUp, FileText, Download,
  Percent, ShieldCheck, Tag, CreditCard, Banknote,
  Building2, Plus, X, Printer, Check, RefreshCw,
  AlertTriangle, Eye, ChevronRight, QrCode, Clock,
  Receipt, ArrowRight, ShieldAlert, Sparkles, LayoutGrid, List
} from 'lucide-react';
import {
  useBillingStore, usePatientStore, useUIStore,
  useQueueStore, BillRecord, PaymentMode, BillingStatus
} from '@/store';

export default function AdminBillingPage() {
  const { bills, addBill, updateBill } = useBillingStore();
  const { patients } = usePatientStore();
  const { queue } = useQueueStore();
  const { addNotification } = useUIStore();

  // Search, Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE' | 'AMOUNT_DESC' | 'BALANCE_DESC' | 'NAME'>('DATE');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Modals State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<BillRecord | null>(null);

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedBillForCollect, setSelectedBillForCollect] = useState<BillRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<PaymentMode>('UPI');
  const [collectNotes, setCollectNotes] = useState('');

  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [newBillForm, setNewBillForm] = useState({
    patientId: '',
    patientName: '',
    mrdNumber: '',
    doctorName: 'Dr. Raj Valaki',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI' as PaymentMode,
    status: 'PAID' as BillingStatus,
    discount: 0,
    collectedAmount: 0,
    items: [
      { id: 'item-1', name: 'Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }
    ]
  });

  // Top Financial KPIs Aggregations
  const totalInvoiced = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.netAmount || 0), 0);
  }, [bills]);

  const totalCollected = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.collectedAmount || 0), 0);
  }, [bills]);

  const totalOutstanding = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.balance || 0), 0);
  }, [bills]);

  const totalDiscountsGiven = useMemo(() => {
    return bills.reduce((sum, b) => {
      const itemDiscounts = b.items?.reduce((ds, it) => ds + (it.discount || 0), 0) || 0;
      return sum + itemDiscounts;
    }, 0);
  }, [bills]);

  const totalFocWaivers = useMemo(() => {
    return bills.filter(b => b.status === 'FOC').reduce((sum, b) => sum + b.netAmount, 0);
  }, [bills]);

  const paidCount = useMemo(() => bills.filter(b => b.status === 'PAID').length, [bills]);
  const partialCount = useMemo(() => bills.filter(b => b.status === 'PARTIAL').length, [bills]);
  const pendingCount = useMemo(() => bills.filter(b => b.status === 'PENDING').length, [bills]);
  const focCount = useMemo(() => bills.filter(b => b.status === 'FOC').length, [bills]);

  // Payment Channels Breakdown
  const channelBreakdown = useMemo(() => {
    const channels: Record<string, { count: number; totalCollected: number; totalInvoiced: number }> = {
      UPI: { count: 0, totalCollected: 0, totalInvoiced: 0 },
      CASH: { count: 0, totalCollected: 0, totalInvoiced: 0 },
      CARD: { count: 0, totalCollected: 0, totalInvoiced: 0 },
      BANK_TRANSFER: { count: 0, totalCollected: 0, totalInvoiced: 0 },
      INSURANCE: { count: 0, totalCollected: 0, totalInvoiced: 0 }
    };

    bills.forEach(b => {
      const mode = b.paymentMode || 'UPI';
      if (!channels[mode]) {
        channels[mode] = { count: 0, totalCollected: 0, totalInvoiced: 0 };
      }
      channels[mode].count += 1;
      channels[mode].totalCollected += b.collectedAmount || 0;
      channels[mode].totalInvoiced += b.netAmount || 0;
    });

    return channels;
  }, [bills]);

  // Filtered & Sorted Bills
  const filteredBills = useMemo(() => {
    const list = bills.filter(b => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.patientName.toLowerCase().includes(q) ||
        b.mrdNumber.toLowerCase().includes(q) ||
        (b.doctorName && b.doctorName.toLowerCase().includes(q)) ||
        (b.items && b.items.some(it => it.name.toLowerCase().includes(q)));

      const matchChannel = selectedChannel === 'ALL' || b.paymentMode === selectedChannel;
      const matchStatus = selectedStatus === 'ALL' || b.status === selectedStatus;

      return matchSearch && matchChannel && matchStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'AMOUNT_DESC') return b.netAmount - a.netAmount;
      if (sortBy === 'BALANCE_DESC') return b.balance - a.balance;
      if (sortBy === 'NAME') return a.patientName.localeCompare(b.patientName);
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [bills, searchTerm, selectedChannel, selectedStatus, sortBy]);

  // Open Receipt Modal
  const handleOpenReceipt = (bill: BillRecord) => {
    setSelectedBillForReceipt(bill);
    setIsReceiptModalOpen(true);
  };

  // Open Payment Settle Modal
  const handleOpenCollect = (bill: BillRecord) => {
    setSelectedBillForCollect(bill);
    setCollectAmount(bill.balance > 0 ? bill.balance : bill.netAmount);
    setCollectMode(bill.paymentMode || 'UPI');
    setCollectNotes(`Settlement for ${bill.invoiceNumber}`);
    setIsCollectModalOpen(true);
  };

  // Commit Payment Collection to Store
  const handleCommitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForCollect) return;

    const paymentVal = Number(collectAmount) || 0;
    if (paymentVal <= 0) {
      addNotification({ type: 'danger', message: 'Payment collection amount must be greater than zero.' });
      return;
    }

    const currentCollected = selectedBillForCollect.collectedAmount || 0;
    const currentBalance = selectedBillForCollect.balance !== undefined ? selectedBillForCollect.balance : (selectedBillForCollect.netAmount - currentCollected);
    const newCollected = currentCollected + paymentVal;
    const newBalance = Math.max(0, currentBalance - paymentVal);
    const newStatus: BillingStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    updateBill(selectedBillForCollect.id, {
      collectedAmount: newCollected,
      balance: newBalance,
      status: newStatus,
      paymentMode: collectMode
    });

    addNotification({
      type: 'success',
      message: `₹${paymentVal} collected via ${collectMode} for ${selectedBillForCollect.invoiceNumber}. New Status: ${newStatus}.`
    });

    setIsCollectModalOpen(false);
  };

  // Create Bill Submission
  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillForm.patientName) {
      addNotification({ type: 'danger', message: 'Patient name is required.' });
      return;
    }

    const subtotal = newBillForm.items.reduce((s, it) => s + (Number(it.unitPrice) * Number(it.quantity)), 0);
    const discount = Number(newBillForm.discount) || 0;
    const net = Math.max(0, subtotal - discount);
    const collected = newBillForm.status === 'PAID' ? net : (Number(newBillForm.collectedAmount) || 0);
    const balance = newBillForm.status === 'FOC' ? 0 : Math.max(0, net - collected);
    const finalStatus: BillingStatus = newBillForm.status === 'FOC' ? 'FOC' : (balance === 0 ? 'PAID' : (collected > 0 ? 'PARTIAL' : 'PENDING'));

    addBill({
      patientId: newBillForm.patientId || `pat-${Date.now()}`,
      patientName: newBillForm.patientName,
      mrdNumber: newBillForm.mrdNumber || 'MRD-2026-0099',
      doctorName: newBillForm.doctorName,
      date: newBillForm.date,
      netAmount: net,
      collectedAmount: newBillForm.status === 'FOC' ? 0 : collected,
      balance: balance,
      status: finalStatus,
      paymentMode: newBillForm.paymentMode,
      items: newBillForm.items.map((it, idx) => ({
        id: `it-${Date.now()}-${idx}`,
        name: it.name,
        unitPrice: Number(it.unitPrice),
        quantity: Number(it.quantity),
        discount: 0,
        total: Number(it.unitPrice) * Number(it.quantity)
      }))
    });

    addNotification({
      type: 'success',
      message: `Invoice created successfully for ${newBillForm.patientName} (₹${net} via ${newBillForm.paymentMode}).`
    });

    setIsCreateBillModalOpen(false);
  };

  // Export Financial Ledger CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Invoice Number', 'Date', 'Patient Name', 'MRD Number', 'Doctor', 'Payment Channel', 'Status', 'Gross Subtotal', 'Discount Waiver', 'Net Invoiced', 'Collected Amount', 'Balance Due'].join(',')
    ];

    filteredBills.forEach(b => {
      const subtotal = b.items?.reduce((s, it) => s + (it.unitPrice * it.quantity), 0) || b.netAmount;
      const discount = b.items?.reduce((s, it) => s + (it.discount || 0), 0) || 0;
      csvRows.push([
        `"${b.invoiceNumber}"`,
        `"${b.date}"`,
        `"${b.patientName}"`,
        `"${b.mrdNumber}"`,
        `"${b.doctorName || 'Dr. Raj Valaki'}"`,
        `"${b.paymentMode || 'UPI'}"`,
        `"${b.status}"`,
        subtotal,
        discount,
        b.netAmount,
        b.collectedAmount,
        b.balance
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MedFlow-Billing-Ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      message: `Exported ${filteredBills.length} billing records with all payment channels and statuses.`
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Top Header & Actions Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
              Financial Governance
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>• Multi-Channel Revenue & Status Split-Tender Audit</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.65rem)', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, wordBreak: 'break-word' }}>
            <Wallet size={26} color="#059669" style={{ flexShrink: 0 }} /> Financial Governance & Master Billing Audit
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.86rem', lineHeight: 1.4 }}>
            Comprehensive cashiering across all payment channels (UPI, Cash, Card POS, Bank Transfer, Insurance) and lifecycle statuses (PAID, PARTIAL, PENDING, FOC).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setIsCreateBillModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} /> + Create New Invoice
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={16} /> Export Financial Ledger
          </button>
        </div>
      </div>

      {/* 5 Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 195px), 1fr))', gap: 12, marginBottom: 18, width: '100%', boxSizing: 'border-box' }}>
        
        {/* Gross Invoiced */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', minWidth: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Gross Invoiced</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
              <Receipt size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
            Across {bills.length} total outpatient invoices
          </div>
        </div>

        {/* Collected Collections */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', minWidth: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>Net Collected Revenue</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2, fontWeight: 700 }}>
            {totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : 0}% Realization Rate
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', minWidth: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: totalOutstanding > 0 ? '#DC2626' : '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Pending Receivables</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
              <Clock size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: totalOutstanding > 0 ? '#DC2626' : '#0F172A', marginTop: 4 }}>
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: totalOutstanding > 0 ? '#B91C1C' : '#64748b', marginTop: 2, fontWeight: 600 }}>
            {partialCount} Partial • {pendingCount} Pending Bills
          </div>
        </div>

        {/* Discounts & Waivers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', minWidth: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 800, textTransform: 'uppercase' }}>Discounts & Waivers</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
              <Percent size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            ₹{(totalDiscountsGiven + totalFocWaivers).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: 2 }}>
            Doctor Auth Waivers & {focCount} FOC Cases
          </div>
        </div>

        {/* Status Lifecycle Summary */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', minWidth: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 800, textTransform: 'uppercase' }}>Status Health</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', flexShrink: 0 }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.3rem)', fontWeight: 800, color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#16a34a' }}>{paidCount} Paid</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>/</span>
            <span style={{ color: '#d97706' }}>{partialCount + pendingCount} Due</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
            {bills.length} Total Master Audit Records
          </div>
        </div>
      </div>

      {/* Payment Channel Collections Breakdown Strip */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Payment Channel Collections Breakdown</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>(Click channel to filter ledger)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Active Filter: <strong>{selectedChannel}</strong></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, width: '100%', boxSizing: 'border-box' }}>
          
          {/* ALL CHANNELS */}
          <div
            onClick={() => setSelectedChannel('ALL')}
            style={{
              background: selectedChannel === 'ALL' ? '#0f172a' : '#ffffff',
              color: selectedChannel === 'ALL' ? '#ffffff' : '#0f172a',
              border: `1px solid ${selectedChannel === 'ALL' ? '#0f172a' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 0,
              boxShadow: selectedChannel === 'ALL' ? '0 4px 6px -1px rgba(15, 23, 42, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, opacity: 0.85 }}>ALL CHANNELS</span>
              <Wallet size={15} style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {bills.length} Invoices Across Channels
            </div>
          </div>

          {/* UPI */}
          <div
            onClick={() => setSelectedChannel('UPI')}
            style={{
              background: selectedChannel === 'UPI' ? '#ECFDF5' : '#ffffff',
              border: `2px solid ${selectedChannel === 'UPI' ? '#059669' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065F46' }}>UPI / DYNAMIC QR</span>
              <QrCode size={15} color="#059669" style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
              ₹{(channelBreakdown.UPI?.totalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {channelBreakdown.UPI?.count || 0} Bills • App Settlement
            </div>
          </div>

          {/* CASH */}
          <div
            onClick={() => setSelectedChannel('CASH')}
            style={{
              background: selectedChannel === 'CASH' ? '#EFF6FF' : '#ffffff',
              border: `2px solid ${selectedChannel === 'CASH' ? '#0284c7' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369A1' }}>CASH COUNTER</span>
              <Banknote size={15} color="#0284c7" style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
              ₹{(channelBreakdown.CASH?.totalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#0284c7', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {channelBreakdown.CASH?.count || 0} Bills • Physical Desk
            </div>
          </div>

          {/* CARD POS */}
          <div
            onClick={() => setSelectedChannel('CARD')}
            style={{
              background: selectedChannel === 'CARD' ? '#FDF2F8' : '#ffffff',
              border: `2px solid ${selectedChannel === 'CARD' ? '#BE185D' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9D174D' }}>CARD POS TERMINAL</span>
              <CreditCard size={15} color="#BE185D" style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#BE185D', marginTop: 4 }}>
              ₹{(channelBreakdown.CARD?.totalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9D174D', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {channelBreakdown.CARD?.count || 0} Bills • POS Swipe/Tap
            </div>
          </div>

          {/* BANK TRANSFER */}
          <div
            onClick={() => setSelectedChannel('BANK_TRANSFER')}
            style={{
              background: selectedChannel === 'BANK_TRANSFER' ? '#EEF2FF' : '#ffffff',
              border: `2px solid ${selectedChannel === 'BANK_TRANSFER' ? '#4338CA' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3730A3' }}>BANK TRANSFER / NEFT</span>
              <Building2 size={15} color="#4338CA" style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4338CA', marginTop: 4 }}>
              ₹{(channelBreakdown.BANK_TRANSFER?.totalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#3730A3', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {channelBreakdown.BANK_TRANSFER?.count || 0} Bills • Wire/NEFT
            </div>
          </div>

          {/* INSURANCE / TPA */}
          <div
            onClick={() => setSelectedChannel('INSURANCE')}
            style={{
              background: selectedChannel === 'INSURANCE' ? '#F0FDFA' : '#ffffff',
              border: `2px solid ${selectedChannel === 'INSURANCE' ? '#0D9488' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#115E59' }}>INSURANCE / TPA</span>
              <ShieldCheck size={15} color="#0D9488" style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0D9488', marginTop: 4 }}>
              ₹{(channelBreakdown.INSURANCE?.totalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#115E59', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {channelBreakdown.INSURANCE?.count || 0} Bills • Cashless Auth
            </div>
          </div>

        </div>
      </div>

      {/* Filter, Search & Status Navigation Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 18, width: '100%', boxSizing: 'border-box' }}>
        
        {/* Row 1: Search & Channel / Status Selectors */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ flex: '1 1 240px', minWidth: 'min(100%, 240px)', position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Bill #, Patient Name, MRD, Doctor, or Service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 8, flex: '1 1 auto' }}>
            {/* Payment Channel Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                Payment Channel
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#1e293b'
                }}
              >
                <option value="ALL">All Payment Channels</option>
                <option value="UPI">UPI / Dynamic QR</option>
                <option value="CASH">Cash Counter</option>
                <option value="CARD">Card POS Terminal</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="INSURANCE">Insurance / TPA Cashless</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                Billing Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#1e293b'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">PAID (Settled)</option>
                <option value="PARTIAL">PARTIAL (Split Balance)</option>
                <option value="PENDING">PENDING (Unpaid)</option>
                <option value="FOC">FOC (Fee Waived)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#1e293b'
                }}
              >
                <option value="DATE">Date (Latest First)</option>
                <option value="AMOUNT_DESC">Highest Amount</option>
                <option value="BALANCE_DESC">Highest Balance Due</option>
                <option value="NAME">Patient Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Status Quick Filter Chips & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>Filter Status:</span>
            {[
              { id: 'ALL', label: 'All Statuses', count: bills.length },
              { id: 'PAID', label: 'PAID (Settled)', count: paidCount, color: '#15803d', bg: '#dcfce7' },
              { id: 'PARTIAL', label: 'PARTIAL (Split Due)', count: partialCount, color: '#b45309', bg: '#fef3c7' },
              { id: 'PENDING', label: 'PENDING (Unpaid)', count: pendingCount, color: '#dc2626', bg: '#fee2e2' },
              { id: 'FOC', label: 'FOC (100% Waived)', count: focCount, color: '#6366f1', bg: '#eef2ff' },
            ].map(st => {
              const isSelected = selectedStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    border: `1px solid ${isSelected ? (st.color || '#0284c7') : '#cbd5e1'}`,
                    background: isSelected ? (st.bg || '#eff6ff') : '#ffffff',
                    color: isSelected ? (st.color || '#0284c7') : '#64748b',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredBills.length}</strong> of {bills.length} invoices
            </span>

            {/* View Mode Toggle Button */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
              <button
                onClick={() => setViewMode('TABLE')}
                title="Full 11-Col Tabular Audit View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                  color: viewMode === 'TABLE' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'TABLE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <List size={13} /> Table
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                title="Adaptive Mobile / Tablet Card View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                  color: viewMode === 'CARDS' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'CARDS' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <LayoutGrid size={13} /> Cards
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Master Transactions & Billing Ledger Container */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', width: '100%', boxSizing: 'border-box' }}>
        
        {filteredBills.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <Receipt size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#475569' }}>No billing invoices match current criteria</div>
            <div style={{ fontSize: '0.82rem', marginTop: 4 }}>Try clearing the search query or resetting payment channel and status filters.</div>
            <button
              onClick={() => { setSearchTerm(''); setSelectedChannel('ALL'); setSelectedStatus('ALL'); }}
              style={{ marginTop: 14, padding: '6px 14px', borderRadius: 6, background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'CARDS' ? (
          
          /* ADAPTIVE RESPONSIVE CARD VIEW (Optimal for mobile and tablet touch screens) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 12, padding: 14 }}>
            {filteredBills.map((b) => {
              const subtotal = b.items?.reduce((s, it) => s + (it.unitPrice * it.quantity), 0) || b.netAmount;
              const discount = b.items?.reduce((s, it) => s + (it.discount || 0), 0) || 0;
              const hasRemaining = (b.balance || 0) > 0 || b.status === 'PENDING';

              return (
                <div
                  key={b.id}
                  data-testid="billing-card-item"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{b.patientName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem', color: '#4338ca', background: '#eef2ff', padding: '1px 5px', borderRadius: 4 }}>
                          {b.invoiceNumber}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>MRD: {b.mrdNumber}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{b.date} • {b.doctorName || 'Dr. Raj Valaki'}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background:
                          b.status === 'PAID' ? '#DCFCE7' :
                          b.status === 'PARTIAL' ? '#FEF3C7' :
                          b.status === 'PENDING' ? '#FEE2E2' : '#EEF2FF',
                        color:
                          b.status === 'PAID' ? '#15803D' :
                          b.status === 'PARTIAL' ? '#B45309' :
                          b.status === 'PENDING' ? '#DC2626' : '#4338CA'
                      }}>
                        {b.status}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '1px 6px',
                        borderRadius: 4
                      }}>
                        {b.paymentMode || 'UPI'}
                      </span>
                    </div>
                  </div>

                  {/* Services List */}
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, fontSize: '0.76rem', color: '#334155' }}>
                    {b.items && b.items.length > 0 ? (
                      b.items.map((it, idx) => (
                        <div key={idx} style={{ lineHeight: 1.35 }}>
                          • {it.name} ({it.quantity}x ₹{it.unitPrice})
                        </div>
                      ))
                    ) : (
                      <div>• Outpatient Clinical Services</div>
                    )}
                  </div>

                  {/* Financial Numbers Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.78rem', background: '#fafbfc', padding: 8, borderRadius: 6 }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>Net Bill</span>
                      <strong style={{ color: '#0f172a' }}>₹{b.netAmount}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#059669', fontSize: '0.68rem', display: 'block' }}>Collected</span>
                      <strong style={{ color: '#059669' }}>₹{b.collectedAmount || 0}</strong>
                    </div>
                    <div>
                      <span style={{ color: (b.balance || 0) > 0 ? '#dc2626' : '#64748b', fontSize: '0.68rem', display: 'block' }}>Balance</span>
                      <strong style={{ color: (b.balance || 0) > 0 ? '#dc2626' : '#16a34a' }}>₹{b.balance || 0}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
                    {hasRemaining && (
                      <button
                        data-testid="settle-bill-action-btn"
                        onClick={() => handleOpenCollect(b)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 12px',
                          borderRadius: 6,
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <DollarSign size={13} /> Settle Balance
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenReceipt(b)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 12px',
                        borderRadius: 6,
                        background: '#eff6ff',
                        color: '#0284c7',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Printer size={13} /> View Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          /* FULL 11-COLUMN TABULAR VIEW WITH DEDICATED HORIZONTAL SCROLLER */
          <div className="billing-responsive-table-scroll" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ minWidth: 1240, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', minWidth: 175, whiteSpace: 'nowrap' }}>Invoice & Patient</th>
                  <th style={{ padding: '12px 14px', minWidth: 140, whiteSpace: 'nowrap' }}>Attending Physician</th>
                  <th style={{ padding: '12px 14px', minWidth: 200 }}>Services Rendered</th>
                  <th style={{ padding: '12px 14px', minWidth: 95, whiteSpace: 'nowrap' }}>Gross Total</th>
                  <th style={{ padding: '12px 14px', minWidth: 95, whiteSpace: 'nowrap' }}>Discount</th>
                  <th style={{ padding: '12px 14px', minWidth: 100, whiteSpace: 'nowrap' }}>Net Invoiced</th>
                  <th style={{ padding: '12px 14px', minWidth: 95, whiteSpace: 'nowrap' }}>Collected</th>
                  <th style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>Balance Due</th>
                  <th style={{ padding: '12px 14px', minWidth: 130, whiteSpace: 'nowrap' }}>Payment Channel</th>
                  <th style={{ padding: '12px 14px', minWidth: 105, whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '12px 14px', minWidth: 165, textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => {
                  const subtotal = b.items?.reduce((s, it) => s + (it.unitPrice * it.quantity), 0) || b.netAmount;
                  const discount = b.items?.reduce((s, it) => s + (it.discount || 0), 0) || 0;
                  const hasRemaining = (b.balance || 0) > 0 || b.status === 'PENDING';

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      
                      {/* Invoice & Patient */}
                      <td style={{ padding: '12px 14px', minWidth: 175 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                          {b.patientName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem', color: '#4338ca', background: '#eef2ff', padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {b.invoiceNumber}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            MRD: {b.mrdNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <Calendar size={11} /> {b.date}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td style={{ padding: '12px 14px', minWidth: 140, whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#334155' }}>
                        <div style={{ fontWeight: 700 }}>{b.doctorName || 'Dr. Raj Valaki'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>OPD Consultation</div>
                      </td>

                      {/* Services Items */}
                      <td style={{ padding: '12px 14px', minWidth: 200, maxWidth: 260, fontSize: '0.76rem', color: '#334155' }}>
                        {b.items && b.items.length > 0 ? (
                          b.items.map((it, idx) => (
                            <div key={idx} style={{ lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              • {it.name} ({it.quantity}x ₹{it.unitPrice})
                            </div>
                          ))
                        ) : (
                          <div>• Outpatient Clinical Services</div>
                        )}
                      </td>

                      {/* Gross Subtotal */}
                      <td style={{ padding: '12px 14px', minWidth: 95, whiteSpace: 'nowrap', fontWeight: 600, color: '#334155' }}>
                        ₹{subtotal.toFixed(0)}
                      </td>

                      {/* Discount Waiver */}
                      <td style={{ padding: '12px 14px', minWidth: 95, whiteSpace: 'nowrap' }}>
                        {discount > 0 ? (
                          <div>
                            <span style={{ fontWeight: 800, color: '#d97706', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                              -₹{discount}
                            </span>
                            <span style={{ fontSize: '0.66rem', background: '#FEF3C7', color: '#B45309', padding: '1px 4px', borderRadius: 4, display: 'inline-block', marginTop: 2, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              Authorized
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Net Invoiced */}
                      <td style={{ padding: '12px 14px', minWidth: 100, whiteSpace: 'nowrap', fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                        ₹{b.netAmount}
                      </td>

                      {/* Collected */}
                      <td style={{ padding: '12px 14px', minWidth: 95, whiteSpace: 'nowrap', fontWeight: 800, color: '#059669', fontSize: '0.94rem' }}>
                        ₹{b.collectedAmount || 0}
                      </td>

                      {/* Balance Due */}
                      <td style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>
                        {(b.balance || 0) > 0 ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            background: '#fee2e2',
                            color: '#dc2626',
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
                            ₹{b.balance} Due
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                            ₹0 (Settled)
                          </span>
                        )}
                      </td>

                      {/* Payment Channel Badge */}
                      <td style={{ padding: '12px 14px', minWidth: 130, whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          background:
                            b.paymentMode === 'UPI' ? '#ECFDF5' :
                            b.paymentMode === 'CASH' ? '#EFF6FF' :
                            b.paymentMode === 'CARD' ? '#FDF2F8' :
                            b.paymentMode === 'BANK_TRANSFER' ? '#EEF2FF' : '#F0FDFA',
                          color:
                            b.paymentMode === 'UPI' ? '#059669' :
                            b.paymentMode === 'CASH' ? '#0284c7' :
                            b.paymentMode === 'CARD' ? '#be185d' :
                            b.paymentMode === 'BANK_TRANSFER' ? '#4338ca' : '#0d9488'
                        }}>
                          {b.paymentMode === 'UPI' && <QrCode size={13} />}
                          {b.paymentMode === 'CASH' && <Banknote size={13} />}
                          {b.paymentMode === 'CARD' && <CreditCard size={13} />}
                          {b.paymentMode === 'BANK_TRANSFER' && <Building2 size={13} />}
                          {b.paymentMode === 'INSURANCE' && <ShieldCheck size={13} />}
                          {b.paymentMode || 'UPI'}
                        </span>
                      </td>

                      {/* Billing Status Badge */}
                      <td style={{ padding: '12px 14px', minWidth: 105, whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          background:
                            b.status === 'PAID' ? '#DCFCE7' :
                            b.status === 'PARTIAL' ? '#FEF3C7' :
                            b.status === 'PENDING' ? '#FEE2E2' : '#EEF2FF',
                          color:
                            b.status === 'PAID' ? '#15803D' :
                            b.status === 'PARTIAL' ? '#B45309' :
                            b.status === 'PENDING' ? '#DC2626' : '#4338CA'
                        }}>
                          {b.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '12px 14px', minWidth: 165, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, whiteSpace: 'nowrap' }}>
                          
                          {/* Settle Balance Button */}
                          {hasRemaining && (
                            <button
                              data-testid="settle-bill-action-btn"
                              onClick={() => handleOpenCollect(b)}
                              title="Collect / Settle Balance"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                borderRadius: 6,
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              <DollarSign size={12} /> Settle
                            </button>
                          )}

                          {/* Print Receipt Button */}
                          <button
                            onClick={() => handleOpenReceipt(b)}
                            title="View Tax Receipt"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: '#eff6ff',
                              color: '#0284c7',
                              border: '1px solid #bfdbfe',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            <Printer size={12} /> Receipt
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL 1: OFFICIAL TAX INVOICE & RECEIPT */}
      {isReceiptModalOpen && selectedBillForReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 14 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 'min(94vw, 620px)', maxHeight: '92vh', overflowY: 'auto', padding: '22px 24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}>
            
            {/* Receipt Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  MEDFLOW HEALTHCARE CLINIC
                </h2>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                  Plot 42, Ellis Bridge Medical Enclave, Ahmedabad, Gujarat • GSTIN: 24AAACM4982K1Z5
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                  Official Outpatient Tax Invoice / Cash Receipt
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 900, background: '#eff6ff', color: '#0284c7', padding: '3px 8px', borderRadius: 4 }}>
                  {selectedBillForReceipt.invoiceNumber}
                </span>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  Date: {selectedBillForReceipt.date}
                </div>
              </div>
            </div>

            {/* Patient & Doctor Demographics */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.8rem' }}>
                <div><strong>Patient Name:</strong> {selectedBillForReceipt.patientName}</div>
                <div><strong>MRD Number:</strong> {selectedBillForReceipt.mrdNumber}</div>
                <div><strong>Attending Physician:</strong> {selectedBillForReceipt.doctorName || 'Dr. Raj Valaki'}</div>
                <div><strong>Payment Channel:</strong> <span style={{ fontWeight: 800, color: '#059669' }}>{selectedBillForReceipt.paymentMode || 'UPI'}</span></div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: 14, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '7px 8px' }}>Description of Service</th>
                    <th style={{ padding: '7px 8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '7px 8px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '7px 8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBillForReceipt.items && selectedBillForReceipt.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600 }}>{it.name}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right' }}>₹{it.unitPrice}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>₹{it.unitPrice * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Ledger Calculation */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gross Services Subtotal:</span>
                  <strong>₹{selectedBillForReceipt.items?.reduce((s, it) => s + (it.unitPrice * it.quantity), 0) || selectedBillForReceipt.netAmount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                  <span>Doctor Authorized Waiver / Discount:</span>
                  <strong>-₹{selectedBillForReceipt.items?.reduce((ds, it) => ds + (it.discount || 0), 0) || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 5, fontSize: '0.9rem' }}>
                  <span><strong>Net Invoice Amount:</strong></span>
                  <strong style={{ color: '#0f172a' }}>₹{selectedBillForReceipt.netAmount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontSize: '0.9rem' }}>
                  <span><strong>Total Amount Paid ({selectedBillForReceipt.paymentMode || 'UPI'}):</strong></span>
                  <strong>₹{selectedBillForReceipt.collectedAmount || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 5, fontSize: '0.9rem' }}>
                  <span><strong>Remaining Balance Due:</strong></span>
                  <strong style={{ color: (selectedBillForReceipt.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>
                    ₹{selectedBillForReceipt.balance || 0} ({selectedBillForReceipt.status})
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} /> Print Official Receipt
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: COLLECT PAYMENT / SETTLE BALANCE */}
      {isCollectModalOpen && selectedBillForCollect && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 14 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 'min(94vw, 460px)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}>
            
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#065F46' }}>
                    Collect Payment & Settle Invoice
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                    {selectedBillForCollect.invoiceNumber} • {selectedBillForCollect.patientName}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsCollectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCommitPayment} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Current Balances Header */}
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', flexWrap: 'wrap', gap: 6 }}>
                <div>Total: <strong>₹{selectedBillForCollect.netAmount}</strong></div>
                <div>Paid: <strong style={{ color: '#059669' }}>₹{selectedBillForCollect.collectedAmount || 0}</strong></div>
                <div>Balance Due: <strong style={{ color: '#dc2626' }}>₹{selectedBillForCollect.balance || 0}</strong></div>
              </div>

              {/* Amount to Collect Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '2px solid #059669', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}
                />
              </div>

              {/* Payment Channel Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: 5 }}>
                  Select Payment Channel *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: 6 }}>
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CASH', label: 'Cash Desk', icon: Banknote },
                    { id: 'CARD', label: 'Card POS', icon: CreditCard },
                    { id: 'BANK_TRANSFER', label: 'Bank NEFT', icon: Building2 },
                    { id: 'INSURANCE', label: 'Insurance', icon: ShieldCheck },
                  ].map(ch => {
                    const isSelected = collectMode === ch.id;
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setCollectMode(ch.id as PaymentMode)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 3,
                          padding: '8px 4px',
                          borderRadius: 6,
                          border: `2px solid ${isSelected ? '#059669' : '#e2e8f0'}`,
                          background: isSelected ? '#ecfdf5' : '#ffffff',
                          color: isSelected ? '#065f46' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon size={15} />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI Live QR Simulator if UPI selected */}
              {collectMode === 'UPI' && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#065f46' }}>
                    <QrCode size={15} /> MedFlow Dynamic UPI Standee Active
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: 2 }}>
                    UPI VPA: <strong>medflow.clinic@okaxis</strong> • ₹{collectAmount}
                  </div>
                </div>
              )}

              {/* Settle Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                  Transaction / Teller Reference
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="e.g. UPI Ref #9021481 / POS Auth Code"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Commit ₹{collectAmount} Collection ➔
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW OPD INVOICE */}
      {isCreateBillModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 14 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 'min(94vw, 560px)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}>
            
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0F9FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0C4A6E' }}>
                  Generate New Outpatient Invoice
                </h3>
              </div>
              <button onClick={() => setIsCreateBillModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBill} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Select Existing Patient or Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Select Registered Patient *
                </label>
                <select
                  value={newBillForm.patientId}
                  onChange={(e) => {
                    const found = patients.find(p => p.id === e.target.value);
                    if (found) {
                      setNewBillForm(f => ({
                        ...f,
                        patientId: found.id,
                        patientName: `${found.firstName} ${found.lastName}`,
                        mrdNumber: found.mrdNumber
                      }));
                    }
                  }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  <option value="">-- Choose Patient from Registry --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrdNumber}) - {p.mobile}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Name fallback */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newBillForm.patientName}
                    onChange={(e) => setNewBillForm(f => ({ ...f, patientName: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>MRD Number</label>
                  <input
                    type="text"
                    value={newBillForm.mrdNumber}
                    onChange={(e) => setNewBillForm(f => ({ ...f, mrdNumber: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Attending Physician */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Attending Doctor</label>
                <select
                  value={newBillForm.doctorName}
                  onChange={(e) => setNewBillForm(f => ({ ...f, doctorName: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  <option value="Dr. Raj Valaki">Dr. Raj Valaki (Dermatology)</option>
                  <option value="Dr. Anita Soni">Dr. Anita Soni (General Medicine)</option>
                  <option value="Dr. Priya Mehta">Dr. Priya Mehta (Gynecology)</option>
                  <option value="Dr. Suresh Kumar">Dr. Suresh Kumar (Orthopedics)</option>
                </select>
              </div>

              {/* Dynamic Line Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155' }}>Billable Line Items</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBillForm(f => ({
                        ...f,
                        items: [...f.items, { id: `it-${Date.now()}`, name: 'Procedure / Medication', unitPrice: 500, quantity: 1, discount: 0, total: 500 }]
                      }));
                    }}
                    style={{ fontSize: '0.74rem', color: '#0284c7', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {newBillForm.items.map((it, idx) => (
                    <div key={it.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) minmax(70px, 1fr) minmax(50px, 1fr) auto', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Service / Medicine Name"
                        value={it.name}
                        onChange={(e) => {
                          const updated = [...newBillForm.items];
                          updated[idx].name = e.target.value;
                          setNewBillForm(f => ({ ...f, items: updated }));
                        }}
                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Rate ₹"
                        value={it.unitPrice}
                        onChange={(e) => {
                          const updated = [...newBillForm.items];
                          updated[idx].unitPrice = Number(e.target.value);
                          setNewBillForm(f => ({ ...f, items: updated }));
                        }}
                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => {
                          const updated = [...newBillForm.items];
                          updated[idx].quantity = Number(e.target.value);
                          setNewBillForm(f => ({ ...f, items: updated }));
                        }}
                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                      {newBillForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewBillForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Waiver */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Fee Discount Waiver (₹)</label>
                  <input
                    type="number"
                    value={newBillForm.discount}
                    onChange={(e) => setNewBillForm(f => ({ ...f, discount: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Payment Channel</label>
                  <select
                    data-testid="new-bill-payment-mode"
                    value={newBillForm.paymentMode}
                    onChange={(e) => setNewBillForm(f => ({ ...f, paymentMode: e.target.value as PaymentMode }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="UPI">UPI / Dynamic QR</option>
                    <option value="CASH">Cash Counter</option>
                    <option value="CARD">Card POS</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="INSURANCE">Insurance / TPA Cashless</option>
                  </select>
                </div>
              </div>

              {/* Status & Collection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Billing Status</label>
                  <select
                    value={newBillForm.status}
                    onChange={(e) => setNewBillForm(f => ({ ...f, status: e.target.value as BillingStatus }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="PAID">PAID (Full Settle)</option>
                    <option value="PARTIAL">PARTIAL (Split Balance)</option>
                    <option value="PENDING">PENDING (Unpaid Checkout)</option>
                    <option value="FOC">FOC (100% Free Waiver)</option>
                  </select>
                </div>
                {newBillForm.status === 'PARTIAL' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Amount Collected Now (₹)</label>
                    <input
                      type="number"
                      value={newBillForm.collectedAmount}
                      onChange={(e) => setNewBillForm(f => ({ ...f, collectedAmount: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateBillModalOpen(false)}
                  style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Generate Invoice & Commit ➔
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
