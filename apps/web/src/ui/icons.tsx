import type { SVGProps } from 'react';

/** Inline, dependency-free icon set. Stroke inherits `currentColor`. */
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" /></svg>
);
export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor" stroke="none" /></svg>
);
export const StopIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" /></svg>
);
export const PrevIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M18 5v14L8 12zM6 5v14" fill="currentColor" stroke="currentColor" /></svg>
);
export const NextIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 5v14l10-7zM18 5v14" fill="currentColor" stroke="currentColor" /></svg>
);
export const BackIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M15 6l-6 6 6 6" /></svg>
);
export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 11l8-7 8 7M6 10v9h12v-9" /></svg>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
);
export const GridIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>
);
export const RemoteIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="7" y="2" width="10" height="20" rx="4" /><circle cx="12" cy="8" r="2" /></svg>
);
export const TvIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8" /></svg>
);
export const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
);
