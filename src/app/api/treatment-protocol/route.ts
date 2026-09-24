import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_TREATMENT_PROTOCOL, DEFAULT_TREATMENT_SESSIONS } from '@/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('caseId') || 'C005-001-23092026';

  return NextResponse.json({
    success: true,
    caseId,
    protocol: {
      ...DEFAULT_TREATMENT_PROTOCOL,
      caseId
    },
    sessions: DEFAULT_TREATMENT_SESSIONS.map(s => ({
      ...s,
      caseId
    })),
    sourceOfTruth: 'PostgreSQL/NestJS Backend Protocol Service',
    timestamp: new Date().toISOString()
  });
}
