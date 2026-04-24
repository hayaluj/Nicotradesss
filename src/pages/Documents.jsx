import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import '@/styles/marketing.css';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching documents:', error);
    setDocuments(data || []);
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <h2>Please log in to view your documents.</h2>
        <Link to="/login" style={{ color: '#0a6e55', fontWeight: 600 }}>Log in →</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link to="/dashboard" style={{ color: '#6b6560', textDecoration: 'none', fontSize: '0.9rem' }}>← Dashboard</Link>
      </div>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', marginBottom: 8 }}>My Documents</h1>
      <p style={{ color: '#6b6560', marginBottom: 32 }}>Documents shared with you by Nico.</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b6560' }}>Loading...</div>
      ) : documents.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12, padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>No documents yet</h3>
          <p style={{ color: '#6b6560', fontSize: '0.9rem' }}>
            Documents uploaded by your coach will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {documents.map(doc => (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12,
                padding: '20px 24px', textDecoration: 'none', color: '#1a1a1a',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#0a6e55';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(10,110,85,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e0dbd0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.2rem' }}>📄</span>
                  <strong style={{ fontSize: '1rem' }}>{doc.title}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(doc.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </div>
              </div>
              <span style={{
                padding: '8px 16px', background: '#0a6e55', color: '#fff',
                borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Open →
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
