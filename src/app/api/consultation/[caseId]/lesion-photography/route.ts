import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Store photography documents by caseId (in-memory + filesystem backed)
const photographyStore = new Map<string, any>();

const DATA_DIR = path.join(process.cwd(), 'public', 'uploads', 'consultation');

function ensureUploadDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultDocument(caseId: string) {
  return {
    consultationId: caseId,
    images: [
      {
        id: 'img-demo-before',
        assetId: 'asset-demo-before',
        src: '/samples/lesion-before.jpg',
        name: 'Dermoscopy-PreTreatment-Plaque.jpg',
        type: 'image/jpeg',
        size: 688883,
        width: 1024,
        height: 768,
        uploadedAt: '2026-09-24T10:00:00.000Z',
        source: 'UPLOAD',
        uploadStatus: 'uploaded',
        uploadProgress: 100
      },
      {
        id: 'img-demo-after',
        assetId: 'asset-demo-after',
        src: '/samples/lesion-after.jpg',
        name: 'Dermoscopy-PostTreatment-Clearance.jpg',
        type: 'image/jpeg',
        size: 768467,
        width: 1024,
        height: 768,
        uploadedAt: '2026-09-24T10:05:00.000Z',
        source: 'UPLOAD',
        uploadStatus: 'uploaded',
        uploadProgress: 100
      }
    ],
    markers: [
      {
        id: 'mkr-1',
        imageId: 'img-demo-before',
        type: 'ERYTHEMA_MARGIN',
        x: 0.52,
        y: 0.48,
        note: 'Central erythematous plaque with mild irregular margin',
        label: '1',
        createdAt: '2026-09-24T10:01:00.000Z',
        updatedAt: '2026-09-24T10:01:00.000Z'
      },
      {
        id: 'mkr-2',
        imageId: 'img-demo-before',
        type: 'ACTIVE_INDURATION',
        x: 0.44,
        y: 0.53,
        note: 'Mild palpable induration and erythema perimeter',
        label: '2',
        createdAt: '2026-09-24T10:02:00.000Z',
        updatedAt: '2026-09-24T10:02:00.000Z'
      }
    ],
    selectedImageId: 'img-demo-before',
    beforeImageId: 'img-demo-before',
    afterImageId: 'img-demo-after',
    comparisonPosition: 50,
    efficacyPercentage: 85,
    efficacySource: 'MANUAL'
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params;
    ensureUploadDir();

    let doc = photographyStore.get(caseId);

    // Also check local json file persistence if available
    const docFilePath = path.join(DATA_DIR, `doc-${encodeURIComponent(caseId)}.json`);
    if (!doc && fs.existsSync(docFilePath)) {
      try {
        const fileContent = fs.readFileSync(docFilePath, 'utf8');
        doc = JSON.parse(fileContent);
        photographyStore.set(caseId, doc);
      } catch {
        // Fallback to default
      }
    }

    if (!doc || !Array.isArray(doc.images) || doc.images.length === 0) {
      doc = getDefaultDocument(caseId);
      photographyStore.set(caseId, doc);
    }

    return NextResponse.json(
      { photography: doc },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load consultation photography.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params;
    ensureUploadDir();

    const body = await request.json();
    if (!body || body.consultationId !== caseId) {
      return NextResponse.json(
        { error: 'Invalid photography payload: consultation ID mismatch.' },
        { status: 400 }
      );
    }

    photographyStore.set(caseId, body);

    // Persist to disk
    const docFilePath = path.join(DATA_DIR, `doc-${encodeURIComponent(caseId)}.json`);
    fs.writeFileSync(docFilePath, JSON.stringify(body, null, 2), 'utf8');

    return NextResponse.json(
      { success: true, photography: body },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save consultation photography.' },
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
    ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageId = (formData.get('imageId') as string) || crypto.randomUUID();

    if (!file) {
      return NextResponse.json(
        { error: 'No image file uploaded.' },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = 'jpg';
    if (file.type === 'image/png') ext = 'png';
    else if (file.type === 'image/webp') ext = 'webp';

    const safeFilename = `lesion-${Date.now()}-${imageId.replace(/[^a-zA-Z0-9_-]/g, '')}.${ext}`;
    const destinationPath = path.join(DATA_DIR, safeFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);

    const publicUrl = `/uploads/consultation/${safeFilename}`;

    return NextResponse.json(
      {
        assetId: `asset-${imageId}`,
        src: publicUrl
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload consultation photo.' },
      { status: 500 }
    );
  }
}
