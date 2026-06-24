"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const isa_js_1 = require("./isa.js");
const aviation_domain_1 = require("@classic-flight-engineer/aviation-domain");
(0, vitest_1.describe)('ISA Atmospheric Calculations', () => {
    (0, vitest_1.it)('calculates sea level standard temperature correctly', () => {
        const seaLevel = (0, isa_js_1.calculateISA)((0, aviation_domain_1.asFeet)(0), (0, aviation_domain_1.asCelsius)(15));
        (0, vitest_1.expect)(seaLevel.standardTempC).toBeCloseTo(15, 1);
        (0, vitest_1.expect)(seaLevel.deltaTempC).toBeCloseTo(0, 1);
        (0, vitest_1.expect)(seaLevel.pressureHpa).toBeCloseTo(1013.25, 1);
    });
    (0, vitest_1.it)('calculates troposphere values at FL300 standard conditions', () => {
        // Standard temp at 30,000ft is approx -44.4°C
        const fl300 = (0, isa_js_1.calculateISA)((0, aviation_domain_1.asFeet)(30000), (0, aviation_domain_1.asCelsius)(-44.4));
        (0, vitest_1.expect)(fl300.standardTempC).toBeCloseTo(-44.4, 1);
        (0, vitest_1.expect)(fl300.deltaTempC).toBeCloseTo(0, 1);
    });
    (0, vitest_1.it)('computes speed of sound correctly at 15°C', () => {
        const soundSpeed = (0, isa_js_1.speedOfSoundKnots)((0, aviation_domain_1.asCelsius)(15));
        (0, vitest_1.expect)(soundSpeed).toBeCloseTo(661.5, 1); // 661.5 knots
    });
});
//# sourceMappingURL=isa.test.js.map