import Link from "next/link";

export default function HomePage() {
  return (
    <div className="screen-body">
      <div className="hero-dark">
        <span className="hero-badge">your boss has no idea you&apos;re here</span>
        <div className="hero-brand">two <em>weeks</em></div>
        <p className="hero-tagline">Anonymous job matching for people who are ready for something new.</p>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div>
            <div className="feature-title">Stay anonymous</div>
            <div className="feature-desc">Your name, email, and phone stay hidden until you decide to share them.</div>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div>
            <div className="feature-title">Real Iowa employers</div>
            <div className="feature-desc">Companies reach out to you. No spam, no cold calls.</div>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div className="feature-title">Block your boss</div>
            <div className="feature-desc">Hide your card from specific companies. They&apos;ll never know.</div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <Link href="/get-started/seeker" className="cta-btn cta-primary" style={{ textDecoration: 'none' }}>
          I deserve better
          <span className="cta-sub">Create your anonymous card</span>
        </Link>
        <Link href="/get-started/employer" className="cta-btn cta-secondary" style={{ textDecoration: 'none' }}>
          I need to hire someone
          <span className="cta-sub">Browse anonymous candidates</span>
        </Link>
      </div>

      <div className="footer-note">
        Free for seekers. Always.<br/>
        Employers pay 4–8% when they hire.<br/>
        No subscriptions. No nonsense.<br/><br/>
        <Link href="/login" className="footer-link">Already have an account? Sign in</Link>
      </div>
    </div>
  );
}
