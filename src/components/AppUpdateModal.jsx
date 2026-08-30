import React from 'react';
import { CURRENT_APP_VERSION } from '../services/appUpdateService';

export default function AppUpdateModal({ updateInfo, onDismiss }) {
  if (!updateInfo || !updateInfo.latestVersion) return null;

  const {
    latestVersion = '1.1.0',
    title = '🔥 New Update Available!',
    notes = 'Exciting new features and tournament improvements have arrived.',
    downloadUrl = '',
    forceUpdate = false
  } = updateInfo;

  const handleDownload = () => {
    const cleanVer = String(latestVersion).replace(/^v/i, '').trim();
    try {
      localStorage.setItem('zest_updated_version_' + cleanVer, 'true');
      localStorage.setItem('zest_last_dismissed_version', cleanVer);
    } catch (_) {}

    if (downloadUrl && downloadUrl.trim()) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Download link not provided. Please check back shortly.');
    }

    if (onDismiss && !forceUpdate) {
      onDismiss();
    }
  };

  const handleDismiss = () => {
    const cleanVer = String(latestVersion).replace(/^v/i, '').trim();
    try {
      localStorage.setItem('zest_last_dismissed_version', cleanVer);
    } catch (_) {}

    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="glass-panel animate-slide-in"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 229, 255, 0.2)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Rocket Icon badge */}
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00e5ff 0%, #ff5722 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)'
          }}
        >
          🚀
        </div>

        {/* Version Badge */}
        <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255, 214, 0, 0.15)', border: '1px solid var(--accent)', borderRadius: '12px', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: '900', marginBottom: '10px' }}>
          v{latestVersion} NOW AVAILABLE (Your version: v{CURRENT_APP_VERSION})
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>
          {title}
        </h2>

        {/* Release Notes */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: '12px 14px',
            textAlign: 'left',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
            margin: '12px 0 20px 0',
            maxHeight: '120px',
            overflowY: 'auto',
            whiteSpace: 'pre-line'
          }}
        >
          <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>What's New:</strong>
          {notes}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{
              padding: '14px',
              fontSize: '0.9rem',
              fontWeight: '900',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📲</span> Download & Install Update Now
          </button>

          {!forceUpdate && (
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              Remind Me Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
