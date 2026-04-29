import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/dashboard"), 20000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{padding:'3rem',textAlign:'center',maxWidth:'480px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',marginBottom:'1rem'}}>You're in.</h2>
      <p style={{marginBottom:'0.75rem'}}>Payment confirmed. Your VIP Telegram invite will be sent to your email within a few hours.</p>
      <p style={{marginBottom:'1.5rem'}}>In the meantime, join the free community: <a href='https://t.me/nicotradesss'>t.me/nicotradesss</a></p>
      <button onClick={() => navigate('/dashboard')}>Go to dashboard</button>
      <p style={{fontSize:'0.8rem',color:'#888',marginTop:'1rem'}}>Redirecting automatically in 20 seconds...</p>
    </div>
  );
}
