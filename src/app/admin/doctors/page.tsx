'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Stethoscope, Plus, Search, Filter, CheckCircle2,
  Calendar, Clock, DollarSign, Building, Edit2, Trash2,
  X, Shield, User, AlertCircle, Phone, Mail, Award,
  Sparkles, Check, ArrowRight, Video, AlertTriangle,
  RotateCcw, Sliders, LayoutGrid, List, Download, Tag
} from 'lucide-react';
import { useDoctorStore, useUIStore, Doctor } from '@/store';

export default function AdminDoctorsPage() {
  const {
    doctors,
    addDoctor,
    updateDoctor,
    updateConsultationFee,
    toggleDoctorStatus,
    deleteDoctor
  } = useDoctorStore();

  const { addNotification } = useUIStore();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'FEE_DESC' | 'FEE_ASC' | 'SPECIALTY'>('NAME');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeDoctor, setFeeDoctor] = useState<Doctor | null>(null);
  const [feeForm, setFeeForm] = useState({
    consultationFee: 500,
    followUpFee: 300,
    emergencyFee: 800,
    teleconsultationFee: 450,
    followUpValidityDays: 7
  });

  // Full Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    specialization: 'Internal & General Medicine',
    qualification: 'MBBS, MD',
    registrationNumber: 'G-10001',
    email: '',
    phone: '',
    room: 'Cabin 1 (Room 101)',
    schedule: 'Mon–Sat: 09:00 AM – 01:00 PM & 04:00 PM – 08:00 PM',
    slotDurationMins: 15,
    consultationFee: 500,
    followUpFee: 300,
    emergencyFee: 800,
    teleconsultationFee: 450,
    followUpValidityDays: 7,
    status: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE'
  });

  // Unique specialities for filter
  const specialitiesList = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach(d => { if (d.specialization) set.add(d.specialization); });
    return Array.from(set);
  }, [doctors]);

  // Governance KPIs
  const activeCount = useMemo(() => doctors.filter(d => d.status === 'ACTIVE').length, [doctors]);
  const avgFee = useMemo(() => {
    if (doctors.length === 0) return 0;
    const sum = doctors.reduce((acc, d) => acc + (d.consultationFee || 0), 0);
    return Math.round(sum / doctors.length);
  }, [doctors]);
  const avgFollowUpFee = useMemo(() => {
    if (doctors.length === 0) return 0;
    const sum = doctors.reduce((acc, d) => acc + (d.followUpFee || 0), 0);
    return Math.round(sum / doctors.length);
  }, [doctors]);
  const minFee = useMemo(() => Math.min(...doctors.map(d => d.consultationFee || 500)), [doctors]);
  const maxFee = useMemo(() => Math.max(...doctors.map(d => d.consultationFee || 500)), [doctors]);

  // Filtered & Sorted doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        (doc.room || '').toLowerCase().includes(q) ||
        (doc.qualification || '').toLowerCase().includes(q) ||
        (doc.registrationNumber || '').toLowerCase().includes(q);

      const matchSpecialty = selectedSpecialty === 'ALL' || doc.specialization === selectedSpecialty;
      const matchStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;

      return matchSearch && matchSpecialty && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      if (sortBy === 'FEE_DESC') return (b.consultationFee || 0) - (a.consultationFee || 0);
      if (sortBy === 'FEE_ASC') return (a.consultationFee || 0) - (b.consultationFee || 0);
      if (sortBy === 'SPECIALTY') return a.specialization.localeCompare(b.specialization);
      return 0;
    });
  }, [doctors, searchTerm, selectedSpecialty, selectedStatus, sortBy]);

  // Open Add Doctor Modal
  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setProfileForm({
      name: 'Dr. ',
      specialization: 'Internal & General Medicine',
      qualification: 'MBBS, MD',
      registrationNumber: 'G-10001',
      email: '',
      phone: '+91 98251 ',
      room: 'Cabin 1 (Room 101)',
      schedule: 'Mon–Sat: 09:00 AM – 01:00 PM & 04:00 PM – 08:00 PM',
      slotDurationMins: 15,
      consultationFee: 500,
      followUpFee: 300,
      emergencyFee: 800,
      teleconsultationFee: 450,
      followUpValidityDays: 7,
      status: 'ACTIVE'
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Doctor Modal
  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setProfileForm({
      name: doc.name,
      specialization: doc.specialization,
      qualification: doc.qualification || 'MBBS, MD',
      registrationNumber: doc.registrationNumber || 'G-10001',
      email: doc.email || '',
      phone: doc.phone || '',
      room: doc.room || 'Cabin 1 (Room 101)',
      schedule: doc.schedule || 'Mon–Sat: 09:00 AM – 01:00 PM',
      slotDurationMins: doc.slotDurationMins || 15,
      consultationFee: doc.consultationFee || 500,
      followUpFee: doc.followUpFee || 300,
      emergencyFee: doc.emergencyFee || 800,
      teleconsultationFee: doc.teleconsultationFee || 450,
      followUpValidityDays: doc.followUpValidityDays || 7,
      status: (doc.status as any) || 'ACTIVE'
    });
    setIsAddEditModalOpen(true);
  };

  // Save Add/Edit Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;

    if (editingDoctor) {
      updateDoctor(editingDoctor.id, profileForm);
      const msg = `${profileForm.name} profile and consultation fees updated successfully.`;
      setActionToast({ message: msg, type: 'success' });
      addNotification({ type: 'success', message: msg });
    } else {
      addDoctor(profileForm);
      const msg = `${profileForm.name} successfully added to hospital roster with consultation fee ₹${profileForm.consultationFee}.`;
      setActionToast({ message: msg, type: 'success' });
      addNotification({ type: 'success', message: msg });
    }
    setIsAddEditModalOpen(false);
  };

  // Open Dedicated Quick Fee Decider Modal
  const handleOpenFeeModal = (doc: Doctor) => {
    setFeeDoctor(doc);
    setFeeForm({
      consultationFee: doc.consultationFee || 500,
      followUpFee: doc.followUpFee ?? 300,
      emergencyFee: doc.emergencyFee ?? 800,
      teleconsultationFee: doc.teleconsultationFee ?? 450,
      followUpValidityDays: doc.followUpValidityDays ?? 7
    });
    setIsFeeModalOpen(true);
  };

  // Commit Consultation Fee Update
  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeDoctor) return;
    updateConsultationFee(feeDoctor.id, feeForm);
    const msg = `Consultation fees for ${feeDoctor.name} updated: First Visit ₹${feeForm.consultationFee}, Review ₹${feeForm.followUpFee}.`;
    setActionToast({ message: msg, type: 'success' });
    addNotification({ type: 'success', message: msg });
    setIsFeeModalOpen(false);
  };

  // Toggle Doctor Status Handler
  const handleToggleStatus = (doc: Doctor) => {
    const nextStatus = doc.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
    toggleDoctorStatus(doc.id);
    const msg = `${doc.name} status updated to ${nextStatus === 'ACTIVE' ? 'Active on Duty' : 'On Leave'}.`;
    setActionToast({ message: msg, type: 'info' });
    addNotification({ type: 'info', message: msg });
  };

  // Export tariff sheet to CSV
  const handleExportCSV = () => {
    const headers = ['Doctor Name', 'Speciality', 'Qualification', 'Room', 'First Consultation Fee', 'Follow-up Fee', 'Emergency Fee', 'Teleconsult Fee', 'Follow-up Grace (Days)', 'Status'];
    const rows = doctors.map(d => [
      `"${d.name}"`,
      `"${d.specialization}"`,
      `"${d.qualification || ''}"`,
      `"${d.room || ''}"`,
      d.consultationFee,
      d.followUpFee || 0,
      d.emergencyFee || 0,
      d.teleconsultationFee || 0,
      d.followUpValidityDays || 7,
      `"${d.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MedFlow_Doctor_Consultation_Tariffs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification({ type: 'info', message: 'Doctor consultation tariff roster exported to CSV.' });
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* ============================================================ */}
      {/* 1. HEADER & ACTIONS                                          */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4338ca', background: '#EEF2FF', padding: '3px 9px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
              Physician Workforce & Tariff Governance
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              • Multi-Specialty Clinical Roster
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.65rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stethoscope size={26} color="#6366f1" /> Doctor Management & Consultation Fee Governance
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
            Decide and configure consultation tariffs (First Visit, Review Follow-Up, Emergency Walk-in, Teleconsult), OPD room allocations, slot durations, and active duty roster for all hospital physicians.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            title="Export Doctor Tariffs CSV"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            <Download size={15} /> Export Tariff Matrix
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, background: '#4338ca', color: '#ffffff', border: 'none',
              fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)'
            }}
          >
            <Plus size={16} /> + Onboard New Doctor
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. GOVERNANCE METRIC CARDS (5 KPIS)                          */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 195px), 1fr))', gap: 12, marginBottom: 20 }}>
        
        {/* Active Physicians */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Active Duty Roster</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Stethoscope size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {activeCount} Active
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
            Across {doctors.length} total hospital physicians
          </div>
        </div>

        {/* Average Consultation Fee */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 800, textTransform: 'uppercase' }}>Avg OPD Consultation Fee</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
            ₹{avgFee}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4338ca', marginTop: 2, fontWeight: 700 }}>
            Standard OPD First Visit Tariff
          </div>
        </div>

        {/* Fee Range */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 800, textTransform: 'uppercase' }}>Clinic Fee Range</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Tag size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.35rem)', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            ₹{minFee} – ₹{maxFee}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 2, fontWeight: 600 }}>
            General to Specialist Tier
          </div>
        </div>

        {/* Average Follow-up Fee */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>Avg Follow-Up Review</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <RotateCcw size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            ₹{avgFollowUpFee}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: 2, fontWeight: 600 }}>
            7 to 10-Day Free Grace Period
          </div>
        </div>

        {/* Specialities Covered */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase' }}>Specialities Covered</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Award size={15} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            {specialitiesList.length} Disciplines
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
            Multi-Speciality Practice Apex
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. FILTER, SEARCH & VIEW MODE BAR                            */}
      {/* ============================================================ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', minWidth: 'min(100%, 240px)', position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Doctor Name, Specialty, Qualification, Room, or Reg #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#fafbfc'
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

          {/* Specialty Dropdown */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
            >
              <option value="ALL">All Specialities ({doctors.length})</option>
              {specialitiesList.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
            >
              <option value="NAME">Sort by Name (A-Z)</option>
              <option value="FEE_DESC">Consultation Fee (High to Low)</option>
              <option value="FEE_ASC">Consultation Fee (Low to High)</option>
              <option value="SPECIALTY">Sort by Speciality</option>
            </select>
          </div>

        </div>

        {/* Row 2: Status Quick Chips & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b' }}>Roster Filter:</span>
            {[
              { id: 'ALL', label: 'All Doctors', count: doctors.length },
              { id: 'ACTIVE', label: 'Active on Duty', count: activeCount, color: '#15803d', bg: '#dcfce7' },
              { id: 'ON_LEAVE', label: 'On Leave / Off', count: doctors.length - activeCount, color: '#b45309', bg: '#fef3c7' }
            ].map(st => {
              const isSelected = selectedStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                    borderRadius: 14, fontSize: '0.72rem', fontWeight: 800,
                    border: `1px solid ${isSelected ? (st.color || '#4338ca') : '#cbd5e1'}`,
                    background: isSelected ? (st.bg || '#EEF2FF') : '#ffffff',
                    color: isSelected ? (st.color || '#4338ca') : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <span>{st.label}</span>
                  <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: 8, background: isSelected ? '#ffffff' : '#f1f5f9' }}>
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Showing <strong>{filteredDoctors.length}</strong> of {doctors.length} Doctors
            </span>

            {/* View Mode Toggle Button */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
              <button
                data-testid="view-mode-cards"
                onClick={() => setViewMode('CARDS')}
                title="Grid Card View"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4,
                  border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                  color: viewMode === 'CARDS' ? '#0f172a' : '#64748b'
                }}
              >
                <LayoutGrid size={13} /> Cards
              </button>
              <button
                data-testid="view-mode-table"
                onClick={() => setViewMode('TABLE')}
                title="Tariff Comparison Table"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4,
                  border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                  color: viewMode === 'TABLE' ? '#0f172a' : '#64748b'
                }}
              >
                <List size={13} /> Tariff Matrix
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. DOCTORS PRESENTATION (CARDS VIEW)                         */}
      {/* ============================================================ */}
      {viewMode === 'CARDS' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
          {filteredDoctors.map(doc => {
            const isActive = doc.status === 'ACTIVE';

            return (
              <div
                key={doc.id}
                data-testid={`doctor-card-${doc.id}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Card Top: Avatar, Name, Specialty & Status Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: doc.avatarColor || 'linear-gradient(135deg,#6366F1,#818CF8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff', fontWeight: 900, fontSize: '1.05rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)', flexShrink: 0
                    }}>
                      {doc.initials || doc.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#4338ca', fontWeight: 700, marginTop: 1 }}>
                        {doc.specialization}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                        {doc.qualification} {doc.registrationNumber && `• Reg: ${doc.registrationNumber}`}
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Badge */}
                  <button
                    data-testid={`toggle-status-btn-${doc.id}`}
                    onClick={() => toggleDoctorStatus(doc.id)}
                    title="Click to toggle Active / On Leave status"
                    style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800,
                      border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: isActive ? '#DCFCE7' : '#FEF3C7',
                      color: isActive ? '#15803D' : '#B45309'
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16a34a' : '#d97706' }} />
                    {isActive ? 'ACTIVE' : 'ON LEAVE'}
                  </button>
                </div>

                {/* Location & Slot Timing Info */}
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, fontSize: '0.74rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#475569' }}>
                      <Building size={13} color="#64748b" /> {doc.room || 'Cabin 1'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontWeight: 600 }}>
                      <Clock size={13} color="#64748b" /> {doc.slotDurationMins || 15} Mins / Slot
                    </span>
                  </div>
                  {doc.schedule && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Schedule: {doc.schedule}
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* PROMINENT CONSULTATION FEE PANEL (DECIDE & VIEW FEES HERE)  */}
                {/* ============================================================ */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <DollarSign size={13} /> Consultation Fee Tariffs
                    </span>
                    <button
                      data-testid={`decide-fees-btn-${doc.id}`}
                      onClick={() => handleOpenFeeModal(doc)}
                      style={{
                        padding: '2px 8px', borderRadius: 4, background: '#059669', color: '#ffffff',
                        border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 3
                      }}
                    >
                      <Sliders size={11} /> Decide Fees
                    </button>
                  </div>

                  {/* 4 Fee Tiers Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.78rem' }}>
                    
                    {/* Primary OPD Fee */}
                    <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.66rem', color: '#047857', display: 'block', fontWeight: 700 }}>FIRST VISIT OPD</span>
                      <strong style={{ fontSize: '1.05rem', color: '#065f46' }}>₹{doc.consultationFee}</strong>
                    </div>

                    {/* Follow-up Fee */}
                    <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.66rem', color: '#047857', display: 'block', fontWeight: 700 }}>FOLLOW-UP REVIEW</span>
                      <strong style={{ fontSize: '1.05rem', color: '#065f46' }}>₹{doc.followUpFee ?? 300}</strong>
                      <span style={{ fontSize: '0.62rem', color: '#059669', display: 'block' }}>Free within {doc.followUpValidityDays || 7}d</span>
                    </div>

                    {/* Emergency Fee */}
                    <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.66rem', color: '#047857', display: 'block', fontWeight: 700 }}>EMERGENCY / WALK-IN</span>
                      <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>₹{doc.emergencyFee ?? 800}</strong>
                    </div>

                    {/* Teleconsult Fee */}
                    <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.66rem', color: '#047857', display: 'block', fontWeight: 700 }}>TELECONSULTATION</span>
                      <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>₹{doc.teleconsultationFee ?? 450}</strong>
                    </div>

                  </div>
                </div>

                {/* Footer Controls: Edit Profile & Remove */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 6 }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: '#64748b' }}>
                    {doc.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Phone size={11} /> {doc.phone}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      title="Edit Doctor Profile & Full Tariff Structure"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                        borderRadius: 6, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1',
                        fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={12} /> Edit Profile
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${doc.name} from the clinical roster?`)) {
                          deleteDoctor(doc.id);
                          addNotification({ type: 'warning', message: `${doc.name} removed from roster.` });
                        }
                      }}
                      title="Remove Doctor"
                      style={{
                        display: 'inline-flex', alignItems: 'center', padding: '5px 8px',
                        borderRadius: 6, background: '#fee2e2', color: '#dc2626', border: 'none',
                        fontSize: '0.74rem', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (

        /* ============================================================ */
        /* 5. MASTER TARIFF COMPARISON TABLE VIEW                       */
        /* ============================================================ */
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div className="billing-responsive-table-scroll" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ minWidth: 1020, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', minWidth: 180, whiteSpace: 'nowrap' }}>Doctor & Speciality</th>
                  <th style={{ padding: '12px 14px', minWidth: 130, whiteSpace: 'nowrap' }}>Room / Cabin</th>
                  <th style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>OPD First Visit</th>
                  <th style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>Follow-Up Fee</th>
                  <th style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>Emergency Fee</th>
                  <th style={{ padding: '12px 14px', minWidth: 110, whiteSpace: 'nowrap' }}>Teleconsult Fee</th>
                  <th style={{ padding: '12px 14px', minWidth: 90, whiteSpace: 'nowrap' }}>Grace Window</th>
                  <th style={{ padding: '12px 14px', minWidth: 90, whiteSpace: 'nowrap' }}>Slot Time</th>
                  <th style={{ padding: '12px 14px', minWidth: 90, whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '12px 14px', minWidth: 130, textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map(doc => {
                  const isActive = doc.status === 'ACTIVE';

                  return (
                    <tr key={doc.id} data-testid={`doctor-row-${doc.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      {/* Doctor Name & Speciality */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 600 }}>{doc.specialization}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{doc.qualification}</div>
                      </td>

                      {/* Room */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#334155' }}>
                        {doc.room}
                      </td>

                      {/* Primary OPD Fee */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <strong style={{ fontSize: '0.94rem', color: '#059669' }}>₹{doc.consultationFee}</strong>
                      </td>

                      {/* Follow-up Fee */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>₹{doc.followUpFee ?? 300}</strong>
                      </td>

                      {/* Emergency Fee */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#334155' }}>
                        ₹{doc.emergencyFee ?? 800}
                      </td>

                      {/* Teleconsult Fee */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#334155' }}>
                        ₹{doc.teleconsultationFee ?? 450}
                      </td>

                      {/* Grace */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {doc.followUpValidityDays || 7} Days
                      </td>

                      {/* Slot */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {doc.slotDurationMins || 15}m
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800,
                          background: isActive ? '#DCFCE7' : '#FEF3C7',
                          color: isActive ? '#15803D' : '#B45309'
                        }}>
                          {isActive ? 'ACTIVE' : 'ON LEAVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleOpenFeeModal(doc)}
                            style={{
                              padding: '4px 8px', borderRadius: 4, background: '#059669', color: '#ffffff',
                              border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Decide Fee
                          </button>
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            style={{
                              padding: '4px 8px', borderRadius: 4, background: '#f1f5f9', color: '#334155',
                              border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: QUICK CONSULTATION FEE DECIDER                      */}
      {/* ============================================================ */}
      {isFeeModalOpen && feeDoctor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, maxWidth: 'min(94vw, 480px)',
            width: '100%', padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4 }}>
                  Consultation Fee Decider
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Decide Fees for {feeDoctor.name}
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {feeDoctor.specialization} • {feeDoctor.room}
                </div>
              </div>
              <button
                onClick={() => setIsFeeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFee} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Primary OPD Fee */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  <span>Regular First OPD Consultation Fee (₹) *</span>
                  <span style={{ color: '#059669' }}>Primary Tariff</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={feeForm.consultationFee}
                    onChange={(e) => setFeeForm({ ...feeForm, consultationFee: Number(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}
                  />
                  <button
                    type="button"
                    onClick={() => setFeeForm({ ...feeForm, consultationFee: feeForm.consultationFee + 50 })}
                    style={{ padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                  >
                    +₹50
                  </button>
                </div>
              </div>

              {/* Follow-up Fee & Validity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Follow-Up Review Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={feeForm.followUpFee}
                    onChange={(e) => setFeeForm({ ...feeForm, followUpFee: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Free Grace Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={feeForm.followUpValidityDays}
                    onChange={(e) => setFeeForm({ ...feeForm, followUpValidityDays: Number(e.target.value) || 7 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                  />
                </div>
              </div>

              {/* Emergency & Teleconsultation Fees */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Emergency Walk-In Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={feeForm.emergencyFee}
                    onChange={(e) => setFeeForm({ ...feeForm, emergencyFee: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Teleconsultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={feeForm.teleconsultationFee}
                    onChange={(e) => setFeeForm({ ...feeForm, teleconsultationFee: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#059669', border: 'none', color: '#ffffff', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Save & Apply Consultation Fees
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD / EDIT DOCTOR PROFILE & TARIFF MASTER           */}
      {/* ============================================================ */}
      {isAddEditModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, maxWidth: 'min(94vw, 560px)',
            width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 22,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {editingDoctor ? `Edit Profile & Fees: ${editingDoctor.name}` : 'Add New Physician to Roster'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Name & Specialization */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Patel"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Speciality *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    placeholder="e.g. Dermatology"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              {/* Qualification & Registration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD, DNB"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Medical Council Reg #
                  </label>
                  <input
                    type="text"
                    value={profileForm.registrationNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                    placeholder="e.g. G-48291"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              {/* Room & Slot Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Assigned OPD Cabin / Room
                  </label>
                  <input
                    type="text"
                    value={profileForm.room}
                    onChange={(e) => setProfileForm({ ...profileForm, room: e.target.value })}
                    placeholder="e.g. Cabin 1 (Room 101)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Slot Duration
                  </label>
                  <select
                    value={profileForm.slotDurationMins}
                    onChange={(e) => setProfileForm({ ...profileForm, slotDurationMins: Number(e.target.value) || 15 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Consultation Fees Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginTop: 4 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                  Decide Consultation Fees & Tariffs:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      First OPD Visit (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      value={profileForm.consultationFee}
                      onChange={(e) => setProfileForm({ ...profileForm, consultationFee: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 800 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Follow-up Review (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={profileForm.followUpFee}
                      onChange={(e) => setProfileForm({ ...profileForm, followUpFee: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Emergency Walk-In (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={profileForm.emergencyFee}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyFee: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Teleconsultation (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={profileForm.teleconsultationFee}
                      onChange={(e) => setProfileForm({ ...profileForm, teleconsultationFee: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Duty Status
                </label>
                <select
                  value={profileForm.status}
                  onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                >
                  <option value="ACTIVE">ACTIVE (On Clinical Duty)</option>
                  <option value="ON_LEAVE">ON LEAVE (Off Duty)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#4338ca', border: 'none', color: '#ffffff', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {editingDoctor ? 'Update Doctor & Fees' : 'Save & Add Physician'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
