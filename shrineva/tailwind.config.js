/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

/** Colours are CSS variables holding "R G B" triplets (see :root in src/styles.scss), so every utility
 *  accepts an opacity suffix: bg-ink/80, border-paper/20, text-brass/90 … */
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1800px',
    },
    extend: {
      colors: {
        ink: { DEFAULT: c('ink'), 2: c('ink-2'), 3: c('ink-3'), 4: c('ink-4') },
        paper: { DEFAULT: c('paper'), 2: c('paper-2'), 3: c('paper-3') },
        sand: c('sand'),
        brass: { DEFAULT: c('brass'), deep: c('brass-deep'), soft: c('brass-soft') },
        teak: c('teak'),
        ghat: c('ghat'),
        ok: c('ok'),
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(2.9rem, 8.4vw, 7.25rem)', { lineHeight: '0.95', letterSpacing: '-0.028em' }],
        'display-xl': ['clamp(2.4rem, 6vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(2rem, 4.4vw, 3.6rem)', { lineHeight: '1.02', letterSpacing: '-0.022em' }],
        'display-md': ['clamp(1.6rem, 3vw, 2.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.3rem, 2vw, 1.75rem)', { lineHeight: '1.15', letterSpacing: '-0.012em' }],
      },
      maxWidth: { shell: '1320px' },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      boxShadow: {
        soft: '0 1px 0 rgb(255 255 255 / 0.6) inset, 0 12px 40px -18px rgb(28 24 21 / 0.35)',
        lift: '0 24px 60px -24px rgb(28 24 21 / 0.45)',
        glow: '0 0 0 1px rgb(184 137 58 / 0.35), 0 18px 50px -18px rgb(184 137 58 / 0.55)',
        'inner-line': 'inset 0 0 0 1px rgb(255 255 255 / 0.08)',
      },
      backgroundImage: {
        'brass-sheen': 'linear-gradient(135deg, #D8AE5E 0%, #B8893A 45%, #9A6F25 100%)',
        'ink-fade': 'linear-gradient(to bottom, rgb(16 14 12 / 0) 0%, rgb(16 14 12 / 0.85) 100%)',
        grid: 'linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(22px)' }, '100%': { opacity: '1', transform: 'none' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        sweep: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        ping2: { '0%': { transform: 'scale(1)', opacity: '0.55' }, '80%, 100%': { transform: 'scale(2.6)', opacity: '0' } },
        drift: { '0%, 100%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(0,-8px,0)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        draw: { '0%': { strokeDashoffset: '1' }, '100%': { strokeDashoffset: '0' } },
      },
      animation: {
        rise: 'rise 0.9s cubic-bezier(0.16,1,0.3,1) both',
        fade: 'fade 1.2s ease-out both',
        sweep: 'sweep 7s linear infinite',
        ping2: 'ping2 2.4s cubic-bezier(0,0,0.2,1) infinite',
        drift: 'drift 7s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        draw: 'draw 1.6s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [
    // Small project plugin: 3D-transform helpers, edge masks and a film-grain overlay, so templates stay utility-only.
    plugin(function ({ addUtilities, addVariant, matchUtilities }) {
      addVariant('hoverable', '@media (hover: hover) and (pointer: fine)');
      addUtilities({
        '.preserve-3d': { 'transform-style': 'preserve-3d' },
        '.backface-hidden': { 'backface-visibility': 'hidden' },
        '.text-balance': { 'text-wrap': 'balance' },
        '.text-pretty': { 'text-wrap': 'pretty' },
        '.mask-fade-b': { '-webkit-mask-image': 'linear-gradient(to bottom, #000 60%, transparent)', 'mask-image': 'linear-gradient(to bottom, #000 60%, transparent)' },
        '.mask-fade-x': { '-webkit-mask-image': 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)', 'mask-image': 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)' },
        '.bg-grain': {
          'background-image':
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
        },
        '.scrollbar-none': { 'scrollbar-width': 'none', '&::-webkit-scrollbar': { display: 'none' } },
      });
      matchUtilities({ perspective: (v) => ({ perspective: v }) }, { values: { 600: '600px', 900: '900px', 1200: '1200px', 2000: '2000px' } });
      matchUtilities(
        { 'stagger': (v) => ({ '--stagger': v }) },
        { values: { 40: '40ms', 60: '60ms', 80: '80ms', 120: '120ms' } },
      );
    }),
  ],
};
