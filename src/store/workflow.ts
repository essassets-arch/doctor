import { useAdminStore, useAppointmentStore, useBillingStore, useConsultationStore, useInventoryStore, usePatientStore, useQueueStore, useUIStore, type BillItem, type BillRecord, type PaymentMode, type QueueEntry } from './index';
import { atomic } from './persistence';

export const money = (value: number) => {
  if (!Number.isFinite(value) || value < 0) throw new Error('Amount must be a finite, non-negative number.');
  const minor = Math.round((value + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(minor)) throw new Error('Amount is too large.');
  return minor;
};
export interface Payment {
  id: string; requestId: string; billId: string; encounterId: string;
  amount: number; mode: PaymentMode; reference: string; provider: string; date: string; receivedBy: string;
}
export interface BillAudit { id: string; billId: string; action: string; reason: string; user: string; date: string }
export interface Tender { amount: number; mode: PaymentMode; reference?: string; provider?: string }
export function totals(bill: BillRecord) {
  const gross = bill.items.reduce((sum, item) => sum + money(item.total), 0);
  const discount = money(bill.discountAmount || 0);
  const foc = money(bill.focAdjustment || 0);
  const net = Math.max(0, gross - discount - foc);
  const paid = useBillingStore.getState().payments.filter(p => p.billId === bill.id).reduce((sum, p) => sum + money(p.amount), 0);
  return { gross: gross / 100, discount: discount / 100, foc: foc / 100, net: net / 100, paid: paid / 100, outstanding: Math.max(0, net - paid) / 100 };
}
function derived(bill: BillRecord): BillRecord {
  const t = totals(bill);
  return { ...bill, netAmount: t.net, collectedAmount: t.paid, balance: t.outstanding, status: t.outstanding ? (t.paid ? 'PARTIAL' : 'PENDING') : (t.foc ? 'FOC' : 'PAID') };
}
function item(sourceType: string, sourceId: string, name: string, price: number, quantity = 1): BillItem {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantity must be a positive integer.');
  const total = money(price) * quantity / 100;
  return { id: `${sourceType}:${sourceId}`, sourceType, sourceId, name, unitPrice: money(price) / 100, quantity, discount: 0, taxableAmount: total, tax: 0, total };
}
export function generateBill(encounterId: string): BillRecord {
  const q = useQueueStore.getState().queue.find(q => q.caseNumber === encounterId);
  if (!q) throw new Error('Encounter not found.');
  const patient = usePatientStore.getState().getPatientById(q.patientId);
  if (!patient) throw new Error('Patient not found.');
  const state = useBillingStore.getState();
  const existing = state.bills.find(b => b.encounterId === encounterId);
  if (existing?.lifecycle === 'FINALIZED') return existing;
  const session = useConsultationStore.getState().sessions[encounterId];
  const fee = q.consultationFee ?? session?.billing.consultationFee ?? useAdminStore.getState().settings.consultationFee;
  if (fee === undefined) throw new Error('Configure the consultation fee in Admin Settings before check-in.');
  const items = [item('CONSULTATION', encounterId, 'Consultation', fee)];
  session?.investigations.filter(i => i.location !== 'EXTERNAL').forEach(i => items.push(item('INVESTIGATION', i.id || i.testId, i.testName, i.price, i.quantity || 1)));
  session?.procedures.filter(p => p.completedInClinic || p.status === 'Done').forEach(p => {
    items.push(item('PROCEDURE', p.id, `${p.procedureName} — session ${p.sessionNumber || p.sessionsCount || ''}`, p.price));
    p.consumables?.forEach(c => items.push(item('CONSUMABLE', `${p.id}:${c.id}`, c.name, c.unitPrice, c.quantity)));
  });
  session?.prescriptions.filter(p => p.dispensed).forEach(p => items.push(item(p.topical ? 'TOPICAL' : 'PHARMACY', p.id, p.drugName, Number(p.price || 0), Number(p.totalQty))));
  const bill = derived({ ...(existing || {}), id: existing?.id || crypto.randomUUID(), encounterId,
    invoiceNumber: existing?.invoiceNumber || '', patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}`,
    mrdNumber: patient.mrdNumber, doctorName: q.doctorName, date: new Date().toISOString().slice(0, 10),
    lifecycle: 'DRAFT', items, netAmount: 0, collectedAmount: 0, balance: 0, status: 'PENDING' });
  useBillingStore.setState({ bills: [...state.bills.filter(b => b.id !== bill.id), bill] });
  return bill;
}
export function receivePayment(billId: string, tenders: Tender[], requestId: string): BillRecord {
  return atomic(() => {
    const state = useBillingStore.getState();
    const bill = state.bills.find(b => b.id === billId);
    if (!bill?.encounterId) throw new Error('Select an encounter bill.');
    if (!requestId.trim()) throw new Error('Payment request ID is required.');
    if (state.payments.some(p => p.requestId === requestId)) {
      if (state.payments.some(p => p.requestId === requestId && p.billId !== billId)) throw new Error('Request ID already used for another bill.');
      return bill;
    }
    if (bill.lifecycle === 'FINALIZED') throw new Error('Finalized bills are read-only.');
    if (!tenders.length) throw new Error('Enter at least one payment.');
    const receivedBy = useUIStore.getState().currentUser.name;
    if (!receivedBy.trim()) throw new Error('A receiving user is required.');
    const payments = tenders.map(t => {
      if (!['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'REMOTE_PAYMENT'].includes(t.mode) || money(t.amount) <= 0) throw new Error('Select a valid payment mode and amount greater than zero.');
      if (t.mode !== 'CASH' && (!t.reference?.trim() || !t.provider?.trim())) throw new Error('Non-cash payments require a reference and provider.');
      return { id: crypto.randomUUID(), requestId, billId, encounterId: bill.encounterId!, amount: money(t.amount) / 100,
        mode: t.mode, reference: t.reference?.trim() || '', provider: t.provider?.trim() || '', date: new Date().toISOString(), receivedBy };
    });
    if (payments.reduce((sum, p) => sum + money(p.amount), 0) > money(totals(bill).outstanding)) throw new Error('Payment exceeds the outstanding balance.');
    useBillingStore.setState({ payments: [...state.payments, ...payments] });
    const updated = derived(bill);
    useBillingStore.setState({ bills: state.bills.map(b => b.id === billId ? updated : b) });
    return updated;
  });
}
export function adjustBill(billId: string, kind: 'AMOUNT' | 'PERCENT' | 'FOC', amount: number, reason: string) {
  const user = useUIStore.getState().currentUser;
  if (!['admin', 'administrator'].includes(user.role.toLowerCase())) throw new Error('Only the configured administrator role can authorize adjustments.');
  if (!reason.trim()) throw new Error('An authorization reason is required.');
  const state = useBillingStore.getState(); const bill = state.bills.find(b => b.id === billId);
  if (!bill || bill.lifecycle === 'FINALIZED') throw new Error('Select an editable draft bill.');
  const t = totals(bill);
  if (kind === 'PERCENT' && amount > 100) throw new Error('Percentage cannot exceed 100.');
  const discount = kind === 'PERCENT' ? Math.round(money(t.gross) * amount / 100) / 100 : amount;
  if (kind !== 'FOC' && money(discount) > money(t.gross - t.paid)) throw new Error('Discount exceeds the unpaid amount.');
  if (kind === 'FOC' && t.paid > 0) throw new Error('Refund existing payments before applying FOC.');
  const updated = derived({ ...bill, discountAmount: kind === 'FOC' ? 0 : discount, focAdjustment: kind === 'FOC' ? t.gross : 0 });
  useBillingStore.setState({ bills: state.bills.map(b => b.id === billId ? updated : b),
    audit: [...state.audit, { id: crypto.randomUUID(), billId, action: kind === 'FOC' ? 'FOC Applied' : `Discount ${kind}`, reason, user: user.name, date: new Date().toISOString() }] });
}
export function settleAndFinalize(billId: string, tenders: Tender[], requestId: string) {
  return atomic(() => {
    let bill = useBillingStore.getState().bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found.');
    if (bill.lifecycle === 'FINALIZED') return bill;
    const session = useConsultationStore.getState().sessions[bill.encounterId || ''];
    if (!session?.isFinalized) throw new Error('End the consultation before finalizing billing.');
    if (tenders.length) bill = receivePayment(billId, tenders, requestId);
    if (money(totals(bill).outstanding) !== 0) throw new Error('Settle the entire outstanding balance before finalization.');
    const settings = useAdminStore.getState().settings;
    if (!settings.name.trim() || !settings.address.trim() || !settings.gstNumber.trim()) throw new Error('Configure clinic legal name, address and GSTIN before invoicing.');
    const finalBill: BillRecord = { ...bill, lifecycle: 'FINALIZED', finalizedAt: new Date().toISOString(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      clinicSnapshot: { ...settings }, patientSnapshot: { ...usePatientStore.getState().getPatientById(bill.patientId)! } };
    useBillingStore.setState({ bills: useBillingStore.getState().bills.map(b => b.id === billId ? finalBill : b) });
    return finalBill;
  });
}
export function checkIn(entry: Omit<QueueEntry, 'id'>, tenders: Tender[] = [], requestId = crypto.randomUUID()) {
  return atomic(() => {
    const queue = useQueueStore.getState().addToQueue(entry);
    const bill = generateBill(queue.caseNumber);
    if (tenders.length) receivePayment(bill.id, tenders, requestId);
    return queue;
  });
}
export function endConsultation(encounterId: string) {
  return atomic(() => {
    const session = useConsultationStore.getState().sessions[encounterId];
    if (!session) throw new Error('Consultation not found.');
    if (!session.complaints.presentComplaint.trim() || !(session.diagnosis.finalDiagnosis || session.diagnosis.provisional).trim()) throw new Error('Record the chief complaint and diagnosis before ending consultation.');
    if (session.isFinalized) return;
    for (const p of session.procedures) {
      if (p.consentRequired && (p.completedInClinic || p.status === 'Done') && !session.consents?.some(c => c.procedureId === p.id && c.signature && c.content)) throw new Error('Signed consent is required for ' + p.procedureName + '.');
    }
    useConsultationStore.getState().loadSession(encounterId);
    useConsultationStore.getState().finalizeConsultation();
    generateBill(encounterId);
    useQueueStore.getState().endSessionAndSendToBilling(encounterId);
    const date = session.diagnosis.followUpDate;
    if (date && !useAppointmentStore.getState().appointments.some(a => a.sourceEncounterId === encounterId)) {
      useAppointmentStore.getState().addAppointment({ patientId: session.patientId, patientName: session.patientName, doctorId: session.doctorId,
        doctorName: session.doctorName, date, time: '', visitType: 'Follow-Up', status: 'SCHEDULED', sourceEncounterId: encounterId });
    }
  });
}
export function discharge(encounterId: string) {
  const bill = useBillingStore.getState().bills.find(b => b.encounterId === encounterId);
  if (!bill || bill.lifecycle !== 'FINALIZED' || totals(bill).outstanding) throw new Error('Finalize and settle the bill before discharge.');
  const entry = useQueueStore.getState().queue.find(q => q.caseNumber === encounterId);
  if (!entry) throw new Error('Encounter not found.');
  useQueueStore.getState().updateQueueEntry(entry.id, { status: 'COMPLETED', stage: 'COMPLETED', closedAt: new Date().toISOString(), billingStatus: 'PAID' });
}

export function dispensePrescription(encounterId: string, prescriptionId: string) {
  return atomic(() => {
    const state = useConsultationStore.getState(); const session = state.sessions[encounterId];
    const rx = session?.prescriptions.find(p => p.id === prescriptionId);
    if (!session?.isFinalized || !rx) throw new Error('Select a prescription from a completed consultation.');
    if (rx.dispensed) return;
    if (useBillingStore.getState().bills.some(b => b.encounterId === encounterId && b.lifecycle === 'FINALIZED')) throw new Error('Finalized bills cannot accept dispensing charges.');
    const inventory = useInventoryStore.getState().inventory;
    const drug = inventory.find(d => d.id === rx.drugId);
    const quantity = Number(rx.totalQty);
    if (!drug || !Number.isInteger(quantity) || quantity < 1 || quantity > drug.stock) throw new Error('Select a configured medicine with sufficient stock and a positive quantity.');
    useInventoryStore.setState({ inventory: inventory.map(d => d.id === drug.id ? { ...d, stock: d.stock - quantity } : d) });
    const updated = { ...session, prescriptions: session.prescriptions.map(p => p.id === prescriptionId ? { ...p, dispensed: true, price: drug.unitPrice } : p) };
    useConsultationStore.setState({ sessions: { ...state.sessions, [encounterId]: updated }, activeSession: state.activeSession?.caseId === encounterId ? updated : state.activeSession });
    generateBill(encounterId);
  });
}
