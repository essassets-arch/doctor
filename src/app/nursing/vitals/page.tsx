'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, User, HeartPulse, Thermometer, Scale,
  Ruler, Droplets, AlertTriangle, CheckCircle2,
  Clock, ArrowLeft, Save, AlertCircle, FileText,
  ShieldAlert, ChevronRight, Lock
} from 'lucide-react';
import { useQueueStore, usePatientStore, useConsultationStore, useUIStore, Patient, QueueEntry } from '@/store';

function VitalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const paramCaseId = searchParams.get('caseId');

  const { queue, updateQueueEntry } = useQueueStore();
  const { patients, updatePatient } = usePatientStore();
  const { addNotification } = useUIStore();

  // Find targeted patient and queue entry
  const queueEntryFromCase = paramCaseId ? queue.find(q => q.caseNumber.toLowerCase() === paramCaseId.toLowerCase()) : null;

  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (paramCaseId) {
      const match = queue.find(q => q.caseNumber.toLowerCase() === paramCaseId.toLowerCase());
      if (match) return match.patientId;
    }
    if (paramPatientId) return paramPatientId;
    return queue.find(q => q.stage === 'NURSING' || !q.vitalsRecorded)?.patientId || patients[0]?.id || 'pat-1';
  });

  useEffect(() => {
    if (paramCaseId) {
      const match = queue.find(q => q.caseNumber.toLowerCase() === paramCaseId.toLowerCase());
      if (match) {
        setSelectedPatientId(match.patientId);
        return;
      }
    }
    if (paramPatientId) {
      setSelectedPatientId(paramPatientId);
    }
  }, [paramPatientId, paramCaseId, queue]);

  const activeQueueEntry = queueEntryFromCase
    || queue.find(q => q.patientId === selectedPatientId && q.status !== 'COMPLETED')
    || queue[0];
  const selectedPatient = patients.find(p => p.id === (activeQueueEntry?.patientId || selectedPatientId)) || patients[0];

  // Vitals State
  const [height, setHeight] = useState<string>('168');
  const [weight, setWeight] = useState<string>('68');
  const [temperature, setTemperature] = useState<string>('98.6');
  const [pulse, setPulse] = useState<string>('76');
  const [bpSystolic, setBpSystolic] = useState<string>('120');
  const [bpDiastolic, setBpDiastolic] = useState<string>('80');
  const [spo2, setSpo2] = useState<string>('99');

  // Complaints & Clinical History State
  const [presentComplaint, setPresentComplaint] = useState('Recurrent erythematous itchy skin rash with scaling on bilateral arms');
  const [durationValue, setDurationValue] = useState('3');
  const [durationUnit, setDurationUnit] = useState<'Days' | 'Months' | 'Years'>('Days');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [onset, setOnset] = useState<'Sudden' | 'Gradual' | 'Insidious'>('Gradual');
  const [aggravatingFactors, setAggravatingFactors] = useState('Sweating, sun exposure, dry cold weather');
  const [relievingFactors, setRelievingFactors] = useState('Cool water bath, topical moisturizer');
  const [pastMedical, setPastMedical] = useState('Known hypertensive for 3 years on regular medication.');
  const [pastSurgical, setPastSurgical] = useState('Appendectomy in 2018 (uneventful).');
  const [currentMedications, setCurrentMedications] = useState('Telmisartan 40mg (OD morning)');
  const [allergies, setAllergies] = useState('Sulfa drugs (mild urticaria), Penicillin');
  const [nursingNotes, setNursingNotes] = useState('Patient oriented and responsive. Mild anxiety regarding rash progression.');

  // Mock historical vitals
  const [historicalVitals, setHistoricalVitals] = useState([
    { id: 'v-1', date: '10/09/2026 10:15 AM', height: 168, weight: 69, bmi: 24.4, temp: 98.4, pulse: 78, bp: '122/82', spo2: 99, by: 'Nurse Bhavna' },
    { id: 'v-2', date: '15/08/2026 11:30 AM', height: 168, weight: 70, bmi: 24.8, temp: 98.6, pulse: 80, bp: '128/84', spo2: 98, by: 'Nurse Riya' },
  ]);

  // Prefill vitals and complaints if already recorded at check-in
  useEffect(() => {
    if (activeQueueEntry) {
      if (activeQueueEntry.vitals) {
        if (activeQueueEntry.vitals.temperature) setTemperature(String(activeQueueEntry.vitals.temperature));
        if (activeQueueEntry.vitals.pulse) setPulse(String(activeQueueEntry.vitals.pulse));
        if (activeQueueEntry.vitals.spo2) setSpo2(String(activeQueueEntry.vitals.spo2));
        if (activeQueueEntry.vitals.weight) setWeight(String(activeQueueEntry.vitals.weight));
        if (activeQueueEntry.vitals.height) setHeight(String(activeQueueEntry.vitals.height));
        if (activeQueueEntry.vitals.bloodPressure) {
          const parts = activeQueueEntry.vitals.bloodPressure.split('/');
          if (parts[0]) setBpSystolic(parts[0]);
          if (parts[1]) setBpDiastolic(parts[1]);
        }
      }
      if (activeQueueEntry.complaints && activeQueueEntry.complaints.length > 0) {
        setPresentComplaint(activeQueueEntry.complaints.join(', '));
      } else if (activeQueueEntry.complaintNotes) {
        setPresentComplaint(activeQueueEntry.complaintNotes);
      }
    }
  }, [activeQueueEntry]);

  // Reactive BMI Calculation
  const bmiCalculation = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return { bmi: null, category: 'N/A', color: '#64748B' };
    const hMeters = h / 100;
    const score = parseFloat((w / (hMeters * hMeters)).toFixed(1));
    let category = 'Normal';
    let color = '#059669';

    if (score < 18.5) {
      category = 'Underweight';
      color = '#3B82F6';
    } else if (score >= 25 && score < 30) {
      category = 'Overweight';
      color = '#D97706';
    } else if (score >= 30) {
      category = 'Obese';
      color = '#DC2626';
    }

    return { bmi: score, category, color };
  }, [height, weight]);

  // Critical Value Alerts
  const tempVal = parseFloat(temperature);
  const pulseVal = parseInt(pulse);
  const sysVal = parseInt(bpSystolic);
  const diaVal = parseInt(bpDiastolic);
  const spo2Val = parseInt(spo2);

  const isFever = tempVal >= 100.4;
  const isHighFever = tempVal >= 102.0;
  const isPulseAbnormal = pulseVal > 100 || pulseVal < 60;
  const isHypertension = sysVal >= 140 || diaVal >= 90;
  const isHypertensiveCrisis = sysVal >= 160 || diaVal >= 100;
  const isHypotension = sysVal < 90 || diaVal < 60;
  const isHypoxia = spo2Val < 95;
  const isCriticalHypoxia = spo2Val < 92;

  // Lock check: if doctor has chart open
  const isChartLocked = activeQueueEntry?.status === 'IN_SESSION';

  const handleSaveVitals = () => {
    if (!temperature || !pulse || !bpSystolic || !bpDiastolic || !spo2) {
      alert('Please fill all mandatory physiological vitals (Temperature, Pulse, Blood Pressure, SpO2).');
      return;
    }

    // Save to historical audit
    const newRecord = {
      id: `v-${Date.now()}`,
      date: `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      height: parseFloat(height) || 0,
      weight: parseFloat(weight) || 0,
      bmi: bmiCalculation.bmi || 0,
      temp: tempVal,
      pulse: pulseVal,
      bp: `${bpSystolic}/${bpDiastolic}`,
      spo2: spo2Val,
      by: 'Nurse Bhavna'
    };

    setHistoricalVitals([newRecord, ...historicalVitals]);

    // Update active queue entry
    if (activeQueueEntry) {
      updateQueueEntry(activeQueueEntry.id, {
        vitalsRecorded: true,
        complaintsRecorded: true,
        stage: 'DOCTOR',
        complaints: [presentComplaint],
        complaintNotes: `${presentComplaint} (${severity}, ${onset}). Aggravating: ${aggravatingFactors}. Relieving: ${relievingFactors}. Notes: ${nursingNotes}`,
        vitals: {
          height: parseFloat(height),
          weight: parseFloat(weight),
          bmi: bmiCalculation.bmi || undefined,
          temperature: tempVal,
          pulse: pulseVal,
          bloodPressure: `${bpSystolic}/${bpDiastolic}`,
          spo2: spo2Val,
          recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recordedBy: 'Nurse Bhavna'
        }
      });

      // Synchronize consultation store session
      useConsultationStore.getState().initSession(
        activeQueueEntry.caseNumber,
        selectedPatient,
        {
          id: activeQueueEntry.doctorId || 'doc-1',
          name: activeQueueEntry.doctorName || 'Dr. Raj Valaki',
          specialization: 'General',
          initials: 'DR',
          avatarColor: '#036d92',
          room: 'Room 1'
        },
        {
          vitals: {
            temperature: String(tempVal),
            pulse: String(pulseVal),
            bpSystolic: String(bpSystolic),
            bpDiastolic: String(bpDiastolic),
            spo2: String(spo2Val),
            weight: String(weight),
            height: String(height)
          },
          complaints: {
            presentComplaint,
            durationYears: durationUnit === 'Years' ? (parseInt(durationValue) || 0) : 0,
            durationMonths: durationUnit === 'Months' ? (parseInt(durationValue) || 0) : 0,
            durationDays: durationUnit === 'Days' ? (parseInt(durationValue) || 1) : 1,
            severity: severity.toUpperCase() as any,
            onset,
            aggravatingFactors,
            relievingFactors
          },
          history: {
            pastMedical,
            pastSurgical,
            allergies,
            currentMedications
          }
        }
      );
    }

    addNotification({
      type: 'success',
      message: `Vitals & Complaints recorded for ${selectedPatient.firstName} ${selectedPatient.lastName}. Case transferred to DOCTOR queue!`
    });

    router.push('/nursing/dashboard');
  };

  return (
    <div className="page-container" style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/nursing/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Nursing Dashboard
          </Link>
          <h1 className="page-title" style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
            Pre-Consultation Vitals & Clinical Intake
          </h1>
        </div>

        {/* Patient Case Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Patient:</label>
          <select
            className="form-select"
            style={{ width: 260, fontSize: 12.5, fontWeight: 700, borderColor: '#CBD5E1' }}
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
          >
            {patients.map(p => {
              const q = queue.find(item => item.patientId === p.id && item.status !== 'COMPLETED');
              return (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.mrdNumber}) {q ? `• Token ${q.tokenDisplay}` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Doctor Case Lock Warning Wall */}
      {isChartLocked && (
        <div style={{
          padding: '16px 20px', borderRadius: 16, marginBottom: 20,
          background: '#FFF1F2', border: '1.5px solid #FCA5A5', color: '#991B1B',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <Lock size={24} color="#DC2626" className="shrink-0" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>
              Clinical Chart Locked 🔒 (Doctor Active Consultation in Progress)
            </div>
            <div style={{ fontSize: 12, marginTop: 2, color: '#B91C1C' }}>
              Dr. Raj Valaki has opened this patient's consultation file in Cabin 1. Front-desk and nursing modifications are locked out to prevent concurrency write collisions.
            </div>
          </div>
          <Link href="/nursing/dashboard">
            <button className="btn btn-outline btn-sm" style={{ borderColor: '#F87171', color: '#991B1B' }}>
              Return to Dashboard
            </button>
          </Link>
        </div>
      )}

      {/* 4.1 Patient Demographics Banner */}
      <div className="card" style={{
        padding: '16px 20px', borderRadius: 16, border: '1px solid #E2E8F0',
        background: '#FFFFFF', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14, background: '#059669', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18
            }}>
              {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>
                  {selectedPatient.firstName} {selectedPatient.middleName || ''} {selectedPatient.lastName}
                </span>
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, border: '1px solid #a7f3d0' }}>
                  Pre-Consultation Workflow
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', gap: 12 }}>
                <span>MRD: <strong style={{ color: '#0F172A' }}>{selectedPatient.mrdNumber}</strong></span>
                <span>Age/Gender: <strong>{selectedPatient.age}Y / {selectedPatient.gender}</strong></span>
                <span>Blood: <strong>{selectedPatient.bloodGroup || 'O+'}</strong></span>
                <span>Mobile: <strong>{selectedPatient.mobile}</strong></span>
                {activeQueueEntry && <span>Token: <strong style={{ color: '#059669' }}>{activeQueueEntry.tokenDisplay}</strong></span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
              background: '#F1F5F9', color: '#334155'
            }}>
              Assigned: {activeQueueEntry?.doctorName || 'Dr. Raj Valaki'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Workspace: Left Vitals Suite & BMI + Right Complaints & History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Vitals Measurement Suite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card: Vitals Entry */}
          <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                <Activity size={17} color="#059669" /> Physiological Vitals Entry
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>* Indicates mandatory clinical parameter</span>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row 1: Height, Weight & Calculated BMI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ruler size={13} color="#64748B" /> Height (cm)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="165"
                    disabled={isChartLocked}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Scale size={13} color="#64748B" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="68"
                    disabled={isChartLocked}
                  />
                </div>

                {/* BMI Engine Output */}
                <div>
                  <label className="form-label">Auto-Calculated BMI</label>
                  <div style={{
                    padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 38
                  }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: bmiCalculation.color }}>
                      {bmiCalculation.bmi ?? '—'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 4, background: `${bmiCalculation.color}15`, color: bmiCalculation.color
                    }}>
                      {bmiCalculation.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Temperature, Pulse, Blood Pressure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 12 }}>
                <div>
                  <label className="form-label required" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Thermometer size={13} color="#059669" /> Temp (°F) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    style={{ borderColor: isHighFever ? '#EF4444' : isFever ? '#F59E0B' : undefined }}
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    disabled={isChartLocked}
                  />
                  {isHighFever ? (
                    <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 800, marginTop: 2, display: 'block' }}>
                      ⚠ High Fever ({tempVal}°F)
                    </span>
                  ) : isFever ? (
                    <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700, marginTop: 2, display: 'block' }}>
                      ⚠ Mild Fever
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="form-label required" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HeartPulse size={13} color="#059669" /> Pulse (bpm) *
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ borderColor: isPulseAbnormal ? '#EF4444' : undefined }}
                    value={pulse}
                    onChange={e => setPulse(e.target.value)}
                    disabled={isChartLocked}
                  />
                  {isPulseAbnormal && (
                    <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 800, marginTop: 2, display: 'block' }}>
                      ⚠ {pulseVal > 100 ? 'Tachycardia' : 'Bradycardia'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="form-label required">Blood Pressure (mmHg) *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ textAlign: 'center', borderColor: isHypertensiveCrisis ? '#EF4444' : undefined }}
                      placeholder="120"
                      value={bpSystolic}
                      onChange={e => setBpSystolic(e.target.value)}
                      disabled={isChartLocked}
                    />
                    <span style={{ fontWeight: 800, color: '#64748B' }}>/</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ textAlign: 'center', borderColor: isHypertensiveCrisis ? '#EF4444' : undefined }}
                      placeholder="80"
                      value={bpDiastolic}
                      onChange={e => setBpDiastolic(e.target.value)}
                      disabled={isChartLocked}
                    />
                  </div>
                  {isHypertensiveCrisis ? (
                    <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 900, marginTop: 2, display: 'block' }}>
                      🚨 Hypertensive Crisis Alert!
                    </span>
                  ) : isHypertension ? (
                    <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700, marginTop: 2, display: 'block' }}>
                      ⚠ Elevated BP ({sysVal}/{diaVal})
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Row 3: Oxygen SpO2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label required" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Droplets size={13} color="#059669" /> Blood Oxygen SpO2 (%) *
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ borderColor: isCriticalHypoxia ? '#EF4444' : isHypoxia ? '#F59E0B' : undefined }}
                    value={spo2}
                    onChange={e => setSpo2(e.target.value)}
                    disabled={isChartLocked}
                  />
                  {isCriticalHypoxia ? (
                    <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 900, marginTop: 2, display: 'block' }}>
                      🚨 Critical Hypoxia Alert ({spo2Val}%)! Administer O2.
                    </span>
                  ) : isHypoxia ? (
                    <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700, marginTop: 2, display: 'block' }}>
                      ⚠ Low Oxygen Saturation
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="form-label">Triage Readiness Badge</label>
                  <div style={{
                    padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                    borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, height: 38
                  }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>
                      Physiological Parameters Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4.5 Historical Vitals Audit Table */}
          <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{
              padding: '12px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                Historical Vitals Log (Last {historicalVitals.length} Recorded Visits)
              </span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Audit Ledger</span>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#FFFFFF' }}>
                    <th style={{ padding: '8px 12px' }}>Date & Time</th>
                    <th>Height/Weight</th>
                    <th>BMI</th>
                    <th>Temp</th>
                    <th>Pulse</th>
                    <th>BP</th>
                    <th>SpO2</th>
                    <th>Nurse</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalVitals.map(v => (
                    <tr key={v.id}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>{v.date}</td>
                      <td>{v.height}cm / {v.weight}kg</td>
                      <td><span style={{ fontWeight: 800, color: '#059669' }}>{v.bmi}</span></td>
                      <td>{v.temp}°F</td>
                      <td>{v.pulse} bpm</td>
                      <td><strong>{v.bp}</strong></td>
                      <td>{v.spo2}%</td>
                      <td style={{ color: '#64748B' }}>{v.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: 4.4 Clinical History & Complaints Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                <FileText size={17} color="#059669" /> Chief Complaints & History
              </div>
              <span className="badge badge-success" style={{ fontSize: 10 }}>Intake Ready</span>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Present Complaint */}
              <div className="form-group">
                <label className="form-label required">Presenting Chief Complaint</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={presentComplaint}
                  onChange={e => setPresentComplaint(e.target.value)}
                  disabled={isChartLocked}
                />
              </div>

              {/* Duration Triad & Severity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Duration</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 70 }}
                      value={durationValue}
                      onChange={e => setDurationValue(e.target.value)}
                      disabled={isChartLocked}
                    />
                    <select
                      className="form-select"
                      value={durationUnit}
                      onChange={e => setDurationUnit(e.target.value as any)}
                      disabled={isChartLocked}
                    >
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Severity Level</label>
                  <select
                    className="form-select"
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    disabled={isChartLocked}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              {/* Onset, Aggravating & Relieving Factors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Onset</label>
                  <select
                    className="form-select"
                    value={onset}
                    onChange={e => setOnset(e.target.value as any)}
                    disabled={isChartLocked}
                  >
                    <option value="Gradual">Gradual</option>
                    <option value="Sudden">Sudden</option>
                    <option value="Insidious">Insidious</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Aggravating Factors</label>
                  <input
                    type="text"
                    className="form-input"
                    value={aggravatingFactors}
                    onChange={e => setAggravatingFactors(e.target.value)}
                    disabled={isChartLocked}
                  />
                </div>
              </div>

              {/* Past History & Current Medications */}
              <div className="form-group">
                <label className="form-label">Past Medical & Surgical History</label>
                <input
                  type="text"
                  className="form-input"
                  value={pastMedical}
                  onChange={e => setPastMedical(e.target.value)}
                  disabled={isChartLocked}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Outside Medications</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentMedications}
                  onChange={e => setCurrentMedications(e.target.value)}
                  disabled={isChartLocked}
                />
              </div>

              {/* Critical Allergies */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#DC2626', fontWeight: 800 }}>
                  Drug & Food Allergies (High Alert)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ borderColor: '#FCA5A5', background: '#FFF1F2' }}
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  disabled={isChartLocked}
                />
              </div>

              {/* Internal Nursing Notes */}
              <div className="form-group">
                <label className="form-label">Internal Nursing Observations / Triage Notes</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Record patient demeanor, tremors, emergency signs..."
                  value={nursingNotes}
                  onChange={e => setNursingNotes(e.target.value)}
                  disabled={isChartLocked}
                />
              </div>

              {/* Submit Button */}
              <div style={{ paddingTop: 10 }}>
                <button
                  type="button"
                  onClick={handleSaveVitals}
                  className="btn btn-primary btn-lg"
                  style={{
                    width: '100%', justifyContent: 'center', padding: '14px',
                    background: '#059669',
                    borderColor: '#059669',
                    fontSize: 14, fontWeight: 800, borderRadius: 10,
                    cursor: 'pointer'
                  }}
                >
                  <Save size={16} /> Save Vitals & Handshake to Doctor Cabin →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NursingVitalsPage() {
  return (
    <Suspense fallback={<div className="page-container" style={{ padding: 40, textAlign: 'center' }}>Loading Triage Suite...</div>}>
      <VitalsContent />
    </Suspense>
  );
}
