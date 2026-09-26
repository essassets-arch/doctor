'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Search, Filter, CheckCircle2,
  Printer, Save, Languages, Eye, Edit2, X,
  ShieldCheck, AlertCircle, ArrowUpRight, Copy,
  Check, Sparkles, User, RefreshCw, LayoutGrid
} from 'lucide-react';
import { useAdminStore, useUIStore, usePatientStore } from '@/store';
import ProcedureConsentForm, {
  ConsentPatientInfo,
  TWELVE_CONSENT_TEMPLATES,
  ConsentTemplateItem
} from '@/components/ProcedureConsentForm';

export default function AdminConsentFormsPage() {
  const { addNotification } = useUIStore();
  const { patients } = usePatientStore();

  const [customProcedure, setCustomProcedure] = useState<string>('HAIR REMOVAL - DIODE (TRIPLE WAVELENGTH)');
  const [customBodyPart, setCustomBodyPart] = useState<string>('FACE');

  // Bound clinical patient data for Mahesh Kumar (Case #C003-001-190926)
  const activePatientInfo: ConsentPatientInfo = useMemo(() => {
    return {
      name: 'Mahesh Kumar',
      gender: 'M',
      age: 45,
      place: 'Surat',
      ipdNo: 'IPD-2026-089',
      mrdNo: 'MRD-2026-0001',
      caseNo: 'C003-001-190926',
      procedureName: customProcedure,
      bodyPart: customBodyPart,
      date: '2026-03-25',
      doctorName: 'Dr. Raj Valaki, MBBS, MD (Dermatology)',
      clinicName: 'MEDFLOW MULTISPECIALITY CLINIC & LASER AESTHETICS CENTRE',
      language: 'Gujarati'
    };
  }, [customProcedure, customBodyPart]);

  // Tab View in Admin: Live Interactive Form vs Catalog Table / Editor
  const [activeAdminTab, setActiveAdminTab] = useState<'interactive' | 'catalog'>('interactive');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogLesson, setSelectedCatalogLesson] = useState<number>(1);

  const filteredLessons = useMemo(() => {
    if (!catalogSearch.trim()) return TWELVE_CONSENT_TEMPLATES;
    const q = catalogSearch.toLowerCase();
    return TWELVE_CONSENT_TEMPLATES.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.procedureName.toLowerCase().includes(q) ||
        t.gujaratiTitle.toLowerCase().includes(q) ||
        t.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [catalogSearch]);

  const activeLessonDetail = useMemo(() => {
    return (
      TWELVE_CONSENT_TEMPLATES.find(t => t.templateNo === selectedCatalogLesson) ||
      TWELVE_CONSENT_TEMPLATES[0]
    );
  }, [selectedCatalogLesson]);

  return (
    <div style={{ width: '100%', padding: '24px 20px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
              NABH Legal Compliance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Master Source: /admin/consent-forms</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={26} color="#059669" /> Medico-Legal Informed Consent Forms (સંમતિ પત્રક)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Standard Consent Catalog (12 Lessons / Templates) • Multilingual (Gujarati, Hindi, English) • Xerox Duplicate Option • Auto-linked to Procedures.
          </p>
        </div>

        {/* Action Controls & Patient Context Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setActiveAdminTab('interactive')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeAdminTab === 'interactive' ? '#059669' : 'transparent',
                color: activeAdminTab === 'interactive' ? '#FFFFFF' : '#475569',
                fontWeight: activeAdminTab === 'interactive' ? 800 : 600,
                fontSize: 12.5,
                cursor: 'pointer'
              }}
            >
              📄 Live Interactive Form
            </button>
            <button
              onClick={() => setActiveAdminTab('catalog')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeAdminTab === 'catalog' ? '#059669' : 'transparent',
                color: activeAdminTab === 'catalog' ? '#FFFFFF' : '#475569',
                fontWeight: activeAdminTab === 'catalog' ? 800 : 600,
                fontSize: 12.5,
                cursor: 'pointer'
              }}
            >
              📚 12 Lessons Catalog &amp; Editor
            </button>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={15} /> Print Sheet
          </button>
        </div>
      </div>

      {/* Active Clinical Binding Details Bar (Procedure consent selector) */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '12px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} color="#059669" /> Select Consent Form Template (12 Master Lessons):
          </span>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Choose which consent form to preview, edit, or print below. Synchronizes with doctor consultation and patient EHR files.
          </span>
        </div>

        <div style={{ fontSize: 12, color: '#64748B' }}>
          Patient File: <strong style={{ color: '#0F172A' }}>{activePatientInfo.name}</strong> • Case: <strong style={{ color: '#059669' }}>{activePatientInfo.caseNo}</strong> • MRD: <strong style={{ color: '#0F172A' }}>{activePatientInfo.mrdNo}</strong>
        </div>
      </div>

      {/* VIEW 1: LIVE INTERACTIVE PROCEDURE CONSENT FORM (The Exact 12-Template Master Component) */}
      {activeAdminTab === 'interactive' && (
        <div>
          <ProcedureConsentForm
            patient={activePatientInfo}
            onUpdateProcedure={(updated) => {
              setCustomProcedure(updated.procedureName);
              setCustomBodyPart(updated.bodyPart);
              addNotification({
                type: 'success',
                message: `Admin procedure updated to "${updated.procedureName}" (${updated.bodyPart})`
              });
            }}
          />
        </div>
      )}

      {/* VIEW 2: 12 LESSONS CATALOG & LEGAL TEXT REPOSITORY */}
      {activeAdminTab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: 24 }}>
          {/* Left: 12 Lessons Roster */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                Standard Consent Catalog (12 Lessons)
              </h3>
              <span className="badge badge-success">12 Templates</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search templates or keywords (e.g. Diode, Peel, Botox)..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '68vh', overflowY: 'auto' }}>
              {filteredLessons.map(lesson => {
                const isSelected = selectedCatalogLesson === lesson.templateNo;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      setSelectedCatalogLesson(lesson.templateNo);
                      setCustomProcedure(lesson.procedureName);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? '#059669' : '#E2E8F0'}`,
                      background: isSelected ? '#ECFDF5' : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            background: isSelected ? '#059669' : '#0369A1',
                            color: '#FFFFFF',
                            fontSize: 10.5,
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: 4
                          }}>
                            Lesson {lesson.templateNo}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: 13, color: isSelected ? '#065F46' : '#0F172A' }}>
                            {lesson.title}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                          Procedure: <strong style={{ color: '#0369A1' }}>{lesson.procedureName}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 2, fontWeight: 600 }}>
                          {lesson.gujaratiTitle}
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, color: isSelected ? '#059669' : '#94A3B8', fontWeight: 700 }}>
                        {isSelected ? 'ACTIVE' : 'SELECT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Lesson Comprehensive Legal Dossier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="card-title" style={{ fontSize: 16 }}>
                    Lesson {activeLessonDetail.templateNo} of 12 • {activeLessonDetail.title}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Linked Procedure: <strong>{activeLessonDetail.procedureName}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCustomProcedure(activeLessonDetail.procedureName);
                    setActiveAdminTab('interactive');
                    addNotification({
                      type: 'info',
                      message: `Loaded Lesson ${activeLessonDetail.templateNo} in live interactive viewer.`
                    });
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#059669', borderColor: '#059669', fontSize: 12 }}
                >
                  <Eye size={13} /> View Live Form
                </button>
              </div>

              <div className="card-body">
                {/* Declarations in 3 Languages */}
                <div style={{ marginBottom: 18 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                    1. Informed Consent Declaration (ત્રણેય ભાષામાં ઘોષણાપત્ર)
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5 }}>
                      <strong style={{ color: '#059669' }}>🇬🇺 ગુજરાતી:</strong> {activeLessonDetail.consentText.gujarati}
                    </div>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5 }}>
                      <strong style={{ color: '#0369A1' }}>🇮🇳 हिंदी:</strong> {activeLessonDetail.consentText.hindi}
                    </div>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5 }}>
                      <strong style={{ color: '#4338CA' }}>🇬🇧 English:</strong> {activeLessonDetail.consentText.english}
                    </div>
                  </div>
                </div>

                {/* Risks and Disclosures */}
                <div style={{ marginBottom: 18 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                    2. Risks &amp; Complications Disclosed (સંભવિત આડઅસર અને જોખમો)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activeLessonDetail.risksAndComplications.gujarati.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Post-Care Instructions */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                    3. Post-Care Instructions (પ્રક્રિયા પછીની કાળજી)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activeLessonDetail.postCareInstructions.gujarati.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
