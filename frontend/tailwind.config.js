/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
        display: ['var(--font-cormorant)', 'serif'],
      },
      // All custom color classes (bg-background, text-primary, etc.)
      // are mapped to the CSS variables defined in globals.css.
      // Using RGB channels allows Tailwind's opacity modifier to work,
      // e.g. bg-primary/20 = rgba(59,130,246, 0.2)
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card:       'rgb(var(--card)       / <alpha-value>)',
        primary:    'rgb(var(--primary)    / <alpha-value>)',
        safe:       'rgb(var(--safe)       / <alpha-value>)',
        medium:     'rgb(var(--medium)     / <alpha-value>)',
        high:       'rgb(var(--high)       / <alpha-value>)',
        muted:      'rgb(var(--muted)      / <alpha-value>)',
      },
      // Risk level border colors used on analyze page cards
      borderColor: {
        'l-safe':   'rgb(var(--safe))',
        'l-medium': 'rgb(var(--medium))',
        'l-high':   'rgb(var(--high))',
      },
      // ── Animation Utilities ──────────────────────
      // Keyframes are defined in globals.css.
      // These entries create the animate-* classes.
      animation: {
        'geo-spin':         'geo-spin 1.1s linear infinite',
        'geo-spin-reverse': 'geo-spin-reverse 1.6s linear infinite',
        'scanner-ping':     'scanner-ping 1.8s ease-out infinite',
        'fade-in-up':       'fade-in-up 0.6s ease-out both',
        'pulse-danger':     'pulse-danger 2s ease-in-out infinite',
        'glow-safe':        'glow-safe 3s ease-in-out infinite',
        'glow-medium':      'glow-medium 2.5s ease-in-out infinite',
        'marker-drop':      'marker-drop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'marker-shadow':    'marker-shadow 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-in-up':      'slide-in-up 0.5s ease-out both',
        'slide-in-left':    'slide-in-left 0.5s ease-out both',
        'step-fade-in':     'step-fade-in 0.4s ease-out both',
        'dot-pulse':        'dot-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
