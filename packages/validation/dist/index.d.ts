import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    SIMBRIEF_API_URL: z.ZodDefault<z.ZodString>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    SIMBRIEF_API_URL: string;
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
}, {
    DATABASE_URL: string;
    SIMBRIEF_API_URL?: string | undefined;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
}>;
export declare const poundsSchema: z.ZodBranded<z.ZodNumber, "Pounds">;
export declare const feetSchema: z.ZodBranded<z.ZodNumber, "Feet">;
export declare const celsiusSchema: z.ZodBranded<z.ZodNumber, "Celsius">;
export declare const hectopascalsSchema: z.ZodBranded<z.ZodNumber, "Hectopascals">;
export declare const degreesSchema: z.ZodBranded<z.ZodNumber, "Degrees">;
export declare const knotsSchema: z.ZodBranded<z.ZodNumber, "Knots">;
export declare const stepClimbTargetSchema: z.ZodObject<{
    altitude: z.ZodBranded<z.ZodNumber, "Feet">;
    waypoint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    altitude: number & z.BRAND<"Feet">;
    waypoint: string;
}, {
    altitude: number;
    waypoint: string;
}>;
export declare const windPointSchema: z.ZodObject<{
    waypoint: z.ZodString;
    altitude: z.ZodBranded<z.ZodNumber, "Feet">;
    bearing: z.ZodBranded<z.ZodNumber, "Degrees">;
    velocity: z.ZodBranded<z.ZodNumber, "Knots">;
}, "strip", z.ZodTypeAny, {
    altitude: number & z.BRAND<"Feet">;
    waypoint: string;
    bearing: number & z.BRAND<"Degrees">;
    velocity: number & z.BRAND<"Knots">;
}, {
    altitude: number;
    waypoint: string;
    bearing: number;
    velocity: number;
}>;
export declare const estimatedPhaseTimesSchema: z.ZodObject<{
    taxiOutMinutes: z.ZodNumber;
    climbMinutes: z.ZodNumber;
    cruiseMinutes: z.ZodNumber;
    descentMinutes: z.ZodNumber;
    taxiInMinutes: z.ZodNumber;
    totalBlockMinutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    taxiOutMinutes: number;
    climbMinutes: number;
    cruiseMinutes: number;
    descentMinutes: number;
    taxiInMinutes: number;
    totalBlockMinutes: number;
}, {
    taxiOutMinutes: number;
    climbMinutes: number;
    cruiseMinutes: number;
    descentMinutes: number;
    taxiInMinutes: number;
    totalBlockMinutes: number;
}>;
export declare const FlightContextSchema: z.ZodObject<{
    flightNumber: z.ZodString;
    callsign: z.ZodString;
    origin: z.ZodString;
    destination: z.ZodString;
    alternate: z.ZodNullable<z.ZodString>;
    route: z.ZodString;
    aircraftType: z.ZodString;
    aircraftVariant: z.ZodString;
    engineVariant: z.ZodString;
    registration: z.ZodString;
    zeroFuelWeight: z.ZodBranded<z.ZodNumber, "Pounds">;
    takeoffWeight: z.ZodBranded<z.ZodNumber, "Pounds">;
    landingWeight: z.ZodBranded<z.ZodNumber, "Pounds">;
    payload: z.ZodBranded<z.ZodNumber, "Pounds">;
    blockFuel: z.ZodBranded<z.ZodNumber, "Pounds">;
    taxiFuel: z.ZodBranded<z.ZodNumber, "Pounds">;
    tripFuel: z.ZodBranded<z.ZodNumber, "Pounds">;
    reserveFuel: z.ZodBranded<z.ZodNumber, "Pounds">;
    plannedCruiseAltitude: z.ZodBranded<z.ZodNumber, "Feet">;
    stepClimbs: z.ZodArray<z.ZodObject<{
        altitude: z.ZodBranded<z.ZodNumber, "Feet">;
        waypoint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        altitude: number & z.BRAND<"Feet">;
        waypoint: string;
    }, {
        altitude: number;
        waypoint: string;
    }>, "many">;
    departureElevation: z.ZodBranded<z.ZodNumber, "Feet">;
    destinationElevation: z.ZodBranded<z.ZodNumber, "Feet">;
    departureTemperature: z.ZodBranded<z.ZodNumber, "Celsius">;
    departurePressure: z.ZodBranded<z.ZodNumber, "Hectopascals">;
    windData: z.ZodArray<z.ZodObject<{
        waypoint: z.ZodString;
        altitude: z.ZodBranded<z.ZodNumber, "Feet">;
        bearing: z.ZodBranded<z.ZodNumber, "Degrees">;
        velocity: z.ZodBranded<z.ZodNumber, "Knots">;
    }, "strip", z.ZodTypeAny, {
        altitude: number & z.BRAND<"Feet">;
        waypoint: string;
        bearing: number & z.BRAND<"Degrees">;
        velocity: number & z.BRAND<"Knots">;
    }, {
        altitude: number;
        waypoint: string;
        bearing: number;
        velocity: number;
    }>, "many">;
    estimatedTimes: z.ZodObject<{
        taxiOutMinutes: z.ZodNumber;
        climbMinutes: z.ZodNumber;
        cruiseMinutes: z.ZodNumber;
        descentMinutes: z.ZodNumber;
        taxiInMinutes: z.ZodNumber;
        totalBlockMinutes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        taxiOutMinutes: number;
        climbMinutes: number;
        cruiseMinutes: number;
        descentMinutes: number;
        taxiInMinutes: number;
        totalBlockMinutes: number;
    }, {
        taxiOutMinutes: number;
        climbMinutes: number;
        cruiseMinutes: number;
        descentMinutes: number;
        taxiInMinutes: number;
        totalBlockMinutes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    flightNumber: string;
    callsign: string;
    origin: string;
    destination: string;
    alternate: string | null;
    route: string;
    aircraftType: string;
    aircraftVariant: string;
    engineVariant: string;
    registration: string;
    zeroFuelWeight: number & z.BRAND<"Pounds">;
    takeoffWeight: number & z.BRAND<"Pounds">;
    landingWeight: number & z.BRAND<"Pounds">;
    payload: number & z.BRAND<"Pounds">;
    blockFuel: number & z.BRAND<"Pounds">;
    taxiFuel: number & z.BRAND<"Pounds">;
    tripFuel: number & z.BRAND<"Pounds">;
    reserveFuel: number & z.BRAND<"Pounds">;
    plannedCruiseAltitude: number & z.BRAND<"Feet">;
    stepClimbs: {
        altitude: number & z.BRAND<"Feet">;
        waypoint: string;
    }[];
    departureElevation: number & z.BRAND<"Feet">;
    destinationElevation: number & z.BRAND<"Feet">;
    departureTemperature: number & z.BRAND<"Celsius">;
    departurePressure: number & z.BRAND<"Hectopascals">;
    windData: {
        altitude: number & z.BRAND<"Feet">;
        waypoint: string;
        bearing: number & z.BRAND<"Degrees">;
        velocity: number & z.BRAND<"Knots">;
    }[];
    estimatedTimes: {
        taxiOutMinutes: number;
        climbMinutes: number;
        cruiseMinutes: number;
        descentMinutes: number;
        taxiInMinutes: number;
        totalBlockMinutes: number;
    };
}, {
    flightNumber: string;
    callsign: string;
    origin: string;
    destination: string;
    alternate: string | null;
    route: string;
    aircraftType: string;
    aircraftVariant: string;
    engineVariant: string;
    registration: string;
    zeroFuelWeight: number;
    takeoffWeight: number;
    landingWeight: number;
    payload: number;
    blockFuel: number;
    taxiFuel: number;
    tripFuel: number;
    reserveFuel: number;
    plannedCruiseAltitude: number;
    stepClimbs: {
        altitude: number;
        waypoint: string;
    }[];
    departureElevation: number;
    destinationElevation: number;
    departureTemperature: number;
    departurePressure: number;
    windData: {
        altitude: number;
        waypoint: string;
        bearing: number;
        velocity: number;
    }[];
    estimatedTimes: {
        taxiOutMinutes: number;
        climbMinutes: number;
        cruiseMinutes: number;
        descentMinutes: number;
        taxiInMinutes: number;
        totalBlockMinutes: number;
    };
}>;
export type ValidatedFlightContext = z.infer<typeof FlightContextSchema>;
export type ValidatedEnv = z.infer<typeof envSchema>;
export type ValidatedWindPoint = z.infer<typeof windPointSchema>;
export type ValidatedStepClimbTarget = z.infer<typeof stepClimbTargetSchema>;
export type ValidatedEstimatedPhaseTimes = z.infer<typeof estimatedPhaseTimesSchema>;
//# sourceMappingURL=index.d.ts.map