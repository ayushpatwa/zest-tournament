import React, { useState, useEffect } from 'react';
import { sendToMakeWebhook } from '../services/webhookService';
import { resetUserPasswordRealtime, saveUserProfileRealtime } from '../services/firebase';
import { dispatchRealOtp } from '../services/otpService';

export default function LoginPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'otp_verify' | 'admin' | 'forgot'
  
  // Sign Up form state
  const [nickname, setNickname] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyChannel, setVerifyChannel] = useState('email'); // 'email' | 'phone'
  
  // OTP Verification state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  
  // Player Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  // Account Recovery state
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverPhone, setRecoverPhone] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  
  // Admin Login state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPasscode, setAdminPasscode] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const validatePhone = (val) => {
    return /^[0-9+-\s]{8,15}$/.test(val);
  };

  // Step 1: Initiate Sign Up and Dispatch OTP to Email/SMS
  const handleInitiateSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSuccessMsg('');

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

    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const userExists = existingUsers.some(
      u => u.uid === ffUid.trim() || u.email === email.trim().toLowerCase()
    );

    if (userExists) {
      setErrorMsg('An account with this Free Fire UID or Email already exists. Please Sign In.');
      setLoading(false);
      return;
    }

    // Generate secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');

    const targetUser = {
      id: `user_${Date.now()}`,
      nickname: nickname.trim(),
      uid: ffUid.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password,
      role: 'player',
      wallet: 0,
      isVerified: true,
      verifiedMethod: verifyChannel,
      verifiedAt: new Date().toISOString(),
      stats: {
        matches: 0,
        wins: 0,
        kills: 0,
        earnings: 0
      },
      createdAt: new Date().toISOString()
    };

    setPendingUser(targetUser);

    // Automated Real Dispatch: Webhook + Direct Email/SMS Gateway
    await dispatchRealOtp({
      email: targetUser.email,
      phone: targetUser.phone,
      nickname: targetUser.nickname,
      ffUid: targetUser.uid,
      otpCode: code,
      channel: verifyChannel
    });

    setResendTimer(30);
    setAuthMode('otp_verify');
    setLoading(false);
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMsg('');
    setOtpSuccessMsg('');
    setLoading(true);

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setEnteredOtp('');

    await dispatchRealOtp({
      email: pendingUser?.email || email,
      phone: pendingUser?.phone || phone,
      nickname: pendingUser?.nickname || nickname,
      ffUid: pendingUser?.uid || ffUid,
      otpCode: newCode,
      channel: verifyChannel
    });

    setResendTimer(30);
    setOtpSuccessMsg(`✅ New 6-digit OTP code sent to your ${verifyChannel === 'email' ? 'Email' : 'Phone'}!`);
    setLoading(false);
  };

  // Step 3: Verify OTP and complete registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSuccessMsg('');

    const cleanInput = enteredOtp.trim();
    if (!cleanInput || cleanInput.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (cleanInput !== generatedOtp.trim()) {
      setErrorMsg(`❌ Invalid OTP code. Please enter the correct code sent to your ${verifyChannel === 'email' ? 'Email' : 'Phone'}.`);
      return;
    }

    setLoading(true);

    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    existingUsers.push(pendingUser);
    localStorage.setItem('zest_registered_users', JSON.stringify(existingUsers));

    // Also persist in Firestore cloud
    await saveUserProfileRealtime(pendingUser);

    // Final registration webhook to Google Sheet
    await sendToMakeWebhook({
      eventType: 'USER_SIGNUP',
      nickname: pendingUser.nickname,
      ffUid: pendingUser.uid,
      email: pendingUser.email,
      phone: pendingUser.phone,
      password: pendingUser.password,
      verifiedMethod: verifyChannel,
      details: `New Player Registration Verified via ${verifyChannel.toUpperCase()} OTP`
    });

    setOtpSuccessMsg('🎉 Phone & Email verified successfully! Loading your esports arena...');
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(pendingUser);
    }, 1000);
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

    await sendToMakeWebhook({
      eventType: 'USER_LOGIN',
      nickname: user.nickname,
      ffUid: user.uid,
      email: user.email,
      phone: user.phone,
      password: user.password,
      details: 'Player signed in to app session'
    });

    setLoading(false);
    onLoginSuccess(user);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = adminUsername.trim().toLowerCase();
    const trimmedPass = adminPasscode.trim();

    // Check Master Admin credentials or registered admin
    if ((trimmedUser === 'admin' || trimmedUser === 'admin@zest.gg') && (trimmedPass === 'admin123' || trimmedPass === 'admin')) {
      setLoading(true);
      const adminUser = {
        id: 'admin_master_1',
        nickname: '👑 ZEST TOURNAMENT ADMIN',
        uid: 'ADMIN_001',
        email: 'admin@zest.gg',
        phone: '+91 9999999999',
        role: 'admin', // Full host permissions
        wallet: 99999,
        stats: {
          matches: 50,
          wins: 45,
          kills: 500,
          earnings: 50000
        }
      };

      await sendToMakeWebhook({
        eventType: 'ADMIN_LOGIN',
        nickname: adminUser.nickname,
        ffUid: adminUser.uid,
        email: adminUser.email,
        phone: adminUser.phone,
        details: 'Admin verified and logged in with HOST access'
      });

      setLoading(false);
      onLoginSuccess(adminUser);
      return;
    }

    setErrorMsg('Invalid Admin username or password. (Default: admin / admin123)');
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccessMsg('');

    if (!recoverIdentifier.trim()) {
      setErrorMsg('Please enter your Free Fire UID or Email.');
      return;
    }
    if (!newResetPassword.trim() || newResetPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    const res = await resetUserPasswordRealtime(recoverIdentifier.trim(), recoverPhone.trim(), newResetPassword.trim());
    
    if (res.success) {
      setResetSuccessMsg('✅ Password reset successfully! Logging into your account...');
      await sendToMakeWebhook({
        eventType: 'PASSWORD_RESET',
        nickname: res.user?.nickname || 'Player',
        ffUid: res.user?.uid || recoverIdentifier,
        email: res.user?.email || 'N/A',
        phone: res.user?.phone || recoverPhone,
        password: newResetPassword.trim(),
        details: 'Player self-service password reset'
      });
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to verify account.');
    }
    setLoading(false);
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
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          background: authMode === 'admin' 
            ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' 
            : 'linear-gradient(135deg, var(--primary) 0%, #ff1744 100%)',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: authMode === 'admin' ? '0 0 20px rgba(255, 214, 0, 0.5)' : 'var(--glow-primary)',
          marginBottom: '12px',
          transition: 'all 0.3s ease'
        }}>
          {authMode === 'admin' ? '👑' : '🔥'}
        </div>
        <h1 style={{
          fontSize: '1.75rem',
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
          fontSize: '0.8rem',
          color: authMode === 'admin' ? 'var(--accent)' : 'var(--secondary)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {authMode === 'admin' ? '⚡ Organizer Admin Portal' : 'Free Fire Esports Arena'}
        </p>
      </div>

      {/* Auth Card Container */}
      <div 
        className="glass-panel animate-slide-in"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '24px 20px',
          border: authMode === 'admin' ? '1px solid rgba(255, 214, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          position: 'relative'
        }}
      >
        {/* Mode Selector Tabs (Sign In, Sign Up, Admin) */}
        <div style={{
          display: 'flex',
          background: 'rgba(7, 9, 14, 0.6)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '18px',
          border: '1px solid var(--border-color)',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '6px',
              background: authMode === 'signin' ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: authMode === 'signin' ? 'var(--glow-primary)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            SIGN IN
          </button>
          
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '6px',
              background: authMode === 'signup' ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: authMode === 'signup' ? 'var(--glow-primary)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            REGISTER
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('admin'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '6px',
              background: authMode === 'admin' ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' : 'transparent',
              color: authMode === 'admin' ? '#000' : 'var(--accent)',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: authMode === 'admin' ? '0 0 10px rgba(255,214,0,0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            👑 ADMIN
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

        {/* MODE 1: PLAYER SIGN IN */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Free Fire UID or Email</label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Enter UID or Email"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setResetSuccessMsg(''); setRecoverIdentifier(loginIdentifier); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                🔑 Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '2px',
                fontSize: '0.9rem'
              }}
            >
              {loading ? 'Signing In...' : '🚀 Sign In as Player'}
            </button>
          </form>
        )}

        {/* MODE 4: FORGOT PASSWORD / ACCOUNT RECOVERY */}
        {authMode === 'forgot' && (
          <form onSubmit={handleRecoverPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: 'var(--secondary)',
              lineHeight: '1.4'
            }}>
              🔑 <strong>Recover Account:</strong> Enter your Free Fire UID or Email and registered phone number to reset your password.
            </div>

            {resetSuccessMsg && (
              <div style={{
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                fontSize: '0.8rem',
                padding: '10px 14px',
                borderRadius: '8px',
                lineHeight: '1.4'
              }}>
                {resetSuccessMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Free Fire UID or Email <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="text"
                value={recoverIdentifier}
                onChange={(e) => setRecoverIdentifier(e.target.value)}
                placeholder="Enter UID or Email"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Registered Phone Number <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="tel"
                value={recoverPhone}
                onChange={(e) => setRecoverPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>New Password <span style={{ color: 'var(--primary)' }}>* (Min 4 chars)</span></label>
              <input
                type="password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder="Enter new password"
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
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)',
                color: '#000',
                fontWeight: '900'
              }}
            >
              {loading ? 'Verifying & Resetting...' : '⚡ Reset Password & Log In'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(''); setResetSuccessMsg(''); }}
              className="btn btn-outline"
              style={{ width: '100%', height: '40px', fontSize: '0.8rem', marginTop: '2px' }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* MODE 2: PLAYER SIGN UP (STEP 1) */}
        {authMode === 'signup' && (
          <form onSubmit={handleInitiateSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <label>Password <span style={{ color: 'var(--primary)' }}>* (Min 4 chars)</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            {/* OTP Verification Method Selector */}
            <div style={{ marginTop: '2px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.72rem', 
                fontFamily: 'var(--font-heading)', 
                color: 'var(--text-muted)', 
                marginBottom: '6px',
                textTransform: 'uppercase'
              }}>
                Verify Account Via <span style={{ color: 'var(--secondary)' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                background: 'rgba(7, 9, 14, 0.7)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-color)',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setVerifyChannel('email')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderRadius: '6px',
                    background: verifyChannel === 'email' ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                    border: verifyChannel === 'email' ? '1px solid var(--secondary)' : '1px solid transparent',
                    color: verifyChannel === 'email' ? '#00e5ff' : 'var(--text-muted)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📧 Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyChannel('phone')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderRadius: '6px',
                    background: verifyChannel === 'phone' ? 'rgba(0, 230, 118, 0.2)' : 'transparent',
                    border: verifyChannel === 'phone' ? '1px solid var(--success)' : '1px solid transparent',
                    color: verifyChannel === 'phone' ? 'var(--success)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📱 Phone / SMS OTP
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '6px',
                fontSize: '0.9rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
              }}
            >
              {loading ? 'Generating Security OTP...' : `⚡ Send OTP to ${verifyChannel === 'email' ? 'Email' : 'Phone'} →`}
            </button>
          </form>
        )}

        {/* MODE 2.5: OTP VERIFICATION SCREEN (STEP 2) */}
        {authMode === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              lineHeight: '1.45'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>{verifyChannel === 'email' ? '📩' : '📱'}</span>
                <strong style={{ color: 'var(--secondary)', fontFamily: 'var(--font-heading)', fontSize: '0.85rem' }}>
                  {verifyChannel === 'email' ? 'CHECK YOUR EMAIL INBOX' : 'CHECK YOUR SMS MESSAGES'}
                </strong>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                We have sent a 6-digit verification OTP to:
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.86rem', marginTop: '3px', wordBreak: 'break-all' }}>
                  {verifyChannel === 'email' ? pendingUser?.email : pendingUser?.phone}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {verifyChannel === 'email' 
                  ? '💡 Tip: If you don\'t see the email within 1 minute, please check your Spam / Promotions folder.' 
                  : '💡 Tip: Please ensure your phone is reachable to receive incoming SMS messages.'}
              </div>
            </div>

            {otpSuccessMsg && (
              <div style={{
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                fontSize: '0.8rem',
                padding: '10px 12px',
                borderRadius: '8px',
                lineHeight: '1.4'
              }}>
                {otpSuccessMsg}
              </div>
            )}

            {/* 6-Digit OTP Code Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Enter 6-Digit OTP Code <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setEnteredOtp(val);
                }}
                placeholder="• • • • • •"
                maxLength={6}
                autoFocus
                style={{
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  letterSpacing: '8px',
                  color: '#00e5ff'
                }}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || enteredOtp.length < 6}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '0.92rem',
                fontWeight: '900',
                background: enteredOtp.length === 6 
                  ? 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)' 
                  : 'rgba(255,255,255,0.1)',
                color: enteredOtp.length === 6 ? '#000' : 'var(--text-muted)'
              }}
            >
              {loading ? 'Verifying...' : '✅ Verify OTP & Complete Registration'}
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  height: '38px',
                  fontSize: '0.74rem',
                  color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--secondary)',
                  borderColor: resendTimer > 0 ? 'rgba(255,255,255,0.1)' : 'var(--secondary)'
                }}
              >
                {resendTimer > 0 ? `⏳ Resend OTP (${resendTimer}s)` : '🔄 Resend OTP Code'}
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMsg(''); setOtpSuccessMsg(''); }}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  height: '38px',
                  fontSize: '0.74rem'
                }}
              >
                ← Change Phone/Email
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: ADMIN LOGIN */}
        {authMode === 'admin' && (
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(255, 214, 0, 0.08)',
              border: '1px solid rgba(255, 214, 0, 0.25)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: 'var(--accent)',
              lineHeight: '1.4'
            }}>
              🔑 <strong>Administrator Portal:</strong> Sign in here to unlock tournament creation (Host) & Google Sheet configurations.
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Admin Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Admin Passcode</label>
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Enter admin passcode (Default: admin123)"
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '4px',
                fontSize: '0.88rem',
                background: 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)',
                color: '#000',
                fontWeight: '900'
              }}
            >
              {loading ? 'Authenticating...' : '👑 Access Admin Host Portal'}
            </button>

            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Default credentials: User: <code style={{ color: 'var(--secondary)' }}>admin</code> | Pass: <code style={{ color: 'var(--secondary)' }}>admin123</code>
            </div>
          </form>
        )}

      </div>

      {/* Contact Us / Support Telegram Link */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <a
          href="https://t.me/zesttournament"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00e5ff',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: '700',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.25) 0%, rgba(0, 229, 255, 0.1) 100%)',
            border: '1px solid #0088cc',
            padding: '8px 18px',
            borderRadius: '24px',
            boxShadow: '0 4px 15px rgba(0, 136, 204, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <span>💬</span>
          <span>Contact Us on Telegram (@zesttournament)</span>
        </a>
      </div>

    </div>
  );
}
