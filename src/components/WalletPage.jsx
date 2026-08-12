import React, { useState } from 'react';

export default function WalletPage({ 
  walletBalance, 
  setWalletBalance, 
  transactions, 
  setTransactions 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle -> loading -> success

  const handleDeposit = (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setPaymentStatus('loading');

    // Simulate payment gateway delay (1.5 seconds)
    setTimeout(() => {
      setPaymentStatus('success');
      
      // Update states
      setTimeout(() => {
        setWalletBalance(prev => prev + amt);
        const newTx = {
          id: Date.now(),
          type: 'deposit',
          amount: amt,
          title: 'Money Added to Wallet',
          date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Success'
        };
        setTransactions(prev => [newTx, ...prev]);
        setShowAddModal(false);
        setPaymentStatus('idle');
        setDepositAmount('100');
      }, 800); // short delay after success to close modal
    }, 1500);
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
          border: '1px solid rgba(0, 229, 255, 0.15)',
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
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
          >
            ➕ Deposit Money
          </button>
          <button 
            onClick={() => alert("Withdrawal feature is in development. Winnings will be credited instantly.")}
            className="btn btn-outline" 
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
          >
            📤 Withdraw
          </button>
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
                  <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
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

      {/* Add Money Modal */}
      {showAddModal && (
        <div 
          className="flex-center" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 300,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-slide-in" 
            style={{ 
              width: '100%', 
              maxWidth: '360px', 
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
          >
            {paymentStatus === 'idle' ? (
              <>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '16px', color: 'var(--secondary)' }}>
                  ADD FUNDS TO WALLET
                </h2>
                <form onSubmit={handleDeposit}>
                  
                  <div className="form-group">
                    <label>Amount to Add (₹)</label>
                    <input 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="form-input"
                      required
                      min="10"
                    />
                  </div>

                  {/* Quick selections */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {['50', '100', '200', '500'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDepositAmount(val)}
                        style={{
                          flex: 1,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '8px 4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-heading)'
                        }}
                      >
                        +₹{val}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '10px' }}
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Proceed
                    </button>
                  </div>

                </form>
              </>
            ) : paymentStatus === 'loading' ? (
              <div className="flex-center" style={{ flexDirection: 'column', padding: '40px 0', gap: '16px' }}>
                <div style={{
                  border: '4px solid rgba(0, 229, 255, 0.1)',
                  borderTop: '4px solid var(--secondary)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <h3 style={{ fontSize: '1rem', color: '#fff' }}>Processing Payment...</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simulating UPI Payment Gateway</p>
              </div>
            ) : (
              <div className="flex-center animate-slide-in" style={{ flexDirection: 'column', padding: '40px 0', gap: '16px', textAlign: 'center' }}>
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
                <h3 style={{ fontSize: '1.15rem', color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>PAYMENT SUCCESSFUL!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹{depositAmount} has been credited to your account.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
