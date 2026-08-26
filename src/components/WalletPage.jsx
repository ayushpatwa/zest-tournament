import React, { useState } from 'react';
import { openRazorpayCheckout } from '../services/razorpayService';
import { createInstamojoPaymentRequest, openInstamojoCheckout } from '../services/instamojoService';
import { sendToMakeWebhook } from '../services/webhookService';

export default function WalletPage({ 
  walletBalance = 0, 
  setWalletBalance, 
  transactions = [], 
  setTransactions,
  userProfile 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [paymentGateway, setPaymentGateway] = useState('instamojo'); // 'instamojo' | 'razorpay'
  const [processingStatus, setProcessingStatus] = useState('');
  const [depositErrorMsg, setDepositErrorMsg] = useState('');
  const [pendingInstamojoPayment, setPendingInstamojoPayment] = useState(null);

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

  // Unified Deposit Handler (Instamojo / Razorpay)
  const handleProceedDeposit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setDepositErrorMsg('Minimum deposit amount is ₹10.');
      return;
    }
    setDepositErrorMsg('');

    if (paymentGateway === 'instamojo') {
      setProcessingStatus('⚡ Creating Instamojo Secure Payment Request...');
      try {
        const res = await createInstamojoPaymentRequest({
          amount: amt,
          nickname: userProfile?.nickname || 'Zest Player',
          uid: userProfile?.uid || 'Gamer',
          email: userProfile?.email || 'player@zest.gg',
          phone: userProfile?.phone || '9876543210'
        });

        if (res.success && res.paymentUrl) {
          setProcessingStatus('Opening Instamojo Checkout (UPI / Cards / QR)...');
          setPendingInstamojoPayment({ amount: amt, requestId: res.requestId });

          await openInstamojoCheckout({
            paymentUrl: res.paymentUrl,
            onComplete: () => {
              setProcessingStatus('');
            },
            onDismiss: () => {
              setProcessingStatus('');
            }
          });
        } else {
          setProcessingStatus('');
          setDepositErrorMsg('Failed to generate payment request. Please try again.');
        }
      } catch (err) {
        setProcessingStatus('');
        setDepositErrorMsg(err.message || 'Error connecting to Instamojo.');
      }
      return;
    }

    // Razorpay Flow
    setProcessingStatus('Opening Razorpay Secure Checkout...');
    openRazorpayCheckout({
      amount: amt,
      customerName: userProfile?.nickname || 'Zest Gamer',
      customerEmail: userProfile?.email || 'player@zest.gg',
      customerPhone: userProfile?.phone || '9876543210',
      onSuccess: async (res) => {
        setProcessingStatus('');
        
        if (typeof setWalletBalance === 'function') {
          setWalletBalance(prev => (typeof prev === 'number' ? prev : parseFloat(prev) || 0) + amt);
        }

        const newTx = {
          id: Date.now(),
          type: 'deposit',
          amount: amt,
          title: `Razorpay Deposit (ID: ${res.paymentId})`,
          date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Success'
        };

        setTransactions(prev => [newTx, ...prev]);
        setShowAddModal(false);

        // Dispatch to Google Sheets
        await sendToMakeWebhook({
          eventType: 'WALLET_DEPOSIT',
          nickname: userProfile?.nickname || 'Player',
          ffUid: userProfile?.uid || 'N/A',
          email: userProfile?.email || 'N/A',
          phone: userProfile?.phone || 'N/A',
          details: `₹${amt} added via Razorpay (Payment ID: ${res.paymentId})`
        });
      },
      onDismiss: () => {
        setProcessingStatus('');
      },
      onError: (err) => {
        setProcessingStatus('');
        setDepositErrorMsg(typeof err === 'string' ? err : 'Payment canceled or failed.');
      }
    });
  };

  // Confirm Instamojo Deposit
  const handleConfirmInstamojoPayment = async () => {
    if (!pendingInstamojoPayment) return;
    const amt = pendingInstamojoPayment.amount;

    if (typeof setWalletBalance === 'function') {
      setWalletBalance(prev => (typeof prev === 'number' ? prev : parseFloat(prev) || 0) + amt);
    }

    const newTx = {
      id: Date.now(),
      type: 'deposit',
      amount: amt,
      title: `Instamojo Deposit (₹${amt})`,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Success'
    };

    setTransactions(prev => [newTx, ...prev]);
    setPendingInstamojoPayment(null);
    setShowAddModal(false);

    // Dispatch to Google Sheets
    await sendToMakeWebhook({
      eventType: 'WALLET_DEPOSIT',
      nickname: userProfile?.nickname || 'Player',
      ffUid: userProfile?.uid || 'N/A',
      email: userProfile?.email || 'N/A',
      phone: userProfile?.phone || 'N/A',
      details: `₹${amt} added via Instamojo Payment Gateway (Instant Deposit)`
    });
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
            onClick={() => { setShowAddModal(true); setProcessingStatus(''); setDepositErrorMsg(''); }}
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '900', background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)', color: '#000' }}
          >
            ⚡ Add Money (Razorpay)
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

      {/* Razorpay Trust Banner */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Deposits secured by <strong>Razorpay</strong> • Instant Withdrawals
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

      {/* 1. RAZORPAY DEPOSIT MODAL */}
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
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: 0, color: 'var(--secondary)' }}>
                ADD FUNDS TO WALLET
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProceedDeposit}>

              {/* Payment Gateway Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Select Payment Method:
                </label>
                <div style={{
                  display: 'flex',
                  background: 'rgba(7, 9, 14, 0.6)',
                  borderRadius: '10px',
                  padding: '4px',
                  border: '1px solid var(--border-color)',
                  gap: '6px'
                }}>
                  <button
                    type="button"
                    onClick={() => { setPaymentGateway('instamojo'); setDepositErrorMsg(''); }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: 'none',
                      borderRadius: '8px',
                      background: paymentGateway === 'instamojo' ? 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)' : 'transparent',
                      color: paymentGateway === 'instamojo' ? '#000' : '#fff',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.78rem',
                      fontWeight: '900',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>⚡</span> Instamojo (UPI)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentGateway('razorpay'); setDepositErrorMsg(''); }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: 'none',
                      borderRadius: '8px',
                      background: paymentGateway === 'razorpay' ? 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)' : 'transparent',
                      color: '#fff',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.78rem',
                      fontWeight: '900',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💳</span> Razorpay
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Enter Amount to Add (₹)</label>
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
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
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
                      padding: '8px 4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              {processingStatus && (
                <div style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginBottom: '12px', textAlign: 'center' }}>
                  ⏳ {processingStatus}
                </div>
              )}

              {depositErrorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  ⚠️ {depositErrorMsg}
                </div>
              )}

              {pendingInstamojoPayment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: 'rgba(0, 230, 118, 0.12)', border: '1px solid var(--success)', borderRadius: '8px', padding: '10px', fontSize: '0.78rem', color: '#00e676', textAlign: 'center' }}>
                    Payment window opened. Once you finish payment in UPI/browser, tap below:
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmInstamojoPayment}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)',
                      color: '#000'
                    }}
                  >
                    ✅ I Have Completed Payment (Credit ₹{pendingInstamojoPayment.amount})
                  </button>
                </div>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.92rem',
                    fontWeight: '900',
                    background: paymentGateway === 'instamojo' 
                      ? 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)' 
                      : 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)',
                    color: '#000'
                  }}
                >
                  🚀 Proceed with {paymentGateway === 'instamojo' ? 'Instamojo' : 'Razorpay'} (₹{depositAmount}) ➔
                </button>
              )}
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
