import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the token exchange automatically via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if there's already a session (user clicked link and session is set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-back">← Back to home</Link>
        <h1 className="login-title">Nicotradesss</h1>

        {success ? (
          <div className="confirm-email-msg">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>✅</span>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>
              Password updated!
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Redirecting you to the dashboard...
            </p>
          </div>
        ) : !ready ? (
          <div className="confirm-email-msg">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>⏳</span>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>
              Verifying reset link...
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              If this takes too long, your link may have expired.{' '}
              <Link to="/login" style={{ color: 'var(--dash-primary, #00c896)' }}>Request a new one →</Link>
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-muted)', fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center' }}>
              Set your new password
            </h2>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="login-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
