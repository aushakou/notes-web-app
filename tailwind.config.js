/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    layers: {
      theme: {},
      base: {},
      components: {},
      utilities: {},
    },
    theme: {
      extend: {
    },
    plugins: [],
  }
}