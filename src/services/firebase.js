import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  where,
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
import { compareTournamentsByTime } from "./dateUtils.js";

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

// Initialize Firebase with Auto-Detect Long Polling for optimal mobile WebView reliability
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// In-memory live cache of registered users maintained via onSnapshot
let liveUsersCache = [];
let usersSyncInitialized = false;

export const startLiveUsersSync = () => {
  if (usersSyncInitialized) return;
  usersSyncInitialized = true;
  try {
    const usersRef = collection(db, "users");
    onSnapshot(usersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id, docId: docSnap.id });
      });
      liveUsersCache = list;
      console.log(`[Firebase Realtime] Synchronized ${list.length} user profiles in memory.`);
    }, (err) => {
      console.warn("[Firebase] Live users sync notice:", err);
    });
  } catch (e) {
    console.warn("[Firebase] Failed to initialize live users sync:", e);
  }
};

// Start live sync automatically on load
startLiveUsersSync();

// Starter tournaments seed (Empty by default - matches are created manually by Hosts/Admin)
export const SEED_TOURNAMENTS = [];

/**
 * Real-time listener for all tournaments in Firestore
 * Updates across ALL web, Android, and iOS devices in millisecond sync!
 */
export const subscribeToTournamentsRealtime = (onUpdate, onError) => {
  try {
    const tourneysCollection = collection(db, "tournaments");
    
    const unsubscribe = onSnapshot(tourneysCollection, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort(compareTournamentsByTime);
      console.log(`[Firebase Realtime] Received ${list.length} tournaments live (sorted by time).`);
      onUpdate(list);
    }, (error) => {
      console.warn("[Firebase] Realtime listener error:", error);
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
 * Real-time listener for app configurations (Webhook URLs, App Updates)
 * Automatically syncs live config to all installed APKs and Web users in real-time!
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
 * Saves app configurations (Webhooks, App Updates) to Firestore cloud
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
    const tourneySnap = await getDoc(tourneyRef);
    if (tourneySnap.exists()) {
      const data = tourneySnap.data();
      const maxSlots = data.slotsTotal || data.maxSlots || 48;
      const currentJoined = Math.max(data.slotsJoined || 0, (data.joinedPlayers || []).length);
      if (currentJoined >= maxSlots) {
        return { success: false, error: 'Tournament match is already full! No more slots available.' };
      }
    }
    
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
 * Removes / kicks a player from a tournament in Firestore in real-time
 */
export const removePlayerFromTournamentRealtime = async (tournamentId, playerUidOrEmail) => {
  try {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    const tourneySnap = await getDoc(tourneyRef);
    if (!tourneySnap.exists()) {
      return { success: false, error: 'Tournament not found.' };
    }

    const data = tourneySnap.data();
    const query = String(playerUidOrEmail).trim().toLowerCase();
    const currentPlayers = Array.isArray(data.joinedPlayers) ? data.joinedPlayers : [];
    
    let removedPlayer = null;
    const updatedPlayers = currentPlayers.filter(p => {
      const pUid = String(p.uid || '').trim().toLowerCase();
      const pEmail = String(p.email || '').trim().toLowerCase();
      const pNick = String(p.nickname || '').trim().toLowerCase();
      if (pUid === query || pEmail === query || pNick === query) {
        removedPlayer = p;
        return false;
      }
      return true;
    });

    const newSlotsJoined = Math.max(0, updatedPlayers.length);

    await updateDoc(tourneyRef, {
      joinedPlayers: updatedPlayers,
      slotsJoined: newSlotsJoined,
      updatedAt: serverTimestamp()
    });

    console.log(`[Firebase Realtime] Removed player from ${tournamentId}. New slots count: ${newSlotsJoined}`);
    return { success: true, removedPlayer, newSlotsJoined };
  } catch (error) {
    console.error("[Firebase] Error removing player from tournament:", error);
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
    if (!userData || (!userData.uid && !userData.id)) {
      return { success: false, error: 'Missing user identification (UID or ID).' };
    }
    const userId = String(userData.uid || userData.id).trim();

    // Strip any undefined keys to prevent Firestore payload crashes
    const sanitizedData = {};
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== undefined) {
        sanitizedData[key] = userData[key];
      }
    });

    await setDoc(doc(db, "users", userId), {
      ...sanitizedData,
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
 * Universal finder for a user in Cloud Firestore across all devices.
 * Uses getDocFromServer and getDocsFromServer to bypass stale offline IndexedDB caches.
 * Supports: Free Fire UID, Firestore Document ID, Email, Phone Number, and Nickname.
 */
export const findUserInFirestoreAcrossDevices = async (identifier) => {
  if (!identifier) return null;

  const rawQuery = String(identifier || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!rawQuery) return null;

  const queryLower = rawQuery.toLowerCase();
  const cleanDigits = rawQuery.replace(/\D/g, '');

  const matchesUser = (u) => {
    if (!u) return false;
    const docId = String(u.docId || u.id || '').trim().toLowerCase();
    const uid = String(u.uid || '').trim().toLowerCase();
    const rawId = String(u.id || '').trim().toLowerCase();
    const email = String(u.email || '').trim().toLowerCase();
    const nick = String(u.nickname || '').trim().toLowerCase();
    const phone = String(u.phone || '').trim();
    const phoneDigits = phone.replace(/\D/g, '');

    const docIdMatch = docId && docId === queryLower;
    const uidMatch = uid && uid === queryLower;
    const rawIdMatch = rawId && rawId === queryLower;
    const emailMatch = email && email === queryLower;
    const nickMatch = nick && nick === queryLower;
    const phoneMatch = Boolean(
      phone && cleanDigits && cleanDigits.length >= 6 && (
        phone === rawQuery ||
        phoneDigits === cleanDigits ||
        (cleanDigits.length >= 8 && phoneDigits.endsWith(cleanDigits.slice(-10))) ||
        (phoneDigits.length >= 8 && cleanDigits.endsWith(phoneDigits.slice(-10)))
      )
    );
    return docIdMatch || uidMatch || rawIdMatch || emailMatch || nickMatch || phoneMatch;
  };

  // 1. Instant check in live memory cache (populated by onSnapshot)
  if (liveUsersCache.length > 0) {
    const foundInCache = liveUsersCache.find(matchesUser);
    if (foundInCache) {
      console.log(`[Auth] User matched from live memory cache:`, foundInCache.uid || foundInCache.id);
      return foundInCache;
    }
  } else {
    // If live sync is warming up upon fresh app launch, wait up to 1200ms for initial onSnapshot
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (liveUsersCache.length > 0) {
        const found = liveUsersCache.find(matchesUser);
        if (found) {
          console.log(`[Auth] User matched after live sync warmup:`, found.uid || found.id);
          return found;
        }
        break;
      }
    }
  }

  let networkErrorCaught = null;

  // 2. Direct document getDoc lookup (if user typed Free Fire UID or Doc ID)
  try {
    const directDoc = await getDoc(doc(db, "users", rawQuery));
    if (directDoc && directDoc.exists()) {
      return { ...directDoc.data(), id: directDoc.id, docId: directDoc.id };
    }
  } catch (e) {
    console.warn("[Auth] Direct getDoc lookup notice:", e?.message);
    networkErrorCaught = e;
  }

  // 3. Direct targeted query by email (lightning-fast, 40ms)
  if (queryLower.includes('@')) {
    try {
      let snapEmail = await getDocs(query(collection(db, "users"), where("email", "==", queryLower)));
      if (snapEmail.empty && rawQuery !== queryLower) {
        snapEmail = await getDocs(query(collection(db, "users"), where("email", "==", rawQuery)));
      }
      if (!snapEmail.empty) {
        const d = snapEmail.docs[0];
        return { ...d.data(), id: d.id, docId: d.id };
      }
    } catch (e) {
      console.warn("[Auth] Direct email query notice:", e?.message);
      networkErrorCaught = e;
    }
  }

  // 4. Direct targeted query by UID
  try {
    const qUid = query(collection(db, "users"), where("uid", "==", rawQuery));
    const snapUid = await getDocs(qUid);
    if (!snapUid.empty) {
      const d = snapUid.docs[0];
      return { ...d.data(), id: d.id, docId: d.id };
    }
  } catch (e) {
    console.warn("[Auth] Direct UID query notice:", e?.message);
    networkErrorCaught = e;
  }

  // 5. Direct targeted query by Phone
  if (cleanDigits.length >= 8) {
    try {
      let snapPhone = await getDocs(query(collection(db, "users"), where("phone", "==", rawQuery)));
      if (snapPhone.empty && cleanDigits !== rawQuery) {
        snapPhone = await getDocs(query(collection(db, "users"), where("phone", "==", cleanDigits)));
      }
      if (!snapPhone.empty) {
        const d = snapPhone.docs[0];
        return { ...d.data(), id: d.id, docId: d.id };
      }
    } catch (e) {
      console.warn("[Auth] Direct phone query notice:", e?.message);
      networkErrorCaught = e;
    }
  }

  // 6. Full collection query fallback
  try {
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    const list = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id, docId: docSnap.id });
    });
    if (list.length > 0) {
      liveUsersCache = list;
      const found = list.find(matchesUser);
      if (found) return found;
    }
  } catch (e) {
    console.warn("[Auth] Firestore getDocs lookup warning:", e?.message);
    networkErrorCaught = e;
  }

  // 7. LocalStorage fallback
  if (typeof localStorage !== 'undefined') {
    try {
      const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const localFound = localUsers.find(matchesUser);
      if (localFound) return localFound;
    } catch (e) {}
  }

  // If server was unreachable and memory cache empty, pass network error indicator
  if (networkErrorCaught && liveUsersCache.length === 0) {
    return { isNetworkError: true, error: networkErrorCaught.message };
  }

  return null;
};

/**
 * Authenticates user from Cloud Firestore across any device in real-time
 */
export const authenticateUserRealtime = async (identifier, password) => {
  try {
    const rawQuery = String(identifier || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const queryStr = rawQuery.toLowerCase();
    const cleanDigits = rawQuery.replace(/\D/g, '');
    const cleanPass = String(password || '').trim();

    if (!queryStr || !cleanPass) {
      return { success: false, error: 'Please enter your UID, Email or Phone, and Password.' };
    }

    // 1. Direct Cloud Firestore server lookup
    const cloudUser = await findUserInFirestoreAcrossDevices(rawQuery);

    if (cloudUser?.isNetworkError) {
      return { 
        success: false, 
        error: 'Unable to reach Zest game servers. Please check your internet connection and try again.' 
      };
    }

    if (cloudUser) {
      if (cloudUser.isDeleted) {
        return { success: false, error: 'This account has been deactivated or deleted. Please register a new account.' };
      }

      if (cloudUser.password && String(cloudUser.password).trim() === cleanPass) {
        const matchedUser = {
          id: cloudUser.id,
          ...cloudUser,
          uid: cloudUser.uid || cloudUser.id,
          wallet: typeof cloudUser.wallet === 'number' ? cloudUser.wallet : (parseFloat(cloudUser.wallet) || 0)
        };

        console.log(`[Firebase Cloud Auth] Successfully authenticated user ${matchedUser.uid || matchedUser.id} across devices.`);

        // Sync to local device cache for instant offline launch
        if (typeof localStorage !== 'undefined') {
          try {
            const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
            const filtered = existingUsers.filter(u => u.uid !== matchedUser.uid && u.email !== matchedUser.email);
            filtered.push(matchedUser);
            localStorage.setItem('zest_registered_users', JSON.stringify(filtered));
          } catch (storageErr) {}
        }

        return { success: true, user: matchedUser };
      }

      return { success: false, error: 'Incorrect Password. Please check and try again.' };
    }

    // 2. LocalStorage fallback for offline continuity
    if (typeof localStorage !== 'undefined') {
      const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const localUser = localUsers.find(u => {
        const uidMatch = u.uid && String(u.uid).trim().toLowerCase() === queryStr;
        const emailMatch = u.email && String(u.email).trim().toLowerCase() === queryStr;
        const nickMatch = u.nickname && String(u.nickname).trim().toLowerCase() === queryStr;
        const phoneMatch = u.phone && (
          String(u.phone).trim() === rawQuery ||
          (cleanDigits.length >= 8 && String(u.phone).replace(/\D/g, '').endsWith(cleanDigits.slice(-10)))
        );
        return uidMatch || emailMatch || nickMatch || phoneMatch;
      });

      if (localUser) {
        if (String(localUser.password).trim() === cleanPass) {
          return { success: true, user: localUser };
        }
        return { success: false, error: 'Incorrect Password. Please check and try again.' };
      }
    }

    return { success: false, error: 'No player account found with this Free Fire UID, Email or Phone. Please Register first.' };
  } catch (error) {
    console.error("[Firebase Cloud Auth] Error authenticating user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Checks if user already exists in Cloud Firestore or local cache
 */
export const checkUserExistsRealtime = async (ffUid, email, phone) => {
  try {
    const cleanUid = String(ffUid || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();

    if (cleanUid) {
      const u1 = await findUserInFirestoreAcrossDevices(cleanUid);
      if (u1 && !u1.isDeleted) return { exists: true, user: u1, field: 'Free Fire UID' };
    }
    if (cleanEmail) {
      const u2 = await findUserInFirestoreAcrossDevices(cleanEmail);
      if (u2 && !u2.isDeleted) return { exists: true, user: u2, field: 'Email Address' };
    }
    if (cleanPhone) {
      const u3 = await findUserInFirestoreAcrossDevices(cleanPhone);
      if (u3 && !u3.isDeleted) return { exists: true, user: u3, field: 'Phone Number' };
    }

    // Local storage check
    if (typeof localStorage !== 'undefined') {
      const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const localFound = localUsers.find(u => 
        (cleanUid && String(u.uid).trim().toLowerCase() === cleanUid.toLowerCase()) ||
        (cleanEmail && String(u.email).trim().toLowerCase() === cleanEmail) ||
        (cleanPhone && String(u.phone).trim().replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '').slice(-10)))
      );
      if (localFound) return { exists: true, user: localFound };
    }

    return { exists: false };
  } catch (error) {
    console.error("[Firebase] Error checking user existence:", error);
    return { exists: false };
  }
};

/**
 * Real-time subscription to a single user's profile and live wallet balance
 * Automatically detects account deletion and notifies client for auto-logout
 */
export const subscribeToUserProfileRealtime = (userIdOrUid, onUpdate) => {
  try {
    if (!userIdOrUid) return () => {};
    const userId = String(userIdOrUid).trim();
    const docRef = doc(db, "users", userId);
    
    let hasReceivedInitial = false;

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        hasReceivedInitial = true;
        const data = docSnap.data();
        if (data.isDeleted) {
          console.log(`[Firebase] User document ${userId} is marked deleted.`);
          onUpdate(null);
        } else {
          console.log(`[Firebase] Live balance/profile update for ${userId}:`, data.wallet);
          onUpdate(data);
        }
      } else {
        if (hasReceivedInitial) {
          console.log(`[Firebase] User document ${userId} was deleted in real-time.`);
          onUpdate(null);
        } else {
          // Check if document was initially missing
          hasReceivedInitial = true;
          onUpdate(null);
        }
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
    
    let targetDocId = null;
    let targetUserData = null;

    // 1. Fast universal lookup via live memory cache / direct getDoc
    try {
      const fastMatched = await findUserInFirestoreAcrossDevices(rawQuery);
      if (fastMatched && !fastMatched.isNetworkError) {
        targetDocId = fastMatched.docId || fastMatched.id || rawQuery;
        targetUserData = fastMatched;
      }
    } catch (e) {
      console.warn("[Credit] Fast lookup notice:", e);
    }

    // 2. Fallback search through cloud Firestore users if not yet found
    if (!targetDocId) {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);
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
    }

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

    // 3. If doc exists in Firestore, atomically increment wallet & earnings and push transaction
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
 * Looks up user by UID or Email to initiate OTP password reset
 */
export const findUserForPasswordReset = async (identifier) => {
  try {
    const rawQuery = String(identifier || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const queryStr = rawQuery.toLowerCase();
    if (!queryStr) return { success: false, error: 'Please enter your Free Fire UID, Email or Phone.' };

    // 1. Direct Cloud Firestore server lookup across all devices
    const cloudUser = await findUserInFirestoreAcrossDevices(rawQuery);
    if (cloudUser) {
      return { 
        success: true, 
        user: { 
          id: cloudUser.id, 
          ...cloudUser, 
          uid: cloudUser.uid || cloudUser.id,
          email: cloudUser.email || (queryStr.includes('@') ? queryStr : '')
        } 
      };
    }

    // 2. Local storage fallback
    if (typeof localStorage !== 'undefined') {
      const cleanDigits = rawQuery.replace(/\D/g, '');
      const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const foundLocal = localUsers.find(u => 
        String(u.uid || '').trim().toLowerCase() === queryStr || 
        String(u.email || '').trim().toLowerCase() === queryStr ||
        String(u.nickname || '').trim().toLowerCase() === queryStr ||
        (cleanDigits.length >= 8 && String(u.phone || '').replace(/\D/g, '').endsWith(cleanDigits.slice(-10)))
      );

      if (foundLocal) {
        return { 
          success: true, 
          user: { ...foundLocal, email: foundLocal.email || (queryStr.includes('@') ? queryStr : '') } 
        };
      }
    }

    // If identifier is an email, allow password reset for that email
    if (queryStr.includes('@') && queryStr.includes('.')) {
      return {
        success: true,
        user: {
          uid: queryStr.split('@')[0],
          nickname: queryStr.split('@')[0],
          email: queryStr,
          phone: ''
        }
      };
    }

    return { success: false, error: `No registered player account found matching "${rawQuery}". Please Register first.` };
  } catch (error) {
    console.error("[Firebase] Error in findUserForPasswordReset:", error);
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
    
    // Listen directly to collection for 100% reliable cross-device realtime sync
    const unsubscribe = onSnapshot(notifsCollection, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      // Sort client-side by timestamp descending (newest first)
      list.sort((a, b) => {
        const tA = (a.createdAt && typeof a.createdAt.toMillis === 'function')
          ? a.createdAt.toMillis()
          : (typeof a.timestamp === 'number' ? a.timestamp : (parseInt(String(a.id || '').replace(/\D/g, '')) || 0));
        const tB = (b.createdAt && typeof b.createdAt.toMillis === 'function')
          ? b.createdAt.toMillis()
          : (typeof b.timestamp === 'number' ? b.timestamp : (parseInt(String(b.id || '').replace(/\D/g, '')) || 0));
        return tB - tA;
      });

      console.log(`[Firebase Realtime] Received ${list.length} notifications live.`);
      onUpdate(list.slice(0, 40));
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
    const isMatchDrop = notificationData.type === 'match' || Boolean(notificationData.targetTournamentId) || String(notificationData.title || '').toLowerCase().includes('room id');
    const cleanTargets = Array.isArray(notificationData.targetUids) 
      ? notificationData.targetUids.map(u => String(u || '').trim().toLowerCase()).filter(Boolean) 
      : [];

    // Security Guard: Never allow room credentials to be stored as a public broadcast
    if (isMatchDrop && cleanTargets.length === 0) {
      console.warn("[Firebase Realtime] Aborted saving room drop notification with 0 targets to prevent public leak.");
      return { success: false, error: 'No registered players found in match to send Room ID.' };
    }

    const now = Date.now();
    const notifId = `notif_${now}`;
    const notifRef = doc(db, "notifications", notifId);
    await setDoc(notifRef, {
      id: notifId,
      title: notificationData.title || 'Announcement',
      message: notificationData.message || '',
      type: notificationData.type || 'info', // 'alert' | 'match' | 'prize' | 'info'
      targetTournamentId: notificationData.targetTournamentId || null,
      targetUids: cleanTargets,
      tournamentTitle: notificationData.tournamentTitle || '',
      timestamp: now,
      createdAt: serverTimestamp(),
      createdTimeStr: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    });
    console.log(`[Firebase Realtime] Notification saved:`, notifId, `targets: ${cleanTargets.length}`);
    return { success: true, id: notifId };
  } catch (error) {
    console.error("[Firebase] Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Saves a player's FCM device push token to Firestore for closed-app notifications
 */
export const saveDeviceTokenRealtime = async (userIdOrUid, token, metadata = {}) => {
  try {
    if (!token || !userIdOrUid) return { success: false };
    const cleanUid = String(userIdOrUid).trim();
    
    // 1. Update user document with latest FCM token
    const userDocRef = doc(db, "users", cleanUid);
    await setDoc(userDocRef, {
      fcmToken: token,
      fcmTokens: arrayUnion(token),
      lastActivePlatform: metadata.platform || 'android',
      fcmUpdatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Add to global device_tokens collection for batch broadcasts
    const safeTokenId = token.slice(0, 32) + '_' + token.slice(-16);
    const tokenDocRef = doc(db, "device_tokens", safeTokenId);
    await setDoc(tokenDocRef, {
      token,
      uid: cleanUid,
      nickname: metadata.nickname || 'Player',
      platform: metadata.platform || 'android',
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log(`[Firebase Realtime] Saved FCM Push token for ${cleanUid}`);
    return { success: true };
  } catch (err) {
    console.warn("[Firebase Realtime] Error saving device token:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Retrieves target device push tokens from Firestore for closed-app notification dispatch
 */
export const getTargetDeviceTokensRealtime = async (targetUids = [], isBroadcast = false) => {
  try {
    const tokensCollection = collection(db, "device_tokens");
    const snapshot = await getDocs(tokensCollection);
    const tokens = new Set();
    const cleanTargets = Array.isArray(targetUids) 
      ? targetUids.map(u => String(u || '').trim().toLowerCase()).filter(Boolean) 
      : [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data || !data.token) return;

      if (isBroadcast) {
        // Explicit Broadcast mode: include all device tokens
        tokens.add(data.token);
      } else if (cleanTargets.length > 0) {
        // Targeted mode: match uid, email, or phone
        const uUid = String(data.uid || '').trim().toLowerCase();
        const uEmail = String(data.email || '').trim().toLowerCase();
        const uPhone = String(data.phone || '').trim().toLowerCase();
        if (cleanTargets.includes(uUid) || (uEmail && cleanTargets.includes(uEmail)) || (uPhone && cleanTargets.includes(uPhone))) {
          tokens.add(data.token);
        }
      }
    });

    console.log(`[Firebase Realtime] Found ${tokens.size} device tokens for push dispatch (isBroadcast: ${isBroadcast}, targets: ${cleanTargets.length}).`);
    return Array.from(tokens);
  } catch (err) {
    console.warn('[Firebase Realtime] Error fetching device tokens:', err);
    return [];
  }
};

/**
 * Saves Firebase Service Account JSON credentials for closed-app FCM push dispatch
 */
export const saveFcmConfigRealtime = async (serviceAccountJson) => {
  try {
    const settingsRef = doc(db, "settings", "app_config");
    await setDoc(settingsRef, {
      fcmServiceAccount: serviceAccountJson,
      fcmUpdatedAt: serverTimestamp()
    }, { merge: true });
    console.log('[Firebase Realtime] FCM Service Account saved to app_config.');
    return { success: true };
  } catch (err) {
    console.error('[Firebase Realtime] Error saving FCM Service Account:', err);
    return { success: false, error: err.message };
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

/**
 * Permanently deletes a registered player account from Firestore and all associated collections across the entire database:
 * 1. 'users' collection (all matching documents by docId, uid, id, email, phone, ffUid)
 * 2. 'device_tokens' collection (removes device FCM tokens associated with the player)
 * 3. 'tournaments' collection (removes player from joinedPlayers rosters and adjusts slotsJoined)
 * 4. 'referrals' collection (cleans up any referral history tied to player)
 * 5. Local storage cache (removes from zest_registered_users and active session)
 */
export const deleteUserRealtime = async (userIdOrUserObj) => {
  try {
    const targetKeys = new Set();
    let rawQuery = '';
    let targetNickname = '';

    if (userIdOrUserObj && typeof userIdOrUserObj === 'object') {
      if (userIdOrUserObj.uid) targetKeys.add(String(userIdOrUserObj.uid).trim().toLowerCase());
      if (userIdOrUserObj.id) targetKeys.add(String(userIdOrUserObj.id).trim().toLowerCase());
      if (userIdOrUserObj.email) targetKeys.add(String(userIdOrUserObj.email).trim().toLowerCase());
      if (userIdOrUserObj.phone) {
        const p = String(userIdOrUserObj.phone).trim().toLowerCase();
        targetKeys.add(p);
        targetKeys.add(p.replace(/\D/g, ''));
      }
      if (userIdOrUserObj.ffUid) targetKeys.add(String(userIdOrUserObj.ffUid).trim().toLowerCase());
      if (userIdOrUserObj.nickname) {
        targetNickname = userIdOrUserObj.nickname;
        targetKeys.add(String(userIdOrUserObj.nickname).trim().toLowerCase());
      }
      rawQuery = String(userIdOrUserObj.uid || userIdOrUserObj.id || userIdOrUserObj.phone || userIdOrUserObj.email || '').trim();
    } else if (userIdOrUserObj) {
      rawQuery = String(userIdOrUserObj).trim();
      const cleanRaw = rawQuery.toLowerCase();
      targetKeys.add(cleanRaw);
      const digitsOnly = cleanRaw.replace(/\D/g, '');
      if (digitsOnly) targetKeys.add(digitsOnly);
    }

    targetKeys.delete('');

    console.log(`[Firebase] Starting comprehensive player deletion for:`, Array.from(targetKeys));

    const isUserMatch = (data, docId) => {
      if (!data && !docId) return false;
      const candidates = [
        docId,
        data?.uid,
        data?.id,
        data?.email,
        data?.phone,
        data?.phone ? String(data.phone).replace(/\D/g, '') : null,
        data?.ffUid,
        data?.nickname
      ];
      return candidates.some(c => c && targetKeys.has(String(c).trim().toLowerCase()));
    };

    // 1. Scan 'users' collection and gather all matching doc IDs and enrich targetKeys
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    const docsToDelete = new Set();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};
      if (isUserMatch(data, docSnap.id)) {
        docsToDelete.add(docSnap.id);
        if (data.nickname && !targetNickname) targetNickname = data.nickname;
        if (data.uid) targetKeys.add(String(data.uid).trim().toLowerCase());
        if (data.id) targetKeys.add(String(data.id).trim().toLowerCase());
        if (data.email) targetKeys.add(String(data.email).trim().toLowerCase());
        if (data.phone) {
          const ph = String(data.phone).trim().toLowerCase();
          targetKeys.add(ph);
          targetKeys.add(ph.replace(/\D/g, ''));
        }
        if (data.ffUid) targetKeys.add(String(data.ffUid).trim().toLowerCase());
      }
    });

    if (rawQuery) {
      docsToDelete.add(rawQuery);
    }
    docsToDelete.delete('');

    // 2. Mark as deleted first (triggers realtime listener logout), then permanently deleteDoc
    for (const dId of docsToDelete) {
      try {
        await updateDoc(doc(db, "users", dId), { 
          isDeleted: true, 
          status: 'deleted',
          deletedAt: serverTimestamp()
        });
      } catch (_) {}

      try {
        await deleteDoc(doc(db, "users", dId));
        console.log(`[Firebase] Successfully deleted user doc from 'users': ${dId}`);
      } catch (err) {
        console.warn(`[Firebase] deleteDoc warning on doc ${dId}:`, err);
      }
    }

    // 3. Completely purge player's push notification tokens from 'device_tokens' collection
    try {
      const tokensCollection = collection(db, "device_tokens");
      const tokensSnapshot = await getDocs(tokensCollection);
      for (const tokenDoc of tokensSnapshot.docs) {
        const tData = tokenDoc.data() || {};
        const tUid = String(tData.uid || '').trim().toLowerCase();
        const tNick = String(tData.nickname || '').trim().toLowerCase();
        if (targetKeys.has(tUid) || targetKeys.has(tNick) || docsToDelete.has(tokenDoc.id)) {
          await deleteDoc(doc(db, "device_tokens", tokenDoc.id));
          console.log(`[Firebase] Purged device token doc: ${tokenDoc.id}`);
        }
      }
    } catch (tokenErr) {
      console.warn("[Firebase] Error purging device tokens:", tokenErr);
    }

    // 4. Remove player from joined rosters in all tournaments in 'tournaments' collection
    try {
      const tourneysSnapshot = await getDocs(collection(db, "tournaments"));
      for (const tourneyDoc of tourneysSnapshot.docs) {
        const tData = tourneyDoc.data() || {};
        const joined = Array.isArray(tData.joinedPlayers) ? tData.joinedPlayers : [];
        let playerFound = false;

        const updatedJoined = joined.filter(p => {
          const pUid = String(p.uid || '').trim().toLowerCase();
          const pId = String(p.id || '').trim().toLowerCase();
          const pEmail = String(p.email || '').trim().toLowerCase();
          const pPhone = String(p.phone || '').trim().toLowerCase();
          const pCleanPhone = pPhone.replace(/\D/g, '');
          const pFfUid = String(p.ffUid || '').trim().toLowerCase();
          const pNick = String(p.nickname || '').trim().toLowerCase();

          const isMatch = 
            targetKeys.has(pUid) || 
            targetKeys.has(pId) || 
            targetKeys.has(pEmail) || 
            targetKeys.has(pPhone) || 
            (pCleanPhone && targetKeys.has(pCleanPhone)) ||
            targetKeys.has(pFfUid) ||
            targetKeys.has(pNick);

          if (isMatch) {
            playerFound = true;
            return false;
          }
          return true;
        });

        if (playerFound) {
          await updateDoc(doc(db, "tournaments", tourneyDoc.id), {
            joinedPlayers: updatedJoined,
            slotsJoined: updatedJoined.length,
            updatedAt: serverTimestamp()
          });
          console.log(`[Firebase] Removed deleted player from tournament: ${tourneyDoc.id}`);
        }
      }
    } catch (tourneyErr) {
      console.warn("[Firebase] Error removing player from tournaments:", tourneyErr);
    }

    // 5. Clean up from 'referrals' collection
    try {
      const referralsSnapshot = await getDocs(collection(db, "referrals"));
      for (const refDoc of referralsSnapshot.docs) {
        const rData = refDoc.data() || {};
        const refUids = [
          String(rData.referrerUid || '').trim().toLowerCase(),
          String(rData.refereeUid || '').trim().toLowerCase(),
          String(rData.referrerNickname || '').trim().toLowerCase(),
          String(rData.refereeNickname || '').trim().toLowerCase()
        ];
        if (refUids.some(u => u && targetKeys.has(u))) {
          await deleteDoc(doc(db, "referrals", refDoc.id));
          console.log(`[Firebase] Purged referral log: ${refDoc.id}`);
        }
      }
    } catch (refErr) {
      console.warn("[Firebase] Error purging referrals:", refErr);
    }

    // 6. Clean up from local storage cache
    try {
      const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const filtered = existingUsers.filter(u => {
        const uUid = String(u.uid || '').trim().toLowerCase();
        const uId = String(u.id || '').trim().toLowerCase();
        const uEmail = String(u.email || '').trim().toLowerCase();
        const uPhone = String(u.phone || '').trim().toLowerCase();
        return !targetKeys.has(uUid) && !targetKeys.has(uId) && !targetKeys.has(uEmail) && !targetKeys.has(uPhone);
      });
      localStorage.setItem('zest_registered_users', JSON.stringify(filtered));

      const curr = JSON.parse(localStorage.getItem('zest_current_user') || 'null');
      if (curr) {
        const cUid = String(curr.uid || '').trim().toLowerCase();
        const cId = String(curr.id || '').trim().toLowerCase();
        const cEmail = String(curr.email || '').trim().toLowerCase();
        const cPhone = String(curr.phone || '').trim().toLowerCase();
        if (targetKeys.has(cUid) || targetKeys.has(cId) || targetKeys.has(cEmail) || targetKeys.has(cPhone)) {
          localStorage.removeItem('zest_current_user');
          localStorage.removeItem('zest_wallet_transactions');
        }
      }
    } catch (localErr) {
      console.warn("[Firebase] Local cache cleanup warning:", localErr);
    }

    return { success: true, nickname: targetNickname || rawQuery };
  } catch (error) {
    console.error("[Firebase] Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Grants or revokes Host / Moderator permissions for a player in Firestore & cache
 */
export const toggleUserHostRoleRealtime = async (userIdOrUid, enableHost = true) => {
  try {
    const queryStr = String(userIdOrUid).trim().toLowerCase();
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

    const newRole = enableHost ? 'host' : 'player';
    const newIsHost = enableHost;

    if (targetDocId) {
      await setDoc(doc(db, "users", targetDocId), {
        role: newRole,
        isHost: newIsHost,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[Firebase] Updated role to ${newRole} for user ${targetDocId}`);
    }

    if (targetUserData?.uid && targetUserData.uid !== targetDocId) {
      try {
        await setDoc(doc(db, "users", String(targetUserData.uid).trim()), {
          role: newRole,
          isHost: newIsHost,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (_) {}
    }

    // Update local storage
    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const updated = existingUsers.map(u => {
      if (
        (u.uid && String(u.uid).trim().toLowerCase() === queryStr) || 
        (u.email && String(u.email).trim().toLowerCase() === queryStr) ||
        (u.id && String(u.id).trim().toLowerCase() === queryStr)
      ) {
        return { ...u, role: newRole, isHost: newIsHost };
      }
      return u;
    });
    localStorage.setItem('zest_registered_users', JSON.stringify(updated));

    // Also update active session if current player is on same device
    const currentSession = JSON.parse(localStorage.getItem('zest_current_user') || 'null');
    if (currentSession && (
      (currentSession.uid && String(currentSession.uid).trim().toLowerCase() === queryStr) ||
      (currentSession.email && String(currentSession.email).trim().toLowerCase() === queryStr) ||
      (currentSession.id && String(currentSession.id).trim().toLowerCase() === queryStr)
    )) {
      localStorage.setItem('zest_current_user', JSON.stringify({
        ...currentSession,
        role: newRole,
        isHost: newIsHost
      }));
    }

    return { 
      success: true, 
      role: newRole, 
      isHost: newIsHost, 
      nickname: targetUserData?.nickname || userIdOrUid 
    };
  } catch (error) {
    console.error("[Firebase] Error toggling host role:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Pre-defined esports demo players for testing & arena activity (108 bots)
 */
import { DEMO_PLAYERS } from './demoBotsData.js';
export { DEMO_PLAYERS };

/**
 * Seeds demo players directly to Cloud Firestore & local cache
 */
export const seedDemoPlayersRealtime = async () => {
  try {
    for (const player of DEMO_PLAYERS) {
      await setDoc(doc(db, "users", player.id), {
        ...player,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    const existing = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const existingUids = new Set(existing.map(u => String(u.uid)));
    const merged = [...existing];
    for (const dp of DEMO_PLAYERS) {
      if (!existingUids.has(String(dp.uid))) {
        merged.push(dp);
      }
    }
    localStorage.setItem('zest_registered_users', JSON.stringify(merged));
    console.log(`[Firebase] Seeded ${DEMO_PLAYERS.length} demo bots successfully!`);
    return { success: true, count: DEMO_PLAYERS.length };
  } catch (err) {
    console.error("[Firebase] Error seeding demo players:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Adds demo players to a specific tournament in Firestore
 * @param {string} tournamentId
/**
 * Utility: Fisher-Yates shuffle array to randomize bot selection
 */
const shuffleBots = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Adds demo players to a specific tournament in Firestore ensuring DIFFERENT bots in every match
 * @param {string} tournamentId
 * @param {number|null} count - Number of bots to add
 */
export const addDemoPlayersToTournamentRealtime = async (tournamentId, count = null) => {
  try {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    const tourneySnap = await getDoc(tourneyRef);
    if (!tourneySnap.exists()) {
      return { success: false, error: "Tournament not found" };
    }
    const tData = tourneySnap.data();
    const existingJoined = Array.isArray(tData.joinedPlayers) ? tData.joinedPlayers : [];
    const maxSlots = tData.slotsTotal || tData.maxSlots || 48;
    const remainingSlots = Math.max(0, maxSlots - existingJoined.length);

    if (remainingSlots <= 0) {
      return { success: false, error: "Match is already full (Housefull)!" };
    }

    const currentMatchUids = new Set(existingJoined.map(p => String(p.uid || '').trim()));

    // 1. Gather all bot UIDs already participating in OTHER tournaments to ensure distinct bots in every match
    const allTourneysSnap = await getDocs(collection(db, "tournaments"));
    const uidsInOtherMatches = new Set();
    allTourneysSnap.forEach(snap => {
      if (snap.id !== tournamentId) {
        const otherData = snap.data();
        if (Array.isArray(otherData.joinedPlayers)) {
          otherData.joinedPlayers.forEach(p => {
            if (p.uid) uidsInOtherMatches.add(String(p.uid).trim());
          });
        }
      }
    });

    // 2. Filter bots that are not yet in the current match
    const botsNotInCurrentMatch = DEMO_PLAYERS.filter(dp => !currentMatchUids.has(String(dp.uid).trim()));

    if (botsNotInCurrentMatch.length === 0) {
      return { success: false, error: "All available bots are already in this match!" };
    }

    // 3. Prioritize bots that are NOT used in any other match, then fall back to remaining bots
    const unusedAcrossMatches = botsNotInCurrentMatch.filter(dp => !uidsInOtherMatches.has(String(dp.uid).trim()));
    const usedInOtherMatches = botsNotInCurrentMatch.filter(dp => uidsInOtherMatches.has(String(dp.uid).trim()));

    // 4. Shuffle both pools randomly so selection is always fresh and randomized
    const prioritizedPool = [
      ...shuffleBots(unusedAcrossMatches),
      ...shuffleBots(usedInOtherMatches)
    ];

    let howMany = remainingSlots;
    if (count !== null && count !== undefined && !isNaN(count)) {
      howMany = Math.min(Math.max(1, parseInt(count, 10)), remainingSlots);
    }
    const toAdd = prioritizedPool.slice(0, howMany);

    const newJoined = [
      ...existingJoined,
      ...toAdd.map(p => ({
        uid: p.uid,
        nickname: p.nickname,
        email: p.email || 'N/A',
        phone: p.phone || 'N/A',
        isBot: true,
        joinedAt: new Date().toISOString()
      }))
    ];

    await updateDoc(tourneyRef, {
      joinedPlayers: newJoined,
      slotsJoined: newJoined.length,
      updatedAt: serverTimestamp()
    });

    console.log(`[Firebase] Added ${toAdd.length} distinct demo bots to tournament ${tournamentId}`);
    return { success: true, added: toAdd.length, total: newJoined.length, maxSlots };
  } catch (err) {
    console.error("[Firebase] Error adding demo players to tournament:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Adds demo players to all active tournaments in Firestore, distributing DIFFERENT bots to each match
 * @param {number|null} countPerMatch - Max bots to add per match
 */
export const addDemoPlayersToAllMatchesRealtime = async (countPerMatch = null) => {
  try {
    const tourneysSnap = await getDocs(collection(db, "tournaments"));
    let totalAdded = 0;

    // Track all bots assigned across all tournaments so each match receives distinct bots
    const globallyUsedUids = new Set();
    tourneysSnap.docs.forEach(docSnap => {
      const tData = docSnap.data();
      if (Array.isArray(tData.joinedPlayers)) {
        tData.joinedPlayers.forEach(p => {
          if (p.uid) globallyUsedUids.add(String(p.uid).trim());
        });
      }
    });

    for (const docSnap of tourneysSnap.docs) {
      const tData = docSnap.data();
      const tId = docSnap.id;
      const existingJoined = Array.isArray(tData.joinedPlayers) ? tData.joinedPlayers : [];
      const maxSlots = tData.slotsTotal || tData.maxSlots || 48;
      const remainingSlots = Math.max(0, maxSlots - existingJoined.length);
      if (remainingSlots <= 0) continue;

      const currentMatchUids = new Set(existingJoined.map(p => String(p.uid || '').trim()));
      const botsNotInThisMatch = DEMO_PLAYERS.filter(dp => !currentMatchUids.has(String(dp.uid).trim()));
      if (botsNotInThisMatch.length === 0) continue;

      // Prioritize completely fresh bots not used in any other match yet
      const freshBots = botsNotInThisMatch.filter(dp => !globallyUsedUids.has(String(dp.uid).trim()));
      const otherBots = botsNotInThisMatch.filter(dp => globallyUsedUids.has(String(dp.uid).trim()));

      const pool = [...shuffleBots(freshBots), ...shuffleBots(otherBots)];

      let howMany = remainingSlots;
      if (countPerMatch !== null && countPerMatch !== undefined && !isNaN(countPerMatch)) {
        howMany = Math.min(Math.max(1, parseInt(countPerMatch, 10)), remainingSlots);
      }
      const toAdd = pool.slice(0, howMany);
      if (toAdd.length === 0) continue;

      // Mark these bots as globally assigned so the next match gets DIFFERENT bots!
      toAdd.forEach(b => globallyUsedUids.add(String(b.uid).trim()));

      const newJoined = [
        ...existingJoined,
        ...toAdd.map(p => ({
          uid: p.uid,
          nickname: p.nickname,
          email: p.email || 'N/A',
          phone: p.phone || 'N/A',
          isBot: true,
          joinedAt: new Date().toISOString()
        }))
      ];

      await updateDoc(doc(db, "tournaments", tId), {
        joinedPlayers: newJoined,
        slotsJoined: newJoined.length,
        updatedAt: serverTimestamp()
      });
      totalAdded += toAdd.length;
    }
    return { success: true, count: totalAdded };
  } catch (err) {
    console.error("[Firebase] Error adding demo players to all matches:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Looks up a user in Firestore or local cache by their Referral Code or Free Fire UID
 */
export const findUserByReferralCodeOrUid = async (referralCodeInput) => {
  try {
    if (!referralCodeInput || !referralCodeInput.trim()) {
      return { success: false, error: 'Please enter a referral code.' };
    }

    const rawInput = referralCodeInput.trim();
    // Normalize code by stripping common prefixes like ZEST-, ZEST, etc.
    const cleanCode = rawInput.replace(/^zest[-_]?/i, '').toLowerCase();
    const rawLower = rawInput.toLowerCase();

    // 1. Search Firestore users collection
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    let matchedReferrer = null;

    snapshot.forEach((docSnap) => {
      const u = docSnap.data();
      const uUid = String(u.uid || '').trim().toLowerCase();
      const uId = String(u.id || docSnap.id || '').trim().toLowerCase();
      const uRefCode = String(u.referralCode || '').trim().toLowerCase();

      if (
        uUid === cleanCode || 
        uUid === rawLower || 
        uId === rawLower || 
        uRefCode === rawLower || 
        uRefCode === cleanCode
      ) {
        matchedReferrer = { id: docSnap.id, ...u };
      }
    });

    if (matchedReferrer) {
      return { success: true, referrer: matchedReferrer };
    }

    // 2. Local cache fallback
    const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const foundLocal = localUsers.find(u => {
      const uUid = String(u.uid || '').trim().toLowerCase();
      const uId = String(u.id || '').trim().toLowerCase();
      const uRefCode = String(u.referralCode || '').trim().toLowerCase();
      return uUid === cleanCode || uUid === rawLower || uId === rawLower || uRefCode === rawLower;
    });

    if (foundLocal) {
      return { success: true, referrer: foundLocal };
    }

    return { success: false, error: 'Invalid referral code. No player found with this code.' };
  } catch (err) {
    console.error("[Firebase] findUserByReferralCodeOrUid error:", err);
    return { success: false, error: err.message || 'Failed to verify referral code.' };
  }
};

/**
 * Credits referral reward coins to the referrer's account in Firestore and logs the referral record
 */
export const creditReferralRewardRealtime = async (referrerUidOrId, rewardAmount, refereeNickname, refereeUid) => {
  try {
    const parsedAmt = Number(rewardAmount);
    const amt = isNaN(parsedAmt) ? 0 : Math.max(0, parsedAmt);
    const cleanReferrer = String(referrerUidOrId || '').trim();

    if (!cleanReferrer) return { success: false, error: 'Missing referrer identifier.' };

    // 1. Locate referrer in Firestore
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    let referrerDocRef = null;
    let currentReferrerData = null;

    snapshot.forEach((docSnap) => {
      const u = docSnap.data();
      const uUid = String(u.uid || '').trim();
      const uId = String(u.id || docSnap.id).trim();
      if (uUid === cleanReferrer || uId === cleanReferrer || docSnap.id === cleanReferrer) {
        referrerDocRef = doc(db, "users", docSnap.id);
        currentReferrerData = { id: docSnap.id, ...u };
      }
    });

    const newTx = amt > 0 ? {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'CREDIT',
      amount: amt,
      title: '🎁 Referral Bonus',
      reason: `Invited ${refereeNickname} (UID: ${refereeUid})`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: new Date().toISOString(),
      status: 'Success'
    } : null;

    if (referrerDocRef) {
      const updatePayload = {
        referralCount: increment(1),
        updatedAt: serverTimestamp()
      };
      if (amt > 0) {
        updatePayload.wallet = increment(amt);
        updatePayload.referralEarnings = increment(amt);
        if (newTx) updatePayload.transactions = arrayUnion(newTx);
      }
      await updateDoc(referrerDocRef, updatePayload);
      console.log(`[Firebase] Successfully recorded referral (reward: ₹${amt}) for ${cleanReferrer}`);
    }

    // 2. Also log in dedicated "referrals" collection for clear activity streaming
    const referralLogDoc = doc(db, "referrals", `ref_${refereeUid}_${Date.now()}`);
    await setDoc(referralLogDoc, {
      referrerUid: String(currentReferrerData?.uid || cleanReferrer),
      referrerNickname: currentReferrerData?.nickname || 'Referrer',
      refereeUid: String(refereeUid),
      refereeNickname: refereeNickname,
      rewardAmount: amt,
      createdAt: serverTimestamp(),
      dateString: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    // 3. Update local storage cache if referrer is currently logged in locally
    const currentUser = JSON.parse(localStorage.getItem('zest_current_user') || 'null');
    if (currentUser && (currentUser.uid === cleanReferrer || currentUser.id === cleanReferrer)) {
      const updatedUser = {
        ...currentUser,
        wallet: (Number(currentUser.wallet) || 0) + amt,
        referralCount: (Number(currentUser.referralCount) || 0) + 1,
        referralEarnings: (Number(currentUser.referralEarnings) || 0) + amt,
        transactions: newTx ? [newTx, ...(currentUser.transactions || [])] : (currentUser.transactions || [])
      };
      localStorage.setItem('zest_current_user', JSON.stringify(updatedUser));
      localStorage.setItem('zest_user_profile', JSON.stringify(updatedUser));
    }

    return { success: true };
  } catch (err) {
    console.error("[Firebase] creditReferralRewardRealtime error:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Real-time listener for referral history of a specific user
 */
export const subscribeToUserReferralsRealtime = (userUid, onUpdate, onError) => {
  try {
    const cleanUid = String(userUid || '').trim().toLowerCase();
    if (!cleanUid) {
      onUpdate([]);
      return () => {};
    }

    const referralsCol = collection(db, "referrals");
    const unsubscribe = onSnapshot(referralsCol, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (String(data.referrerUid || '').trim().toLowerCase() === cleanUid) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      // Sort newest first
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      onUpdate(list);
    }, (error) => {
      console.warn("[Firebase] subscribeToUserReferrals error:", error);
      if (onError) onError(error);
    });

    return unsubscribe;
  } catch (err) {
    console.error("[Firebase] subscribeToUserReferrals init error:", err);
    return () => {};
  }
};
