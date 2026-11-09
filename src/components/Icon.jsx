import React from 'react';

const shapes = {
  scan: <><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><path d="M8 12h8M12 8v8"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  car: <><path d="M5 16H3v-4l2.1-5a2 2 0 0 1 1.85-1.2h10.1A2 2 0 0 1 18.9 7l2.1 5v4h-2"/><path d="M5 16h14M5 12h14M6 7h12M6 16v2m12-2v2"/><circle cx="7.5" cy="15.5" r="1"/><circle cx="16.5" cy="15.5" r="1"/></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4m-2 13h.01"/></>,
  box: <><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9"/></>,
  layers: <><path d="m12 2 9 6-9 6-9-6 9-6Zm-9 10 9 6 9-6M3 16l9 6 9-6"/></>,
  wire: <><path d="M3 3h8v8H3zM13 13h8v8h-8zM11 7h5v6M7 11v6h6"/></>,
  rotate: <><path d="M20 11a8 8 0 0 0-14.2-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14.2 5L21 15m0 6v-6h-6"/></>,
  pause: <><path d="M8 5v14M16 5v14"/></>,
  play: <><path d="m8 5 11 7-11 7V5Z"/></>,
  reset: <><path d="M3 11a9 9 0 1 1 3.1 7M3 4v7h7"/><path d="M12 8v4l3 2"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6m0-9h.01"/></>,
  sliders: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="2.5" fill="currentColor" stroke="none"/></>,
  chevron: <><path d="m9 6 6 6-6 6"/></>,
  close: <><path d="M5 5l14 14M19 5 5 19"/></>,
  star: <><path d="m12 2 3.1 6.3L22 9.3l-5 4.9 1.2 7L12 18l-6.2 3.2 1.2-7-5-4.9 6.9-1z"/></>,
  library: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16m-5-5h18"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  keyboard: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M7 16h10"/></>,
  check: <><path d="m4 12 5 5L20 6"/></>,
  arrow: <><path d="M4 12h16m-7-7 7 7-7 7"/></>,
  settings: <><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="17" r="2" fill="currentColor"/></>,
};

export default function Icon({ name, size = 18, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{shapes[name] || shapes.box}</svg>;
}
