import { createContext, useContext, useState } from 'react';

const LangContext = createContext({ lang: 'EN', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('nico_lang') || 'EN');
  const changeLang = (l) => { setLang(l); localStorage.setItem('nico_lang', l); };
  return <LangContext.Provider value={{ lang, setLang: changeLang }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }
