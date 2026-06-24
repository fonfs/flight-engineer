import { Feet, Celsius, asCelsius } from '@classic-flight-engineer/aviation-domain';

// Standard sea level values
export const SEA_LEVEL_TEMP_C = 15.0;
export const SEA_LEVEL_PRESSURE_HPA = 1013.25;
export const LAPSE_RATE_C_PER_FT = 0.0019812; // 1.98°C per 1000ft up to troposphere (36,089ft)

export interface ISAModel {
  standardTempC: Celsius;
  deltaTempC: Celsius;
  pressureHpa: number;
}

/**
 * Calculates standard temperature and pressure at altitude.
 */
export function calculateISA(altitude: Feet, localOAT: Celsius): ISAModel {
  const altNum = Math.min(altitude, 36089); // Troposphere limit
  
  const standardTemp = asCelsius(SEA_LEVEL_TEMP_C - altNum * LAPSE_RATE_C_PER_FT);
  const deltaTemp = asCelsius(localOAT - standardTemp);
  
  // Barometric pressure formula (Simplified for troposphere)
  const pressureRatio = Math.pow(1 - (0.0000068755856 * altNum), 5.25588);
  const pressureHpa = SEA_LEVEL_PRESSURE_HPA * pressureRatio;
  
  return {
    standardTempC: standardTemp,
    deltaTempC: deltaTemp,
    pressureHpa,
  };
}

/**
 * Calculates the local speed of sound in Knots based on temperature.
 */
export function speedOfSoundKnots(oat: Celsius): number {
  const kelvin = oat + 273.15;
  // Speed of sound in dry air: a = 38.9678 * sqrt(T)
  return 38.9678 * Math.sqrt(kelvin);
}
