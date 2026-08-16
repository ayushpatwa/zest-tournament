import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
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
    maxSlots: 48,
    slotsJoined: 14,
    startTime: "Today, 06:00 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "SOUL_Viper", uid: "582910394" },
      { nickname: "TotalGaming_Fan", uid: "910293847" },
      { nickname: "Garena_Sniper", uid: "192837465" }
    ],
    leaderboard: [
      { nickname: "SOUL_Viper", uid: "582910394", kills: 9, placementPoints: 12, totalPoints: 30 },
      { nickname: "Garena_Sniper", uid: "192837465", kills: 6, placementPoints: 9, totalPoints: 21 },
      { nickname: "TotalGaming_Fan", uid: "910293847", kills: 3, placementPoints: 7, totalPoints: 13 }
    ]
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
    maxSlots: 24,
    slotsJoined: 8,
    startTime: "Today, 08:30 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "ShadowHunter", uid: "482910283" },
      { nickname: "Thunder_God", uid: "849201938" }
    ],
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
    slotsJoined: 6,
    startTime: "Tonight, 10:00 PM",
    serverStatus: "Filling Fast (2 Slots Left)",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "Team_Inferno_Leader", uid: "772910481" }
    ],
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
    slotsJoined: 4,
    startTime: "Today, 09:15 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "HeadshotGod_OP", uid: "928374821" }
    ],
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
    slotsJoined: 1,
    startTime: "Today, 07:45 PM",
    serverStatus: "1 Slot Left",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "AWM_King_1v1", uid: "482910392" }
    ],
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
    slotsJoined: 2,
    startTime: "Today, 08:45 PM",
    serverStatus: "2 Slots Left",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "Duo_Snipers", uid: "772910482" }
    ],
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
    slotsJoined: 2,
    startTime: "Tonight, 11:00 PM",
    serverStatus: "Registration Open",
    status: "open",
    roomId: "",
    roomPassword: "",
    joinedPlayers: [
      { nickname: "Tactical_Viper", uid: "582910398" }
    ],
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
 * Saves user profile to Firestore
 */
export const saveUserProfileRealtime = async (userData) => {
  try {
    if (!userData.uid && !userData.id) return;
    const userId = String(userData.uid || userData.id);
    await setDoc(doc(db, "users", userId), {
      ...userData,
      lastActive: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error saving user profile:", error);
    return { success: false, error: error.message };
  }
};
