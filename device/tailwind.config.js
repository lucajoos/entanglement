const colors = {
  background: {
    default: 'var(--color-background-default)',
    accent: 'var(--color-background-accent)'
  },
  text: {
    default: 'var(--color-text-default)',
    accent: 'var(--color-text-accent)'
  }
}

module.exports = {
  purge: {
    content: ['./src/**/*.jsx'],
    options: {
      safelist: [].concat(...Object.keys(colors).map(color => {
        return [
          `bg-${color}-default`,
          `bg-${color}-accent`,
          `hover:bg-${color}-accent`
        ]
      }))
    }
  },
  darkMode: false,
  theme: {
    extend: {
      colors
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
