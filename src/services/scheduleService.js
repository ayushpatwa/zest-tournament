import { 
  collection, 
  doc, 
  setDoc, 
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
 * Generates all 100 daily matches (25 time slots x 4 match types) for a given date.
 * Uses atomic Firestore batching to write all matches in a single network request.
 * Safely preserves existing player registrations if match already exists unless overwrite is requested.
 */
export const generateDaily1v1Matches = async (targetDateString, overwriteExisting = false) => {
  try {
    const targetDate = targetDateString ? String(targetDateString).trim() : getTodayDateString();
    console.log(`[AutoScheduler] Generating 1v1 daily matches for date: ${targetDate}...`);

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

    for (const slot of DAILY_TIME_SLOTS) {
      const slotNumStr = String(slot.slotIndex).padStart(2, '0');
      for (const tpl of DAILY_1V1_TEMPLATES) {
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
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(`[AutoScheduler] Successfully committed ${createdCount} matches for ${targetDate} (Skipped existing: ${skippedCount})`);
    } else {
      console.log(`[AutoScheduler] All matches already exist for ${targetDate} (${skippedCount} existing). No new matches added.`);
    }

    // Save schedule state metadata
    try {
      const stateRef = doc(db, "settings", "daily_1v1_schedule_state");
      await setDoc(stateRef, {
        [`lastGenerated_${targetDate}`]: serverTimestamp(),
        lastRunDate: targetDate,
        lastRunCount: createdCount,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (_) {}

    return {
      success: true,
      createdCount,
      skippedCount,
      totalSlots: DAILY_TIME_SLOTS.length * DAILY_1V1_TEMPLATES.length,
      targetDate
    };
  } catch (err) {
    console.error(`[AutoScheduler] Error generating daily matches:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Deletes auto-generated daily 1v1 matches for a given date
 */
export const deleteDailyMatchesByDate = async (targetDateString) => {
  try {
    const targetDate = targetDateString ? String(targetDateString).trim() : getTodayDateString();
    const tourneysCol = collection(db, "tournaments");
    const q = query(tourneysCol, where("matchDate", "==", targetDate));
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    let deletedCount = 0;
    snap.forEach(d => {
      const data = d.data();
      if (d.id.startsWith(`daily_${targetDate}`) || data.isDailyScheduled) {
        batch.delete(doc(db, "tournaments", d.id));
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`[AutoScheduler] Successfully deleted ${deletedCount} daily matches for ${targetDate}`);
    }
    return { success: true, count: deletedCount };
  } catch (err) {
    console.error("[AutoScheduler] Error deleting daily matches:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Checks and auto-generates matches ONLY for tomorrow at 11:00 PM (or if after 11:00 PM).
 * Matches are scheduled from tomorrow onwards.
 */
export const checkAndAutoGenerateDailyMatches = async () => {
  try {
    const tomorrow = getTomorrowDateString();
    const currentHour = new Date().getHours();

    // Check if current time is 11:00 PM (23:00) or later
    if (currentHour >= 23) {
      const tourneysCol = collection(db, "tournaments");
      const tomorrowQuery = query(tourneysCol, where("matchDate", "==", tomorrow));
      const tomorrowSnap = await getDocs(tomorrowQuery);
      let tomorrowDailyCount = 0;
      tomorrowSnap.forEach(d => {
        const data = d.data();
        if (data.isDailyScheduled || d.id.startsWith(`daily_${tomorrow}`)) {
          tomorrowDailyCount++;
        }
      });

      if (tomorrowDailyCount < 100) {
        console.log(`[AutoScheduler] It is past 11:00 PM and tomorrow (${tomorrow}) has ${tomorrowDailyCount}/100 matches. Auto-generating for tomorrow...`);
        await generateDaily1v1Matches(tomorrow, false);
      }
    }
  } catch (err) {
    console.warn("[AutoScheduler] checkAndAutoGenerateDailyMatches warning:", err);
  }
};

/**
 * Configures the daily 11:00 PM timer to automatically add tomorrow's matches.
 * Returns a cleanup function.
 */
export const setupDaily11PmScheduleTimer = () => {
  let timeoutId = null;

  const scheduleNextRun = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(23, 0, 0, 0); // 11:00 PM

    // If 11:00 PM has already passed today, target tomorrow's 11:00 PM
    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const msUntil11PM = target.getTime() - now.getTime();
    console.log(`[AutoScheduler] 11:00 PM auto-scheduler timer set for ${target.toLocaleString()} (in ${Math.round(msUntil11PM / 1000 / 60)} minutes)`);

    timeoutId = setTimeout(async () => {
      console.log(`[AutoScheduler] 11:00 PM reached! Automatically creating tomorrow's 1v1 matches...`);
      const tomorrow = getTomorrowDateString();
      await generateDaily1v1Matches(tomorrow, false);

      // Re-schedule for the next day's 11:00 PM
      scheduleNextRun();
    }, msUntil11PM);
  };

  scheduleNextRun();

  // Also hook into visibilitychange to self-heal when app returns to foreground
  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      checkAndAutoGenerateDailyMatches();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
};
