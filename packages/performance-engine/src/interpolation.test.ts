import { describe, it, expect } from 'vitest';
import { TableDefinition } from '@classic-flight-engineer/aircraft-data';
import { interpolateTable1D, interpolateTable2D } from './interpolation.js';

describe('Interpolation System Golden Tests', () => {
  const mockTable1D: TableDefinition = {
    name: 'DEMONSTRATION DATA - NOT FOR OPERATIONAL USE (Takeoff EPR)',
    xKey: 'Temperature',
    zKey: 'EPR',
    xGrid: [0, 10, 20, 30, 40],
    zValues: [2.10, 2.05, 1.98, 1.90, 1.80],
  };

  const mockTable2D: TableDefinition = {
    name: 'DEMONSTRATION DATA - NOT FOR OPERATIONAL USE (Climb Fuel Burn)',
    xKey: 'Weight',
    yKey: 'Altitude',
    zKey: 'FuelBurn',
    xGrid: [500000, 600000, 700000],
    yGrid: [10000, 20000, 30000],
    zValues: [
      [3000, 3600, 4200], // y = 10000
      [5800, 6900, 8000], // y = 20000
      [8500, 10100, 11800], // y = 30000
    ],
  };

  const rev = 'v1.0.0-demo';

  // 1D Tests
  it('interpolates exactly on the lower limit', () => {
    const res = interpolateTable1D(mockTable1D, 0, rev, 'C');
    expect(res).toEqual({ status: 'success', value: 2.10 });
  });

  it('interpolates exactly on the upper limit', () => {
    const res = interpolateTable1D(mockTable1D, 40, rev, 'C');
    expect(res).toEqual({ status: 'success', value: 1.80 });
  });

  it('interpolates exactly at a grid point', () => {
    const res = interpolateTable1D(mockTable1D, 20, rev, 'C');
    expect(res).toEqual({ status: 'success', value: 1.98 });
  });

  it('interpolates at an intermediate point', () => {
    const res = interpolateTable1D(mockTable1D, 15, rev, 'C');
    // mid between 2.05 and 1.98 = 2.015
    expect(res.status).toBe('success');
    if (res.status === 'success') {
      expect(res.value).toBeCloseTo(2.015, 3);
    }
  });

  it('blocks values below table boundaries', () => {
    const res = interpolateTable1D(mockTable1D, -5, rev, 'C');
    expect(res).toEqual({
      status: 'error',
      reason: 'out_of_bounds',
      variableName: 'Temperature',
      value: -5,
      minAllowed: 0,
      maxAllowed: 40,
      unit: 'C',
      tableName: mockTable1D.name,
      packageRevision: rev,
    });
  });

  it('blocks values above table boundaries', () => {
    const res = interpolateTable1D(mockTable1D, 45, rev, 'C');
    expect(res).toEqual({
      status: 'error',
      reason: 'out_of_bounds',
      variableName: 'Temperature',
      value: 45,
      minAllowed: 0,
      maxAllowed: 40,
      unit: 'C',
      tableName: mockTable1D.name,
      packageRevision: rev,
    });
  });

  // 2D Tests
  it('interpolates bilinear point correctly', () => {
    // Weight = 550000, Altitude = 15000
    // x values are 500000 and 600000. y values are 10000 and 20000.
    // At y=10000: z00=3000, z01=3600 -> rx1 = 3300
    // At y=20000: z10=5800, z11=6900 -> rx2 = 6350
    // Interpolating y=15000 between rx1=3300 and rx2=6350 -> 4825
    const res = interpolateTable2D(mockTable2D, 550000, 15000, rev, 'lbs', 'ft');
    expect(res.status).toBe('success');
    if (res.status === 'success') {
      expect(res.value).toBeCloseTo(4825, 1);
    }
  });

  it('blocks 2D values out of X bounds', () => {
    const res = interpolateTable2D(mockTable2D, 450000, 15000, rev, 'lbs', 'ft');
    expect(res.status).toBe('error');
    if (res.status === 'error' && res.reason === 'out_of_bounds') {
      expect(res.variableName).toBe('Weight');
      expect(res.value).toBe(450000);
    }
  });

  it('blocks 2D values out of Y bounds', () => {
    const res = interpolateTable2D(mockTable2D, 550000, 35000, rev, 'lbs', 'ft');
    expect(res.status).toBe('error');
    if (res.status === 'error' && res.reason === 'out_of_bounds') {
      expect(res.variableName).toBe('Altitude');
      expect(res.value).toBe(35000);
    }
  });
});
