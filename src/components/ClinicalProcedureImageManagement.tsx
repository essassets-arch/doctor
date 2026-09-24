'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Upload, Search, Plus, Eye, Edit3, Trash2, X, Check,
  ChevronRight, ChevronDown, RotateCw, RotateCcw, ZoomIn, ZoomOut,
  Maximize2, ArrowLeft, ArrowRight, Layers, FileText, SplitSquareVertical,
  Scissors, Sliders, RefreshCw, Send, CheckSquare, Square, Lock,
  Move, Circle, Square as SquareIcon, Type, MapPin, Sparkles, Filter,
  Calendar, Clock, CheckCircle2, AlertCircle, Info, HardDrive, Shield, GripVertical
} from 'lucide-react';

// ============================================================================
// Types & Hierarchy
// PATIENT -> PROCEDURE -> SESSION -> SECTION -> BEFORE/AFTER -> IMAGES
// ============================================================================

export interface ClinicalImage {
  id: string;
  url: string;
  type: 'BEFORE' | 'AFTER' | 'GENERAL';
  date: string; // DD/MM/YYYY
  time: string; // hh:mm A
  fileName: string;
  fileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileSize?: string;
  source: 'UPLOAD' | 'CAMERA' | 'DERMASCOPE' | 'FACE_SCANNER' | 'PDF';
  notes?: string;
  annotations?: string; // serialized canvas/mark data
  zoom?: number;
  rotation?: number;
}

export interface ClinicalSubSection {
  id: string;
  name: string;
  createdAt: string; // DD/MM/YYYY hh:mm A
  images: ClinicalImage[];
}

export interface ClinicalSection {
  id: string;
  name: string; // e.g., "Section 1", "Section 2"
  beforeImages: ClinicalImage[];
  afterImages: ClinicalImage[];
  subSections: ClinicalSubSection[];
  activeSubSectionId?: string; // 'main' or sub-section id
}

export interface ClinicalSession {
  id: string;
  sessionNumber: number;
  date: string; // DD/MM/YYYY
  sections: ClinicalSection[];
  activeSectionId: string;
  isExpanded?: boolean;
}

export interface ClinicalProcedure {
  id: string;
  name: string; // e.g. "Hair Removal", "PRP", "Peeling"
  category: string;
  createdAt: string; // DD/MM/YYYY
  therapist?: string;
  bodyPart?: string;
  sessions: ClinicalSession[];
  doctorObservation?: string;
}

// Master Catalog of Clinical Procedures Only (No billing/admin/follow-up)
export const MASTER_PROCEDURE_CATALOG = [
  { name: 'PRP (Platelet-Rich Plasma) Therapy', shortName: 'PRP', category: 'Aesthetic / Regenerative' },
  { name: 'Hair Removal (Diode / Alexandrite)', shortName: 'Hair Removal', category: 'Laser Therapy' },
  { name: 'Chemical Peeling & Resurfacing', shortName: 'Peeling', category: 'Cosmetology' },
  { name: 'Acne & Active Lesion Treatment', shortName: 'Acne Treatment', category: 'Dermatology' },
  { name: 'Pimples & Comedone Extraction', shortName: 'Pimples Treatment', category: 'Dermatology' },
  { name: 'Scar Subcision & Laser Revision', shortName: 'Scar Treatment', category: 'Laser & Surgical' },
  { name: 'Skin Rejuvenation & Photo-Facial', shortName: 'Skin Rejuvenation', category: 'Aesthetic' },
];

// Helper to format Date & Time
export function getBrowserDateTime() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, '0');
  return {
    date: `${d}/${m}/${y}`,
    time: `${strHours}:${minutes} ${ampm}`,
    full: `${d}/${m}/${y} ${strHours}:${minutes} ${ampm}`
  };
}

// Helper to parse DD/MM/YYYY into timestamp for accurate chronological sorting
export function parseClinicalDate(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.trim().split(/[\/\-\.]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d).getTime();
  }
  return 0;
}

// Inline SVGs for clinical demo imagery with realistic medical lesion/laser aesthetics
const DEMO_BEFORE_SVG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23fce7dc"/><circle cx="300" cy="225" r="160" fill="%23f5ceb8"/><ellipse cx="270" cy="190" rx="40" ry="25" fill="%23e89c82" opacity="0.6"/><ellipse cx="340" cy="210" rx="30" ry="20" fill="%23e89c82" opacity="0.5"/><circle cx="280" cy="180" r="4" fill="%2385311b"/><circle cx="265" cy="195" r="3" fill="%2385311b"/><circle cx="345" cy="215" r="5" fill="%2385311b"/><circle cx="310" cy="245" r="3" fill="%2385311b"/><circle cx="295" cy="210" r="4" fill="%2385311b"/><circle cx="330" cy="175" r="3.5" fill="%2385311b"/><rect x="20" y="20" width="130" height="32" rx="6" fill="%23b91c1c" opacity="0.9"/><text x="85" y="42" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">BEFORE • BASELINE</text><text x="300" y="420" fill="%236b3b24" font-size="14" font-family="monospace" font-weight="bold" text-anchor="middle">LESION AREA: PRE-TREATMENT DENSITY (HIGH)</text></svg>`;

const DEMO_AFTER_SVG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23fce7dc"/><circle cx="300" cy="225" r="160" fill="%23fceddf"/><ellipse cx="270" cy="190" rx="20" ry="12" fill="%23f0baa6" opacity="0.3"/><circle cx="280" cy="180" r="1.5" fill="%23c4735c" opacity="0.6"/><circle cx="345" cy="215" r="1.5" fill="%23c4735c" opacity="0.6"/><rect x="20" y="20" width="130" height="32" rx="6" fill="%2315803d" opacity="0.9"/><text x="85" y="42" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">AFTER • SESSION 2</text><text x="300" y="420" fill="%23166534" font-size="14" font-family="monospace" font-weight="bold" text-anchor="middle">85% FOLLICULAR REDUCTION • CLEAR CLEARANCE</text></svg>`;

const DEMO_BEFORE_SVG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23fcf3e8"/><circle cx="300" cy="220" r="150" fill="%23f6dec5"/><path d="M220 180 Q300 240 380 180" stroke="%23c06d4e" stroke-width="12" fill="none" opacity="0.5"/><circle cx="250" cy="200" r="6" fill="%239e2a1b"/><circle cx="320" cy="230" r="8" fill="%239e2a1b"/><circle cx="350" cy="190" r="5" fill="%239e2a1b"/><rect x="20" y="20" width="120" height="32" rx="6" fill="%23b91c1c"/><text x="80" y="42" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">BEFORE</text><text x="300" y="420" fill="%2355321d" font-size="13" font-family="monospace" text-anchor="middle">ATROPHIC ACNE SCARRING (GRADE 3)</text></svg>`;

const DEMO_AFTER_SVG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23fcf3e8"/><circle cx="300" cy="220" r="150" fill="%23faebd9"/><path d="M220 180 Q300 240 380 180" stroke="%23dfa289" stroke-width="4" fill="none" opacity="0.3"/><circle cx="250" cy="200" r="2" fill="%23c9816d" opacity="0.4"/><rect x="20" y="20" width="120" height="32" rx="6" fill="%2315803d"/><text x="80" y="42" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">AFTER</text><text x="300" y="420" fill="%23166534" font-size="13" font-family="monospace" text-anchor="middle">POST-PEEL & PRP: COLLAGEN REMODELING</text></svg>`;

// Isolated Frontend-Only Demo Dataset
const INITIAL_DEMO_PROCEDURES: ClinicalProcedure[] = [
  {
    id: 'proc-demo-1',
    name: 'Hair Removal',
    category: 'Laser Therapy',
    createdAt: '26/02/2026',
    therapist: 'Dr Valaki',
    bodyPart: 'FACE',
    doctorObservation: 'Fitzpatrick Type II. Good response to Diode 808nm laser. Marked reduction in chin and cheek coarse terminal hairs. Mild transient erythema resolved within 2 hours. Strict SPF 50+ prescribed.',
    sessions: [
      {
        id: 'sess-1',
        sessionNumber: 1,
        date: '10/04/2026',
        activeSectionId: 'sec-1',
        isExpanded: true,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [
              {
                id: 'img-1-1',
                url: DEMO_BEFORE_SVG_1,
                type: 'BEFORE',
                date: '10/04/2026',
                time: '03:42 PM',
                fileName: 'Chin_Lateral_Before.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.4 MB',
                source: 'CAMERA',
                notes: 'Baseline follicular prominence prior to laser pulse'
              }
            ],
            afterImages: [
              {
                id: 'img-1-2',
                url: DEMO_AFTER_SVG_1,
                type: 'AFTER',
                date: '10/04/2026',
                time: '04:15 PM',
                fileName: 'Chin_Lateral_After_S1.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.2 MB',
                source: 'CAMERA',
                notes: 'Immediate post-treatment perifollicular edema response'
              }
            ],
            subSections: [
              {
                id: 'subsec-1',
                name: 'Sub-Section 1 (Perioral Angle)',
                createdAt: '10/04/2026 03:54 PM',
                images: [
                  {
                    id: 'img-1-sub-1',
                    url: DEMO_BEFORE_SVG_2,
                    type: 'GENERAL',
                    date: '10/04/2026',
                    time: '03:54 PM',
                    fileName: 'Perioral_HighMag.jpg',
                    fileType: 'image/jpeg',
                    fileSize: '950 KB',
                    source: 'DERMASCOPE',
                    notes: 'Micro-evaluation of upper lip follicle density'
                  }
                ]
              }
            ],
            activeSubSectionId: 'main'
          },
          {
            id: 'sec-2',
            name: 'Section 2',
            beforeImages: [
              {
                id: 'img-2-1',
                url: DEMO_BEFORE_SVG_2,
                type: 'BEFORE',
                date: '10/04/2026',
                time: '03:48 PM',
                fileName: 'Left_Cheek_Before.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.1 MB',
                source: 'UPLOAD',
                notes: 'Left malar zone pre-procedure'
              }
            ],
            afterImages: [
              {
                id: 'img-2-2',
                url: DEMO_AFTER_SVG_2,
                type: 'AFTER',
                date: '10/04/2026',
                time: '04:20 PM',
                fileName: 'Left_Cheek_After.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.3 MB',
                source: 'UPLOAD',
                notes: 'Smooth skin texture post cooling'
              }
            ],
            subSections: [],
            activeSubSectionId: 'main'
          },
          {
            id: 'sec-3',
            name: 'Section 3',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          },
          {
            id: 'sec-4',
            name: 'Section 4',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          },
          {
            id: 'sec-5',
            name: 'Section 5',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      },
      {
        id: 'sess-2',
        sessionNumber: 2,
        date: '24/04/2026',
        activeSectionId: 'sec-1',
        isExpanded: false,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [
              {
                id: 'img-s2-1',
                url: DEMO_AFTER_SVG_1,
                type: 'BEFORE',
                date: '24/04/2026',
                time: '11:15 AM',
                fileName: 'Session2_PreCheck.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.2 MB',
                source: 'CAMERA',
                notes: 'Regrowth assessment before session 2'
              }
            ],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      },
      {
        id: 'sess-3',
        sessionNumber: 3,
        date: '08/05/2026',
        activeSectionId: 'sec-1',
        isExpanded: false,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      },
      {
        id: 'sess-4',
        sessionNumber: 4,
        date: '22/05/2026',
        activeSectionId: 'sec-1',
        isExpanded: false,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      }
    ]
  },
  {
    id: 'proc-demo-2',
    name: 'PRP',
    category: 'Aesthetic / Regenerative',
    createdAt: '02/02/2026',
    therapist: 'Dr Valaki',
    bodyPart: 'SCALP',
    doctorObservation: 'Vertex and frontal thinning. 10ml autologous platelet-rich plasma derived. Micro-needling 1.5mm applied followed by subdermal boluses.',
    sessions: [
      {
        id: 'sess-prp-1',
        sessionNumber: 1,
        date: '02/02/2026',
        activeSectionId: 'sec-1',
        isExpanded: true,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [
              {
                id: 'img-prp-1',
                url: DEMO_BEFORE_SVG_1,
                type: 'BEFORE',
                date: '02/02/2026',
                time: '10:30 AM',
                fileName: 'Vertex_Hair_Baseline.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.5 MB',
                source: 'CAMERA',
                notes: 'Scalp trichoscopy baseline'
              }
            ],
            afterImages: [
              {
                id: 'img-prp-2',
                url: DEMO_AFTER_SVG_1,
                type: 'AFTER',
                date: '02/02/2026',
                time: '11:45 AM',
                fileName: 'Vertex_PostPRP.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.4 MB',
                source: 'CAMERA',
                notes: 'Immediate post-injection scalp condition'
              }
            ],
            subSections: [],
            activeSubSectionId: 'main'
          },
          {
            id: 'sec-2',
            name: 'Section 2',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      },
      {
        id: 'sess-prp-2',
        sessionNumber: 2,
        date: '02/03/2026',
        activeSectionId: 'sec-1',
        isExpanded: false,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      }
    ]
  },
  {
    id: 'proc-demo-3',
    name: 'Peeling',
    category: 'Cosmetology',
    createdAt: '16/03/2026',
    therapist: 'Dr Valaki',
    bodyPart: 'FULL FACE',
    doctorObservation: 'Salicylic-Mandelic 20% combo chemical peel for post-inflammatory erythema & epidermal hyperpigmentation. Frosting observed at zone 2.',
    sessions: [
      {
        id: 'sess-peel-1',
        sessionNumber: 1,
        date: '16/03/2026',
        activeSectionId: 'sec-1',
        isExpanded: true,
        sections: [
          {
            id: 'sec-1',
            name: 'Section 1',
            beforeImages: [
              {
                id: 'img-peel-1',
                url: DEMO_BEFORE_SVG_2,
                type: 'BEFORE',
                date: '16/03/2026',
                time: '02:15 PM',
                fileName: 'Peeling_Baseline_Malar.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.6 MB',
                source: 'CAMERA',
                notes: 'Pre-peel hyperpigmented macules baseline'
              }
            ],
            afterImages: [
              {
                id: 'img-peel-2',
                url: DEMO_AFTER_SVG_2,
                type: 'AFTER',
                date: '16/03/2026',
                time: '03:45 PM',
                fileName: 'Peeling_PostFrosting.jpg',
                fileType: 'image/jpeg',
                fileSize: '1.5 MB',
                source: 'DERMASCOPE',
                notes: 'Post chemical neutralization and soothing barrier applied'
              }
            ],
            subSections: [],
            activeSubSectionId: 'main'
          }
        ]
      }
    ]
  }
];

// Props
interface ClinicalProcedureTabProps {
  patient?: any;
}

export default function ClinicalProcedureImageManagement({ patient }: ClinicalProcedureTabProps) {
  // Master frontend state for procedures
  const [procedures, setProcedures] = useState<ClinicalProcedure[]>(INITIAL_DEMO_PROCEDURES);

  // Active view: 'list' (All procedures) or 'detail' (Specific procedure)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('proc-demo-1');

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'az' | 'za'>('recent');

  // Add Procedure Modal state
  const [isAddProcedureModalOpen, setIsAddProcedureModalOpen] = useState(false);
  const [manualProcedureName, setManualProcedureName] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Selected Images for Comparison State
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  // Modals & Viewers State
  const [fullscreenImage, setFullscreenImage] = useState<{ image: ClinicalImage; contextImages: ClinicalImage[] } | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [editorImage, setEditorImage] = useState<ClinicalImage | null>(null);

  // Add Image Flow State
  const [addImageModalState, setAddImageModalState] = useState<{
    isOpen: boolean;
    step: 'before_after' | 'source';
    targetType: 'BEFORE' | 'AFTER';
    procedureId: string;
    sessionId: string;
    sectionId: string;
    subSectionId?: string;
  }>({
    isOpen: false,
    step: 'before_after',
    targetType: 'BEFORE',
    procedureId: '',
    sessionId: '',
    sectionId: ''
  });

  // Source Modals: Camera, Dermascope, Face Scanner, Error Alert
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDermascopeOpen, setIsDermascopeOpen] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const [procedureDisplayMode, setProcedureDisplayMode] = useState<'table' | 'cards'>('table');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Section Context Menu & Rename state
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    sectionId: string;
    sessionId: string;
  } | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard Navigation: ESC closes viewers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) setFullscreenImage(null);
        if (isCompareOpen) setIsCompareOpen(false);
        if (editorImage) setEditorImage(null);
        if (isCameraOpen) handleCloseCamera();
        if (isDermascopeOpen) setIsDermascopeOpen(false);
        if (isFaceScannerOpen) setIsFaceScannerOpen(false);
        if (addImageModalState.isOpen) setAddImageModalState(prev => ({ ...prev, isOpen: false }));
        if (isAddProcedureModalOpen) setIsAddProcedureModalOpen(false);
        if (contextMenuState) setContextMenuState(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, isCompareOpen, editorImage, isCameraOpen, isDermascopeOpen, isFaceScannerOpen, addImageModalState, isAddProcedureModalOpen, contextMenuState]);

  // Close context menu on document click
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuState) setContextMenuState(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenuState]);

  // Selected Procedure
  const activeProcedure = useMemo(() => {
    return procedures.find(p => p.id === selectedProcedureId) || procedures[0];
  }, [procedures, selectedProcedureId]);

  // Filtered & Sorted Procedures List
  const filteredProcedures = useMemo(() => {
    let result = [...procedures];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.createdAt.includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      if (sortBy === 'oldest') return parseClinicalDate(a.createdAt) - parseClinicalDate(b.createdAt);
      return parseClinicalDate(b.createdAt) - parseClinicalDate(a.createdAt); // recent first
    });

    return result;
  }, [procedures, searchQuery, sortBy]);

  // All Images across ALL patient procedures (enables Cross-Procedure Compare: "BETWEEN 2 PROSSUSUER")
  const allPatientImages = useMemo(() => {
    const list: Array<ClinicalImage & { procedureName: string; procedureId: string; sessionNumber: number; sectionName: string }> = [];
    procedures.forEach(proc => {
      proc.sessions.forEach(sess => {
        sess.sections.forEach(sec => {
          sec.beforeImages.forEach(img => {
            list.push({ ...img, procedureName: proc.name, procedureId: proc.id, sessionNumber: sess.sessionNumber, sectionName: sec.name });
          });
          sec.afterImages.forEach(img => {
            list.push({ ...img, procedureName: proc.name, procedureId: proc.id, sessionNumber: sess.sessionNumber, sectionName: sec.name });
          });
          sec.subSections.forEach(sub => {
            sub.images.forEach(img => {
              list.push({ ...img, procedureName: proc.name, procedureId: proc.id, sessionNumber: sess.sessionNumber, sectionName: `${sec.name} / ${sub.name}` });
            });
          });
        });
      });
    });
    return list;
  }, [procedures]);

  // All Images across the active procedure (for lookup / compare)
  const allActiveProcedureImages = useMemo(() => {
    if (!activeProcedure) return [];
    const list: ClinicalImage[] = [];
    activeProcedure.sessions.forEach(sess => {
      sess.sections.forEach(sec => {
        list.push(...sec.beforeImages);
        list.push(...sec.afterImages);
        sec.subSections.forEach(sub => {
          list.push(...sub.images);
        });
      });
    });
    return list;
  }, [activeProcedure]);

  // Selected Images for Compare
  const selectedImagesForCompare = useMemo(() => {
    return allPatientImages.filter(img => selectedImageIds.includes(img.id));
  }, [allPatientImages, selectedImageIds]);

  // ==========================================================================
  // Handlers: Procedure Management
  // ==========================================================================

  const handleAddProcedure = (procName: string, category: string = 'Clinical Dermatology') => {
    if (!procName.trim()) return;
    const { date } = getBrowserDateTime();
    const newProc: ClinicalProcedure = {
      id: `proc-${Date.now()}`,
      name: procName.trim(),
      category,
      createdAt: date,
      therapist: 'Dr Valaki',
      bodyPart: 'CLINICAL SITE',
      doctorObservation: `Initial clinical protocol recorded on ${date}.`,
      sessions: [
        {
          id: `sess-${Date.now()}-1`,
          sessionNumber: 1,
          date,
          activeSectionId: `sec-${Date.now()}-1`,
          isExpanded: true,
          sections: [
            { id: `sec-${Date.now()}-1`, name: 'Section 1', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-2`, name: 'Section 2', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-3`, name: 'Section 3', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-4`, name: 'Section 4', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-5`, name: 'Section 5', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' }
          ]
        }
      ]
    };

    setProcedures(prev => [newProc, ...prev]);
    setIsAddProcedureModalOpen(false);
    setManualProcedureName('');
    setSelectedProcedureId(newProc.id);
    setViewMode('detail');
    showToast(`Added clinical procedure "${newProc.name}"`);
  };

  const handleToggleSessionExpand = (sessionId: string) => {
    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return {
        ...proc,
        sessions: proc.sessions.map(s => {
          if (s.id === sessionId) return { ...s, isExpanded: !s.isExpanded };
          return s;
        })
      };
    }));
  };

  const handleAddSession = () => {
    if (!activeProcedure) return;
    const { date } = getBrowserDateTime();
    const nextNumber = activeProcedure.sessions.length + 1;
    const newSession: ClinicalSession = {
      id: `sess-${Date.now()}-${nextNumber}`,
      sessionNumber: nextNumber,
      date,
      activeSectionId: `sec-${Date.now()}-1`,
      isExpanded: true,
      sections: [
        { id: `sec-${Date.now()}-1`, name: 'Section 1', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
        { id: `sec-${Date.now()}-2`, name: 'Section 2', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
        { id: `sec-${Date.now()}-3`, name: 'Section 3', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
        { id: `sec-${Date.now()}-4`, name: 'Section 4', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
        { id: `sec-${Date.now()}-5`, name: 'Section 5', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' }
      ]
    };

    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return { ...proc, sessions: [...proc.sessions, newSession] };
    }));
    showToast(`Added Session ${nextNumber} to ${activeProcedure.name}`);
  };

  const handleAddSection = (sessionId: string) => {
    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return {
        ...proc,
        sessions: proc.sessions.map(s => {
          if (s.id !== sessionId) return s;
          const nextSecNum = s.sections.length + 1;
          const newSection: ClinicalSection = {
            id: `sec-${Date.now()}-${nextSecNum}`,
            name: `Section ${nextSecNum}`,
            beforeImages: [],
            afterImages: [],
            subSections: [],
            activeSubSectionId: 'main'
          };
          return {
            ...s,
            sections: [...s.sections, newSection],
            activeSectionId: newSection.id
          };
        })
      };
    }));
    showToast(`Added Section to session`);
  };

  const handleAddSubSection = (sessionId: string, sectionId: string) => {
    const { full } = getBrowserDateTime();
    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return {
        ...proc,
        sessions: proc.sessions.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            sections: s.sections.map(sec => {
              if (sec.id !== sectionId) return sec;
              const nextSubNum = sec.subSections.length + 1;
              const newSub: ClinicalSubSection = {
                id: `subsec-${Date.now()}-${nextSubNum}`,
                name: `Sub-Section ${nextSubNum}`,
                createdAt: full,
                images: []
              };
              return {
                ...sec,
                subSections: [...sec.subSections, newSub],
                activeSubSectionId: newSub.id
              };
            })
          };
        })
      };
    }));
    showToast(`Created Sub-Section at ${full}`);
  };

  const handleSetActiveSection = (sessionId: string, sectionId: string) => {
    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return {
        ...proc,
        sessions: proc.sessions.map(s => {
          if (s.id !== sessionId) return s;
          return { ...s, activeSectionId: sectionId };
        })
      };
    }));
  };

  const handleSetActiveSubSection = (sessionId: string, sectionId: string, subSectionId: string) => {
    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return {
        ...proc,
        sessions: proc.sessions.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            sections: s.sections.map(sec => {
              if (sec.id !== sectionId) return sec;
              return { ...sec, activeSubSectionId: subSectionId };
            })
          };
        })
      };
    }));
  };

  // ==========================================================================
  // Image Upload / Add Flow
  // ==========================================================================

  const handleStartAddImage = (sessionId: string, sectionId: string, preselectedType?: 'BEFORE' | 'AFTER', subSectionId?: string) => {
    if (preselectedType) {
      setAddImageModalState({
        isOpen: true,
        step: 'source',
        targetType: preselectedType,
        procedureId: selectedProcedureId,
        sessionId,
        sectionId,
        subSectionId
      });
    } else {
      setAddImageModalState({
        isOpen: true,
        step: 'before_after',
        targetType: 'BEFORE',
        procedureId: selectedProcedureId,
        sessionId,
        sectionId,
        subSectionId
      });
    }
  };

  const handleAppendImage = (img: ClinicalImage) => {
    const { sessionId, sectionId, targetType, subSectionId } = addImageModalState;

    setProcedures(prev => prev.map(proc => {
      if (proc.id !== selectedProcedureId) return proc;
      return {
        ...proc,
        sessions: proc.sessions.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            sections: s.sections.map(sec => {
              if (sec.id !== sectionId) return sec;

              // If adding to sub-section
              if (subSectionId && subSectionId !== 'main') {
                return {
                  ...sec,
                  subSections: sec.subSections.map(sub => {
                    if (sub.id !== subSectionId) return sub;
                    return { ...sub, images: [img, ...sub.images] };
                  })
                };
              }

              // Normal Before / After
              if (targetType === 'BEFORE') {
                return { ...sec, beforeImages: [img, ...sec.beforeImages] };
              } else {
                return { ...sec, afterImages: [img, ...sec.afterImages] };
              }
            })
          };
        })
      };
    }));

    setAddImageModalState(prev => ({ ...prev, isOpen: false }));
    showToast(`Added ${targetType} image: ${img.fileName}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage('Unsupported file type. Please select JPG, JPEG, PNG or PDF.');
      return;
    }

    setErrorMessage(null);
    const { date, time } = getBrowserDateTime();
    const reader = new FileReader();

    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newImg: ClinicalImage = {
        id: `img-${Date.now()}`,
        url,
        type: addImageModalState.targetType,
        date,
        time,
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'application/pdf' : 'image/jpeg',
        fileSize: `${(file.size / 1024).toFixed(0)} KB`,
        source: file.type.includes('pdf') ? 'PDF' : 'UPLOAD',
        notes: `Clinical document uploaded on ${date}`
      };
      handleAppendImage(newImg);
    };

    reader.readAsDataURL(file);
  };

  // Camera Capture Simulation / Webcam
  const handleOpenCamera = async () => {
    setIsCameraOpen(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraStreamActive(true);
        }
      }
    } catch (err) {
      setCameraStreamActive(false); // fallback to simulated camera viewfinder
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    setIsCameraOpen(false);
    setCameraStreamActive(false);
  };

  const handleCaptureCamera = () => {
    const { date, time } = getBrowserDateTime();
    let url = DEMO_AFTER_SVG_1;

    if (cameraStreamActive && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        url = canvas.toDataURL('image/jpeg');
      }
    }

    const newImg: ClinicalImage = {
      id: `img-cam-${Date.now()}`,
      url,
      type: addImageModalState.targetType,
      date,
      time,
      fileName: `Camera_Capture_${Date.now().toString().slice(-4)}.jpg`,
      fileType: 'image/jpeg',
      fileSize: '1.2 MB',
      source: 'CAMERA',
      notes: `Direct clinical camera capture on ${date} ${time}`
    };

    handleCloseCamera();
    handleAppendImage(newImg);
  };

  // Dermascope Capture
  const handleCaptureDermascope = (mode: string = 'Cross-Polarized') => {
    const { date, time } = getBrowserDateTime();
    const newImg: ClinicalImage = {
      id: `img-derma-${Date.now()}`,
      url: DEMO_BEFORE_SVG_1,
      type: addImageModalState.targetType,
      date,
      time,
      fileName: `Dermascope_${mode}_${Date.now().toString().slice(-4)}.jpg`,
      fileType: 'image/jpeg',
      fileSize: '1.8 MB',
      source: 'DERMASCOPE',
      notes: `Dermascopy 10x Optical Magnification (${mode})`
    };
    setIsDermascopeOpen(false);
    handleAppendImage(newImg);
  };

  // Face Scanner Capture
  const handleCaptureFaceScan = () => {
    const { date, time } = getBrowserDateTime();
    const newImg: ClinicalImage = {
      id: `img-face-${Date.now()}`,
      url: DEMO_AFTER_SVG_2,
      type: addImageModalState.targetType,
      date,
      time,
      fileName: `3D_FaceScan_Frontal_${Date.now().toString().slice(-4)}.jpg`,
      fileType: 'image/jpeg',
      fileSize: '2.4 MB',
      source: 'FACE_SCANNER',
      notes: 'Facial surface topography & pigmentation index'
    };
    setIsFaceScannerOpen(false);
    handleAppendImage(newImg);
  };

  // Admin Date/Time Edit for any Image
  const handleUpdateImageDateTime = (imgId: string, newDate: string, newTime: string) => {
    setProcedures(prev => prev.map(proc => ({
      ...proc,
      sessions: proc.sessions.map(s => ({
        ...s,
        sections: s.sections.map(sec => ({
          ...sec,
          beforeImages: sec.beforeImages.map(i => i.id === imgId ? { ...i, date: newDate, time: newTime } : i),
          afterImages: sec.afterImages.map(i => i.id === imgId ? { ...i, date: newDate, time: newTime } : i),
          subSections: sec.subSections.map(sub => ({
            ...sub,
            images: sub.images.map(i => i.id === imgId ? { ...i, date: newDate, time: newTime } : i)
          }))
        }))
      }))
    })));
    showToast('Updated image date and time');
  };

  // Image Selection for Compare Toggle
  const toggleImageSelection = (imgId: string) => {
    setSelectedImageIds(prev =>
      prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]
    );
  };

  // Fullscreen Next / Previous within current context
  const handleFullscreenNav = (dir: 'prev' | 'next') => {
    if (!fullscreenImage) return;
    const { contextImages, image } = fullscreenImage;
    const idx = contextImages.findIndex(i => i.id === image.id);
    if (idx === -1) return;

    if (dir === 'prev') {
      const nextIdx = idx > 0 ? idx - 1 : contextImages.length - 1;
      setFullscreenImage({ image: contextImages[nextIdx], contextImages });
    } else {
      const nextIdx = idx < contextImages.length - 1 ? idx + 1 : 0;
      setFullscreenImage({ image: contextImages[nextIdx], contextImages });
    }
  };

  // Delete Image
  const handleDeleteImage = (imgId: string) => {
    if (!confirm('Are you sure you want to delete this clinical image record?')) return;
    setProcedures(prev => prev.map(proc => ({
      ...proc,
      sessions: proc.sessions.map(s => ({
        ...s,
        sections: s.sections.map(sec => ({
          ...sec,
          beforeImages: sec.beforeImages.filter(i => i.id !== imgId),
          afterImages: sec.afterImages.filter(i => i.id !== imgId),
          subSections: sec.subSections.map(sub => ({
            ...sub,
            images: sub.images.filter(i => i.id !== imgId)
          }))
        }))
      }))
    })));
    setSelectedImageIds(prev => prev.filter(id => id !== imgId));
    if (fullscreenImage?.image.id === imgId) setFullscreenImage(null);
    showToast('Deleted clinical image');
  };

  // Save Doctor's Observation
  const handleSaveObservation = (obs: string) => {
    setProcedures(prev => prev.map(p => {
      if (p.id !== selectedProcedureId) return p;
      return { ...p, doctorObservation: obs };
    }));
    showToast('Clinical observation saved successfully');
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #CBD5E1', padding: '16px 20px', minHeight: 650, position: 'relative' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: CLINICAL PROCEDURES NAVIGATION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        marginBottom: 16,
        borderBottom: '1px solid #E2E8F0',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#FFFFFF',
            padding: 8,
            borderRadius: 10,
            boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
          }}>
            <Camera size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Clinical Procedures &amp; Image Management
              </h2>
              <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontSize: 11 }}>
                Tab 5 • Medical Photography
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              Patient: <strong>{patient?.firstName || 'Dionesh'} {patient?.lastName || 'Valaki'}</strong> ({patient?.mrdNumber || 'MRD-2026-0003'}) • Procedural hierarchy: Procedure → Session → Section → Before/After → Images
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Compare Button (Active when >= 2 selected) */}
          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="btn btn-sm"
            style={{
              background: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 7,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2,132,199,0.35)',
              transition: 'all 0.15s ease'
            }}
            title="Open Multi-Image Comparison Workspace"
          >
            <SplitSquareVertical size={14} />
            <span>COMPARE WORKSPACE {selectedImagesForCompare.length > 0 ? `(${selectedImagesForCompare.length})` : ''}</span>
          </button>

          {/* + ADD PROCEDURE Button (Prompt Section 5) */}
          <button
            type="button"
            onClick={() => setIsAddProcedureModalOpen(true)}
            className="btn btn-sm"
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              padding: '6px 16px',
              borderRadius: 7,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            <span>+ ADD PROCEDURE</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: ALL PROCEDURES (LIST / CARD GRID) */}
      {/* ==================================================================== */}
      {viewMode === 'list' && (
        <div>
          {/* Sub-Header Toolbar: Search & Sort Bar (Prompt Sections 9, 10) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 420
              }}>
                <Search size={15} color="#64748B" style={{ position: 'absolute', left: 10, top: 9 }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="🔍 Search procedure by name or date..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32, height: 34, fontSize: 12, borderRadius: 7 }}
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* View Mode Toggle: Table View (default) vs Cards View */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: 2, borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => setProcedureDisplayMode('table')}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    background: procedureDisplayMode === 'table' ? '#036d92' : 'transparent',
                    color: procedureDisplayMode === 'table' ? '#FFFFFF' : '#475569',
                    boxShadow: procedureDisplayMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ☰ Table View
                </button>
                <button
                  type="button"
                  onClick={() => setProcedureDisplayMode('cards')}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    background: procedureDisplayMode === 'cards' ? '#036d92' : 'transparent',
                    color: procedureDisplayMode === 'cards' ? '#FFFFFF' : '#475569',
                    boxShadow: procedureDisplayMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ☷ Cards View
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  Sort:
                </label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{ height: 34, fontSize: 12, fontWeight: 700, borderRadius: 7, padding: '4px 10px' }}
                >
                  <option value="recent">Recent First (Desc)</option>
                  <option value="oldest">Oldest First (Asc)</option>
                  <option value="az">Procedure A → Z</option>
                  <option value="za">Procedure Z → A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              ALL PROCEDURES ({filteredProcedures.length})
            </span>
            <span style={{ fontSize: 11.5, color: '#64748B' }}>
              Select a procedure to view sessions, before/after images, and comparative analysis
            </span>
          </div>

          {/* Empty State */}
          {filteredProcedures.length === 0 && (
            <div style={{
              background: '#FFFFFF',
              border: '2px dashed #CBD5E1',
              borderRadius: 10,
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <AlertCircle size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>
                No Procedures Found
              </h4>
              <p style={{ fontSize: 12, marginBottom: 16 }}>
                {searchQuery ? `No clinical procedures matched "${searchQuery}".` : 'No clinical procedures have been recorded for this patient yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAddProcedureModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: '#0284C7', borderColor: '#0284C7' }}
              >
                + ADD PROCEDURE
              </button>
            </div>
          )}

          {/* Procedures Table or Grid View based on procedureDisplayMode */}
          {procedureDisplayMode === 'table' ? (
            /* Table View: Columns No., Procedure, Date, Actions (User Specification) */
            <div style={{
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: '#334155', width: 70 }}>
                      No.
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: '#334155' }}>
                      Procedure
                    </th>
                    <th
                      onClick={() => setSortBy(prev => prev === 'recent' ? 'oldest' : 'recent')}
                      style={{
                        padding: '12px 16px',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#0369A1',
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: 180
                      }}
                      title="Click to sort by Date (Ascending / Descending)"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="#0369A1" />
                        <span>Date</span>
                        <span style={{ fontSize: 10.5, background: '#E0F2FE', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                          {sortBy === 'recent' ? '▼ Recent' : sortBy === 'oldest' ? '▲ Oldest' : '↕'}
                        </span>
                      </div>
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: '#334155', width: 220, textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcedures.map((proc, index) => {
                    const totalSessions = proc.sessions.length;
                    let totalImages = 0;
                    proc.sessions.forEach(s => {
                      s.sections.forEach(sec => {
                        totalImages += sec.beforeImages.length + sec.afterImages.length;
                        sec.subSections.forEach(sub => { totalImages += sub.images.length; });
                      });
                    });

                    return (
                      <tr
                        key={proc.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: index % 2 === 0 ? '#FFFFFF' : '#FBFDFF',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = index % 2 === 0 ? '#FFFFFF' : '#FBFDFF')}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: '#64748B' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                              {proc.name}
                            </span>
                            <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 10, fontWeight: 800 }}>
                              {proc.category}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              • {totalSessions} {totalSessions === 1 ? 'Session' : 'Sessions'} ({totalImages} Images)
                            </span>
                          </div>
                          {proc.doctorObservation && (
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                              {proc.doctorObservation}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 800, fontFamily: 'monospace', color: '#1E293B' }}>
                          {proc.createdAt}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProcedureId(proc.id);
                                setViewMode('detail');
                              }}
                              className="btn btn-sm"
                              style={{
                                background: '#036d92',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: 11.5,
                                fontWeight: 800,
                                padding: '5px 14px',
                                borderRadius: 6
                              }}
                            >
                              VIEW
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProcedureId(proc.id);
                                const procImages: string[] = [];
                                proc.sessions.forEach(s => s.sections.forEach(sec => {
                                  sec.beforeImages.forEach(i => procImages.push(i.id));
                                  sec.afterImages.forEach(i => procImages.push(i.id));
                                }));
                                if (procImages.length >= 2) {
                                  setSelectedImageIds(procImages.slice(0, 2));
                                }
                                setIsCompareOpen(true);
                              }}
                              className="btn btn-sm btn-outline"
                              style={{
                                borderColor: '#0284C7',
                                color: '#0284C7',
                                fontSize: 11.5,
                                fontWeight: 800,
                                padding: '5px 12px',
                                borderRadius: 6
                              }}
                            >
                              COMPARE
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16
            }}>
              {filteredProcedures.map(proc => {
                // Calculate statistics
                const totalSessions = proc.sessions.length;
                let totalSections = 0;
                let totalImages = 0;

                proc.sessions.forEach(s => {
                  totalSections += s.sections.length;
                  s.sections.forEach(sec => {
                    totalImages += sec.beforeImages.length + sec.afterImages.length;
                    sec.subSections.forEach(sub => {
                      totalImages += sub.images.length;
                    });
                  });
                });

                return (
                  <div
                    key={proc.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 10, fontWeight: 800, marginBottom: 4 }}>
                            {proc.category}
                          </span>
                          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase' }}>
                            {proc.name}
                          </h3>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>
                          {proc.createdAt}
                        </span>
                      </div>

                      {/* Metadata Strip */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        background: '#F8FAFC',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        marginTop: 10,
                        marginBottom: 14,
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#036d92' }}>{totalSessions}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Sessions</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#D97706' }}>{totalSections}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Sections</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#15803D' }}>{totalImages}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Images</div>
                        </div>
                      </div>

                      {/* Clinical Details */}
                      <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 12 }}>
                        <div>Therapist: <strong>{proc.therapist || 'Dr Valaki'}</strong> • Site: <strong>{proc.bodyPart || 'General'}</strong></div>
                        {proc.doctorObservation && (
                          <div style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: '#64748B',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {proc.doctorObservation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: '1px solid #F1F5F9'
                    }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProcedureId(proc.id);
                            setViewMode('detail');
                          }}
                          className="btn btn-sm"
                          style={{
                            background: '#036d92',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: '5px 14px',
                            borderRadius: 6
                          }}
                        >
                          VIEW
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProcedureId(proc.id);
                            const procImages: string[] = [];
                            proc.sessions.forEach(s => s.sections.forEach(sec => {
                              sec.beforeImages.forEach(i => procImages.push(i.id));
                              sec.afterImages.forEach(i => procImages.push(i.id));
                            }));
                            if (procImages.length >= 2) {
                              setSelectedImageIds(procImages.slice(0, 2));
                            }
                            setIsCompareOpen(true);
                          }}
                          className="btn btn-sm btn-outline"
                          style={{
                            borderColor: '#0284C7',
                            color: '#0284C7',
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: '5px 12px',
                            borderRadius: 6
                          }}
                        >
                          COMPARE
                        </button>
                      </div>

                      <div style={{ fontSize: 11, color: '#94A3B8' }}>
                        Clinical Master Protocol
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: PROCEDURE DETAIL VIEW (Prompt Sections 11, 41) */}
      {/* ==================================================================== */}
      {viewMode === 'detail' && activeProcedure && (
        <div>
          {/* Detail View Header (Prompt Section 41) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            padding: '14px 18px',
            marginBottom: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6 }}
                  title="Back to All Procedures"
                >
                  <ArrowLeft size={13} /> Back to Procedures
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase' }}>
                      {activeProcedure.name}
                    </h2>
                    <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 10.5 }}>
                      Active Protocol
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                    Created: <strong>{activeProcedure.createdAt}</strong> • Site: <strong>{activeProcedure.bodyPart || 'FACE'}</strong> • Therapist: <strong>{activeProcedure.therapist || 'Dr Valaki'}</strong>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                  <span>Sessions: <strong>{activeProcedure.sessions.length}</strong></span>
                  <span>•</span>
                  <span>Images: <strong>{allActiveProcedureImages.length}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handleAddSession}
                  className="btn btn-sm"
                  style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', fontSize: 11.5, fontWeight: 800, padding: '5px 12px', borderRadius: 6 }}
                >
                  <Plus size={13} /> + ADD SESSION
                </button>

                <button
                  type="button"
                  onClick={() => setIsCompareOpen(true)}
                  disabled={selectedImagesForCompare.length < 2}
                  className="btn btn-sm"
                  style={{
                    background: selectedImagesForCompare.length >= 2 ? '#D97706' : '#E2E8F0',
                    color: selectedImagesForCompare.length >= 2 ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: '5px 12px',
                    borderRadius: 6,
                    cursor: selectedImagesForCompare.length >= 2 ? 'pointer' : 'not-allowed'
                  }}
                >
                  COMPARE ({selectedImagesForCompare.length})
                </button>
              </div>
            </div>
          </div>

          {/* SESSIONS LIST (Collapsible Cards - Prompt Sections 12, 42, 43) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeProcedure.sessions.map(session => {
              const activeSection = session.sections.find(s => s.id === session.activeSectionId) || session.sections[0];
              const isSubSectionActive = activeSection && activeSection.activeSubSectionId && activeSection.activeSubSectionId !== 'main';
              const activeSubSection = isSubSectionActive
                ? activeSection.subSections.find(sub => sub.id === activeSection.activeSubSectionId)
                : null;

              return (
                <div
                  key={session.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Collapsible Session Header (Prompt Section 42) */}
                  <div
                    onClick={() => handleToggleSessionExpand(session.id)}
                    style={{
                      padding: '10px 16px',
                      background: session.isExpanded ? 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)' : '#FFFFFF',
                      borderBottom: session.isExpanded ? '1px solid #CBD5E1' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        background: '#036d92',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: 6,
                        letterSpacing: 0.5
                      }}>
                        SESSION {session.sessionNumber}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                        📅 Date: {session.date}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#64748B' }}>
                        ({session.sections.length} Sections)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#036d92' }}>
                        {session.isExpanded ? 'Hide Sections' : 'View Sections & Images'}
                      </span>
                      {session.isExpanded ? <ChevronDown size={16} color="#036d92" /> : <ChevronRight size={16} color="#036d92" />}
                    </div>
                  </div>

                  {/* Expanded Session Content: Section Tabs & Image Grid */}
                  {session.isExpanded && (
                    <div style={{ padding: '14px 16px' }}>
                      
                      {/* Section Tabs Ribbon (Prompt Sections 13, 14 - [SECTION 1] ... [SECTION 5] [+ ADD SECTION]) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        overflowX: 'auto',
                        paddingBottom: 8,
                        marginBottom: 14,
                        borderBottom: '1px solid #E2E8F0'
                      }}>
                        {session.sections.map((section, secIdx) => {
                          const isSecActive = session.activeSectionId === section.id;
                          const totalSecImgs = section.beforeImages.length + section.afterImages.length;

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => handleSetActiveSection(session.id, section.id)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenuState({
                                  visible: true,
                                  x: e.clientX,
                                  y: e.clientY,
                                  sectionId: section.id,
                                  sessionId: session.id
                                });
                              }}
                              onDoubleClick={() => handleAddSubSection(session.id, section.id)}
                              title="Right click for context menu • Double click to add sub-section"
                              style={{
                                background: isSecActive ? '#0F172A' : '#F1F5F9',
                                color: isSecActive ? '#FFFFFF' : '#334155',
                                border: isSecActive ? '1px solid #0F172A' : '1px solid #CBD5E1',
                                borderRadius: 7,
                                padding: '6px 14px',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>{section.name}</span>
                              <span style={{
                                background: isSecActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                                color: isSecActive ? '#FFFFFF' : '#475569',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontSize: 10
                              }}>
                                {totalSecImgs}
                              </span>
                            </button>
                          );
                        })}

                        {/* [+ ADD SECTION] Button (Prompt Section 14) */}
                        <button
                          type="button"
                          onClick={() => handleAddSection(session.id)}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px dashed #93C5FD',
                            borderRadius: 7,
                            padding: '6px 12px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                          title="Click to dynamically add the next section"
                        >
                          <Plus size={13} />
                          <span>+ ADD SECTION</span>
                        </button>
                      </div>

                      {/* Sub-Sections Row if any (Prompt Section 15) */}
                      {activeSection && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 14,
                          flexWrap: 'wrap',
                          background: '#F8FAFC',
                          padding: '6px 10px',
                          borderRadius: 7,
                          border: '1px solid #E2E8F0'
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginRight: 4 }}>
                            {activeSection.name} Views:
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSetActiveSubSection(session.id, activeSection.id, 'main')}
                            style={{
                              background: !isSubSectionActive ? '#0284C7' : 'transparent',
                              color: !isSubSectionActive ? '#FFFFFF' : '#475569',
                              border: 'none',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Main (Before/After)
                          </button>

                          {activeSection.subSections.map(sub => {
                            const isSubActive = activeSection.activeSubSectionId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSetActiveSubSection(session.id, activeSection.id, sub.id)}
                                style={{
                                  background: isSubActive ? '#0284C7' : '#FFFFFF',
                                  color: isSubActive ? '#FFFFFF' : '#334155',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 5,
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {sub.name} ({sub.images.length})
                              </button>
                            );
                          })}

                          {/* Add Sub-Section Button (Prompt Section 15) */}
                          <button
                            type="button"
                            onClick={() => handleAddSubSection(session.id, activeSection.id)}
                            onDoubleClick={() => handleAddSubSection(session.id, activeSection.id)}
                            style={{
                              background: '#FEF3C7',
                              color: '#92400E',
                              border: '1px dashed #F59E0B',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                            title="Click or double-click to add sub-section"
                          >
                            <Plus size={11} /> + Add Sub-Section
                          </button>
                        </div>
                      )}

                      {/* SUB-SECTION VIEW: When a sub-section is active (Prompt Section 15) */}
                      {isSubSectionActive && activeSubSection && (
                        <div>
                          <div style={{
                            background: '#EFF6FF',
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #BFDBFE',
                            marginBottom: 14,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 900, color: '#1E40AF' }}>
                                {activeProcedure.name} • {activeSection.name} • {activeSubSection.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>
                                Created: {activeSubSection.createdAt} • Sub-sections support direct clinical images without mandatory Before/After pairing
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartAddImage(session.id, activeSection.id, 'BEFORE', activeSubSection.id)}
                              className="btn btn-sm btn-primary"
                              style={{ background: '#0284C7', borderColor: '#0284C7', fontSize: 11.5, fontWeight: 800 }}
                            >
                              <Plus size={13} /> + ADD IMAGE
                            </button>
                          </div>

                          {/* Sub-Section Image Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                            gap: 14
                          }}>
                            {activeSubSection.images.map(img => (
                              <ClinicalImageCard
                                key={img.id}
                                image={img}
                                procedureName={activeProcedure.name}
                                sessionNumber={session.sessionNumber}
                                sectionName={activeSection.name}
                                isSelected={selectedImageIds.includes(img.id)}
                                onToggleSelect={() => toggleImageSelection(img.id)}
                                onOpenFullscreen={() => setFullscreenImage({ image: img, contextImages: activeSubSection.images })}
                                onOpenEditor={() => setEditorImage(img)}
                                onDelete={() => handleDeleteImage(img.id)}
                                onUpdateDateTime={(d, t) => handleUpdateImageDateTime(img.id, d, t)}
                              />
                            ))}

                            {activeSubSection.images.length === 0 && (
                              <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '30px',
                                background: '#FFFFFF',
                                border: '1px dashed #CBD5E1',
                                borderRadius: 8,
                                color: '#64748B'
                              }}>
                                No images in {activeSubSection.name}. Click "+ ADD IMAGE" to upload or capture.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* MAIN SECTION VIEW: BEFORE / AFTER AREAS (Prompt Section 16) */}
                      {!isSubSectionActive && activeSection && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                          
                          {/* ================= BEFORE AREA ================= */}
                          <div style={{
                            background: '#FFFBEB',
                            borderRadius: 10,
                            border: '1.5px solid #FDE68A',
                            padding: 14
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 10,
                              paddingBottom: 6,
                              borderBottom: '1px solid #FDE68A'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  background: '#B45309',
                                  color: '#FFFFFF',
                                  fontWeight: 900,
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 5,
                                  letterSpacing: 0.5
                                }}>
                                  BEFORE
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#78350F' }}>
                                  Baseline Pre-Procedure ({activeSection.beforeImages.length})
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleStartAddImage(session.id, activeSection.id, 'BEFORE')}
                                className="btn btn-sm"
                                style={{
                                  background: '#D97706',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: 5
                                }}
                              >
                                <Plus size={12} /> + ADD BEFORE
                              </button>
                            </div>

                            {/* Images Grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                              gap: 12
                            }}>
                              {activeSection.beforeImages.map(img => (
                                <ClinicalImageCard
                                  key={img.id}
                                  image={img}
                                  procedureName={activeProcedure.name}
                                  sessionNumber={session.sessionNumber}
                                  sectionName={activeSection.name}
                                  isSelected={selectedImageIds.includes(img.id)}
                                  onToggleSelect={() => toggleImageSelection(img.id)}
                                  onOpenFullscreen={() => setFullscreenImage({ image: img, contextImages: activeSection.beforeImages })}
                                  onOpenEditor={() => setEditorImage(img)}
                                  onDelete={() => handleDeleteImage(img.id)}
                                  onUpdateDateTime={(d, t) => handleUpdateImageDateTime(img.id, d, t)}
                                />
                              ))}

                              {/* Empty Card Slot / Add Plus Card */}
                              <div
                                onClick={() => handleStartAddImage(session.id, activeSection.id, 'BEFORE')}
                                style={{
                                  height: 190,
                                  border: '2px dashed #F59E0B',
                                  borderRadius: 8,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(254, 243, 199, 0.4)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Click to add Before image"
                              >
                                <Plus size={24} color="#D97706" />
                                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#B45309', marginTop: 4 }}>
                                  + Add Before Image
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ================= AFTER AREA ================= */}
                          <div style={{
                            background: '#F0FDF4',
                            borderRadius: 10,
                            border: '1.5px solid #86EFAC',
                            padding: 14
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 10,
                              paddingBottom: 6,
                              borderBottom: '1px solid #86EFAC'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  background: '#15803D',
                                  color: '#FFFFFF',
                                  fontWeight: 900,
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 5,
                                  letterSpacing: 0.5
                                }}>
                                  AFTER
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#166534' }}>
                                  Post-Treatment Results ({activeSection.afterImages.length})
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleStartAddImage(session.id, activeSection.id, 'AFTER')}
                                className="btn btn-sm"
                                style={{
                                  background: '#16A34A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: 5
                                }}
                              >
                                <Plus size={12} /> + ADD AFTER
                              </button>
                            </div>

                            {/* Images Grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                              gap: 12
                            }}>
                              {activeSection.afterImages.map(img => (
                                <ClinicalImageCard
                                  key={img.id}
                                  image={img}
                                  procedureName={activeProcedure.name}
                                  sessionNumber={session.sessionNumber}
                                  sectionName={activeSection.name}
                                  isSelected={selectedImageIds.includes(img.id)}
                                  onToggleSelect={() => toggleImageSelection(img.id)}
                                  onOpenFullscreen={() => setFullscreenImage({ image: img, contextImages: activeSection.afterImages })}
                                  onOpenEditor={() => setEditorImage(img)}
                                  onDelete={() => handleDeleteImage(img.id)}
                                  onUpdateDateTime={(d, t) => handleUpdateImageDateTime(img.id, d, t)}
                                />
                              ))}

                              {/* Empty Card Slot / Add Plus Card */}
                              <div
                                onClick={() => handleStartAddImage(session.id, activeSection.id, 'AFTER')}
                                style={{
                                  height: 190,
                                  border: '2px dashed #22C55E',
                                  borderRadius: 8,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(220, 252, 231, 0.4)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Click to add After image"
                              >
                                <Plus size={24} color="#16A34A" />
                                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#15803D', marginTop: 4 }}>
                                  + Add After Image
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DOCTOR OBSERVATION UI (Prompt Section 40) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            padding: 16,
            marginTop: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} color="#036d92" />
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Doctor's Observation / Report
                </h4>
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Clinical notes recorded for {activeProcedure.name}
              </span>
            </div>

            <textarea
              className="form-input"
              rows={3}
              defaultValue={activeProcedure.doctorObservation || ''}
              id="doc-observation-textarea"
              placeholder="Enter comprehensive clinical findings, follicular density reduction, skin reaction, recommended intervals, post-procedure instructions..."
              style={{ fontSize: 12.5, lineHeight: 1.5, borderRadius: 8, marginBottom: 10, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('doc-observation-textarea') as HTMLTextAreaElement;
                  if (el) handleSaveObservation(el.value);
                }}
                className="btn btn-sm btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92', fontSize: 12, fontWeight: 800, padding: '6px 18px' }}
              >
                SAVE OBSERVATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CONTEXT MENU: RIGHT-CLICK ON SECTION (Prompt Section 57) */}
      {/* ==================================================================== */}
      {contextMenuState && (
        <div style={{
          position: 'fixed',
          top: contextMenuState.y,
          left: contextMenuState.x,
          background: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #CBD5E1',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          padding: '6px 0',
          minWidth: 170
        }}>
          <button
            type="button"
            onClick={() => {
              handleAddSubSection(contextMenuState.sessionId, contextMenuState.sectionId);
              setContextMenuState(null);
            }}
            style={{ width: '100%', padding: '7px 14px', fontSize: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#1E293B' }}
          >
            + Add Sub-Section
          </button>
          <button
            type="button"
            onClick={() => {
              handleStartAddImage(contextMenuState.sessionId, contextMenuState.sectionId, 'BEFORE');
              setContextMenuState(null);
            }}
            style={{ width: '100%', padding: '7px 14px', fontSize: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#1E293B' }}
          >
            + Add Before Image
          </button>
          <button
            type="button"
            onClick={() => {
              handleStartAddImage(contextMenuState.sessionId, contextMenuState.sectionId, 'AFTER');
              setContextMenuState(null);
            }}
            style={{ width: '100%', padding: '7px 14px', fontSize: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#1E293B' }}
          >
            + Add After Image
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: ADD PROCEDURE MODAL (Prompt Section 5) */}
      {/* ==================================================================== */}
      {isAddProcedureModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 520,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #CBD5E1', overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scissors size={16} color="#036d92" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Add Clinical Procedure
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProcedureModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 18 }}>
              {/* Option A: Select From Master Procedure (Searchable List) */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Select From Master Procedure
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter master clinical catalog..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  style={{ height: 32, fontSize: 11.5, marginBottom: 8 }}
                />

                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                  {MASTER_PROCEDURE_CATALOG
                    .filter(item => item.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                    .map(item => (
                      <div
                        key={item.name}
                        onClick={() => handleAddProcedure(item.shortName, item.category)}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #F1F5F9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{item.shortName}</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>{item.name}</div>
                        </div>
                        <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 10 }}>
                          Select
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Option B: Manual Procedure (Prompt Section 5) */}
              <div style={{ paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Or Enter Manual Procedure Name
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Microneedling RF, Carbon Laser Peel..."
                    value={manualProcedureName}
                    onChange={e => setManualProcedureName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddProcedure(manualProcedureName);
                    }}
                    style={{ height: 36, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddProcedure(manualProcedureName)}
                    className="btn btn-primary"
                    style={{ background: '#0F172A', borderColor: '#0F172A', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}
                  >
                    ADD PROCEDURE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADD IMAGE FLOW (Prompt Sections 17, 18) */}
      {/* ==================================================================== */}
      {addImageModalState.isOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 480,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #CBD5E1', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={16} color="#0284C7" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Add Clinical Image
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddImageModalState(prev => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div style={{ margin: '12px 18px 0', padding: '8px 12px', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 6, color: '#991B1B', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Direct BEFORE / AFTER Selection (Prompt Section 17) */}
            {addImageModalState.step === 'before_after' && (
              <div style={{ padding: 22, textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 18 }}>
                  Select the clinical classification for this photograph:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <button
                    type="button"
                    onClick={() => setAddImageModalState(prev => ({ ...prev, step: 'source', targetType: 'BEFORE' }))}
                    style={{
                      background: '#FFFBEB',
                      border: '2px solid #F59E0B',
                      borderRadius: 10,
                      padding: '24px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#B45309' }}>[ BEFORE ]</span>
                    <span style={{ fontSize: 11, color: '#78350F' }}>Pre-Procedure Baseline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddImageModalState(prev => ({ ...prev, step: 'source', targetType: 'AFTER' }))}
                    style={{
                      background: '#F0FDF4',
                      border: '2px solid #22C55E',
                      borderRadius: 10,
                      padding: '24px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#15803D' }}>[ AFTER ]</span>
                    <span style={{ fontSize: 11, color: '#166534' }}>Post-Procedure Result</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Source Modal (Prompt Section 18) */}
            {addImageModalState.step === 'source' && (
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#64748B' }}>
                    ADDING TO: <strong style={{ color: addImageModalState.targetType === 'BEFORE' ? '#B45309' : '#15803D' }}>[{addImageModalState.targetType}]</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddImageModalState(prev => ({ ...prev, step: 'before_after' }))}
                    style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← Change Before/After
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* 1. Camera (Prompt Section 19) */}
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0284C7')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                  >
                    <div style={{ background: '#EFF6FF', color: '#1D4ED8', padding: 8, borderRadius: 6 }}>
                      <Camera size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>📷 CAMERA</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Live webcam preview with shutter capture</div>
                    </div>
                  </button>

                  {/* 2. Upload Image (Prompt Section 22) */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ background: '#F0FDF4', color: '#15803D', padding: 8, borderRadius: 6 }}>
                      <Upload size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>🖼 UPLOAD IMAGE</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Supports JPG, JPEG, PNG or PDF (Validated)</div>
                    </div>
                  </label>

                  {/* 3. Dermascope (Prompt Section 20) */}
                  <button
                    type="button"
                    onClick={() => setIsDermascopeOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0284C7')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                  >
                    <div style={{ background: '#FEF3C7', color: '#B45309', padding: 8, borderRadius: 6 }}>
                      <Eye size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>🔬 DERMASCOPE</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Magnified cross-polarized dermatoscopic evaluation</div>
                    </div>
                  </button>

                  {/* 4. Face Scanner (Prompt Section 21) */}
                  <button
                    type="button"
                    onClick={() => setIsFaceScannerOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0284C7')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                  >
                    <div style={{ background: '#F3E8FF', color: '#7E22CE', padding: 8, borderRadius: 6 }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>🙂 FACE SCANNER</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>5-angle 3D facial topography &amp; texture scan</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CAMERA UI MODAL (Prompt Section 19) */}
      {/* ==================================================================== */}
      {isCameraOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300
        }}>
          <div style={{
            background: '#1E293B', borderRadius: 12, width: '90%', maxWidth: 640,
            overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid #334155'
          }}>
            <div style={{ padding: '12px 16px', background: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
                <Camera size={15} /> CAMERA PREVIEW
              </div>
              <button onClick={handleCloseCamera} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Video Viewfinder */}
            <div style={{ position: 'relative', width: '100%', height: 380, background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {cameraStreamActive ? (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                  <img src={DEMO_BEFORE_SVG_1} alt="Live Simulated Viewfinder" style={{ width: '100%', height: 380, objectFit: 'cover', opacity: 0.85 }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 120, height: 120, border: '2px dashed rgba(255,255,255,0.7)', borderRadius: '50%' }} />
                  </div>
                </div>
              )}

              {/* Viewfinder Crosshair */}
              <div style={{ position: 'absolute', bottom: 12, left: 16, background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: 4, color: '#FFFFFF', fontSize: 11, fontFamily: 'monospace' }}>
                REC • 1080p Medical Grade • {getBrowserDateTime().date}
              </div>
            </div>

            {/* Controls */}
            <div style={{ padding: '14px 20px', background: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="btn btn-ghost"
                style={{ color: '#94A3B8', fontSize: 12 }}
              >
                [Cancel]
              </button>

              <button
                type="button"
                onClick={handleCaptureCamera}
                className="btn btn-primary"
                style={{
                  background: '#EF4444', borderColor: '#EF4444',
                  fontWeight: 900, fontSize: 13, padding: '8px 24px', borderRadius: 30,
                  display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 15px rgba(239,68,68,0.5)'
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF' }} />
                [Capture]
              </button>

              <div style={{ width: 60 }} />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DERMASCOPE UI MODAL (Prompt Section 20) */}
      {/* ==================================================================== */}
      {isDermascopeOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 500,
            overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid #CBD5E1'
          }}>
            <div style={{ padding: '14px 18px', background: '#FEF3C7', borderBottom: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={16} color="#92400E" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#92400E', margin: 0 }}>
                  🔬 DERMASCOPE OPTICAL FEED
                </h3>
              </div>
              <button onClick={() => setIsDermascopeOpen(false)} style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ width: '100%', height: 260, background: '#0F172A', borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 14 }}>
                <img src={DEMO_BEFORE_SVG_1} alt="Dermascope pattern" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#10B981', color: '#FFFFFF', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                  POLARIZED 10X
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => handleCaptureDermascope('Cross-Polarized')}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#D97706', borderColor: '#D97706', fontWeight: 800 }}
                >
                  Capture Cross-Polarized
                </button>
                <button
                  type="button"
                  onClick={() => handleCaptureDermascope('Non-Polarized')}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#D97706', color: '#D97706', fontWeight: 800 }}
                >
                  Capture Non-Polarized
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FACE SCANNER UI MODAL (Prompt Section 21) */}
      {/* ==================================================================== */}
      {isFaceScannerOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 520,
            overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid #CBD5E1'
          }}>
            <div style={{ padding: '14px 18px', background: '#F3E8FF', borderBottom: '1px solid #E9D5FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#7E22CE" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#7E22CE', margin: 0 }}>
                  🙂 3D FACIAL TOPOGRAPHY SCANNER
                </h3>
              </div>
              <button onClick={() => setIsFaceScannerOpen(false)} style={{ background: 'none', border: 'none', color: '#7E22CE', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ width: '100%', height: 260, background: '#0F172A', borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 16 }}>
                <img src={DEMO_AFTER_SVG_2} alt="Face Scan Mesh" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(168,85,247,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ color: '#E9D5FF', fontSize: 11, background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: 20 }}>
                    5-Angle Spatial Calibration Ready
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCaptureFaceScan}
                className="btn btn-primary"
                style={{ background: '#7E22CE', borderColor: '#7E22CE', fontWeight: 900, fontSize: 13, padding: '9px 28px', borderRadius: 8 }}
              >
                [ START SCAN &amp; RECORD ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FULLSCREEN IMAGE VIEWER (Prompt Sections 30, 31, 32) */}
      {/* ==================================================================== */}
      {fullscreenImage && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.94)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', color: '#FFFFFF'
        }}>
          {/* Top Bar */}
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {fullscreenImage.image.fileName}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                {fullscreenImage.image.date} {fullscreenImage.image.time} • Type: <strong style={{ color: fullscreenImage.image.type === 'BEFORE' ? '#F59E0B' : '#10B981' }}>{fullscreenImage.image.type}</strong> • Press ESC to close
              </div>
            </div>

            <button
              onClick={() => setFullscreenImage(null)}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 6 }}
              title="Close (ESC)"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Stage with Context Previous / Next (Prompt Section 32) */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <button
              type="button"
              onClick={() => handleFullscreenNav('prev')}
              style={{
                position: 'absolute', left: 24, background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#FFFFFF', width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              title="Previous Image in this Section"
            >
              <ArrowLeft size={20} />
            </button>

            <img
              src={fullscreenImage.image.url}
              alt="Fullscreen View"
              style={{ maxHeight: '78vh', maxWidth: '85vw', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            />

            <button
              type="button"
              onClick={() => handleFullscreenNav('next')}
              style={{
                position: 'absolute', right: 24, background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#FFFFFF', width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              title="Next Image in this Section"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Bottom Controls Bar (Prompt Section 30) */}
          <div style={{ padding: '12px 20px', background: 'rgba(15,23,42,0.8)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => {
                setEditorImage(fullscreenImage.image);
                setFullscreenImage(null);
              }}
              className="btn btn-sm"
              style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', fontWeight: 800 }}
            >
              <Edit3 size={14} /> [Edit / Annotate]
            </button>

            <button
              type="button"
              onClick={() => {
                showToast(`Sent ${fullscreenImage.image.fileName} to Patient Portal & Telehealth EHR.`);
              }}
              className="btn btn-sm"
              style={{ background: '#10B981', color: '#FFFFFF', border: 'none', fontWeight: 800 }}
            >
              <Send size={14} /> [Send Image]
            </button>

            <button
              type="button"
              onClick={() => {
                if (!selectedImageIds.includes(fullscreenImage.image.id)) {
                  setSelectedImageIds(prev => [...prev, fullscreenImage.image.id]);
                }
                setFullscreenImage(null);
                setIsCompareOpen(true);
              }}
              className="btn btn-sm"
              style={{ background: '#D97706', color: '#FFFFFF', border: 'none', fontWeight: 800 }}
            >
              <SplitSquareVertical size={14} /> [Compare Mode]
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MULTI-IMAGE COMPARE VIEWER (Prompt Sections 33 to 39, 63) */}
      {/* ==================================================================== */}
      {isCompareOpen && (
        <CompareViewerModal
          initialImages={selectedImagesForCompare.length > 0 ? selectedImagesForCompare : allPatientImages.slice(0, 2)}
          allPatientImages={allPatientImages}
          procedures={procedures}
          activeProcedureId={selectedProcedureId}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* ==================================================================== */}
      {/* IMAGE EDITOR MODAL (Prompt Sections 25 to 29) */}
      {/* ==================================================================== */}
      {editorImage && (
        <ImageEditorModal
          image={editorImage}
          onClose={() => setEditorImage(null)}
          onSave={(updatedImg) => {
            setProcedures(prev => prev.map(proc => ({
              ...proc,
              sessions: proc.sessions.map(s => ({
                ...s,
                sections: s.sections.map(sec => ({
                  ...sec,
                  beforeImages: sec.beforeImages.map(i => i.id === updatedImg.id ? updatedImg : i),
                  afterImages: sec.afterImages.map(i => i.id === updatedImg.id ? updatedImg : i),
                  subSections: sec.subSections.map(sub => ({
                    ...sub,
                    images: sub.images.map(i => i.id === updatedImg.id ? updatedImg : i)
                  }))
                }))
              }))
            })));
            setEditorImage(null);
            showToast('Saved image edits & annotations');
          }}
        />
      )}

    </div>
  );
}

// ============================================================================
// COMPONENT: CLINICAL IMAGE CARD (Prompt Sections 23, 24, 47, 54, 55, 56)
// ============================================================================

interface ClinicalImageCardProps {
  image: ClinicalImage;
  procedureName: string;
  sessionNumber: number;
  sectionName: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenFullscreen: () => void;
  onOpenEditor: () => void;
  onDelete: () => void;
  onUpdateDateTime?: (newDate: string, newTime: string) => void;
}

function ClinicalImageCard({
  image,
  procedureName,
  sessionNumber,
  sectionName,
  isSelected,
  onToggleSelect,
  onOpenFullscreen,
  onOpenEditor,
  onDelete,
  onUpdateDateTime
}: ClinicalImageCardProps) {
  const isPdf = image.fileType === 'application/pdf' || image.source === 'PDF';
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [tempDate, setTempDate] = useState(image.date);
  const [tempTime, setTempTime] = useState(image.time);

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 9,
      border: isSelected ? '2px solid #0284C7' : '1px solid #CBD5E1',
      boxShadow: isSelected ? '0 0 0 3px rgba(2,132,199,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      transition: 'all 0.15s ease'
    }}>
      {/* Checkbox (Prompt Section 33, 47 - Selection for Compare) */}
      <div
        onClick={onToggleSelect}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          background: isSelected ? '#0284C7' : 'rgba(255,255,255,0.9)',
          color: isSelected ? '#FFFFFF' : '#334155',
          width: 22,
          height: 22,
          borderRadius: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          border: isSelected ? 'none' : '1px solid #CBD5E1'
        }}
        title="Select for comparison"
      >
        {isSelected ? <Check size={14} strokeWidth={3} /> : null}
      </div>

      {/* Status / Source Badge Top-Right */}
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        display: 'flex',
        gap: 4
      }}>
        <span style={{
          background: image.type === 'BEFORE' ? '#B45309' : image.type === 'AFTER' ? '#15803D' : '#0369A1',
          color: '#FFFFFF',
          fontSize: 9.5,
          fontWeight: 900,
          padding: '2px 6px',
          borderRadius: 4
        }}>
          {image.type}
        </span>
      </div>

      {/* Image Preview / PDF Document Card (Prompt Section 54) */}
      <div
        onClick={onOpenFullscreen}
        style={{
          height: 145,
          background: '#F1F5F9',
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {isPdf ? (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <FileText size={38} color="#0284C7" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {image.fileName}
            </div>
            <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 10, marginTop: 4 }}>
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

      {/* Date/Time Box: White, Black text, Small, Clean, Clearly Readable (Prompt Section 24) */}
      {isEditingDateTime ? (
        <div style={{
          background: '#FFFFFF',
          color: '#000000',
          padding: '4px 6px',
          borderTop: '1px solid #0284C7',
          borderBottom: '1px solid #0284C7',
          fontSize: 10.5,
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <input
            type="text"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
            placeholder="DD/MM/YYYY"
            style={{ width: 80, fontSize: 10, padding: '2px 4px', border: '1px solid #CBD5E1', borderRadius: 3 }}
            title="Edit Date (DD/MM/YYYY)"
          />
          <input
            type="text"
            value={tempTime}
            onChange={(e) => setTempTime(e.target.value)}
            placeholder="HH:MM AM/PM"
            style={{ width: 70, fontSize: 10, padding: '2px 4px', border: '1px solid #CBD5E1', borderRadius: 3 }}
            title="Edit Time"
          />
          <button
            type="button"
            onClick={() => {
              if (onUpdateDateTime) {
                onUpdateDateTime(tempDate, tempTime);
              }
              setIsEditingDateTime(false);
            }}
            style={{ background: '#16A34A', color: '#FFF', border: 'none', borderRadius: 3, padding: '2px 5px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
            title="Save Date/Time"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setTempDate(image.date);
              setTempTime(image.time);
              setIsEditingDateTime(false);
            }}
            style={{ background: '#94A3B8', color: '#FFF', border: 'none', borderRadius: 3, padding: '2px 5px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => setIsEditingDateTime(true)}
          title="Click to edit Date/Time (Admin permitted)"
          style={{
            background: '#FFFFFF',
            color: '#000000',
            padding: '5px 8px',
            borderTop: '1px solid #E2E8F0',
            borderBottom: '1px solid #E2E8F0',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'monospace',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <Clock size={11} color="#000000" />
          <span>{image.date}</span>
          <span>•</span>
          <span>{image.time}</span>
          <Edit3 size={10} color="#64748B" style={{ marginLeft: 2 }} />
        </div>
      )}

      {/* Image Metadata (Prompt Section 55) */}
      <div style={{ padding: '6px 8px', fontSize: 10.5, color: '#64748B', lineHeight: 1.3 }}>
        <div style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {procedureName} • S{sessionNumber} • {sectionName}
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8' }}>
          Source: {image.source} {image.fileSize ? `(${image.fileSize})` : ''}
        </div>
      </div>

      {/* Actions: [EDIT] [VIEW] [SELECT] + Admin E/D (Prompt Sections 24, 56) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        background: '#F8FAFC',
        borderTop: '1px solid #F1F5F9'
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={onOpenEditor}
            disabled={isPdf}
            className="btn btn-sm btn-ghost"
            style={{ padding: '2px 6px', fontSize: 10.5, fontWeight: 800, color: '#0284C7', height: 24 }}
            title="Edit / Annotate"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="btn btn-sm btn-ghost"
            style={{ padding: '2px 6px', fontSize: 10.5, fontWeight: 800, color: '#334155', height: 24 }}
            title="View Fullscreen"
          >
            VIEW
          </button>
          <button
            type="button"
            onClick={onToggleSelect}
            className="btn btn-sm btn-ghost"
            style={{ padding: '2px 6px', fontSize: 10.5, fontWeight: 800, color: isSelected ? '#15803D' : '#64748B', height: 24 }}
            title="Select for Compare"
          >
            {isSelected ? '✓ SEL' : 'SELECT'}
          </button>
        </div>

        {/* Admin E/D UI (Prompt Section 56) */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            type="button"
            onClick={() => setIsEditingDateTime(true)}
            style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 3, padding: '1px 5px', fontSize: 9.5, fontWeight: 900, cursor: 'pointer', color: '#0369A1' }}
            title="Admin Edit Date/Time"
          >
            E
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 3, padding: '1px 5px', fontSize: 9.5, fontWeight: 900, cursor: 'pointer', color: '#DC2626' }}
            title="Admin Delete"
          >
            D
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: MULTI-IMAGE COMPARISON WORKSPACE (Prompt Update & Master Spec)
// Left side: Upload/select multiple images at once into a selectable image library
// Right side: Multi-image comparison workspace (supports 2+ images)
// - Drag & drop from library to compare workspace
// - Drag images to reorder inside comparison area
// - Each comparison image has its OWN: Zoom, Pan, Rotate, Remove, Reset
// - Responsive layout automatically adjusts for 2, 3, 4+ images
// - Zero file duplication; only frontend state/references manipulated
// ============================================================================

interface CompareViewerModalProps {
  initialImages?: ClinicalImage[];
  allPatientImages?: Array<ClinicalImage & { procedureName?: string; procedureId?: string; sessionNumber?: number; sectionName?: string }>;
  procedures?: ClinicalProcedure[];
  activeProcedureId?: string;
  onClose: () => void;
}

function CompareViewerModal({
  initialImages = [],
  allPatientImages = [],
  procedures = [],
  activeProcedureId,
  onClose
}: CompareViewerModalProps) {
  // 1. Library State: All available images (patient procedures + dynamically uploaded photos)
  const [libraryImages, setLibraryImages] = useState<ClinicalImage[]>(() => {
    const list: ClinicalImage[] = allPatientImages.length > 0 ? [...allPatientImages] : [...initialImages];
    initialImages.forEach(img => {
      if (!list.some(x => x.id === img.id)) list.push(img);
    });
    return list;
  });

  // Cross-Procedure selector: 'ALL' or specific procedure ID
  const [selectedProcedureFilter, setSelectedProcedureFilter] = useState<string>('ALL');

  // 2. Comparison State: Ordered array of image IDs in comparison workspace
  const [comparisonIds, setComparisonIds] = useState<string[]>(() => {
    if (initialImages.length >= 2) return initialImages.map(img => img.id);
    if (allPatientImages.length >= 2) return allPatientImages.slice(0, 2).map(img => img.id);
    if (initialImages.length === 1) return [initialImages[0].id];
    return [];
  });

  // 3. Multi-Select in Library
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>(() => {
    return initialImages.map(img => img.id);
  });

  // 4. Per-Image Independent Control States: Zoom, Pan, Rotate (keyed by image ID)
  const [zoomState, setZoomState] = useState<{ [id: string]: number }>({});
  const [panState, setPanState] = useState<{ [id: string]: { x: number; y: number } }>({});
  const [rotateState, setRotateState] = useState<{ [id: string]: number }>({});

  // Active panning tracking
  const [draggingPaneId, setDraggingPaneId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Library filter & search
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryTypeFilter, setLibraryTypeFilter] = useState<'ALL' | 'BEFORE' | 'AFTER'>('ALL');
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const multiUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Fast ID map lookup
  const libraryMap = useMemo(() => {
    const map = new Map<string, ClinicalImage>();
    libraryImages.forEach(img => map.set(img.id, img));
    return map;
  }, [libraryImages]);

  // Comparison images in exact sequence
  const comparisonImages = useMemo(() => {
    return comparisonIds
      .map(id => libraryMap.get(id))
      .filter((img): img is ClinicalImage => Boolean(img));
  }, [comparisonIds, libraryMap]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Independent Controls Handlers
  const getZoom = (id: string) => zoomState[id] || 100;
  const getPan = (id: string) => panState[id] || { x: 0, y: 0 };
  const getRotate = (id: string) => rotateState[id] || 0;

  const handleZoomChange = (id: string, delta: number) => {
    setZoomState(prev => {
      const cur = prev[id] || 100;
      const next = Math.max(50, Math.min(400, cur + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleRotate = (id: string, deltaDeg: number) => {
    setRotateState(prev => {
      const cur = prev[id] || 0;
      return { ...prev, [id]: (cur + deltaDeg + 360) % 360 };
    });
  };

  const handleFitImage = (id: string) => {
    setZoomState(prev => ({ ...prev, [id]: 100 }));
    setPanState(prev => ({ ...prev, [id]: { x: 0, y: 0 } }));
    setRotateState(prev => ({ ...prev, [id]: 0 }));
  };

  const handlePanNudge = (id: string, deltaX: number, deltaY: number) => {
    setPanState(prev => {
      const cur = prev[id] || { x: 0, y: 0 };
      return { ...prev, [id]: { x: cur.x + deltaX, y: cur.y + deltaY } };
    });
  };

  const handleResetImage = (id: string) => {
    setZoomState(prev => ({ ...prev, [id]: 100 }));
    setPanState(prev => ({ ...prev, [id]: { x: 0, y: 0 } }));
    setRotateState(prev => ({ ...prev, [id]: 0 }));
  };

  const handleResetAll = () => {
    setZoomState({});
    setPanState({});
    setRotateState({});
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonIds(prev => prev.filter(x => x !== id));
    setSelectedLibraryIds(prev => prev.filter(x => x !== id));
  };

  // Reordering images inside comparison area (Drag & Drop Reordering)
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setComparisonIds(prev => {
      const copy = [...prev];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedItem);
      return copy;
    });
  };

  // Upload multiple images at once
  const handleUploadMultiple = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImgs: ClinicalImage[] = [];
    const dateObj = getBrowserDateTime();
    let loadedCount = 0;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const newImg: ClinicalImage = {
          id: `img-user-upload-${Date.now()}-${idx}`,
          url,
          type: 'GENERAL',
          date: dateObj.date,
          time: dateObj.time,
          fileName: file.name,
          fileType: (file.type as any) || 'image/jpeg',
          fileSize: `${(file.size / 1024).toFixed(0)} KB`,
          source: 'UPLOAD',
          notes: 'Multi-Image Upload'
        };
        newImgs.push(newImg);
        loadedCount++;

        if (loadedCount === files.length) {
          setLibraryImages(prev => [...newImgs, ...prev]);
          setComparisonIds(prev => {
            const combined = [...prev, ...newImgs.map(x => x.id)];
            return Array.from(new Set(combined));
          });
          setSelectedLibraryIds(prev => [...prev, ...newImgs.map(x => x.id)]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  // Pan event handlers
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    setDraggingPaneId(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingPaneId) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setPanState(prev => {
      const cur = prev[draggingPaneId] || { x: 0, y: 0 };
      return { ...prev, [draggingPaneId]: { x: cur.x + dx, y: cur.y + dy } };
    });
  };

  const handleMouseUp = () => {
    setDraggingPaneId(null);
  };

  // Toggle selection
  const toggleLibrarySelection = (id: string) => {
    setSelectedLibraryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredLibrary.map(i => i.id);
    setSelectedLibraryIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedLibraryIds([]);
  };

  const handleAddSelectedToCompare = () => {
    setComparisonIds(prev => Array.from(new Set([...prev, ...selectedLibraryIds])));
  };

  const handleToggleCompareImage = (id: string) => {
    setComparisonIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Drop onto workspace background
  const handleWorkspaceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTargetActive(false);
    const dragType = e.dataTransfer.getData('dragType');
    if (dragType === 'LIBRARY_IMAGE') {
      const imgId = e.dataTransfer.getData('text/plain');
      if (imgId && !comparisonIds.includes(imgId)) {
        setComparisonIds(prev => [...prev, imgId]);
      }
    }
  };

  // Filtered Library Images (supports Cross-Procedure Filtering)
  const filteredLibrary = useMemo(() => {
    return libraryImages.filter(img => {
      if (selectedProcedureFilter !== 'ALL') {
        const withProc = img as any;
        if (withProc.procedureId && withProc.procedureId !== selectedProcedureFilter) return false;
      }
      if (libraryTypeFilter !== 'ALL' && img.type !== libraryTypeFilter) return false;
      if (librarySearch.trim() && !img.fileName.toLowerCase().includes(librarySearch.toLowerCase())) return false;
      return true;
    });
  }, [libraryImages, selectedProcedureFilter, libraryTypeFilter, librarySearch]);

  const count = comparisonImages.length;
  const isTwoImages = count === 2;

  // Responsive grid style for compare area
  const getGridStyle = () => {
    if (count === 2) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr 2px 1fr',
        gap: 0,
        height: '100%'
      };
    }
    if (count === 3) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        height: '100%'
      };
    }
    if (count === 4) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 12,
        height: '100%'
      };
    }
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 12,
      height: '100%',
      overflowY: 'auto' as const
    };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0B1120',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        color: '#FFFFFF'
      }}
    >
      {/* Hidden File Input for Multiple Uploads */}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={multiUploadInputRef}
        onChange={handleUploadMultiple}
        style={{ display: 'none' }}
      />

      {/* TOP HEADER */}
      <div style={{
        padding: '12px 24px',
        background: '#0F172A',
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SplitSquareVertical size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: 0.3 }}>
                Multi-Image Clinical Comparison Workspace
              </h3>
              <span style={{
                background: count >= 2 ? '#0284C7' : '#D97706',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12
              }}>
                {count} {count === 1 ? 'Image' : 'Images'} Active
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
              Select/drag images from library • Drag panes to reorder • Independent Zoom, Pan, Rotate, Remove &amp; Reset
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleResetAll}
            className="btn btn-sm"
            style={{
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #475569',
              fontWeight: 800,
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Reset Zoom, Pan & Rotation on all panes"
          >
            <RefreshCw size={13} />
            <span>Reset All</span>
          </button>

          {count > 0 && (
            <button
              type="button"
              onClick={() => setComparisonIds([])}
              className="btn btn-sm"
              style={{
                background: '#334155',
                color: '#EF4444',
                border: '1px solid #475569',
                fontWeight: 800,
                fontSize: 11.5
              }}
              title="Clear all images from comparison workspace"
            >
              Clear Workspace
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 800
            }}
            title="Close Comparison (ESC)"
          >
            <X size={16} />
            <span>Close (ESC)</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT LIBRARY + RIGHT COMPARE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ================================================================== */}
        {/* LEFT COLUMN: SELECTABLE IMAGE LIBRARY & MULTI-UPLOAD */}
        {/* ================================================================== */}
        <div style={{
          width: 320,
          background: '#0F172A',
          borderRight: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Library Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} color="#38BDF8" />
                <span>Image Library ({libraryImages.length})</span>
              </div>
              <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
                {selectedLibraryIds.length} Selected
              </span>
            </div>

            {/* Upload Multiple Images Button */}
            <button
              type="button"
              onClick={() => multiUploadInputRef.current?.click()}
              className="btn btn-sm btn-primary"
              style={{
                width: '100%',
                background: '#0284C7',
                borderColor: '#0284C7',
                fontWeight: 800,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 0',
                marginBottom: 10,
                borderRadius: 6
              }}
            >
              <Upload size={14} />
              <span>+ Upload Multiple Images</span>
            </button>

            {/* Cross-Procedure Selector: "BETWEEN 2 PROSSUSUER" */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>PROCEDURE SOURCE:</span>
                <span style={{ color: '#38BDF8', fontSize: 9 }}>Cross-Compare</span>
              </label>
              <select
                className="form-select"
                value={selectedProcedureFilter}
                onChange={e => setSelectedProcedureFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: 30,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#1E293B',
                  color: '#FFFFFF',
                  borderColor: '#334155',
                  borderRadius: 6,
                  padding: '2px 8px'
                }}
              >
                <option value="ALL">🌐 All Patient Procedures ({procedures.length})</option>
                {procedures.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.createdAt})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={13} color="#64748B" style={{ position: 'absolute', left: 9, top: 9 }} />
              <input
                type="text"
                className="form-input"
                placeholder="Filter library images..."
                value={librarySearch}
                onChange={e => setLibrarySearch(e.target.value)}
                style={{
                  height: 30,
                  fontSize: 11,
                  paddingLeft: 28,
                  background: '#1E293B',
                  borderColor: '#334155',
                  color: '#FFFFFF',
                  borderRadius: 6
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {(['ALL', 'BEFORE', 'AFTER'] as const).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setLibraryTypeFilter(tag)}
                  style={{
                    flex: 1,
                    padding: '3px 0',
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: libraryTypeFilter === tag ? '#0284C7' : '#1E293B',
                    color: libraryTypeFilter === tag ? '#FFFFFF' : '#94A3B8',
                    border: `1px solid ${libraryTypeFilter === tag ? '#0284C7' : '#334155'}`
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Multi-Select Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                style={{
                  fontSize: 10,
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: 0
                }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{
                  fontSize: 10,
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: 0
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAddSelectedToCompare}
                disabled={selectedLibraryIds.length === 0}
                style={{
                  fontSize: 10,
                  background: selectedLibraryIds.length > 0 ? '#10B981' : '#334155',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: selectedLibraryIds.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4
                }}
              >
                + Compare ({selectedLibraryIds.length})
              </button>
            </div>
          </div>

          {/* Scrollable Thumbnails List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredLibrary.map((img) => {
                const isSelected = selectedLibraryIds.includes(img.id);
                const compareIndex = comparisonIds.indexOf(img.id);
                const isInCompare = compareIndex !== -1;

                return (
                  <div
                    key={img.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', img.id);
                      e.dataTransfer.setData('dragType', 'LIBRARY_IMAGE');
                      e.dataTransfer.effectAllowed = 'copyMove';
                    }}
                    style={{
                      background: isInCompare ? '#1E293B' : '#141E33',
                      border: isInCompare ? '1.5px solid #0284C7' : '1px solid #1E293B',
                      borderRadius: 8,
                      padding: 8,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      cursor: 'grab',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleLibrarySelection(img.id)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} color="#0284C7" />
                      ) : (
                        <Square size={16} color="#64748B" />
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div
                      onClick={() => handleToggleCompareImage(img.id)}
                      style={{
                        width: 58,
                        height: 48,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#020617',
                        flexShrink: 0,
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      title="Click to toggle in comparison workspace"
                    >
                      <img
                        src={img.url}
                        alt={img.fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        background: img.type === 'BEFORE' ? '#B45309' : img.type === 'AFTER' ? '#15803D' : '#0369A1',
                        color: '#FFFFFF',
                        fontSize: 8,
                        fontWeight: 900,
                        padding: '1px 3px',
                        borderRadius: 3
                      }}>
                        {img.type}
                      </span>
                    </div>

                    {/* Info & Drag Handle */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {(img as any).procedureName && (
                        <div style={{
                          fontSize: 8.5,
                          fontWeight: 800,
                          background: '#0F172A',
                          color: '#38BDF8',
                          padding: '1px 5px',
                          borderRadius: 3,
                          display: 'inline-block',
                          marginBottom: 2,
                          border: '1px solid #334155'
                        }}>
                          {(img as any).procedureName}
                        </div>
                      )}
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#F1F5F9',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {img.fileName}
                      </div>
                      <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 2 }}>
                        {img.date} • {img.time}
                      </div>

                      {/* Status / Add button */}
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isInCompare ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              background: '#0284C7',
                              color: '#FFFFFF',
                              fontSize: 9,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4
                            }}>
                              In Compare (#{compareIndex + 1})
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromCompare(img.id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title="Remove from Compare"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleCompareImage(img.id)}
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              background: '#1E293B',
                              color: '#38BDF8',
                              border: '1px solid #334155',
                              borderRadius: 4,
                              padding: '1px 6px',
                              cursor: 'pointer'
                            }}
                          >
                            + Add to Compare
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLibrary.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', fontSize: 11 }}>
                  No library images found. Click "+ Upload Multiple Images" to add photos.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: COMPARE SECTION (MULTI-IMAGE COMPARISON WORKSPACE) */}
        {/* ================================================================== */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsDropTargetActive(true);
          }}
          onDragLeave={() => setIsDropTargetActive(false)}
          onDrop={handleWorkspaceDrop}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 16,
            background: isDropTargetActive ? '#0D1B2A' : '#0B1120',
            transition: 'background 0.2s ease',
            position: 'relative'
          }}
        >
          {/* Drop Target Glow Overlay */}
          {isDropTargetActive && (
            <div style={{
              position: 'absolute',
              inset: 12,
              border: '2px dashed #0284C7',
              borderRadius: 12,
              pointerEvents: 'none',
              background: 'rgba(2, 132, 199, 0.08)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
              fontSize: 16,
              fontWeight: 800
            }}>
              Drop image here to add to Compare Workspace
            </div>
          )}

          {/* EMPTY / UNDER-MINIMUM STATE (< 2 IMAGES) */}
          {count < 2 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #334155',
              borderRadius: 12,
              padding: 30,
              textAlign: 'center'
            }}>
              <div style={{
                background: '#1E293B',
                padding: 18,
                borderRadius: '50%',
                marginBottom: 16,
                color: '#38BDF8'
              }}>
                <SplitSquareVertical size={36} />
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', margin: '0 0 8px' }}>
                Multi-Image Comparison Workspace
              </h4>
              <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 440, margin: '0 0 18px', lineHeight: 1.5 }}>
                {count === 1
                  ? '1 image placed in workspace. Please select or drag at least 1 more image from the left library to compare.'
                  : 'Drag and drop images here from the left library, or use the checkboxes on the left to select images.'}
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {libraryImages.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setComparisonIds(libraryImages.slice(0, 2).map(i => i.id))}
                    className="btn btn-sm btn-primary"
                    style={{ background: '#0284C7', borderColor: '#0284C7', fontWeight: 800, padding: '7px 16px' }}
                  >
                    + Load First 2 Images
                  </button>
                )}
                {libraryImages.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => setComparisonIds(libraryImages.slice(0, 3).map(i => i.id))}
                    className="btn btn-sm"
                    style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #475569', fontWeight: 800, padding: '7px 16px' }}
                  >
                    + Load 3 Images
                  </button>
                )}
                {libraryImages.length >= 4 && (
                  <button
                    type="button"
                    onClick={() => setComparisonIds(libraryImages.slice(0, 4).map(i => i.id))}
                    className="btn btn-sm"
                    style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #475569', fontWeight: 800, padding: '7px 16px' }}
                  >
                    + Load 4 Images (2x2 Grid)
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ACTIVE MULTI-IMAGE COMPARISON WORKSPACE (2 OR MORE IMAGES) */
            <div style={getGridStyle()}>
              {isTwoImages ? (
                <>
                  {/* Left Comparison Pane */}
                  <ComparePane
                    key={comparisonImages[0].id}
                    image={comparisonImages[0]}
                    index={0}
                    total={2}
                    zoom={getZoom(comparisonImages[0].id)}
                    pan={getPan(comparisonImages[0].id)}
                    rotation={getRotate(comparisonImages[0].id)}
                    onZoomIn={() => handleZoomChange(comparisonImages[0].id, 25)}
                    onZoomOut={() => handleZoomChange(comparisonImages[0].id, -25)}
                    onFit={() => handleFitImage(comparisonImages[0].id)}
                    onPanNudge={(dx, dy) => handlePanNudge(comparisonImages[0].id, dx, dy)}
                    onRotateLeft={() => handleRotate(comparisonImages[0].id, -90)}
                    onRotateRight={() => handleRotate(comparisonImages[0].id, 90)}
                    onReset={() => handleResetImage(comparisonImages[0].id)}
                    onRemove={() => handleRemoveFromCompare(comparisonImages[0].id)}
                    onMouseDown={(e) => handleMouseDown(comparisonImages[0].id, e)}
                    onReorder={handleReorder}
                    onDropFromLibrary={(imgId, idx) => {
                      if (!comparisonIds.includes(imgId)) {
                        setComparisonIds(prev => {
                          const next = [...prev];
                          next.splice(idx, 0, imgId);
                          return next;
                        });
                      }
                    }}
                  />

                  {/* Clean Light Divider Bar (Prompt Section 35) */}
                  <div style={{
                    background: '#475569',
                    width: 2,
                    height: '100%',
                    opacity: 0.6,
                    margin: '0 4px'
                  }} />

                  {/* Right Comparison Pane */}
                  <ComparePane
                    key={comparisonImages[1].id}
                    image={comparisonImages[1]}
                    index={1}
                    total={2}
                    zoom={getZoom(comparisonImages[1].id)}
                    pan={getPan(comparisonImages[1].id)}
                    rotation={getRotate(comparisonImages[1].id)}
                    onZoomIn={() => handleZoomChange(comparisonImages[1].id, 25)}
                    onZoomOut={() => handleZoomChange(comparisonImages[1].id, -25)}
                    onFit={() => handleFitImage(comparisonImages[1].id)}
                    onPanNudge={(dx, dy) => handlePanNudge(comparisonImages[1].id, dx, dy)}
                    onRotateLeft={() => handleRotate(comparisonImages[1].id, -90)}
                    onRotateRight={() => handleRotate(comparisonImages[1].id, 90)}
                    onReset={() => handleResetImage(comparisonImages[1].id)}
                    onRemove={() => handleRemoveFromCompare(comparisonImages[1].id)}
                    onMouseDown={(e) => handleMouseDown(comparisonImages[1].id, e)}
                    onReorder={handleReorder}
                    onDropFromLibrary={(imgId, idx) => {
                      if (!comparisonIds.includes(imgId)) {
                        setComparisonIds(prev => {
                          const next = [...prev];
                          next.splice(idx, 0, imgId);
                          return next;
                        });
                      }
                    }}
                  />
                </>
              ) : (
                /* 3+ IMAGES: RESPONSIVE GRID LAYOUT */
                comparisonImages.map((img, idx) => (
                  <ComparePane
                    key={img.id}
                    image={img}
                    index={idx}
                    total={count}
                    zoom={getZoom(img.id)}
                    pan={getPan(img.id)}
                    rotation={getRotate(img.id)}
                    onZoomIn={() => handleZoomChange(img.id, 25)}
                    onZoomOut={() => handleZoomChange(img.id, -25)}
                    onFit={() => handleFitImage(img.id)}
                    onPanNudge={(dx, dy) => handlePanNudge(img.id, dx, dy)}
                    onRotateLeft={() => handleRotate(img.id, -90)}
                    onRotateRight={() => handleRotate(img.id, 90)}
                    onReset={() => handleResetImage(img.id)}
                    onRemove={() => handleRemoveFromCompare(img.id)}
                    onMouseDown={(e) => handleMouseDown(img.id, e)}
                    onReorder={handleReorder}
                    onDropFromLibrary={(imgId, atIdx) => {
                      if (!comparisonIds.includes(imgId)) {
                        setComparisonIds(prev => {
                          const next = [...prev];
                          next.splice(atIdx, 0, imgId);
                          return next;
                        });
                      }
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: INDEPENDENT COMPARE PANE
// Each comparison image has its own:
// Zoom, Pan, Rotate, Remove, Reset, Fit
// Drag-handle to reorder inside comparison area
// ============================================================================

interface ComparePaneProps {
  image: ClinicalImage;
  index: number;
  total: number;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onPanNudge: (dx: number, dy: number) => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onReset: () => void;
  onRemove: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onDropFromLibrary: (imgId: string, insertAtIndex: number) => void;
}

function ComparePane({
  image,
  index,
  total,
  zoom,
  pan,
  rotation,
  onZoomIn,
  onZoomOut,
  onFit,
  onPanNudge,
  onRotateLeft,
  onRotateRight,
  onReset,
  onRemove,
  onMouseDown,
  onReorder,
  onDropFromLibrary
}: ComparePaneProps) {
  const [isDragOverPane, setIsDragOverPane] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverPane(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        setIsDragOverPane(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverPane(false);
        const dragType = e.dataTransfer.getData('dragType');
        if (dragType === 'COMPARE_REORDER') {
          const fromIdxStr = e.dataTransfer.getData('reorderIndex');
          if (fromIdxStr !== '') {
            const fromIdx = parseInt(fromIdxStr, 10);
            onReorder(fromIdx, index);
          }
        } else if (dragType === 'LIBRARY_IMAGE') {
          const imgId = e.dataTransfer.getData('text/plain');
          if (imgId) onDropFromLibrary(imgId, index);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#1E293B',
        borderRadius: 8,
        overflow: 'hidden',
        border: isDragOverPane ? '2px solid #38BDF8' : '1px solid #334155',
        height: '100%',
        minHeight: 280,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        position: 'relative'
      }}
    >
      {/* TIER 1: DRAG HANDLE & PANE ACTIONS (Fit, Rotate, Reset, Remove) */}
      <div
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('reorderIndex', String(index));
          e.dataTransfer.setData('dragType', 'COMPARE_REORDER');
          e.dataTransfer.effectAllowed = 'move';
        }}
        style={{
          padding: '6px 10px',
          background: '#0F172A',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          userSelect: 'none'
        }}
        title="Drag by this bar to reorder panes"
      >
        {/* Left: Drag Handle, Pane Badge, Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={14} />
          </div>
          <span style={{
            background: '#334155',
            color: '#FFFFFF',
            fontSize: 9.5,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4
          }}>
            #{index + 1}
          </span>
          <span style={{
            background: image.type === 'BEFORE' ? '#B45309' : image.type === 'AFTER' ? '#15803D' : '#0369A1',
            color: '#FFFFFF',
            fontSize: 9.5,
            fontWeight: 900,
            padding: '2px 6px',
            borderRadius: 4
          }}>
            {image.type}
          </span>
          {(image as any).procedureName && (
            <span style={{
              background: '#0369A1',
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 3
            }}>
              {(image as any).procedureName}
            </span>
          )}
          <span style={{ fontSize: 10.5, color: '#CBD5E1', fontFamily: 'monospace' }}>
            {image.date} {image.time}
          </span>
        </div>

        {/* Right: Fit, Rotate, Reset & Remove */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Fit Image inside Comparison Box */}
          <button
            type="button"
            onClick={onFit}
            className="btn btn-xs"
            style={{
              background: '#0F172A',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 9.5,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
            title="Fit image inside comparison box (Center & Reset Zoom)"
          >
            <Maximize2 size={11} />
            <span>FIT</span>
          </button>

          {/* Rotate Left (-90°) */}
          <button
            type="button"
            onClick={onRotateLeft}
            className="btn btn-xs"
            style={{
              background: '#1E293B',
              border: '1px solid #475569',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '2px 5px',
              borderRadius: 4
            }}
            title="Rotate Left (-90°)"
          >
            <RotateCcw size={12} />
          </button>

          {/* Rotate Right (+90°) */}
          <button
            type="button"
            onClick={onRotateRight}
            className="btn btn-xs"
            style={{
              background: '#1E293B',
              border: '1px solid #475569',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '2px 5px',
              borderRadius: 4
            }}
            title="Rotate Right (+90°)"
          >
            <RotateCw size={12} />
          </button>

          {/* Reset Image */}
          <button
            type="button"
            onClick={onReset}
            className="btn btn-xs"
            style={{
              background: '#1E293B',
              border: '1px solid #475569',
              color: '#38BDF8',
              cursor: 'pointer',
              padding: '2px 5px',
              borderRadius: 4
            }}
            title="Reset Zoom, Pan & Rotation for this image"
          >
            <RefreshCw size={11} />
          </button>

          {/* Remove from compare */}
          <button
            type="button"
            onClick={onRemove}
            className="btn btn-xs"
            style={{
              background: '#334155',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              padding: '2px 5px',
              borderRadius: 4
            }}
            title="Remove from comparison workspace"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* TIER 2: INDEPENDENT ZOOM, PAN NUDGES & METRICS BAR */}
      <div style={{
        padding: '4px 10px',
        background: '#141E33',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 10,
        flexWrap: 'wrap',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Independent Zoom [-] 100% [+] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1E293B', padding: '1px 6px', borderRadius: 4, border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={onZoomOut}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 1 }}
              title="Zoom Out (-25%)"
            >
              <ZoomOut size={12} />
            </button>
            <span style={{ fontSize: 10.5, fontWeight: 800, width: 36, textAlign: 'center', color: '#38BDF8' }}>
              {zoom}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 1 }}
              title="Zoom In (+25%)"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          {/* Horizontal & Vertical Pan Nudge Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#1E293B', padding: '1px 5px', borderRadius: 4, border: '1px solid #334155' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', marginRight: 2 }}>PAN:</span>
            <button
              type="button"
              onClick={() => onPanNudge(-15, 0)}
              style={{ background: 'none', border: 'none', color: '#F1F5F9', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}
              title="Pan Left (Horizontal)"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => onPanNudge(0, -15)}
              style={{ background: 'none', border: 'none', color: '#F1F5F9', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}
              title="Pan Up (Vertical)"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onPanNudge(0, 15)}
              style={{ background: 'none', border: 'none', color: '#F1F5F9', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}
              title="Pan Down (Vertical)"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => onPanNudge(15, 0)}
              style={{ background: 'none', border: 'none', color: '#F1F5F9', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}
              title="Pan Right (Horizontal)"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Pan and Rotate Readouts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 10 }}>
          <span>Pan: [{Math.round(pan.x)}, {Math.round(pan.y)}]</span>
          {rotation !== 0 && (
            <span style={{ color: '#F59E0B', fontWeight: 800 }}>{rotation}°</span>
          )}
        </div>
      </div>

      {/* TIER 3: PANE VIEWPORT (INDEPENDENT DRAGGABLE PAN & ROTATION) */}
      <div
        onMouseDown={onMouseDown}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          background: '#020617',
          userSelect: 'none'
        }}
      >
        <img
          src={image.url}
          alt={image.fileName}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom / 100})`,
            transition: 'transform 0.05s ease',
            maxHeight: '94%',
            maxWidth: '94%',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />

        {/* Pan Instruction Badge */}
        <div style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9.5,
          color: '#94A3B8',
          pointerEvents: 'none'
        }}>
          Drag to Pan
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: IMAGE EDITOR MODAL (Prompt Sections 25 to 29)
// Zoom, Crop, Rotate, Pan, Mark/Annotations (Pen, Arrow, Circle, Rect, Text, Pin),
// Delete, Reset, Save, Cancel
// ============================================================================

interface ImageEditorModalProps {
  image: ClinicalImage;
  onClose: () => void;
  onSave: (img: ClinicalImage) => void;
}

function ImageEditorModal({ image, onClose, onSave }: ImageEditorModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [tool, setTool] = useState<'pen' | 'arrow' | 'circle' | 'rectangle' | 'text' | 'pin' | 'crop' | 'pan'>('pen');
  const [color, setColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [cropActive, setCropActive] = useState(false);
  const [editedDate, setEditedDate] = useState(image.date);
  const [editedTime, setEditedTime] = useState(image.time);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.url;
    img.onload = () => {
      canvas.width = img.width || 600;
      canvas.height = img.height || 450;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [image.url]);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'pan' || tool === 'crop') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setLastPoint({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pin') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('📍', x - 7, y + 4);
      setIsDrawing(false);
    } else if (tool === 'text') {
      const text = prompt('Enter clinical annotation text:');
      if (text) {
        ctx.fillStyle = color;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(text, x, y);
      }
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      setLastPoint({ x, y });
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;

    if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'rectangle') {
      ctx.strokeRect(lastPoint.x, lastPoint.y, x - lastPoint.x, y - lastPoint.y);
    } else if (tool === 'arrow') {
      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(y - lastPoint.y, x - lastPoint.x);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 15 * Math.cos(angle - Math.PI / 6), y - 15 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x - 15 * Math.cos(angle + Math.PI / 6), y - 15 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleResetMarks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.src = image.url;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const handleSaveEditor = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const editedUrl = canvas.toDataURL('image/jpeg', 0.95);
    onSave({
      ...image,
      url: editedUrl,
      date: editedDate,
      time: editedTime,
      notes: image.notes ? `${image.notes} (Annotated)` : 'Clinical annotations added'
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.92)',
      zIndex: 1300, display: 'flex', flexDirection: 'column', color: '#FFFFFF'
    }}>
      {/* Editor Top Bar (Prompt Section 25) */}
      <div style={{
        padding: '10px 20px',
        background: '#1E293B',
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Edit3 size={16} color="#0284C7" />
          <span style={{ fontSize: 14, fontWeight: 900 }}>
            Image Annotation &amp; Editing Studio — {image.fileName}
          </span>
        </div>

        {/* Date / Time Edit (Admin control) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0F172A', padding: '3px 8px', borderRadius: 6, border: '1px solid #334155' }}>
          <Clock size={12} color="#38BDF8" />
          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>TIMESTAMP:</span>
          <input
            type="text"
            value={editedDate}
            onChange={e => setEditedDate(e.target.value)}
            style={{ width: 85, height: 22, fontSize: 10.5, background: '#1E293B', color: '#FFFFFF', border: '1px solid #475569', borderRadius: 3, padding: '1px 4px', textAlign: 'center' }}
            title="Edit Date (DD/MM/YYYY)"
          />
          <input
            type="text"
            value={editedTime}
            onChange={e => setEditedTime(e.target.value)}
            style={{ width: 75, height: 22, fontSize: 10.5, background: '#1E293B', color: '#FFFFFF', border: '1px solid #475569', borderRadius: 3, padding: '1px 4px', textAlign: 'center' }}
            title="Edit Time (hh:mm AM/PM)"
          />
        </div>

        {/* Action Buttons: RESET, SAVE, CANCEL (Prompt Section 25) */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleResetMarks}
            className="btn btn-sm"
            style={{ background: '#475569', color: '#FFFFFF', border: 'none', fontWeight: 700 }}
          >
            [ RESET MARKS ]
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            style={{ color: '#94A3B8' }}
          >
            [ CANCEL ]
          </button>
          <button
            type="button"
            onClick={handleSaveEditor}
            className="btn btn-sm"
            style={{ background: '#10B981', color: '#FFFFFF', border: 'none', fontWeight: 900 }}
          >
            [ SAVE EDITS ]
          </button>
        </div>
      </div>

      {/* Editor Tool Strip: Annotation Tools, Colors, Zoom, Rotate (Prompt Sections 26 to 29) */}
      <div style={{
        padding: '8px 20px',
        background: '#0F172A',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Drawing Tools (Prompt Section 29) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginRight: 4 }}>TOOLS:</span>
          {[
            { id: 'pen', label: '✏ Pen' },
            { id: 'arrow', label: '➜ Arrow' },
            { id: 'circle', label: '○ Circle' },
            { id: 'rectangle', label: '□ Rectangle' },
            { id: 'text', label: 'T Text' },
            { id: 'pin', label: '📍 Marker' },
            { id: 'crop', label: '✂ Crop' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTool(t.id as any);
                if (t.id === 'crop') setCropActive(true);
              }}
              style={{
                background: tool === t.id ? '#0284C7' : '#1E293B',
                color: '#FFFFFF',
                border: '1px solid #334155',
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Color Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>COLOR:</span>
          {['#EF4444', '#3B82F6', '#EAB308', '#22C55E', '#FFFFFF'].map(c => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 18, height: 18, borderRadius: '50%', background: c,
                border: color === c ? '2px solid #FFFFFF' : '1px solid #334155',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>

        {/* Zoom & Rotation Controls (Prompt Sections 26, 28) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Zoom [-] 100% [+] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1E293B', padding: '2px 8px', borderRadius: 5 }}>
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(50, z - 25))}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, width: 44, textAlign: 'center' }}>
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(300, z + 25))}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Rotate Left / Rotate Right (Prompt Section 28) */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => setRotation(r => r - 90)}
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#FFFFFF', borderRadius: 5, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
              title="Rotate Left 90°"
            >
              <RotateCcw size={13} /> ↶ Left
            </button>
            <button
              type="button"
              onClick={() => setRotation(r => r + 90)}
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#FFFFFF', borderRadius: 5, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
              title="Rotate Right 90°"
            >
              <RotateCw size={13} /> ↷ Right
            </button>
          </div>
        </div>
      </div>

      {/* Editor Canvas Stage */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflow: 'auto',
        background: '#020617'
      }}>
        <div style={{
          position: 'relative',
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          transition: 'transform 0.15s ease',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          borderRadius: 6,
          overflow: 'hidden'
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            style={{
              display: 'block',
              cursor: tool === 'pen' ? 'crosshair' : tool === 'pin' ? 'pointer' : 'default'
            }}
          />

          {/* Crop Overlay if active (Prompt Section 27) */}
          {cropActive && (
            <div style={{
              position: 'absolute',
              inset: 30,
              border: '2px dashed #0284C7',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                background: '#0284C7',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                pointerEvents: 'auto',
                display: 'flex',
                gap: 6
              }}>
                <span>CROP AREA</span>
                <button
                  type="button"
                  onClick={() => setCropActive(false)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 900 }}
                >
                  ✓ Apply Crop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
