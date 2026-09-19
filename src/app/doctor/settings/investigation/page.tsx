'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Settings, Plus, Trash2, Edit2, Search, CheckCircle2,
  FileText, Activity, ArrowLeft, X
} from 'lucide-react';
import { useInvestigationCatalogStore, useUIStore } from '@/store';

export default function InvestigationMasterConfigPage() {
  const { catalog, addTest, deleteTest } = useInvestigationCatalogStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'PARAMETERS' | 'CATEGORIES'>('PARAMETERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTestModal, setShowAddTestModal] = useState(false);

  // New Test State
  const [testName, setTestName] = useState('');
  const [testCategory, setTestCategory] = useState<'Hematology' | 'Biochemistry' | 'Pathology' | 'Radiology' | 'Microbiology'>('Hematology');
  const [testPrice, setTestPrice] = useState(500);
  const [testUnit, setTestUnit] = useState('mg/dL');
  const [testNormalRange, setTestNormalRange] = useState('70 - 110 mg/dL');
  const [testInstructions, setTestInstructions] = useState('Fasting 10 hours required');

  // Initial Categories
  const [categories, setCategories] = useState([
    { name: 'Hematology', color: '#EF4444', desc: 'Complete blood counts, ESR, coagulation studies' },
    { name: 'Biochemistry', color: '#F59E0B', desc: 'Liver function, renal profile, fasting glucose, HbA1c' },
    { name: 'Pathology & Serology', color: '#8B5CF6', desc: 'Histopathology, tissue biopsy, hormonal assays' },
    { name: 'Microbiology', color: '#10B981', desc: 'Bacterial culture, fungal scraping, gram stain' },
    { name: 'Radiology', color: '#3B82F6', desc: 'Digital X-Rays, high-resolution ultrasound, CT scans' },
  ]);

  const handleCreateTest = () => {
    if (!testName.trim()) return;
    addTest({
      name: testName.trim(),
      category: testCategory,
      price: testPrice,
      unit: testUnit,
      normalRange: testNormalRange,
      instructions: testInstructions
    });

    addNotification({
      type: 'success',
      message: `Configured new laboratory test: ${testName}`
    });

    setShowAddTestModal(false);
    setTestName('');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Investigation & Laboratory Master Configuration</h1>
          <p className="page-subtitle">Configure outpatient diagnostic test directories, reference normal ranges, sample instructions, and pricing.</p>
        </div>

        <button
          onClick={() => setShowAddTestModal(true)}
          className="btn btn-primary"
          style={{ background: '#036d92', borderColor: '#036d92' }}
        >
          <Plus size={16} /> Add Test Definition
        </button>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActiveTab('PARAMETERS')}
              className={`btn ${activeTab === 'PARAMETERS' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              style={{ background: activeTab === 'PARAMETERS' ? '#036d92' : undefined }}
            >
              1. Test Parameters & Ranges ({catalog.length})
            </button>
            <button
              onClick={() => setActiveTab('CATEGORIES')}
              className={`btn ${activeTab === 'CATEGORIES' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              style={{ background: activeTab === 'CATEGORIES' ? '#036d92' : undefined }}
            >
              2. Diagnostic Categories ({categories.length})
            </button>
          </div>

          <div className="search-input-wrap" style={{ width: 280 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-input"
              placeholder="Search parameters or tests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Parameters Table */}
      {activeTab === 'PARAMETERS' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Domain Category</th>
                  <th>Standard Reference Price</th>
                  <th>Unit</th>
                  <th>Standard Normal Range</th>
                  <th>Preparation Instructions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog
                  .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(test => (
                    <tr key={test.id}>
                      <td style={{ fontWeight: 700, color: '#036d92' }}>{test.name}</td>
                      <td>
                        <span className="badge badge-info">{test.category}</span>
                      </td>
                      <td style={{ fontWeight: 800 }}>₹{test.price}</td>
                      <td>{test.unit || '—'}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {test.normalRange || 'Negative / Normal'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {test.instructions || 'Standard sampling'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => deleteTest(test.id)}
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete test definition"
                        >
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'CATEGORIES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {categories.map((cat, idx) => (
            <div key={idx} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                  <span className="card-title">{cat.name}</span>
                </div>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="modal-overlay" onClick={() => setShowAddTestModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Configure New Investigation Parameter</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddTestModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">Test Parameter Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Serum Ferritin Level"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Domain Category</label>
                    <select
                      className="form-select"
                      value={testCategory}
                      onChange={e => setTestCategory(e.target.value as any)}
                    >
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Radiology">Radiology</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Standard Price (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={testPrice}
                      onChange={e => setTestPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Measurement Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ng/mL"
                      value={testUnit}
                      onChange={e => setTestUnit(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Reference Normal Range</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 20 - 250 ng/mL"
                      value={testNormalRange}
                      onChange={e => setTestNormalRange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Pre-Test Patient Instructions</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10 hours overnight fasting"
                    value={testInstructions}
                    onChange={e => setTestInstructions(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddTestModal(false)}>Cancel</button>
              <button
                onClick={handleCreateTest}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92' }}
              >
                Save Test Configuration ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
