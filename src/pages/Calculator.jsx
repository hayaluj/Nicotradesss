import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import '@/styles/marketing.css';

const PIP_VALUES = {
  EURUSD: 10, GBPUSD: 10, USDJPY: 9.50, USDCHF: 10,
  AUDUSD: 10, USDCAD: 10, NZDUSD: 10, XAUUSD: 10,
};

const PIP_SIZES = {
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, USDCHF: 0.0001,
  AUDUSD: 0.0001, USDCAD: 0.0001, NZDUSD: 0.0001, XAUUSD: 0.01,
};

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };

const PAIRS = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'USDCHF', label: 'USD/CHF' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'USDCAD', label: 'USD/CAD' },
  { value: 'NZDUSD', label: 'NZD/USD' },
  { value: 'XAUUSD', label: 'XAU/USD (Gold)' },
];

const ct = {
  EN: {
    heroTitle: 'Forex Risk Calculator',
    heroSub: 'Know your risk before every trade.',
    tabPosition: 'Position Size',
    tabRiskReward: 'Risk / Reward',
    accountBalance: 'Account Balance',
    riskPercentage: 'Risk Percentage',
    stopLossPips: 'Stop Loss (pips)',
    currencyPair: 'Currency Pair',
    results: '📊 Results',
    riskAmount: 'Risk Amount',
    positionSize: 'Position Size',
    positionUnits: 'Position (Units)',
    pipValue: 'Pip Value',
    entryPrice: 'Entry Price',
    stopLossPrice: 'Stop Loss Price',
    takeProfitPrice: 'Take Profit Price',
    positionSizeLots: 'Position Size (lots)',
    risk: 'Risk',
    reward: 'Reward',
    riskRewardRatio: 'Risk : Reward',
    potentialLoss: 'Potential Loss',
    potentialProfit: 'Potential Profit',
    pctAccountRisk: '% of Account at Risk',
    conservativeRisk: 'Conservative risk',
    moderateRisk: 'Moderate risk',
    highRisk: 'High risk — proceed with caution',
    enterValues: 'Enter values to calculate',
    bookmark: "⭐ Bookmark this page — you'll use it before every trade.",
    whyMatters: 'Why position sizing matters',
    protect: 'Protect your capital.',
    protectDesc: 'A single overleveraged trade can wipe out months of gains. Proper sizing keeps you in the game long enough to become profitable.',
    emotion: 'Trade without emotion.',
    emotionDesc: "When you know exactly how much you can lose, fear and greed don't control your decisions. You execute the plan.",
    compound: 'Consistent growth compounds.',
    compoundDesc: "Risking 1–2% per trade means even a string of losses won't break you — but a string of wins will compound fast.",
    emailH2: 'Get the free Forex Starter Kit.',
    emailSub: "Position sizing is just the beginning. Get the full kit — risk management, chart reading, and the mistakes I made so you don't have to.",
    emailPlaceholder: 'your@email.com',
    sendKit: 'Send me the kit →',
    checkInbox: 'Check your inbox! 🎉',
    about: 'About', trading: 'Trading', community: 'Community', bookSession: 'Book a Session',
    goDashboard: 'Go to Dashboard →', getFreeKit: 'Get Free Forex Kit →',
  },
  NO: {
    heroTitle: 'Risikokalkulator for Forex',
    heroSub: 'Kjenn risikoen din før hver handel.',
    tabPosition: 'Posisjonsstørrelse',
    tabRiskReward: 'Risiko / Belønning',
    accountBalance: 'Kontosaldo',
    riskPercentage: 'Risikoprosent',
    stopLossPips: 'Stopp-tap (pips)',
    currencyPair: 'Valutapar',
    results: '📊 Resultater',
    riskAmount: 'Risikobeløp',
    positionSize: 'Posisjonsstørrelse',
    positionUnits: 'Posisjon (enheter)',
    pipValue: 'Pip-verdi',
    entryPrice: 'Inngangspris',
    stopLossPrice: 'Stopp-tap-pris',
    takeProfitPrice: 'Ta gevinst-pris',
    positionSizeLots: 'Posisjonsstørrelse (lots)',
    risk: 'Risiko',
    reward: 'Belønning',
    riskRewardRatio: 'Risiko : Belønning',
    potentialLoss: 'Potensielt tap',
    potentialProfit: 'Potensiell fortjeneste',
    pctAccountRisk: '% av konto i risiko',
    conservativeRisk: 'Konservativ risiko',
    moderateRisk: 'Moderat risiko',
    highRisk: 'Høy risiko — vær forsiktig',
    enterValues: 'Fyll inn verdier for å beregne',
    bookmark: '⭐ Lagre denne siden — du kommer til å bruke den før hver handel.',
    whyMatters: 'Hvorfor posisjonsstørrelse er viktig',
    protect: 'Beskytt kapitalen din.',
    protectDesc: 'En eneste overbelånt handel kan utslette måneder med gevinst. Riktig størrelse holder deg i spillet lenge nok til å bli lønnsom.',
    emotion: 'Handle uten følelser.',
    emotionDesc: 'Når du vet nøyaktig hvor mye du kan tape, styrer ikke frykt og grådighet beslutningene dine. Du gjennomfører planen.',
    compound: 'Konsistent vekst gir rentes rente.',
    compoundDesc: 'Å risikere 1–2 % per handel betyr at selv en rekke tap ikke knekker deg — men en rekke gevinster vil vokse raskt.',
    emailH2: 'Få den gratis Forex-startpakken.',
    emailSub: 'Posisjonsstørrelse er bare begynnelsen. Få hele settet — risikostyring, kartlesing og feilene jeg gjorde så du slipper.',
    emailPlaceholder: 'din@epost.no',
    sendKit: 'Send meg settet →',
    checkInbox: 'Sjekk innboksen din! 🎉',
    about: 'Om', trading: 'Handel', community: 'Fellesskap', bookSession: 'Bestill en time',
    goDashboard: 'Gå til oversikten →', getFreeKit: 'Få gratis Forex-sett →',
  },
  ES: {
    heroTitle: 'Calculadora de Riesgo Forex',
    heroSub: 'Conoce tu riesgo antes de cada operación.',
    tabPosition: 'Tamaño de Posición',
    tabRiskReward: 'Riesgo / Beneficio',
    accountBalance: 'Saldo de cuenta',
    riskPercentage: 'Porcentaje de riesgo',
    stopLossPips: 'Stop Loss (pips)',
    currencyPair: 'Par de divisas',
    results: '📊 Resultados',
    riskAmount: 'Monto de riesgo',
    positionSize: 'Tamaño de posición',
    positionUnits: 'Posición (unidades)',
    pipValue: 'Valor del pip',
    entryPrice: 'Precio de entrada',
    stopLossPrice: 'Precio de Stop Loss',
    takeProfitPrice: 'Precio de toma de ganancias',
    positionSizeLots: 'Tamaño de posición (lotes)',
    risk: 'Riesgo',
    reward: 'Beneficio',
    riskRewardRatio: 'Riesgo : Beneficio',
    potentialLoss: 'Pérdida potencial',
    potentialProfit: 'Ganancia potencial',
    pctAccountRisk: '% de cuenta en riesgo',
    conservativeRisk: 'Riesgo conservador',
    moderateRisk: 'Riesgo moderado',
    highRisk: 'Riesgo alto — procede con cautela',
    enterValues: 'Introduce valores para calcular',
    bookmark: '⭐ Guarda esta página — la usarás antes de cada operación.',
    whyMatters: 'Por qué importa el tamaño de posición',
    protect: 'Protege tu capital.',
    protectDesc: 'Una sola operación con demasiado apalancamiento puede borrar meses de ganancias. Un tamaño adecuado te mantiene en el juego lo suficiente para ser rentable.',
    emotion: 'Opera sin emociones.',
    emotionDesc: 'Cuando sabes exactamente cuánto puedes perder, el miedo y la codicia no controlan tus decisiones. Ejecutas el plan.',
    compound: 'El crecimiento constante se acumula.',
    compoundDesc: 'Arriesgar 1–2% por operación significa que incluso una racha de pérdidas no te destruirá — pero una racha de ganancias crecerá rápido.',
    emailH2: 'Consigue el kit de inicio gratuito de Forex.',
    emailSub: 'El tamaño de posición es solo el comienzo. Consigue el kit completo — gestión de riesgo, lectura de gráficos y los errores que cometí para que tú no tengas que hacerlo.',
    emailPlaceholder: 'tu@email.com',
    sendKit: 'Envíame el kit →',
    checkInbox: '¡Revisa tu bandeja de entrada! 🎉',
    about: 'Acerca de', trading: 'Operaciones', community: 'Comunidad', bookSession: 'Reserva una sesión',
    goDashboard: 'Ve al panel →', getFreeKit: 'Kit gratuito de Forex →',
  },
};

export default function Calculator() {
  const { user } = useAuth();
  const [lang, setLang] = useState('EN');
  const [activeTab, setActiveTab] = useState('position');

  const [psBalance, setPsBalance] = useState(10000);
  const [psCurrency, setPsCurrency] = useState('USD');
  const [psRisk, setPsRisk] = useState(1);
  const [psStoploss, setPsStoploss] = useState(50);
  const [psPair, setPsPair] = useState('EURUSD');

  const [rrPair, setRrPair] = useState('EURUSD');
  const [rrEntry, setRrEntry] = useState('');
  const [rrStoploss, setRrStoploss] = useState('');
  const [rrTakeprofit, setRrTakeprofit] = useState('');
  const [rrLots, setRrLots] = useState(0.20);
  const [rrBalance, setRrBalance] = useState(10000);
  const [rrCurrency, setRrCurrency] = useState('USD');

  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const s = ct[lang];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const els = document.querySelectorAll('.marketing-page .fade-in');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, lang]);

  const getRiskText = (pct) => {
    if (pct > 2) return s.highRisk;
    if (pct > 1) return s.moderateRisk;
    return s.conservativeRisk;
  };

  const psCalc = (() => {
    const balance = psBalance || 0;
    const riskPct = psRisk || 0;
    const sl = psStoploss || 0;
    const pipValue = PIP_VALUES[psPair];
    const sym = CURRENCY_SYMBOLS[psCurrency];
    const riskAmount = balance * (riskPct / 100);

    let lots = 0;
    let units = 0;
    if (sl > 0 && pipValue > 0) {
      lots = riskAmount / (sl * pipValue);
      units = Math.round(lots * 100000);
    }

    let riskLevel = 'low';
    if (riskPct > 2) riskLevel = 'high';
    else if (riskPct > 1) riskLevel = 'medium';

    return { sym, riskAmount, lots, units, pipValue, riskLevel, riskText: getRiskText(riskPct), riskPct };
  })();

  const rrCalc = (() => {
    const entry = parseFloat(rrEntry);
    const sl = parseFloat(rrStoploss);
    const tp = parseFloat(rrTakeprofit);
    const lots = rrLots || 0;
    const balance = rrBalance || 0;
    const sym = CURRENCY_SYMBOLS[rrCurrency];
    const pipSize = PIP_SIZES[rrPair];
    const pipVal = PIP_VALUES[rrPair];

    if (isNaN(entry) || isNaN(sl) || isNaN(tp) || entry <= 0) {
      return { valid: false, sym };
    }

    const riskPips = Math.abs(entry - sl) / pipSize;
    const rewardPips = Math.abs(tp - entry) / pipSize;
    const ratio = riskPips > 0 ? rewardPips / riskPips : 0;
    const potentialLoss = riskPips * pipVal * lots;
    const potentialProfit = rewardPips * pipVal * lots;
    const pctRisk = balance > 0 ? (potentialLoss / balance) * 100 : 0;

    let riskLevel = 'low';
    if (pctRisk > 2) riskLevel = 'high';
    else if (pctRisk > 1) riskLevel = 'medium';

    return { valid: true, sym, riskPips, rewardPips, ratio, potentialLoss, potentialProfit, pctRisk, riskLevel, riskText: getRiskText(pctRisk) };
  })();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    try {
      await supabase.from('email_subscribers').insert({
        email,
        language: lang.toLowerCase(),
        source: 'calculator',
        subscribed_at: new Date().toISOString(),
        status: 'active',
      });
      setEmailSubmitted(true);
    } catch (err) {
      if (err?.code === '23505' || err?.message?.includes('duplicate')) {
        setEmailSubmitted(true); return;
      }
      setEmailError('Something went wrong. Please try again.');
      console.error('Subscription error:', err);
    }
  };

  const riskColorClass = psCalc.riskPct <= 1 ? 'risk-low' : psCalc.riskPct <= 2 ? 'risk-mid' : 'risk-high';

  return (
    <div className="marketing-page">
      {/* NAV */}
      <nav className="mk-nav">
        <div className="container">
          <div className="nav-left">
            <Link to="/" className="nav-back">← Back</Link>
            <Link to="/" className="nav-logo">Nicotradesss</Link>
          </div>

          <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
            <li><Link to="/#story" onClick={() => setMenuOpen(false)}>{s.about}</Link></li>
            <li><Link to="/#products" onClick={() => setMenuOpen(false)}>{s.trading}</Link></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>{s.community}</a></li>
            <li><Link to="/booking" onClick={() => setMenuOpen(false)}>{s.bookSession}</Link></li>
          </ul>

          <div className="nav-right">
            <div className="lang-switcher">
              {['NO', 'EN', 'ES'].map((l) => (
                <span key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l}</span>
              ))}
            </div>
            {user ? (
              <Link to="/dashboard" className="mk-btn mk-btn-primary nav-cta-desktop">{s.goDashboard}</Link>
            ) : (
              <Link to="/#email-capture" className="mk-btn mk-btn-primary nav-cta-desktop">{s.getFreeKit}</Link>
            )}
            <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="calc-hero">
        <div className="container fade-in">
          <h1>{s.heroTitle}</h1>
          <p>{s.heroSub}</p>
        </div>
      </section>

      {/* TABS */}
      <div className="tabs-wrapper fade-in">
        <div className="tabs">
          <button className={`tab ${activeTab === 'position' ? 'active' : ''}`} onClick={() => setActiveTab('position')}>{s.tabPosition}</button>
          <button className={`tab ${activeTab === 'riskReward' ? 'active' : ''}`} onClick={() => setActiveTab('riskReward')}>{s.tabRiskReward}</button>
        </div>
      </div>

      <div className="calc-wrapper">
        {activeTab === 'position' && (
          <>
            <div className="calc-card fade-in">
              <div className="input-group">
                <label className="input-label">{s.accountBalance}</label>
                <div className="input-row">
                  <input type="number" className="input-field" value={psBalance} onChange={(e) => setPsBalance(parseFloat(e.target.value) || 0)} placeholder="10000" min="0" step="100" />
                  <select className="currency-select" value={psCurrency} onChange={(e) => setPsCurrency(e.target.value)}>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{s.riskPercentage}</label>
                <div className="slider-wrapper">
                  <input type="range" min="0.1" max="5" step="0.1" value={psRisk} onChange={(e) => setPsRisk(parseFloat(e.target.value))} />
                  <span className={`slider-value ${riskColorClass}`}>{psRisk.toFixed(1)}%</span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{s.stopLossPips}</label>
                <input type="number" className="input-field" value={psStoploss} onChange={(e) => setPsStoploss(parseFloat(e.target.value) || 0)} placeholder="50" min="1" step="1" />
              </div>

              <div className="input-group">
                <label className="input-label">{s.currencyPair}</label>
                <select className="pair-select" value={psPair} onChange={(e) => setPsPair(e.target.value)}>
                  {PAIRS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="results-card fade-in">
              <div className="results-title">{s.results}</div>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">{s.riskAmount}</span>
                  <span className="result-value highlight">{psCalc.sym}{psCalc.riskAmount.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.positionSize}</span>
                  <span className="result-value highlight">{psCalc.lots > 0 ? psCalc.lots.toFixed(2) + ' lots' : '— lots'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.positionUnits}</span>
                  <span className="result-value">{psCalc.units > 0 ? psCalc.units.toLocaleString() : '—'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.pipValue}</span>
                  <span className="result-value">${psCalc.pipValue.toFixed(2)}/pip</span>
                </div>
              </div>
              <div style={{ marginTop: '20px', position: 'relative' }}>
                <div className={`risk-indicator ${psCalc.riskLevel}`}>
                  <span className="risk-dot"></span>
                  <span>{psCalc.riskText}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'riskReward' && (
          <>
            <div className="calc-card fade-in">
              <div className="input-group">
                <label className="input-label">{s.currencyPair}</label>
                <select className="pair-select" value={rrPair} onChange={(e) => setRrPair(e.target.value)}>
                  {PAIRS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">{s.entryPrice}</label>
                <input type="number" className="input-field" value={rrEntry} onChange={(e) => setRrEntry(e.target.value)} placeholder="1.08500" step="0.00001" />
              </div>

              <div className="input-group">
                <label className="input-label">{s.stopLossPrice}</label>
                <input type="number" className="input-field" value={rrStoploss} onChange={(e) => setRrStoploss(e.target.value)} placeholder="1.08000" step="0.00001" />
              </div>

              <div className="input-group">
                <label className="input-label">{s.takeProfitPrice}</label>
                <input type="number" className="input-field" value={rrTakeprofit} onChange={(e) => setRrTakeprofit(e.target.value)} placeholder="1.09750" step="0.00001" />
              </div>

              <div className="input-group">
                <label className="input-label">{s.positionSizeLots}</label>
                <input type="number" className="input-field" value={rrLots} onChange={(e) => setRrLots(parseFloat(e.target.value) || 0)} placeholder="0.20" min="0.01" step="0.01" />
              </div>

              <div className="input-group">
                <label className="input-label">{s.accountBalance}</label>
                <div className="input-row">
                  <input type="number" className="input-field" value={rrBalance} onChange={(e) => setRrBalance(parseFloat(e.target.value) || 0)} placeholder="10000" min="0" step="100" />
                  <select className="currency-select" value={rrCurrency} onChange={(e) => setRrCurrency(e.target.value)}>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="results-card fade-in">
              <div className="results-title">{s.results}</div>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">{s.risk}</span>
                  <span className="result-value">{rrCalc.valid ? rrCalc.riskPips.toFixed(1) + ' pips' : '— pips'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.reward}</span>
                  <span className="result-value">{rrCalc.valid ? rrCalc.rewardPips.toFixed(1) + ' pips' : '— pips'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.riskRewardRatio}</span>
                  <span className="result-value highlight">{rrCalc.valid ? '1 : ' + rrCalc.ratio.toFixed(1) : '—'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.potentialLoss}</span>
                  <span className="result-value loss">{rrCalc.valid ? '-' + rrCalc.sym + rrCalc.potentialLoss.toFixed(2) : '—'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.potentialProfit}</span>
                  <span className="result-value profit">{rrCalc.valid ? '+' + rrCalc.sym + rrCalc.potentialProfit.toFixed(2) : '—'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">{s.pctAccountRisk}</span>
                  <span className="result-value">{rrCalc.valid ? rrCalc.pctRisk.toFixed(2) + '%' : '—'}</span>
                </div>
              </div>
              <div style={{ marginTop: '20px', position: 'relative' }}>
                <div className={`risk-indicator ${rrCalc.valid ? rrCalc.riskLevel : 'low'}`}>
                  <span className="risk-dot"></span>
                  <span>{rrCalc.valid ? rrCalc.riskText : s.enterValues}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bookmark-nudge fade-in">
          {s.bookmark}
        </div>
      </div>

      {/* EXPLAINER */}
      <div className="explainer fade-in">
        <h2>{s.whyMatters}</h2>
        <ul className="explainer-points">
          <li>
            <span className="icon">🛡️</span>
            <span><strong>{s.protect}</strong> {s.protectDesc}</span>
          </li>
          <li>
            <span className="icon">🧠</span>
            <span><strong>{s.emotion}</strong> {s.emotionDesc}</span>
          </li>
          <li>
            <span className="icon">📈</span>
            <span><strong>{s.compound}</strong> {s.compoundDesc}</span>
          </li>
        </ul>
      </div>

      {/* EMAIL CAPTURE */}
      <section className="email-capture" id="email-capture">
        <div className="container fade-in">
          <h2>{s.emailH2}</h2>
          <p className="sub">{s.emailSub}</p>

          {emailSubmitted ? (
            <p style={{ color: '#ffffff', fontWeight: 600, padding: '14px 0' }}>{s.checkInbox}</p>
          ) : (
            <form className="email-form" onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder={s.emailPlaceholder}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="mk-btn">{s.sendKit}</button>
            </form>
          )}
          {emailError && <p style={{ color: '#ff6b6b', marginTop: '12px', fontSize: '0.9rem' }}>{emailError}</p>}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mk-footer">
        <div className="container">
          <div className="footer-top">
            <Link to="/" className="footer-logo">Nicotradesss</Link>

            <ul className="footer-nav">
              <li><Link to="/#story">{s.about}</Link></li>
              <li><Link to="/#products">{s.trading}</Link></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer">{s.community}</a></li>
              <li><Link to="/booking">{s.bookSession}</Link></li>
              <li><Link to="/legal">Privacy & Terms</Link></li>
            </ul>

            <div className="footer-right">
              <div className="lang-switcher">
                {['NO', 'EN', 'ES'].map((l) => (
                  <span key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l}</span>
                ))}
              </div>
              <div className="social-icons">
                <a href="#" className="social-icon" title="TikTok">TT</a>
                <a href="#" className="social-icon" title="Instagram">IG</a>
                <a href="#" className="social-icon" title="Snapchat">SC</a>
                <a href="#" className="social-icon" title="Telegram">TG</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            © 2025 Nicotradesss. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
