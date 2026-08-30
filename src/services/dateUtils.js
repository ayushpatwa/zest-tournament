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
