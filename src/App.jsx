import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TournamentLobby from './components/TournamentLobby';
import WalletPage from './components/WalletPage';
import ProfilePage from './components/ProfilePage';
import AdminHostPanel from './components/AdminHostPanel';
import LoginPage from './components/LoginPage';
import MyMatchesPage from './components/MyMatchesPage';
import RulesPage from './components/RulesPage';
import AppUpdateModal from './components/AppUpdateModal';
import { isNewVersionAvailable, CURRENT_APP_VERSION } from './services/appUpdateService';
import { sendToMakeWebhook, updateLiveWebhookUrl } from './services/webhookService';
import { 
  subscribeToTournamentsRealtime, 
  subscribeToAppSettingsRealtime,
  subscribeToUserProfileRealtime,
  subscribeToNotificationsRealtime,
  saveAppSettingsRealtime,
  saveTournamentRealtime, 
  deleteTournamentRealtime,
  joinTournamentRealtime, 
  removePlayerFromTournamentRealtime,
  updateRoomCredentialsRealtime,
  saveUserProfileRealtime,
  deductUserWalletRealtime
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
    return currentUser?.wallet || 0;
  });

  const [transactions, setTransactions] = useState([]);

  // Real-time Firestore Tournaments State
  const [tournaments, setTournaments] = useState([]);

  // Real-time Broadcast Notifications State (Bell 🔔)
  const [cloudNotifications, setCloudNotifications] = useState([]);

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    if (currentUser) return currentUser;
    return {
      nickname: 'Gamer_Newbie',
      uid: '782910384',
      email: '',
      phone: '',
      role: 'player',
      wallet: 0,
      stats: {
        matches: 0,
        wins: 0,
        kills: 0,
        earnings: 0
      }
    };
  });

  // App update states
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // 1. Subscribe to Real-Time Firebase Firestore Tournaments, Notifications & App Settings
  useEffect(() => {
    console.log('[Firebase Realtime] Subscribing to live tournaments, notifications and app config...');
    
    // Subscribe to tournaments
    const unsubscribeTourneys = subscribeToTournamentsRealtime((liveTournaments) => {
      setTournaments(liveTournaments || []);
    });

    // Subscribe to broadcast notifications (Bell 🔔)
    const unsubscribeNotifs = subscribeToNotificationsRealtime((notifs) => {
      setCloudNotifications(notifs);
    });

    // Subscribe to dynamic cloud app settings (Webhook, App Version Updates)
    const unsubscribeSettings = subscribeToAppSettingsRealtime((settings) => {
      if (settings) {
        if (settings.webhookUrl) {
          updateLiveWebhookUrl(settings.webhookUrl);
        }
        if (settings.appUpdate && isNewVersionAvailable(CURRENT_APP_VERSION, settings.appUpdate.latestVersion)) {
          console.log('[App Update] New version detected:', settings.appUpdate.latestVersion);
          setUpdateInfo(settings.appUpdate);
          setShowUpdateModal(true);
        }
      }
    });

    return () => {
      unsubscribeTourneys();
      unsubscribeNotifs();
      unsubscribeSettings();
    };
  }, []);

  // 2. Real-time Live Wallet & User Profile sync with Firestore Cloud & Auto-Logout on Deletion
  useEffect(() => {
    if (!currentUser?.uid && !currentUser?.id) return;
    const userIdentifier = String(currentUser.uid || currentUser.id).trim();
    console.log(`[Firebase Realtime] Listening to live wallet balance for ${userIdentifier}`);
    
    const unsubscribeUser = subscribeToUserProfileRealtime(userIdentifier, (liveUserData) => {
      // If user account is null (deleted) or marked isDeleted: true
      if (!liveUserData || liveUserData.isDeleted) {
        const isMasterAdmin = currentUser.role === 'admin' && (
          currentUser.uid === '9084311275' || 
          currentUser.email === 'admin@zest.gg' || 
          String(currentUser.phone) === '9084311275'
        );

        if (!isMasterAdmin) {
          console.warn(`[App] Current player account was deleted from database. Auto-logging out...`);
          localStorage.removeItem('zest_current_user');
          localStorage.removeItem('zest_wallet_transactions');
          setCurrentUser(null);
          alert('⚠️ Your account has been removed by the Admin. You have been logged out.');
        }
        return;
      }

      if (typeof liveUserData.wallet === 'number') {
        setWalletBalance(liveUserData.wallet);
      }
      if (Array.isArray(liveUserData.transactions) && liveUserData.transactions.length > 0) {
        // Sort newest transactions first
        const sorted = [...liveUserData.transactions].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        setTransactions(sorted);
      }
      setUserProfile(prev => ({
        ...prev,
        ...liveUserData,
        wallet: typeof liveUserData.wallet === 'number' ? liveUserData.wallet : prev.wallet
      }));

      // Real-time instant role synchronization across all tabs & connected devices
      setCurrentUser(prev => {
        if (!prev) return prev;
        const updatedRole = liveUserData.role !== undefined ? liveUserData.role : prev.role;
        const updatedIsHost = liveUserData.isHost !== undefined ? liveUserData.isHost : prev.isHost;
        
        // If host permissions were revoked and player is currently on host panel, exit immediately
        if (prev.role !== 'admin' && updatedRole !== 'host' && !updatedIsHost) {
          setCurrentView(v => v === 'admin' ? 'dashboard' : v);
        }

        return {
          ...prev,
          ...liveUserData,
          role: updatedRole,
          isHost: updatedIsHost,
          wallet: typeof liveUserData.wallet === 'number' ? liveUserData.wallet : prev.wallet
        };
      });
    });

    return () => unsubscribeUser();
  }, [currentUser?.uid, currentUser?.id]);

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
    const initialWallet = typeof user.wallet === 'number' ? user.wallet : 10;
    setWalletBalance(initialWallet);
    if (user.transactions && user.transactions.length > 0) {
      setTransactions(user.transactions);
      localStorage.setItem('zest_wallet_transactions', JSON.stringify(user.transactions));
    }
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
    const numFee = parseFloat(fee) || 0;

    // Strict validation: Check if match is already completely full
    const targetTourney = tournaments.find(t => t.id === tournamentId);
    const maxSlots = targetTourney?.slotsTotal || targetTourney?.maxSlots || 48;
    const currentJoined = Math.max(targetTourney?.slotsJoined || 0, (targetTourney?.joinedPlayers || []).length);
    
    if (currentJoined >= maxSlots) {
      alert('⚠️ This match is already completely full (Housefull)! Registration is closed.');
      return { success: false, error: 'Match is full' };
    }

    // 1. Deduct Entry Fee locally and in Firestore Cloud
    setWalletBalance(prev => Math.max(0, prev - numFee));
    const targetUserId = userProfile.uid || userProfile.id || uid;
    if (targetUserId && numFee > 0) {
      await deductUserWalletRealtime(targetUserId, numFee, `Entry Fee: Match ${tournamentId}`);
    }
    
    // 2. Add to transaction log
    const txId = Date.now();
    const newTx = {
      id: txId,
      type: 'registration',
      amount: numFee,
      title: `Registration - Entry Fee`,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Success'
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Update User Profile
    setUserProfile(prev => ({
      ...prev,
      uid: String(uid).trim(),
      nickname: String(nickname).trim(),
      stats: {
        ...prev.stats,
        matches: (prev.stats?.matches || 0) + 1
      }
    }));

    // Specific participant record strictly tied to this player's UID
    const userParticipant = { 
      nickname: String(nickname).trim(), 
      uid: String(uid).trim(), 
      email: userProfile.email || 'N/A',
      phone: userProfile.phone || 'N/A',
      joinedAt: new Date().toISOString()
    };

    // 4. Update Firestore in Real-Time
    const joinRes = await joinTournamentRealtime(tournamentId, userParticipant);
    if (!joinRes.success) {
      alert(`⚠️ ${joinRes.error || 'Failed to join tournament'}`);
      return joinRes;
    }

    // 5. Dispatch Webhook Event to Make.com -> Google Sheets
    sendToMakeWebhook({
      eventType: 'TOURNAMENT_JOIN',
      nickname: nickname,
      ffUid: uid,
      email: userProfile.email || 'N/A',
      phone: userProfile.phone || 'N/A',
      details: `${targetTourney?.title || 'Tournament'} (Map: ${targetTourney?.map || 'Bermuda'}, Fee: ₹${numFee})`
    });

    return { success: true };
  };

  // Remove / Kick player from tournament in real-time
  const handleRemovePlayerFromTournament = async (tournamentId, playerIdentifier) => {
    // 0ms instant local optimistic update
    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        const query = String(playerIdentifier).trim().toLowerCase();
        const updatedPlayers = (t.joinedPlayers || []).filter(p => {
          const pUid = String(p.uid || '').trim().toLowerCase();
          const pEmail = String(p.email || '').trim().toLowerCase();
          const pNick = String(p.nickname || '').trim().toLowerCase();
          return pUid !== query && pEmail !== query && pNick !== query;
        });
        return {
          ...t,
          joinedPlayers: updatedPlayers,
          slotsJoined: Math.max(0, updatedPlayers.length)
        };
      }
      return t;
    }));

    // Real-time Firestore sync
    await removePlayerFromTournamentRealtime(tournamentId, playerIdentifier);
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

  // Update/Edit tournament via Admin/Host Panel -> Direct to Firebase
  const handleUpdateTournament = async (updatedTourney) => {
    setTournaments(prev => prev.map(t => t.id === updatedTourney.id ? { ...t, ...updatedTourney } : t));
    await saveTournamentRealtime(updatedTourney);
  };

  // Delete tournament via Admin Panel -> Direct to Firebase
  const handleDeleteTournament = async (tournamentId) => {
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
    await deleteTournamentRealtime(tournamentId);
  };

  // Broadcast Room ID in real-time
  const handleBroadcastRoomCredentials = async (tournamentId, roomId, roomPass) => {
    // 0ms instant local optimistic update
    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        return { ...t, roomId, roomPassword: roomPass, status: 'live' };
      }
      return t;
    }));
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
        userProfile={userProfile}
        cloudNotifications={cloudNotifications}
        tournaments={tournaments}
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
            onRemovePlayerFromTournament={handleRemovePlayerFromTournament}
            setCurrentView={setCurrentView}
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

        {currentView === 'rules' && (
          <RulesPage setCurrentView={setCurrentView} />
        )}

        {currentView === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'host' || currentUser?.isHost) && (
          <AdminHostPanel 
            tournaments={tournaments}
            onAddTournament={handleAddTournament}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            onRemovePlayerFromTournament={handleRemovePlayerFromTournament}
            onBroadcastRoomCredentials={handleBroadcastRoomCredentials}
            setCurrentView={setCurrentView}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Real-time In-App Update Notice Modal (Option C) */}
      {showUpdateModal && updateInfo && (
        <AppUpdateModal 
          updateInfo={updateInfo} 
          onDismiss={() => setShowUpdateModal(false)} 
        />
      )}
    </div>
  );
}
