'use client';
import EncounterTimeline from '@/components/EncounterTimeline';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Phone, Mail, MapPin, Calendar, Heart, FileText,
  CreditCard, Upload, Tag, Printer, SquareCheckBig,
  CalendarPlus, ArrowLeft, CheckCircle2, AlertCircle,
  Clock, ShieldAlert, FileSignature, Activity, Plus, X,
  QrCode, Lock, Unlock, Edit3, Trash2, Smartphone, Send,
  HelpCircle, Eye, FileCheck, Check, Wallet, Stethoscope,
  ArrowUp, Layers, Camera
} from 'lucide-react';
import {
  usePatientStore, useAppointmentStore, useBillingStore,
  useClinicalStore, useLabStore, useQueueStore, useUIStore, useConsultationStore,
  Patient, BillRecord, BillItem, ClinicalRecord, LabDocument
} from '@/store';
import ClinicalProcedureImageManagement from '@/components/ClinicalProcedureImageManagement';
import TreatmentProtocolManager from '@/components/TreatmentProtocolManager';

// Consent form templates
const CONSENT_TEMPLATES = {
  laser: {
    title: 'Diode Laser Hair Removal',
    gujarati: 'હું, આથી ક્લિનિક અને ડૉક્ટરને પ્રક્રિયા કરવા માટે અધિકૃત કરું છું. મને સંભવિત જોખમો, અપેક્ષિત પરિણામો અને પ્રક્રિયા પછીની સંભાળ વિશે સંપૂર્ણ માહિતી આપવામાં આવી છે. હું સ્વેચ્છાએ આ સારવાર માટે સંમતિ આપું છું.',
    hindi: 'मैं, एतद्द्वारा क्लिनિક और डॉक्टर को इस प्रक्रिया को करने हेतु अधिकृत करता/करती हूँ। मुझे संभावित जोखिमों, अपेक्षित परिणामों और उपचार के बाद की देखभाल के बारे में पूरी जानकारी दी गई है।',
    english: 'I hereby authorize MedFlow Clinic and the attending physician to perform the Diode Laser Hair Removal procedure. I have been fully informed regarding the potential risks, post-treatment care, and expected outcomes, and provide my voluntary consent.'
  },
  prp: {
    title: 'PRP (Platelet-Rich Plasma) Therapy',
    gujarati: 'હું, આથી પ્લેટલેટ-રીચ પ્લાઝ્મા (PRP) થેરાપી માટે મારી સંમતિ આપું છું. મારા લોહીમાંથી પ્લાઝ્મા અલગ કરી સારવાર માટે ઉપયોગ કરવામાં આવશે તે બાબત મને સમજાવવામાં આવી છે.',
    hindi: 'मैं, एतद्द्वारा पीआरपी (प्लेटलेट-रिच प्लाज्मा) थेरेपी कराने हेतु अपनी सहमति प्रदान करता/करती हूँ। प्रक्रिया और आवश्यक सावधानियों को मैंने समझ लिया है।',
    english: 'I hereby grant informed consent for the Platelet-Rich Plasma (PRP) procedure. The process of autologous blood collection, centrifugation, and reinjection has been clearly explained to me.'
  },
  peel: {
    title: 'Chemical Peel & Facial Resurfacing',
    gujarati: 'હું, કેમિકલ પીલ પ્રક્રિયા માટે સંમતિ આપું છું. સારવાર બાદ હળવી લાલાશ અથવા ચામડીનું છોલાવું સામાન્ય છે તેની મને જાણ કરવામાં આવી છે.',
    hindi: 'मैं, केमिकल पील प्रक्रिया कराने की सहमति देता/देती हूँ। उपचार उपरांत हल्की लालिमा और त्वचा की देखभाल के निर्देशों से मैं अवगत हूँ।',
    english: 'I consent to undergo clinical chemical peeling and skin resurfacing. Expected temporary erythema, flaking, and strict sun-protection guidelines have been reviewed with me.'
  },
  minorSurg: {
    title: 'Minor OPD Surgical Procedure & Biopsy',
    gujarati: 'હું, નાના સર્જિકલ પ્રક્રિયા અથવા બાયોપ્સી માટે સ્વેચ્છાએ મંજૂરી આપું છું. સ્થાનિક એનેસ્થેસિયાના ઉપયોગ વિશે મારી સંમતિ છે.',
    hindi: 'मैं, लघु ओपीडी शल्य प्रक्रिया अथवा बायोप्सी हेतु अपनी सहमति देता/देती हूँ। स्थानीय एनेस्थीसिया के प्रयोग से मैं सहमत हूँ।',
    english: 'I hereby consent to the planned minor OPD surgical procedure and specimen biopsy under local anesthesia as explained by the attending surgeon.'
  }
};

function PatientHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();

  const { patients, updatePatient, getPatientById } = usePatientStore();
  const { appointments } = useAppointmentStore();
  const { bills, addBill } = useBillingStore();
  const { records, addRecord } = useClinicalStore();
  const { documents, addDocument, deleteDocument } = useLabStore();
  const { queue, updateQueueEntry, completeCheckout } = useQueueStore();
  const { addNotification } = useUIStore();

  const patient = patients.find(p => p.id === patientId) || getPatientById(patientId);

  // Client hydration check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Active Tab & View Mode
  const [activeTab, setActiveTab] = useState<'profile' | 'clinical' | 'timeline' | 'documents' | 'procedures' | 'consent' | 'billing'>('profile');
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');

  // Sync bill items from doctor consultation if available
  useEffect(() => {
    const existingBill = bills.find(b => b.patientId === patientId);
    if (existingBill && existingBill.items && existingBill.items.length > 0) {
      setBillItems(existingBill.items);
      const total = existingBill.items.reduce((s, i) => s + i.total, 0);
      setPaymentSplits([{ mode: 'UPI_QR', amount: total }]);
      if (existingBill.status === 'FOC') setIsFoc(true);
    }
  }, [patientId, bills]);

  // Check URL hash on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'clinical', 'timeline', 'documents', 'procedures', 'consent', 'billing'].includes(hash)) {
        setActiveTab(hash as any);
        setTimeout(() => {
          const el = document.getElementById(`section-${hash}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, []);

  // Auto-highlight active tab as user scrolls vertically
  useEffect(() => {
    if (viewMode !== 'all') return;

    const sectionIds = ['profile', 'clinical', 'timeline', 'documents', 'procedures', 'consent', 'billing'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${sectionIds[i]}`);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            setActiveTab(sectionIds[i] as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  const scrollToSection = (tabId: string) => {
    setActiveTab(tabId as any);
    if (viewMode === 'all') {
      const el = document.getElementById(`section-${tabId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // 11.0 Session Lock Check
  const activeSessionEntry = queue.find(q => q.patientId === patientId && q.status === 'IN_SESSION');
  const [overrideLock, setOverrideLock] = useState(false);
  const isFileLocked = !!activeSessionEntry && !overrideLock;

  // 11.1 Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: patient?.firstName || '',
    middleName: patient?.middleName || '',
    lastName: patient?.lastName || '',
    mobile: patient?.mobile || '',
    bloodGroup: patient?.bloodGroup || '',
    city: patient?.city || '',
    address: patient?.address || '',
    emergencyContact: patient?.emergencyContact || '',
    tags: patient?.tags ? patient.tags.join(', ') : ''
  });

  // Sync edit form data once client rehydrates patient from store
  useEffect(() => {
    if (patient) {
      setEditFormData({
        firstName: patient.firstName || '',
        middleName: patient.middleName || '',
        lastName: patient.lastName || '',
        mobile: patient.mobile || '',
        bloodGroup: patient.bloodGroup || '',
        city: patient.city || '',
        address: patient.address || '',
        emergencyContact: patient.emergencyContact || '',
        tags: patient.tags ? patient.tags.join(', ') : ''
      });
    }
  }, [patient]);

  // 11.2 Clinical Data Form State
  const [vitals, setVitals] = useState({
    temp: '98.6',
    pulse: '76',
    bpSystolic: '120',
    bpDiastolic: '80',
    weight: '68',
    height: '172',
    spo2: '99',
  });
  const [complaintForm, setComplaintForm] = useState({
    symptoms: 'Mild irritation, redness on dorsal skin',
    durationYears: '0',
    durationMonths: '0',
    durationDays: '4',
    severity: 'MODERATE' as 'MILD' | 'MODERATE' | 'SEVERE',
    onset: 'Gradual onset after sun exposure',
    aggravating: 'Sunlight and heat',
    relieving: 'Cold water compress',
    medicalHistory: 'No known chronic systemic illnesses'
  });
  const [vitalsSaved, setVitalsSaved] = useState(false);

  // Calculated BMI
  const weightKg = parseFloat(vitals.weight) || 0;
  const heightM = (parseFloat(vitals.height) || 0) / 100;
  const calculatedBMI = (weightKg > 0 && heightM > 0) ? (weightKg / (heightM * heightM)).toFixed(1) : '—';
  const getBMICategory = (bmiNum: number) => {
    if (bmiNum < 18.5) return { label: 'Underweight', color: 'var(--warning)' };
    if (bmiNum <= 24.9) return { label: 'Normal Weight', color: 'var(--success)' };
    if (bmiNum <= 29.9) return { label: 'Overweight', color: 'var(--warning)' };
    return { label: 'Obese', color: 'var(--danger)' };
  };

  // 11.4 Document Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docUploadForm, setDocUploadForm] = useState({
    title: '',
    category: 'Lab Report' as any,
    reportNumber: 'REP-2026-089',
    labName: 'Surat Pathcare Diagnostics',
    reportDate: '2026-09-19',
    fileName: 'blood_investigation_cbcd.pdf',
  });

  // 11.5 Consent Tab State
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof typeof CONSENT_TEMPLATES>('laser');
  const [consentLanguage, setConsentLanguage] = useState<'Gujarati' | 'Hindi' | 'English'>('Gujarati');
  const [consentRecorded, setConsentRecorded] = useState(false);
  const [showUploadConsentModal, setShowUploadConsentModal] = useState(false);

  // 11.7 Billing Tab State (6 Core Clinical Categories)
  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: '1', name: '1. Initial Consultation Fee (Dr. Raj Valaki)', unitPrice: 500, quantity: 1, discount: 0, total: 500 },
    { id: '2', name: '2. Procedure: Diode Laser Hair Removal', unitPrice: 2500, quantity: 1, discount: 0, total: 2500 },
    { id: '3', name: '3. Procedure Consumables & Disposable Pack', unitPrice: 350, quantity: 1, discount: 0, total: 350 },
    { id: '4', name: '4. Pharmacy: Tab Levocetirizine 5mg (10s)', unitPrice: 85, quantity: 1, discount: 0, total: 85 },
    { id: '5', name: '5. Topical Formulation: Mupirocin Ointment 5g', unitPrice: 165, quantity: 1, discount: 0, total: 165 },
    { id: '6', name: '6. Lab Investigation: Serum IgE Total', unitPrice: 800, quantity: 1, discount: 0, total: 800 },
  ]);
  const [previouslyPaidAdvance, setPreviouslyPaidAdvance] = useState(500);
  const [isFoc, setIsFoc] = useState(false);
  const [focReason, setFocReason] = useState('');
  const [focPin, setFocPin] = useState('');
  const [focPinError, setFocPinError] = useState('');
  const [paymentSplits, setPaymentSplits] = useState<{ mode: 'CASH' | 'CARD' | 'UPI_QR' | 'BANK_TRANSFER' | 'RAZORPAY'; amount: number; txnId?: string }[]>([
    { mode: 'CASH', amount: 1900 },
    { mode: 'UPI_QR', amount: 2000, txnId: 'UPI-891234981' }
  ]);
  const [showUPIQRModal, setShowUPIQRModal] = useState(false);
  const [showRemoteSMSModal, setShowRemoteSMSModal] = useState(false);
  const [remoteSMSSent, setRemoteSMSSent] = useState(false);
  const [showTaxInvoiceModal, setShowTaxInvoiceModal] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<BillRecord | null>(null);

  // Relations (safely resolved)
  const patientAppointments = appointments.filter(a => a.patientId === patient?.id);
  const patientBills = bills.filter(b => b.patientId === patient?.id);
  const patientRecords = records.filter(r => r.patientId === patient?.id);
  const patientLabs = documents.filter(d => d.patientId === patient?.id);

  const totalBilled = patientBills.reduce((sum, b) => sum + b.netAmount, 0);
  const totalPaid = patientBills.reduce((sum, b) => sum + b.collectedAmount, 0);
  const totalBalance = patientBills.reduce((sum, b) => sum + b.balance, 0);

  // Save Vitals & Intake Handler
  const handleSaveVitals = () => {
    if (!patient) return;
    addRecord({
      patientId: patient.id,
      date: '2026-09-19',
      doctorName: activeSessionEntry?.doctorName || 'Dr. Raj Valaki',
      department: 'Outpatient Triage',
      chiefComplaint: complaintForm.symptoms,
      diagnosis: 'Triage Intake Record — ' + complaintForm.severity + ' severity',
      vitals: {
        bp: `${vitals.bpSystolic}/${vitals.bpDiastolic}`,
        pulse: vitals.pulse,
        temp: `${vitals.temp} °F`,
        weight: `${vitals.weight} kg`,
        spo2: `${vitals.spo2} %`
      },
      prescription: []
    });

    // Mark vitals & complaints as true in Queue
    const qEntry = queue.find(q => q.patientId === patient.id);
    if (qEntry) {
      updateQueueEntry(qEntry.id, {
        vitalsRecorded: true,
        complaintsRecorded: true
      });
    }

    setVitalsSaved(true);
    addNotification({
      type: 'success',
      message: `Triage vitals & chief complaints recorded for ${patient.firstName} ${patient.lastName}`
    });
  };

  // Save Profile Handler
  const handleSaveProfile = () => {
    if (!patient) return;
    updatePatient(patient.id, {
      firstName: editFormData.firstName,
      middleName: editFormData.middleName,
      lastName: editFormData.lastName,
      mobile: editFormData.mobile,
      bloodGroup: editFormData.bloodGroup,
      city: editFormData.city,
      address: editFormData.address,
      emergencyContact: editFormData.emergencyContact,
      tags: editFormData.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    setShowEditProfileModal(false);
    addNotification({
      type: 'success',
      message: `Updated profile details for ${editFormData.firstName} ${editFormData.lastName}`
    });
  };

  // Document Upload Handler
  const handleAddDocument = () => {
    if (!patient || !docUploadForm.title.trim()) return;
    addDocument({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      mrdNumber: patient.mrdNumber,
      title: docUploadForm.title,
      category: docUploadForm.category,
      fileName: docUploadForm.fileName,
      fileSize: '1.8 MB',
      status: 'Attached to EHR',
      doctorName: activeSessionEntry?.doctorName || 'Dr. Raj Valaki'
    });
    setShowUploadModal(false);
    addNotification({
      type: 'success',
      message: `Uploaded "${docUploadForm.title}" and linked to patient file.`
    });
  };

  // Billing calculations
  const grossBillTotal = isFoc ? 0 : billItems.reduce((s, i) => s + i.total, 0);
  const netPayable = isFoc ? 0 : grossBillTotal;
  const balanceDue = isFoc ? 0 : Math.max(0, netPayable - previouslyPaidAdvance);

  // Auto-populate from Consultation Session
  const handleAutoPopulateBill = () => {
    const consultationSession = useConsultationStore.getState().sessions[patientId] ||
      (useConsultationStore.getState().activeSession?.patientId === patient?.id ? useConsultationStore.getState().activeSession : null) ||
      Object.values(useConsultationStore.getState().sessions).find(s => s.patientId === patient?.id) ||
      useConsultationStore.getState().sessions['C005-001-23092026'];

    if (consultationSession) {
      const items: BillItem[] = [
        {
          id: 'b-cons',
          name: `1. Consultation Fee (${consultationSession.doctorName || 'Dr. Raj Valaki'})`,
          unitPrice: consultationSession.billing?.isFoc ? 0 : (consultationSession.billing?.consultationFee || 500),
          quantity: 1,
          discount: 0,
          total: consultationSession.billing?.isFoc ? 0 : (consultationSession.billing?.consultationFee || 500)
        }
      ];

      (consultationSession.procedures || []).forEach((p, idx) => {
        items.push({
          id: `b-proc-${idx}`,
          name: `2. Procedure: ${p.procedureName} (${p.sessionsCount || 'Session 1'})`,
          unitPrice: p.price || 2500,
          quantity: 1,
          discount: 0,
          total: p.price || 2500
        });
      });

      (consultationSession.procedurePrescriptions || []).forEach((c, idx) => {
        items.push({
          id: `b-consumable-${idx}`,
          name: `3. Consumable: ${c.itemName} (${c.unit || 'Pack'})`,
          unitPrice: 350,
          quantity: c.quantity || 1,
          discount: 0,
          total: 350 * (c.quantity || 1)
        });
      });

      (consultationSession.prescriptions || []).forEach((rx, idx) => {
        const drugPrice = typeof rx.price === 'number' ? rx.price : parseFloat(String(rx.price || '0')) || 85;
        const qty = typeof rx.totalQty === 'number' ? rx.totalQty : parseInt(String(rx.totalQty || '1')) || 1;
        items.push({
          id: `b-rx-${idx}`,
          name: `4. Pharmacy: ${rx.drugName} (${rx.dosage})`,
          unitPrice: drugPrice,
          quantity: qty,
          discount: 0,
          total: drugPrice * qty
        });
      });

      (consultationSession.investigations || []).forEach((inv, idx) => {
        items.push({
          id: `b-lab-${idx}`,
          name: `6. Lab Investigation: ${inv.testName}`,
          unitPrice: inv.price || 800,
          quantity: 1,
          discount: 0,
          total: inv.price || 800
        });
      });

      setBillItems(items);
      const gross = items.reduce((s, i) => s + i.total, 0);
      const due = Math.max(0, gross - previouslyPaidAdvance);
      const half1 = Math.floor(due / 2);
      const half2 = due - half1;
      setPaymentSplits([
        { mode: 'CASH', amount: half1 },
        { mode: 'UPI_QR', amount: half2, txnId: `UPI-${Date.now().toString().slice(-6)}` }
      ]);
      addNotification({
        type: 'success',
        message: `Auto-populated ${items.length} billable items from Dr. Raj Valaki consultation session!`
      });
    } else {
      const standard6: BillItem[] = [
        { id: '1', name: '1. Initial Consultation Fee (Dr. Raj Valaki)', unitPrice: 500, quantity: 1, discount: 0, total: 500 },
        { id: '2', name: '2. Procedure: Diode Laser Hair Removal', unitPrice: 2500, quantity: 1, discount: 0, total: 2500 },
        { id: '3', name: '3. Procedure Consumables & Disposable Pack', unitPrice: 350, quantity: 1, discount: 0, total: 350 },
        { id: '4', name: '4. Pharmacy: Tab Levocetirizine 5mg (10s)', unitPrice: 85, quantity: 1, discount: 0, total: 85 },
        { id: '5', name: '5. Topical Formulation: Mupirocin Ointment 5g', unitPrice: 165, quantity: 1, discount: 0, total: 165 },
        { id: '6', name: '6. Lab Investigation: Serum IgE Total', unitPrice: 800, quantity: 1, discount: 0, total: 800 },
      ];
      setBillItems(standard6);
      setPreviouslyPaidAdvance(500);
      setPaymentSplits([
        { mode: 'CASH', amount: 1900 },
        { mode: 'UPI_QR', amount: 2000, txnId: 'UPI-891234981' }
      ]);
      addNotification({
        type: 'info',
        message: 'Loaded standard 6-category clinical billing structure (Consultation, Procedure, Consumables, Pharmacy, Topical, Lab).'
      });
    }
  };

  // Settlement Handler
  const handleFinalizeSettlement = () => {
    if (isFoc) {
      if (!focReason.trim()) {
        alert('Mandatory FOC justification reason must be specified.');
        return;
      }
      if (focPin !== '1234') {
        setFocPinError('Invalid Supervisor FOC PIN. Contact clinic administrator (Default: 1234).');
        return;
      }
    }

    const totalSplitPaid = isFoc ? 0 : paymentSplits.reduce((s, p) => s + p.amount, 0);
    const invoiceNumber = `INV-2026-${String(bills.length + 92).padStart(4, '0')}`;

    const newBillRecord: BillRecord = {
      id: `bill-${Date.now()}`,
      invoiceNumber,
      patientId: patient!.id,
      patientName: `${patient!.firstName} ${patient!.lastName}`,
      mrdNumber: patient!.mrdNumber,
      doctorName: activeSessionEntry?.doctorName || 'Dr. Raj Valaki',
      date: new Date().toLocaleDateString('en-IN'),
      netAmount: netPayable,
      collectedAmount: isFoc ? 0 : previouslyPaidAdvance + totalSplitPaid,
      balance: isFoc ? 0 : Math.max(0, balanceDue - totalSplitPaid),
      status: isFoc ? 'FOC' : (balanceDue - totalSplitPaid <= 0 ? 'PAID' : 'PARTIAL'),
      paymentMode: isFoc ? 'FOC' : paymentSplits[0]?.mode === 'UPI_QR' ? 'UPI' : (paymentSplits[0]?.mode as any) || 'CASH',
      items: billItems
    };

    addBill(newBillRecord);

    // Mark Queue entry as COMPLETED & PAID
    const qEntry = queue.find(q => q.patientId === patient?.id && (q.status === 'BILLING_PENDING' || q.status === 'WAITING' || q.status === 'CALLING' || q.status === 'IN_SESSION'));
    if (qEntry) {
      completeCheckout(qEntry.id);
    }

    setCreatedInvoiceData(newBillRecord);
    setShowTaxInvoiceModal(true);

    addNotification({
      type: 'success',
      message: `Settled checkout for ${patient?.firstName} ${patient?.lastName}: ₹${totalSplitPaid + previouslyPaidAdvance}. Invoice ${invoiceNumber} issued.`
    });
  };

  const handleQuickSendToDoctor = () => {
    if (!patient) return;
    const existing = queue.find(q => q.patientId === patient.id && q.status !== 'COMPLETED' && q.status !== 'CANCELLED');
    if (existing) {
      updateQueueEntry(existing.id, { stage: 'DOCTOR', status: 'WAITING' });
      addNotification({
        type: 'success',
        message: `${patient.firstName} ${patient.lastName} (${existing.tokenDisplay}) routed to Doctor Queue.`
      });
      router.push('/doctor/dashboard');
      return;
    }

    const tokenIndex = queue.length + 1;
    const tokenCode = `C${String(tokenIndex).padStart(3, '0')}`;
    const caseNumber = `${tokenCode}-001-${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}`;
    const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    useQueueStore.getState().addToQueue({
      caseNumber,
      tokenDisplay: tokenCode,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: 'doc-1',
      doctorName: 'Dr. Raj Valaki',
      visitType: 'Consultation',
      appointmentTime: checkInTime,
      checkInTime,
      age: patient.age,
      gender: patient.gender,
      city: patient.city || 'Surat',
      billingStatus: 'PAID',
      status: 'WAITING',
      stage: 'DOCTOR',
      vitalsRecorded: false,
      complaintsRecorded: false,
      isNew: false
    });

    useConsultationStore.getState().initSession(
      caseNumber,
      patient,
      {
        id: 'doc-1',
        name: 'Dr. Raj Valaki',
        specialization: 'General Physician',
        initials: 'RV',
        avatarColor: '#036d92',
        room: 'Cabin 1'
      }
    );

    addNotification({
      type: 'success',
      message: `${patient.firstName} ${patient.lastName} queued as Token ${tokenCode} for Dr. Raj Valaki!`
    });
    router.push('/doctor/dashboard');
  };

  if (!isMounted) {
    return (
      <div className="page-container" style={{ padding: '24px 0', minHeight: '80vh' }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: 18, width: 180, background: '#E2E8F0', borderRadius: 4 }} />
          <div style={{ height: 18, width: 220, background: '#E2E8F0', borderRadius: 4 }} />
        </div>
        <div className="card" style={{ padding: 24, marginBottom: 20, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#E2E8F0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <div style={{ height: 26, width: 260, background: '#E2E8F0', borderRadius: 6 }} />
              <div style={{ height: 16, width: 380, background: '#F1F5F9', borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>Patient Record Not Found</h2>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
            Unable to find active record for Patient ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{patientId}</span>
          </p>
          <Link href="/reception/search" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={16} /> Return to Patient Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/reception/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Patient Directory
        </Link>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Reception Central • Patient Hub & Clinical Workspace
        </div>
      </div>

      {/* 11.0 Concurrent Session File Lock Banner */}
      {isFileLocked && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          border: '2px solid #EF4444', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0
            }}>
              <Lock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                Clinical File Locked 🔒 (Active Consultation In Progress)
                <span className="badge badge-danger" style={{ animation: 'pulse 1.5s infinite' }}>IN_SESSION</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#7F1D1D', marginTop: 3 }}>
                Patient is currently inside the cabin with <strong>{activeSessionEntry.doctorName}</strong> ({activeSessionEntry.tokenDisplay}).
                Front-desk editing of clinical intake, vitals, and billing is locked to prevent concurrency write collisions.
              </div>
            </div>
          </div>

          <button
            onClick={() => setOverrideLock(true)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#DC2626', color: '#DC2626', background: '#FFFFFF', flexShrink: 0 }}
          >
            <Unlock size={14} /> Supervisor Override
          </button>
        </div>
      )}

      {/* Patient Hero Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="avatar" suppressHydrationWarning style={{
              width: 68, height: 68, fontSize: 26,
              background: patient.gender === 'F' ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'linear-gradient(135deg, #EA580C, #F97316)'
            }}>
              {(patient.firstName?.[0] || 'P').toUpperCase()}{(patient.lastName?.[0] || '').toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }} suppressHydrationWarning>
                  {patient.firstName}{patient.middleName ? ' ' + patient.middleName : ''} {patient.lastName}
                </h1>
                <span className="badge badge-primary" style={{ fontSize: 13, padding: '4px 12px', fontFamily: 'monospace', fontWeight: 800 }} suppressHydrationWarning>
                  {patient.mrdNumber}
                </span>
                {patient.tags?.map(t => (
                  <span key={t} className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>
                    {t}
                  </span>
                ))}
                {activeSessionEntry && (
                  <span className="badge badge-danger" style={{ fontSize: 11, fontWeight: 800 }}>
                    Cabin: {activeSessionEntry.tokenDisplay}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span><strong>Demographics:</strong> {patient.age} Yrs ({patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'})</span>
                <span>•</span>
                <span><strong>Phone:</strong> {patient.mobile}</span>
                <span>•</span>
                <span><strong>Blood:</strong> <span style={{ color: 'var(--danger)', fontWeight: 800 }}>{patient.bloodGroup || 'Not Tested'}</span></span>
                <span>•</span>
                <span><strong>Language:</strong> {patient.language}</span>
                <span>•</span>
                <span><strong>City:</strong> {patient.city || 'Surat'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowEditProfileModal(true)} className="btn btn-outline btn-sm">
              <Edit3 size={14} /> Edit Profile
            </button>

            <Link className="btn btn-primary btn-sm" href={`/reception/checkin?patientId=${patient.id}`}>
              <SquareCheckBig size={14} /> Check in
            </Link>

            <button
              onClick={handleQuickSendToDoctor}
              className="btn btn-primary btn-sm"
              style={{ background: '#036d92', borderColor: '#036d92', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              title="Forward Patient Directly to Doctor Consultation"
            >
              <Stethoscope size={14} /> Send to Doctor
            </button>

            <Link href={`/reception/appointments?patientId=${patient.id}`}>
              <button className="btn btn-primary btn-sm">
                <CalendarPlus size={14} /> Book Slot
              </button>
            </Link>

            <Link href={`/reception/patients/${patient.id}/history`}>
              <button className="btn btn-ghost btn-sm">
                <Activity size={14} /> Audit Timeline
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Section 11 Navigation Ribbon */}
      <div
        style={{
          position: 'sticky',
          top: 62,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '8px 14px',
          marginBottom: 20,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
          {[
            { id: 'profile', badge: '11.1', label: 'Profile & Demographics', icon: User, color: '#EA580C' },
            { id: 'clinical', badge: '11.2', label: 'Clinical Data & Summary (Vitals & Complaints)', icon: Heart, color: '#EF4444' },
            { id: 'timeline', badge: '11.3', label: `Timeline & Visits (${patientAppointments.length})`, icon: Calendar, color: '#2563EB' },
            { id: 'documents', badge: '11.4', label: `Documents & Reports (${patientLabs.length})`, icon: Upload, color: '#7C3AED' },
            { id: 'procedures', badge: '11.5', label: 'Clinical Procedures & Images', icon: Camera, color: '#0284C7' },
            { id: 'consent', badge: '11.6', label: 'Consent Form', icon: FileSignature, color: '#059669' },
            { id: 'billing', badge: '11.7', label: `Billing & Settlement (${patientBills.length})`, icon: CreditCard, color: '#0369A1' },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => scrollToSection(t.id)}
                className={`tab-item btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  background: active ? (viewMode === 'all' ? '#0F172A' : t.color) : 'transparent',
                  color: active ? '#FFFFFF' : '#475569',
                  borderColor: active ? (viewMode === 'all' ? '#0F172A' : t.color) : '#E2E8F0',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                  color: active ? '#FFFFFF' : t.color,
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 900
                }}>
                  {t.badge}
                </span>
                <Icon size={14} color={active ? '#FFFFFF' : t.color} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher & Quick Scroll Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'all' ? 'single' : 'all')}
            className={`btn btn-sm ${viewMode === 'all' ? 'btn-success' : 'btn-outline'}`}
            style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', gap: 5 }}
            title={viewMode === 'all' ? 'All 6 sections rendered in continuous vertical scroll' : 'Switch to single tab view'}
          >
            <Layers size={13} />
            {viewMode === 'all' ? 'Vertical Scroll: All Active' : 'Single Tab View'}
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn btn-ghost btn-icon btn-sm"
            title="Scroll to Top"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 11.1 Profile Section */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'profile') && (
        <div
          id="section-profile"
          style={{
            scrollMarginTop: 136,
            marginBottom: viewMode === 'all' ? 36 : 0
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #EA580C',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#EA580C',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.1
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Profile & Demographics
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Patient Identification, Extended Demographics, Emergency Contact & Flags
              </span>
            </div>
            <button onClick={() => setShowEditProfileModal(true)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
              <Edit3 size={13} /> Edit Profile
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><User size={16} color="var(--primary)" /> Complete Identification & Contact Profile</span>
              <button onClick={() => setShowEditProfileModal(true)} className="btn btn-ghost btn-sm">
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Legal Name</div>
                  <div style={{ fontWeight: 700, marginTop: 2, fontSize: 15 }}>{patient.firstName} {patient.middleName} {patient.lastName}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Permanent MRD (Hospital ID)</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', marginTop: 2, fontSize: 15 }}>
                    {patient.mrdNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Date of Birth</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{patient.dob || '1981-04-13'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Exact Age</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {patient.age} Years {patient.ageMonths || 0} Mos {patient.ageDays || 0} Days
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Primary Language</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{patient.language}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mobile Number</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{patient.mobile}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Blood Group</div>
                  <span className="badge badge-danger" style={{ marginTop: 2 }}>{patient.bloodGroup || 'B+'}</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Residential Address</div>
                <div style={{ fontWeight: 500, marginTop: 4 }}>
                  {patient.address || 'Flat 402, Shivalik Heights, Ring Road'}, {patient.city || 'Surat'}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Emergency Contact / Guardian</div>
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginTop: 2 }}>
                  {patient.emergencyContact || 'Kishore Kumar (Brother) — +91 9825100099'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Flags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="stat-card primary">
              <div className="stat-label">Total Recorded Encounters</div>
              <div className="stat-value">{patientAppointments.length + (patient.lastVisit ? 1 : 0)}</div>
              <div className="stat-sub">Registered since: {patient.createdAt}</div>
            </div>

            <div className="stat-card success">
              <div className="stat-label">Financial Account Ledger</div>
              <div className="stat-value">₹{totalBalance} Due</div>
              <div className="stat-sub">Billed: ₹{totalBilled} | Collected: ₹{totalPaid}</div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title"><ShieldAlert size={16} color="var(--warning)" /> Active Medical Flags & Allergies</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {patient.tags && patient.tags.length > 0 ? (
                    patient.tags.map(t => (
                      <span key={t} className="badge badge-warning" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {t}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No critical alerts active.</span>
                  )}
                  <span className="badge badge-danger" style={{ fontSize: 12, padding: '4px 10px' }}>
                    Allergy: Penicillin
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11.2 Clinical Data (Vitals & Complaints) */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'clinical') && (
        <div
          id="section-clinical"
          style={{
            scrollMarginTop: 136,
            marginBottom: viewMode === 'all' ? 36 : 0
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #EF4444',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.2
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Clinical Data (Vitals & Complaints)
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Patient Triage Vitals, BMI Calculation & Chief Complaints
              </span>
            </div>
            {vitalsSaved && <span className="badge badge-success">Vitals Recorded ✓</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: 20 }}>
          {/* Vitals Recording Strip */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Heart size={16} color="var(--danger)" /> Patient Triage Vitals</span>
              {vitalsSaved && <span className="badge badge-success">Saved ✓</span>}
            </div>

            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">Body Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={vitals.temp}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Pulse (bpm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={vitals.pulse}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={vitals.bpSystolic}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, bpSystolic: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={vitals.bpDiastolic}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={vitals.weight}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={vitals.height}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, height: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">SpO2 Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={vitals.spo2}
                    disabled={isFileLocked}
                    onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic Auto-Calculated BMI */}
              <div style={{
                marginTop: 18, padding: 14, background: 'var(--bg-muted)',
                borderRadius: 8, border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Auto-Calculated BMI: Weight / (Height)²
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>
                      {calculatedBMI} kg/m²
                    </div>
                  </div>

                  {calculatedBMI !== '—' && (
                    <span className="badge" style={{
                      background: getBMICategory(parseFloat(calculatedBMI)).color,
                      color: 'white', fontWeight: 800, padding: '6px 12px'
                    }}>
                      {getBMICategory(parseFloat(calculatedBMI)).label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chief Complaints & Intake Form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Activity size={16} color="var(--primary)" /> Chief Complaints & Reason for Visit</span>
            </div>

            <div className="card-body">
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Presenting Symptoms & Intake Summary</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={complaintForm.symptoms}
                  disabled={isFileLocked}
                  onChange={e => setComplaintForm({ ...complaintForm, symptoms: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                <div>
                  <label className="form-label">Duration (Yrs)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={complaintForm.durationYears}
                    disabled={isFileLocked}
                    onChange={e => setComplaintForm({ ...complaintForm, durationYears: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Duration (Mos)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={complaintForm.durationMonths}
                    disabled={isFileLocked}
                    onChange={e => setComplaintForm({ ...complaintForm, durationMonths: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Duration (Days)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={complaintForm.durationDays}
                    disabled={isFileLocked}
                    onChange={e => setComplaintForm({ ...complaintForm, durationDays: e.target.value })}
                  />
                </div>
              </div>

              {/* Severity Selector */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Symptom Severity Level</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['MILD', 'MODERATE', 'SEVERE'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      disabled={isFileLocked}
                      onClick={() => setComplaintForm({ ...complaintForm, severity: sev })}
                      className={`btn ${complaintForm.severity === sev ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      style={{ flex: 1 }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="form-label">Aggravating Factors</label>
                  <input
                    type="text"
                    className="form-input"
                    value={complaintForm.aggravating}
                    disabled={isFileLocked}
                    onChange={e => setComplaintForm({ ...complaintForm, aggravating: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Relieving Factors</label>
                  <input
                    type="text"
                    className="form-input"
                    value={complaintForm.relieving}
                    disabled={isFileLocked}
                    onChange={e => setComplaintForm({ ...complaintForm, relieving: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="form-label">Medical & Surgical History Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={complaintForm.medicalHistory}
                  disabled={isFileLocked}
                  onChange={e => setComplaintForm({ ...complaintForm, medicalHistory: e.target.value })}
                />
              </div>

              <button
                onClick={handleSaveVitals}
                disabled={isFileLocked}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <CheckCircle2 size={16} /> Save Vitals & Intake (Update Queue Status)
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* 11.3 Timeline & Visits */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'timeline') && (
        <div
          id="section-timeline"
          style={{
            scrollMarginTop: 136,
            marginBottom: viewMode === 'all' ? 36 : 0
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #2563EB',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.3
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Timeline & Visits ({patientAppointments.length})
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Chronological Clinical Encounters, Consultation Notes & Past Records
              </span>
            </div>
            <Link href={`/reception/patients/${patient.id}/history`}>
              <button className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                Full Audit View →
              </button>
            </Link>
          </div>

          <EncounterTimeline patientId={patient.id} />

          <div className="card">
          <div className="card-header">
            <span className="card-title"><Calendar size={16} color="var(--primary)" /> Chronological Clinical Encounters & Visits</span>
            <Link href={`/reception/patients/${patient.id}/history`}>
              <button className="btn btn-outline btn-sm">
                Open Full Dedicated Audit View →
              </button>
            </Link>
          </div>

          <div className="card-body">
            {patientRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FileSignature size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontWeight: 600 }}>No prior clinical encounter records found.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Complete today's triage intake or await doctor's consultation notes.</p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 30, borderLeft: '2px solid var(--border)' }}>
                {patientRecords.map((rec, index) => (
                  <div key={rec.id} style={{ marginBottom: 24, position: 'relative' }}>
                    {/* Timeline bullet dot */}
                    <div style={{
                      position: 'absolute', left: -37, top: 4,
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'var(--primary)', border: '3px solid white',
                      boxShadow: '0 0 0 2px var(--primary)'
                    }} />

                    <div style={{ background: 'var(--bg-muted)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                          Consultation: {rec.doctorName}
                        </div>
                        <span className="badge badge-primary">{rec.date}</span>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                        <strong>Diagnosis:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{rec.diagnosis}</span>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                        <strong>Chief Complaint:</strong> {rec.chiefComplaint}
                      </div>

                      <div style={{ display: 'flex', gap: 14, fontSize: 11, background: '#FFFFFF', padding: 8, borderRadius: 6 }}>
                        <span><strong>BP:</strong> {rec.vitals.bp}</span>
                        <span><strong>Pulse:</strong> {rec.vitals.pulse}</span>
                        <span><strong>Temp:</strong> {rec.vitals.temp}</span>
                        <span><strong>Weight:</strong> {rec.vitals.weight}</span>
                        <span><strong>SpO2:</strong> {rec.vitals.spo2}</span>
                      </div>

                      {rec.prescription && rec.prescription.length > 0 && (
                        <div style={{ marginTop: 10, fontSize: 12 }}>
                          <strong>Prescriptions:</strong> {rec.prescription.map(p => p.medicine).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11.4 Documents & Reports */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'documents') && (
        <div
          id="section-documents"
          style={{
            scrollMarginTop: 136,
            marginBottom: viewMode === 'all' ? 36 : 0
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #7C3AED',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#7C3AED',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.4
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Documents & Reports ({patientLabs.length})
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Diagnostic Reports & Clinical Documents Attached to EHR
              </span>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
              <Plus size={13} /> Ingest New Document
            </button>
          </div>

          <div className="card">
          <div className="card-header">
            <span className="card-title"><Upload size={16} color="var(--primary)" /> Diagnostic Reports & Clinical Documents</span>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Ingest New Document
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>File Name</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th>Ordering Doctor</th>
                  <th>EHR Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patientLabs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No diagnostic reports attached yet.
                    </td>
                  </tr>
                ) : (
                  patientLabs.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 700 }}>{doc.title}</td>
                      <td><span className="badge badge-info">{doc.category}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{doc.fileName}</td>
                      <td>{doc.fileSize}</td>
                      <td style={{ fontSize: 12 }}>{doc.uploadedAt}</td>
                      <td>{doc.doctorName}</td>
                      <td>
                        <span className={`badge ${doc.status === 'Attached to EHR' ? 'badge-success' : 'badge-warning'}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => alert(`Simulated secure download of: ${doc.fileName}`)}
                            className="btn btn-ghost btn-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Delete file"
                          >
                            <Trash2 size={13} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11.5 Clinical Procedures & Laser Treatment Protocol (Tab 5) */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'procedures') && (
        <div
          id="section-procedures"
          style={{
            scrollMarginTop: 136,
            marginBottom: viewMode === 'all' ? 36 : 0
          }}
        >
          {/* Section 11.5 Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #0284C7',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.5
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Laser &amp; Clinical Procedure Treatment Protocol
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Unified Single Database Source of Truth with Doctor Consultation • Real-Time Synchronized
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Doctor ⇄ Reception Live Synced
              </span>
            </div>
          </div>

          {/* ⚡ LASER & CLINICAL PROCEDURE TREATMENT PROTOCOL (SINGLE SOURCE OF TRUTH) */}
          <TreatmentProtocolManager
            patientId={patient?.id || patientId}
            patientName={patient ? `${patient.firstName} ${patient.lastName}` : undefined}
            mode="reception"
          />

          {/* Clinical Procedure Image Management & Dermascope Gallery */}
          <div style={{ marginTop: 24 }}>
            <ClinicalProcedureImageManagement patient={patient} />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11.6 Informed Consent Form */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'consent') && (
        <div
          id="section-consent"
          style={{
            scrollMarginTop: 136,
            marginBottom: viewMode === 'all' ? 36 : 0
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #059669',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#059669',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.6
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Informed Consent Form
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Official Medico-Legal Procedure Documentation & Multi-Language Consent
              </span>
            </div>
            {consentRecorded ? (
              <span className="badge badge-success">Consent Form Logged ✓</span>
            ) : (
              <span className="badge badge-warning">Signature Pending</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Controls Bar */}
          <div className="card">
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Select Procedure Template:</span>
                <select
                  className="form-select"
                  value={selectedTemplateKey}
                  onChange={e => setSelectedTemplateKey(e.target.value as any)}
                  style={{ width: 280 }}
                >
                  <option value="laser">Diode Laser Hair Removal</option>
                  <option value="prp">PRP (Platelet-Rich Plasma) Therapy</option>
                  <option value="peel">Chemical Peel & Resurfacing</option>
                  <option value="minorSurg">Minor OPD Surgical Procedure</option>
                </select>
              </div>

              {/* Language Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Language:</span>
                {(['Gujarati', 'Hindi', 'English'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setConsentLanguage(lang)}
                    className={`btn ${consentLanguage === lang ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Medico-Legal Document Card (Matching Section 11.5 Spec ASCII Layout) */}
          <div className="card" style={{ border: '2px solid var(--primary)', background: '#FFFFFF' }}>
            <div className="card-body" style={{ padding: 32 }}>
              {/* Document Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  OFFICIAL MEDICO-LEGAL DOCUMENT
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
                  PATIENT CONSENT FORM – {CONSENT_TEMPLATES[selectedTemplateKey].title.toUpperCase()} ({consentLanguage.toUpperCase()})
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 12, color: 'var(--text-muted)', marginTop: 6, flexWrap: 'wrap' }}>
                  <span><strong>Patient:</strong> {patient.firstName} {patient.lastName}</span>
                  <span>•</span>
                  <span><strong>MRD:</strong> {patient.mrdNumber}</span>
                  <span>•</span>
                  <span><strong>Case No:</strong> C003-001-190926</span>
                  <span>•</span>
                  <span><strong>Physician:</strong> Dr. Raj Valaki</span>
                  <span>•</span>
                  <span><strong>Date:</strong> 19/09/2026</span>
                </div>
              </div>

              {/* Consent Text Body */}
              <div style={{
                fontSize: 15, lineHeight: 1.8, color: '#1E293B',
                background: '#F8FAFC', padding: 24, borderRadius: 8,
                border: '1px solid #E2E8F0', marginBottom: 28
              }}>
                <p style={{ fontWeight: 600 }}>
                  {consentLanguage === 'Gujarati' && (
                    `હું, ${patient.firstName} ${patient.lastName}, ${CONSENT_TEMPLATES[selectedTemplateKey].gujarati}`
                  )}
                  {consentLanguage === 'Hindi' && (
                    `मैं, ${patient.firstName} ${patient.lastName}, ${CONSENT_TEMPLATES[selectedTemplateKey].hindi}`
                  )}
                  {consentLanguage === 'English' && (
                    `I, ${patient.firstName} ${patient.lastName}, ${CONSENT_TEMPLATES[selectedTemplateKey].english}`
                  )}
                </p>
                <p style={{ marginTop: 14, fontSize: 13, color: '#64748B' }}>
                  * This consent is valid for the entire course of this specific procedure session unless formally revoked in writing.
                </p>
              </div>

              {/* Signature Lines */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40, paddingTop: 20 }}>
                <div>
                  <div style={{ borderBottom: '1px solid #0F172A', height: 40, marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Patient / Legal Guardian Signature</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Name: {patient.firstName} {patient.lastName}</div>
                </div>

                <div>
                  <div style={{ borderBottom: '1px solid #0F172A', height: 40, marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Attending Physician / Witness Signature</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dr. Raj Valaki (Reg No: G-34891)</div>
                </div>
              </div>
            </div>

            {/* Footer Action Strip */}
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {consentRecorded ? (
                  <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                    <CheckCircle2 size={13} /> Consent Form Digitally Logged & Validated
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ padding: '6px 12px' }}>
                    Pending Formal Digital Confirmation
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => window.print()} className="btn btn-outline">
                  <Printer size={15} /> Print Consent Form
                </button>

                <button onClick={() => setShowUploadConsentModal(true)} className="btn btn-outline">
                  <Upload size={15} /> Upload Signed Copy
                </button>

                <button
                  onClick={() => {
                    setConsentRecorded(true);
                    addNotification({
                      type: 'success',
                      message: `Consent recorded for ${patient.firstName} ${patient.lastName} (${CONSENT_TEMPLATES[selectedTemplateKey].title})`
                    });
                  }}
                  className="btn btn-primary"
                >
                  <Check size={15} /> Record Consent ✓
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11.6 Billing & Settlement */}
      {/* ============================================================ */}
      {(viewMode === 'all' || activeTab === 'billing') && (
        <div
          id="section-billing"
          style={{
            scrollMarginTop: 136,
            marginBottom: 36
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid var(--border)',
            borderLeft: '5px solid #0369A1',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#0369A1',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6
              }}>
                11.7
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Billing & Settlement ({patientBills.length})
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                • Point-of-Sale Consultation & Procedure Checkout, FOC Waivers, Tender Modes & Split Payments
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Left: Itemized Bill Form (6 Core Categories) */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span className="card-title"><CreditCard size={16} color="var(--primary)" /> Point-of-Sale Checkout (6 Core Categories)</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAutoPopulateBill}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#036d92', color: '#036d92', fontSize: 11.5, fontWeight: 700 }}
                  title="Auto-pull ordered procedures, lab tests, and drugs from doctor consultation"
                >
                  ⚡ Auto-Populate from Consultation
                </button>
                <button
                  type="button"
                  onClick={() => setBillItems([...billItems, {
                    id: String(Date.now()), name: 'Additional Line Item', unitPrice: 250, quantity: 1, discount: 0, total: 250
                  }])}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11.5 }}
                >
                  + Add Line Item
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Itemized Table */}
              <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Service Description</th>
                      <th>Rate (₹)</th>
                      <th>Qty</th>
                      <th>Disc (₹)</th>
                      <th>Total (₹)</th>
                      <th style={{ width: 40 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: 12.5 }}
                            value={item.name}
                            onChange={e => {
                              const updated = [...billItems];
                              updated[idx].name = e.target.value;
                              setBillItems(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 80, padding: '4px 8px', fontSize: 12.5 }}
                            value={item.unitPrice}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...billItems];
                              updated[idx].unitPrice = val;
                              updated[idx].total = (val * updated[idx].quantity) - updated[idx].discount;
                              setBillItems(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 50, padding: '4px 8px', fontSize: 12.5 }}
                            value={item.quantity}
                            onChange={e => {
                              const qty = parseInt(e.target.value) || 1;
                              const updated = [...billItems];
                              updated[idx].quantity = qty;
                              updated[idx].total = (updated[idx].unitPrice * qty) - updated[idx].discount;
                              setBillItems(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 60, padding: '4px 8px', fontSize: 12.5 }}
                            value={item.discount}
                            onChange={e => {
                              const disc = parseFloat(e.target.value) || 0;
                              const updated = [...billItems];
                              updated[idx].discount = disc;
                              updated[idx].total = (updated[idx].unitPrice * updated[idx].quantity) - disc;
                              setBillItems(updated);
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 800 }}>₹{item.total}</td>
                        <td>
                          {billItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setBillItems(billItems.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown (Gross Total, Discount, Previously Paid Advance, Balance Due) */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                padding: '12px 16px', background: '#F8FAFC', borderRadius: 8,
                border: '1px solid #E2E8F0', marginBottom: 16
              }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>GROSS TOTAL</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>₹{grossBillTotal.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DISCOUNT</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#059669', marginTop: 2 }}>₹0</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PREVIOUSLY PAID</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#036d92', marginTop: 2 }}>
                    ₹{previouslyPaidAdvance} <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 800 }}>(Paid ✓)</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>BALANCE DUE</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isFoc ? '#2563EB' : balanceDue > 0 ? '#DC2626' : '#059669', marginTop: 2 }}>
                    {isFoc ? '₹0 (FOC)' : `₹${balanceDue.toLocaleString('en-IN')}`}
                  </div>
                </div>
              </div>

              {/* Free of Charge (FOC) Waiver Section */}
              <div style={{
                padding: 14, background: isFoc ? '#EFF6FF' : '#F8FAFC',
                borderRadius: 8, border: isFoc ? '2px solid #3B82F6' : '1px solid var(--border)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: isFoc ? '#1D4ED8' : 'inherit' }}>
                      Free of Charge (FOC) Waiver Policy
                    </span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Requires supervisor authorization PIN and clinical justification.
                    </p>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={isFoc}
                      onChange={e => setIsFoc(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />
                    Mark as FOC
                  </label>
                </div>

                {isFoc && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginTop: 14 }}>
                    <div>
                      <label className="form-label">Mandatory Justification Reason *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. BPL Cardholder / Hospital Director Waiver / Staff Courtesy"
                        value={focReason}
                        onChange={e => setFocReason(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Supervisor FOC PIN * (Code: 1234)</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Enter 4-digit PIN"
                        value={focPin}
                        onChange={e => {
                          setFocPin(e.target.value);
                          setFocPinError('');
                        }}
                      />
                      {focPinError && <span style={{ color: 'var(--danger)', fontSize: 11 }}>{focPinError}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Payment Modes, Split Payments, QR & Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tender Settlement */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><Wallet size={16} color="var(--primary)" /> Settlement Options &amp; Tender Modes</span>
              </div>

              <div className="card-body">
                {!isFoc ? (
                  <>
                    {/* Primary Tender Mode */}
                    <div style={{ marginBottom: 14 }}>
                      <label className="form-label">Quick Tender Mode</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {(['CASH', 'CARD', 'UPI_QR', 'BANK_TRANSFER'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              const half1 = Math.floor(balanceDue / 2);
                              const half2 = balanceDue - half1;
                              if (m === 'CASH') {
                                setPaymentSplits([{ mode: 'CASH', amount: balanceDue }]);
                              } else if (m === 'UPI_QR') {
                                setPaymentSplits([{ mode: 'UPI_QR', amount: balanceDue, txnId: `UPI-${Date.now().toString().slice(-6)}` }]);
                              } else {
                                setPaymentSplits([{ mode: m, amount: balanceDue }]);
                              }
                            }}
                            className={`btn ${paymentSplits[0]?.mode === m ? 'btn-primary' : 'btn-outline'} btn-sm`}
                            style={{ justifyContent: 'center', fontSize: 12 }}
                          >
                            {m === 'UPI_QR' ? 'UPI QR*' : m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Tender Split Tender Section */}
                    <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Multi-Tender Split Payment</span>
                        <span style={{ fontSize: 11, color: '#036d92' }}>Total: ₹{paymentSplits.reduce((s, p) => s + p.amount, 0)} / ₹{balanceDue}</span>
                      </div>

                      {/* Split 1 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Split 1 Mode</label>
                          <select
                            className="form-select"
                            style={{ height: 32, fontSize: 12 }}
                            value={paymentSplits[0]?.mode || 'CASH'}
                            onChange={e => {
                              const updated = [...paymentSplits];
                              updated[0] = { ...updated[0], mode: e.target.value as any };
                              setPaymentSplits(updated);
                            }}
                          >
                            <option value="CASH">CASH</option>
                            <option value="CARD">CREDIT CARD</option>
                            <option value="UPI_QR">UPI QR</option>
                            <option value="BANK_TRANSFER">BANK TRANSFER</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Split 1 Amount (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ height: 32, fontSize: 12, fontWeight: 700 }}
                            value={paymentSplits[0]?.amount ?? 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...paymentSplits];
                              updated[0] = { ...updated[0], amount: val };
                              setPaymentSplits(updated);
                            }}
                          />
                        </div>
                      </div>

                      {/* Split 2 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Split 2 Mode</label>
                          <select
                            className="form-select"
                            style={{ height: 32, fontSize: 12 }}
                            value={paymentSplits[1]?.mode || 'UPI_QR'}
                            onChange={e => {
                              const updated = [...paymentSplits];
                              if (!updated[1]) updated[1] = { mode: 'UPI_QR', amount: 0 };
                              updated[1] = { ...updated[1], mode: e.target.value as any };
                              setPaymentSplits(updated);
                            }}
                          >
                            <option value="UPI_QR">UPI QR*</option>
                            <option value="CASH">CASH</option>
                            <option value="CARD">CREDIT CARD</option>
                            <option value="RAZORPAY">RAZORPAY REMOTE</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Split 2 Amount (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ height: 32, fontSize: 12, fontWeight: 700 }}
                            value={paymentSplits[1]?.amount ?? 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...paymentSplits];
                              if (!updated[1]) updated[1] = { mode: 'UPI_QR', amount: 0 };
                              updated[1] = { ...updated[1], amount: val };
                              setPaymentSplits(updated);
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Split 2 Txn / Ref ID</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 891234981"
                          style={{ height: 30, fontSize: 11.5 }}
                          value={paymentSplits[1]?.txnId || ''}
                          onChange={e => {
                            const updated = [...paymentSplits];
                            if (!updated[1]) updated[1] = { mode: 'UPI_QR', amount: 0 };
                            updated[1] = { ...updated[1], txnId: e.target.value };
                            setPaymentSplits(updated);
                          }}
                        />
                      </div>
                    </div>

                    {/* Instant Dynamic UPI QR Generator */}
                    <div style={{
                      textAlign: 'center', padding: 12, background: '#FFFFFF',
                      border: '1px solid var(--border)', borderRadius: 8, marginBottom: 14
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                        NPCI DYNAMIC UPI QR CODE
                      </div>
                      <div
                        onClick={() => setShowUPIQRModal(true)}
                        style={{
                          width: 120, height: 120, margin: '8px auto',
                          background: '#0F172A', borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <QrCode size={95} color="#FFFFFF" />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowUPIQRModal(true)}>
                        Click to Enlarge Fullscreen QR (₹{balanceDue})
                      </span>
                    </div>

                    {/* Remote SMS / Razorpay Checkout */}
                    <div style={{ marginBottom: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRemoteSMSModal(true);
                          setRemoteSMSSent(false);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                      >
                        <Smartphone size={14} /> Send WhatsApp / SMS Payment Link
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 16, background: '#EFF6FF', borderRadius: 8, textAlign: 'center', color: '#1E40AF', fontSize: 12, marginBottom: 14 }}>
                    Free of Charge (FOC) waiver active. No customer tender required.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleFinalizeSettlement}
                  disabled={isFileLocked}
                  className="btn btn-success"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: 800, fontSize: 14 }}
                >
                  <CheckCircle2 size={16} /> Settle &amp; Print Tax Invoice ✓
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settled Invoices History for this Patient */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="card-title">
              <FileText size={16} color="var(--primary)" /> Settled Invoices History ({patientBills.length})
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Total Invoiced: ₹{totalBilled} • Total Collected: ₹{totalPaid} • Balance Due: ₹{totalBalance}
            </span>
          </div>
          <div className="card-body">
            {patientBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No prior invoices found for this patient. Complete POS checkout above to issue the first tax invoice.
              </div>
            ) : (
              <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Attending Doctor</th>
                      <th>Payment Mode</th>
                      <th>Gross / Net</th>
                      <th>Collected</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientBills.map(b => (
                      <tr key={b.id}>
                        <td><strong style={{ color: '#036d92' }}>{b.invoiceNumber}</strong></td>
                        <td>{b.date}</td>
                        <td>{b.doctorName}</td>
                        <td><span className="badge badge-outline">{b.paymentMode || 'CASH'}</span></td>
                        <td><strong>₹{b.netAmount}</strong></td>
                        <td style={{ color: 'var(--success)' }}>₹{b.collectedAmount}</td>
                        <td style={{ color: b.balance > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          ₹{b.balance}
                        </td>
                        <td>
                          <span className={`badge ${b.status === 'PAID' ? 'badge-success' : b.status === 'FOC' ? 'badge-info' : 'badge-warning'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCreatedInvoiceData(b);
                              setShowTaxInvoiceModal(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 11 }}
                          >
                            <Printer size={13} /> View &amp; Print
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
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit Patient Demographics</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditProfileModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.firstName}
                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.lastName}
                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.mobile}
                    onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Blood Group</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.bloodGroup}
                    onChange={e => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.city}
                    onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Emergency Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.emergencyContact}
                    onChange={e => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Residential Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.address}
                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Clinical Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VIP, Diabetic, Hypertension..."
                    value={editFormData.tags}
                    onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowEditProfileModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Upload Diagnostic Report / Document</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUploadModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Complete Blood Count (CBC) with ESR"
                    value={docUploadForm.title}
                    onChange={e => setDocUploadForm({ ...docUploadForm, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Document Category</label>
                    <select
                      className="form-select"
                      value={docUploadForm.category}
                      onChange={e => setDocUploadForm({ ...docUploadForm, category: e.target.value as any })}
                    >
                      <option value="Lab Report">Lab Report</option>
                      <option value="Radiology">Scan / X-Ray / MRI</option>
                      <option value="Prescription">Prescription File</option>
                      <option value="Consent Form">Consent Form</option>
                      <option value="Other">Other Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Report Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={docUploadForm.reportNumber}
                      onChange={e => setDocUploadForm({ ...docUploadForm, reportNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dropzone Simulation */}
                <div style={{
                  border: '2px dashed var(--primary)', borderRadius: 8,
                  padding: 24, textAlign: 'center', background: 'var(--bg-muted)',
                  cursor: 'pointer'
                }}>
                  <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Drop PDF or scanned report here</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Supported formats: PDF, PNG, JPG (Max 10MB)
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, fontFamily: 'monospace', color: 'var(--primary)' }}>
                    Selected: {docUploadForm.fileName}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddDocument}>Upload & Link to EHR</button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen UPI QR Modal */}
      {showUPIQRModal && (
        <div className="modal-overlay" onClick={() => setShowUPIQRModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="modal-header">
              <span className="modal-title">Scan to Pay via Any UPI App</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUPIQRModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{
                width: 240, height: 240, margin: '0 auto 16px',
                background: '#0F172A', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <QrCode size={190} color="#FFFFFF" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>
                ₹{grossBillTotal}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                UPI ID: <strong>medflow@upi</strong> (MedFlow Healthcare)
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                Accepts Google Pay, PhonePe, Paytm, BHIM, and all mobile banking apps.
              </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowUPIQRModal(false)}>
                Payment Verified & Received
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remote SMS / WhatsApp Link Modal */}
      {showRemoteSMSModal && (
        <div className="modal-overlay" onClick={() => setShowRemoteSMSModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Dispatch Remote Payment Link</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRemoteSMSModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {remoteSMSSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={40} color="var(--success)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Payment Link Dispatched!</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    SMS & WhatsApp message sent to <strong>{patient.mobile}</strong>.
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                    Generate a Razorpay/PayU payment link and send it directly to the patient's smartphone.
                  </p>
                  <label className="form-label">Target Mobile Number</label>
                  <input type="text" className="form-input" defaultValue={patient.mobile} />
                  <div style={{ marginTop: 12 }}>
                    <label className="form-label">Settlement Amount</label>
                    <input type="text" className="form-input" disabled value={`₹${grossBillTotal}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRemoteSMSModal(false)}>Close</button>
              {!remoteSMSSent && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setRemoteSMSSent(true);
                    addNotification({
                      type: 'info',
                      message: `Remote payment link dispatched to ${patient.mobile}`
                    });
                  }}
                >
                  <Send size={14} /> Send Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Signed Consent Copy Modal */}
      {showUploadConsentModal && (
        <div className="modal-overlay" onClick={() => setShowUploadConsentModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Upload Physical Signed Consent</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUploadConsentModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                border: '2px dashed var(--primary)', padding: 20, borderRadius: 8,
                textAlign: 'center', background: 'var(--bg-muted)'
              }}>
                <Upload size={28} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>Upload scanned signed paper</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  Attaches to case record #C003-001-190926
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUploadConsentModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowUploadConsentModal(false);
                  setConsentRecorded(true);
                  addNotification({
                    type: 'success',
                    message: `Attached scanned consent document for ${patient.firstName} ${patient.lastName}`
                  });
                }}
              >
                Attach & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official GST Tax Invoice & OPD Settlement Modal */}
      {showTaxInvoiceModal && createdInvoiceData && (
        <div className="modal-overlay" onClick={() => setShowTaxInvoiceModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, padding: 0, overflow: 'hidden' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '14px 20px', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Printer size={18} color="var(--primary)" />
                <span className="modal-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  GST Tax Invoice &amp; Settlement Receipt
                </span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowTaxInvoiceModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto', padding: 24, background: '#FFFFFF' }}>
              <div id="tax-invoice-receipt" style={{ border: '2px solid #E2E8F0', borderRadius: 8, padding: 24, background: '#FFFFFF', color: '#0F172A', fontFamily: 'inherit' }}>
                {/* Clinic Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #036d92', paddingBottom: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#036d92', letterSpacing: '0.5px' }}>
                    MEDFLOW CLINICAL EXCELLENCE &amp; SURGICAL DAYCARE
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                    101-104 MedFlow Arcade, Ring Road, Surat, Gujarat - 395002 • Ph: +91 98250 12345
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, fontWeight: 600, color: '#036d92', marginTop: 4, flexWrap: 'wrap' }}>
                    <span>GSTIN: 24AAACH7409R1ZZ</span>
                    <span>•</span>
                    <span>SAC CODE: 999312</span>
                    <span>•</span>
                    <span>CIN: U85110GJ2024PTC123456</span>
                  </div>
                  <div style={{ marginTop: 8, display: 'inline-block', background: '#F1F5F9', padding: '3px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    ORIGINAL TAX INVOICE / OPD SETTLEMENT RECEIPT
                  </div>
                </div>

                {/* Patient & Invoice Meta Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 16, fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>INVOICE NO:</div>
                    <div style={{ fontWeight: 800, color: '#036d92' }}>{createdInvoiceData.invoiceNumber}</div>
                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>DATE &amp; TIME:</div>
                    <div style={{ fontWeight: 600 }}>{createdInvoiceData.date}</div>
                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>PAYMENT STATUS:</div>
                    <div>
                      <span className={`badge ${createdInvoiceData.status === 'PAID' ? 'badge-success' : createdInvoiceData.status === 'FOC' ? 'badge-info' : 'badge-warning'}`} style={{ fontWeight: 700, fontSize: 10 }}>
                        {createdInvoiceData.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>PATIENT NAME (MRD):</div>
                    <div style={{ fontWeight: 800 }}>{createdInvoiceData.patientName} ({createdInvoiceData.mrdNumber})</div>
                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>MOBILE / CONTACT:</div>
                    <div style={{ fontWeight: 600 }}>{patient?.mobile || 'N/A'}</div>
                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>ATTENDING CONSULTANT:</div>
                    <div style={{ fontWeight: 600, color: '#036d92' }}>{createdInvoiceData.doctorName}</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div style={{ marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: '#036d92', color: '#FFFFFF', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', width: '35px' }}>#</th>
                        <th style={{ padding: '8px 10px' }}>PARTICULARS / CLINICAL SERVICE</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px' }}>QTY</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '70px' }}>RATE</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '70px' }}>DISC</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '85px' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdInvoiceData.items.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.unitPrice}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: item.discount > 0 ? '#DC2626' : '#64748B' }}>
                            {item.discount > 0 ? `₹${item.discount}` : '₹0'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Settlement Breakdown Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, borderTop: '2px solid #E2E8F0', paddingTop: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#475569', background: '#F8FAFC', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>PAYMENT &amp; SETTLEMENT DETAILS</div>
                    <div>Mode: <strong style={{ color: '#036d92' }}>{createdInvoiceData.paymentMode || 'CASH'}</strong></div>
                    {paymentSplits && paymentSplits.length > 0 && !isFoc && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {paymentSplits.filter(p => p.amount > 0).map((p, idx) => (
                          <div key={idx} style={{ fontSize: 10.5 }}>
                            • Split {idx + 1}: <strong>{p.mode}</strong> — ₹{p.amount} {p.txnId ? `(Txn: ${p.txnId})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    {isFoc && (
                      <div style={{ marginTop: 4, color: '#036d92', fontWeight: 700, fontSize: 11 }}>
                        • Waived under 100% Free of Charge (FOC) approval. Reason: {focReason || 'Management Discretion'}
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 10, color: '#64748B' }}>
                      Health Care Services are exempt from GST under Notification No. 12/2017-Central Tax (Rate), Heading 9993.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Gross Total:</span>
                      <strong>₹{createdInvoiceData.items.reduce((s, it) => s + (it.unitPrice * it.quantity), 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                      <span>Discount:</span>
                      <strong>-₹{createdInvoiceData.items.reduce((s, it) => s + it.discount, 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: 4 }}>
                      <span>Net Bill Value:</span>
                      <strong style={{ color: '#036d92' }}>₹{createdInvoiceData.netAmount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                      <span>Advance Collected:</span>
                      <strong>-₹{previouslyPaidAdvance}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F1F5F9', padding: '4px 6px', borderRadius: 4, fontWeight: 800 }}>
                      <span>Paid at Checkout:</span>
                      <strong style={{ color: '#036d92' }}>₹{createdInvoiceData.collectedAmount - previouslyPaidAdvance > 0 ? createdInvoiceData.collectedAmount - previouslyPaidAdvance : createdInvoiceData.collectedAmount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: createdInvoiceData.balance > 0 ? '#DC2626' : '#059669' }}>
                      <span>Balance Outstanding:</span>
                      <span>₹{createdInvoiceData.balance}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Legal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 20, marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748B', maxWidth: 320 }}>
                    1. This is a computer generated original tax invoice.
                    <br />2. Fees paid are non-refundable. Valid for 7 days follow-up.
                    <br />3. Medicines &amp; consumables subject to return only with original seal.
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 150 }}>
                    <div style={{ height: 28 }}></div>
                    <div style={{ borderTop: '1px solid #0F172A', paddingTop: 4, fontSize: 11, fontWeight: 700 }}>
                      Authorized Front-Desk Signatory
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>MedFlow OPD Counter</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: '#F8FAFC', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setShowTaxInvoiceModal(false)}>
                Close
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    addNotification({
                      type: 'info',
                      message: `Digital tax invoice copy dispatched via WhatsApp & SMS to ${patient.mobile}`
                    });
                  }}
                >
                  <Send size={14} /> Send SMS / WhatsApp Copy
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={15} /> Print Official Tax Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHubPage;
