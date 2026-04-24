import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { dashboardT } from '@/lib/dashboardI18n';
import { supabase } from '@/lib/supabase';

export default function Signals() {
  const { profile } = useAuth();
  const { lang } = useLang();
  const s = dashboardT[lang];
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchSignals(); }, []);

  const fetchSignals = async () => {
    try {
      const { data } = await supabase.from('trading_signals').select('*').order('created_at', { ascending: false });
      setSignals(data || []);
    } catch (err) { console.error(err); }
  };

  const filtered = signals.filter(sig => {
    if (filter === 'active') return sig.status === 'active';
    if (filter === 'closed') return sig.status !== 'active';
    return true;
  });

  const isVip = profile?.tier === 'vip';

  return (
    <div className="signals-page">
      <div className="page-header">
        <h1>{s.tradingSignals}</h1>
        <p>{s.signalsSubtitle}</p>
      </div>

      <div className="filter-bar">
        {['all','active','closed'].map(f => (
          <button key={f} className={`filter-btn ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
            {f === 'all' ? s.all : f === 'active' ? s.active : s.closed}
          </button>
        ))}
        {!isVip && <span style={{marginLeft:'auto',fontSize:'0.78rem',color:'var(--dash-amber)',alignSelf:'center'}}>🔒 {s.vipOnly}</span>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-panel">
          <h3>{s.noSignalTitle}</h3>
          <p>{s.noSignalDesc}</p>
          <Link to="/booking" style={{color:'var(--dash-primary)',fontSize:'0.85rem',textDecoration:'none'}}>{s.learnSignals}</Link>
        </div>
      ) : (
        <div className="signals-grid">
          {filtered.map(sig => {
            const locked = !isVip && sig.tier === 'vip';
            return (
              <div key={sig.id} className="signal-card">
                <div className={locked ? 'vip-blur-content' : ''}>
                  <div className="signal-card-header">
                    <span className="signal-pair-name">{sig.pair}</span>
                    <span className={`signal-dir-badge ${sig.direction === 'BUY' ? 'buy' : 'sell'}`}>{sig.direction}</span>
                  </div>
                  <div className="signal-data-grid">
                    <div className="signal-data-item"><label>{s.entry}</label><span>{sig.entry_price ?? '—'}</span></div>
                    <div className="signal-data-item"><label>{s.sl}</label><span>{sig.stop_loss ?? '—'}</span></div>
                    <div className="signal-data-item"><label>{s.tp1}</label><span>{sig.take_profit_1 ?? '—'}</span></div>
                    <div className="signal-data-item"><label>{s.rr}</label><span className="signal-rr-val">{sig.risk_reward ?? '—'}</span></div>
                  </div>
                  <div className="signal-footer">
                    <span className="signal-time">{sig.timeframe} · {new Date(sig.created_at).toLocaleDateString()}</span>
                    <span className={`signal-status-badge ${sig.status}`}>{sig.status}</span>
                  </div>
                </div>
                {locked && (
                  <div className="vip-overlay">
                    <span>🔒 {s.upgradeVip}</span>
                    <Link to="/profile">{s.upgradeCta || 'Upgrade →'}</Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
