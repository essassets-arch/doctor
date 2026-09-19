'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, Volume2, ArrowRight, Clock, Maximize2,
  Minimize2, BellRing, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { useQueueStore, QueueEntry } from '@/store';

export default function WaitingRoomScreen() {
  const { queue, doctors } = useQueueStore();
  const [time, setTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chimeActive, setChimeActive] = useState(false);

  // Live Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calling entry
  const callingEntry = queue.find(q => q.status === 'CALLING');
  const inSessionEntries = queue.filter(q => q.status === 'IN_SESSION');
  const waitingEntries = queue.filter(q => q.status === 'WAITING');

  const playChime = () => {
    setChimeActive(true);
    // Web Audio API Synthesizer Chime (pleasant hospital double-tone chime!)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.3); // A5

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.3);
        osc2.start(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {
      console.log('Audio chime not supported');
    }

    // Web Speech Synthesis Voice Announcement
    setTimeout(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const roomName = callingEntry ? (doctors.find(d => d.id === callingEntry.doctorId)?.room || 'Room 1') : 'Room 1';
        const phrase = callingEntry
          ? `Token number ${callingEntry.tokenDisplay}, ${callingEntry.patientName}, please proceed to ${roomName}.`
          : `Attention please, MedFlow OPD consultation is now calling.`;
        const utter = new SpeechSynthesisUtterance(phrase);
        utter.lang = 'en-IN';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      }
      setChimeActive(false);
    }, 1300);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F19',
      color: '#F8FAFC',
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>
      {/* Top TV Bar */}
      <header style={{
        height: 80,
        background: '#111827',
        borderBottom: '2px solid #1F2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.5)'
          }}>
            <Activity size={26} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1 }}>
              MEDFLOW OPD
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>
              Surat Central Outpatient Department
            </div>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={playChime}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8, background: '#1F2937',
              border: '1px solid #374151', color: chimeActive ? '#6366F1' : '#CBD5E1',
              cursor: 'pointer', fontWeight: 600, fontSize: 13
            }}
          >
            <Volume2 size={16} /> Test Chime
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              padding: 10, borderRadius: 8, background: '#1F2937',
              border: '1px solid #374151', color: '#CBD5E1', cursor: 'pointer'
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <div style={{
            background: '#1E293B', padding: '8px 20px', borderRadius: 10,
            border: '1px solid #334155', fontSize: 22, fontWeight: 800,
            color: '#38BDF8', letterSpacing: '0.05em', fontFamily: 'monospace'
          }}>
            {time}
          </div>

          <Link href="/reception/dashboard">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, background: 'none',
              border: '1px solid #374151', color: '#94A3B8', cursor: 'pointer', fontSize: 12
            }}>
              <ArrowLeft size={14} /> Reception
            </button>
          </Link>
        </div>
      </header>

      {/* Main Waiting Room Stage */}
      <main style={{ flex: 1, padding: '28px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        {/* Left Column: Hero Calling Token & Active Rooms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Big NOW CALLING Box */}
          <div style={{
            background: 'radial-gradient(ellipse at top, #1E1B4B 0%, #0F172A 100%)',
            borderRadius: 24,
            border: callingEntry ? '3px solid #6366F1' : '2px solid #1F2937',
            padding: 36,
            textAlign: 'center',
            boxShadow: callingEntry ? '0 0 60px rgba(99,102,241,0.35)' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 20px', borderRadius: 999,
              background: callingEntry ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)',
              border: callingEntry ? '1px solid #EF4444' : '1px solid #475569',
              color: callingEntry ? '#FCA5A5' : '#94A3B8',
              fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase'
            }}>
              <BellRing size={16} style={{ animation: callingEntry ? 'spin 2s linear infinite' : 'none' }} />
              {callingEntry ? 'NOW CALLING' : 'OPD BOARD ACTIVE'}
            </div>

            {callingEntry ? (
              <>
                <div style={{
                  fontSize: 108, fontWeight: 900, color: '#FFFFFF',
                  lineHeight: 1, margin: '20px 0 10px', letterSpacing: '0.04em',
                  textShadow: '0 0 40px rgba(99,102,241,0.8)'
                }}>
                  {callingEntry.tokenDisplay}
                </div>

                <div style={{ fontSize: 32, fontWeight: 800, color: '#E2E8F0', marginTop: 4 }}>
                  {callingEntry.patientName.split(' ')[0]} {callingEntry.patientName.split(' ')[1]?.[0]}.
                </div>

                <div style={{
                  marginTop: 24, padding: '16px 28px', background: 'rgba(99,102,241,0.2)',
                  borderRadius: 16, border: '1px solid rgba(99,102,241,0.4)',
                  display: 'inline-flex', alignItems: 'center', gap: 18
                }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#C7D2FE' }}>
                    {callingEntry.doctorName}
                  </span>
                  <div style={{
                    padding: '8px 20px', background: '#4F46E5', borderRadius: 10,
                    fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span>{doctors.find(d => d.id === callingEntry.doctorId)?.room || 'ROOM 1'}</span>
                    <ArrowRight size={24} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '60px 20px' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#64748B' }}>
                  All Active Patients Inside Consulting Rooms
                </div>
                <div style={{ fontSize: 16, color: '#475569', marginTop: 8 }}>
                  Next token will be broadcast immediately upon doctor call.
                </div>
              </div>
            )}
          </div>

          {/* Active Consulting Rooms Grid */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 }}>
              Consulting Rooms Status
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {doctors.map(doc => {
                const inSession = inSessionEntries.find(q => q.doctorId === doc.id);
                const isCalling = callingEntry?.doctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: '#111827',
                      borderRadius: 16,
                      border: isCalling ? '2px solid #6366F1' : inSession ? '1px solid #10B981' : '1px solid #1F2937',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: inSession ? '#064E3B' : '#1F2937',
                        color: inSession ? '#34D399' : '#94A3B8',
                        fontWeight: 800, fontSize: 12
                      }}>
                        {doc.room}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: isCalling ? '#818CF8' : inSession ? '#10B981' : '#64748B'
                      }}>
                        {isCalling ? 'CALLING' : inSession ? 'IN SESSION' : 'READY'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#F8FAFC' }}>{doc.name}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{doc.specialization}</div>
                    </div>

                    <div style={{
                      marginTop: 6, paddingTop: 10, borderTop: '1px solid #1F2937',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Current Token:</span>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 18, fontWeight: 900,
                        color: inSession ? '#10B981' : '#64748B'
                      }}>
                        {inSession ? inSession.tokenDisplay : isCalling ? callingEntry.tokenDisplay : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Queue List */}
        <div style={{
          background: '#111827',
          borderRadius: 24,
          border: '1px solid #1F2937',
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingBottom: 16, borderBottom: '1px solid #1F2937', marginBottom: 16
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC' }}>
                Next in Queue ({waitingEntries.length})
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Please remain seated in the lounge</div>
            </div>
            <span style={{
              padding: '4px 12px', background: '#1E293B', borderRadius: 999,
              fontSize: 12, fontWeight: 700, color: '#38BDF8'
            }}>
              Live
            </span>
          </div>

          {/* Queue Rows */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waitingEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                No more patients currently waiting in lounge.
              </div>
            ) : (
              waitingEntries.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    background: index === 0 ? '#1E293B' : '#0F172A',
                    border: index === 0 ? '1px solid #38BDF8' : '1px solid #1F2937',
                    borderRadius: 14,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      fontFamily: 'monospace', fontWeight: 900, fontSize: 24,
                      color: index === 0 ? '#38BDF8' : '#F1F5F9', minWidth: 64
                    }}>
                      {item.tokenDisplay}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#F8FAFC' }}>
                        {item.patientName.split(' ')[0]} {item.patientName.split(' ')[1]?.[0]}.
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>
                        {item.doctorName} ({doctors.find(d => d.id === item.doctorId)?.room || 'Room 1'})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6,
                      background: '#1F2937', color: '#94A3B8', fontSize: 11, fontWeight: 600
                    }}>
                      ~{(index + 1) * 10}m
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: '1px solid #1F2937',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B'
          }}>
            <ShieldCheck size={16} color="#10B981" />
            <span>Patient identity protected pursuant to Healthcare Privacy protocols.</span>
          </div>
        </div>
      </main>

      {/* Bottom Announcement Ticker Bar */}
      <footer style={{
        height: 48,
        background: '#0F172A',
        borderTop: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '0 24px'
      }}>
        <div style={{
          padding: '4px 10px', background: '#EF4444', color: 'white',
          borderRadius: 6, fontSize: 11, fontWeight: 900, marginRight: 16, whiteSpace: 'nowrap'
        }}>
          ANNOUNCEMENT
        </div>
        <div style={{
          color: '#94A3B8', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          display: 'flex', gap: 40
        }}>
          <span>📢 Please have your Token Slip and previous prescriptions ready when your token is called.</span>
          <span>•</span>
          <span>🧪 Routine Blood Tests & Sample Drop available at Counter 4 on the Ground Floor.</span>
          <span>•</span>
          <span>⏰ OPD Consulting Timings: Morning 09:00 AM - 01:00 PM | Evening 04:00 PM - 08:00 PM.</span>
        </div>
      </footer>
    </div>
  );
}
