import React, { useState, useEffect } from 'react';

export default function GenerateMatchModal({
  isOpen,
  onClose,
  type = '1v1', // '1v1' | '2v2' | '4v4' | 'br'
  targetDate = '',
  asDraft = true,
  onConfirm,
  isLoading = false
}) {
  const is1v1 = type === '1v1';
  const is2v2 = type === '2v2';
  const is4v4 = type === '4v4';
  const isBR = type === 'br';

  // State defaults by type
  const [prizePool, setPrizePool] = useState('40');
  const [entryFee, setEntryFee] = useState('25');
  const [slotsTotal, setSlotsTotal] = useState('2');
  const [perKillPrize, setPerKillPrize] = useState('0');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset defaults when opening or switching type
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (type === '1v1') {
        setPrizePool('40');
        setEntryFee('25');
        setSlotsTotal('2');
        setPerKillPrize('0');
      } else if (type === '2v2') {
        setPrizePool('90');
        setEntryFee('30');
        setSlotsTotal('4');
        setPerKillPrize('0');
      } else if (type === '4v4') {
        setPrizePool('240');
        setEntryFee('40');
        setSlotsTotal('8');
        setPerKillPrize('0');
      } else {
        // BR
        setPrizePool('100');
        setEntryFee('30');
        setSlotsTotal('48');
        setPerKillPrize('25');
      }
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const prize = parseFloat(prizePool);
    const fee = parseFloat(entryFee);
    const slots = parseInt(slotsTotal, 10);
    const perKill = parseFloat(perKillPrize);

    if (isNaN(prize) || prize < 0) {
      setErrorMsg('Please enter a valid Winning Prize (min ₹0).');
      return;
    }
    if (isNaN(fee) || fee < 0) {
      setErrorMsg('Please enter a valid Entry Fee (min ₹0).');
      return;
    }
    if (isBR) {
      if (isNaN(slots) || slots < 2 || slots > 100) {
        setErrorMsg('Please enter valid Number of Players (between 2 and 100).');
        return;
      }
      if (isNaN(perKill) || perKill < 0) {
        setErrorMsg('Please enter a valid Per Kill Prize (min ₹0).');
        return;
      }
    }

    const resolvedSlots = is1v1 ? 2 : is2v2 ? 4 : is4v4 ? 8 : slots;
    const resolvedPerKill = isBR ? perKill : 0;

    onConfirm({
      type,
      prizePool: prize,
      entryFee: fee,
      slotsTotal: resolvedSlots,
      perKillPrize: resolvedPerKill,
      overwriteExisting,
      asDraft
    });
  };

  const getBorderColor = () => {
    if (is1v1) return 'rgba(255, 183, 77, 0.4)';
    if (is2v2) return 'rgba(0, 229, 255, 0.4)';
    if (is4v4) return 'rgba(124, 77, 255, 0.45)';
    return 'rgba(255, 214, 0, 0.4)';
  };

  const getBoxShadow = () => {
    if (is1v1) return '0 10px 40px rgba(255, 183, 77, 0.2)';
    if (is2v2) return '0 10px 40px rgba(0, 229, 255, 0.2)';
    if (is4v4) return '0 10px 40px rgba(124, 77, 255, 0.25)';
    return '0 10px 40px rgba(255, 214, 0, 0.2)';
  };

  const getSubmitGradient = () => {
    if (is1v1) return 'linear-gradient(135deg, #ff9100 0%, #ff3d00 100%)';
    if (is2v2) return 'linear-gradient(135deg, #00e5ff 0%, #00b0ff 100%)';
    if (is4v4) return 'linear-gradient(135deg, #7c4dff 0%, #536dfe 100%)';
    return 'linear-gradient(135deg, #ffd600 0%, #ff6d00 100%)';
  };

  const getSubmitColor = () => {
    if (is2v2) return '#000';
    if (isBR) return '#000';
    return '#fff';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#121728',
        border: `1.5px solid ${getBorderColor()}`,
        borderRadius: '16px',
        padding: '22px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: getBoxShadow(),
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'slideUp 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>
                {is1v1 ? '⚔️' : is2v2 ? '⚔️' : is4v4 ? '🛡️' : '👑'}
              </span>
              <h3 style={{
                margin: 0,
                fontSize: '1.15rem',
                color: '#fff',
                fontFamily: 'var(--font-heading)'
              }}>
                {is1v1 && 'Generate 1v1 Matches (25 Slots)'}
                {is2v2 && 'Generate 2v2 Duo Matches (25 Slots)'}
                {is4v4 && 'Generate 4v4 Squad Matches (25 Slots)'}
                {isBR && 'Generate Battle Royale (BR) (25 Slots)'}
              </h3>
            </div>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              Set custom prize & entry fee {isBR ? '& players ' : ''}for {targetDate ? `date: ${targetDate}` : 'today'}
              {asDraft ? ' (saved as Drafts)' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: '1',
              padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.15)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Winning Prize */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffd600' }}>
                🏆 Winning Prize (₹) *
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Amount paid to winner</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ffd600', fontWeight: 'bold' }}>
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder={is1v1 ? "e.g. 40" : is2v2 ? "e.g. 90" : is4v4 ? "e.g. 240" : "e.g. 100"}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 28px',
                  borderRadius: '8px',
                  background: 'rgba(7, 9, 14, 0.9)',
                  border: '1px solid rgba(255, 214, 0, 0.3)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '700'
                }}
              />
            </div>
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {(is1v1 
                ? ['20', '40', '50', '80', '100'] 
                : is2v2 
                ? ['60', '90', '120', '150', '200']
                : is4v4
                ? ['160', '200', '240', '320', '400']
                : ['50', '100', '150', '200', '500']
              ).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPrizePool(val)}
                  style={{
                    background: prizePool === val ? 'rgba(255, 214, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: prizePool === val ? '1px solid #ffd600' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: prizePool === val ? '#ffd600' : 'var(--text-muted)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Fee */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ff7043' }}>
                🎟️ Entry Fee (₹) *
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deducted from player wallet</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ff7043', fontWeight: 'bold' }}>
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder={is1v1 ? "e.g. 25" : is2v2 ? "e.g. 30" : is4v4 ? "e.g. 40" : "e.g. 30"}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 28px',
                  borderRadius: '8px',
                  background: 'rgba(7, 9, 14, 0.9)',
                  border: '1px solid rgba(255, 112, 67, 0.3)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '700'
                }}
              />
            </div>
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {(is1v1 
                ? ['0', '10', '20', '25', '50'] 
                : is2v2 
                ? ['0', '15', '20', '30', '50']
                : is4v4
                ? ['0', '20', '30', '40', '50']
                : ['10', '20', '25', '30', '50']
              ).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEntryFee(val)}
                  style={{
                    background: entryFee === val ? 'rgba(255, 112, 67, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: entryFee === val ? '1px solid #ff7043' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: entryFee === val ? '#ff7043' : 'var(--text-muted)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  {val === '0' ? 'Free (₹0)' : `₹${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* BR ONLY: Number of Players (Slots) */}
          {isBR && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#00e5ff' }}>
                  👥 Number of Players (Slots) *
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max capacity per match</span>
              </div>
              <input
                type="number"
                min="2"
                max="100"
                step="1"
                required
                value={slotsTotal}
                onChange={(e) => setSlotsTotal(e.target.value)}
                placeholder="e.g. 48"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(7, 9, 14, 0.9)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '700'
                }}
              />
              {/* Quick Slots Presets */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['12', '24', '48'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSlotsTotal(val)}
                    style={{
                      background: slotsTotal === val ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: slotsTotal === val ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: slotsTotal === val ? '#00e5ff' : 'var(--text-muted)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    {val} Players
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BR ONLY: Per Kill Prize */}
          {isBR && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#00e676' }}>
                  🎯 Per Kill Bounty (₹)
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cash per kill reward</span>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#00e676', fontWeight: 'bold' }}>
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={perKillPrize}
                  onChange={(e) => setPerKillPrize(e.target.value)}
                  placeholder="e.g. 25"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 28px',
                    borderRadius: '8px',
                    background: 'rgba(7, 9, 14, 0.9)',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: '700'
                  }}
                />
              </div>
              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['0', '10', '20', '25', '30'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPerKillPrize(val)}
                    style={{
                      background: perKillPrize === val ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: perKillPrize === val ? '1px solid #00e676' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: perKillPrize === val ? '#00e676' : 'var(--text-muted)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    {val === '0' ? 'No Kill Reward' : `₹${val}/kill`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary Preview Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.75rem',
            lineHeight: '1.4',
            color: 'var(--text-muted)'
          }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>
              📋 Generation Preview:
            </strong>
            {is1v1 && (
              <span>
                25 matches from 10:00 AM to 10:00 PM • <strong>2 Players (1v1 Solo)</strong> • Winning Prize: <strong style={{ color: '#ffd600' }}>₹{prizePool || 40}</strong> • Entry Fee: <strong style={{ color: '#ff7043' }}>₹{entryFee || 25}</strong> • Per Kill: ₹0
              </span>
            )}
            {is2v2 && (
              <span>
                25 matches from 10:00 AM to 10:00 PM • <strong>4 Players (2v2 Duo)</strong> • Winning Prize: <strong style={{ color: '#ffd600' }}>₹{prizePool || 90}</strong> • Entry Fee: <strong style={{ color: '#ff7043' }}>₹{entryFee || 30}</strong> • Per Kill: ₹0
              </span>
            )}
            {is4v4 && (
              <span>
                25 matches from 10:00 AM to 10:00 PM • <strong>8 Players (4v4 Squad)</strong> • Winning Prize: <strong style={{ color: '#ffd600' }}>₹{prizePool || 240}</strong> • Entry Fee: <strong style={{ color: '#ff7043' }}>₹{entryFee || 40}</strong> • Per Kill: ₹0
              </span>
            )}
            {isBR && (
              <span>
                25 Classic BR matches (10:00 AM - 10:00 PM) • <strong style={{ color: '#00e5ff' }}>{slotsTotal || 48} Players</strong> • Winning Prize: <strong style={{ color: '#ffd600' }}>₹{prizePool || 100}</strong> • Kill Bounty: <strong style={{ color: '#00e676' }}>₹{perKillPrize || 25}</strong> • Entry: <strong style={{ color: '#ff7043' }}>₹{entryFee || 30}</strong>
              </span>
            )}
          </div>

          {/* Overwrite Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Overwrite & update if matches already exist for this day</span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 2,
                padding: '10px 16px',
                borderRadius: '8px',
                background: getSubmitGradient(),
                border: 'none',
                color: getSubmitColor(),
                fontSize: '0.86rem',
                fontWeight: '800',
                fontFamily: 'var(--font-heading)',
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: is1v1 ? '0 4px 15px rgba(255, 145, 0, 0.4)' : is2v2 ? '0 4px 15px rgba(0, 229, 255, 0.4)' : is4v4 ? '0 4px 15px rgba(124, 77, 255, 0.4)' : '0 4px 15px rgba(255, 214, 0, 0.4)'
              }}
            >
              {isLoading 
                ? '⏳ Generating 25 Matches...' 
                : is1v1 
                ? '⚔️ Generate 25 1v1 Matches' 
                : is2v2 
                ? '⚔️ Generate 25 2v2 Matches' 
                : is4v4 
                ? '🛡️ Generate 25 4v4 Matches' 
                : '👑 Generate 25 BR Matches'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
