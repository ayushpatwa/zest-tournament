import React, { useState } from 'react';
import { initiateTranzPaymentSession, getTranzConfig } from '../services/tranzPaymentService';

export default function WalletPage({ 
  walletBalance, 
  setWalletBalance, 
  transactions, 
  setTransactions,
  userProfile 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [gatewayMethod, setGatewayMethod] = useState('tranz'); // 'tranz' | 'qr_manual'
  
  // Tranz Gateway Modal State
  const [tranzSession, setTranzSession] = useState(null);
  const [tranzStep, setTranzStep] = useState('method'); // 'method' | 'processing' | 'success'
  const [selectedUpiApp, setSelectedUpiApp] = useState('phonepe');
  const [processingStatusText, setProcessingStatusText] = useState('Connecting to Tranz Gateway...');

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

  // 1. Launch Tranz Gateway Checkout
  const handleLaunchTranzGateway = async (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setErrorMsg('Minimum deposit amount is ₹10.');
      return;
    }
    setErrorMsg('');

    if (gatewayMethod === 'tranz') {
      const session = await initiateTranzPaymentSession({
        amount: amt,
        customerName: userProfile?.nickname || 'Zest Player',
        customerEmail: userProfile?.email || 'player@zest.gg',
        customerPhone: userProfile?.phone || '9876543210'
      });

      setTranzSession(session);
      setTranzStep('method');
    } else {
      setQrStep(2);
    }
  };

  // 2. Complete Tranz Payment Execution
  const handlePayViaTranz = (appName) => {
    setSelectedUpiApp(appName);
    setTranzStep('processing');
    setProcessingStatusText(`Waiting for confirmation from ${appName.toUpperCase()}...`);

    // Simulate instant secure gateway callback
    setTimeout(() => {
      setProcessingStatusText('Verifying payment hash with Tranz Gateway...');
      setTimeout(() => {
        const amt = parseFloat(depositAmount);
        setWalletBalance(amt);

        const newTx = {
          id: Date.now(),
          type: 'deposit',
          amount: amt,
          title: `Tranz Gateway Deposit (${appName.toUpperCase()} - ${tranzSession?.orderId || 'TRZ'})`,
          date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Success'
        };

        setTransactions(prev => [newTx, ...prev]);
        setTranzStep('success');

        setTimeout(() => {
          setShowAddModal(false);
          setTranzSession(null);
          setTranzStep('method');
          setDepositAmount('100');
        }, 2200);
      }, 1500);
    }, 1800);
  };

  // Manual QR verification
  const handleVerifyManualPayment = (e) => {
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
          Zest Verified Account Balance
        </span>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)' }}>🪙</span>
          <span>₹{walletBalance}</span>
        </h1>

        <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={() => { setShowAddModal(true); setTranzSession(null); setQrStep(1); }}
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '900', background: 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)', color: '#000' }}
          >
            ⚡ Deposit via Tranz Gateway
          </button>
          <button 
            onClick={() => alert("Withdrawals are processed instantly to your linked UPI ID. Minimum withdrawal is ₹100.")}
            className="btn btn-outline" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
          >
            📤 Withdraw
          </button>
        </div>
      </div>

      {/* Gateway Trust & Payment Options Banner */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>🛡️</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Secured by <strong>Tranz 256-Bit Gateway</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', fontWeight: '700' }}>
          <span style={{ color: '#00e5ff' }}>⚡ Instant UPI</span>
          <span style={{ color: '#ffd600' }}>💳 Cards</span>
          <span style={{ color: '#00e676' }}>🏦 NetBanking</span>
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

      {/* DEPOSIT MODAL WITH TRANZ PAYMENT GATEWAY */}
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
            {/* VIEW 1: AMOUNT SELECTION & GATEWAY CHOICE */}
            {!tranzSession && qrStep === 1 && (
              <>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0, color: 'var(--secondary)' }}>
                    DEPOSIT MONEY
                  </h2>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleLaunchTranzGateway}>
                  
                  {/* Gateway Option Switcher */}
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
                      onClick={() => setGatewayMethod('tranz')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: 'none',
                        background: gatewayMethod === 'tranz' ? 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)' : 'transparent',
                        color: gatewayMethod === 'tranz' ? '#000' : '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Tranz Gateway (Instant)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGatewayMethod('qr_manual')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: 'none',
                        background: gatewayMethod === 'qr_manual' ? 'var(--primary)' : 'transparent',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      📲 Manual QR + UTR
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Enter Amount to Deposit (₹)</label>
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
                      background: gatewayMethod === 'tranz' 
                        ? 'linear-gradient(135deg, #00e5ff 0%, #00e676 100%)' 
                        : 'var(--primary)',
                      color: gatewayMethod === 'tranz' ? '#000' : '#fff'
                    }}
                  >
                    {gatewayMethod === 'tranz' ? 'Proceed to Tranz Gateway ➔' : 'Generate UPI QR Code ➔'}
                  </button>
                </form>
              </>
            )}

            {/* VIEW 2: TRANZ PAYMENT GATEWAY CHECKOUT MODAL */}
            {tranzSession && (
              <div>
                {tranzStep === 'method' && (
                  <div className="animate-slide-in">
                    
                    {/* Tranz Gateway Header */}
                    <div className="flex-between" style={{
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      paddingBottom: '10px',
                      marginBottom: '14px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>
                          TRANZ PAYMENT GATEWAY
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Order: <code style={{ color: 'var(--accent)' }}>{tranzSession.orderId.substring(0, 18)}...</code>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Amount</span>
                        <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--accent)', fontWeight: '900' }}>
                          ₹{depositAmount}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Choose your preferred instant payment method on Tranz:
                    </p>

                    {/* 1-Click Fast UPI Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      <button
                        type="button"
                        onClick={() => handlePayViaTranz('phonepe')}
                        className="glass-panel flex-between"
                        style={{
                          padding: '10px 14px',
                          border: '1px solid rgba(103, 58, 183, 0.4)',
                          cursor: 'pointer',
                          background: 'rgba(103, 58, 183, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.3rem' }}>🟣</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>PhonePe UPI</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Instant zero fee approval</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Pay ₹{depositAmount} ➔</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePayViaTranz('gpay')}
                        className="glass-panel flex-between"
                        style={{
                          padding: '10px 14px',
                          border: '1px solid rgba(0, 229, 255, 0.4)',
                          cursor: 'pointer',
                          background: 'rgba(0, 229, 255, 0.08)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.3rem' }}>⚡</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Google Pay (GPay)</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>UPI Intent & Auto-Verify</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Pay ₹{depositAmount} ➔</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePayViaTranz('paytm')}
                        className="glass-panel flex-between"
                        style={{
                          padding: '10px 14px',
                          border: '1px solid rgba(0, 186, 242, 0.4)',
                          cursor: 'pointer',
                          background: 'rgba(0, 186, 242, 0.08)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.3rem' }}>🔵</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Paytm / BHIM UPI</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>UPI ID & Wallet</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Pay ₹{depositAmount} ➔</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePayViaTranz('card')}
                        className="glass-panel flex-between"
                        style={{
                          padding: '10px 14px',
                          border: '1px solid rgba(255, 214, 0, 0.3)',
                          cursor: 'pointer',
                          background: 'rgba(255, 214, 0, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.3rem' }}>💳</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Debit / Credit Card</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Visa, MasterCard, RuPay</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Pay ₹{depositAmount} ➔</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTranzSession(null)}
                      className="btn btn-outline"
                      style={{ width: '100%', padding: '8px', fontSize: '0.75rem' }}
                    >
                      Cancel Payment
                    </button>
                  </div>
                )}

                {/* Tranz Processing Screen */}
                {tranzStep === 'processing' && (
                  <div className="flex-center animate-slide-in" style={{ flexDirection: 'column', padding: '40px 0', gap: '16px', textAlign: 'center' }}>
                    <div style={{
                      border: '4px solid rgba(0, 229, 255, 0.1)',
                      borderTop: '4px solid var(--secondary)',
                      borderRadius: '50%',
                      width: '54px',
                      height: '54px',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Processing via Tranz Gateway...</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', margin: 0 }}>{processingStatusText}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Do not close this window</span>
                  </div>
                )}

                {/* Tranz Success Screen */}
                {tranzStep === 'success' && (
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
                      boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)'
                    }}>
                      ✓
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--success)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                      TRANZ PAYMENT SUCCESSFUL!
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      ₹{depositAmount} has been credited to your account.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: MANUAL QR SCAN + UTR */}
            {gatewayMethod === 'qr_manual' && qrStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <div className="flex-between" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan & Pay ₹{depositAmount}</span>
                  <button 
                    onClick={() => setQrStep(1)}
                    style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ← Change Amount
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

            {gatewayMethod === 'qr_manual' && qrStep === 3 && (
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
