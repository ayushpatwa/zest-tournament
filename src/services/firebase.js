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
      console.log(`[Firebase Realtime] Received ${list.length} tournaments live.`);
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
 * Authenticates user from Cloud Firestore across any device in real-time
 */
export const authenticateUserRealtime = async (identifier, password) => {
  try {
    const queryStr = String(identifier || '').trim().toLowerCase();
    const rawQuery = String(identifier || '').trim();
    const cleanPass = String(password || '').trim();

    if (!queryStr || !cleanPass) {
      return { success: false, error: 'Please enter your UID/Email and Password.' };
    }

    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    let matchedUser = null;
    let userFound = false;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docIdMatch = docSnap.id.trim().toLowerCase() === queryStr;
      const uidMatch = data.uid && String(data.uid).trim().toLowerCase() === queryStr;
      const emailMatch = data.email && String(data.email).trim().toLowerCase() === queryStr;
      const nickMatch = data.nickname && String(data.nickname).trim().toLowerCase() === queryStr;

      if (docIdMatch || uidMatch || emailMatch || nickMatch) {
        userFound = true;
        // Verify password
        if (data.password && String(data.password).trim() === cleanPass) {
          matchedUser = {
            id: docSnap.id,
            ...data,
            uid: data.uid || docSnap.id,
            wallet: typeof data.wallet === 'number' ? data.wallet : (parseFloat(data.wallet) || 0)
          };
        }
      }
    });

    if (matchedUser) {
      console.log(`[Firebase Cloud Auth] Successfully authenticated user ${matchedUser.uid || matchedUser.id} across devices.`);
      
      // Sync to local device cache
      const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
      const filtered = existingUsers.filter(u => u.uid !== matchedUser.uid && u.email !== matchedUser.email);
      filtered.push(matchedUser);
      localStorage.setItem('zest_registered_users', JSON.stringify(filtered));

      return { success: true, user: matchedUser };
    }

    if (userFound) {
      return { success: false, error: 'Incorrect Password. Please check and try again.' };
    }

    // LocalStorage fallback for offline testing
    const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const localUser = localUsers.find(
      u => (String(u.uid).trim().toLowerCase() === queryStr || String(u.email).trim().toLowerCase() === queryStr || String(u.nickname).trim().toLowerCase() === queryStr)
    );

    if (localUser) {
      if (String(localUser.password).trim() === cleanPass) {
        return { success: true, user: localUser };
      }
      return { success: false, error: 'Incorrect Password. Please check and try again.' };
    }

    return { success: false, error: 'No player account found with this Free Fire UID or Email. Please Register first.' };
  } catch (error) {
    console.error("[Firebase Cloud Auth] Error authenticating user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Checks if user already exists in Cloud Firestore or local cache
 */
export const checkUserExistsRealtime = async (ffUid, email) => {
  try {
    const cleanUid = String(ffUid || '').trim().toLowerCase();
    const cleanEmail = String(email || '').trim().toLowerCase();

    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    let exists = false;
    let existingData = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docIdMatch = cleanUid && docSnap.id.trim().toLowerCase() === cleanUid;
      const uidMatch = cleanUid && data.uid && String(data.uid).trim().toLowerCase() === cleanUid;
      const emailMatch = cleanEmail && data.email && String(data.email).trim().toLowerCase() === cleanEmail;

      if (docIdMatch || uidMatch || emailMatch) {
        exists = true;
        existingData = data;
      }
    });

    if (exists) return { exists: true, user: existingData };

    const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const localFound = localUsers.some(u => 
      (cleanUid && String(u.uid).trim().toLowerCase() === cleanUid) ||
      (cleanEmail && String(u.email).trim().toLowerCase() === cleanEmail)
    );

    return { exists: localFound, user: existingData };
  } catch (error) {
    console.error("[Firebase] Error checking user existence:", error);
    return { exists: false };
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
 * Looks up user by UID or Email to initiate OTP password reset
 */
export const findUserForPasswordReset = async (identifier) => {
  try {
    const queryStr = String(identifier || '').trim().toLowerCase();
    if (!queryStr) return { success: false, error: 'Please enter your Free Fire UID or Email.' };

    let matchedUser = null;

    // Check Firebase Firestore with 3s timeout
    try {
      const usersCollection = collection(db, "users");
      const snapshotPromise = getDocs(usersCollection);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      
      const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docIdMatch = docSnap.id.trim().toLowerCase() === queryStr;
        const uidMatch = data.uid && String(data.uid).trim().toLowerCase() === queryStr;
        const emailMatch = data.email && String(data.email).trim().toLowerCase() === queryStr;
        const nickMatch = data.nickname && String(data.nickname).trim().toLowerCase() === queryStr;
        
        if (docIdMatch || uidMatch || emailMatch || nickMatch) {
          matchedUser = { 
            id: docSnap.id, 
            ...data, 
            uid: data.uid || docSnap.id,
            email: data.email || (queryStr.includes('@') ? queryStr : '')
          };
        }
      });
    } catch (fbErr) {
      console.warn("[Firebase] Firestore findUser lookup timeout or warning:", fbErr);
    }

    if (matchedUser) {
      return { success: true, user: matchedUser };
    }

    // Local storage fallback
    const localUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const foundLocal = localUsers.find(u => 
      String(u.uid || '').trim().toLowerCase() === queryStr || 
      String(u.email || '').trim().toLowerCase() === queryStr ||
      String(u.nickname || '').trim().toLowerCase() === queryStr
    );

    if (foundLocal) {
      return { 
        success: true, 
        user: { ...foundLocal, email: foundLocal.email || (queryStr.includes('@') ? queryStr : '') } 
      };
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

    return { success: false, error: `No registered player account found with "${queryStr}". Please Register first.` };
  } catch (err) {
    console.error("[Firebase] findUserForPasswordReset error:", err);
    return { success: false, error: err.message || 'Failed to search account.' };
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
      targetTournamentId: notificationData.targetTournamentId || null,
      targetUids: Array.isArray(notificationData.targetUids) ? notificationData.targetUids : [],
      tournamentTitle: notificationData.tournamentTitle || '',
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

/**
 * Permanently deletes a registered player account from Firestore and local cache
 */
export const deleteUserRealtime = async (userIdOrUid) => {
  try {
    const queryStr = String(userIdOrUid).trim().toLowerCase();
    const rawQuery = String(userIdOrUid).trim();
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    let targetDocId = null;
    let targetNickname = '';

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docIdMatch = docSnap.id.trim().toLowerCase() === queryStr;
      const uidMatch = data.uid && String(data.uid).trim().toLowerCase() === queryStr;
      const emailMatch = data.email && String(data.email).trim().toLowerCase() === queryStr;
      
      if (docIdMatch || uidMatch || emailMatch) {
        targetDocId = docSnap.id;
        targetNickname = data.nickname || data.uid || docSnap.id;
      }
    });

    if (targetDocId) {
      await deleteDoc(doc(db, "users", targetDocId));
      console.log(`[Firebase] Successfully deleted user ${targetDocId}`);
    } else {
      try {
        await deleteDoc(doc(db, "users", rawQuery));
      } catch (_) {}
    }

    // Clean up from local storage
    const existingUsers = JSON.parse(localStorage.getItem('zest_registered_users') || '[]');
    const filtered = existingUsers.filter(u => 
      u.uid?.trim().toLowerCase() !== queryStr && 
      u.id?.trim().toLowerCase() !== queryStr &&
      u.email?.trim().toLowerCase() !== queryStr
    );
    localStorage.setItem('zest_registered_users', JSON.stringify(filtered));

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
 * Pre-defined esports demo players for testing & arena activity
 */
export const DEMO_PLAYERS = [
  {
    id: "user_demo_1",
    uid: "582910394",
    nickname: "SOUL_Viper",
    email: "viper.soul@gmail.com",
    phone: "9876543210",
    password: "password123",
    role: "player",
    wallet: 1250,
    stats: { matches: 46, wins: 22, kills: 382, earnings: 48500 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_2",
    uid: "192837465",
    nickname: "Garena_Sniper",
    email: "garena.sniper@gmail.com",
    phone: "9811223344",
    password: "password123",
    role: "player",
    wallet: 840,
    stats: { matches: 33, wins: 14, kills: 310, earnings: 34200 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_3",
    uid: "910293847",
    nickname: "TotalGaming_Fan",
    email: "totalgaming.fan@gmail.com",
    phone: "9822334455",
    password: "password123",
    role: "player",
    wallet: 450,
    stats: { matches: 28, wins: 11, kills: 275, earnings: 27800 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_4",
    uid: "482910283",
    nickname: "ShadowHunter_OP",
    email: "shadowhunter.op@gmail.com",
    phone: "9833445566",
    password: "password123",
    role: "player",
    wallet: 620,
    stats: { matches: 22, wins: 8, kills: 230, earnings: 21500 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_5",
    uid: "849201938",
    nickname: "Thunder_God_FF",
    email: "thunder.god@gmail.com",
    phone: "9844556677",
    password: "password123",
    role: "player",
    wallet: 310,
    stats: { matches: 19, wins: 7, kills: 198, earnings: 18900 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_6",
    uid: "772910481",
    nickname: "Raptor_Esports",
    email: "raptor.esports@gmail.com",
    phone: "9855667788",
    password: "password123",
    role: "player",
    wallet: 500,
    stats: { matches: 16, wins: 6, kills: 174, earnings: 16200 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_7",
    uid: "284019284",
    nickname: "Panda_Headshot",
    email: "panda.hs@gmail.com",
    phone: "9866778899",
    password: "password123",
    role: "player",
    wallet: 750,
    stats: { matches: 14, wins: 5, kills: 160, earnings: 14500 },
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user_demo_8",
    uid: "639201847",
    nickname: "Frost_Byte_99",
    email: "frostbyte99@gmail.com",
    phone: "9877889900",
    password: "password123",
    role: "player",
    wallet: 200,
    stats: { matches: 10, wins: 3, kills: 95, earnings: 8200 },
    isVerified: true,
    createdAt: new Date().toISOString()
  }
];

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
    console.log("[Firebase] Seeded demo players successfully!");
    return { success: true, count: DEMO_PLAYERS.length };
  } catch (err) {
    console.error("[Firebase] Error seeding demo players:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Adds demo players to a specific tournament in Firestore
 */
export const addDemoPlayersToTournamentRealtime = async (tournamentId) => {
  try {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    const tourneySnap = await getDoc(tourneyRef);
    if (!tourneySnap.exists()) {
      return { success: false, error: "Tournament not found" };
    }
    const tData = tourneySnap.data();
    const existingJoined = Array.isArray(tData.joinedPlayers) ? tData.joinedPlayers : [];
    const existingUids = new Set(existingJoined.map(p => String(p.uid || '').trim()));

    const toAdd = DEMO_PLAYERS.filter(dp => !existingUids.has(dp.uid));
    if (toAdd.length === 0) {
      return { success: true, message: "Demo players already in match", added: 0 };
    }

    const newJoined = [
      ...existingJoined,
      ...toAdd.map(p => ({
        uid: p.uid,
        nickname: p.nickname,
        email: p.email,
        phone: p.phone,
        joinedAt: new Date().toISOString()
      }))
    ];

    await updateDoc(tourneyRef, {
      joinedPlayers: newJoined,
      slotsJoined: newJoined.length,
      updatedAt: serverTimestamp()
    });

    console.log(`[Firebase] Added ${toAdd.length} demo players to tournament ${tournamentId}`);
    return { success: true, added: toAdd.length, total: newJoined.length };
  } catch (err) {
    console.error("[Firebase] Error adding demo players to tournament:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Adds demo players to all active tournaments in Firestore
 */
export const addDemoPlayersToAllMatchesRealtime = async () => {
  try {
    const tourneysSnap = await getDocs(collection(db, "tournaments"));
    let totalAdded = 0;

    for (const docSnap of tourneysSnap.docs) {
      const tData = docSnap.data();
      const tId = docSnap.id;
      const existingJoined = Array.isArray(tData.joinedPlayers) ? tData.joinedPlayers : [];
      const existingUids = new Set(existingJoined.map(p => String(p.uid || '').trim()));

      const toAdd = DEMO_PLAYERS.filter(dp => !existingUids.has(dp.uid));
      if (toAdd.length > 0) {
        const newJoined = [
          ...existingJoined,
          ...toAdd.map(p => ({
            uid: p.uid,
            nickname: p.nickname,
            email: p.email,
            phone: p.phone,
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
    }
    return { success: true, count: totalAdded };
  } catch (err) {
    console.error("[Firebase] Error adding demo players to all matches:", err);
    return { success: false, error: err.message };
  }
};

