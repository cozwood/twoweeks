import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px', background: '#F5F5F5' }}>
      <div style={{ background: '#1C1C1E', padding: '50px 28px 36px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', fontSize: '11px', color: '#AEAEB2', letterSpacing: '0.5px', marginBottom: '14px', fontWeight: 500 }}>your boss has no idea you&apos;re here</span>
        <div style={{ fontSize: '46px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: '12px' }}>
          two <em style={{ fontStyle: 'normal', color: '#AEAEB2' }}>weeks</em>
        </div>
        <p style={{ fontSize: '15px', color: '#AEAEB2', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' }}>Anonymous job matching for people who are ready for something new.</p>
      </div>

      <div style={{ padding: '24px 22px 6px' }}>
        <div style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid #E5E5EA', alignItems: 'flex-start' }}>
          <div style={{ width: '38px', height: '38px', background: '#1C1C1E', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', stroke: '#FFFFFF', fill: 'none', strokeWidth: 2 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '3px' }}>Stay anonymous</div>
            <div style={{ fontSize: '13px', color: '#636366', lineHeight: 1.45 }}>Your name, email, and phone stay hidden until you decide to share them.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid #E5E5EA', alignItems: 'flex-start' }}>
          <div style={{ width: '38px', height: '38px', background: '#1C1C1E', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', stroke: '#FFFFFF', fill: 'none', strokeWidth: 2 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '3px' }}>Real Iowa employers</div>
            <div style={{ fontSize: '13px', color: '#636366', lineHeight: 1.45 }}>Companies reach out to you. No spam, no cold calls.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '14px', padding: '16px 0', alignItems: 'flex-start' }}>
          <div style={{ width: '38px', height: '38px', background: '#1C1C1E', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', stroke: '#FFFFFF', fill: 'none', strokeWidth: 2 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '3px' }}>Block your boss</div>
            <div style={{ fontSize: '13px', color: '#636366', lineHeight: 1.45 }}>Hide your card from specific companies. They&apos;ll never know.</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 20px 20px' }}>
        <Link href="/get-started/seeker" style={{ display: 'block', width: '100%', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', marginBottom: '10px', border: '1.5px solid transparent', fontFamily: 'inherit', background: '#FFFFFF', color: '#1C1C1E', borderColor: '#E5E5EA', textDecoration: 'none' }}>
          I deserve better
          <span style={{ fontSize: '11px', color: '#AEAEB2', display: 'block', marginTop: '2px', fontWeight: 400 }}>Create your anonymous card</span>
        </Link>
        <Link href="/get-started/employer" style={{ display: 'block', width: '100%', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', marginBottom: '10px', border: '1.5px solid transparent', fontFamily: 'inherit', background: 'transparent', color: '#636366', borderColor: '#C7C7CC', textDecoration: 'none' }}>
          I need to hire someone
          <span style={{ fontSize: '11px', color: '#AEAEB2', display: 'block', marginTop: '2px', fontWeight: 400 }}>Browse anonymous candidates</span>
        </Link>
      </div>

      <div style={{ textAlign: 'center', padding: '10px 28px 24px', fontSize: '12px', color: '#AEAEB2', lineHeight: 1.5 }}>
        Free for seekers. Always.<br/>
        Employers pay 4–8% when they hire.<br/>
        No subscriptions. No nonsense.<br/><br/>
        <Link href="/login" style={{ color: '#636366', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textDecorationLine: 'underline', textUnderlineOffset: '2px' }}>Already have an account? Sign in</Link>
        <br/><br/>
        <Link href="/internal" style={{ color: '#0060A9', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          Express Employment Login →
        </Link>
      </div>
    </div>
  );
}
