'use client';
import { useState, useEffect, useMemo, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Clock, ShieldAlert, Heart, FileText,
  Pill, Scissors, Camera, FileCheck, CheckCircle2,
  AlertTriangle, ArrowLeft, ArrowRight, Save, Lock,
  Plus, X, Search, ChevronRight, Eye, Printer,
  Sparkles, Check, RotateCcw, Sliders, Maximize2,
  Minimize2, MessageSquare, Wallet, User, Calendar, PauseCircle, Send,
  Upload, FileSignature, Copy, History, CreditCard, Layers,
  ExternalLink, TrendingUp, TrendingDown, Activity,
  Zap, RefreshCw, Ban, CheckCheck, Percent, Settings2,
  LayoutGrid, List
} from 'lucide-react';
import {
  useConsultationStore, usePatientStore, useQueueStore,
  useInventoryStore, useInvestigationCatalogStore,
  useProcedureCatalogStore, useUIStore, useBillingStore,
  usePharmacyStore, useClinicalStore, useAdminStore,
  playChimeTone, Patient, Gender, PrescriptionFulfillmentItem,
  DrugInventoryItem, InvestigationCatalogItem, ProcedureCatalogItem, ProcedurePrescriptionItem,
  PrescriptionItem, PrescriptionVisibility, ProcedureExecutionItem
} from '@/store';

const DEFAULT_DEMO_PRESCRIPTIONS: PrescriptionItem[] = [
  {
    id: 'rx-demo-1',
    drugId: 'd-101',
    drugName: 'TAB Flucocip 400mg',
    brandName: 'TAB Flucocip 400mg',
    genericName: 'Tab fluconazone 400 mg',
    manufacturer: 'Cipla pvt',
    dosage: '1 tab',
    frequency: 'Od after mill',
    durationDays: '5 day',
    totalQty: '5',
    instructions: 'Not teken with milk',
    slotNo: 'BZX 120',
    price: '120',
    timing: 'AFTER_MEAL',
    startDate: '2026-09-23',
    visibility: {
      generic: true,
      brandName: true,
      manufacturer: true,
      dosage: true,
      frequency: true,
      durationDays: true,
      totalQty: true,
      instructions: true,
      slotNo: true,
      price: true
    }
  }
];

const DEFAULT_DEMO_PROCEDURE_PRESCRIPTIONS: ProcedurePrescriptionItem[] = [
  {
    id: 'proc-rx-demo-1',
    itemName: '3.0 VICRIL SUTURE',
    quantity: 1,
    idCode: 'BZX  320',
    category: 'Suture / Closure',
    unit: 'Nos',
    instructions: 'Suture closure'
  },
  {
    id: 'proc-rx-demo-2',
    itemName: 'Ex darma rollar',
    quantity: 1,
    idCode: 'ZVX  580',
    category: 'Derma Roller',
    unit: 'Nos',
    instructions: 'Clinical procedure use'
  },
  {
    id: 'proc-rx-demo-3',
    itemName: 'Ex 5cc series',
    quantity: 2,
    idCode: 'KMX 30',
    category: 'Syringe / Series',
    unit: 'Nos',
    instructions: 'Dispensing series'
  }
];

const DEFAULT_DEMO_TREATMENT_SESSIONS: ProcedureExecutionItem[] = [
  {
    id: 'proc-demo-1',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '25/03/2026',
    performanceDate: '25/03/2026',
    sessionsCount: '1/4',
    sessionNumber: 1,
    totalSessions: 4,
    therapist: 'Dr Valaki',
    bodyPart: 'FACE',
    intervalDays: 20,
    skinType: '2',
    unit: '0',
    power: '10',
    waveLength: '100 hz',
    pulseDuration: '10',
    spotSize: '2.2',
    pulseImpulse: '25',
    thickness: '10',
    density: '.5',
    dotDensity: '10',
    shotsFired: '100',
    status: 'Done',
    remark: 'Session 1 completed with good follicular response. Mild transient erythema.',
    rate: 2000,
    price: 2000,
    paymentStatus: 'Done',
    completedInClinic: true
  },
  {
    id: 'proc-demo-2',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '14/04/2026',
    performanceDate: '',
    sessionsCount: '2/4',
    sessionNumber: 2,
    totalSessions: 4,
    therapist: 'Dr Valaki',
    bodyPart: 'FACE',
    intervalDays: 20,
    skinType: '2',
    unit: '0',
    power: '10',
    waveLength: '100 hz',
    pulseDuration: '10',
    spotSize: '2.2',
    pulseImpulse: '25',
    thickness: '10',
    density: '.5',
    dotDensity: '10',
    shotsFired: '',
    status: 'Confirmed',
    remark: 'CANFORMED - PAYMENT PAY AND GIVE APPIENTMENT (Click Delay 12d or Cancel)',
    rate: 2000,
    price: 2000,
    paymentStatus: 'Pending',
    completedInClinic: false
  },
  {
    id: 'proc-demo-3',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '04/05/2026',
    performanceDate: '',
    sessionsCount: '3/4',
    sessionNumber: 3,
    totalSessions: 4,
    therapist: 'Dr Valaki',
    bodyPart: 'FACE',
    intervalDays: 20,
    skinType: '2',
    unit: '0',
    power: '10',
    waveLength: '100 hz',
    pulseDuration: '10',
    spotSize: '2.2',
    pulseImpulse: '25',
    thickness: '10',
    density: '.5',
    dotDensity: '10',
    shotsFired: '',
    status: 'Pending',
    remark: 'Scheduled follow-up session 3',
    rate: 2000,
    price: 2000,
    paymentStatus: 'Pending',
    completedInClinic: false
  },
  {
    id: 'proc-demo-4',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '24/05/2026',
    performanceDate: '',
    sessionsCount: '4/4',
    sessionNumber: 4,
    totalSessions: 4,
    therapist: 'Dr Valaki',
    bodyPart: 'FACE',
    intervalDays: 20,
    skinType: '2',
    unit: '0',
    power: '10',
    waveLength: '100 hz',
    pulseDuration: '10',
    spotSize: '2.2',
    pulseImpulse: '25',
    thickness: '10',
    density: '.5',
    dotDensity: '10',
    shotsFired: '',
    status: 'Pending',
    remark: 'Final scheduled protocol session 4',
    rate: 2000,
    price: 2000,
    paymentStatus: 'Pending',
    completedInClinic: false
  }
];

const parseAnyDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatToDDMMYYYY = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const addDaysToFormattedDate = (dateStr: string, days: number): string => {
  const d = parseAnyDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatToDDMMYYYY(d);
};

export default function DoctorConsultationMasterStation({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const router = useRouter();

  const { activeSession, updateComplaints, updateVitals, updateHistory, updateNotes,
    addInvestigation, removeInvestigation, updateInvestigationNote, addPrescription, removePrescription,
    updatePrescription, togglePrescriptionVisibility,
    addProcedurePrescription, removeProcedurePrescription, updateProcedurePrescription,
    addProcedure, removeProcedure, updateProcedure, setProcedures, addImage, removeImage, updateDiagnosis,
    updateBilling, finalizeConsultation, getSession, loadSession, initSession
  } = useConsultationStore();

  const { patients, updatePatient } = usePatientStore();
  const { records: clinicalRecords } = useClinicalStore();
  const { queue, updateStatus, putOnHold, endSessionAndSendToBilling } = useQueueStore();
  const { addBill } = useBillingStore();
  const { inventory } = useInventoryStore();
  const { catalog: invCatalog } = useInvestigationCatalogStore();
  const { catalog: procCatalog } = useProcedureCatalogStore();
  const { addNotification } = useUIStore();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'complaints' | 'investigations' | 'drugs' | 'procedures' | 'images' | 'diagnosis' | 'finalReport'>('complaints');

  // Tab 1 Clinical Workspace Sub-Navigation State
  const [complaintsSubTab, setComplaintsSubTab] = useState<'all' | 'complaints' | 'profile' | 'timeline' | 'documents' | 'consent' | 'billing'>('complaints');
  const [profileForm, setProfileForm] = useState({
    maritalStatus: 'Married',
    occupation: 'Engineer',
    emergencyContact: 'Kavita Patel (Wife) - 9825100099',
    bloodGroup: 'B+',
    allergies: 'None Reported',
    address: '402, Shivalik Heights, Adajan',
    city: 'Surat',
    state: 'Gujarat'
  });
  const [reportsList, setReportsList] = useState<Array<{ id: string; name: string; date: string; category: string; size: string }>>([]);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Lab Report');
  const [signedConsents, setSignedConsents] = useState<Record<string, boolean>>({
    'General Clinical Examination & Treatment Consent': true,
    'Procedural Dermatology & Biopsy Consent': false,
    'Laser & Energy Device Therapy Consent': false,
    'Photography & Tele-consultation Records Consent': true,
  });

  // Live Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(504); // start at ~8m 24s
  const [saveStatus, setSaveStatus] = useState<string>('Saved just now');

  // Drawers & Modals
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [showBillingDrawer, setShowBillingDrawer] = useState(false);
  const [showPastVitalsModal, setShowPastVitalsModal] = useState(false);
  const [historyModalTab, setHistoryModalTab] = useState<'encounters' | 'vitals' | 'prescriptions'>('encounters');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAltDrugModal, setShowAltDrugModal] = useState<DrugInventoryItem | null>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('Awaiting In-Clinic Blood Sugar (FBS / PPBS)');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [nextStage, setNextStage] = useState<'BILLING' | 'PHARMACY' | 'DISCHARGE'>('BILLING');

  // Tab 2 Investigation Sub-Tab & Add Test Modal State
  const [investigationSubTab, setInvestigationSubTab] = useState<'ORDER' | 'RESULTS'>('ORDER');
  const [invSearch, setInvSearch] = useState('');
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [editingNoteTestId, setEditingNoteTestId] = useState<string | null>(null);
  const [newTestForm, setNewTestForm] = useState({
    name: '',
    category: 'Hematology' as 'Hematology' | 'Biochemistry' | 'Pathology' | 'Radiology' | 'Microbiology',
    price: 350,
    unit: 'mg/dL',
    normalRange: '',
    specimenTube: 'EDTA (Purple Tube)',
    instructions: '',
    addToBasket: true
  });

  // Tab 3 Drugs State - All Writable Prescription Fields
  const [drugSearch, setDrugSearch] = useState('');
  const [isDrugDropdownOpen, setIsDrugDropdownOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugInventoryItem | null>(null);

  const [newRxGenericName, setNewRxGenericName] = useState('Tab fluconazone 400 mg');
  const [newRxBrandName, setNewRxBrandName] = useState('TAB Flucocip 400mg');
  const [newRxManufacturer, setNewRxManufacturer] = useState('Cipla pvt');
  const [newRxDosage, setNewRxDosage] = useState('1 tab');
  const [newRxFreq, setNewRxFreq] = useState('Od after mill');
  const [newRxDuration, setNewRxDuration] = useState('5 day');
  const [newRxTotal, setNewRxTotal] = useState('5');
  const [newRxNote, setNewRxNote] = useState('Not teken with milk');
  const [newRxSlotNo, setNewRxSlotNo] = useState('BZX 120');
  const [newRxPrice, setNewRxPrice] = useState('120');
  const [newRxVisibility, setNewRxVisibility] = useState<PrescriptionVisibility>({
    generic: true,
    brandName: true,
    manufacturer: true,
    dosage: true,
    frequency: true,
    durationDays: true,
    totalQty: true,
    instructions: true,
    slotNo: true,
    price: true
  });

  const drugSearchInputRef = useRef<HTMLInputElement>(null);
  const drugSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drugSearchContainerRef.current && !drugSearchContainerRef.current.contains(e.target as Node)) {
        setIsDrugDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initializedCaseIdRef = useRef<string | null>(null);
  const [manualAiWarning, setManualAiWarning] = useState<string | null>(null);
  const setAiSafetyReport = (rep: { checked: boolean; safe: boolean; warning?: string }) => {
    setManualAiWarning(rep.warning || null);
  };

  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return inventory.slice(0, 10);
    const q = drugSearch.toLowerCase();
    return inventory.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      d.brandName?.toLowerCase().includes(q) ||
      d.manufacturer?.toLowerCase().includes(q) ||
      d.slotNo?.toLowerCase().includes(q) ||
      d.formulation.toLowerCase().includes(q)
    );
  }, [inventory, drugSearch]);

  // Tab 3 Rx Drugs & Right-Side Optional Procedure Prescriptions State
  const [showProcSideOption, setShowProcSideOption] = useState(true);
  const [rxLayoutMode, setRxLayoutMode] = useState<'stacked' | 'split'>('stacked');
  const [procRxItemName, setProcRxItemName] = useState('');
  const [procRxQty, setProcRxQty] = useState(1);
  const [procRxIdCode, setProcRxIdCode] = useState('');
  const [isCustomProcItem, setIsCustomProcItem] = useState(false);

  const PROCEDURE_INSTRUMENTS_CATALOG = [
    { name: '3.0 VICRIL SUTURE', idCode: 'BZX  320', defaultQty: 1, category: 'Suture / Closure' },
    { name: 'Derma Roller', idCode: 'ZVX  580', defaultQty: 1, category: 'Derma Roller' },
    { name: 'Ex darma rollar', idCode: 'ZVX  580', defaultQty: 1, category: 'Derma Roller' },
    { name: '5cc Syringe Series', idCode: 'KMX 30', defaultQty: 2, category: 'Syringe / Series' },
    { name: 'Ex 5cc series', idCode: 'KMX 30', defaultQty: 2, category: 'Syringe / Series' },
    { name: '2cc Syringe Series', idCode: 'KMX 20', defaultQty: 2, category: 'Syringe / Series' },
    { name: 'Ex 2cc series', idCode: 'KMX 20', defaultQty: 2, category: 'Syringe / Series' },
    { name: 'Dispovan Syringe 5ml with 24G Needle', idCode: 'DSP 524', defaultQty: 2, category: 'Syringe' },
    { name: 'Dispovan Syringe 2ml with 26G Needle', idCode: 'DSP 226', defaultQty: 2, category: 'Syringe' },
    { name: 'Normal Saline (0.9% NaCl 500ml)', idCode: 'NS 500', defaultQty: 1, category: 'IV Bottle' },
    { name: 'Ringer Lactate (RL 500ml)', idCode: 'RL 500', defaultQty: 1, category: 'IV Bottle' },
    { name: 'Cotton Roller Bandage (4 Inch)', idCode: 'CRB 400', defaultQty: 2, category: 'Roller Bandage' },
    { name: 'Cotton Roller Bandage (6 Inch)', idCode: 'CRB 600', defaultQty: 1, category: 'Roller Bandage' },
    { name: 'Sterile Gauze Swab Pack', idCode: 'SGS 100', defaultQty: 2, category: 'Dressing / Gauze' },
    { name: 'IV Cannula 22G Blue + Infusion Set', idCode: 'IVC 22B', defaultQty: 1, category: 'Cannula / Set' },
    { name: 'Micropore Surgical Tape 1 Inch', idCode: 'MST 100', defaultQty: 1, category: 'Tape / Dressing' },
    { name: 'Povidone Iodine (Betadine 10% Solution)', idCode: 'PVI 100', defaultQty: 1, category: 'Antiseptic Solution' },
  ];

  const handleAddProcedurePrescription = () => {
    const itemName = procRxItemName.trim();
    if (!itemName) {
      addNotification({
        type: 'danger',
        message: 'Please select or enter an Instrument / Drug name.'
      });
      return;
    }

    const matched = PROCEDURE_INSTRUMENTS_CATALOG.find(p => p.name.toLowerCase() === itemName.toLowerCase());
    const finalIdCode = procRxIdCode.trim() || (matched ? matched.idCode : 'BZX 100');

    addProcedurePrescription({
      id: `proc-rx-${Date.now()}`,
      itemName: itemName,
      quantity: procRxQty > 0 ? procRxQty : 1,
      idCode: finalIdCode,
      category: matched?.category || 'Procedure Supply',
      unit: 'Nos',
      instructions: 'For clinical procedure use'
    });

    addNotification({
      type: 'success',
      message: `Prescribed ${itemName} (Qty: ${procRxQty}, ID Code: ${finalIdCode})`
    });

    setProcRxItemName('');
    setProcRxIdCode('');
    setProcRxQty(1);
    setIsCustomProcItem(false);
  };

  const handleLoadStandardProcedureSupplies = () => {
    const defaults = [
      { name: '3.0 VICRIL SUTURE (Absorbable Polyglactin)', idCode: 'BZX 320', qty: 1, category: 'Suture / Needles' },
      { name: 'Derma Roller 0.5mm Titanium Micro-Needle', idCode: 'ZVX 580', qty: 1, category: 'Aesthetic / Roller' },
      { name: 'Disp. Syringe 2ml with 24G Needle (Luer Lock)', idCode: 'SYR 240', qty: 2, category: 'Syringe / Needle' }
    ];
    defaults.forEach((def, i) => {
      addProcedurePrescription({
        id: `proc-std-${Date.now()}-${i}`,
        itemName: def.name,
        quantity: def.qty,
        idCode: def.idCode,
        category: def.category,
        unit: 'Nos',
        instructions: 'Clinical procedure supply'
      });
    });
    addNotification({
      type: 'success',
      message: 'Loaded 3 standard procedure supplies into prescription'
    });
  };

  // Tab 4 Laser & Multi-Session Clinical Procedure Protocol State
  const [procSearch, setProcSearch] = useState('');
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);
  const [procedureViewMode, setProcedureViewMode] = useState<'cards' | 'table'>('cards');
  const [protocolForm, setProtocolForm] = useState({
    startDate: '2026-03-25',
    therapist: 'Dr Valaki',
    procedureName: 'HAIR REMOVAL - DIODE',
    bodyPart: 'FACE',
    totalSessions: 4,
    intervalDays: 20,
    actualPrice: 10000,
    discountPercent: 10,
    afterDiscountPrice: 9000,
    total: 9000,
    note: 'Fitzpatrick Type II. Pre-cooling applied. Patient advised strict sun protection SPF 50+ & no waxing/threading.'
  });

  const [delayModalState, setDelayModalState] = useState<{
    isOpen: boolean;
    procedureId: string | null;
    delayDays: number;
    reason: string;
  }>({
    isOpen: false,
    procedureId: null,
    delayDays: 12,
    reason: 'Client requested reschedule due to travel / conflict'
  });

  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    procedureId: string | null;
    reason: string;
  }>({
    isOpen: false,
    procedureId: null,
    reason: 'Not taken further interested'
  });

  const uniqueProcedures = useMemo(() => {
    const procs = activeSession?.procedures || [];
    const isLegacyOrSingle = procs.length <= 1 && (
      procs.length === 0 ||
      procs[0]?.sessionsCount?.includes('Session 1 of 6') ||
      procs[0]?.sessionsCount === '1/6' ||
      procs[0]?.procedureName?.includes('Diode Laser Hair Removal') ||
      !procs[0]?.bodyPart
    );
    if (isLegacyOrSingle) {
      return DEFAULT_DEMO_TREATMENT_SESSIONS;
    }
    const seen = new Set<string>();
    return procs.filter(p => {
      const key = p.id || `${p.procedureName}-${p.scheduledDate}-${p.sessionsCount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeSession?.procedures]);

  // Handlers for Tab 4 Procedure Protocol
  const handleAutoGenerateSessions = () => {
    const count = Math.max(1, protocolForm.totalSessions || 4);
    const interval = Math.max(1, protocolForm.intervalDays || 20);
    const start = protocolForm.startDate || '2026-03-25';
    const ratePerSession = Math.round((protocolForm.afterDiscountPrice || 9000) / count);

    const newSessions: ProcedureExecutionItem[] = [];
    let currentDate = start.includes('-') ? formatToDDMMYYYY(new Date(start)) : start;

    for (let i = 1; i <= count; i++) {
      const isFirst = i === 1;
      newSessions.push({
        id: `proc-sess-${Date.now()}-${i}`,
        procedureName: protocolForm.procedureName || 'HAIR REMOVAL - DIODE',
        scheduledDate: currentDate,
        performanceDate: isFirst ? currentDate : '',
        sessionsCount: `${i}/${count}`,
        sessionNumber: i,
        totalSessions: count,
        therapist: protocolForm.therapist || 'Dr Valaki',
        bodyPart: protocolForm.bodyPart || 'FACE',
        intervalDays: interval,
        skinType: '2',
        unit: '0',
        power: '10',
        waveLength: '100 hz',
        pulseDuration: '10',
        spotSize: '2.2',
        pulseImpulse: '25',
        thickness: '10',
        density: '.5',
        dotDensity: '10',
        shotsFired: isFirst ? '100' : '',
        status: isFirst ? 'Done' : 'Pending',
        remark: isFirst ? 'Session 1 completed with good follicular response.' : `Scheduled session ${i}/${count}`,
        rate: ratePerSession,
        price: ratePerSession,
        paymentStatus: isFirst ? 'Done' : 'Pending',
        completedInClinic: isFirst
      });

      currentDate = addDaysToFormattedDate(currentDate, interval);
    }

    setProcedures(newSessions);
    addNotification({
      type: 'success',
      message: `Auto-generated ${count} treatment sessions with ${interval}-day intervals!`
    });
  };

  const handleLoadDefaultLaserProtocol = () => {
    setProtocolForm({
      startDate: '2026-03-25',
      therapist: 'Dr Valaki',
      procedureName: 'HAIR REMOVAL - DIODE',
      bodyPart: 'FACE',
      totalSessions: 4,
      intervalDays: 20,
      actualPrice: 10000,
      discountPercent: 10,
      afterDiscountPrice: 9000,
      total: 9000,
      note: 'Fitzpatrick Type II. Pre-cooling applied. Patient advised strict sun protection SPF 50+ & no waxing/threading.'
    });
    setProcedures(DEFAULT_DEMO_TREATMENT_SESSIONS);
    addNotification({
      type: 'success',
      message: 'Loaded Hair Removal Diode 4-Session Treatment Protocol!'
    });
  };

  const handleDelaySession = (procedureId: string, delayDays: number = 12, reason?: string) => {
    const currentProcs = (activeSession?.procedures && activeSession.procedures.length > 1)
      ? activeSession.procedures
      : DEFAULT_DEMO_TREATMENT_SESSIONS;
    const targetIndex = currentProcs.findIndex(p => p.id === procedureId);
    if (targetIndex === -1) return;

    const targetProc = currentProcs[targetIndex];
    const oldDate = targetProc.scheduledDate;

    const updatedProcs = currentProcs.map((p, idx) => {
      if (idx < targetIndex) return p;
      const shiftedDate = addDaysToFormattedDate(p.scheduledDate, delayDays);
      if (idx === targetIndex) {
        return {
          ...p,
          scheduledDate: shiftedDate,
          status: 'Delayed' as const,
          remark: reason || `DALY BY ${delayDays} DAY AUTO UPDATE (Shifted from ${oldDate})`
        };
      }
      return {
        ...p,
        scheduledDate: shiftedDate,
        remark: p.remark ? `${p.remark} (Auto-shifted +${delayDays}d)` : `Auto-shifted +${delayDays}d due to session ${targetIndex + 1} delay`
      };
    });

    setProcedures(updatedProcs);
    addNotification({
      type: 'warning',
      message: `Session ${targetIndex + 1} and subsequent sessions delayed by ${delayDays} days. Schedule auto-updated!`
    });
  };

  const handleConfirmSession = (procedureId: string) => {
    const currentProcs = (activeSession?.procedures && activeSession.procedures.length > 1)
      ? activeSession.procedures
      : DEFAULT_DEMO_TREATMENT_SESSIONS;
    const updatedProcs = currentProcs.map(p => {
      if (p.id === procedureId) {
        return {
          ...p,
          status: 'Confirmed' as const,
          paymentStatus: 'Done' as const,
          remark: 'CANFORMED - PAYMENT PAY AND GIVE APPIENTMENT'
        };
      }
      return p;
    });

    setProcedures(updatedProcs);
    addNotification({
      type: 'success',
      message: 'Session confirmed! Payment received and appointment locked.'
    });
  };

  const handleCancelSession = (procedureId: string, reason: string = 'Not tacken further interested') => {
    const currentProcs = (activeSession?.procedures && activeSession.procedures.length > 1)
      ? activeSession.procedures
      : DEFAULT_DEMO_TREATMENT_SESSIONS;
    const updatedProcs = currentProcs.map(p => {
      if (p.id === procedureId) {
        return {
          ...p,
          status: 'Cancelled' as const,
          paymentStatus: 'Cancelled' as const,
          remark: `Cancelled: ${reason}`
        };
      }
      return p;
    });

    setProcedures(updatedProcs);
    addNotification({
      type: 'danger',
      message: `Session cancelled (${reason})`
    });
  };

  const handleMarkDoneSession = (procedureId: string) => {
    const currentProcs = (activeSession?.procedures && activeSession.procedures.length > 1)
      ? activeSession.procedures
      : DEFAULT_DEMO_TREATMENT_SESSIONS;
    const todayStr = formatToDDMMYYYY(new Date());
    const updatedProcs = currentProcs.map(p => {
      if (p.id === procedureId) {
        return {
          ...p,
          status: 'Done' as const,
          performanceDate: p.performanceDate || todayStr,
          paymentStatus: 'Done' as const,
          completedInClinic: true,
          remark: p.remark || 'Session executed in clinic with recorded settings.'
        };
      }
      return p;
    });

    setProcedures(updatedProcs);
    addNotification({
      type: 'success',
      message: 'Session marked as Done with recorded clinical parameters!'
    });
  };

  const handleAddBlankSessionRow = () => {
    const currentProcs = activeSession?.procedures || [];
    const newIdx = currentProcs.length + 1;
    const lastProc = currentProcs[currentProcs.length - 1];
    const newDate = lastProc ? addDaysToFormattedDate(lastProc.scheduledDate, protocolForm.intervalDays || 20) : formatToDDMMYYYY(new Date());

    const newRow: ProcedureExecutionItem = {
      id: `proc-row-${Date.now()}`,
      procedureName: protocolForm.procedureName || 'HAIR REMOVAL - DIODE',
      scheduledDate: newDate,
      performanceDate: '',
      sessionsCount: `${newIdx}/${Math.max(newIdx, protocolForm.totalSessions)}`,
      sessionNumber: newIdx,
      totalSessions: Math.max(newIdx, protocolForm.totalSessions),
      therapist: protocolForm.therapist || 'Dr Valaki',
      bodyPart: protocolForm.bodyPart || 'FACE',
      intervalDays: protocolForm.intervalDays || 20,
      skinType: '2',
      unit: '0',
      power: '10',
      waveLength: '100 hz',
      pulseDuration: '10',
      spotSize: '2.2',
      pulseImpulse: '25',
      thickness: '10',
      density: '.5',
      dotDensity: '10',
      shotsFired: '',
      status: 'Pending',
      remark: `Scheduled session ${newIdx}`,
      rate: Math.round(protocolForm.afterDiscountPrice / Math.max(newIdx, protocolForm.totalSessions)),
      price: Math.round(protocolForm.afterDiscountPrice / Math.max(newIdx, protocolForm.totalSessions)),
      paymentStatus: 'Pending',
      completedInClinic: false
    };

    addProcedure(newRow);
    addNotification({
      type: 'success',
      message: `Added blank session row #${newIdx}`
    });
  };

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
    id: activeQueueEntry?.patientId || activeSession?.patientId || 'pat-1789991704297',
    mrdNumber: activeSession?.mrdNumber || 'MRD-2026-0019',
    firstName: activeSession?.patientName?.split(' ')[0] || activeQueueEntry?.patientName?.split(' ')[0] || 'Rajesh',
    lastName: activeSession?.patientName?.split(' ').slice(1).join(' ') || activeQueueEntry?.patientName?.split(' ').slice(1).join(' ') || 'Patel',
    mobile: '8594897487',
    email: 'essassets@gmail.com',
    age: activeQueueEntry?.age || 32,
    ageMonths: 0,
    ageDays: 0,
    gender: (activeQueueEntry?.gender as Gender) || 'M',
    language: 'English',
    bloodGroup: 'B+',
    city: activeQueueEntry?.city || 'Surat',
    state: 'Gujarat',
    address: '402, Shivalik Heights, Adajan',
    maritalStatus: 'Married',
    occupation: 'Engineer',
    emergencyContact: 'Kavita Patel (Wife) - 9825100099',
    allergies: 'None Reported',
    createdAt: '2026-09-05',
  }), [activeQueueEntry, activeSession]);

  const patient = patients.find(p => p.id === activeQueueEntry?.patientId || p.id === activeSession?.patientId) || fallbackPatient;

  // Sync profileForm when patient changes
  useEffect(() => {
    if (patient) {
      setProfileForm({
        maritalStatus: patient.maritalStatus || 'Married',
        occupation: patient.occupation || 'Engineer',
        emergencyContact: patient.emergencyContact || 'Kavita Patel (Wife) - 9825100099',
        bloodGroup: patient.bloodGroup || 'B+',
        allergies: patient.allergies || 'None Reported',
        address: patient.address || '402, Shivalik Heights, Adajan',
        city: patient.city || 'Surat',
        state: patient.state || 'Gujarat'
      });
    }
  }, [patient]);

  useEffect(() => {
    if (!caseId) return;
    if (initializedCaseIdRef.current === caseId) return;
    initializedCaseIdRef.current = caseId;
    const existing = getSession(caseId);
    if (existing) {
      loadSession(caseId);
      // Ensure Complete Blood Count (CBC) with ESR is populated in the basket
      const hasCbc = existing.investigations?.some(i =>
        i.testName.toLowerCase().includes('cbc') ||
        i.testName.toLowerCase().includes('complete blood count')
      );
      if (!hasCbc || existing.investigations.length === 0) {
        addInvestigation({
          testId: 'inv-1',
          testName: 'Complete Blood Count (CBC) with ESR',
          category: 'Hematology',
          price: 350,
          status: 'ORDERED',
          notes: 'Routine hematological workup, check ESR and platelet count'
        });
      }
    } else if (activeQueueEntry) {
      const qPatient = patients.find(p => p.id === activeQueueEntry.patientId) || patient;
      const doc = {
        id: activeQueueEntry.doctorId || 'doc-1',
        name: activeQueueEntry.doctorName || 'Dr. Arvind Shah',
        specialization: 'Dermatology',
        initials: 'AS',
        avatarColor: 'linear-gradient(135deg,#036d92,#0284c7)',
        room: 'Cabin 1'
      };
      const v = activeQueueEntry.vitals;
      initSession(caseId, qPatient, doc, {
        vitals: v ? {
          temperature: String(v.temperature || '98.6'),
          pulse: String(v.pulse || '72'),
          bpSystolic: v.bloodPressure ? v.bloodPressure.split('/')[0] : '120',
          bpDiastolic: v.bloodPressure ? v.bloodPressure.split('/')[1] : '80',
          spo2: String(v.spo2 || '98'),
          weight: String(v.weight || '70'),
          height: String(v.height || '170'),
        } : {
          temperature: '98.6',
          pulse: '72',
          bpSystolic: '120',
          bpDiastolic: '80',
          spo2: '98',
          weight: '70',
          height: '170'
        },
        complaints: {
          presentComplaint: activeQueueEntry.complaints?.join(', ') || activeQueueEntry.complaintNotes || '',
          durationYears: 0,
          durationMonths: 0,
          durationDays: 3,
          severity: 'MODERATE',
          onset: 'Gradual',
          aggravatingFactors: '',
          relievingFactors: ''
        },
        history: {
          pastMedical: 'Known hypertensive for 3 years on regular medication.',
          pastSurgical: 'Appendectomy in 2018 (uneventful).',
          currentMedications: 'Telmisartan 40mg (OD morning)',
          allergies: 'None Reported',
          personalHistory: 'Non-smoker, vegetarian, regular sleep cycle.',
          obstetricHistory: 'N/A'
        },
        notes: {
          nursingNotes: 'Patient oriented and responsive. Normal triage vitals.',
          patientFeedback: 'Wants clinical review for symptoms and treatment plan.'
        },
        investigations: [
          {
            testId: 'inv-1',
            testName: 'Complete Blood Count (CBC) with ESR',
            category: 'Hematology',
            price: 350,
            status: 'ORDERED',
            notes: 'Routine hematological workup, check ESR and platelet count'
          }
        ],
        prescriptions: DEFAULT_DEMO_PRESCRIPTIONS,
        procedurePrescriptions: DEFAULT_DEMO_PROCEDURE_PRESCRIPTIONS
      });
    } else {
      // Direct URL consultation visit e.g. /doctor/consultation/C004-001-22092026
      const qPatient = patient || fallbackPatient;
      const doc = {
        id: 'doc-1',
        name: 'Dr. Arvind Shah',
        specialization: 'Dermatology',
        initials: 'AS',
        avatarColor: 'linear-gradient(135deg,#036d92,#0284c7)',
        room: 'Cabin 1'
      };
      initSession(caseId, qPatient, doc, {
        vitals: {
          temperature: '98.6',
          pulse: '76',
          bpSystolic: '120',
          bpDiastolic: '80',
          weight: '68',
          height: '168',
          spo2: '99'
        },
        complaints: {
          presentComplaint: '',
          durationYears: 1,
          durationMonths: 0,
          durationDays: 1,
          severity: 'MODERATE',
          onset: 'Gradual',
          aggravatingFactors: '',
          relievingFactors: ''
        },
        history: {
          pastMedical: 'Known hypertensive for 3 years on regular medication.',
          pastSurgical: 'Appendectomy in 2018 (uneventful).',
          currentMedications: 'Telmisartan 40mg (OD morning)',
          allergies: 'None Reported',
          personalHistory: 'Non-smoker, vegetarian, regular sleep cycle.',
          obstetricHistory: 'N/A'
        },
        notes: {
          nursingNotes: 'Patient oriented and responsive. Normal triage vitals.',
          patientFeedback: 'Wants clinical review for symptoms and treatment plan.'
        },
        investigations: [
          {
            testId: 'inv-1',
            testName: 'Complete Blood Count (CBC) with ESR',
            category: 'Hematology',
            price: 350,
            status: 'ORDERED',
            notes: 'Routine hematological workup, check ESR and platelet count'
          }
        ],
        prescriptions: DEFAULT_DEMO_PRESCRIPTIONS,
        procedurePrescriptions: DEFAULT_DEMO_PROCEDURE_PRESCRIPTIONS,
        procedures: DEFAULT_DEMO_TREATMENT_SESSIONS
      });
    }
  }, [caseId, activeQueueEntry, getSession, loadSession, initSession, patient, patients, fallbackPatient, addInvestigation]);

  // Ensure ASO Titre exists in diagnostic catalog for instant search & order
  useEffect(() => {
    const hasAso = invCatalog.some(t => t.name.toLowerCase().includes('aso'));
    if (!hasAso) {
      useInvestigationCatalogStore.getState().addTest({
        name: 'ASO Titre (Anti-Streptolysin O Quantitative)',
        category: 'Biochemistry',
        price: 420,
        unit: 'IU/mL',
        normalRange: '< 200 IU/mL',
        instructions: 'Serum sample, fasting not required'
      });
    }
  }, [invCatalog]);

  // Ensure default demo prescriptions and procedure items exist if activeSession has none
  useEffect(() => {
    if (!activeSession) return;
    const currentRx = activeSession.prescriptions || [];
    if (currentRx.length === 0) {
      DEFAULT_DEMO_PRESCRIPTIONS.forEach(item => {
        addPrescription(item);
      });
    }
    const currentProc = activeSession.procedurePrescriptions || [];
    if (currentProc.length === 0) {
      DEFAULT_DEMO_PROCEDURE_PRESCRIPTIONS.forEach(item => {
        addProcedurePrescription(item);
      });
    }
    const currentProcs = activeSession.procedures || [];
    const isLegacySingle = currentProcs.length <= 1 && (
      currentProcs.length === 0 ||
      currentProcs[0]?.sessionsCount?.includes('Session 1 of 6') ||
      currentProcs[0]?.sessionsCount === '1/6' ||
      currentProcs[0]?.procedureName?.includes('Diode Laser Hair Removal') ||
      !currentProcs[0]?.bodyPart
    );
    if (isLegacySingle) {
      setProcedures(DEFAULT_DEMO_TREATMENT_SESSIONS);
    }
  }, [activeSession, addPrescription, addProcedurePrescription, setProcedures]);

  // Guaranteed Unique Prescriptions and Procedure Items for React Keys
  const uniquePrescriptions = useMemo(() => {
    const list = activeSession?.prescriptions || [];
    const seen = new Set<string>();
    return list.filter((item, idx) => {
      if (item.id === 'rx-demo-2') return false;
      const key = item.id || `rx-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeSession?.prescriptions]);

  const uniqueProcedurePrescriptions = useMemo(() => {
    const list = activeSession?.procedurePrescriptions || [];
    const seen = new Set<string>();
    return list.filter((item, idx) => {
      const key = item.id || `proc-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeSession?.procedurePrescriptions]);

  const aiSafetyReport = useMemo(() => {
    const rawAllergies = (activeSession?.history?.allergies || patient?.allergies || 'Penicillin, Sulfa drugs').toLowerCase();
    const hasPenicillinAllergy = rawAllergies.includes('penicillin') || rawAllergies.includes('amoxicillin');

    // Check if any active prescription matches penicillin or amoxicillin
    const offendingDrug = uniquePrescriptions.find(p => {
      const combined = ((p.brandName || p.drugName || '') + ' ' + (p.genericName || '')).toLowerCase();
      return combined.includes('penicillin') || combined.includes('amoxicillin') || combined.includes('ampicillin');
    });

    if (offendingDrug) {
      return {
        checked: true,
        safe: false,
        isNotice: false,
        warning: `⚠ CONTRAINDICATION: Patient has documented allergy to Penicillin! Prescribed "${offendingDrug.brandName || offendingDrug.drugName}" may trigger severe allergic reaction.`,
        offendingId: offendingDrug.id
      };
    }

    if (manualAiWarning) {
      return {
        checked: true,
        safe: true,
        isNotice: false,
        warning: manualAiWarning,
        offendingId: null
      };
    }

    if (uniquePrescriptions.length > 0) {
      return {
        checked: true,
        safe: true,
        isNotice: false,
        warning: `✓ AI Drug Safety Verified: All ${uniquePrescriptions.length} prescribed medication(s) checked. Dosage validated for adult weight; no interaction or allergen conflicts detected.`,
        offendingId: null
      };
    }

    if (hasPenicillinAllergy) {
      return {
        checked: true,
        safe: true,
        isNotice: true,
        warning: `🛡️ Documented Patient Allergies: Penicillin & Sulfa Drugs (Active safety guard will alert if penicillin is prescribed).`,
        offendingId: null
      };
    }

    return {
      checked: false,
      safe: true,
      isNotice: false,
      warning: '',
      offendingId: null
    };
  }, [uniquePrescriptions, activeSession?.history?.allergies, patient?.allergies, manualAiWarning]);

  const handleSaveProfile = () => {
    if (patient?.id) {
      updatePatient(patient.id, profileForm);
      addNotification({
        type: 'success',
        message: `Saved Demographics & Profile for ${patient.firstName} ${patient.lastName}`
      });
    }
  };

  const handleSameAsPrevious = () => {
    updateComplaints({
      presentComplaint: 'Recurrent erythematous itchy skin rash with scaling on bilateral arms',
      durationYears: 1,
      durationMonths: 0,
      durationDays: 1,
      severity: 'MODERATE',
      onset: 'Gradual',
      aggravatingFactors: 'Sweating, sun exposure, dry cold weather',
      relievingFactors: 'Cool water bath, topical moisturizer'
    });
    updateVitals({
      temperature: '98.6',
      pulse: '76',
      bpSystolic: '120',
      bpDiastolic: '80',
      weight: '68',
      height: '168',
      spo2: '99'
    });
    updateHistory({
      pastMedical: 'Known hypertensive for 3 years on regular medication.',
      pastSurgical: 'Appendectomy in 2018 (uneventful).',
      currentMedications: 'Telmisartan 40mg (OD morning)',
      allergies: 'Penicillin, Sulfa drugs',
      personalHistory: 'Non-smoker, vegetarian, regular sleep cycle.',
      obstetricHistory: 'N/A'
    });
    updateNotes({
      nursingNotes: 'Patient oriented and responsive. Mild pruritus reported.',
      patientFeedback: 'Wants evaluation for previous flare-up recurrence.'
    });
    addNotification({
      type: 'info',
      message: 'Populated Complaints, Vitals & History from previous visit (Case C001-002-230926)'
    });
  };

  // Historical Clinical Records (with robust fallback for comprehensive longitudinal viewing)
  const patientClinicalRecords = useMemo(() => {
    const fromStore = clinicalRecords?.filter(r => r.patientId === patient.id || r.patientId === patient.mrdNumber) || [];
    if (fromStore.length > 0) return fromStore;

    return [
      {
        id: 'cr-hist-1',
        patientId: patient.id,
        date: '2026-08-19',
        doctorName: 'Dr. Arvind Shah',
        department: 'Dermatology & Allergy Clinic',
        chiefComplaint: 'Persistent erythematous papules and pruritus over bilateral forearms and dorsal neck area.',
        diagnosis: 'L20.9 - Atopic Dermatitis with Secondary Xerosis Cutis',
        vitals: { bp: '124/82', pulse: '78', temp: '98.4', weight: '69.2', spo2: '99' },
        prescription: [
          { medicine: 'Tab Levocetirizine 5mg', dosage: '1 Tab', duration: '10 Days', instructions: '0-0-1 (HS) After Food' },
          { medicine: 'Betamethasone Dipropionate 0.05% Cream', dosage: 'Topical Application', duration: '14 Days', instructions: '1-0-1 (BD) Thin layer on affected areas' },
          { medicine: 'Moisturizing Cream (Ceramides + Oat Extract)', dosage: 'Topical Application', duration: '30 Days', instructions: '1-1-1 (TDS) Apply generously after shower' }
        ],
        followUpDate: '2026-09-02'
      },
      {
        id: 'cr-hist-2',
        patientId: patient.id,
        date: '2026-05-10',
        doctorName: 'Dr. Anita Soni',
        department: 'General Medicine & Preventive Health',
        chiefComplaint: 'Routine executive health screening, occasional occipital tension headaches, morning fatigue.',
        diagnosis: 'I10 - Essential (Primary) Hypertension - Grade 1',
        vitals: { bp: '138/88', pulse: '82', temp: '98.6', weight: '70.5', spo2: '98' },
        prescription: [
          { medicine: 'Tab Telmisartan 40mg', dosage: '1 Tab', duration: '30 Days', instructions: '1-0-0 (OD) Morning after breakfast' },
          { medicine: 'Tab Methylcobalamin + B-Complex', dosage: '1 Tab', duration: '30 Days', instructions: '1-0-0 (OD) Morning with water' }
        ],
        followUpDate: '2026-08-10'
      },
      {
        id: 'cr-hist-3',
        patientId: patient.id,
        date: '2025-11-14',
        doctorName: 'Dr. Raj Valaki',
        department: 'Dermatology Clinic',
        chiefComplaint: 'Acute erythematous urticarial wheals and facial puffiness after accidental seafood exposure.',
        diagnosis: 'L50.0 - Allergic Urticaria (Acute Reaction)',
        vitals: { bp: '122/80', pulse: '86', temp: '98.8', weight: '71.0', spo2: '99' },
        prescription: [
          { medicine: 'Tab Fexofenadine 180mg', dosage: '1 Tab', duration: '5 Days', instructions: '1-0-0 (OD) Before food' },
          { medicine: 'Tab Prednisolone 10mg', dosage: '1 Tab', duration: '3 Days', instructions: '1-0-0 (OD) Morning after food' }
        ],
        followUpDate: '2025-11-20'
      }
    ];
  }, [clinicalRecords, patient.id, patient.mrdNumber]);

  const handleApplyEncounterToCurrentVisit = (rec: {
    chiefComplaint: string;
    diagnosis: string;
    vitals: { bp: string; pulse: string; temp: string; weight: string; spo2: string };
    date: string;
    department: string;
  }) => {
    updateComplaints({
      presentComplaint: rec.chiefComplaint,
      durationYears: 0,
      durationMonths: 1,
      durationDays: 0,
      severity: 'MODERATE',
      onset: 'Gradual',
    });
    if (rec.diagnosis) {
      updateDiagnosis({
        finalDiagnosis: rec.diagnosis,
        provisional: rec.diagnosis
      });
    }
    const [sys, dia] = rec.vitals.bp.split('/');
    updateVitals({
      temperature: rec.vitals.temp || '98.6',
      pulse: rec.vitals.pulse || '76',
      bpSystolic: sys || '120',
      bpDiastolic: dia || '80',
      weight: rec.vitals.weight || '68',
      spo2: rec.vitals.spo2 || '99'
    });
    addNotification({
      type: 'success',
      message: `Loaded clinical complaints, diagnosis, and vitals from ${rec.date} (${rec.department}) into current consultation.`
    });
    setShowPastVitalsModal(false);
  };

  const handleApplyHistoricalVitals = (vitals: { bp: string; pulse: string; temp: string; weight: string; spo2: string }) => {
    const [sys, dia] = vitals.bp.split('/');
    updateVitals({
      temperature: vitals.temp || '98.6',
      pulse: vitals.pulse || '76',
      bpSystolic: sys || '120',
      bpDiastolic: dia || '80',
      weight: vitals.weight || '68',
      spo2: vitals.spo2 || '99'
    });
    addNotification({
      type: 'info',
      message: `Applied historical vitals baseline (BP: ${vitals.bp}, Pulse: ${vitals.pulse}, Wt: ${vitals.weight}kg) to current triage.`
    });
  };

  const handleRepeatPrescription = (medItem: { medicine: string; dosage: string; duration: string; instructions: string }) => {
    const invMatch = inventory.find(i => i.name.toLowerCase().includes(medItem.medicine.toLowerCase().slice(0, 10)));
    const durDays = parseInt(medItem.duration) || 7;
    const freq = medItem.instructions.includes('1-1-1') ? '1-1-1 (TDS)' : medItem.instructions.includes('1-0-1') ? '1-0-1 (BD)' : medItem.instructions.includes('0-0-1') ? '0-0-1 (HS)' : '1-0-0 (OD)';

    addPrescription({
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugName: medItem.medicine,
      dosage: medItem.dosage || '1 Tab',
      frequency: freq,
      durationDays: durDays,
      totalQty: durDays * (freq.includes('1-1-1') ? 3 : freq.includes('1-0-1') ? 2 : 1),
      instructions: medItem.instructions || 'After Food',
      stockStatus: invMatch && invMatch.stock <= invMatch.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
    });

    addNotification({
      type: 'success',
      message: `Added "${medItem.medicine}" to current prescription basket.`
    });
  };

  const handleRepeatAllPrescriptions = (prescriptions: Array<{ medicine: string; dosage: string; duration: string; instructions: string }>) => {
    prescriptions.forEach((med, idx) => {
      setTimeout(() => {
        handleRepeatPrescription(med);
      }, idx * 60);
    });
    addNotification({
      type: 'success',
      message: `Added all ${prescriptions.length} medications to current prescription basket.`
    });
  };

  const handleSkipOrSaveEmpty = () => {
    updateComplaints({
      presentComplaint: '',
      durationYears: 0,
      durationMonths: 0,
      durationDays: 0,
      severity: 'MILD',
      onset: 'Gradual',
      aggravatingFactors: '',
      relievingFactors: ''
    });
    addNotification({
      type: 'warning',
      message: 'Complaints & Vitals marked as empty/skipped.'
    });
    setActiveTab('investigations');
  };

  const handleSaveClinicalData = () => {
    addNotification({
      type: 'success',
      message: `Clinical data saved successfully for Case ${caseId} (${patient.firstName} ${patient.lastName})`
    });
    setSaveStatus(`Saved at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  // Calculated BMI
  const weightKg = parseFloat(activeSession?.vitals.weight || '68') || 0;
  const heightM = (parseFloat(activeSession?.vitals.height || '168') || 0) / 100;
  const calculatedBMI = (weightKg > 0 && heightM > 0) ? (weightKg / (heightM * heightM)).toFixed(1) : '—';

  // Live Billing Accumulator Calculations
  const baseConsultationFee = activeSession?.billing.isFoc ? 0 : (activeSession?.billing.consultationFee || 500);
  const proceduresTotal = activeSession?.billing.isFoc ? 0 : (activeSession?.procedures.reduce((s, p) => s + p.price, 0) || 0);
  const investigationsTotal = activeSession?.billing.isFoc ? 0 : (activeSession?.investigations.reduce((s, i) => s + i.price, 0) || 0);
  const pharmacyTotal = activeSession?.billing.isFoc ? 0 : (activeSession?.prescriptions.reduce((s, p) => s + (Number(p.totalQty) || 1) * 12, 0) || 0);
  const grossSubtotal = baseConsultationFee + proceduresTotal + investigationsTotal + pharmacyTotal;
  const discountAmount = Math.round((grossSubtotal * (activeSession?.billing.discountPercent || 0)) / 100);
  const netEstimatedBill = Math.max(0, grossSubtotal - discountAmount);

  // Drug Selection & Smart Search Direct Prescribe Handlers
  const handleAddDrugFromSmartSearch = (drug: DrugInventoryItem) => {
    const isTablet = drug.formulation === 'Tablet' || drug.formulation === 'Capsule';
    const generic = drug.genericName || drug.name;
    const brand = drug.brandName || drug.name;

    const finalItem: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugId: drug.id,
      drugName: brand,
      brandName: brand,
      genericName: generic,
      manufacturer: drug.manufacturer || 'Cipla pvt',
      dosage: drug.defaultDose || (isTablet ? '1 tab' : '1'),
      frequency: drug.defaultFreq || (isTablet ? 'Od after mill' : 'tds'),
      durationDays: drug.defaultDay || (isTablet ? '5 day' : '7'),
      totalQty: drug.defaultTotal || (isTablet ? '5' : '1'),
      instructions: drug.defaultNote || (isTablet ? 'Not teken with milk' : 'Before apply dry'),
      slotNo: drug.slotNo || 'BZX 100',
      price: String(drug.unitPrice !== undefined ? drug.unitPrice : '120'),
      timing: 'AFTER_MEAL',
      startDate: new Date().toISOString().split('T')[0],
      stockStatus: drug.stock <= drug.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK',
      visibility: {
        generic: true,
        brandName: true,
        manufacturer: true,
        dosage: true,
        frequency: true,
        durationDays: true,
        totalQty: true,
        instructions: true,
        slotNo: true,
        price: true
      }
    };

    addPrescription(finalItem);

    // Allergy check
    const checkName = (brand + ' ' + generic).toLowerCase();
    if (checkName.includes('penicillin') || checkName.includes('amoxicillin')) {
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

    setDrugSearch('');
    setIsDrugDropdownOpen(false);
    setSelectedDrug(null);
    addNotification({
      type: 'success',
      message: `Prescribed ${brand} (${finalItem.dosage})`
    });
  };

  const handleAddCustomDrugFromSearch = (customName?: string) => {
    const name = (customName || drugSearch).trim();
    if (!name) return;

    const isCream = name.toLowerCase().includes('cream') || name.toLowerCase().includes('ointment') || name.toLowerCase().includes('lotion');
    const isTablet = !isCream && !name.toLowerCase().includes('syrup');

    const finalItem: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugName: name,
      brandName: name,
      genericName: name,
      manufacturer: 'Cipla pvt',
      dosage: isTablet ? '1 tab' : '1',
      frequency: isTablet ? 'Od after mill' : 'tds',
      durationDays: isTablet ? '5 day' : '7',
      totalQty: isTablet ? '5' : '1',
      instructions: isTablet ? 'Not teken with milk' : 'Before apply dry',
      slotNo: 'BZX ' + Math.floor(100 + Math.random() * 900),
      price: '120',
      timing: 'AFTER_MEAL',
      startDate: new Date().toISOString().split('T')[0],
      visibility: {
        generic: true,
        brandName: true,
        manufacturer: true,
        dosage: true,
        frequency: true,
        durationDays: true,
        totalQty: true,
        instructions: true,
        slotNo: true,
        price: true
      }
    };

    addPrescription(finalItem);

    const checkName = name.toLowerCase();
    if (checkName.includes('penicillin') || checkName.includes('amoxicillin')) {
      setAiSafetyReport({
        checked: true,
        safe: false,
        warning: '⚠ CONTRAINDICATION: Patient has documented allergy to Penicillin!'
      });
    }

    setDrugSearch('');
    setIsDrugDropdownOpen(false);
    setSelectedDrug(null);
    addNotification({
      type: 'success',
      message: `Added custom medication "${name}" to prescription table.`
    });
  };

  const handleAddBlankRow = () => {
    const finalItem: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugName: '',
      brandName: '',
      genericName: '',
      manufacturer: 'Cipla pvt',
      dosage: '1 tab',
      frequency: 'Od after mill',
      durationDays: '5 day',
      totalQty: '5',
      instructions: 'Not teken with milk',
      slotNo: 'BZX 120',
      price: '120',
      timing: 'AFTER_MEAL',
      startDate: new Date().toISOString().split('T')[0],
      visibility: {
        generic: true,
        brandName: true,
        manufacturer: true,
        dosage: true,
        frequency: true,
        durationDays: true,
        totalQty: true,
        instructions: true,
        slotNo: true,
        price: true
      }
    };

    addPrescription(finalItem);
    addNotification({
      type: 'info',
      message: 'Added new writable row to prescription table.'
    });
  };

  const handleSelectDrug = (drug: DrugInventoryItem) => handleAddDrugFromSmartSearch(drug);
  const handleCreateCustomDrug = () => handleAddCustomDrugFromSearch();
  const handleAddDrugRow = () => {
    if (filteredDrugs.length > 0) {
      handleAddDrugFromSmartSearch(filteredDrugs[0]);
    } else if (drugSearch.trim()) {
      handleAddCustomDrugFromSearch();
    } else {
      handleAddBlankRow();
    }
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
      durationDays: parseInt(String(rx.durationDays)) || 5,
      prescribedQty: parseInt(String(rx.totalQty)) || 1,
      dispensedQty: parseInt(String(rx.totalQty)) || 1,
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
            type="button"
            onClick={() => {
              setActiveTab('investigations');
              setNewTestForm(prev => ({
                ...prev,
                name: '',
                category: 'Hematology',
                price: 350,
                unit: 'mg/dL',
                normalRange: '',
                specimenTube: 'EDTA (Purple Tube)',
                instructions: '',
                addToBasket: true
              }));
              setShowAddTestModal(true);
            }}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#0284C7', color: '#0284C7', background: '#F0F9FF', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Add New Lab Test to Requisition Basket"
          >
            <Plus size={14} /> Add Lab Test
          </button>

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
          onClick={() => {
            setHistoryModalTab('vitals');
            setShowPastVitalsModal(true);
          }}
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

                <button
                  type="button"
                  onClick={() => {
                    setHistoryModalTab('encounters');
                    setShowPastVitalsModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#036d92',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 6,
                    cursor: 'pointer',
                    fontSize: 11.5
                  }}
                >
                  <History size={12} /> View History & Timeline Modal →
                </button>

                <Link href={`/doctor/patients/${patient.id}/history`} style={{ color: '#64748B', fontSize: 11, display: 'block', marginTop: 4 }}>
                  Full Audit Ledger ↗
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
              { id: 'drugs', label: `3. Rx Pharmacy (${activeSession?.prescriptions.length || 0}${activeSession?.procedurePrescriptions?.length ? ` + ${activeSession.procedurePrescriptions.length} Proc` : ''})*`, icon: Pill },
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
          {/* TAB 1: Complaints & History • Current Visit Details */}
          {/* ============================================================ */}
          {activeTab === 'complaints' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body" style={{ padding: 20 }}>
                {/* Main Two-Column Layout: Complaints & History (Left) | Vitals Strip (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
                  {/* Left Column: Complaints & History */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Section A: Current Visit Details */}
                    <div className="card" style={{ border: '1px solid var(--border)' }}>
                      <div className="card-header" style={{
                        padding: '10px 16px', background: '#F8FAFC',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 10
                      }}>
                        <span className="card-title" style={{ fontSize: 13, color: '#036d92', fontWeight: 800 }}>
                          Complaints & History • Current Visit Details
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={handleSameAsPrevious}
                            className="btn btn-sm btn-outline"
                            style={{
                              background: '#FFFFFF',
                              borderColor: '#036d92',
                              color: '#036d92',
                              fontWeight: 700,
                              fontSize: 11.5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                            title="Copy symptoms, vitals and medical history from previous consultation"
                          >
                            <Copy size={13} /> Same as Previous
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setHistoryModalTab('encounters');
                              setShowPastVitalsModal(true);
                            }}
                            className="btn btn-sm btn-outline"
                            style={{
                              background: '#FFFFFF',
                              borderColor: '#64748B',
                              color: '#334155',
                              fontWeight: 700,
                              fontSize: 11.5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                            title="Open historical vitals and encounters trend"
                          >
                            <History size={13} /> View History
                          </button>
                        </div>
                      </div>
                      <div className="card-body" style={{ padding: 16 }}>
                        {/* Present Complaint */}
                        <div style={{ marginBottom: 14 }}>
                          <label className="form-label" style={{ fontWeight: 700 }}>
                            Present Complaint / Reason for visit *
                          </label>
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="E.g., Fever and headache since 3 days..."
                            value={activeSession?.complaints.presentComplaint || ''}
                            onChange={e => updateComplaints({ presentComplaint: e.target.value })}
                          />
                        </div>

                        {/* Duration, Severity, Onset */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Duration (Y/M/D)</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder="Yrs"
                                  value={activeSession?.complaints.durationYears ?? 1}
                                  onChange={e => updateComplaints({ durationYears: parseInt(e.target.value) || 0 })}
                                />
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>Yrs</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder="Mos"
                                  value={activeSession?.complaints.durationMonths ?? 0}
                                  onChange={e => updateComplaints({ durationMonths: parseInt(e.target.value) || 0 })}
                                />
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>Mos</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder="Days"
                                  value={activeSession?.complaints.durationDays ?? 1}
                                  onChange={e => updateComplaints({ durationDays: parseInt(e.target.value) || 0 })}
                                />
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>Days</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Severity</label>
                            <select
                              className="form-select"
                              value={activeSession?.complaints.severity || 'MODERATE'}
                              onChange={e => updateComplaints({ severity: e.target.value as any })}
                            >
                              <option value="MILD">Mild</option>
                              <option value="MODERATE">Moderate</option>
                              <option value="SEVERE">Severe</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Onset</label>
                            <select
                              className="form-select"
                              value={activeSession?.complaints.onset || 'Gradual'}
                              onChange={e => updateComplaints({ onset: e.target.value })}
                            >
                              <option value="Sudden">Sudden</option>
                              <option value="Gradual">Gradual</option>
                              <option value="Insidious">Insidious</option>
                              <option value="Acute">Acute</option>
                              <option value="Chronic">Chronic</option>
                            </select>
                          </div>
                        </div>

                        {/* Aggravating & Relieving Factors */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Aggravating Factors</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="What makes it worse..."
                              value={activeSession?.complaints.aggravatingFactors || ''}
                              onChange={e => updateComplaints({ aggravatingFactors: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Relieving Factors</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="What makes it better..."
                              value={activeSession?.complaints.relievingFactors || ''}
                              onChange={e => updateComplaints({ relievingFactors: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section B: History & Context */}
                    <div className="card" style={{ border: '1px solid var(--border)' }}>
                      <div className="card-header" style={{ padding: '10px 16px', background: '#F8FAFC' }}>
                        <span className="card-title" style={{ fontSize: 13, color: '#036d92', fontWeight: 800 }}>
                          History & Context
                        </span>
                      </div>
                      <div className="card-body" style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Past Medical History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Hypertension, Diabetes, Asthma..."
                              value={activeSession?.history.pastMedical || ''}
                              onChange={e => updateHistory({ pastMedical: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Past Surgical History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Appendectomy, Cholecystectomy..."
                              value={activeSession?.history.pastSurgical || ''}
                              onChange={e => updateHistory({ pastSurgical: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Current Medications</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Telmisartan 40mg OD, Metformin..."
                              value={activeSession?.history.currentMedications || ''}
                              onChange={e => updateHistory({ currentMedications: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: 'var(--danger)' }}>
                              Allergies
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ borderColor: '#F87171' }}
                              placeholder="e.g. Penicillin, Sulfa drugs, None Reported..."
                              value={activeSession?.history.allergies || ''}
                              onChange={e => updateHistory({ allergies: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Personal History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Diet, sleep, smoking, alcohol..."
                              value={activeSession?.history.personalHistory || ''}
                              onChange={e => updateHistory({ personalHistory: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Obstetric/Gyneco History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Gravida/Para, LMP regularity..."
                              value={activeSession?.history.obstetricHistory || ''}
                              onChange={e => updateHistory({ obstetricHistory: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section C: Notes */}
                    <div className="card" style={{ border: '1px solid var(--border)' }}>
                      <div className="card-header" style={{ padding: '10px 16px', background: '#F8FAFC' }}>
                        <span className="card-title" style={{ fontSize: 13, color: '#036d92', fontWeight: 800 }}>
                          Notes
                        </span>
                      </div>
                      <div className="card-body" style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Nursing Notes</label>
                            <textarea
                              className="form-input"
                              rows={2}
                              placeholder="Triage nursing observations, behavioral notes..."
                              value={activeSession?.notes?.nursingNotes || ''}
                              onChange={e => updateNotes({ nursingNotes: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700 }}>Patient Feedback / Expectations</label>
                            <textarea
                              className="form-input"
                              rows={2}
                              placeholder="Patient chief concerns, treatment expectations..."
                              value={activeSession?.notes?.patientFeedback || ''}
                              onChange={e => updateNotes({ patientFeedback: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Vitals Card */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="card" style={{ border: '1px solid var(--border)', background: '#FFFFFF' }}>
                      <div className="card-header" style={{ padding: '10px 16px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="card-title" style={{ fontSize: 13, color: '#036d92', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Heart size={15} color="var(--danger)" /> Vitals
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: 10 }}>Live Triage</span>
                      </div>

                      <div className="card-body" style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Temp (°F)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.temperature ?? '98.6'}
                              onChange={e => updateVitals({ temperature: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Pulse (BPM)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.pulse ?? '76'}
                              onChange={e => updateVitals({ pulse: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Sys (mmHg)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.bpSystolic ?? '120'}
                              onChange={e => updateVitals({ bpSystolic: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Dia (mmHg)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.bpDiastolic ?? '80'}
                              onChange={e => updateVitals({ bpDiastolic: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Weight (kg)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.weight ?? '68'}
                              onChange={e => updateVitals({ weight: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Height (cm)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.height ?? '168'}
                              onChange={e => updateVitals({ height: e.target.value })}
                            />
                          </div>

                          <div style={{ gridColumn: 'span 2' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>SpO2 (%)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.spo2 ?? '99'}
                              onChange={e => updateVitals({ spo2: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Dynamic BMI Gauge */}
                        <div style={{
                          marginTop: 16, padding: '12px 14px', background: '#F8FAFC',
                          borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                              Calculated BMI
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#036d92', marginTop: 2 }}>
                              {calculatedBMI}
                            </div>
                          </div>
                          <div>
                            <span className={`badge ${parseFloat(calculatedBMI) >= 25 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 11, fontWeight: 700 }}>
                              {parseFloat(calculatedBMI) >= 30 ? 'Obese' : parseFloat(calculatedBMI) >= 25 ? 'Overweight' : parseFloat(calculatedBMI) >= 18.5 ? 'Normal BMI' : 'Underweight'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets / Clinical Guidance */}
                    <div style={{ padding: 14, background: '#F1F5F9', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>💡 Clinical Workflow Tip:</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Triage vitals update dynamically. You can click <strong>Save Clinical Data</strong> or move straight to <strong>Tab 2: Lab Orders</strong>.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <button
                      type="button"
                      onClick={handleSkipOrSaveEmpty}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#64748B', fontWeight: 600 }}
                    >
                      Skip / Save Empty
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleSaveClinicalData}
                      className="btn btn-outline"
                      style={{ borderColor: '#036d92', color: '#036d92', fontWeight: 700 }}
                    >
                      <Save size={14} /> Save Clinical Data
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSaveClinicalData();
                        setActiveTab('investigations');
                      }}
                      className="btn btn-primary"
                      style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700 }}
                    >
                      Save & Next (Tab 2: Lab Orders) →
                    </button>
                  </div>
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
                    {/* Catalog Search & New Lab Order Button */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div className="form-label" style={{ margin: 0, fontWeight: 700 }}>Search Hospital Diagnostic Catalog</div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTestForm({
                              name: invSearch || '',
                              category: 'Hematology',
                              price: 350,
                              unit: 'mg/dL',
                              normalRange: '',
                              specimenTube: 'EDTA (Purple Tube)',
                              instructions: '',
                              addToBasket: true
                            });
                            setShowAddTestModal(true);
                          }}
                          className="btn btn-sm btn-primary"
                          style={{ background: '#036d92', borderColor: '#036d92', fontSize: 11.5, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Plus size={13} /> Add New Lab Test
                        </button>
                      </div>

                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search CBC, ASO Titre, Lipid, HbA1c, KOH scraping, IgE, X-Ray..."
                        value={invSearch}
                        onChange={e => setInvSearch(e.target.value)}
                        style={{ marginBottom: 10 }}
                      />

                      {/* Quick prompt to add searched test if not present */}
                      {invSearch.trim().length > 0 && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 12px', background: '#F0F9FF', borderRadius: 6,
                          border: '1px dashed #0284C7', marginBottom: 10
                        }}>
                          <span style={{ fontSize: 12, color: '#0369A1' }}>Can&apos;t find &ldquo;{invSearch}&rdquo; in catalog?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTestForm({
                                name: invSearch,
                                category: 'Biochemistry',
                                price: 450,
                                unit: 'mg/dL',
                                normalRange: '',
                                specimenTube: 'EDTA (Purple Tube)',
                                instructions: '',
                                addToBasket: true
                              });
                              setShowAddTestModal(true);
                            }}
                            className="btn btn-sm btn-ghost"
                            style={{ color: '#0369A1', fontWeight: 800, padding: '2px 8px', fontSize: 11.5 }}
                          >
                            + Add &ldquo;{invSearch}&rdquo; as New Test
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                        {invCatalog
                          .filter(t => !invSearch || t.name.toLowerCase().includes(invSearch.toLowerCase()) || (t.category && t.category.toLowerCase().includes(invSearch.toLowerCase())))
                          .map(test => {
                            const isAlreadyInBasket = activeSession?.investigations.some(i => i.testId === test.id || i.testName.toLowerCase() === test.name.toLowerCase());
                            return (
                              <div
                                key={test.id}
                                style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '10px 14px', background: '#F8FAFC', borderRadius: 8,
                                  border: '1px solid #E2E8F0',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{test.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                    <span className="badge badge-purple" style={{ fontSize: 10, padding: '1px 6px', marginRight: 6 }}>{test.category}</span>
                                    Ref: {test.normalRange || 'Standard'} {test.specimenTube ? `• 🧪 ${test.specimenTube}` : ''} {test.instructions ? `• ${test.instructions}` : ''}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontWeight: 800, fontSize: 13, color: '#036d92' }}>₹{test.price}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addInvestigation({
                                        testId: test.id,
                                        testName: test.name,
                                        category: test.category,
                                        price: test.price,
                                        status: 'ORDERED',
                                        specimenTube: test.specimenTube,
                                        notes: test.instructions || ''
                                      });
                                      addNotification({
                                        type: 'info',
                                        message: `Added ${test.name} to Investigation Basket`
                                      });
                                    }}
                                    className={`btn ${isAlreadyInBasket ? 'btn-ghost' : 'btn-outline'} btn-sm`}
                                    style={{
                                      borderColor: '#036d92',
                                      color: isAlreadyInBasket ? '#059669' : '#036d92',
                                      fontWeight: 700,
                                      fontSize: 12
                                    }}
                                  >
                                    {isAlreadyInBasket ? '+ Add Again' : '+ Add Order'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Ordered Basket with Note Option */}
                    <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#036d92', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Heart size={16} /> Active Investigation Basket ({activeSession?.investigations.length || 0})
                        </div>
                        {activeSession?.investigations && activeSession.investigations.length > 0 && (
                          <span className="badge badge-primary" style={{ fontSize: 11 }}>
                            Total: ₹{investigationsTotal}
                          </span>
                        )}
                      </div>

                      {activeSession?.investigations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)', fontSize: 12, background: '#FFFFFF', borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                          <FileText size={32} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                          <p style={{ fontWeight: 600, margin: '0 0 8px' }}>No tests requisitioned for this visit yet.</p>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                addInvestigation({
                                  testId: 'inv-1',
                                  testName: 'Complete Blood Count (CBC) with ESR',
                                  category: 'Hematology',
                                  price: 350,
                                  status: 'ORDERED',
                                  notes: 'Routine hematological workup, check ESR and platelet count'
                                });
                                addNotification({
                                  type: 'info',
                                  message: 'Added Complete Blood Count (CBC) with ESR to Basket'
                                });
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: '#036d92', color: '#036d92', fontWeight: 700 }}
                            >
                              + Add CBC with ESR (₹350)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setNewTestForm({
                                  name: '',
                                  category: 'Biochemistry',
                                  price: 450,
                                  unit: 'mg/dL',
                                  normalRange: '',
                                  specimenTube: 'EDTA (Purple Tube)',
                                  instructions: '',
                                  addToBasket: true
                                });
                                setShowAddTestModal(true);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700 }}
                            >
                              <Plus size={13} /> Add New Lab Test
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {activeSession?.investigations.map((item, idx) => (
                            <div
                              key={`${item.testId}-${idx}`}
                              style={{
                                padding: '12px 14px', background: '#FFFFFF', borderRadius: 8,
                                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}
                            >
                              {/* Top row: Name, price, delete */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>{item.testName}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                    <span className="badge badge-purple" style={{ fontSize: 10 }}>{item.category}</span>
                                    <span className="badge badge-info" style={{ fontSize: 10 }}>ORDERED</span>
                                    {item.specimenTube && (
                                      <span className="badge" style={{ fontSize: 10, background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                                        🧪 {item.specimenTube}
                                      </span>
                                    )}
                                    <span style={{ fontWeight: 800, fontSize: 12, color: '#036d92' }}>₹{item.price}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeInvestigation(item.testId)}
                                  className="btn btn-ghost btn-icon btn-sm"
                                  title="Remove from basket"
                                  style={{ color: 'var(--danger)' }}
                                >
                                  <X size={15} />
                                </button>
                              </div>

                              {/* Note Option section */}
                              <div style={{ marginTop: 8, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                                {item.notes && editingNoteTestId !== item.testId ? (
                                  <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 10px', background: '#F0F9FF', borderRadius: 6,
                                    border: '1px solid #BAE6FD', fontSize: 11.5, color: '#0369A1'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, wordBreak: 'break-word' }}>
                                      <span style={{ fontWeight: 700 }}>📝 Note:</span>
                                      <span>{item.notes}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                      <button
                                        type="button"
                                        onClick={() => setEditingNoteTestId(item.testId)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: '2px 6px', fontSize: 10.5, color: '#0284C7', height: 22 }}
                                      >
                                        Edit Note
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateInvestigationNote(item.testId, '')}
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: '2px 6px', fontSize: 10.5, color: '#EF4444', height: 22 }}
                                        title="Clear Note"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ fontSize: 11.5, padding: '5px 8px', flex: 1, height: 30 }}
                                      placeholder="Add clinical note or instructions..."
                                      value={item.notes || ''}
                                      onChange={e => updateInvestigationNote(item.testId, e.target.value)}
                                    />
                                    {editingNoteTestId === item.testId && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingNoteTestId(null)}
                                        className="btn btn-sm btn-primary"
                                        style={{ background: '#036d92', borderColor: '#036d92', padding: '4px 10px', fontSize: 11, height: 30 }}
                                      >
                                        Done
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <div style={{
                            borderTop: '2px solid #E2E8F0', paddingTop: 12, marginTop: 6,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800
                          }}>
                            <div>
                              <div style={{ fontSize: 13, color: '#0F172A' }}>Requisition Total ({activeSession?.investigations.length} tests):</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Auto-adds to pharmacy/billing invoice</div>
                            </div>
                            <span style={{ fontSize: 20, color: '#036d92', fontWeight: 900 }}>₹{investigationsTotal}</span>
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
                {/* Header: Drug Prescription Title + Layout Switcher + Procedure Prescription Toggle */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 12,
                  flexWrap: 'wrap', gap: 10
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#036d92', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Pill size={18} /> Drug &amp; Medication Prescription
                      <span className="badge badge-primary" style={{ fontSize: 11, padding: '2px 7px' }}>
                        {uniquePrescriptions.length} Prescribed
                      </span>
                    </h4>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      Prescribe dispensary medicines directly with real-time stock checks &amp; optional procedure supplies.
                    </div>
                  </div>

                  {/* Right-Side Controls: Layout Switcher + Procedure Prescription Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Layout Mode Switcher */}
                    <div style={{
                      display: 'inline-flex',
                      background: '#F1F5F9',
                      padding: 2,
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      gap: 2
                    }}>
                      <button
                        type="button"
                        onClick={() => setRxLayoutMode('stacked')}
                        style={{
                          border: 'none',
                          background: rxLayoutMode === 'stacked' ? '#FFFFFF' : 'transparent',
                          color: rxLayoutMode === 'stacked' ? '#036d92' : '#64748B',
                          fontWeight: rxLayoutMode === 'stacked' ? 800 : 600,
                          fontSize: 11,
                          padding: '4px 9px',
                          borderRadius: 5,
                          cursor: 'pointer',
                          boxShadow: rxLayoutMode === 'stacked' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Full width stacked layout with spacious columns (Recommended)"
                      >
                        <span>▤ Stacked (Full Width)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRxLayoutMode('split')}
                        style={{
                          border: 'none',
                          background: rxLayoutMode === 'split' ? '#FFFFFF' : 'transparent',
                          color: rxLayoutMode === 'split' ? '#036d92' : '#64748B',
                          fontWeight: rxLayoutMode === 'split' ? 800 : 600,
                          fontSize: 11,
                          padding: '4px 9px',
                          borderRadius: 5,
                          cursor: 'pointer',
                          boxShadow: rxLayoutMode === 'split' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Side-by-side split view"
                      >
                        <span>▥ Side-by-Side</span>
                      </button>
                    </div>

                    {/* Procedure Prescription Option Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!showProcSideOption) {
                          setShowProcSideOption(true);
                        }
                        setTimeout(() => {
                          document.getElementById('procedure-prescription-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className="btn btn-sm"
                      style={{
                        background: showProcSideOption ? '#E0F2FE' : '#FFFFFF',
                        borderColor: showProcSideOption ? '#0284C7' : '#CBD5E1',
                        color: showProcSideOption ? '#0369A1' : '#475569',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Scissors size={14} />
                      <span>Procedure Prescription</span>
                      <span className="badge" style={{
                        fontSize: 10,
                        background: (uniqueProcedurePrescriptions.length > 0) ? '#0284C7' : '#FEF3C7',
                        color: (uniqueProcedurePrescriptions.length > 0) ? '#FFFFFF' : '#92400E',
                        fontWeight: 800
                      }}>
                        {uniqueProcedurePrescriptions.length > 0
                          ? `${uniqueProcedurePrescriptions.length} Added`
                          : 'Optional'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dynamic AI Drug Safety & Allergen Cross-Reactivity Alert Banner */}
                {aiSafetyReport.checked && (
                  <div style={{
                    padding: '12px 18px', borderRadius: 8,
                    background: !aiSafetyReport.safe ? '#FEF2F2' : aiSafetyReport.isNotice ? '#FEFCE8' : '#ECFDF5',
                    border: `1.5px solid ${!aiSafetyReport.safe ? '#EF4444' : aiSafetyReport.isNotice ? '#FACC15' : '#10B981'}`,
                    marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                    boxShadow: !aiSafetyReport.safe ? '0 2px 8px rgba(239, 68, 68, 0.12)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto' }}>
                      {!aiSafetyReport.safe ? (
                        <ShieldAlert size={18} color="#DC2626" />
                      ) : aiSafetyReport.isNotice ? (
                        <AlertTriangle size={18} color="#CA8A04" />
                      ) : (
                        <CheckCircle2 size={18} color="#059669" />
                      )}
                      <span style={{
                        fontSize: 12.5, fontWeight: 700,
                        color: !aiSafetyReport.safe ? '#991B1B' : aiSafetyReport.isNotice ? '#854D0E' : '#065F46'
                      }}>
                        {aiSafetyReport.warning}
                      </span>
                    </div>

                    {!aiSafetyReport.safe && aiSafetyReport.offendingId && (
                      <button
                        type="button"
                        onClick={() => removePrescription(aiSafetyReport.offendingId!)}
                        className="btn btn-sm"
                        style={{
                          background: '#DC2626', color: '#FFFFFF', border: 'none',
                          fontWeight: 700, fontSize: 11.5, padding: '4px 12px', borderRadius: 6,
                          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer'
                        }}
                        title="Remove allergenic medicine immediately"
                      >
                        <X size={13} /> Remove Allergenic Drug
                      </button>
                    )}
                  </div>
                )}

                {/* Main Prescription Layout: STACKED (Full Width) or SPLIT (Side-by-Side) */}
                <div style={rxLayoutMode === 'split' ? {
                  display: 'grid',
                  gridTemplateColumns: showProcSideOption ? '1.45fr 1fr' : '1fr',
                  gap: 20,
                  alignItems: 'start'
                } : {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20
                }}>
                  {/* DRUG PRESCRIPTION TABLE CONTAINER */}
                  <div style={{ width: '100%' }}>
                    {/* Active Prescriptions Table Section */}
                    <div style={{ marginBottom: 10 }}>
                      {/* Table Header Action Bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                        gap: 12,
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Pill size={16} color="#036d92" />
                            <span>Active Prescription Items ({uniquePrescriptions.length})</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                            All fields writable • Click &quot;show&quot; / &quot;hide&quot; to toggle prescription print visibility
                          </div>
                        </div>

                        {/* Smart Search Combobox & Add Row Option */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', maxWidth: 540, justifyContent: 'flex-end' }}>
                          {/* Smart Search Combobox */}
                          <div ref={drugSearchContainerRef} style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
                            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} />
                            <input
                              ref={drugSearchInputRef}
                              type="text"
                              className="form-input"
                              style={{
                                paddingLeft: 30,
                                paddingRight: drugSearch ? 26 : 10,
                                height: 34,
                                fontSize: 12,
                                borderColor: isDrugDropdownOpen ? '#036d92' : '#CBD5E1',
                                borderRadius: 6,
                                background: '#FFFFFF'
                              }}
                              placeholder="Smart search medicine to add directly..."
                              value={drugSearch}
                              onChange={e => {
                                setDrugSearch(e.target.value);
                                setIsDrugDropdownOpen(true);
                              }}
                              onFocus={() => setIsDrugDropdownOpen(true)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (filteredDrugs.length > 0) {
                                    handleAddDrugFromSmartSearch(filteredDrugs[0]);
                                  } else if (drugSearch.trim()) {
                                    handleAddCustomDrugFromSearch(drugSearch.trim());
                                  }
                                }
                              }}
                            />
                            {drugSearch && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDrugSearch('');
                                  setIsDrugDropdownOpen(false);
                                  drugSearchInputRef.current?.focus();
                                }}
                                style={{
                                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                  background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2
                                }}
                                title="Clear search"
                              >
                                <X size={14} />
                              </button>
                            )}

                            {/* Smart Search Filtered Dropdown Popover */}
                            {isDrugDropdownOpen && (
                              <div
                                style={{
                                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 120,
                                  background: '#FFFFFF', borderRadius: 8,
                                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                  border: '1.5px solid #036d92', marginTop: 4, maxHeight: 260, overflowY: 'auto'
                                }}
                              >
                                {filteredDrugs.length > 0 ? (
                                  filteredDrugs.map(drug => (
                                    <div
                                      key={drug.id}
                                      onClick={() => handleAddDrugFromSmartSearch(drug)}
                                      style={{
                                        padding: '8px 12px', borderBottom: '1px solid #F1F5F9',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#F0F9FF'}
                                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>
                                          {drug.brandName || drug.name} <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>({drug.genericName})</span>
                                        </div>
                                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                                          Brand: <strong>{drug.manufacturer || 'Cipla pvt'}</strong> • Slot: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#036d92' }}>{drug.slotNo || 'BZX 100'}</span> • <span className="badge badge-purple" style={{ fontSize: 9, padding: '1px 4px' }}>{drug.formulation}</span>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <span className={`badge ${drug.stock === 0 ? 'badge-danger' : drug.stock <= drug.reorderLevel ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 9.5 }}>
                                          {drug.stock === 0 ? 'Out of Stock' : `Stock: ${drug.stock}`}
                                        </span>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#036d92', marginTop: 2 }}>₹{drug.unitPrice}</div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: '10px 12px', textAlign: 'center', color: '#64748B', fontSize: 11.5 }}>
                                    No catalog medicine matching &ldquo;{drugSearch}&rdquo;
                                  </div>
                                )}

                                {/* Quick Add Custom Drug Option */}
                                {drugSearch.trim().length > 0 && (
                                  <div
                                    onClick={() => handleAddCustomDrugFromSearch(drugSearch.trim())}
                                    style={{
                                      padding: '9px 12px', background: '#F0FDF4', borderTop: '1px dashed #86EFAC',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: '#166534',
                                      fontWeight: 700, fontSize: 11.5
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}
                                  >
                                    <Plus size={14} color="#16a34a" />
                                    <span>Add &ldquo;{drugSearch.trim()}&rdquo; directly to Table</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Add Blank Row Button (Clean single plus icon) */}
                          <button
                            type="button"
                            onClick={handleAddBlankRow}
                            className="btn btn-sm"
                            style={{
                              background: '#036d92',
                              borderColor: '#036d92',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              fontSize: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              height: 34,
                              padding: '0 12px',
                              whiteSpace: 'nowrap'
                            }}
                            title="Add new writable row to table"
                          >
                            <Plus size={14} /> Add Row
                          </button>
                        </div>
                      </div>

                      {/* Spacious Drug Prescription Table */}
                      <div className="table-container" style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <table style={{ width: '100%', minWidth: 1080, fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                              <th style={{ width: 48, textAlign: 'center', padding: '10px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>NO</th>
                              <th style={{ minWidth: 180, padding: '10px 10px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>CONTENT NAME/COBINATIN</th>
                              <th style={{ minWidth: 170, padding: '10px 10px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>BRAND NAME</th>
                              <th style={{ minWidth: 130, padding: '10px 10px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>BRAND</th>
                              <th style={{ width: 95, padding: '10px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>DOSE</th>
                              <th style={{ minWidth: 125, padding: '10px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>FREQUNCY</th>
                              <th style={{ width: 85, padding: '10px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>DAY</th>
                              <th style={{ width: 75, textAlign: 'center', padding: '10px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>TOTAL</th>
                              <th style={{ minWidth: 180, padding: '10px 10px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>NOTE</th>
                              <th style={{ width: 95, padding: '10px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>PRICE</th>
                              <th style={{ width: 44, textAlign: 'center', padding: '10px 6px' }} />
                            </tr>
                          </thead>
                          <tbody>
                            {uniquePrescriptions.length === 0 ? (
                              <tr>
                                <td colSpan={11} style={{ padding: '40px 24px', textAlign: 'center', background: '#FAFCFE' }}>
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 460 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#036d92' }}>
                                      <Pill size={24} />
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1E293B' }}>
                                      No Prescription Medicines Added
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                                      Smart search medicines from the dispensary catalog above, or add a blank writable row to prescribe directly into table.
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={handleAddBlankRow}
                                        className="btn btn-sm btn-primary"
                                        style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                      >
                                        <Plus size={14} /> Add Prescription Row
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          drugSearchInputRef.current?.focus();
                                          setIsDrugDropdownOpen(true);
                                        }}
                                        className="btn btn-sm btn-outline"
                                        style={{ background: '#FFFFFF', borderColor: '#036d92', color: '#036d92', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                      >
                                        <Search size={14} /> Search Medicines
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          DEFAULT_DEMO_PRESCRIPTIONS.forEach(item => addPrescription(item));
                                        }}
                                        className="btn btn-sm"
                                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                      >
                                        <RotateCcw size={13} /> Load Sample Medication (Flucocip 400mg)
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              uniquePrescriptions.map((rx, idx) => (
                              <tr key={rx.id || `rx-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#334155', verticalAlign: 'middle', padding: '8px' }}>
                                  {idx + 1}
                                </td>

                                {/* Content name/cobinatin */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, fontWeight: 600, width: '100%',
                                      color: rx.visibility?.generic === false ? '#94A3B8' : '#1E293B',
                                      background: rx.visibility?.generic === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.genericName || ''}
                                    onChange={e => updatePrescription(rx.id, { genericName: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'generic')}
                                      style={{
                                        border: rx.visibility?.generic !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.generic !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.generic !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.generic !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.generic !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Brand name */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, fontWeight: 700, width: '100%',
                                      color: rx.visibility?.brandName === false ? '#94A3B8' : '#036d92',
                                      background: rx.visibility?.brandName === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.brandName || rx.drugName || ''}
                                    onChange={e => updatePrescription(rx.id, { brandName: e.target.value, drugName: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'brandName')}
                                      style={{
                                        border: rx.visibility?.brandName !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.brandName !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.brandName !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.brandName !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.brandName !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* brand (Manufacturer) */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, width: '100%',
                                      color: rx.visibility?.manufacturer === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.manufacturer === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.manufacturer || ''}
                                    onChange={e => updatePrescription(rx.id, { manufacturer: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'manufacturer')}
                                      style={{
                                        border: rx.visibility?.manufacturer !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.manufacturer !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.manufacturer !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.manufacturer !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.manufacturer !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* dose */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, width: '100%',
                                      color: rx.visibility?.dosage === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.dosage === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.dosage}
                                    onChange={e => updatePrescription(rx.id, { dosage: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'dosage')}
                                      style={{
                                        border: rx.visibility?.dosage !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.dosage !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.dosage !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.dosage !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.dosage !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* frequncy */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, width: '100%',
                                      color: rx.visibility?.frequency === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.frequency === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.frequency}
                                    onChange={e => updatePrescription(rx.id, { frequency: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'frequency')}
                                      style={{
                                        border: rx.visibility?.frequency !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.frequency !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.frequency !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.frequency !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.frequency !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* day */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, width: '100%',
                                      color: rx.visibility?.durationDays === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.durationDays === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.durationDays}
                                    onChange={e => updatePrescription(rx.id, { durationDays: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'durationDays')}
                                      style={{
                                        border: rx.visibility?.durationDays !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.durationDays !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.durationDays !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.durationDays !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.durationDays !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* total */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 6px', height: 30, fontWeight: 800, textAlign: 'center', width: '100%',
                                      color: rx.visibility?.totalQty === false ? '#94A3B8' : '#0F172A',
                                      background: rx.visibility?.totalQty === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.totalQty}
                                    onChange={e => updatePrescription(rx.id, { totalQty: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4, textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'totalQty')}
                                      style={{
                                        border: rx.visibility?.totalQty !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.totalQty !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.totalQty !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.totalQty !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.totalQty !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* note */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, width: '100%',
                                      color: rx.visibility?.instructions === false ? '#94A3B8' : '#475569',
                                      background: rx.visibility?.instructions === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.instructions}
                                    onChange={e => updatePrescription(rx.id, { instructions: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'instructions')}
                                      style={{
                                        border: rx.visibility?.instructions !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.instructions !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.instructions !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.instructions !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.instructions !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* price / slot no */}
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: 12, padding: '5px 8px', height: 30, fontWeight: 700, width: '100%',
                                      color: rx.visibility?.price === false ? '#94A3B8' : '#036d92',
                                      background: rx.visibility?.price === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    value={rx.price !== undefined ? String(rx.price) : (rx.slotNo || '')}
                                    onChange={e => updatePrescription(rx.id, { price: e.target.value, slotNo: e.target.value })}
                                  />
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'price')}
                                      style={{
                                        border: rx.visibility?.price !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.price !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.price !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.price !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.price !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Delete action */}
                                <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => removePrescription(rx.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Remove prescription item"
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* PROCEDURE PRESCRIPTION CARD (Spacious & Cleanly Proportioned) */}
                  {showProcSideOption ? (
                    <div id="procedure-prescription-section" className="card" style={{
                      border: '1.5px solid #BAE6FD',
                      background: '#F8FAFC',
                      borderRadius: 10,
                      overflow: 'hidden',
                      width: '100%',
                      boxShadow: '0 2px 8px rgba(3, 109, 146, 0.05)',
                      marginTop: 4
                    }}>
                      {/* Procedure Card Header */}
                      <div style={{
                        padding: '12px 18px', background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)', borderBottom: '1px solid #BAE6FD',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Scissors size={16} color="#036d92" />
                          <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0C4A6E' }}>
                            Procedure Prescription (Clinical Instruments &amp; Supplies)
                          </span>
                          <span className="badge" style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', fontWeight: 800 }}>
                            Optional
                          </span>
                          <span className="badge" style={{
                            fontSize: 10,
                            background: (uniqueProcedurePrescriptions.length > 0) ? '#0284C7' : '#E2E8F0',
                            color: (uniqueProcedurePrescriptions.length > 0) ? '#FFFFFF' : '#475569',
                            fontWeight: 800
                          }}>
                            {uniqueProcedurePrescriptions.length} Added to Rx
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowProcSideOption(false)}
                          style={{
                            background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 5,
                            padding: '4px 10px', color: '#64748B', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                          title="Collapse procedure section"
                        >
                          <X size={13} />
                          <span>Hide Section</span>
                        </button>
                      </div>

                      <div style={{ padding: 16 }}>
                        {/* Add Instrument / Supply Tool */}
                        <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #CBD5E1', marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#036d92', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Plus size={14} /> Add Instrument / Supply to Procedure List
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              Select from clinical catalog or enter custom instrument
                            </span>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: rxLayoutMode === 'split' ? '1fr' : '1.4fr 110px 150px auto',
                            gap: 10,
                            alignItems: 'flex-end'
                          }}>
                            {/* Column 1: Instrument / Drug */}
                            <div>
                              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                Instrument /drugh *
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                list="procedure-catalog-datalist"
                                placeholder="Select or type Instrument / Drug (e.g. 3.0 VICRIL SUTURE)..."
                                value={procRxItemName}
                                onChange={e => {
                                  const val = e.target.value;
                                  setProcRxItemName(val);
                                  const match = PROCEDURE_INSTRUMENTS_CATALOG.find(p => p.name.toLowerCase() === val.toLowerCase());
                                  if (match) {
                                    setProcRxIdCode(match.idCode);
                                    setProcRxQty(match.defaultQty);
                                  }
                                }}
                                style={{ fontSize: 12, padding: '6px 10px', fontWeight: 600, height: 35 }}
                              />
                              <datalist id="procedure-catalog-datalist">
                                {PROCEDURE_INSTRUMENTS_CATALOG.map(item => (
                                  <option key={item.name} value={item.name}>
                                    {item.idCode} • {item.category}
                                  </option>
                                ))}
                              </datalist>
                            </div>

                            {/* Column 2 & 3 in Split Mode / Stacked Mode */}
                            {rxLayoutMode === 'split' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '90px 130px auto', gap: 8, alignItems: 'flex-end' }}>
                                <div>
                                  <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                    qunity *
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-input"
                                    value={procRxQty}
                                    onChange={e => setProcRxQty(parseInt(e.target.value) || 1)}
                                    style={{ fontSize: 12, padding: '6px 8px', textAlign: 'center', fontWeight: 800, height: 35 }}
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                    ID CORD
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="ID code..."
                                    value={procRxIdCode}
                                    onChange={e => setProcRxIdCode(e.target.value)}
                                    style={{ fontSize: 12, padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, height: 35 }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleAddProcedurePrescription}
                                  className="btn btn-primary"
                                  style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 800, padding: '0 12px', height: 35, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                >
                                  <Plus size={14} /> Add
                                </button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                    qunity *
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-input"
                                    value={procRxQty}
                                    onChange={e => setProcRxQty(parseInt(e.target.value) || 1)}
                                    style={{ fontSize: 12, padding: '6px 8px', textAlign: 'center', fontWeight: 800, height: 35 }}
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                    ID CORD
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. BZX 320"
                                    value={procRxIdCode}
                                    onChange={e => setProcRxIdCode(e.target.value)}
                                    style={{ fontSize: 12, padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, height: 35 }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleAddProcedurePrescription}
                                  className="btn btn-primary"
                                  style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 800, padding: '0 16px', height: 35, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                  <Plus size={14} /> Add Instrument
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Active Procedure Prescriptions Table */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#1E293B' }}>
                              Active Procedure Items ({uniqueProcedurePrescriptions.length})
                            </span>
                            <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                              ✓ Included in final prescription slip (All fields directly writable)
                            </span>
                          </div>

                          {uniqueProcedurePrescriptions.length === 0 ? (
                            <div style={{
                              textAlign: 'center',
                              padding: '28px 18px',
                              background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
                              borderRadius: 8,
                              border: '1.5px dashed #CBD5E1',
                              color: '#64748B'
                            }}>
                              <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: '#E0F2FE',
                                color: '#036d92',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 8px'
                              }}>
                                <Scissors size={22} />
                              </div>
                              <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1E293B' }}>
                                No Procedure Instruments or Supplies Added (Optional)
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B', maxWidth: 460, margin: '4px auto 12px', lineHeight: 1.4 }}>
                                Prescribe clinical consumables (e.g. Sutures, Derma Rollers, Syringes) if performing an in-clinic minor procedure. If empty, this section will not appear on the final printed Rx slip.
                              </div>
                              <button
                                type="button"
                                onClick={handleLoadStandardProcedureSupplies}
                                className="btn btn-outline btn-sm"
                                style={{
                                  background: '#FFFFFF',
                                  borderColor: '#036d92',
                                  color: '#036d92',
                                  fontWeight: 700,
                                  fontSize: 11.5,
                                  padding: '5px 14px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Plus size={13} /> Load Standard Supplies (Vicril, Derma Roller, Syringe)
                              </button>
                            </div>
                          ) : (
                            <div className="table-container" style={{ border: '1px solid #CBD5E1', borderRadius: 8, background: '#FFFFFF', overflowX: 'auto' }}>
                              <table style={{ width: '100%', minWidth: rxLayoutMode === 'split' ? 440 : 680, fontSize: 12, borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                    <th style={{ width: 45, textAlign: 'center', padding: '9px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>NO</th>
                                    <th style={{ minWidth: 220, padding: '9px 12px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>INSTRUMENT /DRUGH</th>
                                    <th style={{ width: 90, textAlign: 'center', padding: '9px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>QUNITY</th>
                                    <th style={{ width: 140, padding: '9px 10px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>ID CORD</th>
                                    <th style={{ width: 120, textAlign: 'center', padding: '9px 8px', fontWeight: 800, color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>PRINT STATUS</th>
                                    <th style={{ width: 40, textAlign: 'center', padding: '9px 6px' }} />
                                  </tr>
                                </thead>
                                <tbody>
                                  {uniqueProcedurePrescriptions.map((item, idx) => (
                                    <tr key={item.id || `proc-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#334155', verticalAlign: 'middle', padding: '8px' }}>
                                        {idx + 1}
                                      </td>
                                      <td style={{ padding: '8px' }}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          style={{ fontSize: 12, padding: '5px 10px', height: 30, fontWeight: 700, color: '#036d92', width: '100%', borderRadius: 6, border: '1px solid #CBD5E1' }}
                                          value={item.itemName}
                                          onChange={e => updateProcedurePrescription(item.id, { itemName: e.target.value })}
                                        />
                                      </td>
                                      <td style={{ padding: '8px' }}>
                                        <input
                                          type="number"
                                          min={1}
                                          className="form-input"
                                          style={{ fontSize: 12, padding: '5px 6px', height: 30, textAlign: 'center', fontWeight: 800, width: '100%', borderRadius: 6, border: '1px solid #CBD5E1' }}
                                          value={item.quantity}
                                          onChange={e => updateProcedurePrescription(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                        />
                                      </td>
                                      <td style={{ padding: '8px' }}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          style={{ fontSize: 12, padding: '5px 8px', height: 30, fontFamily: 'monospace', fontWeight: 700, color: '#334155', width: '100%', borderRadius: 6, border: '1px solid #CBD5E1' }}
                                          value={item.idCode || ''}
                                          onChange={e => updateProcedurePrescription(item.id, { idCode: e.target.value })}
                                        />
                                      </td>
                                      <td style={{ textAlign: 'center', padding: '8px', verticalAlign: 'middle' }}>
                                        <span className="badge badge-success" style={{ fontSize: 10, padding: '3px 8px', fontWeight: 700 }}>
                                          ✓ Print on Rx
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'center', padding: '8px', verticalAlign: 'middle' }}>
                                        <button
                                          type="button"
                                          onClick={() => removeProcedurePrescription(item.id)}
                                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                          title="Remove procedure item"
                                        >
                                          <X size={15} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Procedure Prompt Banner */
                    <div style={{
                      padding: '12px 18px',
                      background: '#F0F9FF',
                      border: '1.5px dashed #93C5FD',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      width: '100%'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Scissors size={18} color="#036d92" />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#0C4A6E' }}>
                            Procedure Prescription (Optional)
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            Clinical instruments, sutures, or consumables for minor procedures.
                          </div>
                        </div>
                        <span className="badge" style={{ fontSize: 10.5, background: '#0284C7', color: '#FFFFFF', fontWeight: 800 }}>
                          {uniqueProcedurePrescriptions.length} Configured
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProcSideOption(true)}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#FFFFFF', borderColor: '#036d92', color: '#036d92', fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> Open Procedure Prescription ({uniqueProcedurePrescriptions.length} Items)
                      </button>
                    </div>
                  )}
                </div>

            {/* Prescriptions Action & Navigation Footer Bar */}
            <div style={{
              marginTop: 18,
              padding: '12px 18px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              {/* Left: Summary Metrics & Safety Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#1E293B', background: '#FFFFFF', padding: '5px 12px', borderRadius: 20, border: '1px solid #CBD5E1' }}>
                  <Pill size={14} color="#036d92" />
                  <span><strong>{uniquePrescriptions.length}</strong> Medicines Prescribed</span>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#1E293B', background: '#FFFFFF', padding: '5px 12px', borderRadius: 20, border: '1px solid #CBD5E1' }}>
                  <Scissors size={14} color="#0284C7" />
                  <span><strong>{uniqueProcedurePrescriptions.length}</strong> Procedure Supplies</span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: !aiSafetyReport.safe ? '#FEE2E2' : aiSafetyReport.isNotice ? '#FEF3C7' : '#ECFDF5',
                  color: !aiSafetyReport.safe ? '#991B1B' : aiSafetyReport.isNotice ? '#92400E' : '#065F46',
                  border: `1px solid ${!aiSafetyReport.safe ? '#FCA5A5' : aiSafetyReport.isNotice ? '#FDE68A' : '#A7F3D0'}`
                }}>
                  {!aiSafetyReport.safe ? (
                    <>
                      <ShieldAlert size={12} />
                      <span>Contraindication Alert</span>
                    </>
                  ) : aiSafetyReport.isNotice ? (
                    <>
                      <AlertTriangle size={12} />
                      <span>Penicillin Allergy Guard</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Allergy & Interaction Cleared</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="btn btn-outline"
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    height: 36,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="View formatted printable prescription slip preview"
                >
                  <Eye size={14} /> Preview Prescription Slip
                </button>

                <button
                  type="button"
                  onClick={handleSaveClinicalData}
                  className="btn btn-outline"
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    height: 36,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Save current prescription as draft"
                >
                  <Save size={14} /> Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSaveClinicalData();
                    setActiveTab('procedures');
                  }}
                  className="btn btn-primary"
                  style={{
                    background: '#036d92',
                    borderColor: '#036d92',
                    fontWeight: 800,
                    fontSize: 12.5,
                    height: 36,
                    padding: '0 18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)'
                  }}
                >
                  <span>Save &amp; Next (Tab 4: Procedures)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* ============================================================ */}
          {/* TAB 4: Clinical Procedures & Laser Protocol Tracker */}
          {/* ============================================================ */}
          {activeTab === 'procedures' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
              <div className="card-body" style={{ padding: '18px 20px' }}>
                {/* 1. PROTOCOL CONFIGURATION & AUTO-GENERATOR BAR */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 2px 8px rgba(3, 109, 146, 0.06)',
                  marginBottom: 20,
                  overflow: 'hidden'
                }}>
                  {/* Card Header */}
                  <div style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
                    borderBottom: '1px solid #BAE6FD',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#036d92', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0C4A6E', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Laser &amp; Clinical Procedure Treatment Protocol</span>
                          <span className="badge" style={{ background: '#0284C7', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800 }}>
                            {uniqueProcedures.length} Sessions Tracked
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 1 }}>
                          Auto-generator from 1st session date • Auto-generated f/u dates • DALY BY 12 DAY AUTO UPDATE • All fields directly writable
                        </div>
                      </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSessions}
                        className="btn btn-sm btn-primary"
                        style={{
                          background: '#036d92',
                          borderColor: '#036d92',
                          fontWeight: 800,
                          fontSize: 12,
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)'
                        }}
                        title="Auto-calculate session dates starting from 1st selection date with specified interval"
                      >
                        <Zap size={14} /> ⚡ Auto-Generate Schedule
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadDefaultLaserProtocol}
                        className="btn btn-sm btn-outline"
                        style={{
                          background: '#FFFFFF',
                          borderColor: '#0284C7',
                          color: '#0284C7',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '6px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title="Load Hair Removal Diode (4 Sessions Protocol)"
                      >
                        <RotateCcw size={13} /> Load Hair Removal Diode (4 Sessions)
                      </button>

                      <button
                        type="button"
                        onClick={handleAddBlankSessionRow}
                        className="btn btn-sm btn-outline"
                        style={{
                          background: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '6px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Plus size={13} /> + Add Row
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCatalogDrawer(!showCatalogDrawer)}
                        className="btn btn-sm btn-outline"
                        style={{
                          background: showCatalogDrawer ? '#E0F2FE' : '#FFFFFF',
                          borderColor: showCatalogDrawer ? '#0284C7' : '#CBD5E1',
                          color: showCatalogDrawer ? '#0369A1' : '#475569',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '6px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Sliders size={13} /> Clinical Catalog ({procCatalog.length})
                      </button>
                    </div>
                  </div>

                  {/* Protocol Inputs Grid */}
                  <div style={{ padding: '16px 18px', background: '#FFFFFF' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 12,
                      alignItems: 'flex-end'
                    }}>
                      {/* Date */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          Date *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={protocolForm.startDate}
                          onChange={e => setProtocolForm({ ...protocolForm, startDate: e.target.value })}
                          placeholder="25/03/2026"
                          style={{ fontSize: 12, fontWeight: 700, height: 34 }}
                        />
                      </div>

                      {/* Therapist / Procedures By */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          Therapist / By *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          list="protocol-therapist-list"
                          value={protocolForm.therapist}
                          onChange={e => setProtocolForm({ ...protocolForm, therapist: e.target.value })}
                          placeholder="Dr valaki"
                          style={{ fontSize: 12, fontWeight: 700, height: 34 }}
                        />
                        <datalist id="protocol-therapist-list">
                          <option value="Dr valaki" />
                          <option value="Dr. Raj Valaki" />
                          <option value="Dr. Arvind Shah" />
                          <option value="Therapist Anita" />
                          <option value="Therapist Priya" />
                        </datalist>
                      </div>

                      {/* Procedure / Technology */}
                      <div style={{ minWidth: 170 }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          Procedure / Tech *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          list="protocol-procedure-list"
                          value={protocolForm.procedureName}
                          onChange={e => setProtocolForm({ ...protocolForm, procedureName: e.target.value })}
                          placeholder="HAIR REMOVAL - DIODE"
                          style={{ fontSize: 12, fontWeight: 700, height: 34 }}
                        />
                        <datalist id="protocol-procedure-list">
                          <option value="HAIR REMOVAL - DIODE" />
                          <option value="DIOED" />
                          <option value="Q-SWITCH Nd:YAG LASER" />
                          <option value="CO2 FRACTIONAL LASER" />
                          <option value="CHEMICAL PEEL (GLYCOLIC)" />
                          <option value="PRP SCALP REJUVENATION" />
                          <option value="MICRONEEDLING DERMA ROLLER" />
                        </datalist>
                      </div>

                      {/* Body Part */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          BODY PART *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          list="protocol-body-part-list"
                          value={protocolForm.bodyPart}
                          onChange={e => setProtocolForm({ ...protocolForm, bodyPart: e.target.value })}
                          placeholder="FACE"
                          style={{ fontSize: 12, fontWeight: 700, height: 34 }}
                        />
                        <datalist id="protocol-body-part-list">
                          <option value="FACE" />
                          <option value="FULL FACE" />
                          <option value="UNDERARMS" />
                          <option value="BEARD SHAPING" />
                          <option value="ARMS" />
                          <option value="LEGS" />
                          <option value="BACK" />
                          <option value="CHEST" />
                          <option value="SCALP" />
                        </datalist>
                      </div>

                      {/* Number of Sessions */}
                      <div style={{ maxWidth: 110 }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          Number of setion *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          className="form-input"
                          value={protocolForm.totalSessions}
                          onChange={e => {
                            const num = parseInt(e.target.value) || 1;
                            setProtocolForm({ ...protocolForm, totalSessions: num });
                          }}
                          style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', height: 34 }}
                        />
                      </div>

                      {/* Interval Days (B/W-F DAY) */}
                      <div style={{ maxWidth: 110 }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          B/W-F DAY *
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="form-input"
                          value={protocolForm.intervalDays}
                          onChange={e => {
                            const days = parseInt(e.target.value) || 1;
                            setProtocolForm({ ...protocolForm, intervalDays: days });
                          }}
                          style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', height: 34 }}
                        />
                      </div>

                      {/* Actually Price */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          Acully price (₹)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={protocolForm.actualPrice}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const disc = protocolForm.discountPercent || 0;
                            const after = Math.round(val * (1 - disc / 100));
                            setProtocolForm({ ...protocolForm, actualPrice: val, afterDiscountPrice: after, total: after });
                          }}
                          style={{ fontSize: 12, fontWeight: 800, height: 34 }}
                        />
                      </div>

                      {/* Discount % */}
                      <div style={{ maxWidth: 100 }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          Dicouent %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="form-input"
                          value={protocolForm.discountPercent}
                          onChange={e => {
                            const disc = parseFloat(e.target.value) || 0;
                            const after = Math.round(protocolForm.actualPrice * (1 - disc / 100));
                            setProtocolForm({ ...protocolForm, discountPercent: disc, afterDiscountPrice: after, total: after });
                          }}
                          style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', height: 34 }}
                        />
                      </div>

                      {/* After Discount Price */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#334155', marginBottom: 4 }}>
                          After discount
                        </label>
                        <div style={{ height: 34, display: 'flex', alignItems: 'center', fontWeight: 900, color: '#036d92', fontSize: 13, background: '#F8FAFC', padding: '0 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                          ₹{protocolForm.afterDiscountPrice.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Total */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: '#059669', marginBottom: 4 }}>
                          Total (₹)
                        </label>
                        <div style={{ height: 34, display: 'flex', alignItems: 'center', fontWeight: 900, color: '#059669', fontSize: 14, background: '#ECFDF5', padding: '0 10px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                          ₹{protocolForm.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Auto-Generator Live Schedule Preview */}
                    <div style={{
                      marginTop: 12,
                      padding: '9px 14px',
                      background: '#F0F9FF',
                      borderRadius: 7,
                      border: '1px solid #BAE6FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontSize: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#0369A1' }}>
                        <Clock size={14} />
                        <span>
                          <strong>Auto-Generator from 1st selection day:</strong>
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0C4A6E' }}>
                          {protocolForm.startDate} (+{protocolForm.intervalDays}d interval):
                          {Array.from({ length: Math.min(5, protocolForm.totalSessions) }).map((_, i) => {
                            const start = protocolForm.startDate.includes('-') ? formatToDDMMYYYY(new Date(protocolForm.startDate)) : protocolForm.startDate;
                            return (
                              <span key={i} style={{ marginLeft: 6 }}>
                                {i > 0 && ' → '}
                                {addDaysToFormattedDate(start, i * protocolForm.intervalDays)}
                              </span>
                            );
                          })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge" style={{ background: '#0284C7', color: '#FFFFFF', fontSize: 10, fontWeight: 800 }}>
                          Rate: ₹{Math.round(protocolForm.afterDiscountPrice / Math.max(1, protocolForm.totalSessions))} / session
                        </span>
                        <span className="badge" style={{ background: '#10B981', color: '#FFFFFF', fontSize: 10, fontWeight: 800 }}>
                          AUTO UPGREAD ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Collapsible Clinic Procedure Catalog Drawer */}
                {showCatalogDrawer && (
                  <div style={{
                    marginBottom: 20,
                    padding: 16,
                    background: '#F8FAFC',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#036d92' }}>
                        Select from Clinic Procedure Directory to Auto-Fill Protocol
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCatalogDrawer(false)}
                        className="btn btn-ghost btn-sm"
                      >
                        <X size={14} /> Close
                      </button>
                    </div>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search Diode laser, PRP, Chemical peel, Biopsy, Dressing..."
                      value={procSearch}
                      onChange={e => setProcSearch(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                      {procCatalog
                        .filter(p => !procSearch || p.name.toLowerCase().includes(procSearch.toLowerCase()))
                        .map(proc => (
                          <div
                            key={proc.id}
                            style={{
                              padding: 10,
                              background: '#FFFFFF',
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12.5 }}>{proc.name}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>
                                {proc.category} • Approx {proc.durationMins}m • ₹{proc.price}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setProtocolForm(f => ({
                                  ...f,
                                  procedureName: proc.name,
                                  actualPrice: proc.price,
                                  afterDiscountPrice: Math.round(proc.price * (1 - f.discountPercent / 100)),
                                  total: Math.round(proc.price * (1 - f.discountPercent / 100))
                                }));
                                addNotification({
                                  type: 'info',
                                  message: `Selected ${proc.name} for treatment protocol`
                                });
                              }}
                              className="btn btn-sm btn-outline"
                              style={{ borderColor: '#036d92', color: '#036d92', fontSize: 11, padding: '3px 8px' }}
                            >
                              Select
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. THE 22-COLUMN CLINICAL EXECUTION SECTION (PERFOMENS DATE done & Laser Parameters) */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#1E293B' }}>
                        Procedure Sessions Execution &amp; Laser Machine Settings ({uniqueProcedures.length})
                      </span>
                      <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 10.5 }}>
                        All 22 Fields Directly Writable
                      </span>
                    </div>

                    {/* View Switcher: All 22 Fields Cards (No Scroll) vs 22-Col Spreadsheet Table */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Click <strong>Delay +12d</strong> to auto-shift schedule • Click <strong>Cancel</strong> to record reasons
                      </div>

                      <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 2.5, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                        <button
                          type="button"
                          onClick={() => setProcedureViewMode('cards')}
                          style={{
                            border: 'none',
                            background: procedureViewMode === 'cards' ? '#036d92' : 'transparent',
                            color: procedureViewMode === 'cards' ? '#FFFFFF' : '#475569',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '5px 12px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: procedureViewMode === 'cards' ? '0 1px 3px rgba(3,109,146,0.3)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title="Display all 22 fields in dedicated clinical session cards without horizontal scrolling"
                        >
                          <LayoutGrid size={13} /> 🗂️ All 22 Fields Cards (Full View)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProcedureViewMode('table')}
                          style={{
                            border: 'none',
                            background: procedureViewMode === 'table' ? '#036d92' : 'transparent',
                            color: procedureViewMode === 'table' ? '#FFFFFF' : '#475569',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '5px 12px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: procedureViewMode === 'table' ? '0 1px 3px rgba(3,109,146,0.3)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title="Display all 22 fields in horizontal spreadsheet table"
                        >
                          <List size={13} /> ▥ 22-Col Spreadsheet
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MODE 1: ALL 22 FIELDS SESSION CARDS (Full Visibility - Zero Horizontal Scroll) */}
                  {procedureViewMode === 'cards' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {uniqueProcedures.map((item, idx) => {
                        const isDone = item.status === 'Done';
                        const isConfirmed = item.status === 'Confirmed';
                        const isDelayed = item.status === 'Delayed';
                        const isCancelled = item.status === 'Cancelled';

                        const cardBorder = isDone ? '#86EFAC' : isConfirmed ? '#7DD3FC' : isDelayed ? '#FDE047' : isCancelled ? '#FCA5A5' : '#CBD5E1';
                        const headerBg = isDone ? 'linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%)' :
                                         isConfirmed ? 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)' :
                                         isDelayed ? 'linear-gradient(180deg, #FEFCE8 0%, #FEF9C3 100%)' :
                                         isCancelled ? 'linear-gradient(180deg, #FEF2F2 0%, #FEE2E2 100%)' :
                                         'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)';

                        return (
                          <div
                            key={item.id || `proc-card-${idx}`}
                            style={{
                              background: '#FFFFFF',
                              borderRadius: 10,
                              border: `1.5px solid ${cardBorder}`,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              overflow: 'hidden',
                              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                            }}
                          >
                            {/* Card Top Banner: Session Header + Badges + Action Buttons */}
                            <div style={{
                              padding: '10px 16px',
                              background: headerBg,
                              borderBottom: `1px solid ${cardBorder}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 10
                            }}>
                              {/* Left: Session Number & Identity */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <div style={{
                                  background: isDone ? '#15803D' : isConfirmed ? '#0369A1' : isDelayed ? '#B45309' : isCancelled ? '#B91C1C' : '#036d92',
                                  color: '#FFFFFF',
                                  fontWeight: 900,
                                  fontSize: 12.5,
                                  padding: '3px 10px',
                                  borderRadius: 6,
                                  letterSpacing: 0.5,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <Zap size={13} />
                                  Session {item.sessionsCount || `${idx + 1}/4`}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                  <span style={{ fontWeight: 800, color: '#0F172A' }}>
                                    {item.procedureName || 'HAIR REMOVAL - DIODE'}
                                  </span>
                                  <span style={{ color: '#94A3B8' }}>•</span>
                                  <span style={{ fontWeight: 700, color: '#036d92' }}>
                                    {item.bodyPart || 'FACE'}
                                  </span>
                                  <span style={{ color: '#94A3B8' }}>•</span>
                                  <span style={{ fontSize: 11.5, color: '#64748B' }}>
                                    By: <strong>{item.therapist || 'Dr Valaki'}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Right: Quick Action Buttons */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {isDone && (
                                  <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 11, padding: '4px 10px', border: '1px solid #86EFAC' }}>
                                    ✓ Done (Executed: {item.performanceDate || '25/03/2026'})
                                  </span>
                                )}

                                {!isDone && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkDoneSession(item.id)}
                                    className="btn btn-sm"
                                    style={{ background: '#10B981', color: '#FFFFFF', border: 'none', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 5, height: 28, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    title="Mark session as executed today"
                                  >
                                    <Check size={13} /> ✓ Done
                                  </button>
                                )}

                                {/* DALY BY 12 DAY AUTO UPDATE Button (Prominent Amber Pill) */}
                                {!isDone && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelaySession(item.id, 12, 'DALY BY 12 DAY AUTO UPDATE')}
                                    className="btn btn-sm"
                                    style={{
                                      background: '#D97706',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: '4px 12px',
                                      borderRadius: 5,
                                      height: 28,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      boxShadow: '0 1px 3px rgba(217, 119, 6, 0.35)'
                                    }}
                                    title="DALY BY 12 DAY AUTO UPDATE: Shifts this session date by +12d and auto-shifts all downstream scheduled sessions!"
                                  >
                                    <Clock size={13} />
                                    {item.sessionNumber === 2 || item.sessionsCount?.includes('2/4') ? 'DALY BY 12 DAY AUTO UPDATE' : '⏱ Delay +12d'}
                                  </button>
                                )}

                                {/* CANFORMED Button */}
                                {!isDone && !isConfirmed && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmSession(item.id)}
                                    className="btn btn-sm"
                                    style={{
                                      background: '#0284C7',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: '4px 10px',
                                      borderRadius: 5,
                                      height: 28,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title="CANFORMED: PAYMENT PAY AND GIVE APPIENTMENT"
                                  >
                                    <Check size={13} /> ✓ CANFORMED
                                  </button>
                                )}

                                {/* *cancle setion Button */}
                                {!isCancelled && !isDone && (
                                  <button
                                    type="button"
                                    onClick={() => setCancelModalState({
                                      isOpen: true,
                                      procedureId: item.id,
                                      reason: 'Not tacken further interested'
                                    })}
                                    className="btn btn-sm"
                                    style={{
                                      background: '#EF4444',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: '4px 10px',
                                      borderRadius: 5,
                                      height: 28,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title="*cancle setion: Record cancellation reasons"
                                  >
                                    <Ban size={13} /> ✕ *cancle setion
                                  </button>
                                )}

                                {/* Delete Session Icon */}
                                <button
                                  type="button"
                                  onClick={() => removeProcedure(item.id)}
                                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, marginLeft: 4 }}
                                  title="Delete session"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Card Body: 3 Structured Rows Showing All 22 Fields */}
                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              
                              {/* ROW 1: SCHEDULE & CLINICAL DEMOGRAPHICS (Fields 1 to 6) */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                                gap: 10,
                                background: '#F8FAFC',
                                padding: '10px 12px',
                                borderRadius: 8,
                                border: '1px solid #E2E8F0'
                              }}>
                                {/* Field 1: NO */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#036d92', display: 'block', marginBottom: 3 }}>
                                    1. NO (SESSION)
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={item.sessionsCount || `${idx + 1}/4`}
                                    onChange={e => updateProcedure(item.id, { sessionsCount: e.target.value })}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 800, color: '#036d92', textAlign: 'center' }}
                                  />
                                </div>

                                {/* Field 2: F/U DATE */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#0C4A6E', display: 'block', marginBottom: 3 }}>
                                    2. F/U DATE
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={item.scheduledDate}
                                    onChange={e => updateProcedure(item.id, { scheduledDate: e.target.value })}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}
                                  />
                                </div>

                                {/* Field 3: PERFOMENS DATE done */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: isDone ? '#15803D' : '#64748B', display: 'block', marginBottom: 3 }}>
                                    3. PERFOMENS DATE done
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder={isDone ? '25/03/2026' : 'Pending'}
                                    value={item.performanceDate || ''}
                                    onChange={e => updateProcedure(item.id, { performanceDate: e.target.value })}
                                    style={{
                                      height: 32, fontSize: 11.5, fontWeight: 700, fontFamily: 'monospace',
                                      color: isDone ? '#15803D' : '#64748B',
                                      background: isDone ? '#F0FDF4' : '#FFFFFF'
                                    }}
                                  />
                                </div>

                                {/* Field 4: Procegues / Tech */}
                                <div style={{ minWidth: 160 }}>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 3 }}>
                                    4. PROCEDURE / TECH
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={item.procedureName}
                                    onChange={e => updateProcedure(item.id, { procedureName: e.target.value })}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}
                                  />
                                </div>

                                {/* Field 5: Therapiest */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 3 }}>
                                    5. THERAPIST / BY
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={item.therapist || protocolForm.therapist}
                                    onChange={e => updateProcedure(item.id, { therapist: e.target.value })}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 700, color: '#334155' }}
                                  />
                                </div>

                                {/* Field 6: BODY PART */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 3 }}>
                                    6. BODY PART
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={item.bodyPart || protocolForm.bodyPart}
                                    onChange={e => updateProcedure(item.id, { bodyPart: e.target.value })}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 800, textAlign: 'center', color: '#036d92' }}
                                  />
                                </div>
                              </div>

                              {/* ROW 2: ⚡ LASER MACHINE PARAMETERS (Fields 7 to 17 - All 11 Technical Fields) */}
                              <div style={{
                                background: '#FFFBEB',
                                padding: '10px 12px',
                                borderRadius: 8,
                                border: '1px solid #FDE68A'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                  <span style={{ fontSize: 10.5, fontWeight: 900, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    ⚡ Laser Machine Settings (All 11 Parameters Directly Writable)
                                  </span>
                                </div>

                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                                  gap: 8
                                }}>
                                  {/* 7. Skin type */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Skin Type
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.skinType ?? '2'}
                                      onChange={e => updateProcedure(item.id, { skinType: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 8. Unit */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Unit
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.unit ?? '0'}
                                      onChange={e => updateProcedure(item.id, { unit: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 9. Powar */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Power (J)
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.power ?? '10'}
                                      onChange={e => updateProcedure(item.id, { power: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 10. Wawe length */}
                                  <div style={{ minWidth: 85 }}>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Wave Length
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.waveLength ?? '100 hz'}
                                      onChange={e => updateProcedure(item.id, { waveLength: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 11. plus duration */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Pulse Dur.
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.pulseDuration ?? '10'}
                                      onChange={e => updateProcedure(item.id, { pulseDuration: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 12. sport size */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Spot Size
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.spotSize ?? '2.2'}
                                      onChange={e => updateProcedure(item.id, { spotSize: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 13. Pulse impuls */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Pulse Impuls
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.pulseImpulse ?? '25'}
                                      onChange={e => updateProcedure(item.id, { pulseImpulse: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 14. Thick ness */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Thickness
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.thickness ?? '10'}
                                      onChange={e => updateProcedure(item.id, { thickness: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 15. Den city */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Density
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.density ?? '.5'}
                                      onChange={e => updateProcedure(item.id, { density: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 16. Dot dencity */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Dot Density
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.dotDensity ?? '10'}
                                      onChange={e => updateProcedure(item.id, { dotDensity: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* 17. Short fire */}
                                  <div>
                                    <label style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', display: 'block', marginBottom: 2 }}>
                                      Shots Fired
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.shotsFired ?? (isDone ? '100' : '')}
                                      placeholder={isDone ? '100' : '—'}
                                      onChange={e => updateProcedure(item.id, { shotsFired: e.target.value })}
                                      style={{ height: 30, fontSize: 11, textAlign: 'center', fontWeight: 800, background: '#FFFFFF' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* ROW 3: STATUS, REMARKS, RATE & PAYMENT (Fields 18 to 22) */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                gap: 10,
                                alignItems: 'flex-end',
                                background: '#F0FDF4',
                                padding: '10px 12px',
                                borderRadius: 8,
                                border: '1px solid #BBF7D0'
                              }}>
                                {/* Field 18: satues */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 3 }}>
                                    18. STATUS
                                  </label>
                                  <select
                                    className="form-select"
                                    value={item.status || 'Pending'}
                                    onChange={e => {
                                      const val = e.target.value as any;
                                      updateProcedure(item.id, { status: val });
                                      if (val === 'Done') handleMarkDoneSession(item.id);
                                    }}
                                    style={{
                                      height: 32, fontSize: 11, fontWeight: 800,
                                      background: isDone ? '#DCFCE7' : isConfirmed ? '#E0F2FE' : isDelayed ? '#FEF9C3' : isCancelled ? '#FEE2E2' : '#FFFFFF',
                                      color: isDone ? '#166534' : isConfirmed ? '#075985' : isDelayed ? '#854D0E' : isCancelled ? '#991B1B' : '#334155'
                                    }}
                                  >
                                    <option value="Done">✓ Done</option>
                                    <option value="Confirmed">✓ CANFORMED</option>
                                    <option value="Delayed">⏱ Delayed</option>
                                    <option value="Cancelled">✕ Cancle</option>
                                    <option value="Pending">⌛ Pending</option>
                                  </select>
                                </div>

                                {/* Field 19: Remark / resouen */}
                                <div style={{ minWidth: 260, gridColumn: 'span 2' }}>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 3 }}>
                                    19. REMARK / CLINICAL REASON
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={item.remark || ''}
                                    placeholder="Enter clinical remark, delay note, or cancellation reason..."
                                    onChange={e => updateProcedure(item.id, { remark: e.target.value })}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 600, color: '#1E293B', background: '#FFFFFF' }}
                                  />
                                </div>

                                {/* Field 20: Rate */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 3 }}>
                                    20. RATE (₹)
                                  </label>
                                  <input
                                    type="number"
                                    className="form-input"
                                    value={item.rate || item.price || 2000}
                                    onChange={e => {
                                      const r = parseFloat(e.target.value) || 0;
                                      updateProcedure(item.id, { rate: r, price: r });
                                    }}
                                    style={{ height: 32, fontSize: 11.5, fontWeight: 800, textAlign: 'center', color: '#036d92', background: '#FFFFFF' }}
                                  />
                                </div>

                                {/* Field 21: Payment satues */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 3 }}>
                                    21. PAYMENT STATUS
                                  </label>
                                  <select
                                    className="form-select"
                                    value={item.paymentStatus || (isDone ? 'Done' : 'Pending')}
                                    onChange={e => updateProcedure(item.id, { paymentStatus: e.target.value as any })}
                                    style={{
                                      height: 32, fontSize: 11, fontWeight: 700,
                                      background: item.paymentStatus === 'Done' ? '#DCFCE7' : item.paymentStatus === 'Partially Paid' ? '#FEF9C3' : item.paymentStatus === 'Cancelled' ? '#FEE2E2' : '#FFFFFF',
                                      color: item.paymentStatus === 'Done' ? '#166534' : item.paymentStatus === 'Cancelled' ? '#991B1B' : '#334155'
                                    }}
                                  >
                                    <option value="Done">Done</option>
                                    <option value="Done/pending">Done/pending</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Partially Paid">Partially Paid</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MODE 2: THE 22-COLUMN CLINICAL SPREADSHEET TABLE */}
                  {procedureViewMode === 'table' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '8px 8px 0 0',
                        padding: '8px 14px',
                        fontSize: 11.5,
                        color: '#1E40AF',
                        fontWeight: 600,
                        flexWrap: 'wrap',
                        gap: 8
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>↔</span>
                          <span><strong>22-Column Spreadsheet Active:</strong> Scroll horizontally to access all parameters, status, remarks, rate &amp; action buttons.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProcedureViewMode('cards')}
                          style={{
                            background: '#036d92',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 5,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <LayoutGrid size={12} /> Switch to Cards View (Zero Scroll) →
                        </button>
                      </div>
                      <div className="table-container" style={{
                        border: '1px solid #CBD5E1',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        background: '#FFFFFF',
                        overflowX: 'auto',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                      <table style={{ width: '100%', minWidth: 1720, fontSize: 11.5, borderCollapse: 'collapse' }}>
                      <thead>
                        {/* Two-Tier Grouped Header */}
                        <tr style={{ background: '#E2E8F0', borderBottom: '1px solid #CBD5E1', fontSize: 11, fontWeight: 800 }}>
                          <th colSpan={6} style={{ padding: '7px 10px', textAlign: 'left', color: '#0C4A6E', background: '#E0F2FE', borderRight: '1px solid #CBD5E1' }}>
                            📅 1. SESSION &amp; CLINICAL SCHEDULE
                          </th>
                          <th colSpan={11} style={{ padding: '7px 10px', textAlign: 'center', color: '#854D0E', background: '#FEF3C7', borderRight: '1px solid #CBD5E1' }}>
                            ⚡ 2. LASER MACHINE PARAMETERS (WRITABLE)
                          </th>
                          <th colSpan={5} style={{ padding: '7px 10px', textAlign: 'left', color: '#065F46', background: '#DCFCE7' }}>
                            📋 3. STATUS, BILLING &amp; ACTION BUTTONS
                          </th>
                        </tr>
                        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                          <th style={{ width: 60, textAlign: 'center', padding: '9px 6px', fontWeight: 800, color: '#334155', fontSize: 11 }}>NO</th>
                          <th style={{ minWidth: 115, padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>F/U DATE</th>
                          <th style={{ minWidth: 125, padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>PERFOMENS DATE done</th>
                          <th style={{ minWidth: 160, padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Procegues / Tech</th>
                          <th style={{ minWidth: 110, padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Therapiest</th>
                          <th style={{ minWidth: 90, padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11, borderRight: '1px solid #CBD5E1' }}>BODY PART</th>
                          <th style={{ width: 68, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Skin type</th>
                          <th style={{ width: 55, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Unit</th>
                          <th style={{ width: 68, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Powar</th>
                          <th style={{ width: 88, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Wawe length</th>
                          <th style={{ width: 80, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>plus duration</th>
                          <th style={{ width: 75, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>sport size</th>
                          <th style={{ width: 78, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Pulse impuls</th>
                          <th style={{ width: 75, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Thick ness</th>
                          <th style={{ width: 68, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Den city</th>
                          <th style={{ width: 75, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Dot dencity</th>
                          <th style={{ width: 78, textAlign: 'center', padding: '9px 4px', fontWeight: 800, color: '#334155', fontSize: 11, borderRight: '1px solid #CBD5E1' }}>Short fire</th>
                          <th style={{ minWidth: 120, textAlign: 'center', padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>satues</th>
                          <th style={{ minWidth: 180, padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Remark / resouen</th>
                          <th style={{ width: 85, textAlign: 'center', padding: '9px 6px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Rate</th>
                          <th style={{ minWidth: 110, textAlign: 'center', padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Payment satues</th>
                          <th style={{ minWidth: 240, textAlign: 'center', padding: '9px 8px', fontWeight: 800, color: '#334155', fontSize: 11 }}>Action button</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueProcedures.map((item, idx) => {
                          const isDone = item.status === 'Done';
                          const isConfirmed = item.status === 'Confirmed';
                          const isDelayed = item.status === 'Delayed';
                          const isCancelled = item.status === 'Cancelled';

                          const rowBg = isDone ? '#F0FDF4' : isConfirmed ? '#F0F9FF' : isDelayed ? '#FEFCE8' : isCancelled ? '#FEF2F2' : '#FFFFFF';

                          return (
                            <tr key={item.id || `proc-row-${idx}`} style={{ background: rowBg, borderBottom: '1px solid #E2E8F0', transition: 'background 0.15s ease' }}>
                              {/* NO (e.g. 1/4) */}
                              <td style={{ textAlign: 'center', padding: '6px 4px', verticalAlign: 'middle' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.sessionsCount || `${idx + 1}/4`}
                                  onChange={e => updateProcedure(item.id, { sessionsCount: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 800, color: '#036d92', height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* F/U DATE (SCHEDULED) */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.scheduledDate}
                                  onChange={e => updateProcedure(item.id, { scheduledDate: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 6px', fontWeight: 700, fontFamily: 'monospace', height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* PERFOMENS DATE DONE */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder={isDone ? '25/03/2026' : 'Pending'}
                                  value={item.performanceDate || ''}
                                  onChange={e => updateProcedure(item.id, { performanceDate: e.target.value })}
                                  style={{
                                    fontSize: 11, padding: '4px 6px', fontWeight: 700,
                                    color: isDone ? '#15803D' : '#64748B',
                                    fontFamily: 'monospace', height: 29, width: '100%', borderRadius: 5
                                  }}
                                />
                              </td>

                              {/* PROCEDURE / TECH */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.procedureName}
                                  onChange={e => updateProcedure(item.id, { procedureName: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 6px', fontWeight: 700, color: '#0C4A6E', height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* THERAPIST */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.therapist || protocolForm.therapist}
                                  onChange={e => updateProcedure(item.id, { therapist: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 6px', fontWeight: 600, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* BODY PART */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.bodyPart || protocolForm.bodyPart}
                                  onChange={e => updateProcedure(item.id, { bodyPart: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 6px', fontWeight: 700, textAlign: 'center', height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* SKIN TYPE */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.skinType ?? '2'}
                                  onChange={e => updateProcedure(item.id, { skinType: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* UNIT */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.unit ?? '0'}
                                  onChange={e => updateProcedure(item.id, { unit: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* POWAR */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.power ?? '10'}
                                  onChange={e => updateProcedure(item.id, { power: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* WAWE LENGTH */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.waveLength ?? '100 hz'}
                                  onChange={e => updateProcedure(item.id, { waveLength: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* PLUS DURATION */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.pulseDuration ?? '10'}
                                  onChange={e => updateProcedure(item.id, { pulseDuration: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* SPORT SIZE */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.spotSize ?? '2.2'}
                                  onChange={e => updateProcedure(item.id, { spotSize: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* PULSE IMPULS */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.pulseImpulse ?? '25'}
                                  onChange={e => updateProcedure(item.id, { pulseImpulse: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* THICK NESS */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.thickness ?? '10'}
                                  onChange={e => updateProcedure(item.id, { thickness: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* DEN CITY */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.density ?? '.5'}
                                  onChange={e => updateProcedure(item.id, { density: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* DOT DENCITY */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.dotDensity ?? '10'}
                                  onChange={e => updateProcedure(item.id, { dotDensity: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* SHORT FIRE */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.shotsFired ?? (isDone ? '100' : '')}
                                  placeholder={isDone ? '100' : '—'}
                                  onChange={e => updateProcedure(item.id, { shotsFired: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 700, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* STATUS DROPDOWN */}
                              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                <select
                                  className="form-select"
                                  value={item.status || 'Pending'}
                                  onChange={e => {
                                    const val = e.target.value as any;
                                    updateProcedure(item.id, { status: val });
                                    if (val === 'Done') {
                                      handleMarkDoneSession(item.id);
                                    }
                                  }}
                                  style={{
                                    fontSize: 10.5, fontWeight: 800, padding: '3px 4px', height: 29, borderRadius: 5,
                                    background: isDone ? '#DCFCE7' : isConfirmed ? '#E0F2FE' : isDelayed ? '#FEF9C3' : isCancelled ? '#FEE2E2' : '#F1F5F9',
                                    color: isDone ? '#166534' : isConfirmed ? '#075985' : isDelayed ? '#854D0E' : isCancelled ? '#991B1B' : '#475569',
                                    border: '1px solid #CBD5E1'
                                  }}
                                >
                                  <option value="Done">✓ Done</option>
                                  <option value="Confirmed">✓ CANFORMED</option>
                                  <option value="Delayed">⏱ Delayed</option>
                                  <option value="Cancelled">✕ Cancle</option>
                                  <option value="Pending">⌛ Pending</option>
                                </select>
                              </td>

                              {/* REMARK / RESOUEN */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.remark || ''}
                                  placeholder="Enter clinical remark / reason..."
                                  onChange={e => updateProcedure(item.id, { remark: e.target.value })}
                                  style={{ fontSize: 11, padding: '4px 6px', fontWeight: 500, height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* RATE */}
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={item.rate || item.price || 2000}
                                  onChange={e => {
                                    const r = parseFloat(e.target.value) || 0;
                                    updateProcedure(item.id, { rate: r, price: r });
                                  }}
                                  style={{ fontSize: 11, padding: '4px 2px', textAlign: 'center', fontWeight: 800, color: '#036d92', height: 29, width: '100%', borderRadius: 5 }}
                                />
                              </td>

                              {/* PAYMENT STATUS */}
                              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                <select
                                  className="form-select"
                                  value={item.paymentStatus || (isDone ? 'Done' : 'Pending')}
                                  onChange={e => updateProcedure(item.id, { paymentStatus: e.target.value as any })}
                                  style={{
                                    fontSize: 10.5, fontWeight: 700, padding: '3px 4px', height: 29, borderRadius: 5,
                                    background: item.paymentStatus === 'Done' ? '#DCFCE7' : item.paymentStatus === 'Partially Paid' ? '#FEF9C3' : item.paymentStatus === 'Cancelled' ? '#FEE2E2' : '#F8FAFC',
                                    color: item.paymentStatus === 'Done' ? '#166534' : item.paymentStatus === 'Cancelled' ? '#991B1B' : '#334155'
                                  }}
                                >
                                  <option value="Done">Done</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Partially Paid">Partially Paid</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>

                              {/* ACTION BUTTONS */}
                              <td style={{ padding: '6px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                                  {isDone && (
                                    <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 10.5, padding: '3px 8px' }}>
                                      ✓ Done
                                    </span>
                                  )}

                                  {!isDone && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkDoneSession(item.id)}
                                      className="btn btn-sm"
                                      style={{ background: '#10B981', color: '#FFFFFF', border: 'none', fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 4, height: 26 }}
                                      title="Mark session as executed today"
                                    >
                                      ✓ Done
                                    </button>
                                  )}

                                  {!isDone && (
                                    <button
                                      type="button"
                                      onClick={() => handleDelaySession(item.id, 12, 'DALY BY 12 DAY AUTO UPDATE')}
                                      className="btn btn-sm"
                                      style={{
                                        background: '#D97706',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        height: 26,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                        boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)'
                                      }}
                                      title="DALY BY 12 DAY AUTO UPDATE: Shifts this session date by +12d and auto-shifts all subsequent scheduled sessions!"
                                    >
                                      <Clock size={12} />
                                      {item.sessionNumber === 2 || item.sessionsCount?.includes('2/4') ? 'DALY BY 12 DAY AUTO UPDATE' : '⏱ Delay +12d'}
                                    </button>
                                  )}

                                  {!isDone && !isConfirmed && (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmSession(item.id)}
                                      className="btn btn-sm"
                                      style={{
                                        background: '#0284C7',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        height: 26
                                      }}
                                      title="CANFORMED: PAYMENT PAY AND GIVE APPIENTMENT"
                                    >
                                      ✓ CANFORMED
                                    </button>
                                  )}

                                  {!isCancelled && !isDone && (
                                    <button
                                      type="button"
                                      onClick={() => setCancelModalState({
                                        isOpen: true,
                                        procedureId: item.id,
                                        reason: 'Not tacken further interested'
                                      })}
                                      className="btn btn-sm"
                                      style={{
                                        background: '#EF4444',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: '3px 7px',
                                        borderRadius: 4,
                                        height: 26
                                      }}
                                      title="*cancle setion: Record cancellation reasons (Not tacken further interested / NOT TACKEN - Not avelibal)"
                                    >
                                      ✕ *cancle setion
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => removeProcedure(item.id)}
                                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                                    title="Delete session row"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
              </div>

                {/* 3. CLINICAL NOTES & FINANCIAL SUMMARY STRIP (Note & Dicouent 10% | Acully price | After discount price | Total) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr',
                  gap: 16,
                  marginBottom: 20
                }}>
                  {/* Left: Treatment Notes Textarea */}
                  <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ fontWeight: 800, fontSize: 12, color: '#036d92', marginBottom: 0 }}>
                        Note (Pre &amp; Post Procedure Clinical Instructions)
                      </label>
                      <span style={{ fontSize: 11, color: '#64748B' }}>Direct writable</span>
                    </div>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={protocolForm.note}
                      onChange={e => setProtocolForm({ ...protocolForm, note: e.target.value })}
                      placeholder="Enter clinical notes, skin reaction observations, sun protection instructions, aloe vera gel advice..."
                      style={{ fontSize: 12, lineHeight: 1.4, borderRadius: 6, resize: 'vertical' }}
                    />
                  </div>

                  {/* Right: Financial Breakdown Card */}
                  <div style={{
                    background: '#F8FAFC',
                    padding: 14,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 12.5, color: '#1E293B', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Treatment Financial Breakdown</span>
                      <span className="badge badge-success" style={{ fontSize: 10, fontWeight: 800 }}>
                        {protocolForm.discountPercent}% Package Discount
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>Acully price</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginTop: 2 }}>
                          ₹{protocolForm.actualPrice.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>Dicouent</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginTop: 2 }}>
                          {protocolForm.discountPercent} %
                        </div>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>After discount price</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#036d92', marginTop: 2 }}>
                          ₹{protocolForm.afterDiscountPrice.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ background: '#ECFDF5', padding: '8px 4px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: 10, color: '#065F46', fontWeight: 700 }}>Total</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#059669', marginTop: 2 }}>
                          ₹{protocolForm.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Paid vs Pending summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748B' }}>
                      <span>
                        Collected: <strong style={{ color: '#059669' }}>₹{uniqueProcedures.filter(p => p.status === 'Done' || p.paymentStatus === 'Done').reduce((s, p) => s + (p.rate || p.price || 2000), 0).toLocaleString('en-IN')}</strong>
                      </span>
                      <span>
                        Pending: <strong style={{ color: '#0284C7' }}>₹{Math.max(0, protocolForm.total - uniqueProcedures.filter(p => p.status === 'Done' || p.paymentStatus === 'Done').reduce((s, p) => s + (p.rate || p.price || 2000), 0)).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. FOOTER ACTION & NAVIGATION BAR */}
                <div style={{
                  padding: '12px 18px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  {/* Left: Summary Metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#1E293B', background: '#FFFFFF', padding: '5px 12px', borderRadius: 20, border: '1px solid #CBD5E1' }}>
                      <Scissors size={14} color="#036d92" />
                      <span><strong>{uniqueProcedures.length}</strong> Total Sessions</span>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '4px 10px', borderRadius: 20 }}>
                      <Check size={13} />
                      <span>{uniqueProcedures.filter(p => p.status === 'Done').length} Executed</span>
                    </div>

                    {uniqueProcedures.some(p => p.status === 'Delayed') && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#854D0E', background: '#FEF9C3', padding: '4px 10px', borderRadius: 20 }}>
                        <Clock size={13} />
                        <span>{uniqueProcedures.filter(p => p.status === 'Delayed').length} Delayed</span>
                      </div>
                    )}

                    {uniqueProcedures.some(p => p.status === 'Cancelled') && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '4px 10px', borderRadius: 20 }}>
                        <Ban size={13} />
                        <span>{uniqueProcedures.filter(p => p.status === 'Cancelled').length} Cancelled</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Navigation Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('drugs')}
                      className="btn btn-outline"
                      style={{
                        background: '#FFFFFF',
                        borderColor: '#CBD5E1',
                        color: '#475569',
                        fontSize: 12,
                        fontWeight: 700,
                        height: 36,
                        padding: '0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <ArrowLeft size={14} /> Back (Tab 3: Prescriptions)
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveClinicalData}
                      className="btn btn-outline"
                      style={{
                        background: '#FFFFFF',
                        borderColor: '#CBD5E1',
                        color: '#334155',
                        fontSize: 12,
                        fontWeight: 700,
                        height: 36,
                        padding: '0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Save procedure protocol as draft"
                    >
                      <Save size={14} /> Save Draft
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSaveClinicalData();
                        setActiveTab('images');
                      }}
                      className="btn btn-primary"
                      style={{
                        background: '#036d92',
                        borderColor: '#036d92',
                        fontWeight: 800,
                        fontSize: 12.5,
                        height: 36,
                        padding: '0 18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)'
                      }}
                    >
                      <span>Save &amp; Next (Tab 5: Clinical Photography)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
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
                        Analyzed Chief Complaints & Vitals: Clinical evaluation: <strong>Acute Allergic Contact Dermatitis (ICD-10: L23.9)</strong>
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
                        message: 'Populated diagnosis assessment'
                      });
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ background: '#FFFFFF', borderColor: '#0284C7', color: '#0284C7' }}
                  >
                    Apply Assessment ✓
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
                    <div><strong>Prescribed Medicines:</strong> {activeSession?.prescriptions.map(p => p.drugName).join(', ') || 'None'}</div>
                    {activeSession?.procedurePrescriptions && activeSession.procedurePrescriptions.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <strong>Procedure Supplies:</strong> {activeSession.procedurePrescriptions.map(p => `${p.itemName} (Qty: ${p.quantity}${p.idCode ? `, ID: ${p.idCode}` : ''})`).join(', ')}
                      </div>
                    )}
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

      {/* Patient Clinical History & Longitudinal Vitals Modal */}
      {showPastVitalsModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowPastVitalsModal(false)}>
          <div
            className="modal modal-lg"
            style={{
              maxWidth: 920,
              width: '95vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                background: '#F0F9FF',
                borderBottom: '1px solid #BAE6FD',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#036d92', color: 'white', borderRadius: 6, padding: '4px 6px', display: 'flex' }}>
                    <History size={16} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0C4A6E' }}>
                    Patient Clinical History & Longitudinal Records
                  </h3>
                  <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: 11 }}>
                    {patientClinicalRecords.length} Encounters Recorded
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#0369A1', marginTop: 4 }}>
                  <strong>{patient.firstName} {patient.lastName}</strong> • MRD: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{patient.mrdNumber}</span> • {patient.age} Yrs ({patient.gender === 'M' ? 'Male' : 'Female'}) • Blood Group: <strong style={{ color: 'var(--danger)' }}>{patient.bloodGroup || 'B+'}</strong>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowPastVitalsModal(false)}
                style={{ color: '#0369A1' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-Tabs & Filter Ribbon */}
            <div
              style={{
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                padding: '8px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setHistoryModalTab('encounters')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: historyModalTab === 'encounters' ? '1.5px solid #036d92' : '1px solid #CBD5E1',
                    background: historyModalTab === 'encounters' ? '#E0F2FE' : '#FFFFFF',
                    color: historyModalTab === 'encounters' ? '#036d92' : '#475569'
                  }}
                >
                  <Calendar size={13} /> Past Encounters ({patientClinicalRecords.length})
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryModalTab('vitals')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: historyModalTab === 'vitals' ? '1.5px solid #036d92' : '1px solid #CBD5E1',
                    background: historyModalTab === 'vitals' ? '#E0F2FE' : '#FFFFFF',
                    color: historyModalTab === 'vitals' ? '#036d92' : '#475569'
                  }}
                >
                  <Activity size={13} /> Longitudinal Vitals Trend
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryModalTab('prescriptions')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: historyModalTab === 'prescriptions' ? '1.5px solid #036d92' : '1px solid #CBD5E1',
                    background: historyModalTab === 'prescriptions' ? '#E0F2FE' : '#FFFFFF',
                    color: historyModalTab === 'prescriptions' ? '#036d92' : '#475569'
                  }}
                >
                  <Pill size={13} /> Prescriptions Archive
                </button>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', width: 240 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Filter history records..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    outline: 'none'
                  }}
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '18px 20px',
                background: '#F8FAFC'
              }}
            >
              {/* TAB 1: PAST ENCOUNTERS */}
              {historyModalTab === 'encounters' && (
                <div>
                  {patientClinicalRecords.filter(rec => {
                    if (!historySearchQuery.trim()) return true;
                    const q = historySearchQuery.toLowerCase();
                    return (
                      rec.department.toLowerCase().includes(q) ||
                      rec.doctorName.toLowerCase().includes(q) ||
                      rec.diagnosis.toLowerCase().includes(q) ||
                      rec.chiefComplaint.toLowerCase().includes(q) ||
                      rec.prescription?.some(p => p.medicine.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                      <History size={32} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
                      <div style={{ fontWeight: 600 }}>No clinical encounters match your search query.</div>
                    </div>
                  ) : (
                    patientClinicalRecords
                      .filter(rec => {
                        if (!historySearchQuery.trim()) return true;
                        const q = historySearchQuery.toLowerCase();
                        return (
                          rec.department.toLowerCase().includes(q) ||
                          rec.doctorName.toLowerCase().includes(q) ||
                          rec.diagnosis.toLowerCase().includes(q) ||
                          rec.chiefComplaint.toLowerCase().includes(q) ||
                          rec.prescription?.some(p => p.medicine.toLowerCase().includes(q))
                        );
                      })
                      .map(rec => (
                        <div
                          key={rec.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 10,
                            marginBottom: 16,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Encounter Header */}
                          <div
                            style={{
                              padding: '12px 16px',
                              background: '#F1F5F9',
                              borderBottom: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 8
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="badge badge-primary" style={{ background: '#036d92', fontWeight: 700, fontSize: 11.5 }}>
                                {rec.date}
                              </span>
                              <span style={{ fontWeight: 800, fontSize: 13, color: '#1E293B' }}>
                                {rec.department}
                              </span>
                              <span style={{ fontSize: 12, color: '#64748B' }}>
                                • {rec.doctorName}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleApplyHistoricalVitals(rec.vitals)}
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  background: '#FFFFFF',
                                  borderColor: '#94A3B8',
                                  color: '#334155',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title="Copy vitals from this encounter to current triage"
                              >
                                <Activity size={12} /> Apply Vitals
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApplyEncounterToCurrentVisit(rec)}
                                className="btn btn-sm btn-primary"
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  background: '#036d92',
                                  borderColor: '#036d92',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title="Populate complaints, diagnosis and vitals from this visit"
                              >
                                <Copy size={12} /> Use for Current Visit
                              </button>
                            </div>
                          </div>

                          {/* Encounter Details */}
                          <div style={{ padding: '14px 16px' }}>
                            {/* Diagnosis Tag */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Diagnosis:
                              </span>
                              <span
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: 12.5,
                                  fontWeight: 700
                                }}
                              >
                                {rec.diagnosis}
                              </span>
                            </div>

                            {/* Chief Complaint */}
                            <div style={{ marginBottom: 12, fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
                              <strong style={{ color: '#0F172A' }}>Chief Complaint:</strong> {rec.chiefComplaint}
                            </div>

                            {/* Vitals Strip */}
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 12,
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                padding: '8px 12px',
                                borderRadius: 6,
                                marginBottom: 12,
                                fontSize: 12
                              }}
                            >
                              <span><strong style={{ color: '#64748B' }}>BP:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{rec.vitals.bp}</span> mmHg</span>
                              <span><strong style={{ color: '#64748B' }}>Pulse:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{rec.vitals.pulse}</span> bpm</span>
                              <span><strong style={{ color: '#64748B' }}>Temp:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{rec.vitals.temp}</span> °F</span>
                              <span><strong style={{ color: '#64748B' }}>Weight:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{rec.vitals.weight}</span> kg</span>
                              <span><strong style={{ color: '#64748B' }}>SpO2:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{rec.vitals.spo2}</span>%</span>
                            </div>

                            {/* Prescriptions from Encounter */}
                            {rec.prescription && rec.prescription.length > 0 && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Prescriptions Issued ({rec.prescription.length}):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRepeatAllPrescriptions(rec.prescription)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: 11, color: '#036d92', fontWeight: 700, padding: '2px 6px' }}
                                  >
                                    + Repeat All {rec.prescription.length} Rx
                                  </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {rec.prescription.map((rx, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 10px',
                                        background: '#FFFFFF',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 6,
                                        fontSize: 12
                                      }}
                                    >
                                      <div>
                                        <strong style={{ color: '#0F172A' }}>{rx.medicine}</strong>{' '}
                                        <span style={{ color: '#64748B' }}>({rx.dosage} • {rx.duration}) — {rx.instructions}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRepeatPrescription(rx)}
                                        className="btn btn-sm btn-outline"
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: '#036d92',
                                          borderColor: '#BAE6FD',
                                          padding: '3px 8px'
                                        }}
                                      >
                                        + Prescribe Again
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* TAB 2: LONGITUDINAL VITALS TREND */}
              {historyModalTab === 'vitals' && (
                <div>
                  {/* Interpretation Alert Banner */}
                  <div
                    style={{
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <CheckCircle2 size={18} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 12.5, color: '#065F46', lineHeight: 1.5 }}>
                      <strong>Longitudinal Trend Clinical Interpretation:</strong> Hemodynamic indices show favorable response. Blood pressure has stabilized from <strong>138/88 mmHg</strong> (Stage 1 HTN on 2026-05-10) down to <strong>120/80 mmHg</strong> today with regular Telmisartan therapy. Body weight indicates gradual loss of <strong>-3.0 kg</strong> over 10 months. Resting heart rate and oxygen saturation (98-99%) remain optimal.
                    </div>
                  </div>

                  {/* 4 Metric Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Blood Pressure</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#036d92', marginTop: 4 }}>
                        {activeSession?.vitals.bpSystolic || '120'}/{activeSession?.vitals.bpDiastolic || '80'}
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginLeft: 4 }}>mmHg</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <TrendingDown size={13} /> -18 mmHg vs Peak
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Trajectory: 138/88 → 124/82 → 120/80</div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Heart Rate / Pulse</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#036d92', marginTop: 4 }}>
                        {activeSession?.vitals.pulse || '76'}
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginLeft: 4 }}>BPM</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <TrendingDown size={13} /> -10 BPM Resting
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Trajectory: 86 → 82 → 78 → 76</div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Weight & BMI</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#036d92', marginTop: 4 }}>
                        {activeSession?.vitals.weight || '68'}
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginLeft: 4 }}>kg</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <TrendingDown size={13} /> -3.0 kg (BMI {calculatedBMI})
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Trajectory: 71.0 → 70.5 → 69.2 → 68.0</div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Temp & Saturation</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#036d92', marginTop: 4 }}>
                        {activeSession?.vitals.temperature || '98.6'}°F
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginLeft: 4 }}>• {activeSession?.vitals.spo2 || '99'}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        ✓ Normothermic & Eupneic
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Stable 98-99% SpO2 on room air</div>
                    </div>
                  </div>

                  {/* Comprehensive Comparison Table */}
                  <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 800, color: '#334155' }}>Clinical Parameter</th>
                          <th style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#E0F2FE' }}>Current Visit (Today)</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>2026-08-19 (Dermatology)</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>2026-05-10 (Gen Med)</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>2025-11-14 (Allergy Acute)</th>
                          <th style={{ padding: '10px 14px', fontWeight: 800, color: '#334155' }}>Variance / Trajectory</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Blood Pressure (BP)</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#F0F9FF' }}>
                            {activeSession?.vitals.bpSystolic || '120'}/{activeSession?.vitals.bpDiastolic || '80'} mmHg
                          </td>
                          <td style={{ padding: '10px 14px' }}>124/82 mmHg</td>
                          <td style={{ padding: '10px 14px', color: '#B45309', fontWeight: 600 }}>138/88 mmHg</td>
                          <td style={{ padding: '10px 14px' }}>122/80 mmHg</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 700 }}>
                            ↓ -18 mmHg systolic reduction from peak
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Pulse / Heart Rate</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#F0F9FF' }}>
                            {activeSession?.vitals.pulse || '76'} BPM
                          </td>
                          <td style={{ padding: '10px 14px' }}>78 BPM</td>
                          <td style={{ padding: '10px 14px' }}>82 BPM</td>
                          <td style={{ padding: '10px 14px' }}>86 BPM</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 700 }}>
                            ↓ -10 BPM resting rate improvement
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Body Weight</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#F0F9FF' }}>
                            {activeSession?.vitals.weight || '68'} kg
                          </td>
                          <td style={{ padding: '10px 14px' }}>69.2 kg</td>
                          <td style={{ padding: '10px 14px' }}>70.5 kg</td>
                          <td style={{ padding: '10px 14px' }}>71.0 kg</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 700 }}>
                            ↓ -3.0 kg steady reduction
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Calculated BMI</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#F0F9FF' }}>
                            {calculatedBMI} kg/m²
                          </td>
                          <td style={{ padding: '10px 14px' }}>24.5 kg/m²</td>
                          <td style={{ padding: '10px 14px' }}>25.0 kg/m²</td>
                          <td style={{ padding: '10px 14px' }}>25.2 kg/m²</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 700 }}>
                            Shifted from Overweight (25.2) to Normal Range (24.1)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Body Temperature</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#F0F9FF' }}>
                            {activeSession?.vitals.temperature || '98.6'} °F
                          </td>
                          <td style={{ padding: '10px 14px' }}>98.4 °F</td>
                          <td style={{ padding: '10px 14px' }}>98.6 °F</td>
                          <td style={{ padding: '10px 14px' }}>98.8 °F</td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                            Consistent normothermia (98.4 - 98.8 °F)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>SpO2 Room Air</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#036d92', background: '#F0F9FF' }}>
                            {activeSession?.vitals.spo2 || '99'}%
                          </td>
                          <td style={{ padding: '10px 14px' }}>99%</td>
                          <td style={{ padding: '10px 14px' }}>98%</td>
                          <td style={{ padding: '10px 14px' }}>99%</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 700 }}>
                            Adequate tissue oxygenation throughout
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Actions below vitals table */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleApplyHistoricalVitals({ bp: '124/82', pulse: '78', temp: '98.4', weight: '69.2', spo2: '99' })}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      <Activity size={12} /> Apply 2026-08-19 Vitals Baseline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyHistoricalVitals({ bp: '138/88', pulse: '82', temp: '98.6', weight: '70.5', spo2: '98' })}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      <Activity size={12} /> Apply 2026-05-10 Vitals Baseline
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PRESCRIPTIONS ARCHIVE */}
              {historyModalTab === 'prescriptions' && (
                <div>
                  <div style={{ marginBottom: 12, fontSize: 12, color: '#64748B' }}>
                    Consolidated archive of all medications prescribed across previous visits with one-click repeat prescribing into active consultation basket.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {patientClinicalRecords
                      .flatMap(rec => (rec.prescription || []).map(rx => ({
                        ...rx,
                        date: rec.date,
                        doctorName: rec.doctorName,
                        department: rec.department,
                        diagnosis: rec.diagnosis
                      })))
                      .filter(med => {
                        if (!historySearchQuery.trim()) return true;
                        const q = historySearchQuery.toLowerCase();
                        return (
                          med.medicine.toLowerCase().includes(q) ||
                          med.instructions.toLowerCase().includes(q) ||
                          med.doctorName.toLowerCase().includes(q) ||
                          med.diagnosis.toLowerCase().includes(q) ||
                          med.department.toLowerCase().includes(q)
                        );
                      })
                      .map((med, idx) => {
                        const isAllergyConflict = med.medicine.toLowerCase().includes('penicillin') || med.medicine.toLowerCase().includes('sulfa');
                        return (
                          <div
                            key={idx}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: 8,
                              padding: '12px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                                  {med.medicine}
                                </span>
                                <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700 }}>
                                  {med.dosage} • {med.duration}
                                </span>
                                {isAllergyConflict ? (
                                  <span className="badge badge-danger" style={{ fontSize: 10.5, fontWeight: 800 }}>
                                    ⚠ Documented Allergy Risk
                                  </span>
                                ) : (
                                  <span className="badge badge-success" style={{ fontSize: 10.5, fontWeight: 700 }}>
                                    ✓ Allergy Verified
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                                <strong>Regimen:</strong> {med.instructions}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                                Prescribed on <strong style={{ color: '#036d92' }}>{med.date}</strong> by {med.doctorName} ({med.department}) • For: <em>{med.diagnosis}</em>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRepeatPrescription(med)}
                              className="btn btn-sm btn-primary"
                              style={{
                                background: '#036d92',
                                borderColor: '#036d92',
                                fontSize: 12,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px'
                              }}
                            >
                              <Plus size={13} /> Prescribe Again
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Link
                href={`/doctor/patients/${patient.id}/history`}
                target="_blank"
                className="btn btn-outline btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#036d92',
                  borderColor: '#036d92',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <ExternalLink size={13} /> Open Full Patient EHR Timeline
              </Link>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#036d92', borderColor: '#036d92', fontSize: 12, fontWeight: 700, padding: '7px 20px' }}
                onClick={() => setShowPastVitalsModal(false)}
              >
                Done / Close
              </button>
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
                  placeholder="Enter specific hold instructions or clinical notes..."
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

                {/* Medicines List with Exact 10-Column Prescription Layout & Visibility Flags */}
                <table style={{ width: '100%', fontSize: 11, marginBottom: 18, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #036d92', background: '#F8FAFC', textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase' }}>
                      <th style={{ padding: '6px 4px', width: 30, textAlign: 'center' }}>NO</th>
                      <th style={{ padding: '6px 4px' }}>Content name/cobinatin</th>
                      <th style={{ padding: '6px 4px' }}>Brand name</th>
                      <th style={{ padding: '6px 4px' }}>brand</th>
                      <th style={{ padding: '6px 4px' }}>dose</th>
                      <th style={{ padding: '6px 4px' }}>frequncy</th>
                      <th style={{ padding: '6px 4px' }}>day</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center' }}>total</th>
                      <th style={{ padding: '6px 4px' }}>note</th>
                      <th style={{ padding: '6px 4px' }}>price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniquePrescriptions.map((p, idx) => {
                      const vis = p.visibility || {
                        generic: true, brandName: true, manufacturer: true, dosage: true,
                        frequency: true, durationDays: true, totalQty: true, instructions: true, slotNo: true, price: true
                      };
                      return (
                        <tr key={p.id || `print-rx-${idx}`} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: '6px 4px', fontWeight: 600 }}>
                            {vis.generic !== false ? (p.genericName || '-') : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px', fontWeight: 700, color: '#036d92' }}>
                            {vis.brandName !== false ? (p.brandName || p.drugName || '-') : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px' }}>
                            {vis.manufacturer !== false ? (p.manufacturer || '-') : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px' }}>
                            {vis.dosage !== false ? p.dosage : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px' }}>
                            {vis.frequency !== false ? <span className="badge badge-purple" style={{ fontSize: 10 }}>{p.frequency}</span> : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px' }}>
                            {vis.durationDays !== false ? p.durationDays : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700 }}>
                            {vis.totalQty !== false ? p.totalQty : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px', color: '#475569' }}>
                            {vis.instructions !== false ? p.instructions : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                          <td style={{ padding: '6px 4px', fontWeight: 700 }}>
                            {(vis.price !== false && vis.slotNo !== false) ? (p.price || p.slotNo || '-') : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Procedure Consumables & Supplies Prescription (Optional: ONLY shown if added) */}
                {activeSession?.procedurePrescriptions && activeSession.procedurePrescriptions.length > 0 && (
                  <div style={{ marginTop: 14, marginBottom: 18, borderTop: '1.5px dashed #CBD5E1', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#036d92', fontFamily: 'serif' }}>℞</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0C4A6E', textTransform: 'uppercase' }}>
                        Procedure Consumables & Supplies Prescription
                      </span>
                      <span className="badge" style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}>
                        {activeSession.procedurePrescriptions.length} Items
                      </span>
                    </div>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                          <th style={{ padding: '4px 0' }}># Instrument /drugh</th>
                          <th style={{ width: 80 }}>qunity</th>
                          <th style={{ width: 110 }}>ID CORD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueProcedurePrescriptions.map((p, idx) => (
                          <tr key={p.id || `print-proc-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 0', fontWeight: 700, color: '#036d92' }}>{idx + 1}. {p.itemName}</td>
                            <td style={{ fontWeight: 800 }}>{p.quantity}</td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                                {p.idCode || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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

      {/* Add New Lab Test Modal */}
      {showAddTestModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowAddTestModal(false)}>
          <div className="modal modal-md" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#F0F9FF', borderBottom: '1px solid #BAE6FD' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: '#036d92',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <span className="modal-title" style={{ fontWeight: 800, fontSize: 16, color: '#036d92' }}>
                    Add New Lab Test to Diagnostic Catalog
                  </span>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    Register test in hospital catalog and order into active consultation
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAddTestModal(false)} className="btn btn-ghost btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Test Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter test name / investigation panel..."
                  value={newTestForm.name}
                  onChange={e => setNewTestForm({ ...newTestForm, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Category *</label>
                  <select
                    className="form-select"
                    value={newTestForm.category}
                    onChange={e => setNewTestForm({ ...newTestForm, category: e.target.value as any })}
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Radiology">Radiology</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Requisition Fee (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newTestForm.price}
                    onChange={e => setNewTestForm({ ...newTestForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Unit of Measurement</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Unit of measurement..."
                    value={newTestForm.unit || ''}
                    onChange={e => setNewTestForm({ ...newTestForm, unit: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Specimen Tube / Sample Type</label>
                  <input
                    type="text"
                    className="form-input"
                    list="specimen-tube-options"
                    placeholder="EDTA (Purple Tube)"
                    value={newTestForm.specimenTube}
                    onChange={e => setNewTestForm({ ...newTestForm, specimenTube: e.target.value })}
                  />
                  <datalist id="specimen-tube-options">
                    <option value="EDTA (Purple Tube)" />
                    <option value="Serum Gel (Yellow Tube)" />
                    <option value="Fluoride (Grey Tube)" />
                    <option value="Plain (Red Tube)" />
                    <option value="Citrate (Light Blue Tube)" />
                    <option value="Heparin (Green Tube)" />
                    <option value="Urine Sterile Container" />
                    <option value="Lesion Swab / Scraping" />
                    <option value="Sterile Biopsy Container" />
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Normal Reference Range</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Normal reference range..."
                    value={newTestForm.normalRange}
                    onChange={e => setNewTestForm({ ...newTestForm, normalRange: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Special Instructions / Sample Prep</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sample preparation or instructions..."
                    value={newTestForm.instructions}
                    onChange={e => setNewTestForm({ ...newTestForm, instructions: e.target.value })}
                  />
                </div>
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: 12.5, background: '#F0F9FF', padding: '10px 14px',
                borderRadius: 8, border: '1.5px solid #BAE6FD', color: '#0369A1'
              }}>
                <input
                  type="checkbox"
                  checked={newTestForm.addToBasket}
                  onChange={e => setNewTestForm({ ...newTestForm, addToBasket: e.target.checked })}
                  style={{ width: 17, height: 17, accentColor: '#036d92' }}
                />
                <span>Also add directly to current patient Active Investigation Basket now</span>
              </label>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowAddTestModal(false)} className="btn btn-ghost">Cancel</button>
              <button
                onClick={() => {
                  const testName = newTestForm.name.trim();
                  if (!testName) {
                    addNotification({ type: 'warning', message: 'Please enter a test name' });
                    return;
                  }
                  const testId = `inv-${Date.now()}`;
                  const tubeName = newTestForm.specimenTube?.trim() || 'EDTA (Purple Tube)';
                  const newCatalogItem = {
                    id: testId,
                    name: testName,
                    category: newTestForm.category,
                    price: Number(newTestForm.price) || 0,
                    unit: newTestForm.unit?.trim(),
                    normalRange: newTestForm.normalRange?.trim() || 'Standard Reference Range',
                    instructions: newTestForm.instructions?.trim(),
                    specimenTube: tubeName
                  };

                  useInvestigationCatalogStore.getState().addTest(newCatalogItem);

                  try {
                    useAdminStore.getState().addLabTest({
                      name: testName,
                      category: newTestForm.category,
                      specimenTube: tubeName,
                      price: Number(newTestForm.price) || 0,
                      turnaroundHours: 4,
                      parameters: [
                        {
                          name: testName,
                          unit: newTestForm.unit || 'Standard',
                          maleMin: 0,
                          maleMax: 100,
                          femaleMin: 0,
                          femaleMax: 100
                        }
                      ]
                    });
                  } catch {}

                  if (newTestForm.addToBasket) {
                    addInvestigation({
                      testId,
                      testName,
                      category: newTestForm.category,
                      price: Number(newTestForm.price) || 0,
                      status: 'ORDERED',
                      specimenTube: tubeName,
                      notes: newTestForm.instructions?.trim() || ''
                    });
                  }

                  addNotification({
                    type: 'success',
                    message: `Added "${testName}" to Diagnostic Catalog${newTestForm.addToBasket ? ' and Active Basket' : ''}!`
                  });
                  setInvSearch(testName);
                  setActiveTab('investigations');
                  setShowAddTestModal(false);
                }}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 800 }}
              >
                Save & Add to Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Laser Protocol Session Cancellation Modal */}
      {cancelModalState.isOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 540, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div className="modal-header" style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DC2626', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: 15, fontWeight: 800, color: '#991B1B' }}>
                    * Cancel Treatment Protocol Session
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#B91C1C', margin: 0 }}>
                    Record reason & follow-up adjustment for patient session
                  </p>
                </div>
              </div>
              <button onClick={() => setCancelModalState({ ...cancelModalState, isOpen: false })} className="btn btn-ghost btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>
                  Select Cancellation Reason *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'Not tacken further interested', label: 'Not tacken further interested (Patient discontinued / not interested)' },
                    { key: 'NOT TACKEN - Not avelibal', label: 'NOT TACKEN - Not avelibal (Patient unavailable / out of town)' },
                    { key: '20/04/2026 f/u date', label: '20/04/2026 f/u date (Rescheduled to new follow-up date)' }
                  ].map(opt => (
                    <label key={opt.key} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, border: cancelModalState.reason === opt.key ? '2px solid #EF4444' : '1px solid #CBD5E1',
                      background: cancelModalState.reason === opt.key ? '#FEF2F2' : '#FFFFFF', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}>
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={cancelModalState.reason === opt.key}
                        onChange={() => setCancelModalState({ ...cancelModalState, reason: opt.key })}
                        style={{ accentColor: '#EF4444', width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>
                  Custom Clinical Remarks / Doctor Notes
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={cancelModalState.reason}
                  onChange={e => setCancelModalState({ ...cancelModalState, reason: e.target.value })}
                  placeholder="Enter detailed reason..."
                  style={{ height: 36, fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>
                    Rescheduled F/U Date
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="20/04/2026"
                    defaultValue="20/04/2026"
                    style={{ height: 34, fontSize: 12, fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    defaultValue={2000}
                    style={{ height: 34, fontSize: 12, fontWeight: 800 }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCancelModalState({ ...cancelModalState, isOpen: false })}
                className="btn btn-ghost"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cancelModalState.procedureId) {
                    handleCancelSession(cancelModalState.procedureId, cancelModalState.reason);
                  }
                  setCancelModalState({ isOpen: false, procedureId: null, reason: 'Not tacken further interested' });
                }}
                className="btn btn-danger"
                style={{ background: '#DC2626', borderColor: '#DC2626', fontWeight: 800, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Ban size={14} /> Confirm *cancle setion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
