'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Stethoscope, Plus, Search, Filter, CheckCircle2,
  Calendar, Clock, DollarSign, Building, Edit2, Trash2,
  X, Shield, User, AlertCircle, Phone, Mail
} from 'lucide-react';
import { useDoctorStore, useUIStore } from '@/store';

export default function AdminDoctorsPage() {
  const { doctors } = useDoctorStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  // Extended Doctor Profiles state
  const [doctorProfiles, setDoctorProfiles] = useState([
    {
      id: 'doc-1',
      name: 'Dr. Raj Valaki',
      specialization: 'Internal & General Medicine',
      email: 'raj.valaki@medflow.health',
      phone: '+91 98251 00001',
      consultationFee: 500,
      slotDurationMins: 15,
      roomNumber: 'Cabin 1 (Room 101)',
      schedule: 'Mon–Sat: 09:00 AM – 01:00 PM & 04:00 PM – 08:00 PM',
      status: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE'
    },
    {
      id: 'doc-2',
      name: 'Dr. Sarah Jenkins',
      specialization: 'Dermatology & Cosmetology',
      email: 'sarah.jenkins@medflow.health',
      phone: '+91 98251 00002',
      consultationFee: 800,
      slotDurationMins: 20,
      roomNumber: 'Cabin 2 (Room 102)',
      schedule: 'Mon–Fri: 10:00 AM – 02:00 PM & 05:00 PM – 08:00 PM',
      status: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE'
    },
    {
      id: 'doc-3',
      name: 'Dr. Kalp Patel',
      specialization: 'Orthopedics & Joint Care',
      email: 'kalp.patel@medflow.health',
      phone: '+91 98251 00003',
      consultationFee: 700,
      slotDurationMins: 20,
      roomNumber: 'Cabin 3 (Room 103)',
      schedule: 'Tue, Thu, Sat: 09:00 AM – 01:00 PM',
      status: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE'
    },
    {
      id: 'doc-4',
      name: 'Dr. Meena Iyer',
      specialization: 'Obstetrics & Gynecology',
      email: 'meena.iyer@medflow.health',
      phone: '+91 98251 00004',
      consultationFee: 650,
      slotDurationMins: 15,
      roomNumber: 'Cabin 4 (Room 104)',
      schedule: 'Mon–Sat: 10:00 AM – 01:00 PM',
      status: 'ON_LEAVE' as 'ACTIVE' | 'ON_LEAVE'
    }
  ]);

  // Form State
  const [form, setForm] = useState({
    name: '',
    specialization: 'Internal & General Medicine',
    email: '',
    phone: '',
    consultationFee: 500,
    slotDurationMins: 15,
    roomNumber: 'Cabin 1 (Room 101)',
    schedule: 'Mon–Sat: 09:00 AM – 01:00 PM'
  });

  const filteredDoctors = useMemo(() => {
    return doctorProfiles.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSpecialty = selectedSpecialty === 'ALL' || doc.specialization === selectedSpecialty;
      return matchSearch && matchSpecialty;
    });
  }, [doctorProfiles, searchTerm, selectedSpecialty]);

  const handleToggleStatus = (id: string) => {
    setDoctorProfiles(docs => docs.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
        addNotification({
          type: nextStatus === 'ACTIVE' ? 'success' : 'warning',
          message: `${d.name} status updated to ${nextStatus}. ${nextStatus === 'ON_LEAVE' ? 'Appointment booking locked.' : 'Appointment booking available.'}`
        });
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  const handleOpenAdd = () => {
    setEditingDoctorId(null);
    setForm({
      name: '',
      specialization: 'Internal & General Medicine',
      email: '',
      phone: '',
      consultationFee: 500,
      slotDurationMins: 15,
      roomNumber: 'Cabin 5 (Room 105)',
      schedule: 'Mon–Sat: 09:00 AM – 01:00 PM'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (doc: typeof doctorProfiles[0]) => {
    setEditingDoctorId(doc.id);
    setForm({
      name: doc.name,
      specialization: doc.specialization,
      email: doc.email,
      phone: doc.phone,
      consultationFee: doc.consultationFee,
      slotDurationMins: doc.slotDurationMins,
      roomNumber: doc.roomNumber,
      schedule: doc.schedule
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      addNotification({ type: 'danger', message: 'Please provide doctor name and official email.' });
      return;
    }

    if (editingDoctorId) {
      setDoctorProfiles(docs => docs.map(d => d.id === editingDoctorId ? {
        ...d,
        ...form,
        consultationFee: Number(form.consultationFee),
        slotDurationMins: Number(form.slotDurationMins)
      } : d));
      addNotification({ type: 'success', message: `${form.name} schedule & pricing updated.` });
    } else {
      const newDoc = {
        id: `doc-${Date.now()}`,
        ...form,
        consultationFee: Number(form.consultationFee),
        slotDurationMins: Number(form.slotDurationMins),
        status: 'ACTIVE' as const
      };
      setDoctorProfiles(docs => [newDoc, ...docs]);
      addNotification({ type: 'success', message: `Physician ${form.name} onboarded to OPD clinical roster.` });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4338ca', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #C7D2FE' }}>
              Workforce Governance
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Attending Physicians & Scheduling</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stethoscope size={26} color="#4338ca" /> Doctor Management & Appointment Capacity
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Consultation fee rules, appointment slot durations, clinical cabin assignments, and leave locks.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: '#4338ca',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)'
          }}
        >
          <Plus size={16} /> Onboard New Doctor
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search physician by name, specialty, or email..."
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

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            color: '#334155'
          }}
        >
          <option value="ALL">All Clinical Specialties</option>
          <option value="Internal & General Medicine">Internal & General Medicine</option>
          <option value="Dermatology & Cosmetology">Dermatology & Cosmetology</option>
          <option value="Orthopedics & Joint Care">Orthopedics & Joint Care</option>
          <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
        </select>
      </div>

      {/* Doctors Grid / Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 18px' }}>Physician & Specialty</th>
              <th style={{ padding: '14px 18px' }}>Consult Fee</th>
              <th style={{ padding: '14px 18px' }}>Slot Duration</th>
              <th style={{ padding: '14px 18px' }}>Cabin Room</th>
              <th style={{ padding: '14px 18px' }}>OPD Schedule</th>
              <th style={{ padding: '14px 18px' }}>Availability</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#4338ca', fontWeight: 600 }}>{doc.specialization}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{doc.email} • {doc.phone}</div>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>
                    ₹{doc.consultationFee}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Default Walk-in</span>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem' }}>
                    {doc.slotDurationMins} Mins
                  </span>
                </td>

                <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 600, fontSize: '0.85rem' }}>
                  {doc.roomNumber}
                </td>

                <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.82rem', maxWidth: 220 }}>
                  {doc.schedule}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <button
                    onClick={() => handleToggleStatus(doc.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: doc.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                      color: doc.status === 'ACTIVE' ? '#15803D' : '#B45309'
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: doc.status === 'ACTIVE' ? '#16A34A' : '#D97706' }} />
                    {doc.status === 'ACTIVE' ? 'Active on Roster' : 'On Leave (Locked)'}
                  </button>
                </td>

                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Edit Config
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Doctor Modal */}
      {isAddModalOpen && (
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
                <Stethoscope size={20} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {editingDoctorId ? 'Edit Doctor Configuration' : 'Onboard New Attending Physician'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Joshi"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.specialization}
                    onChange={(e) => setForm(f => ({ ...f, specialization: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@medflow.health"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98251..."
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Consult Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={form.consultationFee}
                    onChange={(e) => setForm(f => ({ ...f, consultationFee: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Slot Duration
                  </label>
                  <select
                    value={form.slotDurationMins}
                    onChange={(e) => setForm(f => ({ ...f, slotDurationMins: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value={10}>10 Mins</option>
                    <option value={15}>15 Mins</option>
                    <option value={20}>20 Mins</option>
                    <option value={30}>30 Mins</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Cabin Room
                  </label>
                  <input
                    type="text"
                    value={form.roomNumber}
                    onChange={(e) => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Weekly Schedule & Timings
                </label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={(e) => setForm(f => ({ ...f, schedule: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#4338ca', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
