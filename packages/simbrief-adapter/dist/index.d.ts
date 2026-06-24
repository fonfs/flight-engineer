import { FlightContext } from '@classic-flight-engineer/aviation-domain';
export interface SimBriefAdapterResult {
    flightContext: FlightContext;
    warnings: string[];
}
/**
 * Parses and normalizes raw SimBrief JSON data to an internal FlightContext,
 * converting weights from KGS to LBS if necessary, and tracking validation/normalization warnings.
 */
export declare function parseAndNormalizeSimBrief(raw: any): SimBriefAdapterResult;
//# sourceMappingURL=index.d.ts.map