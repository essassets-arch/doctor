'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Search, Filter, CheckCircle2,
  Printer, Save, Languages, Eye, Edit2, X
} from 'lucide-react';
import { useAdminStore, useUIStore } from '@/store';

export default function AdminConsentFormsPage() {
  const { consentTemplates, updateConsentTemplate } = useAdminStore();
  const { addNotification } = useUIStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(consentTemplates[0]?.id || 'cons-1');
  const [activeLang, setActiveLang] = useState<'English' | 'Hindi' | 'Gujarati'>('English');

  const selectedTemplate = useMemo(() => {
    return consentTemplates.find(t => t.id === selectedTemplateId) || consentTemplates[0];
  }, [consentTemplates, selectedTemplateId]);

  const [editorContent, setEditorContent] = useState(selectedTemplate?.content || '');

  // Update editor content on template selection
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const t = consentTemplates.find(x => x.id === id);
    if (t) setEditorContent(t.content);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    updateConsentTemplate(selectedTemplate.id, editorContent);
    addNotification({
      type: 'success',
      message: `Legal template "${selectedTemplate.title}" saved & published.`
    });
  };

  // Live Token Substitution Preview for Mahesh Kumar
  const previewContent = useMemo(() => {
    let text = editorContent;
    text = text.replace(/\[Patient Name\]/g, 'Mahesh Kumar');
    text = text.replace(/\[MRD Number\]/g, 'MRD-2026-0001');
    text = text.replace(/\[Doctor Name\]/g, 'Dr. Raj Valaki');
    text = text.replace(/\[Clinic Name\]/g, 'MedFlow Multispeciality Clinic');
    text = text.replace(/\[Procedure Name\]/g, 'Skin Lesion Excision & Biopsy');
    text = text.replace(/\[Date\]/g, '19/09/2026');
    return text;
  }, [editorContent]);

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706', background: '#FFFBEB', padding: '2px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
              Legal Compliance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Informed Procedural Consent & Token Injection</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={26} color="#d97706" /> Legal Informed Consent Form Templates
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Multilingual informed surgical and procedural consent documents with dynamic patient token substitution.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 8,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <Printer size={16} /> Print Template Sheet
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 24 }}>
        
        {/* Left: Template Roster */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Clinical Consent Templates
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {consentTemplates.map(t => {
              const isSelected = selectedTemplate?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: `1.5px solid ${isSelected ? '#d97706' : '#E2E8F0'}`,
                    background: isSelected ? '#FFFBEB' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? '#92400E' : '#0F172A' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
                        Category: <strong>{t.category}</strong> • Language: <strong>{t.language}</strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supported Tokens Legend */}
          <div style={{ marginTop: 20, background: '#F8FAFC', borderRadius: 8, padding: 14, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
              Available Dynamic Injection Tokens:
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              <code style={{ background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>[Patient Name]</code>
              <code style={{ background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>[MRD Number]</code>
              <code style={{ background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>[Doctor Name]</code>
              <code style={{ background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>[Procedure Name]</code>
              <code style={{ background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>[Clinic Name]</code>
              <code style={{ background: '#EEF2FF', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>[Date]</code>
            </div>
          </div>
        </div>

        {/* Right: Template Editor & Live Preview */}
        {selectedTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Editor Area */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Template Editor: {selectedTemplate.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Language: {selectedTemplate.language}</span>
              </div>

              <form onSubmit={handleSave}>
                <textarea
                  rows={6}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#d97706',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Save size={15} /> Save & Publish Template
                  </button>
                </div>
              </form>
            </div>

            {/* Live Patient Substitution Preview */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Eye size={16} color="#059669" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                  Live Patient Signature Document Preview (Simulated for Mahesh Kumar)
                </span>
              </div>

              <div style={{
                background: '#FDFDFD',
                border: '1.5px dashed #CBD5E1',
                borderRadius: 8,
                padding: 24,
                fontFamily: 'Georgia, serif',
                lineHeight: 1.8,
                fontSize: '0.95rem',
                color: '#1E293B'
              }}>
                <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', marginBottom: 14, textTransform: 'uppercase' }}>
                  {selectedTemplate.title}
                </div>

                <p>{previewContent}</p>

                {/* Simulated Signature Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 16, borderTop: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ height: 35, borderBottom: '1px solid #94a3b8', width: 180, marginBottom: 4 }}></div>
                    <div>Patient / Guardian Signature</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Date: 19/09/2026</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ height: 35, borderBottom: '1px solid #94a3b8', width: 180, marginBottom: 4, marginLeft: 'auto' }}></div>
                    <div>Attending Physician Signature</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Dr. Raj Valaki (Reg: G-44821)</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
