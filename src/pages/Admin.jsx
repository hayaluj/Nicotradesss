import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['hayaluj@gmail.com', 'nico@nicotradesss.com'];

export default function Admin() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [tab, setTab] = useState('courses');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Signals state
  const [signals, setSignals] = useState([]);
  const [newSignal, setNewSignal] = useState({
    pair: '', direction: 'BUY', entry: '', stop_loss: '', take_profit: '', notes: '', status: 'active'
  });

  // Documents state
  const [userEmail, setUserEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [userSearching, setUserSearching] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docKey, setDocKey] = useState('custom');
  const [docLang, setDocLang] = useState('en');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => { if (isAdmin) fetchCourses(); }, [isAdmin]);
  useEffect(() => { if (isAdmin && tab === 'signals') fetchSignals(); }, [isAdmin, tab]);
  useEffect(() => { if (selectedCourse) fetchLessons(selectedCourse); }, [selectedCourse]);

  // ── Courses & Lessons ─────────────────────────────────────

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('sort_order');
    setCourses(data || []);
  };

  const fetchLessons = async (courseId) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order');
    setLessons(data || []);
  };

  const saveCourse = async (course) => {
    setSaving(true);
    try {
      if (course.id) {
        const { error } = await supabase.from('courses').update({
          title: course.title, slug: course.slug, description: course.description,
          price: course.price ? parseFloat(course.price) : null, currency: course.currency || 'EUR',
          tier: course.tier, level: course.level, thumbnail_url: course.thumbnail_url,
          status: course.status, sort_order: parseInt(course.sort_order) || 0,
        }).eq('id', course.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert({
          title: course.title, slug: course.slug, description: course.description,
          price: course.price ? parseFloat(course.price) : null, currency: course.currency || 'EUR',
          tier: course.tier || 'paid', level: course.level || 'beginner',
          thumbnail_url: course.thumbnail_url, status: course.status || 'draft',
          sort_order: parseInt(course.sort_order) || 0,
        });
        if (error) throw error;
      }
      setMsg('Course saved ✅');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course and all its lessons?')) return;
    await supabase.from('lessons').delete().eq('course_id', id);
    await supabase.from('courses').delete().eq('id', id);
    setMsg('Course deleted');
    fetchCourses();
    if (selectedCourse === id) { setSelectedCourse(null); setLessons([]); }
  };

  const saveLesson = async (lesson) => {
    setSaving(true);
    try {
      const payload = {
        course_id: selectedCourse, title: lesson.title, description: lesson.description,
        youtube_id: lesson.youtube_id || null, video_url: lesson.video_url || null,
        duration_minutes: lesson.duration_minutes ? parseInt(lesson.duration_minutes) : null,
        sort_order: parseInt(lesson.sort_order) || 0,
        is_free_preview: lesson.is_free_preview || false, status: lesson.status || 'draft',
      };
      if (lesson.id) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', lesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lessons').insert(payload);
        if (error) throw error;
      }
      setMsg('Lesson saved ✅');
      setEditingLesson(null);
      fetchLessons(selectedCourse);
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteLesson = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    await supabase.from('lessons').delete().eq('id', id);
    setMsg('Lesson deleted');
    fetchLessons(selectedCourse);
  };

  // ── Signals ───────────────────────────────────────────────

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setSignals(data || []);
  };

  const saveSignal = async () => {
    if (!newSignal.pair || !newSignal.entry) {
      setMsg('Error: Pair and entry price are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('trading_signals').insert({
        pair: newSignal.pair.toUpperCase(),
        direction: newSignal.direction,
        entry: parseFloat(newSignal.entry),
        stop_loss: newSignal.stop_loss ? parseFloat(newSignal.stop_loss) : null,
        take_profit: newSignal.take_profit ? parseFloat(newSignal.take_profit) : null,
        notes: newSignal.notes || null,
        status: newSignal.status,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setMsg('Signal posted ✅');
      setNewSignal({ pair: '', direction: 'BUY', entry: '', stop_loss: '', take_profit: '', notes: '', status: 'active' });
      fetchSignals();
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteSignal = async (id) => {
    if (!confirm('Delete this signal?')) return;
    await supabase.from('trading_signals').delete().eq('id', id);
    setMsg('Signal deleted');
    fetchSignals();
  };

  // ── Document Upload ───────────────────────────────────────

  const searchUser = async () => {
    if (!userEmail.trim()) return;
    setUserSearching(true);
    setFoundUser(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, tier')
        .eq('email', userEmail.trim().toLowerCase())
        .maybeSingle();
      if (error || !data) {
        setMsg('Error: User not found');
      } else {
        setFoundUser(data);
      }
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setUserSearching(false); }
  };

  const uploadDocument = async () => {
    if (!foundUser) { setMsg('Error: Find a user first'); return; }
    if (!docFile) { setMsg('Error: Select a file first'); return; }
    if (!docTitle.trim()) { setMsg('Error: Enter a document title'); return; }

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const ext = docFile.name.split('.').pop();
      const fileName = `custom/${foundUser.id}/${docKey}-${docLang}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, docFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Insert record into purchase_documents
      const { error: dbError } = await supabase
        .from('purchase_documents')
        .upsert({
          user_id: foundUser.id,
          document_key: docKey,
          language: docLang,
          title: docTitle,
          storage_path: fileName,
          purchased_at: new Date().toISOString(),
        }, { onConflict: 'user_id,document_key,language' });

      if (dbError) throw dbError;

      setMsg(`Document uploaded for ${foundUser.email} ✅`);
      setDocFile(null);
      setDocTitle('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setUploading(false); }
  };

  // ── Render ────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <h2>Access Denied</h2>
        <p>You need admin access to view this page.</p>
      </div>
    );
  }

  const TABS = ['courses', 'lessons', 'signals', 'documents'];

  return (
    <div style={{ padding: '80px 24px 60px', maxWidth: 960, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', marginBottom: 8 }}>Admin Panel</h1>
      <p style={{ color: '#6b6560', marginBottom: 24 }}>Manage courses, signals, and documents.</p>

      {msg && (
        <div style={{ padding: '10px 16px', background: msg.startsWith('Error') ? '#fde8e8' : '#e6f4ef', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
          {msg}
          <span onClick={() => setMsg('')} style={{ float: 'right', cursor: 'pointer' }}>✕</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid #e0dbd0', cursor: 'pointer',
            background: tab === t ? '#0a6e55' : '#fff', color: tab === t ? '#fff' : '#1a1a1a',
            fontWeight: 600, fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* COURSES TAB */}
      {tab === 'courses' && (
        <div>
          <button onClick={() => setEditingCourse({ title: '', slug: '', description: '', price: '', tier: 'paid', level: 'beginner', status: 'draft', sort_order: courses.length })}
            style={{ padding: '10px 20px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>
            + New Course
          </button>
          {editingCourse && <CourseForm course={editingCourse} onSave={saveCourse} onCancel={() => setEditingCourse(null)} saving={saving} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {courses.map(c => (
              <div key={c.id} style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.title}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace' }}>
                    {c.status} · {c.tier} · {c.level} · €{c.price || 0}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setSelectedCourse(c.id); setTab('lessons'); }} style={btnSmall}>Lessons</button>
                  <button onClick={() => setEditingCourse(c)} style={btnSmall}>Edit</button>
                  <button onClick={() => deleteCourse(c.id)} style={{ ...btnSmall, color: '#c0392b' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LESSONS TAB */}
      {tab === 'lessons' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select course: </label>
            <select value={selectedCourse || ''} onChange={e => setSelectedCourse(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0dbd0', fontFamily: 'DM Sans, sans-serif' }}>
              <option value="">— Pick a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          {selectedCourse && (
            <>
              <button onClick={() => setEditingLesson({ title: '', description: '', youtube_id: '', video_url: '', duration_minutes: '', sort_order: lessons.length, is_free_preview: false, status: 'draft' })}
                style={{ padding: '10px 20px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>
                + New Lesson
              </button>
              {editingLesson && <LessonForm lesson={editingLesson} onSave={saveLesson} onCancel={() => setEditingLesson(null)} saving={saving} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lessons.map((l, i) => (
                  <div key={l.id} style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{i + 1}. {l.title}</strong>
                      {l.is_free_preview && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: '#e6f4ef', color: '#0a6e55', padding: '2px 8px', borderRadius: 4 }}>FREE PREVIEW</span>}
                      <div style={{ fontSize: '0.8rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace' }}>
                        {l.status} · {l.duration_minutes || '?'} min · {l.youtube_id ? 'YouTube' : l.video_url ? 'Self-hosted' : 'No video'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingLesson(l)} style={btnSmall}>Edit</button>
                      <button onClick={() => deleteLesson(l.id)} style={{ ...btnSmall, color: '#c0392b' }}>Delete</button>
                    </div>
                  </div>
                ))}
                {lessons.length === 0 && <p style={{ color: '#6b6560' }}>No lessons yet.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* SIGNALS TAB */}
      {tab === 'signals' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 16 }}>Post New Signal</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Pair</label>
                <input placeholder="EUR/USD" value={newSignal.pair}
                  onChange={e => setNewSignal(p => ({ ...p, pair: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Direction</label>
                <select value={newSignal.direction}
                  onChange={e => setNewSignal(p => ({ ...p, direction: e.target.value }))} style={selectStyle}>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Entry Price</label>
                <input placeholder="1.0850" type="number" step="0.0001" value={newSignal.entry}
                  onChange={e => setNewSignal(p => ({ ...p, entry: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Stop Loss</label>
                <input placeholder="1.0800" type="number" step="0.0001" value={newSignal.stop_loss}
                  onChange={e => setNewSignal(p => ({ ...p, stop_loss: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Take Profit</label>
                <input placeholder="1.0950" type="number" step="0.0001" value={newSignal.take_profit}
                  onChange={e => setNewSignal(p => ({ ...p, take_profit: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={newSignal.status}
                  onChange={e => setNewSignal(p => ({ ...p, status: e.target.value }))} style={selectStyle}>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
              <textarea placeholder="Analysis, reasoning, context..." value={newSignal.notes}
                onChange={e => setNewSignal(p => ({ ...p, notes: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <button onClick={saveSignal} disabled={saving} style={{ padding: '10px 24px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {saving ? 'Posting...' : 'Post Signal'}
            </button>
          </div>

          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 12 }}>Recent Signals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signals.map(s => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: '1rem' }}>{s.pair}</strong>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: s.direction === 'BUY' ? '#e6f4ef' : '#fde8e8',
                      color: s.direction === 'BUY' ? '#0a6e55' : '#c0392b'
                    }}>{s.direction}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#f0ede6', color: '#6b6560' }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace' }}>
                    Entry: {s.entry} · SL: {s.stop_loss || '—'} · TP: {s.take_profit || '—'}
                  </div>
                  {s.notes && <div style={{ fontSize: '0.8rem', color: '#6b6560', marginTop: 4 }}>{s.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                  <button onClick={() => deleteSignal(s.id)} style={{ ...btnSmall, color: '#c0392b' }}>Delete</button>
                </div>
              </div>
            ))}
            {signals.length === 0 && <p style={{ color: '#6b6560' }}>No signals yet.</p>}
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {tab === 'documents' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 16 }}>Find User</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                placeholder="User email address"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUser()}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button onClick={searchUser} disabled={userSearching} style={{ padding: '10px 20px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {userSearching ? 'Searching...' : 'Find User'}
              </button>
            </div>

            {foundUser && (
              <div style={{ background: '#e6f4ef', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                <strong>{foundUser.email}</strong>
                {foundUser.full_name && <span style={{ marginLeft: 8, color: '#6b6560' }}>{foundUser.full_name}</span>}
                <span style={{ marginLeft: 8, fontSize: '0.75rem', background: '#0a6e55', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>{foundUser.tier || 'free'}</span>
              </div>
            )}
          </div>

          {foundUser && (
            <div style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 16 }}>Upload Document to {foundUser.email}</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Document Title</label>
                  <input placeholder="e.g. Personal Trade Analysis" value={docTitle}
                    onChange={e => setDocTitle(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Document Key</label>
                  <input placeholder="e.g. custom_analysis" value={docKey}
                    onChange={e => setDocKey(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Language</label>
                  <select value={docLang} onChange={e => setDocLang(e.target.value)} style={selectStyle}>
                    <option value="en">English</option>
                    <option value="no">Norwegian</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>File (PDF)</label>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
                    onChange={e => setDocFile(e.target.files[0])}
                    style={{ ...inputStyle, padding: '8px' }} />
                </div>
              </div>

              <button onClick={uploadDocument} disabled={uploading || !docFile || !docTitle}
                style={{ padding: '10px 24px', background: uploading ? '#ccc' : '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>

              {docFile && (
                <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#6b6560' }}>
                  Selected: {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btnSmall = {
  padding: '6px 14px', background: '#f0ede6', border: '1px solid #e0dbd0', borderRadius: 6,
  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0dbd0',
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', marginBottom: 12, boxSizing: 'border-box',
};

const selectStyle = { ...inputStyle, background: '#fff' };

function CourseForm({ course, onSave, onCancel, saving }) {
  const [form, setForm] = useState(course);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ marginBottom: 16, fontFamily: 'Space Grotesk, sans-serif' }}>{form.id ? 'Edit Course' : 'New Course'}</h3>
      <input placeholder="Title" value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
      <input placeholder="Slug (url-friendly)" value={form.slug} onChange={e => set('slug', e.target.value)} style={inputStyle} />
      <textarea placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <input placeholder="Price" type="number" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} />
        <select value={form.tier} onChange={e => set('tier', e.target.value)} style={selectStyle}>
          <option value="free">Free</option><option value="paid">Paid</option><option value="vip">VIP</option>
        </select>
        <select value={form.level} onChange={e => set('level', e.target.value)} style={selectStyle}>
          <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
          <option value="draft">Draft</option><option value="published">Published</option><option value="coming_soon">Coming Soon</option>
        </select>
      </div>
      <input placeholder="Thumbnail URL" value={form.thumbnail_url || ''} onChange={e => set('thumbnail_url', e.target.value)} style={inputStyle} />
      <input placeholder="Sort order" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => onSave(form)} disabled={saving} style={{ padding: '10px 24px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} style={{ padding: '10px 24px', background: '#f0ede6', border: '1px solid #e0dbd0', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

function LessonForm({ lesson, onSave, onCancel, saving }) {
  const [form, setForm] = useState(lesson);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div style={{ background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ marginBottom: 16, fontFamily: 'Space Grotesk, sans-serif' }}>{form.id ? 'Edit Lesson' : 'New Lesson'}</h3>
      <input placeholder="Title" value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
      <textarea placeholder="Description" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      <input placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)" value={form.youtube_id || ''} onChange={e => set('youtube_id', e.target.value)} style={inputStyle} />
      <input placeholder="Self-hosted video URL (alternative to YouTube)" value={form.video_url || ''} onChange={e => set('video_url', e.target.value)} style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <input placeholder="Duration (min)" type="number" value={form.duration_minutes || ''} onChange={e => set('duration_minutes', e.target.value)} style={inputStyle} />
        <input placeholder="Sort order" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} style={inputStyle} />
        <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
          <option value="draft">Draft</option><option value="published">Published</option>
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.is_free_preview} onChange={e => set('is_free_preview', e.target.checked)} />
        <span style={{ fontSize: '0.9rem' }}>Free preview (visible to non-enrolled users)</span>
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => onSave(form)} disabled={saving} style={{ padding: '10px 24px', background: '#0a6e55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} style={{ padding: '10px 24px', background: '#f0ede6', border: '1px solid #e0dbd0', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
