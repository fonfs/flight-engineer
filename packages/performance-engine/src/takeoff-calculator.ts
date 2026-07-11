import { 
  Pounds, 
  Celsius, 
  Hectopascals, 
  Knots, 
  Feet,
  asPounds,
  asCelsius,
  asFeet
} from '@classic-flight-engineer/unit-system';

import { B742_Takeoff_Derate } from '@classic-flight-engineer/aircraft-data';

const {
  TEMP_GRID_F,
  PA_GRID_KFT,
  MAX_EPR_TABLE,
  REDUCED_EPR_TABLE,
  MIN_AMBIENT_TEMP_F,
  MIN_RUNWAY_LENGTH_FT,
  RUNWAY_LIMIT_BASE_80F,
  CLIMB_LIMIT_WEIGHT,
  RUNWAY_LIMIT_TEMP_SLOPE,
  WIND_CORRECTION
} = B742_Takeoff_Derate;

/**
 * Finds the index interval containing the input value in a sorted grid.
 */
function findInterval(grid: readonly number[], value: number): { lowerIdx: number; upperIdx: number } {
  if (grid.length < 2) {
    throw new Error('Grid must contain at least 2 points.');
  }
  for (let i = 0; i < grid.length - 1; i++) {
    if (value >= grid[i] && value <= grid[i + 1]) {
      return { lowerIdx: i, upperIdx: i + 1 };
    }
  }
  if (value < grid[0]) {
    return { lowerIdx: 0, upperIdx: 1 };
  }
  return { lowerIdx: grid.length - 2, upperIdx: grid.length - 1 };
}

/**
 * Linear 1D interpolation helper with null value handling.
 */
function interp(x: number, grid: readonly number[], values: readonly (number | null)[]): number | null {
  if (x <= grid[0]) {
    return values[0];
  }
  if (x >= grid[grid.length - 1]) {
    return values[values.length - 1];
  }

  const { lowerIdx, upperIdx } = findInterval(grid, x);
  const x1 = grid[lowerIdx];
  const x2 = grid[upperIdx];
  const y1 = values[lowerIdx];
  const y2 = values[upperIdx];

  if (y1 === null && y2 === null) {
    return null;
  }
  if (y1 === null) {
    return y2;
  }
  if (y2 === null) {
    return y1;
  }

  const t = (x - x1) / (x2 - x1);
  return y1 + t * (y2 - y1);
}

/**
 * Bilinear interpolation for MAX EPR from pressure altitude and temperature.
 */
export function bilinearMaxEpr(paKft: number, tempF: number): number {
  const paClamped = Math.max(0, Math.min(8, paKft));
  const i = Math.floor(paClamped);
  const frac = paClamped - i;

  const row1 = MAX_EPR_TABLE[i];
  const row2 = MAX_EPR_TABLE[Math.min(i + 1, 8)];

  const v1 = interp(tempF, TEMP_GRID_F, row1);
  const v2 = interp(tempF, TEMP_GRID_F, row2);

  if (v1 === null || v2 === null) {
    return 1.42; // Fallback minimum
  }

  return v1 + frac * (v2 - v1);
}

/**
 * Interpolate reduced EPR from the derate table.
 */
export function interpReducedEpr(maxEpr: number, tempF: number): number | null {
  const availableKeys = Object.keys(REDUCED_EPR_TABLE)
    .map(Number)
    .sort((a, b) => a - b);

  if (maxEpr <= availableKeys[0]) {
    const rowValues = REDUCED_EPR_TABLE[availableKeys[0]];
    return interp(tempF, TEMP_GRID_F, rowValues);
  }

  if (maxEpr >= availableKeys[availableKeys.length - 1]) {
    const rowValues = REDUCED_EPR_TABLE[availableKeys[availableKeys.length - 1]];
    return interp(tempF, TEMP_GRID_F, rowValues);
  }

  let lowerKey = availableKeys[0];
  let upperKey = availableKeys[availableKeys.length - 1];

  for (let i = 0; i < availableKeys.length; i++) {
    const key = availableKeys[i];
    if (key <= maxEpr) {
      lowerKey = key;
    } else {
      upperKey = key;
      break;
    }
  }

  const lowerValues = REDUCED_EPR_TABLE[lowerKey];
  const upperValues = REDUCED_EPR_TABLE[upperKey];

  const lowerResult = interp(tempF, TEMP_GRID_F, lowerValues);
  const upperResult = interp(tempF, TEMP_GRID_F, upperValues);

  if (lowerResult === null && upperResult === null) {
    return null;
  }
  if (lowerResult === null) {
    return upperResult;
  }
  if (upperResult === null) {
    return lowerResult;
  }

  const t = (maxEpr - lowerKey) / (upperKey - lowerKey);
  return lowerResult + t * (upperResult - lowerResult);
}

/**
 * Check if reduced thrust takeoff is allowed.
 */
export function checkDerateRestrictions(
  oatC: Celsius,
  runwayLength: Feet,
  windHeadwind: Knots,
  windTailwind: Knots,
  runwayDry: boolean,
  melCdlPenalty: boolean,
  windshearProb: boolean
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const oatF = oatC * 1.8 + 32;

  if (oatF < MIN_AMBIENT_TEMP_F) {
    reasons.push(`Ambient temp ${Math.round(oatF)}°F below minimum (${MIN_AMBIENT_TEMP_F}°F / -47°C)`);
  }

  if (runwayLength < MIN_RUNWAY_LENGTH_FT) {
    reasons.push(`Runway length ${Math.round(runwayLength)}ft below minimum (${MIN_RUNWAY_LENGTH_FT}ft)`);
  }

  if (!runwayDry) {
    reasons.push("Runway must be dry (grooved runway is considered dry)");
  }

  if (windTailwind > 0) {
    reasons.push("Tailwind conditions - derate not allowed");
  }

  if (melCdlPenalty) {
    reasons.push("MEL/CDL weight/performance penalties applied");
  }

  if (windshearProb) {
    reasons.push("Probability of windshear exists");
  }

  return {
    allowed: reasons.length === 0,
    reasons
  };
}

/**
 * Calculate maximum climb EPR based on field elevation and OAT.
 */
export function calculateClimbEpr(paKft: number, tempF: number): number {
  const baseClimb = 1.40;
  const altitudeCorrection = paKft * 0.02;
  const tempCorrection = Math.max(0, tempF - 59) * 0.001;
  const climbEpr = baseClimb - altitudeCorrection - tempCorrection;
  return Math.max(1.30, Math.min(1.45, climbEpr));
}

/**
 * Calculate required takeoff distance in meters.
 */
export function takeoffDistance(
  weightTons: number,
  thrustRatio: number,
  paKft: number,
  tempF: number
): number {
  const base = 2800; // meters
  const weightFactor = Math.pow(weightTons / 300, 2);
  const thrustFactor = 1.0 / Math.max(0.7, thrustRatio);
  const altitudeFactor = 1.0 + paKft * 0.05;
  const tempFactor = 1.0 + Math.max(0, tempF - 59) * 0.002;
  return base * weightFactor * thrustFactor * altitudeFactor * tempFactor;
}

/**
 * Calculate V1, VR, V2 speeds.
 */
export function vSpeeds(
  weightTons: number,
  assumedTempF: number,
  oatF: number,
  flaps: 10 | 20
): { v1: number; vr: number; v2: number } {
  const flapCorrection = flaps === 10 ? 0 : -2;

  const v2Base = 140 + 0.2 * (weightTons - 250) + flapCorrection;
  const vrBase = v2Base - 10;
  const v1Base = vrBase - 5;

  const tempCorrection = Math.max(0, assumedTempF - 59) * 0.1;

  const v2 = v2Base + tempCorrection;
  const vr = vrBase + tempCorrection;
  const v1 = v1Base + tempCorrection;

  const v2Min = flaps === 20 ? 128 : 130;
  const vrMin = flaps === 20 ? 118 : 120;
  const v1Min = flaps === 20 ? 108 : 110;

  return {
    v1: Math.round(Math.max(v1, v1Min)),
    vr: Math.round(Math.max(vr, vrMin)),
    v2: Math.round(Math.max(v2, v2Min))
  };
}

/**
 * Calculate runway-limited takeoff weight (in k lbs).
 */
export function calculateRunwayLimitWeight(
  flaps: 10 | 20,
  tempF: number,
  windHeadwind: Knots,
  windTailwind: Knots,
  runwayLength: Feet,
  slopePct: number
): number {
  const baseWeight = RUNWAY_LIMIT_BASE_80F[flaps] || 719.6;
  const tempDelta = tempF - 80;
  const tempCorrection = (RUNWAY_LIMIT_TEMP_SLOPE[flaps] || -0.638) * tempDelta;

  let windCorrLbs = 0;
  if (windHeadwind > 0) {
    windCorrLbs = WIND_CORRECTION[flaps].headwind * windHeadwind;
  } else if (windTailwind > 0) {
    windCorrLbs = WIND_CORRECTION[flaps].tailwind * windTailwind;
  }

  const windCorrectionK = windCorrLbs / 1000;
  const referenceRunway = 9491; // HKG RWY 31
  const runwayFactor = runwayLength / referenceRunway;
  const slopeCorrection = slopePct * 0.02 * baseWeight;

  const limitWeight = (baseWeight + tempCorrection + windCorrectionK) * runwayFactor + slopeCorrection;
  return Math.max(0, limitWeight);
}

/**
 * Calculate climb-limited takeoff weight (in k lbs).
 */
export function calculateClimbLimitWeight(
  flaps: 10 | 20,
  paKft: number,
  tempF: number
): number {
  const baseClimbLimit = CLIMB_LIMIT_WEIGHT[flaps] || 840.0;
  const altitudeFactor = 1.0 - paKft * 0.02;
  const tempFactor = 1.0 - Math.max(0, tempF - 59) * 0.005;
  const climbLimit = baseClimbLimit * altitudeFactor * tempFactor;
  return Math.max(0, climbLimit);
}

export interface TakeoffPerformanceResult {
  PA_ft: number;
  PA_kft: number;
  OAT_C: number;
  OAT_F: number;
  FLAPS: 10 | 20;
  MAX_EPR: number | null;
  CLIMB_EPR: number;
  ASSUMED_TEMP_C: number;
  ASSUMED_TEMP_F: number;
  REDUCED_EPR: number;
  THRUST_RATIO: number;
  DIST_REQUIRED_M: number;
  DIST_REQUIRED_FT: number;
  RUNWAY_AVAILABLE_M: number;
  RUNWAY_AVAILABLE_FT: number;
  RUNWAY_LIMIT_WEIGHT: number;
  CLIMB_LIMIT_WEIGHT: number;
  ACTUAL_WEIGHT_K_LBS: number;
  WEIGHT_MARGIN_K_LBS: number;
  V1: number;
  VR: number;
  V2: number;
  DERATE_ALLOWED: boolean;
  RESTRICTION_REASONS: string[];
  PACKS_OFF_3: boolean;
  MAX_ASSUMED_TEMP_F: number;
}

/**
 * Core Takeoff Calculation Wrapper with branded types.
 */
export function calculateTakeoffPerformance(
  elevation: Feet,
  qnh: Hectopascals,
  oat: Celsius,
  weight: Pounds,
  runwayLength: Feet,
  flaps: 10 | 20 = 10,
  packsOff3 = false,
  runwayDry = true,
  windHeadwind: Knots = 0 as Knots,
  windTailwind: Knots = 0 as Knots,
  melCdlPenalty = false,
  windshearProb = false,
  runwaySlopePct = 0
): TakeoffPerformanceResult {
  const pa = elevation + (1013.25 - qnh) * 30;
  const paKft = pa / 1000;
  const oatF = oat * 1.8 + 32;
  const runwayM = runwayLength / 3.28084;

  const runwayLimitKLbs = calculateRunwayLimitWeight(
    flaps,
    oatF,
    windHeadwind,
    windTailwind,
    runwayLength,
    runwaySlopePct
  );
  const climbLimitKLbs = calculateClimbLimitWeight(flaps, paKft, oatF);
  const weightKLbs = weight / 1000;
  const weightTons = weight / 2204.62;

  let maxRunwayTemp = Math.floor(oatF);
  for (let tF = Math.floor(oatF); tF < 150; tF++) {
    const limit = calculateRunwayLimitWeight(
      flaps,
      tF,
      windHeadwind,
      windTailwind,
      runwayLength,
      runwaySlopePct
    );
    if (weightKLbs <= limit) {
      maxRunwayTemp = tF;
    } else {
      break;
    }
  }

  let maxClimbTemp = Math.floor(oatF);
  for (let tF = Math.floor(oatF); tF < 150; tF++) {
    const limit = calculateClimbLimitWeight(flaps, paKft, tF);
    if (weightKLbs <= limit) {
      maxClimbTemp = tF;
    } else {
      break;
    }
  }

  const { allowed, reasons } = checkDerateRestrictions(
    oat,
    runwayLength,
    windHeadwind,
    windTailwind,
    runwayDry,
    melCdlPenalty,
    windshearProb
  );

  let maxEpr = bilinearMaxEpr(paKft, oatF);
  if (packsOff3 && maxEpr !== null) {
    maxEpr += 0.01;
  }

  const climbEpr = calculateClimbEpr(paKft, oatF);
  let maxAssumedTempF = Math.min(maxRunwayTemp, maxClimbTemp);

  let best: [number, number, number] | null = null;
  const startTempC = Math.floor(oat);
  const endTempC = Math.min(60, Math.floor(maxAssumedTempF / 1.8 - 32 / 1.8) + 10);

  for (let tC = startTempC; tC <= endTempC; tC++) {
    const tF = tC * 1.8 + 32;
    if (tF > maxAssumedTempF) {
      break;
    }

    let reduced = interpReducedEpr(maxEpr, tF);
    if (reduced === null) {
      continue;
    }

    reduced = Math.max(reduced, climbEpr);
    const tr = maxEpr > 0 ? reduced / maxEpr : 1.0;
    const dist = takeoffDistance(weightTons, tr, paKft, tF);

    if (dist <= runwayM) {
      if (best === null || tC > best[0]) {
        best = [tC, reduced, dist];
      }
    }
  }

  if (best === null) {
    best = [oat, maxEpr, takeoffDistance(weightTons, 1.0, paKft, oatF)];
  }

  const [assumedTempC, reducedEpr, distRequired] = best;
  const assumedTempF = assumedTempC * 1.8 + 32;
  const { v1, vr, v2 } = vSpeeds(weightTons, assumedTempF, oatF, flaps);

  return {
    PA_ft: Math.round(pa),
    PA_kft: Number(paKft.toFixed(2)),
    OAT_C: Number(oat.toFixed(1)),
    OAT_F: Number(oatF.toFixed(1)),
    FLAPS: flaps,
    MAX_EPR: maxEpr ? Number(maxEpr.toFixed(3)) : null,
    CLIMB_EPR: Number(climbEpr.toFixed(3)),
    ASSUMED_TEMP_C: assumedTempC,
    ASSUMED_TEMP_F: Number(assumedTempF.toFixed(1)),
    REDUCED_EPR: Number(reducedEpr.toFixed(3)),
    THRUST_RATIO: Number((maxEpr > 0 ? reducedEpr / maxEpr : 1.0).toFixed(3)),
    DIST_REQUIRED_M: Math.round(distRequired),
    DIST_REQUIRED_FT: Math.round(distRequired * 3.28084),
    RUNWAY_AVAILABLE_M: runwayM,
    RUNWAY_AVAILABLE_FT: Math.round(runwayLength),
    RUNWAY_LIMIT_WEIGHT: Number(runwayLimitKLbs.toFixed(1)),
    CLIMB_LIMIT_WEIGHT: Number(climbLimitKLbs.toFixed(1)),
    ACTUAL_WEIGHT_K_LBS: Number(weightKLbs.toFixed(1)),
    WEIGHT_MARGIN_K_LBS: Number((Math.min(runwayLimitKLbs, climbLimitKLbs) - weightKLbs).toFixed(1)),
    V1: v1,
    VR: vr,
    V2: v2,
    DERATE_ALLOWED: allowed,
    RESTRICTION_REASONS: reasons,
    PACKS_OFF_3: packsOff3,
    MAX_ASSUMED_TEMP_F: Number(maxAssumedTempF.toFixed(1))
  };
}
