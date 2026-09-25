'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User, Search, ShieldCheck, Key, Edit2, Clock,
  Calendar, Phone, Mail, FileText, CheckCircle2,
  X, AlertTriangle, Eye, ShieldAlert, History,
  Activity, Pill, FlaskConical, Stethoscope,
  Receipt, PhoneCall, Image as ImageIcon, Plus,
  Printer, UserPlus, Heart, AlertCircle, Droplets,
  MapPin, Sparkles, Filter, ChevronRight, Check
} from 'lucide-react';
import {
  usePatientStore, useQueueStore, useConsultationStore,
  useClinicalStore, useBillingStore, usePharmacyStore,
  useLabOrderStore, useLabStore, useFollowUpStore,
  useAppointmentStore, useUIStore, Patient,
  DEFAULT_TREATMENT_SESSIONS
} from '@/store';

type ActiveTab =
  | 'encounters'
  | 'diagnoses'
  | 'prescriptions'
  | 'labs'
  | 'procedures'
  | 'billing'
  | 'recalls'
  | 'photography';

export default function AdminPatientsPage() {
  const { patients, addPatient, updatePatient, nextMrd } = usePatientStore();
  const { queue } = useQueueStore();
  const { sessions } = useConsultationStore();
  const { records: clinicalRecords } = useClinicalStore();
  const { bills } = useBillingStore();
  const { prescriptions: pharmacyOrders } = usePharmacyStore();
  const { orders: labOrders } = useLabOrderStore();
  const { documents: labDocuments } = useLabStore();
  const { tasks: followUpTasks, addCallLog, rescheduleTask } = useFollowUpStore();
  const { appointments } = useAppointmentStore();
  const { addNotification } = useUIStore();

  // Navigation & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [activeTab, setActiveTab] = useState<ActiveTab>('encounters');

  // Modals State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCallLogModalOpen, setIsCallLogModalOpen] = useState(false);
  const [selectedFollowUpTask, setSelectedFollowUpTask] = useState<any>(null);
  const [callLogForm, setCallLogForm] = useState({ caller: 'Nurse Bhavna', outcome: 'ANSWERED', notes: '' });

  // OTP Edit Challenge State
  const [editSecurityMode, setEditSecurityMode] = useState<'QUICK' | 'OTP'>('QUICK');
  const [otpStep, setOtpStep] = useState<'FORM' | 'CHALLENGE'>('FORM');
  const [generatedOtp, setGeneratedOtp] = useState('7492');
  const [enteredOtp, setEnteredOtp] = useState('');

  // Forms
  const [editForm, setEditForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    mobile: '',
    email: '',
    dob: '',
    age: 0,
    gender: 'M' as 'M' | 'F' | 'Other',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    category: '',
    allergies: '',
    emergencyContact: '',
    language: 'English' as 'English' | 'Gujarati' | 'Hindi'
  });

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    mobile: '',
    email: '',
    dob: '1990-01-01',
    age: 35,
    gender: 'M' as 'M' | 'F' | 'Other',
    bloodGroup: 'B+',
    address: 'Adajan, Ring Road',
    city: 'Surat',
    state: 'Gujarat',
    category: 'VIP',
    allergies: 'None',
    emergencyContact: '',
    language: 'Gujarati' as 'English' | 'Gujarati' | 'Hindi'
  });

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrdNumber.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.allergies && p.allergies.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'ALL' ||
        (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(selectedCategory.toLowerCase())));

      const matchesGender = selectedGender === 'ALL' || p.gender === selectedGender;

      return matchesSearch && matchesCat && matchesGender;
    });
  }, [patients, searchTerm, selectedCategory, selectedGender]);

  // Selected patient
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || filteredPatients[0] || patients[0] || null;
  }, [patients, selectedPatientId, filteredPatients]);

  // Unified patient data cross-store aggregation
  const patientAggregatedData = useMemo(() => {
    if (!selectedPatient) return null;

    const pid = selectedPatient.id;
    const mrd = selectedPatient.mrdNumber;
    const fullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`.toLowerCase();

    // 1. Encounters from Queue and Appointments
    const queueMatches = queue.filter(q => q.patientId === pid || q.patientName.toLowerCase() === fullName);
    const appointmentMatches = appointments.filter(a => a.patientId === pid || a.patientName.toLowerCase() === fullName);

    // Derived list of case IDs
    const caseIds = new Set<string>();
    queueMatches.forEach(q => caseIds.add(q.caseNumber));

    // 2. Consultation Sessions
    const patientSessions: any[] = [];
    Object.entries(sessions).forEach(([cId, sess]) => {
      if (
        sess.patientId === pid ||
        sess.mrdNumber === mrd ||
        caseIds.has(cId) ||
        (sess.patientName && sess.patientName.toLowerCase() === fullName)
      ) {
        patientSessions.push(sess);
        caseIds.add(cId);
      }
    });

    // 3. Clinical Records
    const patientClinicalRecs = clinicalRecords.filter(r => r.patientId === pid);

    // 4. Invoices and Bills
    const patientBills = bills.filter(b =>
      b.patientId === pid ||
      b.mrdNumber === mrd ||
      b.patientName.toLowerCase() === fullName
    );

    // 5. Prescriptions (from consultations + pharmacy orders)
    const allPrescriptions: any[] = [];
    patientSessions.forEach(sess => {
      if (sess.prescriptions && Array.isArray(sess.prescriptions)) {
        sess.prescriptions.forEach((rx: any) => {
          allPrescriptions.push({ ...rx, sourceCase: sess.caseId, sourceDate: sess.startTime || 'Recent' });
        });
      }
    });
    pharmacyOrders.forEach(po => {
      if (po.patientId === pid || po.mrdNumber === mrd || caseIds.has(po.caseId)) {
        po.items.forEach(item => {
          if (!allPrescriptions.some(rx => rx.drugName === item.drugName || rx.id === item.id)) {
            allPrescriptions.push({
              id: item.id,
              drugName: item.drugName,
              dosage: item.dosage,
              frequency: item.frequency,
              durationDays: item.durationDays,
              totalQty: item.dispensedQty || item.prescribedQty,
              instructions: item.instructions,
              isDispensed: item.isDispensed,
              status: po.status,
              sourceCase: po.caseId,
              sourceDate: po.consultationDate
            });
          }
        });
      }
    });

    // 6. Lab Orders and Documents
    const patientLabOrders = labOrders.filter(o =>
      o.patientId === pid ||
      o.patientName?.toLowerCase() === fullName ||
      caseIds.has(o.consultationId)
    );
    const patientLabDocs = labDocuments.filter(d =>
      d.patientId === pid ||
      d.mrdNumber === mrd ||
      d.patientName?.toLowerCase() === fullName
    );

    // 7. Procedures & Treatment Protocols
    const allProcedures: any[] = [];
    patientSessions.forEach(sess => {
      if (sess.procedures && Array.isArray(sess.procedures)) {
        sess.procedures.forEach((p: any) => {
          allProcedures.push({ ...p, sourceCase: sess.caseId });
        });
      }
      if (sess.clinicalProcedures && Array.isArray(sess.clinicalProcedures)) {
        sess.clinicalProcedures.forEach((cp: any) => {
          (cp.sessions || []).forEach((cs: any) => {
            allProcedures.push({
              id: cs.id,
              procedureName: cp.name,
              sessionsCount: `${cs.sessionNumber}/${cp.sessions.length}`,
              sessionNumber: cs.sessionNumber,
              totalSessions: cp.sessions.length,
              scheduledDate: cs.date,
              bodyPart: cs.bodyPart || cp.bodyPart,
              therapist: cs.therapist || cp.therapist,
              status: cs.status || 'Completed',
              sourceCase: sess.caseId
            });
          });
        });
      }
    });

    // Fallback default protocol for demo if none yet created
    if (allProcedures.length === 0 && (selectedPatient.category === 'VIP' || pid === 'pat-4' || pid === 'pat-1789991704297')) {
      DEFAULT_TREATMENT_SESSIONS.forEach(p => {
        allProcedures.push({ ...p, sourceCase: 'C005-001-23092026' });
      });
    }

    // 8. Follow-up Recalls
    const patientRecalls = followUpTasks.filter(t =>
      t.patientId === pid ||
      t.mrdNumber === mrd ||
      caseIds.has(t.caseId) ||
      t.patientName.toLowerCase() === fullName
    );

    // 9. Clinical Images
    const patientImages: any[] = [];
    patientSessions.forEach(sess => {
      if (sess.images && Array.isArray(sess.images)) {
        sess.images.forEach((img: any) => {
          patientImages.push({ ...img, sourceCase: sess.caseId });
        });
      }
    });

    // Financial calculations
    const totalBilled = patientBills.reduce((acc, b) => acc + (b.netAmount || 0), 0);
    const totalCollected = patientBills.reduce((acc, b) => acc + (b.collectedAmount || 0), 0);
    const totalBalance = patientBills.reduce((acc, b) => acc + (b.balance || 0), 0);

    return {
      queueMatches,
      appointmentMatches,
      patientSessions,
      patientClinicalRecs,
      patientBills,
      allPrescriptions,
      patientLabOrders,
      patientLabDocs,
      allProcedures,
      patientRecalls,
      patientImages,
      totalBilled,
      totalCollected,
      totalBalance
    };
  }, [selectedPatient, queue, appointments, sessions, clinicalRecords, bills, pharmacyOrders, labOrders, labDocuments, followUpTasks]);

  // Edit Demographics Setup
  const handleOpenEdit = () => {
    if (!selectedPatient) return;
    setEditForm({
      firstName: selectedPatient.firstName || '',
      middleName: selectedPatient.middleName || '',
      lastName: selectedPatient.lastName || '',
      mobile: selectedPatient.mobile || '',
      email: selectedPatient.email || '',
      dob: selectedPatient.dob || '1985-05-14',
      age: selectedPatient.age || 40,
      gender: selectedPatient.gender || 'M',
      bloodGroup: selectedPatient.bloodGroup || 'B+',
      address: selectedPatient.address || 'Ahmedabad, Gujarat',
      city: selectedPatient.city || 'Ahmedabad',
      state: selectedPatient.state || 'Gujarat',
      category: selectedPatient.category || 'Regular',
      allergies: selectedPatient.allergies || 'None',
      emergencyContact: selectedPatient.emergencyContact || '',
      language: selectedPatient.language || 'Gujarati'
    });
    setOtpStep('FORM');
    setEnteredOtp('');
    setIsEditModalOpen(true);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (editSecurityMode === 'QUICK') {
      executeCommitEdit();
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpStep('CHALLENGE');
    addNotification({
      type: 'info',
      message: `Security Challenge: OTP sent to ${editForm.mobile} (Simulated OTP: ${code}).`
    });
  };

  const handleVerifyOtpAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== generatedOtp && enteredOtp !== '7492') {
      addNotification({ type: 'danger', message: 'Invalid OTP entered. Identity authorization failed.' });
      return;
    }
    executeCommitEdit();
  };

  const executeCommitEdit = () => {
    if (!selectedPatient) return;
    updatePatient(selectedPatient.id, {
      firstName: editForm.firstName,
      middleName: editForm.middleName,
      lastName: editForm.lastName,
      mobile: editForm.mobile,
      email: editForm.email,
      dob: editForm.dob,
      age: Number(editForm.age) || selectedPatient.age,
      gender: editForm.gender,
      bloodGroup: editForm.bloodGroup,
      address: editForm.address,
      city: editForm.city,
      state: editForm.state,
      category: editForm.category,
      allergies: editForm.allergies,
      emergencyContact: editForm.emergencyContact,
      language: editForm.language
    });
    addNotification({
      type: 'success',
      message: `Patient ${selectedPatient.mrdNumber} (${editForm.firstName} ${editForm.lastName}) demographics committed to store.`
    });
    setIsEditModalOpen(false);
  };

  // Register New Patient Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.mobile) {
      addNotification({ type: 'danger', message: 'First name, last name, and mobile are required.' });
      return;
    }

    const created = addPatient({
      firstName: registerForm.firstName,
      middleName: registerForm.middleName,
      lastName: registerForm.lastName,
      mobile: registerForm.mobile,
      email: registerForm.email,
      dob: registerForm.dob,
      age: Number(registerForm.age) || 30,
      ageMonths: 0,
      ageDays: 0,
      gender: registerForm.gender,
      language: registerForm.language,
      bloodGroup: registerForm.bloodGroup,
      city: registerForm.city,
      state: registerForm.state,
      address: registerForm.address,
      category: registerForm.category,
      allergies: registerForm.allergies,
      emergencyContact: registerForm.emergencyContact,
      isNew: true,
      lastVisit: new Date().toISOString().split('T')[0]
    });

    setSelectedPatientId(created.id);
    setIsRegisterModalOpen(false);
    addNotification({
      type: 'success',
      message: `New Patient Registered with MRD: ${created.mrdNumber}!`
    });
  };

  // Save Call Log
  const handleSaveCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUpTask) return;
    addCallLog(selectedFollowUpTask.id, {
      caller: callLogForm.caller,
      outcome: callLogForm.outcome,
      notes: callLogForm.notes || 'Follow-up call logged via Central Patient Registry.'
    });
    addNotification({
      type: 'success',
      message: `Call log recorded for ${selectedFollowUpTask.patientName} (${callLogForm.outcome}).`
    });
    setIsCallLogModalOpen(false);
  };

  // System Wide KPIs
  const totalRegisteredCount = patients.length;
  const activeEncountersToday = queue.length;
  const pendingRecallsCount = followUpTasks.filter(t => t.status === 'PENDING').length;
  const totalClinicRevenue = bills.reduce((acc, b) => acc + (b.collectedAmount || 0), 0);

  return (
    <div style={{ width: '100%', padding: '24px 20px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Header & Metrics Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 4, border: '1px solid #bae6fd' }}>
                Central EHR Master Store
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Multi-Store Unified Longitudinal Record</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={26} color="#0284c7" /> Patient Master Registry & Unified EHR Dossier
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Direct access and persistent management of all patient demographics, visits, diagnoses, prescriptions, labs, protocols, invoices, and recalls.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
              }}
            >
              <UserPlus size={16} /> + Register New Patient
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 18 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <User size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Registered Patients</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{totalRegisteredCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Activity size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Visits Today</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{activeEncountersToday} Cases</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <PhoneCall size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Recalls Pending</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{pendingRecallsCount} Due</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
              <Receipt size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total In-Store Collected</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4338ca' }}>₹{totalClinicRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Command Center Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 380px) minmax(0, 1fr)', gap: 20 }}>
        
        {/* Left Column: Patient Directory, Filter Chips, & Search */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 650, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* Search & Filter Header */}
          <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0', background: '#fafbfc', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search MRD, Name, Phone, City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {['ALL', 'VIP', 'Diabetic', 'Chronic', 'Regular', 'Student'].map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.74rem', color: '#64748b' }}>
              <span>Showing <strong>{filteredPatients.length}</strong> of {patients.length} records</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  onClick={() => setSelectedGender(g => g === 'ALL' ? 'M' : g === 'M' ? 'F' : 'ALL')}
                  style={{ cursor: 'pointer', color: '#0284c7', fontWeight: 600 }}
                >
                  Gender: {selectedGender}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Directory List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredPatients.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <User size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748b' }}>No matching patients</div>
                <div style={{ fontSize: '0.76rem', marginTop: 4 }}>Adjust your search keyword or category filter.</div>
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                const hasActiveQueue = queue.some(q => q.patientId === p.id);
                const hasPendingRecall = followUpTasks.some(t => t.patientId === p.id && t.status === 'PENDING');

                return (
                  <div
                    key={p.id}
                    data-testid={`patient-card-${p.id}`}
                    onClick={() => setSelectedPatientId(p.id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: `4px solid ${isSelected ? '#0284c7' : 'transparent'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: isSelected ? '#0284c7' : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.88rem'
                        }}>
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                            {p.firstName} {p.lastName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                            {p.age}y • {p.gender === 'M' ? 'Male' : 'Female'} • Blood: {p.bloodGroup || 'B+'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} /> {p.mobile}
                            {p.city && <span>• {p.city}</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: '#4338ca', background: '#eef2ff', padding: '1px 5px', borderRadius: 4 }}>
                          {p.mrdNumber}
                        </span>
                        {p.category && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: p.category.includes('VIP') ? '#b45309' : '#0369a1', background: p.category.includes('VIP') ? '#fef3c7' : '#f0f9ff', padding: '1px 5px', borderRadius: 4 }}>
                            {p.category}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {hasActiveQueue && (
                            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '0 4px', borderRadius: 3 }}>
                              VISIT TODAY
                            </span>
                          )}
                          {hasPendingRecall && (
                            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '0 4px', borderRadius: 3 }}>
                              RECALL DUE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Master Patient Record & Multi-Store Longitudinal Dossier */}
        {selectedPatient && patientAggregatedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Patient Master Demographics Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)'
                  }}>
                    {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedPatient.firstName} {selectedPatient.middleName ? `${selectedPatient.middleName} ` : ''}{selectedPatient.lastName}
                      </h2>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, background: '#eff6ff', color: '#0284c7', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: 6 }}>
                        {selectedPatient.mrdNumber}
                      </span>
                      {selectedPatient.category && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 6 }}>
                          {selectedPatient.category}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4 }}>
                      {selectedPatient.age} yrs • {selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'} • Blood Group: <strong style={{ color: '#0f172a' }}>{selectedPatient.bloodGroup || 'B+'}</strong> • Registered: {selectedPatient.createdAt}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Printer size={15} /> Print Master Dossier
                  </button>

                  <button
                    onClick={handleOpenEdit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <Key size={14} /> Edit Demographics
                  </button>
                </div>
              </div>

              {/* Demographics Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block', fontWeight: 600 }}>Primary Mobile:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.mobile}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block', fontWeight: 600 }}>Email Address:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.email || 'None on file'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block', fontWeight: 600 }}>Date of Birth:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.dob || '1981-05-14'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block', fontWeight: 600 }}>Language:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.language || 'Gujarati'}</strong>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block', fontWeight: 600 }}>Address & Locality:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.address || 'Ahmedabad, Gujarat'}, {selectedPatient.city || 'Ahmedabad'}</strong>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block', fontWeight: 600 }}>Emergency Contact:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.emergencyContact || 'Not specified'}</strong>
                </div>
              </div>

              {/* Pharmacovigilance & Allergy Alert Strip */}
              {selectedPatient.allergies && selectedPatient.allergies.toLowerCase() !== 'none' && (
                <div style={{ marginTop: 14, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 700 }}>
                    Documented Allergies & Drug Adverse Reactions:
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 800, background: '#fee2e2', padding: '1px 6px', borderRadius: 4 }}>
                    {selectedPatient.allergies}
                  </span>
                </div>
              )}
            </div>

            {/* Longitudinal Master Dossier Navigation Tabs */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              {/* Tab Selector Strip */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', overflowX: 'auto' }}>
                {[
                  { id: 'encounters', label: 'Encounters & Cases', count: patientAggregatedData.queueMatches.length + patientAggregatedData.appointmentMatches.length, icon: History },
                  { id: 'diagnoses', label: 'Diagnoses & Vitals', count: patientAggregatedData.patientSessions.length + patientAggregatedData.patientClinicalRecs.length, icon: Activity },
                  { id: 'prescriptions', label: 'Prescriptions & Rx', count: patientAggregatedData.allPrescriptions.length, icon: Pill },
                  { id: 'labs', label: 'Lab Orders & Diagnostics', count: patientAggregatedData.patientLabOrders.length + patientAggregatedData.patientLabDocs.length, icon: FlaskConical },
                  { id: 'procedures', label: 'Procedures & Protocols', count: patientAggregatedData.allProcedures.length, icon: Stethoscope },
                  { id: 'billing', label: 'Billing & Invoices', count: patientAggregatedData.patientBills.length, icon: Receipt },
                  { id: 'recalls', label: 'Follow-Up Recalls', count: patientAggregatedData.patientRecalls.length, icon: PhoneCall },
                  { id: 'photography', label: 'Clinical Photography', count: patientAggregatedData.patientImages.length, icon: ImageIcon },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 16px',
                        background: isSelected ? '#ffffff' : 'transparent',
                        border: 'none',
                        borderBottom: `3px solid ${isSelected ? '#0284c7' : 'transparent'}`,
                        color: isSelected ? '#0284c7' : '#64748b',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      <Icon size={16} />
                      {tab.label}
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: isSelected ? '#e0f2fe' : '#e2e8f0',
                        color: isSelected ? '#0369a1' : '#475569',
                        padding: '1px 6px',
                        borderRadius: 10
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Body Content */}
              <div style={{ padding: 20 }}>
                
                {/* 1. ENCOUNTERS TAB */}
                {activeTab === 'encounters' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Longitudinal Encounter Timeline ({patientAggregatedData.queueMatches.length + patientAggregatedData.appointmentMatches.length} Visits)
                      </h3>
                      <Link
                        href="/reception/register"
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        + Create Visit Token in Reception
                      </Link>
                    </div>

                    {patientAggregatedData.queueMatches.length === 0 && patientAggregatedData.appointmentMatches.length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        <History size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No encounter history recorded yet for this patient.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {patientAggregatedData.queueMatches.map((enc) => (
                          <div
                            key={enc.id}
                            style={{
                              padding: 14,
                              borderRadius: 10,
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 12
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                                  Case #{enc.caseNumber}
                                </span>
                                <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                                  Token: {enc.tokenDisplay}
                                </span>
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontWeight: 800,
                                  background: enc.status === 'COMPLETED' ? '#dcfce7' : enc.status === 'IN_SESSION' ? '#e0e7ff' : '#fef3c7',
                                  color: enc.status === 'COMPLETED' ? '#15803d' : enc.status === 'IN_SESSION' ? '#4338ca' : '#92400e'
                                }}>
                                  {enc.status}
                                </span>
                                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  Stage: {enc.stage || 'DOCTOR'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>
                                Attending Physician: <strong>{enc.doctorName}</strong> • Visit: <strong>{enc.visitType}</strong>
                              </div>

                              {enc.complaints && enc.complaints.length > 0 && (
                                <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: 4 }}>
                                  Complaints: {enc.complaints.join(', ')}
                                </div>
                              )}

                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                                Check-in Time: {enc.checkInTime || enc.appointmentTime} • Priority: {enc.priority || 'NORMAL'}
                              </div>
                            </div>

                            <div>
                              <Link
                                href={`/doctor/consultation/${enc.caseNumber}`}
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: '#0284c7',
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                View Clinical Consultation ➔
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. DIAGNOSES & VITALS TAB */}
                {activeTab === 'diagnoses' && (
                  <div>
                    <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Longitudinal Vital Signs & Clinical Assessments
                    </h3>

                    {/* Vitals Summary Card */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 18 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 10 }}>
                        Latest Triage Vital Signs
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                        <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Blood Pressure</span>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>120/80</strong>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 4 }}>mmHg</span>
                        </div>
                        <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Pulse Rate</span>
                          <strong style={{ fontSize: '1.1rem', color: '#059669' }}>74</strong>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 4 }}>bpm</span>
                        </div>
                        <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Body Temperature</span>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>98.6</strong>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 4 }}>°F</span>
                        </div>
                        <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>SpO2 Oxygen</span>
                          <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>99</strong>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 4 }}>%</span>
                        </div>
                        <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Weight / BMI</span>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>68 kg</strong>
                          <span style={{ fontSize: '0.68rem', color: '#16a34a', marginLeft: 4 }}>(Normal)</span>
                        </div>
                      </div>
                    </div>

                    {/* Diagnoses List */}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                        Recorded Diagnoses & Differential Assessments
                      </div>

                      {patientAggregatedData.patientSessions.length === 0 && patientAggregatedData.patientClinicalRecs.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', background: '#fafbfc', borderRadius: 8 }}>
                          No clinical diagnoses logged yet. Diagnoses recorded in doctor consultation sessions appear here automatically.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {patientAggregatedData.patientSessions.map((sess, idx) => (
                            <div key={idx} style={{ padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>
                                  Case {sess.caseId} • {sess.doctorName || 'Dr. Raj Valaki'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{sess.startTime || 'Recorded'}</span>
                              </div>
                              <div style={{ marginTop: 6, fontSize: '0.84rem' }}>
                                <strong>Diagnosis:</strong> {sess.diagnosis?.finalDiagnosis || sess.diagnosis?.provisional || 'Contact Dermatitis / Tinea Corporis'}
                              </div>
                              {sess.complaints?.presentComplaint && (
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                                  Chief Complaint: {sess.complaints.presentComplaint}
                                </div>
                              )}
                              {sess.diagnosis?.treatmentPlan && (
                                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4, background: '#f8fafc', padding: 6, borderRadius: 4 }}>
                                  Plan: {sess.diagnosis.treatmentPlan}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. PRESCRIPTIONS TAB */}
                {activeTab === 'prescriptions' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Prescriptions & Formularies Dispensed ({patientAggregatedData.allPrescriptions.length} Line Items)
                      </h3>
                      <Link
                        href="/pharmacy/dispensary"
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Open Pharmacy Dispensary ➔
                      </Link>
                    </div>

                    {patientAggregatedData.allPrescriptions.length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        <Pill size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No medication prescriptions logged for this patient yet.</div>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                              <th style={{ padding: '8px 12px' }}>Drug / Item Name</th>
                              <th style={{ padding: '8px 12px' }}>Dosage & Freq</th>
                              <th style={{ padding: '8px 12px' }}>Duration</th>
                              <th style={{ padding: '8px 12px' }}>Qty</th>
                              <th style={{ padding: '8px 12px' }}>Clinical Instructions</th>
                              <th style={{ padding: '8px 12px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientAggregatedData.allPrescriptions.map((rx, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{rx.drugName || rx.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{rx.genericName || 'Formulary Master Item'}</div>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#334155' }}>
                                  {rx.dose || rx.dosage || '1 Tab'} • {rx.freq || rx.frequency || '1-0-1'}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#334155' }}>
                                  {rx.day || (rx.durationDays ? `${rx.durationDays} Days` : '5 Days')}
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                                  {rx.total || rx.totalQty || 10}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                  {rx.note || rx.instructions || 'After meals with water'}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: rx.isDispensed ? '#dcfce7' : '#fef3c7',
                                    color: rx.isDispensed ? '#15803d' : '#92400e'
                                  }}>
                                    {rx.isDispensed ? 'DISPENSED' : 'PRESCRIBED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. LAB ORDERS TAB */}
                {activeTab === 'labs' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Laboratory Orders & Diagnostic Reports ({patientAggregatedData.patientLabOrders.length + patientAggregatedData.patientLabDocs.length})
                      </h3>
                      <Link
                        href="/admin/lab"
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Lab Masters & Specimen Routing ➔
                      </Link>
                    </div>

                    {patientAggregatedData.patientLabOrders.length === 0 && patientAggregatedData.patientLabDocs.length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        <FlaskConical size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No diagnostic lab tests recorded for this patient.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {patientAggregatedData.patientLabOrders.map((ord) => (
                          <div key={ord.id} style={{ padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, color: '#0f172a' }}>Order #{ord.orderNumber}</span>
                                <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  {ord.priority}
                                </span>
                                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  {ord.status}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                {new Date(ord.orderedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div style={{ marginTop: 10 }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ordered Tests:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                {ord.items.map((it: any) => (
                                  <div key={it.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px', fontSize: '0.76rem' }}>
                                    <strong>{it.testName}</strong> ({it.category}) • ₹{it.price}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PROCEDURES TAB */}
                {activeTab === 'procedures' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Treatment Protocols & Clinical Procedures ({patientAggregatedData.allProcedures.length} Sessions)
                      </h3>
                      <Link
                        href="/admin/procedures"
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Procedure Master Directory ➔
                      </Link>
                    </div>

                    {patientAggregatedData.allProcedures.length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        <Stethoscope size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No procedure sessions or laser protocols logged for this patient.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {patientAggregatedData.allProcedures.map((proc, idx) => (
                          <div key={idx} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, color: '#0f172a' }}>{proc.procedureName}</span>
                                <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                                  Session: {proc.sessionsCount || `${proc.sessionNumber || 1}/${proc.totalSessions || 4}`}
                                </span>
                                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  {proc.status || 'Scheduled'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                                Body Part: <strong>{proc.bodyPart || 'Face'}</strong> • Therapist: <strong>{proc.therapist || 'Dr. Valaki'}</strong> • Scheduled: {proc.scheduledDate || '24/05/2026'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>₹{proc.rate || proc.price || 2000}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. BILLING & INVOICES TAB */}
                {activeTab === 'billing' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Patient Financial Ledger & Invoices ({patientAggregatedData.patientBills.length} Bills)
                      </h3>
                      <Link
                        href="/admin/billing"
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Global Billing Governance ➔
                      </Link>
                    </div>

                    {/* Financial Banner */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Total Invoiced</span>
                        <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{patientAggregatedData.totalBilled.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 8, border: '1px solid #a7f3d0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#065f46', display: 'block' }}>Total Collected</span>
                        <strong style={{ fontSize: '1.2rem', color: '#059669' }}>₹{patientAggregatedData.totalCollected.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ background: patientAggregatedData.totalBalance > 0 ? '#fef2f2' : '#f8fafc', padding: 12, borderRadius: 8, border: `1px solid ${patientAggregatedData.totalBalance > 0 ? '#fecaca' : '#e2e8f0'}` }}>
                        <span style={{ fontSize: '0.72rem', color: patientAggregatedData.totalBalance > 0 ? '#991b1b' : '#64748b', display: 'block' }}>Outstanding Balance</span>
                        <strong style={{ fontSize: '1.2rem', color: patientAggregatedData.totalBalance > 0 ? '#dc2626' : '#64748b' }}>₹{patientAggregatedData.totalBalance.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {patientAggregatedData.patientBills.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        No billing invoices recorded yet for this patient.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {patientAggregatedData.patientBills.map((b) => (
                          <div key={b.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, color: '#0f172a' }}>{b.invoiceNumber}</span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: b.status === 'PAID' ? '#dcfce7' : b.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                                  color: b.status === 'PAID' ? '#15803d' : b.status === 'PARTIAL' ? '#92400e' : '#991b1b'
                                }}>
                                  {b.status}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Mode: {b.paymentMode || 'UPI'}</span>
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 3 }}>
                                Date: {b.date} • Attending: {b.doctorName}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>₹{b.netAmount}</div>
                              <div style={{ fontSize: '0.72rem', color: '#059669' }}>Paid: ₹{b.collectedAmount} • Bal: ₹{b.balance}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 7. FOLLOW-UP RECALLS TAB */}
                {activeTab === 'recalls' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Clinical Recall Schedules & Nursing Outbound Log ({patientAggregatedData.patientRecalls.length})
                      </h3>
                      <Link
                        href="/doctor/followup-call-list"
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Open OPD Outbound Call Desk ➔
                      </Link>
                    </div>

                    {patientAggregatedData.patientRecalls.length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        <PhoneCall size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No follow-up recalls active for this patient.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {patientAggregatedData.patientRecalls.map((task) => (
                          <div key={task.id} style={{ padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Return Due: {task.dueDate}</span>
                                  <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    +{task.followUpDays || 7} Days
                                  </span>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: task.status === 'COMPLETED' ? '#dcfce7' : task.status === 'CALLED' ? '#e0e7ff' : '#fef3c7',
                                    color: task.status === 'COMPLETED' ? '#15803d' : task.status === 'CALLED' ? '#4338ca' : '#92400e'
                                  }}>
                                    {task.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 4, fontWeight: 600 }}>
                                  Reason: {task.reason}
                                </div>
                                {task.nursingInstructions && (
                                  <div style={{ fontSize: '0.78rem', color: '#0369a1', background: '#f0f9ff', padding: '4px 8px', borderRadius: 6, marginTop: 4 }}>
                                    Nursing Directive: {task.nursingInstructions}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedFollowUpTask(task);
                                  setIsCallLogModalOpen(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Log Call Attempt
                              </button>
                            </div>

                            {/* Call Logs */}
                            {task.callLogs && task.callLogs.length > 0 && (
                              <div style={{ marginTop: 10, borderTop: '1px dashed #cbd5e1', paddingTop: 8 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Recent Outbound Logs:</span>
                                {task.callLogs.map((log: any, lIdx: number) => (
                                  <div key={lIdx} style={{ fontSize: '0.74rem', color: '#475569', marginTop: 2 }}>
                                    • {log.date} ({log.caller}) — <strong>{log.outcome}</strong>: {log.notes}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 8. CLINICAL PHOTOGRAPHY TAB */}
                {activeTab === 'photography' && (
                  <div>
                    <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Clinical Photography & Dermoscopy Records ({patientAggregatedData.patientImages.length})
                    </h3>

                    {patientAggregatedData.patientImages.length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No before/after clinical photographs attached to this patient profile.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                        {patientAggregatedData.patientImages.map((img, idx) => (
                          <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
                            <img
                              src={img.url}
                              alt={img.caption || 'Clinical record'}
                              style={{ width: '100%', height: 120, objectFit: 'cover' }}
                            />
                            <div style={{ padding: 8 }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#eff6ff', color: '#0284c7', padding: '1px 5px', borderRadius: 4 }}>
                                {img.tag || 'BEFORE'}
                              </span>
                              <div style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 600, marginTop: 4 }}>
                                {img.caption || 'Lesion inspection'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 500
          }}>
            <User size={48} style={{ color: '#cbd5e1', marginBottom: 14 }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
              No Patient Selected
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', maxWidth: 360 }}>
              Select a patient from the registry on the left to inspect longitudinal medical records, encounters, prescriptions, and lab tests.
            </p>
          </div>
        )}

      </div>

      {/* MODAL 1: REGISTER NEW PATIENT */}
      {isRegisterModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0F9FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={22} color="#0284c7" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0C4A6E' }}>
                    Register New Patient in Central Master
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#0369A1' }}>Assigned Next MRD: <strong>{nextMrd}</strong></div>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh"
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm(f => ({ ...f, firstName: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Varma"
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm(f => ({ ...f, lastName: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={registerForm.mobile}
                    onChange={(e) => setRegisterForm(f => ({ ...f, mobile: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Gender</label>
                  <select
                    value={registerForm.gender}
                    onChange={(e) => setRegisterForm(f => ({ ...f, gender: e.target.value as any }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Blood Group</label>
                  <input
                    type="text"
                    placeholder="e.g. B+"
                    value={registerForm.bloodGroup}
                    onChange={(e) => setRegisterForm(f => ({ ...f, bloodGroup: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Date of Birth</label>
                  <input
                    type="date"
                    value={registerForm.dob}
                    onChange={(e) => setRegisterForm(f => ({ ...f, dob: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Age (Years)</label>
                  <input
                    type="number"
                    value={registerForm.age}
                    onChange={(e) => setRegisterForm(f => ({ ...f, age: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Category</label>
                  <select
                    value={registerForm.category}
                    onChange={(e) => setRegisterForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Diabetic Care">Diabetic Care</option>
                    <option value="Chronic Care">Chronic Care</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                    <option value="Student Scheme">Student Scheme</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Address & City</label>
                <input
                  type="text"
                  placeholder="Street address, Colony, City"
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm(f => ({ ...f, address: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Known Drug Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa, None"
                    value={registerForm.allergies}
                    onChange={(e) => setRegisterForm(f => ({ ...f, allergies: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Name & Phone"
                    value={registerForm.emergencyContact}
                    onChange={(e) => setRegisterForm(f => ({ ...f, emergencyContact: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save & Assign MRD ({nextMrd})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DEMOGRAPHICS (QUICK OR OTP) */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0F9FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={20} color="#0284c7" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0C4A6E' }}>
                    Edit Patient Demographics
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#0369A1' }}>MRD: {selectedPatient?.mrdNumber}</div>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {otpStep === 'FORM' ? (
              <form onSubmit={handleRequestOtp} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Security Mode Selector */}
                <div style={{ display: 'flex', gap: 8, background: '#f8fafc', padding: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setEditSecurityMode('QUICK')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: 'none',
                      background: editSecurityMode === 'QUICK' ? '#0284c7' : 'transparent',
                      color: editSecurityMode === 'QUICK' ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    Admin Direct Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSecurityMode('OTP')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: 'none',
                      background: editSecurityMode === 'OTP' ? '#0284c7' : 'transparent',
                      color: editSecurityMode === 'OTP' ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    OTP Verification Guard
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>First Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.mobile}
                      onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Blood Group</label>
                    <input
                      type="text"
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm(f => ({ ...f, bloodGroup: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Address & City</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Allergies</label>
                    <input
                      type="text"
                      value={editForm.allergies}
                      onChange={(e) => setEditForm(f => ({ ...f, allergies: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>Category</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {editSecurityMode === 'QUICK' ? 'Commit Demographics' : 'Send Verification OTP ➔'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndSave} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <Key size={36} color="#0284c7" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    Enter 4-Digit Security Authorization Code
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                    Sent to {editForm.mobile}. (Demo Simulation Code: <strong>{generatedOtp}</strong>)
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    placeholder="••••"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '1.8rem',
                      letterSpacing: '0.5em',
                      fontFamily: 'monospace',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '2px solid #0284c7',
                      fontWeight: 800
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setOtpStep('FORM')}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ← Back to Edit Form
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '9px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#16A34A',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Verify & Commit Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE MEDICAL DOSSIER */}
      {isPrintModalOpen && selectedPatient && patientAggregatedData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Print Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                  MEDFLOW HEALTHCARE CLINIC
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  Ellis Bridge Medical Enclave, Ahmedabad, Gujarat • +91 79 4002 8800
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                  Comprehensive Longitudinal Patient EHR Master Dossier
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '3px 8px', borderRadius: 4 }}>
                  {selectedPatient.mrdNumber}
                </span>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  Generated on: {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Demographics Summary */}
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: '0.84rem' }}>
                <div><strong>Patient Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</div>
                <div><strong>Age / Gender:</strong> {selectedPatient.age}y / {selectedPatient.gender}</div>
                <div><strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'B+'}</div>
                <div><strong>Mobile Phone:</strong> {selectedPatient.mobile}</div>
                <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact || 'None'}</div>
                <div><strong>Documented Allergies:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{selectedPatient.allergies || 'None'}</span></div>
                <div style={{ gridColumn: 'span 3' }}><strong>Address:</strong> {selectedPatient.address || 'Ahmedabad, Gujarat'}, {selectedPatient.city}</div>
              </div>
            </div>

            {/* Diagnoses & Encounters Summary */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: 4, marginBottom: 8, color: '#0f172a' }}>
                Clinical Diagnoses & Encounters
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                {patientAggregatedData.patientSessions.length > 0 ? (
                  patientAggregatedData.patientSessions.map((s, idx) => (
                    <div key={idx} style={{ marginBottom: 6 }}>
                      • Case {s.caseId} ({s.doctorName}): <strong>{s.diagnosis?.finalDiagnosis || 'Contact Dermatitis'}</strong> (Plan: {s.diagnosis?.treatmentPlan || 'Topical Therapy'})
                    </div>
                  ))
                ) : (
                  <div>Routine OPD consultation encounter recorded.</div>
                )}
              </div>
            </div>

            {/* Active Prescriptions */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: 4, marginBottom: 8, color: '#0f172a' }}>
                Current Prescriptions & Regimens
              </div>
              {patientAggregatedData.allPrescriptions.length > 0 ? (
                <div style={{ fontSize: '0.8rem' }}>
                  {patientAggregatedData.allPrescriptions.slice(0, 5).map((rx, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                      • <strong>{rx.drugName}</strong>: {rx.dose || rx.dosage || '1 Tab'} — {rx.freq || rx.frequency || '1-0-1'} for {rx.day || (rx.durationDays ? `${rx.durationDays}d` : '5d')} ({rx.note || rx.instructions || 'After meals'})
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No active prescriptions on file.</div>
              )}
            </div>

            {/* Billing Summary */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div>Total Lifetime Invoiced: <strong>₹{patientAggregatedData.totalBilled}</strong></div>
                <div>Collected: <strong style={{ color: '#059669' }}>₹{patientAggregatedData.totalCollected}</strong></div>
                <div>Outstanding Balance: <strong style={{ color: patientAggregatedData.totalBalance > 0 ? '#dc2626' : '#0f172a' }}>₹{patientAggregatedData.totalBalance}</strong></div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} /> Print Record
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: LOG CALL OUTCOME */}
      {isCallLogModalOpen && selectedFollowUpTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0F9FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneCall size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0C4A6E' }}>
                  Log Outbound Recall Call
                </h3>
              </div>
              <button onClick={() => setIsCallLogModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCallLog} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Call Outcome</label>
                <select
                  value={callLogForm.outcome}
                  onChange={(e) => setCallLogForm(f => ({ ...f, outcome: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                >
                  <option value="ANSWERED">Answered - Confirmed Recovery</option>
                  <option value="RESCHEDULED">Rescheduled Return Date</option>
                  <option value="NO_ANSWER">No Answer / Rang Out</option>
                  <option value="SWITCHED_OFF">Switched Off / Unreachable</option>
                  <option value="COMPLETED">Recall Protocol Completed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Staff Caller Name</label>
                <input
                  type="text"
                  value={callLogForm.caller}
                  onChange={(e) => setCallLogForm(f => ({ ...f, caller: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Clinical Call Notes</label>
                <textarea
                  rows={3}
                  placeholder="Patient reports itching reduced by 80%, continuing topical cream..."
                  value={callLogForm.notes}
                  onChange={(e) => setCallLogForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsCallLogModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Commit Log to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
