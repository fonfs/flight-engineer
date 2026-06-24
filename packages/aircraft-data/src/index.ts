import { 
  PerformanceTableSchema, 
  PerformanceVectorSchema, 
  ValidatedPerformanceTable, 
  ValidatedPerformanceVector 
} from '@classic-flight-engineer/validation';

import { aircraftMetadata } from './boeing-747-200/aircraft';
import { variant747_200b } from './boeing-747-200/variants/747-200b';
import { variant747_200f } from './boeing-747-200/variants/747-200f';
import { jt9dMetadata } from './boeing-747-200/engines/jt9d/metadata';
import { climbPerformanceTable } from './boeing-747-200/engines/jt9d/climb';
import { takeoffPerformanceTable } from './boeing-747-200/engines/jt9d/takeoff';
import { cruisePerformanceTable } from './boeing-747-200/engines/jt9d/cruise';
import { descentPerformanceTable } from './boeing-747-200/engines/jt9d/descent';
import { landingPerformanceTable } from './boeing-747-200/engines/jt9d/landing';
import { speedSchedulesTable } from './boeing-747-200/engines/jt9d/speed-schedules';

// Perform structural Zod validation on load to fail early during build/dev
const validatedClimb = PerformanceTableSchema.parse(climbPerformanceTable);
const validatedTakeoff = PerformanceTableSchema.parse(takeoffPerformanceTable);
const validatedCruise = PerformanceTableSchema.parse(cruisePerformanceTable);
const validatedDescent = PerformanceTableSchema.parse(descentPerformanceTable);
const validatedLanding = PerformanceTableSchema.parse(landingPerformanceTable);
const validatedSpeedSchedules = PerformanceVectorSchema.parse(speedSchedulesTable);

// Aggregated tables registry
const performanceTablesRegistry: Record<string, ValidatedPerformanceTable | ValidatedPerformanceVector> = {
  [validatedClimb.id]: validatedClimb,
  [validatedTakeoff.id]: validatedTakeoff,
  [validatedCruise.id]: validatedCruise,
  [validatedDescent.id]: validatedDescent,
  [validatedLanding.id]: validatedLanding,
  [validatedSpeedSchedules.id]: validatedSpeedSchedules,
};

// Available variants & engines mapping
const aircraftVariants = [variant747_200b, variant747_200f];
const engineMetadataMap: Record<string, any> = {
  "JT9D": jt9dMetadata,
};

export interface AircraftVariantInfo {
  id: string;
  name: string;
  type: string;
  maxTakeoffWeightKg: number;
  maxLandingWeightKg: number;
  maxZeroFuelWeightKg: number;
}

export interface EngineVariantInfo {
  engineModel: string;
  revisao: string;
  dataRevisao: string;
  referenciaFonte: string;
  limites: Record<string, number>;
}

/**
 * Returns all configured aircraft variants.
 */
export function getAircraftVariants(): readonly AircraftVariantInfo[] {
  return aircraftVariants;
}

/**
 * Returns available engine variants for a given aircraft variant name/ID.
 */
export function getEngineVariants(aircraftVariant: string): readonly EngineVariantInfo[] {
  const normalized = aircraftVariant.toLowerCase();
  if (normalized.includes('747-200') || normalized.includes('b742')) {
    return [jt9dMetadata];
  }
  return [];
}

/**
 * Returns list of available performance table IDs for the given aircraft/engine configuration.
 */
export function getAvailablePerformanceTables(aircraftVariant: string, engineVariant: string): readonly string[] {
  return Object.keys(performanceTablesRegistry).filter(id => {
    const table = performanceTablesRegistry[id];
    return (
      table.aircraft.toLowerCase().includes('747-200') &&
      table.engine.toLowerCase().includes(engineVariant.toLowerCase().split('-')[0])
    );
  });
}

/**
 * Retrieves the performance table or vector by its unique ID.
 */
export function getPerformanceTable(tableId: string): ValidatedPerformanceTable | ValidatedPerformanceVector | undefined {
  return performanceTablesRegistry[tableId];
}

export interface TableDefinition {
  name: string;
  xKey: string;      // Independent variable (e.g. Weight)
  yKey?: string;     // Secondary independent variable (optional, for 2D bilinear)
  zKey: string;      // Dependent output value (e.g. V-speed, EPR)
  xGrid: number[];   // Array of independent x values (sorted ascending)
  yGrid?: number[];  // Array of independent y values (sorted ascending)
  zValues: number[] | number[][]; // Output matrix matching grid lengths
}
