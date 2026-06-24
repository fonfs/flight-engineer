import { z } from 'zod';

// Environment variables schema
export const envSchema = z.object({
  SIMBRIEF_API_URL: z.string().url().default('https://www.simbrief.com/api/xmlfeed.php'),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Performance Matrix Table Schema
export const PerformanceTableSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  revision: z.string().min(1),
  source: z.string().min(1),
  sourceDate: z.string().min(1),
  aircraft: z.string().min(1),
  variant: z.string().min(1),
  engine: z.string().min(1),
  units: z.record(z.string()),
  interpolation: z.enum(['linear', 'bilinear']),
  extrapolationAllowed: z.boolean(),
  axes: z.object({
    rows: z.object({
      name: z.string().min(1),
      unit: z.string().min(1),
      values: z.array(z.number().finite())
    }),
    columns: z.object({
      name: z.string().min(1),
      unit: z.string().min(1),
      values: z.array(z.number().finite())
    })
  }),
  result: z.object({
    name: z.string().min(1),
    unit: z.string().min(1)
  }),
  values: z.array(z.array(z.number().finite()))
}).refine(data => {
  const rowCount = data.axes.rows.values.length;
  const colCount = data.axes.columns.values.length;
  if (data.values.length !== rowCount) {
    return false;
  }
  return data.values.every(row => row.length === colCount);
}, {
  message: "Values matrix dimensions must match axes dimensions (rows count and columns count)."
});

// Performance Vector Schema
export const PerformanceVectorSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  revision: z.string().min(1),
  source: z.string().min(1),
  sourceDate: z.string().min(1),
  aircraft: z.string().min(1),
  variant: z.string().min(1),
  engine: z.string().min(1),
  units: z.record(z.string()),
  interpolation: z.enum(['linear']),
  extrapolationAllowed: z.boolean(),
  axis: z.object({
    name: z.string().min(1),
    unit: z.string().min(1),
    values: z.array(z.number().finite())
  }),
  result: z.object({
    name: z.string().min(1),
    unit: z.string().min(1)
  }),
  values: z.array(z.number().finite())
}).refine(data => {
  return data.values.length === data.axis.values.length;
}, {
  message: "Values length must match axis values length."
});

export type ValidatedPerformanceTable = z.infer<typeof PerformanceTableSchema>;
export type ValidatedPerformanceVector = z.infer<typeof PerformanceVectorSchema>;

// Domain primitives schemas
export const poundsSchema = z.number().brand<'Pounds'>();
export const kilogramsSchema = z.number().brand<'Kilograms'>();
export const feetSchema = z.number().brand<'Feet'>();
export const celsiusSchema = z.number().brand<'Celsius'>();
export const hectopascalsSchema = z.number().brand<'Hectopascals'>();
export const degreesSchema = z.number().min(0).max(360).brand<'Degrees'>();
export const knotsSchema = z.number().nonnegative().brand<'Knots'>();

// Composite schemas
export const stepClimbTargetSchema = z.object({
  altitude: feetSchema,
  waypoint: z.string().min(1),
});

export const windPointSchema = z.object({
  waypoint: z.string().min(1),
  altitude: feetSchema,
  bearing: degreesSchema,
  velocity: knotsSchema,
});

export const estimatedPhaseTimesSchema = z.object({
  taxiOutMinutes: z.number().nonnegative(),
  climbMinutes: z.number().nonnegative(),
  cruiseMinutes: z.number().nonnegative(),
  descentMinutes: z.number().nonnegative(),
  taxiInMinutes: z.number().nonnegative(),
  totalBlockMinutes: z.number().nonnegative(),
});

// FlightContext schema verifying all 26 mandatory fields
export const FlightContextSchema = z.object({
  flightNumber: z.string().min(1),
  callsign: z.string().min(1),
  origin: z.string().length(4),
  destination: z.string().length(4),
  alternate: z.string().length(4).nullable(),
  route: z.string().min(1),
  aircraftType: z.string().min(1),
  aircraftVariant: z.string().min(1),
  engineVariant: z.string().min(1),
  registration: z.string().min(1),
  zeroFuelWeight: kilogramsSchema,
  takeoffWeight: kilogramsSchema,
  landingWeight: kilogramsSchema,
  payload: kilogramsSchema,
  blockFuel: kilogramsSchema,
  taxiFuel: kilogramsSchema,
  tripFuel: kilogramsSchema,
  reserveFuel: kilogramsSchema,
  plannedCruiseAltitude: feetSchema,
  stepClimbs: z.array(stepClimbTargetSchema),
  departureElevation: feetSchema,
  destinationElevation: feetSchema,
  departureTemperature: celsiusSchema,
  departurePressure: hectopascalsSchema,
  windData: z.array(windPointSchema),
  estimatedTimes: estimatedPhaseTimesSchema,
});

export type ValidatedFlightContext = z.infer<typeof FlightContextSchema>;
export type ValidatedEnv = z.infer<typeof envSchema>;
export type ValidatedWindPoint = z.infer<typeof windPointSchema>;
export type ValidatedStepClimbTarget = z.infer<typeof stepClimbTargetSchema>;
export type ValidatedEstimatedPhaseTimes = z.infer<typeof estimatedPhaseTimesSchema>;
