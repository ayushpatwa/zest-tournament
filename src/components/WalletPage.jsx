import React, { useState } from 'react';
import { sendToMakeWebhook } from '../services/webhookService';
import paymentQrImg from '../assets/payment_qr.jpg';

export default function WalletPage({ 
  walletBalance = 0, 
  setWalletBalance, 
  transactions = [], 
  setTransactions,
  userProfile,
  depositQrConfig
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositUtr, setDepositUtr] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');
  const [depositErrorMsg, setDepositErrorMsg] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const currentQrImg = depositQrConfig?.qrImageUrl || paymentQrImg;
  const currentReceiverName = depositQrConfig?.receiverName || 'Divyansh Maheshwari';
  const currentUpiId = depositQrConfig?.upiId || 'divyansh-308@ptyes';

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(currentUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (_) {}
  };

  // Withdrawal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Guarantee clean numeric balance representation
  const numericBalance = typeof walletBalance === 'number' 
    ? walletBalance 
    : (parseFloat(walletBalance) || 0);

  // Manual Deposit Request Handler
  const handleProceedDeposit = async (e) => {
    e.preventDefault();
    setDepositErrorMsg('');
    setDepositSuccessMsg('');

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setDepositErrorMsg('Minimum deposit amount is ₹10.');
      return;
    }

    setIsSubmittingDeposit(true);

    const utrRef = depositUtr.trim() || 'N/A';
    const newTx = {
      id: Date.now(),
      type: 'deposit',
      amount: amt,
      title: `Deposit Request (₹${amt})`,
      reason: utrRef !== 'N/A' ? `UTR/Ref: ${utrRef}` : 'Pending Admin Verification',
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Processing'
    };

    setTransactions(prev => [newTx, ...prev]);

    // Dispatch to Google Sheets via Make.com
    await sendToMakeWebhook({
      eventType: 'WALLET_DEPOSIT_REQUEST',
      nickname: userProfile?.nickname || 'Player',
      ffUid: userProfile?.uid || 'N/A',
      email: userProfile?.email || 'N/A',
      phone: userProfile?.phone || 'N/A',
      details: `Deposit Request: ₹${amt} (UTR/Ref: ${utrRef}) - Pending Admin Verification`
    });

    setIsSubmittingDeposit(false);
    setDepositSuccessMsg(`✅ Deposit request for ₹${amt} submitted! Coins will be credited to your wallet after verification.`);

    setTimeout(() => {
      setShowAddModal(false);
      setDepositSuccessMsg('');
      setDepositAmount('100');
      setDepositUtr('');
    }, 3500);
  };

  // 2. Handle Withdrawal Request
  const handleProceedWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawErrorMsg('');
    setWithdrawSuccessMsg('');

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 50) {
      setWithdrawErrorMsg('Minimum withdrawal limit is ₹50.');
      return;
    }

    if (amt > numericBalance) {
      setWithdrawErrorMsg(`Insufficient balance! Your current wallet balance is ₹${numericBalance}.`);
      return;
    }

    if (!withdrawUpiId.trim() || !withdrawUpiId.includes('@')) {
      setWithdrawErrorMsg('Please enter a valid UPI ID (e.g. mobile@paytm or name@okhdfcbank).');
      return;
    }

    setIsWithdrawing(true);

    // Deduct balance from wallet cleanly
    if (typeof setWalletBalance === 'function') {
      setWalletBalance(prev => Math.max(0, (typeof prev === 'number' ? prev : parseFloat(prev) || 0) - amt));
    }

    const newTx = {
      id: Date.now(),
      type: 'withdraw',
      amount: amt,
      title: `Withdrawal to UPI (${withdrawUpiId.trim()})`,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Processing'
    };

    setTransactions(prev => [newTx, ...prev]);

    // Dispatch withdrawal request to Google Sheets for Admin verification
    await sendToMakeWebhook({
      eventType: 'WALLET_WITHDRAWAL',
      nickname: userProfile?.nickname || 'Player',
      ffUid: userProfile?.uid || 'N/A',
      email: userProfile?.email || 'N/A',
      phone: userProfile?.phone || 'N/A',
      details: `Withdrawal Request: ₹${amt} to UPI ID: ${withdrawUpiId.trim()} (Status: Pending Review)`
    });

    setIsWithdrawing(false);
    setWithdrawSuccessMsg('Your payment will be processed in some hours please wait.');

    setTimeout(() => {
      setShowWithdrawModal(false);
      setWithdrawSuccessMsg('');
      setWithdrawAmount('50');
      setWithdrawUpiId('');
    }, 3500);
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      
      {/* Wallet Banner Card */}
      <div 
        className="glass-panel" 
        style={{
          background: 'linear-gradient(135deg, #1f2a4a 0%, #151c33 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          boxShadow: 'var(--glow-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-20px',
          fontSize: '6rem',
          opacity: 0.05,
          transform: 'rotate(-15deg)',
          pointerEvents: 'none'
        }}>
          💳
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Zest Account Balance
        </span>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)' }}>🪙</span>
          <span>₹{numericBalance}</span>
        </h1>

        <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={() => { setShowAddModal(true); setDepositErrorMsg(''); setDepositSuccessMsg(''); }}
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '900', background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)', color: '#000' }}
          >
            ⚡ Add Money / Deposit
          </button>
          <button 
            onClick={() => { setShowWithdrawModal(true); setWithdrawErrorMsg(''); setWithdrawSuccessMsg(''); }}
            className="btn btn-outline" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '700' }}
          >
            📤 Withdraw
          </button>
        </div>
      </div>

      {/* Trust & Payout Banner */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            100% Fairplay Esports Arena • Verified Instant Withdrawals
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', fontWeight: '700' }}>
          <span style={{ color: '#00e5ff' }}>⚡ UPI Payouts</span>
          <span style={{ color: '#ffd600' }}>Min. ₹50</span>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', textTransform: 'uppercase' }}>
          📜 Transaction History
        </h3>
        
        {transactions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transaction records found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.map(tx => {
              const isCredit = tx.type === 'deposit' || tx.type === 'winning' || tx.type === 'credit';
              const isPenalty = tx.type === 'penalty' || tx.type === 'deduction';
              
              return (
                <div 
                  key={tx.id}
                  className="glass-panel flex-between animate-slide-in"
                  style={{
                    padding: '14px 16px',
                    background: isPenalty 
                      ? 'rgba(255, 23, 68, 0.05)' 
                      : (isCredit ? 'rgba(0, 230, 118, 0.04)' : 'rgba(24, 29, 48, 0.5)'),
                    border: isPenalty 
                      ? '1px solid rgba(255, 23, 68, 0.25)' 
                      : (isCredit ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255,255,255,0.06)'),
                    borderRadius: '12px',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem' }}>
                        {isPenalty ? '🔻' : (isCredit ? '🟢' : '📤')}
                      </span>
                      <h4 style={{ fontSize: '0.88rem', color: '#fff', fontWeight: '700', margin: 0 }}>
                        {tx.title}
                      </h4>
                    </div>

                    {/* Display Reason if present */}
                    {tx.reason && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.74rem',
                        color: isPenalty ? '#ff80ab' : '#80d8ff',
                        background: isPenalty ? 'rgba(255, 23, 68, 0.12)' : 'rgba(0, 229, 255, 0.1)',
                        border: `1px solid ${isPenalty ? 'rgba(255, 23, 68, 0.3)' : 'rgba(0, 229, 255, 0.25)'}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        marginTop: '6px',
                        fontWeight: '600'
                      }}>
                        <span>{isPenalty ? '⚠️' : '📝'} Reason:</span>
                        <span>{tx.reason}</span>
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      🕒 {tx.date}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '75px' }}>
                    <span style={{ 
                      fontFamily: 'var(--font-heading)', 
                      fontWeight: '900',
                      fontSize: '1.05rem',
                      color: isCredit ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {isCredit ? '+' : '-'} ₹{tx.amount}
                    </span>
                    <div style={{ 
                      fontSize: '0.68rem', 
                      color: tx.status === 'Success' ? 'var(--success)' : (tx.status === 'Deducted' ? 'var(--danger)' : 'var(--accent)'), 
                      marginTop: '3px',
                      fontWeight: '700'
                    }}>
                      ● {tx.status || (isCredit ? 'Credited' : 'Deducted')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Telegram 24/7 Support Banner */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <a
          href="https://t.me/zesttournament"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00e5ff',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: '700',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.2) 0%, rgba(0, 229, 255, 0.1) 100%)',
            border: '1px solid #0088cc',
            padding: '10px 20px',
            borderRadius: '24px',
            boxShadow: '0 4px 15px rgba(0, 136, 204, 0.2)'
          }}
        >
          <span>✈️</span>
          <span>Need Help with Deposit/Withdrawal? Contact @zesttournament</span>
        </a>
      </div>

      {/* 1. DEPOSIT REQUEST MODAL */}
      {showAddModal && (
        <div 
          className="flex-center" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-slide-in" 
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              padding: '22px',
              border: '1px solid var(--secondary)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span> SCAN & PAY VIA UPI
                </h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Scan QR code or pay via any UPI app, then submit details below.
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* QR Code & UPI Information Box */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
              marginBottom: '16px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
              border: '2px solid var(--secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ color: '#002e6e', fontWeight: '900', fontSize: '0.85rem' }}>Paytm / Any UPI</span>
                <span style={{ color: '#00baf2', fontWeight: '900', fontSize: '0.85rem' }}>Accepted Here</span>
              </div>

              {/* QR Image */}
              <div style={{ 
                display: 'inline-block',
                background: '#fff',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={currentQrImg} 
                  alt={`UPI QR - ${currentReceiverName}`} 
                  style={{
                    width: '180px',
                    height: 'auto',
                    maxHeight: '220px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    display: 'block'
                  }}
                />
              </div>

              {/* Receiver Details */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontWeight: '800', color: '#111', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>{currentReceiverName}</span>
                  <span style={{ color: '#00baf2', fontSize: '0.85rem' }}>✓</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#444', fontFamily: 'monospace', fontWeight: '700', marginTop: '2px' }}>
                  UPI ID: <span style={{ color: '#002e6e', userSelect: 'all' }}>{currentUpiId}</span>
                </div>
              </div>

              {/* Action Buttons: Copy UPI & Direct Intent Pay */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    flex: 1,
                    padding: '7px 8px',
                    fontSize: '0.74rem',
                    background: copiedUpi ? '#00e676' : '#002e6e',
                    color: copiedUpi ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedUpi ? '✓ UPI ID Copied!' : '📋 Copy UPI ID'}
                </button>

                <a
                  href={`upi://pay?pa=${encodeURIComponent(currentUpiId)}&pn=${encodeURIComponent(currentReceiverName)}&am=${depositAmount}&cu=INR`}
                  style={{
                    flex: 1,
                    padding: '7px 8px',
                    fontSize: '0.74rem',
                    background: 'linear-gradient(135deg, #00baf2 0%, #002e6e 100%)',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>⚡</span> Pay via App
                </a>
              </div>
            </div>

            <form onSubmit={handleProceedDeposit}>
              
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Deposit Amount (₹) <span style={{ color: 'var(--primary)' }}>*</span></label>
                <input 
                  type="number" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="form-input"
                  required
                  min="10"
                  max="10000"
                />
              </div>

              {/* Quick selection chips */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {['50', '100', '200', '500'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    style={{
                      flex: 1,
                      background: depositAmount === val ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.04)',
                      color: depositAmount === val ? '#000' : '#fff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '6px 2px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Payment UTR / Ref No. <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(After payment in UPI app)</span></label>
                <input 
                  type="text" 
                  value={depositUtr}
                  onChange={(e) => setDepositUtr(e.target.value)}
                  placeholder="e.g. 423984712093"
                  className="form-input"
                />
              </div>

              {depositSuccessMsg && (
                <div style={{ color: 'var(--success)', background: 'rgba(0,230,118,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--success)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  {depositSuccessMsg}
                </div>
              )}

              {depositErrorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  ⚠️ {depositErrorMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmittingDeposit}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)',
                  color: '#000'
                }}
              >
                {isSubmittingDeposit ? '⏳ Submitting Request...' : `📥 Submit Deposit Request (₹${depositAmount}) ➔`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div 
          className="flex-center" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-slide-in" 
            style={{ 
              width: '100%', 
              maxWidth: '390px', 
              padding: '22px',
              border: '1px solid var(--primary)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: 0, color: 'var(--primary)' }}>
                📤 WITHDRAW MONEY
              </h2>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {withdrawSuccessMsg ? (
              <div className="flex-center animate-slide-in" style={{ flexDirection: 'column', padding: '24px 0', gap: '14px', textAlign: 'center' }}>
                <div style={{
                  background: 'rgba(0, 230, 118, 0.1)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'var(--success)',
                  boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)'
                }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--success)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                  WITHDRAWAL SUBMITTED!
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#fff', margin: 0, lineHeight: '1.4', fontWeight: '600' }}>
                  {withdrawSuccessMsg}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Amount: ₹{withdrawAmount} • UPI ID: {withdrawUpiId}
                </span>
              </div>
            ) : (
              <form onSubmit={handleProceedWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Available balance badge */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Available Balance:</span>
                  <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>
                    ₹{numericBalance}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Amount to Withdraw (Min. ₹50) <span style={{ color: 'var(--primary)' }}>*</span></label>
                  <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount (Min ₹50)"
                    className="form-input"
                    required
                    min="50"
                    max={numericBalance}
                  />
                </div>

                {/* Quick selection chips */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['50', '100', '200', '500'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setWithdrawAmount(val)}
                      style={{
                        flex: 1,
                        background: withdrawAmount === val ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                        color: '#fff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '6px 4px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your UPI ID for Payout <span style={{ color: 'var(--primary)' }}>*</span></label>
                  <input 
                    type="text" 
                    value={withdrawUpiId}
                    onChange={(e) => setWithdrawUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@paytm or name@okhdfcbank"
                    className="form-input"
                    required
                  />
                </div>

                {withdrawErrorMsg && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                    ⚠️ {withdrawErrorMsg}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isWithdrawing || numericBalance < 50}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.92rem',
                    fontWeight: '900',
                    marginTop: '4px'
                  }}
                >
                  {isWithdrawing ? 'Submitting Request...' : `Withdraw ₹${withdrawAmount} ➔`}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
