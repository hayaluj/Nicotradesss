import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LangContext';
import { dashboardT } from '@/lib/dashboardI18n';

const ADMIN_EMAILS = ['hayaluj@gmail.com', 'nico@nicotradesss.com'];
const SYMBOLS = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'USD/JPY'];

// Fallback baseline — replaced by Supabase data on mount
const FALLBACK_BASELINE = {
  'EUR/USD': { price: '1.1510' },
  'GBP/USD': { price: '1.3240' },
  'XAU/USD': { price: '4480.00' },
  'BTC/USD': { price: '66200.00' },
  'USD/JPY': { price: '149.80' },
};
const TWELVE_KEY = '5fbd7291f7b24fa4bb398f8ba29311d9';

function getGreeting(s) {
  const h = new Date().getHours();
  if (h < 12) return s.goodMorning;
  if (h < 18) return s.goodAfternoon;
  return s.goodEvening;
}

export default function Dashboard() {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);
  const { user, profile } = useAuth();
  const { lang } = useLang();
  const s = dashboardT[lang];
  if (paymentSuccess) return (
    <div style={{padding:'2rem',textAlign:'center'}}>
      <h2>You're in.</h2>
      <p>Payment confirmed. Your VIP Telegram invite will be sent to your email within a few hours.</p>
      <p>In the meantime, join the free community: <a href='https://t.me/nicotradesss'>t.me/nicotradesss</a></p>
      <button onClick={() => setPaymentSuccess(false)}>Go to dashboard</button>
    </div>
  );
  const [stats, setStats] = useState({ lessonsCompleted: 0, coursesEnrolled: 0 });
  const [displayStats, setDisplayStats] = useState({ lessonsCompleted: 0, coursesEnrolled: 0 });
  const [latestSignal, setLatestSignal] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin panel state
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState('signals');
  const [adminMsg, setAdminMsg] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [signals, setSignals] = useState([]);
  const [editingSignal, setEditingSignal] = useState(null);
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [editingDocument, setEditingDocument] = useState(null);
  const [adminVideos, setAdminVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [ticker, setTicker] = useState({});
  const [prevTicker, setPrevTicker] = useState(FALLBACK_BASELINE);
  const tickerRef = useRef(FALLBACK_BASELINE);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  // Admin data fetching
  useEffect(() => {
    if (!isAdmin || !adminOpen) return;
    fetchProfiles();
    if (adminTab === 'signals') fetchSignals();
    if (adminTab === 'documents') fetchAdminDocuments();
    if (adminTab === 'videos') fetchAdminVideos();
  }, [isAdmin, adminOpen, adminTab]);

  // Fetch baseline from Supabase (updated daily by cron)
  useEffect(() => {
    supabase
      .from('app_config')
      .select('value')
      .eq('key', 'ticker_baseline')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          tickerRef.current = data.value;
          setPrevTicker(data.value);
        }
      });
  }, []);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch(
          `https://api.twelvedata.com/price?symbol=${SYMBOLS.join(',')}&apikey=${TWELVE_KEY}`
        );
        const data = await res.json();
        setTicker(current => {
          if (Object.keys(current).length > 0) {
            tickerRef.current = current;
            setPrevTicker(current);
          }
          return data;
        });
      } catch (e) {
        console.error('Ticker fetch failed', e);
      }
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [progressRes, enrollRes, signalRes] = await Promise.all([
        supabase.from('progress').select('id', { count: 'exact' }).eq('user_id', user.id).eq('completed', true),
        supabase.from('enrollments').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('trading_signals').select('*').order('created_at', { ascending: false }).limit(1),
      ]);

      setStats({
        lessonsCompleted: progressRes.count || 0,
        coursesEnrolled: enrollRes.count || 0,
      });

      const animateCount = (target, key) => {
        if (target === 0) return;
        let current = 0;
        const step = Math.ceil(target / 20);
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setDisplayStats(prev => ({ ...prev, [key]: current }));
          if (current >= target) clearInterval(timer);
        }, 50);
      };
      animateCount(progressRes.count || 0, 'lessonsCompleted');
      animateCount(enrollRes.count || 0, 'coursesEnrolled');

      if (signalRes.data?.length > 0) {
        setLatestSignal(signalRes.data[0]);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Admin CRUD functions ──────────────────────────────────

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('id, email, full_name');
    if (error) { console.error('fetchProfiles error:', error); }
    setProfiles(data || []);
  };

  const getEmailForUserId = (userId) => {
    const p = profiles.find(pr => pr.id === userId);
    return p ? (p.email || p.full_name || userId) : userId;
  };

  const lookupUserByEmail = async (email) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.trim())
      .single();
    if (error || !data) return null;
    return data;
  };

  // Signals
  const fetchSignals = async () => {
    const { data } = await supabase.from('trading_signals').select('*').order('created_at', { ascending: false });
    setSignals(data || []);
  };

  const saveSignal = async (signal) => {
    setAdminSaving(true);
    try {
      const payload = {
        pair: signal.pair, direction: signal.direction,
        entry_price: signal.entry_price ? parseFloat(signal.entry_price) : null,
        stop_loss: signal.stop_loss ? parseFloat(signal.stop_loss) : null,
        take_profit_1: signal.take_profit_1 ? parseFloat(signal.take_profit_1) : null,
        take_profit_2: signal.take_profit_2 ? parseFloat(signal.take_profit_2) : null,
        risk_reward: signal.risk_reward || null, timeframe: signal.timeframe || null,
        status: signal.status || 'active', notes: signal.notes || null, tier: signal.tier || 'free',
      };
      if (signal.id) {
        const { error } = await supabase.from('trading_signals').update(payload).eq('id', signal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trading_signals').insert(payload);
        if (error) throw error;
      }
      setAdminMsg('Signal saved');
      setEditingSignal(null);
      fetchSignals();
    } catch (err) { setAdminMsg('Error: ' + err.message); }
    finally { setAdminSaving(false); }
  };

  const deleteSignal = async (id) => {
    if (!confirm('Delete this signal?')) return;
    await supabase.from('trading_signals').delete().eq('id', id);
    setAdminMsg('Signal deleted');
    fetchSignals();
  };

  // Documents
  const fetchAdminDocuments = async () => {
    const { data } = await supabase.from('user_documents').select('*').order('created_at', { ascending: false });
    setAdminDocuments(data || []);
  };

  const saveDocument = async (doc) => {
    setAdminSaving(true);
    try {
      const profile = await lookupUserByEmail(doc.email);
      if (!profile) { setAdminMsg('Error: No user found with that email'); setAdminSaving(false); return; }
      const { error } = await supabase.from('user_documents').insert({
        user_id: profile.id, title: doc.title, file_url: doc.file_url, uploaded_by: user.email,
      });
      if (error) throw error;
      setAdminMsg('Document saved');
      setEditingDocument(null);
      fetchAdminDocuments();
    } catch (err) { setAdminMsg('Error: ' + err.message); }
    finally { setAdminSaving(false); }
  };

  const deleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return;
    await supabase.from('user_documents').delete().eq('id', id);
    setAdminMsg('Document deleted');
    fetchAdminDocuments();
  };

  // Videos
  const fetchAdminVideos = async () => {
    const { data } = await supabase.from('user_videos').select('*').order('created_at', { ascending: false });
    setAdminVideos(data || []);
  };

  const saveVideo = async (video) => {
    setAdminSaving(true);
    try {
      const profile = await lookupUserByEmail(video.email);
      if (!profile) { setAdminMsg('Error: No user found with that email'); setAdminSaving(false); return; }
      const { error } = await supabase.from('user_videos').insert({
        user_id: profile.id, title: video.title, youtube_id: video.youtube_id,
        description: video.description || null, uploaded_by: user.email,
      });
      if (error) throw error;
      setAdminMsg('Video saved');
      setEditingVideo(null);
      fetchAdminVideos();
    } catch (err) { setAdminMsg('Error: ' + err.message); }
    finally { setAdminSaving(false); }
  };

  const deleteVideo = async (id) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('user_videos').delete().eq('id', id);
    setAdminMsg('Video deleted');
    fetchAdminVideos();
  };

  const currentTier = profile?.tier || 'free';
  const isVipLocked = currentTier !== 'vip';
  console.log('ADMIN CHECK — user email:', user?.email, '| isAdmin:', isAdmin);

  return (
    <>
      {/* Top Bar */}
      <div className="dash-topbar">
        <span className="dash-greeting">
          {getGreeting(s)}, {profile?.full_name || 'Trader'}
        </span>
        <div className="dash-topbar-stats">
          <span className={`dash-stat-chip tier-${currentTier}`}>
            <span className="chip-label">Tier:</span>
            <span className="chip-value">{currentTier.toUpperCase()}</span>
          </span>
          <span className="dash-stat-chip">
            <span className="chip-label">{s.coursesLabel}:</span>
            <span className="chip-value">{displayStats.coursesEnrolled}</span>
          </span>
          <span className="dash-stat-chip">
            <span className="chip-label">{s.lessonsLabel}:</span>
            <span className="chip-value">{displayStats.lessonsCompleted}</span>
          </span>
        </div>
      </div>

      {/* Market Ticker Strip */}
      <div className="market-ticker">
        {SYMBOLS.map(sym => {
          const current = parseFloat(ticker[sym]?.price);
          const previous = parseFloat(prevTicker[sym]?.price);
          const hasChange = !isNaN(current) && !isNaN(previous) && previous !== 0;
          const changePct = hasChange ? ((current - previous) / previous * 100) : null;
          const isUp = changePct !== null ? changePct >= 0 : null;
          const displayPrice = !isNaN(current)
            ? sym.includes('BTC') || sym.includes('XAU')
              ? current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : current.toFixed(4)
            : '—';
          return (
            <span key={sym} className="ticker-item">
              <span className="ticker-pair">{sym}</span>
              <span className="ticker-price">{displayPrice}</span>
              {changePct !== null && (
                <span className={`ticker-change ${isUp ? 'positive' : 'negative'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-page">
        {/* Two Column Layout */}
        <div className="dash-columns">
          {/* Left Column */}
          <div>
            <div className="dash-section-title">{s.myCourses}</div>
            <table className="courses-table">
              <thead>
                <tr>
                  <th>{s.courseCol}</th>
                  <th>{s.levelCol}</th>
                  <th>{s.progressCol}</th>
                  <th>{s.statusCol}</th>
                </tr>
              </thead>
              <tbody>
                {stats.coursesEnrolled === 0 ? (
                  <tr className="courses-empty-row">
                    <td colSpan={4}>
                      <div className="onboarding-prompt">
                        <div className="onboarding-progress">
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: '0%' }} />
                          </div>
                          <span className="progress-label">0% {s.complete}</span>
                        </div>
                        <h3>{s.startJourney}</h3>
                        <p>{s.enrollPrompt}</p>
                        <Link to="/courses" className="onboarding-cta">{s.browseCourses}</Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td>Forex Foundation</td>
                    <td className="mono">{s.beginner}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${stats.lessonsCompleted > 0 ? Math.min((stats.lessonsCompleted / 10) * 100, 100) : 0}%` }}
                          />
                        </div>
                        <span className="progress-pct">
                          {stats.lessonsCompleted > 0 ? Math.min(Math.round((stats.lessonsCompleted / 10) * 100), 100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge active">{s.active}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Quick Actions */}
            <div className="quick-actions">
              <Link to="/courses" className="action-card">
                <span className="action-symbol">→</span>
                <span>{s.coursesLabel}</span>
              </Link>
              <Link to="/signals" className="action-card">
                <span className="action-symbol">↗</span>
                <span>{s.signals}</span>
              </Link>
              <Link to="/booking" className="action-card">
                <span className="action-symbol">⊕</span>
                <span>{s.booking}</span>
              </Link>
              <Link to="/calculator" className="action-card">
                <span className="action-symbol">%</span>
                <span>{s.calculator}</span>
              </Link>
              <Link to="/documents" className="action-card">
                <span className="action-symbol">📄</span>
                <span>Documents</span>
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="dash-section-title">{s.latestSignal}</div>
            {latestSignal ? (
              <div className={`signal-widget ${isVipLocked && latestSignal.tier === 'vip' ? 'blurred' : ''}`}>
                <div className="signal-pair-name">{latestSignal.pair}</div>
                <span className={`signal-direction ${latestSignal.direction === 'BUY' ? 'buy' : 'sell'}`}>
                  {latestSignal.direction}
                </span>
                <div className="signal-grid">
                  <div className="signal-grid-item">
                    <span className="signal-grid-label">{s.entry}</span>
                    <span className="signal-grid-value">{latestSignal.entry_price}</span>
                  </div>
                  <div className="signal-grid-item">
                    <span className="signal-grid-label">SL</span>
                    <span className="signal-grid-value">{latestSignal.stop_loss}</span>
                  </div>
                  <div className="signal-grid-item">
                    <span className="signal-grid-label">TP1</span>
                    <span className="signal-grid-value">{latestSignal.take_profit_1}</span>
                  </div>
                </div>
                {latestSignal.risk_reward && (
                  <div className="signal-rr">R:R {latestSignal.risk_reward}</div>
                )}
                <div className="signal-timestamp">
                  {new Date(latestSignal.created_at).toLocaleString()}
                </div>
                {isVipLocked && latestSignal.tier === 'vip' && (
                  <div className="signal-lock-overlay">
                    <span className="signal-lock-icon">🔒</span>
                    <span className="signal-lock-text">{s.upgradeVip}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="signal-widget">
                <div className="signal-empty">
                  <p>{s.noSignalTitle}. {s.noSignalDesc}</p>
                  <Link to="/signals">{s.learnSignals}</Link>
                </div>
              </div>
            )}

            {/* Calculator Shortcut */}
            <Link to="/calculator" className="calc-shortcut" style={{ display: 'block', textDecoration: 'none' }}>
              <div className="calc-shortcut-title">{s.riskCalculator}</div>
              <div className="calc-shortcut-desc">{s.calcDesc}</div>
              <span className="calc-shortcut-arrow">{s.openCalc}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Admin Panel (admin-only) ────────────────────────── */}
      {isAdmin && (
        <div style={{ margin: '32px 0 0', border: '1px solid #d5d0c8', borderRadius: 12, background: '#f8f6f2' }}>
          <button
            onClick={() => setAdminOpen(o => !o)}
            style={{
              width: '100%', padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: 700, color: '#1a1a1a',
            }}
          >
            Admin Panel
            <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s', transform: adminOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
          </button>

          {adminOpen && (
            <div style={{ padding: '0 24px 24px' }}>
              {adminMsg && (
                <div style={{ padding: '10px 16px', background: adminMsg.startsWith('Error') ? '#fde8e8' : '#e6f4ef', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                  {adminMsg}
                  <span onClick={() => setAdminMsg('')} style={{ float: 'right', cursor: 'pointer' }}>✕</span>
                </div>
              )}

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['signals', 'documents', 'videos'].map(t => (
                  <button key={t} onClick={() => setAdminTab(t)} style={{
                    padding: '8px 20px', borderRadius: 8, border: '1px solid #e0dbd0', cursor: 'pointer',
                    background: adminTab === t ? '#0a6e55' : '#fff', color: adminTab === t ? '#fff' : '#1a1a1a',
                    fontWeight: 600, fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
                  }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>

              {/* ── Signals ── */}
              {adminTab === 'signals' && (
                <div>
                  <button onClick={() => setEditingSignal({ pair: '', direction: 'BUY', entry_price: '', stop_loss: '', take_profit_1: '', take_profit_2: '', risk_reward: '', timeframe: '', status: 'active', notes: '', tier: 'free' })}
                    style={adminBtn}>+ New Signal</button>

                  {editingSignal && (
                    <div style={adminFormBox}>
                      <h3 style={adminFormTitle}>{editingSignal.id ? 'Edit Signal' : 'New Signal'}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input placeholder="Pair (e.g. EUR/USD)" value={editingSignal.pair} onChange={e => setEditingSignal(s => ({ ...s, pair: e.target.value }))} style={adminInput} />
                        <select value={editingSignal.direction} onChange={e => setEditingSignal(s => ({ ...s, direction: e.target.value }))} style={adminSelect}>
                          <option value="BUY">BUY</option><option value="SELL">SELL</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                        <input placeholder="Entry Price" type="number" step="any" value={editingSignal.entry_price} onChange={e => setEditingSignal(s => ({ ...s, entry_price: e.target.value }))} style={adminInput} />
                        <input placeholder="Stop Loss" type="number" step="any" value={editingSignal.stop_loss} onChange={e => setEditingSignal(s => ({ ...s, stop_loss: e.target.value }))} style={adminInput} />
                        <input placeholder="TP1" type="number" step="any" value={editingSignal.take_profit_1} onChange={e => setEditingSignal(s => ({ ...s, take_profit_1: e.target.value }))} style={adminInput} />
                        <input placeholder="TP2" type="number" step="any" value={editingSignal.take_profit_2} onChange={e => setEditingSignal(s => ({ ...s, take_profit_2: e.target.value }))} style={adminInput} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                        <input placeholder="R:R (e.g. 1:3)" value={editingSignal.risk_reward} onChange={e => setEditingSignal(s => ({ ...s, risk_reward: e.target.value }))} style={adminInput} />
                        <select value={editingSignal.timeframe} onChange={e => setEditingSignal(s => ({ ...s, timeframe: e.target.value }))} style={adminSelect}>
                          <option value="">— Timeframe —</option>
                          <option value="M1">M1</option><option value="M5">M5</option><option value="M15">M15</option><option value="M30">M30</option>
                          <option value="H1">H1</option><option value="H4">H4</option><option value="D1">D1</option><option value="W1">W1</option>
                        </select>
                        <select value={editingSignal.status} onChange={e => setEditingSignal(s => ({ ...s, status: e.target.value }))} style={adminSelect}>
                          <option value="active">Active</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option>
                          <option value="tp1_hit">TP1 Hit</option><option value="tp2_hit">TP2 Hit</option><option value="sl_hit">SL Hit</option>
                        </select>
                        <select value={editingSignal.tier} onChange={e => setEditingSignal(s => ({ ...s, tier: e.target.value }))} style={adminSelect}>
                          <option value="free">Free</option><option value="vip">VIP</option>
                        </select>
                      </div>
                      <textarea placeholder="Notes (optional)" value={editingSignal.notes || ''} onChange={e => setEditingSignal(s => ({ ...s, notes: e.target.value }))} rows={2} style={{ ...adminInput, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => saveSignal(editingSignal)} disabled={adminSaving} style={adminSaveBtn}>{adminSaving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingSignal(null)} style={adminCancelBtn}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {signals.map(s => (
                      <div key={s.id} style={adminListItem}>
                        <div>
                          <strong style={{ color: s.direction === 'BUY' ? '#0a6e55' : '#c0392b' }}>{s.direction} {s.pair}</strong>
                          <div style={adminMono}>Entry: {s.entry_price} · SL: {s.stop_loss} · TP1: {s.take_profit_1} · TP2: {s.take_profit_2}</div>
                          <div style={{ ...adminMono, fontSize: '0.75rem' }}>{s.status} · {s.tier} · {s.timeframe || '—'} · R:R {s.risk_reward || '—'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditingSignal(s)} style={adminSmallBtn}>Edit</button>
                          <button onClick={() => deleteSignal(s.id)} style={{ ...adminSmallBtn, color: '#c0392b' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                    {signals.length === 0 && <p style={{ color: '#6b6560' }}>No signals yet.</p>}
                  </div>
                </div>
              )}

              {/* ── Documents ── */}
              {adminTab === 'documents' && (
                <div>
                  <button onClick={() => setEditingDocument({ email: '', title: '', file_url: '' })} style={adminBtn}>+ New Document</button>

                  {editingDocument && (
                    <div style={adminFormBox}>
                      <h3 style={adminFormTitle}>New Document</h3>
                      <input placeholder="User Email" type="email" value={editingDocument.email} onChange={e => setEditingDocument(d => ({ ...d, email: e.target.value }))} style={adminInput} />
                      <input placeholder="Document Title" value={editingDocument.title} onChange={e => setEditingDocument(d => ({ ...d, title: e.target.value }))} style={adminInput} />
                      <input placeholder="File URL" value={editingDocument.file_url} onChange={e => setEditingDocument(d => ({ ...d, file_url: e.target.value }))} style={adminInput} />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => saveDocument(editingDocument)} disabled={adminSaving || !editingDocument.email || !editingDocument.title || !editingDocument.file_url}
                          style={{ ...adminSaveBtn, opacity: (!editingDocument.email || !editingDocument.title || !editingDocument.file_url) ? 0.5 : 1 }}>
                          {adminSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditingDocument(null)} style={adminCancelBtn}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {adminDocuments.map(d => (
                      <div key={d.id} style={adminListItem}>
                        <div>
                          <strong>{d.title}</strong>
                          <div style={adminMono}>User: {getEmailForUserId(d.user_id)} · {new Date(d.created_at).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: '#0a6e55', wordBreak: 'break-all' }}>{d.file_url}</div>
                        </div>
                        <button onClick={() => deleteDocument(d.id)} style={{ ...adminSmallBtn, color: '#c0392b' }}>Delete</button>
                      </div>
                    ))}
                    {adminDocuments.length === 0 && <p style={{ color: '#6b6560' }}>No documents yet.</p>}
                  </div>
                </div>
              )}

              {/* ── Videos ── */}
              {adminTab === 'videos' && (
                <div>
                  <button onClick={() => setEditingVideo({ email: '', title: '', youtube_id: '', description: '' })} style={adminBtn}>+ New Video</button>

                  {editingVideo && (
                    <div style={adminFormBox}>
                      <h3 style={adminFormTitle}>New Video</h3>
                      <input placeholder="User Email" type="email" value={editingVideo.email} onChange={e => setEditingVideo(v => ({ ...v, email: e.target.value }))} style={adminInput} />
                      <input placeholder="Video Title" value={editingVideo.title} onChange={e => setEditingVideo(v => ({ ...v, title: e.target.value }))} style={adminInput} />
                      <input placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)" value={editingVideo.youtube_id} onChange={e => setEditingVideo(v => ({ ...v, youtube_id: e.target.value }))} style={adminInput} />
                      <textarea placeholder="Description (optional)" value={editingVideo.description || ''} onChange={e => setEditingVideo(v => ({ ...v, description: e.target.value }))} rows={2} style={{ ...adminInput, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => saveVideo(editingVideo)} disabled={adminSaving || !editingVideo.email || !editingVideo.title || !editingVideo.youtube_id}
                          style={{ ...adminSaveBtn, opacity: (!editingVideo.email || !editingVideo.title || !editingVideo.youtube_id) ? 0.5 : 1 }}>
                          {adminSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditingVideo(null)} style={adminCancelBtn}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {adminVideos.map(v => (
                      <div key={v.id} style={adminListItem}>
                        <div>
                          <strong>{v.title}</strong>
                          <div style={adminMono}>User: {getEmailForUserId(v.user_id)} · YT: {v.youtube_id} · {new Date(v.created_at).toLocaleDateString()}</div>
                          {v.description && <div style={{ fontSize: '0.8rem', color: '#6b6560', marginTop: 4 }}>{v.description}</div>}
                        </div>
                        <button onClick={() => deleteVideo(v.id)} style={{ ...adminSmallBtn, color: '#c0392b' }}>Delete</button>
                      </div>
                    ))}
                    {adminVideos.length === 0 && <p style={{ color: '#6b6560' }}>No videos yet.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Admin panel inline styles ──────────────────────────────
const adminBtn = { padding: '10px 20px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' };
const adminFormBox = { background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: 24, marginBottom: 20 };
const adminFormTitle = { marginBottom: 16, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem' };
const adminInput = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0dbd0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', marginBottom: 12, boxSizing: 'border-box' };
const adminSelect = { ...adminInput, background: '#fff' };
const adminSaveBtn = { padding: '10px 24px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' };
const adminCancelBtn = { padding: '10px 24px', background: '#f0ede6', border: '1px solid #e0dbd0', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' };
const adminSmallBtn = { padding: '6px 14px', background: '#f0ede6', border: '1px solid #e0dbd0', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' };
const adminListItem = { background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const adminMono = { fontSize: '0.8rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace' };
