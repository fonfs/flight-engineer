import React from 'react';
import { FlightContext } from '@classic-flight-engineer/aviation-domain';

export interface FlightStatusHeaderProps {
  context: FlightContext;
}

export const FlightStatusHeader: React.FC<FlightStatusHeaderProps> = ({ context }) => {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{context.callsign} // FLIGHT {context.flightNumber}</h2>
          <p className="text-sm text-slate-400">{context.origin} → {context.destination} ({context.aircraftVariant})</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">TOW</span>
          <p className="text-lg text-emerald-400">{context.takeoffWeight} lbs</p>
        </div>
      </div>
    </div>
  );
};
