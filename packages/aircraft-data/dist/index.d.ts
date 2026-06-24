export interface originalUnits {
    weight?: string;
    altitude?: string;
    temperature?: string;
    fuelFlow?: string;
    speed?: string;
}
export interface TableDefinition {
    name: string;
    xKey: string;
    yKey?: string;
    zKey: string;
    xGrid: number[];
    yGrid?: number[];
    zValues: number[] | number[][];
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
export declare const B747_200_JT9D_REVISION: PerformanceTableRevision;
//# sourceMappingURL=index.d.ts.map