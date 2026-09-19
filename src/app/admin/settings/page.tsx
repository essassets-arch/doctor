'use client';

import React, { useState } from 'react';
import { useAdminStore, useUIStore, ClinicSettings } from '@/store';
import { 
  Building2, 
  FileText, 
  Save, 
  RotateCcw, 
  Printer, 
  CheckCircle2, 
  Sliders, 
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useAdminStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState<ClinicSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'PRESCRIPTION'>('IDENTITY');

  const handleSave = () => {
    updateSettings(formData);
    addNotification({
      type: 'success',
      message: 'Clinic configuration and prescription layout updated successfully.'
    });
  };

  const handleReset = () => {
    setFormData({ ...settings });
    addNotification({
      type: 'info',
      message: 'Restored latest saved clinic configuration.'
    });
  };

  const updatePrescriptionLayout = (key: keyof ClinicSettings['prescriptionLayout'], val: any) => {
    setFormData(prev => ({
      ...prev,
      prescriptionLayout: {
        ...prev.prescriptionLayout,
        [key]: val
      }
    }));
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 38, height: 38, borderRadius: 8, 
              background: 'linear-gradient(135deg, #4338ca, #312e81)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Clinic Settings & Prescription Layout Designer
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Master facility profile, GST/legal credentials, and dynamic A4 prescription stationary layout
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f1f5f9', color: '#475569',
              border: '1px solid #cbd5e1', padding: '8px 16px',
              borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} /> Discard Changes
          </button>
          <button
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#4338ca', color: '#fff',
              border: 'none', padding: '8px 18px',
              borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(67, 56, 202, 0.3)'
            }}
          >
            <Save size={15} /> Save All Configurations
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('IDENTITY')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: activeTab === 'IDENTITY' ? '#4338ca' : 'transparent',
            color: activeTab === 'IDENTITY' ? '#fff' : '#64748b',
            border: 'none', cursor: 'pointer'
          }}
        >
          <Building2 size={16} /> Clinic Identity & Registration
        </button>
        <button
          onClick={() => setActiveTab('PRESCRIPTION')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: activeTab === 'PRESCRIPTION' ? '#4338ca' : 'transparent',
            color: activeTab === 'PRESCRIPTION' ? '#fff' : '#64748b',
            border: 'none', cursor: 'pointer'
          }}
        >
          <FileText size={16} /> Prescription Layout Designer
        </button>
      </div>

      {/* Tab 1: Clinic Identity */}
      {activeTab === 'IDENTITY' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="#4338ca" /> Core Establishment Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Clinic / Hospital Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Clinical Registration ID
                </label>
                <input
                  type="text"
                  value={formData.regNumber}
                  onChange={e => setFormData({ ...formData, regNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                Physical Address
              </label>
              <textarea
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Primary Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 12 }} />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Official Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 12 }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            <h4 style={{ margin: '24px 0 14px 0', fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <CreditCard size={17} color="#059669" /> Financial & Merchant Credentials
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  GSTIN (Tax Identification Number)
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Merchant Legal Entity Name
                </label>
                <input
                  type="text"
                  value={formData.merchantName}
                  onChange={e => setFormData({ ...formData, merchantName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Merchant UPI VPA (Default Settlement)
                </label>
                <input
                  type="text"
                  value={formData.upiVpa}
                  onChange={e => setFormData({ ...formData, upiVpa: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Quick Details Preview Card */}
          <div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Accreditation & Compliance</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                These clinic credentials are automatically injected into all printed OPD invoices, GST return schedules, diagnostic reports, and SMS/WhatsApp notifications.
              </p>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>NABH Status:</span>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>Pre-Accredited Level 2</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>State Council License:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Active (Valid 2028)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Bio-Waste Handler:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>GreenEarth Solutions</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>
                Multi-Branch Architecture
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#1e3a8a', lineHeight: 1.5 }}>
                Current Branch: <strong>Ahmedabad Central (Main Flagship)</strong>. To configure satellite clinic centers or franchise branch VPAs, navigate to Organization Multi-Tenant Master.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prescription Layout Designer */}
      {activeTab === 'PRESCRIPTION' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Layout Controls */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
              <SlidersHorizontal size={18} color="#4338ca" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                Layout & Header Control
              </h3>
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                Stationary Type Selector
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#64748b' }}>
                Disable the header if your clinic prints prescriptions on pre-printed offset letterhead paper.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                <input
                  type="checkbox"
                  checked={formData.prescriptionLayout.showHeader}
                  onChange={e => updatePrescriptionLayout('showHeader', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#4338ca' }}
                />
                Print Clinic Letterhead Header
              </label>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Clinical Content Modules
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}>
                  <span style={{ color: '#1e293b' }}>Doctor Degree & Reg Details</span>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionLayout.showDoctorDetails}
                    onChange={e => updatePrescriptionLayout('showDoctorDetails', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4338ca' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}>
                  <span style={{ color: '#1e293b' }}>Patient Vitals Bar (BP, Pulse, SpO2)</span>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionLayout.showPatientVitals}
                    onChange={e => updatePrescriptionLayout('showPatientVitals', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4338ca' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}>
                  <span style={{ color: '#1e293b' }}>Drug Schedule Table (Rx Matrix)</span>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionLayout.showDrugScheduleTable}
                    onChange={e => updatePrescriptionLayout('showDrugScheduleTable', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4338ca' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}>
                  <span style={{ color: '#1e293b' }}>Recommended Lab / Diagnostic Orders</span>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionLayout.showLabOrders}
                    onChange={e => updatePrescriptionLayout('showLabOrders', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4338ca' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}>
                  <span style={{ color: '#1e293b' }}>Signature & Stamp Block</span>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionLayout.showSignatureBlock}
                    onChange={e => updatePrescriptionLayout('showSignatureBlock', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4338ca' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Stationary Margins (Clearance)
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Top Margin</span>
                  <span style={{ color: '#4338ca', fontWeight: 700 }}>{formData.prescriptionLayout.topMarginMm} mm</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={formData.prescriptionLayout.topMarginMm}
                  onChange={e => updatePrescriptionLayout('topMarginMm', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4338ca' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                  <span>10 mm (Standard A4)</span>
                  <span>80 mm (High Letterhead)</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Bottom Margin</span>
                  <span style={{ color: '#4338ca', fontWeight: 700 }}>{formData.prescriptionLayout.bottomMarginMm} mm</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={formData.prescriptionLayout.bottomMarginMm}
                  onChange={e => updatePrescriptionLayout('bottomMarginMm', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4338ca' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                  <span>10 mm</span>
                  <span>50 mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive A4 Prescription Simulator */}
          <div style={{ background: '#334155', padding: 24, borderRadius: 8, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <Eye size={15} color="#38bdf8" /> Real-time A4 Print Stationary Simulation
              </div>
              <div style={{ fontSize: 11, background: '#1e293b', padding: '3px 8px', borderRadius: 4, color: '#94a3b8' }}>
                Aspect: ISO 216 A4 Portrait
              </div>
            </div>

            {/* A4 Paper Canvas */}
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              minHeight: 700,
              borderRadius: 4,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
              padding: `${formData.prescriptionLayout.topMarginMm}px 32px ${formData.prescriptionLayout.bottomMarginMm}px 32px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              <div>
                {/* Header (Letterhead) */}
                {formData.prescriptionLayout.showHeader ? (
                  <div style={{ borderBottom: '2px solid #036d92', paddingBottom: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#036d92', letterSpacing: -0.3 }}>
                          {formData.name}
                        </h2>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                          {formData.address}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                          Phone: {formData.phone} | Web: {formData.email}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b' }}>
                        <div><strong>Reg No:</strong> {formData.regNumber}</div>
                        <div><strong>GSTIN:</strong> {formData.gstNumber}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    border: '1px dashed #cbd5e1', 
                    background: '#f8fafc', 
                    borderRadius: 4, 
                    padding: '8px 12px', 
                    marginBottom: 14, 
                    fontSize: 11, 
                    color: '#94a3b8', 
                    textAlign: 'center' 
                  }}>
                    [ Pre-Printed Letterhead Clearance Area: {formData.prescriptionLayout.topMarginMm}mm ]
                  </div>
                )}

                {/* Doctor Identity Header */}
                {formData.prescriptionLayout.showDoctorDetails && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Dr. Raj Valaki, MBBS, MD (Medicine)</div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>Senior Consultant Physician | Reg. No: G-48291-MED</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#475569' }}>
                      <strong>Date:</strong> 19-Sep-2026 10:45 AM
                    </div>
                  </div>
                )}

                {/* Patient Information Bar */}
                <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, fontSize: 11.5, marginBottom: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <div><strong>Patient:</strong> Mahesh Kumar</div>
                    <div><strong>Age/Gender:</strong> 48Y / Male</div>
                    <div><strong>MRD:</strong> MRD-2026-0842</div>
                    <div><strong>Token:</strong> #T-14 (Cabin 1)</div>
                  </div>
                </div>

                {/* Vitals Bar */}
                {formData.prescriptionLayout.showPatientVitals && (
                  <div style={{ display: 'flex', gap: 14, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 6, fontSize: 11, marginBottom: 14 }}>
                    <div><span style={{ color: '#64748b' }}>BP:</span> <strong>138/86 mmHg</strong></div>
                    <div><span style={{ color: '#64748b' }}>Pulse:</span> <strong>78 bpm</strong></div>
                    <div><span style={{ color: '#64748b' }}>SpO2:</span> <strong>98% on RA</strong></div>
                    <div><span style={{ color: '#64748b' }}>Weight:</span> <strong>74.5 kg</strong></div>
                    <div><span style={{ color: '#64748b' }}>Temp:</span> <strong>98.4 °F</strong></div>
                  </div>
                )}

                {/* Rx Symbol */}
                <div style={{ fontSize: 18, fontWeight: 900, color: '#036d92', marginBottom: 6 }}>
                  ℞
                </div>

                {/* Drug Schedule Table */}
                {formData.prescriptionLayout.showDrugScheduleTable && (
                  <div style={{ marginBottom: 14 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '6px 8px' }}>#</th>
                          <th style={{ padding: '6px 8px' }}>Medicine Name & Strength</th>
                          <th style={{ padding: '6px 8px' }}>Dosage & Frequency</th>
                          <th style={{ padding: '6px 8px' }}>Timing</th>
                          <th style={{ padding: '6px 8px' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px' }}>1</td>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Tab. Telmisartan 40mg</td>
                          <td style={{ padding: '6px 8px' }}>1 - 0 - 0 (Morning)</td>
                          <td style={{ padding: '6px 8px', color: '#036d92' }}>After Breakfast</td>
                          <td style={{ padding: '6px 8px' }}>30 Days</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px' }}>2</td>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Tab. Metformin 500mg SR</td>
                          <td style={{ padding: '6px 8px' }}>1 - 0 - 1 (Morning, Night)</td>
                          <td style={{ padding: '6px 8px', color: '#036d92' }}>With Meals</td>
                          <td style={{ padding: '6px 8px' }}>30 Days</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 8px' }}>3</td>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Tab. Atorvastatin 10mg</td>
                          <td style={{ padding: '6px 8px' }}>0 - 0 - 1 (Bedtime)</td>
                          <td style={{ padding: '6px 8px', color: '#036d92' }}>After Dinner</td>
                          <td style={{ padding: '6px 8px' }}>30 Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Lab Orders */}
                {formData.prescriptionLayout.showLabOrders && (
                  <div style={{ background: '#f8fafc', borderLeft: '3px solid #0891b2', padding: '6px 10px', fontSize: 10.5, marginBottom: 14 }}>
                    <strong style={{ color: '#0e7490' }}>Investigations Recommended:</strong> Fasting Blood Sugar (FBS), Lipid Profile, Serum Creatinine in 4 weeks.
                  </div>
                )}
              </div>

              {/* Signature Block & Footer */}
              {formData.prescriptionLayout.showSignatureBlock && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', maxWidth: '60%' }}>
                    * This digital prescription is electronically authenticated and legally valid under IT Act 2000 and Telemedicine Guidelines. Generated via MedFlow Clinical OS.
                  </div>
                  <div style={{ textAlign: 'center', width: 140 }}>
                    <div style={{ fontSize: 11, fontStyle: 'italic', color: '#036d92', marginBottom: 2 }}>[Digital Verified Stamp]</div>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 3, fontSize: 10, fontWeight: 700, color: '#334155' }}>
                      Dr. Raj Valaki
                    </div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>Consultant Physician</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
