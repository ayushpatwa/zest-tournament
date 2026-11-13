import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatMatchDate, sortTournamentsByTime } from '../services/dateUtils';
import { subscribeToAppSettingsRealtime, subscribeToWinningLeaderboardRealtime } from '../services/firebase';
import { isMatchCompleted, getUserAllJoinedMatches } from '../services/matchHistoryService';

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



export default function Dashboard({ tournaments, onSelectTournament, setCurrentView, userProfile }) {
  const { t } = useLanguage();
  const isHostOrAdmin = String(userProfile?.uid || '').trim() === '9084311275' || 
                        String(userProfile?.phone || '').trim() === '9084311275' ||
                        userProfile?.role === 'admin' || 
                        userProfile?.isHost;
  const [mainView, setMainView] = useState('tournaments'); // 'tournaments' | 'hall_of_fame'
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveLeaderboard, setLiveLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToWinningLeaderboardRealtime((data) => {
      setLiveLeaderboard((data || []).slice(0, 10));
      setLeaderboardLoading(false);
    }, 10);
    return () => unsub();
  }, []);
  const [referralReward, setReferralReward] = useState(0);

  useEffect(() => {
    const unsub = subscribeToAppSettingsRealtime((settings) => {
      if (settings && typeof settings.referralReward === 'number') {
        setReferralReward(settings.referralReward);
      }
    });
    return () => unsub();
  }, []);
  
  const userJoinedMatches = getUserAllJoinedMatches(tournaments, userProfile);
  const userUpcomingJoined = userJoinedMatches.filter(t => !isMatchCompleted(t, tournaments));
  const joinedCount = userUpcomingJoined.length;

  const isPlayerInMatch = (tourney) => {
    if (!tourney) return false;

    // Direct check if match exists in userProfile's joinedMatchesHistory
    if (Array.isArray(userProfile?.joinedMatchesHistory)) {
      if (userProfile.joinedMatchesHistory.some(m => String(m?.id || '').trim() === String(tourney.id).trim())) {
        return true;
      }
    }

    if (!Array.isArray(tourney.joinedPlayers)) return false;

    const userKeys = new Set();
    const addKey = (val) => {
      if (!val) return;
      const s = String(val).trim().toLowerCase();
      if (s && s !== 'n/a' && s !== 'undefined' && s !== 'null') {
        userKeys.add(s);
        const digits = s.replace(/\D/g, '');
        if (digits.length >= 10) userKeys.add(digits.slice(-10));
      }
    };

    addKey(userProfile?.uid);
    addKey(userProfile?.id);
    addKey(userProfile?.docId);
    addKey(userProfile?.email);
    addKey(userProfile?.phone);
    addKey(userProfile?.nickname);

    if (userKeys.size === 0) return false;

    return tourney.joinedPlayers.some(p => {
      if (!p) return false;
      const playerValues = [p.uid, p.id, p.email, p.phone, p.nickname, p.playerUid, p.freeFireUid];
      return playerValues.some(v => {
        if (!v) return false;
        const s = String(v).trim().toLowerCase();
        if (userKeys.has(s)) return true;
        const digits = s.replace(/\D/g, '');
        if (digits.length >= 10 && userKeys.has(digits.slice(-10))) return true;
        return false;
      });
    });
  };
  
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

  const filteredTournaments = tournaments.filter(tourney => {
    // 0. Host Staging & Draft Protection: Hide unpublished/draft matches from regular players
    // Until published by host, the match section will be completely clear for all players.
    if (tourney.isDraft === true || tourney.isPublished === false || tourney.status === 'draft') {
      return false;
    }

    // 1. If Room ID has been dropped, remove match from public Arena
    if (tourney.roomId && tourney.roomId.trim() !== '') {
      return false;
    }

    // 2. If current player has joined this match, hide from Arena (shown exclusively in "My Matches")
    if (isPlayerInMatch(tourney)) {
      return false;
    }

    // 3. Category & Mode filter
    const filter = selectedFilter.toLowerCase();
    let matchesFilter = false;
    
    if (selectedFilter === 'All') {
      matchesFilter = true;
    } else if (selectedFilter === 'CS 1v1' || selectedFilter === 'CS 1v1 ⚔️') {
      matchesFilter = tourney.type?.toLowerCase().includes('clash') && (tourney.type?.toLowerCase().includes('1v1') || tourney.title?.toLowerCase().includes('1v1'));
    } else if (selectedFilter === 'CS 2v2' || selectedFilter === 'CS 2v2 ⚔️') {
      matchesFilter = tourney.type?.toLowerCase().includes('clash') && tourney.type?.toLowerCase().includes('2v2');
    } else if (selectedFilter === '1v1 Headshot' || selectedFilter === '1v1 Headshot 🎯') {
      matchesFilter = (tourney.type?.toLowerCase().includes('headshot') && (tourney.type?.toLowerCase().includes('1v1') || tourney.title?.toLowerCase().includes('1v1'))) || (tourney.title?.toLowerCase().includes('1v1') && tourney.title?.toLowerCase().includes('headshot'));
    } else if (selectedFilter === 'Lone Wolf 1v1' || selectedFilter === 'Lone Wolf 1v1 🐺') {
      matchesFilter = tourney.type?.toLowerCase().includes('lone wolf') && (tourney.type?.toLowerCase().includes('1v1') || tourney.mode?.toLowerCase() === 'solo');
    } else if (selectedFilter === 'Lone Wolf 2v2' || selectedFilter === 'Lone Wolf 2v2 🐺') {
      matchesFilter = tourney.type?.toLowerCase().includes('lone wolf') && (tourney.type?.toLowerCase().includes('2v2') || tourney.mode?.toLowerCase() === 'duo');
    } else if (selectedFilter === 'Headshot Only' || selectedFilter === 'Headshot Only 🎯' || selectedFilter === 'CS Headshot 🎯') {
      matchesFilter = tourney.type?.toLowerCase().includes('headshot') || tourney.title?.toLowerCase().includes('headshot');
    } else if (selectedFilter === 'Clash Squad' || selectedFilter === 'Clash Squad ⚔️') {
      matchesFilter = tourney.type?.toLowerCase().includes('clash') || tourney.title?.toLowerCase().includes('clash');
    } else if (selectedFilter === 'Classic BR 👑' || selectedFilter === 'Classic BR' || selectedFilter === 'Battle Royale') {
      matchesFilter = tourney.type?.toLowerCase().includes('battle royal') || tourney.title?.toLowerCase().includes('battle royal') || Boolean(tourney.isBattleRoyale);
    } else {
      matchesFilter = tourney.mode?.toLowerCase() === filter || tourney.type?.toLowerCase().includes(filter);
    }

    const matchesSearch = tourney.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tourney.map?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tourney.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tourney.mode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedTournaments = sortTournamentsByTime(filteredTournaments);

  

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
          🎮 {t('dashboard.arena_tab', {}, 'ARENA')}
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
            color: (joinedCount > 0 || userJoinedMatches.length > 0) ? 'var(--secondary)' : 'var(--text-muted)',
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
          <span>🎯 {t('dashboard.my_matches_tab', {}, 'MY MATCHES')}</span>
          {(joinedCount > 0 || userJoinedMatches.length > 0) && (
            <span style={{
              background: joinedCount > 0 ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.2)',
              color: joinedCount > 0 ? '#000' : '#fff',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: '900'
            }}>
              {joinedCount > 0 ? joinedCount : userJoinedMatches.length}
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
          🏆 {t('dashboard.hall_of_fame_tab', {}, 'LEADERBOARD')}
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

          {/* Refer & Earn Promo Strip */}
          <div
            onClick={() => typeof setCurrentView === 'function' && setCurrentView('refer')}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.15) 0%, rgba(255, 87, 34, 0.12) 50%, rgba(0, 229, 255, 0.1) 100%)',
              border: '1px solid rgba(255, 214, 0, 0.35)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 214, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎁</span>
              <div>
                <strong style={{ fontSize: '0.8rem', color: '#ffd600', display: 'block' }}>
                  {referralReward > 0 ? 'Refer Friends & Win Free Coins!' : 'Invite Squad & Compete Together!'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {referralReward > 0 
                    ? `Earn ₹${referralReward} instant bonus coins on every friend's signup.` 
                    : 'Invite your friends to play tournaments & 1v1 custom battles.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)',
                border: 'none',
                color: '#000',
                fontWeight: '900',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.7rem',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Refer Now →
            </button>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder={t('dashboard.search_placeholder', {}, '🔍 Search matches by type, map, mode...')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ padding: '12px 16px', fontSize: '0.85rem' }}
            />

            {/* Mode Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                'All', 
                'Classic BR 👑',
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
          {sortedTournaments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎮</div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 6px 0' }}>
                {joinedCount > 0 ? t('dashboard.my_matches_tab', {}, 'My Matches') : t('dashboard.no_matches_title', {}, 'No open tournament matches available right now.')}
              </h3>
              <p style={{ fontSize: '0.8rem', maxWidth: '360px', margin: '0 auto 16px auto', lineHeight: '1.4' }}>
                {joinedCount > 0 
                  ? 'Matches you have registered for and matches where Room IDs have dropped are shown under your My Matches tab.' 
                  : t('dashboard.no_matches_desc', {}, 'Check back shortly for new tournaments or view matches you already joined!')}
              </p>
              {joinedCount > 0 && (
                <button
                  onClick={() => setCurrentView('my_matches')}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  🎯 {t('dashboard.view_my_matches', {}, 'View My Matches →')} ({joinedCount})
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedTournaments.map(tourney => {
                const totalSlots = tourney.slotsTotal || tourney.maxSlots || 48;
                const joinedSlots = Math.max(tourney.slotsJoined || 0, (tourney.joinedPlayers || []).length);
                const isMatchFull = joinedSlots >= totalSlots;
                const slotsPct = Math.min(Math.round((joinedSlots / totalSlots) * 100), 100);

                const isUserJoined = isPlayerInMatch(tourney);

                const isPinned = Boolean(tourney.isPinned || tourney.pinned || tourney.isHighlighted);

                return (
                  <div 
                    key={tourney.id} 
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: isPinned 
                        ? '1.5px solid #ffd600' 
                        : isMatchFull 
                          ? '1px solid rgba(255, 23, 68, 0.35)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isPinned 
                        ? '0 0 16px rgba(255, 214, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.4)' 
                        : undefined,
                      background: isPinned 
                        ? 'linear-gradient(135deg, rgba(255, 214, 0, 0.04) 0%, rgba(21, 28, 51, 0.95) 100%)' 
                        : undefined,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => onSelectTournament(tourney.id)}
                  >
                    {/* Header info */}
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {isPinned && (
                          <span className="badge" style={{ 
                            background: 'linear-gradient(135deg, #ffd600 0%, #ff9100 100%)', 
                            color: '#000', 
                            fontWeight: '900', 
                            fontSize: '0.68rem',
                            boxShadow: '0 0 10px rgba(255, 214, 0, 0.5)',
                            letterSpacing: '0.5px'
                          }}>
                            {t('dashboard.pinned_match', {}, '📌 PINNED MATCH')}
                          </span>
                        )}
                        {isMatchCompleted(tourney) ? (
                          <span className="badge badge-completed" style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--secondary)', border: '1px solid rgba(0, 229, 255, 0.4)', fontWeight: '900', fontSize: '0.65rem' }}>
                            🏁 COMPLETED
                          </span>
                        ) : isMatchFull ? (
                          <span className="badge" style={{ background: '#ff1744', color: '#fff', fontWeight: '900', fontSize: '0.65rem', boxShadow: '0 0 10px rgba(255,23,68,0.5)' }}>
                            {t('dashboard.housefull', {}, '🔴 HOUSEFULL')}
                          </span>
                        ) : (
                          <span className={`badge ${
                            tourney.status === 'live' ? 'badge-live' : 
                            tourney.status === 'upcoming' ? 'badge-upcoming' : 'badge-completed'
                          }`}>
                            {tourney.status || 'open'}
                          </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {tourney.mode}
                        </span>
                        {tourney.type?.toLowerCase().includes('headshot') && (
                          <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.2) 0%, rgba(255,87,34,0.2) 100%)', color: 'var(--accent)', border: '1px solid rgba(255,214,0,0.4)', fontSize: '0.65rem', fontWeight: '900' }}>
                            🎯 {tourney.type?.toLowerCase().includes('1v1') ? '1v1 HEADSHOT' : 'HEADSHOT ONLY'}
                          </span>
                        )}
                        {tourney.type?.toLowerCase().includes('lone wolf') && (
                          <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--secondary)', border: '1px solid rgba(0, 229, 255, 0.3)', fontSize: '0.65rem', fontWeight: '700' }}>
                            🐺 {tourney.type}
                          </span>
                        )}
                        {tourney.type?.toLowerCase().includes('clash') && (
                          <span className="badge" style={{ background: 'rgba(255, 87, 34, 0.15)', color: 'var(--primary)', border: '1px solid rgba(255, 87, 34, 0.3)', fontSize: '0.65rem', fontWeight: '700' }}>
                            ⚔️ {tourney.type?.includes('1v1') ? 'CS 1v1' : tourney.type?.includes('2v2') ? 'CS 2v2' : 'CS 4v4'}
                          </span>
                        )}
                        {tourney.type === 'Classic' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • Battle Royale
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
                      <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 4px 0' }}>
                        {tourney.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>🗺️ {t('dashboard.map', {}, 'Map')}: <strong>{tourney.map}</strong></span>
                        <span>{tourney.type?.toLowerCase().includes('lone wolf') && !tourney.type?.toLowerCase().includes('clash') ? '🏆 ' : '💰 '}
                          <strong style={{ color: (tourney.type?.toLowerCase().includes('lone wolf') && !tourney.type?.toLowerCase().includes('clash')) ? 'var(--accent)' : 'inherit' }}>
                            {(tourney.type?.toLowerCase().includes('lone wolf') && !tourney.type?.toLowerCase().includes('clash')) ? t('dashboard.winner_takes_all', {}, 'Winner Takes All') : `₹${tourney.perKillPrize !== undefined && tourney.perKillPrize !== null && tourney.perKillPrize !== '' ? tourney.perKillPrize : 25}${t('dashboard.per_kill', {}, '/Kill')}`}
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
                          {tourney.type?.toLowerCase().includes('lone wolf') ? t('dashboard.winning_prize', {}, 'Winning Prize') : t('dashboard.prize_pool', {}, 'Prize Pool')}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--accent)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                          ₹{tourney.prizePool}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {t('dashboard.entry_fee', {}, 'Entry Fee')}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                          ₹{tourney.entryFee}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {tourney.type?.includes('1v1') ? '1v1 Slots' : (tourney.type?.includes('2v2') || tourney.type?.includes('Lone Wolf')) ? '2v2 Slots' : tourney.type?.includes('Clash') ? '4v4 Slots' : t('dashboard.slots', {}, 'Slots')}
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

      {/* MODE 2: LIVE WINNINGS LEADERBOARD */}
      {mainView === 'hall_of_fame' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header Card */}
          <div className="glass-panel" style={{
            background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.15) 0%, rgba(21, 28, 51, 0.95) 100%)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 214, 0, 0.3)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(0, 230, 118, 0.15)',
              border: '1px solid rgba(0, 230, 118, 0.4)',
              color: '#00e676',
              fontSize: '0.72rem',
              fontWeight: '800',
              marginBottom: '8px'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#00e676',
                boxShadow: '0 0 8px #00e676',
                display: 'inline-block'
              }} />
              ● TOP 10 LIVE REAL-TIME RANKINGS
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)', margin: '0 0 4px 0', fontSize: '1.4rem' }}>
              👑 TOP 10 ESPORTS WINNINGS LEADERBOARD
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Top 10 players ranked strictly by tournament winning cash in real-time.
            </p>
          </div>

          {leaderboardLoading ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
              <div>Loading live leaderboard from cloud...</div>
            </div>
          ) : liveLeaderboard.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎮</div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 6px 0' }}>No Prize Winners Yet</h3>
              <p style={{ fontSize: '0.8rem', maxWidth: '360px', margin: '0 auto', lineHeight: '1.4' }}>
                Join tournament matches in the Arena to win real cash prizes and claim the #1 spot on the leaderboard!
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards */}
              {liveLeaderboard.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignItems: 'end', marginTop: '4px' }}>
                  
                  {/* Rank 2 - Silver */}
                  {liveLeaderboard[1] ? (
                    <div className="glass-panel" style={{ padding: '14px 6px', textAlign: 'center', border: '1px solid #c0c0c0', background: 'rgba(192,192,192,0.08)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem' }}>🥈</div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: '#fff',
                        marginTop: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        padding: '0 4px'
                      }}>
                        {liveLeaderboard[1].nickname}
                      </div>
                      <div style={{ fontSize: '1rem', color: '#c0c0c0', fontWeight: '900', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
                        ₹{liveLeaderboard[1].winningAmount}
                      </div>
                    </div>
                  ) : <div />}

                  {/* Rank 1 - Gold (Elevated MVP) */}
                  <div className="glass-panel" style={{
                    padding: '18px 6px',
                    textAlign: 'center',
                    border: '2px solid #ffd600',
                    background: 'rgba(255,214,0,0.14)',
                    boxShadow: '0 0 25px rgba(255,214,0,0.3)',
                    transform: 'translateY(-8px)',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '2rem' }}>🥇</div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: '900',
                      color: '#ffd600',
                      marginTop: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      padding: '0 4px'
                    }}>
                      {liveLeaderboard[0]?.nickname}
                    </div>
                    <div style={{ fontSize: '1.15rem', color: '#00e676', fontWeight: '900', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
                      ₹{liveLeaderboard[0]?.winningAmount}
                    </div>
                    <span className="badge" style={{ background: '#ffd600', color: '#000', fontSize: '0.62rem', fontWeight: '900', marginTop: '6px' }}>
                      👑 TOP WINNER #1
                    </span>
                  </div>

                  {/* Rank 3 - Bronze */}
                  {liveLeaderboard[2] ? (
                    <div className="glass-panel" style={{ padding: '14px 6px', textAlign: 'center', border: '1px solid #cd7f32', background: 'rgba(205,127,50,0.08)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem' }}>🥉</div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: '#fff',
                        marginTop: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        padding: '0 4px'
                      }}>
                        {liveLeaderboard[2].nickname}
                      </div>
                      <div style={{ fontSize: '1rem', color: '#cd7f32', fontWeight: '900', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
                        ₹{liveLeaderboard[2].winningAmount}
                      </div>
                    </div>
                  ) : <div />}

                </div>
              )}

              {/* Full Leaderboard List Table (Only Name & Winning Amount) */}
              <div className="glass-panel" style={{ padding: '12px' }}>
                <div className="flex-between" style={{ marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rank & Player Name
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Winning Amount
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {liveLeaderboard.map((player, idx) => {
                    const isSelf = (userProfile?.uid && (player.id === userProfile.uid || player.id === userProfile.id)) ||
                                   (userProfile?.nickname && player.nickname.toLowerCase() === userProfile.nickname.toLowerCase());
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                      <div 
                        key={player.id || idx}
                        className="flex-between"
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: isSelf 
                            ? 'rgba(0, 229, 255, 0.12)' 
                            : idx < 3 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(255, 255, 255, 0.02)',
                          border: isSelf 
                            ? '1px solid #00e5ff' 
                            : idx === 0 
                              ? '1px solid rgba(255, 214, 0, 0.4)' 
                              : '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Left: Rank & Player Name Only */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '78px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: '900',
                            letterSpacing: '0.4px',
                            background: isTop1 ? 'linear-gradient(135deg, rgba(255, 214, 0, 0.28) 0%, rgba(255, 143, 0, 0.18) 100%)'
                                      : isTop2 ? 'linear-gradient(135deg, rgba(224, 224, 224, 0.25) 0%, rgba(158, 158, 158, 0.15) 100%)'
                                      : isTop3 ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.25) 0%, rgba(139, 69, 19, 0.15) 100%)'
                                      : 'rgba(255, 255, 255, 0.06)',
                            color: isTop1 ? '#ffd600' : isTop2 ? '#e0e0e0' : isTop3 ? '#cd7f32' : 'var(--text-secondary)',
                            border: `1px solid ${isTop1 ? '#ffd600' : isTop2 ? '#b0bec5' : isTop3 ? '#cd7f32' : 'rgba(255, 255, 255, 0.1)'}`,
                            boxShadow: isTop1 ? '0 0 10px rgba(255, 214, 0, 0.25)' : 'none',
                            flexShrink: 0
                          }}>
                            {isTop1 ? '🥇 RANK #1' : isTop2 ? '🥈 RANK #2' : isTop3 ? '🥉 RANK #3' : `RANK #${idx + 1}`}
                          </div>
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: '800',
                            color: isSelf ? '#00e5ff' : '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {player.nickname}
                            {isSelf && (
                              <span style={{
                                marginLeft: '6px',
                                fontSize: '0.68rem',
                                color: '#00e5ff',
                                fontWeight: '900'
                              }}>
                                (You)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Right: Winning Amount Only */}
                        <div style={{
                          fontSize: '1rem',
                          color: '#00e676',
                          fontWeight: '900',
                          fontFamily: 'var(--font-heading)',
                          letterSpacing: '0.5px',
                          flexShrink: 0
                        }}>
                          ₹{player.winningAmount}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}
