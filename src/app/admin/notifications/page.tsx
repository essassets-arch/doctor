'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Bell, MessageSquare, Smartphone, CheckCircle2,
  Save, ToggleLeft, ToggleRight, ShieldCheck,
  Send, AlertCircle, Edit2
} from 'lucide-react';
import { useAdminStore, useUIStore } from '@/store';

export default function AdminNotificationsPage() {
  const { notifications, toggleNotificationTemplate } = useAdminStore();
  const { addNotification } = useUIStore();

  const [selectedNotifId, setSelectedNotifId] = useState<string>(notifications[0]?.id || 'notif-1');
  const [testMobile, setTestMobile] = useState('+91 98251 00001');

  const selectedNotif = notifications.find(n => n.id === selectedNotifId) || notifications[0];
  const [templateContent, setTemplateContent] = useState(selectedNotif?.content || '');

  const handleSelect = (id: string) => {
    setSelectedNotifId(id);
    const n = notifications.find(x => x.id === id);
    if (n) setTemplateContent(n.content);
  };

  const handleToggle = (id: string, title: string) => {
    toggleNotificationTemplate(id);
    addNotification({
      type: 'info',
      message: `Trigger state for "${title}" updated.`
    });
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification({
      type: 'success',
      message: `Test automated message dispatched to ${testMobile} via WhatsApp Cloud API & DLT Route.`
    });
  };

  return (
    <div style={{ width: '100%', padding: '24px 20px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
              Patient Outreach Automation
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• SMS & WhatsApp Cloud Gateway</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={26} color="#10b981" /> Automated Communications & Messaging Engine
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Event-driven booking confirmations, 24-hour reminders, follow-up recalls, and Google Review requests.
          </p>
        </div>

        {/* DLT Gateway Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', padding: '8px 14px', borderRadius: 8, border: '1px solid #BBF7D0' }}>
          <ShieldCheck size={18} color="#15803D" />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#15803D' }}>TRAI DLT Entity Active</div>
            <div style={{ fontSize: '0.72rem', color: '#166534' }}>ID: 11014889201994 (Principal Entity)</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 24 }}>
        
        {/* Left: Trigger Rules Roster */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Automated Notification Rules & Triggers
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(notif => {
              const isSelected = selectedNotif?.id === notif.id;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelect(notif.id)}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: `1.5px solid ${isSelected ? '#10b981' : '#E2E8F0'}`,
                    background: isSelected ? '#ECFDF5' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? '#065F46' : '#0F172A' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>
                        Trigger: <code style={{ color: '#4338ca', fontWeight: 600 }}>{notif.triggerEvent}</code>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: 4 }}>
                        Channel: {notif.channel}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(notif.id, notif.title);
                      }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: notif.isEnabled ? '#10b981' : '#94a3b8'
                      }}
                      title={notif.isEnabled ? 'Disable Automation' : 'Enable Automation'}
                    >
                      {notif.isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Template Editor & Test Dispatch */}
        {selectedNotif && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Template Content Box */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Template: {selectedNotif.title}
                </h3>
                <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  {selectedNotif.channel}
                </span>
              </div>

              <textarea
                rows={5}
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />

              <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#64748b' }}>
                Supported Tags: <code>[Patient Name]</code>, <code>[Doctor Name]</code>, <code>[Appointment Date]</code>, <code>[Appointment Time]</code>, <code>[Token]</code>, <code>[Clinic Name]</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => addNotification({ type: 'success', message: 'Template changes saved & synced to SMS gateway.' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Save size={15} /> Save Template
                </button>
              </div>
            </div>

            {/* Simulated WhatsApp / SMS Bubble Preview */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} color="#10b981" /> Smartphone Recipient Preview
              </h3>

              {/* Chat Bubble */}
              <div style={{
                background: '#E1F7CB',
                borderRadius: '8px 8px 0 8px',
                padding: '14px 18px',
                maxWidth: '90%',
                marginLeft: 'auto',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                fontSize: '0.85rem',
                color: '#1E293B',
                lineHeight: 1.5
              }}>
                <p style={{ margin: 0 }}>
                  {templateContent
                    .replace(/\[Patient Name\]/g, 'Mahesh Kumar')
                    .replace(/\[Doctor Name\]/g, 'Dr. Raj Valaki')
                    .replace(/\[Appointment Date\]/g, '19/09/2026')
                    .replace(/\[Appointment Time\]/g, '10:30 AM')
                    .replace(/\[Token\]/g, 'C003')
                    .replace(/\[Clinic Name\]/g, 'MedFlow Clinic')}
                </p>
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#65A30D', marginTop: 4 }}>
                  10:32 AM • Delivered ✓✓
                </div>
              </div>

              {/* Test Trigger Dispatch Form */}
              <form onSubmit={handleSendTest} style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
                <input
                  type="tel"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0F172A',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={14} /> Send Live Test
                </button>
              </form>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
