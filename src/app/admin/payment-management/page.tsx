'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Wallet, QrCode, CheckCircle2, Save, Printer,
  Building, DollarSign, Smartphone, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useAdminStore, useUIStore } from '@/store';

export default function AdminPaymentManagementPage() {
  const { settings, updateSettings } = useAdminStore();
  const { addNotification } = useUIStore();

  const [vpa, setVpa] = useState(settings.upiVpa || 'medflow.clinic@okaxis');
  const [merchantName, setMerchantName] = useState(settings.merchantName || 'MedFlow Healthcare LLP');
  const [testAmount, setTestAmount] = useState<number>(500);

  // Dynamic UPI URI string
  const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${testAmount}&cu=INR&tn=MedFlow+OPD+Fee`;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      upiVpa: vpa,
      merchantName: merchantName
    });
    addNotification({
      type: 'success',
      message: 'UPI Virtual Payment Address & Merchant parameters saved clinic-wide.'
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6366f1', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
            Payment Infrastructure
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Direct UPI Deep-Link Engine & Counter Standee</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wallet size={26} color="#6366f1" /> UPI Gateway, Dynamic QR & Payment Configuration
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Zero-MDR direct bank settlement via UPI deep-links, dynamic checkout QR codes, and printable reception standees.
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 24 }}>
        
        {/* Left: VPA Configuration Form */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={18} color="#6366f1" /> Banking Merchant & VPA Routing
          </h3>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Virtual Payment Address (VPA / UPI ID) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. clinic@okaxis or medflow@icici"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                Directly tied to the clinic&apos;s current bank account for zero-fee instant settlement.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Merchant Payee Legal Entity Name *
              </label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                Displayed inside Google Pay, PhonePe, and Paytm during patient authorization.
              </span>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Supported UPI Payment Applications:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                <span style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 4 }}>Google Pay</span>
                <span style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 4 }}>PhonePe</span>
                <span style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 4 }}>Paytm UPI</span>
                <span style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 4 }}>BHIM UPI</span>
                <span style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 4 }}>Cred UPI</span>
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '11px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#6366f1',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6
              }}
            >
              <Save size={16} /> Save UPI Parameters
            </button>
          </form>
        </div>

        {/* Right: Real-time Dynamic QR Standee Simulator */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={18} color="#6366f1" /> Counter QR Standee Simulator
            </h3>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print Standee
            </button>
          </div>

          {/* Test Amount Modifier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Simulate Bill Amount:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[300, 500, 800, 1500].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTestAmount(amt)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: testAmount === amt ? '#6366f1' : '#CBD5E1',
                    background: testAmount === amt ? '#EEF2FF' : '#FFFFFF',
                    color: testAmount === amt ? '#4338ca' : '#475569'
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Standee Mock Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#FFFFFF',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(30, 27, 75, 0.2)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.04em' }}>{merchantName}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>Outpatient Department Payment Terminal</div>

            {/* Simulated High-Contrast QR Code */}
            <div style={{
              background: '#FFFFFF',
              width: 170,
              height: 170,
              borderRadius: 12,
              margin: '18px auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                {/* SVG QR Pattern Simulation */}
                <rect x="5" y="5" width="28" height="28" fill="#0F172A" />
                <rect x="10" y="10" width="18" height="18" fill="#FFFFFF" />
                <rect x="14" y="14" width="10" height="10" fill="#0F172A" />

                <rect x="67" y="5" width="28" height="28" fill="#0F172A" />
                <rect x="72" y="10" width="18" height="18" fill="#FFFFFF" />
                <rect x="76" y="14" width="10" height="10" fill="#0F172A" />

                <rect x="5" y="67" width="28" height="28" fill="#0F172A" />
                <rect x="10" y="72" width="18" height="18" fill="#FFFFFF" />
                <rect x="14" y="76" width="10" height="10" fill="#0F172A" />

                {/* Random Matrix Dots */}
                <rect x="40" y="10" width="6" height="6" fill="#0F172A" />
                <rect x="50" y="10" width="6" height="12" fill="#0F172A" />
                <rect x="40" y="24" width="16" height="6" fill="#0F172A" />
                <rect x="40" y="40" width="20" height="20" fill="#4338ca" />
                <rect x="10" y="40" width="10" height="8" fill="#0F172A" />
                <rect x="25" y="45" width="8" height="12" fill="#0F172A" />
                <rect x="70" y="40" width="15" height="10" fill="#0F172A" />
                <rect x="65" y="60" width="10" height="15" fill="#0F172A" />
                <rect x="45" y="75" width="18" height="8" fill="#0F172A" />
                <rect x="75" y="80" width="12" height="10" fill="#0F172A" />
              </svg>
            </div>

            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#34D399' }}>
              ₹{testAmount}.00
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: 4 }}>
              Scan & Pay with Any Banking / UPI App
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2, fontFamily: 'monospace' }}>
              VPA: {vpa}
            </div>
          </div>

          {/* Deep link URI inspection */}
          <div style={{ marginTop: 16, background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>Generated UPI Intent URI:</span>
            <code style={{ fontSize: '0.75rem', color: '#4338ca', wordBreak: 'break-all', display: 'block', marginTop: 4 }}>
              {upiUri}
            </code>
          </div>
        </div>

      </div>

    </div>
  );
}
