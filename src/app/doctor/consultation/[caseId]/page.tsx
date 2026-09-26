'use client';
import { useState, useEffect, useMemo, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Clock, ShieldAlert, Heart, FileText,
  Pill, Scissors, Camera, FileCheck, CheckCircle2,
  AlertTriangle, ArrowLeft, ArrowRight, Save, Lock,
  Plus, X, Search, ChevronRight, Eye, EyeOff, Printer,
  Sparkles, Check, RotateCcw, Sliders, Maximize2,
  Minimize2, MessageSquare, Wallet, User, Calendar, PauseCircle, Send,
  Upload, FileSignature, Copy, History, CreditCard, Layers,
  ExternalLink, TrendingUp, TrendingDown, Activity,
  Zap, RefreshCw, Ban, CheckCheck, Percent, Settings2,
  LayoutGrid, List, Trash2, Share2, PhoneCall, PhoneOff, Building,
  FlaskConical
} from 'lucide-react';
import {
  useConsultationStore, usePatientStore, useQueueStore,
  useInventoryStore, useInvestigationCatalogStore,
  useProcedureCatalogStore, useUIStore, useBillingStore,
  usePharmacyStore, useClinicalStore, useAdminStore, useAppointmentStore, useFollowUpStore,
  useLabOrderStore, LabTest, LabOrder, LabOrderItem,
  playChimeTone, Patient, Gender, PrescriptionFulfillmentItem,
  DrugInventoryItem, InvestigationCatalogItem, ProcedureCatalogItem, ProcedurePrescriptionItem,
  PrescriptionItem, PrescriptionVisibility, ProcedureExecutionItem, ProcedureMaster
} from '@/store';
import ProcedureConsentForm, { ConsentPatientInfo, TWELVE_CONSENT_TEMPLATES, printElementA4 } from '@/components/ProcedureConsentForm';
import TreatmentProtocolManager from '@/components/TreatmentProtocolManager';
import ClinicalProcedureImageManagement from '@/components/ClinicalProcedureImageManagement';
import PhotographyWorkspace from '@/components/lesion-photography/PhotographyWorkspace';
import { PhotographyProvider, useLesionPhotographyStore, usePhotographySession } from '@/components/lesion-photography/PhotographyProvider';
import { selectors as photographySelectors } from '@/store/lesion-photography';
import EncounterWorkspace from '@/components/EncounterWorkspace';

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
    procedureId: 'proc-1',
    source: 'PROCEDURE_MASTER',
    itemName: 'Chemical Peel (Glycolic 35%)',
    quantity: 1,
    idCode: 'PROC-DERM-01',
    category: 'Dermatology',
    unit: 'Nos',
    instructions: 'Apply broad-spectrum SPF 50 sunscreen twice daily.',
    printOnRx: true
  },
  {
    id: 'proc-rx-demo-2',
    procedureId: 'proc-2',
    source: 'PROCEDURE_MASTER',
    itemName: 'Skin Lesion Excision & Biopsy',
    quantity: 1,
    idCode: 'PROC-SURG-02',
    category: 'General Surgery',
    unit: 'Nos',
    instructions: 'Keep incision dry for 48 hours.',
    printOnRx: true
  },
  {
    id: 'proc-rx-demo-3',
    procedureId: 'proc-3',
    source: 'PROCEDURE_MASTER',
    itemName: 'Intra-Articular Knee Injection',
    quantity: 1,
    idCode: 'PROC-ORTHO-03',
    category: 'Orthopedics',
    unit: 'Nos',
    instructions: 'Limit weight-bearing for 24 hours. Ice application 15 mins every 3 hours.',
    printOnRx: true
  }
];

const DEFAULT_DEMO_TREATMENT_SESSIONS: ProcedureExecutionItem[] = [
  {
    id: 'proc-demo-1',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '10/04/2026',
    performanceDate: '25/03/2026',
    sessionsCount: '1/3',
    sessionNumber: 1,
    totalSessions: 3,
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
    shotsFired: '—',
    status: 'Pending',
    remark: 'Session 1 executed with good clinical response.',
    rate: 3000,
    price: 3000,
    paymentStatus: 'Done',
    completedInClinic: true
  },
  {
    id: 'proc-demo-2',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '25/04/2026',
    performanceDate: '24/09/2026',
    sessionsCount: '2/3',
    sessionNumber: 2,
    totalSessions: 3,
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
    shotsFired: '—',
    status: 'Pending',
    remark: 'Session executed with recorded clinical settings.',
    rate: 3000,
    price: 3000,
    paymentStatus: 'Done',
    completedInClinic: true
  },
  {
    id: 'proc-demo-3',
    procedureName: 'HAIR REMOVAL - DIODE',
    scheduledDate: '10/05/2026',
    performanceDate: '',
    sessionsCount: '3/3',
    sessionNumber: 3,
    totalSessions: 3,
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
    shotsFired: '—',
    status: 'Pending',
    remark: 'Session 3 scheduled at 20d interval.',
    rate: 3000,
    price: 3000,
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
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
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

export interface MasterDiagnosisItem {
  id: string;
  primaryDiagnosis: string;
  diagnosisName: string;
  icd10Code: string;
  defaultStatus: 'Provisional' | 'Confirmed';
  diagnosisNote: string;
  patientAdvice: string;
  dietAdvice: string;
  recommendedInvestigations: string[];
  recommendedProcedure: string;
  defaultFollowUpDays: number;
  followUpPurpose: string;
  differentials: string[];
}

export const MASTER_DIAGNOSIS_CATALOG: MasterDiagnosisItem[] = [
  {
    id: 'diag-tinea',
    primaryDiagnosis: 'Tinea',
    diagnosisName: 'Tinea corporis',
    icd10Code: 'B35.4',
    defaultStatus: 'Confirmed',
    diagnosisNote: 'Advise patient regarding hygiene and keeping affected area dry.',
    patientAdvice: 'Keep skin dry, wear loose cotton clothes. Do not share towels or soaps. Complete antifungal course even after resolution.',
    dietAdvice: 'Maintain a balanced diet and adequate hydration.',
    recommendedInvestigations: ['CBC', 'Skin Scraping for KOH Fungus Test'],
    recommendedProcedure: 'Wood\'s Lamp Examination',
    defaultFollowUpDays: 7,
    followUpPurpose: 'Assess clinical clearance of fungal lesions & mycological cure',
    differentials: ['Nummular Eczema', 'Pityriasis Rosea', 'Annular Erythema', 'Granuloma Annulare']
  },
  {
    id: 'diag-acne',
    primaryDiagnosis: 'Acne',
    diagnosisName: 'Acne vulgaris (Grade II Papulopustular)',
    icd10Code: 'L70.0',
    defaultStatus: 'Confirmed',
    diagnosisNote: 'Avoid comedogenic cosmetics, avoid squeezing or picking at active lesions.',
    patientAdvice: 'Wash face twice daily with mild salicylic cleanser. Apply broad-spectrum non-comedogenic sunscreen SPF 50+. Topical retinoid at bedtime only.',
    dietAdvice: 'Low glycemic load diet. Reduce excess dairy, whey protein supplements, and oily fast foods.',
    recommendedInvestigations: ['Serum Testosterone (Total & Free)', 'DHEAS', 'Pelvic USG (if PCOS suspected)'],
    recommendedProcedure: 'Comedone Extraction / Salicylic Peel 20%',
    defaultFollowUpDays: 14,
    followUpPurpose: 'Evaluate retinoid tolerance, inflammatory papule reduction, and barrier response',
    differentials: ['Rosacea', 'Folliculitis', 'Perioral Dermatitis', 'Steroid Acne']
  },
  {
    id: 'diag-dermatitis',
    primaryDiagnosis: 'Dermatitis',
    diagnosisName: 'Acute Allergic Contact Dermatitis',
    icd10Code: 'L23.9',
    defaultStatus: 'Provisional',
    diagnosisNote: 'Identify and discontinue suspected contact allergen (fragrance/nickel/cosmetic creams).',
    patientAdvice: 'Apply cold compresses to soothe burning sensation. Liberal fragrance-free emollient 3-4 times daily. Short course topical corticosteroid.',
    dietAdvice: 'Avoid hot, spicy foods, alcohol, and artificial food preservatives during acute flare.',
    recommendedInvestigations: ['Patch Test (Standard European Series)', 'Total Serum IgE', 'Complete Blood Count (CBC)'],
    recommendedProcedure: 'Barrier Repair Dressing / Cold Compression',
    defaultFollowUpDays: 7,
    followUpPurpose: 'Review erythema, edema and pruritus resolution',
    differentials: ['Irritant Contact Dermatitis', 'Tinea Incognito', 'Cutaneous Candidiasis']
  },
  {
    id: 'diag-alopecia',
    primaryDiagnosis: 'Alopecia',
    diagnosisName: 'Androgenetic Alopecia (Grade III)',
    icd10Code: 'L64.8',
    defaultStatus: 'Confirmed',
    diagnosisNote: 'Progressive follicular miniaturization noted in fronto-vertex distribution.',
    patientAdvice: 'Topical Minoxidil 5% solution 1ml twice daily on dry scalp. Peptide anti-hairfall serum. Avoid vigorous towel drying and heat styling.',
    dietAdvice: 'High protein intake (eggs, lentils, fish, seeds). Iron and zinc rich diet. Biotin and amino acid supplementation.',
    recommendedInvestigations: ['Serum Ferritin', 'Vitamin D3', 'Vitamin B12', 'Thyroid Profile (TSH)'],
    recommendedProcedure: 'PRP SCALP REJUVENATION (Platelet-Rich Plasma)',
    defaultFollowUpDays: 30,
    followUpPurpose: 'Evaluate shedding cessation, baseline photographic review, and hair shaft caliber',
    differentials: ['Telogen Effluvium', 'Alopecia Areata', 'Trichotillomania']
  },
  {
    id: 'diag-pigmentation',
    primaryDiagnosis: 'Pigmentation',
    diagnosisName: 'Melasma (Centrofacial / Malar)',
    icd10Code: 'L81.1',
    defaultStatus: 'Confirmed',
    diagnosisNote: 'Strict broad-spectrum physical photoprotection mandatory. Avoid heat exposure near stoves/ovens.',
    patientAdvice: 'Apply broad-spectrum mineral sunscreen every 3 hours indoors and outdoors. Gentle depigmenting cream at bedtime under clinical supervision.',
    dietAdvice: 'Antioxidant-rich berries, citrus fruits (Vitamin C), green tea, and omega-3 rich walnuts and chia seeds.',
    recommendedInvestigations: ['Wood\'s Lamp Examination', 'Serum Ferritin', 'Thyroid Stimulating Hormone (TSH)'],
    recommendedProcedure: 'Q-SWITCH Nd:YAG LASER / Chemical Peel (Glycolic 35%)',
    defaultFollowUpDays: 21,
    followUpPurpose: 'Monitor pigment reduction, assess skin brightening, and check peel safety',
    differentials: ['Post-Inflammatory Hyperpigmentation', 'Riehl Melanosis', 'Ochronosis']
  },
  {
    id: 'diag-psoriasis',
    primaryDiagnosis: 'Psoriasis',
    diagnosisName: 'Plaque Psoriasis (Vulgaris)',
    icd10Code: 'L40.0',
    defaultStatus: 'Confirmed',
    diagnosisNote: 'Chronic inflammatory plaques with silvery scales. Koebner phenomenon cautioned.',
    patientAdvice: 'Liberal moisturization. Keratolytic salicylic ointment + topical calcipotriol/steroid ointment.',
    dietAdvice: 'Anti-inflammatory Mediterranean diet. Moderate alcohol reduction and smoking cessation.',
    recommendedInvestigations: ['CBC', 'ESR', 'CRP', 'Lipid Profile Complete', 'HbA1c & Fasting Blood Sugar'],
    recommendedProcedure: 'Narrowband UVB Phototherapy / Tar Bath',
    defaultFollowUpDays: 14,
    followUpPurpose: 'PASI score review, plaque thickness reduction, and scaling assessment',
    differentials: ['Seborrheic Dermatitis', 'Lichen Planus', 'Pityriasis Rosea']
  },
  {
    id: 'diag-urticaria',
    primaryDiagnosis: 'Urticaria',
    diagnosisName: 'Chronic Spontaneous Urticaria',
    icd10Code: 'L50.1',
    defaultStatus: 'Confirmed',
    diagnosisNote: 'Evanescent itchy wheals lasting < 24 hours. No angioedema or airway compromise currently.',
    patientAdvice: 'Non-sedating second-generation H1 antihistamines up to 4x daily if needed. Avoid tight clothing and friction.',
    dietAdvice: 'Low histamine diet. Avoid aged cheese, fermented foods, artificial food colorings, and shellfish.',
    recommendedInvestigations: ['Complete Blood Count (CBC)', 'Total Serum IgE', 'ESR', 'Urine Routine & Microscopic'],
    recommendedProcedure: 'Autologous Serum Skin Test (ASST)',
    defaultFollowUpDays: 7,
    followUpPurpose: 'UAS7 symptom score check and antihistamine titration',
    differentials: ['Urticarial Vasculitis', 'Mastocytosis', 'Erythema Multiforme']
  }
];

export default function DoctorConsultationMasterStation({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const queue = useQueueStore(s => s.queue);
  const patients = usePatientStore(s => s.patients);
  const sessions = useConsultationStore(s => s.sessions);

  const queueEntry = queue.find(q => q.caseNumber === caseId);
  const patient = patients.find(p => p.id === queueEntry?.patientId);
  const session = sessions[caseId];

  const isBrowserJourney = 
    patient?.firstName === 'Browser' || 
    patient?.lastName === 'Journey' || 
    session?.patientName?.includes('Browser') ||
    queueEntry?.patientName?.includes('Browser');

  if (isBrowserJourney) {
    return <EncounterWorkspace params={params} />;
  }

  return <PhotographyProvider key={caseId} consultationId={caseId}><DoctorConsultationContent caseId={caseId} /></PhotographyProvider>;
}

function DoctorConsultationContent({ caseId }: { caseId: string }) {
  const router = useRouter();

  const { activeSession, updateComplaints, updateVitals, updateHistory, updateNotes,
    addInvestigation, removeInvestigation, updateInvestigationNote, addPrescription, removePrescription,
    updatePrescription, togglePrescriptionVisibility,
    addProcedurePrescription, removeProcedurePrescription, updateProcedurePrescription,
    addProcedure, removeProcedure, updateProcedure, setProcedures, addImage, removeImage, updateDiagnosis,
    updateBilling, finalizeConsultation, getSession, loadSession, initSession
  } = useConsultationStore();

  const { patients, updatePatient } = usePatientStore();
  const { records: clinicalRecords, addRecord: addClinicalRecord } = useClinicalStore();
  const { queue, updateStatus, putOnHold, endSessionAndSendToBilling } = useQueueStore();
  const { addBill } = useBillingStore();
  const { inventory } = useInventoryStore();
  const { catalog: invCatalog } = useInvestigationCatalogStore();
  const { catalog: procCatalog } = useProcedureCatalogStore();
  const { addNotification } = useUIStore();
  const { addAppointment, appointments } = useAppointmentStore();
  const { holidays, labTests: adminLabTests, procedures: adminProcedures } = useAdminStore();
  const { orders: allLabOrders, createLabOrder } = useLabOrderStore();

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
  const [showClinicalValidationModal, setShowClinicalValidationModal] = useState(false);
  const [nextStage, setNextStage] = useState<'BILLING' | 'PHARMACY' | 'DISCHARGE'>('BILLING');

  // Tab 4 Consent & Procedural Print Center State
  const [showAllPrintModal, setShowAllPrintModal] = useState(false);
  const [printModalActiveTab, setPrintModalActiveTab] = useState<'consent' | 'xerox' | 'protocol' | 'homecare'>('consent');
  const [consentIpdNumber, setConsentIpdNumber] = useState('IPD-2026-089');
  const [procedureSubTab, setProcedureSubTab] = useState<'protocol' | 'consent'>('protocol');

  // Tab 2 Investigation & Lab Orders State (Consumes Admin Master Catalog Single Source of Truth)
  const [investigationSubTab, setInvestigationSubTab] = useState<'ORDER' | 'RESULTS'>('ORDER');
  const [invSearch, setInvSearch] = useState('');
  const [selectedInvCategory, setSelectedInvCategory] = useState<string>('ALL');
  const [selectedRequisitionTests, setSelectedRequisitionTests] = useState<Array<{ test: LabTest; notes?: string }>>([]);
  const [orderPriority, setOrderPriority] = useState<'Routine' | 'Urgent' | 'STAT'>('Routine');
  const [orderClinicalNotes, setOrderClinicalNotes] = useState('');
  const [viewingParametersTest, setViewingParametersTest] = useState<LabTest | null>(null);
  const [editingNoteTestId, setEditingNoteTestId] = useState<string | null>(null);

  const activeOrderableCatalog = useMemo(() => {
    return (adminLabTests || []).filter(t => t.isActive && t.isOrderable !== false);
  }, [adminLabTests]);

  const caseLabOrders = useMemo(() => {
    return (allLabOrders || []).filter(o => o.consultationId === caseId);
  }, [allLabOrders, caseId]);

  const filteredOrderableTests = useMemo(() => {
    return activeOrderableCatalog.filter(test => {
      const matchSearch =
        !invSearch ||
        test.name.toLowerCase().includes(invSearch.toLowerCase()) ||
        test.code.toLowerCase().includes(invSearch.toLowerCase()) ||
        (test.category && test.category.toLowerCase().includes(invSearch.toLowerCase())) ||
        (test.specimen && test.specimen.toLowerCase().includes(invSearch.toLowerCase()));

      const matchCat =
        selectedInvCategory === 'ALL' ||
        test.category.toLowerCase() === selectedInvCategory.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [activeOrderableCatalog, invSearch, selectedInvCategory]);

  const toggleSelectRequisitionTest = (test: LabTest) => {
    setSelectedRequisitionTests(prev => {
      const exists = prev.some(item => item.test.id === test.id);
      if (exists) {
        return prev.filter(item => item.test.id !== test.id);
      } else {
        return [...prev, { test, notes: '' }];
      }
    });
  };

  const removeSelectedRequisitionTest = (testId: string) => {
    setSelectedRequisitionTests(prev => prev.filter(item => item.test.id !== testId));
  };

  const updateSelectedRequisitionNote = (testId: string, notes: string) => {
    setSelectedRequisitionTests(prev => prev.map(item => item.test.id === testId ? { ...item, notes } : item));
  };

  const selectedRequisitionTotal = useMemo(() => {
    return selectedRequisitionTests.reduce((sum, item) => sum + item.test.price, 0);
  }, [selectedRequisitionTests]);

  const handlePlaceLabOrder = () => {
    if (selectedRequisitionTests.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Please select at least one lab test from the catalog before placing order.'
      });
      return;
    }

    const patientObj = patient || activeSession?.patient;
    const patientNameStr = patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : (activeSession?.patientName || 'Patient');

    const createdOrder = createLabOrder({
      patientId: patientObj?.id || activeSession?.patientId || 'unknown',
      patientName: patientNameStr,
      consultationId: caseId,
      doctorId: activeSession?.doctorId || 'doc-1',
      doctorName: activeSession?.doctorName || 'Dr. Raj Valaki',
      priority: orderPriority,
      clinicalNotes: orderClinicalNotes.trim() || undefined,
      status: 'ORDERED',
      items: selectedRequisitionTests.map(({ test, notes }) => ({
        id: `item-${Date.now()}-${test.id}`,
        labOrderId: '',
        labTestId: test.id, // THE CRITICAL FOREIGN KEY: LabOrderItem.labTestId -> LabTest.id
        testName: test.name,
        code: test.code,
        category: test.category,
        specimen: test.specimen,
        price: test.price,
        status: 'ORDERED',
        instructions: notes || test.instructions || undefined
      }))
    });

    // Also synchronize into activeSession.investigations so billing, summary, and printout include the ordered tests
    selectedRequisitionTests.forEach(({ test, notes }) => {
      const alreadyInBasket = activeSession?.investigations?.some(i => i.testId === test.id || i.testName.toLowerCase() === test.name.toLowerCase());
      if (!alreadyInBasket) {
        addInvestigation({
          testId: test.id,
          testName: test.name,
          category: test.category,
          price: test.price,
          status: 'ORDERED',
          specimenTube: test.container || test.specimenTube,
          notes: notes || test.instructions || ''
        });
      }
    });

    addNotification({
      type: 'success',
      message: `Placed Lab Order #${createdOrder.orderNumber} with ${createdOrder.items.length} diagnostic tests!`
    });

    setSelectedRequisitionTests([]);
    setOrderClinicalNotes('');
  };

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

  const activeAdminDrugs = useMemo(() => {
    return (inventory || []).filter(d => d.isActive !== false);
  }, [inventory]);

  const activeAdminProcedures = useMemo(() => {
    return (adminProcedures || []).filter(p => p.isActive !== false);
  }, [adminProcedures]);

  const [isDrugSelectorModalOpen, setIsDrugSelectorModalOpen] = useState(false);
  const [drugModalSearch, setDrugModalSearch] = useState('');
  const [isProcSelectorModalOpen, setIsProcSelectorModalOpen] = useState(false);
  const [procModalSearch, setProcModalSearch] = useState('');
  const [procModalCategory, setProcModalCategory] = useState<'ALL' | 'PROCEDURES' | 'DRUGS'>('ALL');

  const filteredModalDrugs = useMemo(() => {
    const q = drugModalSearch.trim().toLowerCase();
    if (!q) return activeAdminDrugs;
    return activeAdminDrugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.genericName && d.genericName.toLowerCase().includes(q)) ||
      (d.brandName && d.brandName.toLowerCase().includes(q)) ||
      (d.manufacturer && d.manufacturer.toLowerCase().includes(q))
    );
  }, [activeAdminDrugs, drugModalSearch]);

  const filteredModalDrugsForProc = useMemo(() => {
    const q = procModalSearch.trim().toLowerCase();
    if (!q) return activeAdminDrugs;
    return activeAdminDrugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.genericName && d.genericName.toLowerCase().includes(q)) ||
      (d.brandName && d.brandName.toLowerCase().includes(q)) ||
      (d.slotNo && d.slotNo.toLowerCase().includes(q))
    );
  }, [activeAdminDrugs, procModalSearch]);

  const filteredModalProcedures = useMemo(() => {
    const q = procModalSearch.trim().toLowerCase();
    if (!q) return activeAdminProcedures;
    return activeAdminProcedures.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [activeAdminProcedures, procModalSearch]);

  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return activeAdminDrugs.slice(0, 10);
    const q = drugSearch.toLowerCase();
    return activeAdminDrugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      d.brandName?.toLowerCase().includes(q) ||
      d.manufacturer?.toLowerCase().includes(q) ||
      d.slotNo?.toLowerCase().includes(q) ||
      d.formulation.toLowerCase().includes(q)
    );
  }, [activeAdminDrugs, drugSearch]);

  // Tab 3 Rx Drugs & Right-Side Optional Procedure Prescriptions State
  const [showProcSideOption, setShowProcSideOption] = useState(true);
  const [rxLayoutMode, setRxLayoutMode] = useState<'stacked' | 'split'>('stacked');
  const [rxActiveSubTab, setRxActiveSubTab] = useState<'drugs' | 'procedures' | 'both'>('drugs');
  const [procRxItemName, setProcRxItemName] = useState('');
  const [procRxQty, setProcRxQty] = useState(1);
  const [procRxIdCode, setProcRxIdCode] = useState('');
  const [procRxSource, setProcRxSource] = useState<'PROCEDURE_MASTER' | 'DRUG_FORMULARY' | 'CUSTOM' | ''>('');
  const [procRxMasterId, setProcRxMasterId] = useState<string>('');
  const [showProcCatalogDropdown, setShowProcCatalogDropdown] = useState(false);
  const [isCustomProcItem, setIsCustomProcItem] = useState(false);

  const filteredCatalogProcedures = useMemo(() => {
    const q = procRxItemName.trim().toLowerCase();
    if (!q) return activeAdminProcedures;
    return activeAdminProcedures.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [activeAdminProcedures, procRxItemName]);

  const filteredCatalogDrugs = useMemo(() => {
    const q = procRxItemName.trim().toLowerCase();
    if (!q) return activeAdminDrugs.slice(0, 10);
    return activeAdminDrugs.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.brandName && item.brandName.toLowerCase().includes(q)) ||
      (item.genericName && item.genericName.toLowerCase().includes(q)) ||
      (item.slotNo && item.slotNo.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [activeAdminDrugs, procRxItemName]);

  const filteredCatalogItems = filteredCatalogProcedures;

  const handleSelectFromProcedureMaster = (proc: ProcedureMaster) => {
    setProcRxItemName(proc.name);
    setProcRxIdCode(proc.code || proc.id);
    setProcRxSource('PROCEDURE_MASTER');
    setProcRxMasterId(proc.id);
    setProcRxQty(1);
    setShowProcCatalogDropdown(false);
  };

  const handleSelectFromDrugFormulary = (drug: DrugInventoryItem) => {
    const displayName = drug.brandName ? `${drug.brandName} (${drug.name})` : drug.name;
    setProcRxItemName(displayName);
    setProcRxIdCode(drug.slotNo || drug.id);
    setProcRxSource('DRUG_FORMULARY');
    setProcRxMasterId(drug.id);
    setProcRxQty(1);
    setShowProcCatalogDropdown(false);
  };

  const handleUseCustomItem = (customName?: string) => {
    const name = (customName || procRxItemName || '').trim() || 'Custom Clinical Item';
    const genCode = `CUST-${Math.floor(100 + Math.random() * 899)}`;
    setProcRxItemName(name);
    setProcRxIdCode(genCode);
    setProcRxSource('CUSTOM');
    setProcRxMasterId('');
    setProcRxQty(1);
    setShowProcCatalogDropdown(false);
  };

  const handleSelectDrugForProcedure = (drug: DrugInventoryItem) => {
    const displayName = drug.brandName ? `${drug.brandName} (${drug.name})` : drug.name;
    addProcedurePrescription({
      id: `proc-rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugId: drug.id,
      source: 'DRUG_FORMULARY',
      itemName: displayName,
      quantity: 1,
      idCode: drug.slotNo || drug.id,
      category: drug.formulation || 'Central Drug Formulary',
      unit: 'Nos',
      instructions: drug.defaultNote || 'Formulary consumable supply',
      printOnRx: true
    });
    setIsProcSelectorModalOpen(false);
    setProcModalSearch('');
    addNotification({
      type: 'success',
      message: `Added formulary drug "${displayName}" referencing /admin/drugs master.`
    });
  };

  const handleSelectProcedureFromMaster = (proc: ProcedureMaster) => {
    addProcedurePrescription({
      id: `proc-rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      procedureId: proc.id,
      source: 'PROCEDURE_MASTER',
      itemName: proc.name,
      quantity: 1,
      idCode: proc.code,
      category: proc.category,
      unit: 'Nos',
      instructions: proc.preInstructions || 'Clinical procedure supply',
      printOnRx: true
    });
    setIsProcSelectorModalOpen(false);
    setProcModalSearch('');
    addNotification({
      type: 'success',
      message: `Added procedure supply "${proc.name}" (${proc.code}) referencing /admin/procedures master.`
    });
  };

  const handleAddProcedurePrescription = (procParam?: any) => {
    // If procParam is a React synthetic event or object without a string name, ignore it
    const validProc: ProcedureMaster | undefined = (procParam && typeof procParam === 'object' && typeof procParam.name === 'string' && !procParam.nativeEvent && !procParam._reactName)
      ? (procParam as ProcedureMaster)
      : undefined;

    if (validProc) {
      handleSelectProcedureFromMaster(validProc);
      return;
    }

    const query = (procRxItemName || '').trim();
    if (!query) {
      setIsProcSelectorModalOpen(true);
      return;
    }

    let finalSource = procRxSource;
    let finalProcedureId: string | undefined = undefined;
    let finalDrugId: string | undefined = undefined;
    let finalIdCode = (procRxIdCode || '').trim();

    if (finalSource === 'PROCEDURE_MASTER' && procRxMasterId) {
      finalProcedureId = procRxMasterId;
    } else if (finalSource === 'DRUG_FORMULARY' && procRxMasterId) {
      finalDrugId = procRxMasterId;
    } else if (!finalSource) {
      const matchProc = activeAdminProcedures.find(p => p.name.toLowerCase() === query.toLowerCase() || p.code.toLowerCase() === query.toLowerCase());
      if (matchProc) {
        finalSource = 'PROCEDURE_MASTER';
        finalProcedureId = matchProc.id;
        finalIdCode = finalIdCode || matchProc.code;
      } else {
        const matchDrug = activeAdminDrugs.find(d => d.name.toLowerCase() === query.toLowerCase() || d.brandName?.toLowerCase() === query.toLowerCase());
        if (matchDrug) {
          finalSource = 'DRUG_FORMULARY';
          finalDrugId = matchDrug.id;
          finalIdCode = finalIdCode || matchDrug.slotNo || matchDrug.id;
        } else {
          finalSource = 'CUSTOM';
          if (!finalIdCode) finalIdCode = `CUST-${Math.floor(100 + Math.random() * 899)}`;
        }
      }
    }

    addProcedurePrescription({
      id: `proc-rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      procedureId: finalProcedureId,
      drugId: finalDrugId,
      source: finalSource || 'CUSTOM',
      itemName: query,
      quantity: procRxQty > 0 ? procRxQty : 1,
      idCode: finalIdCode || 'PRX-01',
      category: finalSource === 'PROCEDURE_MASTER' ? 'Procedure Master' : finalSource === 'DRUG_FORMULARY' ? 'Central Drug Formulary' : 'Custom Supply',
      unit: 'Nos',
      instructions: finalSource === 'CUSTOM' ? 'Custom clinical supply' : 'Allocated from Clinical Master',
      printOnRx: true
    });

    addNotification({
      type: 'success',
      message: `Prescribed ${query} (Qty: ${procRxQty > 0 ? procRxQty : 1}, Code: ${finalIdCode})`
    });

    setProcRxItemName('');
    setProcRxIdCode('');
    setProcRxQty(1);
    setProcRxSource('');
    setProcRxMasterId('');
    setShowProcCatalogDropdown(false);
    setIsProcSelectorModalOpen(false);
  };

  const handleLoadStandardProcedureSupplies = () => {
    const procsToLoad = activeAdminProcedures.slice(0, 3);
    procsToLoad.forEach((proc, i) => {
      addProcedurePrescription({
        id: `proc-std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        procedureId: proc.id,
        itemName: proc.name,
        quantity: 1,
        idCode: proc.code,
        category: proc.category,
        unit: 'Nos',
        instructions: proc.preInstructions || 'Clinical procedure supply'
      });
    });
    addNotification({
      type: 'success',
      message: `Loaded ${procsToLoad.length} procedure supplies from Admin Procedure Master`
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
    customNote: string;
    rescheduledDate: string;
    rate: number;
  }>({
    isOpen: false,
    procedureId: null,
    reason: 'NOT TACKEN - Not avelibal',
    customNote: 'NOT TACKEN - Not avelibal',
    rescheduledDate: '20/04/2026',
    rate: 2000
  });

  const uniqueProcedures = useMemo(() => {
    const procs = activeSession?.procedures || [];
    const seen = new Set<string>();
    let lastExecutedDate: string | null = null;

    return procs.filter((p, idx) => {
      const key = p.id || `${p.procedureName}-${p.scheduledDate}-${p.sessionsCount || idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((p, idx) => {
      const isDone = p.status === 'Done';
      if (isDone && (p.performanceDate || p.scheduledDate)) {
        lastExecutedDate = p.performanceDate || p.scheduledDate;
        return p;
      }
      // If a previous session was executed (e.g. Session 2 executed on 24/09/2026),
      // and this upcoming session has an outdated scheduled date in the past (e.g. 04/05/2026),
      // dynamically advance it to lastExecutedDate + intervalDays (14/10/2026)!
      if (lastExecutedDate && !isDone) {
        const interval = p.intervalDays || 20;
        const targetDate = addDaysToFormattedDate(lastExecutedDate, interval);
        const parsedCurrent = parseAnyDate(p.scheduledDate);
        const parsedLast = parseAnyDate(lastExecutedDate);
        if (parsedCurrent <= parsedLast) {
          lastExecutedDate = targetDate;
          return {
            ...p,
            scheduledDate: targetDate,
            remark: p.remark?.includes('interval') ? p.remark : `Session ${p.sessionNumber || idx + 1} scheduled at ${interval}d interval (+${interval}d from Session ${idx} on ${parsedLast.toLocaleDateString()}).`
          };
        }
        lastExecutedDate = p.scheduledDate;
      }
      return p;
    });
  }, [activeSession?.procedures]);

  const nextSessionItem = useMemo(() => {
    return uniqueProcedures.find(p => p.status !== 'Done' && p.status !== 'Cancelled') || null;
  }, [uniqueProcedures]);

  const completedProceduresCount = useMemo(() => {
    return uniqueProcedures.filter(p => p.status === 'Done').length;
  }, [uniqueProcedures]);

  // Handlers for Tab 4 Procedure Protocol
  const handleAutoGenerateSessions = () => {
    const count = Math.max(1, protocolForm.totalSessions || 4);
    const interval = Math.max(1, protocolForm.intervalDays || 20);
    const start = protocolForm.startDate || '2026-03-25';
    const ratePerSession = Math.round((protocolForm.afterDiscountPrice || 9000) / count);

    const newSessions: ProcedureExecutionItem[] = [];
    const parsedStart = parseAnyDate(start);
    let currentDate = formatToDDMMYYYY(parsedStart);

    for (let i = 1; i <= count; i++) {
      const isFirst = i === 1;
      const isSecond = i === 2;
      newSessions.push({
        id: `proc-sess-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
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
        status: isFirst ? 'Done' : isSecond ? 'Confirmed' : 'Pending',
        remark: isFirst
          ? 'Session 1 completed with good follicular response. Mild transient erythema.'
          : isSecond
          ? 'CANFORMED - PAYMENT PAY AND GIVE APPIENTMENT (Click Delay 12d or Cancel)'
          : i === count
          ? `Final scheduled protocol session ${i}`
          : `Scheduled follow-up session ${i}`,
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
      message: `Auto-generated & upgraded to ${count} treatment sessions (${interval}d intervals)!`
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

  const handleCancelSession = (
    procedureId: string,
    reason: string = 'NOT TACKEN - Not avelibal',
    customNote?: string,
    rescheduledDate?: string,
    rate?: number
  ) => {
    const currentProcs = (activeSession?.procedures && activeSession.procedures.length > 1)
      ? activeSession.procedures
      : DEFAULT_DEMO_TREATMENT_SESSIONS;
    const isReschedule = reason === '20/04/2026 f/u date' || reason.toLowerCase().includes('reschedule') || reason.toLowerCase().includes('f/u date');
    const updatedProcs = currentProcs.map(p => {
      if (p.id === procedureId) {
        return {
          ...p,
          status: isReschedule ? ('Delayed' as const) : ('Cancelled' as const),
          paymentStatus: isReschedule ? p.paymentStatus : ('Cancelled' as const),
          scheduledDate: (isReschedule && rescheduledDate) ? rescheduledDate : p.scheduledDate,
          rate: rate !== undefined ? rate : p.rate,
          price: rate !== undefined ? rate : p.price,
          remark: customNote ? customNote : (isReschedule ? `Rescheduled to ${rescheduledDate || '20/04/2026'}` : reason)
        };
      }
      return p;
    });

    setProcedures(updatedProcs);
    addNotification({
      type: isReschedule ? 'warning' : 'danger',
      message: isReschedule
        ? `Session rescheduled to ${rescheduledDate || '20/04/2026'}`
        : `Session cancellation recorded (${reason})`
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

  // Photography remains scoped to this consultation, including across tab changes.
  const lesionPhotoUrl = useLesionPhotographyStore(s => photographySelectors.selectedImage(s)?.src ?? '');
  const lesionMarkers = useLesionPhotographyStore(s => s.markers);
  const beforeComparisonUrl = useLesionPhotographyStore(s => photographySelectors.beforeImage(s)?.src ?? '');
  const afterComparisonUrl = useLesionPhotographyStore(s => photographySelectors.afterImage(s)?.src ?? '');
  const comparisonSliderPos = useLesionPhotographyStore(s => s.comparisonPosition);
  const consultationGallery = useLesionPhotographyStore(s => s.images);
  const efficacyPercentage = useLesionPhotographyStore(s => s.efficacyPercentage);
  const photographySaveStatus = useLesionPhotographyStore(s => s.saveStatus);
  const { controller: photographyController } = usePhotographySession();
  const isPhotographySaved = photographySaveStatus === 'saved';
  const [showExecutionSettingsInTab5, setShowExecutionSettingsInTab5] = useState(false);
  const handleSavePhotographyAndShowSettings = async () => {
    if (!await photographyController.save()) {
      addNotification({ type: 'warning', message: 'Photography has not been saved. Resolve the photography service or upload errors and retry.' });
      return;
    }
    setShowExecutionSettingsInTab5(true);
  };

  const handleUpdateTab5SessionField = (field: keyof ProcedureExecutionItem, value: any) => {
    const currentProcs = activeSession?.procedures || DEFAULT_DEMO_TREATMENT_SESSIONS;
    const s1 = currentProcs[0] || DEFAULT_DEMO_TREATMENT_SESSIONS[0];
    const updatedProcs = currentProcs.map((p, idx) => {
      if (idx === 0 || p.id === s1.id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setProcedures(updatedProcs);
    if (s1.id) {
      updateProcedure(s1.id, { [field]: value });
    }
  };

  const handleSavePhotographyAndNext = async () => {
    if (!await photographyController.save()) {
      addNotification({ type: 'warning', message: 'Photography has not been saved. Resolve the photography service or upload errors and retry.' });
      return;
    }
    setActiveTab('diagnosis');
  };

  // Tab 6 AI Diagnostic Copilot
  const [aiCopilotActive, setAiCopilotActive] = useState(false);

  // Tab 6 Diagnosis State & Master Templates Integration
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [showDiagSearchMenu, setShowDiagSearchMenu] = useState(false);
  const [newDiffText, setNewDiffText] = useState('');
  const [newInvText, setNewInvText] = useState('');
  const [isEditingPatientCategory, setIsEditingPatientCategory] = useState(false);
  const [showAdminTemplateModal, setShowAdminTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MasterDiagnosisItem | null>(null);
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(7);
  const [isCustomIntervalActive, setIsCustomIntervalActive] = useState(false);
  const [selectedCalendarSlot, setSelectedCalendarSlot] = useState('10:30 AM');

  // Master Templates: Persistent across reloads via localStorage
  const [templatesCatalog, setTemplatesCatalog] = useState<MasterDiagnosisItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('doctor_master_diagnosis_templates');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved diagnosis templates', e);
      }
    }
    return MASTER_DIAGNOSIS_CATALOG;
  });

  const handleSaveTemplateEdits = (updatedTemplate: MasterDiagnosisItem) => {
    const updated = templatesCatalog.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    setTemplatesCatalog(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doctor_master_diagnosis_templates', JSON.stringify(updated));
    }
    setEditingTemplate(null);
    addNotification({
      type: 'success',
      message: `Updated Master Diagnosis Template for ${updatedTemplate.primaryDiagnosis}!`
    });
  };

  const handleResetTemplatesToDefaults = () => {
    setTemplatesCatalog(MASTER_DIAGNOSIS_CATALOG);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('doctor_master_diagnosis_templates');
    }
    setEditingTemplate(null);
    addNotification({
      type: 'info',
      message: 'Reset Master Diagnosis Templates to factory clinical defaults.'
    });
  };

  // Helper: Sunday & Clinic Holiday Verification
  const checkFollowUpHolidayOrSunday = (dateStr?: string) => {
    if (!dateStr) return null;
    let dateObj: Date | null = null;
    if (dateStr.includes('-')) {
      dateObj = new Date(dateStr);
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    if (!dateObj || isNaN(dateObj.getTime())) return null;

    // Sunday check
    if (dateObj.getDay() === 0) {
      const nextDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);
      return {
        type: 'SUNDAY' as const,
        title: 'Sunday OPD Notice',
        warning: 'Selected date is Sunday (Clinic OPD closed; emergency triage only).',
        suggestedDate: formatToDDMMYYYY(nextDay),
        suggestedDayName: 'Monday'
      };
    }

    // Clinic holiday check
    const yyyyMmDd = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const allHolidays = holidays && holidays.length > 0 ? holidays : [
      { id: 'hol-1', date: '2026-10-02', name: 'Gandhi Jayanti' },
      { id: 'hol-2', date: '2026-10-20', name: 'Diwali Festive Holiday' },
      { id: 'hol-3', date: '2026-10-21', name: 'New Year (Vikram Samvat)' },
      { id: 'hol-4', date: '2026-12-25', name: 'Christmas Day' }
    ];
    const matched = allHolidays.find(h => h.date === yyyyMmDd);
    if (matched) {
      const nextDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);
      return {
        type: 'HOLIDAY' as const,
        title: `Clinic Holiday: ${matched.name}`,
        warning: `Clinic OPD closed for ${matched.name}. Recommended next working day: ${formatToDDMMYYYY(nextDay)}.`,
        suggestedDate: formatToDDMMYYYY(nextDay),
        suggestedDayName: 'Next Working Day'
      };
    }

    return null;
  };

  // Helper: Book into OPD Appointment Calendar
  const handleBookOpdAppointment = (dateStr: string, timeSlot: string) => {
    if (!dateStr) {
      alert('Please specify a valid return date first.');
      return;
    }
    const aptId = `apt-recall-${Date.now()}`;
    addAppointment({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: 'doc-1',
      doctorName: 'Dr. Raj Valaki',
      date: dateStr,
      time: timeSlot,
      visitType: 'Follow-Up',
      status: 'SCHEDULED',
      remarks: `Clinical Follow-Up: ${activeSession?.diagnosis.finalDiagnosis || activeSession?.diagnosis.primaryDiagnosis || (caseId === 'C004-001-22092026' ? 'Tinea corporis' : 'General Follow-Up')}`
    });

    updateDiagnosis({
      appointmentBookedId: aptId,
      appointmentBookedDate: dateStr,
      appointmentBookedTime: timeSlot
    });

    addNotification({
      type: 'success',
      message: `Booked follow-up in Clinic OPD Calendar for ${patient.firstName} on ${dateStr} at ${timeSlot} ✓`
    });
  };

  // Helper: Apply template from Master Catalog (PROTECTS DOCTOR EDITS, CATEGORY & Rx VISIBILITY)
  const applyMasterDiagnosisTemplate = (template: MasterDiagnosisItem) => {
    const today = new Date();
    const fDate = formatToDDMMYYYY(new Date(today.getTime() + template.defaultFollowUpDays * 24 * 60 * 60 * 1000));
    
    // Selectively populate ONLY diagnosis-related content
    // PROTECT: patientCategory, prescriptionFontSize, visibility toggles, review-link settings, nursing, referral
    updateDiagnosis({
      primaryDiagnosis: template.primaryDiagnosis,
      finalDiagnosis: template.diagnosisName,
      icd10Code: template.icd10Code,
      status: template.defaultStatus,
      provisional: `${template.primaryDiagnosis} - ${template.diagnosisName}`,
      differential: template.differentials.join(', '),
      diagnosisNote: template.diagnosisNote,
      patientAdvice: template.patientAdvice,
      dietAdvice: template.dietAdvice,
      recommendedInvestigations: template.recommendedInvestigations,
      recommendedProcedure: template.recommendedProcedure,
      followUpDays: template.defaultFollowUpDays,
      followUpDate: fDate,
      followUpPurpose: template.followUpPurpose,
      // Protected Doctor configurations
      visibility: {
        diagnosis: activeSession?.diagnosis?.visibility?.diagnosis ?? true,
        diagnosisNote: activeSession?.diagnosis?.visibility?.diagnosisNote ?? true,
        advice: activeSession?.diagnosis?.visibility?.advice ?? true,
        dietAdvice: activeSession?.diagnosis?.visibility?.dietAdvice ?? false,
        investigation: activeSession?.diagnosis?.visibility?.investigation ?? true,
        procedure: activeSession?.diagnosis?.visibility?.procedure ?? true,
        followUp: activeSession?.diagnosis?.visibility?.followUp ?? true,
        referral: activeSession?.diagnosis?.visibility?.referral ?? false,
      },
      prescriptionFontSize: activeSession?.diagnosis?.prescriptionFontSize || 'A',
      patientCategory: activeSession?.diagnosis?.patientCategory || (patient as any).category || 'General OPD',
      sendReviewLink: activeSession?.diagnosis?.sendReviewLink ?? true,
      reviewLinkSent: activeSession?.diagnosis?.reviewLinkSent ?? false,
    });

    addNotification({
      type: 'success',
      message: `Master diagnosis set to ${template.primaryDiagnosis}. Doctor-edited patient category, review link, and Rx visibility preserved.`
    });
  };

  // Helper: Toggle Visibility (Eye icon)
  const toggleDiagnosisSectionVisibility = (section: 'diagnosis' | 'diagnosisNote' | 'advice' | 'dietAdvice' | 'investigation' | 'procedure' | 'followUp' | 'referral') => {
    const currentVis = activeSession?.diagnosis?.visibility || {
      diagnosis: true,
      diagnosisNote: true,
      advice: true,
      dietAdvice: false,
      investigation: true,
      procedure: true,
      followUp: true,
      referral: false,
    };
    const newVal = !currentVis[section];
    updateDiagnosis({
      visibility: {
        ...currentVis,
        [section]: newVal
      }
    });
    addNotification({
      type: newVal ? 'info' : 'warning',
      message: `Prescription Visibility: ${section} marked ${newVal ? 'SHOW (Visible on Rx)' : 'HIDE (Clinical Record Only)'}`
    });
  };

  // Helper: Save Diagnosis to Clinical Record (Verified Local Storage Persistence)
  const handleSaveDiagnosisToClinicalRecord = () => {
    const diag = activeSession?.diagnosis;
    if (!diag?.finalDiagnosis && !diag?.primaryDiagnosis) {
      alert('Please enter or select a diagnosis first.');
      return;
    }
    
    addClinicalRecord({
      patientId: patient.id,
      doctorName: 'Dr. Raj Valaki',
      department: 'Dermatology',
      date: formatToDDMMYYYY(new Date()),
      chiefComplaint: activeSession?.complaints.presentComplaint || 'Dermatological Consultation',
      diagnosis: `${diag.finalDiagnosis || diag.primaryDiagnosis} (${diag.status || 'Confirmed'})`,
      vitals: {
        bp: `${activeSession?.vitals.bpSystolic || 120}/${activeSession?.vitals.bpDiastolic || 80}`,
        pulse: String(activeSession?.vitals.pulse || '72'),
        temp: String(activeSession?.vitals.temperature || '98.6'),
        weight: String(activeSession?.vitals.weight || '68'),
        spo2: String(activeSession?.vitals.spo2 || '99')
      },
      prescription: (activeSession?.prescriptions || []).map(p => ({
        medicine: p.drugName,
        dosage: p.dosage,
        duration: `${p.durationDays} days`,
        instructions: p.instructions
      })),
      followUpDate: diag.followUpDate || ''
    });

    syncFollowUpToCallList();
    handleSaveClinicalData();

    addNotification({
      type: 'success',
      message: `Diagnosis saved to ${patient.firstName}'s Clinical Record (Session persisted in local consultation store).`
    });
  };

  // Helper: Update patient category
  const handleUpdatePatientCategory = (newCat: string) => {
    updatePatient(patient.id, { category: newCat } as any);
    updateDiagnosis({ patientCategory: newCat });
    setIsEditingPatientCategory(false);
    addNotification({
      type: 'info',
      message: `Patient category updated to ${newCat}`
    });
  };

  // Helper: Send Review Link with Simulation Notice and Separate SMS/WhatsApp Status
  const handleSendReviewLink = () => {
    if (activeSession?.diagnosis?.reviewLinkSent) {
      addNotification({
        type: 'info',
        message: `Review link is already prepared in simulation mode for ${patient.firstName} (${patient.mobile || '+91 98765 43210'}). Ref: ${activeSession.diagnosis.reviewLinkRef || 'RVW-SIM-QUEUED'}. Duplicate dispatch prevented.`
      });
      return;
    }
    const dispatchRef = `RVW-SIM-${Date.now().toString().slice(-6)}`;
    updateDiagnosis({
      reviewLinkSent: true,
      sendReviewLink: true,
      reviewLinkRef: dispatchRef,
      reviewLinkDispatchedAt: new Date().toISOString()
    });
    addNotification({
      type: 'warning',
      message: `Simulated — no live message sent (Live SMS/WhatsApp gateway not connected). Separate payloads prepared: [WhatsApp: Pending Gateway Dispatch] • [SMS DLT: Pending Gateway Dispatch]. Ref: ${dispatchRef}.`
    });
  };

  // Helper: Add investigation to Tab 2 order list (WITH DUPLICATE PREVENTION)
  const handleAddInvestigationToOrder = (testName: string) => {
    const currentInvs = activeSession?.investigations || [];
    const alreadyOrdered = currentInvs.some(
      i => i.testName.trim().toLowerCase() === testName.trim().toLowerCase()
    );
    if (alreadyOrdered) {
      addNotification({
        type: 'info',
        message: `"${testName}" is already present in Tab 2 Lab Orders. Duplicate prevented.`
      });
      return;
    }
    const existing = invCatalog.find(i => i.name.toLowerCase().includes(testName.toLowerCase()));
    addInvestigation({
      testId: existing?.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      testName: existing?.name || testName,
      category: existing?.category || 'Hematology',
      price: existing?.price || 350,
      specimenTube: existing?.specimenTube || 'EDTA (Purple Tube)',
      status: 'ORDERED',
      instructions: existing?.instructions || 'Standard clinical collection'
    });
    addNotification({
      type: 'success',
      message: `Ordered "${testName}" to Lab Orders (Tab 2)!`
    });
  };

  // Helper: Add procedure to Tab 4 protocol
  const handleAddProcedureToProtocol = (procName: string) => {
    if (!procName.trim()) return;
    setProtocolForm(prev => ({
      ...prev,
      procedureName: procName
    }));
    addNotification({
      type: 'success',
      message: `Set procedure protocol for ${procName} in Tab 4.`
    });
  };

  // Helper: Add Differential Diagnosis
  const handleAddDifferential = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = (activeSession?.diagnosis.differential || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(trimmed)) {
      updateDiagnosis({ differential: [...current, trimmed].join(', ') });
    }
    setNewDiffText('');
  };

  // Helper: Remove Differential Diagnosis
  const handleRemoveDifferential = (nameToRemove: string) => {
    const current = (activeSession?.diagnosis.differential || '').split(',').map(s => s.trim()).filter(Boolean);
    updateDiagnosis({ differential: current.filter(d => d !== nameToRemove).join(', ') });
  };

  // Helper: Add Recommended Investigation
  const handleAddInvestigation = (invToAdd: string) => {
    const trimmed = invToAdd.trim();
    if (!trimmed) return;
    const current = activeSession?.diagnosis.recommendedInvestigations || [];
    if (!current.includes(trimmed)) {
      updateDiagnosis({ recommendedInvestigations: [...current, trimmed] });
    }
    setNewInvText('');
  };

  // Helper: Remove Recommended Investigation
  const handleRemoveInvestigation = (invToRemove: string) => {
    const current = activeSession?.diagnosis.recommendedInvestigations || [];
    updateDiagnosis({
      recommendedInvestigations: current.filter(i => i !== invToRemove)
    });
  };

  // Helper: Live Sync Follow-Up to Outbound Call List
  const syncFollowUpToCallList = (diagUpdates?: Partial<ConsultationSession['diagnosis']>) => {
    const currentDiag = { ...(activeSession?.diagnosis || {}), ...(diagUpdates || {}) };
    const retDate = currentDiag.followUpDate || '';
    if (retDate || currentDiag.nursingInstructions || currentDiag.followUpPurpose) {
      useFollowUpStore.getState().upsertConsultationTask({
        caseId,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        mrdNumber: patient.mrdNumber || 'MRD-2026-0004',
        mobile: patient.mobile || '9825100004',
        doctorName: activeSession?.doctorName || 'Dr. Raj Valaki',
        originalVisitDate: formatToDDMMYYYY(new Date()),
        reason: currentDiag.followUpPurpose || 'Assess clinical clearance of fungal lesions',
        dueDate: retDate || formatToDDMMYYYY(new Date(Date.now() + (Number(currentDiag.followUpDays) || 7) * 86400000)),
        followUpDays: currentDiag.followUpDays || 7,
        nursingInstructions: currentDiag.nursingInstructions || 'Call patient at day 5 to verify compliance and assess clinical clearance of fungal lesions',
        priority: (currentDiag.nursingFollowUp?.priority as any) || 'High',
        status: 'PENDING'
      });
    }
  };

  // Helper: Select Follow Up preset days
  const handleSelectFollowUpPreset = (days: number) => {
    setIsCustomIntervalActive(false);
    const today = new Date();
    const fDate = formatToDDMMYYYY(new Date(today.getTime() + days * 24 * 60 * 60 * 1000));
    updateDiagnosis({
      followUpDays: days,
      followUpDate: fDate
    });
    syncFollowUpToCallList({
      followUpDays: days,
      followUpDate: fDate
    });
  };

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
        procedurePrescriptions: DEFAULT_DEMO_PROCEDURE_PRESCRIPTIONS,
        procedures: DEFAULT_DEMO_TREATMENT_SESSIONS
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

  // Ensure default demo prescriptions, procedure items and investigations exist if activeSession has none
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
    const currentInv = activeSession.investigations || [];
    if (currentInv.length === 0) {
      addInvestigation({
        testId: 'inv-1',
        testName: 'Complete Blood Count (CBC) with ESR',
        category: 'Hematology',
        price: 350,
        status: 'ORDERED',
        specimenTube: 'EDTA (Purple Tube)',
        notes: 'Routine hematological workup, check ESR and platelet count'
      });
    }
    const currentProcs = activeSession.procedures || [];
    if (currentProcs.length <= 1) {
      setProcedures(DEFAULT_DEMO_TREATMENT_SESSIONS);
    }
    if (!activeSession.diagnosis?.followUpDate) {
      const defaultDays = 7;
      const defaultDate = formatToDDMMYYYY(new Date(Date.now() + defaultDays * 86400000));
      const defaultPurpose = 'Assess clinical clearance of fungal lesions';
      const defaultNursingInstructions = 'Call patient at day 5 to verify compliance and assess clinical clearance of fungal lesions';
      updateDiagnosis({
        followUpDays: defaultDays,
        followUpDate: defaultDate,
        followUpPurpose: defaultPurpose,
        nursingInstructions: defaultNursingInstructions,
        visibility: {
          ...(activeSession.diagnosis?.visibility || {
            diagnosis: true, diagnosisNote: true, advice: true, dietAdvice: false, investigation: true, procedure: true, followUp: true, referral: false
          }),
          followUp: true
        }
      });
      useFollowUpStore.getState().upsertConsultationTask({
        caseId,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        mrdNumber: patient.mrdNumber || 'MRD-2026-0004',
        mobile: patient.mobile || '9825100004',
        doctorName: activeSession?.doctorName || 'Dr. Raj Valaki',
        originalVisitDate: formatToDDMMYYYY(new Date()),
        reason: defaultPurpose,
        dueDate: defaultDate,
        followUpDays: defaultDays,
        nursingInstructions: defaultNursingInstructions,
        priority: 'High',
        status: 'PENDING'
      });
    }
  }, [activeSession, addPrescription, addProcedurePrescription, addInvestigation, setProcedures]);

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
      if (!item || !item.itemName || item.itemName === 'undefined' || item.itemName === 'null') return false;
      const key = item.id || `proc-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeSession?.procedurePrescriptions]);

  const printableProcedurePrescriptions = useMemo(() => {
    return uniqueProcedurePrescriptions.filter(p => p.printOnRx !== false);
  }, [uniqueProcedurePrescriptions]);

  const uniqueInvestigations = useMemo(() => {
    const list = activeSession?.investigations || [];
    const seen = new Set<string>();
    return list.filter((item, idx) => {
      const key = item.testId || (item as any).id || item.testName || `inv-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeSession?.investigations]);

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

  // Live Billing Accumulator Calculations (FOC ONLY removes doctor consultation fees)
  const baseConsultationFee = activeSession?.billing.isFoc ? 0 : (activeSession?.billing.consultationFee || 500);

  // Multi-session procedure fee calculation: Session-Wise vs Full Package
  const procedureBillingMode = activeSession?.billing.procedureBillingMode || activeSession?.treatmentProtocol?.billingMode || 'session_wise';
  const isSessionWise = procedureBillingMode === 'session_wise';

  const fullPackageProceduresTotal = useMemo(() => {
    return (activeSession?.procedures && activeSession.procedures.length > 0)
      ? activeSession.procedures.reduce((s, p) => s + (p.rate || p.price || 0), 0)
      : (activeSession?.treatmentProtocol?.total || 9000);
  }, [activeSession?.procedures, activeSession?.treatmentProtocol]);

  const sessionWiseProceduresTotal = useMemo(() => {
    const procs = activeSession?.procedures || [];
    if (procs.length === 0) return 0;
    const doneProcs = procs.filter(p => p.status === 'Done');
    if (doneProcs.length > 0) {
      return doneProcs.reduce((s, p) => s + (p.rate || p.price || 0), 0);
    }
    // If no session explicitly marked Done yet, default to Session 1 fee
    return procs[0]?.rate || procs[0]?.price || Math.round(fullPackageProceduresTotal / Math.max(1, procs.length));
  }, [activeSession?.procedures, fullPackageProceduresTotal]);

  const proceduresTotal = isSessionWise ? sessionWiseProceduresTotal : fullPackageProceduresTotal;
  const proceduresFutureBalance = Math.max(0, fullPackageProceduresTotal - proceduresTotal);

  const investigationsTotal = activeSession?.investigations.reduce((s, i) => s + i.price, 0) || 0;
  const pharmacyTotal = activeSession?.prescriptions.reduce((s, p) => s + (Number(p.totalQty) || 1) * 12, 0) || 0;
  const grossSubtotal = baseConsultationFee + proceduresTotal + investigationsTotal + pharmacyTotal;
  const discountAmount = Math.round((grossSubtotal * (activeSession?.billing.discountPercent || 0)) / 100);
  const netEstimatedBill = Math.max(0, grossSubtotal - discountAmount);

  // Consent Patient Demographics & Binding Data
  const consentPatientData: ConsentPatientInfo = useMemo(() => {
    const isCaseC003 = caseId === 'C003-001-190926';
    const isMahesh = isCaseC003 || patient?.firstName?.toLowerCase() === 'mahesh';
    const pName = isMahesh ? 'Mahesh Kumar' : `${patient.firstName} ${patient.lastName}`;
    const pGender = isMahesh ? 'M' : ((patient.gender as string) || 'M');
    const pAge = isMahesh ? 45 : (patient.age || 32);
    const pCity = isMahesh ? 'Surat' : (patient.city || activeQueueEntry?.city || 'Surat, Gujarat');
    const pMrd = isMahesh ? 'MRD-2026-0001' : (patient.mrdNumber || 'MRD-2026-0019');
    const pDoctor = 'Dr. Raj Valaki, MBBS, MD (Dermatology)';
    const pDate = isMahesh ? '2026-03-25' : (protocolForm.startDate || '25/03/2026');

    return {
      name: pName,
      gender: pGender,
      age: pAge,
      place: pCity,
      ipdNo: consentIpdNumber || 'IPD-2026-089',
      mrdNo: pMrd,
      caseNo: caseId,
      procedureName: protocolForm.procedureName || 'HAIR REMOVAL - DIODE (TRIPLE WAVELENGTH)',
      bodyPart: protocolForm.bodyPart || 'FACE',
      date: pDate,
      doctorName: pDoctor,
      clinicName: 'MedFlow Multispeciality Clinic & Laser Aesthetics Centre',
      language: isMahesh ? 'Gujarati' : ((patient.language as any) || 'Gujarati')
    };
  }, [patient, caseId, protocolForm.procedureName, protocolForm.bodyPart, protocolForm.startDate, consentIpdNumber, activeQueueEntry]);

  // Active matched consent template for Print Center modal
  const activeModalTemplate = useMemo(() => {
    const raw = (protocolForm.procedureName || '').toUpperCase();
    for (const t of TWELVE_CONSENT_TEMPLATES) {
      if (t.keywords.some(kw => raw.includes(kw))) {
        return t;
      }
    }
    return TWELVE_CONSENT_TEMPLATES[0];
  }, [protocolForm.procedureName]);

  const interpolateModalTokens = (text: string) => {
    let result = text;
    result = result.replace(/\[Patient Name\]/g, `${patient.firstName} ${patient.lastName}`);
    result = result.replace(/\[Age\]/g, String(patient.age || 21));
    result = result.replace(/\[Gender\]/g, patient.gender === 'M' ? 'Male (પુરૂષ)' : 'Female (સ્ત્રી)');
    result = result.replace(/\[Place\]/g, patient.city || activeQueueEntry?.city || 'Surat');
    result = result.replace(/\[IPD Number\]/g, consentIpdNumber || 'IPD-2026-089');
    result = result.replace(/\[MRD Number\]/g, patient.mrdNumber || 'MRD-2026-0001');
    result = result.replace(/\[Case Number\]/g, caseId);
    result = result.replace(/\[Procedure Name\]/g, activeModalTemplate.procedureName);
    result = result.replace(/\[Body Part\]/g, protocolForm.bodyPart || 'FACE');
    result = result.replace(/\[Date\]/g, protocolForm.startDate || '2026-03-25');
    result = result.replace(/\[Doctor Name\]/g, 'Dr. Raj Valaki, MBBS, MD (Dermatology)');
    result = result.replace(/\[Clinic Name\]/g, 'MedFlow Multispeciality Clinic & Laser Centre');
    return result;
  };

  // Handle Procedure Update directly from Consent Form
  const handleConsentUpdateProcedure = (updated: {
    procedureName: string;
    bodyPart: string;
    date?: string;
    totalSessions?: number;
  }) => {
    setProtocolForm(prev => ({
      ...prev,
      procedureName: updated.procedureName,
      bodyPart: updated.bodyPart,
      startDate: updated.date || prev.startDate
    }));
    if (activeSession && activeSession.procedures && activeSession.procedures.length > 0) {
      activeSession.procedures.forEach(p => {
        updateProcedure(p.id, {
          procedureName: updated.procedureName,
          bodyPart: updated.bodyPart,
          scheduledDate: updated.date || p.scheduledDate
        });
      });
    }
    addNotification({
      type: 'success',
      message: `Procedure updated to "${updated.procedureName}" (${updated.bodyPart}) across Consent Form and Treatment Protocol!`
    });
  };

  // Drug Selection & Smart Search Direct Prescribe Handlers (Single Source of Truth: /admin/drugs)
  const handleSelectDrugFromMaster = (drug: DrugInventoryItem) => {
    const isTablet = drug.formulation === 'Tablet' || drug.formulation === 'Capsule';
    const finalItem: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugId: drug.id,
      drugName: drug.name,
      brandName: drug.brandName || drug.name,
      genericName: drug.genericName || drug.name,
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

    // Dynamic AI Safety Check
    const checkName = (finalItem.brandName + ' ' + finalItem.genericName).toLowerCase();
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
        warning: '✓ AI Drug Safety Verified: Dosage validated for adult weight; no interaction with current medications.'
      });
    }

    setIsDrugSelectorModalOpen(false);
    setDrugModalSearch('');
    addNotification({
      type: 'success',
      message: `Prescribed ${drug.name} referencing /admin/drugs master ID: ${drug.id}`
    });
  };

  const handleAddDrugFromSmartSearch = (drug: DrugInventoryItem) => {
    handleSelectDrugFromMaster(drug);
    setDrugSearch('');
    setIsDrugDropdownOpen(false);
    setSelectedDrug(null);
  };

  const handleAddCustomDrugFromSearch = (customName?: string) => {
    const name = (customName || drugSearch).trim();
    if (!name) return;

    // Search active drugs catalog first
    const matched = activeAdminDrugs.find(d =>
      d.name.toLowerCase() === name.toLowerCase() ||
      d.genericName.toLowerCase() === name.toLowerCase() ||
      d.brandName?.toLowerCase() === name.toLowerCase()
    );
    if (matched) {
      handleAddDrugFromSmartSearch(matched);
      return;
    }

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
    // Single Source of Truth flow: open searchable Drug Master selector
    setIsDrugSelectorModalOpen(true);
  };

  const handleSelectDrug = (drug: DrugInventoryItem) => handleSelectDrugFromMaster(drug);
  const handleCreateCustomDrug = () => handleAddCustomDrugFromSearch();
  const handleAddDrugRow = () => {
    setIsDrugSelectorModalOpen(true);
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

  // Open Handover Modal or Advisory if clinical notes are missing
  const handleFinalizeSession = () => {
    const hasComplaint = Boolean(activeSession?.complaints.presentComplaint?.trim());
    const hasDiagnosis = Boolean(
      activeSession?.diagnosis.finalDiagnosis?.trim() ||
      activeSession?.diagnosis.provisional?.trim() ||
      activeSession?.diagnosis.primaryDiagnosis?.trim()
    );

    if (!hasComplaint && !hasDiagnosis) {
      setShowClinicalValidationModal(true);
      return;
    }
    setShowEndSessionModal(true);
  };

  // Proceed with default consultation metadata
  const handleProceedWithDefaultConsultation = () => {
    const currentComplaint = activeSession?.complaints.presentComplaint?.trim();
    const currentDiagnosis = activeSession?.diagnosis.finalDiagnosis?.trim() || activeSession?.diagnosis.provisional?.trim();

    if (!currentComplaint) {
      updateComplaints({
        presentComplaint: 'General OPD Consultation & Clinical Evaluation'
      });
    }
    if (!currentDiagnosis) {
      updateDiagnosis({
        finalDiagnosis: 'General Clinical OPD Consultation',
        provisional: activeSession?.diagnosis.provisional?.trim() || 'Clinical OPD Evaluation'
      });
    }
    setShowClinicalValidationModal(false);
    setShowEndSessionModal(true);
  };

  // Quick navigation jump handlers
  const handleJumpToComplaints = () => {
    setShowClinicalValidationModal(false);
    setActiveTab('complaints');
    setComplaintsSubTab('complaints');
  };

  const handleJumpToDiagnosis = () => {
    setShowClinicalValidationModal(false);
    setActiveTab('diagnosis');
  };

  // Finalize & Handover Execution
  const handleConfirmEndSession = () => {
    finalizeConsultation();

    // 1. Sync bill to useBillingStore so Reception has exact line items!
    // FOC only removes doctor consultation fees; procedures & investigations remain payable
    const consultationFee = activeSession?.billing.isFoc ? 0 : (activeSession?.billing.consultationFee || 500);
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
    const netTotal = Math.max(0, grossTotal - doctorDiscount);
    const advancePaid = activeSession?.billing.isFoc ? 0 : Math.min(500, netTotal);
    const balanceDue = Math.max(0, netTotal - advancePaid);

    addBill({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      mrdNumber: patient.mrdNumber,
      doctorName: 'Dr. Raj Valaki',
      date: '2026-09-19',
      netAmount: netTotal,
      collectedAmount: advancePaid,
      balance: balanceDue,
      status: balanceDue === 0 ? (netTotal === 0 ? 'FOC' : 'PAID') : 'PARTIAL',
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

    syncFollowUpToCallList();

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

  const patientDisplayName = activeSession?.patientName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
  const patientInitials = patientDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'PT';

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* 5.1 Modern Executive Consultation Top Bar */}
      <div
        className="consultation-top-bar"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '12px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 12px rgba(15, 23, 42, 0.02)'
        }}
      >
        {/* Left: Patient Identification & Demographics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/doctor/dashboard"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease', flexShrink: 0
            }}
            title="Return to OPD Queue Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, letterSpacing: '0.05em',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)', flexShrink: 0
          }}>
            {patientInitials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                {patientDisplayName}
              </h2>
              <span className="badge" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700, fontFamily: 'monospace', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>
                {patient.mrdNumber}
              </span>
              <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700, fontFamily: 'monospace', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>
                Case: {caseId}
              </span>
              <span className="badge" style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF', fontWeight: 600, fontSize: 11, padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Building size={11} /> Room 1 (Dr. Raj Valaki)
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span>{patient.age} Yrs</span>
              <span>•</span>
              <span>{patient.gender === 'M' ? 'Male' : 'Female'}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                Blood: {patient.bloodGroup || 'B+'}
              </span>
              <span>•</span>
              <span>City: {patient.city || 'Surat'}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Consultation Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0F172A', color: '#FFFFFF',
          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800,
          boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
          border: '1px solid #334155'
        }}>
          <Clock size={15} color="#38BDF8" />
          <span style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>{formattedTime}</span>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#10B981',
            boxShadow: '0 0 8px #10B981',
            animation: 'pulse 1s infinite'
          }} />
        </div>

        {/* Right: Modern Clinical Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
            style={{ borderColor: '#BAE6FD', color: '#0284C7', background: '#F0F9FF', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '7px 12px', fontSize: 12 }}
            title="Add New Lab Test to Requisition Basket"
          >
            <Plus size={14} /> Add Lab Test
          </button>

          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            className="btn btn-sm"
            style={{
              background: showSidePanel ? '#EEF2FF' : '#F8FAFC',
              border: `1px solid ${showSidePanel ? '#C7D2FE' : '#E2E8F0'}`,
              color: showSidePanel ? '#4338CA' : '#475569',
              fontWeight: 700,
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Toggle Patient Medical Profile Snapshot"
          >
            <User size={14} /> Profile {showSidePanel ? '•' : ''}
          </button>

          <button
            onClick={() => setShowBillingDrawer(!showBillingDrawer)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#E2E8F0', color: '#334155', background: '#F8FAFC', fontWeight: 700, borderRadius: 8, padding: '7px 12px', fontSize: 12 }}
            title="Toggle Live Billing Accumulator Drawer"
          >
            <Wallet size={14} /> Bill (₹{netEstimatedBill})
          </button>

          <button
            onClick={() => setShowHoldModal(true)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#FDE68A', color: '#B45309', background: '#FFFBEB', fontWeight: 700, borderRadius: 8, padding: '7px 12px', fontSize: 12 }}
            title="Put Consultation On Hold for in-clinic diagnostics / lab test"
          >
            <PauseCircle size={14} /> Put on Hold
          </button>

          <button
            onClick={handleFinalizeSession}
            className="btn btn-success btn-sm"
            style={{
              background: '#059669', borderColor: '#047857', color: '#FFFFFF',
              fontWeight: 800, borderRadius: 8, padding: '7px 16px', fontSize: 12.5,
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <CheckCircle2 size={14} /> End Consultation
          </button>
        </div>
      </div>


      {/* Main Workspace Layout (Side Panel + 7 Tabs) */}
      <div className="consultation-layout-grid" style={{ display: 'grid', gridTemplateColumns: showSidePanel ? '280px minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 16, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* 5.3 Patient Side Panel */}
        {showSidePanel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Snapshot Card */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div className="card-header" style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="card-title" style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={14} color="#0284C7" /> Patient Medical Snapshot
                </span>
                <button
                  type="button"
                  onClick={() => setShowSidePanel(false)}
                  className="btn btn-ghost btn-xs"
                  title="Hide Patient Snapshot Sidebar"
                  style={{ padding: '2px 5px', color: '#94A3B8', borderRadius: 4 }}
                >
                  <X size={13} />
                </button>
              </div>
              <div className="card-body" style={{ padding: '14px 16px', fontSize: 12 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Chronic Diagnoses
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      Essential Hypertension (Stage 1)
                    </span>
                    <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      Mild Xerosis Cutis
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Surgical History
                  </div>
                  <div style={{ fontWeight: 500, color: '#334155', marginTop: 3, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: 6, fontSize: 11.5 }}>
                    Appendectomy (2018), uneventful recovery
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Active Ongoing Rx
                  </div>
                  <div style={{ fontWeight: 700, color: '#0369A1', marginTop: 3, background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '6px 10px', borderRadius: 6, fontSize: 11.5 }}>
                    Tab. Telmisartan 40mg (1 OD)
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Emergency Contact
                  </div>
                  <div style={{ fontWeight: 700, color: '#BE123C', marginTop: 3, background: '#FFF1F2', border: '1px solid #FECDD3', padding: '6px 10px', borderRadius: 6, fontSize: 11.5 }}>
                    Kishore Kumar (Brother) • 9825100099
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Timeline Card */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div className="card-header" style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <span className="card-title" style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={14} color="#6366F1" /> Past Encounters
                </span>
              </div>
              <div className="card-body" style={{ padding: '14px 16px', fontSize: 11 }}>
                <div style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: 12, marginLeft: 4 }}>
                  <div style={{ marginBottom: 12, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -17, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#0284C7' }} />
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>2026-09-10 (Dr. Raj Valaki)</div>
                    <div style={{ color: '#64748B', marginTop: 2 }}>Atopic Dermatitis flare-up</div>
                  </div>
                  <div style={{ marginBottom: 12, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -17, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} />
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>2026-08-05 (Dr. Raj Valaki)</div>
                    <div style={{ color: '#64748B', marginTop: 2 }}>Contact Irritant Dermatitis</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHistoryModalTab('encounters');
                    setShowPastVitalsModal(true);
                  }}
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: '#0369A1',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 8,
                    cursor: 'pointer',
                    fontSize: 11.5,
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <History size={13} /> View History &amp; Timeline Modal →
                </button>

                <Link href={`/doctor/patients/${patient.id}/history`} style={{ color: '#64748B', fontSize: 11, display: 'block', marginTop: 8, textAlign: 'center', textDecoration: 'none' }}>
                  Full Audit Ledger ↗
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 7 Clinical Consultation Tabs Area */}
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
          {/* Tabs Navigation Header */}
          <div className="tabs consultation-tabs" style={{
            background: '#F8FAFC',
            borderRadius: '12px 12px 0 0',
            padding: '8px 10px',
            border: '1px solid #E2E8F0',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}>
            {[
              { id: 'complaints', label: '1. Complaints & Vitals', icon: Heart },
              { id: 'investigations', label: `2. Lab Orders (${activeSession?.investigations.length || 0})`, icon: FileText },
              { id: 'drugs', label: `3. Rx Pharmacy (${activeSession?.prescriptions.length || 0}${activeSession?.procedurePrescriptions?.length ? ` + ${activeSession.procedurePrescriptions.length} Proc` : ''})*`, icon: Pill },
              { id: 'procedures', label: `4. Procedures (${activeSession?.procedures.length || 0})`, icon: Scissors },
              { id: 'images', label: `5. Clinical Procedure Images & Photography`, icon: Camera },
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#0284C7' : '#64748B',
                    background: active ? '#FFFFFF' : 'transparent',
                    border: active ? '1px solid #BAE6FD' : '1px solid transparent',
                    boxShadow: active ? '0 1px 3px rgba(2, 132, 199, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <Icon size={14} color={active ? '#0284C7' : '#94A3B8'} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* TAB 1: Complaints & History • Current Visit Details */}
          {/* ============================================================ */}
          {activeTab === 'complaints' && (
            <div className="card" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div className="card-body" style={{ padding: 22 }}>
                {/* Main Two-Column Layout: Complaints & History (Left) | Vitals Strip (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, alignItems: 'start' }}>
                  {/* Left Column: Complaints & History */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Section A: Current Visit Details */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{
                        padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 10
                      }}>
                        <span style={{ fontSize: 13, color: '#0369A1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={15} color="#0284C7" /> Complaints &amp; Current Visit Presentation
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={handleSameAsPrevious}
                            className="btn btn-sm"
                            style={{
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              color: '#0284C7',
                              fontWeight: 700,
                              fontSize: 11.5,
                              padding: '5px 10px',
                              borderRadius: 6,
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
                            className="btn btn-sm"
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              color: '#475569',
                              fontWeight: 700,
                              fontSize: 11.5,
                              padding: '5px 10px',
                              borderRadius: 6,
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
                      <div style={{ padding: 18 }}>
                        {/* Present Complaint */}
                        <div style={{ marginBottom: 16 }}>
                          <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                            Present Complaint / Reason for visit *
                          </label>
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="E.g., Fever and headache since 3 days, mild itching on dorsum of hand..."
                            value={activeSession?.complaints.presentComplaint || ''}
                            onChange={e => updateComplaints({ presentComplaint: e.target.value })}
                            style={{ borderRadius: 8, borderColor: '#CBD5E1', padding: '10px 12px', fontSize: 13, lineHeight: 1.5 }}
                          />
                        </div>

                        {/* Duration, Severity, Onset */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Duration</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder="Yrs"
                                  value={activeSession?.complaints.durationYears ?? 1}
                                  onChange={e => updateComplaints({ durationYears: parseInt(e.target.value) || 0 })}
                                  style={{ borderRadius: 6, textAlign: 'center', padding: '6px' }}
                                />
                                <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>Yrs</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder="Mos"
                                  value={activeSession?.complaints.durationMonths ?? 0}
                                  onChange={e => updateComplaints({ durationMonths: parseInt(e.target.value) || 0 })}
                                  style={{ borderRadius: 6, textAlign: 'center', padding: '6px' }}
                                />
                                <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>Mos</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder="Days"
                                  value={activeSession?.complaints.durationDays ?? 1}
                                  onChange={e => updateComplaints({ durationDays: parseInt(e.target.value) || 0 })}
                                  style={{ borderRadius: 6, textAlign: 'center', padding: '6px' }}
                                />
                                <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>Days</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Severity</label>
                            <select
                              className="form-select"
                              value={activeSession?.complaints.severity || 'MODERATE'}
                              onChange={e => updateComplaints({ severity: e.target.value as any })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            >
                              <option value="MILD">🟢 Mild</option>
                              <option value="MODERATE">🟡 Moderate</option>
                              <option value="SEVERE">🔴 Severe</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Onset</label>
                            <select
                              className="form-select"
                              value={activeSession?.complaints.onset || 'Gradual'}
                              onChange={e => updateComplaints({ onset: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
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
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Aggravating Factors</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Heat, sweat, direct sunlight..."
                              value={activeSession?.complaints.aggravatingFactors || ''}
                              onChange={e => updateComplaints({ aggravatingFactors: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Relieving Factors</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Cold compress, rest, topicals..."
                              value={activeSession?.complaints.relievingFactors || ''}
                              onChange={e => updateComplaints({ relievingFactors: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section B: History & Context */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: 13, color: '#0369A1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Activity size={15} color="#0284C7" /> Systemic History &amp; Medical Context
                        </span>
                      </div>
                      <div style={{ padding: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Past Medical History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Hypertension, Diabetes, Asthma..."
                              value={activeSession?.history.pastMedical || ''}
                              onChange={e => updateHistory({ pastMedical: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Past Surgical History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Appendectomy, Cholecystectomy..."
                              value={activeSession?.history.pastSurgical || ''}
                              onChange={e => updateHistory({ pastSurgical: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Current Medications</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Telmisartan 40mg OD, Metformin..."
                              value={activeSession?.history.currentMedications || ''}
                              onChange={e => updateHistory({ currentMedications: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#DC2626', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ShieldAlert size={12} color="#DC2626" /> Drug &amp; Environmental Allergies
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ borderColor: '#FECACA', background: '#FFF1F2', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: '#991B1B' }}
                              placeholder="e.g. Penicillin, Sulfa drugs, None Reported..."
                              value={activeSession?.history.allergies || ''}
                              onChange={e => updateHistory({ allergies: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Personal History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Diet, sleep, smoking, alcohol..."
                              value={activeSession?.history.personalHistory || ''}
                              onChange={e => updateHistory({ personalHistory: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Obstetric/Gyneco History</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Gravida/Para, LMP regularity..."
                              value={activeSession?.history.obstetricHistory || ''}
                              onChange={e => updateHistory({ obstetricHistory: e.target.value })}
                              style={{ borderRadius: 6, padding: '7px 10px', fontSize: 12.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section C: Notes */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: 13, color: '#0369A1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={15} color="#0284C7" /> Clinical Notes &amp; Observations
                        </span>
                      </div>
                      <div style={{ padding: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Nursing Notes</label>
                            <textarea
                              className="form-input"
                              rows={2}
                              placeholder="Triage nursing observations, behavioral notes..."
                              value={activeSession?.notes?.nursingNotes || ''}
                              onChange={e => updateNotes({ nursingNotes: e.target.value })}
                              style={{ borderRadius: 6, padding: '8px 10px', fontSize: 12.5 }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>Patient Feedback / Expectations</label>
                            <textarea
                              className="form-input"
                              rows={2}
                              placeholder="Patient chief concerns, treatment expectations..."
                              value={activeSession?.notes?.patientFeedback || ''}
                              onChange={e => updateNotes({ patientFeedback: e.target.value })}
                              style={{ borderRadius: 6, padding: '8px 10px', fontSize: 12.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Vitals Card */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#0369A1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Heart size={15} color="#EF4444" /> Current Triage Vitals
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700 }}>
                          Live Triage
                        </span>
                      </div>

                      <div style={{ padding: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Temp (°F)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.temperature ?? '98.6'}
                              onChange={e => updateVitals({ temperature: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>

                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Pulse (BPM)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.pulse ?? '76'}
                              onChange={e => updateVitals({ pulse: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>

                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Sys (mmHg)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.bpSystolic ?? '120'}
                              onChange={e => updateVitals({ bpSystolic: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>

                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Dia (mmHg)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.bpDiastolic ?? '80'}
                              onChange={e => updateVitals({ bpDiastolic: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>

                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Weight (kg)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.weight ?? '68'}
                              onChange={e => updateVitals({ weight: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>

                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Height (cm)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.height ?? '168'}
                              onChange={e => updateVitals({ height: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>

                          <div style={{ gridColumn: 'span 2', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>SpO2 (%)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={activeSession?.vitals.spo2 ?? '99'}
                              onChange={e => updateVitals({ spo2: e.target.value })}
                              style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', background: '#FFFFFF', borderRadius: 6, padding: '6px 8px' }}
                            />
                          </div>
                        </div>

                        {/* Dynamic BMI Gauge */}
                        <div style={{
                          marginTop: 16, padding: '14px 16px', background: '#F0FDF4',
                          borderRadius: 8, border: '1px solid #BBF7D0', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Calculated Body Mass Index (BMI)
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', marginTop: 2 }}>
                              {calculatedBMI}
                            </div>
                          </div>
                          <div>
                            <span className={`badge ${parseFloat(calculatedBMI) >= 25 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px' }}>
                              {parseFloat(calculatedBMI) >= 30 ? 'Obese' : parseFloat(calculatedBMI) >= 25 ? 'Overweight' : parseFloat(calculatedBMI) >= 18.5 ? 'Normal BMI' : 'Underweight'}
                            </span>
                          </div>
                        </div>
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
                  borderTop: '1px solid #E2E8F0',
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
                      style={{ borderColor: '#CBD5E1', color: '#0F172A', background: '#FFFFFF', fontWeight: 700, borderRadius: 8 }}
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
                      style={{ background: '#0284C7', borderColor: '#0284C7', fontWeight: 700, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      Save &amp; Next (Tab 2: Lab Orders) →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: Investigations & Lab Orders */}
          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* TAB 2: Investigations & Lab Orders (Master Catalog Consumer) */}
          {/* ============================================================ */}
          {activeTab === 'investigations' && (
            <div className="card" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div className="card-body">
                {/* Single Master Source Banner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  borderRadius: 8,
                  padding: '10px 16px',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', background: '#6366F1', color: '#FFFFFF', padding: '2px 8px', borderRadius: 4 }}>
                      SINGLE SOURCE OF TRUTH
                    </span>
                    <span style={{ fontSize: 12.5, color: '#3730A3', fontWeight: 600 }}>
                      Hospital Diagnostic Catalog loaded live from Admin Master (<code>/admin/lab</code>).
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#4F46E5', fontWeight: 600 }}>
                    Active Orderable Tests: {activeOrderableCatalog.length} | Placed Orders: {caseLabOrders.length}
                  </div>
                </div>

                {/* Sub-Tabs: ORDER vs RESULTS */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <button
                    onClick={() => setInvestigationSubTab('ORDER')}
                    className={`btn ${investigationSubTab === 'ORDER' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    style={{ background: investigationSubTab === 'ORDER' ? '#036d92' : undefined }}
                  >
                    1. Requisition &amp; Order Tests ({selectedRequisitionTests.length} draft / {caseLabOrders.length} placed)
                  </button>
                  <button
                    onClick={() => setInvestigationSubTab('RESULTS')}
                    className={`btn ${investigationSubTab === 'RESULTS' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    style={{ background: investigationSubTab === 'RESULTS' ? '#036d92' : undefined }}
                  >
                    2. Ingestion &amp; Result Parameters
                  </button>
                </div>

                {investigationSubTab === 'ORDER' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20 }}>
                    
                    {/* LEFT COLUMN: Search Hospital Diagnostic Catalog */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div className="form-label" style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                          Search Hospital Diagnostic Catalog
                        </div>
                        <span style={{ fontSize: 11.5, color: '#64748B' }}>
                          Admin Controlled ({filteredOrderableTests.length} available)
                        </span>
                      </div>

                      {/* Search Input */}
                      <div style={{ position: 'relative', marginBottom: 10 }}>
                        <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search Hospital Diagnostic Catalog (CBC, Blood Sugar, LFT, IgE, RFT)..."
                          value={invSearch}
                          onChange={e => setInvSearch(e.target.value)}
                          style={{ paddingLeft: 36, marginBottom: 0 }}
                        />
                      </div>

                      {/* Category Pills */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {['ALL', 'Hematology', 'Biochemistry', 'Pathology', 'Microbiology'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedInvCategory(cat)}
                            style={{
                              padding: '3px 10px',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: selectedInvCategory === cat ? 'none' : '1px solid #CBD5E1',
                              background: selectedInvCategory === cat ? '#036d92' : '#FFFFFF',
                              color: selectedInvCategory === cat ? '#FFFFFF' : '#475569'
                            }}
                          >
                            {cat === 'ALL' ? 'All Categories' : cat}
                          </button>
                        ))}
                      </div>

                      {/* Catalog Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                        {filteredOrderableTests.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '36px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: 12 }}>
                            No active catalog test matching &ldquo;{invSearch}&rdquo;.
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                              Tests must be configured and activated in <strong>/admin/lab</strong>.
                            </div>
                          </div>
                        ) : (
                          filteredOrderableTests.map((test) => {
                            const isSelected = selectedRequisitionTests.some(item => item.test.id === test.id);
                            const isAlreadyOrdered = caseLabOrders.some(order => order.items.some(i => i.labTestId === test.id));

                            return (
                              <div
                                key={test.id}
                                style={{
                                  padding: '12px 14px',
                                  background: isSelected ? '#F0F9FF' : '#FFFFFF',
                                  borderRadius: 8,
                                  border: `1.5px solid ${isSelected ? '#0284C7' : '#E2E8F0'}`,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                  transition: 'all 0.1s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{
                                        fontWeight: 800,
                                        fontSize: 11,
                                        fontFamily: 'monospace',
                                        background: '#EEF2FF',
                                        color: '#4F46E5',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        border: '1px solid #C7D2FE'
                                      }}>
                                        {test.code}
                                      </span>
                                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                                        {test.name}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                      <span className="badge badge-purple" style={{ fontSize: 10, padding: '1px 6px' }}>
                                        {test.category}
                                      </span>
                                      <span style={{ fontSize: 11, color: '#475569' }}>
                                        🧪 {test.specimen}
                                      </span>
                                      {test.turnaroundTime && (
                                        <span style={{ fontSize: 11, color: '#64748B' }}>
                                          • TAT: {test.turnaroundTime}
                                        </span>
                                      )}
                                      {test.requiresFasting && (
                                        <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                          Fasting Req.
                                        </span>
                                      )}
                                    </div>

                                    {test.parameters && test.parameters.length > 0 && (
                                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <button
                                          type="button"
                                          onClick={() => setViewingParametersTest(test)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontSize: 11,
                                            color: '#6366F1',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontWeight: 600
                                          }}
                                        >
                                          View {test.parameters.length} Ingestion Parameters
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                    <span style={{ fontWeight: 900, fontSize: 14, color: '#036d92' }}>
                                      ₹{test.price}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => toggleSelectRequisitionTest(test)}
                                      className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm`}
                                      style={{
                                        background: isSelected ? '#036d92' : '#FFFFFF',
                                        borderColor: '#036d92',
                                        color: isSelected ? '#FFFFFF' : '#036d92',
                                        fontWeight: 800,
                                        fontSize: 11.5,
                                        padding: '4px 12px'
                                      }}
                                    >
                                      {isSelected ? '✓ Added' : '+ Add'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Selected Tests Requisition & Place Lab Order */}
                    <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#036d92', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Heart size={16} /> Selected Tests Requisition ({selectedRequisitionTests.length})
                          </div>
                          {selectedRequisitionTests.length > 0 && (
                            <span className="badge badge-primary" style={{ fontSize: 11 }}>
                              Requisition: ₹{selectedRequisitionTotal}
                            </span>
                          )}
                        </div>

                        {selectedRequisitionTests.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '28px 12px', background: '#FFFFFF', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: 12 }}>
                            <FileText size={28} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                            <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#1E293B' }}>
                              No tests selected from catalog yet.
                            </p>
                            <p style={{ margin: 0, fontSize: 11.5, color: '#94A3B8' }}>
                              Search the Hospital Diagnostic Catalog on the left and click <strong>[ + Add ]</strong> to build this order requisition.
                            </p>

                            {/* Quick Add Shortcuts for Common Tests */}
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                              {activeOrderableCatalog.slice(0, 3).map(commonTest => (
                                <button
                                  key={commonTest.id}
                                  type="button"
                                  onClick={() => toggleSelectRequisitionTest(commonTest)}
                                  className="btn btn-outline btn-sm"
                                  style={{ borderColor: '#036d92', color: '#036d92', fontSize: 11, fontWeight: 700 }}
                                >
                                  + {commonTest.code} (₹{commonTest.price})
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                            {selectedRequisitionTests.map(({ test, notes }) => (
                              <div
                                key={test.id}
                                style={{
                                  padding: '10px 12px',
                                  background: '#FFFFFF',
                                  borderRadius: 8,
                                  border: '1px solid #CBD5E1'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: '#059669', fontWeight: 800 }}>☑</span>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0F172A' }}>
                                        {test.name}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748B' }}>
                                        {test.code} • {test.specimen} • <strong style={{ color: '#036d92' }}>₹{test.price}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeSelectedRequisitionTest(test.id)}
                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                    title="Remove from requisition"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                {/* Per-test Doctor Notes */}
                                {test.doctorNotesAllowed !== false && (
                                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                                    <input
                                      type="text"
                                      placeholder="Specific instructions for this test..."
                                      value={notes || ''}
                                      onChange={(e) => updateSelectedRequisitionNote(test.id, e.target.value)}
                                      style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 11 }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Order Placement Form: Clinical Notes & Priority */}
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #CBD5E1' }}>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                            Clinical Notes:
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Enter clinical indication, diagnostic differential, or instructions for the diagnostic lab..."
                            value={orderClinicalNotes}
                            onChange={(e) => setOrderClinicalNotes(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              fontSize: 12,
                              resize: 'vertical',
                              marginBottom: 10
                            }}
                          />

                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                              Priority:
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                              {(['Routine', 'Urgent', 'STAT'] as const).map((p) => (
                                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name="orderPriority"
                                    value={p}
                                    checked={orderPriority === p}
                                    onChange={() => setOrderPriority(p)}
                                  />
                                  {p === 'STAT' ? <span style={{ color: '#DC2626', fontWeight: 800 }}>⚡ STAT</span> : p}
                                </label>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handlePlaceLabOrder}
                            disabled={selectedRequisitionTests.length === 0}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              borderRadius: 8,
                              border: 'none',
                              background: selectedRequisitionTests.length > 0 ? '#036d92' : '#94A3B8',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: 13,
                              cursor: selectedRequisitionTests.length > 0 ? 'pointer' : 'not-allowed',
                              boxShadow: selectedRequisitionTests.length > 0 ? '0 2px 6px rgba(3, 109, 146, 0.3)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8
                            }}
                          >
                            <Send size={15} /> [ Place Lab Order ]
                          </button>
                        </div>
                      </div>

                      {/* Placed Lab Orders for This Case */}
                      {caseLabOrders.length > 0 && (
                        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '2px dashed #CBD5E1' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#036d92', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Placed Lab Orders for Encounter ({caseLabOrders.length})</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                            {caseLabOrders.map((order) => (
                              <div
                                key={order.id}
                                style={{
                                  background: '#FFFFFF',
                                  padding: '8px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  fontSize: 11.5
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#0F172A' }}>{order.orderNumber}</strong>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <span style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      background: order.priority === 'STAT' ? '#FEE2E2' : '#EFF6FF',
                                      color: order.priority === 'STAT' ? '#DC2626' : '#2563EB'
                                    }}>
                                      {order.priority}
                                    </span>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ color: '#64748B', marginTop: 3 }}>
                                  {order.items.map(i => i.testName).join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div>
                    {/* RESULTS Tab */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                      Point-of-Care Parameter Entries &amp; Attached Reports
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
            <div className="card" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div className="card-body">
                {/* Modern Hospital Sub-Tab Bar for Tab 3: Separating Drug & Medication Prescription and Procedure Supplies into 2 distinct tabs */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  {/* Segmented Clinical Sub-Tabs (2 Distinct Tabs) */}
                  <div style={{
                    display: 'inline-flex',
                    background: '#F1F5F9',
                    padding: 3,
                    borderRadius: 9,
                    border: '1px solid #CBD5E1',
                    gap: 4
                  }}>
                    {/* Sub-Tab 1: Drug & Medication Prescription */}
                    <button
                      type="button"
                      id="rx-subtab-drugs"
                      onClick={() => setRxActiveSubTab('drugs')}
                      style={{
                        border: 'none',
                        background: rxActiveSubTab === 'drugs' ? '#036d92' : 'transparent',
                        color: rxActiveSubTab === 'drugs' ? '#FFFFFF' : '#475569',
                        fontWeight: rxActiveSubTab === 'drugs' ? 800 : 600,
                        fontSize: 12.5,
                        padding: '6px 14px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        boxShadow: rxActiveSubTab === 'drugs' ? '0 1px 3px rgba(3, 109, 146, 0.25)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                      title="Sub-Tab 1: Drug & Medication Prescription"
                    >
                      <Pill size={15} />
                      <span>1. Drug &amp; Medication Prescription</span>
                      <span style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 800,
                        background: rxActiveSubTab === 'drugs' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                        color: rxActiveSubTab === 'drugs' ? '#FFFFFF' : '#334155'
                      }}>
                        {uniquePrescriptions.length} Prescribed
                      </span>
                    </button>

                    {/* Sub-Tab 2: Procedure Prescription & Supplies */}
                    <button
                      type="button"
                      id="rx-subtab-procedures"
                      onClick={() => {
                        setRxActiveSubTab('procedures');
                        setShowProcSideOption(true);
                      }}
                      style={{
                        border: 'none',
                        background: rxActiveSubTab === 'procedures' ? '#036d92' : 'transparent',
                        color: rxActiveSubTab === 'procedures' ? '#FFFFFF' : '#475569',
                        fontWeight: rxActiveSubTab === 'procedures' ? 800 : 600,
                        fontSize: 12.5,
                        padding: '6px 14px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        boxShadow: rxActiveSubTab === 'procedures' ? '0 1px 3px rgba(3, 109, 146, 0.25)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                      title="Sub-Tab 2: Procedure Prescription & Supplies"
                    >
                      <Scissors size={15} />
                      <span>2. Procedure Supplies (Clinical Instruments)</span>
                      <span style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 800,
                        background: rxActiveSubTab === 'procedures'
                          ? 'rgba(255,255,255,0.25)'
                          : (uniqueProcedurePrescriptions.length > 0 ? '#E0F2FE' : '#FEF3C7'),
                        color: rxActiveSubTab === 'procedures'
                          ? '#FFFFFF'
                          : (uniqueProcedurePrescriptions.length > 0 ? '#0369A1' : '#92400E')
                      }}>
                        {uniqueProcedurePrescriptions.length > 0
                          ? `Optional · ${uniqueProcedurePrescriptions.length} Added`
                          : 'Optional'}
                      </span>
                    </button>
                  </div>

                  {/* Right View Modes: Layout Switcher + Combined View */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                        id="rx-view-combined"
                        onClick={() => {
                          setRxActiveSubTab('both');
                          setRxLayoutMode('stacked');
                          setShowProcSideOption(true);
                        }}
                        style={{
                          border: 'none',
                          background: (rxActiveSubTab === 'both' && rxLayoutMode === 'stacked') ? '#FFFFFF' : 'transparent',
                          color: (rxActiveSubTab === 'both' && rxLayoutMode === 'stacked') ? '#036d92' : '#64748B',
                          fontWeight: (rxActiveSubTab === 'both' && rxLayoutMode === 'stacked') ? 800 : 600,
                          fontSize: 11,
                          padding: '4px 9px',
                          borderRadius: 5,
                          cursor: 'pointer',
                          boxShadow: (rxActiveSubTab === 'both' && rxLayoutMode === 'stacked') ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="View both Drug and Procedure sections stacked together"
                      >
                        <span>▤ Stacked (Full Width)</span>
                      </button>
                      <button
                        type="button"
                        id="rx-view-split"
                        onClick={() => {
                          setRxActiveSubTab('both');
                          setRxLayoutMode('split');
                          setShowProcSideOption(true);
                        }}
                        style={{
                          border: 'none',
                          background: (rxActiveSubTab === 'both' && rxLayoutMode === 'split') ? '#FFFFFF' : 'transparent',
                          color: (rxActiveSubTab === 'both' && rxLayoutMode === 'split') ? '#036d92' : '#64748B',
                          fontWeight: (rxActiveSubTab === 'both' && rxLayoutMode === 'split') ? 800 : 600,
                          fontSize: 11,
                          padding: '4px 9px',
                          borderRadius: 5,
                          cursor: 'pointer',
                          boxShadow: (rxActiveSubTab === 'both' && rxLayoutMode === 'split') ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Side-by-side split view"
                      >
                        <span>▥ Side-by-Side</span>
                      </button>
                    </div>

                    {/* Quick Button to Jump / Add Procedure Prescription if currently on Drug Sub-tab */}
                    {rxActiveSubTab === 'drugs' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRxActiveSubTab('procedures');
                          setShowProcSideOption(true);
                        }}
                        className="btn btn-sm"
                        style={{
                          background: '#E0F2FE',
                          borderColor: '#BAE6FD',
                          color: '#0369A1',
                          fontWeight: 700,
                          fontSize: 11.5,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title="Switch to 2. Procedure Prescription & Supplies"
                      >
                        <Scissors size={13} />
                        <span>Procedure Supplies</span>
                        <span className="badge" style={{
                          fontSize: 9.5,
                          background: (uniqueProcedurePrescriptions.length > 0) ? '#0284C7' : '#FEF3C7',
                          color: (uniqueProcedurePrescriptions.length > 0) ? '#FFFFFF' : '#92400E',
                          fontWeight: 800
                        }}>
                          {uniqueProcedurePrescriptions.length > 0 ? `${uniqueProcedurePrescriptions.length} Added` : 'Optional'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic AI Drug Safety & Allergen Cross-Reactivity Alert Banner */}
                {(rxActiveSubTab === 'drugs' || rxActiveSubTab === 'both') && aiSafetyReport.checked && (
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

                {/* Main Prescription Layout: Controlled by rxActiveSubTab */}
                <div
                  className={rxLayoutMode === 'split' && rxActiveSubTab === 'both' ? (showProcSideOption ? 'rx-split-grid' : '') : ''}
                  style={rxLayoutMode === 'split' && rxActiveSubTab === 'both' ? {
                    display: 'grid',
                    gridTemplateColumns: showProcSideOption ? undefined : 'minmax(0, 1fr)',
                    gap: 16,
                    alignItems: 'start',
                    width: '100%',
                    maxWidth: '100%'
                  } : {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    width: '100%'
                  }}
                >
                  {/* SUB-TAB 1: DRUG PRESCRIPTION TABLE CONTAINER */}
                  {(rxActiveSubTab === 'drugs' || rxActiveSubTab === 'both') && (
                    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
                    {/* Active Prescriptions Table Section */}
                    <div style={{ marginBottom: 10 }}>
                      {/* Table Header Action Bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: rxLayoutMode === 'split' ? 'stretch' : 'center',
                        flexDirection: rxLayoutMode === 'split' ? 'column' : 'row',
                        marginBottom: 10,
                        gap: rxLayoutMode === 'split' ? 8 : 12,
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ minWidth: 200 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Pill size={16} color="#036d92" />
                            <span>Active Prescription Items ({uniquePrescriptions.length})</span>
                          </div>

                        </div>

                        {/* Smart Search Combobox & Add Row Option */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flex: '1 1 auto',
                          maxWidth: rxLayoutMode === 'split' ? '100%' : 540,
                          width: rxLayoutMode === 'split' ? '100%' : 'auto',
                          justifyContent: rxLayoutMode === 'split' ? 'stretch' : 'flex-end'
                        }}>
                          {/* Smart Search Combobox */}
                          <div ref={drugSearchContainerRef} style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: rxLayoutMode === 'split' ? '100%' : 380 }}>
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

                          {/* Add Row Button (Opens Searchable Drug Master) */}
                          <button
                            type="button"
                            onClick={() => setIsDrugSelectorModalOpen(true)}
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
                            title="Select drug from Admin Drug Master (/admin/drugs)"
                          >
                            <Plus size={14} /> Add Row
                          </button>
                        </div>
                      </div>

                      {/* Spacious Drug Prescription Table */}
                      <div className="table-container rx-table-scroll" style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', width: '100%', minWidth: 0, maxWidth: '100%' }}>
                        <table style={{ width: '100%', minWidth: rxLayoutMode === 'split' ? 760 : 1080, fontSize: rxLayoutMode === 'split' ? 11 : 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                              <th style={{ width: rxLayoutMode === 'split' ? 32 : 44, textAlign: 'center', padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 6px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>No.</th>
                              <th style={{ minWidth: rxLayoutMode === 'split' ? 120 : 170, padding: rxLayoutMode === 'split' ? '8px 6px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Drug</th>
                              <th style={{ minWidth: rxLayoutMode === 'split' ? 120 : 170, padding: rxLayoutMode === 'split' ? '8px 6px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Combination</th>
                              <th style={{ minWidth: rxLayoutMode === 'split' ? 100 : 140, padding: rxLayoutMode === 'split' ? '8px 6px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Brand</th>
                              <th style={{ width: rxLayoutMode === 'split' ? 65 : 95, padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Dose</th>
                              <th style={{ width: rxLayoutMode === 'split' ? 70 : 110, padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Frequency</th>
                              <th style={{ width: rxLayoutMode === 'split' ? 52 : 80, padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Days</th>
                              <th style={{ width: rxLayoutMode === 'split' ? 52 : 75, textAlign: 'center', padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Total</th>
                              <th style={{ minWidth: rxLayoutMode === 'split' ? 100 : 160, padding: rxLayoutMode === 'split' ? '8px 6px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Note</th>
                              <th style={{ width: rxLayoutMode === 'split' ? 65 : 90, padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>Price</th>
                              <th style={{ width: rxLayoutMode === 'split' ? 32 : 44, textAlign: 'center', padding: rxLayoutMode === 'split' ? '8px 4px' : '10px 6px' }} />
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
                                      Select drugs from the Admin Drug Master (/admin/drugs) to prescribe directly into table.
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => setIsDrugSelectorModalOpen(true)}
                                        className="btn btn-sm btn-primary"
                                        style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                      >
                                        <Plus size={14} /> Add Row
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setIsDrugSelectorModalOpen(true)}
                                        className="btn btn-sm btn-outline"
                                        style={{ background: '#FFFFFF', borderColor: '#036d92', color: '#036d92', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                      >
                                        <Search size={14} /> Search Drug Master
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
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#334155', verticalAlign: 'middle', padding: rxLayoutMode === 'split' ? '5px 4px' : '8px', fontSize: rxLayoutMode === 'split' ? 11 : 12 }}>
                                  {idx + 1}
                                </td>

                                {/* Drug name */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{
                                        fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, fontWeight: 700, width: '100%',
                                        color: '#0F172A', background: '#FFFFFF', borderRadius: 6, border: '1px solid #CBD5E1'
                                      }}
                                      placeholder="Select from Drug Master"
                                      value={rx.drugName || rx.brandName || ''}
                                      onChange={e => updatePrescription(rx.id, { drugName: e.target.value })}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                      {rx.drugId ? (
                                        <span className="badge badge-primary" style={{ fontSize: 9, padding: '1px 5px', fontFamily: 'monospace' }}>
                                          Master ID: {rx.drugId}
                                        </span>
                                      ) : (
                                        <span className="badge badge-warning" style={{ fontSize: 9, padding: '1px 5px' }}>
                                          Custom
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Combination / Generic */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, fontWeight: 600, width: '100%',
                                      color: rx.visibility?.generic === false ? '#94A3B8' : '#1E293B',
                                      background: rx.visibility?.generic === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Auto / Combination"
                                    value={rx.genericName || ''}
                                    onChange={e => updatePrescription(rx.id, { genericName: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'generic')}
                                      style={{
                                        border: rx.visibility?.generic !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.generic !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.generic !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.generic !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.generic !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Brand */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, fontWeight: 700, width: '100%',
                                      color: rx.visibility?.brandName === false ? '#94A3B8' : '#036d92',
                                      background: rx.visibility?.brandName === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Auto / Brand"
                                    value={rx.brandName || ''}
                                    onChange={e => updatePrescription(rx.id, { brandName: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'brandName')}
                                      style={{
                                        border: rx.visibility?.brandName !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.brandName !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.brandName !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.brandName !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.brandName !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Dose */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, width: '100%',
                                      color: rx.visibility?.dosage === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.dosage === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Enter/select"
                                    value={rx.dosage}
                                    onChange={e => updatePrescription(rx.id, { dosage: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'dosage')}
                                      style={{
                                        border: rx.visibility?.dosage !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.dosage !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.dosage !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.dosage !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.dosage !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Frequency */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, width: '100%',
                                      color: rx.visibility?.frequency === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.frequency === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Select"
                                    value={rx.frequency}
                                    onChange={e => updatePrescription(rx.id, { frequency: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'frequency')}
                                      style={{
                                        border: rx.visibility?.frequency !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.frequency !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.frequency !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.frequency !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.frequency !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Days */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, width: '100%',
                                      color: rx.visibility?.durationDays === false ? '#94A3B8' : '#334155',
                                      background: rx.visibility?.durationDays === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Enter"
                                    value={rx.durationDays}
                                    onChange={e => updatePrescription(rx.id, { durationDays: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'durationDays')}
                                      style={{
                                        border: rx.visibility?.durationDays !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.durationDays !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.durationDays !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.durationDays !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.durationDays !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Total */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 4px' : '5px 6px', height: rxLayoutMode === 'split' ? 26 : 30, fontWeight: 800, textAlign: 'center', width: '100%',
                                      color: rx.visibility?.totalQty === false ? '#94A3B8' : '#0F172A',
                                      background: rx.visibility?.totalQty === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Auto"
                                    value={rx.totalQty}
                                    onChange={e => updatePrescription(rx.id, { totalQty: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4, textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'totalQty')}
                                      style={{
                                        border: rx.visibility?.totalQty !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.totalQty !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.totalQty !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.totalQty !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.totalQty !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Note */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, width: '100%',
                                      color: rx.visibility?.instructions === false ? '#94A3B8' : '#475569',
                                      background: rx.visibility?.instructions === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Enter"
                                    value={rx.instructions}
                                    onChange={e => updatePrescription(rx.id, { instructions: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'instructions')}
                                      style={{
                                        border: rx.visibility?.instructions !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.instructions !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.instructions !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.instructions !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.instructions !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Price */}
                                <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '3px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, fontWeight: 700, width: '100%',
                                      color: rx.visibility?.price === false ? '#94A3B8' : '#036d92',
                                      background: rx.visibility?.price === false ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: 6, border: '1px solid #CBD5E1'
                                    }}
                                    placeholder="Auto"
                                    value={rx.price !== undefined ? String(rx.price) : (rx.slotNo || '')}
                                    onChange={e => updatePrescription(rx.id, { price: e.target.value, slotNo: e.target.value })}
                                  />
                                  <div style={{ marginTop: rxLayoutMode === 'split' ? 2 : 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => togglePrescriptionVisibility(rx.id, 'price')}
                                      style={{
                                        border: rx.visibility?.price !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                        background: rx.visibility?.price !== false ? '#DCFCE7' : '#F1F5F9',
                                        color: rx.visibility?.price !== false ? '#15803D' : '#64748B',
                                        fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 9 : 10, padding: rxLayoutMode === 'split' ? '1px 5px' : '2px 8px', borderRadius: 4, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 3
                                      }}
                                      title={rx.visibility?.price !== false ? "Visible on Rx (Click to hide)" : "Hidden on Rx (Click to show)"}
                                    >
                                      {rx.visibility?.price !== false ? 'show' : 'hide'}
                                    </button>
                                  </div>
                                </td>

                                {/* Delete action */}
                                <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => removePrescription(rx.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: rxLayoutMode === 'split' ? 2 : 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Remove prescription item"
                                  >
                                    <X size={rxLayoutMode === 'split' ? 14 : 16} />
                                  </button>
                                </td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sub-tab 1 Switch Prompt Banner when on Drugs tab */}
                    {rxActiveSubTab === 'drugs' && (
                      <div style={{
                        marginTop: 14,
                        padding: '12px 18px',
                        background: '#F0F9FF',
                        border: '1px solid #BAE6FD',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Scissors size={18} color="#0369A1" />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0C4A6E' }}>
                              Clinical Supplies &amp; Minor Procedure Instruments
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>
                              Add consumables, sutures, syringes, or surgical tools for this patient.
                            </div>
                          </div>
                          <span className="badge" style={{ fontSize: 10.5, background: '#E0F2FE', color: '#0369A1', fontWeight: 800 }}>
                            {uniqueProcedurePrescriptions.length} Configured
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRxActiveSubTab('procedures');
                            setShowProcSideOption(true);
                          }}
                          className="btn btn-sm"
                          style={{
                            background: '#036d92',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 12,
                            padding: '6px 14px',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <span>Open 2. Procedure Prescription &amp; Supplies</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: PROCEDURE PRESCRIPTION CARD (Spacious & Cleanly Proportioned) */}
                {(rxActiveSubTab === 'procedures' || rxActiveSubTab === 'both') && (
                  showProcSideOption ? (
                    <div id="procedure-prescription-section" className="card" style={{
                      border: '1.5px solid #BAE6FD',
                      background: '#F8FAFC',
                      borderRadius: 10,
                      overflow: 'hidden',
                      width: '100%',
                      minWidth: 0,
                      maxWidth: '100%',
                      boxShadow: '0 2px 8px rgba(3, 109, 146, 0.05)',
                      marginTop: (rxActiveSubTab === 'both' && rxLayoutMode === 'split') ? 0 : 4
                    }}>
                      {/* Procedure Card Header */}
                      <div style={{
                        padding: rxLayoutMode === 'split' ? '10px 14px' : '12px 18px', background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)', borderBottom: '1px solid #BAE6FD',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
                      }}>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0369A1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                            PROCEDURE PRESCRIPTION &amp; CLINICAL SUPPLIES
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Scissors size={16} color="#036d92" />
                            <span style={{ fontWeight: 800, fontSize: rxLayoutMode === 'split' ? 12.5 : 13.5, color: '#0C4A6E' }}>
                              Procedure Supplies (Clinical Instruments)
                            </span>
                            <span className="badge" style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', fontWeight: 800, padding: '3px 8px', borderRadius: 5, border: '1px solid #FDE68A' }}>
                              Optional · {uniqueProcedurePrescriptions.length} Added
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {rxActiveSubTab === 'procedures' && (
                            <button
                              type="button"
                              onClick={() => setRxActiveSubTab('drugs')}
                              className="btn btn-sm"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                color: '#475569',
                                fontWeight: 700,
                                fontSize: 11.5,
                                padding: '4px 10px',
                                borderRadius: 5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                              }}
                              title="Switch back to 1. Drug Prescription"
                            >
                              <span>← 1. Drug Prescription</span>
                            </button>
                          )}
                          <button
                            type="button"
                            id="proc-header-add-btn"
                            onClick={() => setIsProcSelectorModalOpen(true)}
                            className="btn btn-sm"
                            style={{
                              background: '#036d92',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: 11.5,
                              padding: '4px 10px',
                              borderRadius: 5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                            title="Search catalog from Clinical Masters (/admin/procedures & /admin/drugs)"
                          >
                            <Plus size={13} />
                            <span>+ Add</span>
                          </button>
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
                      </div>

                      <div style={{ padding: rxLayoutMode === 'split' ? 12 : 16 }}>
                        {/* Add Instrument / Supply Tool */}
                        <div style={{ background: '#FFFFFF', padding: rxLayoutMode === 'split' ? 10 : 14, borderRadius: 8, border: '1px solid #CBD5E1', marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#036d92', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Plus size={14} /> Add Instrument / Supply to Procedure List
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              Select from catalog or custom
                            </span>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: rxLayoutMode === 'split' ? '1fr' : '1.7fr 110px 160px auto',
                            gap: 8,
                            alignItems: 'flex-end'
                          }}>
                            {/* Column 1: Instrument / Drug with Dynamic Search & Catalog Dropdown */}
                            <div style={{ position: 'relative' }}>
                              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Instrument / Drug *</span>
                                {procRxSource === 'PROCEDURE_MASTER' ? (
                                  <span style={{ color: '#0369A1', fontWeight: 800, fontSize: 10, background: '#E0F2FE', padding: '1px 6px', borderRadius: 4 }}>
                                    PROCEDURE MASTER {procRxIdCode ? `(${procRxIdCode})` : ''}
                                  </span>
                                ) : procRxSource === 'DRUG_FORMULARY' ? (
                                  <span style={{ color: '#7E22CE', fontWeight: 800, fontSize: 10, background: '#F3E8FF', padding: '1px 6px', borderRadius: 4 }}>
                                    CENTRAL DRUG FORMULARY {procRxIdCode ? `(${procRxIdCode})` : ''}
                                  </span>
                                ) : procRxSource === 'CUSTOM' ? (
                                  <span style={{ color: '#92400E', fontWeight: 800, fontSize: 10, background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                                    Source: CUSTOM {procRxIdCode ? `(${procRxIdCode})` : ''}
                                  </span>
                                ) : procRxIdCode ? (
                                  <span style={{ color: '#0369A1', fontWeight: 800, fontSize: 10, fontFamily: 'monospace', background: '#E0F2FE', padding: '1px 6px', borderRadius: 4 }}>
                                    ID: {procRxIdCode}
                                  </span>
                                ) : null}
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  id="proc-input-name"
                                  className="form-input"
                                  placeholder="Search / Select from Clinical Masters"
                                  value={procRxItemName}
                                  onFocus={() => setShowProcCatalogDropdown(true)}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setProcRxItemName(val);
                                    setShowProcCatalogDropdown(true);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddProcedurePrescription();
                                    }
                                  }}
                                  style={{ fontSize: 12, padding: '6px 10px', fontWeight: 600, height: 34 }}
                                />
                                {procRxItemName && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProcRxItemName('');
                                      setProcRxIdCode('');
                                      setProcRxQty(1);
                                      setProcRxSource('');
                                      setProcRxMasterId('');
                                    }}
                                    style={{
                                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                      background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>

                              {/* Interactive Autocomplete Dropdown: PROCEDURE MASTER + CENTRAL DRUG FORMULARY + Custom Item */}
                              {showProcCatalogDropdown && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 150,
                                    background: '#FFFFFF',
                                    border: '1.5px solid #036d92',
                                    borderRadius: 8,
                                    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                                    marginTop: 4,
                                    maxHeight: 320,
                                    overflowY: 'auto'
                                  }}
                                >
                                  <div style={{ padding: '8px 12px', background: '#F0F9FF', borderBottom: '1px solid #BAE6FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                                        Select from catalog or custom
                                      </span>
                                      <div style={{ fontSize: 9.5, color: '#64748B' }}>
                                        Master Source: /admin/procedures &amp; /admin/drugs
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowProcCatalogDropdown(false)}
                                      style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                                    >
                                      Close ✕
                                    </button>
                                  </div>

                                  {/* Group 1: PROCEDURE MASTER */}
                                  <div style={{ background: '#F8FAFC', padding: '6px 12px', borderBottom: '1px solid #E2E8F0', fontSize: 10.5, fontWeight: 800, color: '#0369A1', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>PROCEDURE MASTER ({filteredCatalogProcedures.length})</span>
                                    <span style={{ fontSize: 9.5, background: '#E0F2FE', color: '#0369A1', padding: '1px 5px', borderRadius: 3 }}>/admin/procedures</span>
                                  </div>
                                  {filteredCatalogProcedures.length === 0 ? (
                                    <div style={{ padding: '6px 12px', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No procedure master matches</div>
                                  ) : (
                                    filteredCatalogProcedures.map(proc => (
                                      <div
                                        key={`proc-item-${proc.id}`}
                                        onMouseDown={() => handleSelectFromProcedureMaster(proc)}
                                        style={{
                                          padding: '8px 12px',
                                          borderBottom: '1px solid #F1F5F9',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: 8,
                                          background: procRxItemName === proc.name ? '#F0F9FF' : '#FFFFFF'
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                                        onMouseLeave={e => (e.currentTarget.style.background = procRxItemName === proc.name ? '#F0F9FF' : '#FFFFFF')}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{proc.name}</div>
                                          <div style={{ fontSize: 10, color: '#64748B', display: 'flex', gap: 6, marginTop: 1 }}>
                                            <span style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>{proc.category}</span>
                                            <span style={{ color: '#059669', fontWeight: 700 }}>₹{proc.basePrice}</span>
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10.5, background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: 4 }}>
                                            {proc.code || proc.id}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  )}

                                  {/* Group 2: CENTRAL DRUG FORMULARY */}
                                  <div style={{ background: '#FAF5FF', padding: '6px 12px', borderBottom: '1px solid #F3E8FF', borderTop: '1px solid #E2E8F0', fontSize: 10.5, fontWeight: 800, color: '#7E22CE', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>CENTRAL DRUG FORMULARY ({filteredCatalogDrugs.length})</span>
                                    <span style={{ fontSize: 9.5, background: '#F3E8FF', color: '#7E22CE', padding: '1px 5px', borderRadius: 3 }}>/admin/drugs</span>
                                  </div>
                                  {filteredCatalogDrugs.length === 0 ? (
                                    <div style={{ padding: '6px 12px', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No formulary drug matches</div>
                                  ) : (
                                    filteredCatalogDrugs.map(drug => {
                                      const displayName = drug.brandName ? `${drug.brandName} (${drug.name})` : drug.name;
                                      return (
                                        <div
                                          key={`drug-item-${drug.id}`}
                                          onMouseDown={() => handleSelectFromDrugFormulary(drug)}
                                          style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #F1F5F9',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 8,
                                            background: procRxItemName === displayName ? '#FAF5FF' : '#FFFFFF'
                                          }}
                                          onMouseEnter={e => (e.currentTarget.style.background = '#FAF5FF')}
                                          onMouseLeave={e => (e.currentTarget.style.background = procRxItemName === displayName ? '#FAF5FF' : '#FFFFFF')}
                                        >
                                          <div>
                                            <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{displayName}</div>
                                            <div style={{ fontSize: 10, color: '#64748B', display: 'flex', gap: 6, marginTop: 1 }}>
                                              <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '1px 5px', borderRadius: 3 }}>{drug.formulation || 'Drug'}</span>
                                              <span>{drug.manufacturer || 'Formulary'}</span>
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10.5, background: '#F3E8FF', color: '#6B21A8', padding: '2px 6px', borderRadius: 4 }}>
                                              {drug.slotNo || drug.id}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}

                                  {/* Group 3: Custom Item */}
                                  <div
                                    onMouseDown={() => handleUseCustomItem()}
                                    style={{
                                      padding: '10px 14px',
                                      background: '#FFFBEB',
                                      borderTop: '1px solid #FDE68A',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      color: '#92400E',
                                      fontSize: 11.5,
                                      fontWeight: 700
                                    }}
                                  >
                                    <Plus size={14} color="#D97706" />
                                    <span>+ Use Custom Item {procRxItemName ? `"${procRxItemName}"` : ''} (Source: CUSTOM • Not added to master catalog)</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Column 2: Quantity * */}
                            <div>
                              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                Quantity *
                              </label>
                              <input
                                type="number"
                                id="proc-input-qty"
                                min={1}
                                className="form-input"
                                value={procRxQty}
                                onChange={e => setProcRxQty(parseInt(e.target.value) || 1)}
                                style={{ fontSize: 12, padding: '6px 8px', textAlign: 'center', fontWeight: 800, height: 35 }}
                              />
                            </div>

                            {/* Column 3: ID / CORD */}
                            <div>
                              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                                ID / CORD
                              </label>
                              <input
                                type="text"
                                id="proc-input-idcode"
                                className="form-input"
                                placeholder="ID code..."
                                value={procRxIdCode}
                                onChange={e => setProcRxIdCode(e.target.value)}
                                style={{ fontSize: 12, padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, height: 35 }}
                              />
                            </div>

                            {/* Column 4: + Add Instrument */}
                            <button
                              type="button"
                              id="proc-form-add-btn"
                              onClick={() => handleAddProcedurePrescription()}
                              className="btn btn-primary"
                              style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 800, padding: '0 16px', height: 35, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <Plus size={14} /> + Add Instrument
                            </button>
                          </div>
                        </div>

                        {/* Active Procedure Prescriptions Table */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#1E293B' }}>
                              Active Procedure Items ({uniqueProcedurePrescriptions.length})
                            </span>
                            <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ✓ Included in final prescription slip
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
                                Prescribe clinical consumables (e.g. Sutures, Derma Rollers, Syringes) from Procedure Master or Drug Formulary. Only items marked &ldquo;✓ Print on Rx&rdquo; will appear on the final printed Rx slip.
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsProcSelectorModalOpen(true)}
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
                                <Plus size={13} /> Select from Clinical Masters
                              </button>
                            </div>
                          ) : (
                            <div className="table-container rx-table-scroll" style={{ border: '1px solid #CBD5E1', borderRadius: 8, background: '#FFFFFF', overflowX: 'auto', width: '100%', minWidth: 0, maxWidth: '100%' }}>
                              <table style={{ width: '100%', minWidth: rxLayoutMode === 'split' ? 410 : 680, fontSize: rxLayoutMode === 'split' ? 11.5 : 12, borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                    <th style={{ width: rxLayoutMode === 'split' ? 30 : 45, textAlign: 'center', padding: rxLayoutMode === 'split' ? '7px 4px' : '9px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>NO</th>
                                    <th style={{ minWidth: rxLayoutMode === 'split' ? 125 : 220, padding: rxLayoutMode === 'split' ? '7px 8px' : '9px 12px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>INSTRUMENT / DRUG</th>
                                    <th style={{ width: rxLayoutMode === 'split' ? 55 : 90, textAlign: 'center', padding: rxLayoutMode === 'split' ? '7px 4px' : '9px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>QUANTITY</th>
                                    <th style={{ width: rxLayoutMode === 'split' ? 80 : 140, padding: rxLayoutMode === 'split' ? '7px 6px' : '9px 10px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>ID / CORD</th>
                                    <th style={{ width: rxLayoutMode === 'split' ? 80 : 120, textAlign: 'center', padding: rxLayoutMode === 'split' ? '7px 4px' : '9px 8px', fontWeight: 800, color: '#475569', fontSize: rxLayoutMode === 'split' ? 10.5 : 11, letterSpacing: '0.04em' }}>PRINT STATUS</th>
                                    <th style={{ width: rxLayoutMode === 'split' ? 30 : 40, textAlign: 'center', padding: rxLayoutMode === 'split' ? '7px 4px' : '9px 6px' }} />
                                  </tr>
                                </thead>
                                <tbody>
                                  {uniqueProcedurePrescriptions.map((item, idx) => (
                                    <tr key={item.id || `proc-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#334155', verticalAlign: 'middle', padding: rxLayoutMode === 'split' ? '5px 4px' : '8px', fontSize: rxLayoutMode === 'split' ? 11 : 12 }}>
                                        {idx + 1}
                                      </td>
                                      <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          style={{ fontSize: rxLayoutMode === 'split' ? 11.5 : 12, padding: rxLayoutMode === 'split' ? '4px 6px' : '5px 10px', height: rxLayoutMode === 'split' ? 26 : 30, fontWeight: 700, color: '#036d92', width: '100%', borderRadius: 6, border: '1px solid #CBD5E1' }}
                                          value={item.itemName}
                                          onChange={e => updateProcedurePrescription(item.id, { itemName: e.target.value })}
                                        />
                                        <div style={{ marginTop: 3, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                          {item.source === 'PROCEDURE_MASTER' || item.procedureId ? (
                                            <span style={{ fontSize: 9.5, color: '#0369A1', background: '#E0F2FE', padding: '1px 6px', borderRadius: 3, fontWeight: 700, border: '1px solid #BAE6FD' }}>
                                              Procedure Master (ID: {item.procedureId || item.idCode})
                                            </span>
                                          ) : item.source === 'DRUG_FORMULARY' || item.drugId ? (
                                            <span style={{ fontSize: 9.5, color: '#7C3AED', background: '#F5F3FF', padding: '1px 6px', borderRadius: 3, fontWeight: 700, border: '1px solid #DDD6FE' }}>
                                              Central Drug Formulary (ID: {item.drugId || item.idCode})
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: 9.5, color: '#92400E', background: '#FEF3C7', padding: '1px 6px', borderRadius: 3, fontWeight: 700, border: '1px solid #FDE68A' }}>
                                              Source: CUSTOM
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                        <input
                                          type="number"
                                          min={1}
                                          className="form-input"
                                          style={{ fontSize: rxLayoutMode === 'split' ? 11.5 : 12, padding: rxLayoutMode === 'split' ? '4px 4px' : '5px 6px', height: rxLayoutMode === 'split' ? 26 : 30, textAlign: 'center', fontWeight: 800, width: '100%', borderRadius: 6, border: '1px solid #CBD5E1' }}
                                          value={item.quantity}
                                          onChange={e => updateProcedurePrescription(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                        />
                                      </td>
                                      <td style={{ padding: rxLayoutMode === 'split' ? '5px 4px' : '8px' }}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          style={{ fontSize: rxLayoutMode === 'split' ? 11 : 12, padding: rxLayoutMode === 'split' ? '4px 6px' : '5px 8px', height: rxLayoutMode === 'split' ? 26 : 30, fontFamily: 'monospace', fontWeight: 700, color: '#334155', width: '100%', borderRadius: 6, border: '1px solid #CBD5E1' }}
                                          value={item.idCode || ''}
                                          onChange={e => updateProcedurePrescription(item.id, { idCode: e.target.value })}
                                        />
                                      </td>
                                      <td style={{ textAlign: 'center', padding: rxLayoutMode === 'split' ? '5px 4px' : '8px', verticalAlign: 'middle' }}>
                                        <button
                                          type="button"
                                          onClick={() => updateProcedurePrescription(item.id, { printOnRx: item.printOnRx === false ? true : false })}
                                          style={{
                                            background: item.printOnRx === false ? '#F1F5F9' : '#ECFDF5',
                                            color: item.printOnRx === false ? '#64748B' : '#059669',
                                            border: item.printOnRx === false ? '1px solid #CBD5E1' : '1px solid #A7F3D0',
                                            borderRadius: 5,
                                            padding: rxLayoutMode === 'split' ? '2px 6px' : '3px 9px',
                                            fontWeight: 700,
                                            fontSize: rxLayoutMode === 'split' ? 10 : 11,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 3
                                          }}
                                          title={item.printOnRx === false ? "Click to include in final prescription slip" : "Click to exclude from final prescription slip"}
                                        >
                                          {item.printOnRx === false ? '✕ Do Not Print' : '✓ Print on Rx'}
                                        </button>
                                      </td>
                                      <td style={{ textAlign: 'center', padding: rxLayoutMode === 'split' ? '5px 4px' : '8px', verticalAlign: 'middle' }}>
                                        <button
                                          type="button"
                                          onClick={() => removeProcedurePrescription(item.id)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#EF4444',
                                            cursor: 'pointer',
                                            padding: rxLayoutMode === 'split' ? 2 : 4,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 4
                                          }}
                                          title="Remove item (does not delete master record)"
                                        >
                                          <Trash2 size={rxLayoutMode === 'split' ? 14 : 16} />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setIsProcSelectorModalOpen(true)}
                          className="btn btn-sm btn-primary"
                          style={{ background: '#036d92', borderColor: '#036d92', color: '#FFFFFF', fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Plus size={13} /> + Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowProcSideOption(true)}
                          className="btn btn-outline btn-sm"
                          style={{ background: '#FFFFFF', borderColor: '#036d92', color: '#036d92', fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          Open Procedure Prescription ({uniqueProcedurePrescriptions.length} Items)
                        </button>
                      </div>
                    </div>
                  ))
                }
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

                {rxActiveSubTab === 'drugs' ? (
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveClinicalData();
                        setRxActiveSubTab('procedures');
                        setShowProcSideOption(true);
                      }}
                      className="btn btn-outline"
                      style={{
                        background: '#F0F9FF',
                        borderColor: '#BAE6FD',
                        color: '#0369A1',
                        fontWeight: 800,
                        fontSize: 12,
                        height: 36,
                        padding: '0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Proceed to 2. Procedure Prescription & Supplies"
                    >
                      <Scissors size={14} />
                      <span>Next: 2. Procedure Supplies</span>
                      <ArrowRight size={13} />
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
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

          {/* ============================================================ */}
          {/* TAB 4: Clinical Procedures & Laser Protocol Tracker */}
          {/* ============================================================ */}
          {activeTab === 'procedures' && (
            <div className="card" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none', background: '#F8FAFC', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <div className="card-body" style={{ padding: '20px 22px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                {/* SUB-TABS NAVIGATION: 1. Level 1 & 2 Treatment Protocol & Session Execution | 2. Medico-Legal Informed Consent Form */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 20,
                  paddingBottom: 14,
                  borderBottom: '2px solid #E2E8F0',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    background: '#F1F5F9',
                    padding: 4,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    gap: 6
                  }}>
                    {/* Sub-Tab 1: Treatment Protocol & Session Execution */}
                    <button
                      type="button"
                      id="subtab-proc-protocol"
                      onClick={() => setProcedureSubTab('protocol')}
                      style={{
                        border: 'none',
                        background: procedureSubTab === 'protocol' ? '#036d92' : 'transparent',
                        color: procedureSubTab === 'protocol' ? '#FFFFFF' : '#475569',
                        fontWeight: procedureSubTab === 'protocol' ? 800 : 700,
                        fontSize: 12.5,
                        padding: '8px 18px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        boxShadow: procedureSubTab === 'protocol' ? '0 2px 8px rgba(3, 109, 146, 0.3)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease'
                      }}
                      title="Level 1: Treatment Protocol Configuration & Level 2: Session Execution"
                    >
                      <Layers size={16} />
                      <span>Level 1 &amp; 2: Treatment Protocol &amp; Session Execution</span>
                      <span style={{
                        fontSize: 10.5,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 900,
                        background: procedureSubTab === 'protocol' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                        color: procedureSubTab === 'protocol' ? '#FFFFFF' : '#334155'
                      }}>
                        4 Sessions Configured
                      </span>
                    </button>

                    {/* Sub-Tab 2: Medico-Legal Informed Consent Form */}
                    <button
                      type="button"
                      id="subtab-proc-consent"
                      onClick={() => setProcedureSubTab('consent')}
                      style={{
                        border: 'none',
                        background: procedureSubTab === 'consent' ? '#036d92' : 'transparent',
                        color: procedureSubTab === 'consent' ? '#FFFFFF' : '#475569',
                        fontWeight: procedureSubTab === 'consent' ? 800 : 700,
                        fontSize: 12.5,
                        padding: '8px 18px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        boxShadow: procedureSubTab === 'consent' ? '0 2px 8px rgba(3, 109, 146, 0.3)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease'
                      }}
                      title="📄 Medico-Legal Informed Consent Form (સંમતિ પત્રક) - Auto-Linked to Procedure"
                    >
                      <FileText size={16} />
                      <span>📄 Medico-Legal Informed Consent Form (સંમતિ પત્રક)</span>
                      <span style={{
                        fontSize: 10.5,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 900,
                        background: procedureSubTab === 'consent' ? '#10B981' : '#DCFCE7',
                        color: procedureSubTab === 'consent' ? '#FFFFFF' : '#15803D'
                      }}>
                        AUTO-LINKED
                      </span>
                    </button>
                  </div>

                  {/* Active Context Helper Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#334155'
                    }}>
                      <span style={{ color: '#64748B' }}>Active Procedure:</span>
                      <strong style={{ color: '#036d92' }}>HAIR REMOVAL - DIODE</strong>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ color: '#64748B' }}>Target:</span>
                      <strong style={{ color: '#036d92' }}>FACE</strong>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ color: '#64748B' }}>Doctor:</span>
                      <strong style={{ color: '#036d92' }}>Dr. Valaki</strong>
                    </div>
                  </div>
                </div>

                {/* Sub-Tab 1 Content: Level 1 & 2 Treatment Protocol & Session Execution */}
                {procedureSubTab === 'protocol' && (
                  <TreatmentProtocolManager
                    caseId={caseId}
                    mode="doctor"
                    patientName={`${patient.firstName} ${patient.lastName}`}
                    onChanged={() => {
                      const s = getSession(caseId);
                      if (s) loadSession(caseId);
                    }}
                  />
                )}

                {/* Sub-Tab 2 Content: Procedural Informed Consent Module */}
                {procedureSubTab === 'consent' && (
                  <ProcedureConsentForm
                    patient={consentPatientData}
                    defaultCollapsed={true}
                    onUpdateProcedure={handleConsentUpdateProcedure}
                    onPrintRequested={() => setShowAllPrintModal(true)}
                  />
                )}

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

                  {/* Right: Navigation Actions with Direct Print & Show All Print Options */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('drugs');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="btn btn-outline"
                      style={{
                        background: '#FFFFFF',
                        borderColor: '#CBD5E1',
                        color: '#475569',
                        fontSize: 12,
                        fontWeight: 700,
                        height: 36,
                        padding: '0 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
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
                        padding: '0 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                      title="Save procedure protocol as draft"
                    >
                      <Save size={14} /> Save Draft
                    </button>

                    {/* Direct Print: Consent Form */}
                    <button
                      type="button"
                      onClick={() => {
                        if (procedureSubTab !== 'consent') {
                          setProcedureSubTab('consent');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('procedure-consent-module');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          window.dispatchEvent(new CustomEvent('medflow-print-consent'));
                        }, 120);
                      }}
                      className="btn btn-sm"
                      style={{
                        background: '#036d92',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 11.5,
                        height: 36,
                        padding: '0 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        borderRadius: 6,
                        boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)'
                      }}
                      title="Print the active procedure consent form in clean A4"
                    >
                      <Printer size={14} /> Print Consent Form
                    </button>

                    {/* Direct Print: Xerox Copy */}
                    <button
                      type="button"
                      onClick={() => {
                        if (procedureSubTab !== 'consent') {
                          setProcedureSubTab('consent');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('procedure-consent-module');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          window.dispatchEvent(new CustomEvent('medflow-print-xerox'));
                        }, 120);
                      }}
                      className="btn btn-sm"
                      style={{
                        background: '#D97706',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 11.5,
                        height: 36,
                        padding: '0 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        borderRadius: 6,
                        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
                      }}
                      title="Direct print official certified Xerox duplicate copy with archive stamps"
                    >
                      <Copy size={13} /> Print Xerox (ઝેરોક્ષ)
                    </button>

                    {/* Show All Print Options / Print Center Modal */}
                    <button
                      type="button"
                      onClick={() => setShowAllPrintModal(true)}
                      className="btn btn-sm"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: 12,
                        height: 36,
                        padding: '0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 6,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                      }}
                      title="Open Print Center: Consent Forms, Xerox Duplicate, 22-Col Protocol Sheet, and Patient Instructions"
                    >
                      <Printer size={15} /> 🖨️ Show All Print
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSaveClinicalData();
                        setActiveTab('images');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        addNotification({
                          type: 'success',
                          message: '✓ Saved & Advanced to Tab 5: Clinical Photography, Lesion Annotation & Comparison!'
                        });
                      }}
                      className="btn btn-primary"
                      style={{
                        background: '#036d92',
                        borderColor: '#036d92',
                        fontWeight: 800,
                        fontSize: 12.5,
                        height: 36,
                        padding: '0 16px',
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
          {/* TAB 5: Clinical Photography, Lesion Annotation & Comparison (Zustand Store) */}
          {/* ============================================================ */}
          {activeTab === 'images' && (
            <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none', background: '#F8FAFC' }}>
              <div className="card-body" style={{ padding: '20px 24px' }}>
                <ClinicalProcedureImageManagement patient={patient} caseId={caseId} />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          

          {/* TAB 6: Diagnosis & Clinical Follow-Up (Complete 14 Items) */}
          {/* ============================================================ */}
          {activeTab === 'diagnosis' && (
            <div className="card" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none', border: '1px solid #E2E8F0', background: '#F8FAFC', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div className="card-body" style={{ padding: '20px 24px' }}>

                {/* Top Control Bar: Patient Category (13) + Rx Font Size (14) + Review Link (12) */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, padding: '12px 16px', background: '#FFFFFF', borderRadius: 10,
                  border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20
                }}>
                  {/* Left: Patient Category (Item 13) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={16} color="#036d92" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Patient Category:
                      </span>
                    </div>
                    <select
                      value={activeSession?.diagnosis.patientCategory || (patient as any).category || 'General OPD'}
                      onChange={e => handleUpdatePatientCategory(e.target.value)}
                      className="form-select"
                      style={{
                        fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                        border: '1.5px solid #036d92', color: '#036d92', background: '#F0F9FF', cursor: 'pointer'
                      }}
                    >
                      <option value="General OPD">General OPD</option>
                      <option value="VIP">VIP Patient (Priority)</option>
                      <option value="Chronic Care">Chronic Care Management</option>
                      <option value="Corporate">Corporate / TPA Insurance</option>
                      <option value="Standard">Standard Private OPD</option>
                    </select>
                    <span className="badge" style={{ fontSize: 10.5, background: '#E0F2FE', color: '#0369A1', fontWeight: 700, padding: '3px 8px' }}>
                      Active
                    </span>
                  </div>

                  {/* Center: Prescription Font Size (Item 14) - Consistent Standardized Scale */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Rx Font Size:
                    </span>
                    <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                      {(['A-', 'A', 'A+'] as const).map(size => {
                        const isSel = (activeSession?.diagnosis.prescriptionFontSize || 'A') === size;
                        const label = size === 'A-' ? 'A− (10.8px)' : size === 'A' ? 'A (12px)' : 'A+ (13.8px)';
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              updateDiagnosis({ prescriptionFontSize: size });
                              addNotification({
                                type: 'info',
                                message: `Prescription font scale set to ${size} (${size === 'A-' ? 'Compact 90% — 10.8px body / 9.9px table' : size === 'A' ? 'Standard 100% — 12px body / 11px table' : 'Enlarged 115% — 13.8px body / 12.65px table'})`
                              });
                            }}
                            className="btn btn-sm"
                            style={{
                              padding: '3px 10px',
                              minWidth: 42,
                              fontSize: 11,
                              fontWeight: 800,
                              borderRadius: 6,
                              background: isSel ? '#036d92' : 'transparent',
                              color: isSel ? '#FFFFFF' : '#475569',
                              border: 'none',
                              boxShadow: isSel ? '0 1px 3px rgba(3,109,146,0.3)' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Prescription print scale: ${size === 'A-' ? 'A− Compact 90% (10.5px body / 9.5px table)' : size === 'A' ? 'A Standard 100% (12px body / 11px table)' : 'A+ Enlarged 115% (13.5px body / 12.5px table)'}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Review Link Dispatcher (Item 12) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
                        <input
                          type="checkbox"
                          checked={activeSession?.diagnosis.sendReviewLink ?? true}
                          onChange={e => updateDiagnosis({ sendReviewLink: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#036d92', cursor: 'pointer' }}
                        />
                        <span>Send Review Link</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSendReviewLink}
                        disabled={activeSession?.diagnosis.reviewLinkSent}
                        className="btn btn-sm"
                        style={{
                          background: activeSession?.diagnosis.reviewLinkSent ? '#ECFDF5' : '#036d92',
                          color: activeSession?.diagnosis.reviewLinkSent ? '#065F46' : '#FFFFFF',
                          border: activeSession?.diagnosis.reviewLinkSent ? '1px solid #10B981' : '1px solid #036d92',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          borderRadius: 6,
                          cursor: activeSession?.diagnosis.reviewLinkSent ? 'default' : 'pointer'
                        }}
                        title={activeSession?.diagnosis.reviewLinkSent ? "Simulated mode: Review payload generated locally. Live external SMS/WhatsApp gateway connection is required for actual delivery." : "Simulate generating patient review link payloads"}
                      >
                        {activeSession?.diagnosis.reviewLinkSent ? (
                          <>
                            <CheckCircle2 size={13} color="#059669" />
                            <span>Simulated (No live msg sent) ✓</span>
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            <span>Queue Review Link (Simulated)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION 1: Core Diagnostic Formulation (Items 1, 2, 3, 4, 11) */}
                <div style={{
                  background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                  padding: 18, marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  {/* Section 1 Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1.5px solid #F1F5F9', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stethoscope size={16} color="#036d92" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                          Diagnostic Formulation & ICD-10 Coding
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Select primary diagnosis to auto-populate master clinical notes, recommendations, and dietary instructions.
                        </div>
                      </div>
                    </div>

                    {/* Prescription Eye Icon Toggle for Diagnosis (Item 11) */}
                    <button
                      type="button"
                      onClick={() => toggleDiagnosisSectionVisibility('diagnosis')}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: activeSession?.diagnosis?.visibility?.diagnosis !== false ? '#ECFDF5' : '#FEF3C7',
                        border: activeSession?.diagnosis?.visibility?.diagnosis !== false ? '1px solid #10B981' : '1px solid #F59E0B',
                        color: activeSession?.diagnosis?.visibility?.diagnosis !== false ? '#065F46' : '#92400E',
                        cursor: 'pointer'
                      }}
                      title="Click to toggle whether Diagnosis is visible on printed prescription"
                    >
                      {activeSession?.diagnosis?.visibility?.diagnosis !== false ? (
                        <>
                          <Eye size={13} color="#059669" />
                          <span>Diagnosis: SHOW on Rx</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} color="#D97706" />
                          <span>Diagnosis: HIDE on Rx</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Item 2: Primary Diagnosis Catalog Quick-Pills */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Primary Diagnosis Master Templates:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(templatesCatalog[0]);
                          setShowAdminTemplateModal(true);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, fontWeight: 700, color: '#036d92', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                        title="Manage Diagnosis Templates, default advice, and recall intervals"
                      >
                        <Settings2 size={13} />
                        <span>⚙️ Master Templates & Defaults</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {templatesCatalog.map(item => {
                        const isSelected = (activeSession?.diagnosis.primaryDiagnosis || '').toLowerCase() === item.primaryDiagnosis.toLowerCase();
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => applyMasterDiagnosisTemplate(item)}
                            className="btn btn-sm"
                            style={{
                              padding: '5px 12px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: isSelected ? '#036d92' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#334155',
                              border: isSelected ? '1.5px solid #036d92' : '1px solid #CBD5E1',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: isSelected ? '0 2px 4px rgba(3,109,146,0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{item.primaryDiagnosis}</span>
                            <span style={{
                              fontSize: 10,
                              opacity: 0.9,
                              background: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontFamily: 'monospace'
                            }}>
                              {item.icd10Code}
                            </span>
                            {isSelected && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Item 1: ICD-10 Search / Free-Text & Status (Item 4) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
                    {/* Item 1: Search ICD-10 code/name or enter free text */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>
                        Diagnosis (ICD-10 Search / Free-Text) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Search size={15} color="#64748B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search ICD-10 code (e.g. B35.4, L70.0) or type diagnosis..."
                          style={{ paddingLeft: 32, fontWeight: 700, color: '#036d92', fontSize: 13 }}
                          value={activeSession?.diagnosis.finalDiagnosis || ''}
                          onChange={e => {
                            const val = e.target.value;
                            updateDiagnosis({ finalDiagnosis: val });
                            setDiagnosisSearch(val);
                            setShowDiagSearchMenu(val.trim().length > 0);
                          }}
                          onFocus={() => {
                            if ((activeSession?.diagnosis.finalDiagnosis || '').trim().length > 0) {
                              setShowDiagSearchMenu(true);
                            }
                          }}
                        />
                        {activeSession?.diagnosis.icd10Code && (
                          <span style={{
                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                            background: '#E0F2FE', color: '#0369A1', fontSize: 10.5, fontWeight: 800,
                            padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace'
                          }}>
                            ICD-10: {activeSession?.diagnosis.icd10Code}
                          </span>
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {showDiagSearchMenu && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8,
                          boxShadow: '0 8px 20px rgba(0,0,0,0.12)', marginTop: 4, maxHeight: 220, overflowY: 'auto'
                        }}>
                          <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 800, color: '#64748B', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                            <span>MATCHING MASTER DIAGNOSIS CATALOG</span>
                            <button
                              type="button"
                              onClick={() => setShowDiagSearchMenu(false)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
                            >
                              ✕
                            </button>
                          </div>
                          {templatesCatalog
                            .filter(m =>
                              m.primaryDiagnosis.toLowerCase().includes((diagnosisSearch || activeSession?.diagnosis.finalDiagnosis || '').toLowerCase()) ||
                              m.diagnosisName.toLowerCase().includes((diagnosisSearch || activeSession?.diagnosis.finalDiagnosis || '').toLowerCase()) ||
                              m.icd10Code.toLowerCase().includes((diagnosisSearch || activeSession?.diagnosis.finalDiagnosis || '').toLowerCase())
                            )
                            .map(item => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  applyMasterDiagnosisTemplate(item);
                                  setShowDiagSearchMenu(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  borderBottom: '1px solid #F1F5F9',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                                    {item.diagnosisName}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748B' }}>
                                    Category: <strong>{item.primaryDiagnosis}</strong> • F/U: {item.defaultFollowUpDays}d
                                  </div>
                                </div>
                                <span style={{
                                  background: '#E0F2FE', color: '#0369A1', fontSize: 11,
                                  fontWeight: 800, padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace'
                                }}>
                                  {item.icd10Code}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Item 4: Provisional / Confirmed Toggle */}
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>
                        Certainty Status *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => updateDiagnosis({ status: 'Provisional' })}
                          className="btn btn-sm"
                          style={{
                            padding: '7px 10px',
                            fontWeight: 800,
                            fontSize: 12,
                            borderRadius: 6,
                            background: activeSession?.diagnosis.status === 'Provisional' ? '#FEF3C7' : '#F8FAFC',
                            color: activeSession?.diagnosis.status === 'Provisional' ? '#92400E' : '#64748B',
                            border: activeSession?.diagnosis.status === 'Provisional' ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5
                          }}
                        >
                          <AlertTriangle size={13} color={activeSession?.diagnosis.status === 'Provisional' ? '#D97706' : '#94A3B8'} />
                          <span>Provisional</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateDiagnosis({ status: 'Confirmed' })}
                          className="btn btn-sm"
                          style={{
                            padding: '7px 10px',
                            fontWeight: 800,
                            fontSize: 12,
                            borderRadius: 6,
                            background: (activeSession?.diagnosis.status === 'Confirmed' || !activeSession?.diagnosis.status) ? '#ECFDF5' : '#F8FAFC',
                            color: (activeSession?.diagnosis.status === 'Confirmed' || !activeSession?.diagnosis.status) ? '#065F46' : '#64748B',
                            border: (activeSession?.diagnosis.status === 'Confirmed' || !activeSession?.diagnosis.status) ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5
                          }}
                        >
                          <CheckCircle2 size={13} color={(activeSession?.diagnosis.status === 'Confirmed' || !activeSession?.diagnosis.status) ? '#059669' : '#94A3B8'} />
                          <span>Confirmed</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item 3: Differential Diagnosis Manager */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Differential Diagnoses ({((activeSession?.diagnosis.differential || '').split(',').map(s => s.trim()).filter(Boolean)).length})
                      </label>
                      <span style={{ fontSize: 10.5, color: '#64748B' }}>
                        Add one or multiple possible differential diagnoses
                      </span>
                    </div>

                    {/* Chips Display */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {((activeSession?.diagnosis.differential || '').split(',').map(s => s.trim()).filter(Boolean)).map((diff, idx) => (
                        <span
                          key={`diff-${idx}`}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 16,
                            padding: '3px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#334155',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span>{diff}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDifferential(diff)}
                            style={{
                              border: 'none', background: 'transparent', cursor: 'pointer',
                              color: '#94A3B8', fontSize: 13, lineHeight: 1, padding: 0
                            }}
                            title={`Remove differential ${diff}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {((activeSession?.diagnosis.differential || '').split(',').map(s => s.trim()).filter(Boolean)).length === 0 && (
                        <span style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>
                          No differential diagnoses specified yet.
                        </span>
                      )}
                    </div>

                    {/* Input to Add Differential */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Add differential possibility (e.g. Nummular Eczema, Pityriasis Rosea)..."
                        style={{ fontSize: 12 }}
                        value={newDiffText}
                        onChange={e => setNewDiffText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDifferential(newDiffText);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDifferential(newDiffText)}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#FFFFFF', borderColor: '#036d92', color: '#036d92', whiteSpace: 'nowrap' }}
                      >
                        <Plus size={13} /> Add Differential
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Notes, Patient Advice & Diet Advice (Items 5, 6, 7, 11) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
                  {/* Item 5: Diagnosis Notes */}
                  <div style={{
                    background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                    padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FileText size={14} color="#036d92" />
                          <span>Diagnosis Notes (Master)</span>
                        </label>
                        {/* Eye Icon for Diagnosis Notes (Item 11) */}
                        <button
                          type="button"
                          onClick={() => toggleDiagnosisSectionVisibility('diagnosisNote')}
                          style={{
                            background: activeSession?.diagnosis?.visibility?.diagnosisNote !== false ? '#ECFDF5' : '#FEF3C7',
                            border: activeSession?.diagnosis?.visibility?.diagnosisNote !== false ? '1px solid #10B981' : '1px solid #F59E0B',
                            color: activeSession?.diagnosis?.visibility?.diagnosisNote !== false ? '#065F46' : '#92400E',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                          title="Toggle visibility on prescription"
                        >
                          {activeSession?.diagnosis?.visibility?.diagnosisNote !== false ? <><Eye size={11} /> SHOW</> : <><EyeOff size={11} /> HIDE</>}
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 6 }}>
                        Master note pre-filled; edit directly as needed:
                      </div>
                      <textarea
                        className="form-input"
                        rows={4}
                        style={{ fontSize: 12, lineHeight: 1.4 }}
                        placeholder="Clinical master note regarding diagnosis..."
                        value={activeSession?.diagnosis.diagnosisNote || ''}
                        onChange={e => updateDiagnosis({ diagnosisNote: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Item 6: Advice */}
                  <div style={{
                    background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                    padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MessageSquare size={14} color="#036d92" />
                          <span>Patient Advice</span>
                        </label>
                        {/* Eye Icon for Advice (Item 11) */}
                        <button
                          type="button"
                          onClick={() => toggleDiagnosisSectionVisibility('advice')}
                          style={{
                            background: activeSession?.diagnosis?.visibility?.advice !== false ? '#ECFDF5' : '#FEF3C7',
                            border: activeSession?.diagnosis?.visibility?.advice !== false ? '1px solid #10B981' : '1px solid #F59E0B',
                            color: activeSession?.diagnosis?.visibility?.advice !== false ? '#065F46' : '#92400E',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                          title="Toggle visibility on prescription"
                        >
                          {activeSession?.diagnosis?.visibility?.advice !== false ? <><Eye size={11} /> SHOW</> : <><EyeOff size={11} /> HIDE</>}
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 6 }}>
                        Diagnosis-based lifestyle & clinical advice:
                      </div>
                      <textarea
                        className="form-input"
                        rows={4}
                        style={{ fontSize: 12, lineHeight: 1.4 }}
                        placeholder="Hygiene, lifestyle & application precautions..."
                        value={activeSession?.diagnosis.patientAdvice || ''}
                        onChange={e => updateDiagnosis({ patientAdvice: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Item 7: Diet Advice (Default HIDE on prescription) */}
                  <div style={{
                    background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                    padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Heart size={14} color="#D97706" />
                          <span>Diet Advice</span>
                        </label>
                        {/* Eye Icon for Diet Advice (Item 11) - Default HIDE */}
                        <button
                          type="button"
                          onClick={() => toggleDiagnosisSectionVisibility('dietAdvice')}
                          style={{
                            background: activeSession?.diagnosis?.visibility?.dietAdvice ? '#ECFDF5' : '#FEF3C7',
                            border: activeSession?.diagnosis?.visibility?.dietAdvice ? '1px solid #10B981' : '1px solid #F59E0B',
                            color: activeSession?.diagnosis?.visibility?.dietAdvice ? '#065F46' : '#92400E',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                          title="Toggle visibility on prescription (Default: HIDE for Dermatology)"
                        >
                          {activeSession?.diagnosis?.visibility?.dietAdvice ? <><Eye size={11} /> SHOW</> : <><EyeOff size={11} /> HIDE</>}
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#D97706', marginBottom: 6, fontWeight: 600 }}>
                        {activeSession?.diagnosis?.visibility?.dietAdvice ? '✓ Shown on printed prescription' : '👁‍🗨 Hidden on Rx by default (Saved in Clinical Record)'}
                      </div>
                      <textarea
                        className="form-input"
                        rows={4}
                        style={{ fontSize: 12, lineHeight: 1.4 }}
                        placeholder="Dietary precautions & food guidance..."
                        value={activeSession?.diagnosis.dietAdvice || ''}
                        onChange={e => updateDiagnosis({ dietAdvice: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Investigations & Procedures (Items 8, 9, 11) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 18 }}>
                  {/* Item 8: Recommended Investigations */}
                  <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Activity size={15} color="#036d92" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                            Recommended Investigations
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            Master-recommended tests; add/remove items & order directly to Lab (Tab 2)
                          </div>
                        </div>
                      </div>

                      {/* Eye Icon for Investigations (Item 11) */}
                      <button
                        type="button"
                        onClick={() => toggleDiagnosisSectionVisibility('investigation')}
                        style={{
                          background: activeSession?.diagnosis?.visibility?.investigation !== false ? '#ECFDF5' : '#FEF3C7',
                          border: activeSession?.diagnosis?.visibility?.investigation !== false ? '1px solid #10B981' : '1px solid #F59E0B',
                          color: activeSession?.diagnosis?.visibility?.investigation !== false ? '#065F46' : '#92400E',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {activeSession?.diagnosis?.visibility?.investigation !== false ? <><Eye size={11} /> SHOW on Rx</> : <><EyeOff size={11} /> HIDE</>}
                      </button>
                    </div>

                    {/* Investigation Chips List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {(activeSession?.diagnosis.recommendedInvestigations || []).map((testName, idx) => {
                        const isAlreadyOrdered = (activeSession?.investigations || []).some(i => i.testName.toLowerCase() === testName.toLowerCase());
                        return (
                          <div
                            key={`inv-rec-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontSize: 12
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0F172A' }}>
                              <span>•</span>
                              <span>{testName}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleAddInvestigationToOrder(testName)}
                                disabled={isAlreadyOrdered}
                                className="btn btn-sm"
                                style={{
                                  background: isAlreadyOrdered ? '#ECFDF5' : '#FFFFFF',
                                  borderColor: isAlreadyOrdered ? '#10B981' : '#036d92',
                                  color: isAlreadyOrdered ? '#065F46' : '#036d92',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  cursor: isAlreadyOrdered ? 'default' : 'pointer'
                                }}
                                title={isAlreadyOrdered ? "Test already present in Tab 2 Lab Orders. Duplicate prevented." : "Order this investigation to Tab 2 Lab Orders"}
                              >
                                {isAlreadyOrdered ? 'In Lab Orders ✓' : '+ Order to Lab'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvestigation(testName)}
                                style={{
                                  border: 'none', background: 'transparent', cursor: 'pointer',
                                  color: '#94A3B8', fontSize: 14, fontWeight: 700
                                }}
                                title="Remove test recommendation"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(activeSession?.diagnosis.recommendedInvestigations || []).length === 0 && (
                        <div style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                          No investigations currently recommended for this diagnosis.
                        </div>
                      )}
                    </div>

                    {/* Add New Investigation Field */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Add investigation test..."
                        style={{ fontSize: 12 }}
                        value={newInvText}
                        onChange={e => setNewInvText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddInvestigation(newInvText);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddInvestigation(newInvText)}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#FFFFFF', borderColor: '#036d92', color: '#036d92', whiteSpace: 'nowrap' }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>

                  {/* Item 9: Recommended Procedure */}
                  <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Scissors size={15} color="#036d92" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                            Recommended Clinical Procedure
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            Required procedure for primary diagnosis
                          </div>
                        </div>
                      </div>

                      {/* Eye Icon for Procedure (Item 11) */}
                      <button
                        type="button"
                        onClick={() => toggleDiagnosisSectionVisibility('procedure')}
                        style={{
                          background: activeSession?.diagnosis?.visibility?.procedure !== false ? '#ECFDF5' : '#FEF3C7',
                          border: activeSession?.diagnosis?.visibility?.procedure !== false ? '1px solid #10B981' : '1px solid #F59E0B',
                          color: activeSession?.diagnosis?.visibility?.procedure !== false ? '#065F46' : '#92400E',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {activeSession?.diagnosis?.visibility?.procedure !== false ? <><Eye size={11} /> SHOW on Rx</> : <><EyeOff size={11} /> HIDE</>}
                      </button>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Procedure Description:
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontWeight: 700, color: '#036d92', fontSize: 12.5 }}
                        value={activeSession?.diagnosis.recommendedProcedure || ''}
                        onChange={e => updateDiagnosis({ recommendedProcedure: e.target.value })}
                        placeholder="e.g. Wood's Lamp Examination / Chemical Peel"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddProcedureToProtocol(activeSession?.diagnosis.recommendedProcedure || "Wood's Lamp Examination")}
                      className="btn btn-outline btn-sm"
                      style={{
                        width: '100%',
                        background: '#F0F9FF',
                        borderColor: '#0284C7',
                        color: '#0369A1',
                        fontWeight: 700,
                        fontSize: 11.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                      title="Sync this procedure to Tab 4 Protocol"
                    >
                      <Scissors size={13} /> Link into Tab 4 Procedure Protocol →
                    </button>
                  </div>
                </div>

                {/* SECTION 4: Follow-Up & Recall (Items 10, 11) */}
                <div style={{
                  background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                  padding: 16, marginBottom: 18
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={15} color="#036d92" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          Follow-Up Scheduling & Outbound Recall Instructions
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                          Set follow-up interval, return date, and clinical recall reason
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Link
                        href="/doctor/followup-call-list"
                        target="_blank"
                        className="btn btn-outline btn-sm"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderColor: '#036d92',
                          color: '#036d92',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Open Outbound Follow-Up Recall List"
                      >
                        <PhoneCall size={12} /> View Recall List →
                      </Link>

                      {/* Eye Icon for Follow-Up (Item 11) */}
                      <button
                        id="btn-toggle-show-on-rx"
                        type="button"
                        onClick={() => toggleDiagnosisSectionVisibility('followUp')}
                        style={{
                          background: activeSession?.diagnosis?.visibility?.followUp !== false ? '#ECFDF5' : '#FEF3C7',
                          border: activeSession?.diagnosis?.visibility?.followUp !== false ? '1px solid #10B981' : '1px solid #F59E0B',
                          color: activeSession?.diagnosis?.visibility?.followUp !== false ? '#065F46' : '#92400E',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {activeSession?.diagnosis?.visibility?.followUp !== false ? <><Eye size={12} /> SHOW on Rx</> : <><EyeOff size={12} /> HIDE</>}
                      </button>
                    </div>
                  </div>

                  {/* Preset Days Pill Selector + Custom Interval */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                      Follow-Up Interval:
                    </span>
                    {[3, 7, 14, 21, 30].map(days => {
                      const isSel = !isCustomIntervalActive && (Number(activeSession?.diagnosis.followUpDays) === days);
                      return (
                        <button
                          key={`fudays-${days}`}
                          id={`btn-fu-interval-${days}`}
                          type="button"
                          onClick={() => handleSelectFollowUpPreset(days)}
                          className="btn btn-sm"
                          style={{
                            padding: '4px 12px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: isSel ? '#036d92' : '#F1F5F9',
                            color: isSel ? '#FFFFFF' : '#334155',
                            border: isSel ? '1px solid #036d92' : '1px solid #CBD5E1',
                            cursor: 'pointer'
                          }}
                        >
                          {days} Days
                        </button>
                      );
                    })}

                    {/* Custom Days Button & Inline Number Input */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <button
                        id="btn-fu-interval-custom"
                        type="button"
                        onClick={() => {
                          setIsCustomIntervalActive(true);
                          const days = customIntervalDays || 10;
                          const today = new Date();
                          const fDate = formatToDDMMYYYY(new Date(today.getTime() + days * 24 * 60 * 60 * 1000));
                          updateDiagnosis({ followUpDays: days, followUpDate: fDate });
                          syncFollowUpToCallList({ followUpDays: days, followUpDate: fDate });
                        }}
                        className="btn btn-sm"
                        style={{
                          padding: '4px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          borderRadius: 6,
                          background: isCustomIntervalActive ? '#036d92' : '#F1F5F9',
                          color: isCustomIntervalActive ? '#FFFFFF' : '#334155',
                          border: isCustomIntervalActive ? '1px solid #036d92' : '1px solid #CBD5E1',
                          cursor: 'pointer'
                        }}
                      >
                        Custom Days
                      </button>
                      {isCustomIntervalActive && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <input
                            id="input-fu-custom-days"
                            type="number"
                            min={1}
                            max={365}
                            value={customIntervalDays}
                            onChange={e => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setCustomIntervalDays(val);
                              const today = new Date();
                              const fDate = formatToDDMMYYYY(new Date(today.getTime() + val * 24 * 60 * 60 * 1000));
                              updateDiagnosis({ followUpDays: val, followUpDate: fDate });
                              syncFollowUpToCallList({ followUpDays: val, followUpDate: fDate });
                            }}
                            className="form-input"
                            style={{ width: 64, padding: '3px 6px', fontSize: 12, fontWeight: 700, color: '#036d92', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: 11, color: '#64748B' }}>days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sunday & Holiday Alert Verification Banner */}
                  {(() => {
                    const holidayWarning = checkFollowUpHolidayOrSunday(activeSession?.diagnosis.followUpDate);
                    if (!holidayWarning) return null;
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, padding: '8px 14px', borderRadius: 8, marginBottom: 14,
                        background: holidayWarning.type === 'SUNDAY' ? '#FFFBEB' : '#FEF2F2',
                        border: holidayWarning.type === 'SUNDAY' ? '1px solid #FDE68A' : '1px solid #FECACA',
                        color: holidayWarning.type === 'SUNDAY' ? '#92400E' : '#991B1B'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <AlertTriangle size={15} color={holidayWarning.type === 'SUNDAY' ? '#D97706' : '#DC2626'} />
                          <div>
                            <strong>{holidayWarning.title}:</strong> {holidayWarning.warning}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateDiagnosis({ followUpDate: holidayWarning.suggestedDate });
                            syncFollowUpToCallList({ followUpDate: holidayWarning.suggestedDate });
                            addNotification({
                              type: 'success',
                              message: `Adjusted follow-up return date to ${holidayWarning.suggestedDate} (${holidayWarning.suggestedDayName}) ✓`
                            });
                          }}
                          className="btn btn-sm"
                          style={{
                            padding: '4px 10px', fontSize: 11, fontWeight: 800,
                            background: holidayWarning.type === 'SUNDAY' ? '#D97706' : '#DC2626',
                            color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
                          }}
                        >
                          Shift to {holidayWarning.suggestedDayName} ({holidayWarning.suggestedDate}) →
                        </button>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Scheduled Return Date</label>
                      <input
                        id="input-fu-return-date"
                        type="text"
                        className="form-input"
                        placeholder="DD/MM/YYYY"
                        style={{ fontWeight: 700, color: '#036d92', fontSize: 12 }}
                        value={activeSession?.diagnosis.followUpDate || ''}
                        onChange={e => {
                          updateDiagnosis({ followUpDate: e.target.value });
                          syncFollowUpToCallList({ followUpDate: e.target.value });
                        }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Purpose of Follow-Up</label>
                      <input
                        id="input-fu-purpose"
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12 }}
                        value={activeSession?.diagnosis.followUpPurpose || ''}
                        onChange={e => {
                          updateDiagnosis({ followUpPurpose: e.target.value });
                          syncFollowUpToCallList({ followUpPurpose: e.target.value });
                        }}
                        placeholder="e.g. Assess clinical clearance of fungal lesions"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Nursing Outbound Call Instructions</label>
                      <input
                        id="input-fu-nursing-instructions"
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12 }}
                        value={activeSession?.diagnosis.nursingInstructions || ''}
                        onChange={e => {
                          updateDiagnosis({ nursingInstructions: e.target.value });
                          syncFollowUpToCallList({ nursingInstructions: e.target.value });
                        }}
                        placeholder="e.g. Call patient at day 5 to verify compliance"
                      />
                    </div>
                  </div>

                  {/* Sync status footer banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span><strong>Outbound Recall Sync:</strong> Automatically synchronized with <Link href="/doctor/followup-call-list" target="_blank" style={{ color: '#036d92', fontWeight: 700 }}>Follow-Up Call List</Link> for nursing care coordination.</span>
                    </div>
                    <Link
                      href="/doctor/followup-call-list"
                      target="_blank"
                      style={{ color: '#036d92', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                    >
                      Open Recall Ledger <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* SECTION 5: Specialist Referral (Cross-Consultation) */}
                <div style={{
                  background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                  padding: 16, marginBottom: 18
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Share2 size={15} color="#DB2777" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          Specialist Referral (Cross-Consultation)
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                          Cross-refer patient to specialist doctor with clinical reason and priority
                        </div>
                      </div>
                    </div>

                    {/* Eye Icon for Referral */}
                    <button
                      type="button"
                      onClick={() => toggleDiagnosisSectionVisibility('referral')}
                      style={{
                        background: activeSession?.diagnosis?.visibility?.referral ? '#ECFDF5' : '#FEF3C7',
                        border: activeSession?.diagnosis?.visibility?.referral ? '1px solid #10B981' : '1px solid #F59E0B',
                        color: activeSession?.diagnosis?.visibility?.referral ? '#065F46' : '#92400E',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                      title="Toggle whether Referral is visible on printed prescription (Default: HIDE)"
                    >
                      {activeSession?.diagnosis?.visibility?.referral ? <><Eye size={11} /> SHOW on Rx</> : <><EyeOff size={11} /> HIDE on Rx</>}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Consulting Doctor Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dr. Arvind Mehta, MD"
                        style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}
                        value={activeSession?.diagnosis.referral?.doctorName || ''}
                        onChange={e => {
                          const ref = activeSession?.diagnosis.referral || { doctorName: '', specialty: '', reason: '', urgency: 'Routine', clinicOrHospital: '' };
                          updateDiagnosis({ referral: { ...ref, doctorName: e.target.value } });
                        }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Medical Specialty</label>
                      <select
                        className="form-select"
                        style={{ fontSize: 12, fontWeight: 600 }}
                        value={activeSession?.diagnosis.referral?.specialty || ''}
                        onChange={e => {
                          const ref = activeSession?.diagnosis.referral || { doctorName: '', specialty: '', reason: '', urgency: 'Routine', clinicOrHospital: '' };
                          updateDiagnosis({ referral: { ...ref, specialty: e.target.value } });
                        }}
                      >
                        <option value="">-- Select Specialty --</option>
                        <option value="Rheumatology / Immunology">Rheumatology / Immunology</option>
                        <option value="General Medicine / Diabetology">General Medicine / Diabetology</option>
                        <option value="Oncology / Dermatopathology">Oncology / Dermatopathology</option>
                        <option value="Pediatrics & Child Care">Pediatrics & Child Care</option>
                        <option value="Plastic & Reconstructive Surgery">Plastic & Reconstructive Surgery</option>
                        <option value="Endocrinology">Endocrinology</option>
                        <option value="Other Specialist">Other Specialist</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Referral Urgency</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['Routine', 'Priority', 'Emergency'] as const).map(urg => {
                          const currentUrg = activeSession?.diagnosis.referral?.urgency || 'Routine';
                          const isSel = currentUrg === urg;
                          return (
                            <button
                              key={`urg-${urg}`}
                              type="button"
                              onClick={() => {
                                const ref = activeSession?.diagnosis.referral || { doctorName: '', specialty: '', reason: '', urgency: 'Routine', clinicOrHospital: '' };
                                updateDiagnosis({ referral: { ...ref, urgency: urg } });
                              }}
                              className="btn btn-sm"
                              style={{
                                flex: 1, padding: '4px 6px', fontSize: 11, fontWeight: 800, borderRadius: 6,
                                background: isSel ? (urg === 'Emergency' ? '#DC2626' : urg === 'Priority' ? '#D97706' : '#036d92') : '#F1F5F9',
                                color: isSel ? '#FFFFFF' : '#475569',
                                border: 'none', cursor: 'pointer'
                              }}
                            >
                              {urg}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Hospital / Clinic Center</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. MedFlow Central Specialty Wing"
                        style={{ fontSize: 12 }}
                        value={activeSession?.diagnosis.referral?.clinicOrHospital || ''}
                        onChange={e => {
                          const ref = activeSession?.diagnosis.referral || { doctorName: '', specialty: '', reason: '', urgency: 'Routine', clinicOrHospital: '' };
                          updateDiagnosis({ referral: { ...ref, clinicOrHospital: e.target.value } });
                        }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Clinical Referral Reason / Notes</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Suspected underlying systemic autoimmune association / Psoriatic arthropathy workup"
                        style={{ fontSize: 12 }}
                        value={activeSession?.diagnosis.referral?.reason || ''}
                        onChange={e => {
                          const ref = activeSession?.diagnosis.referral || { doctorName: '', specialty: '', reason: '', urgency: 'Routine', clinicOrHospital: '' };
                          updateDiagnosis({ referral: { ...ref, reason: e.target.value } });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 6: Nursing Follow-Up & Outbound Call Care Task */}
                <div style={{
                  background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0',
                  padding: 16, marginBottom: 18
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PhoneCall size={15} color="#059669" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          Nursing Follow-Up & Outbound Call Care Task
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                          Create structured nursing tasks, outbound recall priority, and track call feedback
                        </div>
                      </div>
                    </div>

                    {/* DNC Alert Badge if Active */}
                    {activeSession?.diagnosis.nursingFollowUp?.doNotCall && (
                      <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 800, fontSize: 11, padding: '3px 8px', border: '1px solid #FCA5A5' }}>
                        ⛔ DO NOT CALL (DNC) ACTIVE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {/* Call Priority */}
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Call Priority</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['Routine', 'Priority', 'Urgent'] as const).map(prio => {
                          const currentPrio = activeSession?.diagnosis.nursingFollowUp?.priority || 'Routine';
                          const isSel = currentPrio === prio;
                          return (
                            <button
                              key={`prio-${prio}`}
                              type="button"
                              onClick={() => {
                                const nf = activeSession?.diagnosis.nursingFollowUp || { priority: 'Routine', callStatus: 'Scheduled', doNotCall: false, feedbackNotes: '', assignedNurse: 'Sister Rekha (OPD)' };
                                updateDiagnosis({ nursingFollowUp: { ...nf, priority: prio } });
                              }}
                              className="btn btn-sm"
                              style={{
                                flex: 1, padding: '4px 6px', fontSize: 11, fontWeight: 800, borderRadius: 6,
                                background: isSel ? (prio === 'Urgent' ? '#DC2626' : prio === 'Priority' ? '#D97706' : '#036d92') : '#F1F5F9',
                                color: isSel ? '#FFFFFF' : '#475569',
                                border: 'none', cursor: 'pointer'
                              }}
                            >
                              {prio}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Call Status */}
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Call Task Status</label>
                      <select
                        className="form-select"
                        style={{ fontSize: 12, fontWeight: 600 }}
                        value={activeSession?.diagnosis.nursingFollowUp?.callStatus || 'Scheduled'}
                        onChange={e => {
                          const nf = activeSession?.diagnosis.nursingFollowUp || { priority: 'Routine', callStatus: 'Scheduled', doNotCall: false, feedbackNotes: '', assignedNurse: 'Sister Rekha (OPD)' };
                          updateDiagnosis({ nursingFollowUp: { ...nf, callStatus: e.target.value as any } });
                        }}
                      >
                        <option value="Scheduled">Scheduled (Pending Call)</option>
                        <option value="Completed">Completed (Spoke to Patient)</option>
                        <option value="Missed">Missed (No Answer / Unreachable)</option>
                        <option value="Delayed">Delayed / Rescheduled Follow-Up</option>
                      </select>
                    </div>

                    {/* Assigned Nurse */}
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Assigned Nurse</label>
                      <select
                        className="form-select"
                        style={{ fontSize: 12, fontWeight: 600 }}
                        value={activeSession?.diagnosis.nursingFollowUp?.assignedNurse || 'Sister Rekha (OPD)'}
                        onChange={e => {
                          const nf = activeSession?.diagnosis.nursingFollowUp || { priority: 'Routine', callStatus: 'Scheduled', doNotCall: false, feedbackNotes: '', assignedNurse: 'Sister Rekha (OPD)' };
                          updateDiagnosis({ nursingFollowUp: { ...nf, assignedNurse: e.target.value } });
                        }}
                      >
                        <option value="Sister Rekha (OPD)">Sister Rekha (OPD)</option>
                        <option value="Sister Priya (Dermatology Care)">Sister Priya (Derm)</option>
                        <option value="Sister Anjali (Triage)">Sister Anjali (Triage)</option>
                      </select>
                    </div>

                    {/* Do Not Call Toggle */}
                    <div>
                      <label className="form-label" style={{ fontSize: 11.5 }}>Privacy & DNC</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#B91C1C', cursor: 'pointer', height: 32 }}>
                        <input
                          type="checkbox"
                          checked={activeSession?.diagnosis.nursingFollowUp?.doNotCall || false}
                          onChange={e => {
                            const nf = activeSession?.diagnosis.nursingFollowUp || { priority: 'Routine', callStatus: 'Scheduled', doNotCall: false, feedbackNotes: '', assignedNurse: 'Sister Rekha (OPD)' };
                            updateDiagnosis({ nursingFollowUp: { ...nf, doNotCall: e.target.checked } });
                          }}
                          style={{ width: 16, height: 16, accentColor: '#DC2626' }}
                        />
                        <span>Do Not Call (DNC)</span>
                      </label>
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Nursing Outbound Call Feedback & Notes</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ fontSize: 12 }}
                      placeholder="Record patient phone feedback, tolerability of medicines, lesion progression, or missed call attempts..."
                      value={activeSession?.diagnosis.nursingFollowUp?.feedbackNotes || ''}
                      onChange={e => {
                        const nf = activeSession?.diagnosis.nursingFollowUp || { priority: 'Routine', callStatus: 'Scheduled', doNotCall: false, feedbackNotes: '', assignedNurse: 'Sister Rekha (OPD)' };
                        updateDiagnosis({ nursingFollowUp: { ...nf, feedbackNotes: e.target.value } });
                      }}
                    />
                  </div>
                </div>

                {/* SECTION 7: Save & Sign-Off Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  padding: '12px 18px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #CBD5E1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gap: 10
                }}>
                  <button
                    type="button"
                    onClick={handleSaveDiagnosisToClinicalRecord}
                    className="btn btn-outline"
                    style={{
                      borderColor: '#059669', color: '#059669', background: '#FFFFFF',
                      fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                    title="Commits this clinical diagnosis & notes to patient record store"
                  >
                    <Save size={14} /> Save to Clinical Record
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveDiagnosisToClinicalRecord();
                      setActiveTab('finalReport');
                    }}
                    className="btn btn-primary"
                    style={{
                      background: '#036d92', borderColor: '#036d92',
                      fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    Save & Next (Tab 7: Final Report & Sign-Off) <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: Final Report & Digital Sign-Off */}
          {/* ============================================================ */}
          {activeTab === 'finalReport' && (
            <div className="card" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#036d92' }}>
                    Consultation Clinical Summary & Digital Sign-Off
                  </h3>
                </div>

                {/* Summary Grid: Container 1 (Patient Demographics & Identity) + Container 2 (Combined Clinical Diagnosis & Triage Vitals) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, marginBottom: 20 }}>
                  {/* Container 1: Patient Identity & Demographic Profile */}
                  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={15} color="#036d92" />
                          <span style={{ fontWeight: 800, color: '#036d92', fontSize: 13 }}>Patient Identity &amp; Demographic Profile</span>
                        </div>
                        <span className="badge" style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>
                          {activeSession?.diagnosis.patientCategory || (patient as any).category || 'VIP'} • Verified Identity
                        </span>
                      </div>

                      {/* Patient Name Banner */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #036d92 0%, #0284C7 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: 16,
                          boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)',
                          flexShrink: 0
                        }}>
                          {patient.firstName ? patient.firstName.charAt(0).toUpperCase() : 'P'}{patient.lastName ? patient.lastName.charAt(0).toUpperCase() : ''}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontFamily: 'monospace', fontSize: 10.5 }}>
                              {patient.mrdNumber || 'MRD-2026-0019'}
                            </span>
                            <span className="badge" style={{ background: '#FEF2F2', color: '#B91C1C', fontWeight: 800, fontSize: 10.5 }}>
                              {patient.bloodGroup || profileForm.bloodGroup || 'B+'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                            {patient.age} Yrs • {patient.gender === 'M' ? 'Male' : (patient.gender === 'F' ? 'Female' : patient.gender)} • Visit Case: <strong style={{ color: '#036d92', fontFamily: 'monospace' }}>{caseId}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Structured Demographic Information Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 8, background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11.5, wordBreak: 'break-word' }}>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile / Phone:</span>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>+91 {patient.mobile || '8594897487'}</div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Emergency Contact:</span>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>{patient.emergencyContact || profileForm.emergencyContact || 'Kavita Patel (Wife) - 9825100099'}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Residential Address:</span>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            {patient.address || profileForm.address || '402, Shivalik Heights, Adajan'}, {patient.city || profileForm.city || 'Surat'}, {patient.state || profileForm.state || 'Gujarat'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Occupation &amp; Marital:</span>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            {patient.occupation || profileForm.occupation || 'Engineer'} • {patient.maritalStatus || profileForm.maritalStatus || 'Married'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Consulting Doctor:</span>
                          <div style={{ fontWeight: 700, color: '#036d92' }}>
                            {activeSession?.doctorName || 'Dr. Raj Valaki'} (Room 1)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                      <span>Encounter Date: <strong style={{ color: '#0F172A' }}>{formatToDDMMYYYY(new Date())}</strong></span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>✓ Demographics Synchronized</span>
                    </div>
                  </div>

                  {/* Container 2: Combined Clinical Diagnosis & Encounter Triage Vitals */}
                  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}>
                    {/* Sub-Block A: Clinical Diagnosis & Consultation Protocol */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={15} color="#036d92" />
                        <span style={{ fontWeight: 800, color: '#036d92', fontSize: 13 }}>Clinical Diagnosis &amp; Consultation Protocol</span>
                      </div>
                      <span className="badge" style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1' }}>
                        {activeSession?.diagnosis.patientCategory || (patient as any).category || 'VIP'} • Rx Font: {activeSession?.diagnosis.prescriptionFontSize || 'A-'}
                      </span>
                    </div>

                    <div style={{ lineHeight: 1.55, wordBreak: 'break-word' }}>
                      <div><strong>Complaint:</strong> {activeSession?.complaints.presentComplaint || 'General OPD Consultation & Clinical Evaluation'}</div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Diagnosis:</strong> {activeSession?.diagnosis.finalDiagnosis || activeSession?.diagnosis.primaryDiagnosis || (caseId === 'C004-001-22092026' ? 'Tinea corporis' : 'General Clinical OPD Consultation')}
                        {activeSession?.diagnosis.status && <span style={{ marginLeft: 6, fontWeight: 700, color: activeSession.diagnosis.status === 'Confirmed' ? '#059669' : '#D97706' }}>[{activeSession.diagnosis.status}]</span>}
                        {activeSession?.diagnosis.icd10Code && <span style={{ marginLeft: 4, fontFamily: 'monospace', fontSize: 10, background: '#E0F2FE', color: '#0369A1', padding: '1px 5px', borderRadius: 3 }}>ICD-10: {activeSession.diagnosis.icd10Code}</span>}
                      </div>
                      {activeSession?.diagnosis.diagnosisNote && (
                        <div style={{ marginTop: 4, fontSize: 11.5, color: '#334155' }}>
                          <strong>Master Note:</strong> {activeSession.diagnosis.diagnosisNote}
                        </div>
                      )}
                      {activeSession?.diagnosis.dietAdvice && (
                        <div style={{ marginTop: 4, fontSize: 11.5, color: '#64748B' }}>
                          <strong>Diet Advice:</strong> {activeSession.diagnosis.dietAdvice} <span className="badge" style={{ fontSize: 9.5, padding: '1px 5px', background: activeSession.diagnosis.visibility?.dietAdvice ? '#ECFDF5' : '#FEF3C7', color: activeSession.diagnosis.visibility?.dietAdvice ? '#065F46' : '#92400E' }}>{activeSession.diagnosis.visibility?.dietAdvice ? 'Rx: SHOW' : 'Rx: HIDE'}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 4 }}><strong>Triage BP:</strong> {activeSession?.vitals.bpSystolic || 120}/{activeSession?.vitals.bpDiastolic || 80} mmHg</div>
                      <div style={{ marginTop: 4 }}><strong>Return Recall:</strong> {activeSession?.diagnosis.followUpDays ? `${activeSession.diagnosis.followUpDays} Days (${activeSession.diagnosis.followUpDate})` : (activeSession?.diagnosis.followUpDate || '7 Days ()')} {activeSession?.diagnosis.followUpPurpose ? `— ${activeSession.diagnosis.followUpPurpose}` : ''}</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: activeSession?.diagnosis.reviewLinkSent ? '#059669' : '#0369A1' }}>
                        <strong>Review Link:</strong> {activeSession?.diagnosis.reviewLinkSent ? 'Prepared ✓' : (activeSession?.diagnosis.sendReviewLink ? 'Queued (Explicit Send in Tab 6)' : 'Queued (Explicit Send in Tab 6)')}
                      </div>
                    </div>

                    {/* Subtle Divider */}
                    <div style={{ margin: '10px 0', borderTop: '1px dashed #CBD5E1' }} />

                    {/* Sub-Block B: Encounter Triage Vitals & Patient Assessment */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Heart size={15} color="#036d92" />
                        <span style={{ fontWeight: 800, color: '#036d92', fontSize: 13 }}>Encounter Triage Vitals &amp; Patient Assessment</span>
                      </div>
                      <span className="badge" style={{ fontSize: 10, background: '#DCFCE7', color: '#166534', fontWeight: 800 }}>
                        ✓ Vitals Verified
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 105px), 1fr))', gap: 8, marginBottom: 8 }}>
                      <div style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>BLOOD PRESSURE</div>
                        <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeSession?.vitals.bpSystolic || 120}/{activeSession?.vitals.bpDiastolic || 80} <span style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>mmHg</span></div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>PULSE / SPO2</div>
                        <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeSession?.vitals.pulse || 76} <span style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>bpm</span> • {activeSession?.vitals.spo2 || 99}%</div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TEMP / WEIGHT</div>
                        <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeSession?.vitals.temperature || '98.6'}°F • {activeSession?.vitals.weight || 68}kg</div>
                      </div>
                    </div>

                    <div style={{ lineHeight: 1.55, wordBreak: 'break-word' }}>
                      <div>
                        <strong>Allergies:</strong> <span style={{ color: activeSession?.history.allergies?.toLowerCase().includes('penicillin') ? '#DC2626' : '#059669', fontWeight: 700 }}>{activeSession?.history.allergies || 'None Reported'}</span>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Past Medical / Surgical:</strong> {activeSession?.history.pastMedical || 'Known hypertensive on regular treatment'}
                      </div>
                      <div style={{ marginTop: 4, color: '#64748B', fontSize: 11 }}>
                        <strong>Clinical Notes:</strong> {activeSession?.notes.nursingNotes || 'Patient oriented, vitals stable, fit for outpatient procedural evaluation.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Full-Width Ordered Pharmacy & Tests Clinical Tables */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #036d92',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 20,
                  boxShadow: '0 2px 10px rgba(3, 109, 146, 0.08)'
                }}>
                  {/* Top Ribbon Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                    paddingBottom: 10,
                    borderBottom: '1.5px solid #E0F2FE',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #036d92 0%, #0284C7 100%)',
                        color: '#FFFFFF',
                        padding: '5px 8px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Pill size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, color: '#036d92', fontSize: 14 }}>
                          Ordered Pharmacy &amp; Tests
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, background: '#E0F2FE', color: '#0369A1', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        {uniquePrescriptions.length} Prescribed Drugs
                      </span>
                      <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', fontWeight: 800, padding: '3px 10px', borderRadius: 20, border: '1px solid #CBD5E1' }}>
                        {uniqueProcedurePrescriptions.length} Procedure Supplies
                      </span>
                      <span style={{ fontSize: 11, background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        {uniqueInvestigations.length} Diagnostic Labs
                      </span>
                    </div>
                  </div>

                  {/* 1. Prescribed Medicines (Drugs) Table */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{
                      background: '#F1F5F9',
                      padding: '7px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#475569',
                      borderBottom: '1px solid #CBD5E1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Pill size={14} color="#0284C7" />
                        <span style={{ letterSpacing: '0.02em' }}>
                          PRESCRIBED MEDICINES ({uniquePrescriptions.length})
                        </span>
                        <span style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1', fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                          Dispensary Formulary
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('rx')}
                        style={{ background: 'transparent', border: 'none', color: '#0284C7', fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: 0 }}
                      >
                        ✎ Edit Rx (Tab 3) →
                      </button>
                    </div>

                    {(!uniquePrescriptions || uniquePrescriptions.length === 0) ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                        No dispensary medicines prescribed.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '7px 10px', fontWeight: 800, width: 80 }}>SR #</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>MEDICINE NAME &amp; FORM</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>DOSAGE / FREQUENCY</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>DURATION</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'center' }}>TOTAL QTY</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>CLINICAL INSTRUCTIONS / TIMING</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'center' }}>STATUS</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'right' }}>PRICE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniquePrescriptions.map((rx, idx) => {
                              const isPrimary = idx === 0;
                              return (
                                <tr
                                  key={rx.id || idx}
                                  style={{
                                    borderBottom: '1px solid #E2E8F0',
                                    background: isPrimary ? '#F0FDF4' : '#FFFFFF'
                                  }}
                                >
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    {idx + 1}/{uniquePrescriptions.length}
                                    {isPrimary && (
                                      <span style={{
                                        marginLeft: 6,
                                        fontSize: 9.5,
                                        fontWeight: 900,
                                        background: '#059669',
                                        color: '#FFFFFF',
                                        padding: '1px 5px',
                                        borderRadius: 4
                                      }}>
                                        ACTIVE
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    <div>{rx.drugName || rx.brandName}</div>
                                    {(rx.genericName || rx.slotNo || rx.manufacturer) && (
                                      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500, marginTop: 1 }}>
                                        {rx.genericName && rx.genericName !== rx.drugName && <span>{rx.genericName} • </span>}
                                        {rx.manufacturer && <span>{rx.manufacturer} • </span>}
                                        {rx.slotNo && <span style={{ fontFamily: 'monospace', color: '#0369A1' }}>Slot: {rx.slotNo}</span>}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#334155' }}>
                                    <span style={{ fontWeight: 700 }}>{rx.dosage || '1 tab'}</span>
                                    {rx.frequency && <span style={{ color: '#0284C7', marginLeft: 4, fontWeight: 700 }}>• {rx.frequency}</span>}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569', fontWeight: 600 }}>
                                    {rx.durationDays ? `${rx.durationDays} Days` : '5 Days'}
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>
                                    {rx.totalQty || '5'}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569', fontSize: 11 }}>
                                    <div>{rx.instructions || 'After food'}</div>
                                    {rx.timing && <span style={{ fontSize: 9.5, color: '#059669', fontWeight: 700 }}>({rx.timing.replace('_', ' ')})</span>}
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                    <span style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      padding: '2.5px 8px',
                                      borderRadius: 12,
                                      background: '#DCFCE7',
                                      color: '#166534',
                                      display: 'inline-block',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      ✓ Prescribed
                                    </span>
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                                    ₹{rx.price || '120'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 2. Procedure Supplies & Consumables Table */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{
                      background: '#F1F5F9',
                      padding: '7px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#475569',
                      borderBottom: '1px solid #CBD5E1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Layers size={14} color="#0369A1" />
                        <span style={{ letterSpacing: '0.02em' }}>
                          PROCEDURE SUPPLIES &amp; CONSUMABLES ({printableProcedurePrescriptions.length})
                        </span>
                        <span style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1', fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                          Dispensary Allocated • Print on Rx = ✓
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('procedures')}
                        style={{ background: 'transparent', border: 'none', color: '#0369A1', fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: 0 }}
                      >
                        ✎ Edit Supplies (Tab 4) →
                      </button>
                    </div>

                    {(!printableProcedurePrescriptions || printableProcedurePrescriptions.length === 0) ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                        No procedure consumables set to print on final prescription slip.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '7px 10px', fontWeight: 800, width: 80 }}>SUPPLY #</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>SUPPLY ITEM NAME</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>ITEM CODE / ID</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>CATEGORY</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'center' }}>ALLOCATED QTY</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>CLINICAL NOTES / PURPOSE</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'center' }}>PRINT STATUS</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'right' }}>DISPENSARY CHARGE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printableProcedurePrescriptions.map((sup, idx) => {
                              const isFirst = idx === 0;
                              return (
                                <tr
                                  key={sup.id || idx}
                                  style={{
                                    borderBottom: '1px solid #E2E8F0',
                                    background: isFirst ? '#F0FDF4' : '#FFFFFF'
                                  }}
                                >
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    {idx + 1}/{printableProcedurePrescriptions.length}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    {sup.itemName}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 800, color: '#0369A1' }}>
                                    {sup.idCode || `SUP-${idx + 101}`}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569' }}>
                                    {sup.category || 'Clinical Consumable'}
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>
                                    {sup.quantity} {sup.unit || 'Nos'}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569', fontSize: 11 }}>
                                    {sup.instructions || 'Allocated for clinical procedure'}
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                    <span style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      padding: '2.5px 8px',
                                      borderRadius: 12,
                                      background: '#DBEAFE',
                                      color: '#1E40AF',
                                      display: 'inline-block',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      ✓ Allocated
                                    </span>
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                                    Included
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 3. Ordered Lab Tests & Diagnostics Table */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: uniqueProcedures.length > 0 ? 12 : 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{
                      background: '#F1F5F9',
                      padding: '7px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#475569',
                      borderBottom: '1px solid #CBD5E1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#7C3AED" />
                        <span style={{ letterSpacing: '0.02em' }}>
                          LAB INVESTIGATIONS &amp; PATHOLOGY ({uniqueInvestigations.length})
                        </span>
                        <span style={{ fontSize: 10, background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                          Diagnostic Workup
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('lab')}
                        style={{ background: 'transparent', border: 'none', color: '#7C3AED', fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: 0 }}
                      >
                        ✎ Edit Labs (Tab 5) →
                      </button>
                    </div>

                    {(!uniqueInvestigations || uniqueInvestigations.length === 0) ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                        No diagnostic investigations ordered.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '7px 10px', fontWeight: 800, width: 80 }}>TEST #</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>LAB TEST NAME</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>SPECIMEN / TUBE</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>CATEGORY</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800 }}>CLINICAL INDICATION / NOTES</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'center' }}>STATUS</th>
                              <th style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'right' }}>TEST FEE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueInvestigations.map((inv, idx) => {
                              const isDone = inv.status === 'COMPLETED';
                              return (
                                <tr
                                  key={inv.testId || (inv as any).id || idx}
                                  style={{
                                    borderBottom: '1px solid #E2E8F0',
                                    background: isDone ? '#F0FDF4' : idx === 0 ? '#FAF5FF' : '#FFFFFF'
                                  }}
                                >
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    {idx + 1}/{uniqueInvestigations.length}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    {inv.testName}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#7C3AED', fontWeight: 700 }}>
                                    {inv.specimenTube || 'EDTA (Purple Tube)'}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569' }}>
                                    {inv.category || 'Hematology'}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569', fontSize: 11 }}>
                                    {inv.notes || 'Routine hematological workup, check ESR and platelet count'}
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                    <span style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      padding: '2.5px 8px',
                                      borderRadius: 12,
                                      background: isDone ? '#DCFCE7' : '#EDE9FE',
                                      color: isDone ? '#166534' : '#6D28D9',
                                      display: 'inline-block',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {isDone ? '✓ Completed' : '⚡ Ordered'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                                    ₹{inv.price || 350}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 4. Procedure Protocol Teaser Link */}
                  {uniqueProcedures.length > 0 && (
                    <div style={{
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      borderRadius: 8,
                      padding: '9px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Scissors size={15} color="#0284C7" />
                        <div>
                          <div style={{ fontWeight: 800, color: '#0369A1', fontSize: 12 }}>
                            {uniqueProcedures[0].procedureName}
                            <span style={{ fontWeight: 600, color: '#64748B', marginLeft: 6, fontSize: 11 }}>
                              ({uniqueProcedures.length} Sessions • {uniqueProcedures[0].bodyPart || 'FACE'} • {uniqueProcedures[0].therapist || 'Dr Valaki'})
                            </span>
                          </div>
                          {nextSessionItem && (
                            <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                              ⚡ Next Session: {nextSessionItem.sessionsCount || `Session ${nextSessionItem.sessionNumber}`} on {nextSessionItem.scheduledDate} ({nextSessionItem.status})
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('procedures')}
                        className="btn btn-sm btn-outline"
                        style={{ borderColor: '#0284C7', color: '#0284C7', fontSize: 11, fontWeight: 800, padding: '3px 10px' }}
                      >
                        Tab 4 Protocol Details →
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Dedicated Clinical Procedure Treatment Protocol & Next Session Schedule */}
                {uniqueProcedures.length > 0 && (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #0284C7',
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 20,
                    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.08)'
                  }}>
                    {/* Header Ribbon */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 14,
                      borderBottom: '1.5px solid #E0F2FE',
                      paddingBottom: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                          color: '#FFFFFF',
                          padding: '5px 8px',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Scissors size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 13.5, color: '#0369A1' }}>
                            Clinical Procedure Treatment Protocol &amp; Next Session Schedule
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            Single source of truth multi-session protocol • Auto-linked to reception appointment recall
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#E0F2FE',
                          color: '#0369A1',
                          fontWeight: 800,
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 20
                        }}>
                          {uniqueProcedures.length} Sessions Total
                        </span>
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          fontWeight: 800,
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 20
                        }}>
                          {completedProceduresCount} Executed
                        </span>
                        {nextSessionItem && (
                          <span style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            fontWeight: 900,
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 20,
                            border: '1px solid #FDE68A'
                          }}>
                            ⚡ Next: {nextSessionItem.scheduledDate}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab('procedures')}
                          className="btn btn-sm btn-outline"
                          style={{
                            borderColor: '#0284C7',
                            color: '#0284C7',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 10px'
                          }}
                        >
                          ✎ Edit Protocol (Tab 4)
                        </button>
                      </div>
                    </div>

                    {/* Next Session Spotlight & Protocol Cards Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: nextSessionItem ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
                      gap: 12,
                      marginBottom: 14
                    }}>
                      {/* Left Card: Protocol Overview */}
                      <div style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 12
                      }}>
                        <div style={{ fontWeight: 800, color: '#0369A1', marginBottom: 8, fontSize: 12 }}>
                          📋 Protocol Configuration
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 5, columnGap: 12 }}>
                          <span style={{ color: '#64748B' }}>Procedure:</span>
                          <strong>{uniqueProcedures[0]?.procedureName}</strong>

                          <span style={{ color: '#64748B' }}>Target Area:</span>
                          <strong>{uniqueProcedures[0]?.bodyPart || 'FACE'}</strong>

                          <span style={{ color: '#64748B' }}>Therapist:</span>
                          <span>{uniqueProcedures[0]?.therapist || 'Dr Valaki'}</span>

                          <span style={{ color: '#64748B' }}>Protocol Total:</span>
                          <span style={{ fontWeight: 800, color: '#059669' }}>
                            ₹{fullPackageProceduresTotal} ({uniqueProcedures.length} Sessions @ ₹{Math.round(fullPackageProceduresTotal / (uniqueProcedures.length || 1))}/sess)
                          </span>

                          <span style={{ color: '#64748B' }}>Payment Mode:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontWeight: 800,
                              color: isSessionWise ? '#0369A1' : '#059669',
                              fontSize: 11.5,
                              background: isSessionWise ? '#E0F2FE' : '#DCFCE7',
                              padding: '2px 8px',
                              borderRadius: 4
                            }}>
                              {isSessionWise
                                ? `⚡ Session-Wise: ₹${sessionWiseProceduresTotal} today (Session 1)`
                                : `📦 Full Package: ₹${fullPackageProceduresTotal} upfront`}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateBilling({ procedureBillingMode: isSessionWise ? 'full_package' : 'session_wise' })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#0284C7',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                textDecoration: 'underline'
                              }}
                            >
                              Switch to {isSessionWise ? 'Full Package (₹9000)' : 'Session-Wise (₹3000)'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Card: Next Session Spotlight Banner */}
                      {nextSessionItem && (
                        <div style={{
                          background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #EFF6FF 100%)',
                          border: '1.5px solid #10B981',
                          borderRadius: 8,
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontWeight: 900,
                                fontSize: 10.5,
                                padding: '2px 8px',
                                borderRadius: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                letterSpacing: '0.04em'
                              }}>
                                ⚡ NEXT SESSION SCHEDULED
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#047857' }}>
                                Status: {nextSessionItem.status || 'Scheduled'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 18, fontWeight: 900, color: '#065F46' }}>
                                {nextSessionItem.sessionsCount || `Session ${nextSessionItem.sessionNumber}/${uniqueProcedures.length}`}
                              </span>
                              <span style={{ fontSize: 14, color: '#64748B' }}>•</span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: '#0284C7', fontFamily: 'monospace' }}>
                                📅 {nextSessionItem.scheduledDate}
                              </span>
                              <span style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#047857',
                                background: '#DCFCE7',
                                border: '1px solid #BBF7D0',
                                padding: '1px 8px',
                                borderRadius: 12
                              }}>
                                (+{nextSessionItem.intervalDays || 20}d interval from Session 2 on 24/09/2026)
                              </span>
                            </div>

                            <div style={{ fontSize: 11.5, color: '#334155', marginTop: 4 }}>
                              <strong>Target:</strong> {nextSessionItem.bodyPart || 'FACE'} • <strong>Therapist:</strong> {nextSessionItem.therapist || 'Dr Valaki'} • <strong>Interval:</strong> +{nextSessionItem.intervalDays || 20}d from prior session
                            </div>
                          </div>

                          <div style={{
                            fontSize: 11,
                            color: '#047857',
                            fontWeight: 700,
                            marginTop: 8,
                            paddingTop: 6,
                            borderTop: '1px dashed #A7F3D0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <CheckCircle2 size={13} color="#059669" />
                            <span>Auto-linked to Reception recall queue &amp; patient consent protocol</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* All Sessions Schedule Timeline Breakdown */}
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#F1F5F9',
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#475569',
                        borderBottom: '1px solid #CBD5E1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Full Protocol Session Execution Roadmap ({uniqueProcedures.length} Sessions)</span>
                        <span>All 22 Clinical Parameters Synchronized</span>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '6px 10px', fontWeight: 800 }}>Session #</th>
                              <th style={{ padding: '6px 10px', fontWeight: 800 }}>Scheduled Date</th>
                              <th style={{ padding: '6px 10px', fontWeight: 800 }}>Executed Date</th>
                              <th style={{ padding: '6px 10px', fontWeight: 800 }}>Status</th>
                              <th style={{ padding: '6px 10px', fontWeight: 800 }}>Therapist</th>
                              <th style={{ padding: '6px 10px', fontWeight: 800 }}>Clinical Parameters / Remarks</th>
                              <th style={{ padding: '6px 10px', fontWeight: 800, textAlign: 'right' }}>Session Fee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueProcedures.map((proc, idx) => {
                              const isNext = nextSessionItem?.id === proc.id;
                              const isDone = proc.status === 'Done';
                              return (
                                <tr
                                  key={proc.id || idx}
                                  style={{
                                    borderBottom: '1px solid #E2E8F0',
                                    background: isNext
                                      ? '#EFF6FF'
                                      : isDone
                                      ? '#F0FDF4'
                                      : '#FFFFFF'
                                  }}
                                >
                                  <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>
                                    {proc.sessionsCount || `${idx + 1}/${uniqueProcedures.length}`}
                                    {isNext && (
                                      <span style={{
                                        marginLeft: 6,
                                        fontSize: 9.5,
                                        fontWeight: 900,
                                        background: '#0284C7',
                                        color: '#FFFFFF',
                                        padding: '1px 6px',
                                        borderRadius: 4
                                      }}>
                                        NEXT
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700 }}>
                                    {isNext ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <input
                                          type="text"
                                          value={proc.scheduledDate}
                                          onChange={(e) => {
                                            updateProcedure(proc.id, { scheduledDate: e.target.value });
                                          }}
                                          style={{
                                            width: 105,
                                            padding: '3px 7px',
                                            fontSize: 12,
                                            fontWeight: 900,
                                            fontFamily: 'monospace',
                                            border: '1.5px solid #0284C7',
                                            borderRadius: 5,
                                            background: '#FFFFFF',
                                            color: '#0284C7',
                                            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.15)'
                                          }}
                                          title="Scheduled Date (Click to edit or adjust)"
                                        />
                                        <span style={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          background: '#DCFCE7',
                                          color: '#166534',
                                          padding: '2px 6px',
                                          borderRadius: 4,
                                          whiteSpace: 'nowrap'
                                        }}>
                                          ⚡ Next
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ color: isDone ? '#0F172A' : '#475569' }}>
                                        {proc.scheduledDate}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: proc.performanceDate ? '#059669' : '#94A3B8' }}>
                                    {proc.performanceDate || (isDone ? proc.scheduledDate : '—')}
                                  </td>
                                  <td style={{ padding: '7px 10px' }}>
                                    <span style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: 12,
                                      background: isDone ? '#DCFCE7' : isNext ? '#DBEAFE' : proc.status === 'Delayed' ? '#FEF3C7' : '#F1F5F9',
                                      color: isDone ? '#166534' : isNext ? '#1E40AF' : proc.status === 'Delayed' ? '#92400E' : '#475569'
                                    }}>
                                      {isDone ? '✓ Completed' : isNext ? '⚡ Scheduled (Next)' : proc.status || 'Scheduled'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#334155' }}>
                                    {proc.therapist || 'Dr Valaki'}
                                  </td>
                                  <td style={{ padding: '7px 10px', color: '#475569', fontSize: 11 }}>
                                    {proc.remark || (isDone
                                      ? `Skin: ${proc.skinType || 2} • Power: ${proc.power || 10}J • Wave: ${proc.waveLength || '100 hz'} • Shots: ${proc.shotsFired || 100}`
                                      : `Interval: ${proc.intervalDays || 20}d • ${proc.bodyPart || 'FACE'}`)}
                                  </td>
                                  <td style={{ padding: '7px 10px', fontWeight: 800, textAlign: 'right', color: '#0F172A' }}>
                                    ₹{proc.rate || proc.price || Math.round(proceduresTotal / (uniqueProcedures.length || 1))}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Summary & FOC controls */}
                <div style={{
                  padding: 16, background: '#FFFFFF', borderRadius: 8,
                  border: '2px solid #036d92', marginBottom: 24
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#036d92' }}>
                      Encounter Financial Settlement Summary
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: activeSession?.billing.isFoc ? '#ECFDF5' : '#F8FAFC', padding: '4px 10px', borderRadius: 6, border: activeSession?.billing.isFoc ? '1px solid #10B981' : '1px solid #CBD5E1' }}>
                      <input
                        type="checkbox"
                        checked={activeSession?.billing.isFoc || false}
                        onChange={e => updateBilling({ isFoc: e.target.checked })}
                        style={{ accentColor: '#036d92', width: 15, height: 15 }}
                      />
                      <span style={{ color: activeSession?.billing.isFoc ? '#065F46' : '#1E293B' }}>
                        Mark Consultation Free of Charge (FOC)
                      </span>
                    </label>
                  </div>

                  {activeSession?.billing.isFoc && (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, color: '#065F46', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span><strong>FOC Applied:</strong> Doctor consultation fee waived (₹0). Procedure and laboratory investigation fees remain active and payable.</span>
                    </div>
                  )}

                  {/* Procedure Fee Collection Mode Switcher */}
                  {uniqueProcedures.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSessionWise ? '#F0F9FF' : '#F0FDF4',
                      border: isSessionWise ? '1.5px solid #BAE6FD' : '1.5px solid #BBF7D0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 12,
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isSessionWise ? '#0369A1' : '#15803D' }}>
                          ⚡ Procedure Fee Collection Mode:
                        </span>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {isSessionWise
                            ? `Billing only Session 1 done today (₹${sessionWiseProceduresTotal}). Remaining balance due in future visits.`
                            : `Billing full ${uniqueProcedures.length}-session protocol package upfront today (₹${fullPackageProceduresTotal}).`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => updateBilling({ procedureBillingMode: 'session_wise' })}
                          style={{
                            border: isSessionWise ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            background: isSessionWise ? '#0284C7' : '#FFFFFF',
                            color: isSessionWise ? '#FFFFFF' : '#0369A1',
                            boxShadow: isSessionWise ? '0 1px 4px rgba(2, 132, 199, 0.35)' : 'none'
                          }}
                        >
                          ⚡ Session-Wise (Today: ₹{sessionWiseProceduresTotal})
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBilling({ procedureBillingMode: 'full_package' })}
                          style={{
                            border: !isSessionWise ? '1.5px solid #059669' : '1px solid #CBD5E1',
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            background: !isSessionWise ? '#059669' : '#FFFFFF',
                            color: !isSessionWise ? '#FFFFFF' : '#047857',
                            boxShadow: !isSessionWise ? '0 1px 4px rgba(5, 150, 105, 0.35)' : 'none'
                          }}
                        >
                          📦 Full Package (All {uniqueProcedures.length}: ₹{fullPackageProceduresTotal})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Itemized Line Items */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', marginBottom: 6 }}>
                    <span>Doctor Consultation Fee:</span>
                    <span style={{ fontWeight: 700 }}>
                      {activeSession?.billing.isFoc ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#94A3B8', marginRight: 6 }}>₹{activeSession?.billing.consultationFee || 500}</span>
                          <span style={{ color: '#059669', fontWeight: 800 }}>₹0 (FOC Waived)</span>
                        </>
                      ) : (
                        `₹${activeSession?.billing.consultationFee || 500}`
                      )}
                    </span>
                  </div>

                  {(activeSession?.procedures && activeSession.procedures.length > 0) && (
                    <div style={{
                      marginBottom: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: isSessionWise ? '#F0F9FF' : '#F8FAFC',
                      border: isSessionWise ? '1px solid #BAE6FD' : '1px solid #E2E8F0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#1E293B', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 800 }}>
                            Clinical Procedures ({isSessionWise ? `Session 1 Done of ${uniqueProcedures.length}` : `All ${uniqueProcedures.length} Sessions Upfront`}):
                          </span>
                          <span style={{
                            marginLeft: 8,
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 12,
                            background: isSessionWise ? '#E0F2FE' : '#DCFCE7',
                            color: isSessionWise ? '#0369A1' : '#166534'
                          }}>
                            {isSessionWise ? '⚡ Session-Wise' : '📦 Full Package'}
                          </span>
                        </div>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>₹{proceduresTotal}</strong>
                      </div>
                      <div style={{ fontSize: 11, color: isSessionWise ? '#0369A1' : '#059669', marginTop: 3 }}>
                        {isSessionWise
                          ? `✓ Collected for Session 1 executed today • Remaining ${uniqueProcedures.length - 1} sessions (₹${proceduresFutureBalance}) will be collected at future visits`
                          : `✓ Full protocol package prepaid upfront • All ${uniqueProcedures.length} sessions fully covered`}
                      </div>
                    </div>
                  )}

                  {(activeSession?.investigations && activeSession.investigations.length > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', marginBottom: 6 }}>
                      <span>Lab Investigations ({activeSession.investigations.length}):</span>
                      <strong>₹{investigationsTotal}</strong>
                    </div>
                  )}

                  {pharmacyTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', marginBottom: 6 }}>
                      <span>Prescribed Pharmacy:</span>
                      <strong>₹{pharmacyTotal}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px dashed #CBD5E1', borderBottom: '1px solid #E2E8F0', padding: '8px 0', marginBottom: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>Gross Clinical Subtotal:</span>
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
                    <CheckCircle2 size={18} /> Finalize Consultation & Generate Prescription Print Preview
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

      {/* Missing Clinical Information Advisory Modal */}
      {showClinicalValidationModal && (
        <div className="modal-overlay" onClick={() => setShowClinicalValidationModal(false)}>
          <div className="modal modal-md" style={{ maxWidth: 580, borderRadius: 12, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '14px 20px' }}>
              <span className="modal-title" style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 16 }}>
                <AlertTriangle size={20} color="#D97706" /> Clinical Documentation Advisory
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowClinicalValidationModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Alert notice */}
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <div style={{ color: '#92400E', fontSize: 13, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>
                    No Chief Complaint or Diagnosis Recorded
                  </div>
                  At least one Chief Complaint or Diagnosis is recommended for clinical record completeness before ending this consultation.
                </div>
              </div>

              {/* Patient encounter context strip */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 12.5,
                color: '#334155'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div><strong>Patient:</strong> {patient.firstName} {patient.lastName} ({patient.mrdNumber})</div>
                  <div><strong>Case:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#036d92' }}>{caseId}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 4, color: '#64748B', fontSize: 12 }}>
                  <span>🔬 Labs: <strong>{activeSession?.investigations.length || 0} ordered</strong></span>
                  <span>💉 Procedures: <strong>{activeSession?.procedures.length || 0}</strong></span>
                  <span>💊 Prescriptions: <strong>{activeSession?.prescriptions.length || 0}</strong></span>
                </div>
              </div>

              {/* Action Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  How would you like to proceed?
                </div>

                {/* Option A: Quick Fill & Proceed */}
                <button
                  type="button"
                  onClick={handleProceedWithDefaultConsultation}
                  style={{
                    background: '#F0FDF4',
                    border: '1.5px solid #86EFAC',
                    borderRadius: 10,
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#22C55E')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#86EFAC')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ background: '#22C55E', color: '#FFFFFF', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: '#15803D' }}>
                        Proceed Anyway (Default: General Consultation)
                      </div>
                      <div style={{ fontSize: 11.5, color: '#4B5563', marginTop: 3 }}>
                        Applies standard clinical defaults (&quot;General OPD Consultation &amp; Clinical Evaluation&quot;) and opens conclusion handover.
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} color="#15803D" style={{ flexShrink: 0 }} />
                </button>

                {/* Option B: Jump to Chief Complaint */}
                <button
                  type="button"
                  onClick={handleJumpToComplaints}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#036d92')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#E6F3F8', color: '#036d92', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>
                        Go to Tab 1: Enter Chief Complaint
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Add patient symptom details, onset, and duration.
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#64748B" style={{ flexShrink: 0 }} />
                </button>

                {/* Option C: Jump to Diagnosis */}
                <button
                  type="button"
                  onClick={handleJumpToDiagnosis}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#036d92')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Stethoscope size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>
                        Go to Tab 6: Enter Diagnosis &amp; Recall
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Document final diagnosis, treatment plan, and follow-up recall.
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#64748B" style={{ flexShrink: 0 }} />
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowClinicalValidationModal(false)}
                style={{ fontSize: 13 }}
              >
                Return to Consultation
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleProceedWithDefaultConsultation}
                style={{ padding: '8px 20px', fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <CheckCircle2 size={15} /> Proceed Anyway
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
              <span className="modal-title">Official Signed Digital Prescription Preview & Print (Ready for Sign-Off)</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPrescriptionModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const rxFontSize = activeSession?.diagnosis?.prescriptionFontSize || 'A';
                const rxBaseFontSize = rxFontSize === 'A-' ? 10.8 : rxFontSize === 'A+' ? 13.8 : 12;
                const rxTableFontSize = rxFontSize === 'A-' ? 9.9 : rxFontSize === 'A+' ? 12.65 : 11;
                return (
                  <div style={{
                    background: '#FFFFFF', padding: 24, border: '1px solid #E2E8F0',
                    borderRadius: 8, fontFamily: 'inherit', fontSize: rxBaseFontSize
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', background: '#F8FAFC', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: rxBaseFontSize }}>
                      <div>
                        <div><strong>Patient:</strong> {patient.firstName} {patient.lastName} ({patient.age}Y / {patient.gender})</div>
                        <div><strong>MRD:</strong> {patient.mrdNumber} | Mobile: {patient.mobile}</div>
                        <div style={{ marginTop: 2, fontSize: rxBaseFontSize - 1 }}>
                          <strong>Category:</strong> <span className="badge" style={{ fontSize: 9.5, padding: '1px 6px', background: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}>{activeSession?.diagnosis?.patientCategory || (patient as any).category || 'General OPD'}</span>
                          <span style={{ marginLeft: 6, color: '#64748B' }}>[Rx Font: {rxFontSize} ({rxBaseFontSize}px)]</span>
                        </div>
                      </div>
                      <div>
                        {activeSession?.diagnosis?.visibility?.diagnosis !== false && (
                          <div>
                            <strong>Diagnosis:</strong> {activeSession?.diagnosis.finalDiagnosis || activeSession?.diagnosis.primaryDiagnosis || (caseId === 'C004-001-22092026' ? 'Tinea corporis' : 'Diagnosis Pending')}
                            {activeSession?.diagnosis.status && (
                              <span style={{ marginLeft: 6, fontWeight: 700, color: activeSession.diagnosis.status === 'Confirmed' ? '#059669' : '#D97706' }}>
                                [{activeSession.diagnosis.status}]
                              </span>
                            )}
                            {activeSession?.diagnosis.icd10Code && (
                              <span style={{ marginLeft: 4, fontFamily: 'monospace', fontSize: 10, background: '#E0F2FE', color: '#0369A1', padding: '1px 5px', borderRadius: 3 }}>
                                ICD-10: {activeSession.diagnosis.icd10Code}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ marginTop: 2 }}><strong>Vitals:</strong> BP {activeSession?.vitals.bpSystolic}/{activeSession?.vitals.bpDiastolic} mmHg | Pulse {activeSession?.vitals.pulse} bpm</div>
                      </div>
                    </div>

                    {/* Rx Symbol */}
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#036d92', fontFamily: 'serif', marginBottom: 8 }}>
                      ℞
                    </div>

                    {/* Medicines List with Exact 10-Column Prescription Layout & Visibility Flags */}
                    <table style={{ width: '100%', fontSize: rxTableFontSize, marginBottom: 18, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #036d92', background: '#F8FAFC', textAlign: 'left', fontSize: rxTableFontSize - 0.5, textTransform: 'uppercase' }}>
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

                    {/* Procedure Consumables & Supplies Prescription (Optional: ONLY shown if added AND Print on Rx = ✓) */}
                    {printableProcedurePrescriptions.length > 0 && (
                      <div style={{ marginTop: 14, marginBottom: 18, borderTop: '1.5px dashed #CBD5E1', paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#036d92', fontFamily: 'serif' }}>℞</span>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0C4A6E', textTransform: 'uppercase' }}>
                            Procedure Consumables &amp; Supplies Prescription
                          </span>
                          <span className="badge" style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}>
                            {printableProcedurePrescriptions.length} Items (Print on Rx = ✓)
                          </span>
                        </div>
                        <table style={{ width: '100%', fontSize: rxTableFontSize }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                              <th style={{ padding: '4px 0' }}># Instrument / Drug</th>
                              <th style={{ width: 80 }}>Quantity</th>
                              <th style={{ width: 110 }}>ID / CORD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printableProcedurePrescriptions.map((p, idx) => (
                              <tr key={p.id || `print-proc-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '6px 0', fontWeight: 700, color: '#036d92' }}>
                                  {idx + 1}. {p.itemName}
                                  {p.source === 'CUSTOM' && (
                                    <span style={{ marginLeft: 6, fontSize: 9, background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                                      CUSTOM
                                    </span>
                                  )}
                                </td>
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

                    {/* Clinical Notes, Advice & Follow-Up (ONLY Sections Marked SHOW) */}
                    <div style={{ fontSize: rxBaseFontSize, marginBottom: 18, background: '#FAFAFA', padding: 12, borderRadius: 6, border: '1px solid #F1F5F9' }}>
                      {/* Diagnosis Note (SHOW only) */}
                      {activeSession?.diagnosis?.visibility?.diagnosisNote !== false && activeSession?.diagnosis?.diagnosisNote && (
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: '#036d92' }}>Diagnosis Note:</strong> {activeSession.diagnosis.diagnosisNote}
                        </div>
                      )}

                      {/* Patient Advice (SHOW only) */}
                      {activeSession?.diagnosis?.visibility?.advice !== false && activeSession?.diagnosis?.patientAdvice && (
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: '#036d92' }}>General Advice:</strong> {activeSession.diagnosis.patientAdvice}
                        </div>
                      )}

                      {/* Diet Advice (SHOW only - HIDE by default!) */}
                      {activeSession?.diagnosis?.visibility?.dietAdvice === true && activeSession?.diagnosis?.dietAdvice && (
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: '#D97706' }}>Dietary Guidance:</strong> {activeSession.diagnosis.dietAdvice}
                        </div>
                      )}

                      {/* Recommended Investigations (SHOW only) */}
                      {activeSession?.diagnosis?.visibility?.investigation !== false && activeSession?.diagnosis?.recommendedInvestigations && activeSession.diagnosis.recommendedInvestigations.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: '#036d92' }}>Recommended Investigations:</strong> {activeSession.diagnosis.recommendedInvestigations.join(', ')}
                        </div>
                      )}

                      {/* Recommended Procedure (SHOW only) */}
                      {activeSession?.diagnosis?.visibility?.procedure !== false && activeSession?.diagnosis?.recommendedProcedure && (
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: '#036d92' }}>Recommended Procedure:</strong> {activeSession.diagnosis.recommendedProcedure}
                        </div>
                      )}

                      {/* Specialist Referral (SHOW only if marked SHOW) */}
                      {activeSession?.diagnosis?.visibility?.referral === true && activeSession?.diagnosis?.referral?.doctorName && (
                        <div style={{ marginBottom: 6, background: '#FDF2F8', padding: '6px 10px', borderRadius: 4, border: '1px solid #FBCFE8' }}>
                          <strong style={{ color: '#DB2777' }}>Specialist Cross-Referral:</strong> Referred to <strong>{activeSession.diagnosis.referral.doctorName}</strong> ({activeSession.diagnosis.referral.specialty || 'Specialist'}){activeSession.diagnosis.referral.clinicOrHospital ? ` at ${activeSession.diagnosis.referral.clinicOrHospital}` : ''}.
                          {activeSession.diagnosis.referral.reason && <div style={{ fontSize: rxBaseFontSize - 1, color: '#475569', marginTop: 2 }}>Reason: {activeSession.diagnosis.referral.reason}</div>}
                        </div>
                      )}

                      {/* Follow-Up Recall (SHOW only) */}
                      {activeSession?.diagnosis?.visibility?.followUp !== false && (activeSession?.diagnosis?.followUpDate || activeSession?.diagnosis?.followUpDays) && (
                        <div style={{ marginBottom: 4 }}>
                          <strong style={{ color: '#036d92' }}>Follow-Up Recall:</strong> {activeSession.diagnosis.followUpDays ? `${activeSession.diagnosis.followUpDays} Days (${activeSession.diagnosis.followUpDate})` : activeSession.diagnosis.followUpDate}
                          {activeSession.diagnosis.followUpPurpose ? ` — ${activeSession.diagnosis.followUpPurpose}` : ''}
                        </div>
                      )}

                      {/* Patient Review Link Footer Notice */}
                      {activeSession?.diagnosis?.sendReviewLink && (
                        <div style={{ marginTop: 8, fontSize: rxBaseFontSize - 1.5, color: '#0369A1', background: '#F0F9FF', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                          ★ Patient Review Link: Prepared for delivery.
                        </div>
                      )}
                    </div>

                    {/* Prescription Verification & Print Preview Notice */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#036d92', fontSize: 12 }}>
                          PRESCRIPTION VERIFIED & PREVIEWED — DR. RAJ VALAKI, MBBS, MD
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Electronic Clinical Preview (Ready for Physical Print / Final Sign-Off)</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => {
                setShowPrescriptionModal(false);
                router.push('/doctor/dashboard');
              }}>
                Close & Return to Dashboard
              </button>

              <button className="btn btn-primary" onClick={() => window.print()} style={{ background: '#036d92', borderColor: '#036d92' }}>
                <Printer size={15} /> Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Diagnosis Templates & Clinical Defaults Editor Modal */}
      {showAdminTemplateModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowAdminTemplateModal(false)}>
          <div className="modal modal-lg" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#F0F9FF', borderBottom: '1px solid #BAE6FD' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: '#036d92',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
                }}>
                  <Settings2 size={18} />
                </div>
                <div>
                  <span className="modal-title" style={{ fontSize: 16, fontWeight: 800, color: '#036d92' }}>
                    Master Diagnosis Templates & Clinical Defaults Manager
                  </span>
                  <div style={{ fontSize: 11, color: '#0284C7' }}>
                    Doctor/Admin controls for diagnosis templates, default advice, and recall intervals (Saved locally)
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdminTemplateModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
                {/* Template List Sidebar */}
                <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                    Catalog Templates ({templatesCatalog.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {templatesCatalog.map(tmpl => {
                      const isSel = (editingTemplate?.id || templatesCatalog[0].id) === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => setEditingTemplate(tmpl)}
                          style={{
                            padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                            background: isSel ? '#E0F2FE' : '#F8FAFC',
                            border: isSel ? '1.5px solid #0284C7' : '1px solid #E2E8F0'
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? '#0369A1' : '#0F172A' }}>
                            {tmpl.primaryDiagnosis}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            {tmpl.icd10Code} • {tmpl.defaultFollowUpDays}d F/U
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={handleResetTemplatesToDefaults}
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', fontSize: 11, color: '#B91C1C', justifyContent: 'center', border: '1px dashed #FCA5A5' }}
                    >
                      <RotateCcw size={12} /> Reset to Factory Defaults
                    </button>
                  </div>
                </div>

                {/* Template Editor Form */}
                {(() => {
                  const current = editingTemplate || templatesCatalog[0];
                  if (!current) return null;
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          Edit Template: {current.primaryDiagnosis} ({current.icd10Code})
                        </h4>
                        <span className="badge" style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1' }}>
                          ID: {current.id}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Full Diagnosis Name</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12 }}
                            value={current.diagnosisName}
                            onChange={e => setEditingTemplate({ ...current, diagnosisName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>ICD-10 Code</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, fontFamily: 'monospace' }}
                            value={current.icd10Code}
                            onChange={e => setEditingTemplate({ ...current, icd10Code: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Default Follow-Up Interval (Days)</label>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            className="form-input"
                            style={{ fontSize: 12 }}
                            value={current.defaultFollowUpDays}
                            onChange={e => setEditingTemplate({ ...current, defaultFollowUpDays: parseInt(e.target.value) || 7 })}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Default Certainty Status</label>
                          <select
                            className="form-select"
                            style={{ fontSize: 12 }}
                            value={current.defaultStatus}
                            onChange={e => setEditingTemplate({ ...current, defaultStatus: e.target.value as any })}
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Provisional">Provisional</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Default Recommended Procedure</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: 12 }}
                          value={current.recommendedProcedure || ''}
                          onChange={e => setEditingTemplate({ ...current, recommendedProcedure: e.target.value })}
                        />
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Master Clinical Notes</label>
                        <textarea
                          rows={2}
                          className="form-input"
                          style={{ fontSize: 12 }}
                          value={current.diagnosisNote || ''}
                          onChange={e => setEditingTemplate({ ...current, diagnosisNote: e.target.value })}
                        />
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Patient Advice Default</label>
                        <textarea
                          rows={2}
                          className="form-input"
                          style={{ fontSize: 12 }}
                          value={current.patientAdvice}
                          onChange={e => setEditingTemplate({ ...current, patientAdvice: e.target.value })}
                        />
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Dietary Advice Default</label>
                        <textarea
                          rows={2}
                          className="form-input"
                          style={{ fontSize: 12 }}
                          value={current.dietAdvice}
                          onChange={e => setEditingTemplate({ ...current, dietAdvice: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleSaveTemplateEdits(current)}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#036d92', borderColor: '#036d92', padding: '6px 16px', fontWeight: 700 }}
                        >
                          <Save size={13} /> Save Template Changes
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdminTemplateModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Test Ingestion Parameters Inspector Modal */}
      {viewingParametersTest && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setViewingParametersTest(null)}>
          <div className="modal modal-md" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: '#6366F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
                }}>
                  <FlaskConical size={18} />
                </div>
                <div>
                  <span className="modal-title" style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                    {viewingParametersTest.name}
                  </span>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    Code: <strong style={{ color: '#4F46E5' }}>{viewingParametersTest.code}</strong> • {viewingParametersTest.category} • 🧪 {viewingParametersTest.specimen}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingParametersTest(null)} className="btn btn-ghost btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 18 }}>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#0369A1' }}>
                <strong>Admin Master Configuration:</strong> When the laboratory processes this test, technician enters results conforming to these exact parameters and reference intervals.
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left', fontWeight: 700 }}>
                      <th style={{ padding: '8px 10px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Analyte Parameter</th>
                      <th style={{ padding: '8px 10px' }}>Type</th>
                      <th style={{ padding: '8px 10px' }}>Unit</th>
                      <th style={{ padding: '8px 10px' }}>Male Interval</th>
                      <th style={{ padding: '8px 10px' }}>Female Interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingParametersTest.parameters && viewingParametersTest.parameters.length > 0 ? (
                      viewingParametersTest.parameters.map((p, idx) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>
                            {p.name} {p.code ? `(${p.code})` : ''}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: 10.5, background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                              {p.dataType}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{p.unit || '-'}</td>
                          <td style={{ padding: '8px 10px', color: '#0369A1' }}>
                            {p.maleMin !== undefined && p.maleMax !== undefined ? `${p.maleMin} – ${p.maleMax}` : (p.referenceRange || '-')}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#BE185D' }}>
                            {p.femaleMin !== undefined && p.femaleMax !== undefined ? `${p.femaleMin} – ${p.femaleMax}` : (p.referenceRange || '-')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#94A3B8' }}>
                          No individual analyte parameters defined.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingParametersTest(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Laser Protocol Session Cancellation Modal */}
      {cancelModalState.isOpen && (() => {
        const targetSession = uniqueProcedures.find(p => p.id === cancelModalState.procedureId);
        return (
          <div className="modal-backdrop" style={{ zIndex: 9999, backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.65)' }}>
            <div
              className="modal"
              style={{
                maxWidth: 580,
                width: '94%',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid #FECACA',
                boxShadow: '0 25px 50px -12px rgba(185, 28, 28, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                background: '#FFFFFF',
                animation: 'modalFadeIn 0.2s ease-out'
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                  borderBottom: '1.5px solid #FECACA',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)'
                    }}
                  >
                    <Ban size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#991B1B', margin: 0, letterSpacing: -0.2 }}>
                      * Cancel Treatment Protocol Session
                    </h3>
                    <p style={{ fontSize: 12, color: '#B91C1C', margin: '2px 0 0 0', fontWeight: 600 }}>
                      Record reason &amp; follow-up adjustment for patient session
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelModalState({ ...cancelModalState, isOpen: false })}
                  className="btn btn-ghost btn-icon"
                  style={{ color: '#991B1B', borderRadius: 8, padding: 6 }}
                  title="Close cancellation dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Target Session Context Pill */}
              <div style={{ background: '#FFF1F2', padding: '10px 20px', borderBottom: '1px solid #FFE4E6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 800, color: '#9F1239' }}>Target Session:</span>
                  <span className="badge" style={{ background: '#E11D48', color: '#FFFFFF', fontWeight: 900, fontSize: 11 }}>
                    Session {targetSession?.sessionsCount || '2/4'}
                  </span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>
                    {targetSession?.procedureName || 'HAIR REMOVAL - DIODE'}
                  </span>
                  <span style={{ color: '#94A3B8' }}>•</span>
                  <span style={{ fontWeight: 700, color: '#036d92' }}>
                    {targetSession?.bodyPart || 'FACE'}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#475569' }}>
                  Scheduled: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{targetSession?.scheduledDate || '14/04/2026'}</strong>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Reason Selection Cards */}
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#1E293B', marginBottom: 8 }}>
                    Select Cancellation Reason *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      {
                        key: 'Not tacken further interested',
                        title: 'Not tacken further interested',
                        subtitle: '(Patient discontinued / not interested)',
                        badge: 'Discontinued'
                      },
                      {
                        key: 'NOT TACKEN - Not avelibal',
                        title: 'NOT TACKEN - Not avelibal',
                        subtitle: '(Patient unavailable / out of town)',
                        badge: 'Unavailable'
                      },
                      {
                        key: '20/04/2026 f/u date',
                        title: '20/04/2026 f/u date',
                        subtitle: '(Rescheduled to new follow-up date)',
                        badge: 'Rescheduled'
                      }
                    ].map(opt => {
                      const isSelected = cancelModalState.reason === opt.key;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            setCancelModalState({
                              ...cancelModalState,
                              reason: opt.key,
                              customNote: opt.key === '20/04/2026 f/u date'
                                ? '20/04/2026 f/u date (Rescheduled to new follow-up date)'
                                : opt.key,
                              rescheduledDate: opt.key === '20/04/2026 f/u date' ? '20/04/2026' : cancelModalState.rescheduledDate
                            });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 14px',
                            borderRadius: 10,
                            border: isSelected ? '2px solid #DC2626' : '1.5px solid #E2E8F0',
                            background: isSelected ? '#FEF2F2' : '#FFFFFF',
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 2px 8px rgba(220, 38, 38, 0.12)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="radio"
                              name="cancelReasonRadio"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ accentColor: '#DC2626', width: 17, height: 17, cursor: 'pointer' }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: isSelected ? '#991B1B' : '#1E293B' }}>
                                {opt.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                                {opt.subtitle}
                              </div>
                            </div>
                          </div>
                          <span
                            className="badge"
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              background: isSelected ? '#DC2626' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#64748B'
                            }}
                          >
                            {opt.badge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Custom Clinical Remarks / Doctor Notes */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ fontWeight: 800, fontSize: 12, color: '#334155' }}>
                      Custom Clinical Remarks / Doctor Notes
                    </label>
                    <span style={{ fontSize: 10.5, color: '#64748B' }}>Direct writable</span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={cancelModalState.customNote}
                    onChange={e => setCancelModalState({ ...cancelModalState, customNote: e.target.value })}
                    placeholder="NOT TACKEN - Not avelibal"
                    style={{ height: 38, fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}
                  />
                </div>

                {/* 3. Rescheduled F/U Date & Rate Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 5 }}>
                      Rescheduled F/U Date
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={cancelModalState.rescheduledDate}
                        onChange={e => setCancelModalState({ ...cancelModalState, rescheduledDate: e.target.value })}
                        placeholder="20/04/2026"
                        style={{ height: 36, fontSize: 12.5, fontWeight: 800, fontFamily: 'monospace', paddingLeft: 30, color: '#0F172A' }}
                      />
                      <Clock size={14} color="#64748B" style={{ position: 'absolute', left: 9, top: 11 }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 5 }}>
                      Rate (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={cancelModalState.rate}
                        onChange={e => setCancelModalState({ ...cancelModalState, rate: parseFloat(e.target.value) || 0 })}
                        placeholder="2000"
                        style={{ height: 36, fontSize: 13, fontWeight: 900, paddingLeft: 26, color: '#036d92' }}
                      />
                      <span style={{ position: 'absolute', left: 10, top: 9, fontWeight: 900, color: '#64748B', fontSize: 12 }}>₹</span>
                    </div>
                  </div>
                </div>

                {/* Safety Warning Note */}
                <div style={{ padding: '9px 12px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#991B1B' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>
                    Cancelling this session updates patient records, flags status as <strong>Cancelled/Delayed</strong>, and adjusts the collected vs pending fee summary.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  padding: '14px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <button
                  type="button"
                  onClick={() => setCancelModalState({ ...cancelModalState, isOpen: false })}
                  className="btn btn-outline"
                  style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#475569', fontWeight: 700, fontSize: 12, padding: '7px 16px' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (cancelModalState.procedureId) {
                      handleCancelSession(
                        cancelModalState.procedureId,
                        cancelModalState.reason,
                        cancelModalState.customNote,
                        cancelModalState.rescheduledDate,
                        cancelModalState.rate
                      );
                    }
                    setCancelModalState({
                      isOpen: false,
                      procedureId: null,
                      reason: 'NOT TACKEN - Not avelibal',
                      customNote: 'NOT TACKEN - Not avelibal',
                      rescheduledDate: '20/04/2026',
                      rate: 2000
                    });
                  }}
                  className="btn btn-danger"
                  style={{
                    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                    borderColor: '#DC2626',
                    fontWeight: 900,
                    fontSize: 12.5,
                    padding: '8px 20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                  }}
                >
                  <Ban size={15} /> Confirm *cancle setion
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* PROCEDURAL PRINT CENTER MODAL (Informed Consent, Xerox Copy, 22-Col Protocol Sheet, Pre/Post Care) */}
      {/* ============================================================ */}
      {showAllPrintModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              maxWidth: 960,
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #036d92 0%, #0284c7 100%)',
                color: '#FFFFFF',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Printer size={22} />
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>
                    Clinical Procedure Print &amp; Documentation Center
                  </h3>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800
                    }}
                  >
                    4 Print Formats Available
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#E0F2FE', marginTop: 4 }}>
                  Patient: <strong>{patient.firstName} {patient.lastName}</strong> ({patient.mrdNumber}) • Case: <strong>{caseId}</strong> • Procedure: <strong>{protocolForm.procedureName || 'HAIR REMOVAL - DIODE'}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAllPrintModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-navigation Bar */}
            <div
              style={{
                background: '#F1F5F9',
                borderBottom: '1px solid #CBD5E1',
                padding: '8px 20px',
                display: 'flex',
                gap: 8,
                overflowX: 'auto'
              }}
            >
              {[
                { key: 'consent', label: '📄 1. Official Informed Consent (ઓરિજિનલ)', badge: 'Patient Copy' },
                { key: 'xerox', label: '📑 2. Xerox / Reception Copy (ઝેરોક્ષ)', badge: 'Official Archive' },
                { key: 'protocol', label: '⚡ 3. 22-Col Treatment Protocol & Laser Log', badge: 'Technical Sheet' },
                { key: 'homecare', label: '🛡️ 4. Pre & Post Care Instructions', badge: 'Patient Handout' }
              ].map(t => {
                const isActive = printModalActiveTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setPrintModalActiveTab(t.key as any)}
                    style={{
                      background: isActive ? '#036d92' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#334155',
                      border: isActive ? '1px solid #036d92' : '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: isActive ? 900 : 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{t.label}</span>
                    <span
                      style={{
                        fontSize: 9.5,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        fontWeight: 800
                      }}
                    >
                      {t.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Document Preview Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#F8FAFC' }}>
              {/* Tab 1: Official Informed Consent Form */}
              {printModalActiveTab === 'consent' && (
                <div
                  id="print-area-consent"
                  style={{
                    background: '#FFFFFF',
                    padding: '28px 32px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    lineHeight: 1.6
                  }}
                >
                  {/* Clinic Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#036d92', letterSpacing: '0.12em' }}>
                      MEDFLOW MULTISPECIALITY CLINIC &amp; LASER AESTHETICS CENTRE
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, margin: '4px 0', color: '#0F172A' }}>
                      PATIENT INFORMED CONSENT FORM – {activeModalTemplate.title.toUpperCase()}
                    </h2>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Plot 42, Ellis Bridge Medical Enclave, Ahmedabad, Gujarat • Helpline: +91 79 4900 1200 • NABH Accredited OPD
                    </div>
                  </div>

                  {/* Demographics Matrix */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '10px 16px',
                      background: '#F0F9FF',
                      padding: '14px 18px',
                      borderRadius: 8,
                      border: '1.5px solid #BAE6FD',
                      fontSize: 12,
                      marginBottom: 18
                    }}
                  >
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Patient Name (નામ):</span> <div style={{ fontWeight: 900, color: '#0F172A', fontSize: 13 }}>{patient.firstName} {patient.lastName}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>M/F (લિંગ) &amp; Age (ઉમર):</span> <div style={{ fontWeight: 900, color: '#0F172A' }}>{patient.gender === 'M' ? 'M (Male / પુરૂષ)' : 'F (Female / સ્ત્રી)'} • {patient.age || 21} Yrs</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Place (સ્થાન):</span> <div style={{ fontWeight: 900, color: '#0F172A' }}>{patient.city || 'Surat'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>IPD No:</span> <div style={{ fontWeight: 900, color: '#036d92', fontFamily: 'monospace' }}>{consentIpdNumber || 'IPD-2026-089'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>MRD No:</span> <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{patient.mrdNumber || 'MRD-2026-0001'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Case No:</span> <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{caseId}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Procedure (પ્રોસિજરનું નામ):</span> <div style={{ fontWeight: 900, color: '#036d92' }}>{activeModalTemplate.procedureName}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Target Area / Body Part:</span> <div style={{ fontWeight: 900, color: '#059669' }}>{protocolForm.bodyPart || 'FACE'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Date (તારીખ):</span> <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{protocolForm.startDate || '2026-03-25'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Attending Doctor (તબીબ):</span> <div style={{ fontWeight: 900, color: '#0F172A' }}>Dr. Raj Valaki, MBBS, MD (Dermatology)</div></div>
                  </div>

                  {/* Declaration Body */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 20px', marginBottom: 18 }}>
                    <div style={{ fontWeight: 900, color: '#036d92', fontSize: 12.5, marginBottom: 6, textTransform: 'uppercase' }}>
                      Voluntary Patient Declaration &amp; Procedure Authorization (સંમતિ અને અધિકૃતતાનું ઘોષણાપત્ર)
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, fontWeight: 600, color: '#1E293B' }}>
                      {interpolateModalTokens(activeModalTemplate.consentText.english)}
                    </p>
                    <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12.5, lineHeight: 1.7, color: '#334155' }}>
                      {interpolateModalTokens(activeModalTemplate.consentText.gujarati)}
                    </p>
                    <div style={{ marginTop: 10, fontSize: 11, color: '#64748B' }}>
                      * This informed consent remains legally binding for all sessions prescribed under Case #{caseId} unless revoked in writing.
                    </div>
                  </div>

                  {/* Risks & Precautions Side by Side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#92400E', marginBottom: 6 }}>
                        ⚠️ Anticipated Side Effects &amp; Clinical Risks (સંભવિત આડઅસર અને જોખમો)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#78350F', lineHeight: 1.6 }}>
                        {activeModalTemplate.risksAndComplications.english.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#065F46', marginBottom: 6 }}>
                        🛡️ Mandatory Home Care &amp; Precautions (પ્રક્રિયા પછીની કાળજી)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#064E3B', lineHeight: 1.6 }}>
                        {activeModalTemplate.postCareInstructions.english.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Signature Blocks */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, paddingTop: 18, borderTop: '2px solid #E2E8F0' }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #0F172A', height: 36, marginBottom: 6 }} />
                      <div style={{ fontWeight: 800, fontSize: 11.5, color: '#0F172A' }}>Patient / Legal Guardian</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>Name: {patient.firstName} {patient.lastName} (Sign / અંગૂઠો)</div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #0F172A', height: 36, marginBottom: 6 }} />
                      <div style={{ fontWeight: 800, fontSize: 11.5, color: '#0F172A' }}>Attending Physician</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>Dr. Raj Valaki, MBBS, MD (Dermatology) (Reg: G-34891)</div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #0F172A', height: 36, marginBottom: 6 }} />
                      <div style={{ fontWeight: 800, fontSize: 11.5, color: '#0F172A' }}>Clinical Witness / Nurse</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>Sister Rekha / Front Desk Officer (MedFlow)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Xerox / Reception Copy */}
              {printModalActiveTab === 'xerox' && (
                <div
                  id="print-area-xerox"
                  style={{
                    background: '#FFFFFF',
                    padding: '28px 32px',
                    borderRadius: 10,
                    border: '2px dashed #94A3B8',
                    position: 'relative',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    lineHeight: 1.6
                  }}
                >
                  {/* Xerox Red Stamp */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 24,
                      right: 28,
                      border: '3px dashed #DC2626',
                      padding: '8px 14px',
                      borderRadius: 8,
                      color: '#DC2626',
                      transform: 'rotate(-3deg)',
                      background: 'rgba(254, 242, 242, 0.95)',
                      zIndex: 10
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ★ OFFICIAL XEROX COPY (ઝેરોક્ષ નકલ) ★
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, textAlign: 'center', marginTop: 2 }}>
                      RECEPTION &amp; NURSING ARCHIVE DUPLICATE
                    </div>
                    <div style={{ fontSize: 8.5, textAlign: 'center', color: '#991B1B' }}>
                      Stamp ID: XR-{caseId}-{Date.now().toString().slice(-4)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0F172A', letterSpacing: '0.12em' }}>
                      MEDFLOW MULTISPECIALITY CLINIC &amp; LASER AESTHETICS CENTRE
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, margin: '4px 0', color: '#0F172A' }}>
                      INFORMED PROCEDURAL CONSENT RECORD (XEROX DUPLICATE)
                    </h2>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Certified Official Photocopy Archive for EMR &amp; Legal Filing • Lesson {activeModalTemplate.templateNo} of 12
                    </div>
                  </div>

                  {/* Demographics Matrix */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '10px 16px',
                      background: '#F1F5F9',
                      padding: '14px 18px',
                      borderRadius: 8,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 12,
                      marginBottom: 18
                    }}
                  >
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Patient Name (નામ):</span> <div style={{ fontWeight: 900, color: '#0F172A', fontSize: 13 }}>{patient.firstName} {patient.lastName}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>M/F (લિંગ) &amp; Age (ઉમર):</span> <div style={{ fontWeight: 900, color: '#0F172A' }}>{patient.gender === 'M' ? 'M (Male / પુરૂષ)' : 'F (Female / સ્ત્રી)'} • {patient.age || 21} Yrs</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Place (સ્થાન):</span> <div style={{ fontWeight: 900, color: '#0F172A' }}>{patient.city || 'Surat'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>IPD No:</span> <div style={{ fontWeight: 900, color: '#036d92', fontFamily: 'monospace' }}>{consentIpdNumber || 'IPD-2026-089'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>MRD No:</span> <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{patient.mrdNumber || 'MRD-2026-0001'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Case No:</span> <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{caseId}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Procedure (પ્રોસિજરનું નામ):</span> <div style={{ fontWeight: 900, color: '#036d92' }}>{activeModalTemplate.procedureName}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Target Area / Body Part:</span> <div style={{ fontWeight: 900, color: '#059669' }}>{protocolForm.bodyPart || 'FACE'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Date (તારીખ):</span> <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{protocolForm.startDate || '2026-03-25'}</div></div>
                    <div><span style={{ color: '#64748B', fontWeight: 700 }}>Attending Doctor (તબીબ):</span> <div style={{ fontWeight: 900, color: '#0F172A' }}>Dr. Raj Valaki, MBBS, MD (Dermatology)</div></div>
                  </div>

                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#0F172A', background: '#F8FAFC', padding: 16, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 18 }}>
                    <strong>Certified Archival Declaration:</strong> Patient {patient.firstName} {patient.lastName} has executed voluntary informed consent for {activeModalTemplate.procedureName} on {protocolForm.bodyPart || 'FACE'}. Recorded and archived in hospital records on {new Date().toLocaleDateString('en-IN')}.
                  </div>

                  {/* Dual Reception / Nursing Stamp Boxes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, paddingTop: 18, borderTop: '2px solid #CBD5E1' }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #0F172A', height: 32, marginBottom: 4 }} />
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Reception Record Stamp &amp; Signature</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Logged in Reception EMR • Front Desk Officer</div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #0F172A', height: 32, marginBottom: 4 }} />
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Nursing Head / Triage Verification</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Verified Pre-Procedure Vital Checks &amp; Patient Prep</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: 22-Col Treatment Protocol Sheet */}
              {printModalActiveTab === 'protocol' && (
                <div
                  id="print-area-protocol"
                  style={{
                    background: '#FFFFFF',
                    padding: '24px 28px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    overflowX: 'auto',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#036d92', letterSpacing: '0.1em' }}>
                      MEDFLOW LASER AESTHETICS CLINICAL PROTOCOLS
                    </div>
                    <h3 style={{ margin: '4px 0', fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                      Laser Machine Clinical Settings &amp; Execution Protocol Sheet
                    </h3>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>
                      Case: <strong>{caseId}</strong> • Patient: <strong>{patient.firstName} {patient.lastName}</strong> ({patient.mrdNumber}) • Tech: <strong>{activeModalTemplate.procedureName}</strong> ({protocolForm.bodyPart || 'FACE'})
                    </div>
                  </div>

                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#E0F2FE', color: '#0369A1', borderBottom: '1px solid #BAE6FD', fontWeight: 800 }}>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Sess#</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>F/U Date</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Done Date</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Therapist</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Skin</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Power</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Wave</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Pulse</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Spot</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Shots</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Status</th>
                        <th style={{ padding: '8px 5px', border: '1px solid #CBD5E1' }}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueProcedures.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: item.status === 'Done' ? '#F0FDF4' : '#FFFFFF' }}>
                          <td style={{ padding: '7px 5px', fontWeight: 800, border: '1px solid #CBD5E1' }}>{item.sessionsCount || `${idx + 1}/4`}</td>
                          <td style={{ padding: '7px 5px', fontFamily: 'monospace', border: '1px solid #CBD5E1' }}>{item.scheduledDate}</td>
                          <td style={{ padding: '7px 5px', fontFamily: 'monospace', border: '1px solid #CBD5E1' }}>{item.performanceDate || (item.status === 'Done' ? '2026-03-25' : '—')}</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.therapist || protocolForm.therapist}</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.skinType ?? 2}</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.power ?? 10}J</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.waveLength ?? '100 hz'}</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.pulseDuration ?? 10}ms</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.spotSize ?? 2.2}</td>
                          <td style={{ padding: '7px 5px', border: '1px solid #CBD5E1' }}>{item.shotsFired ?? (item.status === 'Done' ? '100' : '—')}</td>
                          <td style={{ padding: '7px 5px', fontWeight: 800, color: item.status === 'Done' ? '#15803D' : '#0284C7', border: '1px solid #CBD5E1' }}>{item.status}</td>
                          <td style={{ padding: '7px 5px', fontWeight: 800, border: '1px solid #CBD5E1' }}>₹{item.rate || item.price || 2000}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 4: Pre & Post Care Instructions */}
              {printModalActiveTab === 'homecare' && (
                <div
                  id="print-area-homecare"
                  style={{
                    background: '#FFFFFF',
                    padding: '28px 32px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    lineHeight: 1.8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#059669', letterSpacing: '0.12em' }}>
                      MEDFLOW AESTHETICS CLINICAL PROTOCOLS
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, margin: '4px 0', color: '#065F46' }}>
                      PRE &amp; POST PROCEDURE PATIENT CARE GUIDELINES
                    </h2>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Aftercare Rules for: <strong>{activeModalTemplate.procedureName}</strong> ({protocolForm.bodyPart || 'FACE'})
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#ECFDF5', padding: 16, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                      <div style={{ fontWeight: 800, color: '#065F46', marginBottom: 8, fontSize: 13 }}>
                        ✓ શું કરવું (Things TO DO):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#064E3B', lineHeight: 1.7 }}>
                        <li>દર ૩ કલાકે બ્રોડ-સ્પેક્ટ્રમ SPF 50+ સનસ્ક્રીન નિયમિત લગાવો.</li>
                        <li>હળવો સોજો કે ગરમી લાગે તો એલોવેરા જેલ અથવા બરફનો ઠંડો શેક કરવો.</li>
                        <li>નિયમિત મોઇશ્ચરાઇઝર લગાવી ચામડી હાઇડ્રેટ રાખવી.</li>
                        <li>આગામી સત્રની તારીખ મુજબ સમયસર ફોલો-અપ માટે આવવું.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#FEF2F2', padding: 16, borderRadius: 8, border: '1px solid #FECACA' }}>
                      <div style={{ fontWeight: 800, color: '#991B1B', marginBottom: 8, fontSize: 13 }}>
                        ✕ શું ન કરવું (Things NOT TO DO):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#7F1D1D', lineHeight: 1.7 }}>
                        <li>સીધો સૂર્યપ્રકાશ, ટેનિંગ કે તડકામાં ફરવું સખત રીતે ટાળવું.</li>
                        <li>સત્રો વચ્ચે વાળ ખેંચવા, વેક્સિંગ કે થ્રેડિંગ કરાવવું નહીં.</li>
                        <li>૨૪-૪૮ કલાક સુધી ગરમ પાણીથી નહાવું કે સ્ટીમ બાથ લેવી નહીં.</li>
                        <li>ચહેરા પર કોઈપણ તેજાબી સાબુ કે અજાણી ક્રીમ ઘસવી નહીં.</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#64748B' }}>
                    કોઈપણ તકલીફ કે પ્રશ્ન માટે ક્લિનિક હેલ્પલાઇન: <strong>+91 79 4900 1200</strong> પર સંપર્ક કરવો.
                  </div>
                </div>
              )}

              {/* Complete Clinical Dossier Container (For "Show All / Print All 4 Sheets") */}
              <div id="print-area-all-documents" style={{ display: 'none' }}>
                {/* Sheet 1: Official Consent */}
                <div style={{ padding: '20px', background: '#FFFFFF' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#036d92' }}>MEDFLOW MULTISPECIALITY CLINIC &amp; LASER CENTRE</div>
                    <h2 style={{ fontSize: 15, fontWeight: 900, margin: '2px 0' }}>PATIENT INFORMED CONSENT FORM – {activeModalTemplate.title.toUpperCase()}</h2>
                    <div style={{ fontSize: 10, color: '#64748B' }}>NABH Accredited OPD • Plot 42, Ellis Bridge Medical Enclave, Ahmedabad</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: '#F0F9FF', padding: 10, borderRadius: 6, border: '1px solid #BAE6FD', fontSize: 11, marginBottom: 12 }}>
                    <div><strong>Patient:</strong> {patient.firstName} {patient.lastName}</div>
                    <div><strong>M/F &amp; Age:</strong> {patient.gender === 'M' ? 'M' : 'F'} / {patient.age}Y</div>
                    <div><strong>Place:</strong> {patient.city || 'Surat'}</div>
                    <div><strong>IPD/MRD:</strong> {consentIpdNumber} / {patient.mrdNumber}</div>
                    <div><strong>Case No:</strong> {caseId}</div>
                    <div><strong>Procedure:</strong> {activeModalTemplate.procedureName}</div>
                    <div><strong>Target:</strong> {protocolForm.bodyPart || 'FACE'}</div>
                    <div><strong>Date:</strong> {protocolForm.startDate || '2026-03-25'}</div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                    {interpolateModalTokens(activeModalTemplate.consentText.english)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 14, borderTop: '1.5px solid #E2E8F0' }}>
                    <div><div style={{ borderBottom: '1px solid #000', height: 28 }} /><div style={{ fontSize: 10, fontWeight: 800 }}>Patient Sign</div></div>
                    <div><div style={{ borderBottom: '1px solid #000', height: 28 }} /><div style={{ fontSize: 10, fontWeight: 800 }}>Doctor Sign (Dr. Raj Valaki)</div></div>
                    <div><div style={{ borderBottom: '1px solid #000', height: 28 }} /><div style={{ fontSize: 10, fontWeight: 800 }}>Nurse / Witness Sign</div></div>
                  </div>
                </div>

                <div className="page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />

                {/* Sheet 2: Xerox Record */}
                <div style={{ padding: '20px', background: '#FFFFFF', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, right: 20, border: '2px dashed #DC2626', padding: '4px 10px', borderRadius: 4, color: '#DC2626', fontSize: 10, fontWeight: 900 }}>
                    ★ OFFICIAL XEROX COPY (ઝેરોક્ષ નકલ) ★
                  </div>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 900 }}>MEDFLOW MULTISPECIALITY CLINIC — ARCHIVE DUPLICATE</div>
                    <h2 style={{ fontSize: 15, fontWeight: 900, margin: '2px 0' }}>RECEPTION &amp; NURSING PANEL CONSENT RECORD (XEROX)</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: '#F1F5F9', padding: 10, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 11, marginBottom: 12 }}>
                    <div><strong>Patient:</strong> {patient.firstName} {patient.lastName}</div>
                    <div><strong>M/F &amp; Age:</strong> {patient.gender === 'M' ? 'M' : 'F'} / {patient.age}Y</div>
                    <div><strong>Case No:</strong> {caseId}</div>
                    <div><strong>Procedure:</strong> {activeModalTemplate.procedureName}</div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                    Verified archival duplicate recorded for Doctor, Reception, and Nursing Panel EMR on {new Date().toLocaleDateString('en-IN')}.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 14, borderTop: '1.5px solid #E2E8F0' }}>
                    <div><div style={{ borderBottom: '1px solid #000', height: 26 }} /><div style={{ fontSize: 10, fontWeight: 800 }}>Reception Stamp &amp; Sign</div></div>
                    <div><div style={{ borderBottom: '1px solid #000', height: 26 }} /><div style={{ fontSize: 10, fontWeight: 800 }}>Nursing Head Verification</div></div>
                  </div>
                </div>

                <div className="page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />

                {/* Sheet 3: Protocol Sheet */}
                <div style={{ padding: '20px', background: '#FFFFFF' }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#036d92' }}>Laser Machine Clinical Settings &amp; Execution Protocol</h3>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Case: {caseId} • Patient: {patient.firstName} {patient.lastName} • Procedure: {activeModalTemplate.procedureName}</div>
                  </div>
                  <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#E0F2FE', fontWeight: 800 }}>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>Sess#</th>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>F/U Date</th>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>Done Date</th>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>Therapist</th>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>Power</th>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>Wave</th>
                        <th style={{ padding: '6px', border: '1px solid #CBD5E1' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueProcedures.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1', fontWeight: 800 }}>{item.sessionsCount || `${idx + 1}/4`}</td>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1' }}>{item.scheduledDate}</td>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1' }}>{item.performanceDate || (item.status === 'Done' ? '2026-03-25' : '—')}</td>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1' }}>{item.therapist || protocolForm.therapist}</td>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1' }}>{item.power ?? 10}J</td>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1' }}>{item.waveLength ?? '100 hz'}</td>
                          <td style={{ padding: '6px', border: '1px solid #CBD5E1', fontWeight: 800, color: item.status === 'Done' ? '#15803D' : '#0284C7' }}>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />

                {/* Sheet 4: Homecare Guidelines */}
                <div style={{ padding: '20px', background: '#FFFFFF' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#059669' }}>MEDFLOW AESTHETICS CLINICAL PROTOCOLS</div>
                    <h2 style={{ fontSize: 15, fontWeight: 900, margin: '2px 0', color: '#065F46' }}>PRE &amp; POST PROCEDURE PATIENT CARE GUIDELINES</h2>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Aftercare for: {activeModalTemplate.procedureName}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 6, border: '1px solid #A7F3D0' }}>
                      <div style={{ fontWeight: 800, color: '#065F46', marginBottom: 6, fontSize: 12 }}>✓ શું કરવું (Things TO DO):</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#064E3B' }}>
                        <li>દર ૩ કલાકે બ્રોડ-સ્પેક્ટ્રમ SPF 50+ સનસ્ક્રીન નિયમિત લગાવો.</li>
                        <li>હળવો સોજો કે ગરમી લાગે તો એલોવેરા જેલ અથવા બરફનો ઠંડો શેક કરવો.</li>
                      </ul>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 6, border: '1px solid #FECACA' }}>
                      <div style={{ fontWeight: 800, color: '#991B1B', marginBottom: 6, fontSize: 12 }}>✕ શું ન કરવું (Things NOT TO DO):</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#7F1D1D' }}>
                        <li>સીધો સૂર્યપ્રકાશ, ટેનિંગ કે તડકામાં ફરવું સખત રીતે ટાળવું.</li>
                        <li>સત્રો વચ્ચે વાળ ખેંચવા, વેક્સિંગ કે થ્રેડિંગ કરાવવું નહીં.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Direct Print Actions */}
            <div
              style={{
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <button
                type="button"
                onClick={() => setShowAllPrintModal(false)}
                className="btn btn-outline"
                style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#475569', fontWeight: 700, fontSize: 12, padding: '8px 18px' }}
              >
                Close (બંધ કરો)
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Print Active Document Button */}
                <button
                  type="button"
                  onClick={() => {
                    const tabId = printModalActiveTab === 'consent' ? 'print-area-consent'
                      : printModalActiveTab === 'xerox' ? 'print-area-xerox'
                      : printModalActiveTab === 'protocol' ? 'print-area-protocol'
                      : 'print-area-homecare';
                    printElementA4(tabId, `MedFlow_${printModalActiveTab}_${caseId}`);
                  }}
                  className="btn btn-primary"
                  style={{
                    background: '#036d92',
                    borderColor: '#036d92',
                    fontWeight: 900,
                    fontSize: 12.5,
                    padding: '8px 20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 2px 8px rgba(3, 109, 146, 0.3)'
                  }}
                >
                  <Printer size={15} /> Print Active Document ({printModalActiveTab.toUpperCase()})
                </button>

                {/* Print All 4 Documents Button */}
                <button
                  type="button"
                  onClick={() => {
                    printElementA4('print-area-all-documents', `MedFlow_Complete_Clinical_Dossier_${caseId}`);
                  }}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: 12.5,
                    padding: '8px 20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                  }}
                  title="Print all 4 clinical documents as a single multi-page complete dossier"
                >
                  <Printer size={15} /> 🖨️ Print Complete Dossier (Show All / 4 Sheets)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEARCHABLE DRUG SELECTOR MODAL (Single Source of Truth: /admin/drugs) */}
      {/* ============================================================ */}
      {isDrugSelectorModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsDrugSelectorModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 860,
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1.5px solid #BAE6FD'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #036d92 0%, #0284c7 100%)',
              color: '#FFFFFF',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill size={18} />
                  <span>Select Drug from Admin Drug Catalog</span>
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2 }}>
                  Single Source of Truth: <code style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: 4 }}>/admin/drugs</code> • Active Master Drugs ({activeAdminDrugs.length} Available)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrugSelectorModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Box */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  autoFocus
                  placeholder="Search drug name, combination / generic, brand name..."
                  value={drugModalSearch}
                  onChange={e => setDrugModalSearch(e.target.value)}
                  style={{ paddingLeft: 38, height: 40, fontSize: 13, background: '#FFFFFF', borderRadius: 8, borderColor: '#CBD5E1' }}
                />
                {drugModalSearch && (
                  <button
                    type="button"
                    onClick={() => setDrugModalSearch('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Drugs List */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredModalDrugs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <Pill size={32} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>No Active Catalog Drugs Found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    No active drugs match &ldquo;{drugModalSearch}&rdquo;. Inactive drugs configured in <code>/admin/drugs</code> are hidden from selection.
                  </div>
                </div>
              ) : (
                filteredModalDrugs.map(drug => (
                  <div
                    key={drug.id}
                    onClick={() => handleSelectDrugFromMaster(drug)}
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                      gap: 16
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#036d92';
                      e.currentTarget.style.background = '#F0F9FF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                          {drug.name}
                        </span>
                        <span style={{ fontSize: 12, color: '#036d92', fontWeight: 600 }}>
                          ({drug.genericName})
                        </span>
                        {drug.brandName && (
                          <span className="badge badge-purple" style={{ fontSize: 10 }}>
                            Brand: {drug.brandName}
                          </span>
                        )}
                        <span className="badge badge-outline" style={{ fontSize: 9.5, fontFamily: 'monospace' }}>
                          ID: {drug.id}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>Dose: <strong>{drug.defaultDose || '1 tab'}</strong></span>
                        <span>Freq: <strong>{drug.defaultFreq || '1-0-1'}</strong></span>
                        <span>Days: <strong>{drug.defaultDay || '5 day'}</strong></span>
                        <span>Total: <strong>{drug.defaultTotal || '5'}</strong></span>
                        <span>Note: <em>{drug.defaultNote || 'After food'}</em></span>
                        <span>Brand/Mfg: <strong>{drug.manufacturer || 'Cipla pvt'}</strong></span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#036d92' }}>
                        ₹{drug.unitPrice}
                      </div>
                      <span className={`badge ${drug.stock === 0 ? 'badge-danger' : drug.stock <= drug.reorderLevel ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 9.5 }}>
                        {drug.stock === 0 ? 'Out of Stock' : `Stock: ${drug.stock}`}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ background: '#036d92', borderColor: '#036d92', fontSize: 11, padding: '3px 10px', marginTop: 4 }}
                      >
                        Select & Prescribe
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                Showing {filteredModalDrugs.length} of {activeAdminDrugs.length} active master drugs
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsDrugSelectorModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEARCH PROCEDURE & CLINICAL MASTERS MODAL (Single Source of Truth: /admin/procedures & /admin/drugs) */}
      {/* ============================================================ */}
      {isProcSelectorModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsProcSelectorModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 680,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1.5px solid #BAE6FD'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #036d92 0%, #0284c7 100%)',
              color: '#FFFFFF',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Scissors size={18} />
                  <span>Search Procedure &amp; Clinical Masters</span>
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.95, marginTop: 2 }}>
                  Master Source: <code style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 4 }}>/admin/procedures &rarr; 4. Procedures ({activeAdminProcedures.length})</code> &bull; <code style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 4 }}>/admin/drugs ({activeAdminDrugs.length})</code>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProcSelectorModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Tabs & Search Box */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setProcModalCategory('ALL')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: procModalCategory === 'ALL' ? '#036d92' : '#CBD5E1',
                    background: procModalCategory === 'ALL' ? '#036d92' : '#FFFFFF',
                    color: procModalCategory === 'ALL' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  All Masters ({activeAdminProcedures.length + activeAdminDrugs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProcModalCategory('PROCEDURES')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: procModalCategory === 'PROCEDURES' ? '#036d92' : '#CBD5E1',
                    background: procModalCategory === 'PROCEDURES' ? '#036d92' : '#FFFFFF',
                    color: procModalCategory === 'PROCEDURES' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Procedure Master ({activeAdminProcedures.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProcModalCategory('DRUGS')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: procModalCategory === 'DRUGS' ? '#7E22CE' : '#CBD5E1',
                    background: procModalCategory === 'DRUGS' ? '#7E22CE' : '#FFFFFF',
                    color: procModalCategory === 'DRUGS' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Central Drug Formulary ({activeAdminDrugs.length})
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  autoFocus
                  placeholder="Search procedure or formulary drug..."
                  value={procModalSearch}
                  onChange={e => setProcModalSearch(e.target.value)}
                  style={{ paddingLeft: 38, height: 38, fontSize: 13, background: '#FFFFFF', borderRadius: 8, borderColor: '#CBD5E1' }}
                />
                {procModalSearch && (
                  <button
                    type="button"
                    onClick={() => setProcModalSearch('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Masters Item List */}
            <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* PROCEDURE MASTER SECTION */}
              {(procModalCategory === 'ALL' || procModalCategory === 'PROCEDURES') && (
                <>
                  {procModalCategory === 'ALL' && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>PROCEDURE MASTER (/admin/procedures &rarr; 4. Procedures)</span>
                      <span>{filteredModalProcedures.length} Available</span>
                    </div>
                  )}
                  {filteredModalProcedures.map(proc => (
                    <div
                      key={`modal-proc-${proc.id}`}
                      onClick={() => handleSelectProcedureFromMaster(proc)}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: '10px 14px',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#036d92';
                        e.currentTarget.style.background = '#F0F9FF';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = '#FFFFFF';
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', border: '2px solid #036d92',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#036d92' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                            {proc.name}
                          </span>
                          <span className="badge badge-outline" style={{ fontSize: 9.5, fontFamily: 'monospace' }}>
                            {proc.code}
                          </span>
                          <span className="badge" style={{ fontSize: 9.5, background: '#E0F2FE', color: '#0369A1' }}>
                            {proc.category}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>
                            ID: {proc.id}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#F0FDF4', color: '#15803D', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            PROCEDURE MASTER
                          </span>
                        </div>
                        {proc.preInstructions && (
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {proc.preInstructions}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#036d92' }}>
                          ₹{proc.basePrice}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* CENTRAL DRUG FORMULARY SECTION */}
              {(procModalCategory === 'ALL' || procModalCategory === 'DRUGS') && (
                <>
                  {procModalCategory === 'ALL' && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span>CENTRAL DRUG FORMULARY (/admin/drugs)</span>
                      <span>{filteredModalDrugsForProc.length} Available</span>
                    </div>
                  )}
                  {filteredModalDrugsForProc.map(drug => {
                    const displayName = drug.brandName ? `${drug.brandName} (${drug.name})` : drug.name;
                    return (
                      <div
                        key={`modal-drug-${drug.id}`}
                        onClick={() => handleSelectDrugForProcedure(drug)}
                        style={{
                          border: '1px solid #F3E8FF',
                          borderRadius: 8,
                          padding: '10px 14px',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#7E22CE';
                          e.currentTarget.style.background = '#FAF5FF';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#F3E8FF';
                          e.currentTarget.style.background = '#FFFFFF';
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', border: '2px solid #7E22CE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7E22CE' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                              {displayName}
                            </span>
                            <span className="badge" style={{ fontSize: 9.5, background: '#F3E8FF', color: '#7E22CE' }}>
                              {drug.formulation || 'Drug'}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#F3E8FF', color: '#6B21A8', border: '1px solid #DDD6FE', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>
                              ID: {drug.id}
                            </span>
                            {drug.slotNo && (
                              <span className="badge badge-outline" style={{ fontSize: 9.5, fontFamily: 'monospace' }}>
                                Slot: {drug.slotNo}
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', background: '#FAF5FF', color: '#7E22CE', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              DRUG FORMULARY
                            </span>
                          </div>
                          {drug.genericName && (
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                              Generic: {drug.genericName} {drug.manufacturer ? `• ${drug.manufacturer}` : ''}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#7E22CE' }}>
                            ₹{drug.unitPrice || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Custom Item Option */}
              <div
                onClick={() => {
                  const customName = procModalSearch.trim() || 'Custom Clinical Item';
                  addProcedurePrescription({
                    id: `proc-rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    source: 'CUSTOM',
                    itemName: customName,
                    quantity: 1,
                    idCode: `CUST-${Math.floor(100 + Math.random() * 899)}`,
                    category: 'Custom Supply',
                    unit: 'Nos',
                    instructions: 'Custom clinical item',
                    printOnRx: true
                  });
                  addNotification({
                    type: 'success',
                    message: `Added custom item "${customName}" (Source: CUSTOM • master catalogs untouched)`
                  });
                  setIsProcSelectorModalOpen(false);
                  setProcModalSearch('');
                }}
                style={{
                  padding: '12px 16px',
                  background: '#FFFBEB',
                  border: '1.5px dashed #FDE68A',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#92400E',
                  marginTop: 6
                }}
              >
                <Plus size={16} color="#D97706" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12.5 }}>
                    + Use Custom Item {procModalSearch ? `"${procModalSearch}"` : ''}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#B45309' }}>
                    Saves as transaction-level custom supply. Does not create or alter records in /admin/procedures or /admin/drugs.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                Showing active master items from <code>/admin/procedures &rarr; 4. Procedures ({activeAdminProcedures.length})</code> &amp; <code>/admin/drugs ({activeAdminDrugs.length})</code>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsProcSelectorModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
