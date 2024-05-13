/* eslint-disable global-require */
const colors = require('tailwindcss/colors');
const { nextui } = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      satoshi: ['Satoshi', 'sans-serif'],
    },
    colors: {
      // use colors only specified
      white: colors.white,
      gray: colors.gray,
      blue: colors.blue,
      midnight: '#121063',
      'midnight-light': '#1E1E6E',
      'midnight-dark': '#0A0A4A',
      'midnight-darker': '#07073A',
      'midnight-darkest': '#04042A',
      'midnight-lighter': '#2A2A7A',
      'midnight-lightest': '#3A3A9A',
    },
    extend: {},
  },
  darkMode: 'media',
  plugins: [nextui(), require('@tailwindcss/typography'), require('tailwindcss-animate')],
};
