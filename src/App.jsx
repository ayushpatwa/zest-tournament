import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TournamentLobby from './components/TournamentLobby';
import WalletPage from './components/WalletPage';
import ProfilePage from './components/ProfilePage';
import AdminHostPanel from './components/AdminHostPanel';
import './App.css';

// Initial Mock Tournaments Data
const INITIAL_TOURNAMENTS = [
  {
    id: 't-1',
    title: 'Free Fire Bermuda Solo Cup',
    mode: 'Solo',
    type: 'Classic',
    map: 'Bermuda',
    prizePool: 5000,
    entryFee: 20,
    slotsTotal: 48,
    slotsJoined: 28,
    joinedPlayers: [
      { nickname: 'ViperStrike', uid: '782910384', isUser: false },
      { nickname: 'HeadshotGod', uid: '910384729', isUser: false },
      { nickname: 'Panda_OP', uid: '284019284', isUser: false },
      { nickname: 'AWM_King', uid: '573928103', isUser: false }
    ],
    startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins from now
    status: 'upcoming',
    leaderboard: [
      { nickname: 'ViperStrike', uid: '782910384', kills: 6, placementPoints: 12, totalPoints: 24, isUser: false },
      { nickname: 'HeadshotGod', uid: '910384729', kills: 4, placementPoints: 10, totalPoints: 18, isUser: false },
      { nickname: 'Panda_OP', uid: '284019284', kills: 2, placementPoints: 8, totalPoints: 12, isUser: false },
      { nickname: 'AWM_King', uid: '573928103', kills: 0, placementPoints: 6, totalPoints: 6, isUser: false }
    ]
  },
  {
    id: 't-2',
    title: 'Clash Squad 4v4 Kalahari',
    mode: 'Squad',
    type: 'Clash Squad',
    map: 'Kalahari',
    prizePool: 3500,
    entryFee: 30,
    slotsTotal: 16, // 16 teams / slots
    slotsJoined: 11,
    joinedPlayers: [
      { nickname: 'Squad Alpha', uid: '1002030', isUser: false },
      { nickname: 'Squad Beta', uid: '4839201', isUser: false },
      { nickname: 'Squad Gamma', uid: '9203819', isUser: false },
      { nickname: 'Squad Delta', uid: '2039182', isUser: false }
    ],
    startTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 mins from now
    status: 'upcoming'
  },
  {
    id: 't-3',
    title: 'Free Fire Purgatory Squad Arena',
    mode: 'Squad',
    type: 'Classic',
    map: 'Purgatory',
    prizePool: 12000,
    entryFee: 100,
    slotsTotal: 48,
    slotsJoined: 42,
    joinedPlayers: [
      { nickname: 'Ind_Army', uid: '3029103', isUser: false },
      { nickname: 'Garena_Boss', uid: '9403910', isUser: false }
    ],
    startTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours from now
    status: 'upcoming',
    leaderboard: [
      { nickname: 'Ind_Army', uid: '3029103', kills: 8, placementPoints: 12, totalPoints: 28, isUser: false },
      { nickname: 'Garena_Boss', uid: '9403910', kills: 3, placementPoints: 10, totalPoints: 16, isUser: false }
    ]
  }
];

// Helper to pick random names for spot booking simulation
const RANDOM_NAMES = [
  'Skyler_Pro', 'Chrono_OP', 'Kelly_Dash', 'Alok_Gamer', 
  'Hayato_Awake', 'Wukong_King', 'Maxim_Eat', 'Moco_Hack',
  'Luqueta_Goal', 'Wolfrahh_Head', 'Dasha_Disco', 'K_Captain'
];

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(250);
  const [transactions, setTransactions] = useState([
    { id: 101, type: 'deposit', amount: 150, title: 'Welcome Bonus Added', date: 'Aug 12 01:00 AM', status: 'Success' },
    { id: 102, type: 'deposit', amount: 100, title: 'Signup Bonus Credited', date: 'Aug 12 01:05 AM', status: 'Success' }
  ]);

  // Profile state
  const [userProfile, setUserProfile] = useState({
    nickname: 'ZEST_FF_PLAYER',
    uid: '482910384',
    stats: {
      matches: 0,
      wins: 0,
      kills: 0,
      earnings: 0
    }
  });

  // Tournaments state
  const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);

  // Real-time Simulation: Auto-fill spots in the lobby
  useEffect(() => {
    const interval = setInterval(() => {
      setTournaments(prevTournaments => {
        // Pick an upcoming tournament that still has slots left
        const openTournaments = prevTournaments.filter(t => t.status === 'upcoming' && t.slotsJoined < t.slotsTotal);
        if (openTournaments.length === 0) return prevTournaments;

        const targetTournament = openTournaments[Math.floor(Math.random() * openTournaments.length)];
        
        return prevTournaments.map(t => {
          if (t.id === targetTournament.id) {
            const randomNick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] + `_${Math.floor(Math.random()*900 + 100)}`;
            const randomUid = String(Math.floor(Math.random() * 900000000) + 100000000);
            
            // Add player
            const newPlayer = { nickname: randomNick, uid: randomUid, isUser: false };
            const updatedJoined = [...t.joinedPlayers, newPlayer];
            
            // If it's a Classic tournament, we can also add them to the leaderboard array
            let updatedLeaderboard = t.leaderboard ? [...t.leaderboard] : [];
            if (t.type === 'Classic') {
              const kills = Math.floor(Math.random() * 6);
              const placementPoints = Math.max(12 - updatedLeaderboard.length, 0);
              updatedLeaderboard.push({
                nickname: randomNick,
                uid: randomUid,
                kills: kills,
                placementPoints: placementPoints,
                totalPoints: placementPoints + (kills * 2),
                isUser: false
              });
              updatedLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
            }

            return {
              ...t,
              slotsJoined: t.slotsJoined + 1,
              joinedPlayers: updatedJoined,
              leaderboard: updatedLeaderboard
            };
          }
          return t;
        });
      });
    }, 12000); // add a player every 12 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle tournament join registration
  const handleRegisterUser = (tournamentId, uid, nickname, fee) => {
    // 1. Deduct Entry Fee
    setWalletBalance(prev => prev - fee);
    
    // 2. Add to transaction log
    const txId = Date.now();
    const newTx = {
      id: txId,
      type: 'registration',
      amount: fee,
      title: `Registration - Entry Fee`,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Success'
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Update User Profile UID/Nickname if different, and increment stats
    setUserProfile(prev => ({
      ...prev,
      uid: uid,
      nickname: nickname,
      stats: {
        ...prev.stats,
        matches: prev.stats.matches + 1
      }
    }));

    // 4. Update tournament data (add user to slot list & leaderboard)
    setTournaments(prevTournaments => {
      return prevTournaments.map(t => {
        if (t.id === tournamentId) {
          const userParticipant = { nickname, uid, isUser: true };
          const updatedJoined = [...t.joinedPlayers, userParticipant];
          
          let updatedLeaderboard = t.leaderboard ? [...t.leaderboard] : [];
          if (t.type === 'Classic') {
            // Generate some random points for the user
            const kills = Math.floor(Math.random() * 5) + 2; // user gets 2-7 kills for demo
            const placementPoints = 10; // place top 10
            const totalPoints = placementPoints + (kills * 2);
            updatedLeaderboard.push({
              nickname: nickname,
              uid: uid,
              kills: kills,
              placementPoints: placementPoints,
              totalPoints: totalPoints,
              isUser: true
            });
            updatedLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
          }

          return {
            ...t,
            slotsJoined: t.slotsJoined + 1,
            joinedPlayers: updatedJoined,
            leaderboard: updatedLeaderboard
          };
        }
        return t;
      });
    });
  };

  // Add custom tournament via Admin/Host Panel
  const handleAddTournament = (newTourney) => {
    setTournaments(prev => [newTourney, ...prev]);
  };

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="app-container">
      {/* Header and navigation bar component */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        walletBalance={walletBalance} 
      />

      {/* Main viewport */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard 
            tournaments={tournaments} 
            onSelectTournament={(id) => {
              setSelectedTournamentId(id);
              setCurrentView('lobby');
            }} 
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'lobby' && selectedTournament && (
          <TournamentLobby 
            tournament={selectedTournament} 
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            walletBalance={walletBalance}
            setWalletBalance={setWalletBalance}
            onBack={() => setCurrentView('dashboard')}
            onRegisterUser={handleRegisterUser}
          />
        )}

        {currentView === 'wallet' && (
          <WalletPage 
            walletBalance={walletBalance}
            setWalletBalance={setWalletBalance}
            transactions={transactions}
            setTransactions={setTransactions}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage 
            userProfile={userProfile} 
            setUserProfile={setUserProfile}
          />
        )}

        {currentView === 'admin' && (
          <AdminHostPanel 
            onAddTournament={handleAddTournament}
            setCurrentView={setCurrentView}
          />
        )}
      </main>
    </div>
  );
}
