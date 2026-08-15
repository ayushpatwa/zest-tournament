import React, { useState } from 'react';
import { openRazorpayCheckout } from '../services/razorpayService';
import { sendToMakeWebhook } from '../services/webhookService';

export default function WalletPage({ 
  walletBalance, 
  setWalletBalance, 
  transactions, 
  setTransactions,
  userProfile 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'manual_qr'
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Manual QR States
  const [qrStep, setQrStep] = useState(1);
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const ADMIN_UPI_ID = "ayushpatwa.gaming@oksbi";
  const BUSINESS_NAME = "Zest Tournament Esports";

  const generateUpiUrl = (amt) => {
    return `upi://pay?pa=${ADMIN_UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Zest Wallet Recharge - ${userProfile?.nickname || 'Player'}`)}`;
  };

  const getQrCodeUrl = (amt) => {
    const upiUri = generateUpiUrl(amt);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}&bgcolor=15-18-29&color=00-E5-FF&margin=10`;
  };

  // 1. Trigger Official Razorpay Checkout Modal
  const handleProceedRazorpayDeposit = (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setErrorMsg('Minimum deposit amount is ₹10.');
      return;
    }
    setErrorMsg('');

    if (paymentMethod === 'razorpay') {
      setProcessingStatus('Opening Razorpay Secure Checkout...');

      openRazorpayCheckout({
        amount: amt,
        customerName: userProfile?.nickname || 'Zest Gamer',
        customerEmail: userProfile?.email || 'player@zest.gg',
        customerPhone: userProfile?.phone || '9876543210',
        onSuccess: async (res) => {
          setProcessingStatus('');
          setWalletBalance(amt);

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
          setErrorMsg(typeof err === 'string' ? err : 'Payment canceled or failed.');
        }
      });
    } else {
      setQrStep(2);
    }
  };

  // 2. Manual QR Submission
  const handleVerifyManualPayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR / Transaction ID.');
      return;
    }

    const amt = parseFloat(depositAmount);
    setWalletBalance(amt);

    const newTx = {
      id: Date.now(),
      type: 'deposit',
      amount: amt,
      title: `Manual UPI Deposit (UTR: ${utrNumber.trim()})`,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Success'
    };

    setTransactions(prev => [newTx, ...prev]);
    setQrStep(3);

    // Dispatch to Google Sheets
    await sendToMakeWebhook({
      eventType: 'WALLET_DEPOSIT',
      nickname: userProfile?.nickname || 'Player',
      ffUid: userProfile?.uid || 'N/A',
      email: userProfile?.email || 'N/A',
      phone: userProfile?.phone || 'N/A',
      details: `₹${amt} added via Manual UPI (UTR: ${utrNumber.trim()})`
    });

    setTimeout(() => {
      setShowAddModal(false);
      setQrStep(1);
      setUtrNumber('');
      setDepositAmount('100');
    }, 2000);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(ADMIN_UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <span>₹{walletBalance}</span>
        </h1>

        <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={() => { setShowAddModal(true); setQrStep(1); setProcessingStatus(''); setErrorMsg(''); }}
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '900', background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)', color: '#000' }}
          >
            ⚡ Add Money (Razorpay)
          </button>
          <button 
            onClick={() => alert("Withdrawals are processed directly to your linked UPI ID. Minimum withdrawal amount is ₹100.")}
            className="btn btn-outline" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
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
            Secured by <strong>Razorpay Gateway</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', fontWeight: '700' }}>
          <span style={{ color: '#00e5ff' }}>⚡ GPay / PhonePe / Paytm</span>
          <span style={{ color: '#ffd600' }}>💳 Cards & NetBanking</span>
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
            {transactions.map(tx => (
              <div 
                key={tx.id}
                className="glass-panel flex-between animate-slide-in"
                style={{
                  padding: '12px 16px',
                  background: 'rgba(24, 29, 48, 0.4)',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600', margin: 0 }}>
                    {tx.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {tx.date}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    color: tx.type === 'deposit' || tx.type === 'winning' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {tx.type === 'deposit' || tx.type === 'winning' ? '+' : '-'} ₹{tx.amount}
                  </span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--success)', marginTop: '2px' }}>
                    ● {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAZORPAY DEPOSIT MODAL */}
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
              maxWidth: '400px', 
              padding: '20px',
              border: '1px solid var(--secondary)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
          >
            {/* Step 1: Select Amount & Mode */}
            {qrStep === 1 && (
              <>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0, color: 'var(--secondary)' }}>
                    ADD FUNDS TO WALLET
                  </h2>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleProceedRazorpayDeposit}>
                  
                  {/* Payment Gateway Toggle */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '4px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    gap: '4px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: 'none',
                        background: paymentMethod === 'razorpay' ? 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)' : 'transparent',
                        color: paymentMethod === 'razorpay' ? '#000' : '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Razorpay Gateway
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('manual_qr')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: 'none',
                        background: paymentMethod === 'manual_qr' ? 'var(--primary)' : 'transparent',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      📲 Scan QR + UTR
                    </button>
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
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
                    <div style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ⏳ {processingStatus}
                    </div>
                  )}

                  {errorMsg && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '900',
                      background: paymentMethod === 'razorpay' 
                        ? 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)' 
                        : 'var(--primary)',
                      color: paymentMethod === 'razorpay' ? '#000' : '#fff'
                    }}
                  >
                    {paymentMethod === 'razorpay' ? '🚀 Open Razorpay Checkout ➔' : 'Generate UPI QR Code ➔'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Manual QR Scan */}
            {paymentMethod === 'manual_qr' && qrStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <div className="flex-between" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan & Pay ₹{depositAmount}</span>
                  <button 
                    onClick={() => setQrStep(1)}
                    style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                </div>

                <div style={{
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
                  marginBottom: '12px'
                }}>
                  <img 
                    src={getQrCodeUrl(depositAmount)} 
                    alt="UPI Payment QR Code"
                    style={{ width: '170px', height: '170px', display: 'block' }}
                  />
                </div>

                <div className="flex-between" style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  marginBottom: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ color: 'var(--secondary)', fontFamily: 'monospace' }}>{ADMIN_UPI_ID}</span>
                  <button 
                    type="button" 
                    onClick={copyUpiId}
                    style={{
                      background: copied ? 'var(--success)' : 'var(--primary)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy UPI'}
                  </button>
                </div>

                <form onSubmit={handleVerifyManualPayment} style={{ textAlign: 'left' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.75rem' }}>12-Digit UPI UTR Reference Number <span style={{ color: 'var(--primary)' }}>*</span></label>
                    <input 
                      type="text" 
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 482910394821"
                      className="form-input"
                      required
                    />
                  </div>

                  {errorMsg && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '8px' }}>
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                  >
                    ✓ Confirm Payment & Credit ₹{depositAmount}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {paymentMethod === 'manual_qr' && qrStep === 3 && (
              <div className="flex-center animate-slide-in" style={{ flexDirection: 'column', padding: '30px 0', gap: '14px', textAlign: 'center' }}>
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
                  boxShadow: '0 0 15px rgba(0, 230, 118, 0.3)'
                }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                  PAYMENT SUCCESSFUL!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ₹{depositAmount} has been credited to your Zest Wallet.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
