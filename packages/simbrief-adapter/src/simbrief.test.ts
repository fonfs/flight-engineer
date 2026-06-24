import { describe, it, expect } from 'vitest';
import { parseAndNormalizeSimBrief } from './index.js';
import fixture from './simbrief.fixture.json';

describe('SimBrief Adapter normalization tests', () => {
  it('correctly maps the valid fixture to internal FlightContext', () => {
    const result = parseAndNormalizeSimBrief(fixture);
    expect(result.warnings).toContain('SimBrief OFP uses LBS. Weights were normalized to KGS internally.');
    expect(result.flightContext.flightNumber).toBe('RG860');
    expect(result.flightContext.callsign).toBe('VRGRG860');
    expect(result.flightContext.origin).toBe('SBGL');
    expect(result.flightContext.destination).toBe('KJFK');
    expect(result.flightContext.alternate).toBe('KEWR');
    // 448000 Lbs / 2.20462 = 203209.62... kg
    expect(result.flightContext.zeroFuelWeight).toBeCloseTo(203209.62, 1);
    expect(result.flightContext.plannedCruiseAltitude).toBe(33000); // Ft
    expect(result.flightContext.windData.length).toBe(1);
    expect(result.flightContext.windData[0].waypoint).toBe('VUGAX');
    expect(result.flightContext.windData[0].bearing).toBe(270);
    expect(result.flightContext.windData[0].velocity).toBe(45);
  });

  it('normalizes weights from KGS and generates no warning', () => {
    const kgsFixture = {
      ...fixture,
      params: { units: 'kgs' },
      weights: {
        est_zfw: '200000', // kgs
        est_tow: '320000',
        est_ldw: '240000',
        payload: '30000',
      },
    };

    const result = parseAndNormalizeSimBrief(kgsFixture);
    expect(result.warnings.length).toBe(0);
    expect(result.flightContext.zeroFuelWeight).toBe(200000);
  });

  it('handles null alternate correctly', () => {
    const noAltFixture = {
      ...fixture,
      alternate: null,
    };
    const result = parseAndNormalizeSimBrief(noAltFixture);
    expect(result.flightContext.alternate).toBeNull();
  });

  it('captures incomplete navlog data and logs warnings', () => {
    const incompleteFixture = {
      ...fixture,
      navlog: {
        fix: [
          {
            ident: 'XYZ',
            // Missing wind speed and direction
          },
        ],
      },
    };
    const result = parseAndNormalizeSimBrief(incompleteFixture);
    expect(result.warnings).toContain('Fix XYZ has incomplete wind data. Omitted.');
    expect(result.flightContext.windData.length).toBe(0);
  });
});
