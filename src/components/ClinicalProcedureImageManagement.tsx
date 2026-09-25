'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  Plus,
  Search,
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Crop,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  SplitSquareVertical,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  Eye,
  ExternalLink,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Share2,
  Download,
  Send,
  Printer,
  Smartphone,
  Sliders,
  Settings,
  AlertCircle,
  AlertTriangle,
  Move,
  Info,
  User,
  Shield,
  FileCheck,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import {
  useConsultationStore,
  useUIStore,
  ProcedureExecutionItem,
  formatToDDMMYYYY,
  parseAnyDate,
  addDaysToFormattedDate,
  notifyTabSync,
  CURRENT_TAB_ID,
  getProcedurePhotos,
  getPatientPhotos,
  getSessionPhotos
} from '@/store';

// ============================================================================
// CLINICAL TYPES & INTERFACES (Full hierarchy: Patient -> Procedure -> Session -> Sub-section -> Images)
// ============================================================================

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
  sections?: any[]; // Backwards compatibility for older format
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

// Master clinical procedure catalog
export const MASTER_PROCEDURES: { name: string; category: string }[] = [
  { name: 'PRP (Platelet-Rich Plasma) Therapy', category: 'Aesthetic / Regenerative' },
  { name: 'Hair Removal (Diode / Alexandrite)', category: 'Laser Therapy' },
  { name: 'Chemical Peeling & Resurfacing', category: 'Cosmetology' },
  { name: 'Acne Laser Comedone Extraction', category: 'Clinical Dermatology' },
  { name: 'Fractional CO2 Laser Resurfacing', category: 'Laser Therapy' },
  { name: 'Microneedling Dermapen Therapy', category: 'Cosmetology' },
  { name: 'Q-Switched Nd:YAG Laser', category: 'Laser Therapy' },
  { name: 'Tattoo Removal Laser', category: 'Laser Therapy' },
  { name: 'Carbon Laser Peel', category: 'Cosmetology' },
  { name: 'Hydrafacial & Deep Cleanse', category: 'Cosmetology' },
  { name: 'Mesotherapy (Scalp / Skin)', category: 'Trichology' },
  { name: 'Electrocautery / Mole Excision', category: 'Minor OT' },
  { name: 'Botulinum Toxin / Fillers', category: 'Aesthetic Dermatology' },
  { name: 'Clinical Dermatology Consultation', category: 'Clinical Dermatology' }
];

export const PROCEDURE_CATEGORIES = [
  'Laser Therapy',
  'Aesthetic / Regenerative',
  'Cosmetology',
  'Clinical Dermatology',
  'Trichology',
  'Minor OT',
  'Aesthetic Dermatology'
];

export const CLINICAL_MARKERS = [
  { id: 'erythema', label: 'Erythema Margin', color: '#EF4444' },
  { id: 'induration', label: 'Active Induration', color: '#F97316' },
  { id: 'papule', label: 'Follicular Papule', color: '#EAB308' },
  { id: 'pigment', label: 'Pigmentation Border', color: '#8B5CF6' },
  { id: 'scar', label: 'Scar / Atrophy', color: '#06B6D4' }
];

export interface DeviceIntegrationConfig {
  id: string;
  name: string;
  type: 'DERMASCOPE' | 'FACE_SCANNER';
  enabled: boolean;
  status: 'ONLINE' | 'OFFLINE';
  statusMessage: string;
}

const DEFAULT_DEVICES: DeviceIntegrationConfig[] = [
  {
    id: 'dev-dermascope-1',
    name: 'Digital Dermatoscope (USB/Wi-Fi)',
    type: 'DERMASCOPE',
    enabled: true,
    status: 'OFFLINE',
    statusMessage: 'No compatible digital dermatoscope detected on USB/Wi-Fi. Connect hardware or use file upload.'
  },
  {
    id: 'dev-facescan-1',
    name: '3D Facial Topography Scanner',
    type: 'FACE_SCANNER',
    enabled: true,
    status: 'OFFLINE',
    statusMessage: '3D Face Scanner driver daemon offline on localhost:8089. Connect hardware or use file upload.'
  }
];

function getTodayDateString(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

function getTimeString(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseDDMMYYYY(str: string): number {
  if (!str) return 0;
  const parts = str.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d).getTime();
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  patient?: any;
  caseId?: string;
}

export default function ClinicalProcedureImageManagement({ patient, caseId }: Props) {
  const activeCaseId = caseId || 'C005-001-23092026';
  const patientId = patient?.id || 'P-00124';
  const consultationStore = useConsultationStore();
  const { currentUser } = useUIStore();
  const isAdmin = currentUser?.role?.toLowerCase().includes('admin') || true;

  // Procedures State derived directly from canonical consultation store
  const storeSession = consultationStore.sessions[activeCaseId] || (consultationStore.activeSession?.caseId === activeCaseId ? consultationStore.activeSession : null);
  const procedures = useMemo<ClinicalProcedure[]>(() => storeSession?.clinicalProcedures || [], [storeSession?.clinicalProcedures]);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Left Sidebar State: List/Box View, Search, Sorting
  const [procedureViewMode, setProcedureViewMode] = useState<'list' | 'box'>('box');
  const [procedureSearch, setProcedureSearch] = useState('');
  const [procedureSort, setProcedureSort] = useState<'az' | 'za' | 'date-desc' | 'date-asc'>('az');

  // Main Gallery Sorting: Most recent first (default) vs Oldest first
  const [gallerySortOrder, setGallerySortOrder] = useState<'recent-first' | 'oldest-first'>('recent-first');

  // Compare Selected Images
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  // Modals State
  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [addImageDestination, setAddImageDestination] = useState<{
    procedureId: string;
    sessionId: string;
    subSectionId?: string;
    type: 'BEFORE' | 'AFTER' | 'OTHER';
  } | null>(null);

  // Single Photo Fullscreen Viewer
  const [fullscreenImage, setFullscreenImage] = useState<ClinicalImage | null>(null);

  // Photo Editor Modal
  const [editingImage, setEditingImage] = useState<ClinicalImage | null>(null);

  // Compare Modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Send / Share Image Modal
  const [sharingImage, setSharingImage] = useState<ClinicalImage | null>(null);

  // Admin Edit Image Date/Time & Observation Modal
  const [adminEditingImage, setAdminEditingImage] = useState<ClinicalImage | null>(null);

  // PDF Document Viewer Modal
  const [viewingPdfDoc, setViewingPdfDoc] = useState<ClinicalImage | null>(null);

  // Admin Device Settings Modal
  const [showDeviceSettingsModal, setShowDeviceSettingsModal] = useState(false);
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceIntegrationConfig[]>(DEFAULT_DEVICES);

  // Context Menu for Session Panel
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sessionId: string;
    procedureId: string;
  } | null>(null);

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pending images when Doctor picks image first, then procedure (Path B)
  const [pendingStandaloneImage, setPendingStandaloneImage] = useState<ClinicalImage | null>(null);

  // Ref to guard against rapid double-clicks creating duplicate sub-sections
  const lastSubSectionClickRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // Normalize & Backwards Compatibility Helper
  // --------------------------------------------------------------------------
  const normalizeProcedures = (rawProcs: any[]): ClinicalProcedure[] => {
    if (!Array.isArray(rawProcs)) return [];
    return rawProcs.map(proc => {
      const pId = proc.id || `proc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const sessions: ClinicalSession[] = (proc.sessions || []).map((sess: any, sIdx: number) => {
        const sId = sess.id || `sess-${pId}-${sIdx + 1}`;
        // Extract before/after/subsections from either direct keys or sections[0]
        let beforeList: ClinicalImage[] = sess.beforeImages || [];
        let afterList: ClinicalImage[] = sess.afterImages || [];
        let subSecList: ClinicalSubSection[] = sess.subSections || [];

        if (sess.sections && Array.isArray(sess.sections)) {
          sess.sections.forEach((sec: any) => {
            if (sec.beforeImages && sec.beforeImages.length > 0) {
              sec.beforeImages.forEach((img: any) => {
                if (!beforeList.some(b => b.id === img.id)) beforeList.push(img);
              });
            }
            if (sec.afterImages && sec.afterImages.length > 0) {
              sec.afterImages.forEach((img: any) => {
                if (!afterList.some(a => a.id === img.id)) afterList.push(img);
              });
            }
            if (sec.subSections && sec.subSections.length > 0) {
              sec.subSections.forEach((sub: any) => {
                if (!subSecList.some(sb => sb.id === sub.id)) subSecList.push(sub);
              });
            }
          });
        }

        return {
          id: sId,
          procedureId: pId,
          sessionNumber: sess.sessionNumber || (sIdx + 1),
          date: sess.date || proc.createdAt || getTodayDateString(),
          therapist: sess.therapist || proc.therapist || 'Dr Valaki',
          bodyPart: sess.bodyPart || proc.bodyPart || 'CLINICAL SITE',
          doctorObservation: sess.doctorObservation || '',
          efficacy: sess.efficacy || '',
          status: sess.status || 'Done',
          beforeImages: beforeList,
          afterImages: afterList,
          subSections: subSecList,
          sections: sess.sections || []
        };
      });

      return {
        id: pId,
        patientId: proc.patientId || patientId,
        name: proc.name || 'Clinical Procedure',
        category: proc.category || 'Clinical Dermatology',
        createdAt: proc.createdAt || getTodayDateString(),
        therapist: proc.therapist || 'Dr Valaki',
        bodyPart: proc.bodyPart || 'CLINICAL SITE',
        doctorObservation: proc.doctorObservation || '',
        sessions
      };
    });
  };

  // --------------------------------------------------------------------------
  // Dual Persistence: Backend REST API + LocalStorage via canonical store
  // --------------------------------------------------------------------------
  const loadProceduresData = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await consultationStore.loadClinicalProcedures(activeCaseId, patientId);
      if (loaded.length > 0 && !selectedProcedureId) {
        setSelectedProcedureId(loaded[0].id);
      }
    } catch (err) {
      console.warn('Backend fetch error, relying on local state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCaseId, selectedProcedureId, patientId, consultationStore]);

  useEffect(() => {
    loadProceduresData();
  }, [activeCaseId]);

  useEffect(() => {
    if (procedures.length > 0) {
      if (!selectedProcedureId || !procedures.some(p => p.id === selectedProcedureId)) {
        setSelectedProcedureId(procedures[0].id);
      }
    }
  }, [procedures, selectedProcedureId]);

  // Synchronize state changes to Backend and LocalStorage via canonical store
  const persistProcedures = useCallback(async (updated: ClinicalProcedure[], actionMsg?: string) => {
    await consultationStore.syncClinicalProcedures(activeCaseId, updated);
    if (actionMsg) showToast(actionMsg);
  }, [activeCaseId, consultationStore]);

  // Cross-Tab BroadcastChannel & Storage Event Listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('doctor_medflow_sync');
      bc.onmessage = (event) => {
        if (event.data?.tabId === CURRENT_TAB_ID) return;
        if (event.data?.key === 'doctor-consultation' || event.data?.key === 'treatment-protocol') {
          loadProceduresData();
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `medflow_proc_${activeCaseId}` || e.key === 'doctor-consultation') {
        loadProceduresData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      try { bc?.close(); } catch {}
      window.removeEventListener('storage', handleStorage);
    };
  }, [activeCaseId, loadProceduresData]);

  // Close context menu on outside click or ESC
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setFullscreenImage(null);
        setCompareModalOpen(false);
        setEditingImage(null);
        setShowAddProcedureModal(false);
        setShowAddImageModal(false);
        setSharingImage(null);
        setAdminEditingImage(null);
        setViewingPdfDoc(null);
        setShowDeviceSettingsModal(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --------------------------------------------------------------------------
  // Active Selected Procedure & Sorted Lists
  // --------------------------------------------------------------------------
  const activeProcedure = useMemo(() => {
    if (!procedures || procedures.length === 0) return null;
    const found = procedures.find(p => p.id === selectedProcedureId);
    return found || procedures[0];
  }, [procedures, selectedProcedureId]);

  // Filtered & Sorted Procedures for Left Sidebar
  const displayedProcedures = useMemo(() => {
    let list = [...procedures];
    if (procedureSearch.trim()) {
      const q = procedureSearch.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (procedureSort === 'az') return a.name.localeCompare(b.name);
      if (procedureSort === 'za') return b.name.localeCompare(a.name);
      if (procedureSort === 'date-desc') return parseDDMMYYYY(b.createdAt) - parseDDMMYYYY(a.createdAt);
      if (procedureSort === 'date-asc') return parseDDMMYYYY(a.createdAt) - parseDDMMYYYY(b.createdAt);
      return 0;
    });

    return list;
  }, [procedures, procedureSearch, procedureSort]);

  // Sorted Sessions for Active Procedure (Requirement 5: Most recent first by default)
  const displayedSessions = useMemo(() => {
    if (!activeProcedure || !activeProcedure.sessions) return [];
    const list = [...activeProcedure.sessions];
    list.sort((a, b) => {
      const dateA = parseDDMMYYYY(a.date);
      const dateB = parseDDMMYYYY(b.date);
      if (gallerySortOrder === 'recent-first') {
        if (dateB !== dateA) return dateB - dateA;
        return b.sessionNumber - a.sessionNumber;
      } else {
        if (dateA !== dateB) return dateA - dateB;
        return a.sessionNumber - b.sessionNumber;
      }
    });
    return list;
  }, [activeProcedure, gallerySortOrder]);

  // Compute all photos in active procedure (for non-looping Prev/Next navigation)
  const allProcedurePhotos = useMemo(() => {
    if (!activeProcedure) return [];
    const list: ClinicalImage[] = [];
    displayedSessions.forEach(sess => {
      sess.beforeImages.forEach(img => list.push(img));
      sess.afterImages.forEach(img => list.push(img));
      sess.subSections.forEach(sub => {
        sub.images.forEach(img => list.push(img));
      });
    });
    return list;
  }, [activeProcedure, displayedSessions]);

  // Eligible photos for comparison (only photos from active procedure, across all sessions & sub-sections, strictly excluding PDFs)
  const eligibleComparePhotos = useMemo(() => {
    if (!activeProcedure) return [];
    const list: ClinicalImage[] = [];
    (displayedSessions || []).forEach(sess => {
      (sess.beforeImages || []).forEach(img => {
        if (img && img.fileType !== 'application/pdf' && !img.fileName?.toLowerCase().endsWith('.pdf')) {
          list.push(img);
        }
      });
      (sess.afterImages || []).forEach(img => {
        if (img && img.fileType !== 'application/pdf' && !img.fileName?.toLowerCase().endsWith('.pdf')) {
          list.push(img);
        }
      });
      (sess.subSections || []).forEach(sub => {
        (sub.images || []).forEach(img => {
          if (img && img.fileType !== 'application/pdf' && !img.fileName?.toLowerCase().endsWith('.pdf')) {
            list.push(img);
          }
        });
      });
    });
    return list;
  }, [activeProcedure, displayedSessions]);

  // Exact resolved photos that are currently selected for comparison
  const resolvedSelectedPhotos = useMemo(() => {
    return eligibleComparePhotos.filter(img => selectedImageIds.includes(img.id));
  }, [eligibleComparePhotos, selectedImageIds]);

  // Clear incompatible selections when changing patients or procedures
  useEffect(() => {
    setSelectedImageIds([]);
  }, [selectedProcedureId, patientId]);

  // Canonical photo count helper (deduplicating sub-sections exactly once)
  const countPhotosInProcedure = (p: ClinicalProcedure) => {
    return getProcedurePhotos(p).length;
  };

  // --------------------------------------------------------------------------
  // REQUIREMENT 4: Add / Link Procedure
  // --------------------------------------------------------------------------
  const handleSaveProcedure = (
    procedureName: string,
    category: string,
    procedureDate: string,
    bodyPart: string,
    therapist: string
  ) => {
    const trimmed = procedureName.trim();
    if (!trimmed) {
      showToast('Please enter a clinical procedure name');
      return;
    }

    // Check if matching procedure already exists for this patient
    const existing = procedures.find(p => p.name.toLowerCase().trim() === trimmed.toLowerCase().trim());
    if (existing) {
      // Reuse existing procedure! Add next session instead of duplicate folder
      const nextNum = (existing.sessions?.length || 0) + 1;
      const newSession: ClinicalSession = {
        id: `sess-${existing.id}-${nextNum}-${Date.now()}`,
        procedureId: existing.id,
        sessionNumber: nextNum,
        date: procedureDate || getTodayDateString(),
        therapist: therapist || existing.therapist,
        bodyPart: bodyPart || existing.bodyPart,
        doctorObservation: `Session ${nextNum} initiated.`,
        beforeImages: pendingStandaloneImage ? [pendingStandaloneImage] : [],
        afterImages: [],
        subSections: []
      };

      const updated = procedures.map(p =>
        p.id === existing.id ? { ...p, sessions: [...p.sessions, newSession] } : p
      );

      persistProcedures(updated, `✓ Linked to existing "${existing.name}" (Session ${nextNum} added)`);
      setSelectedProcedureId(existing.id);
      setPendingStandaloneImage(null);
      setShowAddProcedureModal(false);
      return;
    }

    // Create New Procedure
    const newProcId = `proc-${Date.now()}`;
    const newSessionId = `sess-${newProcId}-1`;
    const newSession: ClinicalSession = {
      id: newSessionId,
      procedureId: newProcId,
      sessionNumber: 1,
      date: procedureDate || getTodayDateString(),
      therapist: therapist || 'Dr Valaki',
      bodyPart: bodyPart || 'FACE',
      doctorObservation: `Clinical protocol initiated on ${procedureDate || getTodayDateString()}.`,
      beforeImages: pendingStandaloneImage ? [pendingStandaloneImage] : [],
      afterImages: [],
      subSections: []
    };

    const newProc: ClinicalProcedure = {
      id: newProcId,
      patientId,
      name: trimmed,
      category: category || 'Clinical Dermatology',
      createdAt: procedureDate || getTodayDateString(),
      therapist: therapist || 'Dr Valaki',
      bodyPart: bodyPart || 'FACE',
      sessions: [newSession]
    };

    const updated = [newProc, ...procedures];
    persistProcedures(updated, `✓ Procedure "${trimmed}" created and selected!`);
    setSelectedProcedureId(newProcId);
    setPendingStandaloneImage(null);
    setShowAddProcedureModal(false);

    // Sync to Procedure Tab (Tab 4) store with matching stable IDs
    consultationStore.addProcedure({
      id: newSessionId,
      procedureId: newProcId,
      procedureName: trimmed,
      scheduledDate: procedureDate || getTodayDateString(),
      sessionNumber: 1,
      totalSessions: 4,
      status: 'Done',
      price: 2000,
      therapist: therapist || 'Dr Valaki',
      bodyPart: bodyPart || 'FACE',
      remark: `Session 1 recorded in Images Tab`
    });
  };

  const handleDeleteProcedure = (procId: string, procName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete clinical procedure "${procName}" and all associated sessions/photos?`)) return;
    const updated = procedures.filter(p => p.id !== procId);
    persistProcedures(updated, `Procedure "${procName}" removed.`);
    if (selectedProcedureId === procId) {
      setSelectedProcedureId(updated[0]?.id || '');
    }
  };

  // --------------------------------------------------------------------------
  // REQUIREMENT 6: Add Session to Selected Procedure (via Centralized Store Action)
  // --------------------------------------------------------------------------
  const handleAddSession = async (targetProcId?: string) => {
    const procId = targetProcId || activeProcedure?.id;
    if (!procId) return;

    const targetProc = procedures.find(p => p.id === procId);
    if (!targetProc) return;

    try {
      const nextSessionNum = (targetProc.sessions?.length || 0) + 1;
      const sessionDate = getTodayDateString();

      await consultationStore.createClinicalSession(activeCaseId, targetProc.id, {
        sessionNumber: nextSessionNum,
        date: sessionDate,
        therapist: targetProc.therapist || 'Dr Valaki',
        bodyPart: targetProc.bodyPart || 'CLINICAL SITE',
        status: 'Done'
      });

      showToast(`✓ Session ${nextSessionNum} added to ${targetProc.name}! Synced across Procedure & Images tabs.`);
    } catch (err: any) {
      console.error('Failed to add session:', err);
      showToast(`Error adding session: ${err?.message || 'Server error'}`);
    }
  };

  // --------------------------------------------------------------------------
  // REQUIREMENT 7: Sub-sections Management (via Centralized Store Action)
  // --------------------------------------------------------------------------
  const handleCreateSubSection = async (sessionId: string, customName?: string) => {
    const now = Date.now();
    // Guard against rapid duplicate double-clicks (600ms debounce)
    if (now - lastSubSectionClickRef.current < 600) return;
    lastSubSectionClickRef.current = now;

    if (!activeProcedure) return;
    const targetSession = activeProcedure.sessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    const nextSubNum = (targetSession.subSections?.length || 0) + 1;
    const defaultName = `Session ${targetSession.sessionNumber} — Sub-section ${nextSubNum}`;
    const name = customName?.trim() || defaultName;

    try {
      await consultationStore.createSubSection(activeCaseId, activeProcedure.id, sessionId, name);
      showToast(`✓ Created "${name}" in Session ${targetSession.sessionNumber}!`);
    } catch (err: any) {
      console.error('Failed to create subsection:', err);
      showToast(`Error creating sub-section: ${err?.message || 'Server error'}`);
    }
  };

  // --------------------------------------------------------------------------
  // Image Actions: Save Image to Session / Sub-section
  // --------------------------------------------------------------------------
  const handleSaveImageToDestination = (image: ClinicalImage, destination: {
    procedureId: string;
    procedureName?: string;
    sessionId: string;
    sessionNumber?: number | string;
    subSectionId?: string;
    type: 'BEFORE' | 'AFTER' | 'OTHER';
  }) => {
    // 1. Find or create procedure
    const reqProcName = destination.procedureName?.trim();
    let targetProcIndex = procedures.findIndex(p =>
      p.id === destination.procedureId || (reqProcName && p.name.toLowerCase() === reqProcName.toLowerCase())
    );

    let updatedProcedures = [...procedures];
    let activeProc: ClinicalProcedure;

    if (targetProcIndex >= 0) {
      activeProc = { ...updatedProcedures[targetProcIndex] };
    } else {
      // Create new procedure record
      const newProcId = destination.procedureId && destination.procedureId !== 'NEW'
        ? destination.procedureId
        : `proc-${Date.now()}`;
      const procName = reqProcName || 'Clinical Procedure';
      const matchedMaster = MASTER_PROCEDURES.find(m => m.name.toLowerCase() === procName.toLowerCase());

      activeProc = {
        id: newProcId,
        patientId,
        name: procName,
        category: matchedMaster?.category || 'Clinical Dermatology',
        createdAt: image.date || getTodayDateString(),
        therapist: 'Dr Valaki',
        bodyPart: 'FACE',
        sessions: []
      };
      targetProcIndex = updatedProcedures.length;
      updatedProcedures.push(activeProc);
    }

    // 2. Find or create session
    let targetSessIndex = activeProc.sessions.findIndex(s =>
      s.id === destination.sessionId || (destination.sessionNumber && s.sessionNumber === Number(destination.sessionNumber))
    );

    let activeSess: ClinicalSession;
    if (targetSessIndex >= 0) {
      activeSess = { ...activeProc.sessions[targetSessIndex] };
    } else {
      const sessNum = typeof destination.sessionNumber === 'number'
        ? destination.sessionNumber
        : (parseInt(String(destination.sessionNumber || destination.sessionId).replace(/\D/g, '')) || (activeProc.sessions.length + 1) || 1);
      const newSessId = destination.sessionId && !destination.sessionId.startsWith('sess-')
        ? `sess-${activeProc.id}-${sessNum}-${Date.now()}`
        : (destination.sessionId || `sess-${activeProc.id}-${sessNum}-${Date.now()}`);

      activeSess = {
        id: newSessId,
        procedureId: activeProc.id,
        sessionNumber: sessNum,
        date: image.date || getTodayDateString(),
        therapist: activeProc.therapist || 'Dr Valaki',
        bodyPart: activeProc.bodyPart || 'CLINICAL SITE',
        doctorObservation: `Session ${sessNum} record.`,
        status: 'Done',
        beforeImages: [],
        afterImages: [],
        subSections: []
      };
      targetSessIndex = activeProc.sessions.length;
      activeProc.sessions = [...activeProc.sessions, activeSess];
    }

    // 3. Attach image with correct IDs
    const finalImage: ClinicalImage = {
      ...image,
      procedureId: activeProc.id,
      sessionId: activeSess.id
    };

    if (destination.subSectionId) {
      activeSess.subSections = (activeSess.subSections || []).map(sub => {
        if (sub.id !== destination.subSectionId) return sub;
        return { ...sub, images: [finalImage, ...sub.images] };
      });
    } else if (destination.type === 'BEFORE') {
      activeSess.beforeImages = [finalImage, ...activeSess.beforeImages];
    } else {
      activeSess.afterImages = [finalImage, ...activeSess.afterImages];
    }

    // Update activeProc's sessions
    const updatedSessions = [...activeProc.sessions];
    updatedSessions[targetSessIndex] = activeSess;
    activeProc.sessions = updatedSessions;

    // Update updatedProcedures
    updatedProcedures[targetProcIndex] = activeProc;

    persistProcedures(
      updatedProcedures,
      `✓ Saved ${destination.type} photo for "${activeProc.name}" - Session ${activeSess.sessionNumber}!`
    );
    setSelectedProcedureId(activeProc.id);
    setShowAddImageModal(false);

    // Sync to Procedure Tab (Tab 4) store with matching stable IDs
    const existingProcItem = (consultationStore.sessions[activeCaseId]?.procedures || []).find(p => p.id === activeSess.id);
    if (!existingProcItem) {
      consultationStore.addProcedure({
        id: activeSess.id,
        procedureId: activeProc.id,
        procedureName: activeProc.name,
        scheduledDate: image.date || getTodayDateString(),
        sessionNumber: activeSess.sessionNumber,
        totalSessions: Math.max(activeSess.sessionNumber, 4),
        status: 'Done',
        price: 2000,
        therapist: activeProc.therapist || 'Dr Valaki',
        bodyPart: activeProc.bodyPart || 'CLINICAL SITE',
        remark: `Session ${activeSess.sessionNumber} recorded with clinical photography`
      });
    }
  };

  // Delete Image
  const handleDeleteImage = (imgId: string) => {
    if (!window.confirm('Are you sure you want to delete this clinical photo?')) return;
    const updated = procedures.map(p => ({
      ...p,
      sessions: p.sessions.map(s => ({
        ...s,
        beforeImages: s.beforeImages.filter(i => i.id !== imgId),
        afterImages: s.afterImages.filter(i => i.id !== imgId),
        subSections: s.subSections.map(sub => ({
          ...sub,
          images: sub.images.filter(i => i.id !== imgId)
        }))
      }))
    }));

    persistProcedures(updated, 'Photo removed.');
    setSelectedImageIds(prev => prev.filter(id => id !== imgId));
    if (fullscreenImage?.id === imgId) setFullscreenImage(null);
  };

  // Save Edited Photo
  const handleSaveEditedImage = (saved: ClinicalImage) => {
    const updated = procedures.map(p => ({
      ...p,
      sessions: p.sessions.map(s => ({
        ...s,
        beforeImages: s.beforeImages.map(i => (i.id === saved.id ? saved : i)),
        afterImages: s.afterImages.map(i => (i.id === saved.id ? saved : i)),
        subSections: s.subSections.map(sub => ({
          ...sub,
          images: sub.images.map(i => (i.id === saved.id ? saved : i))
        }))
      }))
    }));

    persistProcedures(updated, '✓ Photo edits & annotations saved');
    setEditingImage(null);
    if (fullscreenImage?.id === saved.id) setFullscreenImage(saved);
  };

  // Admin Update Metadata (Capture Date/Time & Observation)
  const handleAdminUpdateMetadata = (imgId: string, newDate: string, newTime: string, newObservation: string) => {
    const updated = procedures.map(p => ({
      ...p,
      sessions: p.sessions.map(s => ({
        ...s,
        beforeImages: s.beforeImages.map(i => (i.id === imgId ? { ...i, date: newDate, time: newTime, doctorObservation: newObservation } : i)),
        afterImages: s.afterImages.map(i => (i.id === imgId ? { ...i, date: newDate, time: newTime, doctorObservation: newObservation } : i)),
        subSections: s.subSections.map(sub => ({
          ...sub,
          images: sub.images.map(i => (i.id === imgId ? { ...i, date: newDate, time: newTime, doctorObservation: newObservation } : i))
        }))
      }))
    }));

    persistProcedures(updated, '✓ Photo metadata updated');
    setAdminEditingImage(null);
  };

  // Toggle selection for comparison
  const handleToggleSelectCompare = (imgId: string) => {
    setSelectedImageIds(prev =>
      prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]
    );
  };

  // Clear selections
  const handleClearCompareSelections = () => {
    setSelectedImageIds([]);
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>

      {/* ==================================================================== */}
      {/* 1. PATIENT IDENTIFICATION HEADER STRIP (Requirement 3)               */}
      {/* ==================================================================== */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '12px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: '#036d92',
            color: '#FFFFFF',
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 14
          }}>
            <User size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                {patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}` : 'Ramesh Patel'}
              </span>
              <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                UHID: {patient?.id || patientId}
              </span>
              <span style={{ background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                {patient?.age || '34'} Y / {patient?.gender || 'Male'}
              </span>
              {patient?.bloodGroup && (
                <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                  Blood: {patient.bloodGroup}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
              Case ID: <strong>{activeCaseId}</strong> • Phone: {patient?.phone || '+91 98251 00099'} • Branch: {currentUser?.branch || 'Surat Central Main Branch'}
            </div>
          </div>
        </div>

        {/* Quick Summary Pill & Device Config Access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 20,
            padding: '5px 12px',
            fontSize: 12,
            fontWeight: 800,
            color: '#0F172A'
          }}>
            <Camera size={14} color="#036d92" />
            <span>{procedures.length} Procedures • {getPatientPhotos(procedures).length} Photos</span>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowDeviceSettingsModal(true)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
              title="Configure Dermascope & Face Scanner hardware integrations"
            >
              <Settings size={13} />
              <span>Devices</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TWO-COLUMN WORKSPACE: LEFT PROCEDURES | RIGHT SESSIONS & GALLERY  */}
      {/* ==================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '330px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: PROCEDURES LIST & SELECTION (Requirements 3, 4, 5)     */}
        {/* ------------------------------------------------------------------ */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Top Add Procedure Button */}
          <button
            type="button"
            onClick={() => setShowAddProcedureModal(true)}
            style={{
              background: '#036d92',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)',
              transition: 'background 0.15s ease'
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span>+ Add Procedure</span>
          </button>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              value={procedureSearch}
              onChange={e => setProcedureSearch(e.target.value)}
              placeholder="Search patient procedures..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 30px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                background: '#FFFFFF',
                color: '#0F172A',
                outline: 'none'
              }}
            />
            {procedureSearch && (
              <button
                type="button"
                onClick={() => setProcedureSearch('')}
                style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Controls Bar: Sorting & View Mode Toggle (Requirement 5) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            {/* Sorting Dropdown (Default A-Z) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              <select
                value={procedureSort}
                onChange={e => setProcedureSort(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#334155',
                  background: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <option value="az">Sort: A–Z (Ascending)</option>
                <option value="za">Sort: Z–A (Descending)</option>
                <option value="date-desc">Sort: Date (Newest first)</option>
                <option value="date-asc">Sort: Date (Oldest first)</option>
              </select>
            </div>

            {/* List / Box View Toggle */}
            <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setProcedureViewMode('list')}
                style={{
                  background: procedureViewMode === 'list' ? '#036d92' : 'transparent',
                  color: procedureViewMode === 'list' ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="List View (No. | Procedure Name | Date | Actions)"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => setProcedureViewMode('box')}
                style={{
                  background: procedureViewMode === 'box' ? '#036d92' : 'transparent',
                  color: procedureViewMode === 'box' ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Box View (Selectable Cards)"
              >
                <LayoutGrid size={13} />
              </button>
            </div>
          </div>

          {/* Procedures List Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '650px', overflowY: 'auto' }}>
            {/* Empty State: No procedures */}
            {displayedProcedures.length === 0 && (
              <div style={{
                padding: '30px 16px',
                textAlign: 'center',
                background: '#FFFFFF',
                borderRadius: 8,
                border: '1.5px dashed #CBD5E1'
              }}>
                <Sparkles size={24} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>
                  No Procedures Found
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, marginBottom: 12 }}>
                  {procedureSearch ? 'No match for your search' : 'No procedures recorded yet for this patient.'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProcedureModal(true)}
                  style={{
                    background: '#036d92',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + Add Procedure
                </button>
              </div>
            )}

            {/* LIST VIEW (Requirement 5: No. | Procedure Name | Date | Actions) */}
            {procedureViewMode === 'list' && displayedProcedures.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, background: '#FFFFFF', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#E2E8F0', color: '#334155', fontWeight: 800, textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', width: 28 }}>No.</th>
                    <th style={{ padding: '6px 8px' }}>Procedure Name</th>
                    <th style={{ padding: '6px 8px', width: 70 }}>Date</th>
                    <th style={{ padding: '6px 6px', width: 36, textAlign: 'center' }}>Act</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProcedures.map((proc, idx) => {
                    const isSelected = activeProcedure?.id === proc.id;
                    const photoCount = countPhotosInProcedure(proc);
                    return (
                      <tr
                        key={proc.id}
                        onClick={() => setSelectedProcedureId(proc.id)}
                        style={{
                          background: isSelected ? '#E0F2FE' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderLeft: isSelected ? '3px solid #036d92' : '3px solid transparent',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? '#0369A1' : '#0F172A'
                        }}
                      >
                        <td style={{ padding: '8px' }}>{idx + 1}</td>
                        <td style={{ padding: '8px' }}>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{proc.name}</div>
                          <div style={{ fontSize: 10, color: '#64748B' }}>
                            {proc.sessions.length} Sess • {photoCount} Photos
                          </div>
                        </td>
                        <td style={{ padding: '8px', fontSize: 10.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                          {proc.createdAt}
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProcedure(proc.id, proc.name, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: 2
                            }}
                            title="Delete procedure"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* BOX VIEW (Requirement 5: Selectable cards with name, date, photo count) */}
            {procedureViewMode === 'box' && displayedProcedures.map((proc, idx) => {
              const isSelected = activeProcedure?.id === proc.id;
              const photoCount = countPhotosInProcedure(proc);
              return (
                <div
                  key={proc.id}
                  onClick={() => setSelectedProcedureId(proc.id)}
                  style={{
                    background: isSelected ? '#FFFFFF' : '#FFFFFF',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #036d92' : '1px solid #CBD5E1',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 3px 8px rgba(3, 109, 146, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 900,
                          background: isSelected ? '#036d92' : '#E2E8F0',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          padding: '1px 5px',
                          borderRadius: 4
                        }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: isSelected ? '#036d92' : '#0F172A' }}>
                          {proc.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 3 }}>
                        {proc.category} • {proc.createdAt}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteProcedure(proc.id, proc.name, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 2
                      }}
                      title="Delete procedure"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                      {proc.sessions.length} Session{proc.sessions.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{
                      background: photoCount > 0 ? (isSelected ? '#036d92' : '#E0F2FE') : '#F1F5F9',
                      color: photoCount > 0 ? (isSelected ? '#FFFFFF' : '#0369A1') : '#64748B',
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: 10
                    }}>
                      {photoCount} Photo{photoCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT MAIN AREA: SELECTED PROCEDURE SESSIONS & GALLERY (Req 3, 6, 7)*/}
        {/* ------------------------------------------------------------------ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Procedure Header & Top Controls Bar */}
          {activeProcedure && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              padding: '14px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                      {activeProcedure.name.toUpperCase()}
                    </h2>
                    <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 12 }}>
                      {activeProcedure.category}
                    </span>
                    <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 12 }}>
                      {activeProcedure.sessions.length} Sessions • {countPhotosInProcedure(activeProcedure)} Photos
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                    Initiated: {activeProcedure.createdAt} • Site: {activeProcedure.bodyPart || 'FACE'} • Therapist: {activeProcedure.therapist || 'Dr Valaki'}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Add Image Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const firstSess = displayedSessions[0];
                      setAddImageDestination({
                        procedureId: activeProcedure.id,
                        sessionId: firstSess?.id || `sess-${activeProcedure.id}-1`,
                        type: 'BEFORE'
                      });
                      setShowAddImageModal(true);
                    }}
                    style={{
                      background: '#036d92',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(3,109,146,0.25)'
                    }}
                  >
                    <Camera size={14} />
                    <span>+ Add Image</span>
                  </button>

                  {/* Add Session Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSession(activeProcedure.id)}
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #036d92',
                      color: '#036d92',
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                    <span>+ Add Session</span>
                  </button>

                  {/* Sorting: Most Recent First vs Oldest First (Requirement 5) */}
                  <button
                    type="button"
                    onClick={() => setGallerySortOrder(prev => (prev === 'recent-first' ? 'oldest-first' : 'recent-first'))}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#334155',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                    title="Toggle session & photo order"
                  >
                    <ArrowUpDown size={13} />
                    <span>{gallerySortOrder === 'recent-first' ? 'Most Recent First' : 'Oldest First'}</span>
                  </button>

                  {/* Compare Selected Button (Requirement 12: enabled when >= 2 eligible photos selected) */}
                  <button
                    type="button"
                    disabled={resolvedSelectedPhotos.length < 2}
                    onClick={() => setCompareModalOpen(true)}
                    style={{
                      background: resolvedSelectedPhotos.length >= 2 ? '#0F172A' : '#E2E8F0',
                      color: resolvedSelectedPhotos.length >= 2 ? '#FFFFFF' : '#94A3B8',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12.5,
                      fontWeight: 900,
                      cursor: resolvedSelectedPhotos.length >= 2 ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: resolvedSelectedPhotos.length >= 2 ? '0 2px 8px rgba(15,23,42,0.2)' : 'none'
                    }}
                    title={
                      resolvedSelectedPhotos.length < 2
                        ? 'Select at least 2 photos using checkboxes to compare'
                        : `Compare ${resolvedSelectedPhotos.length} selected photos`
                    }
                  >
                    <SplitSquareVertical size={14} />
                    <span>Compare {resolvedSelectedPhotos.length > 0 ? `(${resolvedSelectedPhotos.length})` : ''}</span>
                  </button>

                  {resolvedSelectedPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompareSelections}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        fontSize: 11,
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State: No procedures */}
          {!activeProcedure && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#F8FAFC',
              borderRadius: 12,
              border: '2px dashed #CBD5E1'
            }}>
              <Camera size={44} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
                No Clinical Procedures Recorded
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 18px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                Add clinical treatments such as PRP, Hair Removal, or Peeling to begin organizing sessions, photos, and comparison records.
              </p>
              <button
                type="button"
                onClick={() => setShowAddProcedureModal(true)}
                style={{
                  background: '#036d92',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={16} />
                <span>+ Add Clinical Procedure</span>
              </button>
            </div>
          )}

          {/* SESSIONS LIST (Requirements 6 & 7) */}
          {activeProcedure && displayedSessions.map(sess => {
            const hasPhotos = (sess.beforeImages.length + sess.afterImages.length + (sess.subSections || []).reduce((acc, sub) => acc + sub.images.length, 0)) > 0;

            return (
              <div
                key={sess.id}
                className="images-session-card"
                data-testid="images-session-card"
                data-session-id={sess.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    sessionId: sess.id,
                    procedureId: activeProcedure.id
                  });
                }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  padding: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  position: 'relative'
                }}
              >
                {/* Session Card Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  paddingBottom: 10,
                  borderBottom: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      background: '#036d92',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: 6
                    }}>
                      SESSION {sess.sessionNumber}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                        {activeProcedure.name} • Session {sess.sessionNumber}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={11} /> Date: <strong>{sess.date}</strong> • Therapist: {sess.therapist || 'Dr Valaki'}
                        {sess.doctorObservation && ` • Notes: ${sess.doctorObservation}`}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this Session */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Add Sub-section Button (Requirement 7) */}
                    <button
                      type="button"
                      onClick={() => handleCreateSubSection(sess.id)}
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Add a follow-up image group (or right-click session panel)"
                    >
                      <Layers size={12} />
                      <span>+ Add Sub-section</span>
                    </button>

                    {/* Add Image inside this session */}
                    <button
                      type="button"
                      onClick={() => {
                        setAddImageDestination({
                          procedureId: activeProcedure.id,
                          sessionId: sess.id,
                          type: 'BEFORE'
                        });
                        setShowAddImageModal(true);
                      }}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#334155',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Camera size={12} />
                      <span>+ Add Image</span>
                    </button>
                  </div>
                </div>

                {/* Empty State: Session has no photos yet (Requirement 3: show Add Image) */}
                {!hasPhotos && (
                  <div
                    style={{
                      padding: '24px 16px',
                      background: '#F8FAFC',
                      borderRadius: 8,
                      border: '1.5px dashed #CBD5E1',
                      textAlign: 'center',
                      marginBottom: 12
                    }}
                  >
                    <Camera size={24} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>
                      No photos added in Session {sess.sessionNumber}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, marginBottom: 12 }}>
                      Click below to attach Before and After images for this session
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAddImageDestination({
                            procedureId: activeProcedure.id,
                            sessionId: sess.id,
                            type: 'BEFORE'
                          });
                          setShowAddImageModal(true);
                        }}
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #F59E0B',
                          color: '#B45309',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>+ Add Before</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddImageDestination({
                            procedureId: activeProcedure.id,
                            sessionId: sess.id,
                            type: 'AFTER'
                          });
                          setShowAddImageModal(true);
                        }}
                        style={{
                          background: '#F0FDF4',
                          border: '1px solid #10B981',
                          color: '#15803D',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>+ Add After</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Photo Containers: Side-by-Side BEFORE vs AFTER */}
                {hasPhotos && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {/* BEFORE PHOTOS CONTAINER */}
                    <div style={{
                      background: '#FFFBEB',
                      borderRadius: 8,
                      border: '1px solid #FDE68A',
                      padding: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706' }} />
                          BEFORE PHOTOS ({sess.beforeImages.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddImageDestination({
                              procedureId: activeProcedure.id,
                              sessionId: sess.id,
                              type: 'BEFORE'
                            });
                            setShowAddImageModal(true);
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #F59E0B',
                            color: '#B45309',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Add Before
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {sess.beforeImages.map(img => (
                          <PhotoThumbnailCard
                            key={img.id}
                            image={img}
                            procedureName={activeProcedure.name}
                            sessionLabel={`Session ${sess.sessionNumber}`}
                            isSelectedForCompare={selectedImageIds.includes(img.id)}
                            onToggleCompare={() => handleToggleSelectCompare(img.id)}
                            onClick={() => {
                              if (img.fileType === 'application/pdf') setViewingPdfDoc(img);
                              else setFullscreenImage(img);
                            }}
                            onEdit={() => {
                              if (img.fileType !== 'application/pdf') setEditingImage(img);
                            }}
                            onDelete={() => handleDeleteImage(img.id)}
                            onAdminEdit={() => setAdminEditingImage(img)}
                            isAdmin={isAdmin}
                          />
                        ))}

                        {sess.beforeImages.length === 0 && (
                          <div
                            onClick={() => {
                              setAddImageDestination({
                                procedureId: activeProcedure.id,
                                sessionId: sess.id,
                                type: 'BEFORE'
                              });
                              setShowAddImageModal(true);
                            }}
                            style={{
                              gridColumn: '1 / -1',
                              padding: '16px 8px',
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.7)',
                              border: '1px dashed #F59E0B',
                              borderRadius: 6,
                              color: '#B45309',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Click to upload Before photo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AFTER PHOTOS CONTAINER */}
                    <div style={{
                      background: '#F0FDF4',
                      borderRadius: 8,
                      border: '1px solid #BBF7D0',
                      padding: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
                          AFTER PHOTOS ({sess.afterImages.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddImageDestination({
                              procedureId: activeProcedure.id,
                              sessionId: sess.id,
                              type: 'AFTER'
                            });
                            setShowAddImageModal(true);
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #22C55E',
                            color: '#15803D',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Add After
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {sess.afterImages.map(img => (
                          <PhotoThumbnailCard
                            key={img.id}
                            image={img}
                            procedureName={activeProcedure.name}
                            sessionLabel={`Session ${sess.sessionNumber}`}
                            isSelectedForCompare={selectedImageIds.includes(img.id)}
                            onToggleCompare={() => handleToggleSelectCompare(img.id)}
                            onClick={() => {
                              if (img.fileType === 'application/pdf') setViewingPdfDoc(img);
                              else setFullscreenImage(img);
                            }}
                            onEdit={() => {
                              if (img.fileType !== 'application/pdf') setEditingImage(img);
                            }}
                            onDelete={() => handleDeleteImage(img.id)}
                            onAdminEdit={() => setAdminEditingImage(img)}
                            isAdmin={isAdmin}
                          />
                        ))}

                        {sess.afterImages.length === 0 && (
                          <div
                            onClick={() => {
                              setAddImageDestination({
                                procedureId: activeProcedure.id,
                                sessionId: sess.id,
                                type: 'AFTER'
                              });
                              setShowAddImageModal(true);
                            }}
                            style={{
                              gridColumn: '1 / -1',
                              padding: '16px 8px',
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.7)',
                              border: '1px dashed #22C55E',
                              borderRadius: 6,
                              color: '#15803D',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Click to upload After photo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-SECTIONS ACCORDION / PANELS (Requirement 7) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  {(sess.subSections || []).map((subSec, subIdx) => (
                    <div
                      key={subSec.id}
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        padding: 10
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ background: '#3B82F6', color: '#FFFFFF', fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 4 }}>
                            SUB-SECTION {subIdx + 1}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                            {subSec.name}
                          </span>
                          <span style={{ fontSize: 10.5, color: '#64748B' }}>
                            • {activeProcedure.name} • {subSec.date || sess.date}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAddImageDestination({
                              procedureId: activeProcedure.id,
                              sessionId: sess.id,
                              subSectionId: subSec.id,
                              type: 'OTHER'
                            });
                            setShowAddImageModal(true);
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #3B82F6',
                            color: '#2563EB',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Add Photo
                        </button>
                      </div>

                      {/* Sub-section Photos Grid (No Before photo required!) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {subSec.images.map(img => (
                          <PhotoThumbnailCard
                            key={img.id}
                            image={img}
                            procedureName={activeProcedure.name}
                            sessionLabel={subSec.name}
                            isSelectedForCompare={selectedImageIds.includes(img.id)}
                            onToggleCompare={() => handleToggleSelectCompare(img.id)}
                            onClick={() => {
                              if (img.fileType === 'application/pdf') setViewingPdfDoc(img);
                              else setFullscreenImage(img);
                            }}
                            onEdit={() => {
                              if (img.fileType !== 'application/pdf') setEditingImage(img);
                            }}
                            onDelete={() => handleDeleteImage(img.id)}
                            onAdminEdit={() => setAdminEditingImage(img)}
                            isAdmin={isAdmin}
                          />
                        ))}

                        {subSec.images.length === 0 && (
                          <div
                            onClick={() => {
                              setAddImageDestination({
                                procedureId: activeProcedure.id,
                                sessionId: sess.id,
                                subSectionId: subSec.id,
                                type: 'OTHER'
                              });
                              setShowAddImageModal(true);
                            }}
                            style={{
                              gridColumn: '1 / -1',
                              padding: '12px 8px',
                              textAlign: 'center',
                              background: '#FFFFFF',
                              border: '1px dashed #93C5FD',
                              borderRadius: 6,
                              color: '#2563EB',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Click to add follow-up photos to this sub-section
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Clearly Labeled Tile: Double Click to Add Sub-section (Requirement 7) */}
                  <div
                    onDoubleClick={() => handleCreateSubSection(sess.id)}
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px dashed #94A3B8',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      color: '#475569',
                      fontSize: 11.5,
                      fontWeight: 700,
                      userSelect: 'none',
                      transition: 'background 0.15s ease'
                    }}
                    title="Double-click to create a new sub-section"
                  >
                    <Layers size={14} color="#036d92" />
                    <span>[ + Double-Click to Add Sub-section ]</span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>(or right-click panel)</span>
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* ==================================================================== */}
      {/* CONTEXT MENU: Right-Click on Session Panel (Requirement 7)           */}
      {/* ==================================================================== */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#FFFFFF',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            border: '1px solid #CBD5E1',
            zIndex: 10000,
            minWidth: 180,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '6px 12px', fontSize: 10.5, fontWeight: 800, color: '#94A3B8', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
            SESSION OPTIONS
          </div>
          <button
            type="button"
            onClick={() => {
              handleCreateSubSection(contextMenu.sessionId);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Layers size={13} color="#036d92" />
            <span>+ Add Sub-section</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddImageDestination({
                procedureId: contextMenu.procedureId,
                sessionId: contextMenu.sessionId,
                type: 'BEFORE'
              });
              setShowAddImageModal(true);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Camera size={13} color="#036d92" />
            <span>+ Add Before Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddImageDestination({
                procedureId: contextMenu.procedureId,
                sessionId: contextMenu.sessionId,
                type: 'AFTER'
              });
              setShowAddImageModal(true);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Camera size={13} color="#16A34A" />
            <span>+ Add After Image</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / LINK PROCEDURE (Requirement 4)                          */}
      {/* ==================================================================== */}
      {showAddProcedureModal && (
        <AddProcedureModal
          procedures={procedures}
          pendingImage={pendingStandaloneImage}
          onClose={() => setShowAddProcedureModal(false)}
          onSave={handleSaveProcedure}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD IMAGE GUIDED FLOW (Requirement 8)                         */}
      {/* ==================================================================== */}
      {showAddImageModal && (
        <AddImageGuidedFlowModal
          procedures={procedures}
          initialDestination={addImageDestination}
          deviceConfigs={deviceConfigs}
          onClose={() => setShowAddImageModal(false)}
          onSaveImage={handleSaveImageToDestination}
          onNeedNewProcedure={(pendingImg) => {
            setPendingStandaloneImage(pendingImg);
            setShowAddImageModal(false);
            setShowAddProcedureModal(true);
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: FULLSCREEN SINGLE-PHOTO VIEWER (Requirement 11)               */}
      {/* ==================================================================== */}
      {fullscreenImage && (
        <SinglePhotoViewerModal
          image={fullscreenImage}
          procedureName={activeProcedure?.name || 'Procedure'}
          allPhotos={allProcedurePhotos}
          onClose={() => setFullscreenImage(null)}
          onEdit={() => {
            const target = fullscreenImage;
            setFullscreenImage(null);
            setEditingImage(target);
          }}
          onShare={() => setSharingImage(fullscreenImage)}
          onChangeImage={(next) => setFullscreenImage(next)}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: PHOTO EDITOR (Requirement 9: Zoom, Crop, Rotate, Mark, Pan)   */}
      {/* ==================================================================== */}
      {editingImage && (
        <PhotoEditorModal
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleSaveEditedImage}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: MULTI-IMAGE COMPARISON (Requirement 12)                       */}
      {/* ==================================================================== */}
      {compareModalOpen && (
        <MultiPhotoCompareModal
          photos={resolvedSelectedPhotos}
          procedureName={activeProcedure?.name || 'Clinical Procedure'}
          onClose={() => setCompareModalOpen(false)}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: SEND / SHARE IMAGE (Requirement 11)                           */}
      {/* ==================================================================== */}
      {sharingImage && (
        <SendImageModal
          image={sharingImage}
          patient={patient}
          onClose={() => setSharingImage(null)}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADMIN METADATA CORRECTION (Requirement 10)                    */}
      {/* ==================================================================== */}
      {adminEditingImage && (
        <AdminMetadataEditModal
          image={adminEditingImage}
          onClose={() => setAdminEditingImage(null)}
          onSave={handleAdminUpdateMetadata}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: PDF DOCUMENT VIEWER (Requirement 9)                           */}
      {/* ==================================================================== */}
      {viewingPdfDoc && (
        <PdfDocumentViewerModal
          image={viewingPdfDoc}
          onClose={() => setViewingPdfDoc(null)}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADMIN DEVICE CONFIGURATION (Requirement 8)                    */}
      {/* ==================================================================== */}
      {showDeviceSettingsModal && (
        <AdminDeviceSettingsModal
          configs={deviceConfigs}
          onClose={() => setShowDeviceSettingsModal(false)}
          onSave={(updated) => {
            setDeviceConfigs(updated);
            setShowDeviceSettingsModal(false);
            showToast('✓ Hardware device settings updated');
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* TOAST ALERT                                                          */}
      {/* ==================================================================== */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          zIndex: 100000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={16} color="#38BDF8" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// COMPONENT: PHOTO THUMBNAIL CARD (Requirements 10 & 12)
// Shows capture date/time in small white box with black text
// ============================================================================

interface PhotoThumbnailCardProps {
  image: ClinicalImage;
  procedureName: string;
  sessionLabel: string;
  isSelectedForCompare: boolean;
  isAdmin: boolean;
  onToggleCompare: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdminEdit: () => void;
}

function PhotoThumbnailCard({
  image,
  isSelectedForCompare,
  isAdmin,
  onToggleCompare,
  onClick,
  onEdit,
  onDelete,
  onAdminEdit
}: PhotoThumbnailCardProps) {
  const isPdf = image.fileType === 'application/pdf';

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 8,
      border: isSelectedForCompare ? '2.5px solid #036d92' : '1px solid #CBD5E1',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.15s ease'
    }}>
      {/* Compare Checkbox (Genuine HTML checkbox, separate from thumbnail click) */}
      {!isPdf && (
        <label
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            zIndex: 15,
            background: isSelectedForCompare ? '#036d92' : 'rgba(255,255,255,0.92)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 3,
            border: isSelectedForCompare ? '1.5px solid #036d92' : '1.5px solid #94A3B8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
          }}
          title={isSelectedForCompare ? "Deselect from comparison" : "Select for comparison"}
        >
          <input
            type="checkbox"
            checked={isSelectedForCompare}
            onChange={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: 'pointer',
              width: 15,
              height: 15,
              accentColor: '#036d92',
              margin: 0
            }}
          />
        </label>
      )}

      {/* Top-Right Quick Actions: Edit & Delete */}
      <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, display: 'flex', gap: 4 }}>
        {!isPdf && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid #CBD5E1',
              borderRadius: 4,
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#036d92'
            }}
            title="Edit / Annotate Photo"
          >
            <Edit3 size={11} />
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdminEdit(); }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid #CBD5E1',
              borderRadius: 4,
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#D97706'
            }}
            title="Admin: Edit Date/Time & Observations"
          >
            <Clock size={11} />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid #FCA5A5',
            borderRadius: 4,
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#DC2626'
          }}
          title="Delete Photo"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Thumbnail Area */}
      <div
        onClick={onClick}
        style={{
          height: 120,
          background: '#F1F5F9',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {isPdf ? (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <FileText size={36} color="#DC2626" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 10, fontWeight: 800, color: '#334155', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {image.fileName}
            </div>
            <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>
              PDF DOCUMENT
            </span>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.fileName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* REQUIREMENT 10: Capture Date/Time in small white box with black text */}
      <div style={{ padding: '6px 8px', background: '#F8FAFC', textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
        <div style={{
          display: 'inline-block',
          background: '#FFFFFF',
          color: '#000000',
          border: '1px solid #CBD5E1',
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: 'monospace',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          {image.date} {image.time}
        </div>

        {image.doctorObservation && (
          <div style={{
            fontSize: 10,
            color: '#475569',
            marginTop: 4,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            📝 {image.doctorObservation}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: ADD / LINK PROCEDURE (Requirement 4)
// ============================================================================

interface AddProcedureModalProps {
  procedures: ClinicalProcedure[];
  pendingImage: ClinicalImage | null;
  onClose: () => void;
  onSave: (name: string, category: string, date: string, bodyPart: string, therapist: string) => void;
}

function AddProcedureModal({ procedures, pendingImage, onClose, onSave }: AddProcedureModalProps) {
  const [selectedMaster, setSelectedMaster] = useState(MASTER_PROCEDURES[0].name);
  const [manualName, setManualName] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [category, setCategory] = useState(MASTER_PROCEDURES[0].category);
  const [date, setDate] = useState(getTodayDateString());
  const [bodyPart, setBodyPart] = useState('FACE');
  const [therapist, setTherapist] = useState('Dr Valaki');
  const [searchTerm, setSearchTerm] = useState('');
  const [addToSharedMaster, setAddToSharedMaster] = useState(true);

  const filteredMaster = useMemo(() => {
    if (!searchTerm.trim()) return MASTER_PROCEDURES;
    const q = searchTerm.toLowerCase();
    return MASTER_PROCEDURES.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = useManual ? manualName.trim() : selectedMaster;
    if (!finalName) return;
    onSave(finalName, category, date, bodyPart, therapist);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        width: '90%',
        maxWidth: 540,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: '#036d92',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} strokeWidth={3} />
            <span style={{ fontSize: 15, fontWeight: 900 }}>ADD CLINICAL PROCEDURE</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {pendingImage && (
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <CheckCircle2 size={16} color="#2563EB" />
              <div style={{ fontSize: 12, color: '#1E40AF' }}>
                Pending photo attached (<strong>{pendingImage.fileName}</strong>). It will automatically be linked to Session 1 of this procedure!
              </div>
            </div>
          )}

          {/* Toggle Master vs Manual */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setUseManual(false)}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                background: !useManual ? '#FFFFFF' : 'transparent',
                color: !useManual ? '#036d92' : '#64748B',
                boxShadow: !useManual ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Select from Master List
            </button>
            <button
              type="button"
              onClick={() => setUseManual(true)}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                background: useManual ? '#FFFFFF' : 'transparent',
                color: useManual ? '#036d92' : '#64748B',
                boxShadow: useManual ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Enter Manually
            </button>
          </div>

          {!useManual ? (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                SEARCH &amp; SELECT CLINICAL PROCEDURE:
              </label>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 10 }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter procedure catalog..."
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 30px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12
                  }}
                />
              </div>

              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF' }}>
                {filteredMaster.map(item => (
                  <div
                    key={item.name}
                    onClick={() => {
                      setSelectedMaster(item.name);
                      setCategory(item.category);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                      background: selectedMaster === item.name ? '#E0F2FE' : '#FFFFFF',
                      color: selectedMaster === item.name ? '#0369A1' : '#0F172A',
                      fontWeight: selectedMaster === item.name ? 800 : 500,
                      fontSize: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{item.name}</span>
                    <span style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                CUSTOM CLINICAL PROCEDURE NAME:
              </label>
              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="e.g. Subcision with Autologous Fat Grafting..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #036d92',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700
                }}
              />
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={addToSharedMaster}
                    onChange={e => setAddToSharedMaster(e.target.checked)}
                  />
                  <span>Add this custom procedure to clinic Master Catalog for future visits</span>
                </label>
              </div>
            </div>
          )}

          {/* Category & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                CATEGORY:
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {PROCEDURE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                PROCEDURE DATE:
              </label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              />
            </div>
          </div>

          {/* Body Part & Therapist */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                TREATMENT AREA / SITE:
              </label>
              <input
                type="text"
                value={bodyPart}
                onChange={e => setBodyPart(e.target.value)}
                placeholder="e.g. FACE, SCALP, BACK..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                DOCTOR / THERAPIST:
              </label>
              <input
                type="text"
                value={therapist}
                onChange={e => setTherapist(e.target.value)}
                placeholder="e.g. Dr Valaki"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#036d92',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '8px 22px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(3, 109, 146, 0.25)'
              }}
            >
              Save &amp; Open Procedure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: ADD IMAGE GUIDED FLOW (Requirement 8)
// Flow: Confirm Destination -> Choose Type -> Choose Source -> Preview/Edit -> Metadata -> Save
// ============================================================================

interface AddImageGuidedFlowModalProps {
  procedures: ClinicalProcedure[];
  initialDestination: {
    procedureId: string;
    sessionId: string;
    subSectionId?: string;
    type: 'BEFORE' | 'AFTER' | 'OTHER';
  } | null;
  deviceConfigs: DeviceIntegrationConfig[];
  onClose: () => void;
  onSaveImage: (img: ClinicalImage, destination: {
    procedureId: string;
    procedureName?: string;
    sessionId: string;
    sessionNumber?: number | string;
    subSectionId?: string;
    type: 'BEFORE' | 'AFTER' | 'OTHER';
  }) => void;
  onNeedNewProcedure: (pendingImg: ClinicalImage) => void;
}

function AddImageGuidedFlowModal({
  procedures,
  initialDestination,
  deviceConfigs,
  onClose,
  onSaveImage,
  onNeedNewProcedure
}: AddImageGuidedFlowModalProps) {
  // 1. Destination: Writable Procedure & Session
  const [targetProcId, setTargetProcId] = useState(initialDestination?.procedureId || procedures[0]?.id || 'NEW');

  // Writable procedure name
  const initialProcName = useMemo(() => {
    if (initialDestination?.procedureId) {
      const p = procedures.find(item => item.id === initialDestination.procedureId);
      if (p) return p.name;
    }
    if (procedures.length > 0 && procedures[0].name) {
      return procedures[0].name;
    }
    return 'Acne Laser Comedone Extraction';
  }, [initialDestination, procedures]);

  const [procedureNameInput, setProcedureNameInput] = useState(initialProcName);

  // Check matching procedure from procedureNameInput
  const matchedProcedure = useMemo(() => {
    const trimmed = procedureNameInput.trim().toLowerCase();
    if (!trimmed) return null;
    return procedures.find(p => p.name.toLowerCase() === trimmed || p.id === trimmed) || null;
  }, [procedureNameInput, procedures]);

  // Writable session
  const initialSessionText = useMemo(() => {
    if (initialDestination?.sessionId && matchedProcedure) {
      const s = matchedProcedure.sessions.find(item => item.id === initialDestination.sessionId);
      if (s) return `Session ${s.sessionNumber}`;
    }
    if (matchedProcedure?.sessions?.[0]) {
      return `Session ${matchedProcedure.sessions[0].sessionNumber}`;
    }
    return 'Session 1';
  }, [initialDestination, matchedProcedure]);

  const [sessionInput, setSessionInput] = useState(initialSessionText);
  const [targetSubSectionId, setTargetSubSectionId] = useState(initialDestination?.subSectionId || '');
  const [imageType, setImageType] = useState<'BEFORE' | 'AFTER' | 'OTHER'>(initialDestination?.type || 'BEFORE');

  // 2. Source Selection
  const [sourceType, setSourceType] = useState<'UPLOAD' | 'CAMERA' | 'DERMASCOPE' | 'FACE_SCANNER'>('UPLOAD');

  // 3. Staged File / Image
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  const [stagedOriginalUrl, setStagedOriginalUrl] = useState<string | null>(null);
  const [stagedFileName, setStagedFileName] = useState('');
  const [stagedFileType, setStagedFileType] = useState('image/jpeg');
  const [stagedFileSize, setStagedFileSize] = useState('');

  // 4. Metadata
  const [captureDate, setCaptureDate] = useState(getTodayDateString());
  const [captureTime, setCaptureTime] = useState(getTimeString());
  const [doctorObservation, setDoctorObservation] = useState('');

  // Live Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Hidden File Input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Camera start handler
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraError('Camera access denied or hardware camera not found. Please enable browser camera permissions or upload an image file.');
      setCameraActive(false);
    }
  };

  const capturePhotoFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg', 0.92);
      setStagedUrl(url);
      setStagedOriginalUrl(url);
      setStagedFileName(`LiveCapture_${Date.now()}.jpg`);
      setStagedFileType('image/jpeg');
      setStagedFileSize(`${Math.round(url.length / 1024)} KB`);
      setCaptureDate(getTodayDateString());
      setCaptureTime(getTimeString());

      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      setCameraActive(false);
    }
  };

  // File Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 25MB
    if (file.size > 25 * 1024 * 1024) {
      alert('File exceeds 25 MB size limit.');
      return;
    }

    try {
      const url = await readFileAsDataURL(file);
      setStagedUrl(url);
      setStagedOriginalUrl(url);
      setStagedFileName(file.name);
      setStagedFileType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'));
      setStagedFileSize(`${Math.round(file.size / 1024)} KB`);

      // Try reading lastModified date for uploads
      if (file.lastModified) {
        const d = new Date(file.lastModified);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        setCaptureDate(`${day}/${month}/${year}`);
      } else {
        setCaptureDate(getTodayDateString());
      }
      setCaptureTime(getTimeString());
    } catch (err) {
      console.error('File load error:', err);
    }
  };

  // Submit and Save
  const handleFinalSave = () => {
    if (!stagedUrl) {
      alert('Please upload or capture a clinical photo/document first.');
      return;
    }

    const trimmedProcName = procedureNameInput.trim();
    if (!trimmedProcName) {
      alert('Please enter or select a clinical procedure name (e.g. Acne Laser Comedone Extraction).');
      return;
    }

    const trimmedSession = sessionInput.trim();
    const sessionNumMatch = trimmedSession.match(/\d+/);
    const targetSessionNumber = sessionNumMatch ? parseInt(sessionNumMatch[0], 10) : 1;

    // Check if procedure already exists in patient's records
    const existingProc = procedures.find(
      p => p.name.toLowerCase() === trimmedProcName.toLowerCase() || p.id === targetProcId
    );

    const procId = existingProc ? existingProc.id : `proc-${Date.now()}`;
    const matchedSession = existingProc?.sessions.find(
      s => s.sessionNumber === targetSessionNumber || s.id === trimmedSession
    );
    const sessId = matchedSession ? matchedSession.id : `sess-${procId}-${targetSessionNumber}-${Date.now()}`;

    const clinicalImg: ClinicalImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      procedureId: procId,
      sessionId: sessId,
      subSectionId: targetSubSectionId || undefined,
      url: stagedUrl,
      originalUrl: stagedOriginalUrl || stagedUrl,
      type: imageType,
      fileName: stagedFileName || `Photo_${Date.now()}.jpg`,
      fileType: stagedFileType,
      fileSize: stagedFileSize,
      date: captureDate || getTodayDateString(),
      time: captureTime || getTimeString(),
      capturedAt: `${captureDate} ${captureTime}`,
      uploadedAt: new Date().toISOString(),
      source: sourceType,
      doctorObservation
    };

    onSaveImage(clinicalImg, {
      procedureId: procId,
      procedureName: trimmedProcName,
      sessionId: sessId,
      sessionNumber: targetSessionNumber,
      subSectionId: targetSubSectionId || undefined,
      type: imageType
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        width: '92%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: '#036d92',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={18} />
            <span style={{ fontSize: 15, fontWeight: 900 }}>ADD CLINICAL IMAGE / DOCUMENT</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* STEP 1: DESTINATION CONFIRMATION */}
          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
                1. CONFIRM DESTINATION &amp; PHOTO TYPE
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: matchedProcedure ? '#DCFCE7' : '#FEF3C7',
                  color: matchedProcedure ? '#166534' : '#92400E',
                  border: matchedProcedure ? '1px solid #86EFAC' : '1px solid #FDE68A'
                }}>
                  {matchedProcedure ? `✓ Linked: ${matchedProcedure.name} (${matchedProcedure.sessions.length} sessions)` : '★ New Procedure (Will be created)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 10 }}>
              {/* Procedure: Writable & Selectable */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <label htmlFor="procedure-name-input" style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B' }}>
                    PROCEDURE:
                  </label>
                  <span style={{ fontSize: 9.5, color: '#036d92', fontWeight: 700 }}>
                    Writable / Searchable
                  </span>
                </div>
                <input
                  id="procedure-name-input"
                  type="text"
                  value={procedureNameInput}
                  onChange={e => {
                    const val = e.target.value;
                    setProcedureNameInput(val);
                    const matched = procedures.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
                    if (matched) {
                      setTargetProcId(matched.id);
                      if (matched.sessions?.[0]) {
                        setSessionInput(`Session ${matched.sessions[0].sessionNumber}`);
                      }
                    } else {
                      setTargetProcId('NEW');
                    }
                  }}
                  placeholder="e.g. Acne Laser Comedone Extraction"
                  list="guided-procedure-options-datalist"
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#FFFFFF',
                    color: '#0F172A'
                  }}
                />
                <datalist id="guided-procedure-options-datalist">
                  {procedures.map(p => (
                    <option key={`pat-${p.id}`} value={p.name}>[Patient Record] {p.name}</option>
                  ))}
                  {MASTER_PROCEDURES.map(m => (
                    <option key={`m-${m.name}`} value={m.name}>[Master Catalog] {m.name} ({m.category})</option>
                  ))}
                </datalist>

                {/* Quick picker dropdown */}
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600 }}>Quick pick:</span>
                  <select
                    value=""
                    onChange={e => {
                      if (!e.target.value) return;
                      const chosen = e.target.value;
                      setProcedureNameInput(chosen);
                      const matched = procedures.find(p => p.name === chosen);
                      if (matched) {
                        setTargetProcId(matched.id);
                        if (matched.sessions?.[0]) {
                          setSessionInput(`Session ${matched.sessions[0].sessionNumber}`);
                        }
                      } else {
                        setTargetProcId('NEW');
                        setSessionInput('Session 1');
                      }
                    }}
                    style={{
                      padding: '2px 4px',
                      fontSize: 10,
                      borderRadius: 4,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select from catalog / list...</option>
                    <optgroup label="Patient Current Procedures">
                      {procedures.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Master Catalog">
                      {MASTER_PROCEDURES.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Session: Writable & Selectable */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <label htmlFor="session-name-input" style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B' }}>
                    SESSION:
                  </label>
                  <span style={{ fontSize: 9.5, color: '#036d92', fontWeight: 700 }}>
                    Writable
                  </span>
                </div>
                <input
                  id="session-name-input"
                  type="text"
                  value={sessionInput}
                  onChange={e => setSessionInput(e.target.value)}
                  placeholder="e.g. Session 1 or 1"
                  list="guided-session-options-datalist"
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#FFFFFF',
                    color: '#0F172A'
                  }}
                />
                <datalist id="guided-session-options-datalist">
                  {matchedProcedure?.sessions.map(s => (
                    <option key={s.id} value={`Session ${s.sessionNumber}`}>Date: {s.date}</option>
                  ))}
                  <option value={`Session ${(matchedProcedure?.sessions.length || 0) + 1}`}>
                    + New Session {(matchedProcedure?.sessions.length || 0) + 1}
                  </option>
                  <option value="Session 1">Session 1</option>
                  <option value="Session 2">Session 2</option>
                </datalist>

                {/* Quick session dropdown */}
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600 }}>Quick pick:</span>
                  <select
                    value=""
                    onChange={e => {
                      if (!e.target.value) return;
                      setSessionInput(e.target.value);
                    }}
                    style={{
                      padding: '2px 4px',
                      fontSize: 10,
                      borderRadius: 4,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select session...</option>
                    {matchedProcedure?.sessions.map(s => (
                      <option key={s.id} value={`Session ${s.sessionNumber}`}>
                        Session {s.sessionNumber} ({s.date})
                      </option>
                    ))}
                    <option value={`Session ${(matchedProcedure?.sessions.length || 0) + 1}`}>
                      + Add Session {(matchedProcedure?.sessions.length || 0) + 1}
                    </option>
                  </select>
                </div>
              </div>

              {/* Type: Before / After / Other */}
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748B', marginBottom: 2 }}>
                  IMAGE TYPE:
                </label>
                <select
                  value={imageType}
                  onChange={e => setImageType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: 12,
                    fontWeight: 800,
                    background: '#FFFFFF',
                    color: '#0F172A'
                  }}
                >
                  <option value="BEFORE">BEFORE Photo</option>
                  <option value="AFTER">AFTER Photo</option>
                  <option value="OTHER">SUB-SECTION / FOLLOW-UP</option>
                </select>

                {imageType === 'OTHER' && (
                  <div style={{ marginTop: 4 }}>
                    <input
                      type="text"
                      value={targetSubSectionId}
                      onChange={e => setTargetSubSectionId(e.target.value)}
                      placeholder="Sub-section name (e.g. Sub-section 1)"
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #CBD5E1',
                        fontSize: 11,
                        marginTop: 2
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: CHOOSE SOURCE (Requirement 8) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#334155', marginBottom: 8 }}>
              2. SELECT IMAGE SOURCE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {/* 1. Upload File */}
              <button
                type="button"
                onClick={() => {
                  setSourceType('UPLOAD');
                  fileInputRef.current?.click();
                }}
                style={{
                  background: sourceType === 'UPLOAD' ? '#EFF6FF' : '#FFFFFF',
                  border: sourceType === 'UPLOAD' ? '2px solid #036d92' : '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Upload size={20} color="#036d92" />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Upload File</span>
                <span style={{ fontSize: 9.5, color: '#64748B' }}>JPEG, PNG, PDF</span>
              </button>

              {/* 2. Camera */}
              <button
                type="button"
                onClick={() => {
                  setSourceType('CAMERA');
                  startCamera();
                }}
                style={{
                  background: sourceType === 'CAMERA' ? '#EFF6FF' : '#FFFFFF',
                  border: sourceType === 'CAMERA' ? '2px solid #036d92' : '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Camera size={20} color="#036d92" />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Live Camera</span>
                <span style={{ fontSize: 9.5, color: '#64748B' }}>Webcam / Mobile</span>
              </button>

              {/* 3. Dermascope */}
              <button
                type="button"
                onClick={() => setSourceType('DERMASCOPE')}
                style={{
                  background: sourceType === 'DERMASCOPE' ? '#EFF6FF' : '#FFFFFF',
                  border: sourceType === 'DERMASCOPE' ? '2px solid #036d92' : '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={20} color="#036d92" />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Dermascope</span>
                <span style={{ fontSize: 9.5, color: '#DC2626', fontWeight: 700 }}>Hardware Offline</span>
              </button>

              {/* 4. Face Scanner */}
              <button
                type="button"
                onClick={() => setSourceType('FACE_SCANNER')}
                style={{
                  background: sourceType === 'FACE_SCANNER' ? '#EFF6FF' : '#FFFFFF',
                  border: sourceType === 'FACE_SCANNER' ? '2px solid #036d92' : '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={20} color="#036d92" />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>Face Scanner</span>
                <span style={{ fontSize: 9.5, color: '#DC2626', fontWeight: 700 }}>Daemon Offline</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png,application/pdf,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* LIVE CAMERA CAPTURE VIEW */}
          {sourceType === 'CAMERA' && cameraActive && (
            <div style={{ background: '#000000', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }} />
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 20,
                    padding: '8px 24px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  [ 📸 CAPTURE PHOTO ]
                </button>
                <button
                  type="button"
                  onClick={() => setCameraActive(false)}
                  style={{ background: '#334155', color: '#FFF', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 6, padding: 10, fontSize: 12, marginBottom: 14 }}>
              ⚠️ {cameraError}
            </div>
          )}

          {/* HARDWARE OFFLINE WARNINGS (Requirement 8) */}
          {sourceType === 'DERMASCOPE' && (
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B45309', fontWeight: 800, fontSize: 12.5 }}>
                <AlertCircle size={15} />
                <span>Dermascope Hardware Integration Status: Offline</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#78350F', marginTop: 4 }}>
                No compatible digital dermatoscope detected via USB or Wi-Fi Direct. Please plug in the Dermatoscope camera or upload pre-saved imaging files.
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 8,
                  background: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Browse Dermascope Image File
              </button>
            </div>
          )}

          {sourceType === 'FACE_SCANNER' && (
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B45309', fontWeight: 800, fontSize: 12.5 }}>
                <AlertCircle size={15} />
                <span>3D Facial Scanner Service: Offline</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#78350F', marginTop: 4 }}>
                The local 3D topography scanner daemon (Port 8089) is not responding. Ensure the Visia/VECTRA hardware driver is started or upload exported scanner files.
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 8,
                  background: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Browse Face Scanner Export
              </button>
            </div>
          )}

          {/* PREVIEW OF LOADED IMAGE */}
          {stagedUrl && (
            <div style={{
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              padding: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stagedFileType === 'application/pdf' ? (
                  <FileText size={32} color="#DC2626" />
                ) : (
                  <img src={stagedUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  {stagedFileName}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Type: {stagedFileType} • Size: {stagedFileSize}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Change File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM DATE/TIME & OBSERVATION (Requirements 8 & 10) */}
          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#334155', marginBottom: 8 }}>
              3. CAPTURE DATE/TIME &amp; DOCTOR'S OBSERVATION
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748B', marginBottom: 2 }}>
                  CAPTURE DATE (DD/MM/YYYY):
                </label>
                <input
                  type="text"
                  value={captureDate}
                  onChange={e => setCaptureDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748B', marginBottom: 2 }}>
                  CAPTURE TIME:
                </label>
                <input
                  type="text"
                  value={captureTime}
                  onChange={e => setCaptureTime(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748B', marginBottom: 2 }}>
                DOCTOR'S OBSERVATION / CLINICAL REPORT:
              </label>
              <textarea
                value={doctorObservation}
                onChange={e => setDoctorObservation(e.target.value)}
                placeholder="Write clinical findings, erythema margin, lesion progression, laser response..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 12,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '6px 14px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalSave}
              disabled={!stagedUrl}
              style={{
                background: stagedUrl ? '#036d92' : '#CBD5E1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 800,
                cursor: stagedUrl ? 'pointer' : 'not-allowed',
                boxShadow: stagedUrl ? '0 2px 6px rgba(3, 109, 146, 0.25)' : 'none'
              }}
            >
              ✓ Save to Record
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: SINGLE PHOTO FULLSCREEN VIEWER (Requirement 11)
// Non-looping Prev/Next, Zoom, Edit, Send Image, Close (ESC)
// ============================================================================

interface SinglePhotoViewerModalProps {
  image: ClinicalImage;
  procedureName: string;
  allPhotos: ClinicalImage[];
  onClose: () => void;
  onEdit: () => void;
  onShare: () => void;
  onChangeImage: (next: ClinicalImage) => void;
}

function SinglePhotoViewerModal({
  image,
  procedureName,
  allPhotos,
  onClose,
  onEdit,
  onShare,
  onChangeImage
}: SinglePhotoViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Current photo index in non-looping list
  const currentIndex = allPhotos.findIndex(i => i.id === image.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allPhotos.length - 1;

  const handlePrev = () => {
    if (hasPrevious) {
      setZoom(100);
      setPan({ x: 0, y: 0 });
      onChangeImage(allPhotos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setZoom(100);
      setPan({ x: 0, y: 0 });
      onChangeImage(allPhotos[currentIndex + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) handlePrev();
      if (e.key === 'ArrowRight' && hasNext) handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext, currentIndex]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      color: '#FFFFFF'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(15,23,42,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#38BDF8' }}>
            {procedureName.toUpperCase()}
          </span>
          <span style={{
            background: image.type === 'BEFORE' ? '#D97706' : '#16A34A',
            color: '#FFFFFF',
            fontSize: 10.5,
            fontWeight: 900,
            padding: '2px 8px',
            borderRadius: 4
          }}>
            [{image.type}]
          </span>
          <span style={{ fontSize: 12, color: '#CBD5E1' }}>
            {image.fileName} • Captured: {image.date} {image.time}
          </span>
          {currentIndex >= 0 && (
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              ({currentIndex + 1} of {allPhotos.length})
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 4 }}
          title="Close (ESC)"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Viewing Canvas with Drag / Pan */}
      <div
        onMouseDown={e => {
          isDraggingRef.current = true;
          dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }}
        onMouseMove={e => {
          if (!isDraggingRef.current) return;
          setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
        }}
        onMouseUp={() => { isDraggingRef.current = false; }}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 20,
          cursor: zoom > 100 ? 'grab' : 'default',
          userSelect: 'none'
        }}
      >
        <img
          src={image.url}
          alt={image.fileName}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            maxHeight: '75vh',
            maxWidth: '85vw',
            objectFit: 'contain',
            borderRadius: 6,
            transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease'
          }}
        />
      </div>

      {/* Doctor's Observation Strip (if present) */}
      {image.doctorObservation && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(30, 41, 59, 0.9)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 12,
          color: '#E2E8F0',
          textAlign: 'center'
        }}>
          📝 <strong>Doctor's Observation:</strong> {image.doctorObservation}
        </div>
      )}

      {/* Bottom Control Bar: Prev, Next, Zoom, Edit, Send Image, Close */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderTop: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(15,23,42,0.95)',
        flexWrap: 'wrap'
      }}>
        {/* Previous (Disabled at index 0, non-looping) */}
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={handlePrev}
          style={{
            background: hasPrevious ? '#1E293B' : 'rgba(255,255,255,0.1)',
            color: hasPrevious ? '#FFFFFF' : '#64748B',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '7px 16px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: hasPrevious ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
          title={hasPrevious ? 'Previous photo (Left Arrow)' : 'At beginning of photos'}
        >
          <ArrowLeft size={14} />
          <span>Previous</span>
        </button>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 8px' }}>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(50, z - 25))}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 4 }}
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: 11.5, fontWeight: 800, width: 48, textAlign: 'center' }}>{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(300, z + 25))}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 4 }}
          >
            <ZoomIn size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#CBD5E1', borderRadius: 6, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          Reset View
        </button>

        {/* Edit Photo */}
        <button
          type="button"
          onClick={onEdit}
          style={{
            background: '#036d92',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '7px 16px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Edit3 size={13} />
          <span>Edit &amp; Annotate</span>
        </button>

        {/* Send Image (Requirement 11) */}
        <button
          type="button"
          onClick={onShare}
          style={{
            background: '#059669',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '7px 16px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Send size={13} />
          <span>Send Image</span>
        </button>

        {/* Next (Disabled at last item, non-looping) */}
        <button
          type="button"
          disabled={!hasNext}
          onClick={handleNext}
          style={{
            background: hasNext ? '#1E293B' : 'rgba(255,255,255,0.1)',
            color: hasNext ? '#FFFFFF' : '#64748B',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '7px 16px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: hasNext ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
          title={hasNext ? 'Next photo (Right Arrow)' : 'At end of photos'}
        >
          <span>Next</span>
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid #475569',
            color: '#CBD5E1',
            borderRadius: 6,
            padding: '7px 16px',
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          Close (ESC)
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: PHOTO EDITOR (Requirement 9)
// Zoom, Rotate, Crop, Pan, Clinical Annotations, Save & Cancel
// ============================================================================

interface PhotoEditorModalProps {
  image: ClinicalImage;
  onClose: () => void;
  onSave: (img: ClinicalImage) => void;
}

function PhotoEditorModal({ image, onClose, onSave }: PhotoEditorModalProps) {
  const [zoom, setZoom] = useState(image.edits?.zoom || 100);
  const [rotation, setRotation] = useState(image.edits?.rotation || 0);
  const [pan, setPan] = useState({ x: image.edits?.panX || 0, y: image.edits?.panY || 0 });
  const [isCropActive, setIsCropActive] = useState(false);
  const [isMarkActive, setIsMarkActive] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(CLINICAL_MARKERS[0]);
  const [annotations, setAnnotations] = useState<ClinicalAnnotation[]>(image.edits?.annotations || []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Redraw canvas with image, rotation, and annotations
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = loadedImageRef.current;
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    } else {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // Draw annotations
    annotations.forEach(ann => {
      // 1. Point dot
      ctx.fillStyle = ann.color;
      ctx.beginPath();
      ctx.arc(ann.x, ann.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 2. Badge label
      ctx.font = 'bold 13px sans-serif';
      const textWidth = ctx.measureText(ann.label).width;
      const bW = textWidth + 18;
      const bH = 24;
      const bX = ann.x - bW / 2;
      const bY = ann.y - 32;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bX, bY, bW, bH, 6);
      } else {
        ctx.rect(bX, bY, bW, bH);
      }
      ctx.fill();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(ann.label, bX + 9, bY + 16);
    });
  }, [rotation, annotations]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.originalUrl || image.url;
    img.onload = () => {
      loadedImageRef.current = img;
      redrawCanvas();
    };
  }, [image.originalUrl, image.url, redrawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMarkActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newAnn: ClinicalAnnotation = {
      id: `ann-${Date.now()}`,
      x,
      y,
      type: selectedMarker.id,
      label: selectedMarker.label,
      color: selectedMarker.color
    };
    setAnnotations(prev => [...prev, newAnn]);
  };

  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop 10% inward as demonstration of crop function
    const cropX = canvas.width * 0.1;
    const cropY = canvas.height * 0.1;
    const cropW = canvas.width * 0.8;
    const cropH = canvas.height * 0.8;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);
    canvas.width = cropW;
    canvas.height = cropH;
    ctx.putImageData(croppedData, 0, 0);

    // Save as new loaded base image
    const croppedImg = new Image();
    croppedImg.src = canvas.toDataURL('image/jpeg', 0.92);
    croppedImg.onload = () => {
      loadedImageRef.current = croppedImg;
      setIsCropActive(false);
    };
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    onSave({
      ...image,
      url: finalDataUrl,
      originalUrl: image.originalUrl || image.url,
      edits: {
        zoom,
        rotation,
        panX: pan.x,
        panY: pan.y,
        annotations
      }
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        width: '92%',
        maxWidth: 760,
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px',
          background: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={16} />
            <span style={{ fontSize: 14, fontWeight: 900 }}>CLINICAL IMAGE EDITOR &amp; LESION ANNOTATION</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Viewport */}
        <div style={{
          background: '#020617',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: 380
        }}>
          <div style={{
            transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
            transition: 'transform 0.1s ease',
            position: 'relative'
          }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: 400,
                cursor: isMarkActive ? 'crosshair' : 'default',
                borderRadius: 4
              }}
            />

            {isCropActive && (
              <div style={{
                position: 'absolute',
                inset: 30,
                border: '2px dashed #036d92',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(3,109,146,0.15)'
              }}>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  style={{
                    background: '#036d92',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Apply Crop
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls Toolbar (Requirement 9: Zoom, Crop, Rotate, Mark, Pan) */}
        <div style={{
          padding: '10px 18px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, padding: '2px 6px' }}>
              <button onClick={() => setZoom(z => Math.max(50, z - 25))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 800, width: 44, textAlign: 'center' }}>{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(250, z + 25))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCw size={13} />
              <span>Rotate 90°</span>
            </button>

            {/* Crop */}
            <button
              type="button"
              onClick={() => setIsCropActive(prev => !prev)}
              style={{
                background: isCropActive ? '#036d92' : '#FFFFFF',
                color: isCropActive ? '#FFFFFF' : '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Crop size={13} />
              <span>Crop</span>
            </button>

            {/* Mark / Annotations */}
            <button
              type="button"
              onClick={() => setIsMarkActive(prev => !prev)}
              style={{
                background: isMarkActive ? '#036d92' : '#FFFFFF',
                color: isMarkActive ? '#FFFFFF' : '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Edit3 size={13} />
              <span>Annotate / Markers ({annotations.length})</span>
            </button>

            {annotations.length > 0 && (
              <button
                type="button"
                onClick={() => setAnnotations([])}
                style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear Marks
              </button>
            )}
          </div>

          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
            {image.fileName}
          </div>
        </div>

        {/* Clinical Marker Selector Bar */}
        {isMarkActive && (
          <div style={{ padding: '8px 18px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>MARKER:</span>
            {CLINICAL_MARKERS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMarker(m)}
                style={{
                  background: selectedMarker.id === m.id ? m.color : '#FFFFFF',
                  color: selectedMarker.id === m.id ? '#FFFFFF' : '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: 12,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {m.label}
              </button>
            ))}
            <span style={{ fontSize: 10, color: '#64748B', marginLeft: 6 }}>(Click anywhere on the photo to stamp lesion mark)</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '6px 14px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: '#036d92',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '8px 22px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ✓ Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: MULTI-PHOTO COMPARISON (Requirement 12)
// Independent Zoom and Pan per panel, Reset View, Close (ESC)
// ============================================================================

interface MultiPhotoCompareModalProps {
  photos: ClinicalImage[];
  procedureName: string;
  onClose: () => void;
}

function MultiPhotoCompareModal({ photos, procedureName, onClose }: MultiPhotoCompareModalProps) {
  // ESC key support to return to gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Independent zoom and pan state for EACH panel, keyed by stable image ID
  const [panelStates, setPanelStates] = useState<{ [id: string]: { zoom: number; panX: number; panY: number } }>({});

  const getPanelState = (id: string) => {
    return panelStates[id] || { zoom: 100, panX: 0, panY: 0 };
  };

  const updatePanelZoom = (id: string, delta: number) => {
    setPanelStates(prev => {
      const curr = prev[id] || { zoom: 100, panX: 0, panY: 0 };
      const nextZoom = Math.min(400, Math.max(50, curr.zoom + delta));
      return { ...prev, [id]: { ...curr, zoom: nextZoom } };
    });
  };

  const updatePanelPan = (id: string, panX: number, panY: number) => {
    setPanelStates(prev => {
      const curr = prev[id] || { zoom: 100, panX: 0, panY: 0 };
      return { ...prev, [id]: { ...curr, panX, panY } };
    });
  };

  // Reset View: restores default 100% zoom and (0,0) pan without modifying images or saved edits
  const handleResetAllViews = () => {
    setPanelStates({});
  };

  const isTwoImages = photos.length === 2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Photo Comparison"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        color: '#FFFFFF'
      }}
    >
      {/* Top Header */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(15,23,42,0.9)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SplitSquareVertical size={18} color="#38BDF8" />
          <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.02em' }}>
            CLINICAL PHOTO COMPARISON ({photos.length} IMAGES)
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            • {procedureName} • Independent Zoom &amp; Drag
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Comparison"
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 4 }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Panels Grid: Equal 50/50 split for 2 images; Responsive grid for 3+ */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isTwoImages ? '1fr 1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: isTwoImages ? 16 : 16,
        padding: 16,
        overflow: 'auto',
        alignItems: 'stretch'
      }}>
        {photos.map((img, idx) => {
          const pState = getPanelState(img.id);

          return (
            <div
              key={img.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRight: isTwoImages && idx === 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                paddingRight: isTwoImages && idx === 0 ? 12 : 0
              }}
            >
              <ComparisonPanel
                image={img}
                procedureName={procedureName}
                panelIndex={idx}
                zoom={pState.zoom}
                panX={pState.panX}
                panY={pState.panY}
                onZoomIn={() => updatePanelZoom(img.id, 25)}
                onZoomOut={() => updatePanelZoom(img.id, -25)}
                onPan={(x, y) => updatePanelPan(img.id, x, y)}
                onReset={() => {
                  setPanelStates(prev => ({
                    ...prev,
                    [img.id]: { zoom: 100, panX: 0, panY: 0 }
                  }));
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Global Control Bar */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        borderTop: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(15,23,42,0.95)'
      }}>
        <button
          type="button"
          onClick={handleResetAllViews}
          style={{
            background: '#1E293B',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '7px 18px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={13} />
          <span>Reset All Views</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#036d92',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '7px 24px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Close (ESC)
        </button>
      </div>
    </div>
  );
}

// Single comparison panel with independent zoom & pan
interface ComparisonPanelProps {
  image: ClinicalImage;
  procedureName: string;
  panelIndex: number;
  zoom: number;
  panX: number;
  panY: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (x: number, y: number) => void;
  onReset: () => void;
}

function ComparisonPanel({
  image,
  procedureName,
  panelIndex,
  zoom,
  panX,
  panY,
  onZoomIn,
  onZoomOut,
  onPan,
  onReset
}: ComparisonPanelProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Smooth mouse drag & pan handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only main left click
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      onPan(
        moveEvent.clientX - dragStartRef.current.x,
        moveEvent.clientY - dragStartRef.current.y
      );
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isBefore = image.type === 'BEFORE';
  const typeBg = isBefore ? '#D97706' : '#16A34A';
  const headerBg = isBefore ? 'rgba(180, 83, 9, 0.45)' : 'rgba(21, 128, 61, 0.45)';

  return (
    <div style={{
      background: '#0F172A',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flex: 1,
      minHeight: 380
    }}>
      {/* Panel Header */}
      <div style={{
        padding: '10px 14px',
        background: headerBg,
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: typeBg,
            color: '#FFFFFF',
            fontSize: 10.5,
            fontWeight: 900,
            padding: '2px 8px',
            borderRadius: 4,
            letterSpacing: '0.05em'
          }}>
            {image.type}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#F8FAFC' }}>
            {image.fileName}
          </span>
          {/* Small white box with black text for capture date/time (Requirement 10) */}
          <span style={{
            background: '#FFFFFF',
            color: '#000000',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 3,
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            {image.date} {image.time}
          </span>
        </div>

        {/* Panel Local Zoom & Pan Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 6,
            padding: '2px 6px',
            gap: 4
          }}>
            <button
              type="button"
              onClick={onZoomOut}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2
              }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, minWidth: 42, textAlign: 'center', color: '#38BDF8' }}>
              {zoom}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2
              }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              color: '#CBD5E1',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              cursor: 'pointer'
            }}
            title="Reset position and zoom for this image"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Panel Canvas Area (Independent Pan via mouse drag) */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          flex: 1,
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 12,
          position: 'relative',
          cursor: isDragging ? 'grabbing' : (zoom > 100 ? 'grab' : 'default'),
          userSelect: 'none',
          background: '#020617'
        }}
      >
        {/* Loading Spinner */}
        {!imgLoaded && !imgError && (
          <div style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            color: '#94A3B8',
            fontSize: 12
          }}>
            <RefreshCw size={20} className="animate-spin" />
            <span>Loading clinical photo...</span>
          </div>
        )}

        {/* Error Fallback */}
        {imgError && (
          <div style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            color: '#F87171',
            fontSize: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <AlertTriangle size={28} color="#EF4444" />
            <span style={{ fontWeight: 800 }}>Unable to load clinical photo</span>
            <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{image.fileName}</span>
          </div>
        )}

        {/* Image with Independent Zoom and Pan */}
        <img
          src={image.url}
          alt={image.fileName}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgLoaded(true);
            setImgError(true);
          }}
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
            maxHeight: '58vh',
            maxWidth: '100%',
            objectFit: 'contain',
            transition: isDragging ? 'none' : 'transform 0.12s ease',
            pointerEvents: 'none',
            display: imgError ? 'none' : 'block'
          }}
        />
      </div>

      {/* Observation or Meta Snippet */}
      <div style={{
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.6)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: '#94A3B8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Source: {image.source}</span>
          {image.fileSize && <span>• {image.fileSize}</span>}
          {panX !== 0 || panY !== 0 ? (
            <span style={{ color: '#38BDF8', fontSize: 10 }}>[Pan: {Math.round(panX)}px, {Math.round(panY)}px]</span>
          ) : null}
        </div>
        {image.doctorObservation && (
          <div style={{ color: '#F1F5F9', fontWeight: 600, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📝 {image.doctorObservation}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: SEND / SHARE IMAGE (Requirement 11)
// WhatsApp, Patient Email, Download Package, Gateway status
// ============================================================================

interface SendImageModalProps {
  image: ClinicalImage;
  patient?: any;
  onClose: () => void;
}

function SendImageModal({ image, patient, onClose }: SendImageModalProps) {
  const [recipientPhone, setRecipientPhone] = useState(patient?.phone || '+91 98251 00099');
  const [recipientEmail, setRecipientEmail] = useState(patient?.email || 'patient@medflow.clinic');
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handleDownloadDirect = () => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = image.fileName || `MedFlow_Clinical_Image_${image.date.replace(/\//g, '-')}.jpg`;
    a.click();
    setShareStatus('✓ High-resolution photo exported directly to your computer!');
  };

  const handleSendWhatsApp = () => {
    const phoneClean = recipientPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello ${patient?.firstName || 'Patient'},\nHere is your clinical photography record from MedFlow Clinic dated ${image.date} ${image.time}.\nObservation: ${image.doctorObservation || 'Routine clinical procedure follow-up'}.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${message}`, '_blank');
    setShareStatus(`✓ Opened WhatsApp messaging for ${recipientPhone}.`);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`MedFlow Clinical Photography Report - ${image.date}`);
    const body = encodeURIComponent(
      `Dear ${patient?.firstName || 'Patient'},\n\nPlease find attached your clinical procedure image taken on ${image.date} at ${image.time}.\n\nObservation: ${image.doctorObservation || 'Normal progress'}\n\nMedFlow Dermatology Clinic`
    );
    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, '_blank');
    setShareStatus(`✓ Opened email client addressed to ${recipientEmail}.`);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        width: '90%',
        maxWidth: 480,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '14px 20px',
          background: '#059669',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={16} />
            <span style={{ fontSize: 14, fontWeight: 900 }}>SHARE CLINICAL PHOTO</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={image.url} alt="Thumbnail" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid #E2E8F0' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{image.fileName}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{image.date} {image.time} • [{image.type}]</div>
            </div>
          </div>

          {shareStatus && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
              {shareStatus}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Direct Export */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                1. Direct File Export / Download
              </div>
              <button
                type="button"
                onClick={handleDownloadDirect}
                style={{
                  background: '#036d92',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Download size={13} />
                <span>Export High-Res JPEG</span>
              </button>
            </div>

            {/* WhatsApp */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                2. Send to Patient via WhatsApp
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Email */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                3. Email Clinical Record
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Email
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: ADMIN EDIT METADATA (Requirement 10)
// Allows Admins to correct capture date/time and edit doctor's observation
// ============================================================================

interface AdminMetadataEditModalProps {
  image: ClinicalImage;
  onClose: () => void;
  onSave: (imgId: string, newDate: string, newTime: string, newObservation: string) => void;
}

function AdminMetadataEditModal({ image, onClose, onSave }: AdminMetadataEditModalProps) {
  const [date, setDate] = useState(image.date);
  const [time, setTime] = useState(image.time);
  const [observation, setObservation] = useState(image.doctorObservation || '');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{ background: '#FFFFFF', borderRadius: 12, width: '90%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '12px 18px', background: '#D97706', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} />
            <span style={{ fontSize: 14, fontWeight: 900 }}>ADMIN: EDIT PHOTO METADATA</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                CAPTURE DATE:
              </label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                CAPTURE TIME:
              </label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
              DOCTOR'S OBSERVATION / REPORT:
            </label>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12, cursor: 'pointer', padding: '6px 12px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(image.id, date, time, observation)}
              style={{ background: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
            >
              ✓ Save Metadata
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: PDF DOCUMENT VIEWER (Requirement 9)
// Embeds / views PDF documents without exposing raster image editing tools
// ============================================================================

interface PdfDocumentViewerModalProps {
  image: ClinicalImage;
  onClose: () => void;
}

function PdfDocumentViewerModal({ image, onClose }: PdfDocumentViewerModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{ background: '#FFFFFF', borderRadius: 12, width: '90%', maxWidth: 780, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#DC2626" />
            <span style={{ fontSize: 14, fontWeight: 900 }}>PDF CLINICAL DOCUMENT VIEWER: {image.fileName}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, background: '#F1F5F9', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <iframe
            src={image.url}
            title={image.fileName}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 6, background: '#FFFFFF' }}
          />
        </div>

        <div style={{ padding: '10px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#64748B' }}>
            Captured: {image.date} {image.time} • Size: {image.fileSize || 'PDF'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={image.url}
              download={image.fileName}
              style={{
                background: '#036d92',
                color: '#FFFFFF',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Download size={13} />
              <span>Download PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#CBD5E1', color: '#0F172A', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: ADMIN DEVICE SETTINGS (Requirement 8)
// ============================================================================

interface AdminDeviceSettingsModalProps {
  configs: DeviceIntegrationConfig[];
  onClose: () => void;
  onSave: (updated: DeviceIntegrationConfig[]) => void;
}

function AdminDeviceSettingsModal({ configs, onClose, onSave }: AdminDeviceSettingsModalProps) {
  const [devices, setDevices] = useState<DeviceIntegrationConfig[]>(configs);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{ background: '#FFFFFF', borderRadius: 12, width: '90%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '12px 18px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} />
            <span style={{ fontSize: 14, fontWeight: 900 }}>ADMIN: HARDWARE DEVICE INTEGRATIONS</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
            Configure active medical imaging devices and integration parameters for Dermascope and 3D Face Scanner interfaces.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
            {devices.map((dev, idx) => (
              <div key={dev.id} style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    {dev.name}
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={dev.enabled}
                      onChange={e => {
                        const next = [...devices];
                        next[idx].enabled = e.target.checked;
                        setDevices(next);
                      }}
                    />
                    <span>{dev.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                <div style={{ fontSize: 11, color: dev.status === 'ONLINE' ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                  Status: {dev.status} • {dev.statusMessage}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(devices)}
              style={{ background: '#036d92', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
