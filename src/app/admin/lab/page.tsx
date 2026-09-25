'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles, Plus, Search, Filter, CheckCircle2,
  Clock, DollarSign, Activity, AlertTriangle, X,
  FileText, ShieldCheck, Edit3, Trash2, Power,
  Sliders, Database, Check, Eye, HelpCircle, Layers,
  FlaskConical, ArrowRight, ChevronRight, ListFilter, Tag
} from 'lucide-react';
import { useAdminStore, useUIStore, LabTest, LabTestParameter } from '@/store';

export default function AdminLabPage() {
  const {
    labTests,
    addLabTest,
    updateLabTest,
    deleteLabTest,
    toggleLabTestStatus,
    toggleLabTestOrderable,
    addLabTestParameter,
    updateLabTestParameter,
    removeLabTestParameter
  } = useAdminStore();
  const { addNotification } = useUIStore();

  // Navigation Tabs for Admin Master
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'REQUISITION' | 'PARAMETERS'>('CATALOG');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ORDERABLE' | 'NON_ORDERABLE'>('ALL');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [selectedTestForParams, setSelectedTestForParams] = useState<LabTest | null>(null);
  const [viewDetailsTest, setViewDetailsTest] = useState<LabTest | null>(null);

  // New Parameter Modal state
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [paramForm, setParamForm] = useState({
    name: '',
    code: '',
    dataType: 'Numeric' as 'Numeric' | 'Text' | 'Select',
    unit: '',
    referenceRange: '',
    maleMin: '',
    maleMax: '',
    femaleMin: '',
    femaleMax: '',
    childMin: '',
    childMax: '',
    decimalPrecision: '1',
    optionsText: ''
  });

  // Test Form State (For Add / Edit)
  const defaultFormState = {
    name: '',
    code: '',
    category: 'Hematology',
    department: 'Clinical Hematology',
    specimen: 'Whole Blood',
    container: 'EDTA (Purple Tube)',
    method: 'Automated 5-Part Cell Counter',
    turnaroundTime: '4 Hours',
    turnaroundHours: 4,
    price: 350,
    isActive: true,
    isOrderable: true,
    requiresFasting: false,
    defaultPriority: 'Routine' as 'Routine' | 'Urgent' | 'STAT',
    instructions: '',
    clinicalIndicationRequired: false,
    doctorNotesAllowed: true,
    // First parameter quick creation
    paramName: 'Primary Analyte',
    paramCode: '',
    paramDataType: 'Numeric' as 'Numeric' | 'Text' | 'Select',
    paramUnit: 'mg/dL',
    paramRefRange: '10 - 50',
    paramMaleMin: 10,
    paramMaleMax: 50,
    paramFemaleMin: 10,
    paramFemaleMax: 45
  };
  const [testForm, setTestForm] = useState(defaultFormState);

  // Filtered Catalog
  const filteredTests = useMemo(() => {
    return labTests.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.specimen && t.specimen.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') matchStatus = t.isActive;
      if (statusFilter === 'INACTIVE') matchStatus = !t.isActive;
      if (statusFilter === 'ORDERABLE') matchStatus = t.isActive && t.isOrderable;
      if (statusFilter === 'NON_ORDERABLE') matchStatus = !t.isOrderable;

      return matchSearch && matchCat && matchStatus;
    });
  }, [labTests, searchTerm, selectedCategory, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = labTests.length;
    const active = labTests.filter(t => t.isActive).length;
    const orderable = labTests.filter(t => t.isActive && t.isOrderable).length;
    const totalParams = labTests.reduce((acc, t) => acc + (t.parameters?.length || 0), 0);
    return { total, active, orderable, totalParams };
  }, [labTests]);

  const openAddModal = () => {
    setEditingTestId(null);
    setTestForm({
      ...defaultFormState,
      code: `LAB-${Date.now().toString().slice(-4)}`
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (test: LabTest) => {
    setEditingTestId(test.id);
    setTestForm({
      name: test.name,
      code: test.code,
      category: test.category,
      department: test.department || '',
      specimen: test.specimen,
      container: test.container || test.specimenTube || '',
      method: test.method || '',
      turnaroundTime: test.turnaroundTime || `${test.turnaroundHours || 4} Hours`,
      turnaroundHours: test.turnaroundHours || 4,
      price: test.price,
      isActive: test.isActive,
      isOrderable: test.isOrderable,
      requiresFasting: test.requiresFasting || false,
      defaultPriority: test.defaultPriority || 'Routine',
      instructions: test.instructions || '',
      clinicalIndicationRequired: test.clinicalIndicationRequired || false,
      doctorNotesAllowed: test.doctorNotesAllowed ?? true,
      paramName: '',
      paramCode: '',
      paramDataType: 'Numeric',
      paramUnit: '',
      paramRefRange: '',
      paramMaleMin: 0,
      paramMaleMax: 0,
      paramFemaleMin: 0,
      paramFemaleMax: 0
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name.trim() || !testForm.code.trim()) {
      addNotification({ type: 'danger', message: 'Test Name and Test Code are mandatory.' });
      return;
    }

    if (editingTestId) {
      updateLabTest(editingTestId, {
        name: testForm.name.trim(),
        code: testForm.code.trim(),
        category: testForm.category,
        department: testForm.department.trim(),
        specimen: testForm.specimen.trim(),
        container: testForm.container.trim(),
        specimenTube: testForm.container.trim(),
        method: testForm.method.trim(),
        turnaroundTime: testForm.turnaroundTime.trim(),
        turnaroundHours: Number(testForm.turnaroundHours) || 4,
        price: Number(testForm.price) || 0,
        isActive: testForm.isActive,
        isOrderable: testForm.isOrderable,
        requiresFasting: testForm.requiresFasting,
        defaultPriority: testForm.defaultPriority,
        instructions: testForm.instructions.trim(),
        clinicalIndicationRequired: testForm.clinicalIndicationRequired,
        doctorNotesAllowed: testForm.doctorNotesAllowed
      });
      addNotification({
        type: 'success',
        message: `Updated catalog test: ${testForm.name}`
      });
    } else {
      const initialParams: LabTestParameter[] = testForm.paramName.trim() ? [
        {
          id: `p-${Date.now()}-1`,
          labTestId: '',
          name: testForm.paramName.trim(),
          code: testForm.paramCode.trim() || testForm.paramName.slice(0, 4).toUpperCase(),
          dataType: testForm.paramDataType,
          unit: testForm.paramUnit.trim(),
          referenceRange: testForm.paramRefRange.trim(),
          maleMin: Number(testForm.paramMaleMin) || undefined,
          maleMax: Number(testForm.paramMaleMax) || undefined,
          femaleMin: Number(testForm.paramFemaleMin) || undefined,
          femaleMax: Number(testForm.paramFemaleMax) || undefined,
          displayOrder: 1,
          isActive: true
        }
      ] : [];

      addLabTest({
        name: testForm.name.trim(),
        code: testForm.code.trim(),
        category: testForm.category,
        department: testForm.department.trim(),
        specimen: testForm.specimen.trim(),
        container: testForm.container.trim(),
        specimenTube: testForm.container.trim(),
        method: testForm.method.trim(),
        turnaroundTime: testForm.turnaroundTime.trim(),
        turnaroundHours: Number(testForm.turnaroundHours) || 4,
        price: Number(testForm.price) || 0,
        isActive: testForm.isActive,
        isOrderable: testForm.isOrderable,
        requiresFasting: testForm.requiresFasting,
        defaultPriority: testForm.defaultPriority,
        instructions: testForm.instructions.trim(),
        clinicalIndicationRequired: testForm.clinicalIndicationRequired,
        doctorNotesAllowed: testForm.doctorNotesAllowed,
        parameters: initialParams
      });
      addNotification({
        type: 'success',
        message: `Created diagnostic test in master catalog: ${testForm.name}`
      });
    }

    setIsAddEditModalOpen(false);
  };

  const handleAddParameter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForParams || !paramForm.name.trim()) return;

    const optionsList = paramForm.dataType === 'Select' && paramForm.optionsText.trim()
      ? paramForm.optionsText.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    addLabTestParameter(selectedTestForParams.id, {
      name: paramForm.name.trim(),
      code: paramForm.code.trim() || paramForm.name.slice(0, 4).toUpperCase(),
      dataType: paramForm.dataType,
      unit: paramForm.unit.trim() || undefined,
      referenceRange: paramForm.referenceRange.trim() || undefined,
      maleMin: paramForm.maleMin ? Number(paramForm.maleMin) : undefined,
      maleMax: paramForm.maleMax ? Number(paramForm.maleMax) : undefined,
      femaleMin: paramForm.femaleMin ? Number(paramForm.femaleMin) : undefined,
      femaleMax: paramForm.femaleMax ? Number(paramForm.femaleMax) : undefined,
      childMin: paramForm.childMin ? Number(paramForm.childMin) : undefined,
      childMax: paramForm.childMax ? Number(paramForm.childMax) : undefined,
      decimalPrecision: Number(paramForm.decimalPrecision) || 0,
      optionsJson: optionsList,
      displayOrder: (selectedTestForParams.parameters?.length || 0) + 1,
      isActive: true
    });

    addNotification({
      type: 'success',
      message: `Added parameter "${paramForm.name}" to ${selectedTestForParams.name}`
    });

    setParamForm({
      name: '',
      code: '',
      dataType: 'Numeric',
      unit: '',
      referenceRange: '',
      maleMin: '',
      maleMax: '',
      femaleMin: '',
      femaleMax: '',
      childMin: '',
      childMax: '',
      decimalPrecision: '1',
      optionsText: ''
    });
    setIsAddParamModalOpen(false);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#F8FAFC', padding: '24px 28px' }}>
      
      {/* Top Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366F1', background: '#EEF2FF', padding: '3px 10px', borderRadius: 6, border: '1px solid #C7D2FE' }}>
              CLINICAL MASTER REGISTRIES • SINGLE SOURCE OF TRUTH
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Hospital Diagnostic Catalog &amp; Result Ingestion
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={28} color="#6366F1" /> Diagnostic Laboratory Masters
          </h1>

          <p style={{ margin: '6px 0 0', color: '#475569', fontSize: '0.92rem', maxWidth: 840 }}>
            Master diagnostic catalog configured by Admin. Defines test codes, specimens, ordering eligibility, fasting criteria, and gender-stratified analyte result parameters. Consumed live by Doctor Consultation Lab Orders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-new-lab-test"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={18} /> Add New Lab Test
        </button>
      </div>

      {/* Stats Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Total Catalog Tests</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Configured diagnostic master tests</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#059669' }}>Orderable in Doctor OPD</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{stats.orderable}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Visible in Doctor Lab Order tab</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6366F1' }}>Result Parameters Configured</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6366F1', marginTop: 4 }}>{stats.totalParams}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Gender/child stratified normal ranges</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#D97706' }}>Active Diagnostic Categories</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            {Array.from(new Set(labTests.map(t => t.category))).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Hematology, Bio, Path, Micro...</div>
        </div>
      </div>

      {/* Synchronized Master Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('CATALOG')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'CATALOG' ? 'none' : '1px solid #E2E8F0',
            background: activeTab === 'CATALOG' ? '#6366F1' : '#FFFFFF',
            color: activeTab === 'CATALOG' ? '#FFFFFF' : '#475569',
            boxShadow: activeTab === 'CATALOG' ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
          }}
        >
          <Database size={16} /> 1. Hospital Diagnostic Catalog ({labTests.length})
        </button>

        <button
          onClick={() => setActiveTab('REQUISITION')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'REQUISITION' ? 'none' : '1px solid #E2E8F0',
            background: activeTab === 'REQUISITION' ? '#6366F1' : '#FFFFFF',
            color: activeTab === 'REQUISITION' ? '#FFFFFF' : '#475569',
            boxShadow: activeTab === 'REQUISITION' ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
          }}
        >
          <Sliders size={16} /> 2. Requisition &amp; Order Configuration
        </button>

        <button
          onClick={() => setActiveTab('PARAMETERS')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'PARAMETERS' ? 'none' : '1px solid #E2E8F0',
            background: activeTab === 'PARAMETERS' ? '#6366F1' : '#FFFFFF',
            color: activeTab === 'PARAMETERS' ? '#FFFFFF' : '#475569',
            boxShadow: activeTab === 'PARAMETERS' ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
          }}
        >
          <FlaskConical size={16} /> 3. Ingestion &amp; Result Parameters Matrix
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Hospital Diagnostic Catalog by test name, code, department, specimen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: 6,
            border: '1px solid #CBD5E1',
            fontSize: '0.85rem',
            background: '#FFFFFF',
            color: '#334155'
          }}
        >
          <option value="ALL">All Diagnostic Categories</option>
          <option value="Hematology">Hematology</option>
          <option value="Biochemistry">Biochemistry</option>
          <option value="Pathology">Pathology</option>
          <option value="Microbiology">Microbiology</option>
          <option value="Radiology">Radiology</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '9px 14px',
            borderRadius: 6,
            border: '1px solid #CBD5E1',
            fontSize: '0.85rem',
            background: '#FFFFFF',
            color: '#334155'
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Tests Only</option>
          <option value="ORDERABLE">Orderable (Visible to Doctor)</option>
          <option value="NON_ORDERABLE">Non-Orderable / Hidden</option>
          <option value="INACTIVE">Deactivated Tests</option>
        </select>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HOSPITAL DIAGNOSTIC CATALOG TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'CATALOG' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={16} color="#6366F1" /> Master Hospital Diagnostic Registry ({filteredTests.length} tests matching)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Synchronized single source of truth for Doctor Consultation Lab Orders
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>Test Name &amp; Method</th>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Sample / Specimen</th>
                  <th style={{ padding: '12px 16px' }}>Parameters</th>
                  <th style={{ padding: '12px 16px' }}>Price</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => (
                  <tr key={test.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }} className="hover:bg-slate-50">
                    {/* Test Name */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                        {test.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                        {test.department && <span>Dept: {test.department}</span>}
                        {test.turnaroundTime && <span>• TAT: {test.turnaroundTime}</span>}
                        {test.method && <span>• {test.method}</span>}
                      </div>
                    </td>

                    {/* Code */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid #C7D2FE'
                      }}>
                        {test.code}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#F5F3FF',
                        color: '#7C3AED',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {test.category}
                      </span>
                    </td>

                    {/* Sample */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{test.specimen}</div>
                      {test.container && (
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                          🧪 {test.container}
                        </div>
                      )}
                    </td>

                    {/* Parameters count */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTestForParams(test)}
                        style={{
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          color: '#15803D',
                          borderRadius: 6,
                          padding: '3px 9px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <FlaskConical size={13} /> {test.parameters?.length || 0} Parameters
                      </button>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                        ₹{test.price}
                      </div>
                      {test.requiresFasting && (
                        <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 600 }}>
                          Fasting Req.
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          display: 'inline-block',
                          width: 'fit-content',
                          background: test.isActive ? '#DCFCE7' : '#FEE2E2',
                          color: test.isActive ? '#15803D' : '#B91C1C'
                        }}>
                          {test.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 4,
                          display: 'inline-block',
                          width: 'fit-content',
                          background: test.isOrderable ? '#E0F2FE' : '#F1F5F9',
                          color: test.isOrderable ? '#0369A1' : '#64748B'
                        }}>
                          {test.isOrderable ? 'Orderable' : 'Hidden'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewDetailsTest(test)}
                          title="View Test Details"
                          style={{
                            padding: '5px 8px',
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            color: '#475569',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Eye size={13} /> View
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(test)}
                          title="Edit Configuration"
                          style={{
                            padding: '5px 8px',
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            color: '#2563EB',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleLabTestStatus(test.id)}
                          title={test.isActive ? 'Deactivate test' : 'Activate test'}
                          style={{
                            padding: '5px 8px',
                            background: test.isActive ? '#FEF2F2' : '#F0FDF4',
                            border: `1px solid ${test.isActive ? '#FECACA' : '#BBF7D0'}`,
                            borderRadius: 6,
                            color: test.isActive ? '#DC2626' : '#16A34A',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Power size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REQUISITION & ORDER CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'REQUISITION' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Requisition &amp; Order Rules Configuration
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              Configures what can actually be ordered from the master catalog by physicians. Changing Orderable to NO or deactivating immediately hides the test from Doctor Lab Order search.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {filteredTests.map((test) => (
              <div
                key={test.id}
                id={`req-card-${test.code}`}
                style={{
                  background: '#F8FAFC',
                  border: `1px solid ${test.isOrderable && test.isActive ? '#CBD5E1' : '#F1F5F9'}`,
                  borderRadius: 10,
                  padding: 16,
                  opacity: test.isActive ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4 }}>
                      {test.code}
                    </span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                      {test.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {test.category} • ₹{test.price}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      id={`btn-toggle-orderable-${test.code}`}
                      onClick={() => toggleLabTestOrderable(test.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: test.isOrderable ? '#059669' : '#94A3B8',
                        color: '#FFFFFF'
                      }}
                    >
                      {test.isOrderable ? 'ORDERABLE: YES' : 'ORDERABLE: NO'}
                    </button>
                  </div>
                </div>

                {/* Configuration Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.8rem', background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 700 }}>Requires Fasting</div>
                    <button
                      type="button"
                      onClick={() => updateLabTest(test.id, { requiresFasting: !test.requiresFasting })}
                      style={{
                        background: test.requiresFasting ? '#FEF3C7' : '#F1F5F9',
                        color: test.requiresFasting ? '#B45309' : '#64748B',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginTop: 3
                      }}
                    >
                      {test.requiresFasting ? 'YES (Strict Fasting)' : 'NO'}
                    </button>
                  </div>

                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 700 }}>Default Priority</div>
                    <select
                      value={test.defaultPriority || 'Routine'}
                      onChange={(e) => updateLabTest(test.id, { defaultPriority: e.target.value as any })}
                      style={{
                        marginTop: 3,
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.75rem',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="STAT">STAT</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 700 }}>Clinical Indication</div>
                    <button
                      type="button"
                      onClick={() => updateLabTest(test.id, { clinicalIndicationRequired: !test.clinicalIndicationRequired })}
                      style={{
                        background: test.clinicalIndicationRequired ? '#EDE9FE' : '#F1F5F9',
                        color: test.clinicalIndicationRequired ? '#6D28D9' : '#64748B',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginTop: 3
                      }}
                    >
                      {test.clinicalIndicationRequired ? 'Mandatory' : 'Optional'}
                    </button>
                  </div>

                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 700 }}>Doctor Notes</div>
                    <button
                      type="button"
                      onClick={() => updateLabTest(test.id, { doctorNotesAllowed: !test.doctorNotesAllowed })}
                      style={{
                        background: test.doctorNotesAllowed ? '#DCFCE7' : '#FEE2E2',
                        color: test.doctorNotesAllowed ? '#15803D' : '#B91C1C',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginTop: 3
                      }}
                    >
                      {test.doctorNotesAllowed ? 'Allowed' : 'Disabled'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#475569' }}>
                  <strong>Instructions: </strong>
                  {test.instructions || <span style={{ color: '#94A3B8' }}>None configured.</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INGESTION & RESULT PARAMETERS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'PARAMETERS' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Ingestion &amp; Result Parameters Matrix
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Each lab test defines multiple analyte parameters. During lab result entry, technician views these exact parameters with gender/child reference intervals.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredTests.map((test) => (
              <div key={test.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 18px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>
                      {test.code}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{test.name}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', marginLeft: 10 }}>
                      ({test.category} • {test.specimen})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTestForParams(test);
                      setIsAddParamModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: '#6366F1',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> Add Parameter
                  </button>
                </div>

                <div style={{ padding: '12px 18px', overflowX: 'auto' }}>
                  {test.parameters && test.parameters.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left', fontWeight: 700 }}>
                          <th style={{ padding: '8px 10px' }}>#</th>
                          <th style={{ padding: '8px 10px' }}>Parameter Name</th>
                          <th style={{ padding: '8px 10px' }}>Code</th>
                          <th style={{ padding: '8px 10px' }}>Data Type</th>
                          <th style={{ padding: '8px 10px' }}>Unit</th>
                          <th style={{ padding: '8px 10px' }}>Male Interval</th>
                          <th style={{ padding: '8px 10px' }}>Female Interval</th>
                          <th style={{ padding: '8px 10px' }}>Child Interval / Options</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {test.parameters.map((p, pIdx) => (
                          <tr key={p.id || pIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{pIdx + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1E293B' }}>{p.name}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#4F46E5' }}>{p.code || '-'}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ fontSize: '0.72rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                                {p.dataType}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>{p.unit || '-'}</td>
                            <td style={{ padding: '8px 10px', color: '#0369A1' }}>
                              {p.maleMin !== undefined && p.maleMax !== undefined ? `${p.maleMin} – ${p.maleMax}` : (p.referenceRange || '-')}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#BE185D' }}>
                              {p.femaleMin !== undefined && p.femaleMax !== undefined ? `${p.femaleMin} – ${p.femaleMax}` : (p.referenceRange || '-')}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#64748B' }}>
                              {p.optionsJson && p.optionsJson.length > 0 ? (
                                <span style={{ fontSize: '0.72rem', background: '#EDE9FE', color: '#6D28D9', padding: '2px 6px', borderRadius: 4 }}>
                                  {p.optionsJson.join(', ')}
                                </span>
                              ) : p.childMin !== undefined && p.childMax !== undefined ? (
                                `${p.childMin} – ${p.childMax}`
                              ) : (
                                '-'
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => removeLabTestParameter(test.id, p.id)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}
                                title="Remove parameter"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '0.82rem' }}>
                      No result parameters defined for {test.name}. Click &ldquo;Add Parameter&rdquo; to configure.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MASTER LAB TEST */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            width: '100%',
            maxWidth: 680,
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="#6366F1" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  {editingTestId ? 'Edit Diagnostic Catalog Item' : 'Add New Lab Test (Admin Master)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTest} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Notice */}
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#3730A3' }}>
                <strong>Single Master Source:</strong> Tests configured here immediately appear in Doctor Consultation → Lab Order tab. Doctor cannot create independent tests.
              </div>

              {/* Section 1: Basic Test Information */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#6366F1', marginBottom: 10 }}>
                  1. Basic Test Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Test Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Complete Blood Count (CBC) with ESR"
                      value={testForm.name}
                      onChange={(e) => setTestForm(f => ({ ...f, name: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Test Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAB-CBC"
                      value={testForm.code}
                      onChange={(e) => setTestForm(f => ({ ...f, code: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Category *
                    </label>
                    <select
                      value={testForm.category}
                      onChange={(e) => setTestForm(f => ({ ...f, category: e.target.value as any }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    >
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Radiology">Radiology</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Clinical Hematology"
                      value={testForm.department}
                      onChange={(e) => setTestForm(f => ({ ...f, department: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Sample / Specimen *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Whole Blood, Serum, Urine"
                      value={testForm.specimen}
                      onChange={(e) => setTestForm(f => ({ ...f, specimen: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Container / Specimen Tube
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EDTA (Purple Tube)"
                      value={testForm.container}
                      onChange={(e) => setTestForm(f => ({ ...f, container: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Method
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5-Part Cell Counter"
                      value={testForm.method}
                      onChange={(e) => setTestForm(f => ({ ...f, method: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Turnaround Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4 Hours"
                      value={testForm.turnaroundTime}
                      onChange={(e) => setTestForm(f => ({ ...f, turnaroundTime: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10"
                      value={testForm.price}
                      onChange={(e) => setTestForm(f => ({ ...f, price: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Requisition & Order Configuration */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#6366F1', marginBottom: 10 }}>
                  2. Requisition &amp; Order Rules
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={testForm.isOrderable}
                      onChange={(e) => setTestForm(f => ({ ...f, isOrderable: e.target.checked }))}
                    />
                    Orderable by Doctor
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={testForm.requiresFasting}
                      onChange={(e) => setTestForm(f => ({ ...f, requiresFasting: e.target.checked }))}
                    />
                    Requires Fasting
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={testForm.clinicalIndicationRequired}
                      onChange={(e) => setTestForm(f => ({ ...f, clinicalIndicationRequired: e.target.checked }))}
                    />
                    Indication Mandatory
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={testForm.isActive}
                      onChange={(e) => setTestForm(f => ({ ...f, isActive: e.target.checked }))}
                    />
                    Status: Active
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Requisition Instructions (Shown to Doctor)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 hours overnight fasting required. Water allowed."
                    value={testForm.instructions}
                    onChange={(e) => setTestForm(f => ({ ...f, instructions: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Section 3: Initial Result Parameter (If Creating New) */}
              {!editingTestId && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#6366F1', marginBottom: 10 }}>
                    3. Initial Ingestion Result Parameter (Optional)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748B' }}>Parameter Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Hemoglobin"
                        value={testForm.paramName}
                        onChange={(e) => setTestForm(f => ({ ...f, paramName: e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748B' }}>Code</label>
                      <input
                        type="text"
                        placeholder="e.g. HGB"
                        value={testForm.paramCode}
                        onChange={(e) => setTestForm(f => ({ ...f, paramCode: e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748B' }}>Unit</label>
                      <input
                        type="text"
                        placeholder="e.g. g/dL"
                        value={testForm.paramUnit}
                        onChange={(e) => setTestForm(f => ({ ...f, paramUnit: e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#6366F1',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {editingTestId ? 'Save Changes' : 'Save to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD RESULT PARAMETER TO A SPECIFIC TEST */}
      {/* ========================================================================= */}
      {isAddParamModalOpen && selectedTestForParams && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            width: '100%',
            maxWidth: 580,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Add Analyte Parameter to: {selectedTestForParams.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Code: {selectedTestForParams.code} • {selectedTestForParams.category}
                </span>
              </div>
              <button
                onClick={() => setIsAddParamModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddParameter} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Parameter Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Total Triiodothyronine (T3)"
                    value={paramForm.name}
                    onChange={(e) => setParamForm(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Analyte Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. T3"
                    value={paramForm.code}
                    onChange={(e) => setParamForm(p => ({ ...p, code: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Data Type *
                  </label>
                  <select
                    value={paramForm.dataType}
                    onChange={(e) => setParamForm(p => ({ ...p, dataType: e.target.value as any }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  >
                    <option value="Numeric">Numeric</option>
                    <option value="Text">Text</option>
                    <option value="Select">Select (Options)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mg/dL, /µL, %"
                    value={paramForm.unit}
                    onChange={(e) => setParamForm(p => ({ ...p, unit: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Decimals
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={paramForm.decimalPrecision}
                    onChange={(e) => setParamForm(p => ({ ...p, decimalPrecision: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {paramForm.dataType === 'Numeric' && (
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                    Gender Stratified Reference Intervals
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#0369A1' }}>Male Min</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 13.0"
                        value={paramForm.maleMin}
                        onChange={(e) => setParamForm(p => ({ ...p, maleMin: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#0369A1' }}>Male Max</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 17.5"
                        value={paramForm.maleMax}
                        onChange={(e) => setParamForm(p => ({ ...p, maleMax: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#BE185D' }}>Female Min</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 12.0"
                        value={paramForm.femaleMin}
                        onChange={(e) => setParamForm(p => ({ ...p, femaleMin: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#BE185D' }}>Female Max</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 15.5"
                        value={paramForm.femaleMax}
                        onChange={(e) => setParamForm(p => ({ ...p, femaleMax: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paramForm.dataType === 'Select' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Select Options (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A+, A-, B+, B-, AB+, AB-, O+, O-"
                    value={paramForm.optionsText}
                    onChange={(e) => setParamForm(p => ({ ...p, optionsText: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Reference Interval Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. 13.0 - 17.5 g/dL (Adults)"
                  value={paramForm.referenceRange}
                  onChange={(e) => setParamForm(p => ({ ...p, referenceRange: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddParamModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#6366F1', color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW TEST DETAILS */}
      {/* ========================================================================= */}
      {viewDetailsTest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            width: '100%',
            maxWidth: 620,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>
                  {viewDetailsTest.code}
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{viewDetailsTest.name}</strong>
              </div>
              <button
                onClick={() => setViewDetailsTest(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Category</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{viewDetailsTest.category}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Department</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{viewDetailsTest.department || '-'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Specimen &amp; Tube</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
                    {viewDetailsTest.specimen} {viewDetailsTest.container ? `(${viewDetailsTest.container})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Turnaround Time (TAT)</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{viewDetailsTest.turnaroundTime || `${viewDetailsTest.turnaroundHours} Hours`}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Diagnostic Tariff (Price)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>₹{viewDetailsTest.price}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Orderable in Doctor OPD</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: viewDetailsTest.isOrderable ? '#059669' : '#DC2626' }}>
                    {viewDetailsTest.isOrderable ? 'YES (Active in Search)' : 'NO (Hidden from Doctor)'}
                  </div>
                </div>
              </div>

              {viewDetailsTest.instructions && (
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: 4 }}>Preparation Instructions:</div>
                  <div style={{ fontSize: '0.84rem', color: '#1E293B' }}>{viewDetailsTest.instructions}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E293B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FlaskConical size={14} color="#6366F1" /> Result Parameters ({viewDetailsTest.parameters?.length || 0})
                </div>

                {viewDetailsTest.parameters && viewDetailsTest.parameters.length > 0 ? (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px' }}>Parameter</th>
                          <th style={{ padding: '6px 10px' }}>Unit</th>
                          <th style={{ padding: '6px 10px' }}>Male</th>
                          <th style={{ padding: '6px 10px' }}>Female</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewDetailsTest.parameters.map((p, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 700, color: '#1E293B' }}>{p.name}</td>
                            <td style={{ padding: '6px 10px' }}>{p.unit || '-'}</td>
                            <td style={{ padding: '6px 10px', color: '#0369A1' }}>
                              {p.maleMin !== undefined && p.maleMax !== undefined ? `${p.maleMin}–${p.maleMax}` : (p.referenceRange || '-')}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#BE185D' }}>
                              {p.femaleMin !== undefined && p.femaleMax !== undefined ? `${p.femaleMin}–${p.femaleMax}` : (p.referenceRange || '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>No parameters configured.</div>
                )}
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setViewDetailsTest(null)}
                style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
