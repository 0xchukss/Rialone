export const RIALO_COLORS = {
  mint: '#A9DDD3',
  cream: '#E8E4D9',
  black: '#010101',
} as const;

export type RialoColorName = keyof typeof RIALO_COLORS;
