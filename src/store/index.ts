import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// SSR-Safe LocalStorage adapter for Next.js Turbopack
const isClient = typeof window !== 'undefined';

// Automatic clean slate migration: ensure old mock data and bloated storage entries are wiped from browser storage
if (isClient) {
  const CLEAN_SLATE_KEY = 'medflow_clean_slate_v8_fresh_seed';
  try {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) {
      const keysToClear = [
        'doctor-patients', 'doctor-queue', 'doctor-appointments',
        'doctor-billing', 'doctor-clinical', 'doctor-lab',
        'doctor-followup', 'doctor-chat', 'doctor-consultation',
        'doctor-pharmacy', 'doctor-admin'
      ];
      keysToClear.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('medflow_proc_') || k.startsWith('samples_') || k.includes('temp'))) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(CLEAN_SLATE_KEY, 'true');
    }

    // Proactively evict any oversized entries (> 200KB or containing base64 data)
    const rawConsultation = localStorage.getItem('doctor-consultation');
    if (rawConsultation && (rawConsultation.length > 200000 || rawConsultation.includes('data:image'))) {
      localStorage.removeItem('doctor-consultation');
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('medflow_proc_')) {
        const val = localStorage.getItem(k);
        if (val && (val.length > 100000 || val.includes('data:image'))) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch {}
}

const dummyStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
      try {
        const rawDb = localStorage.getItem('medflow-browser-state-v1');
        const db = rawDb ? JSON.parse(rawDb) : { version: 1, slices: {} };
        if (!db.slices || typeof db.slices !== 'object') db.slices = {};
        db.slices[key] = JSON.parse(value);
        localStorage.setItem('medflow-browser-state-v1', JSON.stringify(db));
      } catch {}
    } catch (err: any) {
      console.warn(`[SafeStorage] localStorage.setItem failed for key "${key}" (quota exceeded). Evicting non-essential cache.`, err);
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('medflow_proc_') || k.startsWith('samples_') || k.includes('temp'))) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, value);
      } catch {
        // Quota still exceeded: suppress exception so Zustand set() and the app never crash
        console.warn(`[SafeStorage] Degraded gracefully without persisting key "${key}".`);
      }
    }
  },
  removeItem: (key: string): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export function safeSaveProceduresCache(caseId: string, procedures: any[]) {
  if (!isClient) return;
  try {
    if (!Array.isArray(procedures)) return;
    const sanitized = procedures.map(p => ({
      ...p,
      sessions: (p.sessions || []).map((s: any) => ({
        ...s,
        beforeImages: (s.beforeImages || []).filter((img: any) => !img?.url?.startsWith('data:')),
        afterImages: (s.afterImages || []).filter((img: any) => !img?.url?.startsWith('data:')),
        subSections: (s.subSections || []).map((sub: any) => ({
          ...sub,
          images: (sub.images || []).filter((img: any) => !img?.url?.startsWith('data:'))
        }))
      }))
    }));
    safeLocalStorage.setItem(`medflow_proc_${caseId}`, JSON.stringify(sanitized));
  } catch {}
}

export const CURRENT_TAB_ID = isClient ? `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` : '';

export const safeStorage = createJSONStorage(() => (isClient ? safeLocalStorage : dummyStorage));

export const notifyTabSync = (storeKey: string) => {
  if (typeof window === 'undefined') return;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('doctor_medflow_sync');
      bc.postMessage({ key: storeKey, tabId: CURRENT_TAB_ID, timestamp: Date.now() });
      bc.close();
    }
  } catch {}
};

// ============================================================
// Types
// ============================================================

export type Gender = 'M' | 'F' | 'Other';
export type QueueStatus = 'WAITING' | 'CALLING' | 'IN_SESSION' | 'ON_HOLD' | 'BILLING_PENDING' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
export type BillingStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'FOC';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
export type VisitType = 'Consultation' | 'Follow-Up' | 'Procedure' | 'Emergency' | 'MR Visit';
export type AppointmentStatus = 'SCHEDULED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'MISSED' | 'RESCHEDULED';

export interface SSEEvent {
  type: 'CHECK_IN' | 'STATUS_CHANGED' | 'SESSION_STARTED' | 'SESSION_ENDED' | 'CASE_LOCKED' | 'CASE_UNLOCKED' | 'PAYMENT_RECEIVED' | 'ON_HOLD';
  id?: string;
  caseId?: string;
  token?: string;
  patientName?: string;
  status?: QueueStatus;
  nextStage?: string;
  lockedByRole?: string;
  timestamp: number;
}

export const playChimeTone = (type: 'calling' | 'session_ended' | 'ding') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    if (type === 'session_ended') {
      // Dual-tone synthesizer audio cue
      // Tone 1: High C (1046.5 Hz) for 150ms
      // Tone 2: A5 (880.0 Hz) for 300ms
      playTone(1046.5, 0.0, 0.15);
      playTone(880.0, 0.18, 0.35);
    } else if (type === 'calling') {
      // 5-tone audible chime sequence
      playTone(523.25, 0.0, 0.2);
      playTone(659.25, 0.15, 0.2);
      playTone(783.99, 0.3, 0.2);
      playTone(1046.5, 0.45, 0.35);
      playTone(880.0, 0.65, 0.5);
    } else {
      playTone(1046.5, 0.0, 0.2);
    }
  } catch {}
};

export interface Patient {
  id: string;
  mrdNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  mobile: string;
  dob?: string;
  age: number;
  ageMonths: number;
  ageDays: number;
  gender: Gender;
  language: 'English' | 'Gujarati' | 'Hindi';
  bloodGroup?: string;
  city?: string;
  state?: string;
  address?: string;
  email?: string;
  emergencyContact?: string;
  maritalStatus?: string;
  occupation?: string;
  allergies?: string;
  category?: string;
  tags?: string[];
  specialNotes?: string[];
  createdAt: string;
  lastVisit?: string;
  isNew?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  initials: string;
  avatarColor: string;
  room: string;
  email?: string;
  phone?: string;
  qualification?: string;
  registrationNumber?: string;
  consultationFee: number;
  followUpFee?: number;
  emergencyFee?: number;
  teleconsultationFee?: number;
  followUpValidityDays?: number;
  slotDurationMins?: number;
  schedule?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  totalConsultations?: number;
  rating?: number;
}

export interface QueueEntry {
  id: string;
  caseNumber: string;
  tokenDisplay: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  visitType: VisitType;
  priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  appointmentTime: string;
  checkInTime?: string;
  age: number;
  gender: Gender;
  city: string;
  billingStatus: BillingStatus;
  status: QueueStatus;
  stage?: 'NURSING' | 'DOCTOR' | 'PHARMACY' | 'BILLING' | 'COMPLETED';
  vitalsRecorded: boolean;
  complaintsRecorded: boolean;
  complaints?: string[];
  complaintNotes?: string;
  isMR?: boolean;
  mrCompany?: string;
  isNew?: boolean;
  isFoc?: boolean;
  onHoldReason?: string;
  labReady?: boolean;
  callCount?: number;
  vitals?: {
    height?: number;
    weight?: number;
    bmi?: number;
    temperature: number;
    pulse: number;
    bloodPressure: string;
    spo2: number;
    recordedAt?: string;
    recordedBy?: string;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  visitType: VisitType;
  status: AppointmentStatus;
  remarks?: string;
}

export interface BillRecord {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  mrdNumber: string;
  doctorName: string;
  date: string;
  netAmount: number;
  collectedAmount: number;
  balance: number;
  status: BillingStatus;
  paymentMode?: PaymentMode;
  items: BillItem[];
}

export interface BillItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  total: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface LabDocument {
  id: string;
  patientId: string;
  patientName: string;
  mrdNumber: string;
  title: string;
  category: 'Blood Test' | 'Radiology' | 'Pathology' | 'Prescription' | 'Insurance';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'Attached to EHR' | 'Pending Doctor Review' | 'Processing';
  doctorName: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  department: string;
  chiefComplaint: string;
  diagnosis: string;
  vitals: { bp: string; pulse: string; temp: string; weight: string; spo2: string };
  prescription: { medicine: string; dosage: string; duration: string; instructions: string }[];
  followUpDate?: string;
}

// ============================================================
// Clinical Master Catalogs (Preserved for Clinical Operations)
// ============================================================

export const DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Raj Valaki',
    specialization: 'Dermatology & Cosmetology',
    initials: 'RV',
    avatarColor: 'linear-gradient(135deg,#6366F1,#818CF8)',
    room: 'Cabin 1 (Room 101)',
    email: 'raj.valaki@medflow.health',
    phone: '+91 98251 00001',
    qualification: 'MBBS, MD (Dermatology), DNB',
    registrationNumber: 'G-48291',
    consultationFee: 500,
    followUpFee: 300,
    emergencyFee: 800,
    teleconsultationFee: 450,
    followUpValidityDays: 7,
    slotDurationMins: 15,
    schedule: 'Mon–Sat: 09:00 AM – 01:00 PM & 04:00 PM – 08:00 PM',
    status: 'ACTIVE',
    totalConsultations: 1240,
    rating: 4.9
  },
  {
    id: 'doc-2',
    name: 'Dr. Anita Soni',
    specialization: 'Internal & General Medicine',
    initials: 'AS',
    avatarColor: 'linear-gradient(135deg,#10B981,#34D399)',
    room: 'Cabin 2 (Room 102)',
    email: 'anita.soni@medflow.health',
    phone: '+91 98251 00002',
    qualification: 'MBBS, MD (General Medicine)',
    registrationNumber: 'G-39102',
    consultationFee: 650,
    followUpFee: 400,
    emergencyFee: 900,
    teleconsultationFee: 500,
    followUpValidityDays: 7,
    slotDurationMins: 15,
    schedule: 'Mon–Sat: 10:00 AM – 02:00 PM & 05:00 PM – 08:00 PM',
    status: 'ACTIVE',
    totalConsultations: 980,
    rating: 4.8
  },
  {
    id: 'doc-3',
    name: 'Dr. Priya Mehta',
    specialization: 'Obstetrics & Gynecology',
    initials: 'PM',
    avatarColor: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
    room: 'Cabin 3 (Room 103)',
    email: 'priya.mehta@medflow.health',
    phone: '+91 98251 00003',
    qualification: 'MBBS, MS (OBGYN), DGO',
    registrationNumber: 'G-44189',
    consultationFee: 600,
    followUpFee: 350,
    emergencyFee: 1000,
    teleconsultationFee: 500,
    followUpValidityDays: 10,
    slotDurationMins: 15,
    schedule: 'Mon–Sat: 10:00 AM – 01:00 PM',
    status: 'ACTIVE',
    totalConsultations: 850,
    rating: 4.9
  },
  {
    id: 'doc-4',
    name: 'Dr. Suresh Kumar',
    specialization: 'Orthopedics & Joint Care',
    initials: 'SK',
    avatarColor: 'linear-gradient(135deg,#EF4444,#FB7185)',
    room: 'Cabin 4 (Room 104)',
    email: 'suresh.kumar@medflow.health',
    phone: '+91 98251 00004',
    qualification: 'MBBS, MS (Ortho), Fellowship Arthroscopy',
    registrationNumber: 'G-51042',
    consultationFee: 700,
    followUpFee: 400,
    emergencyFee: 1200,
    teleconsultationFee: 600,
    followUpValidityDays: 7,
    slotDurationMins: 20,
    schedule: 'Mon, Wed, Fri: 09:00 AM – 02:00 PM',
    status: 'ACTIVE',
    totalConsultations: 1120,
    rating: 4.7
  },
  {
    id: 'doc-5',
    name: 'Dr. Kalp Patel',
    specialization: 'Cardiology & Critical Care',
    initials: 'KP',
    avatarColor: 'linear-gradient(135deg,#4338CA,#6366F1)',
    room: 'Apex Director Suite (Room 100)',
    email: 'kalp.patel@medflow.health',
    phone: '+91 98251 00005',
    qualification: 'MBBS, MD (Med), FCCP (USA)',
    registrationNumber: 'G-29001',
    consultationFee: 1000,
    followUpFee: 600,
    emergencyFee: 1500,
    teleconsultationFee: 850,
    followUpValidityDays: 14,
    slotDurationMins: 20,
    schedule: 'Tue, Thu, Sat: 09:00 AM – 01:00 PM',
    status: 'ACTIVE',
    totalConsultations: 2150,
    rating: 5.0
  },
  {
    id: 'doc-6',
    name: 'Dr. Sarah Jenkins',
    specialization: 'Aesthetic Dermatology & Laser',
    initials: 'SJ',
    avatarColor: 'linear-gradient(135deg,#EC4899,#F472B6)',
    room: 'Laser Suite (Room 105)',
    email: 'sarah.jenkins@medflow.health',
    phone: '+91 98251 00006',
    qualification: 'MD (Aesthetic Derm), Dip. Cosmetology (UK)',
    registrationNumber: 'G-56199',
    consultationFee: 800,
    followUpFee: 500,
    emergencyFee: 1200,
    teleconsultationFee: 700,
    followUpValidityDays: 7,
    slotDurationMins: 20,
    schedule: 'Mon–Fri: 11:00 AM – 04:00 PM',
    status: 'ON_LEAVE',
    totalConsultations: 640,
    rating: 4.8
  }
];

const PATIENTS: Patient[] = [
  { id: 'pat-1', mrdNumber: 'MRD-2026-0001', firstName: 'Mahesh', middleName: 'K.', lastName: 'Kumar', mobile: '9825100001', age: 45, ageMonths: 0, ageDays: 0, gender: 'M', language: 'Gujarati', bloodGroup: 'B+', city: 'Surat', dob: '1981-04-13', createdAt: '2024-01-15', lastVisit: '2026-09-10', tags: ['VIP'], category: 'VIP', allergies: 'Penicillin', address: '12, Shanti Nagar, Adajan, Surat', email: 'mahesh.k@gmail.com', emergencyContact: 'Suman Kumar (Wife) - 9825100011' },
  { id: 'pat-2', mrdNumber: 'MRD-2026-0002', firstName: 'Anita', lastName: 'Sharma', mobile: '9825100002', age: 32, ageMonths: 3, ageDays: 5, gender: 'F', language: 'Hindi', bloodGroup: 'A+', city: 'Vadodara', dob: '1994-06-10', createdAt: '2024-03-22', lastVisit: '2026-09-15', category: 'Regular', address: '401, Nilkanth Residency, Alkapuri, Vadodara', email: 'anita.sharma@yahoo.com' },
  { id: 'pat-3', mrdNumber: 'MRD-2026-0003', firstName: 'Rekha', lastName: 'Patel', mobile: '9825100003', age: 28, ageMonths: 0, ageDays: 0, gender: 'F', language: 'Gujarati', bloodGroup: 'O+', city: 'Surat', dob: '1998-03-20', createdAt: '2025-01-05', lastVisit: '2026-08-28', tags: ['Diabetic'], category: 'Diabetic Care', address: 'Flat 302, Green Avenue, Vesu, Surat', email: 'rekha.patel@gmail.com' },
  { id: 'pat-4', mrdNumber: 'MRD-2026-0004', firstName: 'Amit', lastName: 'Shah', mobile: '9825100004', age: 55, ageMonths: 2, ageDays: 0, gender: 'M', language: 'Gujarati', bloodGroup: 'AB+', city: 'Navsari', dob: '1971-07-05', createdAt: '2023-11-10', lastVisit: '2026-09-01', tags: ['Hypertensive'], category: 'VIP', allergies: 'Sulfonamides', address: 'B-14, Somnath Society, Lunsikui, Navsari', email: 'amit.shah71@gmail.com', emergencyContact: 'Bhavna Shah (Wife) - 9825199994' },
  { id: 'pat-5', mrdNumber: 'MRD-2026-0005', firstName: 'Sneha', lastName: 'Joshi', mobile: '9825100005', age: 24, ageMonths: 8, ageDays: 12, gender: 'F', language: 'Hindi', bloodGroup: 'B-', city: 'Surat', dob: '2001-11-25', createdAt: '2026-02-14', lastVisit: '2026-09-18', isNew: true, category: 'Student Scheme', address: 'Room 205, Girls Hostel, SVNIT Campus, Surat' },
  { id: 'pat-6', mrdNumber: 'MRD-2026-0006', firstName: 'Rahul', lastName: 'Sharma', mobile: '9825100006', age: 38, ageMonths: 0, ageDays: 0, gender: 'M', language: 'English', bloodGroup: 'A-', city: 'Bharuch', dob: '1988-02-12', createdAt: '2025-05-20', lastVisit: '2026-07-30', category: 'Regular', address: '78, Narmada Colony, Zadeshwar Road, Bharuch' },
  { id: 'pat-7', mrdNumber: 'MRD-2026-0007', firstName: 'Priya', lastName: 'Desai', mobile: '9825100007', age: 41, ageMonths: 4, ageDays: 0, gender: 'F', language: 'Gujarati', bloodGroup: 'O-', city: 'Surat', dob: '1985-05-14', createdAt: '2024-08-30', lastVisit: '2026-09-12', category: 'Regular', address: '503, Shivalik Apartment, Citylight, Surat' },
  { id: 'pat-8', mrdNumber: 'MRD-2026-0008', firstName: 'Deepak', lastName: 'Trivedi', mobile: '9825100008', age: 62, ageMonths: 1, ageDays: 0, gender: 'M', language: 'Gujarati', bloodGroup: 'B+', city: 'Surat', dob: '1964-08-10', createdAt: '2023-06-01', lastVisit: '2026-09-05', tags: ['VIP', 'Diabetic'], category: 'Senior Citizen', address: 'A-12, Ambika Nagar, Palanpur Patia, Surat', emergencyContact: 'Jignesh Trivedi (Son) - 9825188888' },
  { id: 'pat-9', mrdNumber: 'MRD-2026-0009', firstName: 'Kavita', lastName: 'Joshi', mobile: '9825100012', age: 34, ageMonths: 0, ageDays: 0, gender: 'F', language: 'Gujarati', bloodGroup: 'A+', city: 'Surat', dob: '1992-07-18', createdAt: '2025-10-12', lastVisit: '2026-09-01', tags: ['Psoriasis'], category: 'Chronic Care', address: '202, Royal Residency, Piplod, Surat' },
  { id: 'pat-1789991704297', mrdNumber: 'MRD-2026-0019', firstName: 'Rajesh', lastName: 'Patel', mobile: '8594897487', age: 32, ageMonths: 0, ageDays: 0, gender: 'M', language: 'English', bloodGroup: 'B+', city: 'Surat', dob: '1994-09-05', createdAt: '2026-09-05', lastVisit: '2026-09-24', tags: ['VIP'], category: 'VIP', address: '402, Shivalik Heights, Adajan, Surat', email: 'essassets@gmail.com', emergencyContact: 'Kavita Patel (Wife) - 9825100099' },
];
const QUEUE_ENTRIES: QueueEntry[] = [
  { id: 'q-1', caseNumber: 'C001-001-190926', tokenDisplay: 'C001', patientId: 'pat-6', patientName: 'Rahul Sharma', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', visitType: 'Consultation', appointmentTime: '09:30 AM', checkInTime: '09:25 AM', age: 38, gender: 'M', city: 'Bharuch', billingStatus: 'PAID', status: 'COMPLETED', vitalsRecorded: true, complaintsRecorded: true },
  { id: 'q-2', caseNumber: 'C002-001-190926', tokenDisplay: 'C002', patientId: 'pat-7', patientName: 'Priya Desai', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', visitType: 'Follow-Up', appointmentTime: '10:00 AM', checkInTime: '09:58 AM', age: 41, gender: 'F', city: 'Surat', billingStatus: 'PENDING', status: 'BILLING_PENDING', vitalsRecorded: true, complaintsRecorded: true },
  { id: 'q-3', caseNumber: 'C003-001-190926', tokenDisplay: 'C003', patientId: 'pat-1', patientName: 'Mahesh Kumar', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', visitType: 'Consultation', appointmentTime: '10:30 AM', checkInTime: '10:15 AM', age: 45, gender: 'M', city: 'Surat', billingStatus: 'PAID', status: 'IN_SESSION', vitalsRecorded: true, complaintsRecorded: true, isFoc: false },
  { id: 'q-4', caseNumber: 'C004-001-190926', tokenDisplay: 'C004', patientId: 'pat-3', patientName: 'Rekha Patel', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', visitType: 'Procedure', priority: 'EMERGENCY', appointmentTime: '10:45 AM', checkInTime: '10:40 AM', age: 28, gender: 'F', city: 'Surat', billingStatus: 'FOC', status: 'WAITING', vitalsRecorded: true, complaintsRecorded: true, isFoc: true },
  { id: 'q-5', caseNumber: 'C005-001-190926', tokenDisplay: 'C005', patientId: 'pat-5', patientName: 'Sneha Joshi', doctorId: 'doc-2', doctorName: 'Dr. Anita Soni', visitType: 'Consultation', priority: 'NORMAL', appointmentTime: '11:00 AM', checkInTime: '10:55 AM', age: 24, gender: 'F', city: 'Surat', billingStatus: 'PENDING', status: 'WAITING', vitalsRecorded: false, complaintsRecorded: false, isNew: true },
  { id: 'q-6', caseNumber: 'APP-11:30', tokenDisplay: 'APP-11:30', patientId: 'pat-2', patientName: 'Anita Sharma', doctorId: 'doc-2', doctorName: 'Dr. Anita Soni', visitType: 'Follow-Up', priority: 'NORMAL', appointmentTime: '11:30 AM', age: 32, gender: 'F', city: 'Vadodara', billingStatus: 'PENDING', status: 'WAITING', vitalsRecorded: false, complaintsRecorded: false },
  { id: 'q-7', caseNumber: 'C006-001-190926', tokenDisplay: 'C006', patientId: 'pat-4', patientName: 'Amit Shah', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', visitType: 'Consultation', priority: 'URGENT', appointmentTime: '11:00 AM', checkInTime: '10:50 AM', age: 55, gender: 'M', city: 'Navsari', billingStatus: 'PARTIAL', status: 'ON_HOLD', onHoldReason: 'Awaiting In-Clinic Blood Sugar & ECG', labReady: false, vitalsRecorded: true, complaintsRecorded: true },
  { id: 'q-8', caseNumber: 'C007-001-190926', tokenDisplay: 'C007', patientId: 'pat-8', patientName: 'Deepak Trivedi', doctorId: 'doc-4', doctorName: 'Dr. Suresh Kumar', visitType: 'Procedure', priority: 'NORMAL', appointmentTime: '12:00 PM', checkInTime: '11:45 AM', age: 62, gender: 'M', city: 'Surat', billingStatus: 'PAID', status: 'WAITING', vitalsRecorded: true, complaintsRecorded: false },
  { id: 'q-9', caseNumber: 'MR-001-190926', tokenDisplay: 'MR-001', patientId: 'mr-1', patientName: 'Suresh Patel (Zydus Healthcare)', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', visitType: 'MR Visit', priority: 'NORMAL', appointmentTime: '12:30 PM', checkInTime: '12:15 PM', age: 34, gender: 'M', city: 'Surat', billingStatus: 'FOC', status: 'WAITING', isMR: true, mrCompany: 'Zydus Healthcare', vitalsRecorded: true, complaintsRecorded: true },
];

const BILLS: BillRecord[] = [
  { id: 'bill-1', invoiceNumber: 'INV-2026-0087', patientId: 'pat-6', patientName: 'Rahul Sharma', mrdNumber: 'MRD-2026-0006', doctorName: 'Dr. Raj Valaki', date: '2026-09-19', netAmount: 500, collectedAmount: 500, balance: 0, status: 'PAID', paymentMode: 'CASH', items: [{ id: 'i1', name: 'Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }] },
  { id: 'bill-2', invoiceNumber: 'INV-2026-0088', patientId: 'pat-7', patientName: 'Priya Desai', mrdNumber: 'MRD-2026-0007', doctorName: 'Dr. Raj Valaki', date: '2026-09-19', netAmount: 800, collectedAmount: 500, balance: 300, status: 'PARTIAL', paymentMode: 'UPI', items: [{ id: 'i2', name: 'Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }, { id: 'i3', name: 'PRP Treatment Session', unitPrice: 300, quantity: 1, discount: 0, total: 300 }] },
  { id: 'bill-3', invoiceNumber: 'INV-2026-0089', patientId: 'pat-4', patientName: 'Amit Shah', mrdNumber: 'MRD-2026-0004', doctorName: 'Dr. Priya Mehta', date: '2026-09-19', netAmount: 2500, collectedAmount: 1500, balance: 1000, status: 'PARTIAL', paymentMode: 'CARD', items: [{ id: 'i4', name: 'Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }, { id: 'i5', name: 'Laser Procedure', unitPrice: 2000, quantity: 1, discount: 0, total: 2000 }] },
  { id: 'bill-4', invoiceNumber: 'INV-2026-0090', patientId: 'pat-1', patientName: 'Mahesh Kumar', mrdNumber: 'MRD-2026-0001', doctorName: 'Dr. Raj Valaki', date: '2026-09-19', netAmount: 500, collectedAmount: 500, balance: 0, status: 'PAID', paymentMode: 'UPI', items: [{ id: 'i6', name: 'Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }] },
  { id: 'bill-5', invoiceNumber: 'INV-2026-0091', patientId: 'pat-5', patientName: 'Sneha Joshi', mrdNumber: 'MRD-2026-0005', doctorName: 'Dr. Anita Soni', date: '2026-09-20', netAmount: 1200, collectedAmount: 0, balance: 1200, status: 'PENDING', paymentMode: 'UPI', items: [{ id: 'i7', name: 'Consultation Fee', unitPrice: 500, quantity: 1, discount: 0, total: 500 }, { id: 'i8', name: 'Chemical Peel & Exfoliation Sitting', unitPrice: 700, quantity: 1, discount: 0, total: 700 }] },
  { id: 'bill-6', invoiceNumber: 'INV-2026-0092', patientId: 'pat-3', patientName: 'Rekha Patel', mrdNumber: 'MRD-2026-0003', doctorName: 'Dr. Raj Valaki', date: '2026-09-20', netAmount: 500, collectedAmount: 0, balance: 0, status: 'FOC', paymentMode: 'CASH', items: [{ id: 'i9', name: 'Doctor Charity / Waiver Consultation', unitPrice: 500, quantity: 1, discount: 500, total: 0 }] },
  { id: 'bill-7', invoiceNumber: 'INV-2026-0093', patientId: 'pat-8', patientName: 'Deepak Trivedi', mrdNumber: 'MRD-2026-0008', doctorName: 'Dr. Suresh Kumar', date: '2026-09-21', netAmount: 4500, collectedAmount: 4500, balance: 0, status: 'PAID', paymentMode: 'BANK_TRANSFER', items: [{ id: 'i10', name: 'Intra-Articular Knee Joint Injection', unitPrice: 3500, quantity: 1, discount: 0, total: 3500 }, { id: 'i11', name: 'Hyaluronic Joint Viscosupplement', unitPrice: 1000, quantity: 1, discount: 0, total: 1000 }] },
  { id: 'bill-8', invoiceNumber: 'INV-2026-0094', patientId: 'pat-1789991704297', patientName: 'Rajesh Patel', mrdNumber: 'MRD-2026-0019', doctorName: 'Dr. Raj Valaki', date: '2026-09-22', netAmount: 9000, collectedAmount: 9000, balance: 0, status: 'PAID', paymentMode: 'INSURANCE', items: [{ id: 'i12', name: 'Diode Laser Treatment Protocol 4-Sessions Package', unitPrice: 10000, quantity: 1, discount: 1000, total: 9000 }] },
  { id: 'bill-9', invoiceNumber: 'INV-2026-0095', patientId: 'pat-2', patientName: 'Anita Sharma', mrdNumber: 'MRD-2026-0002', doctorName: 'Dr. Anita Soni', date: '2026-09-23', netAmount: 650, collectedAmount: 0, balance: 650, status: 'PENDING', paymentMode: 'CARD', items: [{ id: 'i13', name: 'Follow-Up Review Consultation', unitPrice: 400, quantity: 1, discount: 0, total: 400 }, { id: 'i14', name: 'Complete Blood Count (CBC) with ESR', unitPrice: 250, quantity: 1, discount: 0, total: 250 }] },
];

const NOTIFICATIONS: Notification[] = [];

// ============================================================
// Patient Store
// ============================================================

interface PatientState {
  patients: Patient[];
  searchResults: Patient[];
  selectedPatient: Patient | null;
  nextMrd: string;
  searchQuery: string;
  addPatient: (patient: Omit<Patient, 'id' | 'mrdNumber' | 'createdAt'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  searchPatients: (query: string) => void;
  getPatientById: (id: string) => Patient | undefined;
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      patients: PATIENTS,
      searchResults: PATIENTS,
      selectedPatient: null,
      nextMrd: 'MRD-2026-0001',
      searchQuery: '',
      addPatient: (data) => {
        const currentMrd = get().nextMrd || 'MRD-2026-0001';
        const newPatient: Patient = {
          ...data,
          id: `pat-${Date.now()}`,
          mrdNumber: currentMrd,
          createdAt: new Date().toISOString().split('T')[0],
        };
        set(s => {
          const updated = [newPatient, ...s.patients];
          const parts = (s.nextMrd || 'MRD-2026-0001').split('-');
          const seq = parseInt(parts[2] || '1', 10);
          const nextSeq = isNaN(seq) ? 2 : seq + 1;
          return {
            patients: updated,
            searchResults: updated,
            nextMrd: `MRD-2026-${String(nextSeq).padStart(4, '0')}`
          };
        });
        notifyTabSync('doctor-patients');
        return newPatient;
      },
      updatePatient: (id, data) => {
        set(s => ({
          patients: s.patients.map(p => p.id === id ? { ...p, ...data } : p),
          searchResults: s.searchResults.map(p => p.id === id ? { ...p, ...data } : p),
          selectedPatient: s.selectedPatient?.id === id ? { ...s.selectedPatient, ...data } : s.selectedPatient
        }));
        notifyTabSync('doctor-patients');
      },
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),
      searchPatients: (query) => {
        const q = query.toLowerCase();
        set({
          searchQuery: query,
          searchResults: query.length === 0
            ? get().patients
            : get().patients.filter(p =>
              p.firstName.toLowerCase().includes(q) ||
              p.lastName.toLowerCase().includes(q) ||
              p.mrdNumber.toLowerCase().includes(q) ||
              p.mobile.includes(q)
            )
        });
      },
      getPatientById: (id) => {
        const found = (get().patients || []).find(p => p.id === id) || PATIENTS.find(p => p.id === id);
        if (found) return found;
        if (id === 'pat-1789991704297') {
          return {
            id: 'pat-1789991704297',
            mrdNumber: 'MRD-2026-0003',
            firstName: 'dionesh',
            middleName: 'dionesh',
            lastName: 'dionesh',
            mobile: '8594897487',
            email: 'essassets@gmail.com',
            age: 0,
            ageMonths: 0,
            ageDays: 0,
            gender: 'M',
            language: 'English',
            bloodGroup: 'B+',
            city: 'Surat',
            state: 'Gujarat',
            address: 'Ring Road, Surat',
            maritalStatus: 'Single',
            occupation: 'Engineer',
            allergies: 'None Reported',
            createdAt: '2026-09-22',
            isNew: true
          };
        }
        return undefined;
      },
    }),
    {
      name: 'doctor-patients',
      storage: safeStorage,
      partialize: (s) => ({
        patients: s.patients,
        nextMrd: s.nextMrd,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.patients || state.patients.length === 0) {
            state.patients = PATIENTS;
          }
          state.searchResults = state.patients;
        }
      }
    }
  )
);

// ============================================================
// Queue Store
// ============================================================

interface QueueState {
  queue: QueueEntry[];
  doctors: Doctor[];
  callingEntry: QueueEntry | null;
  lastEvent: SSEEvent | null;
  emitEvent: (event: Omit<SSEEvent, 'timestamp'>) => void;
  updateStatus: (id: string, status: QueueStatus) => void;
  addToQueue: (entry: Omit<QueueEntry, 'id'>) => QueueEntry;
  updateVitals: (id: string, vitals: boolean) => void;
  updateComplaints: (id: string, complaints: boolean) => void;
  updateQueueEntry: (id: string, data: Partial<QueueEntry>) => void;
  putOnHold: (id: string, reason?: string) => void;
  resumeFromHold: (id: string) => void;
  endSessionAndSendToBilling: (caseNumber: string, nextStage?: string) => void;
  completeCheckout: (id: string) => void;
  cancelEntry: (id: string, reason: string) => void;
  setCallingEntry: (entry: QueueEntry | null) => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      queue: QUEUE_ENTRIES,
      doctors: DOCTORS,
      callingEntry: QUEUE_ENTRIES.find(q => q.status === 'CALLING') || null,
      lastEvent: null,
      emitEvent: (event) => set({ lastEvent: { ...event, timestamp: Date.now() } }),
      updateStatus: (id, status) => {
        set(s => {
          const entry = s.queue.find(q => q.id === id);
          return {
            queue: s.queue.map(q => q.id === id ? {
              ...q,
              status,
              callCount: status === 'CALLING' ? (q.callCount || 0) + 1 : q.callCount
            } : q),
            callingEntry: status === 'CALLING' ? s.queue.find(q => q.id === id) || null : s.callingEntry,
            lastEvent: {
              type: 'STATUS_CHANGED',
              id,
              token: entry?.tokenDisplay,
              patientName: entry?.patientName,
              status,
              timestamp: Date.now()
            }
          };
        });
        notifyTabSync('doctor-queue');
      },
      addToQueue: (entry) => {
        const newEntry: QueueEntry = { ...entry, id: `q-${Date.now()}` };
        set(s => ({
          queue: [...s.queue, newEntry],
          lastEvent: {
            type: 'CHECK_IN',
            id: newEntry.id,
            token: newEntry.tokenDisplay,
            patientName: newEntry.patientName,
            status: newEntry.status,
            timestamp: Date.now()
          }
        }));
        notifyTabSync('doctor-queue');
        return newEntry;
      },
      updateVitals: (id, vitals) => {
        set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, vitalsRecorded: vitals } : q) }));
        notifyTabSync('doctor-queue');
      },
      updateComplaints: (id, complaints) => {
        set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, complaintsRecorded: complaints } : q) }));
        notifyTabSync('doctor-queue');
      },
      updateQueueEntry: (id, data) => {
        set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, ...data } : q) }));
        notifyTabSync('doctor-queue');
      },
      putOnHold: (id, reason) => {
        set(s => {
          const entry = s.queue.find(q => q.id === id);
          return {
            queue: s.queue.map(q => q.id === id ? {
              ...q,
              status: 'ON_HOLD' as QueueStatus,
              onHoldReason: reason || 'Awaiting Diagnostics / Lab Results'
            } : q),
            lastEvent: {
              type: 'ON_HOLD',
              id,
              token: entry?.tokenDisplay,
              patientName: entry?.patientName,
              status: 'ON_HOLD',
              timestamp: Date.now()
            }
          };
        });
        notifyTabSync('doctor-queue');
      },
      resumeFromHold: (id) => {
        set(s => {
          const entry = s.queue.find(q => q.id === id);
          return {
            queue: s.queue.map(q => q.id === id ? {
              ...q,
              status: 'IN_SESSION' as QueueStatus
            } : q),
            lastEvent: {
              type: 'SESSION_STARTED',
              id,
              token: entry?.tokenDisplay,
              patientName: entry?.patientName,
              status: 'IN_SESSION',
              timestamp: Date.now()
            }
          };
        });
        notifyTabSync('doctor-queue');
      },
      endSessionAndSendToBilling: (caseNumber, nextStage = 'BILLING') => {
        set(s => {
          const entry = s.queue.find(q => q.caseNumber === caseNumber);
          const targetStatus: QueueStatus = (nextStage === 'BILLING' || nextStage === 'PHARMACY') ? 'BILLING_PENDING' : 'COMPLETED';
          const stageVal = nextStage === 'PHARMACY' ? 'PHARMACY' : (nextStage === 'BILLING' ? 'BILLING' : 'COMPLETED');
          return {
            queue: s.queue.map(q => q.caseNumber === caseNumber ? {
              ...q,
              status: targetStatus,
              stage: stageVal
            } : q),
            lastEvent: {
              type: 'SESSION_ENDED',
              caseId: caseNumber,
              token: entry?.tokenDisplay,
              patientName: entry?.patientName,
              status: targetStatus,
              nextStage,
              timestamp: Date.now()
            }
          };
        });
        notifyTabSync('doctor-queue');
      },
      completeCheckout: (id) => {
        set(s => ({
          queue: s.queue.map(q => q.id === id ? { ...q, status: 'COMPLETED' as QueueStatus, billingStatus: 'PAID', stage: 'COMPLETED' } : q),
          lastEvent: {
            type: 'PAYMENT_RECEIVED',
            id,
            status: 'COMPLETED',
            timestamp: Date.now()
          }
        }));
        notifyTabSync('doctor-queue');
      },
      cancelEntry: (id, _reason) => {
        set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, status: 'CANCELLED' } : q) }));
        notifyTabSync('doctor-queue');
      },
      setCallingEntry: (entry) => set({ callingEntry: entry }),
    }),
    {
      name: 'doctor-queue',
      storage: safeStorage,
      partialize: (s) => ({
        queue: s.queue,
        callingEntry: s.callingEntry,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.queue || state.queue.length === 0) {
            state.queue = QUEUE_ENTRIES;
          }
        }
      }
    }
  )
);

// ============================================================
// Appointment Store
// ============================================================

const APPOINTMENTS: Appointment[] = [
  { id: 'apt-1', patientId: 'pat-2', patientName: 'Anita Sharma', doctorId: 'doc-2', doctorName: 'Dr. Anita Soni', date: '2026-09-19', time: '11:30', visitType: 'Follow-Up', status: 'SCHEDULED' },
  { id: 'apt-2', patientId: 'pat-4', patientName: 'Amit Shah', doctorId: 'doc-3', doctorName: 'Dr. Priya Mehta', date: '2026-09-19', time: '11:00', visitType: 'Consultation', status: 'ARRIVED' },
  { id: 'apt-3', patientId: 'pat-8', patientName: 'Deepak Trivedi', doctorId: 'doc-4', doctorName: 'Dr. Suresh Kumar', date: '2026-09-19', time: '12:00', visitType: 'Procedure', status: 'SCHEDULED' },
  { id: 'apt-4', patientId: 'pat-3', patientName: 'Rekha Patel', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', date: '2026-09-20', time: '09:30', visitType: 'Consultation', status: 'SCHEDULED' },
  { id: 'apt-5', patientId: 'pat-6', patientName: 'Rahul Sharma', doctorId: 'doc-1', doctorName: 'Dr. Raj Valaki', date: '2026-09-20', time: '10:00', visitType: 'Follow-Up', status: 'SCHEDULED' },
];

const SLOTS = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '16:00', '16:30', '17:00'];

interface AppointmentState {
  appointments: Appointment[];
  availableSlots: string[];
  addAppointment: (apt: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  cancelAppointment: (id: string, reason: string) => void;
  getAvailableSlots: (doctorId: string, date: string) => string[];
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: APPOINTMENTS,
      availableSlots: SLOTS,
      addAppointment: (apt) => {
        set(s => ({ appointments: [...s.appointments, { ...apt, id: `apt-${Date.now()}` }] }));
        notifyTabSync('doctor-appointments');
      },
      updateAppointment: (id, data) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, ...data } : a) }));
        notifyTabSync('doctor-appointments');
      },
      cancelAppointment: (id, _reason) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a) }));
        notifyTabSync('doctor-appointments');
      },
      getAvailableSlots: (doctorId, date) => {
        try {
          const leaves = useDoctorLeaveStore.getState()?.leaves;
          if (leaves) {
            const onLeave = leaves.some(
              l => l.doctorId === doctorId && l.status === 'APPROVED' && date >= l.startDate && date <= l.endDate
            );
            if (onLeave) return [];
          }
        } catch {
          // Fallback
        }

        const booked = get().appointments
          .filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'CANCELLED')
          .map(a => a.time);
        return SLOTS.filter(s => !booked.includes(s));
      },
    }),
    {
      name: 'doctor-appointments',
      storage: safeStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.appointments || state.appointments.length === 0) {
            state.appointments = APPOINTMENTS;
          }
        }
      }
    }
  )
);

// ============================================================
// Doctor Store
// ============================================================

export interface DoctorState {
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'initials' | 'avatarColor'>) => Doctor;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  updateConsultationFee: (id: string, fees: { consultationFee: number; followUpFee?: number; emergencyFee?: number; teleconsultationFee?: number; followUpValidityDays?: number }) => void;
  toggleDoctorStatus: (id: string) => void;
  deleteDoctor: (id: string) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  getDoctorFee: (doctorId: string, visitType?: string) => number;
}

export const useDoctorStore = create<DoctorState>()(
  persist(
    (set, get) => ({
      doctors: DOCTORS,
      addDoctor: (data) => {
        const initials = data.name
          .replace(/^Dr\.\s*/i, '')
          .split(' ')
          .map(p => p[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'DR';
        const colors = [
          'linear-gradient(135deg,#6366F1,#818CF8)',
          'linear-gradient(135deg,#10B981,#34D399)',
          'linear-gradient(135deg,#F59E0B,#FCD34D)',
          'linear-gradient(135deg,#EF4444,#FB7185)',
          'linear-gradient(135deg,#8B5CF6,#A78BFA)',
          'linear-gradient(135deg,#EC4899,#F472B6)'
        ];
        const newDoctor: Doctor = {
          ...data,
          id: `doc-${Date.now()}`,
          initials,
          avatarColor: colors[get().doctors.length % colors.length],
          status: data.status || 'ACTIVE',
          totalConsultations: 0,
          rating: 5.0
        };
        set(s => ({ doctors: [newDoctor, ...s.doctors] }));
        notifyTabSync('doctor-directory');
        return newDoctor;
      },
      updateDoctor: (id, updates) => {
        set(s => ({
          doctors: s.doctors.map(d => d.id === id ? { ...d, ...updates } : d)
        }));
        notifyTabSync('doctor-directory');
      },
      updateConsultationFee: (id, fees) => {
        set(s => ({
          doctors: s.doctors.map(d => d.id === id ? { ...d, ...fees } : d)
        }));
        notifyTabSync('doctor-directory');
      },
      toggleDoctorStatus: (id) => {
        set(s => ({
          doctors: s.doctors.map(d => {
            if (d.id === id) {
              const nextStatus = d.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
              return { ...d, status: nextStatus };
            }
            return d;
          })
        }));
        notifyTabSync('doctor-directory');
      },
      deleteDoctor: (id) => {
        set(s => ({ doctors: s.doctors.filter(d => d.id !== id) }));
        notifyTabSync('doctor-directory');
      },
      getDoctorById: (id) => {
        return get().doctors.find(d => d.id === id || d.name.toLowerCase() === id.toLowerCase());
      },
      getDoctorFee: (doctorId, visitType) => {
        const doc = get().doctors.find(d => d.id === doctorId || d.name.toLowerCase() === doctorId.toLowerCase());
        if (!doc) return 500;
        if (visitType === 'Follow-Up') return doc.followUpFee ?? 300;
        if (visitType === 'Emergency') return doc.emergencyFee ?? 800;
        if (visitType === 'Teleconsultation' || visitType === 'Video') return doc.teleconsultationFee ?? doc.consultationFee;
        return doc.consultationFee || 500;
      }
    }),
    {
      name: 'doctor-directory',
      storage: safeStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.doctors || state.doctors.length === 0) {
            state.doctors = DOCTORS;
          }
        }
      }
    }
  )
);

// ============================================================
// Billing Store
// ============================================================

interface BillingState {
  bills: BillRecord[];
  payments: any[];
  audit: any[];
  addBill: (bill: Omit<BillRecord, 'id' | 'invoiceNumber'>) => void;
  updateBill: (id: string, data: Partial<BillRecord>) => void;
  getTodayBills: () => BillRecord[];
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      bills: BILLS,
      payments: [],
      audit: [],
      addBill: (bill) => {
        const invoiceNumber = `INV-2026-${String(get().bills.length + 1).padStart(4, '0')}`;
        set(s => ({ bills: [{ ...bill, id: `bill-${Date.now()}`, invoiceNumber }, ...s.bills] }));
        notifyTabSync('doctor-billing');
      },
      updateBill: (id, data) => {
        set(s => ({ bills: s.bills.map(b => b.id === id ? { ...b, ...data } : b) }));
        notifyTabSync('doctor-billing');
      },
      getTodayBills: () => {
        const todayStr = new Date().toISOString().split('T')[0];
        return get().bills.filter(b => b.date === '2026-09-19' || b.date === todayStr);
      },
    }),
    {
      name: 'doctor-billing',
      storage: safeStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.bills || state.bills.length < 5) {
            state.bills = BILLS;
          }
        }
      }
    }
  )
);

// ============================================================
// UI Store
// ============================================================

interface UIState {
  activeModal: string | null;
  sidebarOpen: boolean;
  notifications: Notification[];
  currentUser: { name: string; role: string; branch: string; initials: string };
  openModal: (name: string) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  sidebarOpen: true,
  notifications: NOTIFICATIONS,
  currentUser: { name: 'Riya Patel', role: 'reception@flow.com', branch: 'Surat Central Main Branch', initials: 'RP' },
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  addNotification: (notif) => set(s => ({
    notifications: [{ ...notif, id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), read: false }, ...s.notifications]
  })),
  markAllRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
}));

// ============================================================
// Clinical Records & Lab Store
// ============================================================

export const CLINICAL_RECORDS: ClinicalRecord[] = [];

export const LAB_DOCUMENTS: LabDocument[] = [];

interface LabState {
  documents: LabDocument[];
  addDocument: (doc: Omit<LabDocument, 'id' | 'uploadedAt'>) => void;
  deleteDocument: (id: string) => void;
  updateStatus: (id: string, status: LabDocument['status']) => void;
  getPatientDocuments: (patientId: string) => LabDocument[];
}

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      documents: LAB_DOCUMENTS,
      addDocument: (doc) => {
        const newDoc: LabDocument = {
          ...doc,
          id: `lab-${Date.now()}`,
          uploadedAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        };
        set(s => ({ documents: [newDoc, ...s.documents] }));
        notifyTabSync('doctor-lab');
      },
      deleteDocument: (id) => {
        set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
        notifyTabSync('doctor-lab');
      },
      updateStatus: (id, status) => {
        set(s => ({
          documents: s.documents.map(d => d.id === id ? { ...d, status } : d)
        }));
        notifyTabSync('doctor-lab');
      },
      getPatientDocuments: (patientId) => get().documents.filter(d => d.patientId === patientId),
    }),
    {
      name: 'doctor-lab',
      storage: safeStorage,
    }
  )
);

interface ClinicalState {
  records: ClinicalRecord[];
  addRecord: (record: Omit<ClinicalRecord, 'id'>) => void;
  getPatientRecords: (patientId: string) => ClinicalRecord[];
}

export const useClinicalStore = create<ClinicalState>()(
  persist(
    (set, get) => ({
      records: CLINICAL_RECORDS,
      addRecord: (rec) => {
        set(s => ({ records: [{ ...rec, id: `cr-${Date.now()}` }, ...s.records] }));
        notifyTabSync('doctor-clinical');
      },
      getPatientRecords: (patientId) => get().records.filter(r => r.patientId === patientId),
    }),
    {
      name: 'doctor-clinical',
      storage: safeStorage,
    }
  )
);

// ============================================================
// Doctor Panel Data & Stores
// ============================================================

export interface DrugInventoryItem {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  manufacturer?: string;
  formulation: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
  slotNo?: string;
  defaultDose?: string;
  defaultFreq?: string;
  defaultDay?: string;
  defaultTotal?: string;
  defaultNote?: string;
  alternatives?: string[];
  isActive?: boolean;
}

export interface PrescriptionVisibility {
  generic?: boolean;
  brandName?: boolean;
  manufacturer?: boolean;
  dosage?: boolean;
  frequency?: boolean;
  durationDays?: boolean;
  totalQty?: boolean;
  instructions?: boolean;
  slotNo?: boolean;
  price?: boolean;
}

export interface PrescriptionItem {
  id: string;
  drugId?: string;
  drugName: string;
  genericName?: string;
  brandName?: string;
  manufacturer?: string;
  dosage: string;
  frequency: string;
  durationDays: string | number;
  totalQty: string | number;
  instructions: string;
  slotNo?: string;
  price?: string | number;
  timing?: string;
  startDate?: string;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  visibility?: PrescriptionVisibility;
}

export interface InvestigationCatalogItem {
  id: string;
  name: string;
  category: 'Hematology' | 'Biochemistry' | 'Pathology' | 'Radiology' | 'Microbiology';
  price: number;
  unit?: string;
  normalRange?: string;
  instructions?: string;
  specimenTube?: string;
}

export interface ProcedureCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMins: number;
  requiresConsent: boolean;
}

export interface FollowUpTask {
  id: string;
  caseId?: string;
  patientId: string;
  patientName: string;
  mrdNumber: string;
  mobile: string;
  doctorName: string;
  originalVisitDate: string;
  reason: string;
  dueDate: string;
  followUpDays?: number | string;
  nursingInstructions?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'PENDING' | 'CALLED' | 'RESCHEDULED' | 'NO_SHOW' | 'COMPLETED';
  callLogs: { date: string; caller: string; outcome: string; notes: string }[];
}

export interface ProcedurePrescriptionItem {
  id: string;
  procedureId?: string;
  drugId?: string;
  source?: 'PROCEDURE_MASTER' | 'DRUG_FORMULARY' | 'CUSTOM' | string;
  itemName: string;
  category?: 'Syringe' | 'IV Bottle' | 'Roller Bandage' | 'Dressing / Gauze' | 'Cannula / Set' | 'Other Supply' | string;
  quantity: number;
  idCode?: string;
  unit?: string;
  instructions?: string;
  printOnRx?: boolean;
}

export const parseAnyDate = (dateStr: string): Date => {
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

export const formatToDDMMYYYY = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const addDaysToFormattedDate = (dateStr: string, days: number): string => {
  const d = parseAnyDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatToDDMMYYYY(d);
};

export interface ClinicalAnnotation {
  id: string;
  x: number;
  y: number;
  type: string;
  label: string;
  color: string;
}

export interface ClinicalImageEdits {
  zoom?: number;
  rotation?: number;
  crop?: { x: number; y: number; width: number; height: number };
  panX?: number;
  panY?: number;
  annotations?: ClinicalAnnotation[];
}

export interface ClinicalImage {
  id: string;
  patientId?: string;
  procedureId: string;
  sessionId: string;
  subSectionId?: string;
  url: string;
  originalUrl?: string;
  type: 'BEFORE' | 'AFTER' | 'OTHER';
  fileName: string;
  fileType: string;
  fileSize?: string;
  date: string; // DD/MM/YYYY
  time: string; // hh:mm A
  capturedAt?: string;
  uploadedAt?: string;
  source: 'UPLOAD' | 'CAMERA' | 'DERMASCOPE' | 'FACE_SCANNER' | 'PDF';
  doctorObservation?: string;
  edits?: ClinicalImageEdits;
}

export interface ClinicalSubSection {
  id: string;
  sessionId: string;
  name: string; // e.g., "Session 2 — Sub-section 1"
  procedureName?: string;
  date: string;
  createdAt: string;
  images: ClinicalImage[];
}

export interface ClinicalSession {
  id: string;
  procedureId: string;
  sessionNumber: number;
  date: string; // DD/MM/YYYY
  therapist?: string;
  bodyPart?: string;
  doctorObservation?: string;
  efficacy?: string;
  status?: string;
  beforeImages: ClinicalImage[];
  afterImages: ClinicalImage[];
  subSections: ClinicalSubSection[];
  sections?: any[];
}

export interface ClinicalProcedure {
  id: string;
  patientId: string;
  name: string;
  category: string;
  createdAt: string; // DD/MM/YYYY
  therapist?: string;
  bodyPart?: string;
  doctorObservation?: string;
  sessions: ClinicalSession[];
}

export function getSessionPhotos(session: ClinicalSession): ClinicalImage[] {
  const seen = new Set<string>();
  const list: ClinicalImage[] = [];
  const add = (img: ClinicalImage) => {
    if (img && img.id && !seen.has(img.id)) {
      seen.add(img.id);
      list.push(img);
    }
  };
  (session.beforeImages || []).forEach(add);
  (session.afterImages || []).forEach(add);
  (session.subSections || []).forEach(sub => {
    (sub.images || []).forEach(add);
  });
  return list;
}

export function getProcedurePhotos(proc: ClinicalProcedure): ClinicalImage[] {
  const seen = new Set<string>();
  const list: ClinicalImage[] = [];
  (proc.sessions || []).forEach(sess => {
    getSessionPhotos(sess).forEach(img => {
      if (!seen.has(img.id)) {
        seen.add(img.id);
        list.push(img);
      }
    });
  });
  return list;
}

export function getPatientPhotos(procedures: ClinicalProcedure[]): ClinicalImage[] {
  const seen = new Set<string>();
  const list: ClinicalImage[] = [];
  (procedures || []).forEach(proc => {
    getProcedurePhotos(proc).forEach(img => {
      if (!seen.has(img.id)) {
        seen.add(img.id);
        list.push(img);
      }
    });
  });
  return list;
}

export interface TreatmentProtocol {
  id?: string;
  procedureId?: string;
  caseId: string;
  patientId: string;
  procedureName: string;
  startDate: string;
  totalSessions: number;
  intervalDays: number;
  actualPrice: number;
  discountPercent: number;
  afterDiscountPrice: number;
  total: number;
  ratePerSession: number;
  therapist: string;
  bodyPart: string;
  note?: string;
  billingMode?: 'session_wise' | 'full_package';
  updatedAt?: string;
}

export const DEFAULT_TREATMENT_PROTOCOL: TreatmentProtocol = {
  id: 'proto-c005-001',
  procedureId: 'proc-demo-1',
  caseId: 'C005-001-23092026',
  patientId: 'pat-1789991704297',
  procedureName: 'HAIR REMOVAL - DIODE',
  startDate: '2026-03-25',
  totalSessions: 4,
  intervalDays: 20,
  actualPrice: 10000,
  discountPercent: 10,
  afterDiscountPrice: 9000,
  total: 9000,
  ratePerSession: 2250,
  therapist: 'Dr Valaki',
  bodyPart: 'FACE',
  note: 'Fitzpatrick Type II. Pre-cooling applied. Patient advised strict sun protection SPF 50+ & no waxing/threading.',
  billingMode: 'session_wise',
  updatedAt: '2026-09-24T10:00:00.000Z'
};

export interface ProcedureExecutionItem {
  id: string;
  procedureId?: string;
  caseId?: string;
  patientId?: string;
  procedureName: string;
  scheduledDate: string;
  scheduledTime?: string;
  sessionsCount?: string;
  completedInClinic?: boolean;
  notes?: string;
  consentGenerated?: boolean;
  price: number;
  // Clinical Machine Settings & Treatment Protocol
  therapist?: string;
  bodyPart?: string;
  sessionNumber?: number;
  totalSessions?: number;
  intervalDays?: number;
  performanceDate?: string;
  skinType?: string;
  unit?: string;
  power?: string;
  waveLength?: string;
  pulseDuration?: string;
  spotSize?: string;
  pulseImpulse?: string;
  thickness?: string;
  density?: string;
  dotDensity?: string;
  shotsFired?: string;
  status?: 'Done' | 'Confirmed' | 'Pending' | 'Delayed' | 'Cancelled';
  remark?: string;
  rate?: number;
  paymentStatus?: 'Done' | 'Pending' | 'Confirmed' | 'Partially Paid' | 'Paid' | 'Cancelled' | 'Done/pending';
  discountPercent?: number;
  actualPrice?: number;
  afterDiscountPrice?: number;
}

export const DEFAULT_TREATMENT_SESSIONS: ProcedureExecutionItem[] = [
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

export interface ConsultationSession {
  caseId: string;
  patientId: string;
  patientName: string;
  mrdNumber: string;
  doctorId: string;
  doctorName: string;
  startTime: string;
  complaints: {
    presentComplaint: string;
    durationYears: number;
    durationMonths: number;
    durationDays: number;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    onset: string;
    aggravatingFactors: string;
    relievingFactors: string;
  };
  vitals: {
    temperature: string;
    pulse: string;
    bpSystolic: string;
    bpDiastolic: string;
    spo2: string;
    weight: string;
    height: string;
  };
  history: {
    pastMedical: string;
    pastSurgical: string;
    allergies: string;
    currentMedications: string;
    personalHistory?: string;
    obstetricHistory?: string;
  };
  notes?: {
    nursingNotes?: string;
    patientFeedback?: string;
  };
  investigations: {
    testId: string;
    testName: string;
    category: string;
    price: number;
    status: 'ORDERED' | 'COMPLETED';
    resultValue?: string;
    normalRange?: string;
    notes?: string;
    instructions?: string;
    specimenTube?: string;
  }[];
  prescriptions: PrescriptionItem[];
  procedurePrescriptions?: ProcedurePrescriptionItem[];
  treatmentProtocol?: TreatmentProtocol;
  procedures: ProcedureExecutionItem[];
  clinicalProcedures?: ClinicalProcedure[];
  images: {
    id: string;
    url: string;
    tag: 'BEFORE' | 'AFTER' | 'FOLLOWUP' | 'GENERAL';
    caption: string;
    annotations?: string[];
    uploadedAt: string;
  }[];
  diagnosis: {
    primaryDiagnosis?: string;
    provisional: string;
    differential: string;
    finalDiagnosis: string;
    icd10Code?: string;
    status?: 'Provisional' | 'Confirmed';
    treatmentPlan: string;
    diagnosisNote?: string;
    patientAdvice: string;
    dietAdvice?: string;
    recommendedInvestigations?: string[];
    recommendedProcedure?: string;
    followUpDays?: number | string;
    followUpDate?: string;
    followUpPurpose?: string;
    nursingInstructions?: string;
    nursingFollowUp?: {
      priority: 'Routine' | 'Priority' | 'Urgent';
      callStatus: 'Scheduled' | 'Completed' | 'Missed' | 'Delayed';
      doNotCall: boolean;
      feedbackNotes?: string;
      assignedNurse?: string;
    };
    referral?: {
      doctorName: string;
      specialty: string;
      reason: string;
      urgency?: 'Routine' | 'Priority' | 'Emergency';
      clinicOrHospital?: string;
    };
    appointmentBookedId?: string;
    appointmentBookedDate?: string;
    appointmentBookedTime?: string;
    visibility?: {
      diagnosis: boolean;
      diagnosisNote: boolean;
      advice: boolean;
      dietAdvice: boolean;
      investigation: boolean;
      procedure: boolean;
      followUp: boolean;
      referral?: boolean;
    };
    sendReviewLink?: boolean;
    reviewLinkSent?: boolean;
    patientCategory?: string;
    prescriptionFontSize?: 'A-' | 'A' | 'A+';
  };
  billing: {
    consultationFee: number;
    discountPercent: number;
    isFoc: boolean;
    focReason?: string;
    focPin?: string;
    procedureBillingMode?: 'session_wise' | 'full_package';
  };
  isFinalized: boolean;
  finalizedAt?: string;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'Casual' | 'Conference' | 'Medical' | 'Vacation';
  status: 'APPROVED';
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'Doctor' | 'Reception' | 'Pharmacy' | 'Nursing';
  message: string;
  timestamp: string;
}

// Initial Mock Inventory
export const DRUG_INVENTORY: DrugInventoryItem[] = [
  { id: 'd-101', name: 'TAB Flucocip 400mg (Tab fluconazone 400 mg)', genericName: 'Tab fluconazone 400 mg', brandName: 'TAB Flucocip 400mg', manufacturer: 'Cipla pvt', formulation: 'Tablet', stock: 50, reorderLevel: 15, unitPrice: 42, slotNo: 'BZX 120', defaultDose: '1 tab', defaultFreq: 'Od after mill', defaultDay: '5 day', defaultTotal: '5', defaultNote: 'Not teken with milk', isActive: true },
  { id: 'd-102', name: 'CREAM Monpic (Cream clotrimazole 1%)', genericName: 'Cream clotrimazole 1%', brandName: 'CREAM Monpic', manufacturer: 'Atopic darma', formulation: 'Cream', stock: 40, reorderLevel: 10, unitPrice: 85, slotNo: 'BYX 80', defaultDose: '1', defaultFreq: 'tds', defaultDay: '7', defaultTotal: '1', defaultNote: 'Before apply dry', isActive: true },
  { id: 'd-1', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', brandName: 'Amoxicillin 500mg', manufacturer: 'Cipla pvt', formulation: 'Capsule', stock: 8, reorderLevel: 20, unitPrice: 12, slotNo: 'BZX 100', defaultDose: '1', defaultFreq: 'tds', defaultDay: '7', defaultTotal: '1', defaultNote: 'Before apply dry', alternatives: ['Cefixime 200mg', 'Azithromycin 500mg'], isActive: true },
  { id: 'd-2', name: 'Paracetamol 650mg (Dolo)', genericName: 'Paracetamol 650mg', brandName: 'Dolo 650', manufacturer: 'Micro Labs', formulation: 'Tablet', stock: 12, reorderLevel: 50, unitPrice: 3, slotNo: 'BZX 102', defaultDose: '1 Tab', defaultFreq: '1-0-1', defaultDay: '3 day', defaultTotal: '6', defaultNote: 'After Food', alternatives: ['Ibuprofen 400mg'], isActive: true },
  { id: 'd-3', name: 'Mometasone 0.1% Cream', genericName: 'Mometasone Furoate', brandName: 'Elocon 0.1% Cream', manufacturer: 'Organon', formulation: 'Ointment', stock: 45, reorderLevel: 15, unitPrice: 145, slotNo: 'BYX 103', defaultDose: '1', defaultFreq: '0-0-1', defaultDay: '14 day', defaultTotal: '1', defaultNote: 'Before bedtime', isActive: true },
  { id: 'd-4', name: 'Bilastine 20mg (Bilaxten)', genericName: 'Bilastine', brandName: 'Bilaxten 20mg', manufacturer: 'Zydus', formulation: 'Tablet', stock: 35, reorderLevel: 20, unitPrice: 18, slotNo: 'BZX 104', defaultDose: '1 Tab', defaultFreq: '1-0-0', defaultDay: '10 day', defaultTotal: '10', defaultNote: 'Empty stomach (1h before food)', isActive: true },
  { id: 'd-5', name: 'Levocetirizine 5mg', genericName: 'Levocetirizine Dihydrochloride', brandName: 'Levocet 5mg', manufacturer: 'Hetero', formulation: 'Tablet', stock: 80, reorderLevel: 25, unitPrice: 5, slotNo: 'BZX 105', defaultDose: '1 Tab', defaultFreq: '0-0-1', defaultDay: '5 day', defaultTotal: '5', defaultNote: 'At bedtime', isActive: true },
  { id: 'd-6', name: 'Telmisartan 40mg', genericName: 'Telmisartan', brandName: 'Telma 40', manufacturer: 'Glenmark', formulation: 'Tablet', stock: 40, reorderLevel: 20, unitPrice: 9, slotNo: 'BZX 106', defaultDose: '1 Tab', defaultFreq: '1-0-0', defaultDay: '30 day', defaultTotal: '30', defaultNote: 'Morning after food', isActive: true },
  { id: 'd-7', name: 'Nitrofurantoin SR 100mg', genericName: 'Nitrofurantoin', brandName: 'Niftran 100mg', manufacturer: 'Sun Pharma', formulation: 'Tablet', stock: 0, reorderLevel: 15, unitPrice: 16, slotNo: 'BZX 107', defaultDose: '1 Tab', defaultFreq: '1-0-1', defaultDay: '7 day', defaultTotal: '14', defaultNote: 'With meals', alternatives: ['Fosfomycin 3g', 'Ofloxacin 200mg'], isActive: true },
  { id: 'd-8', name: 'Diacerein 50mg + Glucosamine', genericName: 'Diacerein + Glucosamine', brandName: 'Cartigen Forte', manufacturer: 'Torrent', formulation: 'Tablet', stock: 50, reorderLevel: 20, unitPrice: 22, slotNo: 'BZX 108', defaultDose: '1 Tab', defaultFreq: '1-0-1', defaultDay: '30 day', defaultTotal: '60', defaultNote: 'After food', isActive: true },
  { id: 'd-9', name: 'Emollient Moisturizer Lotion', genericName: 'Cetyl Alcohol + Liquid Paraffin', brandName: 'Moiz XL Lotion', manufacturer: 'Curatio', formulation: 'Lotion', stock: 30, reorderLevel: 10, unitPrice: 280, slotNo: 'BYX 109', defaultDose: '1', defaultFreq: '1-0-1', defaultDay: '30 day', defaultTotal: '1', defaultNote: 'Apply on damp skin', isActive: true },
];

export const INVESTIGATION_CATALOG: InvestigationCatalogItem[] = [
  { id: 'inv-1', name: 'Complete Blood Count (CBC) with ESR', category: 'Hematology', price: 350, unit: 'g/dL', normalRange: '12.0 - 16.5 g/dL', specimenTube: 'EDTA (Purple Tube)', instructions: 'Fasting preferred' },
  { id: 'inv-2', name: 'HbA1c & Fasting Blood Sugar', category: 'Biochemistry', price: 450, unit: '%', normalRange: '< 5.7 %', specimenTube: 'Fluoride (Grey Tube)', instructions: '10 hrs fasting required' },
  { id: 'inv-3', name: 'Lipid Profile Complete', category: 'Biochemistry', price: 650, unit: 'mg/dL', normalRange: '< 200 mg/dL', specimenTube: 'Serum Gel (Yellow Tube)', instructions: '12 hrs strict fasting' },
  { id: 'inv-4', name: 'Skin Scraping for KOH Fungus Test', category: 'Microbiology', price: 300, normalRange: 'Negative for fungal hyphae', specimenTube: 'Lesion Swab / Scraping', instructions: 'Clean lesion, no cream' },
  { id: 'inv-5', name: 'Serum IgE Allergy Level', category: 'Pathology', price: 850, unit: 'IU/mL', normalRange: '< 100 IU/mL', specimenTube: 'Plain (Red Tube)' },
  { id: 'inv-6', name: 'X-Ray Both Knees (AP & Lateral)', category: 'Radiology', price: 600, specimenTube: 'Radiology / Non-specimen', instructions: 'Standing weight-bearing view' },
  { id: 'inv-7', name: 'Urine Routine & Microscopic Culture', category: 'Pathology', price: 400, specimenTube: 'Urine Sterile Container', instructions: 'Mid-stream early morning sample' },
  { id: 'inv-8', name: 'ASO Titre (Anti-Streptolysin O Quantitative)', category: 'Biochemistry', price: 420, unit: 'IU/mL', normalRange: '< 200 IU/mL', specimenTube: 'Serum Gel (Yellow Tube)', instructions: 'Serum sample, fasting not required' },
  { id: 'inv-9', name: 'Liver Function Test (LFT) Comprehensive', category: 'Biochemistry', price: 600, unit: 'U/L', normalRange: 'SGPT < 45, SGOT < 40', specimenTube: 'Serum Gel (Yellow Tube)', instructions: 'Overnight fasting' },
  { id: 'inv-10', name: 'Renal Function Test (RFT / KFT)', category: 'Biochemistry', price: 550, unit: 'mg/dL', normalRange: 'Serum Creatinine 0.7 - 1.3', specimenTube: 'Serum Gel (Yellow Tube)', instructions: 'Adequate hydration' },
];

export const PROCEDURE_CATALOG: ProcedureCatalogItem[] = [
  { id: 'proc-1', name: 'Diode Laser Hair Removal', category: 'Laser & Aesthetics', price: 1500, durationMins: 30, requiresConsent: true },
  { id: 'proc-2', name: 'PRP (Platelet-Rich Plasma) Therapy', category: 'Regenerative', price: 2500, durationMins: 45, requiresConsent: true },
  { id: 'proc-3', name: 'Chemical Peel & Facial Resurfacing', category: 'Cosmetology', price: 1800, durationMins: 30, requiresConsent: true },
  { id: 'proc-4', name: 'Minor Lesion Excision & Biopsy', category: 'Surgical', price: 1200, durationMins: 25, requiresConsent: true },
  { id: 'proc-5', name: 'Orthopedic Joint Injection', category: 'Orthopedics', price: 2000, durationMins: 20, requiresConsent: true },
  { id: 'proc-6', name: 'Sterile Wound Dressing & Debridement', category: 'Nursing OPD', price: 250, durationMins: 15, requiresConsent: false },
];

export const FOLLOWUP_TASKS: FollowUpTask[] = [
  {
    id: 'fu-c006',
    caseId: 'C006-001-190926',
    patientId: 'pat-4',
    patientName: 'Amit Shah',
    mrdNumber: 'MRD-2026-0004',
    mobile: '9825100004',
    doctorName: 'Dr. Raj Valaki',
    originalVisitDate: '2026-09-19',
    reason: 'Assess clinical clearance of fungal lesions',
    dueDate: '2026-09-26',
    followUpDays: 7,
    nursingInstructions: 'Call patient at day 5 to verify compliance and assess clinical clearance of fungal lesions',
    priority: 'High',
    status: 'PENDING',
    callLogs: []
  },
  {
    id: 'fu-1',
    caseId: 'C001-001-190926',
    patientId: 'pat-1',
    patientName: 'Mahesh Kumar',
    mrdNumber: 'MRD-2026-0001',
    mobile: '9825100001',
    doctorName: 'Dr. Raj Valaki',
    originalVisitDate: '2026-09-10',
    reason: 'Review contact dermatitis recovery & allergy response',
    dueDate: '2026-09-19',
    followUpDays: 7,
    nursingInstructions: 'Check pruritus relief and inquire if redness subsiding with Mometasone cream',
    priority: 'High',
    status: 'PENDING',
    callLogs: [
      { date: '2026-09-17', caller: 'Staff Nurse Rekha', outcome: 'ANSWERED', notes: 'Patient reports mild redness remaining; advised to continue cream.' }
    ]
  },
  {
    id: 'fu-2',
    caseId: 'C003-001-190926',
    patientId: 'pat-3',
    patientName: 'Rekha Patel',
    mrdNumber: 'MRD-2026-0003',
    mobile: '9825100003',
    doctorName: 'Dr. Raj Valaki',
    originalVisitDate: '2026-08-28',
    reason: 'Diode Laser Session 2 of 6 check-up',
    dueDate: '2026-09-19',
    followUpDays: 21,
    nursingInstructions: 'Check for skin crusting or post-inflammatory pigment changes; confirm next laser sitting date',
    priority: 'Medium',
    status: 'PENDING',
    callLogs: []
  },
  {
    id: 'fu-3',
    caseId: 'C008-001-190926',
    patientId: 'pat-8',
    patientName: 'Deepak Trivedi',
    mrdNumber: 'MRD-2026-0008',
    mobile: '9825100008',
    doctorName: 'Dr. Suresh Kumar',
    originalVisitDate: '2026-09-05',
    reason: 'Knee OA Joint Injection tolerance check',
    dueDate: '2026-09-22',
    followUpDays: 14,
    nursingInstructions: 'Verify range of motion and absence of swelling or effusion post intra-articular injection',
    priority: 'Medium',
    status: 'PENDING',
    callLogs: []
  },
  {
    id: 'fu-4',
    caseId: 'C012-001-190926',
    patientId: 'pat-12',
    patientName: 'Kavita Joshi',
    mrdNumber: 'MRD-2026-0012',
    mobile: '9825100012',
    doctorName: 'Dr. Raj Valaki',
    originalVisitDate: '2026-09-01',
    reason: 'Severe Psoriasis biologic therapy monitoring',
    dueDate: '2026-09-15',
    followUpDays: 14,
    nursingInstructions: 'Urgent compliance check - verify CBC and liver enzyme blood draw completed',
    priority: 'High',
    status: 'NO_SHOW',
    callLogs: [
      { date: '2026-09-16', caller: 'Front Desk Riya', outcome: 'NO_ANSWER', notes: 'Call rang full, no response.' },
      { date: '2026-09-17', caller: 'Front Desk Riya', outcome: 'BUSY', notes: 'Number returned line busy signal.' }
    ]
  }
];

export const DOCTOR_LEAVES: DoctorLeave[] = [
  { id: 'l-1', doctorId: 'doc-1', startDate: '2026-09-25', endDate: '2026-09-27', reason: 'National Dermatology Conference (DERMACON 2026)', type: 'Conference', status: 'APPROVED' },
  { id: 'l-2', doctorId: 'doc-2', startDate: '2026-10-02', endDate: '2026-10-04', reason: 'Family function & festival leave', type: 'Casual', status: 'APPROVED' },
];

export const CHAT_MESSAGES: ChatMessage[] = [];

// Stores
interface InventoryState {
  inventory: DrugInventoryItem[];
  getDrugByName: (name: string) => DrugInventoryItem | undefined;
  updateStock: (id: string, delta: number) => void;
  addDrug: (drug: Omit<DrugInventoryItem, 'id'> & { id?: string }) => DrugInventoryItem;
  updateDrug: (id: string, updates: Partial<DrugInventoryItem>) => void;
  toggleDrugActive: (id: string) => void;
  deleteDrug: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      inventory: DRUG_INVENTORY,
      getDrugByName: (name) => get().inventory.find(i => i.name.toLowerCase().includes(name.toLowerCase())),
      updateStock: (id, delta) => {
        set(s => ({
          inventory: s.inventory.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i)
        }));
        notifyTabSync('doctor-inventory');
      },
      addDrug: (drug) => {
        const newDrug: DrugInventoryItem = {
          ...drug,
          id: drug.id || `d-${Date.now()}`,
          isActive: drug.isActive !== undefined ? drug.isActive : true
        };
        set(s => ({
          inventory: [newDrug, ...s.inventory.filter(i => i.id !== newDrug.id && i.name.toLowerCase() !== newDrug.name.toLowerCase())]
        }));
        notifyTabSync('doctor-inventory');
        return newDrug;
      },
      updateDrug: (id, updates) => {
        set(s => ({
          inventory: s.inventory.map(i => i.id === id ? { ...i, ...updates } : i)
        }));
        notifyTabSync('doctor-inventory');
      },
      toggleDrugActive: (id) => {
        set(s => ({
          inventory: s.inventory.map(i => i.id === id ? { ...i, isActive: i.isActive === false ? true : false } : i)
        }));
        notifyTabSync('doctor-inventory');
      },
      deleteDrug: (id) => {
        set(s => ({
          inventory: s.inventory.filter(i => i.id !== id)
        }));
        notifyTabSync('doctor-inventory');
      }
    }),
    {
      name: 'doctor-inventory',
      storage: safeStorage,
    }
  )
);

interface InvestigationCatalogState {
  catalog: InvestigationCatalogItem[];
  addTest: (item: InvestigationCatalogItem | Omit<InvestigationCatalogItem, 'id'>) => InvestigationCatalogItem;
  deleteTest: (id: string) => void;
}

export const useInvestigationCatalogStore = create<InvestigationCatalogState>()(
  persist(
    (set) => ({
      catalog: INVESTIGATION_CATALOG,
      addTest: (item) => {
        const newItem: InvestigationCatalogItem = {
          ...item,
          id: (item as any).id || `inv-${Date.now()}`
        };
        set(s => ({
          catalog: [newItem, ...s.catalog.filter(c => c.id !== newItem.id && c.name.toLowerCase() !== newItem.name.toLowerCase())]
        }));
        notifyTabSync('doctor-investigation-catalog');
        return newItem;
      },
      deleteTest: (id) => {
        set(s => ({ catalog: s.catalog.filter(c => c.id !== id) }));
        notifyTabSync('doctor-investigation-catalog');
      }
    }),
    {
      name: 'doctor-investigation-catalog',
      storage: safeStorage,
    }
  )
);

interface ProcedureCatalogState {
  catalog: ProcedureCatalogItem[];
  addProcedure: (item: Omit<ProcedureCatalogItem, 'id'>) => void;
  deleteProcedure: (id: string) => void;
}

export const useProcedureCatalogStore = create<ProcedureCatalogState>()(
  persist(
    (set) => ({
      catalog: PROCEDURE_CATALOG,
      addProcedure: (item) => set(s => ({ catalog: [...s.catalog, { ...item, id: `proc-${Date.now()}` }] })),
      deleteProcedure: (id) => set(s => ({ catalog: s.catalog.filter(c => c.id !== id) }))
    }),
    {
      name: 'doctor-procedure-catalog',
      storage: safeStorage,
    }
  )
);

interface FollowUpState {
  tasks: FollowUpTask[];
  addCallLog: (taskId: string, log: { caller: string; outcome: string; notes: string }) => void;
  updateStatus: (taskId: string, status: FollowUpTask['status']) => void;
  addTask: (task: Omit<FollowUpTask, 'id' | 'callLogs'> & { id?: string; callLogs?: FollowUpTask['callLogs'] }) => FollowUpTask;
  upsertConsultationTask: (data: {
    caseId?: string;
    patientId: string;
    patientName: string;
    mrdNumber: string;
    mobile: string;
    doctorName: string;
    originalVisitDate?: string;
    reason?: string;
    dueDate?: string;
    followUpDays?: number | string;
    nursingInstructions?: string;
    priority?: 'High' | 'Medium' | 'Low';
    status?: FollowUpTask['status'];
  }) => FollowUpTask;
  rescheduleTask: (taskId: string, newDueDate: string, notes?: string) => void;
  deleteTask: (taskId: string) => void;
}

export const useFollowUpStore = create<FollowUpState>()(
  persist(
    (set, get) => ({
      tasks: FOLLOWUP_TASKS,
      addCallLog: (taskId, log) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) return t;
            let newStatus: FollowUpTask['status'] = t.status;
            if (log.outcome === 'ANSWERED') newStatus = 'CALLED';
            else if (log.outcome === 'RESCHEDULED') newStatus = 'RESCHEDULED';
            else if (log.outcome === 'NO_ANSWER' || log.outcome === 'SWITCHED_OFF') newStatus = 'NO_SHOW';
            else if (log.outcome === 'COMPLETED') newStatus = 'COMPLETED';
            return {
              ...t,
              status: newStatus,
              callLogs: [{ ...log, date: formatToDDMMYYYY(new Date()) }, ...t.callLogs]
            };
          })
        }));
        notifyTabSync('doctor-followup');
      },
      updateStatus: (taskId, status) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, status } : t)
        }));
        notifyTabSync('doctor-followup');
      },
      addTask: (task) => {
        const newTask: FollowUpTask = {
          ...task,
          id: task.id || `fu-${Date.now()}`,
          callLogs: task.callLogs || []
        };
        set(s => ({ tasks: [newTask, ...s.tasks] }));
        notifyTabSync('doctor-followup');
        return newTask;
      },
      upsertConsultationTask: (data) => {
        let resultTask: FollowUpTask | null = null;
        set(s => {
          const existingIndex = s.tasks.findIndex(t =>
            (data.caseId && t.caseId === data.caseId) ||
            (data.caseId && t.id === `fu-${data.caseId}`) ||
            (t.patientId === data.patientId && (t.dueDate === data.dueDate || t.caseId === data.caseId))
          );

          if (existingIndex >= 0) {
            const existing = s.tasks[existingIndex];
            const updated: FollowUpTask = {
              ...existing,
              caseId: data.caseId || existing.caseId,
              patientName: data.patientName || existing.patientName,
              mrdNumber: data.mrdNumber || existing.mrdNumber,
              mobile: data.mobile || existing.mobile,
              doctorName: data.doctorName || existing.doctorName,
              reason: data.reason || existing.reason,
              dueDate: data.dueDate || existing.dueDate,
              followUpDays: data.followUpDays !== undefined ? data.followUpDays : existing.followUpDays,
              nursingInstructions: data.nursingInstructions !== undefined ? data.nursingInstructions : existing.nursingInstructions,
              priority: data.priority || existing.priority,
              status: data.status || existing.status,
            };
            resultTask = updated;
            const updatedTasks = [...s.tasks];
            updatedTasks[existingIndex] = updated;
            return { tasks: updatedTasks };
          } else {
            const newTask: FollowUpTask = {
              id: `fu-${data.caseId || Date.now()}`,
              caseId: data.caseId,
              patientId: data.patientId,
              patientName: data.patientName,
              mrdNumber: data.mrdNumber,
              mobile: data.mobile,
              doctorName: data.doctorName || 'Dr. Raj Valaki',
              originalVisitDate: data.originalVisitDate || formatToDDMMYYYY(new Date()),
              reason: data.reason || 'Follow-up clinical assessment',
              dueDate: data.dueDate || formatToDDMMYYYY(new Date(Date.now() + 7 * 86400000)),
              followUpDays: data.followUpDays || 7,
              nursingInstructions: data.nursingInstructions || '',
              priority: data.priority || 'Medium',
              status: data.status || 'PENDING',
              callLogs: []
            };
            resultTask = newTask;
            return { tasks: [newTask, ...s.tasks] };
          }
        });
        notifyTabSync('doctor-followup');
        return resultTask!;
      },
      rescheduleTask: (taskId, newDueDate, notes) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedLogs = notes ? [
              { date: formatToDDMMYYYY(new Date()), caller: 'Dr. Raj Valaki', outcome: 'RESCHEDULED', notes },
              ...t.callLogs
            ] : t.callLogs;
            return {
              ...t,
              dueDate: newDueDate,
              status: 'RESCHEDULED',
              callLogs: updatedLogs
            };
          })
        }));
        notifyTabSync('doctor-followup');
      },
      deleteTask: (taskId) => {
        set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) }));
        notifyTabSync('doctor-followup');
      }
    }),
    {
      name: 'doctor-followup',
      storage: safeStorage,
    }
  )
);

interface DoctorLeaveState {
  leaves: DoctorLeave[];
  addLeave: (leave: Omit<DoctorLeave, 'id'>) => void;
  cancelLeave: (id: string) => void;
}

export const useDoctorLeaveStore = create<DoctorLeaveState>()(
  persist(
    (set) => ({
      leaves: DOCTOR_LEAVES,
      addLeave: (leave) => set(s => ({ leaves: [{ ...leave, id: `l-${Date.now()}` }, ...s.leaves] })),
      cancelLeave: (id) => set(s => ({ leaves: s.leaves.filter(l => l.id !== id) }))
    }),
    {
      name: 'doctor-leaves',
      storage: safeStorage,
    }
  )
);

interface ChatState {
  messages: ChatMessage[];
  sendMessage: (msg: { sender: string; senderRole: ChatMessage['senderRole']; message: string }) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: CHAT_MESSAGES,
      sendMessage: (msg) => set(s => ({
        messages: [...s.messages, { ...msg, id: `c-${Date.now()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
      }))
    }),
    {
      name: 'doctor-chat',
      storage: safeStorage,
    }
  )
);
// ============================================================

// Consultation Master Store
interface ConsultationState {
  activeSession: ConsultationSession | null;
  sessions: Record<string, ConsultationSession>;
  getSession: (caseId: string) => ConsultationSession | undefined;
  loadSession: (caseId: string) => boolean;
  saveSession: (session: ConsultationSession) => void;
  initSession: (
    caseId: string,
    patient: Patient,
    doctor: Doctor,
    initialData?: Partial<ConsultationSession>
  ) => ConsultationSession;
  updateComplaints: (complaints: Partial<ConsultationSession['complaints']>) => void;
  updateVitals: (vitals: Partial<ConsultationSession['vitals']>) => void;
  updateHistory: (history: Partial<ConsultationSession['history']>) => void;
  updateNotes: (notes: Partial<{ nursingNotes?: string; patientFeedback?: string }>) => void;
  addInvestigation: (item: ConsultationSession['investigations'][0]) => void;
  removeInvestigation: (testId: string) => void;
  updateInvestigationNote: (testId: string, notes: string) => void;
  addPrescription: (item: PrescriptionItem) => void;
  removePrescription: (id: string) => void;
  updatePrescription: (id: string, updates: Partial<PrescriptionItem>) => void;
  togglePrescriptionVisibility: (id: string, field: keyof PrescriptionVisibility) => void;
  addProcedurePrescription: (item: ProcedurePrescriptionItem) => void;
  removeProcedurePrescription: (id: string) => void;
  updateProcedurePrescription: (id: string, updates: Partial<ProcedurePrescriptionItem>) => void;
  addProcedure: (item: ProcedureExecutionItem) => void;
  removeProcedure: (id: string) => void;
  updateProcedure: (id: string, updates: Partial<ProcedureExecutionItem>) => void;
  setProcedures: (procedures: ProcedureExecutionItem[]) => void;
  generateProtocolSchedule: (caseId: string, protocol: TreatmentProtocol) => void;
  updateSessionProcedure: (caseId: string, procedureId: string, updates: Partial<ProcedureExecutionItem>) => void;
  delayProtocolSession: (caseId: string, procedureId: string, delayDays: number, reason?: string) => void;
  addImage: (item: ConsultationSession['images'][0]) => void;
  removeImage: (id: string) => void;
  updateDiagnosis: (diagnosis: Partial<ConsultationSession['diagnosis']>) => void;
  updateBilling: (billing: Partial<ConsultationSession['billing']>) => void;
  finalizeConsultation: () => void;
  loadClinicalProcedures: (caseId: string, patientId?: string) => Promise<ClinicalProcedure[]>;
  createClinicalProcedure: (caseId: string, proc: Partial<ClinicalProcedure>) => Promise<ClinicalProcedure>;
  createClinicalSession: (caseId: string, procedureId: string, sessionData?: Partial<ClinicalSession>) => Promise<ClinicalSession>;
  updateClinicalSession: (caseId: string, procedureId: string, sessionId: string, updates: Partial<ClinicalSession>) => Promise<void>;
  createSubSection: (caseId: string, procedureId: string, sessionId: string, name?: string) => Promise<ClinicalSubSection>;
  addClinicalImage: (caseId: string, procedureId: string, sessionId: string, image: ClinicalImage, subSectionId?: string) => Promise<void>;
  updateClinicalImage: (caseId: string, imageId: string, patch: Partial<ClinicalImage>) => Promise<void>;
  deleteClinicalImage: (caseId: string, imageId: string) => Promise<void>;
  syncClinicalProcedures: (caseId: string, procedures: ClinicalProcedure[]) => Promise<void>;
  refreshClinicalProcedures: (caseId: string) => Promise<void>;
}

export function getOrCreateConsultationSession(
  sessions: Record<string, ConsultationSession>,
  activeSession: ConsultationSession | null,
  caseId: string,
  patientId?: string
): ConsultationSession {
  if (sessions && sessions[caseId]) return sessions[caseId];
  if (activeSession && activeSession.caseId === caseId) return activeSession;
  return {
    caseId,
    patientId: patientId || '',
    patientName: '',
    mrdNumber: '',
    doctorId: 'doc-1',
    doctorName: 'Dr. Raj Valaki',
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    complaints: {
      presentComplaint: '',
      durationYears: 0,
      durationMonths: 0,
      durationDays: 0,
      severity: 'MILD',
      onset: '',
      aggravatingFactors: '',
      relievingFactors: ''
    },
    vitals: {
      temperature: '98.6',
      pulse: '72',
      bpSystolic: '120',
      bpDiastolic: '80',
      spo2: '98',
      weight: '70',
      height: '170'
    },
    history: {
      pastMedical: '',
      pastSurgical: '',
      allergies: '',
      currentMedications: ''
    },
    investigations: [],
    prescriptions: [],
    procedures: [],
    images: [],
    diagnosis: {
      provisional: '',
      differential: '',
      finalDiagnosis: '',
      treatmentPlan: '',
      patientAdvice: ''
    },
    billing: {
      consultationFee: 500,
      discountPercent: 0,
      isFoc: false
    },
    isFinalized: false
  };
}

const INITIAL_SESSIONS: Record<string, ConsultationSession> = {};

export const useConsultationStore = create<ConsultationState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      sessions: INITIAL_SESSIONS,

      getSession: (caseId: string) => {
        const found = get().sessions[caseId];
        if (found) return found;
        if (get().activeSession?.caseId === caseId) return get().activeSession || undefined;
        return undefined;
      },

      loadSession: (caseId: string) => {
        const found = get().sessions[caseId];
        if (found) {
          const cleanProcedurePrescriptions = (found.procedurePrescriptions || []).filter(
            (item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx
          );
          const cleanPrescriptions = (found.prescriptions || []).filter(
            (item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx && item.id !== 'rx-demo-2'
          );
          const currentProcs = found.procedures || [];
          const isLegacyProcs = (caseId.startsWith('C003-') || caseId.startsWith('C005-')) && currentProcs.length <= 1 && (
            currentProcs.length === 0 ||
            currentProcs[0]?.sessionsCount?.includes('Session 1 of 6') ||
            currentProcs[0]?.sessionsCount === '1/6' ||
            currentProcs[0]?.procedureName?.includes('Diode Laser Hair Removal') ||
            !currentProcs[0]?.bodyPart
          );
          const cleanProcedures = isLegacyProcs ? DEFAULT_TREATMENT_SESSIONS : currentProcs;
          const cleaned = {
            ...found,
            procedurePrescriptions: cleanProcedurePrescriptions,
            prescriptions: cleanPrescriptions,
            procedures: cleanProcedures
          };
          set(s => ({
            activeSession: cleaned,
            sessions: { ...s.sessions, [caseId]: cleaned }
          }));
          return true;
        }
        return false;
      },

      saveSession: (session: ConsultationSession) => {
        const existingSession = get().sessions[session.caseId];
        const mergedSession: ConsultationSession = {
          ...session,
          clinicalProcedures: session.clinicalProcedures || existingSession?.clinicalProcedures
        };
        set(s => ({
          activeSession: s.activeSession?.caseId === mergedSession.caseId ? mergedSession : s.activeSession,
          sessions: { ...s.sessions, [mergedSession.caseId]: mergedSession }
        }));
        notifyTabSync('doctor-consultation');
      },

      initSession: (caseId, patient, doctor, initialData) => {
        const existing = get().sessions[caseId] || (get().activeSession?.caseId === caseId ? get().activeSession : null);
        const existingClinicalProcedures = existing?.clinicalProcedures;
        if (existing) {
          const cleanProcedurePrescriptions = (existing.procedurePrescriptions || []).filter(
            (item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx
          );
          const cleanPrescriptions = (existing.prescriptions || []).filter(
            (item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx && item.id !== 'rx-demo-2'
          );
          const currentProcs = existing.procedures || [];
          const isLegacyProcs = currentProcs.length <= 1 && (
            currentProcs.length === 0 ||
            currentProcs[0]?.sessionsCount?.includes('Session 1 of 6') ||
            currentProcs[0]?.sessionsCount === '1/6' ||
            currentProcs[0]?.procedureName?.includes('Diode Laser Hair Removal') ||
            !currentProcs[0]?.bodyPart
          );
          const cleanProcedures = isLegacyProcs ? (initialData?.procedures !== undefined ? initialData.procedures : (caseId.startsWith('C003-') || caseId.startsWith('C005-') ? DEFAULT_TREATMENT_SESSIONS : [])) : currentProcs;
          const cleaned = {
            ...existing,
            procedurePrescriptions: cleanProcedurePrescriptions,
            prescriptions: cleanPrescriptions,
            procedures: cleanProcedures,
            clinicalProcedures: existingClinicalProcedures || existing.clinicalProcedures
          };
          set(s => ({
            activeSession: cleaned,
            sessions: { ...s.sessions, [caseId]: cleaned }
          }));
          return cleaned;
        }

        const newSession: ConsultationSession = {
          caseId,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          mrdNumber: patient.mrdNumber,
          doctorId: doctor.id,
          doctorName: doctor.name,
          startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          complaints: initialData?.complaints || {
            presentComplaint: '',
            durationYears: 0,
            durationMonths: 0,
            durationDays: 1,
            severity: 'MODERATE',
            onset: 'Gradual',
            aggravatingFactors: '',
            relievingFactors: ''
          },
          vitals: initialData?.vitals || {
            temperature: '98.6',
            pulse: '76',
            bpSystolic: '120',
            bpDiastolic: '80',
            spo2: '99',
            weight: '68',
            height: '168'
          },
          history: initialData?.history || {
            pastMedical: '',
            pastSurgical: '',
            allergies: '',
            currentMedications: '',
            personalHistory: '',
            obstetricHistory: ''
          },
          notes: initialData?.notes || {
            nursingNotes: '',
            patientFeedback: ''
          },
          investigations: initialData?.investigations || [],
          prescriptions: initialData?.prescriptions || [],
          procedurePrescriptions: initialData?.procedurePrescriptions || [],
          procedures: initialData?.procedures !== undefined ? initialData.procedures : (caseId.startsWith('C003-') || caseId.startsWith('C005-') ? DEFAULT_TREATMENT_SESSIONS : []),
          clinicalProcedures: existingClinicalProcedures,
          images: initialData?.images || [],
          diagnosis: initialData?.diagnosis || {
            provisional: '',
            differential: '',
            finalDiagnosis: '',
            icd10Code: '',
            treatmentPlan: '',
            patientAdvice: '',
            followUpDate: '',
            followUpPurpose: '',
            nursingInstructions: ''
          },
          billing: initialData?.billing || {
            consultationFee: 500,
            discountPercent: 0,
            isFoc: false
          },
          isFinalized: false
        };

        set(s => ({
          activeSession: newSession,
          sessions: { ...s.sessions, [caseId]: newSession }
        }));
        notifyTabSync('doctor-consultation');
        return newSession;
      },

      updateComplaints: (complaints) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, complaints: { ...s.activeSession.complaints, ...complaints } };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateVitals: (vitals) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, vitals: { ...s.activeSession.vitals, ...vitals } };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateHistory: (history) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, history: { ...s.activeSession.history, ...history } };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateNotes: (notes) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, notes: { ...(s.activeSession.notes || {}), ...notes } };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      addInvestigation: (item) => set(s => {
        if (!s.activeSession) return s;
        const currentInvs = s.activeSession.investigations || [];
        const updated = { ...s.activeSession, investigations: [...currentInvs, item] };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      removeInvestigation: (testId) => set(s => {
        if (!s.activeSession) return s;
        const currentInvs = s.activeSession.investigations || [];
        const updated = { ...s.activeSession, investigations: currentInvs.filter(i => i.testId !== testId) };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateInvestigationNote: (testId, notes) => set(s => {
        if (!s.activeSession) return s;
        const currentInvs = s.activeSession.investigations || [];
        const updated = {
          ...s.activeSession,
          investigations: currentInvs.map(i => i.testId === testId ? { ...i, notes } : i)
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      addPrescription: (item) => set(s => {
        if (!s.activeSession) return s;
        const current = s.activeSession.prescriptions || [];
        if (current.some(p => p.id === item.id)) return s;
        const updated = { ...s.activeSession, prescriptions: [...current, item] };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      removePrescription: (id) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, prescriptions: s.activeSession.prescriptions.filter(p => p.id !== id) };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updatePrescription: (id, updates) => set(s => {
        if (!s.activeSession) return s;
        const updated = {
          ...s.activeSession,
          prescriptions: s.activeSession.prescriptions.map(p => p.id === id ? { ...p, ...updates } : p)
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      togglePrescriptionVisibility: (id, field) => set(s => {
        if (!s.activeSession) return s;
        const updated = {
          ...s.activeSession,
          prescriptions: s.activeSession.prescriptions.map(p => {
            if (p.id !== id) return p;
            const currentVis = p.visibility || {
              generic: true, brandName: true, manufacturer: true, dosage: true,
              frequency: true, durationDays: true, totalQty: true, instructions: true, slotNo: true, price: true
            };
            const nextVal = currentVis[field] === false ? true : false;
            return {
              ...p,
              visibility: {
                ...currentVis,
                [field]: nextVal
              }
            };
          })
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      addProcedurePrescription: (item) => set(s => {
        if (!s.activeSession) return s;
        const current = s.activeSession.procedurePrescriptions || [];
        if (current.some(p => p.id === item.id)) return s;
        const updated = { ...s.activeSession, procedurePrescriptions: [...current, item] };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      removeProcedurePrescription: (id) => set(s => {
        if (!s.activeSession) return s;
        const current = s.activeSession.procedurePrescriptions || [];
        const updated = { ...s.activeSession, procedurePrescriptions: current.filter(p => p.id !== id) };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateProcedurePrescription: (id, updates) => set(s => {
        if (!s.activeSession) return s;
        const current = s.activeSession.procedurePrescriptions || [];
        const updated = {
          ...s.activeSession,
          procedurePrescriptions: current.map(p => p.id === id ? { ...p, ...updates } : p)
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      addProcedure: (item) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, procedures: [...s.activeSession.procedures, item] };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      removeProcedure: (id) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, procedures: (s.activeSession.procedures || []).filter(p => p.id !== id) };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateProcedure: (id, updates) => set(s => {
        if (!s.activeSession) return s;
        const procs = [...(s.activeSession.procedures || [])];
        const targetIndex = procs.findIndex(p => p.id === id);
        if (targetIndex === -1) return s;

        const oldProc = procs[targetIndex];
        const updatedProc = { ...oldProc, ...updates };
        procs[targetIndex] = updatedProc;

        // Auto-recalculate downstream scheduled dates if executed or marked Done
        if (updates.status === 'Done' || updates.performanceDate) {
          const perfDateStr = updates.performanceDate || oldProc.performanceDate || formatToDDMMYYYY(new Date());
          let prevDate = perfDateStr;
          for (let i = targetIndex + 1; i < procs.length; i++) {
            if (procs[i].status !== 'Done') {
              const interval = procs[i].intervalDays || 20;
              const newSchedDate = addDaysToFormattedDate(prevDate, interval);
              procs[i] = {
                ...procs[i],
                scheduledDate: newSchedDate,
                remark: `Session ${i + 1} scheduled at ${interval}d interval.`
              };
              prevDate = newSchedDate;
            } else {
              prevDate = procs[i].performanceDate || procs[i].scheduledDate;
            }
          }
        }

        const updated = {
          ...s.activeSession,
          procedures: procs
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      setProcedures: (procedures) => set(s => {
        if (!s.activeSession) return s;
        const updated = {
          ...s.activeSession,
          procedures
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      generateProtocolSchedule: (caseId, protocol) => set(s => {
        const count = Math.max(1, Number(protocol.totalSessions) || 1);
        const interval = Math.max(1, Number(protocol.intervalDays) || 20);
        const startParsed = parseAnyDate(protocol.startDate || '2026-03-25');
        let currDate = formatToDDMMYYYY(startParsed);
        const afterPrice = Number(protocol.afterDiscountPrice) || Number(protocol.total) || 9000;
        const rate = Number(protocol.ratePerSession) || Math.round(afterPrice / count);

        const newProcedures: ProcedureExecutionItem[] = [];
        for (let i = 1; i <= count; i++) {
          const isFirst = i === 1;
          newProcedures.push({
            id: `proc-${caseId}-${i}-${Date.now().toString(36)}`,
            caseId,
            patientId: protocol.patientId,
            procedureName: protocol.procedureName || 'HAIR REMOVAL - DIODE',
            scheduledDate: currDate,
            performanceDate: isFirst ? currDate : '',
            sessionsCount: `${i}/${count}`,
            sessionNumber: i,
            totalSessions: count,
            therapist: protocol.therapist || 'Dr Valaki',
            bodyPart: protocol.bodyPart || 'FACE',
            intervalDays: interval,
            status: isFirst ? 'Done' : 'Pending',
            paymentStatus: isFirst ? 'Done' : 'Pending',
            rate,
            price: rate,
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
            shotsFired: isFirst ? '100' : '0',
            remark: isFirst ? 'Session 1 executed with good clinical response.' : `Session ${i} scheduled at ${interval}d interval.`
          });
          currDate = addDaysToFormattedDate(currDate, interval);
        }

        const existing = s.sessions[caseId] || s.activeSession;
        if (!existing) return s;

        const updatedSession = {
          ...existing,
          treatmentProtocol: protocol,
          procedures: newProcedures
        };

        notifyTabSync('treatment-protocol');
        notifyTabSync('doctor-consultation');

        return {
          activeSession: s.activeSession?.caseId === caseId ? updatedSession : s.activeSession,
          sessions: { ...s.sessions, [caseId]: updatedSession }
        };
      }),

      updateSessionProcedure: (caseId, procedureId, updates) => set(s => {
        const targetSession = s.sessions[caseId] || (s.activeSession?.caseId === caseId ? s.activeSession : null);
        if (!targetSession) return s;

        const procs = [...(targetSession.procedures || [])];
        const targetIndex = procs.findIndex(p => p.id === procedureId);
        if (targetIndex === -1) return s;

        const oldProc = procs[targetIndex];
        const updatedProc = { ...oldProc, ...updates };
        procs[targetIndex] = updatedProc;

        // Auto-recalculate downstream scheduled dates if executed or marked Done
        if (updates.status === 'Done' || updates.performanceDate) {
          const perfDateStr = updates.performanceDate || oldProc.performanceDate || formatToDDMMYYYY(new Date());
          let prevDate = perfDateStr;
          for (let i = targetIndex + 1; i < procs.length; i++) {
            if (procs[i].status !== 'Done') {
              const interval = procs[i].intervalDays || 20;
              const newSchedDate = addDaysToFormattedDate(prevDate, interval);
              procs[i] = {
                ...procs[i],
                scheduledDate: newSchedDate,
                remark: `Session ${i + 1} scheduled at ${interval}d interval.`
              };
              prevDate = newSchedDate;
            } else {
              prevDate = procs[i].performanceDate || procs[i].scheduledDate;
            }
          }
        }

        const updatedSession = {
          ...targetSession,
          procedures: procs
        };

        notifyTabSync('treatment-protocol');
        notifyTabSync('doctor-consultation');

        return {
          activeSession: s.activeSession?.caseId === caseId ? updatedSession : s.activeSession,
          sessions: { ...s.sessions, [caseId]: updatedSession }
        };
      }),

      delayProtocolSession: (caseId, procedureId, delayDays = 12, reason) => set(s => {
        const targetSession = s.sessions[caseId] || (s.activeSession?.caseId === caseId ? s.activeSession : null);
        if (!targetSession) return s;

        const procs = [...(targetSession.procedures || [])];
        const targetIndex = procs.findIndex(p => p.id === procedureId);
        if (targetIndex === -1) return s;

        const target = procs[targetIndex];
        const oldDate = target.scheduledDate;
        const newTargetDate = addDaysToFormattedDate(oldDate, delayDays);

        procs[targetIndex] = {
          ...target,
          status: 'Delayed',
          scheduledDate: newTargetDate,
          remark: reason || `Delayed by +${delayDays} days (Shifted from ${oldDate})`
        };

        for (let i = targetIndex + 1; i < procs.length; i++) {
          procs[i] = {
            ...procs[i],
            scheduledDate: addDaysToFormattedDate(procs[i].scheduledDate, delayDays)
          };
        }

        const updatedSession = {
          ...targetSession,
          procedures: procs
        };

        notifyTabSync('treatment-protocol');
        notifyTabSync('doctor-consultation');

        return {
          activeSession: s.activeSession?.caseId === caseId ? updatedSession : s.activeSession,
          sessions: { ...s.sessions, [caseId]: updatedSession }
        };
      }),

      addImage: (item) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, images: [...s.activeSession.images, item] };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      removeImage: (id) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, images: s.activeSession.images.filter(img => img.id !== id) };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateDiagnosis: (diagnosis) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, diagnosis: { ...s.activeSession.diagnosis, ...diagnosis } };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      updateBilling: (billing) => set(s => {
        if (!s.activeSession) return s;
        const updated = { ...s.activeSession, billing: { ...s.activeSession.billing, ...billing } };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      finalizeConsultation: () => set(s => {
        if (!s.activeSession) return s;
        const updated = {
          ...s.activeSession,
          isFinalized: true,
          finalizedAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
        };
        return {
          activeSession: updated,
          sessions: { ...s.sessions, [updated.caseId]: updated }
        };
      }),

      loadClinicalProcedures: async (caseId: string, patientId?: string) => {
        const existingSession = get().sessions[caseId] || (get().activeSession?.caseId === caseId ? get().activeSession : null);
        let currentProcs: ClinicalProcedure[] = existingSession?.clinicalProcedures || [];

        const localKey = `medflow_proc_${caseId}`;
        if (currentProcs.length === 0 && typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(localKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                currentProcs = parsed;
              }
            }
          } catch {}
        }

        try {
          const res = await fetch(`/api/consultation/${caseId}/clinical-procedures`);
          if (res.ok) {
            const data = await res.json();
            if (data.procedures && Array.isArray(data.procedures) && data.procedures.length > 0) {
              currentProcs = data.procedures;
            }
          }
        } catch (err) {
          console.warn('Backend clinical-procedures fetch failed, fallback to local/cached:', err);
        }

        // Normalize procedure and session structures
        const normalized: ClinicalProcedure[] = (currentProcs || []).map(proc => ({
          ...proc,
          patientId: proc.patientId || patientId || existingSession?.patientId || '',
          sessions: (proc.sessions || []).map((sess, sIdx) => {
            let beforeList: ClinicalImage[] = sess.beforeImages || [];
            let afterList: ClinicalImage[] = sess.afterImages || [];
            let subSecList: ClinicalSubSection[] = sess.subSections || [];

            if (sess.sections && Array.isArray(sess.sections)) {
              sess.sections.forEach((sec: any) => {
                if (sec.beforeImages && Array.isArray(sec.beforeImages)) {
                  sec.beforeImages.forEach((img: ClinicalImage) => {
                    if (!beforeList.some(b => b.id === img.id)) beforeList.push(img);
                  });
                }
                if (sec.afterImages && Array.isArray(sec.afterImages)) {
                  sec.afterImages.forEach((img: ClinicalImage) => {
                    if (!afterList.some(a => a.id === img.id)) afterList.push(img);
                  });
                }
                if (sec.subSections && Array.isArray(sec.subSections)) {
                  sec.subSections.forEach((sub: ClinicalSubSection) => {
                    if (!subSecList.some(sb => sb.id === sub.id)) subSecList.push(sub);
                  });
                }
              });
            }

            return {
              ...sess,
              procedureId: proc.id,
              sessionNumber: sess.sessionNumber || (sIdx + 1),
              date: sess.date || formatToDDMMYYYY(new Date()),
              status: sess.status || 'Pending',
              beforeImages: beforeList,
              afterImages: afterList,
              subSections: subSecList.map(sub => ({
                ...sub,
                images: sub.images || []
              }))
            };
          })
        }));

        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId, patientId);
          const updated = {
            ...target,
            clinicalProcedures: normalized
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        safeSaveProceduresCache(caseId, normalized);

        return normalized;
      },

      createClinicalProcedure: async (caseId: string, procData: Partial<ClinicalProcedure>) => {
        const existingSession = get().sessions[caseId] || (get().activeSession?.caseId === caseId ? get().activeSession : null);
        const procId = procData.id || `proc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const todayDate = procData.createdAt || formatToDDMMYYYY(new Date());

        const initialSessionId = `sess-${procId}-1`;
        const initialSession: ClinicalSession = {
          id: initialSessionId,
          procedureId: procId,
          sessionNumber: 1,
          date: todayDate,
          therapist: procData.therapist || 'Dr Valaki',
          bodyPart: procData.bodyPart || 'CLINICAL SITE',
          doctorObservation: 'Clinical protocol initiated.',
          efficacy: '',
          status: 'Done',
          beforeImages: [],
          afterImages: [],
          subSections: [],
          sections: []
        };

        const newProc: ClinicalProcedure = {
          id: procId,
          patientId: procData.patientId || existingSession?.patientId || '',
          name: procData.name?.trim() || 'General Clinical Treatment',
          category: procData.category || 'Laser Therapy',
          createdAt: todayDate,
          therapist: procData.therapist || 'Dr Valaki',
          bodyPart: procData.bodyPart || 'CLINICAL SITE',
          doctorObservation: procData.doctorObservation || '',
          sessions: procData.sessions && procData.sessions.length > 0 ? procData.sessions : [initialSession]
        };

        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId, procData.patientId);
          const existingList = target.clinicalProcedures || [];
          const updatedList = [newProc, ...existingList.filter(p => p.id !== procId)];
          const updated = {
            ...target,
            clinicalProcedures: updatedList
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        // Persist to backend
        try {
          await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_procedure', procedure: newProc, id: procId, name: newProc.name, date: todayDate })
          });
        } catch (err) {
          console.warn('Server procedure creation warning:', err);
        }

        safeSaveProceduresCache(caseId, get().sessions[caseId]?.clinicalProcedures || [newProc]);

        notifyTabSync('doctor-consultation');
        return newProc;
      },

      createClinicalSession: async (caseId: string, procedureId: string, sessionData?: Partial<ClinicalSession>) => {
        const state = get();
        const existingSession = getOrCreateConsultationSession(state.sessions, state.activeSession, caseId);

        const currentProcs = existingSession.clinicalProcedures || [];
        let procIndex = currentProcs.findIndex(p => p.id === procedureId || p.name.toLowerCase() === procedureId.toLowerCase());
        
        let targetProc: ClinicalProcedure;
        if (procIndex === -1) {
          // If not found in clinicalProcedures, create it dynamically
          targetProc = await state.createClinicalProcedure(caseId, {
            id: procedureId,
            name: procedureId.startsWith('proc-') ? 'General Clinical Procedure' : procedureId,
            therapist: sessionData?.therapist || 'Dr Valaki',
            bodyPart: sessionData?.bodyPart || 'FACE'
          });
          procIndex = 0;
        } else {
          targetProc = currentProcs[procIndex];
        }

        const nextNum = Math.max(
          (targetProc.sessions || []).length,
          (existingSession.procedures || []).length
        ) + 1;

        const sessionId = sessionData?.id || `sess-${targetProc.id}-${nextNum}-${Date.now().toString(36)}`;
        const sessionDate = sessionData?.date || formatToDDMMYYYY(new Date());

        const newSession: ClinicalSession = {
          id: sessionId,
          procedureId: targetProc.id,
          sessionNumber: nextNum,
          date: sessionDate,
          therapist: sessionData?.therapist || targetProc.therapist || 'Dr Valaki',
          bodyPart: sessionData?.bodyPart || targetProc.bodyPart || 'FACE',
          doctorObservation: sessionData?.doctorObservation || '',
          efficacy: sessionData?.efficacy || '',
          status: sessionData?.status || 'Pending',
          beforeImages: sessionData?.beforeImages || [],
          afterImages: sessionData?.afterImages || [],
          subSections: sessionData?.subSections || [],
          sections: []
        };

        // Matching Tab 4 ProcedureExecutionItem
        const newExecutionItem: ProcedureExecutionItem = {
          id: sessionId,
          procedureId: targetProc.id,
          caseId,
          patientId: existingSession.patientId,
          procedureName: targetProc.name,
          scheduledDate: sessionDate,
          performanceDate: newSession.status === 'Done' ? sessionDate : '',
          sessionNumber: nextNum,
          totalSessions: nextNum,
          sessionsCount: `${nextNum}/${nextNum}`,
          therapist: newSession.therapist,
          bodyPart: newSession.bodyPart,
          status: (newSession.status as any) || 'Pending',
          paymentStatus: newSession.status === 'Done' ? 'Done' : 'Pending',
          price: 2000,
          rate: 2000,
          remark: `Session ${nextNum} scheduled/recorded.`
        };

        // Snapshot for rollback in case server fails
        const previousSessionSnapshot = { ...existingSession };

        // Optimistic store update
        const latestProcs = state.sessions[caseId]?.clinicalProcedures || currentProcs;
        const targetIdx = latestProcs.findIndex(p => p.id === targetProc.id);
        const updatedProcs = [...latestProcs];
        const updatedSessions = [...(targetProc.sessions || []), newSession];
        if (targetIdx >= 0) {
          updatedProcs[targetIdx] = {
            ...targetProc,
            sessions: updatedSessions
          };
        }

        const existingTab4Procs = existingSession.procedures || [];
        const updatedTab4Procs = [...existingTab4Procs.filter(p => p.id !== sessionId), newExecutionItem];
        const updatedProtocol: TreatmentProtocol = {
          ...(existingSession.treatmentProtocol || DEFAULT_TREATMENT_PROTOCOL),
          totalSessions: Math.max(existingSession.treatmentProtocol?.totalSessions || 0, nextNum)
        };

        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId, existingSession.patientId);
          const updated = {
            ...target,
            clinicalProcedures: updatedProcs,
            procedures: updatedTab4Procs,
            treatmentProtocol: updatedProtocol
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        // Persist to backend REST API
        try {
          const res = await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_session',
              procedureId: targetProc.id,
              sessionId,
              sessionNumber: nextNum,
              date: sessionDate,
              therapist: newSession.therapist,
              bodyPart: newSession.bodyPart,
              session: newSession
            })
          });

          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }
        } catch (err: any) {
          // Rollback on server error
          set(s => ({
            activeSession: s.activeSession?.caseId === caseId ? previousSessionSnapshot : s.activeSession,
            sessions: { ...s.sessions, [caseId]: previousSessionSnapshot }
          }));
          throw err;
        }

        safeSaveProceduresCache(caseId, updatedProcs);

        notifyTabSync('doctor-consultation');
        notifyTabSync('treatment-protocol');
        return newSession;
      },

      updateClinicalSession: async (caseId: string, procedureId: string, sessionId: string, updates: Partial<ClinicalSession>) => {
        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
          const procs = target.clinicalProcedures || [];
          const sessionNumMatch = sessionId.match(/\d+/);
          const targetNum = sessionNumMatch ? parseInt(sessionNumMatch[0], 10) : null;

          const updatedProcs = procs.map(proc => {
            if (proc.id !== procedureId && proc.name.toLowerCase() !== procedureId.toLowerCase()) return proc;
            return {
              ...proc,
              sessions: proc.sessions.map((sess, idx) => {
                const isMatch = sess.id === sessionId ||
                  (targetNum !== null && sess.sessionNumber === targetNum) ||
                  (targetNum !== null && idx + 1 === targetNum);
                if (!isMatch) return sess;
                return { ...sess, ...updates };
              })
            };
          });

          // Also update matching Tab 4 procedure execution item
          const tab4Procs = (target.procedures || []).map((p, idx) => {
            const isMatch = p.id === sessionId ||
              (targetNum !== null && p.sessionNumber === targetNum) ||
              (targetNum !== null && idx + 1 === targetNum);
            if (!isMatch) return p;
            return {
              ...p,
              ...(updates.date ? { scheduledDate: updates.date, performanceDate: updates.date } : {}),
              ...(updates.status ? { status: updates.status as any } : {}),
              ...(updates.therapist ? { therapist: updates.therapist } : {}),
              ...(updates.bodyPart ? { bodyPart: updates.bodyPart } : {}),
              ...(updates.doctorObservation ? { remark: updates.doctorObservation } : {})
            };
          });

          const updated = {
            ...target,
            clinicalProcedures: updatedProcs,
            procedures: tab4Procs
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        try {
          await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_session',
              procedureId,
              sessionId,
              updates
            })
          });
        } catch (err) {
          console.warn('Update session persistence warning:', err);
        }

        const list = get().sessions[caseId]?.clinicalProcedures || [];
        safeSaveProceduresCache(caseId, list);

        notifyTabSync('doctor-consultation');
        notifyTabSync('treatment-protocol');
      },

      createSubSection: async (caseId: string, procedureId: string, sessionId: string, name?: string) => {
        const state = get();
        const existingSession = getOrCreateConsultationSession(state.sessions, state.activeSession, caseId);

        const currentProcs = existingSession.clinicalProcedures || [];
        const procIndex = currentProcs.findIndex(p => p.id === procedureId || p.name.toLowerCase() === procedureId.toLowerCase());
        if (procIndex === -1) throw new Error(`Procedure ${procedureId} not found.`);

        const targetProc = currentProcs[procIndex];
        const sessIndex = targetProc.sessions.findIndex(s => s.id === sessionId);
        if (sessIndex === -1) throw new Error(`Session ${sessionId} not found.`);

        const targetSess = targetProc.sessions[sessIndex];
        const subCount = (targetSess.subSections || []).length + 1;
        const subSecId = `subsec-${sessionId}-${subCount}-${Date.now().toString(36)}`;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = formatToDDMMYYYY(now);

        const newSub: ClinicalSubSection = {
          id: subSecId,
          sessionId: targetSess.id,
          name: name || `Session ${targetSess.sessionNumber} — Sub-section ${subCount}`,
          procedureName: targetProc.name,
          date: targetSess.date,
          createdAt: `${dateStr} ${timeStr}`,
          images: []
        };

        const updatedProcs = [...currentProcs];
        const updatedSessions = [...targetProc.sessions];
        updatedSessions[sessIndex] = {
          ...targetSess,
          subSections: [...(targetSess.subSections || []), newSub]
        };
        updatedProcs[procIndex] = {
          ...targetProc,
          sessions: updatedSessions
        };

        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
          const updated = {
            ...target,
            clinicalProcedures: updatedProcs
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        try {
          await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_subsection',
              procedureId: targetProc.id,
              sessionId: targetSess.id,
              sectionId: `sec-${targetSess.id}-1`,
              name: newSub.name
            })
          });
        } catch (err) {
          console.warn('Subsection persistence warning:', err);
        }

        safeSaveProceduresCache(caseId, updatedProcs);

        notifyTabSync('doctor-consultation');
        return newSub;
      },

      addClinicalImage: async (caseId: string, procedureId: string, sessionId: string, image: ClinicalImage, subSectionId?: string) => {
        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
          const procs = target.clinicalProcedures || [];
          const updatedProcs = procs.map(proc => {
            if (proc.id !== procedureId && proc.name.toLowerCase() !== procedureId.toLowerCase()) return proc;
            return {
              ...proc,
              sessions: proc.sessions.map(sess => {
                if (sess.id !== sessionId) return sess;
                if (subSectionId && subSectionId !== 'main') {
                  return {
                    ...sess,
                    subSections: sess.subSections.map(sub => {
                      if (sub.id !== subSectionId) return sub;
                      return {
                        ...sub,
                        images: [image, ...(sub.images || []).filter(i => i.id !== image.id)]
                      };
                    })
                  };
                } else if (image.type === 'BEFORE') {
                  return {
                    ...sess,
                    beforeImages: [image, ...(sess.beforeImages || []).filter(i => i.id !== image.id)]
                  };
                } else {
                  return {
                    ...sess,
                    afterImages: [image, ...(sess.afterImages || []).filter(i => i.id !== image.id)]
                  };
                }
              })
            };
          });

          const updated = {
            ...target,
            clinicalProcedures: updatedProcs
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        try {
          const res = await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'append_image',
              procedureId,
              sessionId,
              sectionId: `sec-${sessionId}-1`,
              subSectionId: subSectionId || 'main',
              targetType: image.type,
              image
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.procedures && Array.isArray(data.procedures)) {
              set(s => {
                const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
                const updated = { ...target, clinicalProcedures: data.procedures };
                return {
                  activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
                  sessions: { ...s.sessions, [caseId]: updated }
                };
              });
            }
          }
        } catch (err) {
          console.warn('Image persistence warning:', err);
        }

        const list = get().sessions[caseId]?.clinicalProcedures || [];
        safeSaveProceduresCache(caseId, list);

        notifyTabSync('doctor-consultation');
      },

      updateClinicalImage: async (caseId: string, imageId: string, patch: Partial<ClinicalImage>) => {
        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
          const procs = target.clinicalProcedures || [];
          const updatedProcs = procs.map(proc => ({
            ...proc,
            sessions: proc.sessions.map(sess => ({
              ...sess,
              beforeImages: sess.beforeImages.map(img => img.id === imageId ? { ...img, ...patch } : img),
              afterImages: sess.afterImages.map(img => img.id === imageId ? { ...img, ...patch } : img),
              subSections: sess.subSections.map(sub => ({
                ...sub,
                images: sub.images.map(img => img.id === imageId ? { ...img, ...patch } : img)
              }))
            }))
          }));

          const updated = {
            ...target,
            clinicalProcedures: updatedProcs
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        try {
          await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_image_edit', imageId, patch })
          });
        } catch (err) {}

        const list = get().sessions[caseId]?.clinicalProcedures || [];
        safeSaveProceduresCache(caseId, list);

        notifyTabSync('doctor-consultation');
      },

      deleteClinicalImage: async (caseId: string, imageId: string) => {
        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
          const procs = target.clinicalProcedures || [];
          const updatedProcs = procs.map(proc => ({
            ...proc,
            sessions: proc.sessions.map(sess => ({
              ...sess,
              beforeImages: sess.beforeImages.filter(img => img.id !== imageId),
              afterImages: sess.afterImages.filter(img => img.id !== imageId),
              subSections: sess.subSections.map(sub => ({
                ...sub,
                images: sub.images.filter(img => img.id !== imageId)
              }))
            }))
          }));

          const updated = {
            ...target,
            clinicalProcedures: updatedProcs
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        try {
          await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_image', imageId })
          });
        } catch (err) {}

        const list = get().sessions[caseId]?.clinicalProcedures || [];
        safeSaveProceduresCache(caseId, list);

        notifyTabSync('doctor-consultation');
      },

      syncClinicalProcedures: async (caseId: string, procedures: ClinicalProcedure[]) => {
        set(s => {
          const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
          const updated = {
            ...target,
            clinicalProcedures: procedures
          };
          return {
            activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
            sessions: { ...s.sessions, [caseId]: updated }
          };
        });

        try {
          const res = await fetch(`/api/consultation/${caseId}/clinical-procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync_all', procedures })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.procedures && Array.isArray(data.procedures)) {
              set(s => {
                const target = getOrCreateConsultationSession(s.sessions, s.activeSession, caseId);
                const updated = { ...target, clinicalProcedures: data.procedures };
                return {
                  activeSession: s.activeSession?.caseId === caseId ? updated : (s.activeSession || updated),
                  sessions: { ...s.sessions, [caseId]: updated }
                };
              });
            }
          }
        } catch {}

        safeSaveProceduresCache(caseId, procedures);
        notifyTabSync('doctor-consultation');
      },

      refreshClinicalProcedures: async (caseId: string) => {
        try {
          const res = await fetch(`/api/consultation/${caseId}/clinical-procedures`);
          if (res.ok) {
            const data = await res.json();
            if (data.procedures && Array.isArray(data.procedures)) {
              get().syncClinicalProcedures(caseId, data.procedures);
            }
          }
        } catch {}
      },
    }),
    {
      name: 'doctor-consultation',
      storage: safeStorage,
      merge: (persistedState: any, currentState: any) => {
        if (!persistedState) return currentState;
        const mergedSessions: Record<string, ConsultationSession> = {
          ...(currentState?.sessions || {})
        };
        if (persistedState?.sessions) {
          for (const [caseId, pSess] of Object.entries(persistedState.sessions as Record<string, any>)) {
            const currentProcs = currentState?.sessions?.[caseId]?.clinicalProcedures;
            mergedSessions[caseId] = {
              ...pSess,
              clinicalProcedures: (currentProcs && currentProcs.length > 0) ? currentProcs : pSess.clinicalProcedures
            };
          }
        }
        const currentActiveProcs = currentState?.activeSession?.clinicalProcedures;
        return {
          ...currentState,
          ...persistedState,
          sessions: mergedSessions,
          activeSession: persistedState.activeSession ? {
            ...persistedState.activeSession,
            clinicalProcedures: (currentActiveProcs && currentActiveProcs.length > 0) ? currentActiveProcs : persistedState.activeSession.clinicalProcedures
          } : currentState.activeSession
        };
      },
      partialize: (state) => {
        // Exclude heavy clinicalProcedures from localStorage since they are canonically stored on the REST API
        const strippedSessions: Record<string, ConsultationSession> = {};
        for (const [k, v] of Object.entries(state.sessions || {})) {
          const { clinicalProcedures, ...rest } = (v as any);
          strippedSessions[k] = rest as ConsultationSession;
        }
        let strippedActiveSession = state.activeSession;
        if (strippedActiveSession) {
          const { clinicalProcedures, ...rest } = (strippedActiveSession as any);
          strippedActiveSession = rest as ConsultationSession;
        }
        return {
          ...state,
          sessions: strippedSessions,
          activeSession: strippedActiveSession
        };
      }
    }
  )
);

// ============================================================
// Pharmacy & Dispensary Module (FEFO Engine & POS Cashiering)
// ============================================================

export interface DrugBatch {
  id: string;
  drugId: string;
  drugName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  stockQuantity: number;
  unitCost: number;
  supplier: string;
  isQuarantined?: boolean;
}

export interface StockMovement {
  id: string;
  drugId: string;
  drugName: string;
  movementType: 'DISPENSE' | 'RECEIVE' | 'RETURN' | 'ADJUSTMENT' | 'DISPOSAL';
  quantity: number;
  batchNumber: string;
  reference: string;
  date: string;
  performedBy: string;
}

export interface PrescriptionFulfillmentItem {
  id: string;
  drugId: string;
  drugName: string;
  formulation: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  prescribedQty: number;
  dispensedQty: number;
  unitPrice: number;
  instructions: string;
  isDispensed: boolean;
  batchAllocations?: Array<{ batchNumber: string; qty: number }>;
}

export interface PrescriptionFulfillment {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  mrdNumber: string;
  age: number;
  gender: Gender;
  mobile: string;
  doctorName: string;
  consultationDate: string;
  allergies: string[];
  status: 'PHARMACY_PENDING' | 'IN_PROGRESS' | 'DISPENSED' | 'CANCELLED';
  items: PrescriptionFulfillmentItem[];
  billing: {
    subtotal: number;
    tax: number;
    totalPayable: number;
    paymentMode?: 'CASH' | 'CARD_UPI';
    invoiceNumber?: string;
    dispensedAt?: string;
    dispensedBy?: string;
  };
}

export const INITIAL_DRUG_BATCHES: DrugBatch[] = [
  { id: 'b-1', drugId: 'd-1', drugName: 'Amoxicillin 500mg', batchNumber: 'BAT-2601', expiryDate: '2026-10-15', stockQuantity: 8, unitCost: 9.5, supplier: 'Sun Pharma Distributors' },
  { id: 'b-2', drugId: 'd-1', drugName: 'Amoxicillin 500mg', batchNumber: 'BAT-2602', expiryDate: '2027-08-31', stockQuantity: 0, unitCost: 9.5, supplier: 'Sun Pharma Distributors' },
  { id: 'b-3', drugId: 'd-2', drugName: 'Paracetamol 650mg (Dolo)', batchNumber: 'BAT-2605', expiryDate: '2026-11-20', stockQuantity: 12, unitCost: 2.1, supplier: 'Micro Labs Logistics' },
  { id: 'b-4', drugId: 'd-3', drugName: 'Mometasone 0.1% Cream', batchNumber: 'BAT-2590', expiryDate: '2027-05-15', stockQuantity: 45, unitCost: 110, supplier: 'Glenmark Pharmaceuticals' },
  { id: 'b-5', drugId: 'd-4', drugName: 'Bilastine 20mg (Bilaxten)', batchNumber: 'BAT-2580', expiryDate: '2027-12-31', stockQuantity: 35, unitCost: 14, supplier: 'Zydus Healthcare' },
  { id: 'b-6', drugId: 'd-5', drugName: 'Levocetirizine 5mg', batchNumber: 'BAT-2575', expiryDate: '2026-12-10', stockQuantity: 80, unitCost: 3.5, supplier: 'Cipla Medpro' },
  { id: 'b-7', drugId: 'd-6', drugName: 'Telmisartan 40mg', batchNumber: 'BAT-2560', expiryDate: '2028-02-28', stockQuantity: 40, unitCost: 6.8, supplier: 'Torrent Pharmaceuticals' },
  { id: 'b-8', drugId: 'd-7', drugName: 'Nitrofurantoin SR 100mg', batchNumber: 'BAT-2550', expiryDate: '2026-08-30', stockQuantity: 0, unitCost: 12, supplier: 'Alkem Laboratories', isQuarantined: true },
  { id: 'b-9', drugId: 'd-8', drugName: 'Diacerein 50mg + Glucosamine', batchNumber: 'BAT-2540', expiryDate: '2027-09-30', stockQuantity: 50, unitCost: 16.5, supplier: "Dr. Reddy's Lab" },
  { id: 'b-10', drugId: 'd-9', drugName: 'Emollient Moisturizer Lotion', batchNumber: 'BAT-2530', expiryDate: '2028-01-31', stockQuantity: 30, unitCost: 210, supplier: 'Galderma India' },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'sm-1', drugId: 'd-1', drugName: 'Amoxicillin 500mg', movementType: 'DISPENSE', quantity: -10, batchNumber: 'BAT-2601', reference: 'CASE-987110', date: '2026-09-19 09:45 AM', performedBy: 'Suresh Shah' },
  { id: 'sm-2', drugId: 'd-3', drugName: 'Mometasone 0.1% Cream', movementType: 'RECEIVE', quantity: 50, batchNumber: 'BAT-2590', reference: 'Invoice INV-9844', date: '2026-09-18 04:20 PM', performedBy: 'Suresh Shah' },
  { id: 'sm-3', drugId: 'd-2', drugName: 'Paracetamol 650mg (Dolo)', movementType: 'DISPENSE', quantity: -18, batchNumber: 'BAT-2605', reference: 'CASE-986920', date: '2026-09-18 11:15 AM', performedBy: 'Suresh Shah' },
  { id: 'sm-4', drugId: 'd-7', drugName: 'Nitrofurantoin SR 100mg', movementType: 'DISPOSAL', quantity: -5, batchNumber: 'BAT-2550', reference: 'Expired Quarantine Write-Off', date: '2026-09-17 02:00 PM', performedBy: 'Suresh Shah' },
  { id: 'sm-5', drugId: 'd-4', drugName: 'Bilastine 20mg (Bilaxten)', movementType: 'RETURN', quantity: 5, batchNumber: 'BAT-2580', reference: 'Adverse rash reaction (CASE-98650)', date: '2026-09-16 03:40 PM', performedBy: 'Suresh Shah' },
];

export const INITIAL_PRESCRIPTIONS: PrescriptionFulfillment[] = [];

interface PharmacyState {
  prescriptions: PrescriptionFulfillment[];
  batches: DrugBatch[];
  movements: StockMovement[];
  getPrescriptionByCaseId: (caseId: string) => PrescriptionFulfillment | undefined;
  addPrescription: (prescription: PrescriptionFulfillment) => void;
  dispensePrescription: (
    caseId: string,
    itemsToDispense: Array<{ itemId: string; dispensedQty: number }>,
    paymentMode: 'CASH' | 'CARD_UPI'
  ) => { invoiceNumber: string };
  addStock: (drugId: string, drugName: string, batchNumber: string, expiryDate: string, quantity: number, supplier: string) => void;
  addNewDrugMaster: (drug: Omit<DrugInventoryItem, 'id' | 'stock'> & { initialStock?: number; batchNumber?: string; expiryDate?: string; supplier?: string }) => void;
  processReturn: (caseId: string, drugId: string, batchNumber: string, quantity: number, reason: string) => void;
  disposeBatch: (batchId: string, reason: string) => void;
}

export const usePharmacyStore = create<PharmacyState>()(
  persist(
    (set, get) => ({
      prescriptions: INITIAL_PRESCRIPTIONS,
      batches: INITIAL_DRUG_BATCHES,
      movements: INITIAL_STOCK_MOVEMENTS,

      getPrescriptionByCaseId: (caseId) => {
        return get().prescriptions.find(p => p.caseId.toLowerCase() === caseId.toLowerCase());
      },

      addPrescription: (prescription) => {
        set(s => {
          const existingIdx = s.prescriptions.findIndex(p => p.caseId.toLowerCase() === prescription.caseId.toLowerCase());
          if (existingIdx >= 0) {
            const updated = [...s.prescriptions];
            updated[existingIdx] = { ...updated[existingIdx], ...prescription };
            return { prescriptions: updated };
          }
          return { prescriptions: [prescription, ...s.prescriptions] };
        });
        notifyTabSync('doctor-pharmacy');
      },

      dispensePrescription: (caseId, itemsToDispense, paymentMode) => {
        const state = get();
        const prescription = state.prescriptions.find(p => p.caseId.toLowerCase() === caseId.toLowerCase());
        const invoiceNumber = `INV-PHARM-${Math.floor(10000 + Math.random() * 90000)}`;
        const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        let updatedBatches = [...state.batches];
        let newMovements: StockMovement[] = [];

        // Process each item with FEFO batch deduction
        const updatedItems = (prescription?.items || []).map(item => {
          const match = itemsToDispense.find(i => i.itemId === item.id);
          if (!match || match.dispensedQty <= 0) return item;

          let remainingToDeduct = match.dispensedQty;
          let batchAllocations: Array<{ batchNumber: string; qty: number }> = [];

          // FEFO Sort: Find active batches for this drug sorted by earliest expiry
          const drugBatches = updatedBatches
            .filter(b => b.drugId === item.drugId && !b.isQuarantined && b.stockQuantity > 0)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

          for (const batch of drugBatches) {
            if (remainingToDeduct <= 0) break;
            const deductFromThis = Math.min(batch.stockQuantity, remainingToDeduct);
            batch.stockQuantity -= deductFromThis;
            remainingToDeduct -= deductFromThis;
            batchAllocations.push({ batchNumber: batch.batchNumber, qty: deductFromThis });

            newMovements.push({
              id: `sm-${Date.now()}-${Math.random()}`,
              drugId: item.drugId,
              drugName: item.drugName,
              movementType: 'DISPENSE',
              quantity: -deductFromThis,
              batchNumber: batch.batchNumber,
              reference: caseId,
              date: nowTime,
              performedBy: 'Suresh Shah'
            });
          }

          // Sync overall inventory stock
          useInventoryStore.getState().updateStock(item.drugId, -match.dispensedQty);

          return {
            ...item,
            isDispensed: true,
            dispensedQty: match.dispensedQty,
            batchAllocations
          };
        });

        // Calculate subtotal, 5% GST tax, total
        const subtotal = updatedItems.reduce((sum, item) => sum + (item.isDispensed ? item.dispensedQty * item.unitPrice : 0), 0);
        const tax = parseFloat((subtotal * 0.05).toFixed(2));
        const totalPayable = parseFloat((subtotal + tax).toFixed(2));

        set(s => ({
          batches: updatedBatches,
          movements: [...newMovements, ...s.movements],
          prescriptions: s.prescriptions.map(p => p.caseId.toLowerCase() === caseId.toLowerCase() ? {
            ...p,
            status: 'DISPENSED',
            items: updatedItems,
            billing: {
              subtotal,
              tax,
              totalPayable,
              paymentMode,
              invoiceNumber,
              dispensedAt: nowTime,
              dispensedBy: 'Suresh Shah'
            }
          } : p)
        }));

        // Update queue entry stage to COMPLETED / BILLING_PENDING
        const queueStore = useQueueStore.getState();
        const entry = queueStore.queue.find(q => q.caseNumber.toLowerCase() === caseId.toLowerCase());
        if (entry) {
          queueStore.updateStatus(entry.id, 'COMPLETED');
        }

        notifyTabSync('doctor-pharmacy');
        return { invoiceNumber };
      },

      addStock: (drugId, drugName, batchNumber, expiryDate, quantity, supplier) => {
        const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const newBatch: DrugBatch = {
          id: `b-${Date.now()}`,
          drugId,
          drugName,
          batchNumber,
          expiryDate,
          stockQuantity: quantity,
          unitCost: 10,
          supplier
        };

        const newMovement: StockMovement = {
          id: `sm-${Date.now()}`,
          drugId,
          drugName,
          movementType: 'RECEIVE',
          quantity,
          batchNumber,
          reference: `Supplier Delivery (${supplier})`,
          date: nowTime,
          performedBy: 'Suresh Shah'
        };

        // Update inventory item stock
        useInventoryStore.getState().updateStock(drugId, quantity);

        set(s => ({
          batches: [newBatch, ...s.batches],
          movements: [newMovement, ...s.movements]
        }));
        notifyTabSync('doctor-pharmacy');
      },

      addNewDrugMaster: (drug) => {
        const newId = `d-${Date.now()}`;
        const initialQty = drug.initialStock || 0;

        const newDrugItem: DrugInventoryItem = {
          id: newId,
          name: drug.name,
          genericName: drug.genericName,
          brandName: (drug as any).brandName || drug.name,
          manufacturer: (drug as any).manufacturer || drug.supplier || 'Cipla pvt',
          formulation: drug.formulation,
          stock: initialQty,
          reorderLevel: drug.reorderLevel,
          unitPrice: drug.unitPrice,
          defaultDose: (drug as any).defaultDose || '1 tab',
          defaultFreq: (drug as any).defaultFreq || '1-0-1',
          defaultDay: (drug as any).defaultDay || '5 day',
          defaultTotal: (drug as any).defaultTotal || '5',
          defaultNote: (drug as any).defaultNote || 'After food',
          isActive: (drug as any).isActive !== undefined ? (drug as any).isActive : true,
          alternatives: drug.alternatives || []
        };

        // Add to inventory store
        useInventoryStore.setState(s => ({
          inventory: [newDrugItem, ...s.inventory]
        }));

        if (initialQty > 0 && drug.batchNumber && drug.expiryDate) {
          get().addStock(newId, drug.name, drug.batchNumber, drug.expiryDate, initialQty, drug.supplier || 'Standard Distributor');
        }
        notifyTabSync('doctor-pharmacy');
        notifyTabSync('doctor-inventory');
      },

      processReturn: (caseId, drugId, batchNumber, quantity, reason) => {
        const state = get();
        const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const batch = state.batches.find(b => b.batchNumber === batchNumber);
        const drugName = batch?.drugName || 'Medication';

        // Re-credit batch
        const updatedBatches = state.batches.map(b => b.batchNumber === batchNumber ? { ...b, stockQuantity: b.stockQuantity + quantity } : b);

        // Update inventory item
        useInventoryStore.getState().updateStock(drugId, quantity);

        // Log return movement
        const returnMovement: StockMovement = {
          id: `sm-${Date.now()}`,
          drugId,
          drugName,
          movementType: 'RETURN',
          quantity,
          batchNumber,
          reference: `Return: ${caseId} (${reason})`,
          date: nowTime,
          performedBy: 'Suresh Shah'
        };

        // Auto-log Special Note to Patient Record
        const patientStore = usePatientStore.getState();
        const targetPrescription = state.prescriptions.find(p => p.caseId.toLowerCase() === caseId.toLowerCase());
        if (targetPrescription) {
          const patient = patientStore.patients.find(p => p.id === targetPrescription.patientId);
          if (patient) {
            const specialNote = `${new Date().toLocaleDateString('en-GB')}/Pharmacy Return: ${drugName} (Qty: ${quantity}) — ${reason}`;
            patientStore.updatePatient(patient.id, {
              specialNotes: [...(patient.specialNotes || []), specialNote]
            });
          }
        }

        set(s => ({
          batches: updatedBatches,
          movements: [returnMovement, ...s.movements]
        }));
        notifyTabSync('doctor-pharmacy');
      },

      disposeBatch: (batchId, reason) => {
        const state = get();
        const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const batch = state.batches.find(b => b.id === batchId);
        if (!batch) return;

        const disposedQty = batch.stockQuantity;
        useInventoryStore.getState().updateStock(batch.drugId, -disposedQty);

        const disposalMovement: StockMovement = {
          id: `sm-${Date.now()}`,
          drugId: batch.drugId,
          drugName: batch.drugName,
          movementType: 'DISPOSAL',
          quantity: -disposedQty,
          batchNumber: batch.batchNumber,
          reference: `Quarantine Write-Off (${reason})`,
          date: nowTime,
          performedBy: 'Suresh Shah'
        };

        set(s => ({
          batches: s.batches.map(b => b.id === batchId ? { ...b, isQuarantined: true, stockQuantity: 0 } : b),
          movements: [disposalMovement, ...s.movements]
        }));
        notifyTabSync('doctor-pharmacy');
      }
    }),
    {
      name: 'doctor-pharmacy',
      storage: safeStorage,
    }
  )
);

// ============================================================
// Admin & Enterprise Governance Module
// ============================================================

export interface StaffMember {
  id: string;
  name: string;
  role: 'RECEPTION' | 'NURSING' | 'MEDICAL' | 'ADMIN';
  designation: string;
  email: string;
  phone: string;
  salary: number;
  overtimeRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
  shift: string;
  licenseNumber?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  overtimeHours: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
}

export interface ProcedureMaster {
  id: string;
  name: string;
  code: string;
  category: 'Dermatology' | 'General Surgery' | 'Orthopedics' | 'ENT' | 'Nursing / Minor';
  basePrice: number;
  durationMins: number;
  requiresConsent: boolean;
  requiresNursing: boolean;
  requiresRoom: boolean;
  linkedConsumables: Array<{ drugId: string; drugName: string; quantity: number }>;
  preInstructions: string;
  postInstructions: string;
  isActive?: boolean;
}

export interface LabTestParameter {
  id: string;
  labTestId: string;
  name: string;
  code?: string;
  dataType: 'Numeric' | 'Text' | 'Select';
  unit?: string;
  referenceRange?: string;
  maleMin?: number;
  maleMax?: number;
  femaleMin?: number;
  femaleMax?: number;
  childMin?: number;
  childMax?: number;
  min?: number;
  max?: number;
  decimalPrecision?: number;
  optionsJson?: string[];
  resultEntryType?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category: 'Hematology' | 'Biochemistry' | 'Pathology' | 'Radiology' | 'Microbiology' | string;
  department?: string;
  specimen: string;
  container?: string;
  specimenTube?: string;
  method?: string;
  turnaroundTime?: string;
  turnaroundHours?: number;
  price: number;
  unit?: string;
  normalRange?: string;
  isOrderable: boolean;
  requiresFasting?: boolean;
  defaultPriority?: 'Routine' | 'Urgent' | 'STAT';
  instructions?: string;
  clinicalIndicationRequired?: boolean;
  doctorNotesAllowed?: boolean;
  parameters: LabTestParameter[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type LabTestMaster = LabTest;

export interface LabOrderItem {
  id: string;
  labOrderId: string;
  labTestId: string;
  testName: string;
  code?: string;
  category?: string;
  specimen?: string;
  price: number;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  instructions?: string;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  consultationId: string;
  doctorId: string;
  doctorName: string;
  priority: 'Routine' | 'Urgent' | 'STAT';
  clinicalNotes?: string;
  status: 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  orderedAt: string;
  items: LabOrderItem[];
}

export interface ConsentTemplate {
  id: string;
  title: string;
  category: string;
  language: 'English' | 'Hindi' | 'Gujarati';
  content: string;
  variables: string[];
  isActive: boolean;
  lastUpdated: string;
}

export type ExpenseCategory =
  | 'Rent & Lease'
  | 'Bio-Medical Waste'
  | 'IT & Utilities'
  | 'Medical Consumables'
  | 'Pharmaceuticals & Stock'
  | 'Diagnostic Reagents'
  | 'Maintenance & Facility'
  | 'Staff Welfare & Training'
  | 'Housekeeping & Sanitation'
  | 'Marketing & Outreach'
  | 'Administrative & Sundry';

export interface ClinicExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE' | 'CARD';
  receiptNumber: string;
  approvedBy: string;
  notes?: string;
  vendor?: string;
  gstNumber?: string;
  taxAmount?: number;
  status?: 'PAID' | 'PENDING' | 'VOID';
}

export interface SecuritySession {
  id: string;
  userId: string;
  userName: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSING' | 'RECEPTION' | 'MEDICAL';
  deviceName: string;
  ipAddress: string;
  location: string;
  riskScore: number;
  loginTime: string;
  status: 'ACTIVE' | 'TERMINATED';
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'ANOMALOUS_ACCESS' | 'LOCK_PREEMPTION' | 'KEY_ROTATION' | 'THREAT_BLOCKED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceIp: string;
  description: string;
  actionTaken: string;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  triggerEvent: 'APPOINTMENT_BOOKED' | 'REMINDER_24H' | 'FOLLOWUP_REMINDER' | 'APPOINTMENT_CANCELLED' | 'GOOGLE_REVIEW_REQUEST';
  channel: 'SMS' | 'WHATSAPP' | 'BOTH';
  content: string;
  isEnabled: boolean;
}

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  regNumber: string;
  upiVpa: string;
  merchantName: string;
  prescriptionLayout: {
    showHeader: boolean;
    showDoctorDetails: boolean;
    showPatientVitals: boolean;
    showDrugScheduleTable: boolean;
    showLabOrders: boolean;
    showSignatureBlock: boolean;
    topMarginMm: number;
    bottomMarginMm: number;
  };
}

export interface HolidaySchedule {
  id: string;
  date: string;
  name: string;
  isRecurringYearly: boolean;
}

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'st-1', name: 'Bhavna Desai', role: 'NURSING', designation: 'Staff Triage Nurse', email: 'bhavna.desai@medflow.health', phone: '+91 98251 33410', salary: 38000, overtimeRate: 350, status: 'ACTIVE', joinedDate: '2024-03-15', shift: '08:00 AM – 04:00 PM', licenseNumber: 'GNC-78412' },
  { id: 'st-2', name: 'Suresh Shah', role: 'MEDICAL', designation: 'Senior Dispensary Officer', email: 'suresh.shah@medflow.health', phone: '+91 98251 44810', salary: 45000, overtimeRate: 400, status: 'ACTIVE', joinedDate: '2023-08-01', shift: '08:00 AM – 04:00 PM', licenseNumber: 'PHARM-GUJ-88219' },
  { id: 'st-3', name: 'Pooja Patel', role: 'RECEPTION', designation: 'Front Desk Lead', email: 'pooja.patel@medflow.health', phone: '+91 98251 11200', salary: 28000, overtimeRate: 250, status: 'ACTIVE', joinedDate: '2025-01-10', shift: '08:30 AM – 04:30 PM' },
  { id: 'st-4', name: 'Amit Dave', role: 'ADMIN', designation: 'Clinic Operations Coordinator', email: 'amit.dave@medflow.health', phone: '+91 98251 99011', salary: 55000, overtimeRate: 500, status: 'ACTIVE', joinedDate: '2022-11-20', shift: '09:00 AM – 06:00 PM' },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', staffId: 'st-1', staffName: 'Bhavna Desai', date: '2026-09-19', checkIn: '07:55 AM', checkOut: '04:10 PM', hoursWorked: 8.25, overtimeHours: 0.25, status: 'PRESENT' },
  { id: 'att-2', staffId: 'st-2', staffName: 'Suresh Shah', date: '2026-09-19', checkIn: '08:02 AM', checkOut: '04:30 PM', hoursWorked: 8.5, overtimeHours: 0.5, status: 'PRESENT' },
  { id: 'att-3', staffId: 'st-3', staffName: 'Pooja Patel', date: '2026-09-19', checkIn: '08:28 AM', checkOut: '04:30 PM', hoursWorked: 8.0, overtimeHours: 0.0, status: 'PRESENT' },
  { id: 'att-4', staffId: 'st-4', staffName: 'Amit Dave', date: '2026-09-19', checkIn: '08:50 AM', checkOut: '06:15 PM', hoursWorked: 9.4, overtimeHours: 1.4, status: 'PRESENT' },
];

export const INITIAL_PROCEDURES: ProcedureMaster[] = [
  {
    id: 'proc-1',
    name: 'Chemical Peel (Glycolic 35%)',
    code: 'PROC-DERM-01',
    category: 'Dermatology',
    basePrice: 1500,
    durationMins: 30,
    requiresConsent: true,
    requiresNursing: true,
    requiresRoom: true,
    isActive: true,
    linkedConsumables: [
      { drugId: 'd-9', drugName: 'Emollient Moisturizer Lotion', quantity: 1 }
    ],
    preInstructions: 'Avoid retinoids and direct sunlight for 48 hours prior.',
    postInstructions: 'Apply broad-spectrum SPF 50 sunscreen twice daily. Do not pick peeling skin.'
  },
  {
    id: 'proc-2',
    name: 'Skin Lesion Excision & Biopsy',
    code: 'PROC-SURG-02',
    category: 'General Surgery',
    basePrice: 2800,
    durationMins: 45,
    requiresConsent: true,
    requiresNursing: true,
    requiresRoom: true,
    isActive: true,
    linkedConsumables: [
      { drugId: 'd-1', drugName: 'Amoxicillin 500mg', quantity: 6 }
    ],
    preInstructions: 'Discontinue blood thinners 3 days prior with physician approval.',
    postInstructions: 'Keep incision dry for 48 hours. Return in 7 days for suture removal.'
  },
  {
    id: 'proc-3',
    name: 'Intra-Articular Knee Injection',
    code: 'PROC-ORTHO-03',
    category: 'Orthopedics',
    basePrice: 2200,
    durationMins: 20,
    requiresConsent: true,
    requiresNursing: true,
    requiresRoom: true,
    isActive: true,
    linkedConsumables: [
      { drugId: 'd-8', drugName: 'Diacerein 50mg + Glucosamine', quantity: 1 }
    ],
    preInstructions: 'No strenuous lower limb exertion on procedure day.',
    postInstructions: 'Ice application 15 mins every 3 hours. Limit weight-bearing for 24h.'
  },
  {
    id: 'proc-4',
    name: 'Ear Syringing & Cerumen Removal',
    code: 'PROC-ENT-04',
    category: 'ENT',
    basePrice: 650,
    durationMins: 15,
    requiresConsent: false,
    requiresNursing: true,
    requiresRoom: false,
    isActive: false,
    linkedConsumables: [],
    preInstructions: 'Instill wax-softening drops 3 days prior to appointment.',
    postInstructions: 'Keep ears dry for 24 hours. Report dizziness immediately.'
  },
  {
    id: 'proc-5',
    name: 'Aseptic Wound Dressing (Large)',
    code: 'PROC-NURS-05',
    category: 'Nursing / Minor',
    basePrice: 400,
    durationMins: 15,
    requiresConsent: false,
    requiresNursing: true,
    requiresRoom: false,
    isActive: false,
    linkedConsumables: [
      { drugId: 'd-3', drugName: 'Mometasone 0.1% Cream', quantity: 1 }
    ],
    preInstructions: 'None.',
    postInstructions: 'Change dressing daily or if soiled.'
  }
];

export const INITIAL_LAB_TESTS: LabTest[] = [
  {
    id: 'lab-1',
    name: 'Complete Blood Count (CBC) with ESR',
    code: 'LAB-CBC',
    category: 'Hematology',
    department: 'Clinical Hematology',
    specimen: 'Whole Blood',
    container: 'EDTA (Purple Tube)',
    specimenTube: 'EDTA (Purple Tube)',
    method: 'Automated 5-Part Cell Counter',
    turnaroundTime: '4 Hours',
    turnaroundHours: 4,
    price: 350,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Fasting preferred but not mandatory. Mix gently after collection.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-cbc-1', labTestId: 'lab-1', name: 'Hemoglobin', code: 'HGB', dataType: 'Numeric', unit: 'g/dL', referenceRange: '13.0 - 17.5 g/dL', maleMin: 13.0, maleMax: 17.5, femaleMin: 12.0, femaleMax: 15.5, childMin: 11.0, childMax: 14.0, min: 2, max: 25, decimalPrecision: 1, displayOrder: 1, isActive: true },
      { id: 'p-cbc-2', labTestId: 'lab-1', name: 'RBC Count', code: 'RBC', dataType: 'Numeric', unit: 'million/µL', referenceRange: '4.5 - 5.9 million/µL', maleMin: 4.5, maleMax: 5.9, femaleMin: 4.0, femaleMax: 5.2, childMin: 3.8, childMax: 5.0, min: 1, max: 10, decimalPrecision: 2, displayOrder: 2, isActive: true },
      { id: 'p-cbc-3', labTestId: 'lab-1', name: 'Total WBC Count', code: 'WBC', dataType: 'Numeric', unit: '/µL', referenceRange: '4,000 - 11,000 /µL', maleMin: 4000, maleMax: 11000, femaleMin: 4000, femaleMax: 11000, childMin: 5000, childMax: 13000, min: 500, max: 50000, decimalPrecision: 0, displayOrder: 3, isActive: true },
      { id: 'p-cbc-4', labTestId: 'lab-1', name: 'Platelet Count', code: 'PLT', dataType: 'Numeric', unit: 'lakh/µL', referenceRange: '1.5 - 4.5 lakh/µL', maleMin: 1.5, maleMax: 4.5, femaleMin: 1.5, femaleMax: 4.5, childMin: 1.5, childMax: 4.5, min: 0.1, max: 10.0, decimalPrecision: 1, displayOrder: 4, isActive: true },
      { id: 'p-cbc-5', labTestId: 'lab-1', name: 'Hematocrit (PCV)', code: 'HCT', dataType: 'Numeric', unit: '%', referenceRange: '40 - 52 %', maleMin: 40, maleMax: 52, femaleMin: 36, femaleMax: 48, min: 10, max: 70, decimalPrecision: 1, displayOrder: 5, isActive: true },
      { id: 'p-cbc-6', labTestId: 'lab-1', name: 'Mean Corpuscular Volume (MCV)', code: 'MCV', dataType: 'Numeric', unit: 'fL', referenceRange: '80 - 100 fL', maleMin: 80, maleMax: 100, femaleMin: 80, femaleMax: 100, min: 50, max: 130, decimalPrecision: 1, displayOrder: 6, isActive: true },
      { id: 'p-cbc-7', labTestId: 'lab-1', name: 'Mean Corpuscular Hemoglobin (MCH)', code: 'MCH', dataType: 'Numeric', unit: 'pg', referenceRange: '27 - 33 pg', maleMin: 27, maleMax: 33, femaleMin: 27, femaleMax: 33, min: 15, max: 45, decimalPrecision: 1, displayOrder: 7, isActive: true },
      { id: 'p-cbc-8', labTestId: 'lab-1', name: 'MCHC', code: 'MCHC', dataType: 'Numeric', unit: 'g/dL', referenceRange: '32 - 36 g/dL', maleMin: 32, maleMax: 36, femaleMin: 32, femaleMax: 36, min: 20, max: 45, decimalPrecision: 1, displayOrder: 8, isActive: true },
      { id: 'p-cbc-9', labTestId: 'lab-1', name: 'ESR (Westergren)', code: 'ESR', dataType: 'Numeric', unit: 'mm/hr', referenceRange: '0 - 15 mm/hr', maleMin: 0, maleMax: 15, femaleMin: 0, femaleMax: 20, min: 0, max: 150, decimalPrecision: 0, displayOrder: 9, isActive: true }
    ]
  },
  {
    id: 'lab-2',
    name: 'Blood Sugar (Fasting Glucose)',
    code: 'LAB-BS',
    category: 'Biochemistry',
    department: 'Clinical Biochemistry',
    specimen: 'Blood / Fluoride Plasma',
    container: 'Fluoride (Grey Tube)',
    specimenTube: 'Fluoride (Grey Tube)',
    method: 'Hexokinase Photometric Assay',
    turnaroundTime: '3 Hours',
    turnaroundHours: 3,
    price: 100,
    isOrderable: true,
    requiresFasting: true,
    defaultPriority: 'Routine',
    instructions: 'Strict 8–10 hours overnight fasting required. Water allowed.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-bs-1', labTestId: 'lab-2', name: 'Fasting Blood Glucose', code: 'GLU-F', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', maleMin: 70, maleMax: 99, femaleMin: 70, femaleMax: 99, childMin: 60, childMax: 100, min: 20, max: 600, decimalPrecision: 0, displayOrder: 1, isActive: true }
    ]
  },
  {
    id: 'lab-3',
    name: 'Liver Function Test (LFT)',
    code: 'LAB-LFT',
    category: 'Biochemistry',
    department: 'Clinical Biochemistry',
    specimen: 'Serum',
    container: 'Serum Gel (Yellow Tube)',
    specimenTube: 'Serum Gel (Yellow Tube)',
    method: 'Automated Spectrophotometry',
    turnaroundTime: '6 Hours',
    turnaroundHours: 6,
    price: 600,
    isOrderable: true,
    requiresFasting: true,
    defaultPriority: 'Routine',
    instructions: '10 hours overnight fasting recommended. Avoid alcohol 24 hrs prior.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-lft-1', labTestId: 'lab-3', name: 'Bilirubin Total', code: 'TBIL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '0.2 - 1.2 mg/dL', maleMin: 0.2, maleMax: 1.2, femaleMin: 0.2, femaleMax: 1.2, decimalPrecision: 2, displayOrder: 1, isActive: true },
      { id: 'p-lft-2', labTestId: 'lab-3', name: 'Bilirubin Direct', code: 'DBIL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '0.0 - 0.3 mg/dL', maleMin: 0.0, maleMax: 0.3, femaleMin: 0.0, femaleMax: 0.3, decimalPrecision: 2, displayOrder: 2, isActive: true },
      { id: 'p-lft-3', labTestId: 'lab-3', name: 'Bilirubin Indirect', code: 'IBIL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '0.2 - 0.9 mg/dL', maleMin: 0.2, maleMax: 0.9, femaleMin: 0.2, femaleMax: 0.9, decimalPrecision: 2, displayOrder: 3, isActive: true },
      { id: 'p-lft-4', labTestId: 'lab-3', name: 'SGOT / AST', code: 'AST', dataType: 'Numeric', unit: 'U/L', referenceRange: '10 - 40 U/L', maleMin: 10, maleMax: 40, femaleMin: 9, femaleMax: 32, decimalPrecision: 0, displayOrder: 4, isActive: true },
      { id: 'p-lft-5', labTestId: 'lab-3', name: 'SGPT / ALT', code: 'ALT', dataType: 'Numeric', unit: 'U/L', referenceRange: '10 - 45 U/L', maleMin: 10, maleMax: 45, femaleMin: 7, femaleMax: 35, decimalPrecision: 0, displayOrder: 5, isActive: true },
      { id: 'p-lft-6', labTestId: 'lab-3', name: 'Alkaline Phosphatase (ALP)', code: 'ALP', dataType: 'Numeric', unit: 'U/L', referenceRange: '44 - 147 U/L', maleMin: 44, maleMax: 147, femaleMin: 44, femaleMax: 147, decimalPrecision: 0, displayOrder: 6, isActive: true },
      { id: 'p-lft-7', labTestId: 'lab-3', name: 'Total Protein', code: 'TP', dataType: 'Numeric', unit: 'g/dL', referenceRange: '6.4 - 8.3 g/dL', maleMin: 6.4, maleMax: 8.3, femaleMin: 6.4, femaleMax: 8.3, decimalPrecision: 1, displayOrder: 7, isActive: true },
      { id: 'p-lft-8', labTestId: 'lab-3', name: 'Serum Albumin', code: 'ALB', dataType: 'Numeric', unit: 'g/dL', referenceRange: '3.5 - 5.0 g/dL', maleMin: 3.5, maleMax: 5.0, femaleMin: 3.5, femaleMax: 5.0, decimalPrecision: 1, displayOrder: 8, isActive: true },
      { id: 'p-lft-9', labTestId: 'lab-3', name: 'Serum Globulin', code: 'GLOB', dataType: 'Numeric', unit: 'g/dL', referenceRange: '2.3 - 3.4 g/dL', maleMin: 2.3, maleMax: 3.4, femaleMin: 2.3, femaleMax: 3.4, decimalPrecision: 1, displayOrder: 9, isActive: true },
      { id: 'p-lft-10', labTestId: 'lab-3', name: 'A/G Ratio', code: 'AGR', dataType: 'Numeric', unit: 'ratio', referenceRange: '1.1 - 2.2', maleMin: 1.1, maleMax: 2.2, femaleMin: 1.1, femaleMax: 2.2, decimalPrecision: 2, displayOrder: 10, isActive: true }
    ]
  },
  {
    id: 'lab-4',
    name: 'Lipid Profile Screen',
    code: 'LAB-LIPID',
    category: 'Biochemistry',
    department: 'Clinical Biochemistry',
    specimen: 'Serum',
    container: 'Serum Gel (Yellow Tube)',
    specimenTube: 'Serum Gel (Yellow Tube)',
    method: 'Enzymatic Colorimetric Assay',
    turnaroundTime: '6 Hours',
    turnaroundHours: 6,
    price: 650,
    isOrderable: true,
    requiresFasting: true,
    defaultPriority: 'Routine',
    instructions: '12 hours strict fasting required.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-lip-1', labTestId: 'lab-4', name: 'Total Cholesterol', code: 'CHOL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '125 - 200 mg/dL', maleMin: 125, maleMax: 200, femaleMin: 125, femaleMax: 200, decimalPrecision: 0, displayOrder: 1, isActive: true },
      { id: 'p-lip-2', labTestId: 'lab-4', name: 'Triglycerides', code: 'TRIG', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '50 - 150 mg/dL', maleMin: 50, maleMax: 150, femaleMin: 50, femaleMax: 150, decimalPrecision: 0, displayOrder: 2, isActive: true },
      { id: 'p-lip-3', labTestId: 'lab-4', name: 'HDL Cholesterol', code: 'HDL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '40 - 60 mg/dL', maleMin: 40, maleMax: 60, femaleMin: 50, femaleMax: 70, decimalPrecision: 0, displayOrder: 3, isActive: true },
      { id: 'p-lip-4', labTestId: 'lab-4', name: 'LDL Cholesterol', code: 'LDL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '< 100 mg/dL', maleMin: 0, maleMax: 100, femaleMin: 0, femaleMax: 100, decimalPrecision: 0, displayOrder: 4, isActive: true },
      { id: 'p-lip-5', labTestId: 'lab-4', name: 'VLDL Cholesterol', code: 'VLDL', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '10 - 30 mg/dL', maleMin: 10, maleMax: 30, femaleMin: 10, femaleMax: 30, decimalPrecision: 0, displayOrder: 5, isActive: true }
    ]
  },
  {
    id: 'lab-5',
    name: 'Renal Function Test (RFT / KFT)',
    code: 'LAB-RFT',
    category: 'Biochemistry',
    department: 'Clinical Biochemistry',
    specimen: 'Serum',
    container: 'Serum Gel (Yellow Tube)',
    specimenTube: 'Serum Gel (Yellow Tube)',
    method: 'Jaffe & Enzymatic Rate Method',
    turnaroundTime: '4 Hours',
    turnaroundHours: 4,
    price: 550,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Maintain normal hydration before test.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-rft-1', labTestId: 'lab-5', name: 'Blood Urea', code: 'UREA', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '15 - 40 mg/dL', maleMin: 15, maleMax: 40, femaleMin: 15, femaleMax: 40, decimalPrecision: 1, displayOrder: 1, isActive: true },
      { id: 'p-rft-2', labTestId: 'lab-5', name: 'Serum Creatinine', code: 'CREAT', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '0.7 - 1.3 mg/dL', maleMin: 0.7, maleMax: 1.3, femaleMin: 0.6, femaleMax: 1.1, decimalPrecision: 2, displayOrder: 2, isActive: true },
      { id: 'p-rft-3', labTestId: 'lab-5', name: 'Serum Uric Acid', code: 'URIC', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '3.5 - 7.2 mg/dL', maleMin: 3.5, maleMax: 7.2, femaleMin: 2.6, femaleMax: 6.0, decimalPrecision: 1, displayOrder: 3, isActive: true },
      { id: 'p-rft-4', labTestId: 'lab-5', name: 'Blood Urea Nitrogen (BUN)', code: 'BUN', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '7 - 20 mg/dL', maleMin: 7, maleMax: 20, femaleMin: 7, femaleMax: 20, decimalPrecision: 1, displayOrder: 4, isActive: true },
      { id: 'p-rft-5', labTestId: 'lab-5', name: 'eGFR', code: 'EGFR', dataType: 'Numeric', unit: 'mL/min/1.73m²', referenceRange: '> 90 mL/min', maleMin: 90, maleMax: 140, femaleMin: 90, femaleMax: 140, decimalPrecision: 0, displayOrder: 5, isActive: true }
    ]
  },
  {
    id: 'lab-6',
    name: 'Skin Scraping for KOH Fungus Test',
    code: 'LAB-KOH',
    category: 'Microbiology',
    department: 'Clinical Microbiology',
    specimen: 'Lesion Scraping / Skin Scale',
    container: 'Sterile Container',
    specimenTube: 'Sterile Container',
    method: '10% KOH Wet Mount Microscopy',
    turnaroundTime: '2 Hours',
    turnaroundHours: 2,
    price: 300,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Clean active lesion border with 70% alcohol. Do not apply topical antifungal creams 48h prior.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-koh-1', labTestId: 'lab-6', name: 'Fungal Hyphae & Spores', code: 'KOH-FUNG', dataType: 'Text', referenceRange: 'Negative / Not Seen', resultEntryType: 'Microscopy', displayOrder: 1, isActive: true }
    ]
  },
  {
    id: 'lab-7',
    name: 'Serum Total IgE Allergy Level',
    code: 'LAB-IGE',
    category: 'Pathology',
    department: 'Immunopathology',
    specimen: 'Serum',
    container: 'Plain (Red Tube)',
    specimenTube: 'Plain (Red Tube)',
    method: 'Chemiluminescence Immunoassay (CLIA)',
    turnaroundTime: '8 Hours',
    turnaroundHours: 8,
    price: 850,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Fasting not required.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-ige-1', labTestId: 'lab-7', name: 'Total Serum IgE', code: 'IGE', dataType: 'Numeric', unit: 'IU/mL', referenceRange: '< 100 IU/mL', maleMin: 0, maleMax: 100, femaleMin: 0, femaleMax: 100, childMin: 0, childMax: 60, min: 0, max: 2000, decimalPrecision: 1, displayOrder: 1, isActive: true }
    ]
  },
  {
    id: 'lab-8',
    name: 'Blood Group & Rh Typing',
    code: 'LAB-BG',
    category: 'Hematology',
    department: 'Transfusion Medicine',
    specimen: 'Whole Blood',
    container: 'EDTA (Purple Tube)',
    specimenTube: 'EDTA (Purple Tube)',
    method: 'Agglutination Slide & Tube Method',
    turnaroundTime: '2 Hours',
    turnaroundHours: 2,
    price: 150,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Fasting not required.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-bg-1', labTestId: 'lab-8', name: 'ABO Blood Group', code: 'ABO', dataType: 'Select', optionsJson: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], displayOrder: 1, isActive: true },
      { id: 'p-bg-2', labTestId: 'lab-8', name: 'Rh Factor', code: 'RH', dataType: 'Select', optionsJson: ['Positive', 'Negative'], displayOrder: 2, isActive: true }
    ]
  },
  {
    id: 'lab-9',
    name: 'HbA1c & Glycated Hemoglobin',
    code: 'LAB-HBA1C',
    category: 'Biochemistry',
    department: 'Clinical Biochemistry',
    specimen: 'Whole Blood',
    container: 'EDTA (Purple Tube)',
    specimenTube: 'EDTA (Purple Tube)',
    method: 'HPLC Ion-Exchange Chromatography',
    turnaroundTime: '4 Hours',
    turnaroundHours: 4,
    price: 450,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Reflects 3-month average glucose. Fasting not required.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-hba-1', labTestId: 'lab-9', name: 'HbA1c Glycated Hemoglobin', code: 'HBA1C', dataType: 'Numeric', unit: '%', referenceRange: '4.0 - 5.6 % (Non-diabetic)', maleMin: 4.0, maleMax: 5.6, femaleMin: 4.0, femaleMax: 5.6, min: 3.0, max: 18.0, decimalPrecision: 1, displayOrder: 1, isActive: true },
      { id: 'p-hba-2', labTestId: 'lab-9', name: 'Estimated Average Glucose (eAG)', code: 'EAG', dataType: 'Numeric', unit: 'mg/dL', referenceRange: '< 114 mg/dL', maleMin: 68, maleMax: 114, femaleMin: 68, femaleMax: 114, min: 50, max: 500, decimalPrecision: 0, displayOrder: 2, isActive: true }
    ]
  },
  {
    id: 'lab-10',
    name: 'Urine Routine & Microscopic Culture',
    code: 'LAB-URINE',
    category: 'Pathology',
    department: 'Clinical Pathology',
    specimen: 'Urine',
    container: 'Urine Sterile Container',
    specimenTube: 'Urine Sterile Container',
    method: 'Automated Flow Cytometry & Microscopy',
    turnaroundTime: '3 Hours',
    turnaroundHours: 3,
    price: 250,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Mid-stream early morning clean catch sample.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-urn-1', labTestId: 'lab-10', name: 'Color', code: 'COL', dataType: 'Text', referenceRange: 'Pale Yellow', displayOrder: 1, isActive: true },
      { id: 'p-urn-2', labTestId: 'lab-10', name: 'Appearance', code: 'APP', dataType: 'Text', referenceRange: 'Clear', displayOrder: 2, isActive: true },
      { id: 'p-urn-3', labTestId: 'lab-10', name: 'pH', code: 'PH', dataType: 'Numeric', referenceRange: '5.0 - 7.5', maleMin: 5.0, maleMax: 7.5, femaleMin: 5.0, femaleMax: 7.5, decimalPrecision: 1, displayOrder: 3, isActive: true },
      { id: 'p-urn-4', labTestId: 'lab-10', name: 'Specific Gravity', code: 'SG', dataType: 'Numeric', referenceRange: '1.005 - 1.030', maleMin: 1.005, maleMax: 1.030, femaleMin: 1.005, femaleMax: 1.030, decimalPrecision: 3, displayOrder: 4, isActive: true },
      { id: 'p-urn-5', labTestId: 'lab-10', name: 'Urine Protein', code: 'PROT', dataType: 'Text', referenceRange: 'Nil / Negative', displayOrder: 5, isActive: true },
      { id: 'p-urn-6', labTestId: 'lab-10', name: 'Urine Glucose', code: 'GLU', dataType: 'Text', referenceRange: 'Nil / Negative', displayOrder: 6, isActive: true },
      { id: 'p-urn-7', labTestId: 'lab-10', name: 'Pus Cells (WBCs)', code: 'PUS', dataType: 'Numeric', unit: '/HPF', referenceRange: '0 - 5 /HPF', maleMin: 0, maleMax: 5, femaleMin: 0, femaleMax: 5, decimalPrecision: 0, displayOrder: 7, isActive: true },
      { id: 'p-urn-8', labTestId: 'lab-10', name: 'RBCs', code: 'RBC', dataType: 'Numeric', unit: '/HPF', referenceRange: '0 - 2 /HPF', maleMin: 0, maleMax: 2, femaleMin: 0, femaleMax: 2, decimalPrecision: 0, displayOrder: 8, isActive: true },
      { id: 'p-urn-9', labTestId: 'lab-10', name: 'Epithelial Cells', code: 'EPI', dataType: 'Numeric', unit: '/HPF', referenceRange: '1 - 4 /HPF', maleMin: 1, maleMax: 4, femaleMin: 1, femaleMax: 4, decimalPrecision: 0, displayOrder: 9, isActive: true },
      { id: 'p-urn-10', labTestId: 'lab-10', name: 'Crystals / Casts', code: 'CAST', dataType: 'Text', referenceRange: 'Absent', displayOrder: 10, isActive: true }
    ]
  },
  {
    id: 'lab-11',
    name: 'Thyroid Function Profile (T3, T4, TSH)',
    code: 'LAB-TFT',
    category: 'Biochemistry',
    department: 'Endocrinology & Biochemistry',
    specimen: 'Serum',
    container: 'Serum Gel (Yellow Tube)',
    specimenTube: 'Serum Gel (Yellow Tube)',
    method: 'Chemiluminescence Immunoassay (CLIA)',
    turnaroundTime: '6 Hours',
    turnaroundHours: 6,
    price: 550,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Morning sample preferred before taking thyroid medication.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-tft-1', labTestId: 'lab-11', name: 'Total Triiodothyronine (T3)', code: 'T3', dataType: 'Numeric', unit: 'ng/dL', referenceRange: '60 - 200 ng/dL', maleMin: 60, maleMax: 200, femaleMin: 60, femaleMax: 200, decimalPrecision: 1, displayOrder: 1, isActive: true },
      { id: 'p-tft-2', labTestId: 'lab-11', name: 'Total Thyroxine (T4)', code: 'T4', dataType: 'Numeric', unit: 'µg/dL', referenceRange: '4.5 - 12.0 µg/dL', maleMin: 4.5, maleMax: 12.0, femaleMin: 4.5, femaleMax: 12.0, decimalPrecision: 1, displayOrder: 2, isActive: true },
      { id: 'p-tft-3', labTestId: 'lab-11', name: 'TSH Ultra-Sensitive', code: 'TSH', dataType: 'Numeric', unit: 'µIU/mL', referenceRange: '0.35 - 4.94 µIU/mL', maleMin: 0.35, maleMax: 4.94, femaleMin: 0.35, femaleMax: 4.94, decimalPrecision: 2, displayOrder: 3, isActive: true }
    ]
  },
  {
    id: 'lab-12',
    name: 'Serum Electrolytes (Na, K, Cl)',
    code: 'LAB-LYTES',
    category: 'Biochemistry',
    department: 'Clinical Biochemistry',
    specimen: 'Serum',
    container: 'Serum Gel (Yellow Tube)',
    specimenTube: 'Serum Gel (Yellow Tube)',
    method: 'Ion Selective Electrode (ISE)',
    turnaroundTime: '2 Hours',
    turnaroundHours: 2,
    price: 450,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine',
    instructions: 'Non-hemolyzed serum sample required.',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    parameters: [
      { id: 'p-lyt-1', labTestId: 'lab-12', name: 'Serum Sodium (Na+)', code: 'NA', dataType: 'Numeric', unit: 'mEq/L', referenceRange: '136 - 145 mEq/L', maleMin: 136, maleMax: 145, femaleMin: 136, femaleMax: 145, decimalPrecision: 0, displayOrder: 1, isActive: true },
      { id: 'p-lyt-2', labTestId: 'lab-12', name: 'Serum Potassium (K+)', code: 'K', dataType: 'Numeric', unit: 'mEq/L', referenceRange: '3.5 - 5.1 mEq/L', maleMin: 3.5, maleMax: 5.1, femaleMin: 3.5, femaleMax: 5.1, decimalPrecision: 1, displayOrder: 2, isActive: true },
      { id: 'p-lyt-3', labTestId: 'lab-12', name: 'Serum Chloride (Cl-)', code: 'CL', dataType: 'Numeric', unit: 'mEq/L', referenceRange: '98 - 107 mEq/L', maleMin: 98, maleMax: 107, femaleMin: 98, femaleMax: 107, decimalPrecision: 0, displayOrder: 3, isActive: true }
    ]
  }
];

export const INITIAL_LAB_ORDERS: LabOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'LAB-ORD-90214',
    patientId: 'p-1',
    patientName: 'Rahul Sharma',
    consultationId: 'C001-001-190926',
    doctorId: 'doc-1',
    doctorName: 'Dr. Raj Valaki',
    priority: 'Routine',
    clinicalNotes: 'Suspected acute dermatitis, evaluate total IgE and eosinophils',
    status: 'IN_PROGRESS',
    orderedAt: '2026-09-24T10:15:00.000Z',
    items: [
      {
        id: 'item-101-1',
        labOrderId: 'ord-101',
        labTestId: 'lab-1',
        testName: 'Complete Blood Count (CBC) with ESR',
        code: 'LAB-CBC',
        category: 'Hematology',
        specimen: 'Whole Blood',
        price: 350,
        status: 'SAMPLE_COLLECTED'
      },
      {
        id: 'item-101-2',
        labOrderId: 'ord-101',
        labTestId: 'lab-7',
        testName: 'Serum Total IgE Allergy Level',
        code: 'LAB-IGE',
        category: 'Pathology',
        specimen: 'Serum',
        price: 850,
        status: 'PROCESSING'
      }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: 'LAB-ORD-90215',
    patientId: 'p-3',
    patientName: 'Mahesh Kumar',
    consultationId: 'C003-001-190926',
    doctorId: 'doc-1',
    doctorName: 'Dr. Raj Valaki',
    priority: 'Urgent',
    clinicalNotes: 'Pre-procedure clearance and glycemic assessment',
    status: 'ORDERED',
    orderedAt: '2026-09-25T09:30:00.000Z',
    items: [
      {
        id: 'item-102-1',
        labOrderId: 'ord-102',
        labTestId: 'lab-2',
        testName: 'Blood Sugar (Fasting Glucose)',
        code: 'LAB-BS',
        category: 'Biochemistry',
        specimen: 'Blood / Fluoride Plasma',
        price: 100,
        status: 'ORDERED'
      },
      {
        id: 'item-102-2',
        labOrderId: 'ord-102',
        labTestId: 'lab-3',
        testName: 'Liver Function Test (LFT)',
        code: 'LAB-LFT',
        category: 'Biochemistry',
        specimen: 'Serum',
        price: 600,
        status: 'ORDERED'
      }
    ]
  }
];

export const INITIAL_CONSENT_TEMPLATES: ConsentTemplate[] = [
  {
    id: 'cons-1',
    title: 'Informed Consent for Minor Surgical Excision & Biopsy',
    category: 'Surgery',
    language: 'English',
    content: 'I, [Patient Name], bearing MRD Number [MRD Number], hereby give full voluntary consent to [Doctor Name] and the clinical team at [Clinic Name] to perform [Procedure Name] on date [Date]. The risks, benefits, and alternative treatment options have been thoroughly explained to me.',
    variables: ['[Patient Name]', '[MRD Number]', '[Doctor Name]', '[Clinic Name]', '[Procedure Name]', '[Date]'],
    isActive: true,
    lastUpdated: '2026-09-01'
  },
  {
    id: 'cons-2',
    title: 'Dermatological Chemical Peel & Laser Consent',
    category: 'Dermatology',
    language: 'English',
    content: 'I, [Patient Name], confirm that I have disclosed all active allergies and topical medications. I consent to undergoing [Procedure Name] performed by [Doctor Name]. I understand temporary erythema, minor scaling, and transient hyperpigmentation may occur.',
    variables: ['[Patient Name]', '[Doctor Name]', '[Procedure Name]'],
    isActive: true,
    lastUpdated: '2026-08-20'
  },
  {
    id: 'cons-3',
    title: 'Joint Infiltration & Aspiration Consent (ગુજરાતી)',
    category: 'Orthopedics',
    language: 'Gujarati',
    content: 'હું, [Patient Name], [Doctor Name] દ્વારા કરવામાં આવતી [Procedure Name] પ્રક્રિયા માટે મારી સ્વેચ્છાએ મંજૂરી આપું છું. પ્રક્રિયાના જોખમો અને ફાયદા મને મારી માતૃભાષામાં સમજાવવામાં આવ્યા છે.',
    variables: ['[Patient Name]', '[Doctor Name]', '[Procedure Name]'],
    isActive: true,
    lastUpdated: '2026-09-05'
  }
];

export const INITIAL_EXPENSES: ClinicExpense[] = [
  {
    id: 'exp-1',
    title: 'Clinical Facility Premises Rent (September 2026)',
    category: 'Rent & Lease',
    amount: 65000,
    date: '2026-09-01',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'REC-RENT-2609',
    approvedBy: 'Superadmin (Medical Director)',
    vendor: 'Ellis Bridge Commercial Estates LLP',
    gstNumber: '24AABCE1294K1Z0',
    taxAmount: 11700,
    status: 'PAID',
    notes: 'Premises Plot 42 Ellis Bridge Medical Enclave'
  },
  {
    id: 'exp-2',
    title: 'Bio-Medical Waste Incineration & Barcode Bag Clearance',
    category: 'Bio-Medical Waste',
    amount: 4500,
    date: '2026-09-05',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'REC-BMW-4102',
    approvedBy: 'Amit Dave',
    vendor: 'Envirocare Bio Waste Solutions',
    gstNumber: '24AACCE8812D1Z9',
    taxAmount: 810,
    status: 'PAID',
    notes: 'Monthly PCB compliant incineration & manifest'
  },
  {
    id: 'exp-3',
    title: 'High-Speed Fiber Lease & HIPAA Cloud Backup Storage',
    category: 'IT & Utilities',
    amount: 3200,
    date: '2026-09-08',
    paymentMethod: 'UPI',
    receiptNumber: 'TXN-UPI-98210',
    approvedBy: 'Amit Dave',
    vendor: 'Airtel Enterprise Fiber & AWS Cloud',
    gstNumber: '24AAACA0102P1Z4',
    taxAmount: 576,
    status: 'PAID',
    notes: 'Airtel Dedicated 300Mbps + AWS HIPAA Vault'
  },
  {
    id: 'exp-4',
    title: 'Diagnostic Tubes, Needles, PPE & Phlebotomy Supplies',
    category: 'Medical Consumables',
    amount: 14800,
    date: '2026-09-12',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'INV-SURG-8819',
    approvedBy: 'Superadmin (Medical Director)',
    vendor: 'Becton Dickinson India Pvt Ltd',
    gstNumber: '24AABCB3910M1Z2',
    taxAmount: 1776,
    status: 'PAID',
    notes: 'BD Vacutainer tubes, EDTA, butterfly needles'
  },
  {
    id: 'exp-5',
    title: 'Torrent Power Electricity Utility Bill (OPD & HVAC)',
    category: 'IT & Utilities',
    amount: 12400,
    date: '2026-09-15',
    paymentMethod: 'UPI',
    receiptNumber: 'TORRENT-77182',
    approvedBy: 'Amit Dave',
    vendor: 'Torrent Power Limited',
    gstNumber: '24AAACT2941H1Z6',
    taxAmount: 2232,
    status: 'PAID',
    notes: 'Meter #TP-4491-01 Commercial Medical Tariff'
  },
  {
    id: 'exp-6',
    title: 'Emergency Pharmacy & Crash Cart Drug Stock Refill',
    category: 'Pharmaceuticals & Stock',
    amount: 22500,
    date: '2026-09-16',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'INV-ZYD-49102',
    approvedBy: 'Dr. Raj Valaki',
    vendor: 'Zydus Lifesciences Wholesale Depot',
    gstNumber: '24AAACZ4918L1Z1',
    taxAmount: 2700,
    status: 'PAID',
    notes: 'Adrenaline, Atropine, IV Saline, Paracetamol IV'
  },
  {
    id: 'exp-7',
    title: 'Fully Automated Biochemistry Reagent Packs & Controls',
    category: 'Diagnostic Reagents',
    amount: 18600,
    date: '2026-09-18',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'INV-ROCHE-782',
    approvedBy: 'Superadmin (Medical Director)',
    vendor: 'Roche Diagnostics India',
    gstNumber: '24AAACR1049J1Z7',
    taxAmount: 2232,
    status: 'PAID',
    notes: 'Cobas c311 Lipid, LFT & KFT cartridges'
  },
  {
    id: 'exp-8',
    title: 'Sonosite Ultrasound Scanner Annual AMC & Calibration',
    category: 'Maintenance & Facility',
    amount: 16000,
    date: '2026-09-19',
    paymentMethod: 'CHEQUE',
    receiptNumber: 'CHQ-778901',
    approvedBy: 'Superadmin (Medical Director)',
    vendor: 'FUJIFILM Sonosite Service Desk',
    gstNumber: '24AAACF9021K1Z3',
    taxAmount: 2880,
    status: 'PAID',
    notes: 'Annual comprehensive preventive maintenance'
  },
  {
    id: 'exp-9',
    title: 'OT Linen Laundry & Microbicidal Sanitization Service',
    category: 'Housekeeping & Sanitation',
    amount: 6800,
    date: '2026-09-20',
    paymentMethod: 'CASH',
    receiptNumber: 'VCH-CSH-1049',
    approvedBy: 'Amit Dave',
    vendor: 'PureClean Hospital Laundry Solutions',
    gstNumber: '24AABCP4412B1Z8',
    taxAmount: 816,
    status: 'PAID',
    notes: 'Daily OT scrubs, bedsheets & sterile drapes'
  },
  {
    id: 'exp-10',
    title: 'BLS & ACLS Resuscitation Nursing Workshop Fee',
    category: 'Staff Welfare & Training',
    amount: 8500,
    date: '2026-09-21',
    paymentMethod: 'UPI',
    receiptNumber: 'TXN-UPI-55219',
    approvedBy: 'Dr. Anita Soni',
    vendor: 'Indian Resuscitation Council Federation',
    gstNumber: '24AAATI9012N1Z5',
    taxAmount: 0,
    status: 'PAID',
    notes: 'Certification for 6 staff nurses and triage techs'
  },
  {
    id: 'exp-11',
    title: 'Community Cardiac Screening Standee & Awareness Camp',
    category: 'Marketing & Outreach',
    amount: 5400,
    date: '2026-09-22',
    paymentMethod: 'CARD',
    receiptNumber: 'POS-CARD-9912',
    approvedBy: 'Amit Dave',
    vendor: 'Apex Digital Media & Print Graphics',
    gstNumber: '24AABCA8921P1Z4',
    taxAmount: 648,
    status: 'PAID',
    notes: 'World Heart Day preventive check-up standees'
  },
  {
    id: 'exp-12',
    title: 'Prescription Stationery, Thermal Paper & OPD Folders',
    category: 'Administrative & Sundry',
    amount: 3850,
    date: '2026-09-23',
    paymentMethod: 'CASH',
    receiptNumber: 'PETTY-CSH-302',
    approvedBy: 'Pooja Patel',
    vendor: 'Metro Medical Stationers',
    gstNumber: '24AABCM3391K1Z2',
    taxAmount: 462,
    status: 'PAID',
    notes: 'Prescription pads with NABL logo & receipt rolls'
  },
  {
    id: 'exp-13',
    title: 'Autoclave & Sterilizer Pressure Chamber Overhaul',
    category: 'Maintenance & Facility',
    amount: 9200,
    date: '2026-09-24',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'INV-MTEK-4019',
    approvedBy: 'Superadmin (Medical Director)',
    vendor: 'Meditek Biomedical Engineers',
    gstNumber: '24AABCM9102E1Z5',
    taxAmount: 1656,
    status: 'PENDING',
    notes: 'Safety gasket replacement & vacuum leak test'
  },
  {
    id: 'exp-14',
    title: 'Sterile Surgical Gloves & Sutures Replenishment',
    category: 'Medical Consumables',
    amount: 11300,
    date: '2026-09-25',
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: 'INV-ETH-2910',
    approvedBy: 'Dr. Raj Valaki',
    vendor: 'Ethicon Johnson & Johnson',
    gstNumber: '24AAACE8821C1Z0',
    taxAmount: 1356,
    status: 'PENDING',
    notes: 'Vicryl 3-0, Prolene 4-0 sutures & powdered-free gloves'
  }
];

export const INITIAL_SECURITY_SESSIONS: SecuritySession[] = [
  { id: 'sec-1', userId: 'usr-1', userName: 'Dr. Raj Valaki', role: 'DOCTOR', deviceName: 'Apple iPad Pro (Consultation Cabin 1)', ipAddress: '192.168.10.101', location: 'Ahmedabad, Gujarat', riskScore: 8, loginTime: '19/09/2026, 08:30 AM', status: 'ACTIVE' },
  { id: 'sec-2', userId: 'usr-2', userName: 'Bhavna Desai', role: 'NURSING', deviceName: 'HP All-in-One (Triage Station)', ipAddress: '192.168.10.104', location: 'Ahmedabad, Gujarat', riskScore: 12, loginTime: '19/09/2026, 07:55 AM', status: 'ACTIVE' },
  { id: 'sec-3', userId: 'usr-3', userName: 'Suresh Shah', role: 'MEDICAL', deviceName: 'Dell Optiplex (Pharmacy POS Counter)', ipAddress: '192.168.10.108', location: 'Ahmedabad, Gujarat', riskScore: 5, loginTime: '19/09/2026, 08:02 AM', status: 'ACTIVE' },
  { id: 'sec-4', userId: 'usr-4', userName: 'Pooja Patel', role: 'RECEPTION', deviceName: 'Lenovo ThinkCentre (Front Desk 01)', ipAddress: '192.168.10.102', location: 'Ahmedabad, Gujarat', riskScore: 14, loginTime: '19/09/2026, 08:28 AM', status: 'ACTIVE' },
  { id: 'sec-5', userId: 'usr-ext', userName: 'External Node Request', role: 'RECEPTION', deviceName: 'Unknown Chrome / Linux', ipAddress: '185.220.101.5', location: 'Tor Exit Node (Frankfurt, DE)', riskScore: 94, loginTime: '19/09/2026, 11:15 AM', status: 'TERMINATED' }
];

export const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [
  { id: 'ev-1', timestamp: '19/09/2026 11:15:20 AM', eventType: 'THREAT_BLOCKED', severity: 'CRITICAL', sourceIp: '185.220.101.5', description: 'Tor Exit Node anomalous API probing against /api/patients', actionTaken: 'Connection Dropped & IP Auto-Blacklisted' },
  { id: 'ev-2', timestamp: '19/09/2026 08:30:10 AM', eventType: 'AUTH_SUCCESS', severity: 'LOW', sourceIp: '192.168.10.101', description: 'Physician login Dr. Raj Valaki via Cabin 1 iPad (MFA OK)', actionTaken: 'Session Token Issued' },
  { id: 'ev-3', timestamp: '19/09/2026 08:02:45 AM', eventType: 'AUTH_SUCCESS', severity: 'LOW', sourceIp: '192.168.10.108', description: 'Dispensary login Suresh Shah via POS Counter (MFA OK)', actionTaken: 'Session Token Issued' },
  { id: 'ev-4', timestamp: '18/09/2026 06:00:00 PM', eventType: 'KEY_ROTATION', severity: 'MEDIUM', sourceIp: '127.0.0.1', description: 'Automated 30-day cryptographic JWT signing secret rotation', actionTaken: 'HMAC-SHA256 Re-keyed' },
  { id: 'ev-5', timestamp: '18/09/2026 02:40:12 PM', eventType: 'LOCK_PREEMPTION', severity: 'MEDIUM', sourceIp: '192.168.10.105', description: 'Admin released orphaned session lock on Case C004-001', actionTaken: 'Lock Transferred to Billing Desk' }
];

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  { id: 'notif-1', title: 'Instant Appointment Confirmation', triggerEvent: 'APPOINTMENT_BOOKED', channel: 'BOTH', content: 'Dear [Patient Name], your OPD consultation with [Doctor Name] is confirmed at [Clinic Name] on [Appointment Date] at [Appointment Time]. Token: [Token]. View queue live: [Live Link]', isEnabled: true },
  { id: 'notif-2', title: '24-Hour Advance Appointment Reminder', triggerEvent: 'REMINDER_24H', channel: 'WHATSAPP', content: 'Reminder: Hello [Patient Name], you have an appointment with [Doctor Name] tomorrow at [Appointment Time]. Please carry your previous medical records and arrive 10 mins early.', isEnabled: true },
  { id: 'notif-3', title: 'Follow-Up Due Clinical Reminder', triggerEvent: 'FOLLOWUP_REMINDER', channel: 'WHATSAPP', content: 'Hello [Patient Name], your scheduled follow-up consultation with [Doctor Name] is due on [Follow-Up Date]. Reply to this message to reserve your slot.', isEnabled: true },
  { id: 'notif-4', title: 'Post-Consultation Google Review Request', triggerEvent: 'GOOGLE_REVIEW_REQUEST', channel: 'SMS', content: 'Thank you for visiting [Clinic Name]. How was your consultation with [Doctor Name]? Please take 30 seconds to rate us: https://g.page/r/medflow/review', isEnabled: true }
];

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  name: 'MedFlow Multispeciality Outpatient Clinic',
  address: 'Plot 42, Ellis Bridge Medical Enclave, Ahmedabad, Gujarat 380006',
  phone: '+91 79 4002 8800',
  email: 'contact@medflow.health',
  gstNumber: '24AAACM4982K1Z5',
  regNumber: 'CLINIC-GUJ-MED-2023-09',
  upiVpa: 'medflow.clinic@okaxis',
  merchantName: 'MedFlow Healthcare LLP',
  prescriptionLayout: {
    showHeader: true,
    showDoctorDetails: true,
    showPatientVitals: true,
    showDrugScheduleTable: true,
    showLabOrders: true,
    showSignatureBlock: true,
    topMarginMm: 35,
    bottomMarginMm: 25
  }
};

export const INITIAL_HOLIDAYS: HolidaySchedule[] = [
  { id: 'hol-1', date: '2026-10-02', name: 'Gandhi Jayanti', isRecurringYearly: true },
  { id: 'hol-2', date: '2026-10-20', name: 'Diwali Festive Holiday', isRecurringYearly: false },
  { id: 'hol-3', date: '2026-10-21', name: 'New Year (Vikram Samvat)', isRecurringYearly: false },
  { id: 'hol-4', date: '2026-12-25', name: 'Christmas Day', isRecurringYearly: true }
];

interface AdminState {
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  procedures: ProcedureMaster[];
  labTests: LabTestMaster[];
  consentTemplates: ConsentTemplate[];
  expenses: ClinicExpense[];
  sessions: SecuritySession[];
  securityEvents: SecurityEvent[];
  notifications: NotificationTemplate[];
  settings: ClinicSettings;
  holidays: HolidaySchedule[];
  isPanicLockdown: boolean;

  // Staff & HRMS
  addStaff: (member: Omit<StaffMember, 'id' | 'joinedDate'>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  toggleStaffStatus: (id: string) => void;
  logAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;

  // Procedures
  addProcedure: (proc: Omit<ProcedureMaster, 'id'>) => void;
  updateProcedure: (id: string, updates: Partial<ProcedureMaster>) => void;
  deleteProcedure: (id: string) => void;
  toggleProcedureStatus: (id: string) => void;

  // Lab Tests (Single Source of Truth Catalog)
  addLabTest: (test: Omit<LabTestMaster, 'id'>) => LabTestMaster;
  updateLabTest: (id: string, updates: Partial<LabTestMaster>) => void;
  deleteLabTest: (id: string) => void;
  toggleLabTestStatus: (id: string) => void;
  toggleLabTestOrderable: (id: string) => void;
  addLabTestParameter: (labTestId: string, param: Omit<LabTestParameter, 'id' | 'labTestId'>) => void;
  updateLabTestParameter: (labTestId: string, paramId: string, updates: Partial<LabTestParameter>) => void;
  removeLabTestParameter: (labTestId: string, paramId: string) => void;

  // Expenses
  addExpense: (expense: Omit<ClinicExpense, 'id'>) => void;
  updateExpense: (id: string, partial: Partial<ClinicExpense>) => void;
  deleteExpense: (id: string) => void;
  toggleExpenseStatus: (id: string) => void;
  seedExpenses: (force?: boolean) => void;

  // Consent & Notifications
  updateConsentTemplate: (id: string, content: string) => void;
  toggleNotificationTemplate: (id: string) => void;

  // Settings & Security
  updateSettings: (settings: Partial<ClinicSettings>) => void;
  terminateSession: (sessionId: string) => void;
  triggerPanicLockdown: (activate: boolean) => void;

  // Holidays
  addHoliday: (holiday: Omit<HolidaySchedule, 'id'>) => void;
  removeHoliday: (id: string) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      staff: INITIAL_STAFF,
      attendance: INITIAL_ATTENDANCE,
      procedures: INITIAL_PROCEDURES,
      labTests: INITIAL_LAB_TESTS,
      consentTemplates: INITIAL_CONSENT_TEMPLATES,
      expenses: INITIAL_EXPENSES,
      sessions: INITIAL_SECURITY_SESSIONS,
      securityEvents: INITIAL_SECURITY_EVENTS,
      notifications: INITIAL_NOTIFICATION_TEMPLATES,
      settings: INITIAL_CLINIC_SETTINGS,
      holidays: INITIAL_HOLIDAYS,
      isPanicLockdown: false,

      addStaff: (member) => {
        const newMember: StaffMember = {
          ...member,
          id: `st-${Date.now()}`,
          joinedDate: new Date().toISOString().split('T')[0]
        };
        set(s => ({ staff: [newMember, ...s.staff] }));
        notifyTabSync('doctor-admin');
      },

      updateStaff: (id, updates) => {
        set(s => ({ staff: s.staff.map(m => m.id === id ? { ...m, ...updates } : m) }));
        notifyTabSync('doctor-admin');
      },

      toggleStaffStatus: (id) => {
        set(s => ({
          staff: s.staff.map(m => m.id === id ? {
            ...m,
            status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          } : m)
        }));
        notifyTabSync('doctor-admin');
      },

      logAttendance: (record) => {
        const newRecord: AttendanceRecord = {
          ...record,
          id: `att-${Date.now()}`
        };
        set(s => ({ attendance: [newRecord, ...s.attendance] }));
        notifyTabSync('doctor-admin');
      },

      addProcedure: (proc) => {
        const newProc: ProcedureMaster = {
          ...proc,
          id: `proc-${Date.now()}`,
          isActive: proc.isActive !== undefined ? proc.isActive : true
        };
        set(s => ({ procedures: [newProc, ...s.procedures] }));
        notifyTabSync('doctor-admin');
      },

      updateProcedure: (id, updates) => {
        set(s => ({ procedures: s.procedures.map(p => p.id === id ? { ...p, ...updates } : p) }));
        notifyTabSync('doctor-admin');
      },

      deleteProcedure: (id) => {
        set(s => ({ procedures: s.procedures.filter(p => p.id !== id) }));
        notifyTabSync('doctor-admin');
      },

      toggleProcedureStatus: (id) => {
        set(s => ({
          procedures: s.procedures.map(p => p.id === id ? { ...p, isActive: p.isActive === false ? true : false } : p)
        }));
        notifyTabSync('doctor-admin');
      },

      addLabTest: (test) => {
        const newTest: LabTestMaster = {
          ...test,
          id: `lab-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set(s => ({ labTests: [newTest, ...s.labTests] }));
        notifyTabSync('doctor-admin');
        try {
          if (newTest.isActive && newTest.isOrderable) {
            useInvestigationCatalogStore.getState().addTest({
              id: newTest.id,
              name: newTest.name,
              category: newTest.category as any,
              price: newTest.price,
              unit: newTest.unit || 'Standard',
              normalRange: newTest.normalRange || 'Standard',
              specimenTube: newTest.container || newTest.specimenTube,
              instructions: newTest.instructions
            });
          }
        } catch {}
        return newTest;
      },

      updateLabTest: (id, updates) => {
        set(s => ({
          labTests: s.labTests.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
        }));
        notifyTabSync('doctor-admin');
      },

      deleteLabTest: (id) => {
        set(s => ({ labTests: s.labTests.filter(t => t.id !== id) }));
        notifyTabSync('doctor-admin');
        try {
          useInvestigationCatalogStore.getState().deleteTest(id);
        } catch {}
      },

      toggleLabTestStatus: (id) => {
        set(s => ({
          labTests: s.labTests.map(t => t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t)
        }));
        notifyTabSync('doctor-admin');
      },

      toggleLabTestOrderable: (id) => {
        set(s => ({
          labTests: s.labTests.map(t => t.id === id ? { ...t, isOrderable: !t.isOrderable, updatedAt: new Date().toISOString() } : t)
        }));
        notifyTabSync('doctor-admin');
      },

      addLabTestParameter: (labTestId, param) => {
        const newParam: LabTestParameter = {
          ...param,
          id: `p-${Date.now()}`,
          labTestId,
          displayOrder: param.displayOrder ?? 99,
          isActive: param.isActive ?? true
        };
        set(s => ({
          labTests: s.labTests.map(t => t.id === labTestId ? {
            ...t,
            parameters: [...(t.parameters || []), newParam],
            updatedAt: new Date().toISOString()
          } : t)
        }));
        notifyTabSync('doctor-admin');
      },

      updateLabTestParameter: (labTestId, paramId, updates) => {
        set(s => ({
          labTests: s.labTests.map(t => t.id === labTestId ? {
            ...t,
            parameters: (t.parameters || []).map(p => p.id === paramId ? { ...p, ...updates } : p),
            updatedAt: new Date().toISOString()
          } : t)
        }));
        notifyTabSync('doctor-admin');
      },

      removeLabTestParameter: (labTestId, paramId) => {
        set(s => ({
          labTests: s.labTests.map(t => t.id === labTestId ? {
            ...t,
            parameters: (t.parameters || []).filter(p => p.id !== paramId),
            updatedAt: new Date().toISOString()
          } : t)
        }));
        notifyTabSync('doctor-admin');
      },

      addExpense: (expense) => {
        const newExpense: ClinicExpense = {
          ...expense,
          id: `exp-${Date.now()}`,
          status: expense.status || 'PAID'
        };
        set(s => ({ expenses: [newExpense, ...s.expenses] }));
        notifyTabSync('doctor-admin');
      },

      updateExpense: (id, partial) => {
        set(s => ({
          expenses: s.expenses.map(e => e.id === id ? { ...e, ...partial } : e)
        }));
        notifyTabSync('doctor-admin');
      },

      deleteExpense: (id) => {
        set(s => ({
          expenses: s.expenses.filter(e => e.id !== id)
        }));
        notifyTabSync('doctor-admin');
      },

      toggleExpenseStatus: (id) => {
        set(s => ({
          expenses: s.expenses.map(e => {
            if (e.id !== id) return e;
            const nextStatus = e.status === 'PENDING' ? 'PAID' : 'PENDING';
            return { ...e, status: nextStatus };
          })
        }));
        notifyTabSync('doctor-admin');
      },

      seedExpenses: (force = false) => {
        set(s => {
          if (force || !s.expenses || s.expenses.length < INITIAL_EXPENSES.length) {
            // Merge or replace
            const existingIds = new Set((s.expenses || []).map(e => e.id));
            const missing = INITIAL_EXPENSES.filter(ie => !existingIds.has(ie.id));
            if (force) return { expenses: INITIAL_EXPENSES };
            return { expenses: [...(s.expenses || []), ...missing] };
          }
          return s;
        });
        notifyTabSync('doctor-admin');
      },

      updateConsentTemplate: (id, content) => {
        set(s => ({
          consentTemplates: s.consentTemplates.map(c => c.id === id ? {
            ...c,
            content,
            lastUpdated: new Date().toISOString().split('T')[0]
          } : c)
        }));
        notifyTabSync('doctor-admin');
      },

      toggleNotificationTemplate: (id) => {
        set(s => ({
          notifications: s.notifications.map(n => n.id === id ? {
            ...n,
            isEnabled: !n.isEnabled
          } : n)
        }));
        notifyTabSync('doctor-admin');
      },

      updateSettings: (newSettings) => {
        set(s => ({ settings: { ...s.settings, ...newSettings } }));
        notifyTabSync('doctor-admin');
      },

      terminateSession: (sessionId) => {
        const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        set(s => ({
          sessions: s.sessions.map(sess => sess.id === sessionId ? { ...sess, status: 'TERMINATED' } : sess),
          securityEvents: [
            {
              id: `ev-${Date.now()}`,
              timestamp: nowTime,
              eventType: 'THREAT_BLOCKED',
              severity: 'HIGH',
              sourceIp: s.sessions.find(x => x.id === sessionId)?.ipAddress || '0.0.0.0',
              description: `Superadmin manually terminated session ${sessionId} (${s.sessions.find(x => x.id === sessionId)?.userName})`,
              actionTaken: 'JWT Token Revoked & Socket Disconnected'
            },
            ...s.securityEvents
          ]
        }));
        notifyTabSync('doctor-admin');
      },

      triggerPanicLockdown: (activate) => {
        const nowTime = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        set(s => ({
          isPanicLockdown: activate,
          securityEvents: [
            {
              id: `ev-${Date.now()}`,
              timestamp: nowTime,
              eventType: 'ANOMALOUS_ACCESS',
              severity: 'CRITICAL',
              sourceIp: '127.0.0.1 (Admin Console)',
              description: activate
                ? 'GLOBAL PANIC LOCKDOWN INITIATED: Non-admin sessions frozen, database switched to READ-ONLY.'
                : 'GLOBAL PANIC LOCKDOWN LIFTED: Clinical terminals resumed normal operations.',
              actionTaken: activate ? 'All Active Tokens Invalidate Except Superadmin' : 'Normal Operations Restored'
            },
            ...s.securityEvents
          ]
        }));
        notifyTabSync('doctor-admin');
      },

      addHoliday: (holiday) => {
        const newHol: HolidaySchedule = {
          ...holiday,
          id: `hol-${Date.now()}`
        };
        set(s => ({ holidays: [...s.holidays, newHol] }));
        notifyTabSync('doctor-admin');
      },

      removeHoliday: (id) => {
        set(s => ({ holidays: s.holidays.filter(h => h.id !== id) }));
        notifyTabSync('doctor-admin');
      }
    }),
    {
      name: 'doctor-admin',
      storage: safeStorage,
    }
  )
);

export interface LabOrderState {
  orders: LabOrder[];
  createLabOrder: (order: Omit<LabOrder, 'id' | 'orderNumber' | 'orderedAt'>) => LabOrder;
  updateOrderStatus: (orderId: string, status: LabOrder['status']) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: LabOrderItem['status']) => void;
  getOrdersByConsultation: (consultationId: string) => LabOrder[];
  getOrdersByPatient: (patientId: string) => LabOrder[];
}

export const useLabOrderStore = create<LabOrderState>()(
  persist(
    (set, get) => ({
      orders: INITIAL_LAB_ORDERS,
      createLabOrder: (order) => {
        const orderNumber = `LAB-ORD-${Date.now().toString().slice(-5)}`;
        const newOrder: LabOrder = {
          ...order,
          id: `ord-${Date.now()}`,
          orderNumber,
          orderedAt: new Date().toISOString(),
          items: order.items.map((item, idx) => ({
            ...item,
            id: item.id || `item-${Date.now()}-${idx}`
          }))
        };
        set(s => ({ orders: [newOrder, ...s.orders] }));
        notifyTabSync('doctor-lab-orders');
        return newOrder;
      },
      updateOrderStatus: (orderId, status) => {
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? { ...o, status } : o)
        }));
        notifyTabSync('doctor-lab-orders');
      },
      updateOrderItemStatus: (orderId, itemId, status) => {
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? {
            ...o,
            items: o.items.map(i => i.id === itemId ? { ...i, status } : i)
          } : o)
        }));
        notifyTabSync('doctor-lab-orders');
      },
      getOrdersByConsultation: (consultationId) => {
        return get().orders.filter(o => o.consultationId === consultationId);
      },
      getOrdersByPatient: (patientId) => {
        return get().orders.filter(o => o.patientId === patientId);
      }
    }),
    {
      name: 'doctor-lab-orders',
      storage: safeStorage,
    }
  )
);

// Cross-Tab & Cross-Window State Synchronization
if (typeof window !== 'undefined') {
  const syncStore = (key?: string | null) => {
    try {
      if (!key || key === 'doctor-patients') (usePatientStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-queue') (useQueueStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-appointments') (useAppointmentStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-billing') (useBillingStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-consultation') (useConsultationStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-pharmacy') (usePharmacyStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-clinical') (useClinicalStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-lab') (useLabStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-lab-orders') (useLabOrderStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-inventory') (useInventoryStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-investigation-catalog') (useInvestigationCatalogStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-procedure-catalog') (useProcedureCatalogStore as any).persist?.rehydrate?.();
      if (!key || key === 'doctor-admin') (useAdminStore as any).persist?.rehydrate?.();
    } catch {}
  };

  window.addEventListener('storage', (e) => {
    if (e.key) syncStore(e.key);
  });

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('doctor_medflow_sync');
      bc.onmessage = (e) => {
        if (e.data?.tabId === CURRENT_TAB_ID) return;
        if (e.data?.key) syncStore(e.data.key);
      };
    } catch {}
  }
}

export const resetAllStoresToDefault = () => {
  if (typeof window !== 'undefined') {
    const keys = [
      'doctor-patients', 'doctor-queue', 'doctor-appointments',
      'doctor-billing', 'doctor-clinical', 'doctor-lab', 'doctor-lab-orders',
      'doctor-inventory', 'doctor-investigation-catalog',
      'doctor-procedure-catalog', 'doctor-followup', 'doctor-leaves',
      'doctor-chat', 'doctor-consultation', 'doctor-pharmacy',
      'doctor-admin'
    ];
    keys.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    window.location.reload();
  }
};

// ============================================================
// Helpers
// ============================================================

export { DOCTORS, PATIENTS, QUEUE_ENTRIES, BILLS, NOTIFICATIONS, SLOTS };



