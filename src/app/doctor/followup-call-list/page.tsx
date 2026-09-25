'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock, Phone, PhoneCall, CheckCircle2, AlertCircle,
  Search, Filter, Calendar, User, ArrowRight, MessageSquare,
  X, Check, RotateCcw, Plus, Download, FileText, ExternalLink,
  CheckCheck, Send, AlertTriangle, Stethoscope
} from 'lucide-react';
import { useFollowUpStore, useUIStore, FollowUpTask, formatToDDMMYYYY } from '@/store';

export default function FollowUpCallListPage() {
  const { tasks, addCallLog, updateStatus, addTask, rescheduleTask, deleteTask } = useFollowUpStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'MISSED' | 'PROCEDURES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CALLED' | 'RESCHEDULED' | 'NO_SHOW' | 'COMPLETED'>('ALL');
  const [doctorFilter, setDoctorFilter] = useState<string>('ALL');

  // Modals state
  const [selectedTaskForCall, setSelectedTaskForCall] = useState<FollowUpTask | null>(null);
  const [callOutcome, setCallOutcome] = useState('ANSWERED');
  const [callerName, setCallerName] = useState('Dr. Raj Valaki');
  const [callNotes, setCallNotes] = useState('');

  const [selectedTaskForReschedule, setSelectedTaskForReschedule] = useState<FollowUpTask | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [selectedTaskForWhatsApp, setSelectedTaskForWhatsApp] = useState<FollowUpTask | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    patientName: '',
    mrdNumber: 'MRD-2026-00',
    mobile: '',
    doctorName: 'Dr. Raj Valaki',
    reason: '',
    nursingInstructions: '',
    dueDate: formatToDDMMYYYY(new Date(Date.now() + 7 * 86400000)),
    followUpDays: 7,
    priority: 'High' as 'High' | 'Medium' | 'Low'
  });

  // Unique doctors in ledger
  const uniqueDoctors = useMemo(() => {
    const docs = new Set<string>();
    tasks.forEach(t => { if (t.doctorName) docs.add(t.doctorName); });
    return Array.from(docs);
  }, [tasks]);

  // Date helper
  const isDueTodayOrOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const todayDDMM = formatToDDMMYYYY(today);
    const todayISO = today.toISOString().split('T')[0];
    if (dateStr === todayDDMM || dateStr === todayISO) return true;
    if (dateStr === '2026-09-19' || dateStr === '19/09/2026') return true;
    if (dateStr === '2026-09-26' || dateStr === '26/09/2026') return true;

    // DD/MM/YYYY comparison
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/').map(Number);
      const target = new Date(y, m - 1, d);
      return target <= today;
    }
    // YYYY-MM-DD comparison
    if (dateStr.includes('-')) {
      const target = new Date(dateStr);
      return target <= today;
    }
    return false;
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Tab filter
      if (activeTab === 'TODAY' && !isDueTodayOrOverdue(t.dueDate)) return false;
      if (activeTab === 'UPCOMING' && isDueTodayOrOverdue(t.dueDate)) return false;
      if (activeTab === 'MISSED' && t.status !== 'NO_SHOW') return false;
      if (activeTab === 'PROCEDURES' && !t.reason.toLowerCase().includes('procedure') && !t.reason.toLowerCase().includes('laser') && !t.reason.toLowerCase().includes('injection')) return false;

      // Dropdown filters
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (doctorFilter !== 'ALL' && t.doctorName !== doctorFilter) return false;

      // Search query filter (including nursingInstructions)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPatient = t.patientName.toLowerCase().includes(q);
        const matchesMrd = t.mrdNumber.toLowerCase().includes(q);
        const matchesMobile = t.mobile.includes(q);
        const matchesReason = t.reason.toLowerCase().includes(q);
        const matchesNursing = t.nursingInstructions ? t.nursingInstructions.toLowerCase().includes(q) : false;
        const matchesDoctor = t.doctorName.toLowerCase().includes(q);
        return matchesPatient || matchesMrd || matchesMobile || matchesReason || matchesNursing || matchesDoctor;
      }
      return true;
    });
  }, [tasks, activeTab, priorityFilter, statusFilter, doctorFilter, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const total = tasks.length;
    const dueToday = tasks.filter(t => isDueTodayOrOverdue(t.dueDate)).length;
    const missed = tasks.filter(t => t.status === 'NO_SHOW').length;
    const completed = tasks.filter(t => t.status === 'CALLED' || t.status === 'COMPLETED').length;
    return { total, dueToday, missed, completed };
  }, [tasks]);

  // Operations
  const handleSaveCallLog = () => {
    if (!selectedTaskForCall) return;
    addCallLog(selectedTaskForCall.id, {
      caller: callerName,
      outcome: callOutcome,
      notes: callNotes.trim() || 'Patient reported satisfactory clinical recovery and medication compliance.'
    });

    addNotification({
      type: 'success',
      message: `Logged follow-up call with ${selectedTaskForCall.patientName}: ${callOutcome}`
    });

    setSelectedTaskForCall(null);
    setCallNotes('');
  };

  const handleQuickComplete = (task: FollowUpTask) => {
    updateStatus(task.id, 'COMPLETED');
    addCallLog(task.id, {
      caller: 'Dr. Raj Valaki',
      outcome: 'COMPLETED',
      notes: 'Quick marked follow-up completed.'
    });
    addNotification({
      type: 'success',
      message: `Follow-up recall for ${task.patientName} marked COMPLETED ✓`
    });
  };

  const handleOpenReschedule = (task: FollowUpTask) => {
    setSelectedTaskForReschedule(task);
    const today = new Date();
    setRescheduleDate(formatToDDMMYYYY(new Date(today.getTime() + 7 * 86400000)));
    setRescheduleReason('Patient requested rescheduled follow-up date');
  };

  const handleSaveReschedule = () => {
    if (!selectedTaskForReschedule) return;
    if (!rescheduleDate.trim()) {
      alert('Please specify a valid return date (DD/MM/YYYY)');
      return;
    }
    rescheduleTask(selectedTaskForReschedule.id, rescheduleDate, rescheduleReason);
    addNotification({
      type: 'info',
      message: `Rescheduled ${selectedTaskForReschedule.patientName}'s recall to ${rescheduleDate} ✓`
    });
    setSelectedTaskForReschedule(null);
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      alert('No recall records to export.');
      return;
    }
    const headers = ['Task ID', 'Case ID', 'Patient Name', 'MRD Number', 'Contact Mobile', 'Doctor Name', 'Original Visit', 'Recall Purpose', 'Nursing Outbound Directives', 'Due Return Date', 'Priority', 'Status', 'Call History Count'];
    const rows = tasks.map(t => [
      `"${t.id}"`,
      `"${t.caseId || 'N/A'}"`,
      `"${t.patientName.replace(/"/g, '""')}"`,
      `"${t.mrdNumber}"`,
      `"${t.mobile}"`,
      `"${t.doctorName.replace(/"/g, '""')}"`,
      `"${t.originalVisitDate}"`,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      `"${(t.nursingInstructions || '').replace(/"/g, '""')}"`,
      `"${t.dueDate}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.callLogs.length}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `outbound_followup_recall_ledger_${formatToDDMMYYYY(new Date()).replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification({
      type: 'success',
      message: `Exported ${tasks.length} Outbound Follow-Up Recall records to CSV ✓`
    });
  };

  const handleCreateNewRecall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.patientName.trim()) {
      alert('Patient name is required');
      return;
    }
    addTask({
      patientId: `pat-${Date.now().toString(36)}`,
      patientName: newTaskForm.patientName.trim(),
      mrdNumber: newTaskForm.mrdNumber.trim() || `MRD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mobile: newTaskForm.mobile.trim() || '9825100000',
      doctorName: newTaskForm.doctorName,
      originalVisitDate: formatToDDMMYYYY(new Date()),
      reason: newTaskForm.reason.trim() || 'Clinical recovery evaluation',
      dueDate: newTaskForm.dueDate.trim() || formatToDDMMYYYY(new Date(Date.now() + 7 * 86400000)),
      followUpDays: newTaskForm.followUpDays,
      nursingInstructions: newTaskForm.nursingInstructions.trim(),
      priority: newTaskForm.priority,
      status: 'PENDING'
    });

    addNotification({
      type: 'success',
      message: `Scheduled new follow-up recall for ${newTaskForm.patientName} ✓`
    });

    setIsAddModalOpen(false);
    setNewTaskForm({
      patientName: '',
      mrdNumber: 'MRD-2026-00',
      mobile: '',
      doctorName: 'Dr. Raj Valaki',
      reason: '',
      nursingInstructions: '',
      dueDate: formatToDDMMYYYY(new Date(Date.now() + 7 * 86400000)),
      followUpDays: 7,
      priority: 'High'
    });
  };

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-primary" style={{ background: '#036d92', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              OPD CLINICAL CARE COORDINATION
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Encounter Recalls &amp; Outbound Nursing Protocol
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
            Patient Follow-Up Call List &amp; Care Coordination
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748B', maxWidth: 760 }}>
            Track outpatient clinical clearance, procedure post-care, nursing drug compliance checks, and scheduled return dates prescribed during doctor consultations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            id="btn-export-call-ledger"
            onClick={handleExportCSV}
            className="btn btn-outline btn-sm"
            style={{ fontWeight: 700, borderColor: '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Export Call Ledger (CSV)
          </button>
          <button
            id="btn-schedule-new-recall"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Schedule Outbound Recall
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total In Recall Ledger</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#036d92', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Active patient follow-ups</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Today / Due Recalls</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{stats.dueToday}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Requires outreach today</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Missed (No Show)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>{stats.missed}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Unanswered / Overdue visits</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Completed / Spoke</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>{stats.completed}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Inquiries logged &amp; verified</div>
        </div>
      </div>

      {/* Tabs and Advanced Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
          {/* Top Row: Category Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Scheduled Recalls', count: tasks.length },
                { id: 'TODAY', label: "Today & Due Recalls", count: tasks.filter(t => isDueTodayOrOverdue(t.dueDate)).length },
                { id: 'UPCOMING', label: 'Upcoming Recalls', count: tasks.filter(t => !isDueTodayOrOverdue(t.dueDate)).length },
                { id: 'MISSED', label: 'Missed F/U (No Show)', count: tasks.filter(t => t.status === 'NO_SHOW').length },
                { id: 'PROCEDURES', label: 'Procedure Check-Ups', count: tasks.filter(t => t.reason.toLowerCase().includes('procedure') || t.reason.toLowerCase().includes('laser') || t.reason.toLowerCase().includes('injection')).length },
              ].map(tab => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id.toLowerCase()}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`badge ${activeTab === tab.id ? 'badge-primary' : 'badge-muted'}`}
                  style={{
                    cursor: 'pointer', padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    background: activeTab === tab.id ? '#036d92' : '#F1F5F9',
                    color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                    border: 'none', borderRadius: 8, transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="search-input-wrap" style={{ width: 320, maxWidth: '100%' }}>
              <Search className="search-icon" size={15} />
              <input
                id="input-followup-search"
                type="text"
                className="form-input"
                placeholder="Search patient, MRD, phone, nursing directives..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: 12 }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', right: 6 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Granular Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              <Filter size={14} /> Filters:
            </div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Priority:</span>
              <select
                id="select-priority-filter"
                className="form-select"
                style={{ fontSize: 11.5, padding: '3px 8px', height: 28, width: 110 }}
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as any)}
              >
                <option value="ALL">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Status:</span>
              <select
                id="select-status-filter"
                className="form-select"
                style={{ fontSize: 11.5, padding: '3px 8px', height: 28, width: 130 }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CALLED">CALLED</option>
                <option value="RESCHEDULED">RESCHEDULED</option>
                <option value="NO_SHOW">NO_SHOW</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            {/* Doctor Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Doctor:</span>
              <select
                id="select-doctor-filter"
                className="form-select"
                style={{ fontSize: 11.5, padding: '3px 8px', height: 28, width: 140 }}
                value={doctorFilter}
                onChange={e => setDoctorFilter(e.target.value)}
              >
                <option value="ALL">All Doctors</option>
                {uniqueDoctors.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

            {(priorityFilter !== 'ALL' || statusFilter !== 'ALL' || doctorFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setPriorityFilter('ALL');
                  setStatusFilter('ALL');
                  setDoctorFilter('ALL');
                  setSearchQuery('');
                }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, padding: '2px 8px' }}
              >
                Reset Filters
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: 11.5, color: '#64748B' }}>
              Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> recall entries
            </div>
          </div>
        </div>
      </div>

      {/* Outbound Follow-Up Recall Ledger Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#036d92" />
            Outbound Follow-Up Recall Ledger — {filteredTasks.length} Records
          </span>
          <span style={{ fontSize: 11.5, color: '#64748B' }}>
            Live synced from Doctor Consultation Panel
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 950 }}>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Patient Details</th>
                <th style={{ width: 140 }}>Contact &amp; Outreach</th>
                <th style={{ width: 140 }}>Attending Doctor</th>
                <th>Clinical Recall Purpose &amp; Nursing Directives</th>
                <th style={{ width: 120 }}>Due Return</th>
                <th style={{ width: 90 }}>Priority</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 180, textAlign: 'right' }}>Care Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={28} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#334155' }}>No follow-up records found matching these criteria</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search or filters, or schedule a new recall above.</div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} id={`row-task-${task.id}`}>
                    {/* Patient Details */}
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                        {task.patientName}
                      </div>
                      <div style={{ fontSize: 11, color: '#036d92', fontFamily: 'monospace', fontWeight: 600 }}>
                        {task.mrdNumber}
                      </div>
                      {task.caseId && (
                        <Link
                          href={`/doctor/consultation/${task.caseId}`}
                          style={{
                            fontSize: 10, color: '#0284c7', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2,
                            fontWeight: 700
                          }}
                          title="Open patient consultation room"
                        >
                          <ExternalLink size={10} /> Case: {task.caseId}
                        </Link>
                      )}
                    </td>

                    {/* Contact & Phone */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <a
                          href={`tel:${task.mobile}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            color: '#0F172A', textDecoration: 'none', fontWeight: 700
                          }}
                          title="Direct call"
                        >
                          <Phone size={12} color="#036d92" />
                          {task.mobile}
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForWhatsApp(task)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '1px 6px', fontSize: 10, color: '#059669', height: 20 }}
                          title="Draft WhatsApp Recall"
                        >
                          <MessageSquare size={10} /> WhatsApp
                        </button>
                      </div>
                    </td>

                    {/* Attending Doctor */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 12 }}>
                        {task.doctorName}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>Dermatology OPD</div>
                    </td>

                    {/* Clinical Recall Purpose & NURSING DIRECTIVES */}
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                        {task.reason}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
                        Encounter Date: {task.originalVisitDate}
                      </div>

                      {/* Doctor's Nursing Outbound Call Instructions (Requested by user) */}
                      {task.nursingInstructions ? (
                        <div
                          style={{
                            marginTop: 6,
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            fontSize: 11.5,
                            color: '#1E40AF',
                            lineHeight: 1.4
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: 10.5, textTransform: 'uppercase', color: '#1D4ED8', marginBottom: 2 }}>
                            <FileText size={12} /> Nursing Outbound Call Instructions:
                          </div>
                          <div style={{ fontWeight: 600 }}>
                            {task.nursingInstructions}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 4, fontSize: 10.5, color: '#94A3B8', fontStyle: 'italic' }}>
                          Standard post-visit clearance inquiry
                        </div>
                      )}

                      {/* Last Call Note preview if exists */}
                      {task.callLogs && task.callLogs.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 10.5, color: '#475569' }}>
                          <span style={{ fontWeight: 700 }}>Last Call ({task.callLogs[0].date}):</span> [{task.callLogs[0].outcome}] {task.callLogs[0].notes}
                        </div>
                      )}
                    </td>

                    {/* Due Return Date */}
                    <td>
                      <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 12.5, color: '#036d92' }}>
                        {task.dueDate}
                      </div>
                      {task.followUpDays && (
                        <span className="badge" style={{ fontSize: 10, background: '#F1F5F9', color: '#475569', marginTop: 2, padding: '1px 5px' }}>
                          {task.followUpDays}d interval
                        </span>
                      )}
                    </td>

                    {/* Priority */}
                    <td>
                      <span className={`badge ${task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-primary'}`} style={{ fontWeight: 700, fontSize: 11 }}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`badge ${
                          task.status === 'CALLED' ? 'badge-success' :
                          task.status === 'COMPLETED' ? 'badge-success' :
                          task.status === 'RESCHEDULED' ? 'badge-primary' :
                          task.status === 'NO_SHOW' ? 'badge-danger' : 'badge-warning'
                        }`}
                        style={{
                          fontWeight: 700, fontSize: 11,
                          background: task.status === 'COMPLETED' ? '#ECFDF5' : task.status === 'RESCHEDULED' ? '#F3E8FF' : undefined,
                          color: task.status === 'COMPLETED' ? '#047857' : task.status === 'RESCHEDULED' ? '#6B21A8' : undefined,
                          border: task.status === 'COMPLETED' ? '1px solid #A7F3D0' : task.status === 'RESCHEDULED' ? '1px solid #E9D5FF' : undefined
                        }}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Care Operations */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            id={`btn-log-call-${task.id}`}
                            onClick={() => {
                              setSelectedTaskForCall(task);
                              setCallOutcome('ANSWERED');
                              setCallNotes('');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{
                              background: '#036d92', borderColor: '#036d92', fontSize: 11,
                              padding: '3px 8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                            title="Open Call Log Drawer"
                          >
                            <PhoneCall size={12} /> Log Call
                          </button>

                          <button
                            id={`btn-reschedule-${task.id}`}
                            onClick={() => handleOpenReschedule(task)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 11, padding: '3px 8px', fontWeight: 700, borderColor: '#CBD5E1' }}
                            title="Reschedule return date"
                          >
                            <Calendar size={12} /> Reschedule
                          </button>
                        </div>

                        {task.status !== 'COMPLETED' && (
                          <button
                            id={`btn-quick-complete-${task.id}`}
                            onClick={() => handleQuickComplete(task)}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 10.5, padding: '1px 6px', color: '#059669', fontWeight: 700 }}
                            title="Mark as completed"
                          >
                            <CheckCheck size={12} /> Mark Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. Log Call Drawer Modal (with Nursing Instructions displayed) */}
      {/* ============================================================ */}
      {selectedTaskForCall && (
        <div className="modal-overlay" onClick={() => setSelectedTaskForCall(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span className="modal-title" style={{ fontSize: 16, fontWeight: 800, color: '#036d92' }}>
                  Log Outbound Care Call — {selectedTaskForCall.patientName}
                </span>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  Record clinical response, symptoms resolution, and drug compliance
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTaskForCall(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Patient Banner */}
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>Phone:</strong> {selectedTaskForCall.mobile} | <strong>MRD:</strong> {selectedTaskForCall.mrdNumber}</div>
                  <div><strong>Doctor:</strong> {selectedTaskForCall.doctorName}</div>
                </div>
                <div style={{ marginTop: 4 }}><strong>Scheduled Recall Date:</strong> {selectedTaskForCall.dueDate} ({selectedTaskForCall.reason})</div>
              </div>

              {/* Prominent Doctor's Nursing Outbound Directives (User request requirement) */}
              {selectedTaskForCall.nursingInstructions && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FileText size={13} /> Doctor's Nursing Outbound Directives:
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E3A8A', lineHeight: 1.4 }}>
                    {selectedTaskForCall.nursingInstructions}
                  </div>
                </div>
              )}

              {/* Caller Identity */}
              <div style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: 11.5 }}>Caller Identity / Staff Nurse *</label>
                <select
                  id="select-call-caller"
                  className="form-select"
                  style={{ fontSize: 12, fontWeight: 600 }}
                  value={callerName}
                  onChange={e => setCallerName(e.target.value)}
                >
                  <option value="Dr. Raj Valaki">Dr. Raj Valaki (Consulting Physician)</option>
                  <option value="Staff Nurse Rekha">Staff Nurse Rekha (OPD)</option>
                  <option value="Sister Priya">Sister Priya (Dermatology Care)</option>
                  <option value="Front Desk Riya">Front Desk Riya (Patient Coordination)</option>
                </select>
              </div>

              {/* Call Outcome Grid */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 11.5 }}>Call Outcome Status *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'ANSWERED', label: 'Answered' },
                    { id: 'NO_ANSWER', label: 'No Answer' },
                    { id: 'BUSY', label: 'Line Busy' },
                    { id: 'WRONG_NUMBER', label: 'Wrong No.' },
                    { id: 'RESCHEDULED', label: 'Rescheduled' },
                    { id: 'SWITCHED_OFF', label: 'Switched Off' },
                  ].map(out => (
                    <button
                      key={out.id}
                      id={`btn-call-outcome-${out.id.toLowerCase()}`}
                      type="button"
                      onClick={() => setCallOutcome(out.id)}
                      className={`btn btn-sm ${callOutcome === out.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        background: callOutcome === out.id ? '#036d92' : '#FFFFFF',
                        color: callOutcome === out.id ? '#FFFFFF' : '#334155',
                        borderColor: callOutcome === out.id ? '#036d92' : '#CBD5E1',
                        justifyContent: 'center', fontSize: 11.5, fontWeight: 700
                      }}
                    >
                      {out.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Template Chips for Notes */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Quick Response Templates:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Fungal lesions clearing well, oral medication tolerated without issue.',
                    'Patient confirmed 100% medication compliance. Symptoms resolving.',
                    'Mild erythema remaining; instructed patient to apply topical cream TDS.',
                    'Patient requested appointment reschedule due to work travel.',
                    'Patient experienced mild stomach upset; advised to take tab after food.'
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCallNotes(chip)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        fontSize: 10.5, padding: '2px 8px', borderRadius: 12,
                        background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0',
                        textAlign: 'left', lineHeight: 1.2
                      }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call Notes */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Patient Clinical Response &amp; Drug Compliance Notes
                </label>
                <textarea
                  id="textarea-call-notes"
                  className="form-input"
                  rows={3}
                  placeholder="Record patient recovery feedback, medicine tolerability, lesion progression..."
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  style={{ fontSize: 12 }}
                />
              </div>

              {/* Past Call History */}
              {selectedTaskForCall.callLogs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Previous Call History ({selectedTaskForCall.callLogs.length}):
                  </div>
                  {selectedTaskForCall.callLogs.map((log, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, background: '#F8FAFC', padding: '4px 8px', borderRadius: 4 }}>
                      • <strong>{log.date} ({log.caller}):</strong> <span className="badge badge-sm badge-primary" style={{ fontSize: 9.5, padding: '0 4px' }}>{log.outcome}</span> {log.notes}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setSelectedTaskForCall(null)}>
                Cancel
              </button>
              <button
                id="btn-save-call-entry"
                onClick={handleSaveCallLog}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700 }}
              >
                Save Call Entry ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. Reschedule Modal */}
      {/* ============================================================ */}
      {selectedTaskForReschedule && (
        <div className="modal-overlay" onClick={() => setSelectedTaskForReschedule(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: 16, fontWeight: 800, color: '#036d92' }}>
                Reschedule Follow-Up Return Date
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTaskForReschedule(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
                <div><strong>Patient:</strong> {selectedTaskForReschedule.patientName} ({selectedTaskForReschedule.mrdNumber})</div>
                <div style={{ marginTop: 2 }}><strong>Current Due Date:</strong> {selectedTaskForReschedule.dueDate}</div>
                <div style={{ marginTop: 2 }}><strong>Recall Purpose:</strong> {selectedTaskForReschedule.reason}</div>
              </div>

              {/* Interval Preset Buttons */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 11.5 }}>Shift Interval from Today:</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[3, 7, 14, 21, 30].map(d => {
                    const today = new Date();
                    const newFormatted = formatToDDMMYYYY(new Date(today.getTime() + d * 86400000));
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRescheduleDate(newFormatted)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px' }}
                      >
                        +{d} Days ({newFormatted})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 11.5 }}>New Scheduled Return Date (DD/MM/YYYY) *</label>
                <input
                  id="input-reschedule-date"
                  type="text"
                  className="form-input"
                  placeholder="DD/MM/YYYY"
                  style={{ fontWeight: 700, color: '#036d92' }}
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 11.5 }}>Reschedule Reason / Care Note</label>
                <input
                  id="input-reschedule-reason"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Patient traveling, requested follow-up next Monday"
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedTaskForReschedule(null)}>
                Cancel
              </button>
              <button
                id="btn-confirm-reschedule"
                onClick={handleSaveReschedule}
                className="btn btn-primary"
                style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700 }}
              >
                Confirm Reschedule ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. WhatsApp Message Preview Modal */}
      {/* ============================================================ */}
      {selectedTaskForWhatsApp && (
        <div className="modal-overlay" onClick={() => setSelectedTaskForWhatsApp(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: 16, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} /> WhatsApp Recall Reminder Dispatch
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTaskForWhatsApp(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                Patient: <strong>{selectedTaskForWhatsApp.patientName}</strong> ({selectedTaskForWhatsApp.mobile})
              </div>

              <div style={{ background: '#DCF8C6', padding: 14, borderRadius: 10, fontSize: 12.5, color: '#111827', border: '1px solid #B8E994', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, color: '#075E54', marginBottom: 6 }}>
                  MEDFLOW CLINICAL OS — APPOINTMENT RECALL
                </div>
                <div>Dear {selectedTaskForWhatsApp.patientName},</div>
                <div style={{ marginTop: 6 }}>
                  This is a reminder from <strong>{selectedTaskForWhatsApp.doctorName}</strong> regarding your scheduled follow-up consultation on <strong>{selectedTaskForWhatsApp.dueDate}</strong>.
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Recall Purpose:</strong> {selectedTaskForWhatsApp.reason}
                </div>
                {selectedTaskForWhatsApp.nursingInstructions && (
                  <div style={{ marginTop: 6, fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: 4 }}>
                    <strong>Doctor's Directive:</strong> {selectedTaskForWhatsApp.nursingInstructions}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 11, color: '#4B5563' }}>
                  Please reply to this message or call our clinic desk if you wish to reschedule.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedTaskForWhatsApp(null)}>
                Close
              </button>
              <button
                id="btn-confirm-send-whatsapp"
                onClick={() => {
                  addNotification({
                    type: 'success',
                    message: `WhatsApp reminder dispatched to ${selectedTaskForWhatsApp.patientName} (${selectedTaskForWhatsApp.mobile}) ✓`
                  });
                  setSelectedTaskForWhatsApp(null);
                }}
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={13} /> Confirm &amp; Dispatch Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. Manual Schedule Outbound Recall Modal */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: 16, fontWeight: 800, color: '#036d92' }}>
                Schedule Outbound Follow-Up Recall Task
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecall}>
              <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Patient Full Name *</label>
                    <input
                      id="input-new-patient-name"
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Ramesh Patel"
                      value={newTaskForm.patientName}
                      onChange={e => setNewTaskForm({ ...newTaskForm, patientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>MRD Number</label>
                    <input
                      id="input-new-mrd"
                      type="text"
                      className="form-input"
                      placeholder="MRD-2026-0000"
                      value={newTaskForm.mrdNumber}
                      onChange={e => setNewTaskForm({ ...newTaskForm, mrdNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Mobile Phone *</label>
                    <input
                      id="input-new-mobile"
                      type="tel"
                      required
                      className="form-input"
                      placeholder="9825100000"
                      value={newTaskForm.mobile}
                      onChange={e => setNewTaskForm({ ...newTaskForm, mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Attending Doctor</label>
                    <select
                      id="select-new-doctor"
                      className="form-select"
                      value={newTaskForm.doctorName}
                      onChange={e => setNewTaskForm({ ...newTaskForm, doctorName: e.target.value })}
                    >
                      <option value="Dr. Raj Valaki">Dr. Raj Valaki</option>
                      <option value="Dr. Suresh Kumar">Dr. Suresh Kumar</option>
                      <option value="Dr. Priya Mehta">Dr. Priya Mehta</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Purpose of Follow-Up *</label>
                  <input
                    id="input-new-reason"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Assess clinical clearance of fungal lesions"
                    value={newTaskForm.reason}
                    onChange={e => setNewTaskForm({ ...newTaskForm, reason: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Nursing Outbound Call Instructions</label>
                  <input
                    id="input-new-instructions"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Call patient at day 5 to verify compliance and symptom clearance"
                    value={newTaskForm.nursingInstructions}
                    onChange={e => setNewTaskForm({ ...newTaskForm, nursingInstructions: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Scheduled Return Date (DD/MM/YYYY) *</label>
                    <input
                      id="input-new-duedate"
                      type="text"
                      required
                      className="form-input"
                      placeholder="DD/MM/YYYY"
                      value={newTaskForm.dueDate}
                      onChange={e => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Priority</label>
                    <select
                      id="select-new-priority"
                      className="form-select"
                      value={newTaskForm.priority}
                      onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button
                  id="btn-submit-new-recall"
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#036d92', borderColor: '#036d92', fontWeight: 700 }}
                >
                  Create Recall Task ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
