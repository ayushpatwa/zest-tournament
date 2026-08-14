import React, { useState } from 'react';
import { sendToMakeWebhook } from '../services/webhookService';

export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [nickname, setNickname] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState(''); // UID or Email
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const validatePhone = (val) => {
    return /^[0-9+-\s]{8,15}$/.test(val);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nickname.trim()) {
      setErrorMsg('Please enter your Free Fire In-Game Nickname.');
      return;
    }
    if (!ffUid.trim() || isNaN(ffUid) || ffUid.length < 6) {
      setErrorMsg('Please enter a valid numeric Free Fire UID (min 6 digits).');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Please enter a valid Email Address (mandatory).');
      return;
    }
    if (!phone.trim() || !validatePhone(phone)) {
      setErrorMsg('Please enter a valid Phone Number (mandatory).');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);

    const newUser = {
      id: `user_${Date.now()}`,
      nickname: nickname.trim(),
      uid: ffUid.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password,
      wallet: 250, // Starter bonus
      stats: {
        matches: 0,
        wins: 0,
        kills: 0,
        earnings: 0
      },
      createdAt: new Date().toISOString()
    };

    // Save to local users list
    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const userExists = existingUsers.some(u => u.uid === newUser.uid || u.email === newUser.email);

    if (userExists) {
      setErrorMsg('An account with this Free Fire UID or Email already exists. Please Sign In.');
      setLoading(false);
      return;
    }

    existingUsers.push(newUser);
    localStorage.setItem('zest_registered_users', JSON.stringify(existingUsers));

    // Dispatch to Make.com Webhook for Google Sheet entry
    await sendToMakeWebhook({
      eventType: 'USER_SIGNUP',
      nickname: newUser.nickname,
      ffUid: newUser.uid,
      email: newUser.email,
      phone: newUser.phone,
      details: 'New Registration + ₹250 Welcome Bonus'
    });

    setLoading(false);
    onLoginSuccess(newUser);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your Free Fire UID or registered Email.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const user = existingUsers.find(
      u => (u.uid === loginIdentifier.trim() || u.email === loginIdentifier.trim().toLowerCase()) && u.password === password
    );

    if (!user) {
      setErrorMsg('Invalid Free Fire UID/Email or Password.');
      setLoading(false);
      return;
    }

    // Dispatch login event to Make.com Webhook
    await sendToMakeWebhook({
      eventType: 'USER_LOGIN',
      nickname: user.nickname,
      ffUid: user.uid,
      email: user.email,
      phone: user.phone,
      details: 'Player signed in to app session'
    });

    setLoading(false);
    onLoginSuccess(user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(circle at top center, #1b2138 0%, #07090e 70%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #ff1744 100%)',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: 'var(--glow-primary)',
          marginBottom: '12px'
        }}>
          🔥
        </div>
        <h1 style={{
          fontSize: '1.8rem',
          fontFamily: 'var(--font-heading)',
          fontWeight: '900',
          letterSpacing: '1.5px',
          margin: '0 0 4px 0',
          background: 'linear-gradient(90deg, #ffffff 30%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ZEST TOURNAMENT
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--secondary)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          Free Fire Esports Arena
        </p>
      </div>

      {/* Auth Card Container */}
      <div 
        className="glass-panel animate-slide-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '28px 24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          position: 'relative'
        }}
      >
        {/* Toggle Mode Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(7, 9, 14, 0.6)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: !isSignUp ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: !isSignUp ? 'var(--glow-primary)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: isSignUp ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: isSignUp ? 'var(--glow-primary)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.15)',
            border: '1px solid rgba(255, 23, 68, 0.4)',
            color: '#ff80ab',
            fontSize: '0.8rem',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* SIGN UP FORM */}
        {isSignUp ? (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Free Fire Nickname <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. ZEST_KILLER"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Free Fire UID <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="number"
                value={ffUid}
                onChange={(e) => setFfUid(e.target.value)}
                placeholder="e.g. 482910384"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email Address <span style={{ color: 'var(--primary)' }}>* (Mandatory)</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gamer@gmail.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Phone Number <span style={{ color: 'var(--primary)' }}>* (Mandatory)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '8px',
                fontSize: '0.9rem'
              }}
            >
              {loading ? 'Creating Account...' : '🔥 Register & Get ₹250'}
            </button>
          </form>
        ) : (
          /* SIGN IN FORM */
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Free Fire UID or Email</label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="UID or Email"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '4px',
                fontSize: '0.9rem'
              }}
            >
              {loading ? 'Signing In...' : '🚀 Sign In to Arena'}
            </button>
          </form>
        )}

        {/* Required Registration Notice */}
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>🔒 Login or Sign Up is mandatory to access tournaments</span>
        </div>

      </div>

      {/* Footer Tag */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>📊 Data securely synced via Make.com Google Sheets</span>
      </div>

    </div>
  );
}
