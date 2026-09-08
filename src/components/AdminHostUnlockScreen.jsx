import React, { useState } from 'react';

export default function AdminHostUnlockScreen({ onUnlockSuccess, onCancel }) {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPass = passcode.trim();

    // Valid passcodes for Host & Super Admin access
    const isValid = 
      cleanPass === 'Zest@2008' || 
      cleanPass === 'admin123' || 
      cleanPass.toLowerCase() === 'zest2008' ||
      cleanPass === 'admin';

    if (isValid) {
      setLoading(true);
      setSuccessMsg('🎉 Access Granted! Unlocking Organizer & Host Arena...');

      setTimeout(() => {
        setLoading(false);
        onUnlockSuccess({
          role: 'admin',
          isHost: true
        });
      }, 600);
    } else {
      setErrorMsg('❌ Incorrect Passcode. Please enter the valid Organizer / Admin Passcode.');
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '20px auto',
      padding: '0 16px',
      boxSizing: 'border-box'
    }}>
      <div 
        className="glass-panel animate-slide-in"
        style={{
          padding: '28px 22px',
          border: '1px solid rgba(255, 214, 0, 0.35)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7), 0 0 25px rgba(255, 214, 0, 0.12)',
          borderRadius: '16px',
          textAlign: 'center'
        }}
      >
        {/* Animated Badge Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px auto',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.2rem',
          boxShadow: '0 0 25px rgba(255, 214, 0, 0.45)'
        }}>
          👑
        </div>

        <h2 style={{
          fontSize: '1.4rem',
          fontFamily: 'var(--font-heading)',
          fontWeight: '900',
          letterSpacing: '1px',
          margin: '0 0 6px 0',
          color: '#fff'
        }}>
          ORGANIZER & HOST ARENA
        </h2>

        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          margin: '0 0 20px 0',
          lineHeight: '1.4'
        }}>
          Create tournaments, drop room IDs & passwords, manage registered players, and configure settings.
        </p>

        <div style={{
          background: 'rgba(255, 214, 0, 0.08)',
          border: '1px solid rgba(255, 214, 0, 0.25)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '0.75rem',
          color: 'var(--accent)',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <div>
            <strong>Passcode Protected:</strong> Enter the Organizer / Admin Passcode to open the host panel.
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.15)',
            border: '1px solid rgba(255, 23, 68, 0.4)',
            color: '#ff80ab',
            fontSize: '0.8rem',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(0, 230, 118, 0.15)',
            border: '1px solid rgba(0, 230, 118, 0.4)',
            color: '#69f0ae',
            fontSize: '0.8rem',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
            <label style={{ fontSize: '0.78rem' }}>Host / Admin Passcode</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Passcode (e.g. Zest@2008)"
                className="form-input"
                style={{ paddingRight: '44px', height: '46px', fontSize: '0.9rem' }}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textAlign: 'right',
            marginTop: '-4px'
          }}>
            Default passcode: <code style={{ color: 'var(--secondary)' }}>Zest@2008</code> or <code style={{ color: 'var(--secondary)' }}>admin123</code>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              height: '46px',
              fontSize: '0.9rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)',
              color: '#000',
              border: 'none',
              boxShadow: '0 0 20px rgba(255, 214, 0, 0.4)',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Verifying...' : '👑 Open Host Arena'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            style={{
              width: '100%',
              height: '40px',
              fontSize: '0.8rem',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'var(--text-secondary)'
            }}
          >
            ← Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
