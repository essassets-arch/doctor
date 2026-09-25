'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Clock, ShieldAlert, Package, CheckCircle2,
  Calendar, Trash2, ShoppingCart, ArrowRight, ExternalLink,
  Layers, AlertCircle, RefreshCw, XCircle
} from 'lucide-react';
import { usePharmacyStore, useInventoryStore, useUIStore } from '@/store';

export default function MedicalAlertsPage() {
  const { batches, disposeBatch, addStock } = usePharmacyStore();
  const { inventory } = useInventoryStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'NEAR_EXPIRY' | 'QUARANTINE'>('ALL');
  const [poModalItem, setPoModalItem] = useState<{ drugName: string; reorderQty: number } | null>(null);

  // Now timestamp
  const now = new Date();

  // 1. Low Stock Items (stock <= reorderLevel)
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.stock <= item.reorderLevel);
  }, [inventory]);

  // 2. Near Expiry Batches (within 180 days and not expired and not quarantined)
  const nearExpiryBatches = useMemo(() => {
    return batches.filter(b => {
      if (b.isQuarantined || b.stockQuantity <= 0) return false;
      const exp = new Date(b.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 180;
    }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [batches, now]);

  // 3. Expired or Quarantined Batches
  const expiredOrQuarantinedBatches = useMemo(() => {
    return batches.filter(b => {
      if (b.isQuarantined) return true;
      const exp = new Date(b.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 0;
    });
  }, [batches, now]);

  // Metrics
  const totalAlertsCount = lowStockItems.length + nearExpiryBatches.length + expiredOrQuarantinedBatches.length;

  // Handle Disposal
  const handleDispose = (batchId: string, batchNumber: string) => {
    if (confirm(`Confirm safe quarantine write-off and biomedical disposal for batch ${batchNumber}?`)) {
      disposeBatch(batchId, 'Expired batch biomedical disposal protocol');
      addNotification({
        type: 'success',
        message: `Batch ${batchNumber} written off and removed from active dispensary circulation.`
      });
    }
  };

  // Handle PO Creation
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poModalItem) return;
    addNotification({
      type: 'success',
      message: `Purchase Order for ${poModalItem.reorderQty} units of ${poModalItem.drugName} transmitted to supplier.`
    });
    setPoModalItem(null);
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 4, border: '1px solid #fecaca' }}>
            Formulary Vigilance
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Early Warning System & Quarantine Write-Off</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={26} color="#dc2626" /> Inventory Alerts & Expiration Early Warning
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Real-time stock threshold warnings, 180-day near-expiry countdowns, and biomedical quarantine protocols.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Alerts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{totalAlertsCount}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock Deficits</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{lowStockItems.length}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Near-Expiry (≤180 Days)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{nearExpiryBatches.length}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Quarantined / Expired</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#db2777' }}>{expiredOrQuarantinedBatches.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'ALL' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'ALL' ? '#ffffff' : '#64748b'
          }}
        >
          All Warnings ({totalAlertsCount})
        </button>

        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'LOW_STOCK' ? '#d97706' : '#f1f5f9',
            color: activeTab === 'LOW_STOCK' ? '#ffffff' : '#64748b'
          }}
        >
          Low Stock Deficit ({lowStockItems.length})
        </button>

        <button
          onClick={() => setActiveTab('NEAR_EXPIRY')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'NEAR_EXPIRY' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'NEAR_EXPIRY' ? '#ffffff' : '#64748b'
          }}
        >
          Near Expiry (≤180 Days) ({nearExpiryBatches.length})
        </button>

        <button
          onClick={() => setActiveTab('QUARANTINE')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'QUARANTINE' ? '#dc2626' : '#f1f5f9',
            color: activeTab === 'QUARANTINE' ? '#ffffff' : '#64748b'
          }}
        >
          Quarantine & Expired ({expiredOrQuarantinedBatches.length})
        </button>
      </div>

      {/* Tab 1: Low Stock Roster */}
      {(activeTab === 'ALL' || activeTab === 'LOW_STOCK') && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} color="#d97706" /> Low Stock Medicines Requiring Procurement ({lowStockItems.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Current physical balance below emergency reorder minimums</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Medication & Formula</th>
                  <th style={{ padding: '10px 14px' }}>Form</th>
                  <th style={{ padding: '10px 14px' }}>Current Stock</th>
                  <th style={{ padding: '10px 14px' }}>Reorder Level</th>
                  <th style={{ padding: '10px 14px' }}>Deficit Units</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Procurement Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => {
                  const deficit = Math.max(0, item.reorderLevel * 2 - item.stock);
                  const isOut = item.stock === 0;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.genericName}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4 }}>
                          {item.formulation}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: isOut ? '#dc2626' : '#d97706'
                        }}>
                          {item.stock} units
                        </span>
                        {isOut && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>DEPLETED</span>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.reorderLevel} units</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#d97706' }}>
                        Need +{deficit} units
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setPoModalItem({ drugName: item.name, reorderQty: deficit })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: '#fffbeb',
                            color: '#d97706',
                            border: '1px solid #fcd34d',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          <ShoppingCart size={14} /> Create P.O.
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

      {/* Tab 2: Near Expiry Batches */}
      {(activeTab === 'ALL' || activeTab === 'NEAR_EXPIRY') && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#2563eb" /> Near-Expiry Drug Batches (≤ 180 Days) ({nearExpiryBatches.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>FEFO Priority: Dispense ahead of fresher inventory</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Medication</th>
                  <th style={{ padding: '10px 14px' }}>Batch Number</th>
                  <th style={{ padding: '10px 14px' }}>Expiry Date</th>
                  <th style={{ padding: '10px 14px' }}>Days Remaining</th>
                  <th style={{ padding: '10px 14px' }}>Remaining Stock</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>FEFO Status</th>
                </tr>
              </thead>
              <tbody>
                {nearExpiryBatches.map(b => {
                  const exp = new Date(b.expiryDate);
                  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{b.drugName}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#334155' }}>{b.batchNumber}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{b.expiryDate}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: diffDays <= 60 ? '#fef2f2' : '#fffbeb',
                          color: diffDays <= 60 ? '#dc2626' : '#d97706'
                        }}>
                          {diffDays} days left
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{b.stockQuantity} units</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontWeight: 700,
                          background: '#059669',
                          color: '#ffffff'
                        }}>
                          DISPENSE FIRST (FEFO)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Expired & Quarantined Batches */}
      {(activeTab === 'ALL' || activeTab === 'QUARANTINE') && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="#dc2626" /> Expired Drug Quarantine & Write-Off ({expiredOrQuarantinedBatches.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Strictly isolated from patient dispensing channels</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Medication</th>
                  <th style={{ padding: '10px 14px' }}>Batch No</th>
                  <th style={{ padding: '10px 14px' }}>Expiry Date</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Isolated Qty</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Disposal Action</th>
                </tr>
              </thead>
              <tbody>
                {expiredOrQuarantinedBatches.map(b => {
                  const exp = new Date(b.expiryDate);
                  const isExpired = exp.getTime() < now.getTime();

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff1f2' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#991b1b' }}>{b.drugName}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#991b1b' }}>{b.batchNumber}</td>
                      <td style={{ padding: '12px 14px', color: '#991b1b' }}>{b.expiryDate}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#dc2626',
                          color: '#ffffff'
                        }}>
                          {b.isQuarantined ? 'QUARANTINED' : isExpired ? 'EXPIRED' : 'FLAGGED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#991b1b' }}>
                        {b.stockQuantity} units
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {b.stockQuantity > 0 ? (
                          <button
                            onClick={() => handleDispose(b.id, b.batchNumber)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 6,
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} /> Write-off & Dispose
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Written Off (Zero Stock)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Creation Modal */}
      {poModalItem && (
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
            maxWidth: 460,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={20} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>
                  Procurement Purchase Order
                </h3>
              </div>
            </div>

            <form onSubmit={handleCreatePO} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Medication Name:
                </label>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{poModalItem.drugName}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Reorder Quantity (Units):
                </label>
                <input
                  type="number"
                  min="10"
                  value={poModalItem.reorderQty}
                  onChange={(e) => setPoModalItem(p => p ? { ...p, reorderQty: Number(e.target.value) } : null)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Preferred Supplier:
                </label>
                <input
                  type="text"
                  defaultValue="Sun Pharma Authorized Distributor"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setPoModalItem(null)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#d97706', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
