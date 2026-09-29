import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';
import { getTodayDateString, getTomorrowDateString } from './dateUtils.js';

/**
 * 4 Required 1v1 Match Templates:
 * 1. Clash squad 1v1 (winning prize: ₹6, entry fee: ₹4)
 * 2. Clash squad 1v1 (head) (winning prize: ₹6, entry fee: ₹4)
 * 3. Lone wolf 1v1 (winning prize: ₹6, entry fee: ₹4)
 * 4. Lone wolf 1v1 (head) (winning prize: ₹6, entry fee: ₹4)
 */
export const DAILY_1V1_TEMPLATES = [
  {
    key: 'cs_1v1',
    title: 'Clash squad 1v1',
    mode: 'Solo',
    type: 'Clash Squad 1v1',
    map: 'Bermuda',
    prizePool: 6,
    perKillPrize: 0,
    entryFee: 4,
    slotsTotal: 2,
    maxSlots: 2
  },
  {
    key: 'cs_1v1_head',
    title: 'Clash squad 1v1 (head)',
    mode: 'Solo',
    type: 'Clash Squad 1v1 (Headshot)',
    map: 'Bermuda',
    prizePool: 6,
    perKillPrize: 0,
    entryFee: 4,
    slotsTotal: 2,
    maxSlots: 2
  },
  {
    key: 'lw_1v1',
    title: 'Lone wolf 1v1',
    mode: 'Solo',
    type: 'Lone Wolf 1v1',
    map: 'Iron Cage',
    prizePool: 6,
    perKillPrize: 0,
    entryFee: 4,
    slotsTotal: 2,
    maxSlots: 2
  },
  {
    key: 'lw_1v1_head',
    title: 'Lone wolf 1v1 (head)',
    mode: 'Solo',
    type: 'Lone Wolf 1v1 (Headshot)',
    map: 'Iron Cage',
    prizePool: 6,
    perKillPrize: 0,
    entryFee: 4,
    slotsTotal: 2,
    maxSlots: 2
  }
];

/**
 * Classic Battle Royale Match Template:
 * Title: "solo per kill BR"
 * Mode: Solo
 * Type: Classic Battle Royale
 * Map: Bermuda
 * Entry fee: ₹5
 * Per kill: ₹3
 * Winning prize pool: ₹10
 * Player slot: 10
 */
export const CLASSIC_BATTLE_ROYALE_TEMPLATE = {
  key: 'classic_br_solo',
  title: 'solo per kill BR',
  mode: 'Solo',
  type: 'Classic Battle Royale',
  map: 'Bermuda',
  prizePool: 10,
  perKillPrize: 3,
  entryFee: 5,
  slotsTotal: 10,
  maxSlots: 10
};

/**
 * 25 Daily Time Slots:
 * Every 30 minutes starting from 10:00 AM to 10:00 PM
 */
export const DAILY_TIME_SLOTS = [
  { time: '10:00 AM', slotIndex: 1,  timeOrder: '10:00' },
  { time: '10:30 AM', slotIndex: 2,  timeOrder: '10:30' },
  { time: '11:00 AM', slotIndex: 3,  timeOrder: '11:00' },
  { time: '11:30 AM', slotIndex: 4,  timeOrder: '11:30' },
  { time: '12:00 PM', slotIndex: 5,  timeOrder: '12:00' },
  { time: '12:30 PM', slotIndex: 6,  timeOrder: '12:30' },
  { time: '01:00 PM', slotIndex: 7,  timeOrder: '13:00' },
  { time: '01:30 PM', slotIndex: 8,  timeOrder: '13:30' },
  { time: '02:00 PM', slotIndex: 9,  timeOrder: '14:00' },
  { time: '02:30 PM', slotIndex: 10, timeOrder: '14:30' },
  { time: '03:00 PM', slotIndex: 11, timeOrder: '15:00' },
  { time: '03:30 PM', slotIndex: 12, timeOrder: '15:30' },
  { time: '04:00 PM', slotIndex: 13, timeOrder: '16:00' },
  { time: '04:30 PM', slotIndex: 14, timeOrder: '16:30' },
  { time: '05:00 PM', slotIndex: 15, timeOrder: '17:00' },
  { time: '05:30 PM', slotIndex: 16, timeOrder: '17:30' },
  { time: '06:00 PM', slotIndex: 17, timeOrder: '18:00' },
  { time: '06:30 PM', slotIndex: 18, timeOrder: '18:30' },
  { time: '07:00 PM', slotIndex: 19, timeOrder: '19:00' },
  { time: '07:30 PM', slotIndex: 20, timeOrder: '19:30' },
  { time: '08:00 PM', slotIndex: 21, timeOrder: '20:00' },
  { time: '08:30 PM', slotIndex: 22, timeOrder: '20:30' },
  { time: '09:00 PM', slotIndex: 23, timeOrder: '21:00' },
  { time: '09:30 PM', slotIndex: 24, timeOrder: '21:30' },
  { time: '10:00 PM', slotIndex: 25, timeOrder: '22:00' }
];

/**
 * Generates daily matches spaced 30 minutes apart sequentially between the 4 match modes:
 * Slot 1 (10:00 AM) -> Clash squad 1v1
 * Slot 2 (10:30 AM) -> Clash squad 1v1 (head)
 * Slot 3 (11:00 AM) -> Lone wolf 1v1
 * Slot 4 (11:30 AM) -> Lone wolf 1v1 (head)
 * ... (cycles every 30 minutes until 10:00 PM, 25 matches total per day)
 */
export const generateDaily1v1Matches = async (targetDateString, overwriteExisting = false) => {
  try {
    const targetDate = targetDateString ? String(targetDateString).trim() : getTomorrowDateString();
    console.log(`[AutoScheduler] Generating 1v1 daily sequential matches for date: ${targetDate}...`);

    // 1. Fetch existing tournaments for this date to avoid overwriting registered players
    const tournamentsCol = collection(db, "tournaments");
    const q = query(tournamentsCol, where("matchDate", "==", targetDate));
    const querySnapshot = await getDocs(q);
    const existingDocIds = new Set();
    querySnapshot.forEach(docSnap => {
      existingDocIds.add(docSnap.id);
    });

    const batch = writeBatch(db);
    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < DAILY_TIME_SLOTS.length; i++) {
      const slot = DAILY_TIME_SLOTS[i];
      const slotNumStr = String(slot.slotIndex).padStart(2, '0');
      // Sequential 30 min rotation between the 4 match types
      const tpl = DAILY_1V1_TEMPLATES[i % DAILY_1V1_TEMPLATES.length];
      const matchId = `daily_${targetDate}_slot${slotNumStr}_${tpl.key}`;

      if (existingDocIds.has(matchId) && !overwriteExisting) {
        skippedCount++;
        continue;
      }

      const matchDocRef = doc(db, "tournaments", matchId);
      const matchData = {
        id: matchId,
        title: tpl.title,
        mode: tpl.mode,
        type: tpl.type,
        map: tpl.map,
        prizePool: tpl.prizePool,
        perKillPrize: tpl.perKillPrize,
        entryFee: tpl.entryFee,
        slotsTotal: tpl.slotsTotal,
        maxSlots: tpl.maxSlots,
        slotsJoined: 0,
        joinedPlayers: [],
        matchDate: targetDate,
        startTime: slot.time,
        status: 'upcoming',
        roomId: '',
        roomPassword: '',
        leaderboard: [],
        isDailyScheduled: true,
        slotIndex: slot.slotIndex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(matchDocRef, matchData, { merge: true });
      createdCount++;
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(`[AutoScheduler] Successfully committed ${createdCount} matches for ${targetDate} (Skipped existing: ${skippedCount})`);
    } else {
      console.log(`[AutoScheduler] All matches already exist for ${targetDate} (${skippedCount} existing). No new matches added.`);
    }

    // Save schedule state metadata and clear any admin deleted flag for this targetDate
    try {
      const stateRef = doc(db, "settings", "daily_1v1_schedule_state");
      await setDoc(stateRef, {
        [`lastGenerated_${targetDate}`]: serverTimestamp(),
        [`adminDeleted_${targetDate}`]: false,
        adminDeleted_all: false,
        lastRunDate: targetDate,
        lastRunCount: createdCount,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (_) {}

    return {
      success: true,
      createdCount,
      skippedCount,
      totalSlots: DAILY_TIME_SLOTS.length,
      targetDate
    };
  } catch (err) {
    console.error(`[AutoScheduler] Error generating daily matches:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Generates 25 Classic Battle Royale matches spaced 30 minutes apart (10:00 AM to 10:00 PM)
 * for the target date.
 * Title: "Classic battle royal"
 * Mode: Solo
 * Type: Classic Battle Royale
 * Map: Bermuda
 * Entry fee: ₹5
 * Per kill prize: ₹3
 * Winning prize pool: ₹10
 * Player slots: 10
 */
export const generateDailyClassicBRMatches = async (targetDateString, overwriteExisting = false) => {
  try {
    const targetDate = targetDateString ? String(targetDateString).trim() : getTodayDateString();
    console.log(`[AutoScheduler] Generating Classic Battle Royale daily matches for date: ${targetDate}...`);

    const tournamentsCol = collection(db, "tournaments");
    const q = query(tournamentsCol, where("matchDate", "==", targetDate));
    const querySnapshot = await getDocs(q);
    const existingDocIds = new Set();
    querySnapshot.forEach(docSnap => {
      existingDocIds.add(docSnap.id);
    });

    const batch = writeBatch(db);
    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < DAILY_TIME_SLOTS.length; i++) {
      const slot = DAILY_TIME_SLOTS[i];
      const slotNumStr = String(slot.slotIndex).padStart(2, '0');
      const tpl = CLASSIC_BATTLE_ROYALE_TEMPLATE;
      const matchId = `daily_br_${targetDate}_slot${slotNumStr}_${tpl.key}`;

      if (existingDocIds.has(matchId) && !overwriteExisting) {
        skippedCount++;
        continue;
      }

      const matchDocRef = doc(db, "tournaments", matchId);
      const matchData = {
        id: matchId,
        title: tpl.title,
        mode: tpl.mode,
        type: tpl.type,
        map: tpl.map,
        prizePool: tpl.prizePool,
        perKillPrize: tpl.perKillPrize,
        entryFee: tpl.entryFee,
        slotsTotal: tpl.slotsTotal,
        maxSlots: tpl.maxSlots,
        slotsJoined: 0,
        joinedPlayers: [],
        matchDate: targetDate,
        startTime: slot.time,
        status: 'upcoming',
        roomId: '',
        roomPassword: '',
        leaderboard: [],
        isDailyScheduled: true,
        isBattleRoyale: true,
        slotIndex: slot.slotIndex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(matchDocRef, matchData, { merge: true });
      createdCount++;
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(`[AutoScheduler] Successfully committed ${createdCount} Classic BR matches for ${targetDate} (Skipped existing: ${skippedCount})`);
    } else {
      console.log(`[AutoScheduler] All Classic BR matches already exist for ${targetDate} (${skippedCount} existing). No new matches added.`);
    }

    return {
      success: true,
      createdCount,
      skippedCount,
      totalSlots: DAILY_TIME_SLOTS.length,
      targetDate
    };
  } catch (err) {
    console.error(`[AutoScheduler] Error generating Classic BR daily matches:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Generates both Classic Battle Royale and 1v1 match schedules for the specified date
 */
export const generateAllDailyMatches = async (targetDateString, overwriteExisting = false) => {
  const brRes = await generateDailyClassicBRMatches(targetDateString, overwriteExisting);
  const oneVoneRes = await generateDaily1v1Matches(targetDateString, overwriteExisting);
  return {
    success: brRes.success && oneVoneRes.success,
    createdCount: (brRes.createdCount || 0) + (oneVoneRes.createdCount || 0),
    skippedCount: (brRes.skippedCount || 0) + (oneVoneRes.skippedCount || 0),
    classicBR: brRes,
    oneVone: oneVoneRes,
    targetDate: targetDateString
  };
};

/**
 * Deletes matches for a given date (Today, Tomorrow, or specific YYYY-MM-DD)
 * @param {string} targetDateString - Target date string
 * @param {boolean} deleteAll - If true, deletes all matches for that date (daily + custom); if false, only daily scheduled
 */
export const deleteDailyMatchesByDate = async (targetDateString, deleteAll = true) => {
  try {
    const targetDate = targetDateString ? String(targetDateString).trim() : getTodayDateString();
    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();

    const isTargetTomorrow = targetDate === tomorrowStr || targetDate.toLowerCase() === 'tomorrow';
    const isTargetToday = targetDate === todayStr || targetDate.toLowerCase() === 'today';
    const effectiveDateKey = isTargetTomorrow ? tomorrowStr : (isTargetToday ? todayStr : targetDate);

    const tourneysCol = collection(db, "tournaments");
    const snap = await getDocs(tourneysCol);

    const docIdsToDelete = [];

    snap.forEach(d => {
      const data = d.data() || {};
      const docDate = String(data.matchDate || '').trim();

      const matchesDate = 
        docDate === effectiveDateKey ||
        (isTargetTomorrow && (docDate === tomorrowStr || docDate.toLowerCase() === 'tomorrow' || d.id.includes(tomorrowStr))) ||
        (isTargetToday && (docDate === todayStr || docDate.toLowerCase() === 'today' || d.id.includes(todayStr)));

      if (matchesDate) {
        if (
          deleteAll || 
          d.id.startsWith(`daily_${effectiveDateKey}`) || 
          d.id.startsWith(`daily_br_${effectiveDateKey}`) || 
          d.id.startsWith('daily_') || 
          data.isDailyScheduled
        ) {
          docIdsToDelete.push(d.id);
        }
      }
    });

    let deletedCount = 0;
    // Commit in safe chunks of 400
    for (let i = 0; i < docIdsToDelete.length; i += 400) {
      const chunk = docIdsToDelete.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(id => {
        batch.delete(doc(db, "tournaments", id));
        deletedCount++;
      });
      await batch.commit();
    }

    console.log(`[AutoScheduler] Successfully deleted ${deletedCount} matches for date: ${effectiveDateKey}`);

    // Mark adminDeleted in Firestore so auto-scheduler will NEVER regenerate matches against Admin intent
    try {
      const stateRef = doc(db, "settings", "daily_1v1_schedule_state");
      await setDoc(stateRef, {
        [`adminDeleted_${effectiveDateKey}`]: true,
        lastDeletedDate: effectiveDateKey,
        lastDeletedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("[AutoScheduler] Failed to record admin delete state:", e);
    }

    return { success: true, count: deletedCount };
  } catch (err) {
    console.error("[AutoScheduler] Error deleting daily matches:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Permanently deletes ALL tournaments and matches across all dates from Firestore.
 * Sets adminDeleted_all flag to guarantee no automatic matches are recreated.
 */
export const deleteAllTournaments = async () => {
  try {
    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const tourneysCol = collection(db, "tournaments");
    const snap = await getDocs(tourneysCol);

    let deletedCount = 0;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(d => {
        batch.delete(doc(db, "tournaments", d.id));
        deletedCount++;
      });
      await batch.commit();
    }

    console.log(`[AutoScheduler] Successfully deleted ALL ${deletedCount} tournaments from database.`);

    try {
      const stateRef = doc(db, "settings", "daily_1v1_schedule_state");
      await setDoc(stateRef, {
        adminDeleted_all: true,
        [`adminDeleted_${todayStr}`]: true,
        [`adminDeleted_${tomorrowStr}`]: true,
        lastDeletedDate: 'all',
        lastDeletedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("[AutoScheduler] Failed to record admin delete all state:", e);
    }

    return { success: true, count: deletedCount };
  } catch (err) {
    console.error("[AutoScheduler] Error deleting all tournaments:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Background auto-generation is disabled to prevent unwanted match regeneration.
 * Matches are created strictly on-demand when the Admin explicitly clicks the
 * "Auto-Generate Tomorrow's Schedule" or "Auto-Generate Today's Schedule" buttons in Admin Host Panel.
 */
export const checkAndAutoGenerateDailyMatches = async () => {
  return;
};

/**
 * Timer disabled. Matches are created strictly on-demand by the Admin.
 */
export const setupDaily1030PmScheduleTimer = () => {
  return () => {};
};

// Compatibility alias
export const setupDaily11PmScheduleTimer = setupDaily1030PmScheduleTimer;
