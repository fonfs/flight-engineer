"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInterval = findInterval;
exports.interpolate1D = interpolate1D;
exports.interpolateTable1D = interpolateTable1D;
exports.interpolateTable2D = interpolateTable2D;
/**
 * Finds the index interval containing the input value in a sorted grid.
 * Returns the lower index `i` such that grid[i] <= val <= grid[i+1].
 */
function findInterval(grid, value) {
    if (grid.length < 2) {
        throw new Error('Grid must contain at least 2 points.');
    }
    // Exact bounds or out of bounds checks are handled caller-side,
    // but let's locate nearest enclosing interval safely.
    for (let i = 0; i < grid.length - 1; i++) {
        if (value >= grid[i] && value <= grid[i + 1]) {
            return { lowerIdx: i, upperIdx: i + 1 };
        }
    }
    // Fallbacks if floating precision is slightly off
    if (value < grid[0]) {
        return { lowerIdx: 0, upperIdx: 1 };
    }
    return { lowerIdx: grid.length - 2, upperIdx: grid.length - 1 };
}
/**
 * Linear 1D interpolation helper.
 */
function interpolate1D(x0, x1, z0, z1, x) {
    if (x0 === x1)
        return z0;
    return z0 + ((x - x0) / (x1 - x0)) * (z1 - z0);
}
/**
 * 1D linear table interpolation with strict boundary checking.
 */
function interpolateTable1D(table, xValue, packageRevision, unit = 'unknown') {
    const { xGrid, zValues, name } = table;
    if (!xGrid || !zValues || xGrid.length === 0 || zValues.length === 0) {
        return { status: 'error', reason: 'incomplete_table', tableName: name };
    }
    const minX = xGrid[0];
    const maxX = xGrid[xGrid.length - 1];
    if (xValue < minX || xValue > maxX) {
        return {
            status: 'error',
            reason: 'out_of_bounds',
            variableName: table.xKey,
            value: xValue,
            minAllowed: minX,
            maxAllowed: maxX,
            unit,
            tableName: name,
            packageRevision,
        };
    }
    // Exact bounds check
    if (xValue === minX)
        return { status: 'success', value: zValues[0] };
    if (xValue === maxX)
        return { status: 'success', value: zValues[zValues.length - 1] };
    const { lowerIdx, upperIdx } = findInterval(xGrid, xValue);
    const z0 = zValues[lowerIdx];
    const z1 = zValues[upperIdx];
    if (typeof z0 !== 'number' || typeof z1 !== 'number') {
        return { status: 'error', reason: 'incomplete_table', tableName: name };
    }
    const value = interpolate1D(xGrid[lowerIdx], xGrid[upperIdx], z0, z1, xValue);
    return { status: 'success', value };
}
/**
 * Bilinear 2D table interpolation with strict boundary checking on both axes.
 */
function interpolateTable2D(table, xValue, yValue, packageRevision, xUnit = 'unknown', yUnit = 'unknown') {
    const { xGrid, yGrid, zValues, name } = table;
    if (!xGrid || !yGrid || !zValues || xGrid.length === 0 || yGrid.length === 0) {
        return { status: 'error', reason: 'incomplete_table', tableName: name };
    }
    // Check X boundaries
    const minX = xGrid[0];
    const maxX = xGrid[xGrid.length - 1];
    if (xValue < minX || xValue > maxX) {
        return {
            status: 'error',
            reason: 'out_of_bounds',
            variableName: table.xKey,
            value: xValue,
            minAllowed: minX,
            maxAllowed: maxX,
            unit: xUnit,
            tableName: name,
            packageRevision,
        };
    }
    // Check Y boundaries
    const minY = yGrid[0];
    const maxY = yGrid[yGrid.length - 1];
    if (yValue < minY || yValue > maxY) {
        return {
            status: 'error',
            reason: 'out_of_bounds',
            variableName: table.yKey || 'Y',
            value: yValue,
            minAllowed: minY,
            maxAllowed: maxY,
            unit: yUnit,
            tableName: name,
            packageRevision,
        };
    }
    const { lowerIdx: xi0, upperIdx: xi1 } = findInterval(xGrid, xValue);
    const { lowerIdx: yi0, upperIdx: yi1 } = findInterval(yGrid, yValue);
    // Z values should be indexed as [yIndex][xIndex] or [xIndex][yIndex]
    // We assume zValues[yIndex][xIndex] matching common row/column grid representation
    const matrix = zValues;
    if (!matrix[yi0] || !matrix[yi1]) {
        return { status: 'error', reason: 'incomplete_table', tableName: name };
    }
    const z00 = matrix[yi0][xi0];
    const z01 = matrix[yi0][xi1];
    const z10 = matrix[yi1][xi0];
    const z11 = matrix[yi1][xi1];
    if (typeof z00 !== 'number' ||
        typeof z01 !== 'number' ||
        typeof z10 !== 'number' ||
        typeof z11 !== 'number') {
        return { status: 'error', reason: 'incomplete_table', tableName: name };
    }
    // Bilinear interpolation
    const r1 = interpolate1D(xGrid[xi0], xGrid[xi1], z00, z01, xValue);
    const r2 = interpolate1D(xGrid[xi0], xGrid[xi1], z10, z11, xValue);
    const value = interpolate1D(yGrid[yi0], yGrid[yi1], r1, r2, yValue);
    return { status: 'success', value };
}
//# sourceMappingURL=interpolation.js.map