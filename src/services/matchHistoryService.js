import { getTournamentSortTimestamp, formatMatchDate, getTodayDateString } from './dateUtils.js';

/**
 * Checks whether a tournament match has been completed.
 * A match is completed if:
 * 1. Its status is explicitly 'completed'
 * 2. It has an explicit isCompleted flag
 * 3. Its scheduled start time has passed by more than 30 minutes
 */
export const isMatchCompleted = (tourney) => {
  if (!tourney) return false;
  if (tourney.status === 'completed' || tourney.isCompleted) return true;

  const matchTimestamp = getTournamentSortTimestamp(tourney);
  if (matchTimestamp && typeof matchTimestamp === 'number' && matchTimestamp > 0) {
    // If the match start time was more than 30 minutes ago, consider it completed
    if (Date.now() > matchTimestamp + 30 * 60 * 1000) {
      return true;
    }
  }

  return false;
};

/**
 * Reconstructs readable tournament match info from a raw tournament ID or transaction string.
 * e.g., 'daily_2026-10-31_slot07_lw_1v1' -> { title, mode, type, map, matchDate, startTime }
 */
export const parseTournamentFromId = (matchId, fallbackTitle = '', fee = 0, dateStr = '') => {
  const cleanId = String(matchId || '').trim();
  
  let mode = 'Battle Royale';
  let type = 'Solo';
  let map = 'Bermuda';
  let matchDate = dateStr || getTodayDateString();
  let startTime = '12:00 PM';
  let slotNum = 1;

  // Extract date if present (e.g. 2026-10-31)
  const dateMatch = cleanId.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    matchDate = dateMatch[1];
  }

  // Extract slot if present (e.g. slot07, slot25)
  const slotMatch = cleanId.match(/slot(\d{1,2})/i);
  if (slotMatch) {
    slotNum = parseInt(slotMatch[1], 10);
    // Convert slot index to time (slot 1 = 10:00 AM, slot 2 = 10:30 AM, etc.)
    const totalMinutes = 570 + slotNum * 30;
    let hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const ampm = hours >= 12 && hours < 24 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    startTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
  }

  // Determine mode & type
  const lower = cleanId.toLowerCase();
  if (lower.includes('lw') || lower.includes('lone wolf') || lower.includes('lonewolf')) {
    mode = 'Lone Wolf';
    type = lower.includes('2v2') ? '2v2 Duo' : '1v1 Solo';
  } else if (lower.includes('cs') || lower.includes('clash squad') || lower.includes('clashsquad')) {
    mode = 'Clash Squad';
    if (lower.includes('4v4')) type = '4v4 Squad';
    else if (lower.includes('2v2')) type = '2v2 Duo';
    else type = '1v1 Solo';
  } else if (lower.includes('br') || lower.includes('battle royale') || lower.includes('classic')) {
    mode = 'Battle Royale';
    if (lower.includes('duo')) type = 'Duo';
    else if (lower.includes('squad')) type = 'Squad';
    else type = 'Solo';
  }

  // Construct a user-friendly match title
  let title = fallbackTitle;
  if (!title || title.includes('Match Entry Fee') || title.includes('daily_')) {
    title = `${mode} ${type} (Slot #${slotNum})`;
  }

  return {
    id: cleanId,
    title,
    mode,
    type,
    map,
    matchDate,
    startTime,
    entryFee: fee,
    status: 'completed',
    isCompleted: true,
    isHistory: true
  };
};

/**
 * Recovers past completed matches from the user profile's transaction logs and prize payouts.
 */
export const extractCompletedMatchesFromTransactions = (userProfile = {}) => {
  const transactions = Array.isArray(userProfile.transactions) ? userProfile.transactions : [];
  if (transactions.length === 0) return [];

  const completedMap = new Map();

  // Find all entry fee / registration transactions
  transactions.forEach((tx) => {
    const isEntry = tx.type === 'entry_fee' || 
                    tx.type === 'registration' || 
                    String(tx.title || '').toLowerCase().includes('entry fee') ||
                    String(tx.title || '').toLowerCase().includes('registration') ||
                    String(tx.reason || '').toLowerCase().includes('entry fee');

    if (isEntry) {
      // Extract match ID from title or reason
      const combined = `${tx.title || ''} ${tx.reason || ''}`;
      const matchIdExtract = combined.match(/(daily_[a-zA-Z0-9_\-]+|tourney_[a-zA-Z0-9_\-]+|match_[a-zA-Z0-9_\-]+)/);
      const matchId = matchIdExtract ? matchIdExtract[1] : (tx.id || `hist_${tx.createdAt || Date.now()}`);

      if (!completedMap.has(matchId)) {
        const parsed = parseTournamentFromId(matchId, tx.title, tx.amount, tx.date);
        parsed.joinedAt = tx.createdAt || tx.date;
        parsed.feePaid = tx.amount || 0;
        completedMap.set(matchId, parsed);
      }
    }
  });

  // Attach any won prizes to the corresponding completed matches
  transactions.forEach((tx) => {
    if (tx.type === 'winning' || String(tx.title || '').includes('Tournament Prize Winnings')) {
      const reasonLower = String(tx.reason || '').toLowerCase();
      // Look for a completed match that matches the winning tournament reason
      for (const [id, m] of completedMap.entries()) {
        const modeLower = (m.mode || '').toLowerCase();
        const typeLower = (m.type || '').toLowerCase();
        if ((modeLower && reasonLower.includes(modeLower)) || (typeLower && reasonLower.includes(typeLower))) {
          m.prizeWon = (m.prizeWon || 0) + (parseFloat(tx.amount) || 0);
          m.prizeReason = tx.reason;
          break;
        }
      }
    }
  });

  return Array.from(completedMap.values());
};

/**
 * Returns all joined tournaments for a user across:
 * 1. Active matches in tournaments collection where user is in joinedPlayers
 * 2. Permanent matches saved in userProfile.joinedMatchesHistory
 * 3. Reconstructed historical matches from user transaction logs
 *
 * Guarantees every joined match is preserved and shows in Completed once finished.
 */
export const getUserAllJoinedMatches = (tournaments = [], userProfile = {}) => {
  const cleanUid = String(userProfile?.uid || userProfile?.id || '').trim().toLowerCase();
  const cleanEmail = String(userProfile?.email || '').trim().toLowerCase();

  const allMap = new Map();

  // 1. Matches from active tournaments collection where user joined
  if (Array.isArray(tournaments)) {
    tournaments.forEach((tourney) => {
      if (!tourney || !tourney.joinedPlayers) return;
      const isJoined = tourney.joinedPlayers.some((p) => {
        const pUid = String(p.uid || '').trim().toLowerCase();
        const pEmail = String(p.email || '').trim().toLowerCase();
        return (cleanUid && pUid === cleanUid) || (cleanEmail && pEmail === cleanEmail);
      });

      if (isJoined) {
        allMap.set(tourney.id, {
          ...tourney,
          isCompleted: isMatchCompleted(tourney),
          status: isMatchCompleted(tourney) ? 'completed' : (tourney.status || 'upcoming')
        });
      }
    });
  }

  // 2. Matches permanently stored in userProfile.joinedMatchesHistory
  const permanentHistory = Array.isArray(userProfile?.joinedMatchesHistory) ? userProfile.joinedMatchesHistory : [];
  permanentHistory.forEach((histMatch) => {
    if (!histMatch || !histMatch.id) return;
    if (!allMap.has(histMatch.id)) {
      allMap.set(histMatch.id, {
        ...histMatch,
        isCompleted: isMatchCompleted(histMatch),
        status: isMatchCompleted(histMatch) ? 'completed' : (histMatch.status || 'upcoming'),
        isHistory: true
      });
    } else {
      // Merge permanent record with active record to ensure joinedAt and details are preserved
      const existing = allMap.get(histMatch.id);
      allMap.set(histMatch.id, {
        ...histMatch,
        ...existing,
        isCompleted: isMatchCompleted(existing) || isMatchCompleted(histMatch)
      });
    }
  });

  // 3. Reconstruct matches from transactions (for older matches before permanent history)
  const fromTransactions = extractCompletedMatchesFromTransactions(userProfile);
  fromTransactions.forEach((txMatch) => {
    if (!allMap.has(txMatch.id)) {
      allMap.set(txMatch.id, txMatch);
    } else {
      // If active match found, attach prizeWon if any
      const existing = allMap.get(txMatch.id);
      if (txMatch.prizeWon && !existing.prizeWon) {
        existing.prizeWon = txMatch.prizeWon;
        existing.prizeReason = txMatch.prizeReason;
      }
    }
  });

  const mergedList = Array.from(allMap.values());

  // Sort: upcoming matches by start time, completed matches by most recent first
  mergedList.sort((a, b) => {
    const aComp = isMatchCompleted(a);
    const bComp = isMatchCompleted(b);

    // If one is completed and one is upcoming, keep upcoming first in 'all' view
    if (!aComp && bComp) return -1;
    if (aComp && !bComp) return 1;

    // Both completed: newest date/joinedAt first
    if (aComp && bComp) {
      const timeA = new Date(a.joinedAt || a.matchDate || 0).getTime() || getTournamentSortTimestamp(a);
      const timeB = new Date(b.joinedAt || b.matchDate || 0).getTime() || getTournamentSortTimestamp(b);
      return timeB - timeA;
    }

    // Both upcoming: sort chronologically
    return getTournamentSortTimestamp(a) - getTournamentSortTimestamp(b);
  });

  return mergedList;
};
