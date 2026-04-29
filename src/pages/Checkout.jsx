import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    const product = searchParams.get('product');
    if (!product) { navigate('/dashboard'); return; }
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
