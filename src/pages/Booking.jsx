import { useEffect } from 'react';

const CAL_URL = 'https://cal.com/nico-larrea-4ryjkf/nico-1-on-1-trading-session';

export default function Booking() {
  useEffect(() => {
    window.location.href = CAL_URL;
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Redirecting to Booking...</h1>
      <p style={{ color: '#888' }}>
        If you're not redirected automatically,{' '}
        <a href={CAL_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', fontWeight: 600 }}>
          click here →
        </a>
      </p>
    </div>
  );
}
