import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from './auth.jsx';
import api, { uploadPhoto } from './api.js';

// -------------------------------------------------------------
// CHENNAI 100+ LOCALITIES & NEIGHBORHOODS
// -------------------------------------------------------------
export const CHENNAI_AREAS = [
  'Anna Nagar', 'Shenoy Nagar', 'Kilpauk', 'Aminjikarai', 'Choolaimedu',
  'Chetpet', 'Nungambakkam', 'T. Nagar', 'Kodambakkam', 'West Mambalam',
  'Vadapalani', 'Ashok Nagar', 'K.K. Nagar', 'Gopalapuram', 'Royapettah',
  'Triplicane', 'Chepauk', 'Mylapore', 'Santhome', 'Alwarpet',
  'Mandaveli', 'R.A. Puram', 'Abiramapuram', 'Teynampet', 'Thousand Lights',
  'Egmore', 'Pudupet', 'Chintadripet', 'Park Town', 'Sowcarpet',
  'Adyar', 'Besant Nagar', 'Thiruvanmiyur', 'Kotturpuram', 'Guindy',
  'Saidapet', 'Velachery', 'Madipakkam', 'Nanganallur', 'Alandur',
  'Palavakkam', 'Kottivakkam', 'Neelankarai', 'Injambakkam', 'Akkarai',
  'Sholinganallur', 'Thoraipakkam', 'Perungudi', 'Taramani', 'Karapakkam',
  'Semmancheri', 'Navalur', 'Siruseri', 'Kelambakkam', 'Kovilambakkam',
  'Medavakkam', 'Pallikaranai', 'Keelkattalai', 'Jalladianpet', 'Sithalapakkam',
  'Perumbakkam', 'Ullagaram', 'Puzhuthivakkam', 'Ecr Road', 'Omr Express',
  'George Town', 'Washermanpet', 'Royapuram', 'Tondiarpet', 'Korukkupet',
  'Perambur', 'Vyasarpadi', 'Madhavaram', 'Manali', 'Tiruvottiyur',
  'Ennore', 'Kolathur', 'Sembium', 'Kodungaiyur', 'Minjur',
  'Red Hills', 'Puzhal', 'Kathivakkam', 'MKB Nagar', 'Mullai Nagar',
  'Vepery', 'Periamet', 'Basin Bridge', 'Kasimedu', 'Ernavoor',
  'Porur', 'Ramapuram', 'Valasaravakkam', 'Virugambakkam', 'Mugalivakkam',
  'Manapakkam', 'Iyyappanthangal', 'Kattupakkam', 'Mangadu', 'Poonamallee',
  'Koyambedu', 'Mogappair', 'Ambattur', 'Padi', 'Korattur',
  'Avadi', 'Thirumullaivoyal', 'Tambaram', 'Chromepet', 'Pallavaram',
  'Sanatorium', 'Selaiyur', 'Camp Road', 'Perungalathur', 'Vandalur',
  'Guduvanchery', 'Urapakkam', 'Kundrathur', 'Anakaputhur', 'Pammal'
];

// -------------------------------------------------------------
// BACK TO HOME BUTTON
// -------------------------------------------------------------
export function BackToHomeButton({ label = 'Home', style = {} }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="pill pill-ghost"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        padding: '6px 14px',
        cursor: 'pointer',
        textDecoration: 'none',
        ...style
      }}
      title="Return to Landing & Login Portal"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

// -------------------------------------------------------------
// ARROW CHIP (28px circle with 1.5px border and arrow-up-right icon)
// -------------------------------------------------------------
export function ArrowChip({ dark = false }) {
  return (
    <span
      className="arrow-chip"
      style={{
        borderColor: dark ? 'var(--color-paper-white)' : 'var(--color-green-house)',
        color: dark ? 'var(--color-paper-white)' : 'var(--color-green-house)'
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </span>
  );
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// LOGO (Arched-window icon + "smart" in Caprasimo overlapping "waste" in Peace Sans)
// -------------------------------------------------------------
export function Logo({ variant = 'dark', iconHeight = 30, textSize = 22 }) {
  const isLight = variant === 'light';
  const strokeColor = isLight ? '#f4f4e1' : '#294237';
  const smartColor = isLight ? '#acc6c1' : '#294237';
  const wasteColor = isLight ? '#ffc2ef' : '#294237';
  const iconWidth = Math.round((iconHeight * 26) / 34);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none' }}>
      {/* Arched Window Icon */}
      <svg width={iconWidth} height={iconHeight} viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Arch outline */}
        <path
          d="M2 40V16C2 8.26801 8.26801 2 16 2H18C25.732 2 32 8.26801 32 16V40H2Z"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Pane cross */}
        <line x1="2" y1="20" x2="32" y2="20" stroke={strokeColor} strokeWidth="1.8" />
        <line x1="17" y1="2" x2="17" y2="40" stroke={strokeColor} strokeWidth="1.8" />
        {/* Two pink leaves inside arch */}
        <ellipse cx="12" cy="12" rx="3.5" ry="5.5" transform="rotate(-25 12 12)" fill="#ffc2ef" />
        <ellipse cx="22" cy="12" rx="3.5" ry="5.5" transform="rotate(25 22 12)" fill="#ffc2ef" />
        {/* Small bin at the base */}
        <path d="M11 32H23L22 40H12L11 32Z" fill="#b6cc58" stroke={strokeColor} strokeWidth="1.5" />
        <rect x="9.5" y="29.5" width="15" height="3" rx="1.5" fill="#294237" stroke={strokeColor} strokeWidth="1" />
      </svg>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
        <span
          className="font-script"
          style={{
            color: smartColor,
            fontSize: `${textSize}px`,
            marginRight: '-0.1rem',
            transform: 'translateY(1px)'
          }}
        >
          smart
        </span>
        <span
          className="font-heading"
          style={{
            color: wasteColor,
            fontSize: `${textSize}px`,
            letterSpacing: '-0.02em'
          }}
        >
          waste
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// BIN HERO (Big Whimsical Flat Illustration Scene)
// -------------------------------------------------------------
export function BinHero() {
  return (
    <svg
      viewBox="0 0 540 640"
      preserveAspectRatio="xMidYMax slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Arch in Calming Blue */}
      <path
        d="M60 640V240C60 129.543 149.543 40 260 40H280C390.457 40 480 129.543 480 240V640H60Z"
        fill="#acc6c1"
        stroke="#294237"
        strokeWidth="3"
      />

      {/* Paper White Inner Arch */}
      <path
        d="M90 640V245C90 148.35 168.35 70 265 70H275C371.65 70 450 148.35 450 245V640H90Z"
        fill="#f4f4e1"
        stroke="#294237"
        strokeWidth="2.5"
      />

      {/* Cross Panes */}
      <line x1="90" y1="280" x2="450" y2="280" stroke="#294237" strokeWidth="2.5" />
      <line x1="270" y1="70" x2="270" y2="640" stroke="#294237" strokeWidth="2.5" />

      {/* Paper White Sun Circle */}
      <circle cx="450" cy="140" r="45" fill="#f4f4e1" stroke="#294237" strokeWidth="2.5" />

      {/* Floating Sprout & Pink Dots with subtle drift */}
      <circle cx="80" cy="220" r="9" fill="#b6cc58" className="drifting-dot" />
      <circle cx="480" cy="380" r="11" fill="#b6cc58" className="drifting-dot-alt" />
      <circle cx="120" cy="140" r="6" fill="#b6cc58" className="drifting-dot" />
      <circle cx="430" cy="260" r="7" fill="#ffc2ef" className="drifting-dot-alt" />

      {/* Leaf sprigs sprouting from lid */}
      <ellipse cx="230" cy="240" rx="14" ry="24" transform="rotate(-35 230 240)" fill="#b6cc58" stroke="#294237" strokeWidth="2" />
      <ellipse cx="240" cy="285" rx="12" ry="20" transform="rotate(-40 240 285)" fill="#b6cc58" stroke="#294237" strokeWidth="2" />

      <ellipse cx="295" cy="220" rx="13" ry="23" transform="rotate(30 295 220)" fill="#ffc2ef" stroke="#294237" strokeWidth="2" />
      <ellipse cx="305" cy="270" rx="12" ry="19" transform="rotate(40 305 270)" fill="#ffc2ef" stroke="#294237" strokeWidth="2" />

      {/* Cute Green House Bin Character */}
      <path
        d="M175 350L190 560H350L365 350H175Z"
        fill="#294237"
        stroke="#294237"
        strokeWidth="3"
      />

      {/* Faint Stripes on Bin */}
      <line x1="230" y1="365" x2="238" y2="545" stroke="#f4f4e1" strokeWidth="2.5" opacity="0.3" />
      <line x1="270" y1="365" x2="270" y2="545" stroke="#f4f4e1" strokeWidth="2.5" opacity="0.3" />
      <line x1="310" y1="365" x2="302" y2="545" stroke="#f4f4e1" strokeWidth="2.5" opacity="0.3" />

      {/* Bin Smiling Face in Electric Pink */}
      <circle cx="238" cy="425" r="9" fill="#ffc2ef" />
      <circle cx="302" cy="425" r="9" fill="#ffc2ef" />
      <path
        d="M242 445 Q270 470 298 445"
        fill="none"
        stroke="#ffc2ef"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Bin Lid */}
      <path
        d="M160 330H380C386 330 390 335 390 340V350H150V340C150 335 154 330 160 330Z"
        fill="#294237"
        stroke="#294237"
        strokeWidth="3"
      />
      {/* Handle */}
      <path
        d="M240 330V315C240 310 245 306 250 306H290C295 306 300 310 300 315V330"
        fill="none"
        stroke="#294237"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Bottom Wavy Ribbons */}
      <path
        d="M0 580 Q140 540 270 580 T540 580 V640 H0 Z"
        fill="#b6cc58"
        stroke="#294237"
        strokeWidth="2.5"
      />
      <path
        d="M0 610 Q140 590 270 610 T540 610 V640 H0 Z"
        fill="#294237"
      />
    </svg>
  );
}

// -------------------------------------------------------------
// FLOATING HERO CARD & PILL (On top of hero scene)
// -------------------------------------------------------------
export function FloatingHeroCard({
  code = 'BIN-004',
  statusText = 'collected',
  area = 'Velachery',
  time = '2 min ago'
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '24px',
        top: '28px',
        background: 'var(--paper)',
        border: '2px solid var(--green)',
        borderRadius: '22px',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        zIndex: 10
      }}
      className="t7"
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--sprout)',
          border: '2px solid var(--green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--green)',
          flexShrink: 0
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <div style={{ fontFamily: 'Geologica', fontWeight: 500, fontSize: '14px', color: 'var(--green)' }}>
          {code} {statusText}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--green)', opacity: 0.75 }}>
          {area} · {time}
        </div>
      </div>
    </div>
  );
}

export function FloatingHeroPill({ text = 'Live timeline on every report' }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: '24px',
        bottom: '72px',
        background: 'var(--green)',
        color: 'var(--paper)',
        borderRadius: '999px',
        padding: '10px 18px',
        border: '2px solid var(--green)',
        zIndex: 10
      }}
      className="t7"
    >
      {text}
    </div>
  );
}

// -------------------------------------------------------------
// BIN MINI (Matching Citizen Hero band mockup at 300 x 205 px)
// -------------------------------------------------------------
export function BinMini({ width = 300, height = 205 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 205"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, marginBottom: '-2px' }}
      className="citizen-hero-illustration"
    >
      {/* Pink Arch */}
      <path
        d="M20 205V100C20 44.77 69.25 0 130 0H170C230.75 0 280 44.77 280 100V205H20Z"
        fill="#ffc2ef"
        stroke="#294237"
        strokeWidth="2.5"
      />
      {/* Floating White Dots */}
      <circle cx="55" cy="90" r="9" fill="#f4f4e1" />
      <circle cx="245" cy="100" r="10" fill="#f4f4e1" />

      {/* Sprigs from lid */}
      <ellipse cx="135" cy="52" rx="9" ry="16" transform="rotate(-28 135 52)" fill="#b6cc58" stroke="#294237" strokeWidth="2" />
      <ellipse cx="165" cy="52" rx="9" ry="16" transform="rotate(28 165 52)" fill="#acc6c1" stroke="#294237" strokeWidth="2" />

      {/* Cute Bin Character Body */}
      <path d="M95 100L102 205H198L205 100H95Z" fill="#294237" stroke="#294237" strokeWidth="3" />
      {/* Faint vertical stripes */}
      <line x1="126" y1="110" x2="130" y2="198" stroke="#f4f4e1" strokeWidth="2.5" opacity="0.3" />
      <line x1="150" y1="110" x2="150" y2="198" stroke="#f4f4e1" strokeWidth="2.5" opacity="0.3" />
      <line x1="174" y1="110" x2="170" y2="198" stroke="#f4f4e1" strokeWidth="2.5" opacity="0.3" />
      {/* Eyes & Smile */}
      <circle cx="130" cy="144" r="6" fill="#ffc2ef" />
      <circle cx="170" cy="144" r="6" fill="#ffc2ef" />
      <path d="M134 158 Q150 172 166 158" fill="none" stroke="#ffc2ef" strokeWidth="3.5" strokeLinecap="round" />
      {/* Lid */}
      <rect x="85" y="88" width="130" height="13" rx="4" fill="#294237" stroke="#294237" strokeWidth="2.5" />
      {/* Handle */}
      <path d="M132 88V78C132 75 135 72 138 72H162C165 72 168 75 168 78V88" fill="none" stroke="#294237" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
export const CitizenBinHero = BinMini;

// -------------------------------------------------------------
// TRUCK (Small Flat Collection Truck: 200 x 77 desktop / 120 x 46 mobile)
// -------------------------------------------------------------
export function Truck({ width = 200, height = 77, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 77"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, marginBottom: '-2px' }}
      className={className}
    >
      {/* Cargo Body in Green House */}
      <rect x="4" y="8" width="118" height="46" rx="8" fill="#294237" stroke="#294237" strokeWidth="2.5" />
      {/* Sprout stripe on cargo */}
      <line x1="20" y1="18" x2="100" y2="18" stroke="#b6cc58" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="60" cy="32" r="10" fill="#acc6c1" />
      {/* Cab in Sprout Green */}
      <path d="M122 22H160L180 40V54H122V22Z" fill="#b6cc58" stroke="#294237" strokeWidth="2.5" />
      {/* Cab Window in Paper White */}
      <path d="M128 26H155L170 40H128V26Z" fill="#f4f4e1" stroke="#294237" strokeWidth="2" />
      {/* Headlight */}
      <circle cx="174" cy="47" r="4" fill="#ffc2ef" stroke="#294237" strokeWidth="1.5" />
      {/* Wheels */}
      <circle cx="42" cy="57" r="14" fill="#294237" stroke="#f4f4e1" strokeWidth="3.5" />
      <circle cx="42" cy="57" r="4.5" fill="#f4f4e1" />
      <circle cx="145" cy="57" r="14" fill="#294237" stroke="#f4f4e1" strokeWidth="3.5" />
      <circle cx="145" cy="57" r="4.5" fill="#f4f4e1" />
    </svg>
  );
}

// -------------------------------------------------------------
// SPRIG ILLUSTRATION (Used for Empty States)
// -------------------------------------------------------------
export function Sprig({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 48C20 40 26 28 32 10" stroke="#294237" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="22" cy="34" rx="7" ry="12" transform="rotate(-40 22 34)" fill="#b6cc58" stroke="#294237" strokeWidth="1.8" />
      <ellipse cx="36" cy="26" rx="7" ry="12" transform="rotate(35 36 26)" fill="#ffc2ef" stroke="#294237" strokeWidth="1.8" />
      <ellipse cx="31" cy="13" rx="6" ry="10" transform="rotate(-10 31 13)" fill="#acc6c1" stroke="#294237" strokeWidth="1.8" />
    </svg>
  );
}

// -------------------------------------------------------------
// WAVE (Scalloped Divider Component)
// -------------------------------------------------------------
export function Wave({ fill = 'var(--color-sprout-green)', height = 24, stroke = 'var(--color-green-house)' }) {
  return (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0 }} aria-hidden="true">
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
      >
        <path
          d="M0 24 Q30 0 60 24 T120 24 T180 24 T240 24 T300 24 T360 24 T420 24 T480 24 T540 24 T600 24 T660 24 T720 24 T780 24 T840 24 T900 24 T960 24 T1020 24 T1080 24 T1140 24 T1200 24 V48 H0 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// BIN ICON (Flat Minimal Bin)
// -------------------------------------------------------------
export function BinIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

// -------------------------------------------------------------
// PHOTO PLACEHOLDER
// -------------------------------------------------------------
export function PhotoPlaceholder({ text = 'no photo' }) {
  return (
    <div className="photo-placeholder">
      <BinIcon size={28} color="var(--color-green-house)" />
      <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'lowercase' }}>{text}</span>
    </div>
  );
}

// -------------------------------------------------------------
// BUTTON COMPONENT
// -------------------------------------------------------------
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon = null,
  arrow = null,
  disabled = false,
  ...props
}) {
  const showArrow = arrow ?? (variant === 'primary');
  return (
    <button
      type="button"
      className={`btn-brand btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
      <span>{children}</span>
      {showArrow && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      )}
    </button>
  );
}

// -------------------------------------------------------------
// PILL FILTER
// -------------------------------------------------------------
export function PillFilter({ active = false, children, onClick, count, ...props }) {
  return (
    <button
      type="button"
      className={`pill-filter ${active ? 'active' : ''}`}
      onClick={onClick}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          style={{
            marginLeft: '0.4rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            background: active ? 'var(--color-paper-white)' : 'var(--color-green-house)',
            color: active ? 'var(--color-green-house)' : 'var(--color-paper-white)'
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// -------------------------------------------------------------
// ANNOUNCEMENT BAR (Green House with Pink 11px text marquee)
// -------------------------------------------------------------
export function AnnouncementBar() {
  const text = 'Report a bin in 30 seconds / Every report gets a live timeline / Cleaner streets, together';
  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <div className="marquee-content">
        <span>{text}</span>
        <span>/</span>
        <span>{text}</span>
        <span>/</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MARQUEE STRIP (Sprout Green with Peace Sans words looping)
// -------------------------------------------------------------
export function MarqueeStrip() {
  const words = ['Report', '*', 'Verify', '*', 'Assign', '*', 'Collect', '*', 'Repeat'];
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-strip-content">
        {words.concat(words).concat(words).map((w, i) => (
          <span key={i} style={{ margin: '0 0.5rem' }}>{w}</span>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// STATUS BADGE (Strictly Color + Text, never color alone)
// -------------------------------------------------------------
export function StatusBadge({ status }) {
  if (!status) return null;
  const normalized = status.toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-badge status-badge-${normalized}`}>{status}</span>;
}

// -------------------------------------------------------------
// COMPLAINT CARD
// -------------------------------------------------------------
export function ComplaintCard({ complaint, onClick, to }) {
  if (!complaint) return null;
  const content = (
    <div className="complaint-card-brand">
      <div style={{ width: 72, height: 72, flexShrink: 0 }}>
        {complaint.photoId ? (
          <img
            src={`/api/photos/${complaint.photoId}?thumb=1`}
            alt={complaint.binCode || 'Complaint'}
            className="complaint-card-thumb"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div style={{ display: complaint.photoId ? 'none' : 'flex', width: '100%', height: '100%' }}>
          <PhotoPlaceholder text="no photo" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h4 className="font-heading" style={{ fontSize: '1.05rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {complaint.binCode || 'BIN'} &middot; {complaint.area || 'Area'}
          </h4>
          <StatusBadge status={complaint.status} />
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-green-house)', opacity: 0.85, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {complaint.description || 'No description provided'}
        </p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
  }
  if (onClick) {
    return <div onClick={onClick} style={{ cursor: 'pointer' }}>{content}</div>;
  }
  return content;
}

// -------------------------------------------------------------
// SKELETON LOADER (Paper White and Blue tints)
// -------------------------------------------------------------
export function SkeletonLoader({ height = 64, width = '100%', variant = 'white', circle = false }) {
  const isBlue = variant === 'blue';
  return (
    <div
      className={`skeleton-box ${isBlue ? 'skeleton-box-blue' : ''} skeleton-pulse`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '16px'
      }}
      aria-hidden="true"
    />
  );
}

// -------------------------------------------------------------
// EMPTY STATE (With Sprig Illustration)
// -------------------------------------------------------------
export function EmptyState({ title = 'Nothing here yet', message = 'Check back soon for updates', action }) {
  return (
    <div className="empty-state">
      <Sprig size={56} />
      <h3 className="font-heading" style={{ fontSize: '1.25rem', marginTop: '0.5rem', marginBottom: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', opacity: 0.75, margin: 0, maxWidth: '40ch' }}>
        {message}
      </p>
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
}

// -------------------------------------------------------------
// SIMPLE TOAST
// -------------------------------------------------------------
export function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  return (
    <div className="toast-brand" role="status">
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: type === 'error' ? 'var(--color-electric-pink)' : 'var(--color-sprout-green)',
          border: '1.5px solid var(--color-green-house)',
          flexShrink: 0
        }}
      />
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-green-house)',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '0.5rem',
            fontWeight: 700
          }}
          aria-label="Close"
        >
          &times;
        </button>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// NAVBAR (Role-tinted header, Logo, pill links, unread bell)
// -------------------------------------------------------------
export function Navbar({
  menuItems = [],
  activeTab,
  onTabChange,
  unreadCount: propUnread,
  onBellClick
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(propUnread || 0);

  const loadCount = async () => {
    try {
      const data = await api.get('/notifications');
      if (data && data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    if (propUnread !== undefined) {
      setUnreadCount(propUnread);
      return;
    }
    loadCount();
    const handleRefresh = () => loadCount();
    window.addEventListener('notifications:refresh', handleRefresh);
    const timer = setInterval(loadCount, 15000);
    return () => {
      window.removeEventListener('notifications:refresh', handleRefresh);
      clearInterval(timer);
    };
  }, [propUnread]);

  const role = user?.role || 'citizen';
  const firstName = user?.name ? user.name.split(' ')[0] : (role === 'citizen' ? 'Rithanya' : role);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className="navbar-brand"
      style={{
        backgroundColor: 'var(--paper)',
        padding: '16px var(--pad-x)',
        borderBottom: '2px solid var(--green)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Left: Role navigation pills */}
      <div className="citizen-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`pill ${isActive ? 'active' : 'pill-ghost'}`}
              onClick={() => onTabChange && onTabChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Center: Brand Logo */}
      <Link to={`/${role}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
        <Logo variant="dark" iconHeight={28} textSize={22} />
      </Link>

      {/* Right: Home button + 40px circle bell with 18px pink badge + Sprout pill with user's first name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
        <BackToHomeButton />

        <button
          type="button"
          title="Alerts & Notifications"
          onClick={() => {
            if (onBellClick) onBellClick();
            else if (onTabChange) onTabChange('alerts');
          }}
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid var(--green)',
            backgroundColor: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--green)',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--pink)',
                border: '2px solid var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--green)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <span
          className="pill pill-sprout"
          style={{ cursor: 'pointer', fontWeight: 600 }}
          onClick={handleLogout}
          title="Click to log out"
        >
          {firstName}
        </span>
      </div>
    </header>
  );
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// DEMO ROLE SWITCHER (Sticky top ribbon for instant testing)
// -------------------------------------------------------------
export function DemoRoleSwitcher() {
  const { user, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (role, path) => {
    try {
      setSwitching(true);
      await switchRole(role);
      navigate(path);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentRole = user?.role || 'guest';

  return (
    <div
      style={{
        backgroundColor: '#1b3227',
        color: '#f4f4e1',
        padding: '7px var(--pad-x)',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: '2px solid rgba(255,255,255,0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 9999
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6ee7b7' }} />
        <span style={{ fontWeight: 700, letterSpacing: '0.3px' }}>PORTAL SWITCHER:</span>
        <span style={{ opacity: 0.9 }}>
          Signed in as <strong>{user?.name || 'Rithanya'}</strong> ({currentRole.toUpperCase()})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ opacity: 0.75, marginRight: '2px' }}>Jump to:</span>
        <button
          type="button"
          disabled={switching}
          onClick={() => handleSwitch('citizen', '/citizen')}
          style={{
            background: currentRole === 'citizen' ? '#ffc2ef' : 'rgba(255,255,255,0.12)',
            color: currentRole === 'citizen' ? '#294237' : '#f4f4e1',
            border: 'none',
            borderRadius: '999px',
            padding: '4px 11px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Citizen (Rithanya)
        </button>
        <button
          type="button"
          disabled={switching}
          onClick={() => handleSwitch('collector', '/collector')}
          style={{
            background: currentRole === 'collector' ? '#d9f99d' : 'rgba(255,255,255,0.12)',
            color: currentRole === 'collector' ? '#294237' : '#f4f4e1',
            border: 'none',
            borderRadius: '999px',
            padding: '4px 11px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Collector Hub
        </button>
        <button
          type="button"
          disabled={switching}
          onClick={() => handleSwitch('authority', '/authority')}
          style={{
            background: currentRole === 'authority' ? '#acc6c1' : 'rgba(255,255,255,0.12)',
            color: currentRole === 'authority' ? '#294237' : '#f4f4e1',
            border: 'none',
            borderRadius: '999px',
            padding: '4px 11px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Authority Dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            color: '#f4f4e1',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '11px',
            cursor: 'pointer',
            marginLeft: '4px'
          }}
        >
          Home / Login
        </button>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'transparent',
            color: '#fca5a5',
            border: '1px solid rgba(252,165,165,0.4)',
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PROTECTED ROUTE (With automatic demo sign-in fallback)
// -------------------------------------------------------------
export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading, switchRole } = useAuth();
  const [autoLogging, setAutoLogging] = useState(false);

  useEffect(() => {
    if (loading) return;
    const targetRole = allowedRoles[0];
    if (targetRole && (!user || !allowedRoles.includes(user.role))) {
      setAutoLogging(true);
      switchRole(targetRole)
        .catch((err) => console.error('Auto-login error:', err))
        .finally(() => setAutoLogging(false));
    }
  }, [user, loading, allowedRoles, switchRole]);

  if (loading || autoLogging) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper-white)', gap: '14px' }}>
        <span className="loading-spinner" />
        <div style={{ color: 'var(--color-green-house)', fontSize: '14px', fontWeight: 600 }}>
          Loading {allowedRoles[0] ? allowedRoles[0].toUpperCase() : 'page'} portal...
        </div>
      </div>
    );
  }

  return (
    <>
      <DemoRoleSwitcher />
      {children}
    </>
  );
}

// -------------------------------------------------------------
// IMAGE COMPRESSOR
// -------------------------------------------------------------
async function compressImageToBlob(file, maxDimension, targetMaxBytes, startQuality, minQuality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = reject;

    img.onload = async () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let mime = 'image/webp';
      const test = canvas.toDataURL('image/webp');
      if (!test.startsWith('data:image/webp')) {
        mime = 'image/jpeg';
      }

      let q = startQuality;
      let blob = null;

      while (q >= minQuality - 0.05) {
        blob = await new Promise((res) => canvas.toBlob(res, mime, Math.max(minQuality, q)));
        if (blob && blob.size <= targetMaxBytes) {
          break;
        }
        q -= 0.1;
      }

      if (!blob) {
        blob = await new Promise((res) => canvas.toBlob(res, mime, minQuality));
      }

      resolve({ blob, mime });
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// -------------------------------------------------------------
// PHOTO INPUT
// -------------------------------------------------------------
export function PhotoInput({ onPhotoUploaded, label = 'Attach bin photo' }) {
  const [preview, setPreview] = useState(null);
  const [sizeKb, setSizeKb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const { blob: mainBlob } = await compressImageToBlob(file, 800, 120 * 1024, 0.7, 0.3);
      const { blob: thumbBlob } = await compressImageToBlob(file, 160, 40 * 1024, 0.5, 0.5);

      const res = await uploadPhoto(mainBlob, thumbBlob);
      const kb = (mainBlob.size / 1024).toFixed(1);
      setSizeKb(kb);
      setPreview(URL.createObjectURL(mainBlob));
      if (onPhotoUploaded) onPhotoUploaded(res.id);
    } catch (err) {
      setError(err.message || 'Error processing photo');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSizeKb(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onPhotoUploaded) onPhotoUploaded(null);
  };

  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <span className="caption">( photo evidence )</span>
      <h4 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{label}</h4>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {error && <div className="alert-error" style={{ marginBottom: '0.6rem' }}>{error}</div>}

      {!preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            width: '100%',
            minHeight: '80px',
            borderRadius: '16px',
            border: '1.5px dashed var(--color-green-house)',
            backgroundColor: 'var(--color-card-raised)',
            color: 'var(--color-green-house)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.85rem',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" />
              <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Compressing &amp; uploading...</span>
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Tap to take photo or choose file</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>Auto-compressed to under 120 KB</span>
            </>
          )}
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '16px',
            border: 'var(--border-main)',
            backgroundColor: 'var(--color-paper-white)'
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid var(--color-green-house)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Photo attached</div>
            <div style={{ fontSize: '0.76rem', opacity: 0.75 }}>Size: {sizeKb} KB (&le; 120 KB)</div>
          </div>
          <button type="button" className="btn-brand btn-secondary btn-sm" onClick={handleReset}>
            Change
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAP PICKER (With Brand CircleMarkers)
// -------------------------------------------------------------
function MapEventHandler({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapViewSetter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Marker rule:
// under 50% Sprout Green, 50 to 80% Calming Blue, over 80% Electric Pink with thick Green House ring & larger radius
function getMarkerOptions(fillLevel) {
  if (fillLevel > 80) {
    return {
      radius: 12,
      fillColor: '#ffc2ef',
      color: '#294237',
      weight: 3.5,
      fillOpacity: 1
    };
  }
  if (fillLevel >= 50) {
    return {
      radius: 9,
      fillColor: '#acc6c1',
      color: '#294237',
      weight: 2,
      fillOpacity: 1
    };
  }
  return {
    radius: 9,
    fillColor: '#b6cc58',
    color: '#294237',
    weight: 2,
    fillOpacity: 1
  };
}

export function MapPicker({
  selectedLocation,
  onLocationSelect,
  selectedBin,
  onSelectBin,
  height = '180px',
  hideHeader = false,
  hideLegend = false
}) {
  const [bins, setBins] = useState([]);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]);

  useEffect(() => {
    async function loadBins() {
      try {
        const res = await api.get('/bins');
        if (Array.isArray(res)) setBins(res);
      } catch (err) {
        // Silently catch
      }
    }
    loadBins();
  }, []);

  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      setMapCenter([selectedLocation.lat, selectedLocation.lng]);
    }
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        onLocationSelect(lat, lng);
      },
      (err) => {
        alert('Could not get your location: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  // Compute nearest bin
  let nearestBin = null;
  let minDistance = Infinity;
  if (selectedLocation && bins.length > 0) {
    bins.forEach((b) => {
      if (b.location?.coordinates?.length >= 2) {
        const [bLng, bLat] = b.location.coordinates;
        const R = 6371e3;
        const φ1 = (selectedLocation.lat * Math.PI) / 180;
        const φ2 = (bLat * Math.PI) / 180;
        const Δφ = ((bLat - selectedLocation.lat) * Math.PI) / 180;
        const Δλ = ((bLng - selectedLocation.lng) * Math.PI) / 180;
        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const d = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        if (d < minDistance) {
          minDistance = d;
          nearestBin = b;
        }
      }
    });
  }

  return (
    <div style={{ marginBottom: hideHeader ? '0' : '1.2rem' }}>
      {!hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span className="caption">( map location )</span>
            <h4 style={{ fontSize: '1rem' }}>Pin bin on map</h4>
          </div>
          <button
            type="button"
            className="pill pill-ghost"
            style={{ fontSize: '13px' }}
            onClick={handleUseMyLocation}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            <span>Use my location</span>
          </button>
        </div>
      )}

      <div style={{ height, width: '100%', borderRadius: '20px', overflow: 'hidden', border: 'var(--border-main)', position: 'relative' }}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEventHandler
            onSelectLocation={(lat, lng) => {
              setMapCenter([lat, lng]);
              onLocationSelect(lat, lng);
            }}
          />
          <MapViewSetter center={mapCenter} />

          {bins.map((bin) => {
            const coords = bin.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lng, lat] = coords;
            const opts = getMarkerOptions(bin.fillLevel);
            const isSelected = selectedBin && selectedBin._id === bin._id;

            return (
              <CircleMarker
                key={bin._id}
                center={[lat, lng]}
                radius={isSelected ? 14 : opts.radius}
                pathOptions={{
                  fillColor: opts.fillColor,
                  color: '#294237',
                  weight: isSelected ? 4 : opts.weight,
                  fillOpacity: opts.fillOpacity
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectBin) onSelectBin(bin);
                    onLocationSelect(lat, lng);
                  }
                }}
              >
                <Popup>
                  <strong>Bin {bin.code}</strong>
                  <br />
                  Area: {bin.area}
                  <br />
                  Fill level: {bin.fillLevel}%
                </Popup>
              </CircleMarker>
            );
          })}

          {selectedLocation && (
            <CircleMarker
              center={[selectedLocation.lat, selectedLocation.lng]}
              radius={10}
              pathOptions={{
                color: '#294237',
                fillColor: '#ffc2ef',
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup>Your Selected Pin</Popup>
            </CircleMarker>
          )}
        </MapContainer>

        {/* Nearest Bin Chip sitting on bottom left of map */}
        {nearestBin && (
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000, pointerEvents: 'none' }}>
            <div className="nearest-bin-chip">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-green-house)' }} />
              <span>
                Nearest bin: {nearestBin.code}, {minDistance < 1000 ? `${minDistance} m` : `${(minDistance / 1000).toFixed(1)} km`} away
              </span>
            </div>
          </div>
        )}
      </div>

      {!hideLegend && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#b6cc58', border: '1px solid #294237' }} /> &lt;50% Sprout
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#acc6c1', border: '1px solid #294237' }} /> 50-80% Blue
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffc2ef', border: '2px solid #294237' }} /> &gt;80% Pink (Critical)
          </span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// TIMELINE (Vertical Green House Line with Status Colored Dots)
// -------------------------------------------------------------
export function Timeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>No timeline events recorded yet.</p>;
  }

  const getDotBg = (status) => {
    switch (status) {
      case 'Verified': return '#acc6c1';
      case 'Assigned': return '#ffc2ef';
      case 'In Progress': return '#f4f4e1';
      case 'Collected': return '#b6cc58';
      case 'Rejected': return '#294237';
      default: return '#f4f4e1';
    }
  };

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
      {/* Continuous Vertical Green House Line */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          bottom: '10px',
          left: '8px',
          width: '2px',
          backgroundColor: 'var(--color-green-house)'
        }}
      />

      {history.map((step, idx) => (
        <div key={idx} style={{ position: 'relative' }}>
          {/* Filled Status Dot */}
          <div
            style={{
              position: 'absolute',
              left: '-22px',
              top: '4px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: getDotBg(step.status),
              border: '2px solid var(--color-green-house)',
              zIndex: 2
            }}
          />

          <div
            style={{
              backgroundColor: 'var(--color-paper-white)',
              border: 'var(--border-main)',
              borderRadius: '16px',
              padding: '0.8rem 1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge status={step.status} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>by {step.by}</span>
              </div>
              <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                {step.at ? new Date(step.at).toLocaleString() : ''}
              </span>
            </div>
            {step.note && (
              <p style={{ marginTop: '0.35rem', fontSize: '0.88rem', color: 'var(--color-green-house)' }}>
                {step.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// ALERTS (Notifications List with Coloured Dot per Type)
// -------------------------------------------------------------
export function Alerts() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/notifications');
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      console.error(err);
    }
  };

  const getDotColor = (msg = '') => {
    const m = msg.toLowerCase();
    if (m.includes('collected') || m.includes('clear')) return 'var(--sprout)';
    if (m.includes('assign')) return 'var(--pink)';
    if (m.includes('verif')) return 'var(--blue)';
    if (m.includes('reject')) return 'var(--green)';
    return 'var(--blue)';
  };

  return (
    <div style={{ width: '100%', padding: '32px var(--pad-x)' }}>
      {/* Header Band */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
          <h1 className="t2" style={{ margin: 0 }}>Alerts</h1>
          <span className="t5" style={{ color: 'var(--green)', opacity: 0.85 }}>
            live updates on all complaints
          </span>
        </div>

        {unreadCount > 0 && (
          <button type="button" className="pill pill-ghost" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="loading-spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="All caught up"
          message="No pending alerts or notifications at this moment."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => {
            const isUnread = !n.read;
            const dotColor = getDotColor(n.message);
            return (
              <div
                key={n._id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  borderLeft: isUnread ? '4px solid var(--pink)' : '2px solid var(--green)',
                  backgroundColor: 'var(--paper)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* 12px dot per type */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: dotColor,
                    border: '1.5px solid var(--green)',
                    flexShrink: 0
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t6" style={{ margin: 0, fontWeight: isUnread ? 600 : 400 }}>
                    {n.message}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                  <span className="t7" style={{ opacity: 0.7 }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>

                  {n.complaint && (
                    <Link
                      to={`/complaint/${n.complaint}`}
                      className="pill pill-ghost"
                      style={{ fontSize: '11px', padding: '3px 10px', minHeight: '26px' }}
                    >
                      View &rarr;
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// BACKWARDS-COMPATIBLE HELPER (For existing un-restyled Login.jsx)
// -------------------------------------------------------------
export function FloatingDecor() {
  return null;
}
