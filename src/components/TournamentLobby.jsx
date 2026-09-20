import React, { useState } from 'react';
import { 
  addDemoPlayersToTournamentRealtime,
  creditUserWalletRealtime,
  sendNotificationRealtime
} from '../services/firebase';
import { formatMatchDate } from '../services/dateUtils';
import { sendToMakeWebhook } from '../services/webhookService';

export default function TournamentLobby({ 
  tournament, 
  userProfile, 
  setUserProfile, 
  walletBalance, 
  setWalletBalance, 
  onBack, 
  onRegisterUser,
  onRemovePlayerFromTournament,
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
  const [removingPlayerId, setRemovingPlayerId] = useState(null);

  // Direct Prize Modal states for Host/Admin in Lobby
  const [rosterPrizePlayer, setRosterPrizePlayer] = useState(null);
  const [rosterPrizeAmount, setRosterPrizeAmount] = useState('');
  const [rosterPrizeReason, setRosterPrizeReason] = useState('');
  const [rosterPrizeLoading, setRosterPrizeLoading] = useState(false);
  const [rosterPrizeStatus, setRosterPrizeStatus] = useState('');

  const cleanUserUid = String(userProfile?.uid || userProfile?.id || '').trim().toLowerCase();
  const cleanUserEmail = String(userProfile?.email || '').trim().toLowerCase();

  const isUserJoined = Boolean(
    (cleanUserUid || cleanUserEmail) && 
    tournament.joinedPlayers?.some(p => {
      const pUid = String(p.uid || '').trim().toLowerCase();
      const pEmail = String(p.email || '').trim().toLowerCase();
      return (cleanUserUid && pUid === cleanUserUid) || (cleanUserEmail && pEmail === cleanUserEmail);
    })
  );
  const isSquadMode = tournament.mode === 'Duo' || tournament.mode === 'Squad';
  const isLoneWolf = tournament.type?.toLowerCase().includes('lone wolf');

  const totalSlots = tournament.slotsTotal || tournament.maxSlots || 48;
  const joinedSlots = Math.max(tournament.slotsJoined || 0, (tournament.joinedPlayers || []).length);
  const isMatchFull = joinedSlots >= totalSlots;
  const isHostOrAdmin = String(userProfile?.uid || '').trim() === '9084311275' || userProfile?.role === 'admin' || userProfile?.isHost;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenRosterPrize = (player) => {
    setRosterPrizePlayer({ player, tournament });
    const defaultAmt = tournament.bounty || tournament.prizePool || '50';
    setRosterPrizeAmount(String(defaultAmt));
    setRosterPrizeReason(`1st Place Winner - ${tournament.title}`);
    setRosterPrizeStatus('');
  };

  const handleConfirmRosterPrize = async (e) => {
    if (e) e.preventDefault();
    if (!rosterPrizePlayer) return;

    const { player } = rosterPrizePlayer;
    const amt = parseFloat(rosterPrizeAmount);
    if (isNaN(amt) || amt <= 0) {
      setRosterPrizeStatus('⚠️ Please enter a valid positive prize amount.');
      return;
    }

    setRosterPrizeLoading(true);
    setRosterPrizeStatus('');

    try {
      const targetIdentifier = player.uid || player.email || player.nickname;
      const finalReason = rosterPrizeReason.trim() || `Prize Winnings - ${tournament.title}`;
      
      const res = await creditUserWalletRealtime(
        targetIdentifier, 
        amt, 
        '🏆 Tournament Prize Winnings', 
        finalReason
      );

      if (res.success) {
        setRosterPrizeStatus(`✅ Successfully credited ₹${amt} prize money to ${player.nickname || player.uid}'s wallet!`);

        await sendToMakeWebhook({
          eventType: 'PRIZE_PAYOUT',
          nickname: player.nickname || targetIdentifier,
          ffUid: player.uid || targetIdentifier,
          email: player.email || 'N/A',
          phone: player.phone || 'N/A',
          details: `Lobby Direct Prize: ₹${amt} (${finalReason}) [Match: ${tournament.title}]`
        });

        try {
          await sendNotificationRealtime({
            title: `🏆 Prize Money Credited: ₹${amt}!`,
            message: `Congratulations ${player.nickname || 'Player'}! You have won ₹${amt} in "${tournament.title}". The prize has been added directly to your wallet balance!`,
            type: 'prize',
            category: 'WINNINGS',
            badgeText: 'PRIZE',
            targetUid: player.uid
          });
        } catch (notifErr) {
          console.warn('Failed to dispatch prize notification:', notifErr);
        }

        setTimeout(() => {
          setRosterPrizePlayer(null);
          setRosterPrizeStatus('');
        }, 2200);
      } else {
        setRosterPrizeStatus(`⚠️ ${res.error || 'Failed to credit prize money'}`);
      }
    } catch (err) {
      console.error('Error awarding prize from lobby:', err);
      setRosterPrizeStatus(`⚠️ Error: ${err.message}`);
    } finally {
      setRosterPrizeLoading(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isMatchFull) {
      setErrorMsg('This match is completely full (Housefull)! No more slots available.');
      return;
    }

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
          
          {/* Headshot Only / 1v1 Mode Highlight Banner */}
          {(tournament.type?.toLowerCase().includes('headshot') || tournament.title?.toLowerCase().includes('headshot')) && (
            <div className="glass-panel" style={{
              background: 'linear-gradient(135deg, rgba(255, 23, 68, 0.15) 0%, rgba(255, 214, 0, 0.12) 100%)',
              border: '1px solid #ff1744',
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.6rem' }}>🎯</span>
              <div>
                <strong style={{ color: '#ff5252', fontSize: '0.9rem', display: 'block' }}>
                  {tournament.type?.toLowerCase().includes('1v1') ? '1V1 ONLY HEADSHOT DUEL' : 'ONLY HEADSHOT MATCH'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#fff' }}>
                  Sirf Headshot kills count honge. Body kills strictly forbidden.
                </span>
              </div>
            </div>
          )}

          {/* Quick Match stats Card */}
          <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Map:</span>
              <p style={{ fontWeight: '700', margin: '2px 0 0 0' }}>{tournament.map}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 Match Date:</span>
              <p style={{ fontWeight: '800', margin: '2px 0 0 0', color: 'var(--secondary)' }}>
                {formatMatchDate(tournament.matchDate, tournament.startTime)}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏰ Start Time:</span>
              <p style={{ fontWeight: '700', margin: '2px 0 0 0', color: '#fff' }}>
                {tournament.startTime 
                  ? (!isNaN(new Date(tournament.startTime).getTime()) 
                      ? new Date(tournament.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                      : tournament.startTime) 
                  : 'Live'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entry Fee:</span>
              <p style={{ fontWeight: '700', color: 'var(--accent)', margin: '2px 0 0 0' }}>₹{tournament.entryFee}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {(isLoneWolf && !tournament.type?.toLowerCase().includes('clash')) ? 'Prize Structure:' : 'Per Kill Bounty:'}
              </span>
              <p style={{ fontWeight: '700', color: (isLoneWolf && !tournament.type?.toLowerCase().includes('clash')) ? 'var(--accent)' : 'var(--secondary)', margin: '2px 0 0 0' }}>
                {(isLoneWolf && !tournament.type?.toLowerCase().includes('clash')) ? '🏆 Winner Takes All' : `₹${tournament.perKillPrize !== undefined && tournament.perKillPrize !== null && tournament.perKillPrize !== '' ? tournament.perKillPrize : 25}`}
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
            ) : isMatchFull ? (
              <div style={{
                background: 'rgba(255, 23, 68, 0.12)',
                border: '1px solid #ff1744',
                padding: '16px',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#ff1744',
                fontWeight: '800',
                fontSize: '0.95rem'
              }}>
                🚫 THIS MATCH IS HOUSEFULL (0 SLOTS LEFT)
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All {totalSlots} player slots have been filled. Registration is now closed for this match.
                </p>
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
          <div className="flex-between" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 2px 0' }}>
                👥 Joined Players ({tournament.joinedPlayers?.length || 0}/{totalSlots})
              </h3>
              {isMatchFull && (
                <span className="badge" style={{ background: '#ff1744', color: '#fff', fontSize: '0.65rem', fontWeight: '900' }}>
                  🔴 FULL / HOUSEFULL
                </span>
              )}
            </div>
            {isHostOrAdmin && (
              <button
                type="button"
                onClick={async () => {
                  const currentJoined = tournament.joinedPlayers?.length || 0;
                  const availableSlots = Math.max(0, totalSlots - currentJoined);
                  if (availableSlots <= 0) {
                    alert(`⚠️ Match is already full (${currentJoined}/${totalSlots})!`);
                    return;
                  }
                  const promptVal = window.prompt(
                    `🤖 ADD BOTS TO MATCH\n\n` +
                    `Tournament: ${tournament.title}\n` +
                    `Current Joined: ${currentJoined}/${totalSlots}\n` +
                    `Available Slots: ${availableSlots}\n\n` +
                    `Enter number of bots to add (1 - ${availableSlots}):`,
                    String(Math.min(10, availableSlots))
                  );
                  if (promptVal === null) return;
                  const countNum = parseInt(promptVal, 10);
                  if (isNaN(countNum) || countNum <= 0) {
                    alert("⚠️ Please enter a valid positive number of bots.");
                    return;
                  }
                  const finalCount = Math.min(countNum, availableSlots);
                  const res = await addDemoPlayersToTournamentRealtime(tournament.id, finalCount);
                  if (res.success) {
                    alert(`🎉 Successfully added ${res.added} bots to "${tournament.title}"! (Total: ${res.total}/${totalSlots})`);
                  } else {
                    alert(`⚠️ ${res.error || 'Failed to add bots'}`);
                  }
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2) 0%, rgba(0, 229, 255, 0.2) 100%)',
                  color: '#00e676',
                  border: '1px solid rgba(0, 230, 118, 0.5)',
                  borderRadius: '6px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>🤖</span> +Add Bots
              </button>
            )}
          </div>
          
          {tournament.joinedPlayers && tournament.joinedPlayers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tournament.joinedPlayers.map((player, idx) => (
                <div key={idx} className="flex-between glass-panel" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', flexWrap: 'wrap', gap: '8px' }}>
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

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {player.squadCode && (
                      <span className="badge" style={{ background: 'rgba(255,214,0,0.15)', color: 'var(--accent)', fontSize: '0.68rem' }}>
                        Squad: {player.squadCode}
                      </span>
                    )}
                    {isHostOrAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRosterPrize(player)}
                          className="btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #ffd600 0%, #ffab00 100%)',
                            color: '#000',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(255, 214, 0, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🏆</span> Give Prize
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const pName = player.nickname || player.uid || 'this player';
                            if (window.confirm(`⚠️ Remove player "${pName}" (UID: ${player.uid}) from this match?`)) {
                              setRemovingPlayerId(player.uid || player.email || player.nickname);
                              if (onRemovePlayerFromTournament) {
                                await onRemovePlayerFromTournament(tournament.id, player.uid || player.email || player.nickname);
                              }
                              setRemovingPlayerId(null);
                            }
                          }}
                          disabled={removingPlayerId === (player.uid || player.email || player.nickname)}
                          className="btn btn-danger"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          {removingPlayerId === (player.uid || player.email || player.nickname) ? 'Removing...' : '🗑️ Kick'}
                        </button>
                      </>
                    )}
                  </div>
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

      {/* DIRECT LOBBY PRIZE MONEY POPUP MODAL FOR HOST/ADMIN */}
      {rosterPrizePlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="glass-panel animate-slide-in" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1px solid #ffd600',
            background: '#0a0f1d',
            borderRadius: '16px',
            boxShadow: '0 0 35px rgba(255, 214, 0, 0.25)'
          }}>
            {/* Header */}
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffd600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏆</span> Award Prize Money
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Match: <strong style={{ color: '#fff' }}>{tournament.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setRosterPrizePlayer(null); setRosterPrizeStatus(''); }}
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px' }}
              >
                ✕
              </button>
            </div>

            {/* Player Info Card */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255, 214, 0, 0.06)',
              border: '1px solid rgba(255, 214, 0, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd600, #ff9100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#000',
                fontWeight: '900',
                flexShrink: 0
              }}>
                👑
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '900', fontSize: '1rem', color: '#fff' }}>
                  {rosterPrizePlayer.player.nickname}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span>UID: <strong style={{ color: '#ffd600' }}>{rosterPrizePlayer.player.uid}</strong></span>
                  {rosterPrizePlayer.player.email && rosterPrizePlayer.player.email !== 'N/A' && <span>✉️ {rosterPrizePlayer.player.email}</span>}
                  {rosterPrizePlayer.player.phone && rosterPrizePlayer.player.phone !== 'N/A' && <span>📞 {rosterPrizePlayer.player.phone}</span>}
                </div>
              </div>
            </div>

            {/* Prize Amount Input & Quick Chips */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Prize Money Amount (₹ Coins) <span style={{ color: '#ff1744' }}>*</span>
              </label>
              
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {tournament.bounty && (
                  <button
                    type="button"
                    onClick={() => setRosterPrizeAmount(String(tournament.bounty))}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: rosterPrizeAmount === String(tournament.bounty) ? '1px solid #ffd600' : '1px solid rgba(255,255,255,0.1)',
                      background: rosterPrizeAmount === String(tournament.bounty) ? '#ffd600' : 'rgba(255,255,255,0.05)',
                      color: rosterPrizeAmount === String(tournament.bounty) ? '#000' : '#fff',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🎯 Bounty: ₹{tournament.bounty}
                  </button>
                )}
                {tournament.prizePool && (
                  <button
                    type="button"
                    onClick={() => setRosterPrizeAmount(String(tournament.prizePool))}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: rosterPrizeAmount === String(tournament.prizePool) ? '1px solid #ffd600' : '1px solid rgba(255,255,255,0.1)',
                      background: rosterPrizeAmount === String(tournament.prizePool) ? '#ffd600' : 'rgba(255,255,255,0.05)',
                      color: rosterPrizeAmount === String(tournament.prizePool) ? '#000' : '#fff',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🏆 Prize Pool: ₹{tournament.prizePool}
                  </button>
                )}
                {['20', '50', '100', '200', '500'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRosterPrizeAmount(amt)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: rosterPrizeAmount === amt ? '1px solid #00e676' : '1px solid rgba(255,255,255,0.1)',
                      background: rosterPrizeAmount === amt ? '#00e676' : 'rgba(255,255,255,0.05)',
                      color: rosterPrizeAmount === amt ? '#000' : '#fff',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#ffd600', fontWeight: '900', fontSize: '1.1rem' }}>₹</span>
                <input
                  type="number"
                  value={rosterPrizeAmount}
                  onChange={(e) => setRosterPrizeAmount(e.target.value)}
                  placeholder="Enter prize amount (e.g. 50)"
                  min="1"
                  className="input-field"
                  style={{
                    paddingLeft: '32px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    borderColor: 'rgba(255, 214, 0, 0.4)',
                    background: 'rgba(0,0,0,0.4)'
                  }}
                />
              </div>
            </div>

            {/* Prize Reason & Preset Chips */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Prize Reason / Remarks
              </label>
              
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  `🥇 1st Place Winner`,
                  `🥈 2nd Place Runner-Up`,
                  `🎯 Bounty Kill Winner`,
                  `👑 Match MVP`
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRosterPrizeReason(`${preset} - ${tournament.title}`)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={rosterPrizeReason}
                onChange={(e) => setRosterPrizeReason(e.target.value)}
                placeholder="e.g. 1st Place Winner"
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Feedback Status */}
            {rosterPrizeStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                background: rosterPrizeStatus.startsWith('✅') ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)',
                border: rosterPrizeStatus.startsWith('✅') ? '1px solid #00e676' : '1px solid #ff1744',
                color: rosterPrizeStatus.startsWith('✅') ? '#00e676' : '#ff1744'
              }}>
                {rosterPrizeStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { setRosterPrizePlayer(null); setRosterPrizeStatus(''); }}
                className="btn btn-outline"
                disabled={rosterPrizeLoading}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRosterPrize}
                disabled={rosterPrizeLoading || !rosterPrizeAmount || parseFloat(rosterPrizeAmount) <= 0}
                className="btn"
                style={{
                  flex: 2,
                  padding: '10px 16px',
                  fontSize: '0.88rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #00e676 0%, #ffd600 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0, 230, 118, 0.4)',
                  cursor: rosterPrizeLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {rosterPrizeLoading ? (
                  '⚡ Crediting Wallet...'
                ) : (
                  <>
                    <span>⚡</span> Send ₹{rosterPrizeAmount || 0} Prize to Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
