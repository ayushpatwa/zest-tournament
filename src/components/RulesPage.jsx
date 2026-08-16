import React, { useState } from 'react';

export default function RulesPage({ setCurrentView }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const ruleSections = [
    {
      id: 'pov',
      icon: '📹',
      title: 'POV & DISPUTE RULES',
      items: [
        'Opponent ka POV sirf valid proof ke saath hi demand kiya ja sakta hai.',
        'POV request match ke 1 hour ke andar karni hogi.',
        'Late requests accept nahi ki jayengi.',
        '⚠️ POV Rule: No POV = Canceled withdrawal and coin loss.'
      ]
    },
    {
      id: 'match_limit',
      icon: '⚠️',
      title: 'MATCH LIMIT RULES',
      subtitle: 'Daily Match Limit Policy',
      items: [
        '✅ Only 8 matches per day allowed.',
        'Agar daily limit exceed hoti hai, toh uske baad har extra match par penalty charge lagega.',
        'Penalty Charges: ₹8 se ₹25 per extra match (Penalty amount mode ke hisaab se apply hoga).'
      ]
    },
    {
      id: 'host_room',
      icon: '🔑',
      title: 'HOST & ROOM ENTRY RULES',
      items: [
        'Agar host galti se wrong room ya unregistered room me ST kar deta hai, to 1st round ke andar valid proof ke sath report karna hoga. Us case me match back (restart) kiya jayega.',
        '1st round ke baad report accept nahi hogi aur No Refund / No Remake diya jayega.',
        '🔥 MIN LEVEL-40 ALLOWED'
      ]
    },
    {
      id: 'device',
      icon: '📱',
      title: 'DEVICE RULES',
      items: [
        'Sirf Android & iOS devices allowed hain.',
        'Emulator / PC / Tablet players strictly NOT allowed any OTHER EXTERNAL USAGE OF MOUSE AND KEYBOARD IF NOT PERMITTED.'
      ]
    },
    {
      id: 'penalty',
      icon: '🚫',
      title: 'PENALTY & BAN RULES',
      subtitle: 'Kisi bhi rule break par:',
      items: [
        '⚠️ Penalty',
        '❌ No Refund',
        '🚫 Permanent BAN (serious cases)',
        '❌ DPI NOT ALLOWED: Agar DPI use karte hue pakde gaye toh penalty lagegi.'
      ]
    },
    {
      id: 'final_note',
      icon: '⚡',
      title: 'FINAL NOTE & DISCLAIMER',
      items: [
        'Sabhi rules follow karna mandatory hai.',
        'Admin ka decision final hoga.',
        'Fair play maintain karein.',
        'Disclaimer: Garena Free Fire glitches ke liye Zest Tournament zimmedar nahi hoga. Ye user ki khud ki responsibility hogi.'
      ]
    }
  ];

  const filteredSections = activeCategory === 'all' 
    ? ruleSections 
    : ruleSections.filter(s => s.id === activeCategory);

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '40px' }}>
      
      {/* Top Navigation & Header */}
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
            fontSize: '1.35rem', 
            margin: 0, 
            fontFamily: 'var(--font-heading)',
            fontWeight: '900',
            letterSpacing: '0.5px',
            background: 'linear-gradient(90deg, #ffffff 30%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📜 MATCH DETAILS & TOURNAMENT RULES
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            🔥 Zest Tournament – Play Fair, Win Fair
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

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: '🌟 All Rules' },
          { id: 'pov', label: '📹 POV Rules' },
          { id: 'match_limit', label: '⚠️ Match Limit' },
          { id: 'host_room', label: '🔑 Host & Room' },
          { id: 'device', label: '📱 Device Rules' },
          { id: 'penalty', label: '🚫 Penalty & Ban' },
          { id: 'final_note', label: '⚡ Final Note' }
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

      {/* Rules Display Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredSections.map(sec => (
          <div 
            key={sec.id}
            className="glass-panel animate-slide-in"
            style={{
              padding: '18px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              background: 'rgba(15, 18, 29, 0.75)'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                color: 'var(--secondary)', 
                margin: 0, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontFamily: 'var(--font-heading)'
              }}>
                <span style={{ fontSize: '1.15rem' }}>{sec.icon}</span> ◆ {sec.title}
              </h3>
              {sec.subtitle && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {sec.subtitle}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sec.items.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{
                    fontSize: '0.84rem',
                    color: item.includes('❌') || item.includes('🚫') || item.includes('⚠️') ? '#ff80ab' : 'var(--text-secondary)',
                    lineHeight: '1.5',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${item.includes('❌') || item.includes('🚫') ? 'var(--danger)' : item.includes('✅') ? 'var(--success)' : 'var(--primary)'}`
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Final Disclaimer & Branding Footer */}
      <div 
        className="glass-panel"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.12) 0%, rgba(0, 229, 255, 0.1) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.35)',
          borderRadius: '12px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '1rem', fontWeight: '900', fontFamily: 'var(--font-heading)', color: '#fff' }}>
          🔥 Zest Tournament – Play Fair, Win Fair
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: '1.4' }}>
          Disclaimer: Garena Free Fire glitches ke liye Zest Tournament zimmedar nahi hoga. Ye user ki khud ki responsibility hogi.
        </p>
        <a
          href="https://t.me/zesttournament"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{
            marginTop: '6px',
            padding: '8px 18px',
            fontSize: '0.8rem',
            fontWeight: '800',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>💬</span> Telegram: @zesttournament
        </a>
      </div>

    </div>
  );
}
