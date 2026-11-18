import React from 'react';

/**
 * Standard SVG Icon wrapper ensuring strict pixel dimensions (never unconstrained).
 */
function createIcon(viewBox, content, defaultSize = 18) {
  return function Icon({ size = defaultSize, className = '', style = {}, ...rest }) {
    const s = typeof size === 'number' ? `${size}px` : size;
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className={className}
        style={{
          width: s,
          height: s,
          minWidth: s,
          minHeight: s,
          maxWidth: s,
          maxHeight: s,
          flexShrink: 0,
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style,
        }}
        {...rest}
      >
        {content}
      </svg>
    );
  };
}

export function ShipLogo({ size = 32, className = '', style = {}, ...rest }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`maritime-ship-logo ${className}`}
      style={{
        width: s,
        height: s,
        minWidth: s,
        minHeight: s,
        maxWidth: s,
        maxHeight: s,
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      {...rest}
    >
      <defs>
        <linearGradient id="shipHullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#087FF5" />
          <stop offset="100%" stopColor="#071B33" />
        </linearGradient>
        <linearGradient id="shipWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#25B8F2" />
          <stop offset="100%" stopColor="#087FF5" />
        </linearGradient>
      </defs>
      {/* Container cargo boxes */}
      <rect x="8" y="11" width="5.5" height="4.5" rx="0.8" fill="#25B8F2" />
      <rect x="14.5" y="11" width="5.5" height="4.5" rx="0.8" fill="#38BDF8" />
      <rect x="21" y="11" width="5.5" height="4.5" rx="0.8" fill="#087FF5" />
      <rect x="11" y="6" width="5.5" height="4.5" rx="0.8" fill="#087FF5" />
      <rect x="17.5" y="6" width="5.5" height="4.5" rx="0.8" fill="#25B8F2" />
      {/* Ship bridge / superstructure */}
      <path d="M5 14h2v2H5z" fill="#94A3B8" />
      <rect x="27.5" y="8" width="3" height="8" rx="0.6" fill="#F8FAFC" />
      <rect x="28.5" y="5" width="1" height="3" fill="#64748B" />
      {/* Vessel hull */}
      <path
        d="M2.5 17.5L5.8 25.2C6.4 26.6 7.8 27.5 9.3 27.5H26.7C28.2 27.5 29.6 26.6 30.2 25.2L33.5 17.5C33.8 16.8 33.3 16 32.5 16H3.5C2.7 16 2.2 16.8 2.5 17.5Z"
        fill="url(#shipHullGrad)"
      />
      {/* White water-line stripe */}
      <path d="M4.5 20.5H31.5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />
      {/* Ocean bow waves */}
      <path
        d="M2 30C5 28.5 8 28.5 11 30C14 31.5 17 31.5 20 30C23 28.5 26 28.5 29 30C32 31.5 34 30.8 35 30"
        stroke="url(#shipWaveGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CompassIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
    </>,
    18
  )(props);
}

export function ContainerIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3.3 7 8.7 5 8.7-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    18
  )(props);
}

export function PinIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </>,
    18
  )(props);
}

export function SwapIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="m16 3 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 7H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 21-4-4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    16
  )(props);
}

export function SearchIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    18
  )(props);
}

export function SunIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    18
  )(props);
}

export function MoonIcon(props) {
  return createIcon(
    "0 0 24 24",
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    18
  )(props);
}

export function EyeIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </>,
    16
  )(props);
}

export function EyeOffIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function ShieldCheckIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    18
  )(props);
}

export function CheckCircleIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    18
  )(props);
}

export function CheckIcon(props) {
  return createIcon(
    "0 0 24 24",
    <polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />,
    16
  )(props);
}

export function ClockIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>,
    18
  )(props);
}

export function WavesIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    18
  )(props);
}

export function ArrowRightIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    16
  )(props);
}

export function ChevronDownIcon(props) {
  return createIcon(
    "0 0 24 24",
    <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    14
  )(props);
}

export function ChevronLeftIcon(props) {
  return createIcon(
    "0 0 24 24",
    <path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    14
  )(props);
}

export function ChevronRightIcon(props) {
  return createIcon(
    "0 0 24 24",
    <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    14
  )(props);
}

export function CalendarIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function CloseIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function BookmarkIcon({ filled = false, ...props }) {
  return createIcon(
    "0 0 24 24",
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    18
  )(props);
}

export function TrashIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    16
  )(props);
}

export function EditIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m15 5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function PlusIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function UserIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    </>,
    18
  )(props);
}

export function LogoutIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function BriefcaseIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    16
  )(props);
}

export function PhoneIcon(props) {
  return createIcon(
    "0 0 24 24",
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    16
  )(props);
}

export function MailIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    16
  )(props);
}

export function IdCardIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="7" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
    16
  )(props);
}

export function CameraIcon(props) {
  return createIcon(
    "0 0 24 24",
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </>,
    16
  )(props);
}
