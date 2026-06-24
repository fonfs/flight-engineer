export interface originalUnits {
  weight?: string;
  altitude?: string;
  temperature?: string;
  fuelFlow?: string;
  speed?: string;
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

export interface AircraftDataPackage {
  packageId: string;
  manufacturer: string;
  family: string;
  variante: string;
  engineModel: string;
  revisao: string;
  dataRevisao: string;
  unidadesOriginais: originalUnits;
  limites: Record<string, number>;
  metodoInterpolacao: 'linear' | 'bilinear';
  permitirExtrapolacao: boolean;
  referenciaFonte: string;
  checksum: string;
  tabelas: Record<string, TableDefinition>;
}

export interface PerformanceTableRevision {
  revisionId: string;
  revisionTag: string;
  aircraftType: string;
  engineVariant: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export const B747_200_JT9D_REVISION: PerformanceTableRevision = {
  revisionId: '3f7b88aa-32bb-48ff-98df-88c9bb33ee01',
  revisionTag: 'v1.0.0-initial-stub',
  aircraftType: 'B742',
  engineVariant: 'JT9D-7A',
  data: {
    climbPerformance: {},
    cruisePerformance: {},
    limits: {
      maxTakeoffWeightLbs: 830000,
      maxLandingWeightLbs: 564000,
      maxZeroFuelWeightLbs: 490000,
    }
  },
  createdAt: new Date('2026-06-24T00:00:00Z'),
};
