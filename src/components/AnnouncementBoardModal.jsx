import React from 'react';

export default function AnnouncementBoardModal({ announcement, onDismiss }) {
  if (!announcement || !announcement.title) return null;

  const {
    title = 'Official Announcement',
    message = '',
    tag = '🚨 IMPORTANT NOTICE',
    link = '',
    linkText = 'View Details'
  } = announcement;

  const handleOpenLink = () => {
    if (!link) return;
    try {
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (_) {
      window.location.href = link;
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="glass-panel animate-slide-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '24px 20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(12, 15, 25, 0.98) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.45)',
          boxShadow: '0 12px 45px rgba(255, 87, 34, 0.25), 0 0 25px rgba(255, 214, 0, 0.15)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Top Glowing Icon Badge */}
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff5722 0%, #ffd600 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 14px auto',
            boxShadow: '0 0 25px rgba(255, 87, 34, 0.6)'
          }}
        >
          📢
        </div>

        {/* Tag / Category Badge */}
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: 'rgba(255, 87, 34, 0.15)',
          border: '1px solid #ff5722',
          borderRadius: '12px',
          fontSize: '0.72rem',
          color: '#ff7043',
          fontWeight: '900',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px'
        }}>
          {tag || '🚨 IMPORTANT NOTICE'}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.25rem',
          color: '#ffffff',
          margin: '0 0 10px 0',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.5px',
          lineHeight: 1.3
        }}>
          {title}
        </h2>

        {/* Message Content */}
        {message && (
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'left',
              fontSize: '0.84rem',
              color: 'rgba(255, 255, 255, 0.92)',
              lineHeight: '1.6',
              margin: '12px 0 18px 0',
              maxHeight: '180px',
              overflowY: 'auto',
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: message ? '0' : '16px' }}>
          {link && (
            <button
              type="button"
              onClick={handleOpenLink}
              className="btn"
              style={{
                padding: '12px',
                fontSize: '0.85rem',
                fontWeight: '800',
                borderRadius: '10px',
                background: 'rgba(0, 229, 255, 0.12)',
                border: '1px solid var(--secondary)',
                color: 'var(--secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>🔗</span> {linkText || 'Open Link'}
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="btn"
            style={{
              padding: '13px',
              fontSize: '0.9rem',
              fontWeight: '900',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff5722 0%, #ffd600 100%)',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)'
            }}
          >
            ✓ Got It / Understood
          </button>

          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Official Announcement from ZEST Host
          </span>
        </div>
      </div>
    </div>
  );
}
