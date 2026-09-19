'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCcw, Search, CheckCircle2, AlertTriangle, ArrowRight,
  User, Calendar, DollarSign, FileText, Printer, ShieldAlert,
  Clock, Package, Check, X, Layers, AlertCircle
} from 'lucide-react';
import { usePharmacyStore, usePatientStore, useUIStore } from '@/store';

export default function MedicalReturnsPage() {
  const { prescriptions, batches, movements, processReturn } = usePharmacyStore();
  const { patients } = usePatientStore();
  const { addNotification } = useUIStore();

  // Search & Case selection
  const [caseSearchQuery, setCaseSearchQuery] = useState('C001-001-190926');
  const [activePrescriptionId, setActivePrescriptionId] = useState<string>('rx-f-5');

  // Return form inputs
  const [selectedItemId, setSelectedItemId] = useState<string>('rxi-8');
  const [returnQty, setReturnQty] = useState<number>(2);
  const [returnReason, setReturnReason] = useState<string>('Adverse Drug Reaction (Skin Rash / Erythema)');
  const [clinicalNotes, setClinicalNotes] = useState<string>('Patient developed pruritus and erythema after first dose. Discontinued by doctor.');
  const [refundMode, setRefundMode] = useState<'CASH' | 'PATIENT_LEDGER'>('CASH');

  // Post-return receipt modal
  const [returnReceipt, setReturnReceipt] = useState<{
    returnRef: string;
    caseId: string;
    patientName: string;
    drugName: string;
    batchNumber: string;
    quantity: number;
    refundTotal: number;
    reason: string;
    timestamp: string;
  } | null>(null);

  // Active selected prescription
  const selectedPrescription = useMemo(() => {
    return prescriptions.find(p => p.id === activePrescriptionId) || prescriptions[0];
  }, [prescriptions, activePrescriptionId]);

  // Handle case search
  const handleCaseSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = caseSearchQuery.trim().toLowerCase();
    if (!query) return;

    const match = prescriptions.find(p =>
      p.caseId.toLowerCase().includes(query) ||
      p.mrdNumber.toLowerCase().includes(query) ||
      p.patientName.toLowerCase().includes(query)
    );

    if (match) {
      setActivePrescriptionId(match.id);
      if (match.items.length > 0) {
        setSelectedItemId(match.items[0].id);
        setReturnQty(Math.min(1, match.items[0].dispensedQty));
      }
      addNotification({ type: 'info', message: `Found case ${match.caseId} for ${match.patientName}` });
    } else {
      addNotification({ type: 'danger', message: `No prescription record found matching "${caseSearchQuery}"` });
    }
  };

  // Selected item to return
  const currentReturnItem = useMemo(() => {
    return selectedPrescription?.items.find(i => i.id === selectedItemId);
  }, [selectedPrescription, selectedItemId]);

  // Batch to re-credit
  const allocatedBatchNumber = useMemo(() => {
    if (currentReturnItem?.batchAllocations && currentReturnItem.batchAllocations.length > 0) {
      return currentReturnItem.batchAllocations[0].batchNumber;
    }
    // Fallback: match any active batch for this drug
    const batch = batches.find(b => b.drugId === currentReturnItem?.drugId);
    return batch ? batch.batchNumber : 'BAT-2575';
  }, [currentReturnItem, batches]);

  // Refund calculation
  const refundSubtotal = currentReturnItem ? returnQty * currentReturnItem.unitPrice : 0;
  const refundTax = parseFloat((refundSubtotal * 0.05).toFixed(2));
  const refundTotal = parseFloat((refundSubtotal + refundTax).toFixed(2));

  // Handle Return Processing
  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription || !currentReturnItem) {
      addNotification({ type: 'danger', message: 'Please select a valid item to return.' });
      return;
    }

    if (returnQty <= 0 || returnQty > currentReturnItem.dispensedQty) {
      addNotification({ type: 'danger', message: `Return quantity must be between 1 and ${currentReturnItem.dispensedQty}.` });
      return;
    }

    const returnRefId = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Call store action
    processReturn(
      selectedPrescription.caseId,
      currentReturnItem.drugId,
      allocatedBatchNumber,
      returnQty,
      `${returnReason} — ${clinicalNotes}`
    );

    // Set receipt for display/print
    setReturnReceipt({
      returnRef: returnRefId,
      caseId: selectedPrescription.caseId,
      patientName: selectedPrescription.patientName,
      drugName: currentReturnItem.drugName,
      batchNumber: allocatedBatchNumber,
      quantity: returnQty,
      refundTotal,
      reason: returnReason,
      timestamp: nowTime
    });

    addNotification({
      type: 'success',
      message: `Return processed. Batch ${allocatedBatchNumber} credited (+${returnQty}). Patient special note logged.`
    });
  };

  // Recent returns from store movements
  const returnMovements = useMemo(() => {
    return movements.filter(m => m.movementType === 'RETURN');
  }, [movements]);

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
            Dispensary Operations
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• ADR Vigilance & Ledger Re-credit</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <RotateCcw size={26} color="#059669" /> Medication Returns & Patient Refunds
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Adverse drug reaction returns, prescription reconciliations, batch re-crediting, and patient ledger refunds.
        </p>
      </div>

      {/* Case Search & Verification Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, marginBottom: 24 }}>
        <form onSubmit={handleCaseSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Enter Case ID (e.g. C001-001-190926), MRD Number, or Patient Name..."
              value={caseSearchQuery}
              onChange={(e) => setCaseSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#059669',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={16} /> Verify Case
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
          <span>Recent Dispensed Cases:</span>
          {prescriptions.filter(p => p.status === 'DISPENSED' || p.items.some(i => i.isDispensed)).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setCaseSearchQuery(p.caseId);
                setActivePrescriptionId(p.id);
                if (p.items.length > 0) {
                  setSelectedItemId(p.items[0].id);
                  setReturnQty(Math.min(1, p.items[0].dispensedQty));
                }
              }}
              style={{
                background: activePrescriptionId === p.id ? '#ecfdf5' : '#f8fafc',
                color: activePrescriptionId === p.id ? '#059669' : '#475569',
                border: `1px solid ${activePrescriptionId === p.id ? '#a7f3d0' : '#e2e8f0'}`,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {p.caseId} ({p.patientName})
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 24, marginBottom: 28 }}>
        
        {/* Left: Verified Case Details & Dispensed Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedPrescription ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              
              {/* Patient Identity Top Strip */}
              <div style={{ padding: 18, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                      Verified Case Record
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedPrescription.patientName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                      {selectedPrescription.age} yrs • {selectedPrescription.gender === 'M' ? 'Male' : 'Female'} • MRD: {selectedPrescription.mrdNumber}
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: selectedPrescription.status === 'DISPENSED' ? '#dcfce7' : '#fef3c7',
                    color: selectedPrescription.status === 'DISPENSED' ? '#15803d' : '#b45309'
                  }}>
                    {selectedPrescription.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, fontSize: '0.82rem', color: '#475569' }}>
                  <div><strong>Case ID:</strong> {selectedPrescription.caseId}</div>
                  <div><strong>Attending Doctor:</strong> {selectedPrescription.doctorName}</div>
                  <div><strong>Consultation:</strong> {selectedPrescription.consultationDate}</div>
                  <div><strong>Phone:</strong> {selectedPrescription.mobile}</div>
                </div>

                {/* Patient Known Allergies if any */}
                {selectedPrescription.allergies && selectedPrescription.allergies.length > 0 && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={16} color="#dc2626" />
                    <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>
                      Known Allergies: {selectedPrescription.allergies.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Dispensed Items List */}
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 12 }}>
                  Select Dispensed Medicine to Return:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedPrescription.items.map(item => {
                    const isSelected = selectedItemId === item.id;
                    const batchAlloc = item.batchAllocations?.[0]?.batchNumber || 'BAT-2575';

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setReturnQty(Math.min(1, item.dispensedQty));
                        }}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          border: `2px solid ${isSelected ? '#059669' : '#e2e8f0'}`,
                          background: isSelected ? '#ecfdf5' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                              {item.drugName}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4 }}>
                              {item.formulation}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>
                            Dispensed: {item.dispensedQty} units • Unit MRP: ₹{item.unitPrice} • Batch: <code style={{ color: '#0f172a', fontWeight: 600 }}>{batchAlloc}</code>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                            ₹{(item.dispensedQty * item.unitPrice).toFixed(2)}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: 4,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: isSelected ? '#059669' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#475569'
                          }}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              Search a case above to display patient prescription details.
            </div>
          )}

          {/* Safety & Pharmacovigilance Note */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 16, display: 'flex', gap: 12 }}>
            <AlertCircle size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.83rem', color: '#1e40af', lineHeight: 1.5 }}>
              <strong>Clinical Pharmacovigilance Rule:</strong> When processing returns triggered by Adverse Drug Reactions (ADRs), an automatic Special Clinical Note is pinned to the patient’s permanent electronic medical record. This prevents re-prescription by any attending doctor.
            </div>
          </div>
        </div>

        {/* Right: Return Submission Form */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <RotateCcw size={20} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Return Protocol & Ledger Credit
            </h3>
          </div>

          {currentReturnItem ? (
            <form onSubmit={handleProcessReturn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Selected Drug Confirmation */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Returning Item:</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{currentReturnItem.drugName}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                  Allocated Batch: <strong style={{ color: '#059669' }}>{allocatedBatchNumber}</strong> • Original Dispensed: {currentReturnItem.dispensedQty} units
                </div>
              </div>

              {/* Quantity Returned */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Quantity to Return (Units) *
                  </label>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Max: {currentReturnItem.dispensedQty}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={currentReturnItem.dispensedQty}
                  required
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.min(currentReturnItem.dispensedQty, Math.max(1, Number(e.target.value))))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Clinical Reason for Return */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Clinical / Administrative Reason *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff'
                  }}
                >
                  <option value="Adverse Drug Reaction (Skin Rash / Erythema)">Adverse Drug Reaction (Skin Rash / Erythema)</option>
                  <option value="Doctor Altered Prescription / Discontinued">Doctor Altered Prescription / Discontinued</option>
                  <option value="Patient Intolerance / Nausea & GI Distress">Patient Intolerance / Nausea & GI Distress</option>
                  <option value="Incorrect Formulation Dispensed">Incorrect Formulation Dispensed</option>
                  <option value="Treatment Course Shortened">Treatment Course Shortened</option>
                  <option value="Patient Refused / Left Against Medical Advice">Patient Refused / Left Against Medical Advice</option>
                </select>
              </div>

              {/* Clinical Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Detailed Pharmacovigilance Note (Saved to Patient Record)
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Describe patient symptoms, timing of reaction, and physician instructions..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Refund Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  Refund Disbursement Channel
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setRefundMode('CASH')}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      border: `1px solid ${refundMode === 'CASH' ? '#059669' : '#cbd5e1'}`,
                      background: refundMode === 'CASH' ? '#ecfdf5' : '#ffffff',
                      color: refundMode === 'CASH' ? '#059669' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    💵 Direct Cash Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMode('PATIENT_LEDGER')}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      border: `1px solid ${refundMode === 'PATIENT_LEDGER' ? '#059669' : '#cbd5e1'}`,
                      background: refundMode === 'PATIENT_LEDGER' ? '#ecfdf5' : '#ffffff',
                      color: refundMode === 'PATIENT_LEDGER' ? '#059669' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    💳 Patient Ledger Credit
                  </button>
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>
                  <span>Medicine Value ({returnQty} x ₹{currentReturnItem.unitPrice}):</span>
                  <span>₹{refundSubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: 8 }}>
                  <span>5% GST Refund Adjustment:</span>
                  <span>₹{refundTax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#059669', borderTop: '1px dashed #cbd5e1', paddingTop: 8 }}>
                  <span>Total Refund Due:</span>
                  <span>₹{refundTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  marginTop: 4
                }}
              >
                <RotateCcw size={18} /> Confirm Return & Re-credit Batch
              </button>
            </form>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
              Select a medicine from the left to configure returns.
            </div>
          )}
        </div>

      </div>

      {/* Historical Returns Audit Log */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="#059669" /> Recent Medication Return Transactions
        </h3>

        {returnMovements.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Date</th>
                  <th style={{ padding: '10px 14px' }}>Medication</th>
                  <th style={{ padding: '10px 14px' }}>Batch Re-credited</th>
                  <th style={{ padding: '10px 14px' }}>Qty Re-credited</th>
                  <th style={{ padding: '10px 14px' }}>Case Reference & Reason</th>
                  <th style={{ padding: '10px 14px' }}>Pharmacist</th>
                </tr>
              </thead>
              <tbody>
                {returnMovements.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{m.date}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{m.drugName}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>{m.batchNumber}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#16a34a' }}>+{m.quantity}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{m.reference}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            No return transactions recorded today.
          </div>
        )}
      </div>

      {/* Return Receipt Modal */}
      {returnReceipt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
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
            maxWidth: 500,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ background: '#059669', color: '#ffffff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Return Credit Slip</h3>
                  <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Ref: {returnReceipt.returnRef}</div>
                </div>
              </div>
              <button onClick={() => setReturnReceipt(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Patient Name:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{returnReceipt.patientName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Case Reference:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{returnReceipt.caseId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Date & Time:</span>
                  <span style={{ color: '#475569' }}>{returnReceipt.timestamp}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{returnReceipt.drugName}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                  Batch Re-credited: <strong style={{ color: '#059669' }}>{returnReceipt.batchNumber}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Returned Quantity: <strong>{returnReceipt.quantity} units</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#d97706', marginTop: 4 }}>
                  Reason: {returnReceipt.reason}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#ecfdf5', borderRadius: 8, marginBottom: 18 }}>
                <span style={{ fontWeight: 700, color: '#065f46' }}>Total Amount Refunded:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>₹{returnReceipt.refundTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} /> Print Credit Slip
                </button>
                <button
                  onClick={() => setReturnReceipt(null)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
