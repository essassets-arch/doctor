'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles, Plus, Search, Filter, CheckCircle2,
  Clock, DollarSign, Activity, AlertTriangle, X,
  FileText, ShieldCheck
} from 'lucide-react';
import { useAdminStore, useUIStore, LabTestMaster } from '@/store';

export default function AdminLabPage() {
  const { labTests, addLabTest } = useAdminStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: 'Biochemistry' as LabTestMaster['category'],
    specimenTube: 'Serum Gel (Yellow)' as LabTestMaster['specimenTube'],
    price: 500,
    turnaroundHours: 4,
    paramName: 'Primary Analyte',
    paramUnit: 'mg/dL',
    maleMin: 10,
    maleMax: 50,
    femaleMin: 10,
    femaleMax: 45
  });

  const filteredTests = useMemo(() => {
    return labTests.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [labTests, searchTerm, selectedCategory]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      addNotification({ type: 'danger', message: 'Test name is required.' });
      return;
    }

    addLabTest({
      name: form.name,
      category: form.category,
      specimenTube: form.specimenTube,
      price: Number(form.price),
      turnaroundHours: Number(form.turnaroundHours),
      parameters: [
        {
          name: form.paramName,
          unit: form.paramUnit,
          maleMin: Number(form.maleMin),
          maleMax: Number(form.maleMax),
          femaleMin: Number(form.femaleMin),
          femaleMax: Number(form.femaleMax)
        }
      ]
    });

    addNotification({
      type: 'success',
      message: `Diagnostic test "${form.name}" registered in lab master.`
    });

    setIsAddModalOpen(false);
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b5cf6', background: '#F5F3FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #DDD6FE' }}>
              Clinical Master Registries
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Laboratory Diagnostics & Panic Reference Ranges</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={26} color="#8b5cf6" /> Diagnostic Laboratory Masters
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Specimen tube color codes, turnaround time SLAs, gender-stratified reference intervals, and critical panic thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: '#8b5cf6',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
          }}
        >
          <Plus size={16} /> Register Diagnostic Test
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search laboratory test by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            color: '#334155'
          }}
        >
          <option value="ALL">All Diagnostic Categories</option>
          <option value="Hematology">Hematology</option>
          <option value="Biochemistry">Biochemistry</option>
          <option value="Pathology">Pathology</option>
          <option value="Microbiology">Microbiology</option>
        </select>
      </div>

      {/* Lab Tests Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {filteredTests.map(test => (
          <div key={test.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {test.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', background: '#F5F3FF', color: '#8b5cf6', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    {test.category}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>₹{test.price}</div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>TAT: {test.turnaroundHours} Hours</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 6 }}>
                Specimen Tube: <strong style={{ color: '#0f172a' }}>{test.specimenTube}</strong>
              </div>

              {/* Parameters Table */}
              <div style={{ marginTop: 12, background: '#F8FAFC', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                  Analyte Reference Intervals
                </div>
                {test.parameters.map((p, idx) => (
                  <div key={idx} style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>{p.name} ({p.unit})</span>
                    <span style={{ fontWeight: 600, color: '#4338ca' }}>
                      M: {p.maleMin}–{p.maleMax} | F: {p.femaleMin}–{p.femaleMax}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Panic Thresholds Active</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Auto-Dispatched to Doctor</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Test Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 520,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Register Diagnostic Laboratory Test
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Diagnostic Test Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Serum Electrolytes (Na, K, Cl)"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Lab Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Specimen Vacutainer Tube
                  </label>
                  <select
                    value={form.specimenTube}
                    onChange={(e) => setForm(f => ({ ...f, specimenTube: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Serum Gel (Yellow)">Serum Gel (Yellow)</option>
                    <option value="EDTA (Purple)">EDTA (Purple)</option>
                    <option value="Fluoride (Grey)">Fluoride (Grey)</option>
                    <option value="Plain (Red)">Plain (Red)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Standard Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Turnaround Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.turnaroundHours}
                    onChange={(e) => setForm(f => ({ ...f, turnaroundHours: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#8b5cf6', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Register Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
