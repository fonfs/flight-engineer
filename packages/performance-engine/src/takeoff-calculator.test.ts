import { describe, it, expect } from 'vitest';
import { calculateTakeoffPerformance } from './takeoff-calculator';
import { 
  asFeet, 
  asCelsius, 
  asPounds, 
  asHectopascals, 
  asKnots 
} from '@classic-flight-engineer/unit-system';

describe('B747-200 PW Takeoff Derate Calculator', () => {
  it('calculates performance correctly at sea level, standard temp (60°F / 15.6°C), dry runway', () => {
    // 300 metric tons = 661386 lbs
    const result = calculateTakeoffPerformance(
      asFeet(0),
      asHectopascals(1013.25),
      asCelsius(15.56),
      asPounds(661386),
      asFeet(9491),
      10,      // flaps
      false,   // packs off
      true,    // dry
      asKnots(0),
      asKnots(0),
      false,   // mel/cdl
      false,   // windshear
      0        // slope
    );

    expect(result.PA_ft).toBeCloseTo(0, 0);
    expect(result.OAT_F).toBeCloseTo(60, 1);
    expect(result.MAX_EPR).toBe(1.59);
    expect(result.DERATE_ALLOWED).toBe(true);
    expect(result.ASSUMED_TEMP_F).toBeGreaterThanOrEqual(60);
    expect(result.REDUCED_EPR).toBeLessThanOrEqual(result.MAX_EPR!);
    expect(result.V1).toBeGreaterThanOrEqual(110);
    expect(result.V2).toBeGreaterThanOrEqual(130);
  });

  it('restricts derate if runway length is too short', () => {
    const result = calculateTakeoffPerformance(
      asFeet(0),
      asHectopascals(1013.25),
      asCelsius(15.56),
      asPounds(661386),
      asFeet(6000), // Below 7000 ft minimum
      10,
      false,
      true,
      asKnots(0),
      asKnots(0),
      false,
      false,
      0
    );

    expect(result.DERATE_ALLOWED).toBe(false);
    expect(result.RESTRICTION_REASONS).toContain("Runway length 6000ft below minimum (7000ft)");
  });

  it('restricts derate when runway is wet', () => {
    const result = calculateTakeoffPerformance(
      asFeet(0),
      asHectopascals(1013.25),
      asCelsius(15.56),
      asPounds(661386),
      asFeet(9491),
      10,
      false,
      false, // Wet runway
      asKnots(0),
      asKnots(0),
      false,
      false,
      0
    );

    expect(result.DERATE_ALLOWED).toBe(false);
    expect(result.RESTRICTION_REASONS).toContain("Runway must be dry (grooved runway is considered dry)");
  });
});
