/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { paper:'#f4f2ed', ink:'#101010', violet:'#6c4dff', blue:'#146cff', lime:'#d7ff33', orange:'#ff5a36', safe:'#38a169', warning:'#f2c94c', separated:'#ef5a36', sos:'#a62cce' },
    boxShadow: { paper:'0 1.8rem 4rem rgba(16,16,16,.13), 0 .4rem 1rem rgba(16,16,16,.08)' }
  } },
  plugins: []
};
