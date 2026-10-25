import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../services/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLanguage = null }) => {
  const [language, setLanguageState] = useState(() => {
    // 1. Initial priority: explicit prop
    if (initialLanguage && translations[initialLanguage]) {
      return initialLanguage;
    }
    // 2. Saved user profile language in localStorage
    try {
      const userProfile = JSON.parse(localStorage.getItem('zest_user_profile') || '{}');
      if (userProfile?.language && translations[userProfile.language]) {
        return userProfile.language;
      }
    } catch (_) {}

    // 3. Saved app language preference
    const saved = localStorage.getItem('zest_app_language');
    if (saved && translations[saved]) {
      return saved;
    }

    return 'en';
  });

  const setLanguage = (newLang) => {
    if (!translations[newLang]) return;
    setLanguageState(newLang);
    localStorage.setItem('zest_app_language', newLang);

    // Also update cached user profile if exists
    try {
      const userProfile = JSON.parse(localStorage.getItem('zest_user_profile') || '{}');
      if (userProfile && typeof userProfile === 'object') {
        userProfile.language = newLang;
        localStorage.setItem('zest_user_profile', JSON.stringify(userProfile));
      }
    } catch (_) {}

    document.documentElement.setAttribute('lang', newLang);
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  /**
   * Helper translation function
   * @param {string} path - dot separated key e.g. 'auth.signin'
   * @param {object} params - optional key-value replacements e.g. { bonus: 50 }
   * @param {string} fallback - optional fallback text
   */
  const t = (path, params = {}, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');

    let val = translations[language];
    for (const p of parts) {
      if (val && typeof val === 'object') {
        val = val[p];
      } else {
        val = undefined;
        break;
      }
    }

    // Fallback to English if missing in selected language
    if (val === undefined || val === null) {
      let fallbackVal = translations['en'];
      for (const p of parts) {
        if (fallbackVal && typeof fallbackVal === 'object') {
          fallbackVal = fallbackVal[p];
        } else {
          fallbackVal = undefined;
          break;
        }
      }
      val = fallbackVal !== undefined ? fallbackVal : fallback || path;
    }

    if (typeof val === 'string' && params && typeof params === 'object') {
      let res = val;
      Object.keys(params).forEach(k => {
        res = res.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
      return res;
    }

    return val !== undefined ? val : fallback || path;
  };

  const currentLanguageObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageObj
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, _, fb) => fb || key,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageObj: SUPPORTED_LANGUAGES[0]
    };
  }
  return context;
};
