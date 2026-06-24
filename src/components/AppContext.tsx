'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FlightContext } from '@classic-flight-engineer/aviation-domain';
import { parseAndNormalizeSimBrief } from '@classic-flight-engineer/simbrief-adapter';

interface AppContextType {
  flightData: {
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null;
  setFlightData: (data: {
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null) => void;
  prefUnits: string;
  setPrefUnits: (units: string) => void;
  themeMode: string;
  setThemeMode: (theme: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const mockSimbriefPayload = {
    general: {
      flight_number: '860',
      icao_airline: 'VRG',
      initial_altitude: '33000',
      route: 'SBGL UZ6 VUGAX KJFK'
    },
    aircraft: {
      icao_code: 'B742',
      name: 'Boeing 747-200B',
      engine_type: 'JT9D-7A',
      reg: 'PP-VNA'
    },
    weights: {
      est_zfw: '448000',
      max_zfw: '510000',
      est_tow: '720000',
      max_tow: '833000',
      est_ldw: '530000',
      max_ldw: '630000',
      payload: '68000',
      cargo: '12000',
      pax_count: '240',
      bag_count: '240'
    },
    fuel: {
      plan_ramp: '282000',
      taxi: '5000',
      enroute_burn: '242000',
      reserve: '35000',
      contingency: '12000',
      alternate: '15000',
      extra: '5000'
    },
    origin: {
      icao_code: 'SBGL',
      elevation: '28'
    },
    destination: {
      icao_code: 'KJFK',
      elevation: '13'
    },
    text: {
      plan_out: "[ OFP ]\nVRG860   22JUN2026   SBGL-KJFK   B742 PPVNA   RELEASE 1   22JUN26\nOFP 1   GALEAO INTL-JOHN F KENNEDY INTL\nROUTE: SBGL UZ6 VUGAX KJFK\nINITIAL FL: FL330\nAIRAC: 2606   LAYOUT: LIDO   UNITS: LBS"
    }
  };

  const [flightData, setFlightData] = useState<{
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null>(null);

  const [prefUnits, setPrefUnits] = useState('lbs');
  const [themeMode, setThemeMode] = useState('glass-dark');

  useEffect(() => {
    if (themeMode === 'high-contrast') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [themeMode]);

  return (
    <AppContext.Provider value={{
      flightData,
      setFlightData,
      prefUnits,
      setPrefUnits,
      themeMode,
      setThemeMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
