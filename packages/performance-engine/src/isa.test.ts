import { describe, it, expect } from 'vitest';
import { calculateISA, speedOfSoundKnots } from './isa.js';
import { asFeet, asCelsius } from '@classic-flight-engineer/aviation-domain';

describe('ISA Atmospheric Calculations', () => {
  it('calculates sea level standard temperature correctly', () => {
    const seaLevel = calculateISA(asFeet(0), asCelsius(15));
    expect(seaLevel.standardTempC).toBeCloseTo(15, 1);
    expect(seaLevel.deltaTempC).toBeCloseTo(0, 1);
    expect(seaLevel.pressureHpa).toBeCloseTo(1013.25, 1);
  });

  it('calculates troposphere values at FL300 standard conditions', () => {
    // Standard temp at 30,000ft is approx -44.4°C
    const fl300 = calculateISA(asFeet(30000), asCelsius(-44.4));
    expect(fl300.standardTempC).toBeCloseTo(-44.4, 1);
    expect(fl300.deltaTempC).toBeCloseTo(0, 1);
  });

  it('computes speed of sound correctly at 15°C', () => {
    const soundSpeed = speedOfSoundKnots(asCelsius(15));
    expect(soundSpeed).toBeCloseTo(661.5, 1); // 661.5 knots
  });
});
