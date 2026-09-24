import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_TREATMENT_PROTOCOL,
  DEFAULT_TREATMENT_SESSIONS,
  ProcedureExecutionItem,
  TreatmentProtocol,
  addDaysToFormattedDate,
  parseAnyDate,
  formatToDDMMYYYY
} from '@/store';

// In-memory backend server cache acting as the central single source of truth
// In production NestJS / Prisma / PostgreSQL architecture, this queries the PostgreSQL database
interface ProtocolRecord {
  protocol: TreatmentProtocol;
  sessions: ProcedureExecutionItem[];
}

const serverProtocolDatabase: Record<string, ProtocolRecord> = {
  'C005-001-23092026': {
    protocol: {
      ...DEFAULT_TREATMENT_PROTOCOL,
      caseId: 'C005-001-23092026',
      patientId: 'pat-1789991704297'
    },
    sessions: DEFAULT_TREATMENT_SESSIONS.map(s => ({
      ...s,
      caseId: 'C005-001-23092026',
      patientId: 'pat-1789991704297'
    }))
  }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await context.params;
  let record = serverProtocolDatabase[caseId];

  if (!record) {
    record = {
      protocol: {
        ...DEFAULT_TREATMENT_PROTOCOL,
        caseId,
        patientId: 'pat-1789991704297'
      },
      sessions: DEFAULT_TREATMENT_SESSIONS.map(s => ({
        ...s,
        caseId,
        patientId: 'pat-1789991704297'
      }))
    };
    serverProtocolDatabase[caseId] = record;
  }

  return NextResponse.json({
    success: true,
    caseId,
    protocol: record.protocol,
    sessions: record.sessions,
    sourceOfTruth: 'PostgreSQL/NestJS Backend Protocol Service',
    timestamp: new Date().toISOString()
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await context.params;
  const body = await request.json();

  let record = serverProtocolDatabase[caseId] || {
    protocol: { ...DEFAULT_TREATMENT_PROTOCOL, caseId, patientId: body.patientId || 'pat-1789991704297' },
    sessions: DEFAULT_TREATMENT_SESSIONS
  };

  if (body.protocol) {
    record.protocol = {
      ...record.protocol,
      ...body.protocol,
      updatedAt: new Date().toISOString()
    };
  }

  if (body.sessions && Array.isArray(body.sessions)) {
    record.sessions = body.sessions;
  }

  // Handle schedule recalculation action if requested
  if (body.action === 'recalculate_schedule' || body.action === 'auto_generate') {
    const count = Math.max(1, record.protocol.totalSessions || 4);
    const interval = Math.max(1, record.protocol.intervalDays || 20);
    const start = record.protocol.startDate || '2026-03-25';
    const ratePerSession = Math.round((record.protocol.afterDiscountPrice || 9000) / count);

    const newSessions: ProcedureExecutionItem[] = [];
    const parsedStart = parseAnyDate(start);
    let currentDate = formatToDDMMYYYY(parsedStart);

    for (let i = 1; i <= count; i++) {
      const isFirst = i === 1;
      const isSecond = i === 2;
      newSessions.push({
        id: `proc-${caseId}-${i}`,
        caseId,
        patientId: record.protocol.patientId,
        procedureName: record.protocol.procedureName,
        scheduledDate: currentDate,
        performanceDate: isFirst ? currentDate : '',
        sessionsCount: `${i}/${count}`,
        sessionNumber: i,
        totalSessions: count,
        therapist: record.protocol.therapist,
        bodyPart: record.protocol.bodyPart,
        intervalDays: interval,
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
        shotsFired: isFirst ? '100' : '',
        status: isFirst ? 'Done' : isSecond ? 'Confirmed' : 'Pending',
        remark: isFirst
          ? 'Session 1 completed with good follicular response. Mild transient erythema.'
          : isSecond
          ? 'CANFORMED - PAYMENT PAY AND GIVE APPIENTMENT (Click Delay 12d or Cancel)'
          : i === count
          ? `Final scheduled protocol session ${i}`
          : `Scheduled follow-up session ${i}`,
        rate: ratePerSession,
        price: ratePerSession,
        paymentStatus: isFirst ? 'Done' : 'Pending',
        completedInClinic: isFirst
      });
      currentDate = addDaysToFormattedDate(currentDate, interval);
    }
    record.sessions = newSessions;
  }

  // Handle delay session action
  if (body.action === 'delay_session' && body.procedureId) {
    const delayDays = body.delayDays || 12;
    const targetIdx = record.sessions.findIndex(s => s.id === body.procedureId);
    if (targetIdx !== -1) {
      const targetProc = record.sessions[targetIdx];
      const oldDate = targetProc.scheduledDate;
      record.sessions = record.sessions.map((s, idx) => {
        if (idx < targetIdx) return s;
        const shifted = addDaysToFormattedDate(s.scheduledDate, delayDays);
        if (idx === targetIdx) {
          return {
            ...s,
            scheduledDate: shifted,
            status: 'Delayed' as const,
            remark: body.reason || `DALY BY ${delayDays} DAY AUTO UPDATE (Shifted from ${oldDate})`
          };
        }
        return {
          ...s,
          scheduledDate: shifted,
          remark: s.remark ? `${s.remark} (Auto-shifted +${delayDays}d)` : `Auto-shifted +${delayDays}d due to session ${targetIdx + 1} delay`
        };
      });
    }
  }

  serverProtocolDatabase[caseId] = record;

  return NextResponse.json({
    success: true,
    caseId,
    protocol: record.protocol,
    sessions: record.sessions,
    message: 'Treatment protocol and sessions successfully updated in central database.',
    timestamp: new Date().toISOString()
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await context.params;
  const body = await request.json();

  let record = serverProtocolDatabase[caseId];
  if (!record) {
    record = {
      protocol: { ...DEFAULT_TREATMENT_PROTOCOL, caseId, patientId: body.patientId || 'pat-1789991704297' },
      sessions: DEFAULT_TREATMENT_SESSIONS
    };
  }

  // Update a single session by id
  if (body.procedureId && body.updates) {
    record.sessions = record.sessions.map(s =>
      s.id === body.procedureId ? { ...s, ...body.updates } : s
    );
  }

  // Update protocol fields
  if (body.protocolUpdates) {
    record.protocol = {
      ...record.protocol,
      ...body.protocolUpdates,
      updatedAt: new Date().toISOString()
    };
  }

  serverProtocolDatabase[caseId] = record;

  return NextResponse.json({
    success: true,
    caseId,
    protocol: record.protocol,
    sessions: record.sessions,
    timestamp: new Date().toISOString()
  });
}
