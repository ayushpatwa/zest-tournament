import React, { useState } from 'react';
import { getWebhookUrl, setWebhookUrl, sendToMakeWebhook } from '../services/webhookService';

// Help generate mock players
const MOCK_NICKNAMES = [
  "Raptor_FF", "ViperStrike", "AWM_King", "HeadshotGod",
  "Panda_OP", "NinjaGamer", "GarenaPro", "Zest_Destroyer",
  "BermudaKing", "ClashGod", "Dynamo_FF", "FreeFireHero",
  "Ruler_OP", "GamerBoy", "SniperQueen", "Torn_Max", "GarenaX"
];

export default function AdminHostPanel({ tournaments = [], onAddTournament, onBroadcastRoomCredentials, setCurrentView }) {
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'rooms' | 'webhook'
  
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

  // Webhook states
  const [webhookInput, setWebhookInput] = useState(getWebhookUrl());
  const [webhookStatus, setWebhookStatus] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Tournament Title is required.');
      return;
    }

    const prize = parseFloat(prizePool);
    const fee = parseFloat(entryFee);
    const slots = parseInt(slotsTotal);
    const minutes = parseInt(startingIn);

    if (isNaN(prize) || prize < 0 || isNaN(fee) || fee < 0 || isNaN(slots) || slots <= 2 || isNaN(minutes) || minutes <= 0) {
      setErrorMsg('Please enter valid numeric parameters.');
      return;
    }

    const numMockJoined = Math.floor(Math.random() * (slots / 2)) + 5;
    const joinedPlayers = [];
    
    for (let i = 0; i < numMockJoined; i++) {
      joinedPlayers.push({
        nickname: MOCK_NICKNAMES[i % MOCK_NICKNAMES.length] + `_${Math.floor(Math.random()*90 + 10)}`,
        uid: String(Math.floor(Math.random() * 900000000) + 100000000),
        isUser: false
      });
    }

    const leaderboard = [];
    if (type === 'Classic') {
      for (let i = 0; i < numMockJoined; i++) {
        const kills = Math.floor(Math.random() * 8);
        const placementPoints = Math.max(12 - i, 0);
        const killPoints = kills * 2;
        leaderboard.push({
          nickname: joinedPlayers[i].nickname,
          uid: joinedPlayers[i].uid,
          kills: kills,
          placementPoints: placementPoints,
          totalPoints: placementPoints + killPoints,
          isUser: false
        });
      }
      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    const startTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const newTournament = {
      id: `custom-${Date.now()}`,
      title: title,
      mode: mode,
      type: type,
      map: mapName,
      prizePool: prize,
      entryFee: fee,
      slotsTotal: slots,
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
            Manage tournaments, broadcast Room credentials, and sync Google Sheets.
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
            📊 Make.com Google Sheet
          </button>
        </div>
      </div>

      {activeTab === 'host' ? (
        /* HOST TOURNAMENT FORM */
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
                <option value="Solo">Solo (1 vs 47)</option>
                <option value="Duo">Duo (2 vs 2)</option>
                <option value="Squad">Squad (4 vs 4)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Game Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="form-input">
                <option value="Classic">Classic Battle Royale</option>
                <option value="Clash Squad">Clash Squad 4v4</option>
                <option value="Lone Wolf">Lone Wolf 1v1</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Map</label>
              <select value={mapName} onChange={(e) => setMapName(e.target.value)} className="form-input">
                <option value="Bermuda">Bermuda</option>
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
              <label>Prize Pool (₹)</label>
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
            <label>Total Slots (Players/Teams)</label>
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
      ) : activeTab === 'rooms' ? (
        /* ROOM ID & PASS BROADCASTER */
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
      ) : (
        /* MAKE.COM & GOOGLE SHEETS SETTINGS */
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
