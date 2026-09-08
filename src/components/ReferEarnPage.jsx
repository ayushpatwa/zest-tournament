import React, { useState, useEffect } from 'react';
import { subscribeToUserReferralsRealtime, subscribeToAppSettingsRealtime } from '../services/firebase';

export default function ReferEarnPage({ userProfile = {}, currentUser = {}, setCurrentView }) {
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [referralReward, setReferralReward] = useState(5);
  const [loadingList, setLoadingList] = useState(true);

  const activeUser = userProfile.uid ? userProfile : currentUser;
  const userUid = activeUser?.uid || '';
  const myReferralCode = activeUser?.referralCode || (userUid ? `ZEST${userUid}` : 'ZESTVIP');

  // 1. Subscribe to live App Settings for dynamic referral reward amount
  useEffect(() => {
    const unsubSettings = subscribeToAppSettingsRealtime((settings) => {
      if (settings && typeof settings.referralReward === 'number') {
        setReferralReward(settings.referralReward);
      }
    });
    return () => unsubSettings();
  }, []);

  // 2. Subscribe to user's real-time referral history from Firestore
  useEffect(() => {
    if (!userUid) {
      setLoadingList(false);
      return;
    }
    const unsubRefs = subscribeToUserReferralsRealtime(userUid, (list) => {
      setReferrals(list);
      setLoadingList(false);
    });
    return () => unsubRefs();
  }, [userUid]);

  // Total referral stats
  const totalInvited = referrals.length || Number(activeUser?.referralCount) || 0;
  const totalEarnings = referrals.reduce((sum, r) => sum + (Number(r.rewardAmount) || referralReward), 0) 
    || Number(activeUser?.referralEarnings) 
    || (totalInvited * referralReward);

  const appShareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zest-tournament.vercel.app';
  const shareMessage = `🔥 Hey Gamer! Join me on ZEST TOURNAMENTS to play Free Fire Esports, 1v1 Clash Squad, and Win Real Cash Prizes! 🏆\n\n🎁 Use my Referral Code: ${myReferralCode} during signup to get Instant Free Coins!\n\n🎮 Play & Win Now: ${appShareUrl}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myReferralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = myReferralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ZEST Tournament - Refer & Earn',
          text: shareMessage,
          url: appShareUrl
        });
      } catch (err) {
        console.log('Share dismissed:', err);
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '36px' }}>
      
      {/* Hero Banner */}
      <div 
        className="glass-panel" 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.15) 0%, rgba(255, 87, 34, 0.12) 50%, rgba(0, 229, 255, 0.1) 100%)',
          border: '1px solid rgba(255, 214, 0, 0.35)',
          borderRadius: '16px',
          padding: '20px 16px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(255, 214, 0, 0.15)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>🎁</div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.4rem',
          letterSpacing: '1.5px',
          background: 'linear-gradient(90deg, #ffd600 0%, #ff9100 50%, #00e5ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 6px 0',
          textTransform: 'uppercase'
        }}>
          REFER & EARN COINS
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          Invite your Free Fire squad and friends. Get <strong style={{ color: '#ffd600' }}>₹{referralReward} Free Coins</strong> for every friend who signs up!
        </p>
      </div>

      {/* Referral Code & Action Card */}
      <div 
        className="glass-panel" 
        style={{
          background: 'rgba(15, 18, 29, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
            YOUR UNIQUE REFERRAL CODE
          </span>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.08) 0%, rgba(0, 229, 255, 0.08) 100%)',
            border: '2px dashed rgba(255, 214, 0, 0.5)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginTop: '8px'
          }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.35rem',
              fontWeight: '900',
              color: '#ffd600',
              letterSpacing: '2px'
            }}>
              {myReferralCode}
            </span>

            <button
              onClick={handleCopyCode}
              style={{
                background: copied ? 'var(--success)' : 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              {copied ? '✓ COPIED!' : '📋 COPY'}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
          <button
            onClick={handleWhatsAppShare}
            style={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.85rem',
              fontWeight: '900',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
            }}
          >
            <span>💬</span> WhatsApp
          </button>

          <button
            onClick={handleNativeShare}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.85rem',
              fontWeight: '900',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 87, 34, 0.3)'
            }}
          >
            <span>🔗</span> Share Link
          </button>
        </div>
      </div>

      {/* Referral Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div 
          className="glass-panel" 
          style={{ 
            padding: '14px 8px', 
            textAlign: 'center', 
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            INVITED
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--secondary)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {totalInvited}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Friends</div>
        </div>

        <div 
          className="glass-panel" 
          style={{ 
            padding: '14px 8px', 
            textAlign: 'center', 
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            EARNED
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffd600', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            ₹{totalEarnings}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Free Coins</div>
        </div>

        <div 
          className="glass-panel" 
          style={{ 
            padding: '14px 8px', 
            textAlign: 'center', 
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            PER INVITE
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--success)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            +₹{referralReward}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Per Friend</div>
        </div>
      </div>

      {/* How It Works (3 Steps) */}
      <div 
        className="glass-panel" 
        style={{
          background: 'rgba(15, 18, 29, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.92rem',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#fff'
        }}>
          <span>⚡</span> HOW REFER & EARN WORKS
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900',
              flexShrink: 0
            }}>1</div>
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block' }}>Share Your Code</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Send your unique referral code or link to your Free Fire squad & friends.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--secondary)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900',
              flexShrink: 0
            }}>2</div>
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block' }}>Friend Registers</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Your friend creates an account on Zest and enters your referral code during sign-up.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#ffd600',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900',
              flexShrink: 0
            }}>3</div>
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block' }}>Get Instant Reward Coins!</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>You get ₹{referralReward} coins added straight to your wallet. Use them to enter tournaments or withdraw!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referred Friends Activity History */}
      <div 
        className="glass-panel" 
        style={{
          background: 'rgba(15, 18, 29, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.92rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fff'
          }}>
            <span>👥</span> MY REFERRED FRIENDS ({referrals.length})
          </h3>
          {referrals.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: '800' }}>
              ● Live Synced
            </span>
          )}
        </div>

        {loadingList ? (
          <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Loading referral activity...
          </div>
        ) : referrals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>🚀</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#fff', fontWeight: '700' }}>No referrals yet!</p>
            <p style={{ margin: '4px 0 12px 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Share your code on WhatsApp or Discord to start earning free tournament coins today.
            </p>
            <button
              onClick={handleWhatsAppShare}
              style={{
                background: 'rgba(37, 211, 102, 0.2)',
                border: '1px solid rgba(37, 211, 102, 0.4)',
                color: '#25D366',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.78rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              💬 Invite Friends Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {referrals.map((refItem, idx) => (
              <div 
                key={refItem.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(255, 87, 34, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    👤
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block' }}>
                      {refItem.refereeNickname || 'Player'}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      UID: {refItem.refereeUid} • {refItem.dateString || 'Recently joined'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    color: 'var(--success)',
                    fontSize: '0.85rem',
                    fontWeight: '900',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    +₹{refItem.rewardAmount || referralReward}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Credited ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
