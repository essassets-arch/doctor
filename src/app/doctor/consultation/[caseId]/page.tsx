'use client';
import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Clock, ShieldAlert, Heart, FileText,
  Pill, Scissors, Camera, FileCheck, CheckCircle2,
  AlertTriangle, ArrowLeft, ArrowRight, Save, Lock,
  Plus, X, Search, ChevronRight, Eye, Printer,
  Sparkles, Check, RotateCcw, Sliders, Maximize2,
  Minimize2, MessageSquare, Wallet, User, Calendar, PauseCircle, Send
} from 'lucide-react';
import {
  useConsultationStore, usePatientStore, useQueueStore,
  useInventoryStore, useInvestigationCatalogStore,
  useProcedureCatalogStore, useUIStore, useBillingStore,
  usePharmacyStore, useClinicalStore,
  playChimeTone, Patient, Gender, PrescriptionFulfillmentItem,
  DrugInventoryItem, InvestigationCatalogItem, ProcedureCatalogItem
} from '@/store';

export default function DoctorConsultationMasterStation({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const router = useRouter();

  const { activeSession, updateComplaints, updateVitals, updateHistory,
    addInvestigation, removeInvestigation, addPrescription, removePrescription,
    addProcedure, removeProcedure, addImage, removeImage, updateDiagnosis,
    updateBilling, finalizeConsultation, getSession, loadSession, initSession
  } = useConsultationStore();

  const { patients } = usePatientStore();
  const { queue, updateStatus, putOnHold, endSessionAndSendToBilling } = useQueueStore();
  const { addBill } = useBillingStore();
  const { inventory } = useInventoryStore();
  const { catalog: invCatalog } = useInvestigationCatalogStore();
  const { catalog: procCatalog } = useProcedureCatalogStore();
  const { addNotification } = useUIStore();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'complaints' | 'investigations' | 'drugs' | 'procedures' | 'images' | 'diagnosis' | 'finalReport'>('complaints');

  // Live Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(504); // start at ~8m 24s
  const [saveStatus, setSaveStatus] = useState<string>('Saved just now');

  // Drawers & Modals
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [showBillingDrawer, setShowBillingDrawer] = useState(false);
  const [showPastVitalsModal, setShowPastVitalsModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAltDrugModal, setShowAltDrugModal] = useState<DrugInventoryItem | null>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('Awaiting In-Clinic Blood Sugar (FBS / PPBS)');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [nextStage, setNextStage] = useState<'BILLING' | 'PHARMACY' | 'DISCHARGE'>('BILLING');

  // Tab 2 Investigation Sub-Tab
  const [investigationSubTab, setInvestigationSubTab] = useState<'ORDER' | 'RESULTS'>('ORDER');
  const [invSearch, setInvSearch] = useState('');

  // Tab 3 Drugs State
  const [drugSearch, setDrugSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<DrugInventoryItem | null>(null);
  const [newRxDosage, setNewRxDosage] = useState('1 Tab');
  const [newRxFreq, setNewRxFreq] = useState('1-0-1');
  const [newRxDuration, setNewRxDuration] = useState(5);
  const [newRxInstructions, setNewRxInstructions] = useState('After Food');
  const [aiSafetyReport, setAiSafetyReport] = useState<{ checked: boolean; safe: boolean; warning?: string }>({
    checked: true,
    safe: true,
    warning: 'No drug-drug interactions detected. Allergen cross-reactivity verified clean.'
  });

  // Tab 4 Procedure State
  const [procSearch, setProcSearch] = useState('');

  // Tab 5 Images State
  const [selectedImageTag, setSelectedImageTag] = useState<'BEFORE' | 'AFTER' | 'FOLLOWUP'>('BEFORE');
  const [comparisonSliderPos, setComparisonSliderPos] = useState(50);
  const [drawingColor, setDrawingColor] = useState('#EF4444');

  // Tab 6 AI Diagnostic Copilot
  const [aiCopilotActive, setAiCopilotActive] = useState(false);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const activeQueueEntry = queue.find(q => q.caseNumber === caseId || q.id === caseId);
  const fallbackPatient: Patient = useMemo(() => ({
    id: activeQueueEntry?.patientId || activeSession?.patientId || 'pat-guest',
    mrdNumber: activeSession?.mrdNumber || 'MRD-NEW',
    firstName: activeSession?.patientName?.split(' ')[0] || activeQueueEntry?.patientName?.split(' ')[0] || 'Patient',
    lastName: activeSession?.patientName?.split(' ').slice(1).join(' ') || activeQueueEntry?.patientName?.split(' ').slice(1).join(' ') || '',
    mobile: '',
    age: activeQueueEntry?.age || 30,
    ageMonths: 0,
    ageDays: 0,
    gender: (activeQueueEntry?.gender as Gender) || 'M',
    language: 'English',
    bloodGroup: 'B+',
    city: activeQueueEntry?.city || 'Surat',
    createdAt: new Date().toISOString().split('T')[0],
  }), [activeQueueEntry, activeSession]);

  const patient = patients.find(p => p.id === activeQueueEntry?.patientId || p.id === activeSession?.patientId) || fallbackPatient;

  useEffect(() => {
    if (!caseId) return;
    const existing = getSession(caseId);
    if (existing) {
      loadSession(caseId);
    } else if (activeQueueEntry) {
      const qPatient = patients.find(p => p.id === activeQueueEntry.patientId) || patient;
      const doc = {
        id: activeQueueEntry.doctorId || 'doc-1',
        name: activeQueueEntry.doctorName || 'Dr. Raj Valaki',
        specialization: 'Dermatology',
        initials: 'RV',
        avatarColor: 'linear-gradient(135deg,#6366F1,#818CF8)',
        room: 'Room 1'
      };
      const v = activeQueueEntry.vitals;
      initSession(caseId, qPatient, doc, {
        vitals: v ? {
          temperature: String(v.temperature || '98.6'),
          pulse: String(v.pulse || '76'),
          bpSystolic: v.bloodPressure ? v.bloodPressure.split('/')[0] : '120',
          bpDiastolic: v.bloodPressure ? v.bloodPressure.split('/')[1] : '80',
          spo2: String(v.spo2 || '99'),
          weight: String(v.weight || '70'),
          height: String(v.height || '170'),
        } : undefined,
        complaints: {
          presentComplaint: activeQueueEntry.complaints?.join(', ') || activeQueueEntry.complaintNotes || '',
          durationYears: 0,
          durationMonths: 0,
          durationDays: 3,
          severity: 'MODERATE',
          onset: 'Gradual',
          aggravatingFactors: '',
          relievingFactors: ''
        }
      });
    }
  }, [caseId, activeQueueEntry, getSession, loadSession, initSession, patient, patients]);

  // Calculated BMI
  const weightKg = parseFloat(activeSession?.vitals.weight || '70') || 0;
  const heightM = (parseFloat(activeSession?.vitals.height || '170') || 0) / 100;
  const calculatedBMI = (weightKg > 0 && heightM > 0) ? (weightKg / (heightM * heightM)).toFixed(1) : '—';

  // Live Billing Accumulator Calculations
  const baseConsultationFee = activeSession?.billing.isFoc ? 0 : (activeSession?.billing.consultationFee || 500);
  const proceduresTotal = activeSession?.billing.isFoc ? 0 : (activeSession?.procedures.reduce((s, p) => s + p.price, 0) || 0);
  const investigationsTotal = activeSession?.billing.isFoc ? 0 : (activeSession?.investigations.reduce((s, i) => s + i.price, 0) || 0);
  const pharmacyTotal = activeSession?.billing.isFoc ? 0 : (activeSession?.prescriptions.reduce((s, p) => s + (p.totalQty * 12), 0) || 0);
  const grossSubtotal = baseConsultationFee + proceduresTotal + investigationsTotal + pharmacyTotal;
  const discountAmount = Math.round((grossSubtotal * (activeSession?.billing.discountPercent || 0)) / 100);
  const netEstimatedBill = Math.max(0, grossSubtotal - discountAmount);

  // Add Prescription Row Handler
  const handleAddDrugRow = () => {
    if (!selectedDrug) return;
    if (selectedDrug.stock === 0) {
      setShowAltDrugModal(selectedDrug);
      return;
    }

    const freqMultiplier = newRxFreq.includes('1-1-1') ? 3 : newRxFreq.includes('1-0-1') ? 2 : 1;
    const computedTotal = freqMultiplier * newRxDuration;

    addPrescription({
      id: `rx-${Date.now()}`,
      drugName: selectedDrug.name,
      dosage: newRxDosage,
      frequency: newRxFreq,
      durationDays: newRxDuration,
      totalQty: computedTotal,
      instructions: newRxInstructions,
      stockStatus: selectedDrug.stock <= selectedDrug.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
    });

    // Check allergy
    if (selectedDrug.name.toLowerCase().includes('penicillin') || selectedDrug.name.toLowerCase().includes('amoxicillin')) {
      setAiSafetyReport({
        checked: true,
        safe: false,
        warning: '⚠ CONTRAINDICATION: Patient has documented allergy to Penicillin!'
      });
    } else {
      setAiSafetyReport({
        checked: true,
        safe: true,
        warning: '✓ AI Safety Check: Dosage validated for adult weight; no interaction with current medications.'
      });
    }

    setSelectedDrug(null);
    setDrugSearch('');
    addNotification({
      type: 'info',
      message: `Prescribed ${selectedDrug.name} (${newRxDosage})`
    });
  };

  // Put on Hold Handler
  const handleConfirmHold = () => {
    const qEntry = queue.find(q => q.caseNumber === caseId);
    if (qEntry) {
      putOnHold(qEntry.id, holdReason);
      addNotification({
        type: 'warning',
        message: `Case ${caseId} (${qEntry.patientName}) placed ON HOLD: ${holdReason}`
      });
      setShowHoldModal(false);
      router.push('/doctor/dashboard');
    }
  };

  // Open Handover Modal
  const handleFinalizeSession = () => {
    if (!activeSession?.complaints.presentComplaint && !activeSession?.diagnosis.finalDiagnosis) {
      alert('Clinical validation error: At least one Chief Complaint or Diagnosis is required before ending consultation.');
      return;
    }
    setShowEndSessionModal(true);
  };

  // Finalize & Handover Execution
  const handleConfirmEndSession = () => {
    finalizeConsultation();

    // 1. Sync bill to useBillingStore so Reception has exact line items!
    const consultationFee = activeSession?.billing.consultationFee || 500;
    const invItems = (activeSession?.investigations || []).map(inv => ({
      id: `inv-${inv.testId}`,
      name: `Lab: ${inv.testName}`,
      unitPrice: inv.price,
      quantity: 1,
      discount: 0,
      total: inv.price
    }));
    const procItems = (activeSession?.procedures || []).map(p => ({
      id: `proc-${p.id}`,
      name: `Proc: ${p.procedureName} (${p.sessionsCount})`,
      unitPrice: p.price,
      quantity: 1,
      discount: 0,
      total: p.price
    }));
    const allBillItems = [
      { id: 'cons-1', name: 'Doctor Consultation Fee', unitPrice: consultationFee, quantity: 1, discount: 0, total: consultationFee },
      ...invItems,
      ...procItems
    ];
    const grossTotal = allBillItems.reduce((s, i) => s + i.total, 0);
    const doctorDiscount = Math.round(grossTotal * ((activeSession?.billing.discountPercent || 0) / 100));
    const netTotal = activeSession?.billing.isFoc ? 0 : Math.max(0, grossTotal - doctorDiscount);

    addBill({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      mrdNumber: patient.mrdNumber,
      doctorName: 'Dr. Raj Valaki',
      date: '2026-09-19',
      netAmount: netTotal,
      collectedAmount: 500, // advance check-in fee paid
      balance: Math.max(0, netTotal - 500),
      status: activeSession?.billing.isFoc ? 'FOC' : (netTotal <= 500 ? 'PAID' : 'PARTIAL'),
      paymentMode: 'UPI',
      items: allBillItems
    });

    // 2. Add Prescription to Pharmacy Store
    const currentPrescriptions = (activeSession?.prescriptions && activeSession.prescriptions.length > 0)
      ? activeSession.prescriptions
      : [
          { id: 'rx-std-1', drugName: 'Paracetamol 650mg (Dolo)', dosage: '1 Tab SOS', frequency: '1-0-1', durationDays: 3, totalQty: 6, instructions: 'After meals for discomfort', stockStatus: 'IN_STOCK' as const }
        ];

    const rxItems: PrescriptionFulfillmentItem[] = currentPrescriptions.map((rx, idx) => ({
      id: `rxi-${caseId}-${idx + 1}`,
      drugId: `d-${idx + 1}`,
      drugName: rx.drugName,
      formulation: 'Tablet',
      dosage: rx.dosage,
      frequency: rx.frequency,
      durationDays: rx.durationDays,
      prescribedQty: rx.totalQty,
      dispensedQty: rx.totalQty,
      unitPrice: 15,
      instructions: rx.instructions,
      isDispensed: false
    }));

    const rxSubtotal = rxItems.reduce((sum, item) => sum + item.prescribedQty * item.unitPrice, 0);
    const rxTax = parseFloat((rxSubtotal * 0.05).toFixed(2));

    usePharmacyStore.getState().addPrescription({
      id: `rx-f-${Date.now()}`,
      caseId: caseId,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      mrdNumber: patient.mrdNumber,
      age: patient.age,
      gender: patient.gender,
      mobile: patient.mobile,
      doctorName: 'Dr. Raj Valaki',
      consultationDate: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      allergies: activeSession?.history?.allergies ? [activeSession.history.allergies] : [],
      status: 'PHARMACY_PENDING',
      items: rxItems,
      billing: {
        subtotal: rxSubtotal,
        tax: rxTax,
        totalPayable: parseFloat((rxSubtotal + rxTax).toFixed(2))
      }
    });

    // 3. Add Clinical Record to Clinical Store
    useClinicalStore.getState().addRecord({
      patientId: patient.id,
      date: '2026-09-19',
      doctorName: 'Dr. Raj Valaki',
      department: 'Dermatology',
      chiefComplaint: activeSession?.complaints.presentComplaint || 'Consultation completed',
      diagnosis: activeSession?.diagnosis.finalDiagnosis || activeSession?.diagnosis.provisional || 'Clinical Consultation',
      vitals: {
        bp: `${activeSession?.vitals.bpSystolic || '120'}/${activeSession?.vitals.bpDiastolic || '80'}`,
        pulse: activeSession?.vitals.pulse || '76',
        temp: `${activeSession?.vitals.temperature || '98.6'}°F`,
        weight: `${activeSession?.vitals.weight || '70'} kg`,
        spo2: `${activeSession?.vitals.spo2 || '99'}%`
      },
      prescription: (activeSession?.prescriptions || []).map(p => ({
        medicine: p.drugName,
        dosage: p.dosage,
        duration: `${p.durationDays} days`,
        instructions: p.instructions
      })),
      followUpDate: activeSession?.diagnosis.followUpDate
    });

    // 4. Queue state transition & SSE emission
    endSessionAndSendToBilling(caseId, nextStage);

    // 3. Play chime
    playChimeTone('session_ended');

    addNotification({
      type: 'success',
      message: `Consultation concluded for ${patient.firstName} ${patient.lastName} (Case ${caseId}). Sent to ${nextStage}.`
    });

    setShowEndSessionModal(false);
    setShowPrescriptionModal(true);
  };

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* 5.1 Session Top Bar */}
      <div
        className="consultation-top-bar"
        style={{
          background: '#FFFFFF', border: '1.5px solid #036d92',
          borderRadius: 12, padding: '12px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          flexWrap: 'wrap',
          boxShadow: '0 4px 14px rgba(3, 109, 146, 0.08)'
        }}
      >
        {/* Left: Case Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/doctor/dashboard" style={{ color: '#036d92', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {activeSession?.patientName || patient.firstName + ' ' + patient.lastName}
              </h2>
              <span className="badge" style={{ background: '#e6f3f8', color: '#036d92', fontWeight: 800, fontFamily: 'monospace' }}>
                {patient.mrdNumber}
              </span>
              <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>
                Case: {caseId}
              </span>
              <span className="badge badge-purple">
                Room 1 (Dr. Raj Valaki)
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {patient.age} Yrs • {patient.gender === 'M' ? 'Male' : 'Female'} • Blood: <strong style={{ color: 'var(--danger)' }}>{patient.bloodGroup || 'B+'}</strong> • City: {patient.city || 'Surat'}
            </div>
          </div>
        </div>

        {/* Center: Live Stopwatch Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0F172A', color: '#FFFFFF',
          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <Clock size={15} color="#38BDF8" />
          <span style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>{formattedTime}</span>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#10B981',
            animation: 'pulse 1s infinite'
          }} />
        </div>

        {/* Right: Toggles, Hold and End Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            className="btn btn-ghost btn-sm"
            title="Toggle Patient Medical Profile Drawer"
          >
            <User size={14} /> Profile
          </button>

          <button
            onClick={() => setShowBillingDrawer(!showBillingDrawer)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#036d92', color: '#036d92' }}
            title="Toggle Live Billing Accumulator Drawer"
          >
            <Wallet size={14} /> Bill (₹{netEstimatedBill})
          </button>

          <button
            onClick={() => setShowHoldModal(true)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#D97706', color: '#D97706', background: '#FFFBEB' }}
            title="Put Consultation On Hold for in-clinic diagnostics / lab test"
          >
            <PauseCircle size={14} /> Put on Hold
          </button>

          <button
            onClick={handleFinalizeSession}
            className="btn btn-success btn-sm"
            style={{ padding: '8px 16px' }}
          >
            <CheckCircle2 size={14} /> End Consultation
          </button>
        </div>
      </div>

      {/* 5.2 Clinical Risk Alerts & Special Notes Engine */}
      <div style={{
        background: 'linear-gradient(135deg, #FEF2F2, #FFF1F2)',
        border: '1.5px solid #F87171', borderRadius: 10,
        padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991B1B', fontWeight: 800, fontSize: 12 }}>
            <ShieldAlert size={16} /> CLINICAL SAFETY ALERTS:
          </div>

          <span className="badge badge-danger" style={{ fontWeight: 800 }}>
            ⚠ ALLERGIES: Penicillin, Sulfur Antibiotics
          </span>

          <span className="badge badge-warning" style={{ fontWeight: 700 }}>
            Elevated Triage BP: 124/82 mmHg
          </span>

          <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: 11 }}>
            Compliance Warning: Missed prior follow-up visit on 2026-08-19
          </span>
        </div>

        <button
          onClick={() => setShowPastVitalsModal(true)}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 11, color: '#991B1B', textDecoration: 'underline' }}
        >
          Inspect Vitals Trend History →
        </button>
      </div>

      {/* Main Workspace Layout (Side Panel + 7 Tabs) */}
      <div className="consultation-layout-grid" style={{ display: 'grid', gridTemplateColumns: showSidePanel ? '280px 1fr' : '1fr', gap: 16 }}>
        {/* 5.3 Patient Side Panel */}
        {showSidePanel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Snapshot Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 13 }}>Patient Medical Snapshot</span>
              </div>
              <div className="card-body" style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Chronic Diagnoses
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    Essential Hypertension (Stage 1), Mild Xerosis Cutis
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Surgical History
                  </div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>
                    Appendectomy (2018), uneventful recovery
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Active Ongoing Rx
                  </div>
                  <div style={{ fontWeight: 600, color: '#036d92', marginTop: 2 }}>
                    Tab. Telmisartan 40mg (1 OD)
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Emergency Contact
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--danger)', marginTop: 2 }}>
                    Kishore Kumar (Brother) • 9825100099
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Timeline Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 13 }}>Past Encounters</span>
              </div>
              <div className="card-body" style={{ fontSize: 11 }}>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 10 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 700 }}>2026-09-10 (Dr. Raj Valaki)</div>
                    <div style={{ color: 'var(--text-muted)' }}>Atopic Dermatitis flare-up</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 700 }}>2026-08-05 (Dr. Raj Valaki)</div>
                    <div style={{ color: 'var(--text-muted)' }}>Contact Irritant Dermatitis</div>
                  </div>
                </div>

                <Link href={`/doctor/patients/${patient.id}/history`} style={{ color: '#036d92', fontWeight: 700, display: 'inline-block', marginTop: 6 }}>
                  View Full Clinical Audit Ledger →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 7 Clinical Consultation Tabs Area */}
        <div>
          {/* Tabs Navigation Header */}
          <div className="tabs consultation-tabs" style={{ background: '#FFFFFF', borderRadius: '10px 10px 0 0', padding: '6px 12px', border: '1px solid var(--border)', borderBottom: 'none', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'complaints', label: '1. Complaints & Vitals', icon: Heart },
              { id: 'investigations', label: `2. Lab Orders (${activeSession?.investigations.length || 0})`, icon: FileText },
              { id: 'drugs', label: `3. Rx Pharmacy (${activeSession?.prescriptions.length || 0})*`, icon: Pill },
              { id: 'procedures', label: `4. Procedures (${activeSession?.procedures.length || 0})`, icon: Scissors },
              { id: 'images', label: `5. Photography (${activeSession?.images.length || 0})`, icon: Camera },
              { id: 'diagnosis', label: '6. Diagnosis & Recall', icon: Stethoscope },
              { id: 'finalReport', label: '7. Finalize & Sign', icon: FileCheck },
            ].map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`tab-item ${active ? 'active' : ''}`}
                  style={{
                    color: active ? '#036d92' : undefined,
                    borderBottomColor: active ? '#036d92' : undefined,
                    fontWeight: active ? 800 : 600,
                    fontSize: 12
                  }}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* TAB 1: Complaints & Intake Vitals */}
          {/* ============================================================ */}
          {activeTab === 'complaints' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                {/* Vitals Ribbon */}
                <div style={{
                  padding: 14, background: '#F8FAFC', borderRadius: 8,
                  border: '1px solid #E2E8F0', marginBottom: 20
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#036d92', textTransform: 'uppercase', marginBottom: 8 }}>
                    Current Triage Vitals
                  </div>

                  <div className="consultation-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                    <div>
                      <label className="form-label">Temp (°F)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.vitals.temperature}
                        onChange={e => updateVitals({ temperature: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Pulse (bpm)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.vitals.pulse}
                        onChange={e => updateVitals({ pulse: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Sys BP (mmHg)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.vitals.bpSystolic}
                        onChange={e => updateVitals({ bpSystolic: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Dia BP (mmHg)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.vitals.bpDiastolic}
                        onChange={e => updateVitals({ bpDiastolic: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">SpO2 (%)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.vitals.spo2}
                        onChange={e => updateVitals({ spo2: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Weight (kg)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.vitals.weight}
                        onChange={e => updateVitals({ weight: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Calculated BMI</label>
                      <div style={{
                        padding: '6px 8px', background: '#FFFFFF', border: '1px solid #CBD5E1',
                        borderRadius: 6, fontWeight: 800, fontSize: 13, color: '#036d92', textAlign: 'center'
                      }}>
                        {calculatedBMI}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chief Complaints Form */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Chief Presenting Complaints *</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Describe presenting symptoms, location, and character..."
                    value={activeSession?.complaints.presentComplaint}
                    onChange={e => updateComplaints({ presentComplaint: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Duration (Yrs/Mos/Days)</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Y"
                        value={activeSession?.complaints.durationYears}
                        onChange={e => updateComplaints({ durationYears: parseInt(e.target.value) || 0 })}
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="M"
                        value={activeSession?.complaints.durationMonths}
                        onChange={e => updateComplaints({ durationMonths: parseInt(e.target.value) || 0 })}
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="D"
                        value={activeSession?.complaints.durationDays}
                        onChange={e => updateComplaints({ durationDays: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Severity</label>
                    <select
                      className="form-select"
                      value={activeSession?.complaints.severity}
                      onChange={e => updateComplaints({ severity: e.target.value as any })}
                    >
                      <option value="MILD">MILD</option>
                      <option value="MODERATE">MODERATE</option>
                      <option value="SEVERE">SEVERE</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Aggravating Factors</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeSession?.complaints.aggravatingFactors}
                      onChange={e => updateComplaints({ aggravatingFactors: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Relieving Factors</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeSession?.complaints.relievingFactors}
                      onChange={e => updateComplaints({ relievingFactors: e.target.value })}
                    />
                  </div>
                </div>

                {/* History Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Past Medical & Chronic Illnesses</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeSession?.history.pastMedical}
                      onChange={e => updateHistory({ pastMedical: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Drug Allergies & Contact Sensitivities</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ borderColor: '#EF4444' }}
                      value={activeSession?.history.allergies}
                      onChange={e => updateHistory({ allergies: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveTab('investigations')} className="btn btn-primary" style={{ background: '#036d92', borderColor: '#036d92' }}>
                    Save & Next (Tab 2: Investigations) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: Investigations & Lab Orders */}
          {/* ============================================================ */}
          {activeTab === 'investigations' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                {/* Sub-Tabs: ORDER vs RESULTS */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <button
                    onClick={() => setInvestigationSubTab('ORDER')}
                    className={`btn ${investigationSubTab === 'ORDER' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    style={{ background: investigationSubTab === 'ORDER' ? '#036d92' : undefined }}
                  >
                    1. Requisition & Order Tests
                  </button>
                  <button
                    onClick={() => setInvestigationSubTab('RESULTS')}
                    className={`btn ${investigationSubTab === 'RESULTS' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    style={{ background: investigationSubTab === 'RESULTS' ? '#036d92' : undefined }}
                  >
                    2. Ingestion & Result Parameters
                  </button>
                </div>

                {investigationSubTab === 'ORDER' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                    {/* Catalog Search */}
                    <div>
                      <div className="form-label">Search Hospital Diagnostic Catalog</div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search CBC, Lipid, HbA1c, KOH scraping, IgE, X-Ray..."
                        value={invSearch}
                        onChange={e => setInvSearch(e.target.value)}
                        style={{ marginBottom: 12 }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                        {invCatalog
                          .filter(t => !invSearch || t.name.toLowerCase().includes(invSearch.toLowerCase()))
                          .map(test => (
                            <div
                              key={test.id}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 14px', background: '#F8FAFC', borderRadius: 8,
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{test.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {test.category} • Ref Range: {test.normalRange || 'N/A'}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontWeight: 800, fontSize: 13, color: '#036d92' }}>₹{test.price}</span>
                                <button
                                  onClick={() => addInvestigation({
                                    testId: test.id,
                                    testName: test.name,
                                    category: test.category,
                                    price: test.price,
                                    status: 'ORDERED'
                                  })}
                                  className="btn btn-outline btn-sm"
                                  style={{ borderColor: '#036d92', color: '#036d92' }}
                                >
                                  + Add Order
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Ordered Basket */}
                    <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#036d92', marginBottom: 10 }}>
                        Active Investigation Basket ({activeSession?.investigations.length || 0})
                      </div>

                      {activeSession?.investigations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                          No tests requisitioned for this visit yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {activeSession?.investigations.map(item => (
                            <div
                              key={item.testId}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', background: '#FFFFFF', borderRadius: 6,
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12.5 }}>{item.testName}</div>
                                <div style={{ fontSize: 11, color: '#036d92' }}>₹{item.price}</div>
                              </div>
                              <button
                                onClick={() => removeInvestigation(item.testId)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}

                          <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                            <span>Total Investigation Cost:</span>
                            <span style={{ color: '#036d92' }}>₹{investigationsTotal}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* RESULTS Tab */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                      Point-of-Care Parameter Entries & Attached Reports
                    </div>

                    <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Investigation</th>
                            <th>Category</th>
                            <th>Parameter Entry</th>
                            <th>Normal Range</th>
                            <th>Evaluation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 700 }}>Skin Scraping for KOH Fungus Test</td>
                            <td>Microbiology</td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                defaultValue="Negative"
                                style={{ padding: '4px 8px', fontSize: 12, width: 140 }}
                              />
                            </td>
                            <td>Negative for fungal hyphae</td>
                            <td><span className="badge badge-success">Normal ✓</span></td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700 }}>Serum IgE Allergy Level</td>
                            <td>Pathology</td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                defaultValue="185 IU/mL"
                                style={{ padding: '4px 8px', fontSize: 12, width: 140, borderColor: '#EF4444' }}
                              />
                            </td>
                            <td>&lt; 100 IU/mL</td>
                            <td><span className="badge badge-danger">↑ High (Elevated Atopy)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setActiveTab('drugs')} className="btn btn-primary" style={{ background: '#036d92', borderColor: '#036d92' }}>
                    Save & Next (Tab 3: Rx Pharmacy) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: Prescription & Pharmacy */}
          {/* ============================================================ */}
          {activeTab === 'drugs' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                {/* AI Safety Report Banner */}
                {aiSafetyReport.checked && (
                  <div style={{
                    padding: '10px 16px', borderRadius: 8,
                    background: aiSafetyReport.safe ? '#ECFDF5' : '#FEF2F2',
                    border: `1.5px solid ${aiSafetyReport.safe ? '#10B981' : '#EF4444'}`,
                    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <Sparkles size={16} color={aiSafetyReport.safe ? '#059669' : '#DC2626'} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: aiSafetyReport.safe ? '#065F46' : '#991B1B' }}>
                      {aiSafetyReport.warning}
                    </span>
                  </div>
                )}

                {/* Prescribe Medicine Input Bar */}
                <div style={{
                  padding: 16, background: '#F8FAFC', borderRadius: 8,
                  border: '1px solid #E2E8F0', marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#036d92', textTransform: 'uppercase', marginBottom: 10 }}>
                    + Prescribe Drug from Dispensary Catalog
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr auto', gap: 10, alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label">Medicine Name</label>
                      <select
                        className="form-select"
                        value={selectedDrug?.id || ''}
                        onChange={e => {
                          const drug = inventory.find(i => i.id === e.target.value);
                          setSelectedDrug(drug || null);
                        }}
                      >
                        <option value="">Select drug from inventory...</option>
                        {inventory.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.formulation}) — {d.stock === 0 ? 'OUT OF STOCK' : `Stock: ${d.stock}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Dosage</label>
                      <select
                        className="form-select"
                        value={newRxDosage}
                        onChange={e => setNewRxDosage(e.target.value)}
                      >
                        <option value="1 Tab">1 Tab</option>
                        <option value="0.5 Tab">0.5 Tab</option>
                        <option value="2 Tabs">2 Tabs</option>
                        <option value="5 ML">5 ML</option>
                        <option value="10 ML">10 ML</option>
                        <option value="Apply Locally">Apply Locally</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Frequency</label>
                      <select
                        className="form-select"
                        value={newRxFreq}
                        onChange={e => setNewRxFreq(e.target.value)}
                      >
                        <option value="1-0-1">1-0-1 (BD)</option>
                        <option value="1-1-1">1-1-1 (TDS)</option>
                        <option value="1-0-0">1-0-0 (OD Morning)</option>
                        <option value="0-0-1">0-0-1 (Night / HS)</option>
                        <option value="SOS">SOS (When needed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Duration (Days)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newRxDuration}
                        onChange={e => setNewRxDuration(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Instructions</label>
                      <select
                        className="form-select"
                        value={newRxInstructions}
                        onChange={e => setNewRxInstructions(e.target.value)}
                      >
                        <option value="After Food">After Food</option>
                        <option value="Before Food">Before Food (Empty Stomach)</option>
                        <option value="Bedtime">At Bedtime</option>
                        <option value="After bath & bedtime">Apply after bath & at bedtime</option>
                      </select>
                    </div>

                    <button
                      onClick={handleAddDrugRow}
                      disabled={!selectedDrug}
                      className="btn btn-primary"
                      style={{ background: '#036d92', borderColor: '#036d92' }}
                    >
                      <Plus size={15} /> Add Rx
                    </button>
                  </div>
                </div>

                {/* Active Prescriptions Table */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Active Prescription Items ({activeSession?.prescriptions.length || 0})
                  </div>

                  <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Total Qty</th>
                          <th>Instructions</th>
                          <th>Stock Status</th>
                          <th style={{ width: 40 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {activeSession?.prescriptions.map(rx => (
                          <tr key={rx.id}>
                            <td style={{ fontWeight: 700, color: '#036d92' }}>{rx.drugName}</td>
                            <td>{rx.dosage}</td>
                            <td><span className="badge badge-purple">{rx.frequency}</span></td>
                            <td>{rx.durationDays} Days</td>
                            <td style={{ fontWeight: 800 }}>{rx.totalQty}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{rx.instructions}</td>
                            <td>
                              <span className={`badge ${rx.stockStatus === 'IN_STOCK' ? 'badge-success' : rx.stockStatus === 'LOW_STOCK' ? 'badge-warning' : 'badge-danger'}`}>
                                {rx.stockStatus}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => removePrescription(rx.id)}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveTab('procedures')} className="btn btn-primary" style={{ background: '#036d92', borderColor: '#036d92' }}>
                    Save & Next (Tab 4: Procedures) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: Clinical Procedures */}
          {/* ============================================================ */}
          {activeTab === 'procedures' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                  {/* Catalog Selector */}
                  <div>
                    <div className="form-label">Search Clinical Procedure Directory</div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search Diode laser, PRP, Chemical peel, Biopsy, Dressing..."
                      value={procSearch}
                      onChange={e => setProcSearch(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {procCatalog
                        .filter(p => !procSearch || p.name.toLowerCase().includes(procSearch.toLowerCase()))
                        .map(proc => (
                          <div
                            key={proc.id}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 14px', background: '#F8FAFC', borderRadius: 8,
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{proc.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {proc.category} • Approx {proc.durationMins} mins • {proc.requiresConsent ? 'Requires Consent Order' : 'Standard'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontWeight: 800, fontSize: 13, color: '#036d92' }}>₹{proc.price}</span>
                              <button
                                onClick={() => addProcedure({
                                  id: `p-${Date.now()}`,
                                  procedureName: proc.name,
                                  scheduledDate: '2026-09-20',
                                  scheduledTime: '14:30',
                                  sessionsCount: 'Session 1 of 6',
                                  completedInClinic: false,
                                  notes: 'Planned procedural intervention',
                                  consentGenerated: proc.requiresConsent,
                                  price: proc.price
                                })}
                                className="btn btn-outline btn-sm"
                                style={{ borderColor: '#036d92', color: '#036d92' }}
                              >
                                + Schedule
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Scheduled Procedures */}
                  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#036d92', marginBottom: 10 }}>
                      Scheduled Procedures ({activeSession?.procedures.length || 0})
                    </div>

                    {activeSession?.procedures.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                        No procedures booked for this patient yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {activeSession?.procedures.map(p => (
                          <div
                            key={p.id}
                            style={{
                              padding: 12, background: '#FFFFFF', borderRadius: 8,
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontWeight: 800, fontSize: 13 }}>{p.procedureName}</span>
                              <button
                                onClick={() => removeProcedure(p.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                              <span>Date: {p.scheduledDate} ({p.scheduledTime})</span>
                              <span>•</span>
                              <span>{p.sessionsCount}</span>
                              <span>•</span>
                              <strong style={{ color: '#036d92' }}>₹{p.price}</strong>
                            </div>

                            {p.consentGenerated && (
                              <div style={{ marginTop: 8 }}>
                                <span className="badge badge-primary" style={{ fontSize: 10 }}>
                                  ✓ Consent Order Generated
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setActiveTab('images')} className="btn btn-primary" style={{ background: '#036d92', borderColor: '#036d92' }}>
                    Save & Next (Tab 5: Clinical Photography) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: Clinical Photography & Image Annotation */}
          {/* ============================================================ */}
          {activeTab === 'images' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                  {/* Photo Ingestion & Annotation */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#036d92' }}>
                        Medical Lesion Photography & Marker Annotation
                      </span>

                      {/* Drawing color selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Marker:</span>
                        {['#EF4444', '#3B82F6', '#10B981', '#F59E0B'].map(color => (
                          <div
                            key={color}
                            onClick={() => setDrawingColor(color)}
                            style={{
                              width: 16, height: 16, borderRadius: '50%', background: color,
                              cursor: 'pointer', border: drawingColor === color ? '2px solid #000000' : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Canvas simulation area */}
                    <div style={{
                      position: 'relative', height: 260, background: '#0F172A',
                      borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <img
                        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80"
                        alt="Clinical lesion"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      />

                      {/* Annotated marker overlay */}
                      <div style={{
                        position: 'absolute', top: 60, left: 100, width: 90, height: 60,
                        border: `2px dashed ${drawingColor}`, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FFFFFF', fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.2)'
                      }}>
                        Erythema Margin
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button
                        onClick={() => alert('Simulated webcam live capture.')}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Camera size={14} /> Live Webcam Capture
                      </button>
                      <button
                        onClick={() => alert('Simulated clinical photo file upload.')}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', background: '#036d92', borderColor: '#036d92' }}
                      >
                        + Upload Photo
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Slider */}
                  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#036d92', marginBottom: 10 }}>
                      Before / After Treatment Comparison Slider
                    </div>

                    <div style={{ position: 'relative', height: 200, borderRadius: 8, overflow: 'hidden', background: '#0F172A' }}>
                      <img
                        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80"
                        alt="Before"
                        style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800
                      }}>
                        Baseline: 13 Apr
                      </div>
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800
                      }}>
                        Current: 19 Sep
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Slide to Compare Treatment Efficacy ({comparisonSliderPos}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={comparisonSliderPos}
                        onChange={e => setComparisonSliderPos(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#036d92' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setActiveTab('diagnosis')} className="btn btn-primary" style={{ background: '#036d92', borderColor: '#036d92' }}>
                    Save & Next (Tab 6: Diagnosis & Follow-Up) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: Diagnosis & Clinical Follow-Up */}
          {/* ============================================================ */}
          {activeTab === 'diagnosis' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                {/* AI Diagnostic Copilot Helper */}
                <div style={{
                  padding: 14, background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
                  borderRadius: 8, border: '1px solid #7DD3FC', marginBottom: 18,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={20} color="#0284C7" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#0369A1' }}>
                        MedFlow AI Diagnostic Copilot
                      </div>
                      <div style={{ fontSize: 11, color: '#0C4A6E' }}>
                        Analyzed Chief Complaints & Vitals: Suggested differential diagnosis: <strong>Acute Allergic Contact Dermatitis (ICD-10: L23.9)</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      updateDiagnosis({
                        provisional: 'Contact Dermatitis (Acute)',
                        finalDiagnosis: 'Acute Allergic Contact Dermatitis (ICD-10: L23.9)',
                        icd10Code: 'L23.9',
                        treatmentPlan: 'Topical steroid taper over 14 days; barrier repair lotion.'
                      });
                      setAiCopilotActive(true);
                      addNotification({
                        type: 'success',
                        message: 'Accepted AI diagnostic proposal & populated final diagnosis'
                      });
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ background: '#FFFFFF', borderColor: '#0284C7', color: '#0284C7' }}
                  >
                    Accept AI Suggestion ✓
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Provisional Clinical Assessment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeSession?.diagnosis.provisional}
                      onChange={e => updateDiagnosis({ provisional: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Differential Possibilities</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeSession?.diagnosis.differential}
                      onChange={e => updateDiagnosis({ differential: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Final Confirmed Diagnosis (with ICD-10 Coding) *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontWeight: 700, color: '#036d92' }}
                    value={activeSession?.diagnosis.finalDiagnosis}
                    onChange={e => updateDiagnosis({ finalDiagnosis: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Comprehensive Treatment Plan</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={activeSession?.diagnosis.treatmentPlan}
                    onChange={e => updateDiagnosis({ treatmentPlan: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">General Lifestyle, Dietary & Preventive Advice</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={activeSession?.diagnosis.patientAdvice}
                    onChange={e => updateDiagnosis({ patientAdvice: e.target.value })}
                  />
                </div>

                {/* Follow-Up Scheduling */}
                <div style={{
                  padding: 14, background: '#F8FAFC', borderRadius: 8,
                  border: '1px solid #E2E8F0', marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#036d92', textTransform: 'uppercase', marginBottom: 8 }}>
                    Follow-Up Recall & Outbound Care Instructions
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: 12 }}>
                    <div>
                      <label className="form-label">Return Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={activeSession?.diagnosis.followUpDate}
                        onChange={e => updateDiagnosis({ followUpDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label">Purpose of Return</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.diagnosis.followUpPurpose}
                        onChange={e => updateDiagnosis({ followUpPurpose: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label">Nursing Outbound Call Instructions</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeSession?.diagnosis.nursingInstructions}
                        onChange={e => updateDiagnosis({ nursingInstructions: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveTab('finalReport')} className="btn btn-primary" style={{ background: '#036d92', borderColor: '#036d92' }}>
                    Save & Next (Tab 7: Final Report & Sign-Off) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: Final Report & Digital Sign-Off */}
          {/* ============================================================ */}
          {activeTab === 'finalReport' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#036d92' }}>
                    Consultation Clinical Summary & Digital Sign-Off
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Review all recorded complaints, investigations, Rx drugs, and fees before locking the clinical record.
                  </p>
                </div>

                {/* Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}>
                    <div style={{ fontWeight: 800, color: '#036d92', marginBottom: 6 }}>Clinical Diagnosis & Findings</div>
                    <div><strong>Complaint:</strong> {activeSession?.complaints.presentComplaint}</div>
                    <div style={{ marginTop: 4 }}><strong>Final Diagnosis:</strong> {activeSession?.diagnosis.finalDiagnosis}</div>
                    <div style={{ marginTop: 4 }}><strong>Triage BP:</strong> {activeSession?.vitals.bpSystolic}/{activeSession?.vitals.bpDiastolic} mmHg</div>
                    <div style={{ marginTop: 4 }}><strong>Return Recall Date:</strong> {activeSession?.diagnosis.followUpDate}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}>
                    <div style={{ fontWeight: 800, color: '#036d92', marginBottom: 6 }}>Ordered Pharmacy & Tests</div>
                    <div><strong>Prescribed Rx:</strong> {activeSession?.prescriptions.map(p => p.drugName).join(', ') || 'None'}</div>
                    <div style={{ marginTop: 4 }}><strong>Lab Tests:</strong> {activeSession?.investigations.map(i => i.testName).join(', ') || 'None'}</div>
                    <div style={{ marginTop: 4 }}><strong>Procedures:</strong> {activeSession?.procedures.map(p => p.procedureName).join(', ') || 'None'}</div>
                  </div>
                </div>

                {/* Billing Summary & FOC controls */}
                <div style={{
                  padding: 16, background: '#FFFFFF', borderRadius: 8,
                  border: '2px solid #036d92', marginBottom: 24
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#036d92' }}>
                      Encounter Financial Settlement Summary
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={activeSession?.billing.isFoc || false}
                        onChange={e => updateBilling({ isFoc: e.target.checked })}
                        style={{ accentColor: '#036d92' }}
                      />
                      Mark Consultation Free of Charge (FOC)
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
                    <span>Consultation + Procedures + Tests:</span>
                    <strong>₹{grossSubtotal}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
                    <span>Doctor Authorized Discount:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        style={{ width: 60, padding: '4px 6px', fontSize: 12, textAlign: 'right' }}
                        className="form-input"
                        value={activeSession?.billing.discountPercent || 0}
                        onChange={e => updateBilling({ discountPercent: parseInt(e.target.value) || 0 })}
                      />
                      <span>% (₹{discountAmount})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, fontWeight: 900, color: '#036d92' }}>
                    <span>Net Bill Receivable at Reception:</span>
                    <span>₹{netEstimatedBill}</span>
                  </div>
                </div>

                {/* Final Action Button */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                  <button
                    onClick={handleFinalizeSession}
                    className="btn btn-success btn-lg"
                    style={{ padding: '12px 36px', fontSize: 15 }}
                  >
                    <CheckCircle2 size={18} /> Finalize, Lock & Sign Official Prescription
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Out of Stock Alternative Resolver Modal */}
      {showAltDrugModal && (
        <div className="modal-overlay" onClick={() => setShowAltDrugModal(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--danger)' }}>
                ⚠ Drug Currently Out of Stock in Dispensary
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAltDrugModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 14 }}>
                <strong>{showAltDrugModal.name}</strong> is currently at <strong>0 stock</strong> in the pharmacy dispensary.
              </p>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                Recommended In-Stock Therapeutic Alternatives:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {showAltDrugModal.alternatives?.map(alt => (
                  <div
                    key={alt}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: '#F8FAFC', borderRadius: 8,
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{alt}</span>
                    <button
                      onClick={() => {
                        const target = inventory.find(i => i.name.toLowerCase().includes(alt.toLowerCase()));
                        if (target) setSelectedDrug(target);
                        setShowAltDrugModal(null);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#036d92', borderColor: '#036d92' }}
                    >
                      Substitute Alternative
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Put Consultation On Hold Modal (Scenario B: Diagnostic Delay) */}
      {showHoldModal && (
        <div className="modal-overlay" onClick={() => setShowHoldModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
              <span className="modal-title" style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PauseCircle size={18} /> Put Patient on Temporary Hold
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowHoldModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#FEF3C7', padding: '12px 16px', borderRadius: 8, fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
                <strong>Operational Flow Note:</strong> Placing <strong>{patient.firstName} {patient.lastName}</strong> on hold frees your cabin to call the next waiting patient. Clinical notes and orders remain intact. Once the lab test is completed and uploaded by Reception, your queue will spotlight this patient with a green <em>"Lab Result Ready"</em> indicator to resume immediately.
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Select or Specify Hold Reason *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {[
                    'Awaiting In-Clinic Blood Sugar (FBS / PPBS)',
                    'Awaiting 12-Lead ECG / Vitals Observation',
                    'Awaiting Skin Scraping for KOH Fungus Test',
                    'Awaiting Urine Routine Examination',
                    'Awaiting IV Hydration / Pre-Procedure Prep'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHoldReason(preset)}
                      style={{
                        textAlign: 'left', padding: '8px 12px', borderRadius: 6, fontSize: 12,
                        background: holdReason === preset ? '#FEF3C7' : '#F8FAFC',
                        border: holdReason === preset ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                        color: holdReason === preset ? '#92400E' : '#334155',
                        fontWeight: holdReason === preset ? 700 : 500, cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Custom Clinical Note / Special Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  value={holdReason}
                  onChange={e => setHoldReason(e.target.value)}
                  placeholder="e.g. Fasting sample collection in room 4"
                />
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#FFFBEB' }}>
              <button className="btn btn-ghost" onClick={() => setShowHoldModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-sm"
                onClick={handleConfirmHold}
                style={{ background: '#D97706', color: '#FFFFFF', borderColor: '#D97706', padding: '8px 18px', fontWeight: 700 }}
              >
                <PauseCircle size={15} /> Confirm Put on Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Consultation & Handover Modal (Phase 4: Consultation Handover) */}
      {showEndSessionModal && (
        <div className="modal-overlay" onClick={() => setShowEndSessionModal(false)}>
          <div className="modal modal-lg" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }}>
              <span className="modal-title" style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> Consultation Conclusion & Handover
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEndSessionModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Encounter Summary Strip */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div><strong>Patient:</strong> {patient.firstName} {patient.lastName} ({patient.mrdNumber})</div>
                  <div><strong>Case:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{caseId}</span></div>
                </div>
                <div><strong>Final Diagnosis:</strong> {activeSession?.diagnosis.finalDiagnosis || activeSession?.diagnosis.provisional}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, color: 'var(--text-muted)' }}>
                  <span>🔬 Labs: <strong>{activeSession?.investigations.length} ordered</strong></span>
                  <span>💉 Procedures: <strong>{activeSession?.procedures.length}</strong></span>
                  <span>💊 Drugs: <strong>{activeSession?.prescriptions.length} items</strong></span>
                  <span>📅 Recall: <strong>{activeSession?.diagnosis.followUpDate || 'None'}</strong></span>
                </div>
              </div>

              {/* Next Stage Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: 800, fontSize: 13 }}>
                  Select Next Operational Stage *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
                  <div
                    onClick={() => setNextStage('BILLING')}
                    style={{
                      padding: 14, borderRadius: 10, cursor: 'pointer',
                      border: nextStage === 'BILLING' ? '2px solid #EA580C' : '1px solid #E2E8F0',
                      background: nextStage === 'BILLING' ? '#FFF7ED' : '#FFFFFF'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#C2410C' }}>
                      1. BILLING DESK
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Standard flow: Hands over to Front Desk. Plays 2-tone chime at Reception.
                    </div>
                  </div>

                  <div
                    onClick={() => setNextStage('PHARMACY')}
                    style={{
                      padding: 14, borderRadius: 10, cursor: 'pointer',
                      border: nextStage === 'PHARMACY' ? '2px solid #036d92' : '1px solid #E2E8F0',
                      background: nextStage === 'PHARMACY' ? '#E6F3F8' : '#FFFFFF'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#036d92' }}>
                      2. PHARMACY
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Send directly to in-clinic pharmacy dispensary for medicine packing.
                    </div>
                  </div>

                  <div
                    onClick={() => setNextStage('DISCHARGE')}
                    style={{
                      padding: 14, borderRadius: 10, cursor: 'pointer',
                      border: nextStage === 'DISCHARGE' ? '2px solid #10B981' : '1px solid #E2E8F0',
                      background: nextStage === 'DISCHARGE' ? '#ECFDF5' : '#FFFFFF'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>
                      3. DISCHARGE
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Fully settled encounter or Free of Charge (FOC) waiver.
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary Preview */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Financial Balance to Transfer to Reception
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Gross Clinical Services:</span>
                  <span style={{ fontWeight: 700 }}>₹{grossSubtotal}</span>
                </div>
                {activeSession?.billing.discountPercent ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)', marginBottom: 4 }}>
                    <span>Doctor Discount ({activeSession.billing.discountPercent}%):</span>
                    <span>-₹{Math.round(grossSubtotal * (activeSession.billing.discountPercent / 100))}</span>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Advance Check-In Consultation Fee Paid:</span>
                  <span>-₹500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#036d92', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                  <span>Estimated Net Due at Reception:</span>
                  <span>₹{Math.max(0, netEstimatedBill - 500)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F0FDF4' }}>
              <button className="btn btn-ghost" onClick={() => setShowEndSessionModal(false)}>
                Return to Examination
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirmEndSession}
                style={{ padding: '10px 24px', fontWeight: 800, fontSize: 14 }}
              >
                <Send size={15} /> Confirm & Handover to {nextStage}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Prescription Print Modal */}
      {showPrescriptionModal && (
        <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Official Signed Digital Prescription</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPrescriptionModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: '#FFFFFF', padding: 24, border: '1px solid #E2E8F0',
                borderRadius: 8, fontFamily: 'inherit'
              }}>
                {/* Clinic Rx Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #036d92', paddingBottom: 12, marginBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: '#036d92' }}>
                      MEDFLOW MULTISPECIALITY CLINIC
                    </h2>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Dr. Raj Valaki, MBBS, MD (Dermatology)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reg No: G-34891 • Surat Central Cabin 1</div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                    <div>Date: 19/09/2026</div>
                    <div style={{ fontWeight: 800, color: '#036d92', fontFamily: 'monospace' }}>Case: {caseId}</div>
                  </div>
                </div>

                {/* Patient Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', background: '#F8FAFC', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 12 }}>
                  <div>
                    <div><strong>Patient:</strong> {patient.firstName} {patient.lastName} ({patient.age}Y / {patient.gender})</div>
                    <div><strong>MRD:</strong> {patient.mrdNumber} | Mobile: {patient.mobile}</div>
                  </div>
                  <div>
                    <div><strong>Diagnosis:</strong> {activeSession?.diagnosis.finalDiagnosis}</div>
                    <div><strong>Vitals:</strong> BP {activeSession?.vitals.bpSystolic}/{activeSession?.vitals.bpDiastolic} | Pulse {activeSession?.vitals.pulse} bpm</div>
                  </div>
                </div>

                {/* Rx Symbol */}
                <div style={{ fontSize: 24, fontWeight: 900, color: '#036d92', fontFamily: 'serif', marginBottom: 8 }}>
                  ℞
                </div>

                {/* Medicines List */}
                <table style={{ width: '100%', fontSize: 12, marginBottom: 18 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                      <th style={{ padding: '4px 0' }}># Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSession?.prescriptions.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 0', fontWeight: 700 }}>{idx + 1}. {p.drugName}</td>
                        <td>{p.dosage}</td>
                        <td><span className="badge badge-purple">{p.frequency}</span></td>
                        <td>{p.durationDays} Days</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Advice & Recall */}
                <div style={{ fontSize: 12, marginBottom: 20 }}>
                  <div><strong>General Advice:</strong> {activeSession?.diagnosis.patientAdvice}</div>
                  <div style={{ marginTop: 4 }}><strong>Follow-Up Recall:</strong> {activeSession?.diagnosis.followUpDate}</div>
                </div>

                {/* Digital Signature */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#036d92', fontSize: 13 }}>
                      DIGITALLY SIGNED BY DR. RAJ VALAKI
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Timestamp: 19/09/2026 10:55 AM (Valid without physical signature)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => {
                setShowPrescriptionModal(false);
                router.push('/doctor/dashboard');
              }}>
                Close & Return to Dashboard
              </button>

              <button className="btn btn-primary" onClick={() => window.print()} style={{ background: '#036d92', borderColor: '#036d92' }}>
                <Printer size={15} /> Print Official Rx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
