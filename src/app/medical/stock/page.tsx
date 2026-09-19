'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Search, Filter, AlertTriangle, CheckCircle2,
  Clock, ShieldAlert, ArrowDownRight, ArrowUpRight, RotateCcw,
  Layers, ChevronRight, X, Calendar, DollarSign, Truck, Building2,
  FileText, History, Info, RefreshCw
} from 'lucide-react';
import { usePharmacyStore, useInventoryStore, useUIStore } from '@/store';

export default function MedicalStockPage() {
  const { batches, movements, addStock, addNewDrugMaster, disposeBatch } = usePharmacyStore();
  const { inventory } = useInventoryStore();
  const { addNotification } = useUIStore();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormulation, setSelectedFormulation] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedDrugId, setSelectedDrugId] = useState<string>(inventory[0]?.id || 'd-1');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');

  // Modals state
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [isNewDrugOpen, setIsNewDrugOpen] = useState(false);

  // Receive Stock Form state
  const [receiveForm, setReceiveForm] = useState({
    drugId: inventory[0]?.id || '',
    batchNumber: '',
    expiryDate: '',
    quantity: 50,
    unitCost: 10,
    supplier: 'Sun Pharma Distributors'
  });

  // New Drug Form state
  const [newDrugForm, setNewDrugForm] = useState({
    name: '',
    genericName: '',
    formulation: 'Tablet',
    unitPrice: 15,
    reorderLevel: 20,
    initialStock: 0,
    batchNumber: '',
    expiryDate: '',
    supplier: 'Direct Pharma Supply'
  });

  // Metrics
  const totalFormularyItems = inventory.length;
  const totalUnitsInStock = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = inventory.filter(i => i.stock > 0 && i.stock <= i.reorderLevel).length;
  const outOfStockCount = inventory.filter(i => i.stock === 0).length;
  const quarantinedCount = batches.filter(b => b.isQuarantined).length;

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFormulation = selectedFormulation === 'ALL' || item.formulation.toLowerCase() === selectedFormulation.toLowerCase();
      
      let matchesStatus = true;
      if (stockStatusFilter === 'IN_STOCK') matchesStatus = item.stock > item.reorderLevel;
      else if (stockStatusFilter === 'LOW_STOCK') matchesStatus = item.stock > 0 && item.stock <= item.reorderLevel;
      else if (stockStatusFilter === 'OUT_OF_STOCK') matchesStatus = item.stock === 0;

      return matchesSearch && matchesFormulation && matchesStatus;
    });
  }, [inventory, searchTerm, selectedFormulation, stockStatusFilter]);

  // Selected Drug and its batches
  const selectedDrug = inventory.find(i => i.id === selectedDrugId) || inventory[0];
  const drugBatches = useMemo(() => {
    if (!selectedDrug) return [];
    return batches
      .filter(b => b.drugId === selectedDrug.id)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [batches, selectedDrug]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    if (movementFilter === 'ALL') return movements;
    return movements.filter(m => m.movementType === movementFilter);
  }, [movements, movementFilter]);

  // Handle Receive Stock Submission
  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.drugId || !receiveForm.batchNumber || !receiveForm.expiryDate || receiveForm.quantity <= 0) {
      addNotification({ type: 'danger', message: 'Please complete all receiving goods fields.' });
      return;
    }

    const drug = inventory.find(i => i.id === receiveForm.drugId);
    if (!drug) return;

    addStock(
      drug.id,
      drug.name,
      receiveForm.batchNumber.toUpperCase().trim(),
      receiveForm.expiryDate,
      Number(receiveForm.quantity),
      receiveForm.supplier
    );

    addNotification({
      type: 'success',
      message: `Received ${receiveForm.quantity} units of ${drug.name} (Batch: ${receiveForm.batchNumber.toUpperCase()})`
    });

    setIsReceiveStockOpen(false);
    setReceiveForm({
      drugId: inventory[0]?.id || '',
      batchNumber: '',
      expiryDate: '',
      quantity: 50,
      unitCost: 10,
      supplier: 'Sun Pharma Distributors'
    });
  };

  // Handle Create New Drug Submission
  const handleNewDrugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugForm.name || !newDrugForm.genericName) {
      addNotification({ type: 'danger', message: 'Medicine name and generic formula are required.' });
      return;
    }

    addNewDrugMaster({
      name: newDrugForm.name,
      genericName: newDrugForm.genericName,
      formulation: newDrugForm.formulation,
      unitPrice: Number(newDrugForm.unitPrice),
      reorderLevel: Number(newDrugForm.reorderLevel),
      initialStock: Number(newDrugForm.initialStock),
      batchNumber: newDrugForm.batchNumber ? newDrugForm.batchNumber.toUpperCase().trim() : undefined,
      expiryDate: newDrugForm.expiryDate || undefined,
      supplier: newDrugForm.supplier
    });

    addNotification({
      type: 'success',
      message: `Formulary drug "${newDrugForm.name}" registered successfully.`
    });

    setIsNewDrugOpen(false);
    setNewDrugForm({
      name: '',
      genericName: '',
      formulation: 'Tablet',
      unitPrice: 15,
      reorderLevel: 20,
      initialStock: 0,
      batchNumber: '',
      expiryDate: '',
      supplier: 'Direct Pharma Supply'
    });
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
              Main Dispensary & Store
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Formulary Catalog & FEFO Warehouse</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={26} color="#059669" /> Central Stock & Batch Inventory
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Real-time physical stock tracking, First-Expired-First-Out (FEFO) allocations, receiving goods intake, and ledger audits.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setIsReceiveStockOpen(true)}
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
            <Truck size={17} /> Receive Stock (Delivery)
          </button>
          <button
            onClick={() => setIsNewDrugOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={17} color="#059669" /> Register New Drug
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Formulary Drugs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{totalFormularyItems}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Physical Units In Stock</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{totalUnitsInStock}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock Alert</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{lowStockCount}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Quarantined / Out of Stock</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{outOfStockCount + quarantinedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Catalog on Left (60%), Selected Drug Batches & Movement Log on Right (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, marginBottom: 28 }}>
        
        {/* Left: Formulary Inventory Catalog */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header & Filter Controls */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#059669" /> Formulary Medicines ({filteredInventory.length})
              </div>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Click any drug to inspect physical batches</span>
            </div>

            {/* Search & Status Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search drug name or generic formula..."
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

              {/* Formulation Filter */}
              <select
                value={selectedFormulation}
                onChange={(e) => setSelectedFormulation(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  background: '#ffffff',
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer'
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

              {/* Status Chips */}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStockStatusFilter(status)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: stockStatusFilter === status ? '#059669' : '#e2e8f0',
                      background: stockStatusFilter === status ? '#ecfdf5' : '#ffffff',
                      color: stockStatusFilter === status ? '#059669' : '#64748b',
                    }}
                  >
                    {status === 'ALL' && 'All'}
                    {status === 'IN_STOCK' && 'In Stock'}
                    {status === 'LOW_STOCK' && 'Low Stock'}
                    {status === 'OUT_OF_STOCK' && 'Depleted'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table of Drugs */}
          <div style={{ overflowX: 'auto', maxHeight: 580 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Medication & Generic</th>
                  <th style={{ padding: '12px 16px' }}>Form</th>
                  <th style={{ padding: '12px 16px' }}>Stock Level</th>
                  <th style={{ padding: '12px 16px' }}>Reorder</th>
                  <th style={{ padding: '12px 16px' }}>MRP</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const isSelected = selectedDrug?.id === item.id;
                  const isLow = item.stock > 0 && item.stock <= item.reorderLevel;
                  const isOut = item.stock === 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDrugId(item.id)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: isSelected ? '#f0fdf4' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: isSelected ? '#059669' : '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.genericName}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          {item.formulation}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a'
                          }}>
                            {item.stock} units
                          </span>
                          {isOut && <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>DEPLETED</span>}
                          {isLow && <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>LOW</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>
                        {item.reorderLevel}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                        ₹{item.unitPrice}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrugId(item.id);
                          }}
                          style={{
                            background: isSelected ? '#059669' : '#f8fafc',
                            color: isSelected ? '#ffffff' : '#059669',
                            border: `1px solid ${isSelected ? '#059669' : '#cbd5e1'}`,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? 'Selected' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <div>No medicines matching the current search criteria.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right: Selected Drug Batch Breakdown & FEFO Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {selectedDrug ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active FEFO Allocation
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedDrug.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{selectedDrug.genericName} • {selectedDrug.formulation}</div>
                </div>

                <button
                  onClick={() => {
                    setReceiveForm(f => ({ ...f, drugId: selectedDrug.id }));
                    setIsReceiveStockOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Batch
                </button>
              </div>

              {/* Physical Batches Table */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Physical Batches ({drugBatches.length})</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Sorted by FEFO (Earliest Expiry First)</span>
                </div>

                {drugBatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {drugBatches.map((batch, idx) => {
                      const expDate = new Date(batch.expiryDate);
                      const now = new Date();
                      const daysToExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysToExpiry <= 0;
                      const isNearExpiry = daysToExpiry > 0 && daysToExpiry <= 180;

                      return (
                        <div
                          key={batch.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor: batch.isQuarantined || isExpired ? '#fecaca' : isNearExpiry ? '#fed7aa' : '#e2e8f0',
                            background: batch.isQuarantined || isExpired ? '#fff1f2' : isNearExpiry ? '#fffaf5' : '#f8fafc',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                                {batch.batchNumber}
                              </span>
                              {idx === 0 && !batch.isQuarantined && batch.stockQuantity > 0 && (
                                <span style={{ fontSize: '0.7rem', background: '#059669', color: '#ffffff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  PRIORITY (FEFO)
                                </span>
                              )}
                              {batch.isQuarantined && (
                                <span style={{ fontSize: '0.7rem', background: '#dc2626', color: '#ffffff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  QUARANTINED
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
                              Supplier: {batch.supplier} • Cost: ₹{batch.unitCost}
                            </div>
                            <div style={{ fontSize: '0.78rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Calendar size={13} color={isExpired ? '#dc2626' : isNearExpiry ? '#d97706' : '#64748b'} />
                              <span style={{ fontWeight: 600, color: isExpired ? '#dc2626' : isNearExpiry ? '#d97706' : '#334155' }}>
                                Exp: {batch.expiryDate} ({isExpired ? 'Expired' : `${daysToExpiry} days left`})
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: batch.stockQuantity === 0 ? '#94a3b8' : '#0f172a' }}>
                              {batch.stockQuantity} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>units</span>
                            </div>
                            {batch.stockQuantity > 0 && !batch.isQuarantined && (
                              <button
                                onClick={() => {
                                  if (confirm(`Quarantine batch ${batch.batchNumber} for safety inspection or damage?`)) {
                                    disposeBatch(batch.id, 'Manual Quarantine for inspection');
                                    addNotification({ type: 'info', message: `Batch ${batch.batchNumber} placed in quarantine write-off.` });
                                  }
                                }}
                                style={{
                                  marginTop: 4,
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Quarantine
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 8 }}>
                    No physical batches on record for this drug. Click &quot;Add Batch&quot; to intake units.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 30, textAlign: 'center', color: '#94a3b8' }}>
              Select a medicine from the left list to view batch allocations.
            </div>
          )}

          {/* Quick Dispensing Link Banner */}
          <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: 10, padding: 18, color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>Need to Dispense Medication?</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>Check pending patient prescriptions in the dispensary queue.</div>
            </div>
            <Link
              href="/medical/dispensing"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                background: '#ffffff',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.82rem',
                textDecoration: 'none'
              }}
            >
              Open Queue <ChevronRight size={15} />
            </Link>
          </div>

        </div>

      </div>

      {/* Stock Movement Audit Log */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={20} color="#059669" /> Stock Movement Audit Trail
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Every physical deduction, intake, adverse return, and quarantine disposal is tamper-evident.</div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'DISPENSE', 'RECEIVE', 'RETURN', 'DISPOSAL'].map(type => (
              <button
                key={type}
                onClick={() => setMovementFilter(type)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: movementFilter === type ? '#059669' : '#e2e8f0',
                  background: movementFilter === type ? '#ecfdf5' : '#ffffff',
                  color: movementFilter === type ? '#059669' : '#64748b',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Date & Time</th>
                <th style={{ padding: '10px 14px' }}>Type</th>
                <th style={{ padding: '10px 14px' }}>Medication</th>
                <th style={{ padding: '10px 14px' }}>Batch</th>
                <th style={{ padding: '10px 14px' }}>Qty</th>
                <th style={{ padding: '10px 14px' }}>Reference / Case</th>
                <th style={{ padding: '10px 14px' }}>Officer</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{m.date}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background:
                        m.movementType === 'RECEIVE' ? '#dcfce7' :
                        m.movementType === 'DISPENSE' ? '#e0f2fe' :
                        m.movementType === 'RETURN' ? '#fef3c7' : '#fee2e2',
                      color:
                        m.movementType === 'RECEIVE' ? '#15803d' :
                        m.movementType === 'DISPENSE' ? '#0369a1' :
                        m.movementType === 'RETURN' ? '#b45309' : '#b91c1c'
                    }}>
                      {m.movementType}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{m.drugName}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{m.batchNumber}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: m.quantity > 0 ? '#16a34a' : '#dc2626' }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.8rem' }}>{m.reference}</td>
                  <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.8rem' }}>{m.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Receive Stock (Delivery Intake) */}
      {isReceiveStockOpen && (
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
                <Truck size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Receive Stock (Supplier Intake)
                </h3>
              </div>
              <button onClick={() => setIsReceiveStockOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Select Medicine *
                </label>
                <select
                  value={receiveForm.drugId}
                  onChange={(e) => setReceiveForm(f => ({ ...f, drugId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.formulation}) — Current Stock: {item.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAT-2615"
                    value={receiveForm.batchNumber}
                    onChange={(e) => setReceiveForm(f => ({ ...f, batchNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={receiveForm.expiryDate}
                    onChange={(e) => setReceiveForm(f => ({ ...f, expiryDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Quantity Received (Units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiveForm.quantity}
                    onChange={(e) => setReceiveForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={receiveForm.unitCost}
                    onChange={(e) => setReceiveForm(f => ({ ...f, unitCost: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Supplier / Distributor Name
                </label>
                <input
                  type="text"
                  value={receiveForm.supplier}
                  onChange={(e) => setReceiveForm(f => ({ ...f, supplier: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsReceiveStockOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Formulary Drug */}
      {isNewDrugOpen && (
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
                <Plus size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Register New Formulary Medicine
                </h3>
              </div>
              <button onClick={() => setIsNewDrugOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleNewDrugSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Brand / Trade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin 625 Duo"
                  value={newDrugForm.name}
                  onChange={(e) => setNewDrugForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Generic Chemical Formula *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin 500mg + Potassium Clavulanate 125mg"
                  value={newDrugForm.genericName}
                  onChange={(e) => setNewDrugForm(f => ({ ...f, genericName: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Formulation
                  </label>
                  <select
                    value={newDrugForm.formulation}
                    onChange={(e) => setNewDrugForm(f => ({ ...f, formulation: e.target.value }))}
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
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Retail MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDrugForm.unitPrice}
                    onChange={(e) => setNewDrugForm(f => ({ ...f, unitPrice: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={newDrugForm.reorderLevel}
                    onChange={(e) => setNewDrugForm(f => ({ ...f, reorderLevel: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Optional Initial Batch */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginTop: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Optional: Initial Stock Batch Intake
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <input
                    type="number"
                    placeholder="Initial Qty"
                    value={newDrugForm.initialStock || ''}
                    onChange={(e) => setNewDrugForm(f => ({ ...f, initialStock: Number(e.target.value) }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Batch No (e.g. BAT-2620)"
                    value={newDrugForm.batchNumber}
                    onChange={(e) => setNewDrugForm(f => ({ ...f, batchNumber: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  <input
                    type="date"
                    value={newDrugForm.expiryDate}
                    onChange={(e) => setNewDrugForm(f => ({ ...f, expiryDate: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsNewDrugOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Register Drug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
