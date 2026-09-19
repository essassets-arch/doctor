'use client';
import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pill, ShieldAlert, ArrowLeft, CheckCircle2, Clock,
  Trash2, Plus, Minus, CreditCard, Banknote, Receipt,
  Sparkles, AlertTriangle, Printer, Layers, User, Calendar
} from 'lucide-react';
import { usePharmacyStore, useInventoryStore, useUIStore } from '@/store';

export default function PatientDispensingPosPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const router = useRouter();

  const { prescriptions, batches, dispensePrescription } = usePharmacyStore();
  const { inventory } = useInventoryStore();
  const { addNotification } = useUIStore();

  const prescription = prescriptions.find(p => p.caseId.toLowerCase() === caseId.toLowerCase()) || prescriptions[0];

  // Dispensing items state with quantity modifiers
  const [dispenseItems, setDispenseItems] = useState<Array<{
    itemId: string;
    drugId: string;
    drugName: string;
    unitPrice: number;
    prescribedQty: number;
    dispensedQty: number;
    isOmitted: boolean;
  }>>(
    prescription?.items.map(item => ({
      itemId: item.id,
      drugId: item.drugId,
      drugName: item.drugName,
      unitPrice: item.unitPrice,
      prescribedQty: item.prescribedQty,
      dispensedQty: item.isDispensed ? item.dispensedQty : item.prescribedQty,
      isOmitted: false
    })) || []
  );

  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD_UPI'>('CASH');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<string | null>(prescription?.billing?.invoiceNumber || null);

  // Cart calculations
  const subtotal = useMemo(() => {
    return dispenseItems
      .filter(i => !i.isOmitted)
      .reduce((sum, i) => sum + i.dispensedQty * i.unitPrice, 0);
  }, [dispenseItems]);

  const tax = useMemo(() => parseFloat((subtotal * 0.05).toFixed(2)), [subtotal]);
  const totalPayable = useMemo(() => parseFloat((subtotal + tax).toFixed(2)), [subtotal, tax]);

  const handleQtyChange = (itemId: string, delta: number) => {
    setDispenseItems(dispenseItems.map(item => {
      if (item.itemId !== itemId) return item;
      const newQty = Math.max(0, Math.min(item.prescribedQty * 2, item.dispensedQty + delta));
      return { ...item, dispensedQty: newQty };
    }));
  };

  const handleToggleOmit = (itemId: string) => {
    setDispenseItems(dispenseItems.map(item => {
      if (item.itemId !== itemId) return item;
      return { ...item, isOmitted: !item.isOmitted };
    }));
  };

  const handleCompleteDispense = () => {
    const activeItems = dispenseItems.filter(i => !i.isOmitted && i.dispensedQty > 0);
    if (activeItems.length === 0) {
      alert('Please select at least one medication to dispense.');
      return;
    }

    const res = dispensePrescription(
      prescription.caseId,
      activeItems.map(i => ({ itemId: i.itemId, dispensedQty: i.dispensedQty })),
      paymentMode
    );

    setCompletedInvoice(res.invoiceNumber);
    setIsReceiptModalOpen(true);

    addNotification({
      type: 'success',
      message: `Prescription for ${prescription.patientName} dispensed! Invoice #${res.invoiceNumber} generated.`
    });
  };

  if (!prescription) {
    return (
      <div className="page-container" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Prescription Record Not Found</h2>
        <Link href="/medical/dispensing">
          <button className="btn btn-primary" style={{ marginTop: 14 }}>Back to Dispensing Hub</button>
        </Link>
      </div>
    );
  }

  const isAlreadyDispensed = prescription.status === 'DISPENSED';
  const hasAllergies = prescription.allergies && prescription.allergies.length > 0;

  return (
    <div className="page-container" style={{ maxWidth: 1500, margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/medical/dispensing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Dispensing Hub
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
              Prescription Dispensing & POS Checkout
            </h1>
            <span style={{
              background: isAlreadyDispensed ? '#ECFDF5' : '#FFFBEB',
              color: isAlreadyDispensed ? '#059669' : '#D97706',
              border: isAlreadyDispensed ? '1px solid #A7F3D0' : '1px solid #FDE68A',
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999
            }}>
              {isAlreadyDispensed ? 'FULFILLED / DISPENSED' : 'ACTIVE DISPENSING'}
            </span>
          </div>
        </div>

        {isAlreadyDispensed && (
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="btn btn-outline"
            style={{ borderColor: '#059669', color: '#059669', fontWeight: 800, fontSize: 13 }}
          >
            <Printer size={15} /> Reprint Tax Invoice Receipt
          </button>
        )}
      </div>

      {/* 5.1 High-Risk Allergy Alert Banner */}
      {hasAllergies && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
          border: '2px solid #E11D48', borderRadius: 14,
          padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 14px rgba(225,29,72,0.12)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: '#E11D48',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ShieldAlert size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 14.5, color: '#9F1239' }}>
              ⚠ CRITICAL ALLERGY ALERT: {prescription.allergies.join(', ').toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: '#BE123C', marginTop: 2 }}>
              Patient has documented severe physiological adverse reactions to these drug classes. Pharmacists must cross-reference prescribed antibiotics or anti-inflammatories before dispensing.
            </div>
          </div>
        </div>
      )}

      {/* Patient Demographic Bar */}
      <div className="card" style={{ padding: '16px 20px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: '#059669', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 17
            }}>
              {prescription.patientName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>
                  {prescription.patientName}
                </span>
                <span style={{ background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                  {prescription.mrdNumber}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>Age: <strong>{prescription.age} Yrs</strong></span>
                <span>Gender: <strong>{prescription.gender === 'M' ? 'Male' : 'Female'}</strong></span>
                <span>Phone: <strong>{prescription.mobile}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Case ID</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', fontFamily: 'monospace' }}>{prescription.caseId}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Attending Physician</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>{prescription.doctorName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Prescribed Date</div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>{prescription.consultationDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Left Doctor's Prescriptions (1.4fr) + Right POS Billing Cart (1.6fr) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: 24, alignItems: 'start' }}>
        {/* 5.2 Physician Prescription Details */}
        <div className="card" style={{ borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 14.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={16} color="#059669" /> Doctor's Electronic Prescription ({prescription.items.length} Drugs)
            </div>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
              Fulfillment Verification
            </span>
          </div>

          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {prescription.items.map((item, idx) => {
              const inv = inventory.find(i => i.id === item.drugId);
              const availableUnits = inv ? inv.stock : 0;
              const isDepleted = availableUnits === 0;

              // Find earliest FEFO batch for display
              const earliestBatch = batches
                .filter(b => b.drugId === item.drugId && !b.isQuarantined && b.stockQuantity > 0)
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];

              return (
                <div
                  key={item.id}
                  style={{
                    padding: 16, borderRadius: 14, border: '1px solid #E2E8F0',
                    background: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, fontSize: 14, color: '#0F172A' }}>
                          {idx + 1}. {item.drugName}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                          {item.formulation}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 3 }}>
                        Dosage: {item.dosage} • Frequency: {item.frequency} • {item.durationDays} Days
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        Instructions: <em>{item.instructions}</em>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                        Qty: {item.prescribedQty}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        ₹{item.unitPrice}/unit
                      </div>
                    </div>
                  </div>

                  {/* Stock Availability & FEFO Batch Tag */}
                  <div style={{
                    marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isDepleted ? (
                        <span style={{ color: '#E11D48', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={13} /> Stock Depleted (0 Available)
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Available Stock: <strong>{availableUnits} Units</strong>
                        </span>
                      )}
                    </div>

                    {earliestBatch && (
                      <span style={{ background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10.5 }}>
                        FEFO Batch: {earliestBatch.batchNumber} (Exp: {earliestBatch.expiryDate})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5.3 Point-of-Sale (POS) Billing Cart */}
        <div className="card" style={{ borderRadius: 20, border: '1.5px solid #A7F3D0', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 4px 18px rgba(5,150,105,0.08)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#ECFDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={17} /> Point-of-Sale (POS) Cashiering Cart
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 800, background: '#FFFFFF', color: '#059669', padding: '2px 8px', borderRadius: 999, border: '1px solid #A7F3D0' }}>
              FEFO Real-Time Deduction
            </span>
          </div>

          <div style={{ padding: 20 }}>
            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {dispenseItems.map(item => {
                const totalItemPrice = item.dispensedQty * item.unitPrice;

                return (
                  <div
                    key={item.itemId}
                    style={{
                      padding: '12px 16px', borderRadius: 12,
                      border: item.isOmitted ? '1px dashed #CBD5E1' : '1px solid #E2E8F0',
                      background: item.isOmitted ? '#F8FAFC' : '#FFFFFF',
                      opacity: item.isOmitted ? 0.6 : 1,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                        {item.drugName}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        ₹{item.unitPrice} each • Prescribed: {item.prescribedQty}
                      </div>
                    </div>

                    {!isAlreadyDispensed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Quantity Modifiers */}
                        {!item.isOmitted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', borderRadius: 8, padding: '2px 6px' }}>
                            <button
                              onClick={() => handleQtyChange(item.itemId, -1)}
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontWeight: 900, fontSize: 13, minWidth: 20, textAlign: 'center' }}>
                              {item.dispensedQty}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item.itemId, 1)}
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Declined / Omitted</span>
                        )}

                        <div style={{ width: 70, textAlign: 'right', fontWeight: 900, fontSize: 14, color: item.isOmitted ? '#94A3B8' : '#0F172A' }}>
                          ₹{totalItemPrice.toFixed(2)}
                        </div>

                        <button
                          onClick={() => handleToggleOmit(item.itemId)}
                          title={item.isOmitted ? 'Restore item' : 'Omit from dispensing'}
                          style={{ border: 'none', background: 'none', color: item.isOmitted ? '#059669' : '#EF4444', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                          Qty: {item.dispensedQty}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                          ₹{totalItemPrice.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
                <span>Medication Subtotal:</span>
                <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                <span>Pharmacy Tax (5% GST):</span>
                <span style={{ fontWeight: 700 }}>₹{tax.toFixed(2)}</span>
              </div>
              <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900, color: '#0F172A' }}>
                <span>Total Amount Due:</span>
                <span style={{ color: '#059669' }}>₹{totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {!isAlreadyDispensed ? (
              <>
                {/* 5.5 Cashiering Payment Mode Toggle */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                    Collection Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('CASH')}
                      style={{
                        padding: '12px', borderRadius: 10,
                        border: paymentMode === 'CASH' ? '2px solid #059669' : '1px solid #CBD5E1',
                        background: paymentMode === 'CASH' ? '#ECFDF5' : '#FFFFFF',
                        color: paymentMode === 'CASH' ? '#059669' : '#334155',
                        fontWeight: 800, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      <Banknote size={17} /> Cash Register
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('CARD_UPI')}
                      style={{
                        padding: '12px', borderRadius: 10,
                        border: paymentMode === 'CARD_UPI' ? '2px solid #059669' : '1px solid #CBD5E1',
                        background: paymentMode === 'CARD_UPI' ? '#ECFDF5' : '#FFFFFF',
                        color: paymentMode === 'CARD_UPI' ? '#059669' : '#334155',
                        fontWeight: 800, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      <CreditCard size={17} /> Card / UPI QR
                    </button>
                  </div>
                </div>

                {/* Complete & Dispense Button */}
                <button
                  type="button"
                  onClick={handleCompleteDispense}
                  className="btn btn-primary btn-lg"
                  style={{
                    width: '100%', justifyContent: 'center', padding: '14px',
                    background: '#059669', borderColor: '#059669', fontSize: 14.5,
                    fontWeight: 900, borderRadius: 12, boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
                  }}
                >
                  <CheckCircle2 size={18} /> COMPLETE & DISPENSE MEDICATION ➔
                </button>
              </>
            ) : (
              <div style={{ padding: 16, background: '#ECFDF5', borderRadius: 12, border: '1px solid #A7F3D0', textAlign: 'center' }}>
                <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 900, fontSize: 14, color: '#065F46' }}>
                  Prescription Successfully Dispensed & Invoiced
                </div>
                <div style={{ fontSize: 12, color: '#047857', marginTop: 3 }}>
                  Invoice: <strong>{prescription.billing?.invoiceNumber}</strong> • Collected via {prescription.billing?.paymentMode}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tax Invoice & Printable Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReceiptModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#059669', color: '#FFFFFF', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={18} />
                <span className="modal-title" style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 15 }}>
                  MedFlow Pharmacy Tax Invoice
                </span>
              </div>
              <button className="btn btn-ghost btn-icon" style={{ color: '#FFFFFF' }} onClick={() => setIsReceiptModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24, fontSize: 13 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>MEDFLOW OUTPATIENT CLINIC</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Surat Central Main Branch • Dispensary Lic: PHARM-GUJ-88219</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                  Tax Invoice #: {completedInvoice || 'INV-PHARM-26012'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11.5, color: '#334155' }}>
                <div>
                  <div>Patient: <strong>{prescription.patientName}</strong></div>
                  <div>MRD: {prescription.mrdNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Doctor: <strong>{prescription.doctorName}</strong></div>
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', marginBottom: 14, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dispenseItems.filter(i => !i.isOmitted).map(item => (
                    <tr key={item.itemId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>{item.drugName}</td>
                      <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.dispensedQty}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>₹{(item.dispensedQty * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 10, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>GST (5%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15, color: '#059669', marginTop: 6 }}>
                  <span>Amount Paid ({paymentMode}):</span>
                  <span>₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 10.5, color: '#64748B', marginTop: 18, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                Dispensed by Suresh Shah • Take medicines strictly per physician instructions.
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC', padding: 14 }}>
              <button className="btn btn-ghost" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={() => {
                  window.print();
                  setIsReceiptModalOpen(false);
                }}
              >
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
