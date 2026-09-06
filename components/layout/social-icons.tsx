/* ---------------------------------------------------------------------------
   Social marks, drawn to match lucide.

   react-social-icons ships filled brand glyphs in brand colours, which sat
   badly next to the 1.6-weight lucide line icons in the same footer column —
   two icon systems, one row. These are authored on the same 24px grid at the
   same stroke weight, so the footer has one icon language.
--------------------------------------------------------------------------- */

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 3h-2.2A4.3 4.3 0 0 0 9 7.3V10H6.5v3.4H9V21h3.4v-7.6h2.6l.5-3.4h-3.1V7.7c0-.7.4-1.2 1.1-1.2h2V3Z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.2 9.6v4.8l4.2-2.4-4.2-2.4Z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.2 10.6V17" />
      <circle cx="7.2" cy="7.2" r="0.95" fill="currentColor" stroke="none" />
      <path d="M11.3 17v-3.6a2.5 2.5 0 0 1 5 0V17" />
      <path d="M11.3 13.4v-2.8" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.4 3v10.9a3.6 3.6 0 1 1-3.6-3.6c.35 0 .69.05 1 .15" />
      <path d="M14.4 3a5.2 5.2 0 0 0 5.2 5.2" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4l7.2 9.1L4.5 20" />
      <path d="M20 20l-7.2-9.1L19.5 4" />
      <path d="M4 4h3.6M16.4 20H20" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.4-4.5a8.4 8.4 0 1 1 15.6-4.3Z" />
      <path d="M9.2 9c.5 1.4 1.4 2.6 2.6 3.5.4.3.9.5 1.4.6l1-1 1.6.8" />
    </svg>
  );
}
