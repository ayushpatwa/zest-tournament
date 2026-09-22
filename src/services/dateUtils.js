/**
 * Date formatting and scheduling utilities for ZEST TOURNAMENT matches
 */

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

export const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

export const formatMatchDate = (matchDate, fallbackTime = '') => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  if (matchDate) {
    const cleanDate = String(matchDate).trim();
    if (cleanDate === todayStr || cleanDate.toLowerCase() === 'today') {
      const d = new Date();
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return 'Today, ' + day + ' ' + month;
    }
    if (cleanDate === tomorrowStr || cleanDate.toLowerCase() === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return 'Tomorrow, ' + day + ' ' + month;
    }

    // Try parsing YYYY-MM-DD
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(y, m, day);
      if (!isNaN(d.getTime())) {
        const month = d.toLocaleString('en-US', { month: 'short' });
        const currentYear = new Date().getFullYear();
        return y === currentYear ? (day + ' ' + month) : (day + ' ' + month + ' ' + y);
      }
    }

    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      const day = parsed.getDate();
      const month = parsed.toLocaleString('en-US', { month: 'short' });
      const year = parsed.getFullYear();
      const currentYear = new Date().getFullYear();
      return year === currentYear ? (day + ' ' + month) : (day + ' ' + month + ' ' + year);
    }
    return cleanDate;
  }

  // Fallback checking if fallbackTime has date
  if (fallbackTime) {
    if (fallbackTime.toLowerCase().includes('today')) return 'Today';
    if (fallbackTime.toLowerCase().includes('tomorrow')) return 'Tomorrow';
  }

  return 'Today';
};

/**
 * Parses time strings like "10:00 AM", "01:30 PM", "03:00 PM - 04:00 PM", "14:00", etc.
 * Returns minutes from midnight (0 to 1439).
 */
export const parseTimeStringToMinutes = (timeStr) => {
  if (!timeStr) return 9999;
  const str = String(timeStr).trim();

  // If contains range like "03:00 PM - 04:00 PM", take the first start time
  const firstPart = str.split('-')[0].trim();

  // Match 12-hour format e.g. "10:00 AM", "1:30 pm", "10:00am"
  const match12 = firstPart.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = (match12[3] || '').toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Match simple hour format e.g. "10 AM", "1 pm"
  const matchSimple = firstPart.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (matchSimple) {
    let hours = parseInt(matchSimple[1], 10);
    const ampm = matchSimple[2].toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return hours * 60;
  }

  // Fallback ISO or standard Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.getHours() * 60 + d.getMinutes();
  }

  return 9999;
};

/**
 * Returns a sortable numeric timestamp (milliseconds) for any tournament
 * by combining its matchDate and startTime/slotIndex.
 */
export const getTournamentSortTimestamp = (t) => {
  if (!t) return 0;

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();
  let datePart = String(t.matchDate || '').trim();

  if (!datePart || datePart.toLowerCase() === 'today') {
    datePart = todayStr;
  } else if (datePart.toLowerCase() === 'tomorrow') {
    datePart = tomorrowStr;
  }

  const slotMinutes = (typeof t.slotIndex === 'number' && t.slotIndex > 0)
    ? (570 + t.slotIndex * 30) // slot 1 = 600 min (10:00 AM)
    : parseTimeStringToMinutes(t.startTime);

  // Try parsing YYYY-MM-DD
  const dateParts = datePart.split('-');
  if (dateParts.length === 3) {
    const y = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10) - 1;
    const d = parseInt(dateParts[2], 10);
    const dateObj = new Date(y, m, d, 0, 0, 0, 0);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.getTime() + slotMinutes * 60 * 1000;
    }
  }

  const parsedDate = new Date(datePart);
  if (!isNaN(parsedDate.getTime())) {
    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate.getTime() + slotMinutes * 60 * 1000;
  }

  return slotMinutes;
};

/**
 * Compares two tournaments chronologically by date and time
 */
export const compareTournamentsByTime = (a, b) => {
  const timeA = getTournamentSortTimestamp(a);
  const timeB = getTournamentSortTimestamp(b);
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  if (typeof a.slotIndex === 'number' && typeof b.slotIndex === 'number') {
    return a.slotIndex - b.slotIndex;
  }
  return String(a.id || '').localeCompare(String(b.id || ''));
};

/**
 * Sorts any list of tournaments chronologically by date and time
 */
export const sortTournamentsByTime = (tournaments = []) => {
  if (!Array.isArray(tournaments)) return [];
  return [...tournaments].sort(compareTournamentsByTime);
};
