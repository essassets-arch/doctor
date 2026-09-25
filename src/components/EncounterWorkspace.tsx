'use client';
import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAdminStore, useConsultationStore, useInventoryStore, useInvestigationCatalogStore, usePatientStore, useQueueStore, type ConsultationSession, type PrescriptionItem, type ProcedureExecutionItem } from '@/store';
import { endConsultation } from '@/store/workflow';
import { PhotographyProvider } from './lesion-photography/PhotographyProvider';
import PhotographyWorkspace from './lesion-photography/PhotographyWorkspace';
import { usePhotographyDocuments } from '@/store/photography-documents';

const tabs = ['Complaints / Examination', 'Investigations', 'Prescription', 'Procedures', 'Clinical Images', 'Diagnosis', 'Final Summary'];
const fieldStyle = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' };
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label>{label}<input className="form-input" type={type} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
export default function EncounterWorkspace({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params); const { sessions } = useConsultationStore(); const { queue, doctors } = useQueueStore();
  const { patients } = usePatientStore(); const { settings, procedures: catalog, consentTemplates } = useAdminStore();
  const tests = useInvestigationCatalogStore(s => s.catalog); const drugs = useInventoryStore(s => s.inventory);
  const photos = usePhotographyDocuments(s => s.documents[caseId]);
  const entry = queue.find(q => q.caseNumber === caseId); const patient = patients.find(p => p.id === entry?.patientId);
  const session = sessions[caseId]; const [tab, setTab] = useState(0); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [testId, setTestId] = useState(''); const [quantity, setQuantity] = useState(1); const [instructions, setInstructions] = useState(''); const [external, setExternal] = useState(false);
  const [rx, setRx] = useState<PrescriptionItem>({ id: '', drugName: '', dosage: '', frequency: '', durationDays: '', totalQty: '', instructions: '', strength: '', route: '', timing: '' });
  const [procedureId, setProcedureId] = useState(''); const [totalSessions, setTotalSessions] = useState(1); const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [consentProcedure, setConsentProcedure] = useState(''); const [templateId, setTemplateId] = useState(''); const [language, setLanguage] = useState('English');
  const canvas = useRef<HTMLCanvasElement>(null); const drawing = useRef(false); const signed = useRef(false);
  const act = (action: () => void) => { setError(''); try { action(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); } };
  useEffect(() => {
    if (session || !entry || !patient) return;
    const doctor = doctors.find(d => d.id === entry.doctorId); if (!doctor) return;
    const v = entry.vitals;
    useConsultationStore.getState().initSession(caseId, patient, doctor, {
      vitals: { temperature: String(v?.temperature ?? ''), pulse: String(v?.pulse ?? ''), bpSystolic: v?.bloodPressure?.split('/')[0] || '', bpDiastolic: v?.bloodPressure?.split('/')[1] || '', spo2: String(v?.spo2 ?? ''), weight: String(v?.weight ?? ''), height: String(v?.height ?? '') },
      complaints: { presentComplaint: entry.complaints?.join(', ') || entry.complaintNotes || '', durationYears: 0, durationMonths: 0, durationDays: 0, severity: 'MODERATE', onset: '', aggravatingFactors: '', relievingFactors: '' },
      history: { pastMedical: '', pastSurgical: '', allergies: patient.allergies || '', currentMedications: '' },
      billing: { consultationFee: entry.consultationFee ?? settings.consultationFee ?? 0, discountPercent: 0, isFoc: false },
      procedures: [],
    });
  }, [caseId, session, entry, patient, doctors, settings.consultationFee]);
  if (!entry || !patient) return <main className="page-container"><h1>No records found</h1></main>;
  if (!session) return <p>Opening encounter…</p>;
  const locked = session.isFinalized;
  const save = (patch: Partial<ConsultationSession>) => act(() => {
    if (locked) throw new Error('Completed consultation is read-only.');
    useConsultationStore.getState().saveSession({ ...useConsultationStore.getState().sessions[caseId], ...patch });
  });
  const patchProcedure = (id: string, patch: Partial<ProcedureExecutionItem>) => save({ procedures: session.procedures.map(p => p.id === id ? { ...p, ...patch } : p) });
  const saveConsent = () => act(() => {
    if (locked) throw new Error('Completed consultation is read-only.');
    const template = consentTemplates.find(t => t.id === templateId && t.language === language && t.isActive);
    const procedure = session.procedures.find(p => p.id === consentProcedure);
    if (!template || !procedure || !signed.current || !canvas.current) throw new Error('Select a configured template, procedure and capture the patient signature.');
    let content = template.content;
    const values: Record<string, string> = { '[Patient Name]': session.patientName, '[MRD Number]': session.mrdNumber, '[Doctor Name]': session.doctorName, '[Clinic Name]': settings.name, '[Procedure Name]': procedure.procedureName, '[Date]': treatmentDate };
    Object.entries(values).forEach(([key, value]) => { content = content.replaceAll(key, value); });
    if (/\[[^\]]+\]/.test(content)) throw new Error('Template contains unresolved fields. Update the configured template before signing.');
    useConsultationStore.getState().saveSession({ ...session, consents: [...(session.consents || []), { id: crypto.randomUUID(), encounterId: caseId, procedureId: procedure.id, templateId, language, content, signature: canvas.current.toDataURL('image/png'), signedAt: new Date().toISOString() }] });
    signed.current = false; canvas.current.getContext('2d')?.clearRect(0, 0, 600, 150);
  });
  return <main className="page-container"><header><h1>{session.patientName} · {session.mrdNumber}</h1><p>{caseId} · {entry.doctorName} · {locked ? 'Consultation completed' : entry.status}</p><Link href="/doctor/queue">Back to queue</Link> · <Link href={`/reception/patients/${patient.id}`}>Patient timeline</Link></header>
    {error && <p role="alert">{error}</p>}
    {!locked && entry.status !== 'IN_SESSION' && <button className="btn btn-primary" onClick={() => act(() => useQueueStore.getState().updateStatus(entry.id, 'IN_SESSION'))}>Start consultation</button>}
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '20px 0' }}>{tabs.map((name, i) => <button key={name} className={`btn ${tab === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(i)}>{i + 1}. {name}</button>)}</nav>
    <section className="card" style={{ padding: 24 }}>
      {tab === 0 && <fieldset disabled={locked}><legend>Complaints, triage and examination</legend><div style={fieldStyle}>
        <Field label="Chief complaint" value={session.complaints.presentComplaint} onChange={v => save({ complaints: { ...session.complaints, presentComplaint: v } })} />
        <Field label="Duration (days)" type="number" value={session.complaints.durationDays} onChange={v => save({ complaints: { ...session.complaints, durationDays: Number(v) } })} />
        <label>Severity<select className="form-select" value={session.complaints.severity} onChange={e => save({ complaints: { ...session.complaints, severity: e.target.value as 'MILD' | 'MODERATE' | 'SEVERE' } })}>{['MILD', 'MODERATE', 'SEVERE'].map(s => <option key={s}>{s}</option>)}</select></label>
        {(['onset', 'aggravatingFactors', 'relievingFactors'] as const).map(key => <Field key={key} label={key} value={session.complaints[key]} onChange={v => save({ complaints: { ...session.complaints, [key]: v } })} />)}
        {(['pastMedical', 'pastSurgical', 'currentMedications', 'allergies'] as const).map(key => <Field key={key} label={key} value={session.history[key]} onChange={v => save({ history: { ...session.history, [key]: v } })} />)}
        {(['temperature', 'pulse', 'bpSystolic', 'bpDiastolic', 'spo2', 'weight', 'height'] as const).map(key => <Field key={key} label={key} type="number" value={session.vitals[key]} onChange={v => save({ vitals: { ...session.vitals, [key]: v } })} />)}
        {(['examination', 'clinicalFindings', 'skinFindings', 'otherNotes'] as const).map(key => <Field key={key} label={key} value={session[key] || ''} onChange={v => save({ [key]: v })} />)}
      </div><p>BMI: {Number(session.vitals.weight) > 0 && Number(session.vitals.height) > 0 ? (Number(session.vitals.weight) / (Number(session.vitals.height) / 100) ** 2).toFixed(2) : 'Not available'}</p></fieldset>}
      {tab === 1 && <><fieldset disabled={locked}><legend>Order investigations</legend><div style={fieldStyle}>
        <Field label="Search test" value={search} onChange={setSearch} /><label>Configured test<select className="form-select" value={testId} onChange={e => setTestId(e.target.value)}><option value="">Select test</option>{tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(t => <option key={t.id} value={t.id}>{t.name} — ₹{t.price}</option>)}</select></label>
        <Field label="Quantity" type="number" value={quantity} onChange={v => setQuantity(Number(v))} /><Field label="Instructions" value={instructions} onChange={setInstructions} /><label><input type="checkbox" checked={external} onChange={e => setExternal(e.target.checked)} /> External (not billed)</label>
      </div><button className="btn btn-primary" onClick={() => act(() => { const test = tests.find(t => t.id === testId); if (!test || !Number.isInteger(quantity) || quantity < 1) throw new Error('Select a test and positive quantity.'); save({ investigations: [...session.investigations, { id: crypto.randomUUID(), testId, testName: test.name, category: test.category, price: test.price, status: 'ORDERED', quantity, instructions, location: external ? 'EXTERNAL' : 'IN_HOUSE' }] }); })}>Order investigation</button></fieldset>
        {session.investigations.map((i, index) => <p key={i.id || `${i.testId}-${index}`}>{i.testName} × {i.quantity || 1} · {i.location || 'IN_HOUSE'} · ₹{i.price} · {i.instructions}</p>)}{!session.investigations.length && <p>No records found</p>}
      </>}
      {tab === 2 && <><fieldset disabled={locked}><legend>Prescription</legend><label>Configured medicine<select className="form-select" value={rx.drugId || ''} onChange={e => { const drug = drugs.find(d => d.id === e.target.value); if (drug) setRx({ ...rx, drugId: drug.id, drugName: drug.name, price: drug.unitPrice }); }}><option value="">Select medicine</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <div style={fieldStyle}>{(['drugName', 'strength', 'dosage', 'frequency', 'route', 'timing', 'durationDays', 'totalQty', 'instructions'] as const).map(key => <Field key={key} label={key} value={rx[key] || ''} onChange={v => setRx({ ...rx, [key]: v })} />)}</div>
        <button className="btn btn-primary" onClick={() => act(() => { if (!rx.drugName.trim() || !rx.dosage.trim() || !rx.frequency.trim() || Number(rx.totalQty) <= 0) throw new Error('Enter medicine, dosage, frequency and quantity.'); save({ prescriptions: [...session.prescriptions, { ...rx, id: crypto.randomUUID() }] }); })}>Add medicine</button></fieldset>
        {session.prescriptions.map(p => <p key={p.id}>{p.drugName} {p.strength} · {p.dosage} · {p.frequency} · {p.route} · {p.timing} · {p.durationDays} days · Qty {p.totalQty} · {p.instructions}</p>)}{!session.prescriptions.length && <p>No records found</p>}
      </>}
      {tab === 3 && <><fieldset disabled={locked}><legend>Treatment plan and sessions</legend><div style={fieldStyle}>
        <label>Procedure<select className="form-select" value={procedureId} onChange={e => setProcedureId(e.target.value)}><option value="">Select configured procedure</option>{catalog.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.basePrice}</option>)}</select></label>
        <Field label="Total sessions" type="number" value={totalSessions} onChange={v => setTotalSessions(Number(v))} /><Field label="Treatment date" type="date" value={treatmentDate} onChange={setTreatmentDate} />
      </div><button className="btn btn-primary" onClick={() => act(() => { const procedure = catalog.find(p => p.id === procedureId); if (!procedure || !Number.isInteger(totalSessions) || totalSessions < 1 || !treatmentDate) throw new Error('Select a procedure, session count and treatment date.'); const previous = session.procedures.filter(p => p.catalogId === procedureId); if (previous.length >= totalSessions) throw new Error('All sessions in this plan already exist.'); save({ procedures: [...session.procedures, { id: crypto.randomUUID(), catalogId: procedure.id, caseId, patientId: patient.id, procedureName: procedure.name, scheduledDate: treatmentDate, sessionNumber: previous.length + 1, totalSessions, price: procedure.basePrice, therapist: entry.doctorName, status: 'Pending', consentRequired: procedure.requiresConsent, consumables: procedure.linkedConsumables.map(c => { const drug = drugs.find(d => d.id === c.drugId); if (!drug) throw new Error('Configure consumable pricing before adding this procedure.'); return { id: c.drugId, name: c.drugName, quantity: c.quantity, unitPrice: drug.unitPrice }; }) }] }); })}>Add next session</button></fieldset>
        {session.procedures.map(p => <fieldset key={p.id} disabled={locked} style={{ marginTop: 20 }}><legend>{p.procedureName} · Session {p.sessionNumber}/{p.totalSessions}</legend><div style={fieldStyle}>
          {(['therapist', 'scheduledDate', 'machine', 'power', 'pulseDuration', 'spotSize', 'bodyPart', 'parameters', 'notes'] as const).map(key => <Field key={key} label={key} value={p[key] || ''} onChange={v => patchProcedure(p.id, { [key]: v })} />)}
          <label>Status<select className="form-select" value={p.status} onChange={e => patchProcedure(p.id, { status: e.target.value as ProcedureExecutionItem['status'], completedInClinic: e.target.value === 'Done' })}>{['Pending', 'Done', 'Delayed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select></label>
        </div><p>Price ₹{p.price} · Consent {p.consentRequired ? 'required' : 'not required'}</p></fieldset>)}
        {!session.procedures.length && <p>No records found</p>}
        <fieldset disabled={locked}><legend>Procedure consent</legend><label>Session<select className="form-select" value={consentProcedure} onChange={e => setConsentProcedure(e.target.value)}><option value="">Select procedure session</option>{session.procedures.map(p => <option key={p.id} value={p.id}>{p.procedureName} · {p.sessionNumber}</option>)}</select></label>
          <label>Language<select className="form-select" value={language} onChange={e => { setLanguage(e.target.value); setTemplateId(''); }}>{['English', 'Hindi', 'Gujarati'].map(l => <option key={l}>{l}</option>)}</select></label>
          <label>Configured template<select className="form-select" value={templateId} onChange={e => setTemplateId(e.target.value)}><option value="">Select template</option>{consentTemplates.filter(t => t.isActive && t.language === language).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
          <p>{consentTemplates.find(t => t.id === templateId)?.content || 'No template selected'}</p><p>Patient signature</p>
          <canvas ref={canvas} width={600} height={150} style={{ border: '1px solid #64748b', maxWidth: '100%', touchAction: 'none' }} onPointerDown={e => { if (locked) return; drawing.current = true; signed.current = true; e.currentTarget.setPointerCapture(e.pointerId); const r = e.currentTarget.getBoundingClientRect(); const ctx = e.currentTarget.getContext('2d'); ctx?.beginPath(); ctx?.moveTo((e.clientX - r.left) * 600 / r.width, (e.clientY - r.top) * 150 / r.height); }} onPointerMove={e => { if (!drawing.current) return; const r = e.currentTarget.getBoundingClientRect(); const ctx = e.currentTarget.getContext('2d'); ctx?.lineTo((e.clientX - r.left) * 600 / r.width, (e.clientY - r.top) * 150 / r.height); ctx?.stroke(); }} onPointerUp={() => { drawing.current = false; }} />
          <button className="btn" onClick={() => { canvas.current?.getContext('2d')?.clearRect(0, 0, 600, 150); signed.current = false; }}>Clear signature</button> <button className="btn btn-primary" onClick={saveConsent}>Save signed consent</button>
        </fieldset>{session.consents?.map(c => <details key={c.id}><summary>Signed consent · {c.language} · {c.signedAt}</summary><p>{c.content}</p><img src={c.signature} alt="Patient signature" width={300} /></details>)}
      </>}
      {tab === 4 && (locked ? <><p>{photos?.images.length || 0} images · {photos?.markers.length || 0} annotations</p>{photos?.images.map(i => <figure key={i.id}><img src={i.src} alt={i.name} style={{ maxWidth: '100%', maxHeight: 400 }} /><figcaption>{i.name} · {i.tag}</figcaption>{photos.markers.filter(m => m.imageId === i.id).map(m => <p key={m.id}>{m.type} ({m.x}, {m.y}) · {m.label} · {m.note}</p>)}</figure>)}</> : <PhotographyProvider key={caseId} consultationId={caseId}><PhotographyWorkspace /></PhotographyProvider>)}
      {tab === 5 && <fieldset disabled={locked}><legend>Diagnosis and follow-up</legend><div style={fieldStyle}>{(['provisional', 'finalDiagnosis', 'icd10Code', 'treatmentPlan', 'patientAdvice', 'followUpDate', 'followUpPurpose'] as const).map(key => <Field key={key} label={key} type={key === 'followUpDate' ? 'date' : 'text'} value={session.diagnosis[key] || ''} onChange={v => save({ diagnosis: { ...session.diagnosis, [key]: v } })} />)}</div></fieldset>}
      {tab === 6 && <><h2>Final summary</h2><p>Doctor: {session.doctorName}</p><p>Complaint: {session.complaints.presentComplaint}</p><p>Examination: {session.examination}</p><p>Diagnosis: {session.diagnosis.finalDiagnosis || session.diagnosis.provisional}</p><p>Advice: {session.diagnosis.patientAdvice}</p><p>Prescription: {session.prescriptions.map(p => `${p.drugName} ${p.dosage} ${p.frequency} ${p.durationDays} days`).join('; ') || 'None'}</p><p>Investigations: {session.investigations.map(i => i.testName).join(', ') || 'None'}</p><p>Procedures: {session.procedures.map(p => `${p.procedureName} session ${p.sessionNumber}`).join(', ') || 'None'}</p><p>Clinical images: {photos?.images.length || 0} · Annotations: {photos?.markers.length || 0} · Signed consents: {session.consents?.length || 0}</p><p>Follow-up: {session.diagnosis.followUpDate || 'Not requested'} · {session.diagnosis.followUpPurpose}</p>
        {!locked ? <button className="btn btn-primary" onClick={() => act(() => endConsultation(caseId))}>End consultation</button> : <Link className="btn btn-primary" href="/reception/billing">Ready for billing</Link>}
      </>}
    </section>
  </main>;
}
