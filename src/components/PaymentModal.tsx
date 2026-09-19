'use client';
import { useState } from 'react';
import { X, CreditCard, Smartphone, Banknote, CheckCircle2, Maximize2 } from 'lucide-react';
import { Patient, useQueueStore } from '@/store';

interface Props {
  patient: Patient;
  doctorName: string;
  appointmentTime?: string;
  fee?: number;
  onClose: () => void;
  onSuccess?: () => void;
  onComplete?: (paymentMode: string, amount: number) => void;
}

const UPI_ID = 'medflow@upi';

export default function PaymentModal({
  patient,
  doctorName,
  appointmentTime = 'Today',
  fee = 500,
  onClose,
  onSuccess,
  onComplete
}: Props) {
  const [option, setOption] = useState<'NOW' | 'LATER'>('NOW');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [amount, setAmount] = useState(fee);
  const [showQR, setShowQR] = useState(false);
  const [done, setDone] = useState(false);

  const upiString = `upi://pay?pa=${UPI_ID}&pn=MedFlow+Clinic&am=${amount}&cu=INR&tn=OPD+Payment`;

  // Simple SVG QR code visual placeholder
  const QRCode = () => (
    <div style={{
      width: showQR ? 280 : 140,
      height: showQR ? 280 : 140,
      background: 'white',
      border: '8px solid #0F172A',
      borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 8,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      flexShrink: 0,
    }} onClick={() => setShowQR(!showQR)}>
      {/* QR pattern simulation */}
      <svg width="80%" height="80%" viewBox="0 0 100 100">
        {/* Corner squares */}
        <rect x="5" y="5" width="28" height="28" fill="none" stroke="#0F172A" strokeWidth="4"/>
        <rect x="10" y="10" width="18" height="18" fill="#0F172A"/>
        <rect x="67" y="5" width="28" height="28" fill="none" stroke="#0F172A" strokeWidth="4"/>
        <rect x="72" y="10" width="18" height="18" fill="#0F172A"/>
        <rect x="5" y="67" width="28" height="28" fill="none" stroke="#0F172A" strokeWidth="4"/>
        <rect x="10" y="72" width="18" height="18" fill="#0F172A"/>
        {/* Deterministic QR Data pattern */}
        {[
          [0,1,0,1,1,0],
          [1,0,1,0,0,1],
          [0,1,1,0,1,0],
          [1,0,0,1,1,1],
          [0,1,0,1,0,1],
          [1,1,0,0,1,0],
        ].flatMap((row, i) =>
          row.map((val, j) =>
            val === 1 ? (
              <rect key={`dot-${i}-${j}`} x={36 + i * 5} y={5 + j * 5} width="4" height="4" fill="#0F172A"/>
            ) : null
          )
        )}
        {[
          [1,0,1,1,0,1,0,1],
          [0,1,0,0,1,1,1,0],
          [1,1,0,1,0,0,1,1],
          [0,1,1,0,1,0,0,1],
          [1,0,0,1,1,1,0,0],
          [0,1,0,1,0,1,1,0],
          [1,1,1,0,0,1,0,1],
          [0,0,1,1,0,0,1,1],
        ].flatMap((row, i) =>
          row.map((val, j) =>
            val === 1 ? (
              <rect key={`body-${i}-${j}`} x={5 + i * 5} y={36 + j * 5} width="4" height="4" fill="#0F172A"/>
            ) : null
          )
        )}
      </svg>
      <div style={{ fontSize: 8, fontWeight: 700, color: '#0F172A', position: 'absolute', bottom: 6 }}>UPI</div>
      <Maximize2 size={12} color="#64748B" style={{ position: 'absolute', top: 6, right: 6 }} />
    </div>
  );

  const handleComplete = () => {
    setDone(true);
    setTimeout(() => {
      if (onComplete) {
        onComplete(option === 'LATER' ? 'PENDING' : method, option === 'LATER' ? 0 : amount);
      }
      if (onSuccess) {
        onSuccess();
      }
    }, 1200);
  };

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">💳 Consultation Check-In</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: 72, height: 72, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Check-In Complete!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {patient.firstName} {patient.lastName} has been added to the OPD queue.
            </p>
            <div style={{ marginTop: 16, padding: '12px 20px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>Queue Token Assigned</span>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="two-col" style={{ gap: 24 }}>
              {/* Left: Patient Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                  <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg,var(--primary),var(--accent))' }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{patient.firstName} {patient.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{patient.age}Y / {patient.gender}</div>
                    <div className="patient-mrd" style={{ marginTop: 4, display: 'inline-block' }}>{patient.mrdNumber}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Doctor', value: doctorName },
                    { label: 'Appointment', value: appointmentTime },
                    { label: 'Consultation Fee', value: `₹${fee}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, padding: '12px', background: 'var(--info-light)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#1E40AF' }}>
                  ℹ️ Collect fee before patient enters the queue. Pay Later will add to outstanding balance.
                </div>
              </div>

              {/* Right: Payment */}
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>Payment Option</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['NOW', 'LATER'] as const).map(opt => (
                      <button
                        key={opt}
                        className={`btn ${option === opt ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => setOption(opt)}
                      >
                        {opt === 'NOW' ? '💰 Pay Now' : '⏰ Pay Later'}
                      </button>
                    ))}
                  </div>
                </div>

                {option === 'NOW' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Amount (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        min={1} max={fee}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Payment Method</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {([['CASH', '💵 Cash', Banknote], ['CARD', '💳 Card', CreditCard], ['UPI', '📱 UPI', Smartphone]] as const).map(([m, label, Icon]) => (
                          <button
                            key={m}
                            className={`btn btn-sm ${method === m ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ flex: 1 }}
                            onClick={() => setMethod(m)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {method === 'UPI' && (
                      <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>Scan to Pay ₹{amount}</div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <QRCode />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, fontFamily: 'monospace' }}>{UPI_ID}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4 }}>Click QR to enlarge</div>
                      </div>
                    )}
                  </>
                )}

                {option === 'LATER' && (
                  <div style={{ padding: '16px', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)', marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Outstanding Balance</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>₹{fee} will be added to the patient's pending balance. Collect before discharge.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!done && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-success btn-lg" onClick={handleComplete}>
              <CheckCircle2 size={16} />
              Complete Check-In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
