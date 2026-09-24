import { NextResponse } from 'next/server';

// No authenticated backend, schema, or asset storage adapter exists in this
// workspace. Do not accept patient data into a Map and report a durable save.
// Connect this existing boundary to the authenticated consultation service.
function unavailable() {
  return NextResponse.json({
    error: 'Consultation photography storage is not connected. Images and annotations are temporary until the authenticated backend is configured.',
    code: 'PHOTOGRAPHY_STORAGE_UNAVAILABLE',
  }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
export const GET = unavailable;
export const PUT = unavailable;
export const POST = unavailable;
