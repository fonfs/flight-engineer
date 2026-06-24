"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAPSE_RATE_C_PER_FT = exports.SEA_LEVEL_PRESSURE_HPA = exports.SEA_LEVEL_TEMP_C = void 0;
exports.calculateISA = calculateISA;
exports.speedOfSoundKnots = speedOfSoundKnots;
const aviation_domain_1 = require("@classic-flight-engineer/aviation-domain");
// Standard sea level values
exports.SEA_LEVEL_TEMP_C = 15.0;
exports.SEA_LEVEL_PRESSURE_HPA = 1013.25;
exports.LAPSE_RATE_C_PER_FT = 0.0019812; // 1.98°C per 1000ft up to troposphere (36,089ft)
/**
 * Calculates standard temperature and pressure at altitude.
 */
function calculateISA(altitude, localOAT) {
    const altNum = Math.min(altitude, 36089); // Troposphere limit
    const standardTemp = (0, aviation_domain_1.asCelsius)(exports.SEA_LEVEL_TEMP_C - altNum * exports.LAPSE_RATE_C_PER_FT);
    const deltaTemp = (0, aviation_domain_1.asCelsius)(localOAT - standardTemp);
    // Barometric pressure formula (Simplified for troposphere)
    const pressureRatio = Math.pow(1 - (0.0000068755856 * altNum), 5.25588);
    const pressureHpa = exports.SEA_LEVEL_PRESSURE_HPA * pressureRatio;
    return {
        standardTempC: standardTemp,
        deltaTempC: deltaTemp,
        pressureHpa,
    };
}
/**
 * Calculates the local speed of sound in Knots based on temperature.
 */
function speedOfSoundKnots(oat) {
    const kelvin = oat + 273.15;
    // Speed of sound in dry air: a = 38.9678 * sqrt(T)
    return 38.9678 * Math.sqrt(kelvin);
}
//# sourceMappingURL=isa.js.map