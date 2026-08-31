import React, { useState, useEffect } from 'react';
import { formatMatchDate } from '../services/dateUtils';

// Countdown Timer Component
function CountdownTimer({ startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!startTime) {
      setTimeLeft('LIVE');
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
        setTimeLeft('LIVE');
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
      color: timeLeft === 'LIVE' ? 'var(--success)' : 'var(--secondary)', 
      fontFamily: 'var(--font-heading)',
      fontWeight: '700' 
    }}>
      {timeLeft}
    </span>
  );
}

// Hall of Fame Top Players Data
const HALL_OF_FAME_DATA = [
  { rank: 1, nickname: "SOUL_Viper", uid: "582910394", avatar: "👑", earnings: 48500, kills: 382, wins: 46, kd: "5.8" },
  { rank: 2, nickname: "Garena_Sniper", uid: "192837465", avatar: "🎯", earnings: 34200, kills: 310, wins: 33, kd: "4.9" },
  { rank: 3, nickname: "TotalGaming_Fan", uid: "910293847", avatar: "⚡", earnings: 27800, kills: 275, wins: 28, kd: "4.2" },
  { rank: 4, nickname: "ShadowHunter", uid: "482910283", avatar: "🦊", earnings: 21500, kills: 230, wins: 22, kd: "3.8" },
  { rank: 5, nickname: "Thunder_God", uid: "849201938", avatar: "🔥", earnings: 18900, kills: 198, wins: 19, kd: "3.5" },
  { rank: 6, nickname: "Raptor_FF", uid: "772910481", avatar: "💀", earnings: 16200, kills: 174, wins: 16, kd: "3.2" },
  { rank: 7, nickname: "Panda_OP", uid: "284019284", avatar: "🐼", earnings: 14500, kills: 160, wins: 14, kd: "3.0" }
];

export default function Dashboard({ tournaments, onSelectTournament, setCurrentView, userProfile }) {
  const [mainView, setMainView] = useState('tournaments'); // 'tournaments' | 'hall_of_fame'
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hofCategory, setHofCategory] = useState('earnings'); // 'earnings' | 'kills' | 'wins'
  
  const cleanUserUid = String(userProfile?.uid || userProfile?.id || '').trim().toLowerCase();
  const cleanUserEmail = String(userProfile?.email || '').trim().toLowerCase();

  const isPlayerInMatch = (t) => {
    if ((!cleanUserUid && !cleanUserEmail) || !t.joinedPlayers) return false;
    return t.joinedPlayers.some(p => {
      const pUid = String(p.uid || '').trim().toLowerCase();
      const pEmail = String(p.email || '').trim().toLowerCase();
      return (cleanUserUid && pUid === cleanUserUid) || (cleanUserEmail && pEmail === cleanUserEmail);
    });
  };

  const joinedCount = tournaments.filter(t => isPlayerInMatch(t)).length;
  
  // Featured Banners list
  const featured = [
    {
      id: 'banner-1',
      title: "FREE FIRE CHAMPIONS CUP",
      subtitle: "PRIZE POOL: ₹50,000 | SQUAD",
      desc: "Join the ultimate Battle Royale clash. Win huge and dominate the leaderboard.",
      tag: "FEATURED",
      map: "Bermuda",
      color: 'linear-gradient(135deg, #e65100 0%, #ff8f00 100%)'
    },
    {
      id: 'banner-2',
      title: "CLASH SQUAD SHOWDOWN",
      subtitle: "PRIZE POOL: ₹15,000 | 4V4 SOLO",
      desc: "No squad? No problem. Queue solo, get matched, and battle for the crown.",
      tag: "LIVE NOW",
      map: "Kalahari",
      color: 'linear-gradient(135deg, #311b92 0%, #00e5ff 100%)'
    }
  ];

  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const filteredTournaments = tournaments.filter(t => {
    // 1. If Room ID has been dropped, remove match from public Arena
    if (t.roomId && t.roomId.trim() !== '') {
      return false;
    }

    // 2. If current player has joined this match, hide from Arena (shown exclusively in "My Matches")
    if (isPlayerInMatch(t)) {
      return false;
    }

    // 3. Category & Mode filter
    const filter = selectedFilter.toLowerCase();
    let matchesFilter = false;
    
    if (selectedFilter === 'All') {
      matchesFilter = true;
    } else if (selectedFilter === 'CS 1v1' || selectedFilter === 'CS 1v1 ⚔️') {
      matchesFilter = t.type?.toLowerCase().includes('clash') && (t.type?.toLowerCase().includes('1v1') || t.title?.toLowerCase().includes('1v1'));
    } else if (selectedFilter === 'CS 2v2' || selectedFilter === 'CS 2v2 ⚔️') {
      matchesFilter = t.type?.toLowerCase().includes('clash') && t.type?.toLowerCase().includes('2v2');
    } else if (selectedFilter === '1v1 Headshot' || selectedFilter === '1v1 Headshot 🎯') {
      matchesFilter = (t.type?.toLowerCase().includes('headshot') && (t.type?.toLowerCase().includes('1v1') || t.title?.toLowerCase().includes('1v1'))) || (t.title?.toLowerCase().includes('1v1') && t.title?.toLowerCase().includes('headshot'));
    } else if (selectedFilter === 'Lone Wolf 1v1' || selectedFilter === 'Lone Wolf 1v1 🐺') {
      matchesFilter = t.type?.toLowerCase().includes('lone wolf') && (t.type?.toLowerCase().includes('1v1') || t.mode?.toLowerCase() === 'solo');
    } else if (selectedFilter === 'Lone Wolf 2v2' || selectedFilter === 'Lone Wolf 2v2 🐺') {
      matchesFilter = t.type?.toLowerCase().includes('lone wolf') && (t.type?.toLowerCase().includes('2v2') || t.mode?.toLowerCase() === 'duo');
    } else if (selectedFilter === 'Headshot Only' || selectedFilter === 'Headshot Only 🎯' || selectedFilter === 'CS Headshot 🎯') {
      matchesFilter = t.type?.toLowerCase().includes('headshot') || t.title?.toLowerCase().includes('headshot');
    } else if (selectedFilter === 'Clash Squad' || selectedFilter === 'Clash Squad ⚔️') {
      matchesFilter = t.type?.toLowerCase().includes('clash') || t.title?.toLowerCase().includes('clash');
    } else {
      matchesFilter = t.mode?.toLowerCase() === filter || t.type?.toLowerCase().includes(filter);
    }

    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.map?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.mode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedHof = [...HALL_OF_FAME_DATA].sort((a, b) => {
    if (hofCategory === 'earnings') return b.earnings - a.earnings;
    if (hofCategory === 'kills') return b.kills - a.kills;
    if (hofCategory === 'wins') return b.wins - a.wins;
    return 0;
  });

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '24px' }}>
      
      {/* Top Main Mode Switcher (Arena vs My Matches vs Hall of Fame) */}
      <div style={{
        display: 'flex',
        background: 'rgba(7, 9, 14, 0.7)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '16px',
        border: '1px solid var(--border-color)',
        gap: '6px'
      }}>
        <button
          type="button"
          onClick={() => setMainView('tournaments')}
          style={{
            flex: 1,
            padding: '10px 4px',
            borderRadius: '8px',
            border: 'none',
            background: mainView === 'tournaments' ? 'var(--primary)' : 'transparent',
            color: '#fff',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: mainView === 'tournaments' ? 'var(--glow-primary)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          🎮 ARENA
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('my_matches')}
          style={{
            flex: 1,
            padding: '10px 4px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: joinedCount > 0 ? 'var(--secondary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <span>🎯 MY MATCHES</span>
          {joinedCount > 0 && (
            <span style={{
              background: 'var(--secondary)',
              color: '#000',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: '900'
            }}>
              {joinedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainView('hall_of_fame')}
          style={{
            flex: 1,
            padding: '10px 4px',
            borderRadius: '8px',
            border: 'none',
            background: mainView === 'hall_of_fame' ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' : 'transparent',
            color: mainView === 'hall_of_fame' ? '#000' : 'var(--accent)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.78rem',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: mainView === 'hall_of_fame' ? '0 0 15px rgba(255,214,0,0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          🏆 HALL OF FAME
        </button>
      </div>

      {/* MODE 1: MATCH ARENA (TOURNAMENTS) */}
      {mainView === 'tournaments' && (
        <>
          {/* Featured Banner Carousel */}
          <div 
            className="glass-panel" 
            style={{
              background: featured[activeBanner].color,
              position: 'relative',
              padding: '24px',
              borderRadius: '16px',
              height: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}
          >
            <div style={{ position: 'absolute', top: '16px', left: '20px' }}>
              <span className="badge badge-live">
                ● {featured[activeBanner].tag}
              </span>
            </div>

            <div style={{ zIndex: 2, maxWidth: '80%' }}>
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>
                {featured[activeBanner].title}
              </h2>
              <p style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>
                {featured[activeBanner].subtitle}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', marginBottom: '14px', lineHeight: 1.3 }}>
                {featured[activeBanner].desc}
              </p>
            </div>

            {/* Slide indicators */}
            <div style={{ position: 'absolute', bottom: '12px', right: '16px', display: 'flex', gap: '6px' }}>
              {featured.map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveBanner(idx)}
                  style={{
                    width: activeBanner === idx ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#fff',
                    opacity: activeBanner === idx ? 1 : 0.4,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search matches by type, map, mode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ padding: '12px 16px', fontSize: '0.85rem' }}
            />

            {/* Mode Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                'All', 
                'CS 1v1 ⚔️',
                '1v1 Headshot 🎯',
                'CS 2v2 ⚔️',
                'CS Headshot 🎯', 
                'Lone Wolf 1v1 🐺', 
                'Lone Wolf 2v2 🐺', 
                'Solo', 
                'Duo', 
                'Squad', 
                'Clash Squad ⚔️', 
                'Headshot Only 🎯'
              ].map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedFilter(mode)}
                  style={{
                    background: selectedFilter === mode 
                      ? (mode.includes('🎯') ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' : 'var(--secondary)') 
                      : 'rgba(255, 255, 255, 0.05)',
                    color: selectedFilter === mode ? '#000' : 'var(--text-primary)',
                    border: selectedFilter === mode ? 'none' : '1px solid var(--border-color)',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedFilter === mode && mode.includes('🎯') ? '0 0 12px rgba(255,214,0,0.4)' : 'none'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Tournament Grid */}
          {filteredTournaments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎮</div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 6px 0' }}>
                {joinedCount > 0 ? 'All Joined Matches Moved to "My Matches"!' : 'No open tournament matches available right now.'}
              </h3>
              <p style={{ fontSize: '0.8rem', maxWidth: '360px', margin: '0 auto 16px auto', lineHeight: '1.4' }}>
                {joinedCount > 0 
                  ? 'Matches you have registered for and matches where Room IDs have dropped are shown under your My Matches tab.' 
                  : 'Host new matches from the Admin panel or check back shortly for new tournaments!'}
              </p>
              {joinedCount > 0 && (
                <button
                  onClick={() => setCurrentView('my_matches')}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  🎯 View My Matches ({joinedCount}) ➔
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredTournaments.map(t => {
                const totalSlots = t.slotsTotal || t.maxSlots || 48;
                const joinedSlots = Math.max(t.slotsJoined || 0, (t.joinedPlayers || []).length);
                const isMatchFull = joinedSlots >= totalSlots;
                const slotsPct = Math.min(Math.round((joinedSlots / totalSlots) * 100), 100);

                const cleanUserUid = String(userProfile?.uid || userProfile?.id || '').trim().toLowerCase();
                const cleanUserEmail = String(userProfile?.email || '').trim().toLowerCase();
                const isUserJoined = Boolean(
                  (cleanUserUid || cleanUserEmail) &&
                  t.joinedPlayers?.some(p => {
                    const pUid = String(p.uid || '').trim().toLowerCase();
                    const pEmail = String(p.email || '').trim().toLowerCase();
                    return (cleanUserUid && pUid === cleanUserUid) || (cleanUserEmail && pEmail === cleanUserEmail);
                  })
                );

                return (
                  <div 
                    key={t.id} 
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: isMatchFull ? '1px solid rgba(255, 23, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => onSelectTournament(t.id)}
                  >
                    {/* Header info */}
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {isMatchFull ? (
                          <span className="badge" style={{ background: '#ff1744', color: '#fff', fontWeight: '900', fontSize: '0.65rem', boxShadow: '0 0 10px rgba(255,23,68,0.5)' }}>
                            🔴 HOUSEFULL
                          </span>
                        ) : (
                          <span className={`badge ${
                            t.status === 'live' ? 'badge-live' : 
                            t.status === 'upcoming' ? 'badge-upcoming' : 'badge-completed'
                          }`}>
                            {t.status || 'open'}
                          </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {t.mode}
                        </span>
                        {t.type?.toLowerCase().includes('headshot') && (
                          <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.2) 0%, rgba(255,87,34,0.2) 100%)', color: 'var(--accent)', border: '1px solid rgba(255,214,0,0.4)', fontSize: '0.65rem', fontWeight: '900' }}>
                            🎯 {t.type?.toLowerCase().includes('1v1') ? '1v1 HEADSHOT' : 'HEADSHOT ONLY'}
                          </span>
                        )}
                        {t.type?.toLowerCase().includes('lone wolf') && (
                          <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--secondary)', border: '1px solid rgba(0, 229, 255, 0.3)', fontSize: '0.65rem', fontWeight: '700' }}>
                            🐺 {t.type}
                          </span>
                        )}
                        {t.type?.toLowerCase().includes('clash') && (
                          <span className="badge" style={{ background: 'rgba(255, 87, 34, 0.15)', color: 'var(--primary)', border: '1px solid rgba(255, 87, 34, 0.3)', fontSize: '0.65rem', fontWeight: '700' }}>
                            ⚔️ {t.type?.includes('1v1') ? 'CS 1v1' : t.type?.includes('2v2') ? 'CS 2v2' : 'CS 4v4'}
                          </span>
                        )}
                        {t.type === 'Classic' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • Battle Royale
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.12)', color: 'var(--secondary)', border: '1px solid rgba(0, 229, 255, 0.3)', fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px' }}>
                          📅 {formatMatchDate(t.matchDate, t.startTime)}
                        </span>
                        <div style={{ fontSize: '0.78rem' }}>
                          {t.startTime ? <CountdownTimer startTime={t.startTime} /> : <span style={{ color: 'var(--secondary)' }}>LIVE</span>}
                        </div>
                      </div>
                    </div>

                    {/* Match title & map */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 4px 0' }}>
                        {t.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>🗺️ Map: <strong>{t.map}</strong></span>
                        <span>{t.type?.toLowerCase().includes('lone wolf') && !t.type?.toLowerCase().includes('clash') ? '🏆 Prize Type: ' : '💰 Bounty: '}
                          <strong style={{ color: (t.type?.toLowerCase().includes('lone wolf') && !t.type?.toLowerCase().includes('clash')) ? 'var(--accent)' : 'inherit' }}>
                            {(t.type?.toLowerCase().includes('lone wolf') && !t.type?.toLowerCase().includes('clash')) ? 'Winner Takes All' : `₹${t.perKillPrize !== undefined && t.perKillPrize !== null && t.perKillPrize !== '' ? t.perKillPrize : 25}/Kill`}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Stats / Prices */}
                    <div 
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        textAlign: 'center',
                        gap: '4px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {t.type?.toLowerCase().includes('lone wolf') ? 'Winning Prize' : 'Prize Pool'}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--accent)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                          ₹{t.prizePool}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entry Fee</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                          ₹{t.entryFee}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {t.type?.includes('1v1') ? '1v1 Slots' : (t.type?.includes('2v2') || t.type?.includes('Lone Wolf')) ? '2v2 Slots' : t.type?.includes('Clash') ? '4v4 Slots' : 'Slots'}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: isMatchFull ? '#ff1744' : 'var(--secondary)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                          {joinedSlots}/{totalSlots} {isMatchFull && '🔥'}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Lobby Capacity</span>
                        <span style={{ color: isMatchFull ? '#ff1744' : 'inherit', fontWeight: isMatchFull ? '800' : 'normal' }}>
                          {isMatchFull ? '100% (FULL)' : `${slotsPct}% Filled`}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${slotsPct}%`,
                          height: '100%',
                          background: isMatchFull ? '#ff1744' : 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>

                    {/* Action button */}
                    {isUserJoined ? (
                      <button 
                        className="btn btn-outline" 
                        style={{ width: '100%', padding: '10px', fontSize: '0.8rem', marginTop: '4px', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: '800' }}
                      >
                        ✅ YOU ARE REGISTERED • ENTER LOBBY ➔
                      </button>
                    ) : isMatchFull ? (
                      <button 
                        className="btn btn-outline" 
                        style={{ width: '100%', padding: '10px', fontSize: '0.8rem', marginTop: '4px', background: 'rgba(255, 23, 68, 0.1)', borderColor: 'rgba(255, 23, 68, 0.4)', color: '#ff5252', fontWeight: '800' }}
                      >
                        🔒 HOUSEFULL (NO SLOTS LEFT) • VIEW LOBBY ➔
                      </button>
                    ) : (
                      <button 
                        className="btn btn-outline" 
                        style={{ width: '100%', padding: '10px', fontSize: '0.8rem', marginTop: '4px' }}
                      >
                        ENTER LOBBY & JOIN MATCH ➔
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODE 2: HALL OF FAME LEADERBOARD */}
      {mainView === 'hall_of_fame' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header Card */}
          <div className="glass-panel" style={{
            background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.15) 0%, rgba(21, 28, 51, 0.95) 100%)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 214, 0, 0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)', margin: '0 0 4px 0', fontSize: '1.4rem' }}>
              👑 ESPORTS HALL OF FAME
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Top competitive Free Fire warriors & prize earners on Zest.
            </p>
          </div>

          {/* Filter Categories */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'earnings', label: '💰 Top Earners (₹)' },
              { id: 'kills', label: '🎯 Kill Masters' },
              { id: 'wins', label: '🏆 Win Champions' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setHofCategory(cat.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: 'none',
                  background: hofCategory === cat.id ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                  color: hofCategory === cat.id ? '#000' : '#fff',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Top 3 Podium Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignItems: 'end', marginTop: '8px' }}>
            
            {/* Rank 2 - Silver */}
            <div className="glass-panel" style={{ padding: '12px 6px', textAlign: 'center', border: '1px solid #c0c0c0', background: 'rgba(192,192,192,0.08)' }}>
              <div style={{ fontSize: '1.4rem' }}>🥈</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sortedHof[1]?.nickname}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '900', marginTop: '2px' }}>
                {hofCategory === 'earnings' ? `₹${sortedHof[1]?.earnings}` : hofCategory === 'kills' ? `${sortedHof[1]?.kills} Kills` : `${sortedHof[1]?.wins} Wins`}
              </div>
            </div>

            {/* Rank 1 - Gold (Elevated) */}
            <div className="glass-panel" style={{ padding: '16px 6px', textAlign: 'center', border: '2px solid #ffd600', background: 'rgba(255,214,0,0.12)', boxShadow: '0 0 20px rgba(255,214,0,0.3)', transform: 'translateY(-10px)' }}>
              <div style={{ fontSize: '1.8rem' }}>🥇</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffd600', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sortedHof[0]?.nickname}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--accent)', fontWeight: '900', marginTop: '2px' }}>
                {hofCategory === 'earnings' ? `₹${sortedHof[0]?.earnings}` : hofCategory === 'kills' ? `${sortedHof[0]?.kills} Kills` : `${sortedHof[0]?.wins} Wins`}
              </div>
              <span className="badge" style={{ background: '#ffd600', color: '#000', fontSize: '0.6rem', fontWeight: '900', marginTop: '4px' }}>
                MVP #1
              </span>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="glass-panel" style={{ padding: '12px 6px', textAlign: 'center', border: '1px solid #cd7f32', background: 'rgba(205,127,50,0.08)' }}>
              <div style={{ fontSize: '1.4rem' }}>🥉</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sortedHof[2]?.nickname}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '900', marginTop: '2px' }}>
                {hofCategory === 'earnings' ? `₹${sortedHof[2]?.earnings}` : hofCategory === 'kills' ? `${sortedHof[2]?.kills} Kills` : `${sortedHof[2]?.wins} Wins`}
              </div>
            </div>

          </div>

          {/* Full Hall of Fame List */}
          <div className="glass-panel" style={{ padding: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              GLOBAL RANKINGS TABLE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedHof.map((player, idx) => (
                <div 
                  key={idx}
                  className="flex-between"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: idx < 3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '900', width: '20px', color: idx === 0 ? '#ffd600' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: '1.2rem' }}>{player.avatar}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{player.nickname}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UID: {player.uid} • KD: {player.kd}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>
                      ₹{player.earnings}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>
                      🎯 {player.kills} Kills | {player.wins} Wins
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
