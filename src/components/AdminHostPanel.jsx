import React, { useState } from 'react';
import { getWebhookUrl, setWebhookUrl, sendToMakeWebhook } from '../services/webhookService';

// Help generate mock players
const MOCK_NICKNAMES = [
  "Raptor_FF", "ViperStrike", "AWM_King", "HeadshotGod",
  "Panda_OP", "NinjaGamer", "GarenaPro", "Zest_Destroyer",
  "BermudaKing", "ClashGod", "Dynamo_FF", "FreeFireHero",
  "Ruler_OP", "GamerBoy", "SniperQueen", "Torn_Max", "GarenaX"
];

export default function AdminHostPanel({ onAddTournament, setCurrentView }) {
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'webhook'
  
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
      leaderboard: leaderboard
    };

    onAddTournament(newTournament);
    setCurrentView('dashboard');
  };

  const handleSaveWebhook = (e) => {
    e.preventDefault();
    setWebhookUrl(webhookInput);
    setWebhookStatus('Webhook URL saved successfully!');
    setTimeout(() => setWebhookStatus(''), 3500);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookStatus('');
    
    // Save current input before testing
    setWebhookUrl(webhookInput);

    const res = await sendToMakeWebhook({
      eventType: 'TEST_PING',
      nickname: 'TEST_ZEST_PLAYER',
      ffUid: '999999999',
      email: 'test.player@zest.gg',
      phone: '+91 9999999999',
      details: 'Test connection from Zest Tournament App'
    });

    setTestingWebhook(false);
    if (res.success) {
      setWebhookStatus('✅ Test payload dispatched! Check your Make.com Scenario / Google Sheet.');
    } else {
      setWebhookStatus(`⚠️ Dispatch completed. (Note: Make.com webhooks trigger even if CORS warning appears).`);
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
            Manage tournaments and external Google Sheet integrations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
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
          
          <div className="form-group">
            <label>Tournament Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Sunday Bermuda Rush"
              className="form-input"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Game Mode</label>
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value)} 
                className="form-input"
                style={{ background: '#07090e', color: '#fff' }}
              >
                <option value="Solo">Solo</option>
                <option value="Duo">Duo</option>
                <option value="Squad">Squad</option>
              </select>
            </div>

            <div className="form-group">
              <label>Match Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                className="form-input"
                style={{ background: '#07090e', color: '#fff' }}
              >
                <option value="Classic">Classic (Battle Royale)</option>
                <option value="Clash Squad">Clash Squad (4v4)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Map</label>
              <select 
                value={mapName} 
                onChange={(e) => setMapName(e.target.value)} 
                className="form-input"
                style={{ background: '#07090e', color: '#fff' }}
              >
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>

            <div className="form-group">
              <label>Starting In (Minutes)</label>
              <input 
                type="number" 
                value={startingIn} 
                onChange={(e) => setStartingIn(e.target.value)} 
                className="form-input"
                min="1"
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
            🚀 Publish Tournament Match
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

          {/* Webhook Configuration Form */}
          <form onSubmit={handleSaveWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Make.com Custom Webhook URL</label>
              <input
                type="url"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://hook.eu1.make.com/your-custom-webhook-id"
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>

            {webhookStatus && (
              <div style={{
                fontSize: '0.8rem',
                color: webhookStatus.includes('✅') ? 'var(--success)' : 'var(--accent)',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)'
              }}>
                {webhookStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                💾 Save Webhook URL
              </button>
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                {testingWebhook ? 'Testing...' : '⚡ Send Test Row'}
              </button>
            </div>
          </form>

          {/* Quick Setup Instructions */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '8px'
          }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '8px' }}>
              🛠️ 3-Step Setup Guide in Make.com:
            </h4>
            <ol style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.4' }}>
              <li>
                In <strong>Make.com</strong>, create a new Scenario with a <strong>Custom Webhook</strong> module (copy its Webhook URL and paste it above).
              </li>
              <li>
                Add a <strong>Google Sheets: Add a Row</strong> module and choose your target spreadsheet.
              </li>
              <li>
                Map the incoming JSON parameters to your sheet columns:
                <div style={{
                  background: '#07090e',
                  padding: '8px',
                  borderRadius: '6px',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--secondary)'
                }}>
                  • Timestamp: {`{{1.timestamp}}`}<br />
                  • Event Type: {`{{1.eventType}}`}<br />
                  • Player Nickname: {`{{1.nickname}}`}<br />
                  • Free Fire UID: {`{{1.ffUid}}`}<br />
                  • Email: {`{{1.email}}`}<br />
                  • Phone Number: {`{{1.phone}}`}<br />
                  • Details / Amount: {`{{1.details}}`}
                </div>
              </li>
            </ol>
          </div>

        </div>
      )}

    </div>
  );
}
