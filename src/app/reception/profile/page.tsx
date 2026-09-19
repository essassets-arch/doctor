'use client';
import { useState } from 'react';
import {
  UserCircle, Clock, ShieldCheck, Banknote, CheckCircle2,
  AlertCircle, Printer, Volume2, Building, ArrowRight,
  LogOut, Settings, Save, Sparkles, RefreshCw
} from 'lucide-react';
import {
  useUIStore, useBillingStore, useQueueStore, usePatientStore
} from '@/store';

export default function ReceptionistProfilePage() {
  const { currentUser, addNotification } = useUIStore();
  const { bills } = useBillingStore();
  const { queue } = useQueueStore();
  const { patients } = usePatientStore();

  // Shift metrics
  const cashCollected = bills.filter(b => b.paymentMode === 'CASH').reduce((s, b) => s + b.collectedAmount, 0);
  const digitalCollected = bills.filter(b => b.paymentMode !== 'CASH').reduce((s, b) => s + b.collectedAmount, 0);
  const totalCheckIns = queue.length;
  const newPatientsRegistered = patients.filter(p => p.isNew).length;

  // Handover Cash Denomination Calculator
  const [d500, setD500] = useState<number>(Math.floor(cashCollected / 500));
  const [d200, setD200] = useState<number>(0);
  const [d100, setD100] = useState<number>(0);
  const [d50, setD50] = useState<number>(0);

  const countedCash = (d500 * 500) + (d200 * 200) + (d100 * 100) + (d50 * 50);
  const discrepancy = countedCash - cashCollected;

  // Handover notes
  const [incomingOfficer, setIncomingOfficer] = useState('Pooja Mehta');
  const [handoverNotes, setHandoverNotes] = useState('All active morning tokens cleared. Dr. Raj Valaki has 2 pending procedures scheduled at 02:00 PM.');
  const [handoverDone, setHandoverDone] = useState(false);

  // Hardware preferences
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [thermalMode, setThermalMode] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('Surat Central Main Branch');

  const handleSubmitHandover = () => {
    setHandoverDone(true);
    addNotification({
      type: 'success',
      message: `Shift handover submitted to ${incomingOfficer}. Cash reconciled: ₹${countedCash}`
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Front Desk Officer Profile & Shift Handover</h1>
          <p className="page-subtitle">Reconcile counter cash drawer, document shift transfer notes, and manage front-desk hardware peripherals.</p>
        </div>
      </div>

      {handoverDone && (
        <div className="alert-banner success" style={{ marginBottom: 20 }}>
          <CheckCircle2 size={18} />
          <span>Shift Handover Report successfully locked and archived for counter audit!</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Staff Identity & Today's Shift Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Staff Badge */}
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div className="avatar" style={{
                width: 76, height: 76, fontSize: 28, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--primary), var(--purple))',
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
              }}>
                {currentUser.initials}
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentUser.name}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {currentUser.role} • Employee ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>MF-FD-2041</span>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: 'var(--success-light)',
                borderRadius: 999, color: '#065F46', fontSize: 12, fontWeight: 700, marginTop: 12
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                Active Shift • Counter #2
              </div>

              <div style={{
                marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Branch:</span>
                  <span style={{ fontWeight: 600 }}>{selectedBranch}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shift Timings:</span>
                  <span style={{ fontWeight: 600 }}>08:00 AM – 04:00 PM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Terminal Station:</span>
                  <span style={{ fontWeight: 600 }}>DESK-SURAT-02</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Counter Productivity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <ShieldCheck size={18} color="var(--primary)" />
                Today's Counter Performance
              </span>
            </div>

            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: 'var(--bg-muted)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check-Ins Handled</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>{totalCheckIns}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-muted)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>New Registrations</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)', marginTop: 4 }}>{newPatientsRegistered}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-muted)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cash Handled</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>₹{cashCollected}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-muted)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Digital (UPI/Card)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#6366F1', marginTop: 4 }}>₹{digitalCollected}</div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Settings size={18} color="var(--primary)" />
                Reception Terminal Settings
              </span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Audio Chime on Call</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Play hospital bell when calling patient</div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={e => setSoundAlerts(e.target.checked)}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Thermal Printer Default</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Print 50×25mm sticker format automatically</div>
                </div>
                <input
                  type="checkbox"
                  checked={thermalMode}
                  onChange={e => setThermalMode(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Shift Handover & Cash Drawer Reconciler */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Banknote size={18} color="var(--success)" />
              End-of-Shift Cash Drawer Reconciliation
            </span>
            <span className="badge badge-warning">Audit Requirement</span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Count physical notes inside Counter Drawer #2 and confirm totals against MedFlow POS ledger before transferring responsibility to the afternoon officer.
            </p>

            {/* Denomination Counter */}
            <div style={{
              padding: 16, background: 'var(--bg-muted)', borderRadius: 12,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                Physical Currency Note Count
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">₹500 Notes</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={d500}
                    onChange={e => setD500(parseInt(e.target.value) || 0)}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>= ₹{d500 * 500}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">₹200 Notes</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={d200}
                    onChange={e => setD200(parseInt(e.target.value) || 0)}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>= ₹{d200 * 200}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">₹100 Notes</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={d100}
                    onChange={e => setD100(parseInt(e.target.value) || 0)}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>= ₹{d100 * 100}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">₹50 Notes / Coins</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={d50}
                    onChange={e => setD50(parseInt(e.target.value) || 0)}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>= ₹{d50 * 50}</div>
                </div>
              </div>

              {/* Tally Comparison */}
              <div style={{
                marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>System Expected Cash:</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>₹{cashCollected}.00</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Physically Counted:</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>₹{countedCash}.00</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Variance:</div>
                  <div style={{
                    fontSize: 16, fontWeight: 800,
                    color: discrepancy === 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {discrepancy === 0 ? '✓ Exact Match' : `${discrepancy > 0 ? '+' : ''}₹${discrepancy}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Handover Details */}
            <div className="form-group">
              <label className="form-label required">Relieving / Incoming Front Desk Officer</label>
              <select
                className="form-select"
                value={incomingOfficer}
                onChange={e => setIncomingOfficer(e.target.value)}
              >
                <option value="Pooja Mehta">Pooja Mehta (Afternoon Shift: 04:00 PM – 10:00 PM)</option>
                <option value="Chetan Dave">Chetan Dave (Night Emergency Desk)</option>
                <option value="Neha Shah">Neha Shah (Weekend Rotation Officer)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Shift Briefing Notes & Critical Follow-Ups</label>
              <textarea
                rows={4}
                className="form-textarea"
                placeholder="Include pending lab pickups, patient disputes, VIP visits expected, or doctor timing adjustments..."
                value={handoverNotes}
                onChange={e => setHandoverNotes(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-ghost"
              >
                <Printer size={15} /> Print Drawer Audit Slip
              </button>
              <button
                type="button"
                onClick={handleSubmitHandover}
                className="btn btn-primary btn-lg"
              >
                <CheckCircle2 size={16} /> Complete Handover & Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
