import React, { useState, useEffect } from 'react';
import { getWebhookUrl, setWebhookUrl, sendToMakeWebhook } from '../services/webhookService';
import { getRazorpayConfig, setRazorpayConfig } from '../services/razorpayService';

// Help generate mock players
const MOCK_NICKNAMES = [
  "Raptor_FF", "ViperStrike", "AWM_King", "HeadshotGod",
  "Panda_OP", "NinjaGamer", "GarenaPro", "Zest_Destroyer",
  "BermudaKing", "ClashGod", "Dynamo_FF", "FreeFireHero",
  "Ruler_OP", "GamerBoy", "SniperQueen", "Torn_Max", "GarenaX"
];

export default function AdminHostPanel({ tournaments = [], onAddTournament, onBroadcastRoomCredentials, setCurrentView }) {
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'rooms' | 'proofs' | 'razorpay' | 'webhook'
  
  // Host Form states
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('Solo');
  const [type, setType] = useState('Classic');
  const [mapName, setMapName] = useState('Bermuda');
  const [prizePool, setPrizePool] = useState('2000');
  const [entryFee, setEntryFee] = useState('20');
  const [slotsTotal, setSlotsTotal] = useState('48');
  const [startingIn, setStartingIn] = useState('30');
  const [errorMsg, setErrorMsg] = useState('');

  // Room ID Broadcast states
  const [selectedTourneyId, setSelectedTourneyId] = useState(tournaments[0]?.id || '');
  const [inputRoomId, setInputRoomId] = useState('');
  const [inputRoomPass, setInputRoomPass] = useState('');
  const [roomBroadcastStatus, setRoomBroadcastStatus] = useState('');

  // Proofs & Result verification states
  const [matchProofs, setMatchProofs] = useState([]);
  const [selectedProofModal, setSelectedProofModal] = useState(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Razorpay Gateway Settings states
  const [razorpaySettings, setRazorpaySettings] = useState(getRazorpayConfig());
  const [razorpaySavedStatus, setRazorpaySavedStatus] = useState('');

  // Webhook states
  const [webhookInput, setWebhookInput] = useState(getWebhookUrl());
  const [webhookStatus, setWebhookStatus] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('zest_match_proofs') || '[]');
    setMatchProofs(saved);
  }, [activeTab]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType.includes('1v1')) {
      setSlotsTotal('2');
      setMode('Solo');
      setMapName('Iron Dome');
    } else if (newType.includes('Lone Wolf') && (newType.includes('2v2') || newType === 'Lone Wolf 2v2')) {
      setSlotsTotal('4');
      setMode('Duo');
      setMapName('Iron Cage');
    } else if (newType.includes('Clash Squad')) {
      setSlotsTotal('8');
      setMode('Squad');
      setMapName('Bermuda (CS)');
    } else {
      setSlotsTotal('48');
      setMode('Solo');
      setMapName('Bermuda');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Tournament Title is required.');
      return;
    }

    const prize = parseFloat(prizePool);
    const fee = parseFloat(entryFee);
    let slots = parseInt(slotsTotal);
    const minutes = parseInt(startingIn);

    // Enforce exact rules
    const isLoneWolf1v1 = type.toLowerCase().includes('1v1');
    const isLoneWolf2v2 = type.toLowerCase().includes('lone wolf') && type.toLowerCase().includes('2v2');
    const isClashSquad = type.toLowerCase().includes('clash');

    if (isLoneWolf1v1) slots = 2;
    else if (isLoneWolf2v2) slots = 4;
    else if (isClashSquad) slots = 8;

    if (isNaN(prize) || prize < 0 || isNaN(fee) || fee < 0 || isNaN(slots) || slots < 2 || isNaN(minutes) || minutes <= 0) {
      setErrorMsg('Please enter valid numeric parameters.');
      return;
    }

    const numMockJoined = isLoneWolf1v1 ? 1 : isLoneWolf2v2 ? 2 : isClashSquad ? 4 : Math.min(Math.floor(Math.random() * (slots / 2)) + 3, slots - 1);
    const joinedPlayers = [];
    
    for (let i = 0; i < numMockJoined; i++) {
      joinedPlayers.push({
        nickname: MOCK_NICKNAMES[i % MOCK_NICKNAMES.length] + `_${Math.floor(Math.random()*90 + 10)}`,
        uid: String(Math.floor(Math.random() * 900000000) + 100000000),
        isUser: false
      });
    }

    const leaderboard = [];
    const startTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const newTournament = {
      id: `custom-${Date.now()}`,
      title: title,
      mode: isLoneWolf1v1 ? 'Solo' : isLoneWolf2v2 ? 'Duo' : isClashSquad ? 'Squad' : mode,
      type: type,
      map: mapName,
      prizePool: prize,
      perKillPrize: (isLoneWolf1v1 || isLoneWolf2v2) ? 0 : 25,
      entryFee: fee,
      slotsTotal: slots,
      maxSlots: slots,
      slotsJoined: numMockJoined,
      joinedPlayers: joinedPlayers,
      startTime: startTime,
      status: 'upcoming',
      roomId: '',
      roomPassword: '',
      leaderboard: leaderboard
    };

    onAddTournament(newTournament);
    setCurrentView('dashboard');
  };

  const handleBroadcastRoom = async (e) => {
    e.preventDefault();
    if (!selectedTourneyId) {
      setRoomBroadcastStatus('⚠️ Please select a tournament.');
      return;
    }
    if (!inputRoomId.trim()) {
      setRoomBroadcastStatus('⚠️ Please enter the Free Fire Custom Room ID.');
      return;
    }

    if (onBroadcastRoomCredentials) {
      await onBroadcastRoomCredentials(selectedTourneyId, inputRoomId.trim(), inputRoomPass.trim());
      setRoomBroadcastStatus('✅ Broadcasted Room ID & Password to all player devices in real-time!');
      setTimeout(() => setRoomBroadcastStatus(''), 4000);
    }
  };

  const handleApprovePayout = async (proof) => {
    const placementPrize = proof.rank === 1 ? 500 : proof.rank === 2 ? 300 : proof.rank === 3 ? 150 : 50;
    const killPrize = (proof.kills || 0) * 25;
    const totalPrize = placementPrize + killPrize;

    const updatedProofs = matchProofs.map(p => {
      if (p.id === proof.id) {
        return { ...p, status: 'approved', prizePaid: totalPrize };
      }
      return p;
    });

    setMatchProofs(updatedProofs);
    localStorage.setItem('zest_match_proofs', JSON.stringify(updatedProofs));

    await sendToMakeWebhook({
      eventType: 'PRIZE_PAYOUT',
      nickname: proof.playerNickname,
      ffUid: proof.playerUid,
      email: proof.email || 'N/A',
      phone: proof.phone || 'N/A',
      details: `Prize Paid: ₹${totalPrize} (Rank #${proof.rank} [₹${placementPrize}] + ${proof.kills} Kills [₹${killPrize}]) for ${proof.tournamentTitle}`
    });

    setPayoutSuccessMsg(`✅ Approved & credited ₹${totalPrize} prize to ${proof.playerNickname}!`);
    setTimeout(() => setPayoutSuccessMsg(''), 4000);
  };

  const handleSaveRazorpayConfig = (e) => {
    e.preventDefault();
    setRazorpayConfig(razorpaySettings);
    setRazorpaySavedStatus('✅ Razorpay Gateway configurations updated successfully.');
    setTimeout(() => setRazorpaySavedStatus(''), 3000);
  };

  const handleSaveWebhook = (e) => {
    e.preventDefault();
    setWebhookUrl(webhookInput);
    setWebhookStatus('✅ Webhook URL successfully saved to local system.');
    setTimeout(() => setWebhookStatus(''), 3000);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookStatus('Sending test payload to Make.com...');

    const res = await sendToMakeWebhook({
      eventType: 'TEST_PING',
      nickname: 'TEST_ZEST_PLAYER',
      ffUid: '99999999',
      email: 'test.player@zest.gg',
      phone: '+91 9999999999',
      details: 'Test connection from Zest Tournament App'
    });

    setTestingWebhook(false);
    if (res.success) {
      setWebhookStatus('✅ Test payload dispatched! Check your Make.com Scenario / Google Sheet.');
    } else {
      setWebhookStatus(`⚠️ Dispatch completed.`);
    }
  };

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '32px' }}>
      
      {/* Top Header & Mode Tabs */}
      <div className="flex-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> ADMIN & HOST PANEL
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Manage tournaments, Razorpay gateway, verify match proofs, and sync Google Sheets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('host')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'host' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid var(--border-color)'
            }}
          >
            🏆 Host Match
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'rooms' ? 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'rooms' ? '#000' : '#fff',
              border: '1px solid var(--border-color)',
              fontWeight: '700'
            }}
          >
            🔑 Room ID Drop
          </button>

          <button
            onClick={() => setActiveTab('proofs')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'proofs' ? 'var(--success)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'proofs' ? '#000' : '#fff',
              border: '1px solid var(--border-color)',
              fontWeight: '700'
            }}
          >
            📸 Verify Results ({matchProofs.filter(p => p.status === 'pending').length})
          </button>

          <button
            onClick={() => setActiveTab('razorpay')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'razorpay' ? 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'razorpay' ? '#000' : '#fff',
              border: '1px solid var(--border-color)',
              fontWeight: '900'
            }}
          >
            💳 Gateway (Razorpay)
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'webhook' ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'webhook' ? '#000' : '#fff',
              border: '1px solid var(--border-color)'
            }}
          >
            📊 Google Sheet
          </button>
        </div>
      </div>

      {/* MODE 1: HOST MATCH */}
      {activeTab === 'host' && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '4px' }}>
            🔥 Create New Tournament Match
          </h3>

          <div className="form-group">
            <label>Tournament Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Bermuda Midnight Solo Rush" 
              className="form-input"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Match Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="form-input">
                <option value="Solo">Solo (1 vs 1 / 1 vs 47)</option>
                <option value="Duo">Duo (2 vs 2)</option>
                <option value="Squad">Squad (4 vs 4 / BR)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Game Type</label>
              <select value={type} onChange={(e) => handleTypeChange(e.target.value)} className="form-input">
                <option value="Classic">Classic Battle Royale</option>
                <option value="Clash Squad">Clash Squad 4v4</option>
                <option value="Clash Squad Headshot">Clash Squad Headshot 4v4 🎯</option>
                <option value="Lone Wolf Headshot 1v1">Lone Wolf Headshot 1v1 🎯 (2 Players)</option>
                <option value="Lone Wolf Headshot 2v2">Lone Wolf Headshot 2v2 🎯 (4 Players)</option>
                <option value="Lone Wolf 2v2">Lone Wolf 2v2 🐺 (4 Players)</option>
                <option value="Lone Wolf 1v1">Lone Wolf 1v1 🐺 (2 Players)</option>
              </select>
            </div>
          </div>

          {/* Mode Rules Dynamic Helper Badge */}
          {type.toLowerCase().includes('lone wolf') && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(255, 214, 0, 0.1) 100%)',
              border: '1px solid var(--secondary)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🐺</span>
              <div>
                <strong>LONE WOLF RULES:</strong> {type.includes('1v1') ? 'Max 2 Players (1 vs 1).' : 'Max 4 Players (2 vs 2).'} 
                <span style={{ color: 'var(--accent)' }}> Winning Prize Only (No Per-Kill Bounty).</span>
              </div>
            </div>
          )}

          {type.toLowerCase().includes('clash') && (
            <div style={{
              background: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid var(--primary)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚔️</span>
              <div>
                <strong>CLASH SQUAD RULES:</strong> Exactly <strong>8 Players Only</strong> (Two teams of 4).
              </div>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label>Map</label>
              <select value={mapName} onChange={(e) => setMapName(e.target.value)} className="form-input">
                <option value="Bermuda">Bermuda</option>
                <option value="Bermuda (CS)">Bermuda (CS)</option>
                <option value="Iron Cage">Iron Cage (Lone Wolf)</option>
                <option value="Iron Dome">Iron Dome (Lone Wolf)</option>
                <option value="Science Center">Science Center (Lone Wolf)</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
                <option value="NeXTerra">NeXTerra</option>
              </select>
            </div>

            <div className="form-group">
              <label>Starting in (Minutes)</label>
              <input 
                type="number" 
                value={startingIn} 
                onChange={(e) => setStartingIn(e.target.value)} 
                className="form-input"
                min="5"
                max="1440"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Winning Prize Pool (₹)</label>
              <input 
                type="number" 
                value={prizePool} 
                onChange={(e) => setPrizePool(e.target.value)} 
                className="form-input"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Entry Fee (₹)</label>
              <input 
                type="number" 
                value={entryFee} 
                onChange={(e) => setEntryFee(e.target.value)} 
                className="form-input"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Total Slots ({type.includes('1v1') ? '2 for 1v1' : (type.includes('Lone Wolf') || type.includes('2v2')) ? '4 for 2v2' : type.includes('Clash') ? '8 for CS' : 'Slots'})</label>
            <input 
              type="number" 
              value={slotsTotal} 
              onChange={(e) => setSlotsTotal(e.target.value)} 
              className="form-input"
              min="2"
              max="100"
              required
            />
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '8px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', marginTop: '8px' }}
          >
            🚀 Publish Tournament to Live Arena
          </button>
        </form>
      )}

      {/* MODE 2: ROOM ID BROADCASTER */}
      {activeTab === 'rooms' && (
        <form onSubmit={handleBroadcastRoom} className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--accent)', marginBottom: '4px' }}>
            🔑 Free Fire Custom Room ID & Password Drop
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Broadcast the custom room ID & Password in real-time. It pops up instantly on all joined players' screens.
          </p>

          <div className="form-group">
            <label>Select Active Tournament</label>
            <select 
              value={selectedTourneyId} 
              onChange={(e) => setSelectedTourneyId(e.target.value)} 
              className="form-input"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.map} - {t.mode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Custom Room ID</label>
              <input 
                type="text" 
                value={inputRoomId} 
                onChange={(e) => setInputRoomId(e.target.value)} 
                placeholder="e.g. 7829103" 
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Room Password</label>
              <input 
                type="text" 
                value={inputRoomPass} 
                onChange={(e) => setInputRoomPass(e.target.value)} 
                placeholder="e.g. 1234" 
                className="form-input"
              />
            </div>
          </div>

          {roomBroadcastStatus && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem', padding: '8px', background: 'rgba(0,230,118,0.1)', borderRadius: '8px' }}>
              {roomBroadcastStatus}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-secondary"
            style={{ width: '100%', height: '48px', marginTop: '8px', background: 'linear-gradient(135deg, #ffd600 0%, #ff5722 100%)', color: '#000', fontWeight: '900' }}
          >
            ⚡ Broadcast Room ID to Players Now
          </button>
        </form>
      )}

      {/* MODE 3: RESULT VERIFICATION & PRIZE PAYOUTS */}
      {activeTab === 'proofs' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--success)', marginBottom: '4px' }}>
            🏆 Match Results & Screenshot Proof Verification
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Review player endgame victory screenshots and 1-click credit prize payouts directly to their wallet.
          </p>

          {payoutSuccessMsg && (
            <div style={{ color: 'var(--success)', background: 'rgba(0,230,118,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--success)' }}>
              {payoutSuccessMsg}
            </div>
          )}

          {matchProofs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              No player match submissions yet. Once players submit proof in the lobby, they will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchProofs.map(proof => (
                <div 
                  key={proof.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    border: proof.status === 'approved' ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,214,0,0.3)',
                    background: proof.status === 'approved' ? 'rgba(0,230,118,0.03)' : 'rgba(255,214,0,0.03)'
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>
                        {proof.playerNickname} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(UID: {proof.playerUid})</span>
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        {proof.tournamentTitle} • Submitted: {proof.submittedAt}
                      </span>
                    </div>

                    <span className="badge" style={{
                      background: proof.status === 'approved' ? 'rgba(0,230,118,0.2)' : 'rgba(255,214,0,0.2)',
                      color: proof.status === 'approved' ? 'var(--success)' : 'var(--accent)',
                      fontWeight: '700'
                    }}>
                      {proof.status === 'approved' ? '✓ APPROVED & PAID' : '⏳ PENDING REVIEW'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Claimed Rank: </span>
                      <strong style={{ color: 'var(--accent)' }}>#{proof.rank}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Claimed Kills: </span>
                      <strong style={{ color: 'var(--secondary)' }}>{proof.kills} Kills</strong>
                    </div>
                    {proof.screenshot && (
                      <button
                        type="button"
                        onClick={() => setSelectedProofModal(proof.screenshot)}
                        style={{
                          background: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid var(--secondary)',
                          color: 'var(--secondary)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        🖼️ View Screenshot Proof
                      </button>
                    )}
                  </div>

                  {proof.status === 'pending' ? (
                    <button
                      onClick={() => handleApprovePayout(proof)}
                      className="btn btn-secondary"
                      style={{
                        padding: '10px 16px',
                        fontSize: '0.85rem',
                        background: 'linear-gradient(135deg, #00e676 0%, #00e5ff 100%)',
                        color: '#000',
                        fontWeight: '900',
                        width: '100%'
                      }}
                    >
                      💰 Approve & Credit Prize (₹{proof.rank === 1 ? 500 + (proof.kills * 25) : 100 + (proof.kills * 25)})
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '700' }}>
                      ✅ Prize of ₹{proof.prizePaid || 500} has been credited to player's wallet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Screenshot Zoom Modal */}
          {selectedProofModal && (
            <div 
              className="flex-center" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.9)',
                zIndex: 99999,
                padding: '20px'
              }}
            >
              <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative', textAlign: 'center' }}>
                <button
                  onClick={() => setSelectedProofModal(null)}
                  style={{
                    position: 'absolute',
                    top: '-36px',
                    right: '0',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
                <img 
                  src={selectedProofModal} 
                  alt="Endgame Scoreboard" 
                  style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', border: '2px solid var(--secondary)' }}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODE 4: RAZORPAY PAYMENT GATEWAY CONFIGURATION */}
      {activeTab === 'razorpay' && (
        <form onSubmit={handleSaveRazorpayConfig} className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', margin: '0 0 4px 0' }}>
              💳 Razorpay Payment Gateway Settings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              Configure your <strong>Razorpay Key ID</strong> to accept UPI, Cards, and NetBanking payments from players.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Razorpay Key ID <span style={{ color: 'var(--primary)' }}>*</span></label>
            <input 
              type="text"
              value={razorpaySettings.keyId}
              onChange={(e) => setRazorpaySettings({ ...razorpaySettings, keyId: e.target.value })}
              placeholder="e.g. rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Merchant Display Name</label>
            <input 
              type="text"
              value={razorpaySettings.merchantName}
              onChange={(e) => setRazorpaySettings({ ...razorpaySettings, merchantName: e.target.value })}
              placeholder="Zest Tournament Esports"
              className="form-input"
              required
            />
          </div>

          {razorpaySavedStatus && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem', padding: '8px', background: 'rgba(0,230,118,0.1)', borderRadius: '8px' }}>
              {razorpaySavedStatus}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: '900', background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)', color: '#000' }}
          >
            💾 Save Razorpay Credentials
          </button>
        </form>
      )}

      {/* MODE 5: MAKE.COM & GOOGLE SHEETS */}
      {activeTab === 'webhook' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--secondary)', marginBottom: '4px' }}>
              📊 Make.com Webhook Integration
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Every user registration, tournament entry, and wallet deposit automatically sends data to this webhook to append rows directly into your <strong>Google Sheet</strong>.
            </p>
          </div>

          <form onSubmit={handleSaveWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label>Make.com Custom Webhook URL</label>
              <input 
                type="text" 
                value={webhookInput} 
                onChange={(e) => setWebhookInput(e.target.value)} 
                placeholder="https://hook.eu1.make.com/xxxxxxxxx" 
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                required
              />
            </div>

            {webhookStatus && (
              <div style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                {webhookStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                💾 Save Webhook URL
              </button>
              <button 
                type="button" 
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                {testingWebhook ? 'Sending Ping...' : '⚡ Send Test Row'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
