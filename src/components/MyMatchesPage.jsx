import React, { useState } from 'react';

// Countdown Timer Component
function CountdownTimer({ startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  React.useEffect(() => {
    const target = new Date(startTime).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference <= 0) {
        setTimeLeft('LIVE NOW');
        return;
      }
      
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span style={{ 
      color: timeLeft === 'LIVE NOW' ? 'var(--success)' : 'var(--secondary)', 
      fontFamily: 'var(--font-heading)',
      fontWeight: '700' 
    }}>
      {timeLeft}
    </span>
  );
}

export default function MyMatchesPage({ 
  tournaments = [], 
  userProfile, 
  onSelectTournament, 
  setCurrentView 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'completed'
  const [copiedId, setCopiedId] = useState(null);

  // Filter tournaments where current user has joined
  const joinedTournaments = tournaments.filter(t => {
    return t.joinedPlayers?.some(p => p.isUser || p.uid === userProfile.uid || p.nickname === userProfile.nickname);
  });

  const filteredMatches = joinedTournaments.filter(t => {
    if (filter === 'upcoming') return t.status === 'upcoming' || t.status === 'live' || !t.status;
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      
      {/* Top Banner */}
      <div 
        className="glass-panel" 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(21, 28, 51, 0.95) 100%)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>
            ESPORTS DASHBOARD
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '2px 0 0 0', fontSize: '1.35rem', color: '#fff' }}>
            🎯 MY JOINED MATCHES
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            View your upcoming match schedules, live Custom Room credentials, and submitted results.
          </p>
        </div>

        <div style={{
          background: 'rgba(0, 229, 255, 0.1)',
          border: '1px solid var(--secondary)',
          padding: '10px 16px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined Matches</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: '900', color: 'var(--secondary)' }}>
            {joinedTournaments.length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: `All Joined (${joinedTournaments.length})` },
          { id: 'upcoming', label: '🔴 Live & Upcoming' },
          { id: 'completed', label: '🏁 Completed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              flex: 1,
              padding: '10px 6px',
              borderRadius: '8px',
              border: 'none',
              background: filter === tab.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: filter === tab.id ? 'var(--glow-primary)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎮</div>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 6px 0' }}>
            {joinedTournaments.length === 0 ? 'No Matches Joined Yet!' : 'No matches found in this category.'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 18px auto', lineHeight: '1.4' }}>
            {joinedTournaments.length === 0 
              ? 'Join Free Fire tournament matches in the Arena to compete for real cash prizes, kill bounties, and climb the leaderboard!'
              : 'Switch to All Joined tab to view your complete match history.'}
          </p>

          <button 
            onClick={() => setCurrentView('dashboard')}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: '700' }}
          >
            🔥 Browse Live Arena Matches ➔
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredMatches.map(t => {
            const playerSlot = t.joinedPlayers?.find(p => p.isUser || p.uid === userProfile.uid || p.nickname === userProfile.nickname);
            const slotIndex = t.joinedPlayers?.findIndex(p => p.isUser || p.uid === userProfile.uid || p.nickname === userProfile.nickname);

            return (
              <div 
                key={t.id}
                className="glass-panel animate-slide-in"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: t.roomId ? '1px solid var(--success)' : '1px solid rgba(0, 229, 255, 0.2)',
                  background: t.roomId 
                    ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.05) 0%, rgba(21, 28, 51, 0.9) 100%)' 
                    : 'rgba(21, 28, 51, 0.7)'
                }}
              >
                {/* Header info */}
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-live" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                      ✓ REGISTERED
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.mode} • {t.type}
                    </span>
                    {playerSlot?.squadCode && (
                      <span className="badge" style={{ background: 'rgba(255,214,0,0.15)', color: 'var(--accent)', fontSize: '0.68rem' }}>
                        Squad: {playerSlot.squadCode}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem' }}>
                    {t.startTime ? <CountdownTimer startTime={t.startTime} /> : <span style={{ color: 'var(--secondary)' }}>LIVE</span>}
                  </div>
                </div>

                {/* Match title & map */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 4px 0' }}>
                    {t.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>🗺️ Map: <strong>{t.map}</strong></span>
                    <span>{t.type?.toLowerCase().includes('lone wolf') ? '🏆 Prize: ' : '💰 Bounty: '}
                      <strong style={{ color: t.type?.toLowerCase().includes('lone wolf') ? 'var(--accent)' : 'inherit' }}>
                        {t.type?.toLowerCase().includes('lone wolf') ? `₹${t.prizePool} (Winner Takes All)` : `₹${t.perKillPrize || 25}/Kill`}
                      </strong>
                    </span>
                    {slotIndex !== -1 && <span>🎯 Slot: <strong style={{ color: 'var(--secondary)' }}>#{slotIndex + 1}</strong></span>}
                  </div>
                </div>

                {/* Live Free Fire Room Credentials Box (if dropped by Admin) */}
                <div style={{
                  background: t.roomId ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0,0,0,0.3)',
                  border: t.roomId ? '1px solid var(--success)' : '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div className="flex-between" style={{ marginBottom: t.roomId ? '8px' : '0' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '700', 
                      color: t.roomId ? 'var(--success)' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🔑</span> {t.roomId ? 'ROOM ID & PASSWORD (LIVE)' : 'CUSTOM ROOM CREDENTIALS'}
                    </span>
                    {t.roomId && <span className="badge badge-live">READY TO PLAY</span>}
                  </div>

                  {t.roomId ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ROOM ID:</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: '900', color: 'var(--secondary)' }}>
                            {t.roomId}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(t.roomId, `room_${t.id}`)}
                          style={{
                            background: copiedId === `room_${t.id}` ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedId === `room_${t.id}` ? '✓' : 'Copy'}
                        </button>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PASSWORD:</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: '900', color: 'var(--accent)' }}>
                            {t.roomPassword || 'None'}
                          </div>
                        </div>
                        {t.roomPassword && (
                          <button
                            onClick={() => copyToClipboard(t.roomPassword, `pass_${t.id}`)}
                            style={{
                              background: copiedId === `pass_${t.id}` ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: '#fff',
                              fontSize: '0.7rem',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {copiedId === `pass_${t.id}` ? '✓' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      ⏳ Room ID & Password will be dropped here 15 minutes before start.
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div>
                  <button 
                    onClick={() => onSelectTournament(t.id)}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '0.88rem', fontWeight: '700' }}
                  >
                    🎮 Enter Match Lobby ➔
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
