import React, { useState, useEffect, useRef } from 'react';

// Mock chat users and messages pool
const CHAT_POOL = [
  "Anyone want to duo? I'm Gold tier",
  "Free Fire servers are solid today, let's win this!",
  "Entry fee is cheap, prize pool is crazy",
  "What is the Room ID guys?",
  "Room ID will be shared 15 mins before start, chill!",
  "Who is squad captain here?",
  "Let's land in Peak and rush!",
  "I am playing Solo Bermuda. Best of luck guys!",
  "Is double sniper allowed?",
  "Yes classic rules, standard Garena setting",
  "Add me guys UID: 28491038",
  "ZEST tournaments are always OP!",
  "Let's goooo! I am ready",
  "Can someone join my team? Code: 83920",
  "Who else is using Chrono?",
  "Bermuda map is my favorite. High kills incoming!"
];

const NAMES_POOL = [
  "Raptor_FF", "ViperStrike", "AWM_King", "HeadshotGod",
  "Panda_OP", "NinjaGamer", "GarenaPro", "Zest_Destroyer",
  "BermudaKing", "ClashGod", "Dynamo_FF", "FreeFireHero"
];

export default function TournamentLobby({ 
  tournament, 
  userProfile, 
  setUserProfile, 
  walletBalance, 
  setWalletBalance, 
  onBack, 
  onRegisterUser 
}) {
  const [activeTab, setActiveTab] = useState('details');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [ffUid, setFfUid] = useState(userProfile.uid || '');
  const [ffNickname, setFfNickname] = useState(userProfile.nickname || '');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "System", text: "Welcome to the Live Tournament Lobby! Chat with players here.", isSystem: true, time: "Just now" },
    { id: 2, sender: "ViperStrike", text: "Ready to dominate Bermuda!", isSystem: false, time: "1 min ago" },
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Simulate active chat messages
  useEffect(() => {
    if (activeTab !== 'chat') return;

    const interval = setInterval(() => {
      const randomSender = NAMES_POOL[Math.floor(Math.random() * NAMES_POOL.length)];
      const randomText = CHAT_POOL[Math.floor(Math.random() * CHAT_POOL.length)];
      const newMsg = {
        id: Date.now(),
        sender: randomSender,
        text: randomText,
        isSystem: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, newMsg]);
    }, 5000); // New message every 5s

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: userProfile.nickname || ffNickname || "You (Player)",
      text: userMessage,
      isSystem: false,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setUserMessage('');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ffUid.trim() || !ffNickname.trim()) {
      setErrorMsg('Please fill in all details.');
      return;
    }

    if (walletBalance < tournament.entryFee) {
      setErrorMsg('Insufficient balance! Please add money to your wallet.');
      return;
    }

    // Register user details
    onRegisterUser(tournament.id, ffUid, ffNickname, tournament.entryFee);
    setShowJoinModal(false);
  };

  const isUserJoined = tournament.joinedPlayers.some(p => p.isUser);

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* Back Button and Lobby Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ⬅️
        </button>
        <div>
          <h2 style={{ fontSize: '1rem', color: 'var(--secondary)', textTransform: 'uppercase' }}>
            Tournament Lobby
          </h2>
          <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>
            {tournament.title}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)', 
          marginBottom: '16px',
          gap: '8px'
        }}
      >
        {['details', 'chat', 'brackets'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px 6px',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: activeTab === tab ? 'var(--secondary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--secondary)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease'
            }}
          >
            {tab === 'details' && '📋 DETAILS'}
            {tab === 'chat' && '💬 LOBBY CHAT'}
            {tab === 'brackets' && '🏆 BRACKET'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Tab 1: Details & Slots */}
        {activeTab === 'details' && (
          <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Quick Match stats Card */}
            <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Map:</span>
                <p style={{ fontWeight: '700' }}>{tournament.map}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Time:</span>
                <p style={{ fontWeight: '700' }}>{new Date(tournament.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entry Fee:</span>
                <p style={{ fontWeight: '700', color: 'var(--accent)' }}>₹{tournament.entryFee}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Slots Available:</span>
                <p style={{ fontWeight: '700', color: 'var(--secondary)' }}>
                  {tournament.slotsTotal - tournament.slotsJoined} Left
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--success)' }}>Registered Successfully!</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      In-Game Nick: {tournament.joinedPlayers.find(p => p.isUser)?.nickname}
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
                  {tournament.slotsJoined >= tournament.slotsTotal ? 'Lobby Full' : `Register now (₹${tournament.entryFee})`}
                </button>
              )}
            </div>

            {/* Rules card */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--primary)' }}>TOURNAMENT RULES</h3>
              <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Room ID & Password will be shared on this details tab 15 mins before match start.</li>
                <li>Cheating, hacking, or using external modifiers will result in an immediate lifetime ban.</li>
                <li>No emulator players allowed unless specified. Mobile players only.</li>
                <li>Prizes will be credited directly to your Zest Wallet within 30 minutes of match completion.</li>
              </ul>
            </div>

            {/* Registered Players list */}
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Registered Players ({tournament.slotsJoined})</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Max: {tournament.slotsTotal}</span>
              </h3>
              <div 
                className="glass-panel" 
                style={{ 
                  maxHeight: '220px', 
                  overflowY: 'auto',
                  padding: '8px'
                }}
              >
                {tournament.joinedPlayers.map((player, idx) => (
                  <div 
                    key={idx}
                    className="flex-between"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: player.isUser ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <strong style={{ color: player.isUser ? 'var(--secondary)' : '#fff' }}>
                        {player.nickname}
                      </strong>
                      {player.isUser && <span style={{ fontSize: '0.7rem', background: 'var(--secondary)', color: '#000', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>YOU</span>}
                    </div>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ID: {player.uid}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Chat */}
        {activeTab === 'chat' && (
          <div className="animate-slide-in glass-panel" style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '380px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Chat Messages Log */}
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              {chatMessages.map(msg => (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: msg.isSystem ? 'center' : msg.isUser ? 'flex-end' : 'flex-start',
                    maxWidth: msg.isSystem ? '90%' : '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  {!msg.isSystem && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', padding: '0 4px' }}>
                      {msg.sender} • {msg.time}
                    </span>
                  )}
                  <div style={{
                    padding: msg.isSystem ? '6px 12px' : '10px 14px',
                    borderRadius: msg.isSystem ? '12px' : msg.isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: msg.isSystem ? 'rgba(255,255,255,0.03)' : msg.isUser ? 'var(--primary)' : 'var(--bg-card-hover)',
                    border: msg.isSystem ? '1px dashed var(--border-color)' : '1px solid rgba(255,255,255,0.03)',
                    color: msg.isSystem ? 'var(--text-muted)' : '#fff',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    boxShadow: msg.isUser ? '0 2px 8px rgba(255, 87, 34, 0.2)' : 'none'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Input Box */}
            <form 
              onSubmit={handleSendMessage}
              style={{ 
                padding: '10px', 
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '8px',
                background: 'rgba(7, 9, 14, 0.4)'
              }}
            >
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="form-input"
                style={{ flex: 1, borderRadius: '20px', padding: '10px 16px', height: '40px', fontSize: '0.85rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
              >
                ➔
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Brackets & Leaderboards */}
        {activeTab === 'brackets' && (
          <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {tournament.type === 'Clash Squad' ? (
              /* Bracket Layout */
              <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center' }}>CLASH SQUAD BRACKET</h3>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', minWidth: '400px' }}>
                  
                  {/* Quarters (Simulated) */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>QUARTER-FINALS</div>
                    {[
                      ["Squad Alpha", "Squad Beta"],
                      ["Squad Gamma", "Squad Delta"]
                    ].map((match, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', width: '120px' }}>
                        <div style={{ fontSize: '0.75rem', padding: '2px', borderBottom: '1px solid var(--border-color)' }}>{match[0]}</div>
                        <div style={{ fontSize: '0.75rem', padding: '2px' }}>{match[1]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Connecting Line */}
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>➔</div>

                  {/* Semis */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>SEMI-FINALS</div>
                    {[
                      ["Winner QF1", "Winner QF2"]
                    ].map((match, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', borderRadius: '6px', padding: '6px', width: '120px', boxShadow: 'var(--glow-primary)' }}>
                        <div style={{ fontSize: '0.75rem', padding: '2px', borderBottom: '1px solid var(--border-color)' }}>{match[0]}</div>
                        <div style={{ fontSize: '0.75rem', padding: '2px' }}>{match[1]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Connecting Line */}
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>➔</div>

                  {/* Finals */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>FINALS</div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(255,87,34,0.1) 100%)', border: '1px solid var(--secondary)', borderRadius: '6px', padding: '8px', width: '120px', boxShadow: 'var(--glow-secondary)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--accent)' }}>🥇 GRAND FINALS</div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* Leaderboard Layout */
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', textAlign: 'center' }}>LIVE SCOREBOARD / LEADERBOARD</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Rank</th>
                      <th style={{ padding: '8px 4px' }}>Player Nick</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Kills</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Place Pts</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.leaderboard && tournament.leaderboard.map((item, idx) => (
                      <tr 
                        key={idx} 
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: item.isUser ? 'rgba(0, 229, 255, 0.05)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '8px 4px', fontWeight: '700' }}>#{idx + 1}</td>
                        <td style={{ padding: '8px 4px', color: item.isUser ? 'var(--secondary)' : '#fff', fontWeight: item.isUser ? '700' : 'normal' }}>
                          {item.nickname} {item.isUser && <span style={{ fontSize: '0.65rem', background: 'var(--secondary)', color: '#000', padding: '1px 3px', borderRadius: '2px' }}>YOU</span>}
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.kills}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.placementPoints}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '700', color: 'var(--accent)' }}>{item.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Join/Registration Modal */}
      {showJoinModal && (
        <div 
          className="flex-center" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 300,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-slide-in" 
            style={{ 
              width: '100%', 
              maxWidth: '360px', 
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '16px', color: 'var(--secondary)' }}>
              REGISTRATION DETAILS
            </h2>
            <form onSubmit={handleJoin}>
              
              <div className="form-group">
                <label>Free Fire Nickname</label>
                <input 
                  type="text" 
                  value={ffNickname}
                  onChange={(e) => setFfNickname(e.target.value)}
                  placeholder="e.g. ZEST_KILLER"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Free Fire User ID (UID)</label>
                <input 
                  type="number" 
                  value={ffUid}
                  onChange={(e) => setFfUid(e.target.value)}
                  placeholder="e.g. 5829103984"
                  className="form-input"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Ensure your UID is correct. Match rooms check UID before entry.
                </span>
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Pay ₹{tournament.entryFee}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
