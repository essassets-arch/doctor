import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// SSR-Safe LocalStorage adapter for Next.js Turbopack
const isClient = typeof window !== 'undefined';

// Automatic clean slate migration: ensure old mock data is wiped from browser storage
if (isClient) {
  const CLEAN_SLATE_KEY = 'medflow_clean_slate_v5_dynamic';
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
      localStorage.setItem(CLEAN_SLATE_KEY, 'true');
    }
  } catch {}
}

const dummyStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

export const safeStorage = createJSONStorage(() => (isClient ? localStorage : dummyStorage));

export const notifyTabSync = (storeKey: string) => {
  if (typeof window === 'undefined') return;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('doctor_medflow_sync');
      bc.postMessage({ key: storeKey, timestamp: Date.now() });
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
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
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

const DOCTORS: Doctor[] = [
  { id: 'doc-1', name: 'Dr. Raj Valaki', specialization: 'Dermatology', initials: 'RV', avatarColor: 'linear-gradient(135deg,#6366F1,#818CF8)', room: 'Room 1' },
  { id: 'doc-2', name: 'Dr. Anita Soni', specialization: 'General Medicine', initials: 'AS', avatarColor: 'linear-gradient(135deg,#10B981,#34D399)', room: 'Room 2' },
  { id: 'doc-3', name: 'Dr. Priya Mehta', specialization: 'Gynecology', initials: 'PM', avatarColor: 'linear-gradient(135deg,#F59E0B,#FCD34D)', room: 'Room 3' },
  { id: 'doc-4', name: 'Dr. Suresh Kumar', specialization: 'Orthopedics', initials: 'SK', avatarColor: 'linear-gradient(135deg,#EF4444,#FB7185)', room: 'Room 4' },
];

// Clean Initial State: Empty arrays for Dynamic User Creation
const PATIENTS: Patient[] = [];
const QUEUE_ENTRIES: QueueEntry[] = [];
const BILLS: BillRecord[] = [];
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
        const found = get().patients.find(p => p.id === id);
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
      })
    }
  )
);

// ============================================================
// Appointment Store
// ============================================================

const APPOINTMENTS: Appointment[] = [];

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
    }
  )
);

// ============================================================
// Doctor Store
// ============================================================

export const useDoctorStore = create<{ doctors: Doctor[] }>((set) => ({
  doctors: DOCTORS,
}));

// ============================================================
// Billing Store
// ============================================================

interface BillingState {
  bills: BillRecord[];
  addBill: (bill: Omit<BillRecord, 'id' | 'invoiceNumber'>) => void;
  updateBill: (id: string, data: Partial<BillRecord>) => void;
  getTodayBills: () => BillRecord[];
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      bills: BILLS,
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
  patientId: string;
  patientName: string;
  mrdNumber: string;
  mobile: string;
  doctorName: string;
  originalVisitDate: string;
  reason: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'PENDING' | 'CALLED' | 'RESCHEDULED' | 'NO_SHOW';
  callLogs: { date: string; caller: string; outcome: string; notes: string }[];
}

export interface ProcedurePrescriptionItem {
  id: string;
  itemName: string;
  category?: 'Syringe' | 'IV Bottle' | 'Roller Bandage' | 'Dressing / Gauze' | 'Cannula / Set' | 'Other Supply' | string;
  quantity: number;
  idCode?: string;
  unit?: string;
  instructions?: string;
}

export interface ProcedureExecutionItem {
  id: string;
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
  paymentStatus?: 'Done' | 'Pending' | 'Confirmed' | 'Partially Paid' | 'Cancelled';
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
  procedures: ProcedureExecutionItem[];
  images: {
    id: string;
    url: string;
    tag: 'BEFORE' | 'AFTER' | 'FOLLOWUP' | 'GENERAL';
    caption: string;
    annotations?: string[];
    uploadedAt: string;
  }[];
  diagnosis: {
    provisional: string;
    differential: string;
    finalDiagnosis: string;
    icd10Code?: string;
    treatmentPlan: string;
    patientAdvice: string;
    followUpDate?: string;
    followUpPurpose?: string;
    nursingInstructions?: string;
  };
  billing: {
    consultationFee: number;
    discountPercent: number;
    isFoc: boolean;
    focReason?: string;
    focPin?: string;
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
  { id: 'd-101', name: 'TAB Flucocip 400mg (Tab fluconazone 400 mg)', genericName: 'Tab fluconazone 400 mg', brandName: 'TAB Flucocip 400mg', manufacturer: 'Cipla pvt', formulation: 'Tablet', stock: 50, reorderLevel: 15, unitPrice: 42, slotNo: 'BZX 120', defaultDose: '1 tab', defaultFreq: 'Od after mill', defaultDay: '5 day', defaultTotal: '5', defaultNote: 'Not teken with milk' },
  { id: 'd-102', name: 'CREAM Monpic (Cream clotrimazole 1%)', genericName: 'Cream clotrimazole 1%', brandName: 'CREAM Monpic', manufacturer: 'Atopic darma', formulation: 'Cream', stock: 40, reorderLevel: 10, unitPrice: 85, slotNo: 'BYX 80', defaultDose: '1', defaultFreq: 'tds', defaultDay: '7', defaultTotal: '1', defaultNote: 'Before apply dry' },
  { id: 'd-1', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', brandName: 'Amoxicillin 500mg', manufacturer: 'Cipla pvt', formulation: 'Capsule', stock: 8, reorderLevel: 20, unitPrice: 12, slotNo: 'BZX 100', defaultDose: '1', defaultFreq: 'tds', defaultDay: '7', defaultTotal: '1', defaultNote: 'Before apply dry', alternatives: ['Cefixime 200mg', 'Azithromycin 500mg'] },
  { id: 'd-2', name: 'Paracetamol 650mg (Dolo)', genericName: 'Paracetamol 650mg', brandName: 'Dolo 650', manufacturer: 'Micro Labs', formulation: 'Tablet', stock: 12, reorderLevel: 50, unitPrice: 3, slotNo: 'BZX 102', defaultDose: '1 Tab', defaultFreq: '1-0-1', defaultDay: '3 day', defaultTotal: '6', defaultNote: 'After Food', alternatives: ['Ibuprofen 400mg'] },
  { id: 'd-3', name: 'Mometasone 0.1% Cream', genericName: 'Mometasone Furoate', brandName: 'Elocon 0.1% Cream', manufacturer: 'Organon', formulation: 'Ointment', stock: 45, reorderLevel: 15, unitPrice: 145, slotNo: 'BYX 103', defaultDose: '1', defaultFreq: '0-0-1', defaultDay: '14 day', defaultTotal: '1', defaultNote: 'Before bedtime' },
  { id: 'd-4', name: 'Bilastine 20mg (Bilaxten)', genericName: 'Bilastine', brandName: 'Bilaxten 20mg', manufacturer: 'Zydus', formulation: 'Tablet', stock: 35, reorderLevel: 20, unitPrice: 18, slotNo: 'BZX 104', defaultDose: '1 Tab', defaultFreq: '1-0-0', defaultDay: '10 day', defaultTotal: '10', defaultNote: 'Empty stomach (1h before food)' },
  { id: 'd-5', name: 'Levocetirizine 5mg', genericName: 'Levocetirizine Dihydrochloride', brandName: 'Levocet 5mg', manufacturer: 'Hetero', formulation: 'Tablet', stock: 80, reorderLevel: 25, unitPrice: 5, slotNo: 'BZX 105', defaultDose: '1 Tab', defaultFreq: '0-0-1', defaultDay: '5 day', defaultTotal: '5', defaultNote: 'At bedtime' },
  { id: 'd-6', name: 'Telmisartan 40mg', genericName: 'Telmisartan', brandName: 'Telma 40', manufacturer: 'Glenmark', formulation: 'Tablet', stock: 40, reorderLevel: 20, unitPrice: 9, slotNo: 'BZX 106', defaultDose: '1 Tab', defaultFreq: '1-0-0', defaultDay: '30 day', defaultTotal: '30', defaultNote: 'Morning after food' },
  { id: 'd-7', name: 'Nitrofurantoin SR 100mg', genericName: 'Nitrofurantoin', brandName: 'Niftran 100mg', manufacturer: 'Sun Pharma', formulation: 'Tablet', stock: 0, reorderLevel: 15, unitPrice: 16, slotNo: 'BZX 107', defaultDose: '1 Tab', defaultFreq: '1-0-1', defaultDay: '7 day', defaultTotal: '14', defaultNote: 'With meals', alternatives: ['Fosfomycin 3g', 'Ofloxacin 200mg'] },
  { id: 'd-8', name: 'Diacerein 50mg + Glucosamine', genericName: 'Diacerein + Glucosamine', brandName: 'Cartigen Forte', manufacturer: 'Torrent', formulation: 'Tablet', stock: 50, reorderLevel: 20, unitPrice: 22, slotNo: 'BZX 108', defaultDose: '1 Tab', defaultFreq: '1-0-1', defaultDay: '30 day', defaultTotal: '60', defaultNote: 'After food' },
  { id: 'd-9', name: 'Emollient Moisturizer Lotion', genericName: 'Cetyl Alcohol + Liquid Paraffin', brandName: 'Moiz XL Lotion', manufacturer: 'Curatio', formulation: 'Lotion', stock: 30, reorderLevel: 10, unitPrice: 280, slotNo: 'BYX 109', defaultDose: '1', defaultFreq: '1-0-1', defaultDay: '30 day', defaultTotal: '1', defaultNote: 'Apply on damp skin' },
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

export const FOLLOWUP_TASKS: FollowUpTask[] = [];

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
          id: drug.id || `d-${Date.now()}`
        };
        set(s => ({
          inventory: [newDrug, ...s.inventory.filter(i => i.id !== newDrug.id && i.name.toLowerCase() !== newDrug.name.toLowerCase())]
        }));
        notifyTabSync('doctor-inventory');
        return newDrug;
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
}

export const useFollowUpStore = create<FollowUpState>()(
  persist(
    (set) => ({
      tasks: FOLLOWUP_TASKS,
      addCallLog: (taskId, log) => set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? {
          ...t,
          status: log.outcome === 'ANSWERED' ? 'CALLED' : t.status,
          callLogs: [{ ...log, date: '2026-09-19' }, ...t.callLogs]
        } : t)
      })),
      updateStatus: (taskId, status) => set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, status } : t)
      }))
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
  addImage: (item: ConsultationSession['images'][0]) => void;
  removeImage: (id: string) => void;
  updateDiagnosis: (diagnosis: Partial<ConsultationSession['diagnosis']>) => void;
  updateBilling: (billing: Partial<ConsultationSession['billing']>) => void;
  finalizeConsultation: () => void;
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
          const isLegacyProcs = currentProcs.length <= 1 && (
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
        set(s => ({
          activeSession: s.activeSession?.caseId === session.caseId ? session : s.activeSession,
          sessions: { ...s.sessions, [session.caseId]: session }
        }));
        notifyTabSync('doctor-consultation');
      },

      initSession: (caseId, patient, doctor, initialData) => {
        const existing = get().sessions[caseId];
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
          const cleanProcedures = isLegacyProcs ? (initialData?.procedures?.length ? initialData.procedures : DEFAULT_TREATMENT_SESSIONS) : currentProcs;
          const cleaned = {
            ...existing,
            procedurePrescriptions: cleanProcedurePrescriptions,
            prescriptions: cleanPrescriptions,
            procedures: cleanProcedures
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
          procedures: initialData?.procedures && initialData.procedures.length > 0 ? initialData.procedures : DEFAULT_TREATMENT_SESSIONS,
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
        const updated = {
          ...s.activeSession,
          procedures: (s.activeSession.procedures || []).map(p =>
            p.id === id ? { ...p, ...updates } : p
          )
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
    }),
    {
      name: 'doctor-consultation',
      storage: safeStorage,
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
          formulation: drug.formulation,
          stock: initialQty,
          reorderLevel: drug.reorderLevel,
          unitPrice: drug.unitPrice,
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
}

export interface LabTestMaster {
  id: string;
  name: string;
  category: 'Biochemistry' | 'Hematology' | 'Pathology' | 'Microbiology' | 'Radiology';
  specimenTube: 'EDTA (Purple)' | 'Serum Gel (Yellow)' | 'Fluoride (Grey)' | 'Plain (Red)' | 'Urine Sterile Container' | string;
  price: number;
  turnaroundHours: number;
  parameters: Array<{
    name: string;
    unit: string;
    maleMin: number;
    maleMax: number;
    femaleMin: number;
    femaleMax: number;
    criticalLow?: number;
    criticalHigh?: number;
  }>;
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

export interface ClinicExpense {
  id: string;
  title: string;
  category: 'Rent & Lease' | 'Bio-Medical Waste' | 'IT & Utilities' | 'Medical Consumables' | 'Maintenance & Facility' | 'Marketing';
  amount: number;
  date: string;
  paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE';
  receiptNumber: string;
  approvedBy: string;
  notes?: string;
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
    linkedConsumables: [
      { drugId: 'd-3', drugName: 'Mometasone 0.1% Cream', quantity: 1 }
    ],
    preInstructions: 'None.',
    postInstructions: 'Change dressing daily or if soiled.'
  }
];

export const INITIAL_LAB_TESTS: LabTestMaster[] = [
  {
    id: 'lab-1',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Hematology',
    specimenTube: 'EDTA (Purple)',
    price: 450,
    turnaroundHours: 4,
    parameters: [
      { name: 'Hemoglobin', unit: 'g/dL', maleMin: 13.0, maleMax: 17.5, femaleMin: 12.0, femaleMax: 15.5, criticalLow: 7.0, criticalHigh: 20.0 },
      { name: 'Total WBC Count', unit: 'cells/mcL', maleMin: 4000, maleMax: 11000, femaleMin: 4000, femaleMax: 11000, criticalLow: 2000, criticalHigh: 30000 },
      { name: 'Platelet Count', unit: 'lakh/mcL', maleMin: 1.5, maleMax: 4.5, femaleMin: 1.5, femaleMax: 4.5, criticalLow: 0.5, criticalHigh: 10.0 }
    ]
  },
  {
    id: 'lab-2',
    name: 'Fasting Blood Sugar (FBS) & HbA1c',
    category: 'Biochemistry',
    specimenTube: 'Fluoride (Grey)',
    price: 600,
    turnaroundHours: 6,
    parameters: [
      { name: 'Fasting Glucose', unit: 'mg/dL', maleMin: 70, maleMax: 100, femaleMin: 70, femaleMax: 100, criticalLow: 50, criticalHigh: 400 },
      { name: 'HbA1c', unit: '%', maleMin: 4.0, maleMax: 5.6, femaleMin: 4.0, femaleMax: 5.6, criticalHigh: 12.0 }
    ]
  },
  {
    id: 'lab-3',
    name: 'Lipid Profile Screen',
    category: 'Biochemistry',
    specimenTube: 'Serum Gel (Yellow)',
    price: 850,
    turnaroundHours: 8,
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', maleMin: 125, maleMax: 200, femaleMin: 125, femaleMax: 200 },
      { name: 'Triglycerides', unit: 'mg/dL', maleMin: 50, maleMax: 150, femaleMin: 50, femaleMax: 150 },
      { name: 'HDL Cholesterol', unit: 'mg/dL', maleMin: 40, maleMax: 60, femaleMin: 50, femaleMax: 70 }
    ]
  },
  {
    id: 'lab-4',
    name: 'Serum Creatinine & eGFR',
    category: 'Biochemistry',
    specimenTube: 'Serum Gel (Yellow)',
    price: 350,
    turnaroundHours: 3,
    parameters: [
      { name: 'Serum Creatinine', unit: 'mg/dL', maleMin: 0.7, maleMax: 1.3, femaleMin: 0.6, femaleMax: 1.1, criticalHigh: 4.0 }
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
  { id: 'exp-1', title: 'Clinical Facility Rent (September 2026)', category: 'Rent & Lease', amount: 65000, date: '2026-09-01', paymentMethod: 'BANK_TRANSFER', receiptNumber: 'REC-RENT-2609', approvedBy: 'Superadmin (Medical Director)', notes: 'Premises Plot 42 Ellis Bridge' },
  { id: 'exp-2', title: 'Bio-Medical Waste Incineration Contract', category: 'Bio-Medical Waste', amount: 4500, date: '2026-09-05', paymentMethod: 'BANK_TRANSFER', receiptNumber: 'REC-BMW-4102', approvedBy: 'Amit Dave', notes: 'Envirocare Bio Waste Solutions' },
  { id: 'exp-3', title: 'High-Speed Fiber Lease & HIPAA Cloud Backup', category: 'IT & Utilities', amount: 3200, date: '2026-09-08', paymentMethod: 'UPI', receiptNumber: 'TXN-UPI-98210', approvedBy: 'Amit Dave', notes: 'Airtel Enterprise Fiber 300Mbps' },
  { id: 'exp-4', title: 'Diagnostic Tubes, Needles & PPE Consumables', category: 'Medical Consumables', amount: 14800, date: '2026-09-12', paymentMethod: 'BANK_TRANSFER', receiptNumber: 'INV-SURG-8819', approvedBy: 'Superadmin (Medical Director)', notes: 'BD Vacutainer Supplies' },
  { id: 'exp-5', title: 'Torrent Power Electricity Utility Bill', category: 'IT & Utilities', amount: 12400, date: '2026-09-15', paymentMethod: 'UPI', receiptNumber: 'TORRENT-77182', approvedBy: 'Amit Dave', notes: 'Monthly OPD Cabin & AC Meter' }
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

  // Lab Tests
  addLabTest: (test: Omit<LabTestMaster, 'id'>) => void;
  updateLabTest: (id: string, updates: Partial<LabTestMaster>) => void;

  // Expenses
  addExpense: (expense: Omit<ClinicExpense, 'id'>) => void;

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
          id: `proc-${Date.now()}`
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

      addLabTest: (test) => {
        const newTest: LabTestMaster = {
          ...test,
          id: `lab-${Date.now()}`
        };
        set(s => ({ labTests: [newTest, ...s.labTests] }));
        notifyTabSync('doctor-admin');
      },

      updateLabTest: (id, updates) => {
        set(s => ({ labTests: s.labTests.map(t => t.id === id ? { ...t, ...updates } : t) }));
        notifyTabSync('doctor-admin');
      },

      addExpense: (expense) => {
        const newExpense: ClinicExpense = {
          ...expense,
          id: `exp-${Date.now()}`
        };
        set(s => ({ expenses: [newExpense, ...s.expenses] }));
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
        if (e.data?.key) syncStore(e.data.key);
      };
    } catch {}
  }
}

export const resetAllStoresToDefault = () => {
  if (typeof window !== 'undefined') {
    const keys = [
      'doctor-patients', 'doctor-queue', 'doctor-appointments',
      'doctor-billing', 'doctor-clinical', 'doctor-lab',
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



