import {
  FlightContext,
  asPounds,
  asFeet,
  asCelsius,
  asHectopascals,
  asDegrees,
  asKnots,
  Kilograms,
  lbsToKg,
  asKilograms
} from '@classic-flight-engineer/aviation-domain';

export interface SimBriefAdapterResult {
  flightContext: FlightContext;
  warnings: string[];
}

/**
 * Parses and normalizes raw SimBrief JSON data to an internal FlightContext,
 * converting weights from LBS to KGS if necessary, and tracking validation/normalization warnings.
 */
export function parseAndNormalizeSimBrief(raw: any): SimBriefAdapterResult {
  const warnings: string[] = [];

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

  // Weights parsing & normalization to Kilograms
  const rawZfw = Number(weights.est_zfw || 0);
  const rawTow = Number(weights.est_tow || 0);
  const rawLdw = Number(weights.est_ldw || 0);
  const rawPayload = Number(weights.payload || 0);

  const rawBlock = Number(fuel.plan_ramp || 0);
  const rawTaxi = Number(fuel.taxi || 0);
  const rawTrip = Number(fuel.enroute_burn || 0);
  const rawReserve = Number(fuel.reserve || 0);

  let zfw: Kilograms;
  let tow: Kilograms;
  let ldw: Kilograms;
  let payload: Kilograms;
  let blockFuel: Kilograms;
  let taxiFuel: Kilograms;
  let tripFuel: Kilograms;
  let reserveFuel: Kilograms;

  if (units.toLowerCase() === 'lbs') {
    warnings.push('SimBrief OFP uses LBS. Weights were normalized to KGS internally.');
    zfw = lbsToKg(asPounds(rawZfw));
    tow = lbsToKg(asPounds(rawTow));
    ldw = lbsToKg(asPounds(rawLdw));
    payload = lbsToKg(asPounds(rawPayload));
    blockFuel = lbsToKg(asPounds(rawBlock));
    taxiFuel = lbsToKg(asPounds(rawTaxi));
    tripFuel = lbsToKg(asPounds(rawTrip));
    reserveFuel = lbsToKg(asPounds(rawReserve));
  } else {
    zfw = asKilograms(rawZfw);
    tow = asKilograms(rawTow);
    ldw = asKilograms(rawLdw);
    payload = asKilograms(rawPayload);
    blockFuel = asKilograms(rawBlock);
    taxiFuel = asKilograms(rawTaxi);
    tripFuel = asKilograms(rawTrip);
    reserveFuel = asKilograms(rawReserve);
  }

  // Parse Stepclimbs if available
  const stepClimbsList: any[] = [];
  const rawStepclimbs = general.stepclimb || '';
  if (rawStepclimbs) {
    // E.g., VUGAX/F330
    const parts = rawStepclimbs.split(',');
    for (const part of parts) {
      const match = part.trim().match(/([A-Z0-9]+)\/F([0-9]+)/);
      if (match) {
        stepClimbsList.push({
          waypoint: match[1],
          altitude: asFeet(Number(match[2]) * 100),
        });
      }
    }
  }

  // Parse Wind/Navlog Data
  const windDataList: any[] = [];
  const navlogFixes = raw.navlog?.fix || [];
  for (const fix of navlogFixes) {
    if (fix.ident && fix.wind_dir && fix.wind_spd) {
      windDataList.push({
        waypoint: fix.ident,
        altitude: asFeet(Number(fix.fl || 0) * 100),
        bearing: asDegrees(Number(fix.wind_dir)),
        velocity: asKnots(Number(fix.wind_spd)),
      });
    } else {
      warnings.push(`Fix ${fix.ident || 'unknown'} has incomplete wind data. Omitted.`);
    }
  }

  const flightContext: FlightContext = {
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
    plannedCruiseAltitude: asFeet(Number(general.initial_altitude || 0)),
    stepClimbs: stepClimbsList,
    departureElevation: asFeet(Number(origin.elevation || 0)),
    destinationElevation: asFeet(Number(destination.elevation || 0)),
    departureTemperature: asCelsius(Number(weather.departure_temp || 15)),
    departurePressure: asHectopascals(Number(weather.departure_qnh || 1013.25)),
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
  if (!flightContext.origin) warnings.push('Origin airport ICAO missing.');
  if (!flightContext.destination) warnings.push('Destination airport ICAO missing.');
  if (flightContext.takeoffWeight === 0) warnings.push('Estimated takeoff weight is zero.');

  return {
    flightContext,
    warnings,
  };
}
