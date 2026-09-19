'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pill, ClipboardList, Package, RotateCcw, AlertTriangle,
  Clock, CheckCircle2, XCircle, Search, ArrowRight,
  TrendingUp, ShieldAlert, Sparkles, RefreshCw, Layers,
  ChevronRight, Calendar, User, DollarSign, Wallet
} from 'lucide-react';
import { usePharmacyStore, useInventoryStore, useUIStore } from '@/store';

export default function MedicalDashboardPage() {
  const router = useRouter();
  const { prescriptions, batches } = usePharmacyStore();
  const { inventory } = useInventoryStore();
  const { addNotification } = useUIStore();

  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    return prescriptions.filter(p =>
      p.patientName.toLowerCase().includes(debouncedSearch) ||
      p.mrdNumber.toLowerCase().includes(debouncedSearch) ||
      p.caseId.toLowerCase().includes(debouncedSearch) ||
      p.items.some(i => i.drugName.toLowerCase().includes(debouncedSearch))
    ).slice(0, 5);
  }, [prescriptions, debouncedSearch]);

  // KPI Calculations
  const pendingDispensingCount = prescriptions.filter(p => p.status === 'PHARMACY_PENDING' || p.status === 'IN_PROGRESS').length;
  const dispensedTodayCount = prescriptions
    .filter(p => p.status === 'DISPENSED')
    .reduce((sum, p) => sum + p.items.filter(i => i.isDispensed).reduce((s, i) => s + i.dispensedQty, 0), 0);
  const notTakenCount = prescriptions.filter(p => p.status === 'CANCELLED').length;
  const outOfStockCount = inventory.filter(i => i.stock === 0).length;

  // Critical Stock Alerts
  const stockAlerts = useMemo(() => {
    const now = Date.now();
    const alerts: Array<{
      id: string;
      drugName: string;
      stock: number;
      minAlert: number;
      status: 'OUT OF STOCK' | 'LOW STOCK' | 'NEAR EXPIRY' | 'EXPIRED';
      expiry?: string;
      batch?: string;
      actionType: 'restock' | 'prioritize' | 'dispose';
    }> = [];

    // Expired or near expiry batches
    batches.forEach(b => {
      const exp = new Date(b.expiryDate).getTime();
      const daysLeft = Math.round((exp - now) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0 || b.isQuarantined) {
        alerts.push({
          id: b.id,
          drugName: b.drugName,
          stock: b.stockQuantity,
          minAlert: 15,
          status: 'EXPIRED',
          expiry: b.expiryDate,
          batch: b.batchNumber,
          actionType: 'dispose'
        });
      } else if (daysLeft <= 180 && b.stockQuantity > 0) {
        alerts.push({
          id: b.id,
          drugName: b.drugName,
          stock: b.stockQuantity,
          minAlert: 20,
          status: 'NEAR EXPIRY',
          expiry: b.expiryDate,
          batch: b.batchNumber,
          actionType: 'prioritize'
        });
      }
    });

    // Zero / Low stock from inventory
    inventory.forEach(i => {
      if (i.stock === 0) {
        if (!alerts.some(a => a.drugName === i.name && a.status === 'OUT OF STOCK')) {
          alerts.push({
            id: i.id,
            drugName: i.name,
            stock: 0,
            minAlert: i.reorderLevel,
            status: 'OUT OF STOCK',
            actionType: 'restock'
          });
        }
      } else if (i.stock <= i.reorderLevel) {
        if (!alerts.some(a => a.drugName === i.name)) {
          alerts.push({
            id: i.id,
            drugName: i.name,
            stock: i.stock,
            minAlert: i.reorderLevel,
            status: 'LOW STOCK',
            actionType: 'restock'
          });
        }
      }
    });

    return alerts.slice(0, 6);
  }, [batches, inventory]);

  return (
    <div className="page-container" style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Welcome & Subtitle Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ECFDF5', color: '#059669', padding: '4px 10px',
              borderRadius: 999, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              <Pill size={14} /> Outpatient Pharmacy & Dispensary • Counter #1
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>Surat Central Main • Live Shift: 08:00 – 16:00</span>
          </div>
          <h1 className="page-title" style={{ marginTop: 6, fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
            Medical & Pharmacy Command Dashboard
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B', maxWidth: 740 }}>
            Real-time outpatient prescription fulfillment, First Expired First Out (FEFO) batch deduction, stock auditing, and Point-of-Sale (POS) cashiering.
          </p>
        </div>

        {/* Live Search & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Search */}
          <div ref={searchContainerRef} style={{ position: 'relative', width: 280 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#64748B' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 34, height: 38, fontSize: 12.5, borderRadius: 10 }}
                placeholder="Search patient, MRD, or drug..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
            </div>

            {/* Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                boxShadow: '0 12px 30px rgba(15,23,42,0.12)', zIndex: 120, overflow: 'hidden'
              }}>
                <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  MATCHING PRESCRIPTIONS ({searchResults.length})
                </div>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchTerm('');
                      router.push(`/medical/dispensing/${p.caseId}`);
                    }}
                    style={{
                      padding: '10px 12px', borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.15s'
                    }}
                    className="hover:bg-emerald-50"
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0F172A' }}>
                        {p.patientName} ({p.caseId})
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {p.mrdNumber} • {p.items.map(i => i.drugName).join(', ')}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Dispense <ArrowRight size={12} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Dispense Button */}
          <Link
            href="/medical/dispensing"
            className="btn btn-primary"
            style={{ height: 38, padding: '0 16px', fontSize: 12.5, background: '#059669', borderColor: '#059669', fontWeight: 800 }}
          >
            <ClipboardList size={15} />
            <span>Dispensing Queue</span>
          </Link>
        </div>
      </div>

      {/* 3.1 Real-Time KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Pending Dispensing */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1.5px solid #FDE68A', background: '#FFFBEB', boxShadow: '0 2px 8px rgba(245,158,11,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pending Dispensing
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#B45309', marginTop: 4 }}>
                {pendingDispensingCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#D97706', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} /> Awaiting Fulfillment & POS
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Drugs Taken Today */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Drugs Dispensed Today
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                {dispensedTodayCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Units fulfilled & checked out
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Not Taken / Cancelled */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Refused / Not Taken
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
                {notTakenCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <XCircle size={13} /> Patient declined / home supply
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="card" style={{ padding: 20, borderRadius: 18, border: '1.5px solid #FDA4AF', background: '#FFF1F2', boxShadow: '0 4px 12px rgba(244,63,94,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Out of Stock (Zero Units)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#BE123C', marginTop: 4 }}>
                {outOfStockCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#E11D48', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} /> Formulary items depleted
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Prescription Queue (1.6fr) + Right Stock Alerts Widget (1.4fr) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 24, alignItems: 'start' }}>
        {/* 3.3 Today's Prescription Queue Widget */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                Today's Prescription Queue
              </span>
              <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
                {prescriptions.length} Active Prescriptions
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#059669' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Live SSE Sync
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table" style={{ margin: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px' }}>Patient / Case</th>
                  <th>Prescribed Drugs</th>
                  <th>Consulting Doctor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.slice(0, 5).map(rx => {
                  const isPending = rx.status === 'PHARMACY_PENDING';
                  const isInProg = rx.status === 'IN_PROGRESS';
                  const isDispensed = rx.status === 'DISPENSED';
                  const hasAllergy = rx.allergies.length > 0;

                  return (
                    <tr key={rx.id}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                            {rx.patientName}
                          </span>
                          {hasAllergy && (
                            <span className="badge badge-danger" style={{ fontSize: 9.5, padding: '1px 5px', fontWeight: 900 }}>
                              ALLERGIES
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                          {rx.mrdNumber} • <span style={{ fontFamily: 'monospace' }}>{rx.caseId}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                          {rx.items.slice(0, 2).map(i => i.drugName).join(', ')}
                          {rx.items.length > 2 ? ` +${rx.items.length - 2} more` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#059669' }}>
                          {rx.items.length} items prescribed
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                          {rx.doctorName}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                          {rx.consultationDate}
                        </div>
                      </td>

                      <td>
                        {isPending && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A'
                          }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {isInProg && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE'
                          }}>
                            <Sparkles size={12} /> In Progress
                          </span>
                        )}
                        {isDispensed && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                          }}>
                            <CheckCircle2 size={12} /> Dispensed
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <Link
                          href={`/medical/dispensing/${rx.caseId}`}
                          className="btn btn-sm"
                          style={{
                            background: isDispensed ? '#F1F5F9' : '#059669',
                            color: isDispensed ? '#475569' : '#FFFFFF',
                            fontWeight: 800, fontSize: 12, padding: '5px 12px',
                            borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5
                          }}
                        >
                          {isDispensed ? 'View Receipt' : 'Dispense POS'} <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Footer Button */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', textAlign: 'center' }}>
            <Link
              href="/medical/dispensing"
              style={{ fontSize: 12.5, fontWeight: 800, color: '#059669', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>VIEW FULL DISPENSING ROSTER ➔</span>
            </Link>
          </div>
        </div>

        {/* 3.2 Critical Drug Stock Alerts Widget */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={17} color="#D97706" />
              <span style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                Critical Drug Stock Alerts
              </span>
              <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
                {stockAlerts.length} Warnings
              </span>
            </div>

            <Link
              href="/medical/alerts"
              style={{ fontSize: 12, fontWeight: 700, color: '#059669', textDecoration: 'none' }}
            >
              All Alerts ➔
            </Link>
          </div>

          {/* Alert Table */}
          <div className="table-responsive">
            <table className="table" style={{ margin: 0, fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '10px 16px' }}>Drug Name</th>
                  <th>Stock / Min</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 16 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stockAlerts.map((alert, idx) => (
                  <tr key={`${alert.id}-${idx}`}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>
                        {alert.drugName}
                      </div>
                      {alert.batch && (
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                          Batch: {alert.batch} • Exp: {alert.expiry}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontWeight: 800, color: alert.stock === 0 ? '#DC2626' : '#D97706' }}>
                        {alert.stock}
                      </span>
                      <span style={{ color: '#94A3B8' }}> / {alert.minAlert}</span>
                    </td>

                    <td>
                      {alert.status === 'OUT OF STOCK' && (
                        <span className="badge badge-danger" style={{ fontSize: 9.5, padding: '2px 6px', fontWeight: 900 }}>
                          OUT OF STOCK
                        </span>
                      )}
                      {alert.status === 'LOW STOCK' && (
                        <span className="badge badge-warning" style={{ fontSize: 9.5, padding: '2px 6px', fontWeight: 900 }}>
                          LOW STOCK
                        </span>
                      )}
                      {alert.status === 'NEAR EXPIRY' && (
                        <span style={{ fontSize: 9.5, padding: '2px 6px', fontWeight: 900, borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                          NEAR EXPIRY
                        </span>
                      )}
                      {alert.status === 'EXPIRED' && (
                        <span className="badge badge-danger" style={{ fontSize: 9.5, padding: '2px 6px', fontWeight: 900 }}>
                          EXPIRED
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      {alert.actionType === 'restock' && (
                        <Link
                          href="/medical/stock?action=receive"
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: '#CBD5E1', color: '#059669', fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
                        >
                          Restock ➔
                        </Link>
                      )}
                      {alert.actionType === 'prioritize' && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                          Prioritize FEFO
                        </span>
                      )}
                      {alert.actionType === 'dispose' && (
                        <Link
                          href="/medical/alerts"
                          className="btn btn-sm btn-danger"
                          style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 6 }}
                        >
                          Dispose
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Info Callout */}
          <div style={{ padding: '12px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11.5, color: '#64748B' }}>
              FEFO rules active: Earliest expiry batches automatically prioritized in POS cart.
            </span>
            <Link href="/medical/stock" style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', textDecoration: 'none' }}>
              Open Inventory Catalog →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
