import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Login({ initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const redirectTo = decodeURIComponent(new URLSearchParams(window.location.search).get("redirect") || "");
    try {
      if (activeTab === 'login') {
        await signIn(email, password);
        navigate(redirectTo || "/dashboard");
      } else {
        if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
        const data = await signUp(email, password, fullName);
        if (data.session) { navigate(redirectTo || "/dashboard"); } else { setConfirmEmail(true); }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + (new URLSearchParams(window.location.search).get('redirect') ? decodeURIComponent(new URLSearchParams(window.location.search).get('redirect')) : '/dashboard') }
    });
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/reset-password'
    });
    setResetSent(true);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-back">← Back to home</Link>
        <h1 className="login-title">Nicotradesss</h1>

        {confirmEmail ? (
          <div className="confirm-email-msg">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>📧</span>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>Check your email</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              We sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account, then come back and sign in.
            </p>
            <button className="login-submit" onClick={() => { setConfirmEmail(false); setActiveTab('login'); setError(''); }}>
              Go to Sign In →
            </button>
          </div>
        ) : (
          <>
            {/* Google OAuth */}
            <button type="button" className="google-btn" onClick={handleGoogleLogin}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
                <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
                <path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" fill="#FBBC05"/>
                <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>or</span></div>

            <div className="login-tabs">
              <button className={`login-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setError(''); setShowReset(false); }}>
                Sign In
              </button>
              <button className={`login-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => { setActiveTab('register'); setError(''); setShowReset(false); }}>
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {activeTab === 'register' && (
                <div className="login-field">
                  <label>Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nico Trader" required={activeTab === 'register'} />
                </div>
              )}
              <div className="login-field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>

              {activeTab === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                  <button type="button" className="forgot-link" onClick={() => setShowReset(!showReset)}>
                    Forgot password?
                  </button>
                </div>
              )}

              {showReset && (
                <div className="reset-form">
                  {resetSent ? (
                    <p className="reset-success">✓ Check your email for the reset link.</p>
                  ) : (
                    <>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        style={{ background: 'var(--dash-surface, #161b22)', border: '1px solid var(--dash-border, #30363d)', borderRadius: '4px', padding: '10px 14px', color: 'var(--dash-text, #e6edf3)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                      />
                      <button type="button" onClick={handleResetPassword}
                        style={{ background: 'var(--dash-primary, #00c896)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                        Send Reset Link
                      </button>
                      <button type="button" className="cancel-link" onClick={() => setShowReset(false)}>Cancel</button>
                    </>
                  )}
                </div>
              )}

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Please wait...' : activeTab === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
