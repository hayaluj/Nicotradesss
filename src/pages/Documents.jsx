import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

function groupDocuments(docs) {
  const groups = {};
  docs.forEach(doc => {
    if (!groups[doc.document_key]) {
      groups[doc.document_key] = {
        document_key: doc.document_key,
        title: doc.title,
        purchased_at: doc.purchased_at,
        languages: {},
      };
    }
    groups[doc.document_key].languages[doc.language] = doc.storage_path;
  });
  return Object.values(groups);
}

const LANG_LABELS = { en: '🇬🇧 English', no: '🇳🇴 Norwegian', es: '🇦🇷 Spanish' };

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState({});

  git push

  if (!user && !loading) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <h2>Please log in to view your documents.</h2>
        <Link to="/login" style={{ color: '#0a6e55', fontWeight: 600 }}>Log in →</Link>
      </div>
    );
  }

  return (
    <div style={{
      padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <Link to="/dashboard" style={{ color: '#6b6560', textDecoration: 'none', fontSize: '0.9rem' }}>
        ← Dashboard
      </Link>

      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', margin: '16px 0 8px' }}>
        My Documents
      </h1>
      <p style={{ color: '#6b6560', marginBottom: 32 }}>
        Your purchased guides and resources — available in all languages.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b6560' }}>Loading...</div>
      ) : documents.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e0dbd0', borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>No documents yet</h3>
          <p style={{ color: '#6b6560', fontSize: '0.9rem', marginBottom: 20 }}>
            Purchase a guide to access it here in all three languages.
          </p>
          <Link to="/" style={{
            display: 'inline-block', padding: '10px 24px',
            background: '#0a6e55', color: '#fff', borderRadius: 8,
            textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
          }}>
            Browse guides →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {documents.map(doc => (
            <div key={doc.document_key} style={{
              background: '#fff', border: '1px solid #e0dbd0',
              borderRadius: 12, padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: '1.4rem' }}>📄</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {doc.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                    Purchased {new Date(doc.purchased_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.keys(doc.languages).map(lang => {
                  const key = `${doc.document_key}_${lang}`;
                  const isLoading = downloading[key];
                  return (
                    <button
                      key={lang}
                      onClick={() => handleDownload(doc, lang)}
                      disabled={isLoading}
                      style={{
                        padding: '10px 18px',
                        background: isLoading ? '#e0dbd0' : '#0a6e55',
                        color: isLoading ? '#6b6560' : '#fff',
                        border: 'none', borderRadius: 8,
                        fontSize: '0.85rem', fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {isLoading ? 'Opening...' : `↓ ${LANG_LABELS[lang] || lang}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  async function handleDownload(doc, lang) {
    const key = `${doc.document_key}_${lang}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      const path = doc.languages[lang];
      const { data, error } = await supabase.storage
        .from('Documents')
        .createSignedUrl(path, 60 * 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not generate download link. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  }
}
