/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#12151B',      // deep archive navy-charcoal
          panel: '#1B1F27',   // rail / panel surface
          line: '#2A2F3A',    // hairline dividers on dark
          text: '#E8E6DD',    // warm off-white text on dark
          muted: '#8B93A1',   // secondary text on dark
        },
        paper: {
          DEFAULT: '#F6F3EA', // reading-room paper surface
          dim: '#EDE9DC',
          ink: '#1B1D22',     // text on paper
          muted: '#6B6455',
          line: '#DFDACB',
        },
        verdigris: {
          DEFAULT: '#4FA792',
          dim: '#3A8672',
          bright: '#6FC4AF',
        },
        gold: {
          DEFAULT: '#C9A227',
          dim: '#A8871F',
        },
        danger: '#C4574B',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '6px',
      },
    },
  },
  plugins: [],
}
