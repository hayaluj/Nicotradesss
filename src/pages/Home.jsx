import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import '@/styles/marketing.css';

const SOCIAL_LINKS = {
  tiktok:    'https://www.tiktok.com/@nicotradesss',
  snapchat:  'https://snapchat.com/t/zMujbsoL',
  instagram: 'https://www.instagram.com/nicochilling_',
  telegram:  'https://t.me/nicotradesss',
};

const t = {
  EN: {
    about: 'About', trading: 'Trading', community: 'Community', bookSession: 'Book a Session',
    dashboard: 'Dashboard →', getFreeKit: 'Get Free Kit →', tradingLive: 'Trading Live',
    h1a: 'Trader. Creator.', h1b: 'Teaching you how', h1c: 'to make', h1money: 'money', h1d: 'move.',
    heroSub: 'Half Norwegian, half Argentinian. I trade Forex, build an audience across three languages, and teach everything I know. No gatekeeping.',
    getCourse: 'Get the Course →', freeKit: 'Free Forex Kit',
    tiktokFollowers: 'TikTok Followers', snapFollowers: 'Snapchat Followers',
    students: 'Students Taught', languages: 'Languages',
    storyH2a: 'Not your typical', storyH2b: 'trading guru.',
    storyP1: "I'm Nico. Half Norwegian, half Argentinian — grew up between two cultures, two languages, and two completely different ideas about money.",
    storyP2: "I started trading Forex around 5 years ago. Made mistakes, learned fast, and eventually built a following across TikTok, Snapchat, and Instagram teaching others what I wish I'd known.",
    storyP3: "I don't gatekeep. Everything I know goes into my content, my courses, and my community. If you're ready to actually learn how money moves — you're in the right place.",
    whatIOffer: 'WHAT I OFFER', offerTitle: 'Everything you need to start trading.',
    calcTitle: 'Free Forex Risk Calculator',
    calcDesc: 'Know your exact position size before every trade. Free, instant, no signup required — then grab the full Starter Kit.',
    openCalc: 'Open Calculator →', badgeFree: 'FREE',
    courseTitle: 'The Forex Foundation Course',
    courseDesc: "Step-by-step from zero to your first live trades. My complete beginner system — the same one I wish I had when I started.",
    badgePopular: 'MOST POPULAR',
    vipTitle: 'VIP Trading Community',
    vipDesc: 'Daily signals, live trade breakdowns, market analysis, and direct access to me. Join the traders who are actually in the market.',
    badgeMonthly: 'MONTHLY', joinCommunity: 'Join the Community →',
    advTitle: 'Advanced Price Action',
    advDesc: 'For traders ready to go beyond the basics. Price action, psychology, and the setups I use in live markets.',
    badgeSoon: 'COMING SOON', joinWaitlist: 'Join Waitlist →',
    sessionTitle: 'Personal Trading Session',
    sessionDesc: '60 minutes, one on one. We review your trades, fix your strategy, and build a personalised plan. Limited spots.',
    badgePremium: 'PREMIUM', bookSession: 'Book a Session →',
    botPdfTitle: 'How to Build a Trading Bot',
    botPdfDesc: 'Automate your strategy with zero coding. From idea to live bot in an afternoon.',
    botPdfBtn: 'Get the Guide →',
    badgeGuide: 'GUIDE',
    beginnerPdfTitle: "Beginner's Complete Trading Guide",
    beginnerPdfDesc: 'Everything I wish I knew when I started. The complete foundation for new traders.',
    beginnerPdfBtn: 'Get the Guide →',
    emailH2: 'Get the free Forex Starter Kit.',
    emailSub: 'The fundamentals, the mistakes, the shortcuts — in one free download. No spam, ever.',
    emailPlaceholder: 'your@email.com', sendKit: 'Send me the kit →',
    checkInbox: 'Check your inbox! 🎉', emailError: 'Something went wrong. Please try again.',
    disclaimer: 'All content on this site is for educational purposes only and does not constitute financial advice. Trading involves significant risk of loss. Past results are not indicative of future performance.',
    copyright: '© 2025 Nicotradesss. All rights reserved.',
    goDashboard: 'Go to Dashboard →', login: 'Log In', register: 'Get Started →',
    followOn: 'Follow on',
  },
  NO: {
    about: 'Om', trading: 'Handel', community: 'Fellesskap', bookSession: 'Bestill en time',
    dashboard: 'Dashboard →', getFreeKit: 'Få gratis sett →', tradingLive: 'Live-handel',
    h1a: 'Handler. Skaper.', h1b: 'Lærer deg hvordan', h1c: 'du får', h1money: 'pengene', h1d: 'til å bevege seg.',
    heroSub: 'Halvt norsk, halvt argentinsk. Jeg handler med valuta, bygger opp et publikum på tre språk og deler alt jeg kan. Ingen begrensninger.',
    getCourse: 'Meld deg på kurset →', freeKit: 'Gratis Forex-pakke',
    tiktokFollowers: 'TikTok-følgere', snapFollowers: 'Følgere på Snapchat',
    students: 'Antall elever', languages: 'Språk',
    storyH2a: 'Ikke akkurat en', storyH2b: 'typisk handelsguru.',
    storyP1: 'Jeg heter Nico. Jeg er halvt norsk, halvt argentinsk – og vokste opp mellom to kulturer, to språk og to helt forskjellige syn på penger.',
    storyP2: 'Jeg begynte å handle på valutamarkedet da jeg var i begynnelsen av tjueårene. Jeg gjorde feil, lærte raskt og fikk etter hvert en følgerskare på TikTok, Snapchat og Instagram, hvor jeg lærte andre det jeg selv skulle ønske jeg hadde visst.',
    storyP3: 'Jeg holder ikke noe tilbake. Alt jeg vet, deler jeg i innholdet mitt, kursene mine og fellesskapet mitt. Hvis du er klar til å lære hvordan penger beveger seg – er du på rett sted.',
    whatIOffer: 'HVA JEG TILBYR', offerTitle: 'Alt du trenger for å komme i gang med handel.',
    calcTitle: 'Gratis risikokalkulator for valutahandel',
    calcDesc: 'Sjekk den nøyaktige posisjonsstørrelsen før hver handel. Gratis, umiddelbart og uten påmelding – og hent deretter hele startpakken.',
    openCalc: 'Åpne kalkulator →', badgeFree: 'GRATIS',
    courseTitle: 'Grunnkurs i valutahandel',
    courseDesc: 'Trinn for trinn fra null til dine første live-handler. Mitt komplette system for nybegynnere – det samme systemet jeg skulle ønske jeg hadde hatt da jeg startet.',
    badgePopular: 'MEST POPULÆRE',
    vipTitle: 'VIP-handelsfellesskap',
    vipDesc: 'Daglige signaler, detaljerte oversikter over live-handler, markedsanalyser og direkte kontakt med meg. Bli med blant de tradere som faktisk er aktive i markedet.',
    badgeMonthly: 'MÅNEDLIG', joinCommunity: 'Bli med i fellesskapet →',
    advTitle: 'Avansert prisbevegelse',
    advDesc: 'For tradere som er klare til å gå utover det grunnleggende. Kursbevegelser, psykologi og de oppsettene jeg bruker i reelle markeder.',
    badgeSoon: 'KOMMER SNART', joinWaitlist: 'Skriv deg på ventelisten →',
    sessionTitle: 'Personlig handelsøkt',
    sessionDesc: '60 minutter, en-til-en. Vi går gjennom dine handler, justerer strategien din og utarbeider en personlig plan. Begrenset antall plasser.',
    badgePremium: 'PREMIUM', bookSession: 'Bestill en time →',
    botPdfTitle: 'Slik bygger du en handelsbot',
    botPdfDesc: 'Automatiser strategien din uten å skrive en linje kode. Fra idé til live bot på en ettermiddag.',
    botPdfBtn: 'Hent guiden →',
    badgeGuide: 'GUIDE',
    beginnerPdfTitle: 'Komplett handelsguide for nybegynnere',
    beginnerPdfDesc: 'Alt jeg skulle ønske jeg visste da jeg startet. Det komplette grunnlaget for nye tradere.',
    beginnerPdfBtn: 'Hent guiden →',
    emailH2: 'Få den gratis Forex-startpakken.',
    emailSub: 'Grunnleggende kunnskap, vanlige feil, smarte tips – alt i én gratis nedlasting. Ingen spam, noensinne.',
    emailPlaceholder: 'din@epost.no', sendKit: 'Send meg settet →',
    checkInbox: 'Sjekk innboksen din! 🎉', emailError: 'Det oppstod en feil. Prøv på nytt.',
    disclaimer: 'Alt innhold på dette nettstedet er kun ment for informasjonsformål og utgjør ikke finansiell rådgivning. Handel innebærer en betydelig risiko for tap. Tidligere resultater er ikke en garanti for fremtidig avkastning.',
    copyright: '© 2025 Nicotradesss. Alle rettigheter forbeholdt.',
    goDashboard: 'Gå til oversikten →', login: 'Logg inn', register: 'Kom i gang →',
    followOn: 'Følg på',
  },
  ES: {
    about: 'Acerca de', trading: 'Operaciones', community: 'Comunidad', bookSession: 'Reserva una sesión',
    dashboard: 'Panel de control →', getFreeKit: 'Consigue tu kit gratis →', tradingLive: 'Operaciones en vivo',
    h1a: 'Operador. Creador.', h1b: 'Te enseño cómo hacer', h1c: 'que el', h1money: 'dinero', h1d: 'se mueva.',
    heroSub: 'Mitad noruego, mitad argentino. Opero en el mercado de divisas, construyo una comunidad en tres idiomas y enseño todo lo que sé. Sin exclusividades.',
    getCourse: 'Consigue el curso →', freeKit: 'Kit gratuito de Forex',
    tiktokFollowers: 'Seguidores en TikTok', snapFollowers: 'Seguidores en Snapchat',
    students: 'Alumnos formados', languages: 'Idiomas',
    storyH2a: 'No es el típico', storyH2b: 'gurú del trading.',
    storyP1: 'Me llamo Nico. Soy mitad noruego, mitad argentino; crecí entre dos culturas, dos idiomas y dos concepciones del dinero totalmente diferentes.',
    storyP2: 'Empecé a operar en el mercado de divisas cuando tenía poco más de veinte años. Cometí errores, aprendí rápido y, con el tiempo, conseguí crear una comunidad de seguidores en TikTok, Snapchat e Instagram, donde enseño a otros lo que me hubiera gustado saber.',
    storyP3: 'No me guardo nada para mí. Todo lo que sé lo plasmo en mis contenidos, mis cursos y mi comunidad. Si estás listo para aprender de verdad cómo funciona el dinero, estás en el lugar adecuado.',
    whatIOffer: 'QUÉ OFREZCO', offerTitle: 'Todo lo que necesitas para empezar a operar.',
    calcTitle: 'Calculadora gratuita de riesgo en Forex',
    calcDesc: 'Conoce el tamaño exacto de tu posición antes de cada operación. Gratis, al instante y sin necesidad de registrarte.',
    openCalc: 'Abrir calculadora →', badgeFree: 'GRATIS',
    courseTitle: 'Curso básico de Forex',
    courseDesc: 'Paso a paso, desde cero hasta tus primeras operaciones reales. Mi sistema para principiantes: el mismo que me hubiera gustado tener cuando empecé.',
    badgePopular: 'LOS MÁS POPULARES',
    vipTitle: 'Comunidad de trading VIP',
    vipDesc: 'Señales diarias, desgloses de operaciones en tiempo real, análisis de mercado y contacto directo conmigo. Únete a los operadores que realmente están en el mercado.',
    badgeMonthly: 'MENSUAL', joinCommunity: 'Únete a la comunidad →',
    advTitle: 'Análisis avanzado de precios',
    advDesc: 'Para traders listos para ir más allá de lo básico. La evolución del precio, la psicología y las estrategias que utilizo en los mercados en tiempo real.',
    badgeSoon: 'PRÓXIMAMENTE', joinWaitlist: 'Apúntate a la lista de espera →',
    sessionTitle: 'Sesión de trading personal',
    sessionDesc: '60 minutos, en sesión individual. Analizamos tus operaciones, ajustamos tu estrategia y elaboramos un plan personalizado. Plazas limitadas.',
    badgePremium: 'PREMIUM', bookSession: 'Reserva una sesión →',
    botPdfTitle: 'Cómo construir un bot de trading',
    botPdfDesc: 'Automatiza tu estrategia sin escribir una línea de código. De la idea al bot en funcionamiento en una tarde.',
    botPdfBtn: 'Obtener la guía →',
    badgeGuide: 'GUÍA',
    beginnerPdfTitle: 'Guía completa de trading para principiantes',
    beginnerPdfDesc: 'Todo lo que desearía haber sabido cuando empecé. La base completa para nuevos traders.',
    beginnerPdfBtn: 'Obtener la guía →',
    emailH2: 'Consigue el kit de inicio gratuito de Forex.',
    emailSub: 'Los conceptos básicos, los errores, los atajos: todo en una sola descarga gratuita. Sin spam, nunca.',
    emailPlaceholder: 'tu@email.com', sendKit: 'Envíame el kit →',
    checkInbox: '¡Echa un vistazo a tu bandeja de entrada! 🎉', emailError: 'Ha ocurrido un error. Inténtalo de nuevo.',
    disclaimer: 'Todo el contenido de este sitio web tiene fines exclusivamente educativos y no constituye asesoramiento financiero. Las operaciones bursátiles conllevan un riesgo significativo de pérdidas. Los resultados pasados no son indicativos del rendimiento futuro.',
    copyright: '© 2025 Nicotradesss. Todos los derechos reservados.',
    goDashboard: 'Ve al panel de control →', login: 'Iniciar sesión', register: 'Comenzar →',
    followOn: 'Seguir en',
  },
};

export default function Home() {
  const { user } = useAuth();
  const [lang, setLang] = useState('EN');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const s = t[lang];

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
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );
    const els = document.querySelectorAll('.marketing-page .fade-in');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleCheckout = async (product) => {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, userId: user?.id || '', email: user?.email || '' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    try {
      await supabase.from('email_subscribers').insert({
        email, language: lang.toLowerCase(), source: 'homepage',
        subscribed_at: new Date().toISOString(), status: 'active',
      });
      setEmailSubmitted(true);
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language: lang.toLowerCase() }),
      });    } catch (err) {
      if (err?.code === '23505' || err?.message?.includes('duplicate')) { setEmailSubmitted(true); return; }
      setEmailError(s.emailError);
    }
  };

  return (
    <div className="marketing-page">
      {/* NAV */}
      <nav className="mk-nav">
        <div className="container">
          <Link to="/" className="nav-logo">Nicotradesss</Link>
          <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
            <li><a onClick={() => { scrollTo('story'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>{s.about}</a></li>
            <li><a onClick={() => { scrollTo('products'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>{s.trading}</a></li>
            <li><a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>{s.community}</a></li>
            <li><Link to="/booking" onClick={() => setMenuOpen(false)}>{s.bookSession}</Link></li>
            {!user && <li className="nav-mobile-only"><Link to="/login" onClick={() => setMenuOpen(false)}>{s.login}</Link></li>}
            {!user && <li className="nav-mobile-only"><Link to="/register" onClick={() => setMenuOpen(false)}>{s.register}</Link></li>}
            {user && <li className="nav-mobile-only"><Link to="/dashboard" onClick={() => setMenuOpen(false)}>{s.dashboard}</Link></li>}
          </ul>
          <div className="nav-right">
            <div className="lang-switcher">
              {['NO', 'EN', 'ES'].map((l) => (
                <span key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l}</span>
              ))}
            </div>
            {user ? (
              <Link to="/dashboard" className="mk-btn mk-btn-primary nav-cta-desktop">{s.dashboard}</Link>
            ) : (
              <>
                <Link to="/login" className="nav-login-link nav-cta-desktop">{s.login}</Link>
                <Link to="/register" className="mk-btn mk-btn-primary nav-cta-desktop">{s.register}</Link>
              </>
            )}
            <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-gradient-blob" aria-hidden="true" />
        <div className="container">
          <div className="hero-content">
            <h1 className="fade-in fade-in-d1">
              {s.h1a}<br />{s.h1b}<br />{s.h1c} <span className="text-accent">{s.h1money}</span> {s.h1d}
            </h1>
            <p className="hero-sub fade-in fade-in-d2">{s.heroSub}</p>
            <div className="hero-buttons fade-in fade-in-d3">
              {user ? (
                <Link to="/dashboard" className="mk-btn mk-btn-primary">{s.goDashboard}</Link>
              ) : (
                <button className="mk-btn mk-btn-primary" onClick={() => handleCheckout('course')}>{s.getCourse}</button>
              )}
              <Link to="/calculator" className="mk-btn mk-btn-ghost">{s.freeKit}</Link>
            </div>
            <div className="hero-chips fade-in fade-in-d3">
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="chip chip-link">2K TikTok</a>
              <a href={SOCIAL_LINKS.snapchat} target="_blank" rel="noopener noreferrer" className="chip chip-link">158K Snapchat</a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="chip chip-link">5K Instagram</a>
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" className="chip chip-link">Telegram</a>
            </div>
          </div>
          <div className="hero-photo-col fade-in fade-in-d2">
            <div className="photo-card">
              <div className="photo-card-inner">
                <img src="/images/nico-hero.jpg" alt="Nico — Forex Trader & Educator" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="social-proof-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item fade-in">
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="stat-link">
                <span className="stat-number">2,000+</span>
                <span className="stat-label">{s.tiktokFollowers}</span>
                <span className="stat-follow">{s.followOn} TikTok →</span>
              </a>
            </div>
            <div className="stat-item fade-in fade-in-d1">
              <a href={SOCIAL_LINKS.snapchat} target="_blank" rel="noopener noreferrer" className="stat-link">
                <span className="stat-number">158,000+</span>
                <span className="stat-label">{s.snapFollowers}</span>
                <span className="stat-follow">{s.followOn} Snapchat →</span>
              </a>
            </div>
            <div className="stat-item fade-in fade-in-d2">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="stat-link">
                <span className="stat-number">5,000+</span>
                <span className="stat-label">Instagram</span>
                <span className="stat-follow">{s.followOn} Instagram →</span>
              </a>
            </div>
            <div className="stat-item fade-in fade-in-d3">
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" className="stat-link">
                <span className="stat-number">Telegram</span>
                <span className="stat-label">{s.community}</span>
                <span className="stat-follow">{s.followOn} Telegram →</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="story" id="story">
        <div className="container">
          <div className="story-number fade-in" aria-hidden="true">02</div>
          <div className="story-grid">
            <div className="story-text fade-in">
              <h2>{s.storyH2a}<br />{s.storyH2b}</h2>
              <div className="story-body">
                <p>{s.storyP1}</p>
                <p>{s.storyP2}</p>
                <p>{s.storyP3}</p>
              </div>
            </div>
            <div className="fade-in fade-in-d2">
              <div className="photo-card photo-card-sm">
                <div className="photo-card-inner">
                  <img src="/images/nico-about.jpg" alt="Nico" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products" id="products">
        <div className="container">
          <span className="section-label fade-in">{s.whatIOffer}</span>
          <h2 className="section-title fade-in fade-in-d1">{s.offerTitle}</h2>
          <div className="products-grid">
            <div className="product-card gold-border fade-in">
              <span className="product-badge badge-free">{s.badgeFree}</span>
              <h3>{s.calcTitle}</h3>
              <p>{s.calcDesc}</p>
              <Link to="/calculator" className="mk-btn mk-btn-gold">{s.openCalc}</Link>
            </div>
            <div className="product-card featured fade-in fade-in-d1">
              <span className="product-badge badge-popular">{s.badgePopular}</span>
              <h3>{s.courseTitle}</h3>
              <p>{s.courseDesc}</p>
              <div className="product-price">€99</div>
              <button className="mk-btn mk-btn-primary" onClick={() => handleCheckout('course')}>{s.getCourse}</button>
            </div>
            <div className="product-card fade-in fade-in-d2" id="community">
              <span className="product-badge badge-monthly">{s.badgeMonthly}</span>
              <h3>{s.vipTitle}</h3>
              <p>{s.vipDesc}</p>
              <div className="product-price">€29/month</div>
              <button className="mk-btn mk-btn-primary" onClick={() => handleCheckout('vip')}>{s.joinCommunity}</button>
            </div>
            <div className="product-card fade-in fade-in-d1">
              <span className="product-badge badge-guide">{s.badgeGuide}</span>
              <h3>{s.beginnerPdfTitle}</h3>
              <p>{s.beginnerPdfDesc}</p>
              <div className="product-price">€29</div>
              <button className="mk-btn mk-btn-primary" onClick={() => handleCheckout('beginner_pdf')}>{s.beginnerPdfBtn}</button>
            </div>
            <div className="product-card fade-in fade-in-d2">
              <span className="product-badge badge-guide">{s.badgeGuide}</span>
              <h3>{s.botPdfTitle}</h3>
              <p>{s.botPdfDesc}</p>
              <div className="product-price">€14.99</div>
              <button className="mk-btn mk-btn-primary" onClick={() => handleCheckout('bot_pdf')}>{s.botPdfBtn}</button>
            </div>
            <div className="product-card muted-card fade-in fade-in-d3">
              <span className="product-badge badge-soon">{s.badgeSoon}</span>
              <h3>{s.advTitle}</h3>
              <p>{s.advDesc}</p>
              <a href="#" className="mk-btn mk-btn-ghost">{s.joinWaitlist}</a>
            </div>
            <div className="product-card fade-in fade-in-d1" id="book">
              <span className="product-badge badge-premium">{s.badgePremium}</span>
              <h3>{s.sessionTitle}</h3>
              <p>{s.sessionDesc}</p>
              <div className="product-price">€199/session</div>
              <Link to="/booking" className="mk-btn mk-btn-primary">{s.bookSession}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT PREVIEW */}
      <section className="content-preview" id="content">
        <div className="container">
          <span className="section-label fade-in">FOLLOW THE JOURNEY</span>
          <h2 className="section-title fade-in fade-in-d1">See how I trade.</h2>
          <div className="video-grid fade-in fade-in-d2">
            {['/videos/nico-1.mp4', '/videos/nico-2.mp4', '/videos/nico-3.mp4'].map((src, i) => (
              <div className="video-card" key={i}>
                <video src={src} playsInline muted loop preload="metadata"
                  onMouseEnter={(e) => e.target.play()}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                  onClick={(e) => e.target.paused ? e.target.play() : e.target.pause()}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="email-capture" id="email-capture">
        <div className="container">
          <h2 className="fade-in">{s.emailH2}</h2>
          <p className="sub fade-in fade-in-d1">{s.emailSub}</p>
          {emailSubmitted ? (
            <p className="email-success fade-in">{s.checkInbox}</p>
          ) : (
            <form className="email-form fade-in fade-in-d2" onSubmit={handleEmailSubmit}>
              <input type="email" placeholder={s.emailPlaceholder} required value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" className="mk-btn mk-btn-email">{s.sendKit}</button>
            </form>
          )}
          {emailError && <p className="email-error">{emailError}</p>}
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="disclaimer">
        <div className="container"><p>{s.disclaimer}</p></div>
      </section>

      {/* FOOTER */}
      <footer className="mk-footer">
        <div className="container">
          <div className="footer-inner">
            <Link to="/" className="footer-logo">Nicotradesss</Link>
            <ul className="footer-nav">
              <li><a onClick={() => scrollTo('story')} style={{ cursor: 'pointer' }}>{s.about}</a></li>
              <li><a onClick={() => scrollTo('products')} style={{ cursor: 'pointer' }}>{s.trading}</a></li>
              <li><a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer">{s.community}</a></li>
              <li><Link to="/booking">{s.bookSession}</Link></li>
              <li><a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>
              <li><a href={SOCIAL_LINKS.snapchat} target="_blank" rel="noopener noreferrer">Snapchat</a></li>
              <li><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="/privacy-policy.html">Privacy Policy</a></li>
              <li><a href="/terms-of-service.html">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-bottom">{s.copyright}</div>
        </div>
      </footer>
    </div>
  );
}
