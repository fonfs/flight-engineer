"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_js_1 = require("./index.js");
const simbrief_fixture_json_1 = __importDefault(require("./simbrief.fixture.json"));
(0, vitest_1.describe)('SimBrief Adapter normalization tests', () => {
    (0, vitest_1.it)('correctly maps the valid fixture to internal FlightContext', () => {
        const result = (0, index_js_1.parseAndNormalizeSimBrief)(simbrief_fixture_json_1.default);
        (0, vitest_1.expect)(result.warnings.length).toBe(0);
        (0, vitest_1.expect)(result.flightContext.flightNumber).toBe('RG860');
        (0, vitest_1.expect)(result.flightContext.callsign).toBe('VRGRG860');
        (0, vitest_1.expect)(result.flightContext.origin).toBe('SBGL');
        (0, vitest_1.expect)(result.flightContext.destination).toBe('KJFK');
        (0, vitest_1.expect)(result.flightContext.alternate).toBe('KEWR');
        (0, vitest_1.expect)(result.flightContext.zeroFuelWeight).toBe(448000); // Lbs
        (0, vitest_1.expect)(result.flightContext.plannedCruiseAltitude).toBe(33000); // Ft
        (0, vitest_1.expect)(result.flightContext.windData.length).toBe(1);
        (0, vitest_1.expect)(result.flightContext.windData[0].waypoint).toBe('VUGAX');
        (0, vitest_1.expect)(result.flightContext.windData[0].bearing).toBe(270);
        (0, vitest_1.expect)(result.flightContext.windData[0].velocity).toBe(45);
    });
    (0, vitest_1.it)('normalizes weights from KGS to LBS and generates warning', () => {
        const kgsFixture = {
            ...simbrief_fixture_json_1.default,
            params: { units: 'kgs' },
            weights: {
                est_zfw: '200000', // kgs
                est_tow: '320000',
                est_ldw: '240000',
                payload: '30000',
            },
        };
        const result = (0, index_js_1.parseAndNormalizeSimBrief)(kgsFixture);
        (0, vitest_1.expect)(result.warnings).toContain('SimBrief OFP uses KGS. Weights were normalized to LBS internally.');
        // 200000 kg * 2.20462 = 440924 lbs
        (0, vitest_1.expect)(result.flightContext.zeroFuelWeight).toBeCloseTo(440924, 0);
    });
    (0, vitest_1.it)('handles null alternate correctly', () => {
        const noAltFixture = {
            ...simbrief_fixture_json_1.default,
            alternate: null,
        };
        const result = (0, index_js_1.parseAndNormalizeSimBrief)(noAltFixture);
        (0, vitest_1.expect)(result.flightContext.alternate).toBeNull();
    });
    (0, vitest_1.it)('captures incomplete navlog data and logs warnings', () => {
        const incompleteFixture = {
            ...simbrief_fixture_json_1.default,
            navlog: {
                fix: [
                    {
                        ident: 'XYZ',
                        // Missing wind speed and direction
                    },
                ],
            },
        };
        const result = (0, index_js_1.parseAndNormalizeSimBrief)(incompleteFixture);
        (0, vitest_1.expect)(result.warnings).toContain('Fix XYZ has incomplete wind data. Omitted.');
        (0, vitest_1.expect)(result.flightContext.windData.length).toBe(0);
    });
});
//# sourceMappingURL=simbrief.test.js.map