'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Search, Filter, CheckCircle2,
  AlertTriangle, ShieldAlert, DollarSign, Layers,
  Trash2, X, RefreshCw
} from 'lucide-react';
import { useInventoryStore, usePharmacyStore, useUIStore } from '@/store';

export default function AdminDrugsPage() {
  const { inventory } = useInventoryStore();
  const { batches, addNewDrugMaster } = usePharmacyStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormulation, setSelectedFormulation] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    genericName: '',
    formulation: 'Tablet',
    unitPrice: 20,
    reorderLevel: 25,
    initialStock: 100,
    batchNumber: 'BAT-2630',
    expiryDate: '2028-06-30',
    supplier: 'Sun Pharma Distributors',
    scheduleClass: 'Schedule H'
  });

  const filteredDrugs = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchForm = selectedFormulation === 'ALL' || item.formulation === selectedFormulation;
      return matchSearch && matchForm;
    });
  }, [inventory, searchTerm, selectedFormulation]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.genericName) {
      addNotification({ type: 'danger', message: 'Medicine brand name and generic formula are required.' });
      return;
    }

    addNewDrugMaster({
      name: form.name,
      genericName: form.genericName,
      formulation: form.formulation,
      unitPrice: Number(form.unitPrice),
      reorderLevel: Number(form.reorderLevel),
      initialStock: Number(form.initialStock),
      batchNumber: form.batchNumber,
      expiryDate: form.expiryDate,
      supplier: form.supplier
    });

    addNotification({
      type: 'success',
      message: `Formulary drug "${form.name}" registered in enterprise database.`
    });

    setIsAddModalOpen(false);
    setForm({
      name: '',
      genericName: '',
      formulation: 'Tablet',
      unitPrice: 20,
      reorderLevel: 25,
      initialStock: 100,
      batchNumber: 'BAT-2630',
      expiryDate: '2028-06-30',
      supplier: 'Sun Pharma Distributors',
      scheduleClass: 'Schedule H'
    });
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
              Clinical Master Registries
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Central Drug Master & Formulary Catalog</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={26} color="#059669" /> Central Drug Master & Formulary
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Brand trade names, chemical compositions, Schedule H/X classifications, and clinical autocomplete masters.
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
            background: '#059669',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
          }}
        >
          <Plus size={16} /> Register Formulary Drug
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search drug brand or chemical generic..."
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
          value={selectedFormulation}
          onChange={(e) => setSelectedFormulation(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            color: '#334155'
          }}
        >
          <option value="ALL">All Formulations</option>
          <option value="Tablet">Tablets</option>
          <option value="Capsule">Capsules</option>
          <option value="Syrup">Syrups</option>
          <option value="Ointment">Ointments</option>
          <option value="Lotion">Lotions</option>
          <option value="Injection">Injections</option>
        </select>
      </div>

      {/* Drugs Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 18px' }}>Trade Name & Composition</th>
              <th style={{ padding: '14px 18px' }}>Form</th>
              <th style={{ padding: '14px 18px' }}>Schedule Class</th>
              <th style={{ padding: '14px 18px' }}>Current Stock</th>
              <th style={{ padding: '14px 18px' }}>Reorder Level</th>
              <th style={{ padding: '14px 18px' }}>Retail MRP</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrugs.map(drug => {
              const isOut = drug.stock === 0;
              const isLow = drug.stock > 0 && drug.stock <= drug.reorderLevel;

              return (
                <tr key={drug.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{drug.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{drug.genericName}</div>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                      {drug.formulation}
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                      Schedule H Prescription
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontWeight: 800,
                      color: isOut ? '#DC2626' : isLow ? '#D97706' : '#16A34A',
                      fontSize: '0.92rem'
                    }}>
                      {drug.stock} units
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {drug.reorderLevel} units
                  </td>

                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#334155' }}>
                    ₹{drug.unitPrice}
                  </td>

                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: isOut ? '#FEE2E2' : isLow ? '#FEF3C7' : '#DCFCE7',
                      color: isOut ? '#991B1B' : isLow ? '#B45309' : '#15803D'
                    }}>
                      {isOut ? 'DEPLETED' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Drug Modal */}
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
                <Package size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Register New Formulary Medicine
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Brand / Trade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ciprofloxacin 500mg (Ciplox)"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Chemical Composition / Generic Formula *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ciprofloxacin Hydrochloride IP"
                  value={form.genericName}
                  onChange={(e) => setForm(f => ({ ...f, genericName: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Formulation
                  </label>
                  <select
                    value={form.formulation}
                    onChange={(e) => setForm(f => ({ ...f, formulation: e.target.value }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Lotion">Lotion</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Retail MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.unitPrice}
                    onChange={(e) => setForm(f => ({ ...f, unitPrice: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Reorder Minimum
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={form.reorderLevel}
                    onChange={(e) => setForm(f => ({ ...f, reorderLevel: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Initial Intake Batch No
                  </label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    onChange={(e) => setForm(f => ({ ...f, batchNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Batch Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))}
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
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save to Formulary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
