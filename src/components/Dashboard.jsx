import React, { useState, useEffect } from 'react';

// Countdown Timer Component
function CountdownTimer({ startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const target = new Date(startTime).getTime();
    
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

export default function Dashboard({ tournaments, onSelectTournament, setCurrentView }) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    const matchesFilter = selectedFilter === 'All' || t.mode.toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.map.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '24px' }}>
      
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
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          marginBottom: '20px',
          transition: 'all 0.5s ease'
        }}
      >
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />

        <span className="badge" style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(0,0,0,0.5)',
          color: activeBanner === 0 ? 'var(--accent)' : 'var(--success)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {featured[activeBanner].tag}
        </span>

        <h3 style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '4px' }}>
          {featured[activeBanner].subtitle}
        </h3>
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontFamily: 'var(--font-heading)',
          fontWeight: '900', 
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          marginBottom: '8px'
        }}>
          {featured[activeBanner].title}
        </h2>
        <p style={{ 
          fontSize: '0.85rem', 
          color: 'rgba(255,255,255,0.9)', 
          maxWidth: '80%',
          lineHeight: '1.4',
          marginBottom: '16px'
        }}>
          {featured[activeBanner].desc}
        </p>

        {/* Carousel indicators */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          gap: '6px'
        }}>
          {featured.map((_, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveBanner(idx)}
              style={{
                width: idx === activeBanner ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: '#fff',
                opacity: idx === activeBanner ? 1 : 0.4,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="flex-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Solo', 'Duo', 'Squad'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: '20px',
                background: selectedFilter === filter ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${selectedFilter === filter ? 'var(--primary)' : 'var(--border-color)'}`,
                boxShadow: selectedFilter === filter ? 'var(--glow-primary)' : 'none',
                color: '#fff'
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '200px' }}>
          <input 
            type="text" 
            placeholder="Search map/mode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              padding: '6px 12px 6px 30px',
              fontSize: '0.85rem',
              borderRadius: '20px',
              height: '32px'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            🔍
          </span>
        </div>
      </div>

      {/* Tournament Cards Grid */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🏆</span> Active Tournaments
      </h2>

      {filteredTournaments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🚀 No Tournaments Found</p>
          <p style={{ fontSize: '0.85rem' }}>Create your own using the "HOST" panel at the bottom!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTournaments.map(t => {
            const slotsPct = Math.round((t.slotsJoined / t.slotsTotal) * 100);
            
            return (
              <div 
                key={t.id} 
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => onSelectTournament(t.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {/* Header info */}
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${
                      t.status === 'live' ? 'badge-live' : 
                      t.status === 'upcoming' ? 'badge-upcoming' : 'badge-completed'
                    }`}>
                      {t.status}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.mode} • {t.type}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem' }}>
                    {t.status === 'upcoming' ? (
                      <CountdownTimer startTime={t.startTime} />
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Finished</span>
                    )}
                  </div>
                </div>

                {/* Match title & map */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>
                    {t.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>🗺️ Map: <strong>{t.map}</strong></span>
                    <span>🕒 {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Stats / Prices */}
                <div 
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    textAlign: 'center',
                    gap: '4px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prize Pool</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--accent)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                      ₹{t.prizePool}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entry Fee</div>
                    <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                      {t.entryFee === 0 ? 'FREE' : `₹${t.entryFee}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Slots</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--secondary)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                      {t.slotsJoined}/{t.slotsTotal}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{slotsPct}% Filled</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${slotsPct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Action button */}
                <div style={{ marginTop: '4px' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ width: '100%', padding: '10px', fontSize: '0.8rem' }}
                  >
                    ENTER LOBBY & VIEW DETAILS
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
