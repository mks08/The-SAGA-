/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm dark backgrounds
        'void':    '#0C0A08',
        'deep':    '#141009',
        'surface': '#1C160E',
        'elevated':'#241D12',
        'border':  '#3A2F1E',

        // Gold palette (matches building warm tones)
        'gold': {
          DEFAULT: '#C9A84C',
          50:  '#FDF8EC',
          100: '#F9ECCC',
          200: '#F2D88A',
          300: '#E8C15A',
          400: '#D4A83A',
          500: '#C9A84C',
          600: '#B8922E',
          700: '#9A7520',
          800: '#7C5A14',
          900: '#5E420A',
        },

        // Cream / warm white
        'cream': {
          DEFAULT: '#F5F0E8',
          50:  '#FEFCF8',
          100: '#F5F0E8',
          200: '#EDE4D2',
          300: '#DDD2B8',
          400: '#C8BA9A',
          500: '#AFA07E',
        },

        // Stone / warm grays
        'stone': {
          50:  'rgba(245,240,232,0.05)',
          100: 'rgba(245,240,232,0.08)',
          200: 'rgba(245,240,232,0.12)',
          300: 'rgba(245,240,232,0.20)',
          400: 'rgba(245,240,232,0.35)',
          500: 'rgba(245,240,232,0.55)',
          600: 'rgba(245,240,232,0.70)',
          700: 'rgba(245,240,232,0.85)',
          800: 'rgba(245,240,232,0.95)',
        },
      },

      fontFamily: {
        'display': ['"Cormorant Garamond"', 'Georgia', 'serif'],
        'sans':    ['"DM Sans"', 'system-ui', 'sans-serif'],
        'mono':    ['"DM Mono"', 'monospace'],
      },

      fontSize: {
        'display-2xl': ['clamp(3.5rem, 10vw, 9rem)',  { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'display-xl':  ['clamp(2.5rem, 7vw, 6rem)',   { lineHeight: '0.94', letterSpacing: '-0.02em' }],
        'display-lg':  ['clamp(2rem, 5vw, 4rem)',     { lineHeight: '1',    letterSpacing: '-0.01em' }],
        'display-md':  ['clamp(1.5rem, 3.5vw, 2.8rem)',{ lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm':  ['clamp(1.25rem, 2.5vw, 2rem)',{ lineHeight: '1.2',  letterSpacing: '0' }],
      },

      spacing: {
        'section': 'clamp(5rem, 10vw, 9rem)',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #E8C15A 40%, #C9A84C 70%, #9A7520 100%)',
        'warm-gradient': 'linear-gradient(135deg, #0C0A08 0%, #1C160E 50%, #141009 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
      },

      animation: {
        'fade-up':      'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) backwards',
        'fade-in':      'fadeIn 0.5s ease-out backwards',
        'shimmer':      'shimmer 3s linear infinite',
        'pulse-gold':   'pulseGold 2.5s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'slide-right':  'slideRight 0.6s cubic-bezier(0.16,1,0.3,1) backwards',
        'count-up':     'countUp 1.5s cubic-bezier(0.16,1,0.3,1) forwards',
      },

      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(201,168,76,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-16px)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      boxShadow: {
        'gold-sm':  '0 2px 12px rgba(201,168,76,0.2)',
        'gold-md':  '0 6px 30px rgba(201,168,76,0.25)',
        'gold-lg':  '0 12px 60px rgba(201,168,76,0.3)',
        'gold-xl':  '0 20px 80px rgba(201,168,76,0.35)',
        'warm-sm':  '0 4px 20px rgba(12,10,8,0.4)',
        'warm-lg':  '0 20px 60px rgba(12,10,8,0.6)',
        'glass':    'inset 0 1px 0 rgba(201,168,76,0.15), 0 4px 20px rgba(0,0,0,0.3)',
      },

      backdropBlur: {
        'xs': '4px',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-sm': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
  // Don't purge Angular-generated classes
  safelist: [
    { pattern: /^delay-/ },
    { pattern: /^animate-/ },
  ],
}
