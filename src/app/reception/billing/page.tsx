'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useBillingStore, useQueueStore, type PaymentMode } from '@/store';
import { adjustBill, discharge, generateBill, settleAndFinalize, totals, type Tender } from '@/store/workflow';

export default function BillingPage() {
  const { bills, payments, audit } = useBillingStore(); const { queue } = useQueueStore();
  const [selected, setSelected] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [tenders, setTenders] = useState<Tender[]>([{ mode: 'CASH', amount: 0 }]);
  const [kind, setKind] = useState<'AMOUNT' | 'PERCENT' | 'FOC'>('AMOUNT'); const [amount, setAmount] = useState(0); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const request = useRef(crypto.randomUUID());
  const bill = bills.find(b => b.id === selected); const total = bill ? totals(bill) : null;
  const act = (fn: () => void) => { setError(''); setNotice(''); try { fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); } };
  const settle = () => {
    if (lock.current || !bill) return; lock.current = true; setBusy(true);
    act(() => { settleAndFinalize(bill.id, tenders.filter(t => t.amount !== 0), request.current); setNotice('Payment saved and invoice finalized.'); setTenders([{ mode: 'CASH', amount: 0 }]); });
    lock.current = false; setBusy(false);
  };
  return <main className="page-container"><h1>Encounter billing</h1>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <section className="card" style={{ padding: 20 }}><h2>Generate / reconcile bill</h2>
      <label>Encounter<select className="form-select" defaultValue="" onChange={e => act(() => { if (!e.target.value) return; const b = generateBill(e.target.value); setSelected(b.id); request.current = crypto.randomUUID(); setTenders([{ mode: 'CASH', amount: totals(b).outstanding }]); })}><option value="">Select encounter</option>{queue.map(q => <option key={q.id} value={q.caseNumber}>{q.caseNumber} — {q.patientName}</option>)}</select></label>
      {!bills.length && <p>No records found</p>}
      {bills.map(b => <button key={b.id} className="btn btn-ghost" onClick={() => { setSelected(b.id); request.current = crypto.randomUUID(); setTenders([{ mode: 'CASH', amount: totals(b).outstanding }]); }}>{b.invoiceNumber || b.encounterId || 'Legacy bill'} — {b.patientName}</button>)}
    </section>
    {bill && total && <section className="card" style={{ marginTop: 20, padding: 20 }}><h2>{bill.patientName} · {bill.mrdNumber}</h2><p>{bill.encounterId} · {bill.lifecycle || 'Legacy record'}</p>
      <table className="data-table"><thead><tr><th>Description / source</th><th>Quantity</th><th>Rate</th><th>Total</th></tr></thead><tbody>{bill.items.map(i => <tr key={i.id}><td>{i.name}<small style={{ display: 'block' }}>{i.sourceType} / {i.sourceId}</small></td><td>{i.quantity}</td><td>₹{i.unitPrice.toFixed(2)}</td><td>₹{i.total.toFixed(2)}</td></tr>)}</tbody></table>
      <p>Gross ₹{total.gross.toFixed(2)} · Discount ₹{total.discount.toFixed(2)} · FOC ₹{total.foc.toFixed(2)}</p>
      <p>Net payable ₹{total.net.toFixed(2)} · Previously paid ₹{total.paid.toFixed(2)} · <strong>Outstanding ₹{total.outstanding.toFixed(2)}</strong></p>
      {bill.encounterId && bill.lifecycle !== 'FINALIZED' && <>
        <fieldset><legend>Authorized discount / FOC</legend><select aria-label="Adjustment type" value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="AMOUNT">Amount</option><option value="PERCENT">Percentage</option><option value="FOC">FOC</option></select> <input aria-label="Adjustment amount" type="number" min="0" value={amount} onChange={e => setAmount(Number(e.target.value))} /> <input aria-label="Adjustment reason" placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} /><button className="btn" onClick={() => act(() => adjustBill(bill.id, kind, amount, reason))}>Apply authorized adjustment</button></fieldset>
        <h3>Payment splits</h3>{tenders.map((t, index) => <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <select aria-label={`Payment mode ${index + 1}`} value={t.mode} onChange={e => setTenders(tenders.map((v, i) => i === index ? { ...v, mode: e.target.value as PaymentMode } : v))}>{['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'REMOTE_PAYMENT'].map(m => <option key={m}>{m}</option>)}</select>
          <input aria-label={`Payment amount ${index + 1}`} type="number" min="0" step="0.01" value={t.amount} onChange={e => setTenders(tenders.map((v, i) => i === index ? { ...v, amount: Number(e.target.value) } : v))} />
          {t.mode !== 'CASH' && <><input aria-label={`Reference ${index + 1}`} placeholder="Reference" value={t.reference || ''} onChange={e => setTenders(tenders.map((v, i) => i === index ? { ...v, reference: e.target.value } : v))} /><input aria-label={`Provider ${index + 1}`} placeholder="Provider" value={t.provider || ''} onChange={e => setTenders(tenders.map((v, i) => i === index ? { ...v, provider: e.target.value } : v))} /></>}
          <button onClick={() => setTenders(tenders.filter((_, i) => i !== index))}>Remove</button>
        </div>)}
        <button className="btn" onClick={() => setTenders([...tenders, { mode: 'CASH', amount: 0 }])}>Add payment split</button> <button className="btn btn-primary" disabled={busy} onClick={settle}>{busy ? 'Processing…' : 'Settle & finalize'}</button>
      </>}
      <h3>Payment ledger</h3>{payments.filter(p => p.billId === bill.id).map(p => <p key={p.id}>{p.date} · {p.mode} · ₹{p.amount.toFixed(2)} · {p.reference} · {p.receivedBy}</p>)}
      {audit.filter(a => a.billId === bill.id).map(a => <p key={a.id}>{a.action} · {a.reason} · {a.user} · {a.date}</p>)}
      {bill.lifecycle === 'FINALIZED' && <><Link className="btn btn-primary" href={`/reception/billing/invoice/${bill.id}`}>Open / print invoice</Link> <button className="btn" onClick={() => act(() => { discharge(bill.encounterId!); setNotice('Patient discharged. Encounter closed and retained in the timeline.'); })}>Discharge & close encounter</button></>}
    </section>}
  </main>;
}
