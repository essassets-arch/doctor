'use client';
import { QueueStatus } from '@/store';
import { Clock, CheckCircle2, XCircle, AlertCircle, Activity, PhoneCall, PauseCircle, Wallet } from 'lucide-react';

const CONFIG: Record<QueueStatus, { label: string; className: string; icon: React.ReactNode }> = {
  WAITING: { label: 'Waiting', className: 'badge badge-warning badge-dot', icon: <Clock size={10} /> },
  CALLING: { label: 'Calling', className: 'badge status-badge-calling badge-dot', icon: <PhoneCall size={10} /> },
  IN_SESSION: { label: 'In Session', className: 'badge badge-success badge-dot', icon: <Activity size={10} /> },
  ON_HOLD: { label: 'On Hold', className: 'badge badge-orange badge-dot', icon: <PauseCircle size={10} /> },
  BILLING_PENDING: { label: 'Billing Pending', className: 'badge badge-primary badge-dot', icon: <Wallet size={10} /> },
  COMPLETED: { label: 'Completed', className: 'badge badge-muted badge-dot', icon: <CheckCircle2 size={10} /> },
  CANCELLED: { label: 'Cancelled', className: 'badge badge-danger badge-dot', icon: <XCircle size={10} /> },
  MISSED: { label: 'Missed', className: 'badge badge-orange badge-dot', icon: <AlertCircle size={10} /> },
};

export default function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const cfg = CONFIG[status] || CONFIG.WAITING;
  return <span className={cfg.className}>{cfg.label}</span>;
}
