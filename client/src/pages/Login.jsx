import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  AnnouncementBar,
  Logo,
  BinHero,
  FloatingHeroCard,
  FloatingHeroPill,
  MarqueeStrip,
  ArrowChip
} from '../components.jsx';

export default function Login() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('citizen');
  const [regArea, setRegArea] = useState('');
  const [regStaffCode, setRegStaffCode] = useState('');

  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError('');
    try {
      const target = {
        citizen: { email: 'citizen@demo.com', path: '/citizen' },
        collector: { email: 'collector@demo.com', path: '/collector' },
        authority: { email: 'authority@demo.com', path: '/authority' }
      }[role];
      if (target) {
        await login(target.email, 'Demo@123');
        navigate(target.path);
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(loginEmail, loginPassword);
      if (loggedUser.role === 'citizen') navigate('/citizen');
      else if (loggedUser.role === 'authority') navigate('/authority');
      else if (loggedUser.role === 'collector') navigate('/collector');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (regRole === 'collector' && !regStaffCode.trim()) {
      setError('Staff code is required for collector accounts');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        area: regArea,
        staffCode: regRole === 'collector' ? regStaffCode : undefined
      });
      if (newUser.role === 'citizen') navigate('/citizen');
      else if (newUser.role === 'collector') navigate('/collector');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const scrollToHeroCard = (targetTab) => {
    setTab(targetTab);
    setError('');
    const formEl = document.getElementById('auth-form-card');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* Logged In Status Banner */}
      {user && (
        <div
          style={{
            backgroundColor: '#ffc2ef',
            color: '#294237',
            padding: '10px var(--pad-x)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '2px solid var(--green)',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          <div>
            Logged in as <strong>{user?.name || 'Rithanya'}</strong> ({user?.role ? user.role.toUpperCase() : 'CITIZEN'})
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="pill pill-dark"
              style={{ fontSize: '11px', padding: '4px 12px', cursor: 'pointer' }}
              onClick={() => {
                if (user.role === 'citizen') navigate('/citizen');
                else if (user.role === 'authority') navigate('/authority');
                else if (user.role === 'collector') navigate('/collector');
              }}
            >
              Open Your Dashboard &rarr;
            </button>
            <button
              type="button"
              className="pill pill-ghost"
              style={{ fontSize: '11px', padding: '4px 12px', cursor: 'pointer' }}
              onClick={() => logout()}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* 2. Nav (sticky, background var(--paper), padding 16px var(--pad-x), border-bottom 2px, a grid of 3 columns "1fr auto 1fr", align-items centre) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--paper)',
          padding: '16px var(--pad-x)',
          borderBottom: '2px solid var(--green)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          zIndex: 100
        }}
      >
        {/* Left: links "How it works", "Roles", "Areas" in T11, gap 28px (hidden on mobile) */}
        <nav className="nav-links-left" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <a
            href="#how-it-works"
            className="t11"
            style={{ color: 'var(--green)', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeroCard('login');
            }}
          >
            How it works
          </a>
          <a
            href="#roles"
            className="t11"
            style={{ color: 'var(--green)', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('roles-tiles')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Roles
          </a>
          <a
            href="#areas"
            className="t11"
            style={{ color: 'var(--green)', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeroCard('register');
            }}
          >
            Areas
          </a>
        </nav>

        {/* Centre: Logo (dark) at 30px / 22px */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo variant="dark" iconHeight={30} textSize={22} />
        </div>

        {/* Right (justify end, gap 8px): 1-Click Portals + "Register" and "Log in" */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              className="pill pill-ghost"
              style={{ fontSize: '11px', padding: '5px 10px', fontWeight: 700, background: '#ffc2ef', color: '#294237', cursor: 'pointer' }}
              onClick={() => handleQuickDemo('citizen')}
              title="Launch Citizen Portal as Rithanya"
            >
              Citizen
            </button>
            <button
              type="button"
              className="pill pill-ghost"
              style={{ fontSize: '11px', padding: '5px 10px', fontWeight: 700, background: '#d9f99d', color: '#294237', cursor: 'pointer' }}
              onClick={() => handleQuickDemo('collector')}
              title="Launch Collector Route Hub"
            >
              Collector
            </button>
            <button
              type="button"
              className="pill pill-ghost"
              style={{ fontSize: '11px', padding: '5px 10px', fontWeight: 700, background: '#acc6c1', color: '#294237', cursor: 'pointer' }}
              onClick={() => handleQuickDemo('authority')}
              title="Launch City Authority Map"
            >
              Authority
            </button>
          </div>
          <button
            type="button"
            className="pill pill-ghost"
            onClick={() => scrollToHeroCard('register')}
          >
            Register
          </button>
          <button
            type="button"
            className="pill pill-dark"
            onClick={() => scrollToHeroCard('login')}
          >
            Log in
          </button>
        </div>
      </header>

      {/* 3. Hero: display grid with columns minmax(0,1.05fr) minmax(0,1fr), min-height 560px */}
      <main className="hero-split-grid" style={{ minHeight: '560px', flex: 1, borderBottom: '2px solid var(--green)' }}>
        {/* LEFT half: background var(--green); padding 48px var(--pad-x) 40px; flex column, justify-content centre */}
        <div
          className="hero-left-half"
          style={{
            backgroundColor: 'var(--green)',
            padding: '48px var(--pad-x) 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* "spot it, report it, watch it clear" in Caprasimo T4, colour Calming Blue */}
          <div className="t4" style={{ color: 'var(--blue)' }}>
            spot it, report it, watch it clear
          </div>

          {/* H1 line 1 "Keep it clean," in Peace Sans T1, colour Electric Pink, margin 8px 0 4px */}
          <h1 className="t1" style={{ color: 'var(--pink)', margin: '8px 0 4px' }}>
            Keep it clean,
          </h1>

          {/* H1 line 2 "keep it smart." in Caprasimo T1s, colour Paper White, margin-bottom 20px */}
          <div className="t1s" style={{ color: 'var(--paper)', marginBottom: '20px' }}>
            keep it smart.
          </div>

          {/* Paragraph in T6, Paper White, max-width 440px, margin-bottom 24px */}
          <p className="t6" style={{ color: 'var(--paper)', maxWidth: '440px', marginBottom: '24px', opacity: 0.95 }}>
            One login for citizens, authorities and collectors. Every report gets a photo, a pin and a timeline.
          </p>

          {/* Login card: background var(--paper); border-radius 24px; padding 20px; max-width 520px */}
          <div
            id="auth-form-card"
            className="card"
            style={{
              backgroundColor: 'var(--paper)',
              borderRadius: '24px',
              padding: '20px',
              maxWidth: '520px',
              width: '100%',
              border: '2px solid var(--green)'
            }}
          >
            {/* Row 1 (gap 8px, margin-bottom 14px): pills "Log in" (active) and "Register" */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                className={`pill ${tab === 'login' ? 'active' : 'pill-ghost'}`}
                onClick={() => {
                  setTab('login');
                  setError('');
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className={`pill ${tab === 'register' ? 'active' : 'pill-ghost'}`}
                onClick={() => {
                  setTab('register');
                  setError('');
                }}
              >
                Register
              </button>
            </div>

            {/* Inline error text in T7 colour Green House with a 2px Electric Pink left marker */}
            {error && (
              <div
                className="t7"
                style={{
                  borderLeft: '2px solid var(--pink)',
                  color: 'var(--green)',
                  backgroundColor: 'rgba(255, 194, 239, 0.25)',
                  padding: '8px 12px',
                  marginBottom: '12px',
                  borderRadius: '0 8px 8px 0'
                }}
              >
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit}>
                {/* Row 2 (gap 10px, margin-bottom 12px): two inputs (flex 1): placeholders "name@email.com" and "Password" */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    className="form-input-brand"
                    style={{ flex: 1, minWidth: '180px' }}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    className="form-input-brand"
                    style={{ flex: 1, minWidth: '180px' }}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {/* Row 3: a full-width .btn-primary "Log in" with the arrow-right icon, min-height 56px */}
                <button
                  type="submit"
                  className="btn-primary btn-full"
                  disabled={loading}
                  style={{ minHeight: '56px', fontSize: '18px' }}
                >
                  {loading ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>
                      <span>Log in</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <span className="t10" style={{ color: 'var(--green)', fontWeight: 600 }}>1-Click Instant Demo:</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={loading}
                      className="pill pill-ghost t11"
                      style={{ padding: '6px 12px', fontSize: '11px', background: '#ffc2ef', color: '#294237', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => handleQuickDemo('citizen')}
                    >
                      Citizen (Rithanya) &rarr;
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className="pill pill-ghost t11"
                      style={{ padding: '6px 12px', fontSize: '11px', background: '#d9f99d', color: '#294237', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => handleQuickDemo('collector')}
                    >
                      Collector &rarr;
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className="pill pill-ghost t11"
                      style={{ padding: '6px 12px', fontSize: '11px', background: '#acc6c1', color: '#294237', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => handleQuickDemo('authority')}
                    >
                      Authority &rarr;
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  className="form-input-brand"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    className="form-input-brand"
                    style={{ flex: 1, minWidth: '170px' }}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Password"
                    className="form-input-brand"
                    style={{ flex: 1, minWidth: '170px' }}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                {/* Role choice as two pills (Citizen, Collector) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  <span className="caption" style={{ margin: 0 }}>( role )</span>
                  <button
                    type="button"
                    className={`pill ${regRole === 'citizen' ? 'active' : 'pill-ghost'}`}
                    onClick={() => setRegRole('citizen')}
                  >
                    Citizen
                  </button>
                  <button
                    type="button"
                    className={`pill ${regRole === 'collector' ? 'active' : 'pill-ghost'}`}
                    onClick={() => setRegRole('collector')}
                  >
                    Collector
                  </button>
                </div>

                {regRole === 'collector' && (
                  <input
                    type="text"
                    required
                    placeholder="Staff code"
                    className="form-input-brand"
                    value={regStaffCode}
                    onChange={(e) => setRegStaffCode(e.target.value)}
                  />
                )}

                <input
                  type="text"
                  placeholder="Area / Locality (e.g. Velachery)"
                  className="form-input-brand"
                  value={regArea}
                  onChange={(e) => setRegArea(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn-primary btn-full"
                  disabled={loading}
                  style={{ minHeight: '56px', fontSize: '18px', marginTop: '4px' }}
                >
                  {loading ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>
                      <span>Register</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT half: background var(--pink); position relative; overflow hidden; min-height 560px */}
        <div
          className="hero-right-half"
          style={{
            backgroundColor: 'var(--pink)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '560px'
          }}
        >
          {/* BinHero filling the entire half (absolute, inset 0) */}
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <BinHero />
          </div>

          {/* Floating card: position absolute; left 24px; top 28px; background var(--paper); border 2px; border-radius 22px; padding 12px 16px; display flex; gap 12px; align-items centre; T7. Left a 40px circle in Sprout with a check icon; right two lines: "BIN-004 collected" (Geologica 500) and "Velachery · 2 min ago" */}
          <FloatingHeroCard
            code="BIN-004"
            statusText="collected"
            area="Velachery"
            time="2 min ago"
          />

          {/* Pill: position absolute; right 24px; bottom 72px; background var(--green); colour Paper White; border-radius 999px; padding 10px 18px; T7; text "Live timeline on every report" */}
          <FloatingHeroPill text="Live timeline on every report" />
        </div>
      </main>

      {/* 4. MarqueeStrip */}
      <MarqueeStrip />

      {/* 5. Role tiles: grid of 3 equal columns, no gap; each tile has padding 28px var(--pad-x) (24px on mobile), min-height 200px, position relative, the first two with border-right 2px, and stack to one column on mobile with border-bottom 2px */}
      <section
        id="roles-tiles"
        className="tiles-trio-grid"
        aria-label="Role overview"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '2px solid var(--green)'
        }}
      >
        {/* Tile 1: Citizen (Pink) */}
        <div
          className="tile-trio-item tile-trio-pink"
          style={{
            backgroundColor: 'var(--pink)',
            color: 'var(--green)',
            padding: '28px var(--pad-x)',
            minHeight: '200px',
            position: 'relative',
            borderRight: '2px solid var(--green)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'background-color 200ms ease, color 200ms ease'
          }}
          onClick={() => handleQuickDemo('citizen')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && handleQuickDemo('citizen')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="caption" style={{ color: 'inherit' }}>( citizen )</span>
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <ArrowChip />
            </div>
          </div>
          <div>
            <h3 className="t12" style={{ margin: '14px 0 6px', color: 'inherit' }}>
              Spot it.
            </h3>
            <p className="t6" style={{ margin: '0 0 12px', maxWidth: '240px', color: 'inherit' }}>
              Snap a photo, drop a pin, follow the progress.
            </p>
            <button
              type="button"
              className="pill pill-dark"
              style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickDemo('citizen');
              }}
            >
              Enter Citizen Portal (Rithanya) &rarr;
            </button>
          </div>
        </div>

        {/* Tile 2: Authority (Blue) */}
        <div
          className="tile-trio-item tile-trio-blue"
          style={{
            backgroundColor: 'var(--blue)',
            color: 'var(--green)',
            padding: '28px var(--pad-x)',
            minHeight: '200px',
            position: 'relative',
            borderRight: '2px solid var(--green)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'background-color 200ms ease, color 200ms ease'
          }}
          onClick={() => handleQuickDemo('authority')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && handleQuickDemo('authority')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="caption" style={{ color: 'inherit' }}>( authority )</span>
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <ArrowChip />
            </div>
          </div>
          <div>
            <h3 className="t12" style={{ margin: '14px 0 6px', color: 'inherit' }}>
              Sort it.
            </h3>
            <p className="t6" style={{ margin: '0 0 12px', maxWidth: '240px', color: 'inherit' }}>
              Verify, prioritise and assign from one live map.
            </p>
            <button
              type="button"
              className="pill pill-dark"
              style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickDemo('authority');
              }}
            >
              Enter Authority Dashboard &rarr;
            </button>
          </div>
        </div>

        {/* Tile 3: Collector (Sprout) */}
        <div
          className="tile-trio-item tile-trio-sprout"
          style={{
            backgroundColor: 'var(--sprout)',
            color: 'var(--green)',
            padding: '28px var(--pad-x)',
            minHeight: '200px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'background-color 200ms ease, color 200ms ease'
          }}
          onClick={() => handleQuickDemo('collector')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && handleQuickDemo('collector')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="caption" style={{ color: 'inherit' }}>( collector )</span>
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <ArrowChip />
            </div>
          </div>
          <div>
            <h3 className="t12" style={{ margin: '14px 0 6px', color: 'inherit' }}>
              Clear it.
            </h3>
            <p className="t6" style={{ margin: '0 0 12px', maxWidth: '240px', color: 'inherit' }}>
              Get your route, collect, and add a photo as proof.
            </p>
            <button
              type="button"
              className="pill pill-dark"
              style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickDemo('collector');
              }}
            >
              Enter Collector Hub &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer strip: background var(--green); padding 16px var(--pad-x); flex, space-between; Logo (light) at 18px and the text "Keep it clean, keep it smart." in T7 Paper White */}
      <footer
        style={{
          backgroundColor: 'var(--green)',
          padding: '16px var(--pad-x)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <Logo variant="light" iconHeight={24} textSize={18} />
        <span className="t7" style={{ color: 'var(--paper)' }}>
          Keep it clean, keep it smart.
        </span>
      </footer>
    </div>
  );
}
