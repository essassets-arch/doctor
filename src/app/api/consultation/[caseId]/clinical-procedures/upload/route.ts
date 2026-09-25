import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ClinicalProcedure, ClinicalImage } from '../route';

const DATA_DIR = path.join(process.cwd(), 'public', 'uploads', 'consultation');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(caseId: string) {
  return path.join(DATA_DIR, `procedures-${encodeURIComponent(caseId)}.json`);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params;
    ensureDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const procedureId = formData.get('procedureId') as string;
    const sessionId = formData.get('sessionId') as string;
    const sectionId = formData.get('sectionId') as string;
    const subSectionId = (formData.get('subSectionId') as string) || undefined;
    const targetType = ((formData.get('targetType') as string) || 'BEFORE') as 'BEFORE' | 'AFTER' | 'OTHER' | 'GENERAL';
    const source = ((formData.get('source') as string) || 'UPLOAD') as 'UPLOAD' | 'CAMERA' | 'DERMASCOPE' | 'FACE_SCANNER' | 'PDF';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    let ext = 'jpg';
    if (isPdf) ext = 'pdf';
    else if (file.type === 'image/png') ext = 'png';
    else if (file.type === 'image/webp') ext = 'webp';

    const safeFilename = `proc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const destinationPath = path.join(DATA_DIR, safeFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);

    const publicUrl = `/uploads/consultation/${safeFilename}`;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const dateStr = `${d}/${m}/${y}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newImage: ClinicalImage = {
      id: `img-${Date.now()}`,
      url: publicUrl,
      type: targetType,
      date: dateStr,
      time: timeStr,
      fileName: file.name,
      fileType: isPdf ? 'application/pdf' : 'image/jpeg',
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      source,
      notes: isPdf ? `Clinical diagnostic PDF document uploaded on ${dateStr}` : `Clinical photograph captured on ${dateStr} at ${timeStr}`,
      originalCapturedAt: `${dateStr} ${timeStr}`,
      displayCapturedAt: `${dateStr} ${timeStr}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Load existing procedures
    const filePath = getFilePath(caseId);
    let procs: ClinicalProcedure[] = [];
    if (fs.existsSync(filePath)) {
      try {
        procs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }

    if (procedureId && procs.length > 0) {
      const targetProc = procs.find(p => p.id === procedureId);
      if (targetProc) {
        const sess = targetProc.sessions.find(s => s.id === sessionId);
        if (sess) {
          const sec = sess.sections.find(sc => sc.id === sectionId);
          if (sec) {
            if (subSectionId && subSectionId !== 'main') {
              const sub = sec.subSections.find(sb => sb.id === subSectionId);
              if (sub) {
                sub.images = [newImage, ...sub.images];
              }
            } else if (targetType === 'BEFORE') {
              sec.beforeImages = [newImage, ...sec.beforeImages];
            } else {
              sec.afterImages = [newImage, ...sec.afterImages];
            }
          }
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(procs, null, 2), 'utf8');
    }

    return NextResponse.json({
      success: true,
      image: newImage,
      procedures: procs
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to upload clinical procedure file.' },
      { status: 500 }
    );
  }
}
