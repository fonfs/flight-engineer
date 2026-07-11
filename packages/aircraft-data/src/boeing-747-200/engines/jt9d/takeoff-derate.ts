export const TEMP_GRID_F = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120] as const;
export const PA_GRID_KFT = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

// MAX TAKEOFF THRUST - EPR (1 PACK ON, nacelle anti-ice on or off)
export const MAX_EPR_TABLE = [
  [1.59, 1.58, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 0 kft
  [1.59, 1.58, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 1 kft
  [1.58, 1.58, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 2 kft
  [1.57, 1.57, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 3 kft
  [1.56, 1.56, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 4 kft
  [1.55, 1.55, 1.55, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 5 kft
  [1.54, 1.54, 1.54, 1.54, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 6 kft
  [1.53, 1.53, 1.53, 1.53, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 7 kft
  [1.52, 1.52, 1.52, 1.52, 1.52, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],  // 8 kft
] as const;

// REDUCED TAKEOFF THRUST (DERATE TABLE)
export const REDUCED_EPR_TABLE: Record<number, (number | null)[]> = {
  1.59: [1.59, 1.58, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.45, 1.45],
  1.58: [1.58, 1.58, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.44],
  1.57: [1.57, 1.57, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.43],
  1.56: [1.56, 1.56, 1.56, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.55: [1.55, 1.55, null, 1.55, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.54: [1.54, 1.54, null, 1.54, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.53: [1.53, 1.53, null, null, 1.53, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.52: [1.52, 1.52, null, null, null, 1.52, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.51: [1.51, 1.51, null, null, null, null, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.50: [1.50, null, null, null, null, null, 1.50, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.49: [null, null, null, null, null, null, 1.49, 1.49, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.48: [null, null, null, null, null, null, null, 1.48, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.47: [null, null, null, null, null, null, null, 1.47, 1.47, 1.46, 1.45, 1.44, 1.42],
  1.46: [null, null, null, null, null, null, null, null, 1.46, 1.46, 1.45, 1.44, 1.42],
  1.45: [null, null, null, null, null, null, null, null, null, 1.45, 1.45, 1.44, 1.42],
  1.44: [null, null, null, null, null, null, null, null, null, null, 1.44, 1.44, 1.42],
  1.43: [null, null, null, null, null, null, null, null, null, null, null, 1.43, 1.42],
  1.42: [null, null, null, null, null, null, null, null, null, null, null, null, 1.42],
};

// Minimum temperatures for derate (°F) - below these, derate is not allowed
export const MIN_AMBIENT_TEMP_F = -47;

// Minimum runway length for derate (feet)
export const MIN_RUNWAY_LENGTH_FT = 7000;

// Available flap settings for takeoff (degrees)
export const AVAILABLE_FLAPS = [10, 20] as const;
export const DEFAULT_FLAPS = 10;

// Runway-limited takeoff weight (k lbs) at 80°F for HKG RWY 31 (9491 ft)
export const RUNWAY_LIMIT_BASE_80F: Record<number, number> = {
  10: 719.6,  // Flaps 10: 719.6k lbs at 80°F
  20: 744.1,  // Flaps 20: 744.1k lbs at 80°F
};

// Climb-limited takeoff weight (k lbs)
export const CLIMB_LIMIT_WEIGHT: Record<number, number> = {
  10: 840.0,
  20: 811.0,
};

// Temperature correction for runway-limited weight (k lbs per °F above 80°F)
export const RUNWAY_LIMIT_TEMP_SLOPE: Record<number, number> = {
  10: -0.638,
  20: -0.727,
};

// Wind correction factors (lbs per knot)
export const WIND_CORRECTION: Record<number, { headwind: number; tailwind: number }> = {
  10: {
    headwind: 1170,
    tailwind: -4190,
  },
  20: {
    headwind: 3940,
    tailwind: -3940,
  }
};
