theme: {
  extend: {
    colors: {
      gold: '#FFD700',
      black: '#000000',
    },
    animation: {
      'fade-in': 'fadeIn 0.4s ease-out forwards',
      'fade-slide-up': 'fadeSlideUp 0.5s ease-out forwards',
      'pulse-gold': 'pulseGold 2s infinite',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
      fadeSlideUp: {
        '0%': { opacity: 0, transform: 'translateY(20px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      pulseGold: {
        '0%,100%': { transform: 'scale(1)', boxShadow: '0 0 10px #FFD700' },
        '50%': { transform: 'scale(1.02)', boxShadow: '0 0 20px #FFD700' },
      },
    },
  },
}
