export default {
  'client/**/*.{ts,tsx}': [
    'cd client && npm run lint -- --fix',
    'git add',
  ],
};

