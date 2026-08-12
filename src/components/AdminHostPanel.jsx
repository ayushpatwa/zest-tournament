import React, { useState } from 'react';

// Help generate mock players
const MOCK_NICKNAMES = [
  "Raptor_FF", "ViperStrike", "AWM_King", "HeadshotGod",
  "Panda_OP", "NinjaGamer", "GarenaPro", "Zest_Destroyer",
  "BermudaKing", "ClashGod", "Dynamo_FF", "FreeFireHero",
  "Ruler_OP", "GamerBoy", "SniperQueen", "Torn_Max", "GarenaX"
];

export default function AdminHostPanel({ onAddTournament, setCurrentView }) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('Solo');
  const [type, setType] = useState('Classic');
  const [mapName, setMapName] = useState('Bermuda');
  const [prizePool, setPrizePool] = useState('2000');
  const [entryFee, setEntryFee] = useState('20');
  const [slotsTotal, setSlotsTotal] = useState('48');
  const [startingIn, setStartingIn] = useState('30');
  const [errorMsg, setErrorMsg] = useState('');

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

    // Generate some mock players already joined
    const numMockJoined = Math.floor(Math.random() * (slots / 2)) + 5; // filled halfway or at least 5
    const joinedPlayers = [];
    
    for (let i = 0; i < numMockJoined; i++) {
      joinedPlayers.push({
        nickname: MOCK_NICKNAMES[i % MOCK_NICKNAMES.length] + `_${Math.floor(Math.random()*90 + 10)}`,
        uid: String(Math.floor(Math.random() * 900000000) + 100000000),
        isUser: false
      });
    }

    // Generate mock leaderboard for Battle Royale (Classic)
    const leaderboard = [];
    if (type === 'Classic') {
      for (let i = 0; i < numMockJoined; i++) {
        const kills = Math.floor(Math.random() * 8);
        const placementPoints = Math.max(12 - i, 0); // rank 1 gets 12, rank 2 gets 11, etc.
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
      // Sort leaderboard by points descending
      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    // Create start date
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

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '32px' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⚙️</span> HOST TOURNAMENT
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Configure a custom Free Fire tournament match to display on the live arena dashboard.
      </p>

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
    </div>
  );
}
