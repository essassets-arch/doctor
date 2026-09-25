'use client';
import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, Upload, CheckCircle2, AlertCircle, Clock,
  ArrowLeft, FileCheck, Eye, Trash2, Sparkles, Filter,
  Layers, Search, Stethoscope, ChevronRight, Check
} from 'lucide-react';
import { useQueueStore, usePatientStore, useUIStore, useInvestigationCatalogStore } from '@/store';

interface LabParameterRow {
  id: string;
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  minVal?: number;
  maxVal?: number;
  status: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
}

function LabReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCaseId = searchParams.get('caseId');
  const paramPatientId = searchParams.get('patientId');

  const { queue, updateQueueEntry } = useQueueStore();
  const { patients } = usePatientStore();
  const { catalog } = useInvestigationCatalogStore();
  const { addNotification } = useUIStore();

  // Active view toggle: 'pending_queue' vs 'upload_workspace'
  const [activeTab, setActiveTab] = useState<'pending_queue' | 'upload_workspace'>(
    paramCaseId ? 'upload_workspace' : 'pending_queue'
  );

  // Selected case for workspace
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>(
    paramCaseId || queue.find(q => q.status === 'ON_HOLD')?.caseNumber || queue[0]?.caseNumber || 'C006-001-190926'
  );

  const activeQueueEntry = queue.find(q => q.caseNumber === selectedCaseNumber) || queue[0];
  const activePatient = patients.find(p => p.id === activeQueueEntry?.patientId) || patients[0];

  // Upload simulation state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(
    paramCaseId ? { name: 'Blood_Report_CBC_Biochemistry.pdf', size: '2.4 MB', type: 'application/pdf' } : null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(uploadedFile ? 100 : 0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Parameter grid state
  const [parameters, setParameters] = useState<LabParameterRow[]>([
    { id: 'p-1', name: 'Hemoglobin (Hb)', value: '10.2', unit: 'g/dL', normalRange: '12.0 - 16.0 g/dL', minVal: 12.0, maxVal: 16.0, status: 'LOW' },
    { id: 'p-2', name: 'Total WBC Count', value: '7,400', unit: '/mcL', normalRange: '4,500 - 11,000 /mcL', minVal: 4500, maxVal: 11000, status: 'NORMAL' },
    { id: 'p-3', name: 'Platelet Count', value: '185,000', unit: '/mcL', normalRange: '150,000 - 450,000 /mcL', minVal: 150000, maxVal: 450000, status: 'NORMAL' },
    { id: 'p-4', name: 'Fasting Blood Sugar (FBS)', value: '165', unit: 'mg/dL', normalRange: '70 - 99 mg/dL', minVal: 70, maxVal: 99, status: 'HIGH' },
    { id: 'p-5', name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', normalRange: '0.6 - 1.2 mg/dL', minVal: 0.6, maxVal: 1.2, status: 'NORMAL' },
    { id: 'p-6', name: 'Serum Bilirubin (Total)', value: '0.8', unit: 'mg/dL', normalRange: '0.2 - 1.2 mg/dL', minVal: 0.2, maxVal: 1.2, status: 'NORMAL' },
  ]);

  // Handle OCR simulation
  const handleSimulateUpload = (fileName = 'Diagnostic_Lab_Report.pdf') => {
    setUploadedFile({ name: fileName, size: '2.4 MB', type: 'application/pdf' });
    setUploadProgress(0);
    setIsOcrRunning(true);
    setOcrSuccess(false);

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setUploadProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsOcrRunning(false);
          setOcrSuccess(true);
          addNotification({
            type: 'success',
            message: '✓ OCR Digitization Complete: Extracted 6 test parameters from PDF report!'
          });
        }, 500);
      }
    }, 200);
  };

  const handleParameterChange = (id: string, newVal: string) => {
    setParameters(parameters.map(row => {
      if (row.id !== id) return row;
      const num = parseFloat(newVal.replace(/,/g, ''));
      let status: LabParameterRow['status'] = 'NORMAL';
      if (!isNaN(num) && row.minVal !== undefined && row.maxVal !== undefined) {
        if (num < row.minVal) status = 'LOW';
        else if (num > row.maxVal) status = 'HIGH';
      }
      return { ...row, value: newVal, status };
    }));
  };

  const handleSaveLabResults = () => {
    if (activeQueueEntry) {
      updateQueueEntry(activeQueueEntry.id, {
        labReady: true
      });
    }

    addNotification({
      type: 'success',
      message: `Lab results digitized and committed for ${activePatient.firstName} ${activePatient.lastName}! Doctor cabin notified.`
    });

    // Navigate to dashboard
    setTimeout(() => {
      router.push('/nursing/dashboard');
    }, 1200);
  };

  // Pending lab orders list
  const pendingOrdersList = useMemo(() => {
    return [
      { id: 'po-1', caseNumber: 'C006-001-190926', patientName: 'Amit Shah', mrdNumber: 'MRD-2026-0004', doctor: 'Dr. Raj Valaki', testName: 'Blood Sugar Fasting & CBC Panel', urgency: 'URGENT (ON-HOLD)', date: 'Today 10:50 AM', status: 'Awaiting Results' },
      { id: 'po-2', caseNumber: 'C004-001-190926', patientName: 'Rekha Patel', mrdNumber: 'MRD-2026-0003', doctor: 'Dr. Raj Valaki', testName: 'Pre-Procedure Coagulation PT/INR', urgency: 'EMERGENCY', date: 'Today 10:40 AM', status: 'Sample Collected' },
      { id: 'po-3', caseNumber: 'C007-001-190926', patientName: 'Deepak Trivedi', mrdNumber: 'MRD-2026-0008', doctor: 'Dr. Suresh Kumar', testName: 'Serum Uric Acid & ESR', urgency: 'ROUTINE', date: 'Today 11:45 AM', status: 'Requisition Sent' },
    ];
  }, []);

  return (
    <div className="page-container" style={{ width: '100%', padding: '24px 20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <Link href="/nursing/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Nursing Dashboard
          </Link>
          <h1 className="page-title" style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
            Lab Report Upload & OCR Digitization Portal
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B' }}>
            Multi-modal diagnostic ingestion: Ingest external or in-clinic PDFs, execute medical OCR parameter extraction, and notify attending doctor.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: 8, background: '#FFFFFF', padding: 4, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setActiveTab('pending_queue')}
            className={`btn btn-sm ${activeTab === 'pending_queue' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 12, fontWeight: 700,
              background: activeTab === 'pending_queue' ? '#059669' : 'transparent',
              borderColor: activeTab === 'pending_queue' ? '#059669' : 'transparent'
            }}
          >
            <Clock size={14} /> Pending Requisitions ({pendingOrdersList.length})
          </button>
          <button
            onClick={() => setActiveTab('upload_workspace')}
            className={`btn btn-sm ${activeTab === 'upload_workspace' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 12, fontWeight: 700,
              background: activeTab === 'upload_workspace' ? '#059669' : 'transparent',
              borderColor: activeTab === 'upload_workspace' ? '#059669' : 'transparent'
            }}
          >
            <Upload size={14} /> Upload & Digitizer Workspace
          </button>
        </div>
      </div>

      {activeTab === 'pending_queue' ? (
        /* 5.1 Global Pending Reports Queue */
        <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
              Hospital-Wide Pending Diagnostic Orders ({pendingOrdersList.length})
            </span>
            <span style={{ fontSize: 11, color: '#64748B' }}>Click any requisition to open OCR workspace</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 20 }}>
            {pendingOrdersList.map(order => (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedCaseNumber(order.caseNumber);
                  setActiveTab('upload_workspace');
                }}
                style={{
                  padding: 16, borderRadius: 14, border: '1.5px solid #E2E8F0',
                  background: '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
                className="hover:border-emerald-500 hover:shadow-md"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 14, color: '#0F172A' }}>{order.patientName}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999,
                    background: order.urgency.includes('URGENT') ? '#FEF3C7' : '#EFF6FF',
                    color: order.urgency.includes('URGENT') ? '#D97706' : '#2563EB'
                  }}>
                    {order.urgency}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                  {order.mrdNumber} • Case: {order.caseNumber}
                </div>

                <div style={{ marginTop: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{order.testName}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Doctor: {order.doctor}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px dashed #E2E8F0', fontSize: 11 }}>
                  <span style={{ color: '#94A3B8' }}>{order.date}</span>
                  <span style={{ fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Digitize Report <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 5.2 Case-Specific Report Workspace */
        <div>
          {/* Active Case Banner */}
          <div className="card" style={{ padding: '14px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                  {activePatient.firstName[0]}{activePatient.lastName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                    {activePatient.firstName} {activePatient.lastName}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                    MRD: <strong style={{ color: '#0F172A' }}>{activePatient.mrdNumber}</strong> • Case: <strong style={{ color: '#0F172A' }}>{selectedCaseNumber}</strong> • Doctor: {activeQueueEntry?.doctorName}
                  </div>
                </div>
              </div>

              {/* Select Different Case */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Switch Case:</label>
                <select
                  className="form-select"
                  style={{ width: 220, fontSize: 12, borderColor: '#CBD5E1' }}
                  value={selectedCaseNumber}
                  onChange={e => setSelectedCaseNumber(e.target.value)}
                >
                  {queue.map(q => (
                    <option key={q.id} value={q.caseNumber}>
                      {q.patientName} ({q.tokenDisplay})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24, alignItems: 'start' }}>
            {/* Left: Drag and Drop File Uploader */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', padding: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={16} color="#059669" /> Multipart Report File Ingestion
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    handleSimulateUpload(file ? file.name : 'Scanned_Lab_Report.pdf');
                  }}
                  style={{
                    border: isDragging ? '2px dashed #059669' : '2px dashed #CBD5E1',
                    background: isDragging ? '#ecfdf5' : '#F8FAFC',
                    borderRadius: 14, padding: '36px 20px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onClick={() => handleSimulateUpload('Complete_Blood_Count_Sample.pdf')}
                >
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Upload size={22} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                    Drag & Drop PDF / Image Report Here
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                    Supported: PDF, JPG, PNG, WEBP • Max file size: 25MB
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: 14, borderColor: '#CBD5E1', fontSize: 11.5 }}
                  >
                    Browse Files on Computer
                  </button>
                </div>

                {/* Progress bar and OCR Status */}
                {uploadedFile && (
                  <div style={{ marginTop: 16, padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="#059669" />
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{uploadedFile.name}</span>
                        <span style={{ fontSize: 10, color: '#64748B' }}>({uploadedFile.size})</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#059669' }}>{uploadProgress}%</span>
                    </div>

                    {/* Bar */}
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#059669', transition: 'width 0.3s ease' }} />
                    </div>

                    {/* OCR Status feedback */}
                    {isOcrRunning && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={13} className="animate-spin" /> Running Medical OCR Parameter Extraction...
                      </div>
                    )}

                    {ocrSuccess && (
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={14} strokeWidth={3} /> OCR Success: 6 Clinical Parameters Extracted into Grid!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: 5.5 Fast-Entry Parameter Grid & Abnormal Flagging */}
            <div className="card" style={{ borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                  Laboratory Results Digitization Grid
                </span>
                <span className="badge badge-success" style={{ fontSize: 10 }}>OCR Auto-Populated</span>
              </div>

              <div className="table-responsive">
                <table className="table" style={{ margin: 0, fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#FFFFFF' }}>
                      <th style={{ padding: '10px 14px' }}>Parameter Name</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th style={{ textAlign: 'right', paddingRight: 14 }}>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map(p => {
                      const isAbnormal = p.status !== 'NORMAL';
                      return (
                        <tr key={p.id}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                            {p.name}
                          </td>
                          <td style={{ width: 100 }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{
                                padding: '4px 8px', fontSize: 12, fontWeight: 800,
                                color: isAbnormal ? '#DC2626' : '#0F172A',
                                borderColor: isAbnormal ? '#FCA5A5' : undefined,
                                background: isAbnormal ? '#FFF1F2' : '#FFFFFF'
                              }}
                              value={p.value}
                              onChange={e => handleParameterChange(p.id, e.target.value)}
                            />
                          </td>
                          <td style={{ color: '#64748B' }}>{p.unit}</td>
                          <td style={{ color: '#475569', fontSize: 11.5 }}>{p.normalRange}</td>
                          <td style={{ textAlign: 'right', paddingRight: 14 }}>
                            {p.status === 'NORMAL' ? (
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4 }}>
                                NORMAL
                              </span>
                            ) : p.status === 'LOW' ? (
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>
                                LOW ↓
                              </span>
                            ) : (
                              <span style={{ fontSize: 10.5, fontWeight: 900, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 4 }}>
                                HIGH ↑
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Commit Button */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSaveLabResults}
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', padding: '10px 20px', fontSize: 13, fontWeight: 800 }}
                >
                  <CheckCircle2 size={16} /> Commit Results & Notify Doctor Cabin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NursingLabReportsPage() {
  return (
    <Suspense fallback={<div className="page-container" style={{ padding: 40, textAlign: 'center' }}>Loading Lab Reports Portal...</div>}>
      <LabReportsContent />
    </Suspense>
  );
}
