'use client';
import { use } from 'react';
import { useBillingStore } from '@/store';
import { totals } from '@/store/workflow';

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { bills, payments } = useBillingStore();
  const bill = bills.find(b => b.id === id);
  if (!bill || bill.lifecycle !== 'FINALIZED' || !bill.clinicSnapshot) return <main className="page-container">No finalized invoice found.</main>;
  const clinic = bill.clinicSnapshot; const total = totals(bill);
  return <main className="page-container"><article className="card" style={{ padding: 32 }}>
    <h1>{clinic.name}</h1><p>{clinic.address}</p><p>GSTIN: {clinic.gstNumber}</p>
    <h2>Invoice {bill.invoiceNumber}</h2><p>Date: {bill.finalizedAt} · Encounter: {bill.encounterId}</p>
    <p>Patient: {bill.patientName} · MRD: {bill.mrdNumber} · Doctor: {bill.doctorName}</p>
    <table className="data-table"><thead><tr><th>Item</th><th>HSN/SAC</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Taxable</th><th>Tax</th><th>Total</th></tr></thead><tbody>{bill.items.map(i => <tr key={i.id}><td>{i.name}</td><td>{i.hsnSac || 'Not configured'}</td><td>{i.quantity}</td><td>{i.unitPrice.toFixed(2)}</td><td>{i.discount.toFixed(2)}</td><td>{(i.taxableAmount ?? i.total).toFixed(2)}</td><td>{(i.tax || 0).toFixed(2)}</td><td>{i.total.toFixed(2)}</td></tr>)}</tbody></table>
    <p>Gross: ₹{total.gross.toFixed(2)} · Discount: ₹{total.discount.toFixed(2)} · FOC: ₹{total.foc.toFixed(2)}</p>
    <h3>Grand total: ₹{total.net.toFixed(2)}</h3>
    <h3>Payments</h3>{payments.filter(p => p.billId === bill.id).map(p => <p key={p.id}>{p.date} · {p.mode} · ₹{p.amount.toFixed(2)} · {p.reference} · Received by {p.receivedBy}</p>)}
    <p>Balance: ₹{total.outstanding.toFixed(2)}</p><p>Authorized signatory: ____________________</p>
    <button className="btn btn-primary" onClick={() => window.print()}>Print invoice</button>
  </article></main>;
}
