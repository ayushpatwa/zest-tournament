import React, { useState } from 'react';
import { 
  getTodayDateString, 
  getTomorrowDateString, 
  formatMatchDate, 
  sortTournamentsByTime 
} from '../services/dateUtils';
import { 
  copyDayScheduleRealtime, 
  publishDayScheduleRealtime, 
  unpublishDayScheduleRealtime, 
  toggleMatchPublishRealtime, 
  updateMatchDetailsRealtime, 
  deleteMatchRealtime,
  generateDaily1v1Matches, 
  generateDailyClassicBRMatches,
  deleteDailyMatchesByDate 
} from '../services/scheduleService';

export default function HostDayPlanner({ tournaments = [], isHost = true }) {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  // Active view date in planner (defaults to tomorrow or today)
  const [plannerDate, setPlannerDate] = useState(tomorrowStr);

  // Copy-paste state
  const [showCopyPanel, setShowCopyPanel] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState(todayStr);
  const [copyTargetDate, setCopyTargetDate] = useState(tomorrowStr);
  const [copyAsDraft, setCopyAsDraft] = useState(true);

  // Feedback & Loading
  const [actionStatus, setActionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Inline Match Editor Modal state
  const [editingMatch, setEditingMatch] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    map: 'Bermuda',
    mode: 'Solo',
    type: 'Classic Battle Royale',
    startTime: '10:00 AM',
    matchDate: '',
    entryFee: 5,
    prizePool: 10,
    perKillPrize: 3,
    maxSlots: 10,
    isPublished: false
  });

  // Filter tournaments belonging to plannerDate
  const dayMatches = sortTournamentsByTime(
    tournaments.filter(t => {
      const docDate = String(t.matchDate || '').trim();
      return docDate === plannerDate || t.id.includes(plannerDate);
    })
  );

  const draftCount = dayMatches.filter(m => m.isDraft === true || m.isPublished === false || m.status === 'draft').length;
  const publishedCount = dayMatches.filter(m => m.isPublished === true && m.status !== 'draft').length;
  const totalCount = dayMatches.length;

  // Matches in source date for copy feedback
  const sourceDateMatches = tournaments.filter(t => {
    const docDate = String(t.matchDate || '').trim();
    return docDate === copySourceDate || t.id.includes(copySourceDate);
  });

  // Handlers
  const handleCopyFullDay = async () => {
    if (!copySourceDate || !copyTargetDate) {
      setActionStatus('⚠️ Please select both Source Date and Target Date.');
      return;
    }
    if (copySourceDate === copyTargetDate) {
      setActionStatus('⚠️ Source Date and Target Date cannot be the same day.');
      return;
    }
    if (sourceDateMatches.length === 0) {
      setActionStatus(`⚠️ No matches found on Source Date (${copySourceDate}) to copy.`);
      return;
    }

    setIsLoading(true);
    setActionStatus(`⏳ Copying ${sourceDateMatches.length} matches from ${copySourceDate} to ${copyTargetDate} (${copyAsDraft ? 'as Drafts' : 'and Publishing'})...`);

    const res = await copyDayScheduleRealtime(copySourceDate, copyTargetDate, copyAsDraft);
    setIsLoading(false);

    if (res.success) {
      setActionStatus(`🎉 Success! Copied ${res.copiedCount} matches to ${copyTargetDate} as ${copyAsDraft ? 'Drafts (Hidden from players)' : 'Published (Live in Arena)'}!`);
      setPlannerDate(copyTargetDate);
      setShowCopyPanel(false);
    } else {
      setActionStatus(`⚠️ Error copying matches: ${res.error || 'Failed'}`);
    }
    setTimeout(() => setActionStatus(''), 8000);
  };

  const handlePublishAll = async () => {
    if (draftCount === 0) {
      setActionStatus('⚠️ No draft matches to publish for this date.');
      return;
    }
    if (!window.confirm(`🚀 PUBLISH ALL MATCHES FOR ${plannerDate}?\n\nAll ${draftCount} draft matches will immediately become LIVE and visible to all players in the Arena!`)) {
      return;
    }

    setIsLoading(true);
    setActionStatus(`⏳ Publishing all matches for ${plannerDate}...`);
    const res = await publishDayScheduleRealtime(plannerDate);
    setIsLoading(false);

    if (res.success) {
      setActionStatus(`🚀 Published ${res.count} matches for ${plannerDate}! They are now live and visible to players in the Arena!`);
    } else {
      setActionStatus(`⚠️ Error publishing matches: ${res.error || 'Failed'}`);
    }
    setTimeout(() => setActionStatus(''), 7000);
  };

  const handleUnpublishAll = async () => {
    if (publishedCount === 0) {
      setActionStatus('⚠️ No published matches to unpublish for this date.');
      return;
    }
    if (!window.confirm(`⏸️ UNPUBLISH ALL MATCHES FOR ${plannerDate}?\n\nAll matches for this date will be reverted to DRAFT mode. The public Arena match section will immediately be CLEAR for all regular players!`)) {
      return;
    }

    setIsLoading(true);
    setActionStatus(`⏳ Reverting matches for ${plannerDate} to Draft mode...`);
    const res = await unpublishDayScheduleRealtime(plannerDate);
    setIsLoading(false);

    if (res.success) {
      setActionStatus(`⏸️ Unpublished ${res.count} matches for ${plannerDate}! The match section in Arena is now completely clear for regular players.`);
    } else {
      setActionStatus(`⚠️ Error unpublishing matches: ${res.error || 'Failed'}`);
    }
    setTimeout(() => setActionStatus(''), 7000);
  };

  const handleToggleSinglePublish = async (match) => {
    const isCurrentlyPublished = match.isPublished === true && match.status !== 'draft';
    const nextState = !isCurrentlyPublished;
    setIsLoading(true);
    const res = await toggleMatchPublishRealtime(match.id, nextState);
    setIsLoading(false);
    if (res.success) {
      setActionStatus(nextState ? `🚀 Match "${match.title}" published! Visible to players.` : `⏸️ Match "${match.title}" reverted to draft! Hidden from players.`);
    } else {
      setActionStatus(`⚠️ Error: ${res.error}`);
    }
    setTimeout(() => setActionStatus(''), 4000);
  };

  const handleOpenEdit = (match) => {
    setEditingMatch(match);
    const isPub = match.isPublished === true && match.status !== 'draft';
    setEditForm({
      title: match.title || '',
      map: match.map || 'Bermuda',
      mode: match.mode || 'Solo',
      type: match.type || 'Classic Battle Royale',
      startTime: match.startTime || '10:00 AM',
      matchDate: match.matchDate || plannerDate,
      entryFee: match.entryFee ?? 5,
      prizePool: match.prizePool ?? 10,
      perKillPrize: match.perKillPrize ?? 0,
      maxSlots: match.maxSlots || match.slotsTotal || 10,
      isPublished: isPub
    });
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingMatch) return;

    setIsLoading(true);
    const updatedPayload = {
      title: editForm.title.trim(),
      map: editForm.map,
      mode: editForm.mode,
      type: editForm.type,
      startTime: editForm.startTime,
      matchDate: editForm.matchDate,
      entryFee: parseFloat(editForm.entryFee) || 0,
      prizePool: parseFloat(editForm.prizePool) || 0,
      perKillPrize: parseFloat(editForm.perKillPrize) || 0,
      maxSlots: parseInt(editForm.maxSlots, 10) || 10,
      slotsTotal: parseInt(editForm.maxSlots, 10) || 10,
      isPublished: editForm.isPublished,
      isDraft: !editForm.isPublished,
      status: editForm.isPublished ? 'upcoming' : 'draft'
    };

    const res = await updateMatchDetailsRealtime(editingMatch.id, updatedPayload);
    setIsLoading(false);

    if (res.success) {
      setActionStatus(`✅ Match "${updatedPayload.title}" updated successfully!`);
      setEditingMatch(null);
    } else {
      setActionStatus(`⚠️ Error updating match: ${res.error}`);
    }
    setTimeout(() => setActionStatus(''), 5000);
  };

  const handleDeleteMatch = async (match) => {
    if (!window.confirm(`Are you sure you want to delete match "${match.title || match.id}"?`)) return;
    setIsLoading(true);
    const res = await deleteMatchRealtime(match.id);
    setIsLoading(false);
    if (res.success) {
      setActionStatus(`🗑️ Match "${match.title || match.id}" deleted.`);
    } else {
      setActionStatus(`⚠️ Error: ${res.error}`);
    }
    setTimeout(() => setActionStatus(''), 5000);
  };

  const handleAutoGenerate = async (type, asDraft = true) => {
    setIsLoading(true);
    setActionStatus(`⏳ Auto-generating ${type === 'br' ? '25 Classic BR' : '25 1v1'} matches for ${plannerDate} (${asDraft ? 'as Drafts' : 'Published'})...`);
    let res;
    if (type === 'br') {
      res = await generateDailyClassicBRMatches(plannerDate, false, asDraft);
    } else if (type === '1v1') {
      res = await generateDaily1v1Matches(plannerDate, false, asDraft);
    }
    setIsLoading(false);
    if (res.success) {
      setActionStatus(`🎉 Created ${res.createdCount} matches for ${plannerDate} (${asDraft ? 'Drafts - Hidden until published' : 'Live'})!`);
    } else {
      setActionStatus(`⚠️ Error: ${res.error || 'Failed to generate matches'}`);
    }
    setTimeout(() => setActionStatus(''), 7000);
  };

  const handleClearDay = async () => {
    if (!window.confirm(`⚠️ PERMANENTLY DELETE ALL MATCHES FOR ${plannerDate}?\n\nThis will remove all matches for this day from the database.`)) {
      return;
    }
    setIsLoading(true);
    setActionStatus(`⏳ Deleting all matches for ${plannerDate}...`);
    const res = await deleteDailyMatchesByDate(plannerDate, true);
    setIsLoading(false);
    if (res.success) {
      setActionStatus(`🗑️ Deleted ${res.count} matches for ${plannerDate}.`);
    } else {
      setActionStatus(`⚠️ Error: ${res.error}`);
    }
    setTimeout(() => setActionStatus(''), 7000);
  };

  return (
    <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header with Host Badge */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>📅</span>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#fff', fontFamily: 'var(--font-heading)' }}>
              Host Match Staging & Day Planner
            </h2>
            <span style={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)',
              color: '#000',
              fontWeight: '900',
              fontSize: '0.65rem',
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.5px'
            }}>
              HOST ONLY
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Stage tomorrow's matches, edit parameters in private, copy full day schedules, and publish only when ready.
            Until published, regular players see a clean, clear match section!
          </p>
        </div>

        <button
          onClick={() => setShowCopyPanel(!showCopyPanel)}
          className="btn"
          style={{
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: '800',
            borderRadius: '10px',
            background: showCopyPanel ? 'var(--secondary)' : 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)',
            color: showCopyPanel ? '#000' : '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0, 229, 255, 0.3)'
          }}
        >
          <span>📋</span>
          <span>{showCopyPanel ? 'Close Copy Tool' : 'Copy Full Day Matches'}</span>
        </button>
      </div>

      {/* 2. Action Status Feedback Banner */}
      {actionStatus && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: actionStatus.includes('Error') || actionStatus.includes('⚠️') 
            ? 'rgba(255, 23, 68, 0.15)' 
            : 'rgba(0, 230, 118, 0.15)',
          border: `1px solid ${actionStatus.includes('Error') || actionStatus.includes('⚠️') ? 'var(--danger)' : 'var(--success)'}`,
          color: actionStatus.includes('Error') || actionStatus.includes('⚠️') ? '#ff5252' : '#00e676',
          fontSize: '0.88rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{actionStatus.includes('Error') || actionStatus.includes('⚠️') ? '⚠️' : '⚡'}</span>
          <span>{actionStatus}</span>
        </div>
      )}

      {/* 3. Collapsible Copy Full Day Schedule Box */}
      {showCopyPanel && (
        <div style={{
          padding: '18px',
          borderRadius: '12px',
          background: 'rgba(0, 229, 255, 0.05)',
          border: '1.5px solid rgba(0, 229, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#00e5ff' }}>
              Duplicate Full Day Matches to Next Day / Target Date
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            This will take every match from your Source Date, duplicate its settings (time, title, mode, entry fee, prizes),
            and paste them into your Target Date with fresh player slots (0 joined).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>
                1. SOURCE DATE (Copy From):
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="date"
                  value={copySourceDate}
                  onChange={(e) => setCopySourceDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(7, 9, 14, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCopySourceDate(todayStr)}
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Today
                </button>
              </div>
              <span style={{ fontSize: '0.72rem', color: sourceDateMatches.length > 0 ? '#00e676' : '#ff9100', marginTop: '4px', display: 'block' }}>
                {sourceDateMatches.length > 0 ? `✓ Found ${sourceDateMatches.length} matches on ${copySourceDate}` : `⚠️ No matches on ${copySourceDate}`}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>
                2. TARGET DATE (Paste To):
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(7, 9, 14, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCopyTargetDate(tomorrowStr)}
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>

          {/* Mode Option: Paste as Draft vs Published */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: 'rgba(7, 9, 14, 0.6)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <input
              type="checkbox"
              id="copyAsDraftToggle"
              checked={copyAsDraft}
              onChange={(e) => setCopyAsDraft(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00e676' }}
            />
            <label htmlFor="copyAsDraftToggle" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer' }}>
              <strong>🔒 Paste as Staged Drafts (Recommended):</strong> Matches will be hidden from regular players until you review and click "Publish".
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowCopyPanel(false)}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopyFullDay}
              disabled={isLoading || sourceDateMatches.length === 0}
              className="btn"
              style={{
                padding: '10px 20px',
                fontSize: '0.85rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)',
                color: '#000',
                borderRadius: '8px',
                border: 'none',
                cursor: (isLoading || sourceDateMatches.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '⏳ Copying Schedule...' : `📋 Copy & Paste ${sourceDateMatches.length} Matches to ${copyTargetDate}`}
            </button>
          </div>
        </div>
      )}

      {/* 4. Date Navigator & Stats Banner */}
      <div style={{
        padding: '16px',
        background: 'rgba(7, 9, 14, 0.6)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Date Selector Row */}
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>Viewing Date:</span>
            <button
              type="button"
              onClick={() => setPlannerDate(todayStr)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                background: plannerDate === todayStr ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: plannerDate === todayStr ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                fontWeight: plannerDate === todayStr ? '900' : '500'
              }}
            >
              📅 Today ({todayStr})
            </button>
            <button
              type="button"
              onClick={() => setPlannerDate(tomorrowStr)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                background: plannerDate === tomorrowStr ? 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)' : 'rgba(255,255,255,0.05)',
                color: plannerDate === tomorrowStr ? '#000' : '#fff',
                border: plannerDate === tomorrowStr ? '1px solid #00e5ff' : '1px solid var(--border-color)',
                fontWeight: plannerDate === tomorrowStr ? '900' : '500'
              }}
            >
              📅 Tomorrow ({tomorrowStr})
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Other:</span>
              <input
                type="date"
                value={plannerDate}
                onChange={(e) => setPlannerDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>

          {/* Quick Schedule Generator Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleAutoGenerate('br', true)}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#00e5ff', borderColor: 'rgba(0, 229, 255, 0.4)' }}
            >
              + Generate 25 Classic BR (Draft)
            </button>
            <button
              type="button"
              onClick={() => handleAutoGenerate('1v1', true)}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#ffb74d', borderColor: 'rgba(255, 183, 77, 0.4)' }}
            >
              + Generate 25 1v1 (Draft)
            </button>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={handleClearDay}
                disabled={isLoading}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#ff5252', borderColor: 'rgba(255, 82, 82, 0.4)' }}
              >
                🗑️ Clear Day
              </button>
            )}
          </div>
        </div>

        {/* Visibility Status Bar */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: totalCount === 0 
            ? 'rgba(255, 255, 255, 0.03)'
            : draftCount === totalCount
              ? 'rgba(255, 152, 0, 0.12)'
              : publishedCount === totalCount
                ? 'rgba(0, 230, 118, 0.12)'
                : 'rgba(255, 214, 0, 0.12)',
          border: `1.5px solid ${
            totalCount === 0 
              ? 'var(--border-color)' 
              : draftCount === totalCount 
                ? '#ff9800' 
                : publishedCount === totalCount 
                  ? '#00e676' 
                  : '#ffd600'
          }`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>
                {totalCount === 0 ? '⚪' : draftCount === totalCount ? '🔒' : publishedCount === totalCount ? '🟢' : '🟡'}
              </span>
              <strong style={{
                fontSize: '0.92rem',
                color: totalCount === 0 ? 'var(--text-muted)' : draftCount === totalCount ? '#ffb74d' : publishedCount === totalCount ? '#00e676' : '#ffd600'
              }}>
                {totalCount === 0
                  ? `No matches scheduled for ${formatMatchDate(plannerDate)}`
                  : draftCount === totalCount
                    ? `100% STAGED DRAFTS (${draftCount} Matches Hidden from Players)`
                    : publishedCount === totalCount
                      ? `100% PUBLISHED & LIVE (${publishedCount} Matches Visible in Arena)`
                      : `PARTIALLY PUBLISHED (${publishedCount} Live in Arena, ${draftCount} Hidden Drafts)`}
              </strong>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {totalCount === 0
                ? 'Use the "Copy Full Day Matches" button above or auto-generate matches for this date.'
                : draftCount === totalCount
                  ? 'The public Arena match section is completely CLEAR for all regular players until you click Publish below!'
                  : publishedCount === totalCount
                    ? 'All matches for this date are currently visible to players. They can register and view details.'
                    : 'Players can only see the published matches. Drafts remain hidden.'}
            </p>
          </div>

          {/* Action Buttons for Day */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {draftCount > 0 && (
              <button
                type="button"
                onClick={handlePublishAll}
                disabled={isLoading}
                className="btn"
                style={{
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)',
                  color: '#000',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(0, 230, 118, 0.4)',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                🚀 PUBLISH ALL ({draftCount}) TO ARENA
              </button>
            )}

            {publishedCount > 0 && (
              <button
                type="button"
                onClick={handleUnpublishAll}
                disabled={isLoading}
                className="btn"
                style={{
                  padding: '9px 16px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  background: 'rgba(255, 152, 0, 0.15)',
                  color: '#ffb74d',
                  borderRadius: '8px',
                  border: '1px solid #ff9800',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                ⏸️ Unpublish ({publishedCount}) to Draft
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Matches List for Selected Date */}
      <div>
        <div className="flex-between" style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋 Scheduled Matches for {formatMatchDate(plannerDate)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              ({totalCount} matches • {publishedCount} Live • {draftCount} Drafts)
            </span>
          </h3>
        </div>

        {totalCount === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'rgba(7, 9, 14, 0.4)',
            borderRadius: '12px',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗓️</div>
            <h4 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 6px 0' }}>
              No matches scheduled for {formatMatchDate(plannerDate)}
            </h4>
            <p style={{ fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto 16px auto', lineHeight: '1.4' }}>
              You can duplicate a full day schedule from Today using the Copy button above, or click below to auto-generate matches as drafts.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowCopyPanel(true)}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              >
                📋 Copy Full Day Matches & Paste Here
              </button>
              <button
                type="button"
                onClick={() => handleAutoGenerate('br', true)}
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.82rem', color: '#00e5ff' }}
              >
                👑 Auto-Generate 25 Classic BR
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dayMatches.map((match, idx) => {
              const isPub = match.isPublished === true && match.status !== 'draft';
              const totalSlots = match.slotsTotal || match.maxSlots || 10;
              const joinedSlots = Math.max(match.slotsJoined || 0, (match.joinedPlayers || []).length);

              return (
                <div
                  key={match.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: isPub ? 'rgba(7, 9, 14, 0.7)' : 'rgba(255, 152, 0, 0.04)',
                    border: isPub ? '1px solid var(--border-color)' : '1px dashed rgba(255, 152, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  {/* Left: Time, Title & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                    <div style={{
                      minWidth: '75px',
                      textAlign: 'center',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#00e5ff' }}>
                        {match.startTime || '10:00 AM'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        Slot {match.slotIndex || idx + 1}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>
                          {match.title}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          background: isPub ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 152, 0, 0.2)',
                          color: isPub ? '#00e676' : '#ffb74d',
                          border: `1px solid ${isPub ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 152, 0, 0.5)'}`
                        }}>
                          {isPub ? '🟢 LIVE IN ARENA' : '🔒 DRAFT (HIDDEN)'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>🎮 {match.mode} ({match.type})</span>
                        <span>🗺️ {match.map || 'Bermuda'}</span>
                        <span style={{ color: '#00e676', fontWeight: '700' }}>Entry: ₹{match.entryFee}</span>
                        <span style={{ color: '#ffd600', fontWeight: '700' }}>Prize: ₹{match.prizePool}</span>
                        {match.perKillPrize > 0 && (
                          <span style={{ color: '#ff4081', fontWeight: '700' }}>Kill: ₹{match.perKillPrize}</span>
                        )}
                        <span>👥 Slots: {joinedSlots}/{totalSlots}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleSinglePublish(match)}
                      disabled={isLoading}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        borderRadius: '6px',
                        background: isPub ? 'rgba(255, 152, 0, 0.15)' : 'rgba(0, 230, 118, 0.15)',
                        color: isPub ? '#ffb74d' : '#00e676',
                        border: `1px solid ${isPub ? '#ff9800' : '#00e676'}`
                      }}
                    >
                      {isPub ? '⏸️ Hide (Draft)' : '🚀 Publish (Live)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(match)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700', borderRadius: '6px' }}
                    >
                      ✏️ Edit Match
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(match)}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#ff5252', borderColor: 'rgba(255, 82, 82, 0.3)', borderRadius: '6px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Inline Match Editor Modal */}
      {editingMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface-color, #151c33)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}>
            <div className="flex-between">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✏️</span> Edit Match Details
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {editingMatch.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.3rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Match Title *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(7, 9, 14, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Grid: Start Time, Match Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Start Time (e.g. 10:00 AM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Match Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.matchDate}
                    onChange={(e) => setEditForm({ ...editForm, matchDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Grid: Map, Mode, Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Map
                  </label>
                  <select
                    value={editForm.map}
                    onChange={(e) => setEditForm({ ...editForm, map: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.82rem'
                    }}
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                    <option value="NexTerra">NexTerra</option>
                    <option value="Iron Cage">Iron Cage</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Mode
                  </label>
                  <select
                    value={editForm.mode}
                    onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.82rem'
                    }}
                  >
                    <option value="Solo">Solo</option>
                    <option value="Duo">Duo</option>
                    <option value="Squad">Squad</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Type
                  </label>
                  <input
                    type="text"
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>

              {/* Grid: Entry Fee, Prize Pool, Per Kill, Max Slots */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Entry Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.entryFee}
                    onChange={(e) => setEditForm({ ...editForm, entryFee: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#00e676',
                      fontWeight: '800',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Prize Pool (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.prizePool}
                    onChange={(e) => setEditForm({ ...editForm, prizePool: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#ffd600',
                      fontWeight: '800',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Per-Kill (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.perKillPrize}
                    onChange={(e) => setEditForm({ ...editForm, perKillPrize: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#ff4081',
                      fontWeight: '800',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Max Slots
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={editForm.maxSlots}
                    onChange={(e) => setEditForm({ ...editForm, maxSlots: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(7, 9, 14, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Publish Visibility Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: editForm.isPublished ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                border: `1px solid ${editForm.isPublished ? '#00e676' : '#ff9800'}`
              }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: editForm.isPublished ? '#00e676' : '#ffb74d' }}>
                    {editForm.isPublished ? '🟢 Published (Visible to Players in Arena)' : '🔒 Draft Staging (Hidden from Players)'}
                  </strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {editForm.isPublished ? 'Players can view and register immediately.' : 'Only hosts can view. Clear for all players.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isPublished: !editForm.isPublished })}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    background: editForm.isPublished ? '#00e676' : '#ff9800',
                    color: '#000',
                    borderRadius: '6px',
                    border: 'none'
                  }}
                >
                  {editForm.isPublished ? 'Change to Draft' : 'Change to Publish'}
                </button>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: '800' }}
                >
                  {isLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
