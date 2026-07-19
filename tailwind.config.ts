import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        temple: {
          bg: '#0F0906',
          card: '#1D130E',
          gold: '#E5A93B',
          goldLight: '#F3D279',
          crimson: '#8A151A',
          yellow: '#FFDD00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Devotional display face for headings (Latin); Tamil/Malay gracefully
        // fall back to the system serif/sans since Cormorant lacks those glyphs.
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        goldlabel: '0.14em',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E5A93B 0%, #F3D279 50%, #B87E23 100%)',
        'crimson-gradient': 'linear-gradient(135deg, #8A151A 0%, #B91C1C 60%, #6D1015 100%)',
        'gold-sheen':
          'linear-gradient(120deg, transparent 0%, rgba(243,210,121,0.22) 50%, transparent 100%)',
      },
      boxShadow: {
        // Systematized gold "elevation" scale (formerly inline shadow-[inset...]).
        'gold-inner': 'inset 0 0 20px rgba(229,169,59,0.08)',
        'gold-inner-lg': 'inset 0 0 32px rgba(229,169,59,0.12)',
        'gold-glow': '0 0 12px rgba(229,169,59,0.35)',
        'gold-elevate':
          '0 10px 30px -12px rgba(0,0,0,0.7), inset 0 0 20px rgba(229,169,59,0.07)',
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
