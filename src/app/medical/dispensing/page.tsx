'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList, Search, Clock, CheckCircle2, Sparkles,
  ArrowRight, ShieldAlert, AlertTriangle, ArrowLeft,
  Filter, Check, Eye, User, Calendar, Pill, DollarSign
} from 'lucide-react';
import { usePharmacyStore, useInventoryStore } from '@/store';

export default function MedicalDispensingQueuePage() {
  const { prescriptions } = usePharmacyStore();
  const { inventory } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PHARMACY_PENDING' | 'IN_PROGRESS' | 'DISPENSED'>('ALL');

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(p => {
      const matchSearch = !searchTerm.trim() || [
        p.patientName,
        p.mrdNumber,
        p.caseId,
        ...p.items.map(i => i.drugName)
      ].some(val => val.toLowerCase().includes(searchTerm.trim().toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const pendingCount = prescriptions.filter(p => p.status === 'PHARMACY_PENDING').length;
  const inProgressCount = prescriptions.filter(p => p.status === 'IN_PROGRESS').length;
  const dispensedCount = prescriptions.filter(p => p.status === 'DISPENSED').length;

  return (
    <div className="page-container" style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <Link href="/medical/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Pharmacy Dashboard
          </Link>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
            Dispensing Hub & Prescription Roster
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B' }}>
            Live queue of outpatient prescriptions issued from doctor consultation cabins. Cross-verify allergy warnings, fulfill items, and cashier at Point-of-Sale.
          </p>
        </div>

        {/* Status Metrics Bar */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 16px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>Pending Rx</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#D97706' }}>{pendingCount}</div>
          </div>
          <div style={{ padding: '8px 16px', background: '#EFF6FF', borderRadius: 12, border: '1px solid #BFDBFE', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>In Progress</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#2563EB' }}>{inProgressCount}</div>
          </div>
          <div style={{ padding: '8px 16px', background: '#ECFDF5', borderRadius: 12, border: '1px solid #A7F3D0', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Dispensed</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>{dispensedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: 340 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748B' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, height: 38, fontSize: 13, borderRadius: 10 }}
              placeholder="Filter by patient name, MRD, or Case ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Status Chips */}
          <div style={{ display: 'flex', gap: 6, background: '#F8FAFC', padding: 3, borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className="btn btn-sm"
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '5px 12px',
                background: statusFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'ALL' ? '#0F172A' : '#64748B',
                boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: 'none'
              }}
            >
              All Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter('PHARMACY_PENDING')}
              className="btn btn-sm"
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '5px 12px',
                background: statusFilter === 'PHARMACY_PENDING' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'PHARMACY_PENDING' ? '#D97706' : '#64748B',
                boxShadow: statusFilter === 'PHARMACY_PENDING' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: 'none'
              }}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className="btn btn-sm"
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '5px 12px',
                background: statusFilter === 'IN_PROGRESS' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'IN_PROGRESS' ? '#2563EB' : '#64748B',
                boxShadow: statusFilter === 'IN_PROGRESS' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: 'none'
              }}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('DISPENSED')}
              className="btn btn-sm"
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '5px 12px',
                background: statusFilter === 'DISPENSED' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'DISPENSED' ? '#059669' : '#64748B',
                boxShadow: statusFilter === 'DISPENSED' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: 'none'
              }}
            >
              Dispensed ({dispensedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Active Prescriptions Queue Table */}
      <div className="card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        <div className="table-responsive">
          <table className="table" style={{ margin: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '14px 20px' }}>Patient & Allergies</th>
                <th>Case Number</th>
                <th>Attending Doctor</th>
                <th>Prescription Breakdown</th>
                <th>Stock Readiness</th>
                <th>Queue Status</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Dispensary Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <CheckCircle2 size={36} style={{ margin: '0 auto 10px', color: '#10B981' }} />
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>No Prescriptions in this View</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>All matching prescriptions have been dispensed or no filter matches found.</div>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map(rx => {
                  const hasAllergy = rx.allergies && rx.allergies.length > 0;
                  const isPending = rx.status === 'PHARMACY_PENDING';
                  const isInProg = rx.status === 'IN_PROGRESS';
                  const isDispensed = rx.status === 'DISPENSED';

                  // Check stock readiness for this prescription
                  const hasDepletedItem = rx.items.some(item => {
                    const inv = inventory.find(i => i.id === item.drugId);
                    return inv && inv.stock === 0;
                  });

                  return (
                    <tr key={rx.id} style={{ background: hasAllergy ? 'rgba(239,68,68,0.02)' : undefined }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                            {rx.patientName}
                          </span>
                          {hasAllergy && (
                            <span
                              className="badge badge-danger"
                              style={{ fontSize: 9.5, padding: '2px 6px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                              title={`Patient Allergic to: ${rx.allergies.join(', ')}`}
                            >
                              <ShieldAlert size={10} /> ALLERGY: {rx.allergies[0]}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          {rx.mrdNumber} • {rx.age}Y/{rx.gender} • {rx.mobile}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12, background: '#F1F5F9', padding: '3px 7px', borderRadius: 6, color: '#334155' }}>
                          {rx.caseId}
                        </span>
                        <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 3 }}>
                          {rx.consultationDate}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {rx.doctorName}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Dermatology / OPD
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#334155', maxWidth: 300 }}>
                          {rx.items.map((i, idx) => (
                            <span key={i.id}>
                              {i.drugName} (x{i.prescribedQty})
                              {idx < rx.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                          Est. Total: ₹{rx.billing.totalPayable.toFixed(2)}
                        </div>
                      </td>

                      <td>
                        {hasDepletedItem ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3'
                          }}>
                            <AlertTriangle size={12} /> Substitute Needed
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                          }}>
                            <CheckCircle2 size={12} /> In Stock (FEFO)
                          </span>
                        )}
                      </td>

                      <td>
                        {isPending && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A'
                          }}>
                            <Clock size={12} /> Waiting
                          </span>
                        )}
                        {isInProg && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE'
                          }}>
                            <Sparkles size={12} /> In POS
                          </span>
                        )}
                        {isDispensed && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                          }}>
                            <CheckCircle2 size={12} /> Fulfilled
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <Link
                          href={`/medical/dispensing/${rx.caseId}`}
                          className="btn btn-sm"
                          style={{
                            background: isDispensed ? '#F1F5F9' : '#059669',
                            color: isDispensed ? '#334155' : '#FFFFFF',
                            fontWeight: 800, fontSize: 12, padding: '7px 16px',
                            borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                            boxShadow: isDispensed ? 'none' : '0 2px 8px rgba(5,150,105,0.25)'
                          }}
                        >
                          <Pill size={13} />
                          <span>{isDispensed ? 'View Receipt' : 'Dispense POS'}</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
