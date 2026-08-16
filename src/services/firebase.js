import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  arrayUnion, 
  increment,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxFlDYZEQj0pjYbGd-tmlAn4rDfblnBKY",
  authDomain: "zest-app-fc25b.firebaseapp.com",
  projectId: "zest-app-fc25b",
  storageBucket: "zest-app-fc25b.firebasestorage.app",
  messagingSenderId: "122811714976",
  appId: "1:122811714976:web:c450f21c45f2ff640a28c5",
  measurementId: "G-2S88SRGF4W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initial starter tournaments seed if database is clean
export const SEED_TOURNAMENTS = [
  {
    id: "ff_bermuda_solo_01",
    title: "Bermuda Clash Solo Grand Cup",
    mode: "Solo",
    map: "Bermuda",
    type: "Classic",
    entryFee: 50,
    prizePool: 2000,
    perKillPrize: 25,
    slotsTotal: 48,
    maxSlots: 48,
    slotsJoined: 0,
    startTime: "Today, 06:00 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_purgatory_duo_02",
    title: "Purgatory Pro Duo Warfare",
    mode: "Duo",
    map: "Purgatory",
    type: "Classic",
    entryFee: 80,
    prizePool: 3500,
    perKillPrize: 40,
    slotsTotal: 24,
    maxSlots: 24,
    slotsJoined: 0,
    startTime: "Today, 08:30 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_kalahari_squad_03",
    title: "Kalahari Squad Rush Championship",
    mode: "Squad",
    map: "Kalahari",
    type: "Clash Squad",
    entryFee: 150,
    prizePool: 6000,
    perKillPrize: 50,
    slotsTotal: 8,
    maxSlots: 8,
    slotsJoined: 0,
    startTime: "Tonight, 10:00 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_cs_headshot_04",
    title: "Clash Squad 4v4 Headshot Masters",
    mode: "Squad",
    map: "Bermuda (CS)",
    type: "Clash Squad Headshot",
    entryFee: 100,
    prizePool: 4500,
    perKillPrize: 40,
    slotsTotal: 8,
    maxSlots: 8,
    slotsJoined: 0,
    startTime: "Today, 09:15 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_lonewolf_hs_1v1_05",
    title: "Lone Wolf 1v1 Headshot Showdown",
    mode: "Solo",
    map: "Iron Dome",
    type: "Lone Wolf Headshot 1v1",
    entryFee: 30,
    prizePool: 1200,
    perKillPrize: 0,
    slotsTotal: 2,
    maxSlots: 2,
    slotsJoined: 0,
    startTime: "Today, 07:45 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_lonewolf_hs_2v2_06",
    title: "Lone Wolf 2v2 Headshot Duo Clash",
    mode: "Duo",
    map: "Iron Cage",
    type: "Lone Wolf Headshot 2v2",
    entryFee: 60,
    prizePool: 2500,
    perKillPrize: 0,
    slotsTotal: 4,
    maxSlots: 4,
    slotsJoined: 0,
    startTime: "Today, 08:45 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_lonewolf_2v2_07",
    title: "Lone Wolf 2v2 Tactical Arena",
    mode: "Duo",
    map: "Science Center",
    type: "Lone Wolf 2v2",
    entryFee: 50,
    prizePool: 2000,
    perKillPrize: 0,
    slotsTotal: 4,
    maxSlots: 4,
    slotsJoined: 0,
    startTime: "Tonight, 11:00 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_cs_2v2_08",
    title: "Clash Squad 2v2 Duo Blitz",
    mode: "Duo",
    map: "Bermuda (CS)",
    type: "Clash Squad 2v2",
    entryFee: 50,
    prizePool: 2200,
    perKillPrize: 25,
    slotsTotal: 4,
    maxSlots: 4,
    slotsJoined: 0,
    startTime: "Tonight, 09:45 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  },
  {
    id: "ff_cs_2v2_hs_09",
    title: "Clash Squad 2v2 Headshot Duo Masters",
    mode: "Duo",
    map: "Bermuda (CS)",
    type: "Clash Squad 2v2 Headshot",
    entryFee: 60,
    prizePool: 2600,
    perKillPrize: 30,
    slotsTotal: 4,
    maxSlots: 4,
    slotsJoined: 0,
    startTime: "Tonight, 10:30 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [],
    leaderboard: []
  }
];

/**
 * Real-time listener for all tournaments in Firestore
 * Updates across ALL web, Android, and iOS devices in millisecond sync!
 */
export const subscribeToTournamentsRealtime = (onUpdate, onError) => {
  try {
    const tourneysCollection = collection(db, "tournaments");
    
    const unsubscribe = onSnapshot(tourneysCollection, async (snapshot) => {
      if (snapshot.empty) {
        console.log("[Firebase] Database empty. Seeding initial tournament catalog...");
        // Seed initial data
        for (const t of SEED_TOURNAMENTS) {
          await setDoc(doc(db, "tournaments", t.id), t);
        }
        onUpdate(SEED_TOURNAMENTS);
      } else {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        console.log(`[Firebase Realtime] Received ${list.length} tournaments live.`);
        onUpdate(list);
      }
    }, (error) => {
      console.warn("[Firebase] Realtime listener error, falling back to local memory:", error);
      if (onError) onError(error);
    });

    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] Subscription init failure:", err);
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Creates or updates a tournament in Firestore in real-time
 */
export const saveTournamentRealtime = async (tournamentData) => {
  try {
    const tourneyId = tournamentData.id || `tourney_${Date.now()}`;
    const cleanData = {
      ...tournamentData,
      id: tourneyId,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "tournaments", tourneyId), cleanData, { merge: true });
    return { success: true, id: tourneyId };
  } catch (error) {
    console.error("[Firebase] Error saving tournament:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for app configurations (Razorpay keys, Webhook URLs)
 * Automatically syncs live keys to all installed APKs and Web users in real-time!
 */
export const subscribeToAppSettingsRealtime = (onUpdate, onError) => {
  try {
    const configDocRef = doc(db, "settings", "app_config");
    const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("[Firebase Realtime] Received updated app settings from cloud:", data);
        if (onUpdate) onUpdate(data);
      }
    }, (error) => {
      console.warn("[Firebase] Settings listener warning:", error);
      if (onError) onError(error);
    });
    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] App settings listener error:", err);
    return () => {};
  }
};

/**
 * Saves app configurations (Razorpay keys, Webhooks) to Firestore cloud
 */
export const saveAppSettingsRealtime = async (settings) => {
  try {
    const configDocRef = doc(db, "settings", "app_config");
    await setDoc(configDocRef, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
    console.log("[Firebase] App settings saved to cloud in real-time:", settings);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error saving app settings to cloud:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Deletes a tournament from Firestore in real-time
 */
export const deleteTournamentRealtime = async (tournamentId) => {
  try {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    await deleteDoc(tourneyRef);
    console.log(`[Firebase] Deleted tournament: ${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error deleting tournament:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Atomically joins a tournament in Firestore in real-time
 */
export const joinTournamentRealtime = async (tournamentId, participantData) => {
  try {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    
    // Add participant and increment slot counter
    await updateDoc(tourneyRef, {
      slotsJoined: increment(1),
      joinedPlayers: arrayUnion(participantData),
      updatedAt: serverTimestamp()
    });

    console.log(`[Firebase Realtime] Successfully registered ${participantData.nickname} to ${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error joining tournament:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time Room ID & Password update by Admin Host
 * Instantly triggers notification on joined players' screens!
 */
export const updateRoomCredentialsRealtime = async (tournamentId, roomId, roomPassword) => {
  try {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tourneyRef, {
      roomId: String(roomId).trim(),
      roomPassword: String(roomPassword).trim(),
      roomAssignedAt: serverTimestamp()
    });
    console.log(`[Firebase Realtime] Room credentials updated for ${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error updating room credentials:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time match lobby chat subscription
 */
export const subscribeToLobbyChatRealtime = (tournamentId, onUpdate) => {
  try {
    const chatCollection = collection(db, "tournaments", tournamentId, "lobby_chat");
    const q = query(chatCollection, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(messages);
    });

    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] Lobby chat subscription error:", err);
    return () => {};
  }
};

/**
 * Sends a real-time message to the match lobby chat
 */
export const sendLobbyMessageRealtime = async (tournamentId, msgData) => {
  try {
    const msgRef = doc(collection(db, "tournaments", tournamentId, "lobby_chat"));
    await setDoc(msgRef, {
      ...msgData,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error sending lobby message:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Saves user profile to Firestore in real-time
 */
export const saveUserProfileRealtime = async (userData) => {
  try {
    if (!userData.uid && !userData.id) return;
    const userId = String(userData.uid || userData.id).trim();
    await setDoc(doc(db, "users", userId), {
      ...userData,
      uid: String(userData.uid || userId).trim(),
      wallet: typeof userData.wallet === 'number' ? userData.wallet : (parseFloat(userData.wallet) || 0),
      lastActive: serverTimestamp()
    }, { merge: true });
    console.log(`[Firebase] User profile synced for ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error saving user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time subscription to a single user's profile and live wallet balance
 */
export const subscribeToUserProfileRealtime = (userIdOrUid, onUpdate) => {
  try {
    if (!userIdOrUid) return () => {};
    const userId = String(userIdOrUid).trim();
    const docRef = doc(db, "users", userId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`[Firebase] Live balance/profile update for ${userId}:`, data.wallet);
        onUpdate(data);
      }
    }, (err) => {
      console.warn("[Firebase] User profile subscription warning:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] subscribeToUserProfileRealtime error:", err);
    return () => {};
  }
};

/**
 * Real-time subscription to all registered players (for Admin Host panel)
 */
export const subscribeToAllUsersRealtime = (onUpdate) => {
  try {
    const usersCollection = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersList = [];
      snapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(usersList);
    }, (err) => {
      console.warn("[Firebase] All users subscription warning:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] subscribeToAllUsersRealtime error:", err);
    return () => {};
  }
};

/**
 * Credits money into a user's wallet in Firestore and updates cloud balance in real-time
 */
export const creditUserWalletRealtime = async (uidOrEmail, amount, title = 'Tournament Prize Winnings', reason = '') => {
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Please enter a valid positive prize amount.' };
    }

    const queryStr = String(uidOrEmail).trim().toLowerCase();
    const rawQuery = String(uidOrEmail).trim();
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    let targetDocId = null;
    let targetUserData = null;

    // 1. Search through all cloud Firestore users
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docIdMatch = docSnap.id.trim().toLowerCase() === queryStr;
      const uidMatch = data.uid && String(data.uid).trim().toLowerCase() === queryStr;
      const emailMatch = data.email && String(data.email).trim().toLowerCase() === queryStr;
      const nickMatch = data.nickname && String(data.nickname).trim().toLowerCase() === queryStr;

      if (docIdMatch || uidMatch || emailMatch || nickMatch) {
        targetDocId = docSnap.id;
        targetUserData = data;
      }
    });

    const dateStr = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const finalReason = reason || title || 'Tournament Prize / Winning';
    const txRecord = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'credit',
      amount: numAmount,
      title: title || 'Admin Coin Credit',
      reason: finalReason,
      date: dateStr,
      status: 'Success',
      createdAt: new Date().toISOString()
    };

    // 2. If doc exists in Firestore, atomically increment wallet & earnings and push transaction
    if (targetDocId) {
      const targetRef = doc(db, "users", targetDocId);
      await setDoc(targetRef, {
        wallet: increment(numAmount),
        "stats.earnings": increment(numAmount),
        transactions: arrayUnion(txRecord),
        lastPrize: {
          amount: numAmount,
          title: title,
          reason: finalReason,
          creditedAt: new Date().toISOString()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`[Firebase Realtime] Successfully credited ₹${numAmount} to user ${targetDocId} with reason: ${finalReason}`);
      return { success: true, user: { ...targetUserData, wallet: (targetUserData.wallet || 0) + numAmount } };
    }

    // 3. If doc does not exist yet by query, create new user doc directly with the identifier as UID
    const newDocRef = doc(db, "users", rawQuery);
    await setDoc(newDocRef, {
      uid: rawQuery,
      nickname: rawQuery,
      wallet: numAmount,
      transactions: [txRecord],
      stats: {
        matches: 1,
        wins: 1,
        kills: 0,
        earnings: numAmount
      },
      lastPrize: {
        amount: numAmount,
        title: title,
        reason: finalReason,
        creditedAt: new Date().toISOString()
      },
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { 
      success: true, 
      user: { uid: rawQuery, nickname: rawQuery, wallet: numAmount } 
    };
  } catch (error) {
    console.error("[Firebase] Error crediting user wallet:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Deducts / penalizes coins from a user's wallet in Firestore in real-time
 */
export const deductUserWalletRealtime = async (uidOrEmail, amount, reason = 'Penalty / Adjustment') => {
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Please enter a valid positive deduction amount.' };
    }

    const queryStr = String(uidOrEmail).trim().toLowerCase();
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    let targetDocId = null;
    let targetUserData = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docIdMatch = docSnap.id.trim().toLowerCase() === queryStr;
      const uidMatch = data.uid && String(data.uid).trim().toLowerCase() === queryStr;
      const emailMatch = data.email && String(data.email).trim().toLowerCase() === queryStr;
      const nickMatch = data.nickname && String(data.nickname).trim().toLowerCase() === queryStr;

      if (docIdMatch || uidMatch || emailMatch || nickMatch) {
        targetDocId = docSnap.id;
        targetUserData = data;
      }
    });

    if (targetDocId) {
      const currentWallet = typeof targetUserData.wallet === 'number' ? targetUserData.wallet : (parseFloat(targetUserData.wallet) || 0);
      const newBalance = Math.max(0, currentWallet - numAmount);
      const targetRef = doc(db, "users", targetDocId);

      const dateStr = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const finalReason = reason || 'Penalty / Balance Adjustment';
      const txRecord = {
        id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'penalty',
        amount: numAmount,
        title: `Deduction: ${finalReason}`,
        reason: finalReason,
        date: dateStr,
        status: 'Deducted',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(targetRef, {
        wallet: newBalance,
        transactions: arrayUnion(txRecord),
        lastDeduction: {
          amount: numAmount,
          reason: finalReason,
          deductedAt: new Date().toISOString()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`[Firebase Realtime] Successfully deducted ₹${numAmount} from user ${targetDocId} with reason: ${finalReason}. New Balance: ₹${newBalance}`);
      return { success: true, user: { ...targetUserData, wallet: newBalance }, newBalance };
    }

    return { success: false, error: 'Player account not found in Firebase database.' };
  } catch (error) {
    console.error("[Firebase] Error deducting user wallet:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Resets a user's password in Firestore after verifying their UID/Email and Phone
 */
export const resetUserPasswordRealtime = async (identifier, verificationPhone, newPassword) => {
  try {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    const queryStr = String(identifier).trim().toLowerCase();
    const phoneQuery = verificationPhone ? String(verificationPhone).replace(/[^0-9]/g, '') : '';
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    let targetDocId = null;
    let targetUserData = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docIdMatch = docSnap.id.trim().toLowerCase() === queryStr;
      const uidMatch = data.uid && String(data.uid).trim().toLowerCase() === queryStr;
      const emailMatch = data.email && String(data.email).trim().toLowerCase() === queryStr;
      
      if (docIdMatch || uidMatch || emailMatch) {
        targetDocId = docSnap.id;
        targetUserData = data;
      }
    });

    if (!targetDocId) {
      // Check localStorage fallback
      const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const foundLocal = localUsers.find(u => 
        u.uid?.trim().toLowerCase() === queryStr || 
        u.email?.trim().toLowerCase() === queryStr
      );
      if (foundLocal) {
        targetUserData = foundLocal;
        targetDocId = String(foundLocal.uid || foundLocal.id).trim();
      }
    }

    if (!targetUserData && !targetDocId) {
      return { success: false, error: 'No account found with this Free Fire UID or Email.' };
    }

    // Verify phone number (if provided)
    if (targetUserData && targetUserData.phone && phoneQuery) {
      const userPhoneClean = String(targetUserData.phone).replace(/[^0-9]/g, '');
      if (!userPhoneClean.includes(phoneQuery) && !phoneQuery.includes(userPhoneClean.slice(-4))) {
        return { success: false, error: 'Registered phone number does not match this account.' };
      }
    }

    // Update password in Firestore
    const finalDocId = targetDocId || String(targetUserData.uid || identifier).trim();
    const targetRef = doc(db, "users", finalDocId);
    await setDoc(targetRef, {
      password: newPassword,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Also update local cache
    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const updated = existingUsers.map(u => {
      if (u.uid === queryStr || u.email?.toLowerCase() === queryStr) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    localStorage.setItem('zest_registered_users', JSON.stringify(updated));

    return { 
      success: true, 
      user: { ...(targetUserData || {}), password: newPassword, uid: targetUserData?.uid || finalDocId } 
    };
  } catch (err) {
    console.error("[Firebase] Error resetting password:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Real-time subscription to admin broadcast notifications (Bell 🔔)
 */
export const subscribeToNotificationsRealtime = (onUpdate) => {
  try {
    const notifsCollection = collection(db, "notifications");
    const q = query(notifsCollection, orderBy("createdAt", "desc"), limit(30));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(list);
    }, (err) => {
      console.warn("[Firebase] Notifications subscription warning:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] subscribeToNotificationsRealtime error:", err);
    return () => {};
  }
};

/**
 * Sends a real-time broadcast notification to all players (Bell 🔔)
 */
export const sendNotificationRealtime = async (notificationData) => {
  try {
    const notifId = `notif_${Date.now()}`;
    const notifRef = doc(db, "notifications", notifId);
    await setDoc(notifRef, {
      id: notifId,
      title: notificationData.title || 'Announcement',
      message: notificationData.message || '',
      type: notificationData.type || 'info', // 'alert' | 'match' | 'prize' | 'info'
      createdAt: serverTimestamp(),
      createdTimeStr: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    });
    console.log(`[Firebase Realtime] Broadcast notification sent:`, notifId);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Deletes a broadcast notification from Firestore
 */
export const deleteNotificationRealtime = async (notificationId) => {
  try {
    const notifRef = doc(db, "notifications", notificationId);
    await deleteDoc(notifRef);
    console.log(`[Firebase Realtime] Notification deleted:`, notificationId);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error deleting notification:", error);
    return { success: false, error: error.message };
  }
};
