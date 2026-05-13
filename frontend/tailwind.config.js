/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
}
