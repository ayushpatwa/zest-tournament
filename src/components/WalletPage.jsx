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
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Trigger Official Razorpay Checkout Modal
  const handleProceedRazorpayDeposit = (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setErrorMsg('Minimum deposit amount is ₹10.');
      return;
    }
    setErrorMsg('');
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
            onClick={() => { setShowAddModal(true); setProcessingStatus(''); setErrorMsg(''); }}
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

            <form onSubmit={handleProceedRazorpayDeposit}>
              
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

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
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
                🚀 Proceed to Pay ₹{depositAmount} ➔
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
