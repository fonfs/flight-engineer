import { Kilograms, Feet, Celsius, Hectopascals, Degrees, Knots } from '@classic-flight-engineer/unit-system';

export interface StepClimbTarget {
  altitude: Feet;
  waypoint: string;
}

export interface WindPoint {
  waypoint: string;
  altitude: Feet;
  bearing: Degrees;
  velocity: Knots;
}

export interface EstimatedPhaseTimes {
  taxiOutMinutes: number;
  climbMinutes: number;
  cruiseMinutes: number;
  descentMinutes: number;
  taxiInMinutes: number;
  totalBlockMinutes: number;
}

export interface FlightContext {
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
  zeroFuelWeight: Kilograms;
  takeoffWeight: Kilograms;
  landingWeight: Kilograms;
  payload: Kilograms;
  blockFuel: Kilograms;
  taxiFuel: Kilograms;
  tripFuel: Kilograms;
  reserveFuel: Kilograms;
  plannedCruiseAltitude: Feet;
  stepClimbs: StepClimbTarget[];
  departureElevation: Feet;
  destinationElevation: Feet;
  departureTemperature: Celsius;
  departurePressure: Hectopascals;
  windData: WindPoint[];
  estimatedTimes: EstimatedPhaseTimes;
}
