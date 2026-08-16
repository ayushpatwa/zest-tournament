import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TournamentLobby from './components/TournamentLobby';
import WalletPage from './components/WalletPage';
import ProfilePage from './components/ProfilePage';
import AdminHostPanel from './components/AdminHostPanel';
import LoginPage from './components/LoginPage';
import MyMatchesPage from './components/MyMatchesPage';
import { sendToMakeWebhook, updateLiveWebhookUrl } from './services/webhookService';
import { updateLiveRazorpayConfig } from './services/razorpayService';
import { 
  subscribeToTournamentsRealtime, 
  subscribeToAppSettingsRealtime,
  saveAppSettingsRealtime,
  saveTournamentRealtime, 
  deleteTournamentRealtime,
  joinTournamentRealtime, 
  updateRoomCredentialsRealtime,
  saveUserProfileRealtime,
  SEED_TOURNAMENTS 
} from './services/firebase';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('zest_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(() => {
    return currentUser?.wallet || 250;
  });

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'deposit',
      amount: 250,
      title: 'Welcome Signup Bonus',
      date: 'Aug 14, 10:00 AM',
      status: 'Success'
    }
  ]);

  // Real-time Firestore Tournaments State
  const [tournaments, setTournaments] = useState(SEED_TOURNAMENTS);

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    if (currentUser) return currentUser;
    return {
      nickname: 'Gamer_Newbie',
      uid: '782910384',
      email: '',
      phone: '',
      role: 'player',
      stats: {
        matches: 0,
        wins: 0,
        kills: 0,
        earnings: 0
      }
    };
  });

  // 1. Subscribe to Real-Time Firebase Firestore Tournaments & App Settings
  useEffect(() => {
    console.log('[Firebase Realtime] Subscribing to live tournaments and app config...');
    
    // Subscribe to tournaments
    const unsubscribeTourneys = subscribeToTournamentsRealtime((liveTournaments) => {
      if (liveTournaments && liveTournaments.length > 0) {
        setTournaments(liveTournaments);
      }
    });

    // Subscribe to dynamic cloud app settings (Razorpay Key ID & Webhook)
    const unsubscribeSettings = subscribeToAppSettingsRealtime((settings) => {
      if (settings) {
        if (settings.razorpayKeyId) {
          updateLiveRazorpayConfig({
            keyId: settings.razorpayKeyId,
            merchantName: settings.razorpayMerchantName || 'Zest Tournament Esports'
          });
        }
        if (settings.webhookUrl) {
          updateLiveWebhookUrl(settings.webhookUrl);
        }
      }
    });

    return () => {
      unsubscribeTourneys();
      unsubscribeSettings();
    };
  }, []);

  // Sync user profile & wallet to local storage
  useEffect(() => {
    if (currentUser) {
      const updated = {
        ...currentUser,
        ...userProfile,
        wallet: walletBalance
      };
      localStorage.setItem('zest_current_user', JSON.stringify(updated));
    }
  }, [userProfile, walletBalance, currentUser]);

  // Login handler
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setUserProfile(user);
    setWalletBalance(user.wallet || 250);
    localStorage.setItem('zest_current_user', JSON.stringify(user));
    saveUserProfileRealtime(user);
    setCurrentView('dashboard');
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('zest_current_user');
    setCurrentUser(null);
  };

  // Handle tournament join registration (Firebase Realtime + Webhook)
  const handleRegisterUser = async (tournamentId, uid, nickname, fee) => {
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

    // 3. Update User Profile
    setUserProfile(prev => ({
      ...prev,
      uid: uid,
      nickname: nickname,
      stats: {
        ...prev.stats,
        matches: (prev.stats?.matches || 0) + 1
      }
    }));

    const userParticipant = { 
      nickname: nickname, 
      uid: uid, 
      email: userProfile.email || 'N/A',
      phone: userProfile.phone || 'N/A',
      isUser: true,
      joinedAt: new Date().toISOString()
    };

    // 4. Update Firestore in Real-Time
    await joinTournamentRealtime(tournamentId, userParticipant);

    // 5. Dispatch Webhook Event to Make.com -> Google Sheets
    const tourney = tournaments.find(t => t.id === tournamentId);
    sendToMakeWebhook({
      eventType: 'TOURNAMENT_JOIN',
      nickname: nickname,
      ffUid: uid,
      email: userProfile.email || 'N/A',
      phone: userProfile.phone || 'N/A',
      details: `${tourney?.title || 'Tournament'} (Map: ${tourney?.map || 'Bermuda'}, Fee: ₹${fee})`
    });
  };

  // Wrapper for Wallet deposit to trigger webhook
  const handleWalletDeposit = (amount) => {
    setWalletBalance(prev => prev + amount);
    sendToMakeWebhook({
      eventType: 'WALLET_DEPOSIT',
      nickname: userProfile.nickname,
      ffUid: userProfile.uid,
      email: userProfile.email || 'N/A',
      phone: userProfile.phone || 'N/A',
      details: `Added ₹${amount} to Wallet via UPI`
    });
  };

  // Add custom tournament via Admin/Host Panel -> Direct to Firebase
  const handleAddTournament = async (newTourney) => {
    // Instant local optimistic update
    setTournaments(prev => [newTourney, ...prev]);
    // Real-time Firestore sync
    await saveTournamentRealtime(newTourney);
  };

  // Delete tournament via Admin Panel -> Direct to Firebase
  const handleDeleteTournament = async (tournamentId) => {
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
    await deleteTournamentRealtime(tournamentId);
  };

  // Broadcast Room ID in real-time
  const handleBroadcastRoomCredentials = async (tournamentId, roomId, roomPass) => {
    await updateRoomCredentialsRealtime(tournamentId, roomId, roomPass);
  };

  // Render Login page if not authenticated
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="app-container">
      {/* Header and navigation bar component */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        walletBalance={walletBalance} 
        currentUser={currentUser}
      />

      {/* Main viewport */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard 
            tournaments={tournaments} 
            userProfile={userProfile}
            onSelectTournament={(id) => {
              setSelectedTournamentId(id);
              setCurrentView('lobby');
            }} 
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'my_matches' && (
          <MyMatchesPage 
            tournaments={tournaments} 
            userProfile={userProfile}
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
            walletBalance={typeof walletBalance === 'number' ? walletBalance : parseFloat(walletBalance) || 0}
            setWalletBalance={setWalletBalance}
            transactions={transactions}
            setTransactions={setTransactions}
            userProfile={userProfile}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage 
            userProfile={userProfile} 
            setUserProfile={setUserProfile}
            onLogout={handleLogout}
            currentUser={currentUser}
          />
        )}

        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminHostPanel 
            tournaments={tournaments}
            onAddTournament={handleAddTournament}
            onDeleteTournament={handleDeleteTournament}
            onBroadcastRoomCredentials={handleBroadcastRoomCredentials}
            setCurrentView={setCurrentView}
          />
        )}
      </main>
    </div>
  );
}
