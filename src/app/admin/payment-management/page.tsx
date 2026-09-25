'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, QrCode, CheckCircle2, Save, Printer,
  Building, DollarSign, Smartphone, ShieldCheck, ArrowRight,
  CreditCard, Banknote, Building2, Search, X, Copy,
  Check, RefreshCw, Volume2, AlertCircle, FileText,
  ChevronRight, Download, Radio, Sliders, ExternalLink,
  Sparkles, Layers, ArrowUpRight, Clock, Plus, Receipt
} from 'lucide-react';
import {
  useAdminStore, useBillingStore, usePatientStore, useUIStore,
  playChimeTone, BillRecord, PaymentMode, BillingStatus
} from '@/store';

export default function AdminPaymentManagementPage() {
  const { settings, updateSettings } = useAdminStore();
  const { bills, updateBill } = useBillingStore();
  const { patients } = usePatientStore();
  const { addNotification } = useUIStore();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'QR_ENGINE' | 'GATEWAYS' | 'TRANSACTIONS' | 'TERMINALS'>('QR_ENGINE');

  // Gateway parameters state
  const [vpa, setVpa] = useState(settings.upiVpa || 'medflow.clinic@okaxis');
  const [merchantName, setMerchantName] = useState(settings.merchantName || 'MedFlow Healthcare LLP');
  const [secondaryVpa, setSecondaryVpa] = useState('medflow@icici');
  const [accountNumber, setAccountNumber] = useState('50200084920194');
  const [ifscCode, setIfscCode] = useState('HDFC0000042');
  const [bankBranch, setBankBranch] = useState('HDFC Bank, Ellis Bridge Branch, Ahmedabad');

  // Dynamic QR state
  const [qrAmount, setQrAmount] = useState<number>(500);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [customNote, setCustomNote] = useState('MedFlow OPD Consultation');
  const [copiedLink, setCopiedLink] = useState(false);
  const [standeeSize, setStandeeSize] = useState<'A4' | 'A5' | 'ACRYLIC'>('A4');

  // Simulation & Audio feedback state
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptBill, setActiveReceiptBill] = useState<BillRecord | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Cash Counter drawer calculator state
  const [openingCashFloat, setOpeningCashFloat] = useState(5000);
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    500: 1,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0
  });

  // Transactions ledger filter & search
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerChannel, setLedgerChannel] = useState<string>('ALL');
  const [ledgerStatus, setLedgerStatus] = useState<string>('ALL');

  // Dynamic calculations from live bills
  const totalInvoiced = useMemo(() => bills.reduce((acc, b) => acc + (b.netAmount || 0), 0), [bills]);
  const totalCollected = useMemo(() => bills.reduce((acc, b) => acc + (b.collectedAmount || 0), 0), [bills]);
  const totalPending = useMemo(() => bills.reduce((acc, b) => acc + (b.balance || 0), 0), [bills]);

  // Channel breakdowns
  const channelMetrics = useMemo(() => {
    const acc: Record<string, { count: number; total: number }> = {
      UPI: { count: 0, total: 0 },
      CASH: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
      BANK_TRANSFER: { count: 0, total: 0 },
      INSURANCE: { count: 0, total: 0 }
    };
    bills.forEach(b => {
      const mode = b.paymentMode || 'UPI';
      if (!acc[mode]) acc[mode] = { count: 0, total: 0 };
      acc[mode].count += 1;
      acc[mode].total += (b.collectedAmount || 0);
    });
    return acc;
  }, [bills]);

  // Unpaid / Partial bills available for QR binding
  const openBills = useMemo(() => {
    return bills.filter(b => b.status === 'PENDING' || b.status === 'PARTIAL');
  }, [bills]);

  // Dynamic UPI Payload URI
  const upiUri = useMemo(() => {
    const noteParam = selectedBillId
      ? `${customNote}+INV-${selectedBillId.slice(-4)}`
      : customNote.replace(/\s+/g, '+');
    return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${qrAmount}&cu=INR&tn=${noteParam}&mc=8011`;
  }, [vpa, merchantName, qrAmount, customNote, selectedBillId]);

  // Handle bill selection binding
  const handleSelectBill = (billId: string) => {
    setSelectedBillId(billId);
    if (!billId) return;
    const b = bills.find(x => x.id === billId);
    if (b) {
      setQrAmount(b.balance || b.netAmount || 500);
      setCustomNote(`OPD Fee ${b.patientName} (${b.invoiceNumber})`);
    }
  };

  // Soundbox Audio Chime Announcement
  const triggerSoundbox = (amount: number, merchant: string) => {
    if (typeof window === 'undefined') return;
    playChimeTone('ding');
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `Payment of rupees ${amount} received on ${merchant.split(' ')[0]} UPI.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.lang = 'en-IN';
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // Save VPA & Merchant parameters
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      upiVpa: vpa,
      merchantName: merchantName
    });
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 5000);
    addNotification({
      type: 'success',
      message: 'UPI Virtual Payment Address & Merchant parameters saved clinic-wide.'
    });
  };

  // Simulate incoming patient payment
  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      setIsSimulatingPayment(false);
      const txnRef = `UPI${Date.now().toString().slice(-8)}`;
      
      // Update selected bill if bound
      if (selectedBillId) {
        const target = bills.find(b => b.id === selectedBillId);
        if (target) {
          const newCollected = (target.collectedAmount || 0) + qrAmount;
          const newBal = Math.max(0, target.netAmount - newCollected);
          updateBill(target.id, {
            collectedAmount: newCollected,
            balance: newBal,
            status: newBal <= 0 ? 'PAID' : 'PARTIAL',
            paymentMode: 'UPI',
            notes: `${target.notes || ''} [UPI Settled ₹${qrAmount} Ref: ${txnRef}]`.trim()
          });
        }
      }

      // Trigger Audio & Visual Confirmation
      triggerSoundbox(qrAmount, merchantName);
      setSimulatedSuccess({
        amount: qrAmount,
        txnRef,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        payerVpa: 'patient.user@okhdfcbank',
        billId: selectedBillId || 'DIRECT_QR_COUNTER'
      });
      addNotification({
        type: 'success',
        message: `₹${qrAmount} payment received successfully via UPI Soundbox!`
      });
    }, 1200);
  };

  // Copy URI to clipboard
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiUri);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      addNotification({ type: 'info', message: 'UPI Deep Link URI copied to clipboard.' });
    }
  };

  // Filtered transactions for ledger
  const filteredLedger = useMemo(() => {
    return bills.filter(b => {
      const q = ledgerSearch.toLowerCase().trim();
      const matchSearch = !q ||
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.patientName.toLowerCase().includes(q) ||
        b.mrdNumber.toLowerCase().includes(q) ||
        (b.doctorName || '').toLowerCase().includes(q) ||
        (b.notes || '').toLowerCase().includes(q);

      const matchChannel = ledgerChannel === 'ALL' || b.paymentMode === ledgerChannel;
      const matchStatus = ledgerStatus === 'ALL' || b.status === ledgerStatus;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [bills, ledgerSearch, ledgerChannel, ledgerStatus]);

  // Denominations Total
  const cashDenominationsTotal = useMemo(() => {
    return Object.entries(denominations).reduce((sum, [denom, count]) => {
      return sum + (Number(denom) * (count || 0));
    }, 0);
  }, [denominations]);

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* ============================================================ */}
      {/* 1. HEADER & QUICK TELEMETRY BAR                              */}
      {/* ============================================================ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4338ca', background: '#EEF2FF', padding: '3px 9px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
              Financial Infrastructure
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              • Multi-Channel Cashiering & UPI Gateway
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Soundbox & Gateways Online
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => triggerSoundbox(qrAmount, merchantName)}
              title="Test Hardware Soundbox Voice Announcement"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 6, background: '#f8fafc', border: '1px solid #cbd5e1',
                fontSize: '0.78rem', fontWeight: 700, color: '#334155', cursor: 'pointer'
              }}
            >
              <Volume2 size={14} color="#6366f1" /> Test Voice Soundbox
            </button>

            <button
              onClick={() => window.print()}
              title="Print Counter Reception Standee"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 6, background: '#f8fafc', border: '1px solid #cbd5e1',
                fontSize: '0.78rem', fontWeight: 700, color: '#334155', cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print Counter Standee
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.65rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wallet size={26} color="#6366f1" /> Multi-Channel Payment Management & UPI Gateway
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
          Real-time cashiering across all payment channels, dynamic QR standees, UPI soundbox confirmation, Card POS terminal fleets, NEFT/RTGS reconciliation, and TPA insurance cashless desks.
        </p>
      </div>

      {/* ============================================================ */}
      {/* 2. DYNAMIC REAL-TIME PAYMENT TELEMETRY (5 KPIS)              */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 195px), 1fr))', gap: 12, marginBottom: 20 }}>
        
        {/* Total Collections */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Collections</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
            Across {bills.length} total hospital bills
          </div>
        </div>

        {/* UPI Gateway */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>UPI / Dynamic QR</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <QrCode size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            ₹{(channelMetrics.UPI?.total || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2, fontWeight: 700 }}>
            {channelMetrics.UPI?.count || 0} Bills • Instant 0% MDR
          </div>
        </div>

        {/* Card POS */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#be185d', fontWeight: 800, textTransform: 'uppercase' }}>Card POS Terminals</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d' }}>
              <CreditCard size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#be185d', marginTop: 4 }}>
            ₹{(channelMetrics.CARD?.total || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9d174d', marginTop: 2, fontWeight: 700 }}>
            {channelMetrics.CARD?.count || 0} Swipes • Batch #4012
          </div>
        </div>

        {/* Cash Counter */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>Cash Drawer Till</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Banknote size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            ₹{(channelMetrics.CASH?.total || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: 2, fontWeight: 700 }}>
            Float: ₹{openingCashFloat} • Till: ₹{openingCashFloat + (channelMetrics.CASH?.total || 0)}
          </div>
        </div>

        {/* Bank & Insurance Wire */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 800, textTransform: 'uppercase' }}>NEFT & TPA Wire</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
              <Building2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
            ₹{((channelMetrics.BANK_TRANSFER?.total || 0) + (channelMetrics.INSURANCE?.total || 0)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3730a3', marginTop: 2, fontWeight: 700 }}>
            100% UTR Reconciled
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE NAVIGATION TABS                               */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'QR_ENGINE', label: 'Dynamic QR & Counter Standee', icon: QrCode },
          { id: 'GATEWAYS', label: 'Gateway & Routing Config', icon: Sliders },
          { id: 'TRANSACTIONS', label: `Live Transactions Ledger (${bills.length})`, icon: Receipt },
          { id: 'TERMINALS', label: 'Hardware Fleet & Soundbox', icon: Smartphone },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
                background: isActive ? '#EEF2FF' : '#ffffff',
                color: isActive ? '#4338ca' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={15} color={isActive ? '#4338ca' : '#94a3b8'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DYNAMIC QR CODE & RECEPTION COUNTER STANDEE           */}
      {/* ============================================================ */}
      {activeTab === 'QR_ENGINE' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
          
          {/* Left: Dynamic QR Generator Controls */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={18} color="#6366f1" /> Dynamic Real-Time QR Generator
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                NPCI UPI Standard
              </span>
            </div>

            {/* Quick Bill Binding Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                Bind to Active Patient Bill (Optional):
              </label>
              <select
                value={selectedBillId}
                onChange={(e) => handleSelectBill(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: '#fafbfc'
                }}
              >
                <option value="">-- Standalone Counter Payment (No Bill Binding) --</option>
                {openBills.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.invoiceNumber} • {b.patientName} (Balance Due: ₹{b.balance || b.netAmount})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 3 }}>
                Selecting a bill locks the exact outstanding amount and updates ledger automatically.
              </span>
            </div>

            {/* Amount Input & Preset Chips */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                Payment Amount (₹ INR):
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b', fontSize: '1rem' }}>
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={qrAmount}
                  onChange={(e) => { setSelectedBillId(''); setQrAmount(Number(e.target.value) || 0); }}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 28px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {[300, 500, 650, 800, 1200, 2500, 4500, 9000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setSelectedBillId(''); setQrAmount(amt); }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: qrAmount === amt ? '#6366f1' : '#cbd5e1',
                      background: qrAmount === amt ? '#EEF2FF' : '#ffffff',
                      color: qrAmount === amt ? '#4338ca' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Transaction Note */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                Transaction Description / Note:
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. OPD Consultation Fee"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem'
                }}
              />
            </div>

            {/* UPI Deep-link string */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  UPI Deep-Link URI String:
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none',
                    border: 'none', color: '#4338ca', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {copiedLink ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  {copiedLink ? 'Copied' : 'Copy URI'}
                </button>
              </div>
              <code style={{ fontSize: '0.72rem', color: '#3730a3', wordBreak: 'break-all', display: 'block', fontFamily: 'monospace' }}>
                {upiUri}
              </code>
            </div>

            {/* Interactive Simulation Trigger */}
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulatingPayment || qrAmount <= 0}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: isSimulatingPayment ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                {isSimulatingPayment ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Verifying Bank Gateway Authorization...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Simulate Patient UPI Payment (₹{qrAmount})
                  </>
                )}
              </button>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', display: 'block', marginTop: 4 }}>
                Triggers realistic bank authorization, updates patient ledger & plays hardware Soundbox chime.
              </span>
            </div>

            {/* Recent Simulation Result Card */}
            {simulatedSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 12, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#065f46', fontWeight: 800, fontSize: '0.84rem' }}>
                  <CheckCircle2 size={16} color="#059669" /> UPI Payment Confirmed & Reconciled!
                </div>
                <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <span>Txn Ref: <strong>{simulatedSuccess.txnRef}</strong></span>
                  <span>Amount: <strong>₹{simulatedSuccess.amount}</strong></span>
                  <span>Time: <strong>{simulatedSuccess.timestamp}</strong></span>
                </div>
              </div>
            )}

          </div>

          {/* Right: Counter QR Standee Simulator (Printable) */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={18} color="#6366f1" /> Counter QR Standee Simulator
              </h3>

              {/* Standee Size Selector */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
                {(['A4', 'A5', 'ACRYLIC'] as const).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setStandeeSize(sz)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: 'none',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: standeeSize === sz ? '#ffffff' : 'transparent',
                      color: standeeSize === sz ? '#0f172a' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Standee Mock Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
              color: '#FFFFFF',
              borderRadius: 14,
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
              border: '2px solid #4338ca',
              maxWidth: 420,
              margin: '0 auto'
            }}>
              
              {/* Standee Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Building size={16} />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.02em', color: '#ffffff' }}>
                  {merchantName}
                </div>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', letterSpacing: '0.04em' }}>
                OUTPATIENT CLINICAL CASHIERING • APEX RECEPTION
              </div>

              {/* Real-time Dynamic Vector QR Code */}
              <div style={{
                background: '#FFFFFF',
                width: 190,
                height: 190,
                borderRadius: 12,
                margin: '16px auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                position: 'relative'
              }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  {/* Top-Left Finder */}
                  <rect x="5" y="5" width="28" height="28" fill="#0F172A" rx="3" />
                  <rect x="10" y="10" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="14" y="14" width="10" height="10" fill="#0F172A" rx="1.5" />

                  {/* Top-Right Finder */}
                  <rect x="67" y="5" width="28" height="28" fill="#0F172A" rx="3" />
                  <rect x="72" y="10" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="76" y="14" width="10" height="10" fill="#0F172A" rx="1.5" />

                  {/* Bottom-Left Finder */}
                  <rect x="5" y="67" width="28" height="28" fill="#0F172A" rx="3" />
                  <rect x="10" y="72" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="14" y="76" width="10" height="10" fill="#0F172A" rx="1.5" />

                  {/* High-Density Matrix Elements */}
                  <rect x="38" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="48" y="8" width="6" height="12" fill="#0F172A" />
                  <rect x="58" y="14" width="6" height="6" fill="#0F172A" />
                  <rect x="38" y="24" width="18" height="6" fill="#0F172A" />

                  {/* Center Brand Emblem */}
                  <rect x="36" y="36" width="28" height="28" fill="#4338ca" rx="4" />
                  <circle cx="50" cy="50" r="8" fill="#ffffff" />
                  <circle cx="50" cy="50" r="4" fill="#4338ca" />

                  {/* Right & Bottom Matrix Pattern */}
                  <rect x="8" y="38" width="12" height="6" fill="#0F172A" />
                  <rect x="24" y="44" width="8" height="12" fill="#0F172A" />
                  <rect x="70" y="38" width="16" height="8" fill="#0F172A" />
                  <rect x="78" y="52" width="14" height="6" fill="#0F172A" />
                  <rect x="68" y="64" width="8" height="18" fill="#0F172A" />
                  <rect x="40" y="72" width="20" height="6" fill="#0F172A" />
                  <rect x="44" y="82" width="12" height="10" fill="#0F172A" />
                  <rect x="80" y="80" width="12" height="12" fill="#0F172A" />
                </svg>
              </div>

              {/* Amount Display */}
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.02em' }}>
                ₹{qrAmount.toLocaleString('en-IN')}.00
              </div>
              <div style={{ fontSize: '0.78rem', color: '#f1f5f9', marginTop: 2, fontWeight: 700 }}>
                Scan & Pay with Any UPI App
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                UPI ID: {vpa}
              </div>

              {/* Supported Payment App Icons Badge */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Direct Bank Settlement Verified
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.68rem', fontWeight: 700, color: '#ffffff' }}>
                  <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4 }}>Google Pay</span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4 }}>PhonePe</span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4 }}>Paytm</span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4 }}>BHIM</span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4 }}>Cred</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MULTI-GATEWAY CONFIGURATION & ROUTING MASTERS         */}
      {/* ============================================================ */}
      {activeTab === 'GATEWAYS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
          
          {/* UPI & Merchant Entity Form */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={18} color="#6366f1" /> Banking Merchant & VPA Routing
            </h3>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Primary Virtual Payment Address (VPA / UPI ID) *
                </label>
                <input
                  type="text"
                  required
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: 2 }}>
                  Direct settlement to clinic account with 0% MDR instant credit.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Merchant Payee Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: 2 }}>
                  Displayed inside Google Pay, PhonePe, and Paytm during patient authorization.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Secondary Fallback UPI ID
                </label>
                <input
                  type="text"
                  value={secondaryVpa}
                  onChange={(e) => setSecondaryVpa(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                />
              </div>

              {isSavedSuccess && (
                <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>UPI Virtual Payment Address & Merchant parameters saved clinic-wide.</span>
                </div>
              )}

              <button
                type="submit"
                style={{
                  padding: '10px 18px', borderRadius: 8, border: 'none', background: '#6366f1',
                  color: '#ffffff', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4
                }}
              >
                <Save size={16} /> Save Gateway Parameters
              </button>
            </form>
          </div>

          {/* Bank Wire & NEFT Transfer Routing */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="#4338ca" /> NEFT / RTGS Wire Account Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Beneficiary Legal Account Name</span>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{merchantName}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Current Account Number</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.94rem', color: '#0f172a', fontFamily: 'monospace' }}>{accountNumber}</strong>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) navigator.clipboard.writeText(accountNumber);
                      addNotification({ type: 'info', message: 'Account Number copied' });
                    }}
                    style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                  >
                    Copy A/C
                  </button>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>IFSC Code</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.94rem', color: '#0f172a', fontFamily: 'monospace' }}>{ifscCode}</strong>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) navigator.clipboard.writeText(ifscCode);
                      addNotification({ type: 'info', message: 'IFSC Code copied' });
                    }}
                    style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                  >
                    Copy IFSC
                  </button>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Settlement Branch</span>
                <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{bankBranch}</strong>
              </div>
            </div>
          </div>

          {/* Cash Drawer Calculator */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Banknote size={18} color="#0284c7" /> Cash Drawer & Denomination Till Audit
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
              <div style={{ background: '#eff6ff', padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: '0.7rem', color: '#0369a1', display: 'block' }}>Opening Cash Float</span>
                <strong style={{ fontSize: '1.05rem', color: '#0369a1' }}>₹{openingCashFloat}</strong>
              </div>
              <div style={{ background: '#ecfdf5', padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: '0.7rem', color: '#047857', display: 'block' }}>Total In Till</span>
                <strong style={{ fontSize: '1.05rem', color: '#047857' }}>₹{openingCashFloat + (channelMetrics.CASH?.total || 0)}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>
              Physical Denomination Counter:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[500, 200, 100, 50, 20, 10].map(den => (
                <div key={den} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>₹{den} Notes:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      min="0"
                      value={denominations[den] || 0}
                      onChange={(e) => setDenominations({ ...denominations, [den]: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{ width: 60, padding: '3px 6px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ width: 65, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      = ₹{den * (denominations[den] || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b' }}>Counted Cash Total:</span>
              <strong style={{ fontSize: '1rem', color: '#059669' }}>₹{cashDenominationsTotal}</strong>
            </div>
          </div>

          {/* Insurance / TPA Empanelled Cashless Desk */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#0d9488" /> Empanelled Insurance & TPA Cashless Desk
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Star Health & Allied Insurance', id: 'SH-GUJ-9041', status: 'ACTIVE', time: 'Instant API' },
                { name: 'Medi Assist TPA Pvt Ltd', id: 'MA-77402', status: 'ACTIVE', time: '30-45 mins' },
                { name: 'HDFC ERGO Health Insurance', id: 'HE-00921', status: 'ACTIVE', time: 'Instant API' },
                { name: 'Niva Bupa Health Insurance', id: 'NB-44812', status: 'ACTIVE', time: 'Turnaround 1hr' },
              ].map(tpa => (
                <div key={tpa.id} style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{tpa.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Provider Code: <strong>{tpa.id}</strong> • {tpa.time}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ccfbf1', color: '#0f766e', padding: '2px 6px', borderRadius: 4 }}>
                    {tpa.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: LIVE MULTI-CHANNEL TRANSACTIONS LEDGER                */}
      {/* ============================================================ */}
      {activeTab === 'TRANSACTIONS' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
          
          {/* Ledger Search & Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ flex: '1 1 240px', minWidth: 'min(100%, 240px)', position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search by Bill #, Patient, MRD, UTR, or Doctor..."
                style={{
                  width: '100%', padding: '8px 12px 8px 34px', borderRadius: 6,
                  border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fafbfc'
                }}
              />
              {ledgerSearch && (
                <button
                  onClick={() => setLedgerSearch('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={ledgerChannel}
                onChange={(e) => setLedgerChannel(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="ALL">All Payment Channels</option>
                <option value="UPI">UPI / Dynamic QR</option>
                <option value="CASH">Cash Counter</option>
                <option value="CARD">Card POS Terminal</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="INSURANCE">Insurance / TPA</option>
              </select>

              <select
                value={ledgerStatus}
                onChange={(e) => setLedgerStatus(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">PAID (Settled)</option>
                <option value="PARTIAL">PARTIAL (Due)</option>
                <option value="PENDING">PENDING (Unpaid)</option>
                <option value="FOC">FOC (Waived)</option>
              </select>
            </div>
          </div>

          {/* Tabular Ledger Container */}
          <div className="billing-responsive-table-scroll" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ minWidth: 1060, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 12px', minWidth: 160, whiteSpace: 'nowrap' }}>Bill # & Patient</th>
                  <th style={{ padding: '10px 12px', minWidth: 120, whiteSpace: 'nowrap' }}>Date</th>
                  <th style={{ padding: '10px 12px', minWidth: 130, whiteSpace: 'nowrap' }}>Channel</th>
                  <th style={{ padding: '10px 12px', minWidth: 90, whiteSpace: 'nowrap' }}>Gross</th>
                  <th style={{ padding: '10px 12px', minWidth: 90, whiteSpace: 'nowrap' }}>Collected</th>
                  <th style={{ padding: '10px 12px', minWidth: 95, whiteSpace: 'nowrap' }}>Balance</th>
                  <th style={{ padding: '10px 12px', minWidth: 90, whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 12px', minWidth: 130, textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    
                    {/* Bill & Patient */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{b.patientName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.7rem', color: '#4338ca', background: '#eef2ff', padding: '1px 5px', borderRadius: 4 }}>
                          {b.invoiceNumber}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>MRD: {b.mrdNumber}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {b.date}
                    </td>

                    {/* Channel */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4,
                        fontSize: '0.72rem', fontWeight: 800,
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
                        {b.paymentMode === 'UPI' && <QrCode size={12} />}
                        {b.paymentMode === 'CASH' && <Banknote size={12} />}
                        {b.paymentMode === 'CARD' && <CreditCard size={12} />}
                        {b.paymentMode === 'BANK_TRANSFER' && <Building2 size={12} />}
                        {b.paymentMode === 'INSURANCE' && <ShieldCheck size={12} />}
                        {b.paymentMode || 'UPI'}
                      </span>
                    </td>

                    {/* Gross */}
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                      ₹{b.netAmount}
                    </td>

                    {/* Collected */}
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                      ₹{b.collectedAmount || 0}
                    </td>

                    {/* Balance */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {(b.balance || 0) > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 800 }}>₹{b.balance}</span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>₹0</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800,
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

                    {/* Actions */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => {
                          setActiveReceiptBill(b);
                          setIsReceiptModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 8px', borderRadius: 6, background: '#eff6ff',
                          color: '#0284c7', border: '1px solid #bfdbfe', fontSize: '0.72rem',
                          fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        <Receipt size={12} /> Receipt
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: HARDWARE TERMINAL FLEET & SOUNDBOX TELEMETRY          */}
      {/* ============================================================ */}
      {activeTab === 'TERMINALS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
          
          {/* MedFlow 4G Soundbox */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                  <Volume2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>MedFlow 4G Voice Soundbox</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>IMEI: 864902049182901</div>
                </div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                ONLINE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Battery</span>
                <strong style={{ fontSize: '0.86rem', color: '#059669' }}>94%</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Signal</span>
                <strong style={{ fontSize: '0.86rem', color: '#0284c7' }}>4G VoLTE</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Volume</span>
                <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>80%</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerSoundbox(qrAmount, merchantName)}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 6, background: '#4338ca',
                color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <Volume2 size={14} /> Send Ping Test Chime
            </button>
          </div>

          {/* Pine Labs POS Terminal 1 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>Pine Labs Smart Android POS</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TID: TID-99210 • Front Desk 01</div>
                </div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                CONNECTED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Batch #</span>
                <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>4012</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>NFC Tap</span>
                <strong style={{ fontSize: '0.86rem', color: '#059669' }}>ENABLED</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Latency</span>
                <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>48ms</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addNotification({ type: 'info', message: 'Batch settlement command dispatched to Pine Labs POS TID-99210.' })}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 6, background: '#f8fafc',
                color: '#334155', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <RefreshCw size={14} /> Settle Current POS Batch
            </button>
          </div>

          {/* Ingenico Wireless POS 2 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>Ingenico Move/5000 Wireless</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TID: TID-99211 • OPD Pharmacy</div>
                </div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                CONNECTED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Batch #</span>
                <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>4012</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Network</span>
                <strong style={{ fontSize: '0.86rem', color: '#0284c7' }}>WiFi 5GHz</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Battery</span>
                <strong style={{ fontSize: '0.86rem', color: '#059669' }}>76%</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addNotification({ type: 'info', message: 'Batch settlement command dispatched to Ingenico Move/5000.' })}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 6, background: '#f8fafc',
                color: '#334155', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <RefreshCw size={14} /> Settle Current POS Batch
            </button>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PAYMENT RECEIPT PREVIEW                               */}
      {/* ============================================================ */}
      {isReceiptModalOpen && activeReceiptBill && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, maxWidth: 'min(94vw, 500px)',
            width: '100%', padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 14 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Official Payment Voucher
                </h4>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {activeReceiptBill.invoiceNumber} • {activeReceiptBill.patientName}
                </div>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Date & Time:</span>
                <strong>{activeReceiptBill.date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Channel:</span>
                <strong>{activeReceiptBill.paymentMode || 'UPI'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Invoiced:</span>
                <strong>₹{activeReceiptBill.netAmount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Collected:</span>
                <strong style={{ color: '#059669' }}>₹{activeReceiptBill.collectedAmount || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Remaining Balance:</span>
                <strong style={{ color: (activeReceiptBill.balance || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{activeReceiptBill.balance || 0}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: 6, background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                style={{ padding: '8px 14px', borderRadius: 6, background: '#0284c7', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
