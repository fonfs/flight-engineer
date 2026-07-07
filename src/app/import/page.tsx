import React, { useState, useEffect, useRef } from 'react';
import { FlightContext } from '@classic-flight-engineer/aviation-domain';
import { parseAndNormalizeSimBrief } from '@classic-flight-engineer/simbrief-adapter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ClipboardList, Scale, Plane, Compass, Map, FileText, Image, Braces, User, DownloadCloud, Cloud, CheckCircle2, AlertCircle, Clock, Globe, Settings, Anchor } from 'lucide-react';

// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { useApp } from '../../components/AppContext';

const parseSimbriefDate = (rawGeneral: any, rawTimes: any) => {
  const val = rawTimes?.sched_out || rawGeneral?.sched_out || rawGeneral?.sched_out_date;
  if (!val) return { date: 'N/A', time: 'N/A' };

  let dateObj: Date;
  if (!isNaN(Number(val))) {
    dateObj = new Date(Number(val) * 1000);
  } else {
    dateObj = new Date(val);
  }

  if (isNaN(dateObj.getTime())) {
    return { date: String(val), time: 'N/A' };
  }

  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getUTCMonth()];
  const year = String(dateObj.getUTCFullYear()).slice(-2);
  const dateStr = `${day} ${month} ${year}`;

  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes} UTC`;

  return { date: dateStr, time: timeStr };
};

const parseSimbriefArrival = (rawGeneral: any, rawTimes: any) => {
  const val = rawTimes?.sched_in || rawGeneral?.sched_in || rawGeneral?.sched_in_date;
  if (!val) return 'N/A';

  let dateObj: Date;
  if (!isNaN(Number(val))) {
    dateObj = new Date(Number(val) * 1000);
  } else {
    dateObj = new Date(val);
  }

  if (isNaN(dateObj.getTime())) return String(val);

  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
};

const parseToMinutes = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const str = String(val).trim();
  if (!str) return 0;
  if (str.includes(':')) {
    const parts = str.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  const num = Number(str);
  if (isNaN(num)) return 0;
  if (num > 1440) {
    return Math.round(num / 60);
  }
  return num;
};

const getAirTime = (rawTimes: any) => {
  const sec = Number(rawTimes?.est_time_enroute || 0);
  if (sec > 1440) {
    const min = Math.round(sec / 60);
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const blockMin = parseToMinutes(rawTimes?.est_block);
  const taxiOut = parseToMinutes(rawTimes?.taxi_out);
  const taxiIn = parseToMinutes(rawTimes?.taxi_in);
  const airMin = Math.max(0, blockMin - taxiOut - taxiIn);

  const h = Math.floor(airMin / 60);
  const m = airMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getBlockTime = (rawTimes: any) => {
  const min = parseToMinutes(rawTimes?.est_block);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatAltitude = (alt: any) => {
  const num = Number(alt || 0);
  return num ? `${num.toLocaleString('en-US')} ft` : 'N/A';
};

const formatDistance = (dist: any) => {
  const num = Number(dist || 0);
  return num ? `${num.toLocaleString('en-US')} nm` : 'N/A';
};

const formatISADev = (dev: any) => {
  if (dev === undefined || dev === null || dev === '') return 'N/A';
  const num = Number(dev);
  if (isNaN(num)) return String(dev);
  if (num > 0) return `P${num}`;
  if (num < 0) return `M${Math.abs(num)}`;
  return 'P0';
};

const formatOatAndIsaDev = (oat: any, dev: any) => {
  if ((oat === undefined || oat === null || oat === '') && (dev === undefined || dev === null || dev === '')) {
    return 'N/A';
  }
  const oatStr = oat !== undefined && oat !== null && oat !== '' ? `${oat}°C` : 'N/A';
  const devStr = formatISADev(dev);
  return `${oatStr} (${devStr})`;
};

const calculateOat = (altitude: any, isaDev: any) => {
  const altNum = Number(altitude);
  const devNum = Number(isaDev);
  if (isNaN(altNum) || altNum <= 0) return '';
  const oatVal = 15 - 2 * (altNum / 1000) + (isNaN(devNum) ? 0 : devNum);
  return Math.round(oatVal);
};

const formatTropopause = (trop: any) => {
  const num = Number(trop);
  if (isNaN(num) || num <= 0) return trop || 'N/A';
  return `${num.toLocaleString('en-US')} ft`;
};

const getAvgWind = (rawGeneral: any) => {
  const dir = rawGeneral?.avg_wind_dir;
  const spd = rawGeneral?.avg_wind_spd;
  if (dir !== undefined && spd !== undefined && dir !== '' && spd !== '') {
    const numSpd = Number(spd);
    const formattedSpd = isNaN(numSpd) ? spd : numSpd;
    return `${dir}/${formattedSpd}`;
  }
  const rawWind = rawGeneral?.avg_wind;
  if (rawWind && typeof rawWind === 'string' && rawWind.includes('/')) {
    const parts = rawWind.split('/');
    if (parts.length === 2) {
      const d = parts[0].trim().replace('°', '');
      const s = Number(parts[1].trim().replace('KT', '').trim());
      const formattedS = isNaN(s) ? parts[1].trim() : s;
      return `${d}/${formattedS}`;
    }
  }
  return rawWind || 'N/A';
};

const formatWindComp = (comp: any) => {
  if (comp === undefined || comp === null || comp === '') return 'N/A';
  const str = String(comp).trim();
  const cleaned = str.replace(/\s*KT$/i, '');
  if (cleaned.startsWith('P') || cleaned.startsWith('M') || cleaned.startsWith('H') || cleaned.startsWith('T')) {
    return cleaned;
  }
  const num = Number(cleaned);
  if (isNaN(num)) return cleaned;
  if (num > 0) return `P${num}`;
  if (num < 0) return `M${Math.abs(num)}`;
  return '0';
};

const getOfpText = (raw: any): string => {
  if (!raw) return '';
  let txt = '';
  if (typeof raw.text === 'object' && raw.text !== null) {
    txt = raw.text.plan_out || raw.text.plan_html || '';
  } else if (typeof raw.text === 'string') {
    txt = raw.text;
  } else {
    txt = raw.plan_text || raw.ofp_text || raw.text_plan || '';
  }
  // Strip HTML comments entirely
  return txt.replace(/<!--[\s\S]*?-->/g, '');
};

const getNavlogFixes = (raw: any): any[] => {
  if (!raw || !raw.navlog) return [];
  let list = raw.navlog;
  if (list.fix) {
    list = list.fix;
  }
  if (Array.isArray(list)) {
    if (list.length > 0 && Array.isArray(list[0])) {
      return list[0];
    }
    return list;
  }
  if (typeof list === 'object' && list !== null) {
    const values = Object.values(list);
    if (values.length > 0 && values.every((v: any) => v && typeof v === 'object')) {
      return values;
    }
    return [list];
  }
  return [];
};

const getAlternateNavlogFixes = (raw: any): any[] => {
  if (!raw || !raw.alternate_navlog) return [];
  let list = raw.alternate_navlog;
  if (list.fix) {
    list = list.fix;
  }
  if (Array.isArray(list)) {
    if (list.length > 0 && Array.isArray(list[0])) {
      return list[0];
    }
    return list;
  }
  if (typeof list === 'object' && list !== null) {
    const values = Object.values(list);
    if (values.length > 0 && values.every((v: any) => v && typeof v === 'object')) {
      return values;
    }
    return [list];
  }
  return [];
};

const getSimbriefImages = (raw: any): any[] => {
  if (!raw || !raw.images) return [];
  const imagesObj = raw.images;
  const baseUrl = imagesObj.directory || '';
  let maps = imagesObj.map || [];
  if (!Array.isArray(maps)) {
    maps = [maps];
  }
  return maps.map((m: any) => {
    const rawLink = m.link || '';
    let link = '';

    if (rawLink) {
      if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
        link = rawLink;
      } else if (rawLink.startsWith('/')) {
        link = `https://www.simbrief.com${rawLink}`;
      } else {
        if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
          link = `${baseUrl}${rawLink}`;
        } else {
          link = `https://www.simbrief.com/ofp/${rawLink}`;
        }
      }
    } else if (m.name) {
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        link = `${baseUrl}${m.name}`;
      } else {
        link = `https://www.simbrief.com/ofp/${m.name}`;
      }
    }

    return {
      name: m.name || '',
      link,
      type: m.type || 'Map'
    };
  }).filter((img: any) => img.link);
};

const getFlightLevel = (fix: any): string => {
  if (!fix) return '0';
  const flValue = fix.fl !== undefined && fix.fl !== null && fix.fl !== '' ? String(fix.fl) : '';
  const feetValue = fix.altitude_feet !== undefined && fix.altitude_feet !== null && fix.altitude_feet !== '' ? Number(fix.altitude_feet) : NaN;

  if (!isNaN(feetValue) && feetValue > 0) {
    if (!flValue || flValue === '0') {
      return String(Math.round(feetValue / 100));
    }
  }

  if (flValue !== '') return flValue;
  if (!isNaN(feetValue)) {
    return String(Math.round(feetValue / 100));
  }
  return '0';
};

const findIcaoFpl = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed.startsWith('(FPL-')) {
      return trimmed;
    }
    return '';
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const found = findIcaoFpl(obj[key]);
        if (found) return found;
      }
    }
  }
  return '';
};

const getFixDetails = (fix: any, units: string) => {
  if (!fix) return null;
  const rawStage = fix.stage || 'CRUISE';
  const stageBadgeText = rawStage.toUpperCase();

  const isLbs = String(units).toLowerCase() === 'lbs';

  const rawFuelRem = Number(fix.fuel_plan_onboard || fix.fuel_onboard || fix.fuel_on_board || fix.fob || 0);
  const fuelRem = isLbs ? Math.round(rawFuelRem * 0.45359237) : rawFuelRem;

  const rawFuelUsed = Number(fix.fuel_totalused || 0);
  const fuelUsed = isLbs ? Math.round(rawFuelUsed * 0.45359237) : rawFuelUsed;

  const hdg = String(fix.heading_mag !== undefined ? fix.heading_mag : (fix.heading_true || 0)).padStart(3, '0') + '°';
  const airway = fix.via_airway || 'DCT';
  const tas = fix.true_airspeed ? `${fix.true_airspeed} kt` : 'N/A';
  const gs = fix.groundspeed ? `${fix.groundspeed} kt` : 'N/A';

  let machVal = fix.mach ? Number(fix.mach) : null;
  if (machVal && machVal > 10) {
    machVal = machVal / 1000;
  } else if (!machVal && fix.mach_thousandths) {
    machVal = Number(fix.mach_thousandths) / 1000;
  }
  const machStr = machVal ? machVal.toFixed(2) : 'N/A';

  const wind = fix.wind_dir !== undefined && fix.wind_spd !== undefined ? `${fix.wind_dir}°/${fix.wind_spd} kt` : 'N/A';
  const oat = fix.oat !== undefined ? `${fix.oat}°C` : 'N/A';

  const legTime = fix.time_leg !== undefined ? fix.time_leg : 'N/A';
  const totalTime = fix.time_total !== undefined ? fix.time_total : 'N/A';

  return {
    stage: stageBadgeText,
    fuelRem,
    fuelUsed,
    hdg,
    airway,
    tas,
    gs,
    mach: machStr,
    wind,
    oat,
    legTime,
    totalTime
  };
};

const getFR24AltitudeColor = (flNum: number): string => {
  if (flNum >= 426) return '#ff0000';
  if (flNum >= 410) return '#ff00ff';
  if (flNum >= 394) return '#e040fb';
  if (flNum >= 377) return '#d500f9';
  if (flNum >= 361) return '#ba68c8';
  if (flNum >= 344) return '#9c27b0';
  if (flNum >= 328) return '#7e57c2';
  if (flNum >= 312) return '#673ab7';
  if (flNum >= 295) return '#5c6bc0';
  if (flNum >= 279) return '#3f51b5';
  if (flNum >= 262) return '#283593';
  if (flNum >= 246) return '#1a237e';
  if (flNum >= 230) return '#0000c0';
  if (flNum >= 213) return '#0000e0';
  if (flNum >= 197) return '#0010ff';
  if (flNum >= 180) return '#0030ff';
  if (flNum >= 164) return '#0050ff';
  if (flNum >= 148) return '#0070ff';
  if (flNum >= 131) return '#0090ff';
  if (flNum >= 115) return '#00b0ff';
  if (flNum >= 98) return '#00d0ff';
  if (flNum >= 82) return '#00f0ff';
  if (flNum >= 66) return '#00ffcc';
  if (flNum >= 49) return '#00ff88';
  if (flNum >= 39) return '#00ff44';
  if (flNum >= 33) return '#00ff00';
  if (flNum >= 26) return '#44ff00';
  if (flNum >= 20) return '#88ff00';
  if (flNum >= 13) return '#cddc39';
  if (flNum >= 10) return '#ffff00';
  if (flNum >= 7) return '#ffc300';
  if (flNum >= 3) return '#ffd27f';
  return '#ffffff';
};

const RouteMap = ({ fixes, alternateFixes = [], units }: { fixes: any[]; alternateFixes?: any[]; units: string }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Filter valid waypoints with coordinates
    const waypoints = fixes.map(fix => {
      const lat = Number(fix.pos_lat || fix.lat || fix.latitude);
      const lon = Number(fix.pos_long || fix.lon || fix.longitude || fix.pos_lng || fix.lng);
      return {
        ident: fix.ident || fix.name || 'UNKNOWN',
        lat,
        lon,
        fl: fix.fl || (fix.altitude_feet ? Math.round(Number(fix.altitude_feet) / 100) : '0'),
        raw: fix
      };
    }).filter(wp => !isNaN(wp.lat) && !isNaN(wp.lon));

    const altWaypoints = alternateFixes.map(fix => {
      const lat = Number(fix.pos_lat || fix.lat || fix.latitude);
      const lon = Number(fix.pos_long || fix.lon || fix.longitude || fix.pos_lng || fix.lng);
      return {
        ident: fix.ident || fix.name || 'UNKNOWN',
        lat,
        lon,
        fl: fix.fl || (fix.altitude_feet ? Math.round(Number(fix.altitude_feet) / 100) : '0'),
        raw: fix
      };
    }).filter(wp => !isNaN(wp.lat) && !isNaN(wp.lon));

    if (waypoints.length === 0) return;

    // Initialize map
    const firstWp = waypoints[0];
    const map = L.map(mapRef.current).setView([firstWp.lat, firstWp.lon], 4);
    leafletMapRef.current = map;

    // Define available tile layers
    const claro = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const escuro = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const osm = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    });

    const mapTiles = L.tileLayer('https://maptiles.p.rapidapi.com/en/map/v1/{z}/{x}/{y}.png?rapidapi-key={apikey}', {
      attribution: '&copy; <a href="http://www.maptilesapi.com/">MapTiles API</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      apikey: 'eb06d654aemshb0b7dc06b51f1f0p1896a9jsn3b989223c526',
      maxZoom: 19
    } as any);

    const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18
    });

    const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    const stadiaLight = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
      minZoom: 0,
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: 'png'
    } as any);

    const stadiaDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
      minZoom: 0,
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: 'png'
    } as any);

    const voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const stadiaSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
      minZoom: 0,
      maxZoom: 20,
      attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: 'jpg'
    } as any);

    const stadiaOSM = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}', {
      minZoom: 0,
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: 'png'
    } as any);

    const stadiaToner = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
      minZoom: 0,
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: 'png'
    } as any);

    // Add 'claro' layer by default
    claro.addTo(map);

    // Layer control selector
    const baseMaps = {
      "CartoDB Light": claro,
      "CartoDB Dark": escuro,
      "CartoDB Voyager": voyager,
      "Stadia Light": stadiaLight,
      "Stadia Dark": stadiaDark,
      "Stadia OSM": stadiaOSM,
      "Stadia Satellite": stadiaSatellite,
      "Stadia Toner": stadiaToner,
      "OSM Std": osm,
      "MapTiles": mapTiles,
      "OpenTopoMap": openTopoMap,
      "Satellite": satelite
    };

    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    // Add segmented polyline for route
    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];

      const flVal1 = Number(wp1.fl);
      const flVal2 = Number(wp2.fl);
      // Determine segment color based on the higher altitude of the two points
      const flVal = Math.max(flVal1, flVal2);

      const segmentColor = getFR24AltitudeColor(flVal);

      L.polyline([[wp1.lat, wp1.lon], [wp2.lat, wp2.lon]], {
        color: segmentColor,
        weight: 3.5,
        opacity: 0.95
      }).addTo(map);
    }

    // Add segmented dashed polylines for alternate route
    const alternateSegments = [];
    if (waypoints.length > 0) {
      const lastMain = waypoints[waypoints.length - 1];
      alternateSegments.push(lastMain);
    }

    const altWpsToRender = altWaypoints.length > 0 && altWaypoints[0].ident === waypoints[waypoints.length - 1]?.ident
      ? altWaypoints.slice(1)
      : altWaypoints;

    altWpsToRender.forEach(wp => {
      alternateSegments.push(wp);
    });

    for (let i = 0; i < alternateSegments.length - 1; i++) {
      const wp1 = alternateSegments[i];
      const wp2 = alternateSegments[i + 1];

      const flVal1 = Number(wp1.fl);
      const flVal2 = Number(wp2.fl);
      const flVal = Math.max(flVal1, flVal2);

      const segmentColor = getFR24AltitudeColor(flVal);

      L.polyline([[wp1.lat, wp1.lon], [wp2.lat, wp2.lon]], {
        color: segmentColor,
        weight: 3.5,
        opacity: 0.95,
        dashArray: '6, 6'
      }).addTo(map);
    }

    // Add custom markers for main route
    waypoints.forEach((wp, idx) => {
      const flVal = Number(wp.fl);
      const fix = wp.raw;

      let dotColor = getFR24AltitudeColor(flVal);
      if (idx === 0 || idx === waypoints.length - 1) {
        dotColor = '#0ea5e9'; // Blue/Cyan for Origin/Destination
      }

      const isTod = wp.ident.toUpperCase().includes('TOD');
      const isToc = wp.ident.toUpperCase().includes('TOC');

      // Create a custom icon using divIcon
      const icon = L.divIcon({
        className: 'custom-route-marker',
        html: `
          <div style="
            position: absolute;
            top: -24px;
            left: -40px;
            width: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
          ">
            <!-- Label -->
            <div style="
              font-family: 'Lato', ui-sans-serif, system-ui, sans-serif;
              font-size: 9px;
              font-weight: 700;
              text-align: center;
              line-height: 1.15;
              text-shadow: 
                -1.5px -1.5px 0 #fff,  
                 1.5px -1.5px 0 #fff,
                -1.5px  1.5px 0 #fff,
                 1.5px  1.5px 0 #fff,
                 0px 1px 3px rgba(255,255,255,0.9);
              margin-bottom: 2px;
              white-space: nowrap;
            ">
              <div style="color: #0f172a; font-weight: 900; letter-spacing: -0.1px;">${wp.ident}</div>
              <div style="color: #475569; font-weight: 800;">FL${wp.fl}</div>
            </div>
          </div>
          ${isTod || isToc
            ? `
              <!-- Clickable Triangle for TOD/TOC centered in the 20x20 container -->
              <svg width="12" height="12" viewBox="0 0 100 100" style="margin: 4px; cursor: pointer; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));">
                <polygon points="${isTod ? '50,90 5,10 95,10' : '50,10 5,90 95,90'}" fill="#ffffff" stroke="${dotColor}" stroke-width="16" stroke-linejoin="round" />
              </svg>
            `
            : `
              <!-- Clickable Circle Dot centered in the 20x20 container -->
              <div style="
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #ffffff;
                border: 2.5px solid ${dotColor};
                box-shadow: 0 0 4px rgba(0,0,0,0.6);
                margin: 5px;
                cursor: pointer;
              "></div>
            `
          }
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([wp.lat, wp.lon], { icon }).addTo(map);

      // Extract details for the popup
      const rawStage = fix.stage || 'CRUISE';
      const stageBadgeText = rawStage.charAt(0).toUpperCase() + rawStage.slice(1).toLowerCase();

      const isLbs = units.toLowerCase() === 'lbs';

      const rawFuelRem = Number(fix.fuel_plan_onboard || fix.fuel_onboard || fix.fuel_on_board || fix.fob || 0);
      const fuelRemKg = isLbs ? Math.round(rawFuelRem * 0.45359237) : rawFuelRem;

      const rawFuelUsed = Number(fix.fuel_totalused || 0);
      const fuelUsedKg = isLbs ? Math.round(rawFuelUsed * 0.45359237) : rawFuelUsed;

      const hdg = String(fix.heading_mag !== undefined ? fix.heading_mag : (fix.heading_true || 0)).padStart(3, '0') + '°';
      const airway = fix.via_airway || 'DCT';
      const tas = fix.true_airspeed ? `${fix.true_airspeed} kt` : 'N/A';
      const gs = fix.groundspeed ? `${fix.groundspeed} kt` : 'N/A';

      let machVal = fix.mach ? Number(fix.mach) : null;
      if (machVal && machVal > 10) {
        machVal = machVal / 1000;
      } else if (!machVal && fix.mach_thousandths) {
        machVal = Number(fix.mach_thousandths) / 1000;
      }
      const machStr = machVal ? machVal.toFixed(2) : 'N/A';

      const wind = fix.wind_dir !== undefined && fix.wind_spd !== undefined ? `${fix.wind_dir}°/${fix.wind_spd} kt` : 'N/A';
      const oat = fix.oat !== undefined ? `${fix.oat}°C` : 'N/A';

      const legTime = fix.time_leg !== undefined ? fix.time_leg : '0';
      const totalTime = fix.time_total !== undefined ? fix.time_total : '0';

      const popupContent = `
        <div style="font-family: 'Roboto Mono', monospace; font-size: 11px; color: #334155; min-width: 170px; padding: 4px 2px;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-family: 'Lato', sans-serif; font-weight: 900; font-size: 13px; color: #0f172a; letter-spacing: -0.2px;">${wp.ident}</span>
            <span style="font-family: 'Lato', sans-serif; font-size: 9px; font-weight: 800; background-color: #ecfdf5; color: #10b981; padding: 1.5px 6px; border-radius: 4px; text-transform: uppercase;">
              ${stageBadgeText}
            </span>
          </div>
          
          <!-- Rows -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Alt</span>
              <span style="font-weight: 700; color: #0f172a;">FL${wp.fl}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Hdg</span>
              <span style="font-weight: 700; color: #0f172a;">${hdg}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Airway</span>
              <span style="font-weight: 700; color: #0f172a;">${airway}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">TAS</span>
              <span style="font-weight: 700; color: #0f172a;">${tas}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">GS</span>
              <span style="font-weight: 700; color: #0f172a;">${gs}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Mach</span>
              <span style="font-weight: 700; color: #0f172a;">${machStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Wind</span>
              <span style="font-weight: 700; color: #0f172a;">${wind}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">OAT</span>
              <span style="font-weight: 700; color: #0f172a;">${oat}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Fuel Rem</span>
              <span style="font-weight: 700; color: #0f172a;">${fuelRemKg.toLocaleString('en-US')} kg</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Fuel Used</span>
              <span style="font-weight: 700; color: #0f172a;">${fuelUsedKg.toLocaleString('en-US')} kg</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Leg Time</span>
              <span style="font-weight: 700; color: #0f172a;">${legTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Total</span>
              <span style="font-weight: 700; color: #0f172a;">${totalTime}</span>
            </div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { maxWidth: 220 });
    });

    // Add custom markers for alternate route
    altWpsToRender.forEach((wp) => {
      const fix = wp.raw;
      const flVal = Number(wp.fl);
      const dotColor = getFR24AltitudeColor(flVal);

      const isTod = wp.ident.toUpperCase().includes('TOD');
      const isToc = wp.ident.toUpperCase().includes('TOC');

      // Create a custom icon using divIcon
      const icon = L.divIcon({
        className: 'custom-route-marker',
        html: `
          <div style="
            position: absolute;
            top: -24px;
            left: -40px;
            width: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
          ">
            <!-- Label -->
            <div style="
              font-family: 'Lato', ui-sans-serif, system-ui, sans-serif;
              font-size: 9px;
              font-weight: 700;
              text-align: center;
              line-height: 1.15;
              text-shadow: 
                -1.5px -1.5px 0 #fff,  
                 1.5px -1.5px 0 #fff,
                -1.5px  1.5px 0 #fff,
                 1.5px  1.5px 0 #fff,
                 0px 1px 3px rgba(255,255,255,0.9);
              margin-bottom: 2px;
              white-space: nowrap;
            ">
              <div style="color: #ef4444; font-weight: 900; letter-spacing: -0.1px;">${wp.ident}</div>
              <div style="color: #ef4444; font-weight: 800;">FL${wp.fl}</div>
            </div>
          </div>
          ${isTod || isToc
            ? `
              <!-- Clickable Triangle for TOD/TOC centered in the 20x20 container -->
              <svg width="12" height="12" viewBox="0 0 100 100" style="margin: 4px; cursor: pointer; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));">
                <polygon points="${isTod ? '50,90 5,10 95,10' : '50,10 5,90 95,90'}" fill="#ffffff" stroke="${dotColor}" stroke-width="16" stroke-linejoin="round" />
              </svg>
            `
            : `
              <!-- Clickable Circle Dot centered in the 20x20 container -->
              <div style="
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #ffffff;
                border: 2.5px solid ${dotColor};
                box-shadow: 0 0 4px rgba(0,0,0,0.6);
                margin: 5px;
                cursor: pointer;
              "></div>
            `
          }
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([wp.lat, wp.lon], { icon }).addTo(map);

      // Extract details for the popup
      const rawStage = fix.stage || 'ALTN';
      const stageBadgeText = rawStage === 'ALTN' ? 'Altn' : rawStage.charAt(0).toUpperCase() + rawStage.slice(1).toLowerCase();

      const isLbs = units.toLowerCase() === 'lbs';

      const rawFuelRem = Number(fix.fuel_plan_onboard || fix.fuel_onboard || fix.fuel_on_board || fix.fob || 0);
      const fuelRemKg = isLbs ? Math.round(rawFuelRem * 0.45359237) : rawFuelRem;

      const rawFuelUsed = Number(fix.fuel_totalused || 0);
      const fuelUsedKg = isLbs ? Math.round(rawFuelUsed * 0.45359237) : rawFuelUsed;

      const hdg = String(fix.heading_mag !== undefined ? fix.heading_mag : (fix.heading_true || 0)).padStart(3, '0') + '°';
      const airway = fix.via_airway || 'DCT';
      const tas = fix.true_airspeed ? `${fix.true_airspeed} kt` : 'N/A';
      const gs = fix.groundspeed ? `${fix.groundspeed} kt` : 'N/A';

      let machVal = fix.mach ? Number(fix.mach) : null;
      if (machVal && machVal > 10) {
        machVal = machVal / 1000;
      } else if (!machVal && fix.mach_thousandths) {
        machVal = Number(fix.mach_thousandths) / 1000;
      }
      const machStr = machVal ? machVal.toFixed(2) : 'N/A';

      const wind = fix.wind_dir !== undefined && fix.wind_spd !== undefined ? `${fix.wind_dir}°/${fix.wind_spd} kt` : 'N/A';
      const oat = fix.oat !== undefined ? `${fix.oat}°C` : 'N/A';

      const legTime = fix.time_leg !== undefined ? fix.time_leg : '0';
      const totalTime = fix.time_total !== undefined ? fix.time_total : '0';

      const popupContent = `
        <div style="font-family: 'Roboto Mono', monospace; font-size: 11px; color: #334155; min-width: 170px; padding: 4px 2px;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-family: 'Lato', sans-serif; font-weight: 900; font-size: 13px; color: #0f172a; letter-spacing: -0.2px;">${wp.ident}</span>
            <span style="font-family: 'Lato', sans-serif; font-size: 9px; font-weight: 800; background-color: #fee2e2; color: #ef4444; padding: 1.5px 6px; border-radius: 4px; text-transform: uppercase;">
              ${stageBadgeText}
            </span>
          </div>
          
          <!-- Rows -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Alt</span>
              <span style="font-weight: 700; color: #0f172a;">FL${wp.fl}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Hdg</span>
              <span style="font-weight: 700; color: #0f172a;">${hdg}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Airway</span>
              <span style="font-weight: 700; color: #0f172a;">${airway}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">TAS</span>
              <span style="font-weight: 700; color: #0f172a;">${tas}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">GS</span>
              <span style="font-weight: 700; color: #0f172a;">${gs}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Mach</span>
              <span style="font-weight: 700; color: #0f172a;">${machStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Wind</span>
              <span style="font-weight: 700; color: #0f172a;">${wind}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">OAT</span>
              <span style="font-weight: 700; color: #0f172a;">${oat}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Fuel Rem</span>
              <span style="font-weight: 700; color: #0f172a;">${fuelRemKg.toLocaleString('en-US')} kg</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Fuel Used</span>
              <span style="font-weight: 700; color: #0f172a;">${fuelUsedKg.toLocaleString('en-US')} kg</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Leg Time</span>
              <span style="font-weight: 700; color: #0f172a;">${legTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Total</span>
              <span style="font-weight: 700; color: #0f172a;">${totalTime}</span>
            </div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { maxWidth: 220 });
    });

    // Adjust map viewport to fit all points (main + alternate)
    const latLns = [
      ...waypoints.map(wp => [wp.lat, wp.lon] as [number, number]),
      ...altWpsToRender.map(wp => [wp.lat, wp.lon] as [number, number])
    ];
    if (latLns.length > 0) {
      const bounds = L.latLngBounds(latLns);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [fixes, alternateFixes]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-sans border-b border-slate-100 pb-1.5">
        🗺️ Projected Route Map
      </h4>
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden shadow-sm"
        style={{ position: 'relative', zIndex: 1 }}
      />

      {/* Horizontal Altitude Legend (FR24 Style) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full font-sans">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Altitude / Flight Level</div>
        <div className="relative">
          <div
            className="h-2.5 w-full rounded-md shadow-inner border border-slate-100"
            style={{
              background: 'linear-gradient(to right, #ffffff, #ffd27f, #ffc300, #ffff00, #cddc39, #88ff00, #44ff00, #00ff00, #00ff44, #00ff88, #00ffcc, #00f0ff, #00d0ff, #00b0ff, #0090ff, #0070ff, #0050ff, #0030ff, #0010ff, #0000e0, #0000c0, #1a237e, #283593, #3f51b5, #5c6bc0, #673ab7, #7e57c2, #9c27b0, #ba68c8, #d500f9, #e040fb, #ff00ff, #ff0000)'
            }}
          />
          <div className="relative h-4 mt-1 text-[9px] text-slate-500 font-mono">
            <span className="absolute left-[0%] translate-x-0">FL0</span>
            <span className="absolute left-[28%] -translate-x-1/2">FL50</span>
            <span className="absolute left-[37.5%] -translate-x-1/2">FL100</span>
            <span className="absolute left-[47%] -translate-x-1/2">FL150</span>
            <span className="absolute left-[56%] -translate-x-1/2">FL200</span>
            <span className="absolute left-[65.6%] -translate-x-1/2">FL250</span>
            <span className="absolute left-[75%] -translate-x-1/2">FL300</span>
            <span className="absolute left-[84%] -translate-x-1/2">FL350</span>
            <span className="absolute left-[97%] -translate-x-1/2">FL400+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const parseTempFromMetar = (metar: string): string => {
  if (!metar) return 'N/A';
  const match = metar.match(/(?:\s|^)(M?\d{2})\/(M?\d{2})?(?:\s|$)/);
  if (match) {
    let tempStr = match[1];
    if (tempStr.startsWith('M')) {
      tempStr = '-' + tempStr.substring(1);
    }
    return `${Number(tempStr)}°C`;
  }
  return 'N/A';
};

const parseQnhFromMetar = (metar: string): string => {
  if (!metar) return 'N/A';
  const qMatch = metar.match(/(?:\s|^)Q(\d{4})(?:\s|$)/);
  if (qMatch) {
    return `${Number(qMatch[1])} hPa`;
  }
  const aMatch = metar.match(/(?:\s|^)A(\d{4})(?:\s|$)/);
  if (aMatch) {
    const inches = Number(aMatch[1]) / 100;
    return `${inches.toFixed(2)} inHg`;
  }
  return 'N/A';
};

const parseWindFromMetar = (metar: string): string => {
  if (!metar) return 'N/A';
  const match = metar.match(/(?:\s|^)(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT(?:\s|$)/);
  if (match) {
    const dir = match[1];
    const speed = Number(match[2]);
    const gust = match[3] ? ` (rajadas ${Number(match[3])} kt)` : '';
    if (dir === '000' && speed === 0) return 'Calm Wind';
    return `${dir}° / ${speed} kt${gust}`;
  }
  return 'N/A';
};

const parseVisFromMetar = (metar: string): string => {
  if (!metar) return 'N/A';
  if (metar.includes('CAVOK')) return '10 km+ (CAVOK)';
  const match = metar.match(/(?:\s|^)(\d{4})(NDV)?(?:\s|$)/);
  if (match) {
    const dist = Number(match[1]);
    if (dist === 9999) return '10 km+';
    return `${dist / 1000} km`;
  }
  const usMatch = metar.match(/(?:\s|^)(\d+)(?:\/\d+)?SM(?:\s|$)/);
  if (usMatch) {
    return `${usMatch[1]} SM`;
  }
  return 'N/A';
};

const parseCeilingFromMetar = (metar: string): string => {
  if (!metar) return 'N/A';
  if (metar.includes('CAVOK')) return 'Clear Sky';
  const matches = [...metar.matchAll(/(FEW|SCT|BKN|OVC|VV)(\d{3})/g)];
  if (matches.length > 0) {
    const ceiling = matches.find(m => ['BKN', 'OVC', 'VV'].includes(m[1]));
    if (ceiling) {
      const type = ceiling[1] === 'BKN' ? 'Broken' : ceiling[1] === 'OVC' ? 'Overcast' : 'Vertical Visibility';
      const alt = Number(ceiling[2]) * 100;
      return `${type} at ${alt.toLocaleString()} ft`;
    }
    const first = matches[0];
    const type = first[1] === 'FEW' ? 'Few Clouds' : 'Scattered Clouds';
    const alt = Number(first[2]) * 100;
    return `${type} at ${alt.toLocaleString()} ft`;
  }
  if (metar.includes('NSC') || metar.includes('NCD') || metar.includes('SKC') || metar.includes('CLR')) {
    return 'Clear Sky';
  }
  return 'No Restrictions';
};

const parseDewPointFromMetar = (metar: string): string => {
  if (!metar) return 'N/A';
  const match = metar.match(/(?:\s|^)(M?\d{2})\/(M?\d{2})?(?:\s|$)/);
  if (match && match[2]) {
    let dpStr = match[2];
    if (dpStr.startsWith('M')) {
      dpStr = '-' + dpStr.substring(1);
    }
    return `${Number(dpStr)}°C`;
  }
  return 'N/A';
};

const FuelRemainingChart = ({ fixes, alternateFixes = [], units, planRamp = 0 }: { fixes: any[]; alternateFixes?: any[]; units: string; planRamp?: number }) => {
  if (!fixes || fixes.length === 0) return null;

  const parseFixTimeSeconds = (fix: any): number => {
    if (!fix) return 0;

    // Scan all possible time keys in order of preference
    const timeKeys = ['time_total', 'time_accum_hhmm', 'time_accum', 'time_log', 'time', 'ete_seconds', 'ete', 'accum_time', 'accum'];
    let rawVal: any = null;
    for (const key of timeKeys) {
      if (fix[key] !== undefined && fix[key] !== null && fix[key] !== '') {
        rawVal = fix[key];
        break;
      }
    }

    if (rawVal === null || rawVal === undefined) return 0;

    const strVal = String(rawVal).trim();
    if (strVal.includes(':')) {
      const parts = strVal.split(':');
      const h = Number(parts[0] || 0);
      const m = Number(parts[1] || 0);
      const s = Number(parts[2] || 0);
      return h * 3600 + m * 60 + s;
    }

    if (strVal.length === 4 && !isNaN(Number(strVal))) {
      const h = Number(strVal.substring(0, 2));
      const m = Number(strVal.substring(2, 4));
      return h * 3600 + m * 60;
    }

    const num = Number(strVal);
    if (!isNaN(num)) {
      return num;
    }

    return 0;
  };

  const formatEteSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Keep track of accumulated time for continuous path
  let accumulatedTime = 0;

  const mainPoints = fixes.map((fix, idx) => {
    const ident = fix.ident || 'N/A';
    const rawFuel = Number(fix.fuel_plan_onboard || fix.fuel_onboard || fix.fuel_on_board || fix.fob || 0);
    const isLbs = units.toLowerCase() === 'lbs';
    const fuelKg = isLbs ? Math.round(rawFuel * 0.45359237) : rawFuel;

    let timeSeconds = parseFixTimeSeconds(fix);
    if (idx === 0) {
      timeSeconds = 0; // Force origin to 00:00
    }
    accumulatedTime = timeSeconds;

    return {
      name: ident,
      Fuel: fuelKg,
      AlternateFuel: undefined as number | undefined,
      ETE: formatEteSeconds(timeSeconds),
      isAlternate: false
    };
  });

  let data: { name: any; Fuel: number | undefined; AlternateFuel: number | undefined; ETE: string; isAlternate: boolean }[] = [...mainPoints];

  if (alternateFixes.length > 0) {
    if (data.length > 0) {
      data[data.length - 1] = {
        ...data[data.length - 1],
        AlternateFuel: data[data.length - 1].Fuel
      };
    }

    // Skip the first alternate fix (destination duplicate) to connect smoothly
    const alternateFixesToRender = alternateFixes.slice(1);

    // SimBrief alternate navlog reset times, we want to continue accumulating from the destination time
    const startAlternateTime = accumulatedTime;

    const altPoints = alternateFixesToRender.map((fix) => {
      const ident = fix.ident || 'N/A';
      const rawFuel = Number(fix.fuel_plan_onboard || fix.fuel_onboard || fix.fuel_on_board || fix.fob || 0);
      const isLbs = units.toLowerCase() === 'lbs';
      const fuelKg = isLbs ? Math.round(rawFuel * 0.45359237) : rawFuel;

      const altFixTime = parseFixTimeSeconds(fix);
      const totalTime = startAlternateTime + altFixTime;

      return {
        name: ident,
        Fuel: undefined as number | undefined,
        AlternateFuel: fuelKg,
        ETE: formatEteSeconds(totalTime),
        isAlternate: true
      };
    });

    data = [...data, ...altPoints];
  }

  const fuels = data.map(d => d.Fuel || d.AlternateFuel || 0);
  const maxFuel = planRamp > 0 ? planRamp : Math.max(...fuels);

  const formatFuelLabel = (val: number) => {
    return val.toLocaleString('en-US');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-sans w-full">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          🔥 Fuel Remaining (kg)
        </h4>
      </div>

      <div className="w-full h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 10, left: -20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              fontSize={10}
              dy={10}
              angle={45}
              textAnchor="start"
              height={50}
            />
            <YAxis
              domain={[0, maxFuel]}
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              fontSize={10}
              tickFormatter={formatFuelLabel}
              dx={5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const isAlt = item.isAlternate;
                  return (
                    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs font-mono space-y-1.5 border-collapse">
                      <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                        {item.name}
                        {isAlt && (
                          <span className="text-[8px] bg-red-100 text-red-800 px-1 py-0.2 rounded font-sans uppercase">ALTN</span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-500">
                        <span>Fuel (kg)</span>
                        <span className="font-bold text-slate-700">
                          {formatFuelLabel(isAlt ? item.AlternateFuel : item.Fuel)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-500">
                        <span>ETE</span>
                        <span className="font-bold text-slate-700">
                          {item.ETE}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="Fuel"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#fuelGrad)"
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
              dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="AlternateFuel"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#altGrad)"
              activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }}
              dot={{ r: 2.5, fill: '#ef4444', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function ImportPage() {
  const { flightData, setFlightData } = useApp();
  const [pilotId, setPilotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ofpFilter, setOfpFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'performance' | 'flight' | 'route' | 'map' | 'ofp' | 'raw' | 'images'>('general');

  const [importedData, setImportedData] = useState<{
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null>(flightData);

  const [lastImportTime, setLastImportTime] = useState<string | null>(null);

  const formatWeight = (val: any) => {
    const num = Number(val || 0);
    if (!num) return { kgs: '0 KG', lbs: '0 LB' };
    const isLbs = importedData?.raw?.params?.units?.toLowerCase() === 'lbs';
    if (isLbs) {
      return {
        lbs: num.toLocaleString('en-US') + ' LB',
        kgs: Math.round(num / 2.2046226218).toLocaleString('en-US') + ' KG'
      };
    } else {
      return {
        kgs: num.toLocaleString('en-US') + ' KG',
        lbs: Math.round(num * 2.2046226218).toLocaleString('en-US') + ' LB'
      };
    }
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportedData(null);

    try {
      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?json=v2&userid=${encodeURIComponent(pilotId)}`);
      const rawData = await res.json();

      if (!res.ok) {
        throw new Error(rawData.error || 'Unknown error querying SimBrief');
      }

      // Check SimBrief API fetch status
      const fetchStatus = rawData.fetch?.status;
      if (fetchStatus && fetchStatus !== 'OFP Found' && fetchStatus !== 'Success') {
        throw new Error(`SimBrief: ${fetchStatus}`);
      }

      // Client-side normalization
      const adapterResult = parseAndNormalizeSimBrief(rawData);

      const parsedData = {
        flightContext: adapterResult.flightContext,
        warnings: adapterResult.warnings,
        raw: rawData,
      };

      setImportedData(parsedData);
      setLastImportTime(new Date().toLocaleTimeString());

      // Auto-save immediately to memory context
      setFlightData(parsedData);
      setSuccess('Flight plan successfully imported and synced to memory!');

    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <header className="pb-2 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-sm shrink-0">
          <Cloud className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            SimBrief Import
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Enter your SimBrief credentials to sync the latest operational flight plan.</p>
        </div>
      </header>

      {/* Input panel */}
      <section className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full filter blur-3xl opacity-40 -mr-20 -mt-20 pointer-events-none"></div>

        <form onSubmit={handleFetch} className="relative z-10 space-y-2">
          <label className="text-[10px] tracking-wider font-extrabold text-slate-450 block uppercase font-sans">
            SimBrief Pilot ID
          </label>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                style={{ paddingLeft: '42px' }}
                className="w-full bg-white border border-slate-200 rounded-xl pr-4 py-3 text-slate-900 font-sans outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold tracking-wide placeholder-slate-400 h-[46px]"
                placeholder="Enter your numeric Pilot ID (e.g. 123456)"
                value={pilotId}
                onChange={(e) => setPilotId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !pilotId}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-8 rounded-xl font-sans transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm cursor-pointer h-[46px] shrink-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>SYNCING DATA...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>FETCH FLIGHT PLAN</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-1 mt-1">
            Your numeric ID can be found in your SimBrief account settings page.
          </p>
        </form>

        {error && (
          <div className="mt-4 p-4 pl-5 bg-rose-50/40 border border-rose-100/80 border-l-4 border-l-rose-500 rounded-xl flex items-center gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-8 h-8 bg-rose-100/70 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-rose-900 text-xs tracking-wider block uppercase font-sans leading-none">Sync Failed</span>
              <span className="text-rose-700 text-xs font-semibold block leading-tight">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 pl-5 bg-emerald-50/40 border border-emerald-100/80 border-l-4 border-l-emerald-500 rounded-xl flex items-center gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-8 h-8 bg-emerald-100/70 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-900 text-xs tracking-wider block uppercase font-sans leading-none">Flight Plan Synced</span>
              <span className="text-emerald-700 text-xs font-semibold block leading-tight">{success}</span>
            </div>
          </div>
        )}
      </section>

      {/* Editor & Data panel */}
      {importedData && (
        <section className="w-full">
          {/* Beautiful HUD Dashboard */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            {/* HUD Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 font-sans text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'general' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>GENERAL DATA</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'performance' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <Scale className="w-4 h-4" />
                <span>PERF & WEIGHTS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('flight')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'flight' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <Plane className="w-4 h-4" />
                <span>AERODROMES</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('route')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'route' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <Compass className="w-4 h-4" />
                <span>NAVLOG & FIXES</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'map' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <Map className="w-4 h-4" />
                <span>ROUTE MAP</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ofp')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'ofp' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <FileText className="w-4 h-4" />
                <span>OFP</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'images' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <Image className="w-4 h-4" />
                <span>MAPS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`flex-1 py-3 px-3 text-center font-bold transition-all border-b-2 hover:bg-slate-100/50 flex items-center justify-center gap-1.5 ${activeTab === 'raw' ? 'border-indigo-650 text-indigo-600 bg-white font-extrabold' : 'border-transparent text-slate-500'
                  }`}
              >
                <Braces className="w-4 h-4" />
                <span>RAW JSON DATA</span>
              </button>
            </div>

            {/* HUD Content Area */}
            <div className="p-6 flex-1 space-y-6">
              {importedData.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-sans">
                  <span className="font-bold block mb-1">⚠️ ADAPTATION WARNINGS:</span>
                  <ul className="list-disc pl-4 space-y-0.5 font-medium">
                    {importedData.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6 font-sans">
                  {/* Route Banner Visualizer */}
                  <div className="relative bg-indigo-50/60 border border-indigo-100/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    {/* Route graphic */}
                    <div className="flex-1 w-full flex items-center justify-between relative px-4">
                      {/* Dash line connector */}
                      <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 border-t border-dashed border-indigo-200 pointer-events-none"></div>

                      {/* Departure */}
                      <div className="relative z-10 flex flex-col items-center bg-white border border-slate-200 rounded-xl p-3 w-28 shadow-sm">
                        <span className="text-[9px] text-indigo-600 font-extrabold tracking-wider uppercase mb-0.5">DEP</span>
                        <span className="text-xl font-extrabold text-slate-800">{importedData.raw?.origin?.icao_code || 'N/A'}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[90px]">{importedData.raw?.origin?.iata_code || ''}</span>
                      </div>

                      {/* Alternate */}
                      {importedData.raw?.alternate?.icao_code && (
                        <div className="relative z-10 flex flex-col items-center bg-white border border-amber-200 rounded-xl p-2 w-24 shadow-sm">
                          <span className="text-[8px] text-amber-600 font-extrabold tracking-wider uppercase mb-0.5">ALT</span>
                          <span className="text-sm font-bold text-slate-800">{importedData.raw?.alternate?.icao_code}</span>
                          <span className="text-[8px] text-slate-400 truncate max-w-[80px]">{importedData.raw?.alternate?.iata_code || ''}</span>
                        </div>
                      )}

                      {/* Arrival */}
                      <div className="relative z-10 flex flex-col items-center bg-white border border-slate-200 rounded-xl p-3 w-28 shadow-sm">
                        <span className="text-[9px] text-emerald-600 font-extrabold tracking-wider uppercase mb-0.5">ARR</span>
                        <span className="text-xl font-extrabold text-slate-800">{importedData.raw?.destination?.icao_code || 'N/A'}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[90px]">{importedData.raw?.destination?.iata_code || ''}</span>
                      </div>
                    </div>

                    {/* Flight Call Sign / Aircraft Info Badge */}
                    <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto border-t md:border-t-0 md:border-l border-indigo-100 pt-4 md:pt-0 md:pl-6 shrink-0 gap-2">
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-indigo-400 uppercase block font-bold">Flight Identity</span>
                        <span className="text-2xl font-black text-indigo-900 tracking-wider">{(importedData.raw?.general?.icao_airline || '') + (importedData.raw?.general?.flight_number || 'N/A')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-indigo-500 uppercase block font-bold">Equipment</span>
                        <span className="text-sm font-bold text-slate-700">{importedData.raw?.aircraft?.name || importedData.raw?.aircraft?.icao_code || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Primary Stats (Full Width) */}
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                        <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500 shrink-0" /> Flight & Schedule Info
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Departure Date</span>
                            <span className="text-sm font-extrabold text-slate-800">{parseSimbriefDate(importedData.raw?.general, importedData.raw?.times).date}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Off Blocks (UTC)</span>
                            <span className="text-sm font-extrabold text-indigo-600">{parseSimbriefDate(importedData.raw?.general, importedData.raw?.times).time}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">On Blocks (UTC)</span>
                            <span className="text-sm font-extrabold text-emerald-600">{parseSimbriefArrival(importedData.raw?.general, importedData.raw?.times)}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Airframe</span>
                            <span className="text-sm font-extrabold text-slate-800">{importedData.raw?.aircraft?.reg || 'N/A'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Initial Alt</span>
                            <span className="text-sm font-extrabold text-slate-800">{formatAltitude(importedData.raw?.general?.initial_altitude)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Progress Bar / Time stats */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Estimated Air vs Block Time</span>
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-xs text-slate-400 block font-semibold">AIR TIME</span>
                                <span className="text-xl font-bold text-slate-800">{getAirTime(importedData.raw?.times)}</span>
                              </div>
                              <div className="text-slate-400 font-black text-xl">&rarr;</div>
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block font-semibold">BLOCK TIME</span>
                                <span className="text-xl font-bold text-indigo-600">{getBlockTime(importedData.raw?.times)}</span>
                              </div>
                            </div>
                            {/* Visual bar */}
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-100">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>

                          {/* Route Stats */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Route Metrics</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <span className="text-xs text-slate-400 block font-semibold">GC Distance</span>
                                <span className="text-lg font-bold text-slate-800">{formatDistance(importedData.raw?.general?.gc_distance)}</span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400 block font-semibold">Route Distance</span>
                                <span className="text-lg font-bold text-slate-800">{formatDistance(importedData.raw?.general?.route_distance)}</span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400 block font-semibold">Air Distance</span>
                                <span className="text-lg font-bold text-slate-800">{formatDistance(importedData.raw?.general?.air_distance)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Weather & Atmospheric Stats */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-indigo-500 shrink-0" /> Atmospheric & Cruise Wind Conditions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Average Wind</span>
                            <span className="text-lg font-extrabold text-slate-800 mt-2">{getAvgWind(importedData.raw?.general)}</span>
                            <span className="text-[9px] text-slate-400 mt-1">Direct average enroute wind</span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Wind Component</span>
                            <span className={`text-lg font-extrabold mt-2 ${String(importedData.raw?.general?.avg_wind_comp || '').startsWith('P') || Number(importedData.raw?.general?.avg_wind_comp || 0) > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {formatWindComp(importedData.raw?.general?.avg_wind_comp)}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1">Head/Tail component</span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">OAT (ISA DEV)</span>
                            <span className="text-lg font-extrabold text-indigo-600 mt-2">
                              {formatOatAndIsaDev(
                                calculateOat(importedData.raw?.general?.initial_altitude, importedData.raw?.general?.avg_temp_dev),
                                importedData.raw?.general?.avg_temp_dev
                              )}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1">Calculated OAT & ISA deviation</span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Tropopause</span>
                            <span className="text-lg font-extrabold text-indigo-600 mt-2">
                              {formatTropopause(importedData.raw?.general?.avg_tropopause)}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1">Average tropopause altitude</span>
                          </div>
                        </div>
                      </div>

                      {/* Dispatch & Planning (Horizontal Layout) */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-indigo-500 shrink-0" /> Dispatch & Planning
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">AIRAC Cycle</span>
                            <span className="text-sm font-extrabold text-slate-800 mt-1">
                              {importedData.raw?.params?.airac || importedData.raw?.general?.airac || 'N/A'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">OFP Layout</span>
                            <span className="text-sm font-extrabold text-slate-800 mt-1">
                              {importedData.raw?.params?.ofp_layout || importedData.raw?.general?.ofp_layout || 'N/A'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Cruise Profile</span>
                            <span className="text-sm font-extrabold text-slate-800 mt-1">
                              {importedData.raw?.general?.cruise_profile || 'N/A'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Release Number</span>
                            <span className="text-sm font-extrabold text-slate-800 mt-1">
                              {importedData.raw?.params?.release || importedData.raw?.general?.release || importedData.raw?.general?.release_number || 'N/A'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Units</span>
                            <span className="text-sm font-extrabold text-indigo-600 mt-1">
                              {(importedData.raw?.params?.units || 'KGS').toUpperCase()}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Navlog Included</span>
                            <span className={`text-sm font-extrabold mt-1 ${importedData.raw?.params?.navlog === '1' || importedData.raw?.params?.navlog === true || importedData.raw?.navlog ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}`}>
                              {importedData.raw?.params?.navlog === '1' || importedData.raw?.params?.navlog === true || importedData.raw?.navlog ? 'YES' : 'NO'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">ETOPS Planning</span>
                            <span className={`text-sm font-extrabold mt-1 ${importedData.raw?.params?.etops === '1' || importedData.raw?.params?.etops === true ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}`}>
                              {importedData.raw?.params?.etops === '1' || importedData.raw?.params?.etops === true ? 'YES' : 'NO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ofp' && (
                <div className="space-y-4 font-mono text-xs flex flex-col flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-800/20 pb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-2">
                        📋 Operational Flight Plan (OFP)
                      </h3>
                      <p className="text-slate-500 text-[10px] font-sans">Interactive view of the official OFP generated by SimBrief.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Filter lines..."
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-sans outline-none focus:border-indigo-500 w-48 shadow-sm"
                        value={ofpFilter}
                        onChange={(e) => setOfpFilter(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(importedData.raw?.text?.plan_out || '');
                        }}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-semibold transition-all shadow-sm flex items-center justify-center cursor-pointer"
                      >
                        Copy All
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-700 custom-scrollbar [&_img]:max-w-full [&_img]:h-auto">
                    {getOfpText(importedData.raw) ? (
                      getOfpText(importedData.raw)
                        .split('\n')
                        .map((line: string, index: number) => {
                          if (ofpFilter && !line.toLowerCase().includes(ofpFilter.toLowerCase())) {
                            return null;
                          }

                          let lineClass = "py-0.5 px-1 hover:bg-slate-200/60 rounded transition-colors whitespace-pre ";

                          if (line.startsWith('(') || line.includes('ATC FPL') || line.includes('FLIGHT PLAN')) {
                            lineClass += "text-blue-600 font-bold ";
                          } else if (line.includes('FUEL') || line.includes('TAKEOFF') || line.includes('LANDING') || line.includes('EST BURNOUT')) {
                            lineClass += "text-emerald-700 font-semibold ";
                          } else if (line.includes('CRZ') || line.includes('TOC') || line.includes('TOD') || line.includes('CLB')) {
                            lineClass += "text-amber-700 font-semibold ";
                          }

                          return (
                            <div
                              key={index}
                              className={lineClass}
                              dangerouslySetInnerHTML={{ __html: line }}
                            />
                          );
                        })
                    ) : (
                      <div className="text-center py-8 text-slate-500 font-mono">
                        NO OPERATIONAL FLIGHT PLAN (OFP) TEXT AVAILABLE.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6 font-sans">
                  {/* Weights Section */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-500 shrink-0" /> Operational Weights & Limits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* ZFW */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Zero Fuel Weight</span>
                          <span className="text-[10px] text-indigo-600 font-bold">MAX: {formatWeight(importedData.raw?.weights?.max_zfw).kgs}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-bold text-slate-800">{formatWeight(importedData.raw?.weights?.est_zfw).kgs}</span>
                          <span className="text-xs text-slate-500">/ {formatWeight(importedData.raw?.weights?.est_zfw).lbs}</span>
                        </div>
                        {/* ZFW progress bar */}
                        {Number(importedData.raw?.weights?.max_zfw) > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-100">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (Number(importedData.raw?.weights?.est_zfw) / Number(importedData.raw?.weights?.max_zfw)) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>0%</span>
                              <span>{Math.round((Number(importedData.raw?.weights?.est_zfw) / Number(importedData.raw?.weights?.max_zfw)) * 100)}% LIMIT</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* TOW */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Takeoff Weight</span>
                          <span className="text-[10px] text-emerald-600 font-bold">MAX: {formatWeight(importedData.raw?.weights?.max_tow).kgs}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-bold text-slate-800">{formatWeight(importedData.raw?.weights?.est_tow).kgs}</span>
                          <span className="text-xs text-slate-500">/ {formatWeight(importedData.raw?.weights?.est_tow).lbs}</span>
                        </div>
                        {/* TOW progress bar */}
                        {Number(importedData.raw?.weights?.max_tow) > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-100">
                              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, (Number(importedData.raw?.weights?.est_tow) / Number(importedData.raw?.weights?.max_tow)) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>0%</span>
                              <span>{Math.round((Number(importedData.raw?.weights?.est_tow) / Number(importedData.raw?.weights?.max_tow)) * 100)}% LIMIT</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* LDW */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Landing Weight</span>
                          <span className="text-[10px] text-blue-600 font-bold">MAX: {formatWeight(importedData.raw?.weights?.max_ldw).kgs}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-bold text-slate-800">{formatWeight(importedData.raw?.weights?.est_ldw).kgs}</span>
                          <span className="text-xs text-slate-500">/ {formatWeight(importedData.raw?.weights?.est_ldw).lbs}</span>
                        </div>
                        {/* LDW progress bar */}
                        {Number(importedData.raw?.weights?.max_ldw) > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-100">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, (Number(importedData.raw?.weights?.est_ldw) / Number(importedData.raw?.weights?.max_ldw)) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>0%</span>
                              <span>{Math.round((Number(importedData.raw?.weights?.est_ldw) / Number(importedData.raw?.weights?.max_ldw)) * 100)}% LIMIT</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payload, Cargo, Pax, Bags */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-slate-450 font-bold uppercase">Payload:</span>
                        <span className="text-slate-800 font-extrabold">{formatWeight(importedData.raw?.weights?.payload).kgs}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-slate-450 font-bold uppercase">Cargo:</span>
                        <span className="text-slate-800 font-extrabold">{formatWeight(importedData.raw?.weights?.cargo).kgs}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-slate-455 font-bold uppercase">Passengers:</span>
                        <span className="text-slate-800 font-extrabold">{importedData.raw?.weights?.pax_count || '0'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-slate-455 font-bold uppercase">Bag Count:</span>
                        <span className="text-slate-800 font-extrabold">{importedData.raw?.weights?.bag_count || '0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fuel Section */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-indigo-500 shrink-0" /> Fuel Planning & Allocation
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">TAXI FUEL</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.taxi).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.taxi).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">TRIP BURN</span>
                        <span className="text-emerald-600 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.enroute_burn).kgs}</span>
                        <span className="text-[10px] text-slate-450 block mt-0.5">{formatWeight(importedData.raw?.fuel?.enroute_burn).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">CONTINGENCY</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.contingency).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.contingency).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">ALTERNATE BURN</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">EXTRA FUEL</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.extra).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.extra).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">MIN TAKEOFF</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.min_takeoff || (Number(importedData.raw?.fuel?.plan_ramp || 0) - Number(importedData.raw?.fuel?.taxi || 0))).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.min_takeoff || (Number(importedData.raw?.fuel?.plan_ramp || 0) - Number(importedData.raw?.fuel?.taxi || 0))).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">PLAN TAKEOFF</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.plan_takeoff).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.plan_takeoff).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">PLAN LANDING</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.plan_landing).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.fuel?.plan_landing).lbs}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold font-sans">AVG FUEL FLOW</span>
                        <span className="text-slate-800 font-extrabold text-sm">{importedData.raw?.general?.avg_fuel_flow ? `${(Number(importedData.raw.general.avg_fuel_flow)).toLocaleString('en-US')} KGS/HR` : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-slate-455 block mb-1 uppercase font-bold">MAX TANKS CAP</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatWeight(importedData.raw?.aircraft?.max_fuel).kgs}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatWeight(importedData.raw?.aircraft?.max_fuel).lbs}</span>
                      </div>
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                        <span className="text-red-600 block mb-1 font-bold">FINAL RESERVE</span>
                        <span className="text-red-700 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.reserve).kgs}</span>
                        <span className="text-[10px] text-red-500/80 block mt-0.5">{formatWeight(importedData.raw?.fuel?.reserve).lbs}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl">
                        <span className="text-emerald-700 block mb-1 font-bold">RAMP / BLOCK</span>
                        <span className="text-emerald-800 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.plan_ramp).kgs}</span>
                        <span className="text-[10px] text-emerald-600/80 block mt-0.5">{formatWeight(importedData.raw?.fuel?.plan_ramp).lbs}</span>
                      </div>
                    </div>

                    {/* Fuel bar segments */}
                    {(() => {
                      const totalRamp = Number(importedData.raw?.fuel?.plan_ramp || 0);
                      if (totalRamp <= 0) return null;

                      const allocationData = [{
                        name: 'Fuel',
                        'Trip Burn': Number(importedData.raw?.fuel?.enroute_burn || 0),
                        'Reserve': Number(importedData.raw?.fuel?.reserve || 0),
                        'Taxi': Number(importedData.raw?.fuel?.taxi || 0),
                        'Contingency': Number(importedData.raw?.fuel?.contingency || 0),
                        'Alternate': Number(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate || 0),
                        'Extra': Number(importedData.raw?.fuel?.extra || 0),
                      }];

                      return (
                        <div className="space-y-3">
                          <div className="w-full h-3 relative bg-slate-50 border border-slate-200/60 rounded-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={allocationData}
                                layout="vertical"
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                              >
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" hide />
                                <Tooltip
                                  position={{ y: -140 }}
                                  isAnimationActive={false}
                                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      const items = [
                                        { label: 'Trip Burn', value: data['Trip Burn'], color: '#047857' },
                                        { label: 'Reserve', value: data['Reserve'], color: '#10b981' },
                                        { label: 'Taxi', value: data['Taxi'], color: '#34d399' },
                                        { label: 'Contingency', value: data['Contingency'], color: '#0d9488' },
                                        { label: 'Alternate', value: data['Alternate'], color: '#d97706' },
                                        { label: 'Extra', value: data['Extra'], color: '#2563eb' }
                                      ];
                                      return (
                                        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-4 text-xs font-sans space-y-2.5 min-w-[200px] border-collapse z-50">
                                          <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 flex justify-between">
                                            <span>Ramp Fuel</span>
                                            <span className="text-emerald-700">{totalRamp.toLocaleString('en-US')} kg</span>
                                          </div>
                                          <div className="space-y-1.5 font-mono text-[10px]">
                                            {items.map((item, idx) => {
                                              if (item.value <= 0) return null;
                                              const pct = Math.round((item.value / totalRamp) * 100);
                                              return (
                                                <div key={idx} className="flex justify-between items-center gap-4 text-slate-500">
                                                  <span className="flex items-center font-sans font-semibold">
                                                    <span className="inline-block w-2 h-2 rounded-sm mr-1.5 shrink-0" style={{ backgroundColor: item.color }}></span>
                                                    {item.label}
                                                  </span>
                                                  <span className="font-bold text-slate-700 text-right">
                                                    {item.value.toLocaleString('en-US')} kg ({pct}%)
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="Trip Burn" stackId="a" fill="#047857" radius={[4, 0, 0, 4]} />
                                <Bar dataKey="Reserve" stackId="a" fill="#10b981" />
                                <Bar dataKey="Taxi" stackId="a" fill="#34d399" />
                                <Bar dataKey="Contingency" stackId="a" fill="#0d9488" />
                                <Bar dataKey="Alternate" stackId="a" fill="#d97706" />
                                <Bar dataKey="Extra" stackId="a" fill="#2563eb" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="flex flex-wrap justify-between text-[9px] text-slate-500 gap-y-2 gap-x-4 border-t border-slate-100 pt-3">
                            <span className="flex items-center font-bold">
                              <span className="inline-block w-2 h-2 rounded-sm bg-[#047857] mr-1.5 shrink-0"></span>
                              TRIP BURN ({Math.round((allocationData[0]['Trip Burn'] / totalRamp) * 100)}%)
                            </span>
                            <span className="flex items-center font-bold">
                              <span className="inline-block w-2 h-2 rounded-sm bg-[#10b981] mr-1.5 shrink-0"></span>
                              RESERVE ({Math.round((allocationData[0]['Reserve'] / totalRamp) * 100)}%)
                            </span>
                            <span className="flex items-center font-bold">
                              <span className="inline-block w-2 h-2 rounded-sm bg-[#34d399] mr-1.5 shrink-0"></span>
                              TAXI ({Math.round((allocationData[0]['Taxi'] / totalRamp) * 100)}%)
                            </span>
                            <span className="flex items-center font-bold">
                              <span className="inline-block w-2 h-2 rounded-sm bg-[#0d9488] mr-1.5 shrink-0"></span>
                              CONTINGENCY ({Math.round((allocationData[0]['Contingency'] / totalRamp) * 100)}%)
                            </span>
                            <span className="flex items-center font-bold">
                              <span className="inline-block w-2 h-2 rounded-sm bg-[#d97706] mr-1.5 shrink-0"></span>
                              ALTERNATE ({Math.round((allocationData[0]['Alternate'] / totalRamp) * 100)}%)
                            </span>
                            <span className="flex items-center font-bold">
                              <span className="inline-block w-2 h-2 rounded-sm bg-[#2563eb] mr-1.5 shrink-0"></span>
                              EXTRA ({Math.round((allocationData[0]['Extra'] / totalRamp) * 100)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'flight' && (
                <div className="space-y-6 font-sans text-xs">
                  {/* Aerodromes stack (Full Width) */}
                  <div className="space-y-6 font-sans text-xs">
                    {/* Origem */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 rounded border border-indigo-200">DEP</span>
                          <h3 className="text-lg font-black text-slate-800 flex items-baseline gap-2">
                            <span>{importedData.raw?.origin?.icao_code || 'N/A'} {importedData.raw?.origin?.iata_code ? `/ ${importedData.raw.origin.iata_code}` : ''}</span>
                            <span className="text-xs text-slate-400 font-medium font-sans">&mdash; {importedData.raw?.origin?.name || 'N/A'}</span>
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-sans text-slate-500">
                          <div>ELEV <span className="font-bold text-slate-700">{importedData.raw?.origin?.elevation ? `${Number(importedData.raw.origin.elevation).toLocaleString('en-US')} FT` : 'N/A'}</span></div>
                          <div>RWY <span className="font-bold text-indigo-600">{importedData.raw?.origin?.plan_rwy || 'N/A'}</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-1 text-xs">
                        {/* Vento */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                            Wind
                          </span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseWindFromMetar(importedData.raw?.origin?.metar)}</span>
                        </div>

                        {/* Visibilidade */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                            Visibility
                          </span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseVisFromMetar(importedData.raw?.origin?.metar)}</span>
                        </div>

                        {/* Teto */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                            Ceiling
                          </span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseCeilingFromMetar(importedData.raw?.origin?.metar)}</span>
                        </div>

                        {/* Temperatura */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold">Temperature</span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseTempFromMetar(importedData.raw?.origin?.metar)}</span>
                        </div>

                        {/* Ponto de Orvalho */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold">Dew Point</span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseDewPointFromMetar(importedData.raw?.origin?.metar)}</span>
                        </div>

                        {/* QNH */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold">QNH</span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseQnhFromMetar(importedData.raw?.origin?.metar)}</span>
                        </div>
                      </div>

                      {(importedData.raw?.origin?.metar || importedData.raw?.origin?.taf) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {importedData.raw?.origin?.metar && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">METAR</span>
                              <p className="text-xs text-slate-700 font-mono leading-relaxed select-all whitespace-pre-wrap">{importedData.raw.origin.metar}</p>
                            </div>
                          )}
                          {importedData.raw?.origin?.taf && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">TAF</span>
                              <p className="text-xs text-slate-700 font-mono leading-relaxed select-all whitespace-pre-wrap">{importedData.raw.origin.taf}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Destino */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 rounded border border-emerald-250">ARR</span>
                          <h3 className="text-lg font-black text-slate-800 flex items-baseline gap-2">
                            <span>{importedData.raw?.destination?.icao_code || 'N/A'} {importedData.raw?.destination?.iata_code ? `/ ${importedData.raw.destination.iata_code}` : ''}</span>
                            <span className="text-xs text-slate-400 font-medium font-sans">&mdash; {importedData.raw?.destination?.name || 'N/A'}</span>
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-sans text-slate-500">
                          <div>ELEV <span className="font-bold text-slate-700">{importedData.raw?.destination?.elevation ? `${Number(importedData.raw.destination.elevation).toLocaleString('en-US')} FT` : 'N/A'}</span></div>
                          <div>RWY <span className="font-bold text-indigo-600">{importedData.raw?.destination?.plan_rwy || 'N/A'}</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-1 text-xs">
                        {/* Vento */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                            Wind
                          </span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseWindFromMetar(importedData.raw?.destination?.metar)}</span>
                        </div>

                        {/* Visibilidade */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                            Visibility
                          </span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseVisFromMetar(importedData.raw?.destination?.metar)}</span>
                        </div>

                        {/* Teto */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                            Ceiling
                          </span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseCeilingFromMetar(importedData.raw?.destination?.metar)}</span>
                        </div>

                        {/* Temperatura */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold">Temperature</span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseTempFromMetar(importedData.raw?.destination?.metar)}</span>
                        </div>

                        {/* Ponto de Orvalho */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold">Dew Point</span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseDewPointFromMetar(importedData.raw?.destination?.metar)}</span>
                        </div>

                        {/* QNH */}
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-slate-500 block text-[9px] uppercase font-extrabold">QNH</span>
                          <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseQnhFromMetar(importedData.raw?.destination?.metar)}</span>
                        </div>
                      </div>

                      {(importedData.raw?.destination?.metar || importedData.raw?.destination?.taf) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {importedData.raw?.destination?.metar && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">METAR</span>
                              <p className="text-xs text-slate-700 font-mono leading-relaxed select-all whitespace-pre-wrap">{importedData.raw.destination.metar}</p>
                            </div>
                          )}
                          {importedData.raw?.destination?.taf && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">TAF</span>
                              <p className="text-xs text-slate-700 font-mono leading-relaxed select-all whitespace-pre-wrap">{importedData.raw.destination.taf}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Alternados */}
                    {(() => {
                      const alternatesList = Array.isArray(importedData.raw?.alternate)
                        ? importedData.raw.alternate
                        : importedData.raw?.alternate
                          ? [importedData.raw.alternate]
                          : [];

                      return alternatesList.map((alt: any, idx: number) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                                ALTN {idx + 1}
                              </span>
                              <h3 className="text-lg font-black text-slate-800 flex items-baseline gap-2">
                                <span>{alt.icao_code || 'N/A'} {alt.iata_code ? `/ ${alt.iata_code}` : ''}</span>
                                <span className="text-xs text-slate-400 font-medium font-sans">&mdash; {alt.name || 'N/A'}</span>
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-sans text-slate-500">
                              <div>ELEV <span className="font-bold text-slate-700">{alt.elevation ? `${Number(alt.elevation).toLocaleString('en-US')} FT` : 'N/A'}</span></div>
                              <div>RWY <span className="font-bold text-amber-600">{alt.plan_rwy || 'N/A'}</span></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-1 text-xs">
                            {/* Vento */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                                Wind
                              </span>
                              <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseWindFromMetar(alt.metar)}</span>
                            </div>

                            {/* Visibilidade */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                                Visibility
                              </span>
                              <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseVisFromMetar(alt.metar)}</span>
                            </div>

                            {/* Teto */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-500 block text-[9px] uppercase font-extrabold flex items-center">
                                Ceiling
                              </span>
                              <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseCeilingFromMetar(alt.metar)}</span>
                            </div>

                            {/* Temperatura */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-500 block text-[9px] uppercase font-extrabold">Temperature</span>
                              <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseTempFromMetar(alt.metar)}</span>
                            </div>

                            {/* Ponto de Orvalho */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-500 block text-[9px] uppercase font-extrabold">Dew Point</span>
                              <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseDewPointFromMetar(alt.metar)}</span>
                            </div>

                            {/* QNH */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-500 block text-[9px] uppercase font-extrabold">QNH</span>
                              <span className="text-slate-800 font-extrabold block mt-0.5 text-sm">{parseQnhFromMetar(alt.metar)}</span>
                            </div>
                          </div>

                          {(alt.metar || alt.taf) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              {alt.metar && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                  <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">METAR</span>
                                  <p className="text-xs text-slate-700 font-mono leading-relaxed select-all whitespace-pre-wrap">{alt.metar}</p>
                                </div>
                              )}
                              {alt.taf && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                  <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">TAF</span>
                                  <p className="text-xs text-slate-700 font-mono leading-relaxed select-all whitespace-pre-wrap">{alt.taf}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'route' && (
                <div className="space-y-6 font-sans text-xs">
                  {/* ICAO Flight Plan */}
                  {(() => {
                    const icaoFpl = findIcaoFpl(importedData.raw);
                    if (!icaoFpl) return null;
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <span className="text-slate-500 block mb-1 text-[10px] font-bold uppercase tracking-wider">ICAO Flight Plan</span>
                        <pre className="text-slate-855 text-sm leading-relaxed font-mono whitespace-pre-wrap mt-1 select-all">{icaoFpl}</pre>
                      </div>
                    );
                  })()}

                  {/* Route text */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <span className="text-slate-500 block mb-1 text-[10px] font-bold uppercase tracking-wider">Full Flight Route</span>
                    <span className="text-slate-800 text-sm leading-relaxed font-semibold block mt-1">{importedData.raw?.general?.route || 'N/A'}</span>
                  </div>

                  {/* Chart of Fuel remaining */}
                  {importedData.raw && (
                    <FuelRemainingChart
                      fixes={getNavlogFixes(importedData.raw)}
                      alternateFixes={getAlternateNavlogFixes(importedData.raw)}
                      units={importedData.raw.params?.units || 'lbs'}
                      planRamp={Number(importedData.raw?.fuel?.plan_ramp || 0)}
                    />
                  )}

                  {/* Waypoints Table */}
                  {(() => {
                    const navlogFixes = getNavlogFixes(importedData.raw);
                    const alternateFixes = getAlternateNavlogFixes(importedData.raw);
                    const units = importedData.raw.params?.units || 'lbs';
                    return (
                      <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2 font-sans">🧭 Navlog Fixes (Wind Planning)</h4>
                          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-100 rounded-xl custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[10px] whitespace-nowrap">
                                  <th className="py-2.5 px-3">FIX</th>
                                  <th className="py-2.5 px-3">PHASE</th>
                                  <th className="py-2.5 px-3 text-right">ALTITUDE (FL)</th>
                                  <th className="py-2.5 px-3 text-right">HDG</th>
                                  <th className="py-2.5 px-3">AIRWAY</th>
                                  <th className="py-2.5 px-3 text-right">TAS</th>
                                  <th className="py-2.5 px-3 text-right">GS</th>
                                  <th className="py-2.5 px-3 text-right">MACH</th>
                                  <th className="py-2.5 px-3">WIND (DIR/SPD)</th>
                                  <th className="py-2.5 px-3">OAT</th>
                                  <th className="py-2.5 px-3 text-right">FUEL REM</th>
                                  <th className="py-2.5 px-3 text-right">FUEL USED</th>
                                  <th className="py-2.5 px-3 text-right">LEG TIME</th>
                                  <th className="py-2.5 px-3 text-right">TOTAL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {navlogFixes.map((fix: any, idx: number) => {
                                  const details = getFixDetails(fix, units);
                                  if (!details) return null;

                                  let badgeColor = "bg-slate-150 text-slate-700 border-slate-200";
                                  if (details.stage === 'CLIMB' || details.stage === 'CLB') {
                                    badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                                  } else if (details.stage === 'CRUISE' || details.stage === 'CRZ') {
                                    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                  } else if (details.stage === 'DESCENT' || details.stage === 'DSC' || details.stage === 'TOD') {
                                    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                                  }

                                  return (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 text-slate-700 whitespace-nowrap text-xs">
                                      <td className="py-2.5 px-3">
                                        {String(fix.ident).toUpperCase().includes('TOC') || String(fix.ident).toUpperCase().includes('TOD') ? (
                                          <span className="px-2 py-0.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-350 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
                                            <span className={String(fix.ident).toUpperCase().includes('TOC') ? "text-indigo-650 font-black text-[10px]" : "text-amber-600 font-black text-[10px]"}>
                                              {String(fix.ident).toUpperCase().includes('TOC') ? '▲' : '▼'}
                                            </span>
                                            <span>{fix.ident}</span>
                                          </span>
                                        ) : (
                                          <span className="font-extrabold text-indigo-650">{fix.ident}</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded border ${badgeColor}`}>
                                          {details.stage}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-semibold">FL{getFlightLevel(fix)}</td>
                                      <td className="py-2.5 px-3 text-right font-mono">{details.hdg}</td>
                                      <td className="py-2.5 px-3 font-mono">{details.airway}</td>
                                      <td className="py-2.5 px-3 text-right font-mono">{details.tas}</td>
                                      <td className="py-2.5 px-3 text-right font-mono">{details.gs}</td>
                                      <td className="py-2.5 px-3 text-right font-mono">{details.mach}</td>
                                      <td className="py-2.5 px-3 text-emerald-700 font-semibold font-mono">
                                        🡕 {details.wind}
                                      </td>
                                      <td className="py-2.5 px-3 text-amber-750 font-semibold font-mono">{details.oat}</td>
                                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{details.fuelRem.toLocaleString('en-US')} kg</td>
                                      <td className="py-2.5 px-3 text-right text-slate-500">{details.fuelUsed.toLocaleString('en-US')} kg</td>
                                      <td className="py-2.5 px-3 text-right font-mono">{details.legTime}</td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">{details.totalTime}</td>
                                    </tr>
                                  );
                                })}
                                {navlogFixes.length === 0 && (
                                  <tr>
                                    <td colSpan={14} className="text-center py-4 text-slate-400">No fixes loaded in the main navlog.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Alternate Waypoints Table */}
                        {alternateFixes.length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2 font-sans">🧭 Alternate Navlog Fixes</h4>
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl custom-scrollbar">
                              <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[10px] whitespace-nowrap">
                                    <th className="py-2.5 px-3">FIX</th>
                                    <th className="py-2.5 px-3">PHASE</th>
                                    <th className="py-2.5 px-3 text-right">ALTITUDE (FL)</th>
                                    <th className="py-2.5 px-3 text-right">HDG</th>
                                    <th className="py-2.5 px-3">AIRWAY</th>
                                    <th className="py-2.5 px-3 text-right">TAS</th>
                                    <th className="py-2.5 px-3 text-right">GS</th>
                                    <th className="py-2.5 px-3 text-right">MACH</th>
                                    <th className="py-2.5 px-3">WIND (DIR/SPD)</th>
                                    <th className="py-2.5 px-3">OAT</th>
                                    <th className="py-2.5 px-3 text-right">FUEL REM</th>
                                    <th className="py-2.5 px-3 text-right">FUEL USED</th>
                                    <th className="py-2.5 px-3 text-right">LEG TIME</th>
                                    <th className="py-2.5 px-3 text-right">TOTAL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {alternateFixes.map((fix: any, idx: number) => {
                                    const details = getFixDetails(fix, units);
                                    if (!details) return null;

                                    let badgeColor = "bg-slate-150 text-slate-700 border-slate-200";
                                    if (details.stage === 'CLIMB' || details.stage === 'CLB') {
                                      badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                                    } else if (details.stage === 'CRUISE' || details.stage === 'CRZ') {
                                      badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                    } else if (details.stage === 'DESCENT' || details.stage === 'DSC' || details.stage === 'TOD') {
                                      badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                                    }

                                    return (
                                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 text-slate-700 whitespace-nowrap text-xs">
                                        <td className="py-2.5 px-3">
                                          {String(fix.ident).toUpperCase().includes('TOC') || String(fix.ident).toUpperCase().includes('TOD') ? (
                                            <span className="px-2 py-0.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-350 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
                                              <span className={String(fix.ident).toUpperCase().includes('TOC') ? "text-indigo-650 font-black text-[10px]" : "text-amber-600 font-black text-[10px]"}>
                                                {String(fix.ident).toUpperCase().includes('TOC') ? '▲' : '▼'}
                                              </span>
                                              <span>{fix.ident}</span>
                                            </span>
                                          ) : (
                                            <span className="font-extrabold text-indigo-650">{fix.ident}</span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded border ${badgeColor}`}>
                                            {details.stage}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-semibold">FL{getFlightLevel(fix)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{details.hdg}</td>
                                        <td className="py-2.5 px-3 font-mono">{details.airway}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{details.tas}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{details.gs}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{details.mach}</td>
                                        <td className="py-2.5 px-3 text-emerald-700 font-semibold font-mono">
                                          🡕 {details.wind}
                                        </td>
                                        <td className="py-2.5 px-3 text-amber-750 font-semibold font-mono">{details.oat}</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{details.fuelRem.toLocaleString('en-US')} kg</td>
                                        <td className="py-2.5 px-3 text-right text-slate-500">{details.fuelUsed.toLocaleString('en-US')} kg</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{details.legTime}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">{details.totalTime}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'map' && (
                <RouteMap
                  fixes={getNavlogFixes(importedData.raw)}
                  alternateFixes={getAlternateNavlogFixes(importedData.raw)}
                  units={importedData.raw?.params?.units || 'lbs'}
                />
              )}

              {activeTab === 'images' && (
                <div className="space-y-6 font-sans">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-2">
                      🖼️ Weather & Chart Maps (SimBrief)
                    </h3>
                    <p className="text-slate-500 text-[10px] font-sans">Flight dispatch, wind profiles, and vertical routing charts.</p>
                  </div>

                  {(() => {
                    const imgs = getSimbriefImages(importedData.raw);
                    if (imgs.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                          No dispatch map images available in the SimBrief data.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 gap-8">
                        {imgs.map((img: any, idx: number) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                                {img.type} {img.name ? `(${img.name})` : ''}
                              </span>
                              <a
                                href={img.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-semibold text-indigo-600 hover:underline"
                              >
                                Open Original ↗
                              </a>
                            </div>
                            <div className="p-4 bg-slate-100/30 flex justify-center items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.link}
                                alt={img.type || 'SimBrief Chart'}
                                className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="space-y-2 font-mono text-xs flex-1 flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold font-sans">RAW JSON QUERY CONTENT</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(importedData.raw, null, 2));
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-semibold transition-all shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-[400px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-700 custom-scrollbar select-text">
                    <pre className="whitespace-pre-wrap word-break-all text-slate-700">{JSON.stringify(importedData.raw, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider font-sans uppercase">
              <span>PILOT ID SYNC: {pilotId || importedData.raw?.general?.pilot_id || 'N/A'}</span>
              <span>LAST SYNC: {lastImportTime}</span>
            </div>
          </div>
        </section>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}
