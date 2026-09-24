const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const values = new Map();
let failWrites = false;
global.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => { if (failWrites) throw new Error('Quota exceeded'); values.set(k, v); }, removeItem: k => values.delete(k) };
global.window = new EventTarget();
global.BroadcastChannel = undefined;
const stores = require('../src/store/index.ts');
const workflow = require('../src/store/workflow.ts');
const persistence = require('../src/store/persistence.ts');

const setup = async () => {
  await Promise.resolve();
  stores.usePatientStore.setState({ patients: [] });
  stores.useQueueStore.setState({ queue: [] });
  stores.useBillingStore.setState({ bills: [], payments: [], audit: [] });
  stores.useConsultationStore.setState({ sessions: {}, activeSession: null });
  stores.useAppointmentStore.setState({ appointments: [] });
  stores.useAdminStore.getState().updateSettings({ consultationFee: 500, followUpFee: 300 });
  const patient = stores.usePatientStore.getState().addPatient({ firstName: 'Controlled', lastName: 'Test', mobile: '9000000001', dob: '1990-01-01', age: 0, ageMonths: 0, ageDays: 0, gender: 'Other', language: 'English' });
  const doctor = stores.useQueueStore.getState().doctors[0];
  const entry = { caseNumber: 'ENC-20260924-0001', tokenDisplay: 'A-001', patientId: patient.id, patientName: 'Controlled Test', doctorId: doctor.id, doctorName: doctor.name, visitType: 'Consultation', appointmentTime: 'Walk-in', age: patient.age, gender: patient.gender, city: '', billingStatus: 'PAID', status: 'WAITING', vitalsRecorded: false, complaintsRecorded: false };
  return { patient, doctor, entry };
};

test('controlled financial journey: 4400 gross, 500 advance, two final tenders, exactly three payments and refresh', async () => {
  const { patient, doctor, entry } = await setup();
  workflow.checkIn(entry, [{ mode: 'CASH', amount: 500 }], 'checkin-1');
  const session = stores.useConsultationStore.getState().initSession(entry.caseNumber, patient, doctor);
  assert.equal(session.prescriptions.length, 0); assert.equal(session.procedures.length, 0); assert.equal(session.vitals.pulse, '');
  stores.useConsultationStore.getState().saveSession({ ...session, complaints: { ...session.complaints, presentComplaint: 'Controlled complaint' }, diagnosis: { ...session.diagnosis, finalDiagnosis: 'Controlled diagnosis', followUpDate: '2026-10-01' },
    procedures: [{ id: 'procedure-1', procedureName: 'Controlled procedure', sessionNumber: 1, scheduledDate: '2026-09-24', price: 2500, status: 'Done', consumables: [{ id: 'consumable-1', name: 'Controlled consumable', quantity: 1, unitPrice: 350 }] }],
    prescriptions: [{ id: 'rx-1', drugName: 'Controlled dispensing', price: 250, totalQty: 1, dispensed: true, dosage: '1', frequency: 'OD', durationDays: 1, instructions: '' }],
    investigations: [{ id: 'lab-1', testId: 'test-1', testName: 'Controlled lab', category: 'Test', price: 800, status: 'ORDERED' }] });
  workflow.endConsultation(entry.caseNumber);
  const bill = stores.useBillingStore.getState().bills[0];
  assert.deepEqual(workflow.totals(bill), { gross: 4400, discount: 0, foc: 0, net: 4400, paid: 500, outstanding: 3900 });
  assert.equal(new Set(bill.items.map(i => i.sourceType)).size, 5);
  const tenders = [{ mode: 'CASH', amount: 1900 }, { mode: 'UPI', amount: 2000, reference: 'controlled-ref', provider: 'controlled-provider' }];
  workflow.settleAndFinalize(bill.id, tenders, 'settle-1');
  workflow.settleAndFinalize(bill.id, tenders, 'settle-1');
  assert.equal(stores.useBillingStore.getState().payments.length, 3);
  assert.equal(workflow.totals(stores.useBillingStore.getState().bills[0]).outstanding, 0);
  assert.equal(stores.useAppointmentStore.getState().appointments.length, 1);
  assert.throws(() => stores.useBillingStore.getState().updateBill(bill.id, { netAmount: 1 }), /not allowed/);
  workflow.discharge(entry.caseNumber);
  persistence.hydrateAll();
  assert.equal(stores.useBillingStore.getState().payments.length, 3);
  assert.equal(stores.useBillingStore.getState().bills[0].lifecycle, 'FINALIZED');
  assert.ok(stores.useQueueStore.getState().queue[0].closedAt);
  assert.equal(stores.useConsultationStore.getState().sessions[entry.caseNumber].prescriptions.length, 1);
  assert.ok(values.has(persistence.DATABASE_KEY)); assert.equal(values.has('doctor-patients'), false);
});

test('invalid, negative, excess and duplicate payments; duplicate patient and active check-in', async () => {
  const { patient, entry } = await setup(); workflow.checkIn(entry);
  assert.throws(() => stores.usePatientStore.getState().addPatient(patient), /already registered/);
  assert.throws(() => workflow.checkIn({ ...entry, caseNumber: 'other', tokenDisplay: 'A-002' }), /active encounter/);
  const bill = stores.useBillingStore.getState().bills[0];
  for (const amount of [-1, 0, 501, NaN, Infinity]) assert.throws(() => workflow.receivePayment(bill.id, [{ mode: 'CASH', amount }], 'bad-' + amount));
  assert.throws(() => workflow.receivePayment(bill.id, [{ mode: 'UPI', amount: 1 }], 'no-ref'), /reference/);
  workflow.receivePayment(bill.id, [{ mode: 'CASH', amount: 100 }], 'one-request');
  workflow.receivePayment(bill.id, [{ mode: 'CASH', amount: 100 }], 'one-request');
  persistence.hydrateAll(); workflow.receivePayment(bill.id, [{ mode: 'CASH', amount: 100 }], 'one-request');
  assert.equal(stores.useBillingStore.getState().payments.length, 1);
  assert.throws(() => workflow.adjustBill(bill.id, 'FOC', 0, 'No authorization'), /administrator/);
});

test('storage failure leaves patient mutation and multi-store check-in uncommitted', async () => {
  const { entry } = await setup(); const before = values.get(persistence.DATABASE_KEY);
  failWrites = true;
  assert.throws(() => stores.usePatientStore.getState().addPatient({ firstName: 'Second', lastName: 'Test', mobile: '9000000002', age: 1, ageMonths: 0, ageDays: 0, gender: 'M', language: 'English' }), /not saved/);
  assert.equal(stores.usePatientStore.getState().patients.length, 1);
  assert.throws(() => workflow.checkIn(entry, [{ mode: 'CASH', amount: 500 }], 'fail-checkin'), /Quota/);
  assert.equal(stores.useQueueStore.getState().queue.length, 0);
  assert.equal(stores.useBillingStore.getState().payments.length, 0);
  assert.equal(values.get(persistence.DATABASE_KEY), before);
  failWrites = false;
});

test('clinical lock, duplicate sessions, consent requirement and finalization validation', async () => {
  const { entry, patient, doctor } = await setup(); const q = workflow.checkIn(entry);
  stores.useQueueStore.getState().updateStatus(q.id, 'IN_SESSION');
  assert.throws(() => stores.useQueueStore.getState().updateQueueEntry(q.id, { complaintNotes: 'Conflict' }), /locked/);
  stores.useConsultationStore.getState().initSession(entry.caseNumber, patient, doctor);
  assert.throws(() => workflow.endConsultation(entry.caseNumber), /chief complaint/);
  const procedure = { id: 'p1', procedureName: 'Controlled procedure', sessionNumber: 1, scheduledDate: '2026-09-24', price: 2500, status: 'Done', consentRequired: true };
  stores.useConsultationStore.getState().addProcedure(procedure);
  assert.throws(() => stores.useConsultationStore.getState().addProcedure(procedure), /Duplicate/);
  stores.useConsultationStore.getState().updateComplaints({ presentComplaint: 'Complaint' });
  stores.useConsultationStore.getState().updateDiagnosis({ finalDiagnosis: 'Diagnosis' });
  assert.throws(() => workflow.endConsultation(entry.caseNumber), /consent/);
});
