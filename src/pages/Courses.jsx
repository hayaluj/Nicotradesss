import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { dashboardT } from '@/lib/dashboardI18n';
import { supabase } from '@/lib/supabase';

export default function Courses() {
  const { user, profile } = useAuth();
  const { lang } = useLang();
  const s = dashboardT[lang];
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => { fetchCourses(); }, [user]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData } = await supabase.from('courses').select('*').eq('status','published').order('sort_order');
      setCourses(coursesData || []);
      if (user) {
        const { data: enrollData } = await supabase.from('enrollments').select('course_id,status').eq('user_id', user.id).eq('status','active');
        setEnrollments(enrollData || []);
        const { data: progData } = await supabase.from('progress').select('course_id').eq('user_id', user.id).eq('completed', true);
        const counts = {};
        (progData || []).forEach(p => { counts[p.course_id] = (counts[p.course_id] || 0) + 1; });
        setProgress(counts);
      }
    } catch (err) { console.error(err); }
  };

  const isEnrolled = (courseId) => enrollments.some(e => e.course_id === courseId);
  const canAccess = (course) => {
    if (course.tier === 'free') return true;
    if (isEnrolled(course.id)) return true;
    if (profile?.tier === 'vip') return true;
    return false;
  };

  const levelLabel = (level) => ({ beginner: s.beginner, intermediate: s.intermediate, advanced: s.advanced }[level] || level);

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>{s.courseLibrary}</h1>
        <p>{s.offerTitle}</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-courses-panel">
          <h3>{s.noCourses}</h3>
          <p>{s.enrollPrompt}</p>
          <Link to="/booking" className="course-action" style={{display:'inline-block',width:'auto',padding:'10px 20px'}}>{s.bookOneOnOne}</Link>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => {
            const enrolled = isEnrolled(course.id);
            const accessible = canAccess(course);
            const completedLessons = progress[course.id] || 0;
            return (
              <div key={course.id} className="course-card">
                <div className="course-thumb">📈</div>
                <div className="course-body">
                  <div className="course-badges">
                    <span className={`course-badge ${course.tier}`}>{course.tier === 'free' ? s.free : course.tier.toUpperCase()}</span>
                    <span className="course-badge">{levelLabel(course.level)}</span>
                  </div>
                  <div className="course-title">{course.title}</div>
                  {course.description && <div className="course-desc">{course.description}</div>}
                  {enrolled && (
                    <div>
                      <div className="course-progress-bar"><div className="course-progress-fill" style={{width: `${Math.min(completedLessons * 10, 100)}%`}} /></div>
                      <span style={{fontSize:'0.72rem',color:'var(--dash-muted)',fontFamily:'var(--font-mono)'}}>{completedLessons} {s.lessonsCompletedLabel}</span>
                    </div>
                  )}
                  {!enrolled && course.price && <div className="course-price">€{course.price}</div>}
                  {accessible
                    ? <Link to={`/courses/${course.id}`} className="course-action">{enrolled ? s.continueLearn : s.enrollNow}</Link>
                    : <button className="course-action ghost" disabled>{s.locked} 🔒</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
