import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function CourseDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      setLessons(lessonsData || []);
      if (lessonsData?.length > 0) setSelectedLesson(lessonsData[0]);

      if (user) {
        // Check enrollment
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .eq('status', 'active')
          .maybeSingle();

        setIsEnrolled(!!enrollData || profile?.tier === 'vip');

        // Fetch progress
        const { data: progressData } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .eq('completed', true);

        setCompletedLessons(new Set((progressData || []).map((p) => p.lesson_id)));
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const canAccessLesson = (lesson) => {
    return lesson.is_free_preview || isEnrolled || profile?.tier === 'vip';
  };

  const markComplete = async () => {
    if (!selectedLesson || !user) return;
    try {
      const { error } = await supabase.from('progress').upsert(
        {
          user_id: user.id,
          lesson_id: selectedLesson.id,
          course_id: id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      );
      if (error) throw error;

      setCompletedLessons((prev) => new Set([...prev, selectedLesson.id]));

      // Auto-advance
      const currentIdx = lessons.findIndex((l) => l.id === selectedLesson.id);
      if (currentIdx < lessons.length - 1) {
        const next = lessons[currentIdx + 1];
        if (canAccessLesson(next)) {
          setSelectedLesson(next);
        }
      }
    } catch (err) {
      console.error('Error marking complete:', err);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!course) return <div className="page-loading">Course not found.</div>;

  return (
    <div className="course-detail-page">
      <div className="course-detail-header">
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </div>

      <div className="course-detail-layout">
        {/* Lesson sidebar */}
        <div className="lesson-sidebar">
          <h3>Lessons ({lessons.length})</h3>
          <ul className="lesson-list">
            {lessons.length === 0 && (
                <div className="empty-panel" style={{margin:'32px'}}>
                  <h3>Lessons coming soon</h3>
                  <p>Course content is being prepared. You'll be notified by email when the first lessons are live.</p>
                </div>
              )}
              {lessons.map((lesson, idx) => {
              const accessible = canAccessLesson(lesson);
              const completed = completedLessons.has(lesson.id);
              const isActive = selectedLesson?.id === lesson.id;

              return (
                <li
                  key={lesson.id}
                  className={`lesson-item ${isActive ? 'active' : ''} ${!accessible ? 'locked' : ''}`}
                  onClick={() => accessible && setSelectedLesson(lesson)}
                >
                  <span className="lesson-status">
                    {completed ? '✅' : !accessible ? '🔒' : `${idx + 1}`}
                  </span>
                  <div className="lesson-meta">
                    <span className="lesson-title">{lesson.title}</span>
                    {lesson.duration_minutes && (
                      <span className="lesson-duration">{lesson.duration_minutes} min</span>
                    )}
                    {lesson.is_free_preview && <span className="free-tag">FREE</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Video area */}
        <div className="lesson-content">
          {selectedLesson ? (
            <>
              {canAccessLesson(selectedLesson) ? (
                <>
                  {selectedLesson.youtube_id ? (
                    <div className="video-wrapper">
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedLesson.youtube_id}`}
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : selectedLesson.video_url ? (
                    <div className="video-wrapper">
                      <video
                        src={selectedLesson.video_url}
                        controls
                        playsInline
                        style={{ width: '100%', borderRadius: 12 }}
                      />
                    </div>
                  ) : (
                    <div className="video-placeholder">
                      <span>🎬</span>
                      <p>Video coming soon</p>
                    </div>
                  )}
                  <div className="lesson-info">
                    <h2>{selectedLesson.title}</h2>
                    {selectedLesson.description && <p>{selectedLesson.description}</p>}
                    <button
                      className={`btn-primary ${completedLessons.has(selectedLesson.id) ? 'completed' : ''}`}
                      onClick={markComplete}
                      disabled={completedLessons.has(selectedLesson.id)}
                    >
                      {completedLessons.has(selectedLesson.id) ? '✅ Completed' : 'Mark as Complete →'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="locked-content">
                  <span className="lock-icon">🔒</span>
                  <h3>This lesson requires enrollment</h3>
                  <p>Enroll in this course or upgrade to VIP to access all lessons.</p>
                </div>
              )}
            </>
          ) : (
            <div className="video-placeholder">
              <span>📚</span>
              <p>Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
