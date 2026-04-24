import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { dashboardT } from '@/lib/dashboardI18n';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { lang } = useLang();
  const s = dashboardT[lang];
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.full_name || '');
  const [nameSaving, setNameSaving] = useState(false);

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);

  const [feedback, setFeedback] = useState('');

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
    navigate('/');
  };

  const tierColors = { free: '#6b6560', course: '#0a6e55', vip: '#e07b2a' };
  const currentTier = profile?.tier || 'free';

  // --- Save name ---
  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setNameSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: nameValue.trim() })
        .eq('id', user.id);
      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({ data: { full_name: nameValue.trim() } });

      setEditingName(false);
      setFeedback(s.nameSaved || 'Name updated.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(s.nameError || 'Failed to update name.');
      setTimeout(() => setFeedback(''), 3000);
    }
    setNameSaving(false);
  };

  // --- Reset password ---
  const handleResetPassword = async () => {
    setResetError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/profile',
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e) {
      setResetError(e.message || 'Failed to send reset email.');
    }
  };

  // --- Avatar upload ---
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      setFeedback(s.avatarTooLarge || 'Image must be under 2MB.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster
      const url = publicUrl + '?t=' + Date.now();

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setAvatarUrl(url);
      setFeedback(s.avatarUpdated || 'Profile picture updated.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(s.avatarError || 'Failed to upload image. Make sure storage is configured.');
      setTimeout(() => setFeedback(''), 4000);
    }
    setAvatarUploading(false);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const displayName = editingName ? nameValue : (profile?.full_name || '—');
  const initials = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>{s.myProfile}</h1>
      </div>

      {feedback && (
        <div className="profile-feedback">{feedback}</div>
      )}

      <div className="profile-card">
        {/* Avatar */}
        <div
          className={`profile-avatar clickable ${avatarUploading ? 'uploading' : ''}`}
          onClick={handleAvatarClick}
          title={s.changePhoto || 'Change profile picture'}
          style={avatarUrl ? {
            backgroundImage: `url(${avatarUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'transparent',
          } : {}}
        >
          {!avatarUrl && initials}
          <div className="avatar-overlay">
            <span>{avatarUploading ? '...' : '📷'}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="profile-info">
          {/* Name — editable */}
          <div className="profile-row">
            <span className="profile-label">{s.name}</span>
            {editingName ? (
              <div className="profile-edit-group">
                <input
                  type="text"
                  className="profile-edit-input"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                />
                <button
                  className="profile-save-btn"
                  onClick={handleSaveName}
                  disabled={nameSaving}
                >
                  {nameSaving ? '...' : '✓'}
                </button>
                <button
                  className="profile-cancel-btn"
                  onClick={() => { setEditingName(false); setNameValue(profile?.full_name || ''); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span
                className="profile-value editable"
                onClick={() => { setNameValue(profile?.full_name || ''); setEditingName(true); }}
                title={s.clickToEdit || 'Click to edit'}
              >
                {displayName} <span className="edit-icon">✎</span>
              </span>
            )}
          </div>

          {/* Email — read only */}
          <div className="profile-row">
            <span className="profile-label">{s.email}</span>
            <span className="profile-value">{user?.email || '—'}</span>
          </div>

          {/* Password */}
          <div className="profile-row">
            <span className="profile-label">{s.password || 'Password'}</span>
            {showResetPassword ? (
              <div className="profile-edit-group">
                {resetSent ? (
                  <span className="profile-value" style={{ color: 'var(--dash-green)', fontSize: '0.82rem' }}>
                    {s.resetEmailSent || 'Reset link sent to your email.'}
                  </span>
                ) : (
                  <>
                    <button className="profile-save-btn" onClick={handleResetPassword}>
                      {s.sendResetEmail || 'Send reset email'}
                    </button>
                    <button className="profile-cancel-btn" onClick={() => setShowResetPassword(false)}>
                      ✕
                    </button>
                  </>
                )}
                {resetError && <span className="profile-error">{resetError}</span>}
              </div>
            ) : (
              <span
                className="profile-value editable"
                onClick={() => { setShowResetPassword(true); setResetSent(false); }}
                title={s.resetPassword || 'Reset password'}
              >
                ••••••••  <span className="edit-icon">✎</span>
              </span>
            )}
          </div>

          {/* Tier */}
          <div className="profile-row">
            <span className="profile-label">{s.currentTier}</span>
            <span
              className="tier-badge"
              style={{ background: tierColors[currentTier] + '20', color: tierColors[currentTier] }}
            >
              {currentTier.toUpperCase()}
            </span>
          </div>

          {/* Member since */}
          <div className="profile-row">
            <span className="profile-label">{s.memberSince}</span>
            <span className="profile-value">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>

        {currentTier === 'free' && (
          <div className="upgrade-cta">
            <p>{s.upgradeDesc}</p>
            <a href="#" className="btn-primary">{s.upgradeCta}</a>
          </div>
        )}

        <button className="btn-signout" onClick={handleSignOut}>
          {s.signOutBtn}
        </button>
      </div>
    </div>
  );
}
