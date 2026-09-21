'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Upload, FileText, CheckCircle2, Search, AlertCircle,
  File, Eye, Download, User, Stethoscope, Plus, Tag, X
} from 'lucide-react';
import {
  useLabStore, usePatientStore, useQueueStore, useUIStore,
  LabDocument
} from '@/store';

export default function LabUploadPage() {
  const { documents, addDocument, updateStatus } = useLabStore();
  const { patients } = usePatientStore();
  const { doctors, queue, updateQueueEntry } = useQueueStore();
  const { addNotification } = useUIStore();

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [category, setCategory] = useState<LabDocument['category']>('Blood Test');
  const [documentTitle, setDocumentTitle] = useState('');
  const [referringDoctor, setReferringDoctor] = useState(doctors[0]?.name || 'Dr. Raj Valaki');
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [simulatedFileSize, setSimulatedFileSize] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter & Search for Uploads Table
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<LabDocument | null>(null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSimulatedFileName(file.name);
      setSimulatedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      if (!documentTitle) {
        setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSimulateSelect = (name: string, size: string) => {
    setSimulatedFileName(name);
    setSimulatedFileSize(size);
    setDocumentTitle(name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = () => {
    if (!selectedPatient) {
      alert('No registered patient selected. Please register a patient first in Reception.');
      return;
    }
    if (!documentTitle.trim()) {
      alert('Please enter a document title.');
      return;
    }
    const fileName = simulatedFileName || `${documentTitle.replace(/\s+/g, '_')}.pdf`;
    const fileSize = simulatedFileSize || '1.2 MB';

    setIsUploading(true);
    setTimeout(() => {
      addDocument({
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        mrdNumber: selectedPatient.mrdNumber,
        title: documentTitle.trim(),
        category,
        fileName,
        fileSize,
        status: 'Attached to EHR',
        doctorName: referringDoctor,
      });

      // If patient is ON_HOLD, mark labReady: true so Doctor can resume!
      const onHoldEntry = queue.find(q => q.patientId === selectedPatient.id && q.status === 'ON_HOLD');
      if (onHoldEntry) {
        updateQueueEntry(onHoldEntry.id, { labReady: true });
        addNotification({
          type: 'success',
          message: `Diagnostic test ready for On-Hold patient ${selectedPatient.firstName} ${selectedPatient.lastName}. Doctor notified!`
        });
      }

      addNotification({
        type: 'info',
        message: `Uploaded ${documentTitle} for ${selectedPatient.firstName} ${selectedPatient.lastName}`
      });

      setIsUploading(false);
      setSuccessToast(`Document "${documentTitle}" successfully attached to ${selectedPatient.mrdNumber}'s EHR!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset
      setDocumentTitle('');
      setSimulatedFileName('');
      setSimulatedFileSize('');
    }, 800);
  };

  const filteredDocs = documents.filter(doc => {
    if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.patientName.toLowerCase().includes(q) ||
        doc.mrdNumber.toLowerCase().includes(q) ||
        doc.doctorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Diagnostic Reports & Lab Ingestion Portal</h1>
          <p className="page-subtitle">Upload external lab reports, radiology X-rays, and physical test documents brought by patients to attach them directly to their Electronic Health Record (EHR).</p>
        </div>
      </div>

      {successToast && (
        <div className="alert-banner success" style={{ marginBottom: 20 }}>
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start', marginBottom: 24 }}>
        {/* Upload Form Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Upload size={18} color="var(--primary)" />
              Document Upload & Metadata Tagging
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Patient Selector */}
            <div className="form-group">
              <label className="form-label required">Select Target Patient</label>
              <select
                className="form-select"
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
              >
                {patients.length === 0 && (
                  <option value="">No registered patients yet (Register in Reception)</option>
                )}
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrdNumber}) • {p.mobile}
                  </option>
                ))}
              </select>
            </div>

            {/* Category & Doctor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label required">Document Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                >
                  <option value="Blood Test">Blood Test (Pathology)</option>
                  <option value="Radiology">Radiology (X-Ray, CT, MRI)</option>
                  <option value="Pathology">Biopsy & Tissue Pathology</option>
                  <option value="Prescription">External Doctor Prescription</option>
                  <option value="Insurance">Insurance / TPA Paperwork</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Consulting Physician</label>
                <select
                  className="form-select"
                  value={referringDoctor}
                  onChange={e => setReferringDoctor(e.target.value)}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Title */}
            <div className="form-group">
              <label className="form-label required">Report Title / Test Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Lipid Profile & Serum Creatinine, Chest X-Ray PA View"
                value={documentTitle}
                onChange={e => setDocumentTitle(e.target.value)}
              />
            </div>

            {/* Drag & Drop Simulation Zone */}
            <div>
              <label className="form-label required" style={{ marginBottom: 6, display: 'block' }}>
                Report File (.pdf, .jpg, .png, .dcm)
              </label>

              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 20px',
                textAlign: 'center',
                background: 'var(--bg-muted)',
                position: 'relative'
              }}>
                <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                  {simulatedFileName ? simulatedFileName : 'Drag & drop patient report file here or browse'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {simulatedFileSize ? `File Size: ${simulatedFileSize}` : 'Supported formats: PDF, JPEG, DICOM up to 25MB'}
                </div>

                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
              </div>

              {/* Sample Quick Pick Buttons for Demo */}
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Demo Samples:</span>
                <button
                  type="button"
                  onClick={() => handleSimulateSelect('CBC_Report_Sept2026.pdf', '1.2 MB')}
                  className="badge badge-muted"
                  style={{ cursor: 'pointer' }}
                >
                  + CBC Report (1.2MB)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateSelect('Chest_XRay_Digital.dcm', '18.4 MB')}
                  className="badge badge-muted"
                  style={{ cursor: 'pointer' }}
                >
                  + Chest X-Ray (18.4MB)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateSelect('Lipid_Profile_Pathology.pdf', '850 KB')}
                  className="badge badge-muted"
                  style={{ cursor: 'pointer' }}
                >
                  + Lipid Profile (850KB)
                </button>
              </div>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              disabled={isUploading}
              onClick={handleUpload}
              className="btn btn-primary btn-lg"
              style={{ justifyContent: 'center', padding: '13px 20px', fontSize: 14 }}
            >
              <Upload size={16} /> {isUploading ? 'Encrypting & Attaching to EHR...' : 'Upload & Link to Patient Record'}
            </button>
          </div>
        </div>

        {/* Selected Patient EHR Summary */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <User size={16} color="var(--primary)" />
              Target Patient EHR Profile
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar avatar-md" style={{
                background: selectedPatient.gender === 'F' ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'linear-gradient(135deg, #6366F1, #3B82F6)'
              }}>
                {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedPatient.firstName} {selectedPatient.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 700 }}>{selectedPatient.mrdNumber}</div>
              </div>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-muted)', borderRadius: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Age / Gender:</span>
                <span style={{ fontWeight: 600 }}>{selectedPatient.age} Yrs ({selectedPatient.gender})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{selectedPatient.bloodGroup || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mobile:</span>
                <span style={{ fontWeight: 600 }}>{selectedPatient.mobile}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>City:</span>
                <span>{selectedPatient.city || 'Surat'}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              💡 <strong>Receptionist Note:</strong> Uploaded reports are immediately visible inside the doctor's consultation EHR tab and during active video triage.
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents Archive Table */}
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search reports by title, patient name, MRD #, or doctor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'Blood Test', 'Radiology', 'Pathology', 'Prescription', 'Insurance'].map(f => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`badge ${categoryFilter === f ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Patient Name & MRD</th>
                <th>Category</th>
                <th>File Name & Size</th>
                <th>Uploaded Date</th>
                <th>Doctor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No reports match this search criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="var(--primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.title}</span>
                      </div>
                    </td>

                    <td>
                      <Link href={`/reception/patients/${doc.patientId}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {doc.patientName}
                      </Link>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.mrdNumber}</div>
                    </td>

                    <td><span className="badge badge-info">{doc.category}</span></td>

                    <td>
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{doc.fileName}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{doc.fileSize}</div>
                    </td>

                    <td style={{ fontSize: 12 }}>{doc.uploadedAt}</td>

                    <td><span style={{ fontWeight: 500 }}>{doc.doctorName}</span></td>

                    <td>
                      <span className={`badge ${doc.status === 'Attached to EHR' ? 'badge-success' : 'badge-warning'}`}>
                        {doc.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="btn btn-ghost btn-sm"
                          title="Preview Document"
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          onClick={() => alert(`Downloading ${doc.fileName}...`)}
                          className="btn btn-ghost btn-sm"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{previewDoc.title}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setPreviewDoc(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: 'var(--bg-muted)', borderRadius: 12, padding: 30,
                textAlign: 'center', border: '1px solid var(--border)'
              }}>
                <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{previewDoc.fileName}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {previewDoc.category} • {previewDoc.fileSize} • Uploaded {previewDoc.uploadedAt}
                </p>

                <div style={{
                  marginTop: 20, padding: 14, background: 'var(--bg-card)',
                  borderRadius: 8, textAlign: 'left', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6
                }}>
                  <div><strong>Patient:</strong> {previewDoc.patientName} ({previewDoc.mrdNumber})</div>
                  <div><strong>Assigned Doctor:</strong> {previewDoc.doctorName}</div>
                  <div><strong>EHR Verification:</strong> <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ SHA-256 Validated & Encrypted</span></div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPreviewDoc(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => alert(`Downloading: ${previewDoc.fileName}`)}>
                <Download size={15} /> Download Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
