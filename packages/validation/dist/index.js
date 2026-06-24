"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightContextSchema = exports.estimatedPhaseTimesSchema = exports.windPointSchema = exports.stepClimbTargetSchema = exports.knotsSchema = exports.degreesSchema = exports.hectopascalsSchema = exports.celsiusSchema = exports.feetSchema = exports.poundsSchema = exports.envSchema = void 0;
const zod_1 = require("zod");
// Environment variables schema
exports.envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    SIMBRIEF_API_URL: zod_1.z.string().url().default('https://www.simbrief.com/api/xmlfeed.php'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
// Domain primitives schemas
exports.poundsSchema = zod_1.z.number().brand();
exports.feetSchema = zod_1.z.number().brand();
exports.celsiusSchema = zod_1.z.number().brand();
exports.hectopascalsSchema = zod_1.z.number().brand();
exports.degreesSchema = zod_1.z.number().min(0).max(360).brand();
exports.knotsSchema = zod_1.z.number().nonnegative().brand();
// Composite schemas
exports.stepClimbTargetSchema = zod_1.z.object({
    altitude: exports.feetSchema,
    waypoint: zod_1.z.string().min(1),
});
exports.windPointSchema = zod_1.z.object({
    waypoint: zod_1.z.string().min(1),
    altitude: exports.feetSchema,
    bearing: exports.degreesSchema,
    velocity: exports.knotsSchema,
});
exports.estimatedPhaseTimesSchema = zod_1.z.object({
    taxiOutMinutes: zod_1.z.number().nonnegative(),
    climbMinutes: zod_1.z.number().nonnegative(),
    cruiseMinutes: zod_1.z.number().nonnegative(),
    descentMinutes: zod_1.z.number().nonnegative(),
    taxiInMinutes: zod_1.z.number().nonnegative(),
    totalBlockMinutes: zod_1.z.number().nonnegative(),
});
// FlightContext schema verifying all 26 mandatory fields
exports.FlightContextSchema = zod_1.z.object({
    flightNumber: zod_1.z.string().min(1),
    callsign: zod_1.z.string().min(1),
    origin: zod_1.z.string().length(4),
    destination: zod_1.z.string().length(4),
    alternate: zod_1.z.string().length(4).nullable(),
    route: zod_1.z.string().min(1),
    aircraftType: zod_1.z.string().min(1),
    aircraftVariant: zod_1.z.string().min(1),
    engineVariant: zod_1.z.string().min(1),
    registration: zod_1.z.string().min(1),
    zeroFuelWeight: exports.poundsSchema,
    takeoffWeight: exports.poundsSchema,
    landingWeight: exports.poundsSchema,
    payload: exports.poundsSchema,
    blockFuel: exports.poundsSchema,
    taxiFuel: exports.poundsSchema,
    tripFuel: exports.poundsSchema,
    reserveFuel: exports.poundsSchema,
    plannedCruiseAltitude: exports.feetSchema,
    stepClimbs: zod_1.z.array(exports.stepClimbTargetSchema),
    departureElevation: exports.feetSchema,
    destinationElevation: exports.feetSchema,
    departureTemperature: exports.celsiusSchema,
    departurePressure: exports.hectopascalsSchema,
    windData: zod_1.z.array(exports.windPointSchema),
    estimatedTimes: exports.estimatedPhaseTimesSchema,
});
//# sourceMappingURL=index.js.map