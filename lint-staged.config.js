module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.ts?(x)': () => 'yarn check-types',
  '*.{json,md,yaml,yml,css}': 'prettier --write',
};
