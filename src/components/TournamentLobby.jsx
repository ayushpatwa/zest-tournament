import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToLobbyChatRealtime, 
  sendLobbyMessageRealtime 
} from '../services/firebase';

export default function TournamentLobby({ 
  tournament, 
  userProfile, 
  setUserProfile, 
  walletBalance, 
  setWalletBalance, 
  onBack, 
  onRegisterUser 
}) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'chat' | 'results' | 'brackets'
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinType, setJoinType] = useState('solo'); // 'solo' | 'create_squad' | 'join_squad'
  const [squadName, setSquadName] = useState('');
  const [squadCodeInput, setSquadCodeInput] = useState('');
  
  const [ffUid, setFfUid] = useState(userProfile.uid || '');
  const [ffNickname, setFfNickname] = useState(userProfile.nickname || '');
  
  // Real-time Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const chatEndRef = useRef(null);

  // Match Result Submission states
  const [killsClaimed, setKillsClaimed] = useState('5');
  const [rankClaimed, setRankClaimed] = useState('1');
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isUserJoined = tournament.joinedPlayers?.some(p => p.isUser || p.uid === userProfile.uid);
  const isSquadMode = tournament.mode === 'Duo' || tournament.mode === 'Squad';

  // 1. Real-time Firebase Chat Listener
  useEffect(() => {
    const unsubscribe = subscribeToLobbyChatRealtime(tournament.id, (liveMessages) => {
      if (liveMessages && liveMessages.length > 0) {
        setChatMessages(liveMessages);
      } else {
        // Fallback default message
        setChatMessages([
          { id: 'sys1', sender: 'System', text: `Welcome to ${tournament.title} Lobby! Fair play rules applied.`, isSystem: true, time: 'Live' }
        ]);
      }
    });

    return () => unsubscribe();
  }, [tournament.id, tournament.title]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const msg = {
      sender: userProfile.nickname || ffNickname || "Gamer",
      text: userMessage.trim(),
      isSystem: false,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await sendLobbyMessageRealtime(tournament.id, msg);
    setUserMessage('');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ffUid.trim() || !ffNickname.trim()) {
      setErrorMsg('Please fill in Free Fire UID and in-game nickname.');
      return;
    }

    if (walletBalance < tournament.entryFee) {
      setErrorMsg('Insufficient balance! Please deposit funds to your wallet.');
      return;
    }

    let assignedSquadCode = '';
    if (joinType === 'create_squad') {
      assignedSquadCode = `ZEST-${Math.floor(Math.random() * 8999 + 1000)}`;
    } else if (joinType === 'join_squad') {
      if (!squadCodeInput.trim()) {
        setErrorMsg('Please enter your Captain\'s Squad Code.');
        return;
      }
      assignedSquadCode = squadCodeInput.trim().toUpperCase();
    }

    onRegisterUser(tournament.id, ffUid.trim(), ffNickname.trim(), tournament.entryFee, assignedSquadCode);
    setShowJoinModal(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitResult = (e) => {
    e.preventDefault();
    if (!screenshotPreview) {
      setErrorMsg('Please upload a screenshot of your match result score.');
      return;
    }

    // Save proof to local state and tournament submissions
    const submission = {
      id: `proof_${Date.now()}`,
      tournamentId: tournament.id,
      tournamentTitle: tournament.title,
      playerNickname: userProfile.nickname || ffNickname,
      playerUid: userProfile.uid || ffUid,
      email: userProfile.email,
      phone: userProfile.phone,
      kills: parseInt(killsClaimed),
      rank: parseInt(rankClaimed),
      screenshot: screenshotPreview,
      submittedAt: new Date().toLocaleString(),
      status: 'pending' // pending -> approved
    };

    const existingProofs = JSON.parse(localStorage.getItem('zest_match_proofs') || '[]');
    existingProofs.unshift(submission);
    localStorage.setItem('zest_match_proofs', JSON.stringify(existingProofs));

    setResultSubmitted(true);
    setErrorMsg('');
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      
      {/* Lobby Header */}
      <div className="flex-between">
        <button 
          onClick={onBack} 
          className="btn btn-outline" 
          style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>←</span> Back to Arena
        </button>
        <span className="badge badge-live">● MATCH LOBBY</span>
      </div>

      {/* Hero Tournament Title Banner */}
      <div 
        className="glass-panel" 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.15) 0%, rgba(21, 28, 51, 0.95) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.3)',
          padding: '20px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="flex-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
            {tournament.mode} • {tournament.type}
          </span>
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '1.2rem' }}>
            ₹{tournament.prizePool} PRIZE POOL
          </span>
        </div>

        <h1 style={{ fontSize: '1.35rem', margin: '0 0 12px 0', fontFamily: 'var(--font-heading)' }}>
          {tournament.title}
        </h1>

        {/* Progress bar for slots */}
        <div>
          <div className="flex-between" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <span>Joined: {tournament.slotsJoined} / {tournament.slotsTotal} Players</span>
            <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
              {Math.round((tournament.slotsJoined / tournament.slotsTotal) * 100)}% Full
            </span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(tournament.slotsJoined / tournament.slotsTotal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lobby Navigation Tabs */}
      <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {[
          { id: 'details', label: '📋 DETAILS' },
          { id: 'chat', label: '💬 LIVE CHAT' },
          { id: 'results', label: '📸 SUBMIT RESULT' },
          { id: 'brackets', label: '🏆 BRACKET' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              border: 'none',
              padding: '10px 4px',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.72rem',
              fontWeight: '700',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? 'var(--glow-primary)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DETAILS & ROOM ID DROP */}
      {activeTab === 'details' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Quick Match stats Card */}
          <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Map:</span>
              <p style={{ fontWeight: '700', margin: '2px 0 0 0' }}>{tournament.map}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Time:</span>
              <p style={{ fontWeight: '700', margin: '2px 0 0 0' }}>{tournament.startTime ? new Date(tournament.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entry Fee:</span>
              <p style={{ fontWeight: '700', color: 'var(--accent)', margin: '2px 0 0 0' }}>₹{tournament.entryFee}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tournament.type?.toLowerCase().includes('lone wolf') ? 'Prize Structure:' : 'Per Kill Bounty:'}
              </span>
              <p style={{ fontWeight: '700', color: tournament.type?.toLowerCase().includes('lone wolf') ? 'var(--accent)' : 'var(--secondary)', margin: '2px 0 0 0' }}>
                {tournament.type?.toLowerCase().includes('lone wolf') ? '🏆 Winner Takes All' : `₹${tournament.perKillPrize || 25}`}
              </p>
            </div>
          </div>

          {/* Real-time Free Fire Room ID & Password Credentials Card */}
          <div 
            className="glass-panel animate-slide-in"
            style={{
              padding: '16px',
              background: tournament.roomId 
                ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.12) 0%, rgba(0, 229, 255, 0.08) 100%)' 
                : 'rgba(15, 18, 29, 0.6)',
              border: tournament.roomId 
                ? '1px solid var(--success)' 
                : '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '12px'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '0.85rem', 
                color: tournament.roomId ? 'var(--success)' : 'var(--accent)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>🔑</span> {tournament.roomId ? 'FREE FIRE CUSTOM ROOM CREDENTIALS' : 'CUSTOM ROOM ID & PASSWORD'}
              </span>
              {tournament.roomId && <span className="badge badge-live">LIVE NOW</span>}
            </div>

            {tournament.roomId ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROOM ID:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '1px' }}>
                    {tournament.roomId}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PASSWORD:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '900', color: 'var(--accent)', letterSpacing: '1px' }}>
                    {tournament.roomPassword || 'None'}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                ⏳ Room ID & Password will be dropped here by the Admin <strong>15 minutes</strong> before match start.
              </p>
            )}
          </div>

          {/* Registration State Bar */}
          <div>
            {isUserJoined ? (
              <div 
                className="glass-panel flex-between" 
                style={{ 
                  padding: '16px', 
                  borderLeft: '4px solid var(--success)', 
                  background: 'rgba(0, 230, 118, 0.05)' 
                }}
              >
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--success)', margin: 0 }}>Registered Successfully!</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Slot confirmed for {userProfile.nickname} (UID: {userProfile.uid})
                  </p>
                </div>
                <span className="badge badge-live">JOINED</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowJoinModal(true)}
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', fontSize: '0.95rem' }}
                disabled={tournament.slotsJoined >= tournament.slotsTotal}
              >
                {tournament.slotsJoined >= tournament.slotsTotal ? 'Lobby Full' : `Register Now (₹${tournament.entryFee})`}
              </button>
            )}
          </div>

          {/* Registered Players List */}
          <div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Registered Players ({tournament.slotsJoined || tournament.joinedPlayers?.length || 0})</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Max: {tournament.slotsTotal}</span>
            </h3>
            <div className="glass-panel" style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px' }}>
              {tournament.joinedPlayers?.map((player, idx) => (
                <div 
                  key={idx}
                  className="flex-between"
                  style={{
                    padding: '8px 12px',
                    borderBottom: idx === tournament.joinedPlayers.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: player.isUser ? 'rgba(0, 229, 255, 0.08)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: player.isUser ? '700' : '400', color: player.isUser ? 'var(--secondary)' : '#fff' }}>
                      {player.nickname} {player.isUser && '(You)'}
                    </span>
                    {player.squadCode && (
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,214,0,0.15)', color: 'var(--accent)' }}>
                        {player.squadCode}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    UID: {player.uid}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LIVE LOBBY CHAT */}
      {activeTab === 'chat' && (
        <div className="glass-panel animate-slide-in" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: '12px' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {chatMessages.map((msg, i) => (
              <div 
                key={msg.id || i}
                style={{
                  alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: msg.isSystem 
                    ? 'rgba(255, 214, 0, 0.1)' 
                    : msg.isUser ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: msg.isSystem ? '1px solid rgba(255, 214, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                {!msg.isSystem && (
                  <div style={{ fontSize: '0.7rem', color: msg.isUser ? '#fff' : 'var(--secondary)', fontWeight: '700', marginBottom: '2px' }}>
                    {msg.sender}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: msg.isSystem ? 'var(--accent)' : '#fff', lineHeight: '1.3' }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: '2px' }}>
                  {msg.time}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input 
              type="text" 
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Send message to squad lobby..."
              className="form-input"
              style={{ fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
              Send
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SUBMIT MATCH RESULT & SCREENSHOT PROOF */}
      {activeTab === 'results' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '6px' }}>
            📸 Submit Match Score & Claim Prize
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
            Upload your endgame victory / kill summary screenshot. Once verified by the Admin, prize money will be credited instantly to your Zest Wallet!
          </p>

          {resultSubmitted ? (
            <div style={{
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid var(--success)',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <h4 style={{ color: 'var(--success)', margin: '0 0 6px 0' }}>Proof Submitted Successfully!</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                The Admin is reviewing your screenshot. Prize payout will be credited to your wallet shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitResult} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your Placement Rank</label>
                  <select value={rankClaimed} onChange={(e) => setRankClaimed(e.target.value)} className="form-input">
                    <option value="1">Rank #1 (Booyah 🏆)</option>
                    <option value="2">Rank #2 (Runner Up 🥈)</option>
                    <option value="3">Rank #3 (3rd Place 🥉)</option>
                    <option value="4">Rank #4 - #10 (Top 10)</option>
                    <option value="11">Rank #11+</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Total Kills Scored</label>
                  <input 
                    type="number" 
                    value={killsClaimed}
                    onChange={(e) => setKillsClaimed(e.target.value)}
                    className="form-input"
                    min="0"
                    max="48"
                    required
                  />
                </div>
              </div>

              {/* Screenshot File Uploader */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Upload Endgame Scoreboard Screenshot <span style={{ color: 'var(--primary)' }}>*</span></label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="form-input"
                  style={{ padding: '8px' }}
                  required
                />
              </div>

              {/* Live Image Preview */}
              {screenshotPreview && (
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Screenshot Preview:</div>
                  <img 
                    src={screenshotPreview} 
                    alt="Proof Preview" 
                    style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-secondary"
                style={{ width: '100%', height: '46px', fontSize: '0.9rem', fontWeight: '700' }}
              >
                🚀 Submit Score for Admin Verification
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: BRACKET & LEADERBOARD */}
      {activeTab === 'brackets' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>🏆 Tournament Leaderboard</h3>
          {tournament.leaderboard && tournament.leaderboard.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tournament.leaderboard.map((player, idx) => (
                <div key={idx} className="flex-between glass-panel" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '900', color: idx === 0 ? 'var(--accent)' : '#fff' }}>#{idx + 1}</span>
                    <span>{player.nickname}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--secondary)' }}>🎯 {player.kills} Kills</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{player.totalPoints} Pts</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              Match is upcoming. Leaderboard will generate upon match conclusion.
            </div>
          )}
        </div>
      )}

      {/* Registration & Squad Formation Modal */}
      {showJoinModal && (
        <div 
          className="flex-center" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-slide-in" 
            style={{ 
              width: '100%', 
              maxWidth: '400px', 
              padding: '24px',
              border: '1px solid var(--primary)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>
                CONFIRM REGISTRATION
              </h3>
              <button 
                onClick={() => setShowJoinModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Squad Type Selector if Duo / Squad */}
              {isSquadMode && (
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setJoinType('create_squad')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      background: joinType === 'create_squad' ? 'var(--secondary)' : 'transparent',
                      color: joinType === 'create_squad' ? '#000' : '#fff',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    👑 Create Squad
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinType('join_squad')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      background: joinType === 'join_squad' ? 'var(--secondary)' : 'transparent',
                      color: joinType === 'join_squad' ? '#000' : '#fff',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    🤝 Join with Code
                  </button>
                </div>
              )}

              {joinType === 'join_squad' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Captain's Squad Code <span style={{ color: 'var(--primary)' }}>*</span></label>
                  <input 
                    type="text"
                    value={squadCodeInput}
                    onChange={(e) => setSquadCodeInput(e.target.value)}
                    placeholder="e.g. ZEST-8492"
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Free Fire In-Game Nickname</label>
                <input 
                  type="text" 
                  value={ffNickname}
                  onChange={(e) => setFfNickname(e.target.value)}
                  placeholder="e.g. ZEST_KILLER"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Free Fire UID (Numeric)</label>
                <input 
                  type="number" 
                  value={ffUid}
                  onChange={(e) => setFfUid(e.target.value)}
                  placeholder="e.g. 482910394"
                  className="form-input"
                  required
                />
              </div>

              <div style={{
                background: 'rgba(255, 214, 0, 0.08)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 214, 0, 0.2)',
                fontSize: '0.8rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Entry Fee to Deduct:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent)' }}>₹{tournament.entryFee}</span>
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              >
                🔥 Pay ₹{tournament.entryFee} & Join
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
