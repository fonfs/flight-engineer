"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndNormalizeSimBrief = parseAndNormalizeSimBrief;
const aviation_domain_1 = require("@classic-flight-engineer/aviation-domain");
/**
 * Parses and normalizes raw SimBrief JSON data to an internal FlightContext,
 * converting weights from KGS to LBS if necessary, and tracking validation/normalization warnings.
 */
function parseAndNormalizeSimBrief(raw) {
    const warnings = [];
    if (!raw || typeof raw !== 'object') {
        throw new Error('Invalid SimBrief payload structure');
    }
    const general = raw.general || {};
    const weights = raw.weights || {};
    const fuel = raw.fuel || {};
    const origin = raw.origin || {};
    const destination = raw.destination || {};
    const weather = raw.weather || {};
    const times = raw.times || {};
    const units = raw.params?.units || 'lbs'; // SimBrief unit preference
    // Weights parsing & normalization to Pounds
    const rawZfw = Number(weights.est_zfw || 0);
    const rawTow = Number(weights.est_tow || 0);
    const rawLdw = Number(weights.est_ldw || 0);
    const rawPayload = Number(weights.payload || 0);
    const rawBlock = Number(fuel.plan_ramp || 0);
    const rawTaxi = Number(fuel.taxi || 0);
    const rawTrip = Number(fuel.enroute_burn || 0);
    const rawReserve = Number(fuel.reserve || 0);
    let zfw;
    let tow;
    let ldw;
    let payload;
    let blockFuel;
    let taxiFuel;
    let tripFuel;
    let reserveFuel;
    if (units.toLowerCase() === 'kgs') {
        warnings.push('SimBrief OFP uses KGS. Weights were normalized to LBS internally.');
        zfw = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawZfw));
        tow = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawTow));
        ldw = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawLdw));
        payload = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawPayload));
        blockFuel = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawBlock));
        taxiFuel = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawTaxi));
        tripFuel = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawTrip));
        reserveFuel = (0, aviation_domain_1.kgToLbs)((0, aviation_domain_1.asKilograms)(rawReserve));
    }
    else {
        zfw = (0, aviation_domain_1.asPounds)(rawZfw);
        tow = (0, aviation_domain_1.asPounds)(rawTow);
        ldw = (0, aviation_domain_1.asPounds)(rawLdw);
        payload = (0, aviation_domain_1.asPounds)(rawPayload);
        blockFuel = (0, aviation_domain_1.asPounds)(rawBlock);
        taxiFuel = (0, aviation_domain_1.asPounds)(rawTaxi);
        tripFuel = (0, aviation_domain_1.asPounds)(rawTrip);
        reserveFuel = (0, aviation_domain_1.asPounds)(rawReserve);
    }
    // Parse Stepclimbs if available
    const stepClimbsList = [];
    const rawStepclimbs = general.stepclimb || '';
    if (rawStepclimbs) {
        // E.g., VUGAX/F330
        const parts = rawStepclimbs.split(',');
        for (const part of parts) {
            const match = part.trim().match(/([A-Z0-9]+)\/F([0-9]+)/);
            if (match) {
                stepClimbsList.push({
                    waypoint: match[1],
                    altitude: (0, aviation_domain_1.asFeet)(Number(match[2]) * 100),
                });
            }
        }
    }
    // Parse Wind/Navlog Data
    const windDataList = [];
    const navlogFixes = raw.navlog?.fix || [];
    for (const fix of navlogFixes) {
        if (fix.ident && fix.wind_dir && fix.wind_spd) {
            windDataList.push({
                waypoint: fix.ident,
                altitude: (0, aviation_domain_1.asFeet)(Number(fix.fl || 0) * 100),
                bearing: (0, aviation_domain_1.asDegrees)(Number(fix.wind_dir)),
                velocity: (0, aviation_domain_1.asKnots)(Number(fix.wind_spd)),
            });
        }
        else {
            warnings.push(`Fix ${fix.ident || 'unknown'} has incomplete wind data. Omitted.`);
        }
    }
    const flightContext = {
        flightNumber: general.flight_number || '',
        callsign: (general.icao_airline || '') + (general.flight_number || ''),
        origin: origin.icao_code || '',
        destination: destination.icao_code || '',
        alternate: raw.alternate?.icao_code || null,
        route: general.route || '',
        aircraftType: raw.aircraft?.icao_code || 'B742',
        aircraftVariant: raw.aircraft?.name || '',
        engineVariant: raw.aircraft?.engine_type || '',
        registration: raw.aircraft?.reg || '',
        zeroFuelWeight: zfw,
        takeoffWeight: tow,
        landingWeight: ldw,
        payload,
        blockFuel,
        taxiFuel,
        tripFuel,
        reserveFuel,
        plannedCruiseAltitude: (0, aviation_domain_1.asFeet)(Number(general.initial_altitude || 0)),
        stepClimbs: stepClimbsList,
        departureElevation: (0, aviation_domain_1.asFeet)(Number(origin.elevation || 0)),
        destinationElevation: (0, aviation_domain_1.asFeet)(Number(destination.elevation || 0)),
        departureTemperature: (0, aviation_domain_1.asCelsius)(Number(weather.departure_temp || 15)),
        departurePressure: (0, aviation_domain_1.asHectopascals)(Number(weather.departure_qnh || 1013.25)),
        windData: windDataList,
        estimatedTimes: {
            taxiOutMinutes: Number(times.taxi_out || 0),
            climbMinutes: Number(times.climb || 0),
            cruiseMinutes: Number(times.cruise || 0),
            descentMinutes: Number(times.descent || 0),
            taxiInMinutes: Number(times.taxi_in || 0),
            totalBlockMinutes: Number(times.est_block || 0),
        },
    };
    // Run validation checks on required values
    if (!flightContext.origin)
        warnings.push('Origin airport ICAO missing.');
    if (!flightContext.destination)
        warnings.push('Destination airport ICAO missing.');
    if (flightContext.takeoffWeight === 0)
        warnings.push('Estimated takeoff weight is zero.');
    return {
        flightContext,
        warnings,
    };
}
//# sourceMappingURL=index.js.map