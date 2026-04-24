import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@/styles/marketing.css';

export default function Legal({ initialTab }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab || 'privacy');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    else if (location.hash === '#terms') setActiveTab('terms');
    else setActiveTab('privacy');
  }, [location.hash, initialTab]);

  return (
    <div className="marketing-page">
      {/* NAV */}
      <nav className="mk-nav">
        <div className="container">
          <div className="nav-left">
            <Link to="/" className="nav-back">← Back</Link>
            <Link to="/" className="nav-logo">Nicotradesss</Link>
          </div>
          <div className="nav-right">
            <Link to="/" className="mk-btn mk-btn-primary nav-cta-desktop">Home →</Link>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="legal-page">
        <div className="container" style={{ maxWidth: '760px', paddingTop: '140px', paddingBottom: '100px' }}>
          <div className="tabs-wrapper" style={{ marginBottom: '40px' }}>
            <div className="tabs">
              <button className={`tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>Privacy Policy</button>
              <button className={`tab ${activeTab === 'terms' ? 'active' : ''}`} onClick={() => setActiveTab('terms')}>Terms & Conditions</button>
            </div>
          </div>

          {activeTab === 'privacy' && (
            <div className="legal-content">
              <h1>Privacy Policy</h1>
              <p className="legal-updated">Last updated: March 2025</p>

              <h2>1. Information We Collect</h2>
              <p>We collect the following information when you use our platform:</p>
              <ul>
                <li><strong>Account information:</strong> email address, full name</li>
                <li><strong>Usage data:</strong> pages visited, features used, course progress</li>
                <li><strong>Payment data:</strong> processed securely through Lemon Squeezy — we do not store card details</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>Your information is used to:</p>
              <ul>
                <li>Provide access to courses, signals, and platform features</li>
                <li>Communicate important updates about your account</li>
                <li>Improve the platform experience</li>
                <li>Send educational content you've opted into (e.g., Forex Starter Kit)</li>
              </ul>

              <h2>3. Third-Party Services</h2>
              <p>We use the following third-party services to operate the platform:</p>
              <ul>
                <li><strong>Supabase</strong> — data storage and authentication</li>
                <li><strong>Lemon Squeezy</strong> — payment processing</li>
                <li><strong>Vercel</strong> — hosting and analytics</li>
              </ul>

              <h2>4. Data Retention</h2>
              <p>We retain your data for as long as your account is active. You can request deletion at any time.</p>

              <h2>5. Your Rights (GDPR)</h2>
              <p>If you are located in the European Economic Area, you have the right to:</p>
              <ul>
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>

              <h2>6. Right to Deletion</h2>
              <p>To request deletion of your account and all associated data, email us at <strong>Nicotradesss@gmail.com</strong>.</p>

              <h2>7. Cookies</h2>
              <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>

              <h2>8. Contact</h2>
              <p>For privacy-related questions, contact <strong>Nicotradesss@gmail.com</strong>.</p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="legal-content">
              <h1>Terms & Conditions</h1>
              <p className="legal-updated">Last updated: March 2025</p>

              <h2>1. Educational Content Only</h2>
              <p>All content on this platform — including courses, signals, calculators, and community discussions — is for <strong>educational purposes only</strong> and does not constitute financial advice. Trading forex and other financial instruments involves significant risk of loss. You are solely responsible for your own trading decisions.</p>

              <h2>2. Refund Policy</h2>
              <p>Digital products (courses, downloads) are non-refundable except within 30 days of purchase if you have not completed more than 25% of the course content. To request a refund, email <strong>Nicotradesss@gmail.com</strong> with your order details.</p>
              <p>VIP subscription cancellations take effect at the end of the current billing period. No partial refunds are issued for subscription cancellations.</p>

              <h2>3. User Account Obligations</h2>
              <p>By creating an account, you agree to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Keep your login credentials secure</li>
                <li>Not share, resell, or redistribute paid content</li>
                <li>Not use the platform for any illegal or harmful purposes</li>
              </ul>

              <h2>4. Intellectual Property</h2>
              <p>All course materials, trading signals, and platform content are the intellectual property of Nicotradesss. Unauthorized reproduction or distribution is prohibited.</p>

              <h2>5. Pricing Changes</h2>
              <p>We reserve the right to change pricing for courses, subscriptions, and services at any time. Existing subscribers will be notified of any changes before they take effect.</p>

              <h2>6. Platform Availability</h2>
              <p>We strive to maintain platform availability but do not guarantee uninterrupted access. We are not liable for any losses resulting from platform downtime.</p>

              <h2>7. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, Nicotradesss and its operators are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform or any trading decisions made based on content provided.</p>

              <h2>8. Governing Law</h2>
              <p>These terms are governed by the laws of Norway.</p>

              <h2>9. Contact</h2>
              <p>For questions about these terms, contact <strong>Nicotradesss@gmail.com</strong>.</p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mk-footer">
        <div className="container">
          <div className="footer-inner">
            <Link to="/" className="footer-logo">Nicotradesss</Link>
            <ul className="footer-nav">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/calculator">Calculator</Link></li>
              <li><Link to="/legal">Privacy & Terms</Link></li>
            </ul>
          </div>
          <div className="footer-bottom">© 2025 Nicotradesss. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
