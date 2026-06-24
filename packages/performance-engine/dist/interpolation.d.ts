import { TableDefinition } from '@classic-flight-engineer/aircraft-data';
export interface InterpolationSuccess {
    status: 'success';
    value: number;
}
export interface OutOfBoundsError {
    status: 'error';
    reason: 'out_of_bounds';
    variableName: string;
    value: number;
    minAllowed: number;
    maxAllowed: number;
    unit: string;
    tableName: string;
    packageRevision: string;
}
export interface IncompleteTableError {
    status: 'error';
    reason: 'incomplete_table';
    tableName: string;
}
export type InterpolationResult = InterpolationSuccess | OutOfBoundsError | IncompleteTableError;
/**
 * Finds the index interval containing the input value in a sorted grid.
 * Returns the lower index `i` such that grid[i] <= val <= grid[i+1].
 */
export declare function findInterval(grid: number[], value: number): {
    lowerIdx: number;
    upperIdx: number;
};
/**
 * Linear 1D interpolation helper.
 */
export declare function interpolate1D(x0: number, x1: number, z0: number, z1: number, x: number): number;
/**
 * 1D linear table interpolation with strict boundary checking.
 */
export declare function interpolateTable1D(table: TableDefinition, xValue: number, packageRevision: string, unit?: string): InterpolationResult;
/**
 * Bilinear 2D table interpolation with strict boundary checking on both axes.
 */
export declare function interpolateTable2D(table: TableDefinition, xValue: number, yValue: number, packageRevision: string, xUnit?: string, yUnit?: string): InterpolationResult;
//# sourceMappingURL=interpolation.d.ts.map