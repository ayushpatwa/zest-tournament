import React, { useState } from 'react';

export default function ProfilePage({ userProfile, setUserProfile, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nick, setNick] = useState(userProfile.nickname || '');
  const [uid, setUid] = useState(userProfile.uid || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nick.trim() || !uid.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('All fields including Email and Phone are mandatory.');
      return;
    }

    setUserProfile(prev => ({
      ...prev,
      nickname: nick.trim(),
      uid: uid.trim(),
      email: email.trim(),
      phone: phone.trim()
    }));
    setIsEditing(false);
    setSuccessMsg('Account details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      
      {/* Gamer Header Card */}
      <div 
        className="glass-panel" 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(0, 229, 255, 0.08) 100%)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          {/* Avatar */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: userProfile.role === 'admin'
              ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)'
              : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            boxShadow: userProfile.role === 'admin' ? '0 0 15px rgba(255, 214, 0, 0.4)' : '0 4px 15px rgba(0,0,0,0.3)',
            flexShrink: 0
          }}>
            {userProfile.role === 'admin' ? '👑' : '🦊'}
          </div>

          {/* User Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ 
                fontSize: '1.05rem', 
                margin: 0, 
                fontFamily: 'var(--font-heading)',
                fontWeight: '900',
                color: '#fff',
                lineHeight: '1.2',
                wordBreak: 'break-word'
              }}>
                {userProfile.nickname || "Gamer_Newbie"}
              </h2>

              {userProfile.role === 'admin' ? (
                <span className="badge" style={{ 
                  fontSize: '0.6rem', 
                  background: 'rgba(255,214,0,0.2)', 
                  color: 'var(--accent)', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid rgba(255,214,0,0.4)',
                  fontWeight: '900',
                  whiteSpace: 'nowrap'
                }}>
                  👑 ADMIN
                </span>
              ) : (
                <span className="badge" style={{ 
                  fontSize: '0.6rem', 
                  background: 'rgba(0, 229, 255, 0.15)', 
                  color: 'var(--secondary)', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  fontWeight: '700',
                  whiteSpace: 'nowrap'
                }}>
                  PRO PLAYER
                </span>
              )}
            </div>

            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--secondary)', 
              marginTop: '4px', 
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <span>UID: {userProfile.uid || "Not Linked"}</span>
              {userProfile.role === 'admin' && (
                <span style={{ color: 'var(--accent)', fontWeight: '700' }}>• [Host Active]</span>
              )}
            </p>
          </div>

          {/* Edit Profile Button (Neatly Aligned at Top Right) */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? 'var(--secondary)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isEditing ? 'var(--secondary)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '8px',
              color: isEditing ? '#000' : '#fff',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <span>{isEditing ? '✕' : '✏️'}</span>
            <span>{isEditing ? 'Close' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {/* Account Info details */}
      <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered Email</span>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginTop: '2px', wordBreak: 'break-all' }}>
            {userProfile.email || "N/A"}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Phone Number</span>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginTop: '2px' }}>
            {userProfile.phone || "N/A"}
          </p>
        </div>
      </div>

      {/* Edit Profile Panel */}
      {isEditing && (
        <div className="glass-panel animate-slide-in" style={{ padding: '16px', border: '1px solid var(--secondary)' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--secondary)' }}>EDIT PLAYER DETAILS</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>In-Game Nickname</label>
              <input 
                type="text" 
                value={nick} 
                onChange={(e) => setNick(e.target.value)} 
                className="form-input"
                placeholder="e.g. ZEST_PRO"
                required
              />
            </div>
            <div className="form-group">
              <label>UID (Free Fire User ID)</label>
              <input 
                type="number" 
                value={uid} 
                onChange={(e) => setUid(e.target.value)} 
                className="form-input"
                placeholder="e.g. 5819038291"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="form-input"
                placeholder="gamer@gmail.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="form-input"
                placeholder="+91 9876543210"
                required
              />
            </div>
            {errorMsg && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '8px' }}>
                ⚠️ {errorMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '8px' }}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '8px' }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {successMsg && (
        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0, 230, 118, 0.05)', color: 'var(--success)', fontSize: '0.85rem', textAlign: 'center' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Player Career Stats */}
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', textTransform: 'uppercase' }}>
          📊 Tournament Career Stats
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          
          <div className="glass-panel" style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matches Played</span>
            <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '700', marginTop: '4px' }}>
              {userProfile.stats?.matches || 0}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tournaments Won</span>
            <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '700', marginTop: '4px', color: 'var(--accent)' }}>
              {userProfile.stats?.wins || 0}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Kills</span>
            <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '700', marginTop: '4px' }}>
              {userProfile.stats?.kills || 0}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Earnings</span>
            <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '700', marginTop: '4px', color: 'var(--success)' }}>
              ₹{userProfile.stats?.earnings || 0}
            </p>
          </div>

        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', textTransform: 'uppercase' }}>
          🏅 Unlocked Badges
        </h3>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { icon: "🥇", title: "Champion", desc: "Win 5 Tourneys", active: true },
            { icon: "💀", title: "Terminator", desc: "100+ Kills", active: true },
            { icon: "💰", title: "Rich Boy", desc: "Earn ₹1000+", active: true },
            { icon: "🔥", title: "Survivalist", desc: "Play 20+ matches", active: true }
          ].map((badge, idx) => (
            <div 
              key={idx} 
              className="glass-panel flex-center"
              style={{
                flexDirection: 'column',
                minWidth: '100px',
                padding: '12px 8px',
                textAlign: 'center',
                gap: '4px',
                border: '1px solid rgba(255, 214, 0, 0.1)'
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>{badge.icon}</span>
              <strong style={{ fontSize: '0.75rem', color: '#fff' }}>{badge.title}</strong>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{badge.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out Button */}
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{
            width: '100%',
            borderColor: 'rgba(255, 23, 68, 0.4)',
            color: '#ff80ab',
            fontSize: '0.85rem'
          }}
        >
          🚪 Sign Out / Switch Account
        </button>
      </div>

    </div>
  );
}
