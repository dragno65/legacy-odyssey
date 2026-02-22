export const colors = {
  background: '#faf7f2',
  dark: '#1a1510',
  gold: '#c8a96e',
  goldLight: '#d4bb8a',
  goldDark: '#b08e4a',
  textPrimary: '#2c2416',
  textSecondary: '#8a7e6b',
  card: '#f0e8dc',
  white: '#ffffff',
  error: '#c0392b',
  errorLight: '#f8d7da',
  success: '#27ae60',
  border: '#e0d5c4',
  inputBg: '#ffffff',
  overlay: 'rgba(26, 21, 16, 0.5)',
  placeholder: '#b8ad9e',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  // System serif for headings to match the book theme
  fontFamily: {
    serif: 'serif',
    sansSerif: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    title: 34,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  round: 999,
};

export default { colors, spacing, typography, shadows, borderRadius };
