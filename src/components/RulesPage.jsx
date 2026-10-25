import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedRules } from '../services/rulesData';

export default function RulesPage({ setCurrentView }) {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  const ruleSections = getLocalizedRules(language);

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
            {t('rules.back_to_arena', {}, '← Back to Arena')}
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
            📜 {t('rules.title', {}, 'FAIRPLAY & TOURNAMENT RULES')}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {t('rules.subtitle', {}, '🔥 Zest Tournament – Play Fair, Win Fair')}
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
          { id: 'all', label: `🌟 ${t('rules.cat_all', {}, 'All Rules')}` },
          { id: 'account_entry', label: `🔴 ${t('rules.cat_account', {}, 'Account & Entry')}` },
          { id: 'id_password', label: `🔑 ${t('rules.cat_id_pass', {}, 'ID & Pass')}` },
          { id: 'joining_slots', label: `🚪 ${t('rules.cat_joining', {}, 'Joining & Slots')}` },
          { id: 'cs_lonewolf', label: `⚔️ ${t('rules.cat_gameplay', {}, 'CS / Lone Wolf')}` },
          { id: 'cs_headshot', label: `🎯 ${t('rules.cat_headshot', {}, 'Headshot')}` },
          { id: 'game_weapons', label: `🎮 ${t('rules.cat_weapons', {}, 'Weapon Rules')}` },
          { id: 'screen_recording', label: `📹 ${t('rules.cat_recording', {}, 'Screen & POV')}` },
          { id: 'match_limit', label: `⚠️ ${t('rules.cat_limit', {}, 'Match Limit')}` },
          { id: 'device', label: `📱 ${t('rules.cat_device', {}, 'Device Rules')}` },
          { id: 'penalty', label: `🚫 ${t('rules.cat_penalty', {}, 'Penalty & Ban')}` },
          { id: 'final_note', label: `⚡ ${t('rules.cat_disclaimer', {}, 'Final Note')}` }
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
                    color: item.includes('❌') || item.includes('🚫') || item.includes('⚠️') || item.includes('⛔') ? '#ff80ab' : 'var(--text-secondary)',
                    lineHeight: '1.5',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${item.includes('❌') || item.includes('🚫') || item.includes('⛔') ? 'var(--danger)' : item.includes('✅') ? 'var(--success)' : item.includes('🔥') ? 'var(--secondary)' : 'var(--primary)'}`
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
          {t('rules.pov_warning', {}, '⚠️ Screen recording is mandatory from ID/Password drop until match finishes.')}
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
