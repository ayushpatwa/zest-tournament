import React, { useState } from 'react';

export default function TournamentLobby({ 
  tournament, 
  userProfile, 
  setUserProfile, 
  walletBalance, 
  setWalletBalance, 
  onBack, 
  onRegisterUser,
  setCurrentView
}) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'brackets'
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinType, setJoinType] = useState('solo'); // 'solo' | 'create_squad' | 'join_squad'
  const [squadCodeInput, setSquadCodeInput] = useState('');
  
  const [ffUid, setFfUid] = useState(userProfile.uid || '');
  const [ffNickname, setFfNickname] = useState(userProfile.nickname || '');
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isUserJoined = tournament.joinedPlayers?.some(p => p.isUser || p.uid === userProfile.uid);
  const isSquadMode = tournament.mode === 'Duo' || tournament.mode === 'Squad';
  const isLoneWolf = tournament.type?.toLowerCase().includes('lone wolf');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
        {[
          { id: 'details', label: '📋 MATCH DETAILS & ROOM ID' },
          { id: 'brackets', label: '🏆 PLAYERS & STANDINGS' },
          { id: 'rules', label: '📜 RULES' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              border: 'none',
              padding: '10px 8px',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.78rem',
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
              <p style={{ fontWeight: '700', margin: '2px 0 0 0', color: 'var(--secondary)' }}>
                {tournament.startTime 
                  ? (!isNaN(new Date(tournament.startTime).getTime()) 
                      ? new Date(tournament.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                      : tournament.startTime) 
                  : 'Today, Live'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entry Fee:</span>
              <p style={{ fontWeight: '700', color: 'var(--accent)', margin: '2px 0 0 0' }}>₹{tournament.entryFee}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isLoneWolf ? 'Prize Structure:' : 'Per Kill Bounty:'}
              </span>
              <p style={{ fontWeight: '700', color: isLoneWolf ? 'var(--accent)' : 'var(--secondary)', margin: '2px 0 0 0' }}>
                {isLoneWolf ? '🏆 Winner Takes All' : `₹${tournament.perKillPrize || 25}`}
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
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div>
                <span style={{ 
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.88rem', 
                  fontWeight: '700',
                  color: tournament.roomId ? 'var(--success)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🔑</span> {tournament.roomId ? 'ROOM ID & PASSWORD (LIVE)' : 'CUSTOM ROOM CREDENTIALS'}
                </span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {tournament.roomId 
                    ? 'Room is now created in Free Fire! Join immediately.' 
                    : 'Admin broadcasts credentials 15 minutes before the match start.'}
                </p>
              </div>

              {tournament.roomId && (
                <span className="badge badge-live" style={{ background: 'var(--success)', color: '#000' }}>
                  ● LIVE
                </span>
              )}
            </div>

            {tournament.roomId ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ROOM ID:</div>
                  <div className="flex-between">
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: '900', color: 'var(--secondary)' }}>
                      {tournament.roomId}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(tournament.roomId, 'room')}
                      className="btn"
                      style={{ 
                        padding: '4px 10px', 
                        fontSize: '0.75rem', 
                        background: copiedId === 'room' ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                        color: '#fff'
                      }}
                    >
                      {copiedId === 'room' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PASSWORD:</div>
                  <div className="flex-between">
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent)' }}>
                      {tournament.roomPassword || 'None'}
                    </span>
                    {tournament.roomPassword && (
                      <button 
                        onClick={() => copyToClipboard(tournament.roomPassword, 'pass')}
                        className="btn"
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.75rem', 
                          background: copiedId === 'pass' ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                          color: '#fff'
                        }}
                      >
                        {copiedId === 'pass' ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '16px', 
                borderRadius: '8px', 
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem'
              }}>
                🔒 Room ID & Password are locked. They will automatically appear here once published by host.
              </div>
            )}
          </div>

          {/* Rules & Gameplay Guidelines */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--secondary)' }}>📜 Tournament Match Rules</h3>
              {setCurrentView && (
                <button
                  type="button"
                  onClick={() => setCurrentView('rules')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Full Rules ➔
                </button>
              )}
            </div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '18px', margin: 0, lineHeight: '1.6' }}>
              <li>Sirf Android & iOS devices allowed hain. (Emulators / PC / Tablets strictly NOT allowed).</li>
              <li>❌ DPI NOT ALLOWED: Agar DPI use karte hue pakde gaye toh penalty lagegi.</li>
              <li>Opponent ka POV match ke 1 hour ke andar valid proof ke sath demand karna hoga. (No POV = Canceled withdrawal).</li>
              <li>Only 8 matches per day allowed. Exceed hone par ₹8 se ₹25 per extra match penalty lagegi.</li>
              <li>MIN LEVEL-40 ALLOWED. Sabhi rules follow karna mandatory hai.</li>
            </ul>
          </div>

          {/* Join / Registration Button */}
          <div>
            {isUserJoined ? (
              <div style={{
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid var(--success)',
                padding: '14px',
                borderRadius: '10px',
                textAlign: 'center',
                color: 'var(--success)',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                ✅ You are Registered for this Tournament!
              </div>
            ) : (
              <button 
                onClick={() => {
                  if (walletBalance < tournament.entryFee) {
                    setErrorMsg('Insufficient balance! Please add funds in your wallet.');
                  }
                  setShowJoinModal(true);
                }}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  height: '52px', 
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 20px rgba(255, 87, 34, 0.4)'
                }}
              >
                🎮 REGISTER FOR TOURNAMENT (₹{tournament.entryFee})
              </button>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: BRACKET & PLAYERS */}
      {activeTab === 'brackets' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>👥 Joined Players ({tournament.joinedPlayers?.length || 0})</h3>
          
          {tournament.joinedPlayers && tournament.joinedPlayers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tournament.joinedPlayers.map((player, idx) => (
                <div key={idx} className="flex-between glass-panel" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '900', color: player.isUser ? 'var(--secondary)' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: '700', color: player.isUser ? 'var(--secondary)' : '#fff', fontSize: '0.85rem' }}>
                        {player.nickname} {player.isUser && '(You)'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        UID: {player.uid}
                      </div>
                    </div>
                  </div>
                  {player.squadCode && (
                    <span className="badge" style={{ background: 'rgba(255,214,0,0.15)', color: 'var(--accent)', fontSize: '0.68rem' }}>
                      Squad: {player.squadCode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              No players joined yet. Be the first to register!
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATCH RULES & FAIRPLAY GUIDELINES */}
      {activeTab === 'rules' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--secondary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📜</span> Match Rules & Fairplay Guidelines
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                🔥 Zest Tournament – Play Fair, Win Fair
              </p>
            </div>
            {setCurrentView && (
              <button
                type="button"
                onClick={() => setCurrentView('rules')}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Full Rulebook ➔
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            
            {/* 1. Account & Entry Rules */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: '#ff5252', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔴</span> ◆ ACCOUNT & ENTRY RULES
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li><strong style={{ color: 'var(--secondary)' }}>ONLY FREE FIRE MAX ALLOWED</strong></li>
                <li>Banned characters from all modes: ❌ Orion, ❌ A124, ❌ Ryden</li>
                <li>Multiple name / multiple accounts = 🚫 DIRECT BAN (1 account only)</li>
                <li>Bio me "I AM HACKER" likhne par kick/penalty host ke through</li>
                <li>In-game name simple hona chahiye (No fancy symbols). Hack chat found = Direct Ban</li>
                <li><strong style={{ color: 'var(--accent)' }}>MIN LEVEL-40 ALLOWED</strong> • HUD POV MUST for withdrawal/unban</li>
              </ul>
            </div>

            {/* 2. ID & Password & Joining Rules */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔑</span> ◆ ID, PASS & MATCH JOINING
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Match ID & Password match start se pehle drop hoga (Waiting time ID share hone ke baad count hoga).</li>
                <li>Time miss karne par <strong>Zest Tournament</strong> responsible nahi hoga.</li>
                <li><strong style={{ color: '#ff4081' }}>ROOM JOIN SE PEHLE RECORDING COMPULSORY HAI.</strong></li>
                <li>Match join karne ke baad apne allotted slot me hi rahein (Slot change/leave = Kick + No Refund).</li>
                <li>Late join / missed match ka refund nahi milega.</li>
              </ul>
            </div>

            {/* 3. CS / Lone Wolf Gameplay Rules */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: '#69f0ae', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚔️</span> ◆ CS / LONE WOLF FAIRPLAY
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Grenade NOT allowed • Teaming strictly NOT allowed.</li>
                <li>Hacks, bugs aur glitches strictly NOT allowed.</li>
                <li>Zone pack strictly NOT allowed • Camping NOT allowed.</li>
                <li>Unregistered players ko invite karna allowed nahi hai.</li>
                <li><strong style={{ color: '#ff80ab' }}>Cheating pakde jane par:</strong> 🚫 BAN + Penalty</li>
              </ul>
            </div>

            {/* 4. CS Headshot Rule */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎯</span> ◆ CS HEADSHOT RULE
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>CS matches me sirf Headshot kills allowed honge.</li>
                <li>Character skills aur gun attributes OFF rahenge.</li>
                <li><strong style={{ color: 'var(--success)' }}>ONLY HEAD GUNS ALLOWED H</strong></li>
              </ul>
            </div>

            {/* 5. Gun Restrictions & Survival */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎮</span> ◆ GUN & WEAPON RESTRICTIONS
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>SURVIVAL: Matches full na hone par prize pool rank change ho sakta hai (Top 10 to 7 or 6).</li>
                <li>❌ Specific gun DOUBLE VECTOR AND M79 LAUNCHER STRICTLY NOT ALLOWED.</li>
                <li>❌ Horses are banned • SURVIVAL: SNIPER NOT ALLOWED.</li>
              </ul>
            </div>

            {/* 6. Screen Recording & POV */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: '#ff4081', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📹</span> ◆ SCREEN RECORDING & POV RULES
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Screen recording ON hona compulsory hai (ID/Pass share hone se pehle).</li>
                <li>HUD AND FREE FIRE POV MUST (24 hours tak save rakhna compulsory hai).</li>
                <li>Proof provide na karne par: ❌ No Prize, ❌ No Refund.</li>
                <li>Opponent POV 1 hour ke andar demand karein. (No POV = Canceled withdrawal).</li>
              </ul>
            </div>

            {/* 7. Match Limit Policy */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span> ◆ MATCH LIMIT & HOST ST
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li><strong style={{ color: 'var(--success)' }}>✅ Only 8 matches per day allowed.</strong> (Penalty: ₹8-₹25 per extra match).</li>
                <li>Host wrong room ST karta hai to 1st round ke andar report karein (Remake hoga).</li>
                <li>1st round ke baad No Refund / No Remake diya jayega.</li>
              </ul>
            </div>

            {/* 8. Device & Penalty */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🚫</span> ◆ DEVICE & PENALTY RULES
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Sirf Android & iOS devices allowed hain (PC/Emulator/Tablet prohibited).</li>
                <li><strong style={{ color: '#ff80ab' }}>❌ DPI NOT ALLOWED:</strong> Agar DPI use karte pakde gaye toh penalty lagegi.</li>
                <li>Rule break par: ⚠️ Penalty | ❌ No Refund | 🚫 Permanent BAN.</li>
              </ul>
            </div>

          </div>

          {/* Final Note & Disclaimer */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#fff', marginBottom: '4px' }}>
              ⚡ FINAL NOTE:
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              • Sabhi rules follow karna mandatory hai • Admin ka decision final hoga • Fair play maintain karein.
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Disclaimer: Garena Free Fire glitches ke liye <strong>Zest Tournament</strong> zimmedar nahi hoga. Ye user ki khud ki responsibility hogi.
            </p>
          </div>

          {/* Direct Support link */}
          <div className="flex-between" style={{ background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.15) 0%, rgba(0, 229, 255, 0.08) 100%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid #0088cc', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#fff' }}>
              🔥 Zest Tournament – Play Fair, Win Fair
            </span>
            <a
              href="https://t.me/zesttournament"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#00e5ff',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.75rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>💬</span> Telegram: @zesttournament ➔
            </a>
          </div>
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
