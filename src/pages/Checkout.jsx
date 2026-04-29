import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const product = sessionStorage.getItem('pendingProduct');
    if (!product) { navigate('/dashboard'); return; }
    sessionStorage.removeItem('pendingProduct');
    fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, userId: user.id, email: user.email }),
    })
      .then(r => r.json())
      .then(data => { if (data.url) window.location.href = data.url; })
      .catch(() => navigate('/dashboard'));
  }, [user]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirecting to checkout...</p>
    </div>
  );
}
