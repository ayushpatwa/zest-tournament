import React, { useState } from 'react';

export default function Navbar({ currentView, setCurrentView, walletBalance, currentUser, cloudNotifications = [] }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    const saved = localStorage.getItem('zest_read_notif_ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate unread items
  const unreadCount = cloudNotifications.filter(n => !readNotifIds.includes(n.id)).length;

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen && cloudNotifications.length > 0) {
      const allIds = cloudNotifications.map(n => n.id);
      setReadNotifIds(allIds);
      localStorage.setItem('zest_read_notif_ids', JSON.stringify(allIds));
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const getPageTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'ARENA';
      case 'my_matches': return 'MY MATCHES';
      case 'lobby': return 'MATCH LOBBY';
      case 'wallet': return 'MY WALLET';
      case 'rules': return 'RULES & FAIRPLAY';
      case 'profile': return 'PLAYER PROFILE';
      case 'admin': return 'HOST MATCH';
      default: return 'ZEST';
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <header style={{
        width: '100%',
        background: 'rgba(15, 18, 29, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        paddingTop: 'calc(var(--safe-area-top) + 8px)',
        paddingBottom: '8px',
        paddingLeft: '16px',
        paddingRight: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '48px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Left: Brand Logo and Title */}
          <div 
            onClick={() => setCurrentView('dashboard')} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer' 
            }}
          >
            <div style={{
              background: isAdmin 
                ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' 
                : 'linear-gradient(135deg, var(--primary) 0%, #ff1744 100%)',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: '900',
              fontSize: '1.3rem',
              color: '#fff',
              boxShadow: isAdmin ? '0 0 15px rgba(255, 214, 0, 0.5)' : 'var(--glow-primary)'
            }}>
              {isAdmin ? '👑' : '🔥'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ 
                  fontSize: '1.15rem', 
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: '900',
                  background: 'linear-gradient(90deg, #ffffff 30%, var(--primary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '1px'
                }}>
                  ZEST
                </h1>
                {isAdmin ? (
                  <span className="badge" style={{ 
                    background: 'rgba(255, 214, 0, 0.2)', 
                    color: 'var(--accent)', 
                    border: '1px solid rgba(255, 214, 0, 0.4)',
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '900'
                  }}>
                    👑 ADMIN
                  </span>
                ) : (
                  <span className="badge" style={{ 
                    background: 'rgba(255,87,34,0.15)', 
                    color: 'var(--primary)', 
                    border: '1px solid rgba(255,87,34,0.3)',
                    fontSize: '0.6rem',
                    padding: '2px 5px',
                    borderRadius: '4px'
                  }}>
                    FREE FIRE
                  </span>
                )}
              </div>
              <span style={{ 
                fontSize: '0.65rem', 
                color: isAdmin ? 'var(--accent)' : 'var(--secondary)', 
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.5px',
                fontWeight: '700'
              }}>
                ● {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Telegram Contact Us Support Button */}
            <a
              href="https://t.me/zesttournament"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.25) 0%, rgba(0, 229, 255, 0.15) 100%)',
                border: '1px solid #0088cc',
                color: '#00e5ff',
                padding: '5px 10px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: '700',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 136, 204, 0.3)'
              }}
            >
              <span>✈️</span>
              <span>CONTACT US</span>
            </a>

            {/* Wallet Cash Button */}
            <div 
              onClick={() => setCurrentView('wallet')}
              className="flex-center" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,214,0,0.1) 0%, rgba(255,87,34,0.1) 100%)',
                border: '1px solid rgba(255, 214, 0, 0.3)',
                padding: '6px 12px',
                borderRadius: '20px',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>🪙</span>
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '0.85rem', 
                fontWeight: '700',
                color: 'var(--accent)'
              }}>
                ₹{walletBalance}
              </span>
            </div>

            {/* Notifications Button */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={toggleNotifications}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1rem',
                  position: 'relative'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    background: 'var(--danger)',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px var(--danger)'
                  }} />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div 
                  className="glass-panel animate-slide-in" 
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: '0',
                    width: '310px',
                    padding: '14px',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.85)'
                  }}
                >
                  <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>
                      📢 NOTIFICATIONS ({cloudNotifications.length})
                    </span>
                    <span 
                      onClick={() => {
                        const allIds = cloudNotifications.map(n => n.id);
                        setReadNotifIds(allIds);
                        localStorage.setItem('zest_read_notif_ids', JSON.stringify(allIds));
                      }} 
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Mark all read
                    </span>
                  </div>

                  {cloudNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.8rem' }}>
                      🔔 No announcements yet. When the admin posts tournament notices, they will appear here!
                    </div>
                  ) : (
                    cloudNotifications.map(n => {
                      const isUnread = !readNotifIds.includes(n.id);
                      return (
                        <div key={n.id} style={{
                          fontSize: '0.78rem',
                          lineHeight: '1.35',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isUnread ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          borderLeft: `3px solid ${n.type === 'alert' ? 'var(--danger)' : n.type === 'prize' ? 'var(--success)' : 'var(--primary)'}`,
                          border: isUnread ? '1px solid rgba(0, 229, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div className="flex-between" style={{ gap: '6px' }}>
                            <strong style={{ color: '#fff', fontSize: '0.82rem' }}>
                              {n.title || 'Match Notice'}
                            </strong>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {n.createdTimeStr || 'Just now'}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                            {n.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quick Profile Avatar */}
            <div 
              onClick={() => setCurrentView('profile')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isAdmin 
                  ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' 
                  : 'linear-gradient(135deg, var(--secondary) 0%, #00b8d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              {isAdmin ? '👑' : '🦊'}
            </div>

          </div>
        </div>

        {/* Neon Accent Bottom Border line */}
        <div style={{
          height: '2px',
          width: '100%',
          background: isAdmin 
            ? 'linear-gradient(90deg, #ffd600 0%, var(--primary) 50%, var(--secondary) 100%)' 
            : 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)',
          marginTop: '6px',
          opacity: 0.8
        }} />
      </header>

      {/* Bottom Navigation Tab Bar for Native Mobile Experience */}
      <nav className="glass-panel" style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        right: '12px',
        height: '60px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 8px',
        zIndex: 1000,
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -4px 25px rgba(0,0,0,0.7)',
        marginBottom: 'var(--safe-area-bottom)'
      }}>
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: currentView === 'dashboard' || currentView === 'lobby' ? 'var(--secondary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.68rem',
            fontWeight: '700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎮</span>
          <span>ARENA</span>
        </button>

        <button 
          onClick={() => setCurrentView('my_matches')}
          style={{
            background: 'none',
            border: 'none',
            color: currentView === 'my_matches' ? 'var(--secondary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.68rem',
            fontWeight: '700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <span>MY MATCHES</span>
        </button>

        <button 
          onClick={() => setCurrentView('wallet')}
          style={{
            background: 'none',
            border: 'none',
            color: currentView === 'wallet' ? 'var(--secondary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.68rem',
            fontWeight: '700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>💳</span>
          <span>WALLET</span>
        </button>

        <button 
          onClick={() => setCurrentView('profile')}
          style={{
            background: 'none',
            border: 'none',
            color: currentView === 'profile' ? 'var(--secondary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.68rem',
            fontWeight: '700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>PROFILE</span>
        </button>

        {/* HOST OPTION - EXCLUSIVELY FOR ADMIN LOGIN ONLY */}
        {isAdmin && (
          <button 
            onClick={() => setCurrentView('admin')}
            style={{
              background: 'none',
              border: 'none',
              color: currentView === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.68rem',
              fontWeight: '700',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <span>HOST (ADMIN)</span>
          </button>
        )}
      </nav>
    </>
  );
}
