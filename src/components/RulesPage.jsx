import React, { useState } from 'react';

export default function RulesPage({ setCurrentView }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const ruleSections = [
    {
      id: 'general',
      icon: '⚔️',
      title: 'General Match & Lobby Rules',
      rules: [
        'All players must join the custom room using their registered numeric Free Fire UID and In-Game Nickname.',
        'Room ID & Password will be dropped in the app exactly 15 minutes before the match start timing.',
        'Players must occupy the exact slot/position assigned to them in Clash Squad / Squad matches.',
        'Late entries will NOT be entertained once the room host starts the custom match.',
        'If a match is cancelled by the host due to game update/server glitch, 100% of the entry fee will be refunded automatically.'
      ]
    },
    {
      id: 'devices',
      icon: '📱',
      title: 'Device & Emulator Policy',
      rules: [
        'All tournaments are strictly MOBILE ONLY (Android & iOS smartphones/tablets).',
        'PC players, Emulators (BlueStacks, LDPlayer, Nox, MSI, etc.), and Keymappers are STRICTLY PROHIBITED.',
        'Any player detected using an emulator will be kicked or banned instantly without any entry fee refund.',
        'External trigger devices (mechanical physical buttons) are permitted, but third-party macro software is banned.'
      ]
    },
    {
      id: 'fairplay',
      icon: '🛡️',
      title: 'Fairplay & Anti-Cheat Policy',
      rules: [
        'Zero tolerance for cheats: Mod APKs, auto-headshot scripts, wallhacks, speed hacks, antennas, or file modifications.',
        'Teaming up with opponent players in Solo or Duo matches will result in immediate disqualification of both teams.',
        'Glitch exploiting (getting inside rocks, underground map glitches) is strictly forbidden.',
        'Any suspicious gameplay recorded by spectating admins or other players will lead to a permanent account blacklist.'
      ]
    },
    {
      id: 'payouts',
      icon: '💰',
      title: 'Prizes & UPI Wallet Withdrawals',
      rules: [
        'Prize Pool is distributed based on official tournament standings (Rank #1, #2, #3) + Per-Kill bounties.',
        'Winning prize money is credited directly to your in-app wallet within 15 to 30 minutes after result verification.',
        'You can withdraw your wallet balance anytime via UPI (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay).',
        'Minimum withdrawal threshold is ₹50. Payouts are processed smoothly into your bank account.',
        'Providing an invalid or incorrect UPI ID may cause payout delays.'
      ]
    },
    {
      id: 'proofs',
      icon: '📸',
      title: 'Scoreboard Proof & Dispute Resolution',
      rules: [
        'Always take a full, clear screenshot of the end-game match summary scoreboard showing your placement and kill count.',
        'If you experience any dispute regarding kills or rank, upload your screenshot proof in the match lobby or send it to Telegram support.',
        'Admin decisions regarding rule violations, cheaters, and final standings are final and binding.',
        'For fast 24/7 assistance, reach out directly to the official Telegram channel: @zesttournament.'
      ]
    }
  ];

  const filteredSections = activeCategory === 'all' 
    ? ruleSections 
    : ruleSections.filter(s => s.id === activeCategory);

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '40px' }}>
      
      {/* Header Bar */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="btn btn-outline" 
            style={{ padding: '6px 12px', fontSize: '0.78rem', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Arena
          </button>
          <h2 style={{ 
            fontSize: '1.4rem', 
            margin: 0, 
            fontFamily: 'var(--font-heading)',
            fontWeight: '900',
            letterSpacing: '0.5px',
            background: 'linear-gradient(90deg, #ffffff 30%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📜 TOURNAMENT RULES & CODE OF CONDUCT
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Official competitive guidelines and fairplay policies for all Free Fire esports matches on Zest.
          </p>
        </div>

        <a
          href="https://t.me/zesttournament"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.25) 0%, rgba(0, 229, 255, 0.15) 100%)',
            border: '1px solid #0088cc',
            color: '#00e5ff',
            padding: '8px 14px',
            borderRadius: '20px',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            fontWeight: '700',
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(0, 136, 204, 0.3)'
          }}
        >
          <span>💬</span>
          <span>Telegram Support</span>
        </a>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: '🌟 All Rules' },
          { id: 'general', label: '⚔️ Match Rules' },
          { id: 'devices', label: '📱 Devices' },
          { id: 'fairplay', label: '🛡️ Anti-Cheat' },
          { id: 'payouts', label: '💰 Prize Money' },
          { id: 'proofs', label: '📸 Proofs' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: activeCategory === cat.id ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeCategory === cat.id ? 'linear-gradient(135deg, var(--primary) 0%, #ff1744 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.74rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === cat.id ? 'var(--glow-primary)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rules Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredSections.map(sec => (
          <div 
            key={sec.id}
            className="glass-panel animate-slide-in"
            style={{
              padding: '18px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              background: 'rgba(15, 18, 29, 0.7)'
            }}
          >
            <h3 style={{ 
              fontSize: '1rem', 
              color: 'var(--secondary)', 
              margin: '0 0 12px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontFamily: 'var(--font-heading)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{sec.icon}</span> {sec.title}
            </h3>

            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              lineHeight: '1.5'
            }}>
              {sec.rules.map((r, idx) => (
                <li key={idx} style={{ paddingLeft: '4px' }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Help Banner */}
      <div 
        className="glass-panel flex-between"
        style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(0, 229, 255, 0.1) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.3)',
          borderRadius: '12px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#fff' }}>
            Have a question or need to report a cheater?
          </h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Our match arbiters and tournament hosts are available 24/7 on Telegram.
          </p>
        </div>

        <a
          href="https://t.me/zesttournament"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{
            padding: '10px 18px',
            fontSize: '0.82rem',
            fontWeight: '800',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>💬</span> Contact Us: @zesttournament
        </a>
      </div>

    </div>
  );
}
