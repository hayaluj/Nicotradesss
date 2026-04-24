import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['hayaluj@gmail.com', 'nico@nicotradesss.com'];

export default function Admin() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [tab, setTab] = useState('courses');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => { if (isAdmin) fetchCourses(); }, [isAdmin]);
  useEffect(() => { if (selectedCourse) fetchLessons(selectedCourse); }, [selectedCourse]);

  // ── Courses & Lessons (existing) ──────────────────────────

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('sort_order');
    setCourses(data || []);
  };

  const fetchLessons = async (courseId) => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order');
    setLessons(data || []);
  };

  const saveCourse = async (course) => {
    setSaving(true);
    try {
      if (course.id) {
        const { error } = await supabase.from('courses').update({
          title: course.title,
          slug: course.slug,
          description: course.description,
          price: course.price ? parseFloat(course.price) : null,
          currency: course.currency || 'EUR',
          tier: course.tier,
          level: course.level,
          thumbnail_url: course.thumbnail_url,
          status: course.status,
          sort_order: parseInt(course.sort_order) || 0,
        }).eq('id', course.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert({
          title: course.title,
          slug: course.slug,
          description: course.description,
          price: course.price ? parseFloat(course.price) : null,
          currency: course.currency || 'EUR',
          tier: course.tier || 'paid',
          level: course.level || 'beginner',
          thumbnail_url: course.thumbnail_url,
          status: course.status || 'draft',
          sort_order: parseInt(course.sort_order) || 0,
        });
        if (error) throw error;
      }
      setMsg('Course saved ✅');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(false); }
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
        course_id: selectedCourse,
        title: lesson.title,
        description: lesson.description,
        youtube_id: lesson.youtube_id || null,
        video_url: lesson.video_url || null,
        duration_minutes: lesson.duration_minutes ? parseInt(lesson.duration_minutes) : null,
        sort_order: parseInt(lesson.sort_order) || 0,
        is_free_preview: lesson.is_free_preview || false,
        status: lesson.status || 'draft',
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
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(false); }
  };

  const deleteLesson = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    await supabase.from('lessons').delete().eq('id', id);
    setMsg('Lesson deleted');
    fetchLessons(selectedCourse);
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

  return (
    <div style={{ padding: '80px 24px 60px', maxWidth: 960, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', marginBottom: 8 }}>Admin Panel</h1>
      <p style={{ color: '#6b6560', marginBottom: 24 }}>Manage courses and lessons.</p>

      {msg && (
        <div style={{ padding: '10px 16px', background: msg.startsWith('Error') ? '#fde8e8' : '#e6f4ef', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
          {msg}
          <span onClick={() => setMsg('')} style={{ float: 'right', cursor: 'pointer' }}>✕</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['courses', 'lessons'].map(t => (
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
                {lessons.length === 0 && <p style={{ color: '#6b6560' }}>No lessons yet. Add one above.</p>}
              </div>
            </>
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
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', marginBottom: 12,
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

