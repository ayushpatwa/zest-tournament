import React, { useState, useEffect } from 'react';
import { getWebhookUrl, setWebhookUrl, sendToMakeWebhook } from '../services/webhookService';
import { 
  saveAppSettingsRealtime, 
  creditUserWalletRealtime, 
  deductUserWalletRealtime, 
  subscribeToAllUsersRealtime,
  resetUserPasswordRealtime,
  deleteUserRealtime,
  toggleUserHostRoleRealtime,
  sendNotificationRealtime,
  deleteNotificationRealtime,
  subscribeToNotificationsRealtime,
  seedDemoPlayersRealtime,
  addDemoPlayersToTournamentRealtime,
  addDemoPlayersToAllMatchesRealtime
} from '../services/firebase';

import { 
  getTodayDateString, 
  getTomorrowDateString, 
  formatMatchDate 
} from '../services/dateUtils';

import paymentQrImg from '../assets/payment_qr.jpg';

export default function AdminHostPanel({ tournaments = [], onAddTournament, onUpdateTournament, onDeleteTournament, onRemovePlayerFromTournament, onBroadcastRoomCredentials, depositQrConfig, setCurrentView, currentUser }) {
  const isSuperAdmin = currentUser?.role === 'admin';
  const isHost = currentUser?.role === 'host' || currentUser?.isHost || isSuperAdmin;
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'rooms' | 'payout' | 'deposit_qr' | 'broadcast' | 'manage' | 'webhook' | 'app_update'
  
  // Host Form states
  const [editingTournament, setEditingTournament] = useState(null);
  const [managingPlayersTourney, setManagingPlayersTourney] = useState(null);
  const [removingPlayerId, setRemovingPlayerId] = useState(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('Solo');
  const [type, setType] = useState('Classic');
  const [mapName, setMapName] = useState('Bermuda');
  const [prizePool, setPrizePool] = useState('2000');
  const [perKillPrize, setPerKillPrize] = useState('25');
  const [entryFee, setEntryFee] = useState('20');
  const [slotsTotal, setSlotsTotal] = useState('48');
  const [matchDate, setMatchDate] = useState(getTodayDateString());
  const [matchTiming, setMatchTiming] = useState('03:00 PM - 04:00 PM');
  const [editRoomId, setEditRoomId] = useState('');
  const [editRoomPassword, setEditRoomPassword] = useState('');
  const [editStatus, setEditStatus] = useState('upcoming');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteStatusMsg, setDeleteStatusMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Broadcast Notification (Bell 🔔) states
  const [notifTitle, setNotifTitle] = useState('🔥 Match Starting in 15 Minutes!');
  const [notifMessage, setNotifMessage] = useState('Join the room immediately. Room ID and Password are now dropped in the Arena!');
  const [notifType, setNotifType] = useState('alert'); // 'alert' | 'match' | 'prize' | 'info'
  const [notifStatus, setNotifStatus] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [broadcastList, setBroadcastList] = useState([]);

  // Prize & Wallet Manager states
  const [walletAction, setWalletAction] = useState('credit'); // 'credit' | 'deduct'
  const [payoutPlayerIdentifier, setPayoutPlayerIdentifier] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('500');
  const [payoutReason, setPayoutReason] = useState('1st Place Tournament Winner 🏆');
  const [payoutStatus, setPayoutStatus] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [cloudUsers, setCloudUsers] = useState([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Room ID Broadcast states
  const [selectedTourneyId, setSelectedTourneyId] = useState(tournaments[0]?.id || '');
  const [inputRoomId, setInputRoomId] = useState('');
  const [inputRoomPass, setInputRoomPass] = useState('');
  const [roomBroadcastStatus, setRoomBroadcastStatus] = useState('');

  // Proofs & Result verification states
  const [matchProofs, setMatchProofs] = useState([]);
  const [selectedProofModal, setSelectedProofModal] = useState(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Webhook states
  const [webhookInput, setWebhookInput] = useState(getWebhookUrl());
  const [webhookStatus, setWebhookStatus] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);

  // App Update Publisher states
  const [updateVersion, setUpdateVersion] = useState('1.4.5');
  const [updateTitle, setUpdateTitle] = useState('🔥 5 Coins Signup Bonus & Match Upgrades (v1.4.5)!');
  const [updateNotes, setUpdateNotes] = useState('• 5 Coins Welcome Bonus on Signup\n• Clash Squad 1v1 & Custom Bounty\n• Match Date scheduling & calendar\n• Live Deposit QR & UPI Management');
  const [updateDownloadUrl, setUpdateDownloadUrl] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updatePublishStatus, setUpdatePublishStatus] = useState('');

  // Deposit QR & UPI Management states
  const [qrImageUrl, setQrImageUrl] = useState(depositQrConfig?.qrImageUrl || '');
  const [qrReceiverName, setQrReceiverName] = useState(depositQrConfig?.receiverName || 'Divyansh Maheshwari');
  const [qrUpiId, setQrUpiId] = useState(depositQrConfig?.upiId || 'divyansh-308@ptyes');
  const [qrSaveStatus, setQrSaveStatus] = useState('');
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [qrUploadPreview, setQrUploadPreview] = useState(depositQrConfig?.qrImageUrl || '');

  useEffect(() => {
    if (depositQrConfig) {
      if (depositQrConfig.qrImageUrl) {
        setQrImageUrl(depositQrConfig.qrImageUrl);
        setQrUploadPreview(depositQrConfig.qrImageUrl);
      }
      if (depositQrConfig.receiverName) setQrReceiverName(depositQrConfig.receiverName);
      if (depositQrConfig.upiId) setQrUpiId(depositQrConfig.upiId);
    }
  }, [depositQrConfig]);

  const handleQrFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setQrUploadPreview(compressedDataUrl);
        setQrImageUrl(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDepositQr = async (e) => {
    e.preventDefault();
    if (!qrReceiverName.trim() || !qrUpiId.trim() || !qrUpiId.includes('@')) {
      setQrSaveStatus('⚠️ Please enter a valid Receiver Name and UPI ID (e.g. name@bank).');
      return;
    }

    setIsSavingQr(true);
    setQrSaveStatus('');

    const res = await saveAppSettingsRealtime({
      depositQr: {
        qrImageUrl: qrImageUrl.trim() || '',
        receiverName: qrReceiverName.trim(),
        upiId: qrUpiId.trim(),
        updatedAt: new Date().toISOString()
      }
    });

    setIsSavingQr(false);
    if (res.success) {
      setQrSaveStatus('✅ Live Deposit QR & UPI ID updated successfully across all players in real-time!');
      setTimeout(() => setQrSaveStatus(''), 5000);
    } else {
      setQrSaveStatus(`⚠️ Error saving: ${res.error || 'Failed'}`);
    }
  };

  const handleResetToDefaultQr = async () => {
    if (window.confirm('Reset Deposit QR & UPI to default (Divyansh Maheshwari / divyansh-308@ptyes)?')) {
      setIsSavingQr(true);
      setQrSaveStatus('');
      const res = await saveAppSettingsRealtime({
        depositQr: {
          qrImageUrl: '',
          receiverName: 'Divyansh Maheshwari',
          upiId: 'divyansh-308@ptyes',
          updatedAt: new Date().toISOString()
        }
      });
      setIsSavingQr(false);
      if (res.success) {
        setQrImageUrl('');
        setQrUploadPreview('');
        setQrReceiverName('Divyansh Maheshwari');
        setQrUpiId('divyansh-308@ptyes');
        setQrSaveStatus('✅ Reset to default payment QR & UPI ID!');
        setTimeout(() => setQrSaveStatus(''), 4000);
      }
    }
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('zest_match_proofs') || '[]');
    setMatchProofs(saved);
  }, [activeTab]);

  useEffect(() => {
    const unsubscribeUsers = subscribeToAllUsersRealtime((usersList) => {
      setCloudUsers(usersList);
    });
    const unsubscribeNotifs = subscribeToNotificationsRealtime((notifs) => {
      setBroadcastList(notifs);
    });
    return () => {
      unsubscribeUsers();
      unsubscribeNotifs();
    };
  }, []);

  const handleBroadcastNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      setNotifStatus('⚠️ Please enter both a notification title and message.');
      return;
    }
    setNotifLoading(true);
    const res = await sendNotificationRealtime({
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType
    });
    if (res.success) {
      setNotifStatus('✅ Notification broadcasted! All players will now see the red badge on their bell 🔔 in real-time.');
      setNotifTitle('');
      setNotifMessage('');
    } else {
      setNotifStatus(`⚠️ Failed: ${res.error}`);
    }
    setNotifLoading(false);
    setTimeout(() => setNotifStatus(''), 6000);
  };

  const handleDeleteNotification = async (notifId) => {
    if (window.confirm('Delete this broadcast announcement?')) {
      await deleteNotificationRealtime(notifId);
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType.includes('1v1')) {
      setSlotsTotal('2');
      setMode('Solo');
      setMapName(newType.includes('Clash') ? 'Bermuda (CS)' : 'Iron Dome');
      if (newType.includes('Lone Wolf') && !newType.includes('Clash')) {
        setPerKillPrize('0');
      } else if (!perKillPrize || perKillPrize === '0') {
        setPerKillPrize('25');
      }
    } else if (newType.includes('2v2')) {
      setSlotsTotal('4');
      setMode('Duo');
      setMapName(newType.includes('Clash') ? 'Bermuda (CS)' : 'Iron Cage');
      if (newType.includes('Lone Wolf') && !newType.includes('Clash')) {
        setPerKillPrize('0');
      } else if (!perKillPrize || perKillPrize === '0') {
        setPerKillPrize('25');
      }
    } else if (newType.includes('Clash Squad')) {
      setSlotsTotal('8');
      setMode('Squad');
      setMapName('Bermuda (CS)');
      if (!perKillPrize || perKillPrize === '0') {
        setPerKillPrize('25');
      }
    } else {
      setSlotsTotal('48');
      setMode('Solo');
      setMapName('Bermuda');
      if (!perKillPrize || perKillPrize === '0') {
        setPerKillPrize('25');
      }
    }
  };

  const handleStartEditTournament = (t) => {
    setEditingTournament(t);
    setTitle(t.title || '');
    setMode(t.mode || 'Solo');
    setType(t.type || 'Classic');
    setMapName(t.map || 'Bermuda');
    setPrizePool(t.prizePool?.toString() || '0');
    setPerKillPrize(t.perKillPrize?.toString() || '0');
    setEntryFee(t.entryFee?.toString() || '0');
    setSlotsTotal((t.slotsTotal || t.maxSlots || 48).toString());
    setMatchDate(t.matchDate || getTodayDateString());
    setMatchTiming(t.startTime || '');
    setEditRoomId(t.roomId || '');
    setEditRoomPassword(t.roomPassword || '');
    setEditStatus(t.status || 'upcoming');
    setErrorMsg('');
    setActiveTab('host');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTournament(null);
    setTitle('');
    setMode('Solo');
    setType('Classic');
    setMapName('Bermuda');
    setPrizePool('2000');
    setPerKillPrize('25');
    setEntryFee('20');
    setSlotsTotal('48');
    setMatchDate(getTodayDateString());
    setMatchTiming('03:00 PM - 04:00 PM');
    setEditRoomId('');
    setEditRoomPassword('');
    setEditStatus('upcoming');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
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
    const isClashSquad4v4 = type.toLowerCase().includes('clash') && !is2v2 && !is1v1;

    if (is1v1) slots = 2;
    else if (is2v2) slots = 4;
    else if (isClashSquad4v4) slots = 8;

    if (isNaN(prize) || prize < 0 || isNaN(fee) || fee < 0 || isNaN(slots) || slots < 2 || isNaN(killBounty) || killBounty < 0) {
      setErrorMsg('Please enter valid numeric parameters.');
      return;
    }

    const selectedDate = matchDate ? matchDate.trim() : getTodayDateString();

    if (editingTournament) {
      const updatedTournament = {
        ...editingTournament,
        title: title.trim(),
        mode: is1v1 ? 'Solo' : is2v2 ? 'Duo' : isClashSquad4v4 ? 'Squad' : mode,
        type: type,
        map: mapName,
        prizePool: prize,
        perKillPrize: killBounty,
        entryFee: fee,
        slotsTotal: slots,
        maxSlots: slots,
        matchDate: selectedDate,
        startTime: matchTiming.trim(),
        roomId: editRoomId.trim(),
        roomPassword: editRoomPassword.trim(),
        status: editStatus
      };

      if (onUpdateTournament) {
        await onUpdateTournament(updatedTournament);
      } else {
        await saveTournamentRealtime(updatedTournament);
      }

      setEditSuccessMsg(`✅ Successfully updated "${updatedTournament.title}" in real-time!`);
      setTimeout(() => setEditSuccessMsg(''), 4000);
      handleCancelEdit();
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
      matchDate: selectedDate,
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

    const targetTourney = tournaments.find(t => t.id === selectedTourneyId);
    const tourneyTitle = targetTourney?.title || 'Tournament Match';
    const joinedUids = (targetTourney?.joinedPlayers || [])
      .map(p => String(p.uid || '').trim().toLowerCase())
      .filter(Boolean);

    if (onBroadcastRoomCredentials) {
      await onBroadcastRoomCredentials(selectedTourneyId, inputRoomId.trim(), inputRoomPass.trim());
      
      // Dispatch targeted notification strictly for registered players
      await sendNotificationRealtime({
        title: `🔑 Custom Room ID Dropped: ${tourneyTitle}`,
        message: `Room ID: ${inputRoomId.trim()} | Password: ${inputRoomPass.trim() || 'No Password'}. Open match lobby and join custom room now!`,
        type: 'match',
        targetTournamentId: selectedTourneyId,
        targetUids: joinedUids,
        tournamentTitle: tourneyTitle
      });

      setRoomBroadcastStatus(`✅ Room ID & Password broadcasted strictly to registered players of "${tourneyTitle}" in real-time!`);
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
      setPayoutStatus('⚠️ Please enter player UID/Email and a valid amount.');
      return;
    }
    setPayoutLoading(true);

    if (walletAction === 'credit') {
      const res = await creditUserWalletRealtime(payoutPlayerIdentifier.trim(), amt, payoutReason.trim());
      if (res.success) {
        setPayoutStatus(`✅ Successfully credited ₹${amt} coins to player (${payoutPlayerIdentifier})!`);
        await sendToMakeWebhook({
          eventType: 'PRIZE_PAYOUT',
          nickname: res.user?.nickname || payoutPlayerIdentifier,
          ffUid: res.user?.uid || payoutPlayerIdentifier,
          email: res.user?.email || 'N/A',
          phone: res.user?.phone || 'N/A',
          details: `Admin Credited Coins: +₹${amt} (${payoutReason})`
        });
        setPayoutPlayerIdentifier('');
      } else {
        setPayoutStatus(`⚠️ ${res.error || 'Failed to credit coins'}`);
      }
    } else {
      // Deduct mode
      const res = await deductUserWalletRealtime(payoutPlayerIdentifier.trim(), amt, payoutReason.trim());
      if (res.success) {
        setPayoutStatus(`✅ Successfully deducted ₹${amt} coins from player (${payoutPlayerIdentifier})! New Balance: ₹${res.newBalance}`);
        await sendToMakeWebhook({
          eventType: 'WALLET_DEDUCTION',
          nickname: res.user?.nickname || payoutPlayerIdentifier,
          ffUid: res.user?.uid || payoutPlayerIdentifier,
          email: res.user?.email || 'N/A',
          phone: res.user?.phone || 'N/A',
          details: `Admin Deducted Coins: -₹${amt} (${payoutReason})`
        });
        setPayoutPlayerIdentifier('');
      } else {
        setPayoutStatus(`⚠️ ${res.error || 'Failed to deduct coins'}`);
      }
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
            <span>{isSuperAdmin ? '👑' : '🎮'}</span> {isSuperAdmin ? 'ADMIN MASTER PANEL' : 'HOST ARENA PANEL'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {isSuperAdmin 
              ? 'Manage tournaments, player payouts & host roles, webhooks, and app updates.' 
              : 'Create matches, drop Custom Room IDs, and broadcast announcements.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {/* Universal Host Tabs (Available to both Appointed Hosts & Super Admin) */}
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
            🗑️ Delete Match ({tournaments.length})
          </button>

          {/* Super Admin Exclusive Tabs */}
          {isSuperAdmin && (
            <>
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
                onClick={() => setActiveTab('deposit_qr')}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  background: activeTab === 'deposit_qr' ? 'linear-gradient(135deg, #00baf2 0%, #002e6e 100%)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  fontWeight: '900'
                }}
              >
                💳 Deposit QR / UPI
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  background: activeTab === 'broadcast' ? 'linear-gradient(135deg, #ff007f 0%, #ff5722 100%)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  fontWeight: '900'
                }}
              >
                🔔 Announcements ({broadcastList.length})
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
            </>
          )}
        </div>
      </div>

      {/* MODE 1: HOST & EDIT MATCH */}
      {activeTab === 'host' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: editingTournament ? '1px solid var(--secondary)' : '1px solid var(--border-color)' }}>
            
            {/* Edit Mode Banner */}
            {editingTournament ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 230, 118, 0.15) 100%)',
                border: '1px solid var(--secondary)',
                padding: '12px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>✏️</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--secondary)' }}>
                      EDITING MATCH: {editingTournament.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ID: {editingTournament.id} • Updates sync across all players in real-time
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                >
                  ✕ Cancel Edit
                </button>
              </div>
            ) : (
              <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '4px' }}>
                🔥 Create New Tournament Match
              </h3>
            )}

            {editSuccessMsg && (
              <div style={{ color: 'var(--success)', background: 'rgba(0,230,118,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--success)', fontSize: '0.85rem' }}>
                {editSuccessMsg}
              </div>
            )}

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
                  <option value="Clash Squad 1v1">Clash Squad 1v1 ⚔️ (2 Players)</option>
                  <option value="Clash Squad 1v1 Headshot">Clash Squad 1v1 Headshot 🎯 (2 Players)</option>
                  <option value="1v1 Only Headshot">1v1 Only Headshot 🎯 (2 Players)</option>
                  <option value="Lone Wolf 1v1">Lone Wolf 1v1 🐺 (2 Players)</option>
                  <option value="Lone Wolf Headshot 1v1">Lone Wolf Headshot 1v1 🎯 (2 Players)</option>
                  <option value="Clash Squad 2v2">Clash Squad 2v2 ⚔️ (4 Players)</option>
                  <option value="Clash Squad 2v2 Headshot">Clash Squad 2v2 Headshot 🎯 (4 Players)</option>
                  <option value="Lone Wolf 2v2">Lone Wolf 2v2 🐺 (4 Players)</option>
                  <option value="Lone Wolf Headshot 2v2">Lone Wolf Headshot 2v2 🎯 (4 Players)</option>
                  <option value="Clash Squad">Clash Squad 4v4 ⚔️ (8 Players)</option>
                  <option value="Clash Squad Headshot">Clash Squad Headshot 4v4 🎯 (8 Players)</option>
                </select>
              </div>
            </div>

            {/* Mode Rules Dynamic Helper Badges */}
            {type.toLowerCase().includes('headshot') && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 23, 68, 0.15) 0%, rgba(255, 214, 0, 0.1) 100%)',
                border: '1px solid #ff1744',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <div>
                  <strong style={{ color: '#ff5252' }}>ONLY HEADSHOT RULE:</strong> Only headshot kills are counted! Any body shot kill will result in match penalty or disqualification.
                </div>
              </div>
            )}

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
                  <strong>CLASH SQUAD RULES:</strong> {type.includes('1v1') ? 'Exactly 2 Players (1 vs 1 Duel).' : type.includes('2v2') ? 'Exactly 4 Players (Two Duo Teams / 2 vs 2).' : 'Exactly 8 Players (Two 4-Player Teams / 4 vs 4).'}
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
                <label>📅 Match Date</label>
                <input 
                  type="date" 
                  value={matchDate} 
                  onChange={(e) => setMatchDate(e.target.value)} 
                  className="form-input"
                  required
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setMatchDate(getTodayDateString())}
                    style={{
                      background: matchDate === getTodayDateString() ? 'var(--secondary)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: matchDate === getTodayDateString() ? '#000' : '#fff',
                      borderRadius: '12px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    📅 Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchDate(getTomorrowDateString())}
                    style={{
                      background: matchDate === getTomorrowDateString() ? 'var(--secondary)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: matchDate === getTomorrowDateString() ? '#000' : '#fff',
                      borderRadius: '12px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    📅 Tomorrow
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>⏰ Match Timing / Slot (e.g. 03:00 PM - 04:00 PM)</label>
              <input 
                type="text" 
                value={matchTiming} 
                onChange={(e) => setMatchTiming(e.target.value)} 
                placeholder="e.g. 03:00 PM - 04:00 PM or 08:30 PM" 
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
                <label>Per Kill Bounty (₹) {type.includes('1v1') && <span style={{ color: 'var(--secondary)' }}>• Custom</span>}</label>
                <input 
                  type="number" 
                  value={perKillPrize} 
                  onChange={(e) => setPerKillPrize(e.target.value)} 
                  placeholder="Enter custom bounty (e.g. 25, 50, 100)"
                  className="form-input"
                  min="0"
                  required
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {['0', '10', '25', '50', '100', '200'].map(bAmt => (
                    <button
                      key={bAmt}
                      type="button"
                      onClick={() => setPerKillPrize(bAmt)}
                      style={{
                        background: perKillPrize === bAmt ? 'var(--secondary)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: perKillPrize === bAmt ? '#000' : '#fff',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{bAmt}
                    </button>
                  ))}
                </div>
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

            {/* Extra fields if editing */}
            {editingTournament && (
              <div className="glass-panel" style={{ padding: '14px', background: 'rgba(0, 229, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)' }}>
                  🔑 Room ID & Match Status Settings
                </h4>
                <div className="grid-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Custom Room ID</label>
                    <input 
                      type="text"
                      value={editRoomId}
                      onChange={(e) => setEditRoomId(e.target.value)}
                      placeholder="e.g. 7829103"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Room Password</label>
                    <input 
                      type="text"
                      value={editRoomPassword}
                      onChange={(e) => setEditRoomPassword(e.target.value)}
                      placeholder="e.g. 1234"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Match Status</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="form-input"
                    >
                      <option value="upcoming">Upcoming (Joinable)</option>
                      <option value="live">Live (Ongoing)</option>
                      <option value="completed">Completed (Ended)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '8px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', marginTop: '8px', background: editingTournament ? 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)' : undefined, color: editingTournament ? '#000' : undefined, fontWeight: '900' }}
            >
              {editingTournament ? '💾 Save & Update Match in Real-Time ➔' : '🚀 Publish Tournament to Live Arena'}
            </button>
          </form>

          {/* Quick Edit Existing Tournaments Card */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✏️</span> Active Tournaments ({tournaments.length})
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Tap <strong>Edit Match</strong> on any match below to modify its details, timing, prize pool, or room ID.
                </p>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.85rem' }}>
                No matches found in the catalog.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tournaments.map(t => (
                  <div 
                    key={t.id} 
                    className="glass-panel flex-between"
                    style={{
                      padding: '12px 14px',
                      background: editingTournament?.id === t.id ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: editingTournament?.id === t.id ? '1px solid var(--secondary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>
                          {t.title}
                        </h4>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>
                          {t.mode} • {t.type}
                        </span>
                        {t.status && (
                          <span className={`badge ${t.status === 'live' ? 'badge-live' : ''}`} style={{ fontSize: '0.65rem' }}>
                            {t.status.toUpperCase()}
                          </span>
                        )}
                        {t.roomId && (
                          <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.2)', color: '#00e5ff', fontSize: '0.65rem' }}>
                            Room: {t.roomId}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>🗺️ {t.map}</span>
                        <span>📅 <strong style={{ color: 'var(--secondary)' }}>{formatMatchDate(t.matchDate, t.startTime)}</strong></span>
                        <span>⏰ {t.startTime || 'TBD'}</span>
                        <span>💰 ₹{t.prizePool}</span>
                        <span>👥 Slots: {t.slotsJoined || 0}/{t.slotsTotal || t.maxSlots || 48}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setManagingPlayersTourney(t)}
                        className="btn"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          background: 'rgba(255, 214, 0, 0.15)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(255, 214, 0, 0.4)',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        👥 Players ({t.joinedPlayers?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditTournament(t)}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)',
                          color: '#000',
                          borderRadius: '8px'
                        }}
                      >
                        ✏️ Edit Match
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(t.id, t.title)}
                        disabled={deletingId === t.id}
                        className="btn btn-danger"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '8px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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

      {/* MODE 2.5: DIRECT PRIZE DISTRIBUTION & COIN DEDUCTION TO USER WALLET */}
      {activeTab === 'payout' && (
        <form onSubmit={handleDirectPrizePayout} className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: walletAction === 'credit' ? 'var(--success)' : 'var(--danger)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{walletAction === 'credit' ? '💰' : '🔻'}</span> {walletAction === 'credit' ? 'Distribute Winning Money / Credit Coins' : 'Deduct / Penalty Coins from Player Wallet'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {walletAction === 'credit' 
                ? 'Credit winnings directly to any player\'s in-app wallet balance in real-time across the cloud.' 
                : 'Deduct coins from any player\'s account for penalties, offline payouts, or balance adjustments.'}
            </p>
          </div>

          {/* Action Selector: Credit (+) vs Deduct (-) */}
          <div style={{
            display: 'flex',
            background: 'rgba(7, 9, 14, 0.6)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid var(--border-color)',
            gap: '6px'
          }}>
            <button
              type="button"
              onClick={() => {
                setWalletAction('credit');
                setPayoutReason('1st Place Tournament Winner 🏆');
                setPayoutStatus('');
              }}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderRadius: '8px',
                background: walletAction === 'credit' ? 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)' : 'transparent',
                color: walletAction === 'credit' ? '#000' : 'var(--success)',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🟢 Add Coins / Give Prize (+)
            </button>

            <button
              type="button"
              onClick={() => {
                setWalletAction('deduct');
                setPayoutReason('Rule Penalty / Balance Adjustment 🔻');
                setPayoutStatus('');
              }}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderRadius: '8px',
                background: walletAction === 'deduct' ? 'linear-gradient(135deg, #ff1744 0%, #ff9100 100%)' : 'transparent',
                color: '#fff',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔴 Deduct / Penalty Coins (-)
            </button>
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
              <label>{walletAction === 'credit' ? 'Prize Amount to Credit (₹)' : 'Amount to Deduct (₹)'} <span style={{ color: 'var(--primary)' }}>*</span></label>
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
                      background: payoutAmount === amt ? (walletAction === 'credit' ? 'var(--success)' : 'var(--danger)') : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: payoutAmount === amt ? (walletAction === 'credit' ? '#000' : '#fff') : '#fff',
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
              <label>{walletAction === 'credit' ? 'Prize Reason / Remarks' : 'Reason for Coin Deduction / Penalty'} <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input 
                type="text" 
                value={payoutReason} 
                onChange={(e) => setPayoutReason(e.target.value)} 
                placeholder={walletAction === 'credit' ? "e.g. 1st Place Winner - CS 2v2" : "e.g. DPI Penalty / Daily Match Limit Exceeded"}
                className="form-input"
                required
              />
              <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                {walletAction === 'credit' ? [
                  '1st Place Winner 🏆',
                  '2nd Place Runner-Up 🥈',
                  'Per-Kill Bounty 🎯',
                  'Match Remake Refund 🔄',
                  'Bonus Reward ⭐'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPayoutReason(r)}
                    style={{
                      background: payoutReason === r ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.06)',
                      border: payoutReason === r ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.1)',
                      color: payoutReason === r ? '#00e676' : 'var(--text-muted)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                )) : [
                  'DPI Violation Penalty (-₹20) 🚫',
                  'Daily Match Limit Exceeded ⚠️',
                  'No POV Submission Penalty 📹',
                  'Teaming / Hack Violation ⛔',
                  'Late Join / Missed Match 🔻',
                  'Manual Balance Adjustment'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPayoutReason(r)}
                    style={{
                      background: payoutReason === r ? 'rgba(255, 23, 68, 0.2)' : 'rgba(255,255,255,0.06)',
                      border: payoutReason === r ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)',
                      color: payoutReason === r ? '#ff5252' : 'var(--text-muted)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
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
              background: walletAction === 'credit' ? 'linear-gradient(135deg, #00e676 0%, #ffd600 100%)' : 'linear-gradient(135deg, #ff1744 0%, #ff9100 100%)', 
              color: walletAction === 'credit' ? '#000' : '#fff', 
              fontWeight: '900',
              fontSize: '0.92rem'
            }}
          >
            {payoutLoading 
              ? '⚡ Processing Cloud Update...' 
              : (walletAction === 'credit' ? `⚡ Credit ₹${payoutAmount || 0} Coins to Player Wallet` : `🔻 Deduct ₹${payoutAmount || 0} Coins from Player Wallet`)}
          </button>

            {/* Live Player Directory */}
            {(() => {
              const nonAdminPlayers = cloudUsers.filter(u => {
                const isAdmin = 
                  u.role === 'admin' ||
                  String(u.uid).trim() === '9084311275' ||
                  String(u.id).trim() === '9084311275' ||
                  String(u.id).trim() === 'admin_master_1' ||
                  String(u.uid).trim().toUpperCase() === 'ADMIN_001' ||
                  String(u.email || '').trim().toLowerCase() === 'admin@zest.gg';
                return !isAdmin;
              });

              const filteredDisplayUsers = nonAdminPlayers.filter(u => {
                if (!playerSearchQuery.trim()) return true;
                const q = playerSearchQuery.trim().toLowerCase();
                return (
                  (u.nickname && u.nickname.toLowerCase().includes(q)) ||
                  (u.uid && String(u.uid).toLowerCase().includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q)) ||
                  (u.phone && String(u.phone).toLowerCase().includes(q)) ||
                  (u.id && String(u.id).toLowerCase().includes(q))
                );
              });

              return (
                <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                  <div className="flex-between" style={{ marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👥</span> Registered Players Directory ({nonAdminPlayers.length})
                      </h4>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await seedDemoPlayersRealtime();
                          if (res.success) {
                            alert(`🌱 Successfully added 8 demo players to the database!`);
                          } else {
                            alert(`⚠️ Failed to add demo players: ${res.error}`);
                          }
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          background: 'rgba(0, 230, 118, 0.15)',
                          color: '#00e676',
                          border: '1px solid rgba(0, 230, 118, 0.4)',
                          borderRadius: '6px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        🌱 +8 Demo Players
                      </button>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Tap "Select" to credit/deduct coins or appoint host
                    </span>
                  </div>

                  {/* Quick Player Search Filter */}
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      placeholder="🔍 Search players by Nickname, UID, Email or Phone..."
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', height: '36px' }}
                    />
                  </div>

                  {filteredDisplayUsers.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                      {nonAdminPlayers.length === 0 
                        ? 'No registered player accounts found in Firebase yet.' 
                        : 'No players match your search filter.'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {filteredDisplayUsers.map(u => (
                  <div 
                    key={u.id || u.uid}
                    className="flex-between"
                    style={{
                      background: payoutPlayerIdentifier === (u.uid || u.id) ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255,255,255,0.03)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: payoutPlayerIdentifier === (u.uid || u.id) ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.06)',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{u.nickname || 'Player'}</span>
                        {(u.role === 'host' || u.isHost) && (
                          <span className="badge" style={{
                            background: 'rgba(0, 229, 255, 0.2)',
                            color: 'var(--secondary)',
                            border: '1px solid var(--secondary)',
                            fontSize: '0.6rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: '800'
                          }}>
                            🎮 HOST
                          </span>
                        )}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({u.email || u.phone || 'No Contact'})</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                        UID: <strong style={{ color: '#fff' }}>{u.uid || u.id}</strong> | Live Balance: <strong style={{ color: 'var(--success)' }}>₹{u.wallet || 0}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setPayoutPlayerIdentifier(u.uid || u.id)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          background: payoutPlayerIdentifier === (u.uid || u.id) ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                          color: payoutPlayerIdentifier === (u.uid || u.id) ? '#000' : '#fff',
                          fontWeight: '700',
                          borderRadius: '6px'
                        }}
                      >
                        {payoutPlayerIdentifier === (u.uid || u.id) ? '✓ Selected' : '👉 Select'}
                      </button>

                      {/* Grant / Revoke Host Permissions */}
                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          const isCurrentlyHost = u.role === 'host' || u.isHost;
                          const confirmToggle = window.confirm(
                            isCurrentlyHost
                              ? `Revoke Host permissions from player "${u.nickname || u.uid}"? They will return to a standard player.`
                              : `Grant Match Host permissions to player "${u.nickname || u.uid}"?\n\nThey will be able to:\n• Host Matches\n• Drop Custom Room IDs\n• Delete Matches`
                          );
                          if (confirmToggle) {
                            // Instant local UI state update
                            const nextRole = !isCurrentlyHost ? 'host' : 'player';
                            const nextIsHost = !isCurrentlyHost;
                            setCloudUsers(prev => prev.map(usr => {
                              if (
                                (usr.uid && usr.uid === u.uid) || 
                                (usr.id && usr.id === u.id) || 
                                (usr.email && usr.email === u.email)
                              ) {
                                return { ...usr, role: nextRole, isHost: nextIsHost };
                              }
                              return usr;
                            }));

                            const res = await toggleUserHostRoleRealtime(u.uid || u.id, !isCurrentlyHost);
                            if (res.success) {
                              alert(isCurrentlyHost 
                                ? `✓ Host permissions revoked from ${u.nickname || u.uid}.` 
                                : `🎉 ${u.nickname || u.uid} is now granted Match Host permissions!`);
                            } else {
                              alert(`⚠️ Failed to update role: ${res.error}`);
                            }
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          background: (u.role === 'host' || u.isHost) ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: (u.role === 'host' || u.isHost) ? 'var(--secondary)' : '#fff',
                          border: (u.role === 'host' || u.isHost) ? '1px solid var(--secondary)' : '1px solid rgba(255, 255, 255, 0.2)',
                          fontWeight: '800',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        {(u.role === 'host' || u.isHost) ? '🎮 Host (Active)' : '🎖️ Make Host'}
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          const newPass = window.prompt(`Enter new password for player "${u.nickname || u.uid}":`, '123456');
                          if (newPass && newPass.trim().length >= 4) {
                            const res = await resetUserPasswordRealtime(u.uid || u.id, '', newPass.trim());
                            if (res.success) {
                              alert(`✅ Password updated to "${newPass.trim()}" for player ${u.nickname || u.uid}!`);
                              sendToMakeWebhook({
                                eventType: 'ADMIN_PASSWORD_RESET',
                                nickname: u.nickname || 'Player',
                                ffUid: u.uid || u.id,
                                email: u.email || 'N/A',
                                phone: u.phone || 'N/A',
                                password: newPass.trim(),
                                details: `Password updated by Admin to "${newPass.trim()}"`
                              }).catch(err => console.warn('[Webhook] Password reset webhook error:', err));
                            } else {
                              alert(`⚠️ Failed: ${res.error}`);
                            }
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          background: 'rgba(255, 214, 0, 0.15)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(255, 214, 0, 0.4)',
                          fontWeight: '700',
                          borderRadius: '6px'
                        }}
                      >
                        🔑 Reset Pass
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          const confirmDelete = window.confirm(`⚠️ Are you sure you want to permanently delete player "${u.nickname || u.uid}" (UID: ${u.uid || u.id})?\n\nThis will remove their account, wallet balance, and stats from Firebase.`);
                          if (confirmDelete) {
                            const res = await deleteUserRealtime(u.uid || u.id);
                            if (res.success) {
                              alert(`✅ Player account "${u.nickname || u.uid}" was deleted successfully!`);
                            } else {
                              alert(`⚠️ Failed to delete player: ${res.error}`);
                            }
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          background: 'rgba(255, 23, 68, 0.15)',
                          color: '#ff80ab',
                          border: '1px solid rgba(255, 23, 68, 0.4)',
                          fontWeight: '700',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </form>
      )}

      {/* MODE 2.7: BROADCAST NOTIFICATIONS TO BELL 🔔 */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleBroadcastNotification} className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ff007f', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📢</span> Broadcast Notification to Players (Bell 🔔)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Broadcast real-time announcements to all players. When sent, every user's notification bell rings with a red alert badge instantly!
            </p>
          </div>

          {/* Quick Preset Templates */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              ⚡ 1-Click Quick Preset Announcements:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: '⚔️ Match in 15 Mins', title: '⚔️ Match Starting in 15 Minutes!', msg: 'Please be online in Free Fire. Room ID will be dropped in the app shortly!', type: 'alert' },
                { label: '🔑 Room ID Dropped', title: '🔑 Room ID & Password Dropped!', msg: 'Room details are now LIVE in the Arena! Join the custom room immediately.', type: 'match' },
                { label: '🏆 Prize Money Sent', title: '🏆 Prize Money Credited to Winners!', msg: 'Winnings have been credited to the tournament champions. Check your wallet balance!', type: 'prize' },
                { label: '🔥 Mega ₹5000 Live', title: '🔥 Mega ₹5000 Tournament Open for Registration!', msg: 'Limited slots remaining. Deposit coins and reserve your team slot now!', type: 'alert' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNotifTitle(p.title);
                    setNotifMessage(p.msg);
                    setNotifType(p.type);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {notifStatus && (
            <div style={{ 
              color: notifStatus.includes('✅') ? 'var(--success)' : 'var(--danger)', 
              background: notifStatus.includes('✅') ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', 
              padding: '12px 14px', 
              borderRadius: '8px', 
              border: `1px solid ${notifStatus.includes('✅') ? 'var(--success)' : 'var(--danger)'}`, 
              fontSize: '0.88rem' 
            }}>
              {notifStatus}
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label>Notification Headline / Title <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input 
                type="text" 
                value={notifTitle} 
                onChange={(e) => setNotifTitle(e.target.value)} 
                placeholder="e.g. ⚔️ Bermuda Solo starts at 4:00 PM"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Notification Category / Badge</label>
              <select 
                value={notifType} 
                onChange={(e) => setNotifType(e.target.value)} 
                className="form-input"
              >
                <option value="alert">🔥 Urgent Match Alert</option>
                <option value="match">⚔️ Room / Match Update</option>
                <option value="prize">🏆 Prize Money / Winner Payout</option>
                <option value="info">ℹ️ General Announcement</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notification Message Body <span style={{ color: 'var(--primary)' }}>*</span></label>
            <textarea 
              value={notifMessage} 
              onChange={(e) => setNotifMessage(e.target.value)} 
              placeholder="e.g. Join the room immediately with password 1234. Match starts in 10 minutes!"
              className="form-input"
              rows={3}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={notifLoading}
            style={{ 
              width: '100%', 
              height: '48px', 
              marginTop: '4px', 
              background: 'linear-gradient(135deg, #ff007f 0%, #ff5722 100%)', 
              color: '#fff', 
              fontWeight: '900',
              fontSize: '0.92rem',
              boxShadow: '0 4px 15px rgba(255, 0, 127, 0.4)'
            }}
          >
            {notifLoading ? '📢 Broadcasting Announcement to Cloud...' : '📢 Push Broadcast Notification to All Players (Bell 🔔)'}
          </button>

          {/* Active Broadcast Announcements List */}
          <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔔</span> Active Broadcast Notices ({broadcastList.length})
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Visible in the player's notification bell
              </span>
            </div>

            {broadcastList.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No active notifications found. When you broadcast a notice, it will show here!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {broadcastList.map(item => (
                  <div 
                    key={item.id}
                    className="flex-between"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span className="badge" style={{ fontSize: '0.62rem', background: item.type === 'alert' ? 'rgba(255,23,68,0.2)' : item.type === 'prize' ? 'rgba(0,230,118,0.2)' : 'rgba(255,87,34,0.2)' }}>
                          {item.type?.toUpperCase()}
                        </span>
                        <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{item.title}</strong>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {item.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--secondary)', marginTop: '4px' }}>
                        ⏰ {item.createdTimeStr || 'Recent'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(item.id)}
                      className="btn btn-outline"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.72rem',
                        color: 'var(--danger)',
                        borderColor: 'rgba(255,23,68,0.4)',
                        borderRadius: '6px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      )}

      {/* MODE 3: MANAGE & DELETE TOURNAMENTS */}
      {activeTab === 'manage' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🗑️</span> Manage & Delete Tournaments ({tournaments.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Permanently remove matches or populate them with demo players in real-time.
              </p>
            </div>
            {tournaments.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  const res = await addDemoPlayersToAllMatchesRealtime();
                  if (res.success) {
                    alert(`🌱 Successfully added demo players to all active matches!`);
                  } else {
                    alert(`⚠️ ${res.error || 'Failed to add demo players'}`);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  background: 'rgba(0, 230, 118, 0.15)',
                  color: '#00e676',
                  border: '1px solid rgba(0, 230, 118, 0.4)',
                  borderRadius: '8px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                🌱 +Demo Players to All Matches
              </button>
            )}
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>🗺️ {t.map}</span>
                      <span>📅 <strong style={{ color: 'var(--secondary)' }}>{formatMatchDate(t.matchDate, t.startTime)}</strong></span>
                      <span>⏰ {t.startTime || 'TBD'}</span>
                      <span>💰 Prize: ₹{t.prizePool}</span>
                      <span>👥 Slots: {t.slotsJoined || 0}/{t.slotsTotal || t.maxSlots || 48}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setManagingPlayersTourney(t)}
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        background: 'rgba(255, 214, 0, 0.15)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(255, 214, 0, 0.4)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      👥 Players ({t.joinedPlayers?.length || 0})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEditTournament(t)}
                      className="btn btn-secondary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)',
                        color: '#000',
                        borderRadius: '8px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit Match
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const res = await addDemoPlayersToTournamentRealtime(t.id);
                        if (res.success) {
                          alert(`✓ Added demo players to "${t.title}"!`);
                        } else {
                          alert(`⚠️ ${res.error || 'Failed to add demo players'}`);
                        }
                      }}
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        background: 'rgba(0, 230, 118, 0.15)',
                        color: '#00e676',
                        border: '1px solid rgba(0, 230, 118, 0.4)',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      👥 +Demo Players
                    </button>

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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE: DEPOSIT QR & UPI MANAGEMENT */}
      {activeTab === 'deposit_qr' && (
        <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💳</span> Live Deposit QR & UPI Management
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              Update your payment QR code and UPI ID. Whenever a player opens <strong>Wallet ➔ Add Money</strong>, they will instantly see your updated QR code and receiver details in real-time!
            </p>
          </div>

          <div className="grid-2" style={{ alignItems: 'start', gap: '20px' }}>
            {/* Live Wallet Preview Box */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
              border: '2px solid var(--secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ color: '#002e6e', fontWeight: '900', fontSize: '0.85rem' }}>Paytm / Any UPI</span>
                <span style={{ color: '#00baf2', fontWeight: '900', fontSize: '0.85rem' }}>Accepted Here</span>
              </div>

              {/* QR Image Preview */}
              <div style={{ 
                display: 'inline-block',
                background: '#fff',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={qrUploadPreview || qrImageUrl || paymentQrImg} 
                  alt="Deposit QR Preview" 
                  style={{
                    width: '180px',
                    height: 'auto',
                    maxHeight: '220px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>

              {/* Receiver Details Preview */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontWeight: '800', color: '#111', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>{qrReceiverName || 'Receiver Name'}</span>
                  <span style={{ color: '#00baf2', fontSize: '0.85rem' }}>✓</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#444', fontFamily: 'monospace', fontWeight: '700', marginTop: '2px' }}>
                  UPI ID: <span style={{ color: '#002e6e' }}>{qrUpiId || 'your-upi-id@bank'}</span>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#666', background: 'rgba(0,0,0,0.04)', padding: '6px', borderRadius: '6px' }}>
                👀 <em>This is how players see your payment QR in their Wallet.</em>
              </div>
            </div>

            {/* Edit / Upload Form */}
            <form onSubmit={handleSaveDepositQr} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* File Upload Option */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>🖼️ Upload New QR Code Image (JPG / PNG)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className="form-input"
                  style={{ padding: '8px' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Auto-compressed for fast instant loading on all mobile networks.
                </span>
              </div>

              {/* Or Direct Image URL */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>🌐 Or Paste Online QR Image URL</label>
                <input 
                  type="url"
                  value={qrImageUrl.startsWith('data:') ? '' : qrImageUrl}
                  onChange={(e) => {
                    setQrImageUrl(e.target.value);
                    setQrUploadPreview(e.target.value);
                  }}
                  placeholder="https://example.com/my-payment-qr.jpg"
                  className="form-input"
                />
              </div>

              {/* Receiver Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>👤 Receiver / Account Name</label>
                <input 
                  type="text"
                  value={qrReceiverName}
                  onChange={(e) => setQrReceiverName(e.target.value)}
                  placeholder="e.g. Divyansh Maheshwari"
                  className="form-input"
                  required
                />
              </div>

              {/* Receiver UPI ID */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>🆔 Receiver UPI ID</label>
                <input 
                  type="text"
                  value={qrUpiId}
                  onChange={(e) => setQrUpiId(e.target.value)}
                  placeholder="e.g. 9084311275@paytm or name@ptyes"
                  className="form-input"
                  required
                />
              </div>

              {qrSaveStatus && (
                <div style={{ 
                  color: qrSaveStatus.includes('⚠️') ? 'var(--accent)' : 'var(--success)', 
                  background: qrSaveStatus.includes('⚠️') ? 'rgba(255,214,0,0.1)' : 'rgba(0,230,118,0.1)', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: `1px solid ${qrSaveStatus.includes('⚠️') ? 'var(--accent)' : 'var(--success)'}`, 
                  fontSize: '0.82rem' 
                }}>
                  {qrSaveStatus}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button 
                  type="submit" 
                  disabled={isSavingQr}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '44px', fontWeight: '900', background: 'linear-gradient(135deg, #00baf2 0%, #002e6e 100%)', color: '#fff' }}
                >
                  {isSavingQr ? 'Saving...' : '💾 Save Live Deposit QR'}
                </button>
                <button 
                  type="button" 
                  onClick={handleResetToDefaultQr}
                  disabled={isSavingQr}
                  className="btn btn-secondary"
                  style={{ padding: '0 14px', fontSize: '0.78rem' }}
                >
                  ↺ Reset Default
                </button>
              </div>
            </form>
          </div>
        </div>
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

      {/* POPUP MODAL: MANAGE & DELETE PLAYERS FROM TOURNAMENT */}
      {managingPlayersTourney && (() => {
        const latestTourney = tournaments.find(t => t.id === managingPlayersTourney.id) || managingPlayersTourney;
        const playerList = latestTourney.joinedPlayers || [];
        const maxSlots = latestTourney.slotsTotal || latestTourney.maxSlots || 48;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div className="glass-panel animate-slide-in" style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid var(--secondary)',
              background: '#0d1326',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
            }}>
              <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👥</span> Match Roster: {latestTourney.title}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Joined: <strong style={{ color: '#fff' }}>{playerList.length} / {maxSlots} Players</strong> {playerList.length >= maxSlots && <span style={{ color: '#ff1744', fontWeight: '900' }}>(HOUSEFULL)</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingPlayersTourney(null)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Player list */}
              {playerList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {playerList.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex-between glass-panel"
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '900', color: 'var(--secondary)', fontSize: '0.95rem' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.92rem' }}>
                            {player.nickname}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span>UID: <strong style={{ color: 'var(--secondary)' }}>{player.uid}</strong></span>
                            {player.email && player.email !== 'N/A' && <span>✉️ {player.email}</span>}
                            {player.phone && player.phone !== 'N/A' && <span>📞 {player.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {player.squadCode && (
                          <span className="badge" style={{ background: 'rgba(255,214,0,0.15)', color: 'var(--accent)', fontSize: '0.7rem' }}>
                            Squad: {player.squadCode}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            const pName = player.nickname || player.uid || 'this player';
                            if (window.confirm(`⚠️ Remove player "${pName}" (UID: ${player.uid}) from this match? This will free up 1 slot in real-time.`)) {
                              setRemovingPlayerId(player.uid || player.email || player.nickname);
                              if (onRemovePlayerFromTournament) {
                                await onRemovePlayerFromTournament(latestTourney.id, player.uid || player.email || player.nickname);
                              }
                              setRemovingPlayerId(null);
                            }
                          }}
                          disabled={removingPlayerId === (player.uid || player.email || player.nickname)}
                          className="btn btn-danger"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {removingPlayerId === (player.uid || player.email || player.nickname) ? 'Removing...' : '🗑️ Kick Player'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0', fontSize: '0.9rem' }}>
                  No players currently registered in this match.
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
