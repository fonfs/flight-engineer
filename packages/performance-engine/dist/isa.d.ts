import { Feet, Celsius } from '@classic-flight-engineer/aviation-domain';
export declare const SEA_LEVEL_TEMP_C = 15;
export declare const SEA_LEVEL_PRESSURE_HPA = 1013.25;
export declare const LAPSE_RATE_C_PER_FT = 0.0019812;
export interface ISAModel {
    standardTempC: Celsius;
    deltaTempC: Celsius;
    pressureHpa: number;
}
/**
 * Calculates standard temperature and pressure at altitude.
 */
export declare function calculateISA(altitude: Feet, localOAT: Celsius): ISAModel;
/**
 * Calculates the local speed of sound in Knots based on temperature.
 */
export declare function speedOfSoundKnots(oat: Celsius): number;
//# sourceMappingURL=isa.d.ts.map