import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatMatchDate, sortTournamentsByTime } from '../services/dateUtils';

// Countdown Timer Component
function CountdownTimer({ startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  React.useEffect(() => {
    if (!startTime) {
      setTimeLeft('LIVE NOW');
      return;
    }

    const target = new Date(startTime).getTime();
    if (isNaN(target)) {
      // Custom text slot like "3:00 PM - 4:00 PM"
      setTimeLeft(`⏰ ${startTime}`);
      return;
    }
    
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
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'completed'
  const [copiedId, setCopiedId] = useState(null);

  // Filter tournaments where current user has joined
  const cleanUserUid = String(userProfile?.uid || userProfile?.id || '').trim().toLowerCase();
  const cleanUserEmail = String(userProfile?.email || '').trim().toLowerCase();

  const joinedTournaments = tournaments.filter(tourney => {
    if ((!cleanUserUid && !cleanUserEmail) || !tourney.joinedPlayers) return false;
    return tourney.joinedPlayers.some(p => {
      const pUid = String(p.uid || '').trim().toLowerCase();
      const pEmail = String(p.email || '').trim().toLowerCase();
      return (cleanUserUid && pUid === cleanUserUid) || (cleanUserEmail && pEmail === cleanUserEmail);
    });
  });

  const filteredMatches = joinedTournaments.filter(tourney => {
    if (filter === 'upcoming') return tourney.status === 'upcoming' || tourney.status === 'live' || !tourney.status;
    if (filter === 'completed') return tourney.status === 'completed';
    return true;
  });

  const sortedMatches = sortTournamentsByTime(filteredMatches);

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
            {t('matches.dashboard_badge', {}, 'ESPORTS DASHBOARD')}
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '2px 0 0 0', fontSize: '1.35rem', color: '#fff' }}>
            🎯 {t('matches.title', {}, 'MY JOINED MATCHES')}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {t('matches.desc', {}, 'View your upcoming match schedules, live Custom Room credentials, and match details.')}
          </p>
        </div>

        <div style={{
          background: 'rgba(0, 229, 255, 0.1)',
          border: '1px solid var(--secondary)',
          padding: '10px 16px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t('matches.joined_count', {}, 'Joined Matches')}
          </div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: '900', color: 'var(--secondary)' }}>
            {joinedTournaments.length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: t('matches.tab_all', { count: joinedTournaments.length }, `All Joined (${joinedTournaments.length})`) },
          { id: 'upcoming', label: t('matches.tab_upcoming', {}, '🔴 Live & Upcoming') },
          { id: 'completed', label: t('matches.tab_completed', {}, '🏁 Completed') }
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
      {sortedMatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎮</div>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 6px 0' }}>
            {joinedTournaments.length === 0 
              ? t('matches.empty_title', {}, 'No Matches Joined Yet!') 
              : t('matches.empty_filtered', {}, 'No matches found in this category.')}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 18px auto', lineHeight: '1.4' }}>
            {joinedTournaments.length === 0 
              ? t('matches.empty_desc', {}, 'Join Free Fire tournament matches in the Arena to compete for real cash prizes, kill bounties, and climb the leaderboard!')
              : t('matches.switch_all', {}, 'Switch to All Joined tab to view your complete match history.')}
          </p>

          <button 
            onClick={() => setCurrentView('dashboard')}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: '700' }}
          >
            {t('matches.browse_btn', {}, '🔥 Browse Live Arena Matches ➔')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sortedMatches.map(tourney => {
            const playerSlot = tourney.joinedPlayers?.find(p => p.isUser || p.uid === userProfile.uid || p.nickname === userProfile.nickname);
            const slotIndex = tourney.joinedPlayers?.findIndex(p => p.isUser || p.uid === userProfile.uid || p.nickname === userProfile.nickname);

            const isPinned = Boolean(tourney.isPinned || tourney.pinned || tourney.isHighlighted);

            return (
              <div 
                key={tourney.id}
                className="glass-panel animate-slide-in"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: isPinned 
                    ? '1.5px solid #ffd600' 
                    : tourney.roomId 
                      ? '1px solid var(--success)' 
                      : '1px solid rgba(0, 229, 255, 0.2)',
                  boxShadow: isPinned ? '0 0 15px rgba(255, 214, 0, 0.22)' : undefined,
                  background: tourney.roomId 
                    ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.05) 0%, rgba(21, 28, 51, 0.9) 100%)' 
                    : isPinned
                    ? 'linear-gradient(135deg, rgba(255, 214, 0, 0.05) 0%, rgba(21, 28, 51, 0.8) 100%)'
                    : 'rgba(21, 28, 51, 0.7)'
                }}
              >
                {/* Header info */}
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {isPinned && (
                      <span className="badge" style={{ 
                        background: 'linear-gradient(135deg, #ffd600 0%, #ff9100 100%)', 
                        color: '#000', 
                        fontWeight: '900', 
                        fontSize: '0.68rem',
                        boxShadow: '0 0 10px rgba(255, 214, 0, 0.4)'
                      }}>
                        {t('matches.badge_pinned', {}, '📌 PINNED MATCH')}
                      </span>
                    )}
                    <span className="badge badge-live" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                      {t('matches.badge_registered', {}, '✓ REGISTERED')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {tourney.mode} • {tourney.type}
                    </span>
                    {playerSlot?.squadCode && (
                      <span className="badge" style={{ background: 'rgba(255,214,0,0.15)', color: 'var(--accent)', fontSize: '0.68rem' }}>
                        {t('matches.squad_label', {}, 'Squad')}: {playerSlot.squadCode}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.12)', color: 'var(--secondary)', border: '1px solid rgba(0, 229, 255, 0.3)', fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px' }}>
                      📅 {formatMatchDate(tourney.matchDate, tourney.startTime)}
                    </span>
                    <div style={{ fontSize: '0.78rem' }}>
                      {tourney.startTime ? <CountdownTimer startTime={tourney.startTime} /> : <span style={{ color: 'var(--secondary)' }}>LIVE</span>}
                    </div>
                  </div>
                </div>

                {/* Match title & map */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 4px 0' }}>
                    {tourney.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>🗺️ Map: <strong>{tourney.map}</strong></span>
                    <span>{tourney.type?.toLowerCase().includes('lone wolf') ? '🏆 Prize: ' : '💰 Bounty: '}
                      <strong style={{ color: tourney.type?.toLowerCase().includes('lone wolf') ? 'var(--accent)' : 'inherit' }}>
                        {tourney.type?.toLowerCase().includes('lone wolf') ? `₹${tourney.prizePool} (Winner Takes All)` : `₹${tourney.perKillPrize || 25}/Kill`}
                      </strong>
                    </span>
                    {slotIndex !== -1 && <span>🎯 Slot: <strong style={{ color: 'var(--secondary)' }}>#{slotIndex + 1}</strong></span>}
                  </div>
                </div>

                {/* Live Free Fire Room Credentials Box (if dropped by Admin) */}
                <div style={{
                  background: tourney.roomId ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0,0,0,0.3)',
                  border: tourney.roomId ? '1px solid var(--success)' : '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div className="flex-between" style={{ marginBottom: tourney.roomId ? '8px' : '0' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '700', 
                      color: tourney.roomId ? 'var(--success)' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🔑</span> {tourney.roomId ? 'ROOM ID & PASSWORD (LIVE)' : 'CUSTOM ROOM CREDENTIALS'}
                    </span>
                    {tourney.roomId && <span className="badge badge-live">READY TO PLAY</span>}
                  </div>

                  {tourney.roomId ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ROOM ID:</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: '900', color: 'var(--secondary)' }}>
                            {tourney.roomId}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(tourney.roomId, `room_${tourney.id}`)}
                          style={{
                            background: copiedId === `room_${tourney.id}` ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedId === `room_${tourney.id}` ? '✓' : t('matches.copy_btn', {}, 'Copy')}
                        </button>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t('matches.pass_label', {}, 'PASSWORD')}:</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: '900', color: 'var(--accent)' }}>
                            {tourney.roomPassword || 'None'}
                          </div>
                        </div>
                        {tourney.roomPassword && (
                          <button
                            onClick={() => copyToClipboard(tourney.roomPassword, `pass_${tourney.id}`)}
                            style={{
                              background: copiedId === `pass_${tourney.id}` ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: '#fff',
                              fontSize: '0.7rem',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {copiedId === `pass_${tourney.id}` ? '✓' : t('matches.copy_btn', {}, 'Copy')}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      ⏳ {t('matches.waiting_creds', {}, 'Room ID and Password will be dropped here before match starts.')}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div>
                  <button 
                    onClick={() => onSelectTournament(tourney.id)}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '0.88rem', fontWeight: '700' }}
                  >
                    {t('matches.view_details', {}, '🎮 Enter Match Lobby ➔')}
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
