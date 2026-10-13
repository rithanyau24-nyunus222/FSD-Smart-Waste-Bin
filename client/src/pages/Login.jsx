import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Logo, ArrowChip, CHENNAI_AREAS } from '../components.jsx';

export default function Login() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('citizen');
  const [regArea, setRegArea] = useState('Mylapore');

  // Quick 1-click role logins
  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError('');
    try {
      const creds = {
        citizen: { email: 'citizen@demo.com', path: '/citizen' },
        collector: { email: 'collector@demo.com', path: '/collector' },
        authority: { email: 'authority@demo.com', path: '/authority' }
      }[role];
      if (creds) {
        await login(creds.email, 'Demo@123');
        navigate(creds.path);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const loggedUser = await login(email, password);
        if (loggedUser.role === 'citizen') navigate('/citizen');
        else if (loggedUser.role === 'authority') navigate('/authority');
        else if (loggedUser.role === 'collector') navigate('/collector');
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const newUser = await register({
          name: regName || email.split('@')[0],
          email,
          password,
          role: regRole,
          area: regArea
        });
        if (newUser.role === 'citizen') navigate('/citizen');
        else if (newUser.role === 'collector') navigate('/collector');
        else navigate('/authority');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page-root">
      {/* 1. TOP ANNOUNCEMENT TICKER (Full-Bleed) */}
      <div className="landing-ticker-bar">
        <span>Report a bin in 30 seconds &nbsp;/&nbsp; Every report gets a live timeline &nbsp;/&nbsp; Cleaner streets, together &nbsp;/&nbsp; Report a bin in 30 seconds</span>
      </div>

      {/* 2. RESPONSIVE NAVBAR */}
      <header className="landing-header">
        {/* Left: Nav pills */}
        <div className="landing-nav-links">
          <a
            href="#how-it-works"
            className="pill pill-ghost"
            style={{ fontSize: '13px', padding: '6px 14px', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('roles-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            How it works
          </a>
          <a
            href="#roles"
            className="pill pill-ghost"
            style={{ fontSize: '13px', padding: '6px 14px', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('roles-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Roles
          </a>
          <a
            href="#areas"
            className="pill pill-ghost"
            style={{ fontSize: '13px', padding: '6px 14px', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Areas
          </a>
        </div>

        {/* Center: Logo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo variant="dark" iconHeight={26} textSize={20} />
        </div>

        {/* Right: Register & Log in pills */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="pill pill-sprout" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700 }}>
                {user.name} ({user.role?.toUpperCase()})
              </span>
              <button
                type="button"
                className="pill pill-dark"
                style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                onClick={() => {
                  if (user.role === 'citizen') navigate('/citizen');
                  else if (user.role === 'authority') navigate('/authority');
                  else if (user.role === 'collector') navigate('/collector');
                }}
              >
                Go to Portal &rarr;
              </button>
              <button
                type="button"
                className="pill pill-ghost"
                style={{ fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }}
                onClick={() => logout()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`pill ${tab === 'register' ? 'pill-dark' : 'pill-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 16px', cursor: 'pointer' }}
                onClick={() => {
                  setTab('register');
                  document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Register
              </button>
              <button
                type="button"
                className={`pill ${tab === 'login' ? 'pill-dark' : 'pill-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 18px', cursor: 'pointer' }}
                onClick={() => {
                  setTab('login');
                  document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. HERO SECTION (50/50 Split Grid covering page properly) */}
      <section className="landing-hero-grid" id="hero-section">
        {/* LEFT COLUMN (Dark Green House #294237) */}
        <div className="landing-hero-left">
          {/* Subtitle in playful script font */}
          <div
            style={{
              fontFamily: 'var(--font-script)',
              color: 'var(--blue)',
              fontSize: 'clamp(16px, 1.6vw, 22px)',
              marginBottom: '6px'
            }}
          >
            spot it, report it, watch it clear
          </div>

          {/* H1 line 1 (Electric Pink) */}
          <h1
            style={{
              fontFamily: 'var(--font-peace)',
              fontSize: 'clamp(32px, 4vw, 54px)',
              lineHeight: 1.05,
              color: 'var(--pink)',
              margin: '0 0 2px',
              letterSpacing: '-0.02em'
            }}
          >
            Keep it clean,
          </h1>

          {/* H1 line 2 (Paper White) */}
          <div
            style={{
              fontFamily: 'var(--font-peace)',
              fontSize: 'clamp(30px, 3.6vw, 48px)',
              lineHeight: 1.05,
              color: 'var(--paper)',
              margin: '0 0 4px',
              letterSpacing: '-0.02em'
            }}
          >
            keep it smart.
          </div>

          {/* Green wave squiggle decoration under title */}
          <svg width="200" height="12" viewBox="0 0 200 12" fill="none" style={{ display: 'block', margin: '0 0 16px' }}>
            <path d="M2 6 Q14 0 26 6 T50 6 T74 6 T98 6 T122 6 T146 6 T170 6 T194 6" stroke="var(--sprout)" strokeWidth="3.5" strokeLinecap="round" />
          </svg>

          {/* Description */}
          <p
            style={{
              fontSize: 'clamp(14px, 1.1vw, 16px)',
              lineHeight: 1.5,
              maxWidth: '440px',
              opacity: 0.9,
              margin: '0 0 22px',
              color: 'var(--paper)'
            }}
          >
            One login for citizens, authorities and collectors. Every report gets a photo, a pin and a timeline.
          </p>

          {/* AUTH CARD (#f4f4e1 Cream, 22px radius, 2px border) */}
          <div
            id="auth-card"
            style={{
              backgroundColor: 'var(--paper)',
              borderRadius: '22px',
              border: '2px solid var(--green)',
              padding: '18px 22px',
              maxWidth: '420px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Tab switch row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                className={`pill ${tab === 'login' ? 'pill-dark active' : 'pill-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 18px', cursor: 'pointer' }}
                onClick={() => {
                  setTab('login');
                  setError('');
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className={`pill ${tab === 'register' ? 'pill-dark active' : 'pill-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 18px', cursor: 'pointer' }}
                onClick={() => {
                  setTab('register');
                  setError('');
                }}
              >
                Register
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 194, 239, 0.35)',
                  borderLeft: '3px solid var(--pink)',
                  padding: '8px 12px',
                  borderRadius: '0 8px 8px 0',
                  color: 'var(--green)',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '12px'
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tab === 'register' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="form-input-brand"
                    style={{ flex: 1, minWidth: '120px', height: '42px', fontSize: '13px' }}
                  />
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="form-input-brand"
                    style={{ flex: 1, minWidth: '110px', height: '42px', fontSize: '13px' }}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="collector">Collector</option>
                    <option value="authority">Authority</option>
                  </select>
                </div>
              )}

              {/* Inputs side-by-side on desktop/tablet, stacked on mobile */}
              <div className="landing-auth-inputs">
                <input
                  type="text"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-brand"
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    height: '44px',
                    padding: '0 16px',
                    fontSize: '13px',
                    borderRadius: '999px',
                    border: '2px solid var(--green)',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--green)'
                  }}
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-brand"
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    height: '44px',
                    padding: '0 16px',
                    fontSize: '13px',
                    borderRadius: '999px',
                    border: '2px solid var(--green)',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--green)'
                  }}
                />
              </div>

              {/* Submit Button (Electric Pink pill with arrow) */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: 'var(--pink)',
                  border: '2px solid var(--green)',
                  borderRadius: '999px',
                  color: 'var(--green)',
                  fontFamily: 'var(--font-peace)',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  transition: 'transform 0.15s ease'
                }}
                className="interactive-hover-lift"
              >
                {loading ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <span>{tab === 'login' ? 'Log in' : 'Register'}</span>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>&rarr;</span>
                  </>
                )}
              </button>

              {/* Subtle 1-click role testing links */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--green)', opacity: 0.7 }}>1-click demo:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('citizen')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--green)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Citizen
                </button>
                <span style={{ opacity: 0.4 }}>•</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('collector')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--green)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Collector
                </button>
                <span style={{ opacity: 0.4 }}>•</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('authority')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--green)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Authority
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN (Electric Pink #ffc2ef with exact illustration from demo) */}
        <div className="landing-hero-right">
          {/* Circular Starburst Seal in Top-Left (REPORT • VERIFY • ASSIGN • COLL) */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 10
            }}
          >
            <svg width="95" height="95" viewBox="0 0 120 120" fill="none">
              {/* 16-lobed rosette seal in Sprout Green */}
              <path
                d="M60 4 C64 4 67 9 71 10 C75 11 80 8 84 11 C88 14 88 19 92 23 C96 27 101 27 104 32 C107 36 104 41 106 46 C108 50 112 54 112 59 C112 64 107 67 106 72 C105 77 108 82 105 86 C102 90 97 90 93 94 C89 98 89 103 84 105 C80 107 76 104 71 106 C67 108 64 112 59 112 C54 112 51 107 46 106 C42 105 37 108 33 105 C29 102 29 97 25 93 C21 89 16 89 13 84 C10 80 13 75 11 71 C9 67 4 64 4 59 C4 54 9 51 10 46 C11 42 8 37 11 33 C14 29 19 29 23 25 C27 21 27 16 32 13 C36 10 41 13 46 11 C50 9 54 4 60 4 Z"
                fill="#b6cc58"
                stroke="#294237"
                strokeWidth="2.5"
              />
              {/* Circular text around perimeter */}
              <path id="seal-circle" d="M60 22 A38 38 0 1 1 59.9 22" fill="none" />
              <text fill="#294237" fontSize="9" fontWeight="800" fontFamily="sans-serif" letterSpacing="2.2">
                <textPath href="#seal-circle" startOffset="0%">
                  REPORT • VERIFY • ASSIGN • COLL •
                </textPath>
              </text>
              {/* Sprout Icon in center */}
              <ellipse cx="56" cy="62" rx="4.5" ry="9" transform="rotate(-30 56 62)" fill="#294237" />
              <ellipse cx="64" cy="62" rx="4.5" ry="9" transform="rotate(30 64 62)" fill="#294237" />
              <line x1="60" y1="62" x2="60" y2="74" stroke="#294237" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* MAIN ILLUSTRATION: Blue Window + Cute Green Bin Character + Wavy Ribbons */}
          {/* Absolutely NO Velachery badge per explicit user requirement */}
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <svg
              viewBox="0 0 540 580"
              preserveAspectRatio="xMidYMax meet"
              style={{ width: '100%', height: '100%', maxHeight: '540px', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Calming Blue Arch Window */}
              <path
                d="M70 580V200C70 100.5 150.5 20 250 20H290C389.5 20 470 100.5 470 200V580H70Z"
                fill="#acc6c1"
                stroke="#294237"
                strokeWidth="3.5"
              />

              {/* White Sun Circle in upper right */}
              <circle cx="430" cy="110" r="42" fill="#f4f4e1" stroke="#294237" strokeWidth="2.5" />

              {/* Window Cross Panes */}
              <line x1="70" y1="240" x2="470" y2="240" stroke="#294237" strokeWidth="3" />
              <line x1="270" y1="20" x2="270" y2="580" stroke="#294237" strokeWidth="3" />

              {/* Small decorative knobs */}
              <circle cx="100" cy="380" r="7" fill="#294237" />
              <circle cx="440" cy="320" r="10" fill="#ffc2ef" />

              {/* Cute Green House Bin Character sitting on window ledge */}
              <g className="bin-motion-float">
                {/* 3 Leaves sprouting from bin lid with wind sway */}
                <ellipse cx="255" cy="285" rx="9" ry="22" transform="rotate(-20 255 285)" fill="#b6cc58" stroke="#294237" strokeWidth="2" />
                <ellipse cx="285" cy="275" rx="9" ry="22" transform="rotate(18 285 275)" fill="#ffc2ef" stroke="#294237" strokeWidth="2" />
                <ellipse cx="270" cy="240" rx="8" ry="20" transform="rotate(4 270 240)" fill="#b6cc58" stroke="#294237" strokeWidth="2" />

                {/* Bin Lid & Handle */}
                <path d="M210 354H330C335 354 338 358 338 362V370H202V362C202 358 205 354 210 354Z" fill="#294237" stroke="#294237" strokeWidth="2.5" />
                <path d="M252 354V342C252 338 256 335 260 335H280C284 335 288 338 288 342V354" fill="none" stroke="#294237" strokeWidth="4.5" strokeLinecap="round" />

                {/* Bin Body */}
                <path d="M216 370L226 510H314L324 370H216Z" fill="#294237" stroke="#294237" strokeWidth="3" />

                {/* Vertical stripes on bin */}
                <line x1="244" y1="384" x2="249" y2="498" stroke="#f4f4e1" strokeWidth="2" opacity="0.3" />
                <line x1="270" y1="384" x2="270" y2="498" stroke="#f4f4e1" strokeWidth="2" opacity="0.3" />
                <line x1="296" y1="384" x2="291" y2="498" stroke="#f4f4e1" strokeWidth="2" opacity="0.3" />

                {/* Smiling Pink Face */}
                <g className="bin-eye-blink">
                  <circle cx="248" cy="430" r="6" fill="#ffc2ef" />
                  <circle cx="292" cy="430" r="6" fill="#ffc2ef" />
                  <circle cx="246" cy="428" r="2" fill="#ffffff" />
                  <circle cx="290" cy="428" r="2" fill="#ffffff" />
                </g>
                <path d="M252 446 Q270 464 288 446" fill="none" stroke="#ffc2ef" strokeWidth="3.5" strokeLinecap="round" />

                {/* Rosy Cheeks */}
                <circle cx="238" cy="438" r="4.5" fill="#ffc2ef" opacity="0.6" />
                <circle cx="302" cy="438" r="4.5" fill="#ffc2ef" opacity="0.6" />
              </g>

              {/* Bottom Wavy Ribbons */}
              <path d="M0 515 Q135 480 270 515 T540 515 V580 H0 Z" fill="#b6cc58" stroke="#294237" strokeWidth="3" />
              <path d="M0 550 Q135 530 270 550 T540 550 V580 H0 Z" fill="#294237" />
            </svg>
          </div>
        </div>
      </section>

      {/* 4. MARQUEE STRIP (Sprout Green #b6cc58 Full-Bleed) */}
      <div
        style={{
          backgroundColor: 'var(--sprout)',
          color: 'var(--green)',
          borderBottom: '2px solid var(--green)',
          padding: '10px 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-peace)',
          fontSize: 'clamp(18px, 2.2vw, 28px)',
          letterSpacing: '-0.01em',
          width: '100%'
        }}
      >
        <div className="marquee-content" style={{ display: 'inline-flex', gap: '2rem' }}>
          <span>Report &nbsp;*&nbsp; Verify &nbsp;*&nbsp; Assign &nbsp;*&nbsp; Collect &nbsp;*&nbsp; Repeat &nbsp;*&nbsp; Report &nbsp;*&nbsp; Verify &nbsp;*&nbsp; Assign &nbsp;*&nbsp; Collect &nbsp;*&nbsp; Repeat</span>
          <span>Report &nbsp;*&nbsp; Verify &nbsp;*&nbsp; Assign &nbsp;*&nbsp; Collect &nbsp;*&nbsp; Repeat &nbsp;*&nbsp; Report &nbsp;*&nbsp; Verify &nbsp;*&nbsp; Assign &nbsp;*&nbsp; Collect &nbsp;*&nbsp; Repeat</span>
        </div>
      </div>

      {/* 5. THREE ROLES SECTION (Full-Bleed 2-Column Grid) */}
      <section id="roles-grid" className="landing-roles-grid">
        {/* LEFT CARD: CITIZEN (Pink #ffc2ef) */}
        <div
          onClick={() => handleQuickDemo('citizen')}
          className="interactive-hover-lift"
          style={{
            backgroundColor: 'var(--pink)',
            borderRight: '2px solid var(--green)',
            padding: 'clamp(24px, 3.5vw, 42px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            minHeight: '340px',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Top row: caption ( citizen ) and arrow chip ↗ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="caption" style={{ color: 'var(--green)', fontSize: '13px' }}>( citizen )</span>
              <ArrowChip />
            </div>

            {/* H2 Title */}
            <h2
              style={{
                fontFamily: 'var(--font-peace)',
                fontSize: 'clamp(32px, 4vw, 54px)',
                lineHeight: 1.05,
                color: 'var(--green)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em'
              }}
            >
              Spot it.
            </h2>

            {/* Subtext */}
            <p className="t6" style={{ color: 'var(--green)', maxWidth: '340px', margin: 0, opacity: 0.9, fontSize: '14px' }}>
              Snap a photo, drop a pin, follow the progress.
            </p>
          </div>

          {/* Bottom illustration: Phone / Camera Device */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <div style={{ width: '110px', height: '150px' }}>
              <svg viewBox="0 0 130 170" fill="none" style={{ width: '100%', height: '100%' }}>
                {/* Phone body */}
                <rect x="18" y="10" width="94" height="150" rx="28" fill="#f4f4e1" stroke="#294237" strokeWidth="3" />
                {/* Camera Lens */}
                <circle cx="65" cy="65" r="24" fill="#acc6c1" stroke="#294237" strokeWidth="3" />
                <circle cx="65" cy="65" r="12" fill="#294237" />
                {/* Bottom pin / button */}
                <circle cx="65" cy="130" r="10" fill="none" stroke="#294237" strokeWidth="3" />
                <circle cx="65" cy="130" r="5" fill="#ffc2ef" />
                <line x1="65" y1="140" x2="65" y2="148" stroke="#294237" strokeWidth="3" strokeLinecap="round" />
                {/* Flash rays */}
                <line x1="116" y1="46" x2="128" y2="42" stroke="#294237" strokeWidth="3" strokeLinecap="round" />
                <line x1="118" y1="65" x2="132" y2="65" stroke="#294237" strokeWidth="3" strokeLinecap="round" />
                <line x1="116" y1="84" x2="128" y2="88" stroke="#294237" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Stacked 2 rows: Authority on top, Collector on bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* TOP RIGHT: AUTHORITY (Calming Blue #acc6c1) */}
          <div
            onClick={() => handleQuickDemo('authority')}
            className="interactive-hover-lift"
            style={{
              backgroundColor: 'var(--blue)',
              borderBottom: '2px solid var(--green)',
              padding: 'clamp(20px, 2.5vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              flex: 1,
              minHeight: '170px',
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="caption" style={{ color: 'var(--green)', fontSize: '13px' }}>( authority )</span>
                <ArrowChip />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: 'var(--font-peace)',
                  fontSize: 'clamp(26px, 3.2vw, 40px)',
                  lineHeight: 1.05,
                  color: 'var(--green)',
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em'
                }}
              >
                Sort it.
              </h2>

              {/* Subtext */}
              <p className="t7" style={{ color: 'var(--green)', maxWidth: '300px', margin: 0, opacity: 0.9, fontSize: '13.5px' }}>
                Verify, prioritise and assign from one live map.
              </p>
            </div>

            {/* Bottom-right Bar Chart Illustration */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ width: '15px', height: '28px', backgroundColor: '#294237', border: '2.5px solid #294237', borderRadius: '999px' }} />
                <div style={{ width: '15px', height: '46px', backgroundColor: '#ffc2ef', border: '2.5px solid #294237', borderRadius: '999px' }} />
                <div style={{ width: '15px', height: '64px', backgroundColor: '#b6cc58', border: '2.5px solid #294237', borderRadius: '999px' }} />
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: COLLECTOR (Sprout Green #b6cc58) */}
          <div
            onClick={() => handleQuickDemo('collector')}
            className="interactive-hover-lift"
            style={{
              backgroundColor: 'var(--sprout)',
              padding: 'clamp(20px, 2.5vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              flex: 1,
              minHeight: '170px',
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="caption" style={{ color: 'var(--green)', fontSize: '13px' }}>( collector )</span>
                <ArrowChip />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: 'var(--font-peace)',
                  fontSize: 'clamp(26px, 3.2vw, 40px)',
                  lineHeight: 1.05,
                  color: 'var(--green)',
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em'
                }}
              >
                Clear it.
              </h2>

              {/* Subtext */}
              <p className="t7" style={{ color: 'var(--green)', maxWidth: '300px', margin: 0, opacity: 0.9, fontSize: '13.5px' }}>
                Get your route, collect, and add a photo as proof.
              </p>
            </div>

            {/* Bottom-right Truck Illustration */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <div style={{ width: '100px', height: '52px' }}>
                <svg viewBox="0 0 120 65" fill="none" style={{ width: '100%', height: '100%' }}>
                  {/* Truck cargo body */}
                  <rect x="4" y="10" width="72" height="38" rx="6" fill="#294237" stroke="#294237" strokeWidth="2.5" />
                  {/* Cab in pink */}
                  <path d="M76 22H96L110 36V48H76V22Z" fill="#ffc2ef" stroke="#294237" strokeWidth="2.5" />
                  {/* Cab Window */}
                  <path d="M80 25H94L104 36H80V25Z" fill="#f4f4e1" stroke="#294237" strokeWidth="2" />
                  {/* Wheels */}
                  <circle cx="28" cy="48" r="10" fill="#294237" stroke="#f4f4e1" strokeWidth="3" />
                  <circle cx="28" cy="48" r="3.5" fill="#f4f4e1" />
                  <circle cx="92" cy="48" r="10" fill="#294237" stroke="#f4f4e1" strokeWidth="3" />
                  <circle cx="92" cy="48" r="3.5" fill="#f4f4e1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FULL-WIDTH FOOTER */}
      <footer
        style={{
          backgroundColor: 'var(--green)',
          color: 'var(--paper)',
          padding: '20px clamp(16px, 3.5vw, 48px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        {/* Left: Logo */}
        <Logo variant="light" iconHeight={26} textSize={20} />

        {/* Center: Slogan */}
        <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9 }}>
          Keep it clean, keep it smart.
        </div>

        {/* Right: CURATED BY + RITHANYA pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
            CURATED BY
          </span>
          <span
            style={{
              backgroundColor: 'var(--pink)',
              color: 'var(--green)',
              fontFamily: 'var(--font-peace)',
              fontSize: '13px',
              padding: '6px 18px',
              borderRadius: '999px',
              border: '2px solid var(--green)',
              letterSpacing: '0.04em'
            }}
          >
            RITHANYA
          </span>
        </div>
      </footer>
    </div>
  );
}
