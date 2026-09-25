'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity, Plus, Search, Filter, CheckCircle2,
  Clock, DollarSign, Package, FileText, Trash2, Edit2,
  X, Check, AlertCircle
} from 'lucide-react';
import { useAdminStore, useInventoryStore, useUIStore, ProcedureMaster } from '@/store';

export default function AdminProceduresPage() {
  const { procedures, addProcedure, deleteProcedure, toggleProcedureStatus } = useAdminStore();
  const { inventory } = useInventoryStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'overview' | 'consumables' | 'prerequisites' | 'procedures'>('procedures');

  const activeProceduresCount = useMemo(() => {
    return procedures.filter(p => p.isActive !== false).length;
  }, [procedures]);

  // Form State
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Dermatology' as ProcedureMaster['category'],
    basePrice: 1500,
    durationMins: 30,
    requiresConsent: true,
    requiresNursing: true,
    requiresRoom: true,
    linkedConsumables: [] as Array<{ drugId: string; drugName: string; quantity: number }>,
    preInstructions: '',
    postInstructions: '',
    isActive: true
  });

  const filteredProcedures = useMemo(() => {
    return procedures.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [procedures, searchTerm, selectedCategory]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      addNotification({ type: 'danger', message: 'Procedure name and billing code are required.' });
      return;
    }

    addProcedure({
      name: form.name,
      code: form.code.toUpperCase().trim(),
      category: form.category,
      basePrice: Number(form.basePrice),
      durationMins: Number(form.durationMins),
      requiresConsent: form.requiresConsent,
      requiresNursing: form.requiresNursing,
      requiresRoom: form.requiresRoom,
      linkedConsumables: form.linkedConsumables,
      preInstructions: form.preInstructions,
      postInstructions: form.postInstructions,
      isActive: form.isActive
    });

    addNotification({
      type: 'success',
      message: `Clinical procedure "${form.name}" registered in master catalog and available for Doctor Consultation.`
    });

    setIsAddModalOpen(false);
    setForm({
      name: '',
      code: '',
      category: 'Dermatology',
      basePrice: 1500,
      durationMins: 30,
      requiresConsent: true,
      requiresNursing: true,
      requiresRoom: true,
      linkedConsumables: [],
      preInstructions: '',
      postInstructions: '',
      isActive: true
    });
  };

  const handleToggleStatus = (id: string, name: string, currentActive: boolean) => {
    toggleProcedureStatus(id);
    const newStatus = !currentActive;
    addNotification({
      type: newStatus ? 'success' : 'warning',
      message: `Procedure "${name}" is now ${newStatus ? 'ACTIVE (selectable in Doctor Consultation)' : 'INACTIVE (hidden from new doctor selections)'}.`
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove procedure "${name}" from the active clinical catalog?`)) {
      deleteProcedure(id);
      addNotification({ type: 'info', message: `Procedure "${name}" deleted.` });
    }
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ec4899', background: '#FDF2F8', padding: '2px 8px', borderRadius: 4, border: '1px solid #FBCFE8' }}>
              Clinical Master Registries
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Outpatient Procedures & Automatic Consumables</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={26} color="#ec4899" /> Procedure Master & Consumables Mapping
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Base pricing rules, consent prerequisites, nursing station dispatches, and automated pharmacy pack deductions.
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
            background: '#ec4899',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(236, 72, 153, 0.2)'
          }}
        >
          <Plus size={16} /> Register New Procedure
        </button>
      </div>

      {/* 4 Tabs Navigation Bar */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #E2E8F0', marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          id="admin-proc-tab-overview"
          onClick={() => setAdminTab('overview')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: adminTab === 'overview' ? '3px solid #ec4899' : '3px solid transparent',
            background: adminTab === 'overview' ? '#FDF2F8' : 'transparent',
            color: adminTab === 'overview' ? '#BE185D' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>1. Clinical SOPs & Safety</span>
        </button>

        <button
          type="button"
          id="admin-proc-tab-consumables"
          onClick={() => setAdminTab('consumables')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: adminTab === 'consumables' ? '3px solid #ec4899' : '3px solid transparent',
            background: adminTab === 'consumables' ? '#FDF2F8' : 'transparent',
            color: adminTab === 'consumables' ? '#BE185D' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>2. Consumable Stock Deductions</span>
        </button>

        <button
          type="button"
          id="admin-proc-tab-prerequisites"
          onClick={() => setAdminTab('prerequisites')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: adminTab === 'prerequisites' ? '3px solid #ec4899' : '3px solid transparent',
            background: adminTab === 'prerequisites' ? '#FDF2F8' : 'transparent',
            color: adminTab === 'prerequisites' ? '#BE185D' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>3. OT Cabins & Nursing Stations</span>
        </button>

        <button
          type="button"
          id="admin-proc-tab-procedures"
          onClick={() => setAdminTab('procedures')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: adminTab === 'procedures' ? '3px solid #059669' : '3px solid transparent',
            background: adminTab === 'procedures' ? '#ECFDF5' : 'transparent',
            color: adminTab === 'procedures' ? '#065F46' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>4. Procedures ({activeProceduresCount})</span>
          <span style={{
            fontSize: '0.7rem',
            background: adminTab === 'procedures' ? '#059669' : '#10B981',
            color: '#FFFFFF',
            padding: '2px 7px',
            borderRadius: 12,
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            SOURCE FOR DOCTOR
          </span>
        </button>
      </div>

      {/* Tab 1: Clinical SOPs & Safety */}
      {adminTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#D97706" />
            <span style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>
              <strong>Operational Standards Only:</strong> This tab contains outpatient clinical governance standards and sterilization checklists. Items here are administrative protocols and do <em>not</em> feed into the Doctor Consultation selector. Only <strong>4. Procedures</strong> is the master source for Doctor Consultation.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Total Registered Procedures</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{procedures.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4 }}>Across all clinical specialties</div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Active in Doctor Selector</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{activeProceduresCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Synchronized with Doctor Panel</div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Requires Nursing Assist</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>{procedures.filter(p => p.requiresNursing).length}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Triage & minor dressing bays</div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Mandatory Legal Consent</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>{procedures.filter(p => p.requiresConsent).length}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Informed e-signature binding</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              Standard Clinical Safety Protocols
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>Pre-Procedure Patient Verification:</strong> Match patient token, name, and MRD number before opening sterile instrument packs.</li>
              <li><strong>Sterilization Audit:</strong> Autoclave indicator strips must be verified and logged per batch.</li>
              <li><strong>Surgical Timeout:</strong> Confirm procedure site, clinical indication, and consent signature with patient prior to local anesthesia.</li>
              <li><strong>Post-Procedure Observation:</strong> Monitor vitals for minimum 15 minutes post invasive outpatient procedures.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Consumable Stock Deductions */}
      {adminTab === 'consumables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#D97706" />
            <span style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>
              <strong>Pharmacy Inventory Mapping Only:</strong> This tab manages automatic consumable stock deductions when procedures are performed. These stock mapping rules do <em>not</em> feed into the Doctor Consultation selector. Only <strong>4. Procedures</strong> is the master source for Doctor Consultation.
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                Procedure-to-Consumables Pharmacy Stock Deductions
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 18px' }}>Procedure</th>
                  <th style={{ padding: '12px 18px' }}>Billing Code</th>
                  <th style={{ padding: '12px 18px' }}>Linked Consumables</th>
                  <th style={{ padding: '12px 18px' }}>Inventory Action</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>{p.name}</td>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: '#EC4899', fontWeight: 600 }}>{p.code}</td>
                    <td style={{ padding: '12px 18px', color: '#475569' }}>
                      {p.linkedConsumables.length > 0 ? (
                        p.linkedConsumables.map((c, i) => (
                          <span key={i} style={{ display: 'inline-block', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, marginRight: 6, fontSize: '0.8rem' }}>
                            {c.drugName} &times; {c.quantity}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#94A3B8' }}>No consumables linked</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#059669', fontWeight: 600, fontSize: '0.82rem' }}>
                      Auto-deduct on completion
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: OT Cabins & Nursing Stations */}
      {adminTab === 'prerequisites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#D97706" />
            <span style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>
              <strong>Facility Infrastructure Only:</strong> This tab governs Minor OT cabin assignments and nursing room occupancy. It does <em>not</em> feed into the Doctor Consultation selector. Only <strong>4. Procedures</strong> is the master source for Doctor Consultation.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Minor OT Cabin 1 (Sterile)</h4>
                <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>ACTIVE</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748B' }}>
                Dedicated for minor biopsies, laser hair reduction, and sterile excision procedures.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#334155' }}><strong>Equipment:</strong> Diode Laser, Electrocautery, Surgical Tray</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Nursing Procedure Bay A</h4>
                <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>ACTIVE</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748B' }}>
                Dedicated for aseptic wound dressing, suture removal, and ear syringing.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#334155' }}><strong>Equipment:</strong> Syringing kit, Sterile Gauze packs, Antiseptic station</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Procedures Catalog (Master Source for Doctor Consultation) */}
      {adminTab === 'procedures' && (
        <div>
          {/* Master Source Confirmation Banner */}
          <div style={{
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={22} color="#059669" />
              <div>
                <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.92rem' }}>
                  Exact Master Source for Doctor Consultation &rarr; Procedure Supplies (Clinical Instruments)
                </div>
                <div style={{ color: '#047857', fontSize: '0.82rem', marginTop: 2 }}>
                  Only the active records in this &ldquo;4. Procedures&rdquo; catalog appear in the Doctor&apos;s + Add selector. Adding or toggling status dynamically updates the Doctor panel without duplicating masters.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', background: '#DCFCE7', padding: '4px 12px', borderRadius: 6, border: '1px solid #BBF7D0' }}>
                {activeProceduresCount} Active in Doctor Selector
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search procedure by name or code..."
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
              <option value="ALL">All Clinical Categories</option>
              <option value="Dermatology">Dermatology</option>
              <option value="General Surgery">General Surgery</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="ENT">ENT</option>
              <option value="Nursing / Minor">Nursing / Minor</option>
            </select>
          </div>

          {/* Procedures Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 18px' }}>Procedure Name & Code</th>
                  <th style={{ padding: '14px 18px' }}>Category</th>
                  <th style={{ padding: '14px 18px' }}>Base Fee</th>
                  <th style={{ padding: '14px 18px' }}>Duration</th>
                  <th style={{ padding: '14px 18px' }}>Prerequisites</th>
                  <th style={{ padding: '14px 18px' }}>Linked Consumables</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Master Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcedures.map(proc => {
                  const isActive = proc.isActive !== false;
                  return (
                    <tr key={proc.id} style={{ borderBottom: '1px solid #f1f5f9', background: isActive ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: isActive ? '#0f172a' : '#64748b' }}>{proc.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#ec4899', fontFamily: 'monospace', fontWeight: 600 }}>
                          {proc.code}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.78rem', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                          {proc.category}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                        ₹{proc.basePrice}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#475569' }}>
                        {proc.durationMins} mins
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {proc.requiresConsent && (
                            <span style={{ fontSize: '0.7rem', background: '#FFFBEB', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              CONSENT REQ
                            </span>
                          )}
                          {proc.requiresNursing && (
                            <span style={{ fontSize: '0.7rem', background: '#ECFEFF', color: '#0891B2', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              NURSING
                            </span>
                          )}
                          {proc.requiresRoom && (
                            <span style={{ fontSize: '0.7rem', background: '#EEF2FF', color: '#4338CA', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              ROOM REQ
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: '#64748b' }}>
                        {proc.linkedConsumables.length > 0 ? (
                          proc.linkedConsumables.map((c, idx) => (
                            <div key={idx}>• {c.drugName} (Qty: {c.quantity})</div>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None linked</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(proc.id, proc.name, isActive)}
                          style={{
                            border: isActive ? '1px solid #10b981' : '1px solid #cbd5e1',
                            background: isActive ? '#ecfdf5' : '#f1f5f9',
                            color: isActive ? '#047857' : '#64748b',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                          title={isActive ? "Active in Master (Click to Deactivate)" : "Inactive in Master (Click to Activate)"}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#10b981' : '#94a3b8' }} />
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(proc.id, proc.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: 4
                          }}
                          title="Delete Procedure"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Procedure Modal */}
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
            maxWidth: 540,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={20} color="#ec4899" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Register Clinical Outpatient Procedure
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Procedure Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suture Removal & Dressing"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Unique Billing Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PROC-DERM-05"
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Clinical Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="ENT">ENT</option>
                    <option value="Nursing / Minor">Nursing / Minor</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Base Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={form.durationMins}
                    onChange={(e) => setForm(f => ({ ...f, durationMins: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Prerequisite Checkboxes */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Clinical Workflow Prerequisites:
                </span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.requiresConsent}
                      onChange={(e) => setForm(f => ({ ...f, requiresConsent: e.target.checked }))}
                      style={{ accentColor: '#ec4899' }}
                    />
                    Requires Informed Consent Form
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.requiresNursing}
                      onChange={(e) => setForm(f => ({ ...f, requiresNursing: e.target.checked }))}
                      style={{ accentColor: '#ec4899' }}
                    />
                    Requires Nursing Station
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.requiresRoom}
                      onChange={(e) => setForm(f => ({ ...f, requiresRoom: e.target.checked }))}
                      style={{ accentColor: '#ec4899' }}
                    />
                    Requires Minor OT Cabin
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Pre-Procedure Clinical Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fasting 4 hours prior, avoid blood thinners..."
                  value={form.preInstructions}
                  onChange={(e) => setForm(f => ({ ...f, preInstructions: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Post-Procedure Patient Care Advice
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep dressing dry, apply ice 15m..."
                  value={form.postInstructions}
                  onChange={(e) => setForm(f => ({ ...f, postInstructions: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FDF2F8', padding: '10px 12px', borderRadius: 6, border: '1px solid #FBCFE8' }}>
                <input
                  type="checkbox"
                  id="proc-active-checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ accentColor: '#ec4899', width: 16, height: 16 }}
                />
                <label htmlFor="proc-active-checkbox" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9D174D', cursor: 'pointer' }}>
                  Procedure Active in Master (Immediately selectable in Doctor Consultation /doctor/consultation/:caseId)
                </label>
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
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#ec4899', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Procedure Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
