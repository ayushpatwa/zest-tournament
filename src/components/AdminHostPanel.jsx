import React, { useState, useEffect } from 'react';
import { getWebhookUrl, setWebhookUrl, sendToMakeWebhook } from '../services/webhookService';
import { getRazorpayConfig, setRazorpayConfig } from '../services/razorpayService';
import { saveAppSettingsRealtime, creditUserWalletRealtime } from '../services/firebase';

export default function AdminHostPanel({ tournaments = [], onAddTournament, onDeleteTournament, onBroadcastRoomCredentials, setCurrentView }) {
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'rooms' | 'payout' | 'manage' | 'razorpay' | 'webhook' | 'app_update'
  
  // Host Form states
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('Solo');
  const [type, setType] = useState('Classic');
  const [mapName, setMapName] = useState('Bermuda');
  const [prizePool, setPrizePool] = useState('2000');
  const [perKillPrize, setPerKillPrize] = useState('25');
  const [entryFee, setEntryFee] = useState('20');
  const [slotsTotal, setSlotsTotal] = useState('48');
  const [matchTiming, setMatchTiming] = useState('03:00 PM - 04:00 PM');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteStatusMsg, setDeleteStatusMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Prize Distribution states
  const [payoutPlayerIdentifier, setPayoutPlayerIdentifier] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('500');
  const [payoutReason, setPayoutReason] = useState('1st Place Tournament Winner 🏆');
  const [payoutStatus, setPayoutStatus] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

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

  // App Update Publisher states
  const [updateVersion, setUpdateVersion] = useState('1.1.0');
  const [updateTitle, setUpdateTitle] = useState('🔥 New Tournament Updates & Features!');
  const [updateNotes, setUpdateNotes] = useState('• Added Clash Squad 2v2 & Headshot Modes\n• Instant Room ID updates\n• Seamless Razorpay deposits');
  const [updateDownloadUrl, setUpdateDownloadUrl] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updatePublishStatus, setUpdatePublishStatus] = useState('');

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
      setPerKillPrize('0');
    } else if (newType.includes('2v2')) {
      setSlotsTotal('4');
      setMode('Duo');
      setMapName(newType.includes('Clash') ? 'Bermuda (CS)' : 'Iron Cage');
      setPerKillPrize(newType.includes('Lone Wolf') ? '0' : '25');
    } else if (newType.includes('Clash Squad')) {
      setSlotsTotal('8');
      setMode('Squad');
      setMapName('Bermuda (CS)');
      setPerKillPrize('25');
    } else {
      setSlotsTotal('48');
      setMode('Solo');
      setMapName('Bermuda');
      setPerKillPrize('25');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Tournament Title is required.');
      return;
    }
    if (!matchTiming.trim()) {
      setErrorMsg('Match Timing / Slot is required (e.g. 03:00 PM - 04:00 PM).');
      return;
    }

    const prize = parseFloat(prizePool);
    const killBounty = parseFloat(perKillPrize);
    const fee = parseFloat(entryFee);
    let slots = parseInt(slotsTotal);

    // Enforce exact rules
    const is1v1 = type.toLowerCase().includes('1v1');
    const is2v2 = type.toLowerCase().includes('2v2');
    const isClashSquad4v4 = type.toLowerCase().includes('clash') && !is2v2;

    if (is1v1) slots = 2;
    else if (is2v2) slots = 4;
    else if (isClashSquad4v4) slots = 8;

    if (isNaN(prize) || prize < 0 || isNaN(fee) || fee < 0 || isNaN(slots) || slots < 2 || isNaN(killBounty) || killBounty < 0) {
      setErrorMsg('Please enter valid numeric parameters.');
      return;
    }

    const newTournament = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      mode: is1v1 ? 'Solo' : is2v2 ? 'Duo' : isClashSquad4v4 ? 'Squad' : mode,
      type: type,
      map: mapName,
      prizePool: prize,
      perKillPrize: killBounty,
      entryFee: fee,
      slotsTotal: slots,
      maxSlots: slots,
      slotsJoined: 0,
      joinedPlayers: [],
      startTime: matchTiming.trim(),
      status: 'upcoming',
      roomId: '',
      roomPassword: '',
      leaderboard: []
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

  const handleDeleteMatch = async (tournamentId, tournamentTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${tournamentTitle}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(tournamentId);
    if (onDeleteTournament) {
      await onDeleteTournament(tournamentId);
      setDeleteStatusMsg(`✅ Successfully deleted "${tournamentTitle}" in real-time.`);
      setTimeout(() => setDeleteStatusMsg(''), 4000);
    }
    setDeletingId(null);
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

  const handleSaveRazorpayConfig = async (e) => {
    e.preventDefault();
    setRazorpayConfig(razorpaySettings);
    await saveAppSettingsRealtime({
      razorpayKeyId: razorpaySettings.keyId,
      razorpayMerchantName: razorpaySettings.merchantName,
      razorpayThemeColor: razorpaySettings.themeColor
    });
    setRazorpaySavedStatus('✅ Razorpay Gateway configurations synced to cloud and all APK/Web players in real-time!');
    setTimeout(() => setRazorpaySavedStatus(''), 4000);
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setWebhookUrl(webhookInput);
    await saveAppSettingsRealtime({
      webhookUrl: webhookInput.trim()
    });
    setWebhookStatus('✅ Webhook URL successfully synced to cloud and all devices!');
    setTimeout(() => setWebhookStatus(''), 4000);
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

  const handlePublishAppUpdate = async (e) => {
    e.preventDefault();
    if (!updateDownloadUrl.trim()) {
      setUpdatePublishStatus('⚠️ Please enter an APK Download URL (Google Drive, Website link, etc.)');
      return;
    }
    await saveAppSettingsRealtime({
      appUpdate: {
        latestVersion: updateVersion.trim(),
        title: updateTitle.trim(),
        notes: updateNotes.trim(),
        downloadUrl: updateDownloadUrl.trim(),
        forceUpdate: forceUpdate,
        publishedAt: new Date().toISOString()
      }
    });
    setUpdatePublishStatus(`✅ In-App Update Notice (v${updateVersion}) published to all players in real-time!`);
    setTimeout(() => setUpdatePublishStatus(''), 4000);
  };

  const handleDirectPrizePayout = async (e) => {
    e.preventDefault();
    setPayoutStatus('');
    const amt = parseFloat(payoutAmount);
    if (!payoutPlayerIdentifier.trim() || isNaN(amt) || amt <= 0) {
      setPayoutStatus('⚠️ Please enter player UID/Email and a valid prize amount.');
      return;
    }
    setPayoutLoading(true);
    const res = await creditUserWalletRealtime(payoutPlayerIdentifier.trim(), amt, payoutReason.trim());
    if (res.success) {
      setPayoutStatus(`✅ Successfully credited ₹${amt} prize to player (${payoutPlayerIdentifier})!`);
      await sendToMakeWebhook({
        eventType: 'PRIZE_PAYOUT',
        nickname: res.user?.nickname || payoutPlayerIdentifier,
        ffUid: res.user?.uid || payoutPlayerIdentifier,
        email: res.user?.email || 'N/A',
        phone: res.user?.phone || 'N/A',
        details: `Admin Credited Prize: ₹${amt} (${payoutReason})`
      });
      setPayoutPlayerIdentifier('');
    } else {
      setPayoutStatus(`⚠️ ${res.error || 'Failed to credit prize'}`);
    }
    setPayoutLoading(false);
    setTimeout(() => setPayoutStatus(''), 5000);
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
            onClick={() => setActiveTab('payout')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'payout' ? 'linear-gradient(135deg, #00e676 0%, #ffd600 100%)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'payout' ? '#000' : 'var(--success)',
              border: '1px solid var(--border-color)',
              fontWeight: '900'
            }}
          >
            💰 Give Prize Money
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'manage' ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              fontWeight: '700'
            }}
          >
            🗑️ Delete Matches ({tournaments.length})
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

          <button
            onClick={() => setActiveTab('app_update')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              background: activeTab === 'app_update' ? 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              fontWeight: '900'
            }}
          >
            🚀 App Update (APK)
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
                <option value="Solo">Solo</option>
                <option value="Duo">Duo</option>
                <option value="Squad">Squad</option>
              </select>
            </div>

            <div className="form-group">
              <label>Game Type</label>
              <select value={type} onChange={(e) => handleTypeChange(e.target.value)} className="form-input">
                <option value="Classic">Classic Battle Royale</option>
                <option value="Clash Squad">Clash Squad 4v4</option>
                <option value="Clash Squad Headshot">Clash Squad Headshot 4v4 🎯</option>
                <option value="Clash Squad 2v2">Clash Squad 2v2 ⚔️ (4 Players)</option>
                <option value="Clash Squad 2v2 Headshot">Clash Squad 2v2 Headshot 🎯 (4 Players)</option>
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
                <strong>CLASH SQUAD RULES:</strong> {type.includes('2v2') ? 'Exactly 4 Players (Two Duo Teams / 2 vs 2).' : 'Exactly 8 Players (Two 4-Player Teams / 4 vs 4).'}
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
              <label>Match Timing / Slot (e.g. 3:00 PM - 4:00 PM)</label>
              <input 
                type="text" 
                value={matchTiming} 
                onChange={(e) => setMatchTiming(e.target.value)} 
                placeholder="e.g. 03:00 PM - 04:00 PM or Tonight, 08:30 PM"
                className="form-input"
                required
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['03:00 PM - 04:00 PM', '06:00 PM - 07:00 PM', '08:30 PM - 09:30 PM', '10:00 PM - 11:00 PM'].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setMatchTiming(slot)}
                    style={{
                      background: matchTiming === slot ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
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
              <label>Per Kill Bounty (₹)</label>
              <input 
                type="number" 
                value={perKillPrize} 
                onChange={(e) => setPerKillPrize(e.target.value)} 
                placeholder="e.g. 25 (0 for Lone Wolf)"
                className="form-input"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid-2">
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

      {/* MODE 2.5: DIRECT PRIZE DISTRIBUTION TO USER WALLET */}
      {activeTab === 'payout' && (
        <form onSubmit={handleDirectPrizePayout} className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--success)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💰</span> Distribute Winning Money to Player Wallet
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Credit winnings directly to any player's in-app wallet balance in real-time. Players can withdraw this to their UPI / Bank account anytime!
            </p>
          </div>

          {payoutStatus && (
            <div style={{ 
              color: payoutStatus.includes('✅') ? 'var(--success)' : 'var(--danger)', 
              background: payoutStatus.includes('✅') ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', 
              padding: '12px 14px', 
              borderRadius: '8px', 
              border: `1px solid ${payoutStatus.includes('✅') ? 'var(--success)' : 'var(--danger)'}`, 
              fontSize: '0.88rem' 
            }}>
              {payoutStatus}
            </div>
          )}

          <div className="form-group">
            <label>Player Free Fire UID, Email, or In-Game Nickname <span style={{ color: 'var(--primary)' }}>*</span></label>
            <input 
              type="text" 
              value={payoutPlayerIdentifier} 
              onChange={(e) => setPayoutPlayerIdentifier(e.target.value)} 
              placeholder="e.g. 482910384 or player@gmail.com or ZEST_KILLER"
              className="form-input"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Prize Amount to Credit (₹) <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input 
                type="number" 
                value={payoutAmount} 
                onChange={(e) => setPayoutAmount(e.target.value)} 
                placeholder="e.g. 500"
                className="form-input"
                min="1"
                required
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['50', '100', '250', '500', '1000', '2000'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPayoutAmount(amt)}
                    style={{
                      background: payoutAmount === amt ? 'var(--success)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: payoutAmount === amt ? '#000' : '#fff',
                      fontWeight: '700',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Prize Reason / Match Title</label>
              <input 
                type="text" 
                value={payoutReason} 
                onChange={(e) => setPayoutReason(e.target.value)} 
                placeholder="e.g. 1st Place Winner - CS 2v2"
                className="form-input"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={payoutLoading}
            style={{ 
              width: '100%', 
              height: '48px', 
              marginTop: '4px', 
              background: 'linear-gradient(135deg, #00e676 0%, #ffd600 100%)', 
              color: '#000', 
              fontWeight: '900',
              fontSize: '0.92rem'
            }}
          >
            {payoutLoading ? '⚡ Processing Cloud Payout...' : '⚡ Credit Prize Money to Player Wallet Now'}
          </button>
        </form>
      )}

      {/* MODE 3: MANAGE & DELETE TOURNAMENTS */}
      {activeTab === 'manage' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🗑️</span> Manage & Delete Tournaments ({tournaments.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Permanently remove tournament matches from the Arena and Firebase database in real-time.
            </p>
          </div>

          {deleteStatusMsg && (
            <div style={{ color: 'var(--success)', background: 'rgba(0,230,118,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--success)', fontSize: '0.85rem' }}>
              {deleteStatusMsg}
            </div>
          )}

          {tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
              No matches found in the catalog.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tournaments.map(t => (
                <div 
                  key={t.id} 
                  className="glass-panel flex-between"
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>
                        {t.title}
                      </h4>
                      <span className="badge" style={{ fontSize: '0.65rem' }}>
                        {t.mode} • {t.type}
                      </span>
                      {t.roomId && (
                        <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>
                          Room: {t.roomId}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>🗺️ {t.map}</span>
                      <span>💰 Prize: ₹{t.prizePool}</span>
                      <span>👥 Slots: {t.slotsJoined || 0}/{t.slotsTotal || t.maxSlots || 48}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMatch(t.id, t.title)}
                    disabled={deletingId === t.id}
                    className="btn btn-danger"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>🗑️</span> {deletingId === t.id ? 'Deleting...' : 'Delete Match'}
                  </button>
                </div>
              ))}
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

      {/* MODE 6: IN-APP UPDATE NOTICES (OPTION C) */}
      {activeTab === 'app_update' && (
        <form onSubmit={handlePublishAppUpdate} className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> In-App Update Publisher (Option C)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              When you build and upload a new APK (e.g. to Google Drive, MediaFire, or your Website), publish an update notice here. All players using older APK versions will automatically see a popup prompt to download the latest version!
            </p>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Latest App Version (e.g. 1.1.0)</label>
              <input 
                type="text"
                value={updateVersion}
                onChange={(e) => setUpdateVersion(e.target.value)}
                placeholder="1.1.0"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Update Headline</label>
              <input 
                type="text"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                placeholder="🔥 Major Update Available!"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>APK Download Link (Google Drive / Website / GitHub)</label>
            <input 
              type="url"
              value={updateDownloadUrl}
              onChange={(e) => setUpdateDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/xxxx/view or https://yourdomain.com/app.apk"
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>What's New / Release Notes</label>
            <textarea 
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="• New tournaments added&#10;• Faster room ID updates&#10;• Bug fixes"
              className="form-input"
              rows={4}
              style={{ resize: 'vertical', fontSize: '0.82rem' }}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox"
              id="forceUpdateCheck"
              checked={forceUpdate}
              onChange={(e) => setForceUpdate(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="forceUpdateCheck" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer', margin: 0 }}>
              <strong>Mandatory / Force Update:</strong> Block access until the player downloads the new APK.
            </label>
          </div>

          {updatePublishStatus && (
            <div style={{ color: 'var(--success)', background: 'rgba(0,230,118,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--success)', fontSize: '0.85rem' }}>
              {updatePublishStatus}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-secondary"
            style={{ width: '100%', height: '48px', fontWeight: '900', background: 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)', color: '#fff' }}
          >
            🚀 Publish Update Alert to All Players Now
          </button>
        </form>
      )}

    </div>
  );
}
