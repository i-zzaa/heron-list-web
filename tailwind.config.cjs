/** @type {import('tailwindcss').Config} */
/* eslint-disable no-undef */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.ts'],
  theme: {
    fontSize: {
      xs: 10,
      sm: 10,
      md: 12,
      lg: 18,
      xl: 28,
    },
    colors: {
      white: '#FFFFFF',
      'yellow-400': '#FACC15',
      'gray-200': '#e4e4e7',
      'gray-300': '#D3D3D3',
      'gray-400': '#CBCBCB',
      'gray-800': '#52525B',
      'violet-800': '#662977',
      'violet-600': '#66297780',
      'violet-900': '#4f1f5c',
      'red-400': '#f87171',
      'red-900': '#7f1d1d',
      'green-400': '#4ade80',
      black: '#000000',
      to: '#ef6c00',
      psico: '#8e24aa',
      fono: '#f6bf26',
      psicopedag: '#000000',
      motricidade: '#4285F4',
      musicoterapia: '#795548',
      cancelado: '#f87171',

      primary: '#662977',
      background: '#f9f9f9',
      'primary-text': '#ffffff',
      'primary-hover': '#ffffff',
      'primary-text-hover': '#662977',

      secondary: '#FACC15',
    },
    backgroundImage: {
      favicon: "url('src/assets/favicon.ico')",
      'logo-mini': "url('/logo-mini.png')",
      'logo-md-write': "url('/logo-md-write.png')",
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'gradient-conic':
        'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
    },
    extend: {
      boxShadow: {
        // Mesma sombra dos cards do filtro (--heron-shadow em styles/theme.css).
        heron:
          '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(102, 41, 119, 0.05)',
      },
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
        'sans-serif': 'sans-serif',
        inter: 'Inter',
      },
    },
  },
};
