import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ClinicalImage {
  id: string;
  url: string;
  type: 'BEFORE' | 'AFTER' | 'OTHER' | 'GENERAL';
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
  crop?: any;
  originalCapturedAt?: string;
  displayCapturedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
  additionalImages?: ClinicalImage[];
  subSections: ClinicalSubSection[];
  activeSubSectionId?: string;
}

export interface ClinicalSession {
  id: string;
  sessionNumber: number;
  date: string; // DD/MM/YYYY
  sections: ClinicalSection[];
  activeSectionId: string;
  isExpanded?: boolean;
  therapist?: string;
  bodyPart?: string;
  doctorObservation?: string;
  efficacy?: string;
  status?: string;
}

export interface ClinicalProcedure {
  id: string;
  name: string;
  category: string;
  createdAt: string; // DD/MM/YYYY
  therapist?: string;
  bodyPart?: string;
  sessions: ClinicalSession[];
  doctorObservation?: string;
}

const DATA_DIR = path.join(process.cwd(), 'public', 'uploads', 'consultation');
const PHOTOS_DIR = path.join(process.cwd(), 'public', 'uploads', 'consultation', 'photos');
const proceduresCache = new Map<string, ClinicalProcedure[]>();

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }
}

function saveBase64Image(dataUri: string, id: string): string {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) return dataUri;
  try {
    ensureDir();
    const match = dataUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!match) return dataUri;
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const safeId = (id || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const targetPath = path.join(PHOTOS_DIR, filename);
    fs.writeFileSync(targetPath, Buffer.from(match[2], 'base64'));
    return `/uploads/consultation/photos/${filename}`;
  } catch (err) {
    console.error('Failed to convert base64 image to file:', err);
    return dataUri;
  }
}

function sanitizeProceduresImages(procs: ClinicalProcedure[]): { procedures: ClinicalProcedure[]; changed: boolean } {
  let changed = false;
  const processImg = (img: any) => {
    if (!img) return;
    if (img.url && typeof img.url === 'string' && img.url.startsWith('data:image/')) {
      img.url = saveBase64Image(img.url, img.id);
      changed = true;
    }
    if (img.originalUrl && typeof img.originalUrl === 'string' && img.originalUrl.startsWith('data:image/')) {
      img.originalUrl = img.url && !img.url.startsWith('data:') ? img.url : saveBase64Image(img.originalUrl, `${img.id}_orig`);
      changed = true;
    }
  };

  procs.forEach(p => {
    p.sessions?.forEach(s => {
      s.beforeImages?.forEach(processImg);
      s.afterImages?.forEach(processImg);
      s.subSections?.forEach(sub => sub.images?.forEach(processImg));
      s.sections?.forEach(sec => {
        sec.beforeImages?.forEach(processImg);
        sec.afterImages?.forEach(processImg);
        sec.subSections?.forEach(sub => sub.images?.forEach(processImg));
      });
    });
  });

  return { procedures: procs, changed };
}

function getFilePath(caseId: string) {
  return path.join(DATA_DIR, `procedures-${encodeURIComponent(caseId)}.json`);
}

function getInitialProcedures(): ClinicalProcedure[] {
  return [
    {
      id: 'proc-demo-1',
      name: 'Hair Removal',
      category: 'Laser Therapy',
      createdAt: '24/09/2026',
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
                  url: '/samples/lesion-before.jpg',
                  type: 'BEFORE',
                  date: '10/04/2026',
                  time: '03:42 PM',
                  fileName: 'Chin_Lateral_Before.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '672 KB',
                  source: 'CAMERA',
                  notes: 'Baseline follicular prominence prior to laser pulse',
                  createdAt: '2026-04-10T15:42:00.000Z',
                  displayCapturedAt: '10/04/2026 03:42 PM'
                }
              ],
              afterImages: [
                {
                  id: 'img-1-2',
                  url: '/samples/lesion-after.jpg',
                  type: 'AFTER',
                  date: '10/04/2026',
                  time: '04:15 PM',
                  fileName: 'Chin_Lateral_After_S1.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '750 KB',
                  source: 'CAMERA',
                  notes: 'Immediate post-treatment perifollicular response and 85% clearance',
                  createdAt: '2026-04-10T16:15:00.000Z',
                  displayCapturedAt: '10/04/2026 04:15 PM'
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
                      url: '/samples/lesion-before.jpg',
                      type: 'OTHER',
                      date: '10/04/2026',
                      time: '03:54 PM',
                      fileName: 'Perioral_HighMag.jpg',
                      fileType: 'image/jpeg',
                      fileSize: '672 KB',
                      source: 'DERMASCOPE',
                      notes: 'Micro-evaluation of upper lip follicle density',
                      createdAt: '2026-04-10T15:54:00.000Z',
                      displayCapturedAt: '10/04/2026 03:54 PM'
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
                  url: '/samples/lesion-before.jpg',
                  type: 'BEFORE',
                  date: '10/04/2026',
                  time: '03:48 PM',
                  fileName: 'Left_Cheek_Before.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '672 KB',
                  source: 'UPLOAD',
                  notes: 'Left malar zone pre-procedure',
                  createdAt: '2026-04-10T15:48:00.000Z',
                  displayCapturedAt: '10/04/2026 03:48 PM'
                }
              ],
              afterImages: [
                {
                  id: 'img-2-2',
                  url: '/samples/lesion-after.jpg',
                  type: 'AFTER',
                  date: '10/04/2026',
                  time: '04:20 PM',
                  fileName: 'Left_Cheek_After.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '750 KB',
                  source: 'UPLOAD',
                  notes: 'Smooth skin texture post cooling',
                  createdAt: '2026-04-10T16:20:00.000Z',
                  displayCapturedAt: '10/04/2026 04:20 PM'
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
          date: '25/04/2026',
          activeSectionId: 'sec-2-1',
          isExpanded: false,
          sections: [
            {
              id: 'sec-2-1',
              name: 'Section 1',
              beforeImages: [
                {
                  id: 'img-sess2-1',
                  url: '/samples/lesion-before.jpg',
                  type: 'BEFORE',
                  date: '25/04/2026',
                  time: '11:00 AM',
                  fileName: 'Session2_PreTreatment.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '672 KB',
                  source: 'CAMERA',
                  notes: 'Maintenance session baseline'
                }
              ],
              afterImages: [
                {
                  id: 'img-sess2-2',
                  url: '/samples/lesion-after.jpg',
                  type: 'AFTER',
                  date: '25/04/2026',
                  time: '11:35 AM',
                  fileName: 'Session2_PostTreatment.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '750 KB',
                  source: 'CAMERA',
                  notes: 'Excellent follicular reduction'
                }
              ],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-2-2',
              name: 'Section 2',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-2-3',
              name: 'Section 3',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-2-4',
              name: 'Section 4',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-2-5',
              name: 'Section 5',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            }
          ]
        },
        {
          id: 'sess-3',
          sessionNumber: 3,
          date: '10/05/2026',
          activeSectionId: 'sec-3-1',
          isExpanded: false,
          sections: [
            {
              id: 'sec-3-1',
              name: 'Section 1',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-3-2',
              name: 'Section 2',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-3-3',
              name: 'Section 3',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-3-4',
              name: 'Section 4',
              beforeImages: [],
              afterImages: [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            {
              id: 'sec-3-5',
              name: 'Section 5',
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
      name: 'PRP (Platelet-Rich Plasma) Therapy',
      category: 'Aesthetic / Regenerative',
      createdAt: '18/09/2026',
      therapist: 'Dr Valaki',
      bodyPart: 'SCALP',
      doctorObservation: 'Targeting vertex & crown miniaturized follicles. GFC autologous activation. 3 sessions planned at 3-week intervals.',
      sessions: [
        {
          id: 'sess-prp-1',
          sessionNumber: 1,
          date: '18/09/2026',
          activeSectionId: 'sec-prp-1',
          isExpanded: true,
          sections: [
            {
              id: 'sec-prp-1',
              name: 'Section 1',
              beforeImages: [
                {
                  id: 'img-prp-1',
                  url: '/samples/lesion-before.jpg',
                  type: 'BEFORE',
                  date: '18/09/2026',
                  time: '10:15 AM',
                  fileName: 'Scalp_Vertex_PrePRP.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '672 KB',
                  source: 'CAMERA',
                  notes: 'Trichoscopy shows 35% telogen hair shift in mid-scalp'
                }
              ],
              afterImages: [
                {
                  id: 'img-prp-2',
                  url: '/samples/lesion-after.jpg',
                  type: 'AFTER',
                  date: '18/09/2026',
                  time: '10:55 AM',
                  fileName: 'Scalp_Vertex_PostPRP.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '750 KB',
                  source: 'CAMERA',
                  notes: 'Immediate post micro-needling activation'
                }
              ],
              subSections: [],
              activeSubSectionId: 'main'
            },
            { id: 'sec-prp-2', name: 'Section 2', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: 'sec-prp-3', name: 'Section 3', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: 'sec-prp-4', name: 'Section 4', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: 'sec-prp-5', name: 'Section 5', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' }
          ]
        }
      ]
    },
    {
      id: 'proc-demo-3',
      name: 'Chemical Peeling & Resurfacing',
      category: 'Cosmetology',
      createdAt: '12/09/2026',
      therapist: 'Dr Valaki',
      bodyPart: 'FACE',
      doctorObservation: 'Salicylic-Mandelic combination peel 20%. Target active comedones and post-inflammatory hyperpigmentation.',
      sessions: [
        {
          id: 'sess-peel-1',
          sessionNumber: 1,
          date: '12/09/2026',
          activeSectionId: 'sec-peel-1',
          isExpanded: false,
          sections: [
            {
              id: 'sec-peel-1',
              name: 'Section 1',
              beforeImages: [
                {
                  id: 'img-peel-1',
                  url: '/samples/lesion-before.jpg',
                  type: 'BEFORE',
                  date: '12/09/2026',
                  time: '02:30 PM',
                  fileName: 'Peeling_Baseline.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '672 KB',
                  source: 'UPLOAD',
                  notes: 'Malar pigmentary patches'
                }
              ],
              afterImages: [
                {
                  id: 'img-peel-2',
                  url: '/samples/lesion-after.jpg',
                  type: 'AFTER',
                  date: '12/09/2026',
                  time: '03:10 PM',
                  fileName: 'Peeling_Post_Frosting.jpg',
                  fileType: 'image/jpeg',
                  fileSize: '750 KB',
                  source: 'UPLOAD',
                  notes: 'Uniform endpoint mild erythema achieved'
                }
              ],
              subSections: [],
              activeSubSectionId: 'main'
            },
            { id: 'sec-peel-2', name: 'Section 2', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: 'sec-peel-3', name: 'Section 3', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: 'sec-peel-4', name: 'Section 4', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: 'sec-peel-5', name: 'Section 5', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' }
          ]
        }
      ]
    }
  ];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params;
    ensureDir();

    const filePath = getFilePath(caseId);
    let procs: ClinicalProcedure[] | undefined;

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        procs = JSON.parse(content);
        if (procs && Array.isArray(procs) && procs.length > 0) {
          const { changed } = sanitizeProceduresImages(procs);
          if (changed) {
            fs.writeFileSync(filePath, JSON.stringify(procs, null, 2), 'utf8');
          }
          proceduresCache.set(caseId, procs);
        }
      } catch (err) {
        console.warn('Error reading from disk:', err);
      }
    }

    if (!procs || !Array.isArray(procs) || procs.length === 0) {
      procs = proceduresCache.get(caseId);
    }

    if (!procs || !Array.isArray(procs) || procs.length === 0) {
      procs = getInitialProcedures();
      proceduresCache.set(caseId, procs);
      fs.writeFileSync(filePath, JSON.stringify(procs, null, 2), 'utf8');
    }

    return NextResponse.json({
      success: true,
      caseId,
      procedures: procs
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch clinical procedures.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params;
    ensureDir();

    const body = await request.json();
    const filePath = getFilePath(caseId);
    let procs: ClinicalProcedure[] | undefined;

    if (fs.existsSync(filePath)) {
      try {
        procs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }

    if (!procs || !Array.isArray(procs) || procs.length === 0) {
      procs = proceduresCache.get(caseId);
    }

    if (!procs) {
      procs = getInitialProcedures();
    }

    const { action } = body;

    if (action === 'add_procedure') {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const todayDate = body.date || `${d}/${m}/${y}`;

      const newProc: ClinicalProcedure = body.procedure || {
        id: body.id || `proc-${Date.now()}`,
        name: body.name?.trim() || 'General Clinical Treatment',
        category: body.category || 'Clinical Dermatology',
        createdAt: todayDate,
        therapist: body.therapist || 'Dr Valaki',
        bodyPart: body.bodyPart || 'CLINICAL SITE',
        doctorObservation: `Clinical protocol initiated on ${todayDate}.`,
        sessions: [
          {
            id: body.sessionId || `sess-${Date.now()}-1`,
            sessionNumber: 1,
            date: todayDate,
            activeSectionId: `sec-${Date.now()}-1`,
            isExpanded: true,
            sections: [
              {
                id: `sec-${Date.now()}-1`,
                name: 'Section 1',
                beforeImages: body.beforeImages || [],
                afterImages: body.afterImages || [],
                subSections: [],
                activeSubSectionId: 'main'
              },
              { id: `sec-${Date.now()}-2`, name: 'Section 2', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
              { id: `sec-${Date.now()}-3`, name: 'Section 3', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
              { id: `sec-${Date.now()}-4`, name: 'Section 4', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
              { id: `sec-${Date.now()}-5`, name: 'Section 5', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' }
            ]
          }
        ]
      };

      procs = [newProc, ...procs];
    } else if (action === 'add_session') {
      const { procedureId, date, sessionNumber, therapist, bodyPart, doctorObservation, efficacy, status, beforeImages, afterImages } = body;
      let targetProc = procs.find(p => p.id === procedureId || (body.procedureName && p.name.toLowerCase() === body.procedureName.toLowerCase())) || procs[0];
      if (targetProc) {
        const nextNum = sessionNumber || (targetProc.sessions.length + 1);
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const sessionDate = date || `${d}/${m}/${y}`;

        const newSession: ClinicalSession = body.session || {
          id: body.sessionId || `sess-${Date.now()}-${nextNum}`,
          sessionNumber: nextNum,
          date: sessionDate,
          activeSectionId: `sec-${Date.now()}-1`,
          isExpanded: true,
          therapist: therapist || targetProc.therapist || 'Dr Valaki',
          bodyPart: bodyPart || targetProc.bodyPart || 'FACE',
          doctorObservation: doctorObservation || '',
          efficacy: efficacy || '',
          status: status || 'Done',
          sections: [
            {
              id: `sec-${Date.now()}-1`,
              name: 'Section 1',
              beforeImages: beforeImages || [],
              afterImages: afterImages || [],
              subSections: [],
              activeSubSectionId: 'main'
            },
            { id: `sec-${Date.now()}-2`, name: 'Section 2', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-3`, name: 'Section 3', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-4`, name: 'Section 4', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' },
            { id: `sec-${Date.now()}-5`, name: 'Section 5', beforeImages: [], afterImages: [], subSections: [], activeSubSectionId: 'main' }
          ]
        };

        const existingIdx = targetProc.sessions.findIndex(s => s.id === newSession.id);
        if (existingIdx >= 0) {
          targetProc.sessions[existingIdx] = {
            ...targetProc.sessions[existingIdx],
            ...newSession,
            date: sessionDate,
            therapist: therapist || targetProc.sessions[existingIdx].therapist || targetProc.therapist,
            bodyPart: bodyPart || targetProc.sessions[existingIdx].bodyPart || targetProc.bodyPart,
            doctorObservation: doctorObservation !== undefined ? doctorObservation : targetProc.sessions[existingIdx].doctorObservation,
            status: status || targetProc.sessions[existingIdx].status || 'Done'
          };
          if (beforeImages && beforeImages.length > 0) {
            const currentBefore = targetProc.sessions[existingIdx].sections[0]?.beforeImages || [];
            targetProc.sessions[existingIdx].sections[0].beforeImages = [...beforeImages, ...currentBefore];
          }
          if (afterImages && afterImages.length > 0) {
            const currentAfter = targetProc.sessions[existingIdx].sections[0]?.afterImages || [];
            targetProc.sessions[existingIdx].sections[0].afterImages = [...afterImages, ...currentAfter];
          }
        } else {
          targetProc.sessions.push(newSession);
        }
      }
    } else if (action === 'update_session') {
      const { procedureId, sessionId, updates } = body;
      const targetProc = procs.find(p => p.id === procedureId);
      if (targetProc) {
        const sess = targetProc.sessions.find(s => s.id === sessionId);
        if (sess && updates) {
          Object.assign(sess, updates);
        }
      }
    } else if (action === 'add_subsection') {
      const { procedureId, sessionId, sectionId, name } = body;
      const targetProc = procs.find(p => p.id === procedureId);
      if (targetProc) {
        const sess = targetProc.sessions.find(s => s.id === sessionId);
        if (sess) {
          const sec = sess.sections.find(sc => sc.id === sectionId);
          if (sec) {
            const nextSubNum = sec.subSections.length + 1;
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            const dateStr = `${d}/${m}/${y}`;

            const newSub: ClinicalSubSection = {
              id: `subsec-${Date.now()}-${nextSubNum}`,
              name: name || `Sub-Section ${nextSubNum}`,
              createdAt: `${dateStr} ${timeStr}`,
              images: []
            };

            sec.subSections.push(newSub);
            sec.activeSubSectionId = newSub.id;
          }
        }
      }
    } else if (action === 'save_observation') {
      const { procedureId, observation } = body;
      const targetProc = procs.find(p => p.id === procedureId);
      if (targetProc) {
        targetProc.doctorObservation = observation;
      }
    } else if (action === 'update_image_datetime') {
      const { imageId, newDate, newTime } = body;
      procs.forEach(p => {
        p.sessions.forEach(s => {
          s.sections.forEach(sec => {
            sec.beforeImages.forEach(i => {
              if (i.id === imageId) {
                if (!i.originalCapturedAt) i.originalCapturedAt = `${i.date} ${i.time}`;
                i.date = newDate;
                i.time = newTime;
                i.displayCapturedAt = `${newDate} ${newTime}`;
                i.updatedAt = new Date().toISOString();
              }
            });
            sec.afterImages.forEach(i => {
              if (i.id === imageId) {
                if (!i.originalCapturedAt) i.originalCapturedAt = `${i.date} ${i.time}`;
                i.date = newDate;
                i.time = newTime;
                i.displayCapturedAt = `${newDate} ${newTime}`;
                i.updatedAt = new Date().toISOString();
              }
            });
            sec.subSections.forEach(sub => {
              sub.images.forEach(i => {
                if (i.id === imageId) {
                  if (!i.originalCapturedAt) i.originalCapturedAt = `${i.date} ${i.time}`;
                  i.date = newDate;
                  i.time = newTime;
                  i.displayCapturedAt = `${newDate} ${newTime}`;
                  i.updatedAt = new Date().toISOString();
                }
              });
            });
          });
        });
      });
    } else if (action === 'delete_image') {
      const { imageId } = body;
      procs.forEach(p => {
        p.sessions.forEach(s => {
          s.sections.forEach(sec => {
            sec.beforeImages = sec.beforeImages.filter(i => i.id !== imageId);
            sec.afterImages = sec.afterImages.filter(i => i.id !== imageId);
            sec.subSections.forEach(sub => {
              sub.images = sub.images.filter(i => i.id !== imageId);
            });
          });
        });
      });
    } else if (action === 'save_image_edit') {
      const { imageId, patch } = body;
      procs.forEach(p => {
        p.sessions.forEach(s => {
          s.sections.forEach(sec => {
            sec.beforeImages = sec.beforeImages.map(i => i.id === imageId ? { ...i, ...patch } : i);
            sec.afterImages = sec.afterImages.map(i => i.id === imageId ? { ...i, ...patch } : i);
            sec.subSections.forEach(sub => {
              sub.images = sub.images.map(i => i.id === imageId ? { ...i, ...patch } : i);
            });
          });
        });
      });
    } else if (action === 'append_image') {
      const { procedureId, sessionId, sectionId, subSectionId, targetType, image } = body;
      const targetProc = procs.find(p => p.id === procedureId);
      if (targetProc) {
        const sess = targetProc.sessions.find(s => s.id === sessionId);
        if (sess) {
          const sec = sess.sections.find(sc => sc.id === sectionId);
          if (sec) {
            if (subSectionId && subSectionId !== 'main') {
              const sub = sec.subSections.find(sb => sb.id === subSectionId);
              if (sub) {
                sub.images = [image, ...sub.images];
              }
            } else if (targetType === 'BEFORE') {
              sec.beforeImages = [image, ...sec.beforeImages];
            } else {
              sec.afterImages = [image, ...sec.afterImages];
            }
          }
        }
      }
    } else if (action === 'delete_procedure') {
      const { procedureId } = body;
      procs = procs.filter(p => p.id !== procedureId);
    } else if (action === 'sync_all') {
      if (body.procedures && Array.isArray(body.procedures)) {
        procs = body.procedures;
      }
    }

    sanitizeProceduresImages(procs);
    proceduresCache.set(caseId, procs);
    fs.writeFileSync(filePath, JSON.stringify(procs, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      caseId,
      procedures: procs
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update clinical procedures.' },
      { status: 500 }
    );
  }
}
